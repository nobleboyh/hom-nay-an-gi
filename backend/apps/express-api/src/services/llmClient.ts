import { env, getLlmConfig, LLMError, logger } from "@hom-nay-an-gi/shared";

export interface LlmErrorMeta {
  degraded: boolean;
  source: "llm" | "seed";
  provider?: string;
  error?: string;
}

interface LlmResult<T> {
  data: T | null;
  meta: LlmErrorMeta;
}

interface StructuredGenerateResponse {
  success: boolean;
  data?: unknown;
  meta?: {
    degraded?: boolean;
    source?: string;
    provider?: string;
  };
  error?: {
    code?: string;
    message?: string;
  };
}

export class LlmProxyContractError extends Error {
  code = "LLM_PROXY_CONTRACT_MISMATCH" as const;
  statusCode: number;
  endpoint: string;

  constructor(endpoint: string, statusCode: number, message: string) {
    super(message);
    this.name = "LlmProxyContractError";
    this.statusCode = statusCode;
    this.endpoint = endpoint;
  }
}

const LLM_PROXY_URL = env.LLM_PROXY_URL;
const COMPLETE_ENDPOINT = "/complete";

function isContractMismatchStatus(statusCode: number) {
  return statusCode === 404 || statusCode === 405;
}

async function parseProxyJson(
  response: Response,
): Promise<StructuredGenerateResponse> {
  try {
    return (await response.json()) as StructuredGenerateResponse;
  } catch {
    throw new LLMError(
      "LLM_INVALID_RESPONSE",
      "LLM proxy returned non-JSON response",
    );
  }
}

function buildContractMismatchMessage(endpoint: string, statusCode: number) {
  return `LLM proxy contract mismatch at ${endpoint}: runtime returned ${statusCode}`;
}

function buildStructuredSystemPrompt(requestSchema: Record<string, unknown>) {
  const isArray = requestSchema.type === "array";
  return `You must respond with valid JSON matching this schema: ${JSON.stringify(requestSchema)}. Return ONLY the JSON ${isArray ? "array" : "object"}, no markdown, no explanation.`;
}

type ProxyCompletionPayload = {
  prompt: {
    system: string;
    user: string;
  };
  provider?: string;
};

async function requestProxyCompletion(
  payload: ProxyCompletionPayload,
  timeoutMs: number,
): Promise<StructuredGenerateResponse> {
  const response = await fetch(`${LLM_PROXY_URL}${COMPLETE_ENDPOINT}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    if (isContractMismatchStatus(response.status)) {
      throw new LlmProxyContractError(
        COMPLETE_ENDPOINT,
        response.status,
        buildContractMismatchMessage(COMPLETE_ENDPOINT, response.status),
      );
    }

    throw new LLMError(
      "LLM_PROVIDER_ERROR",
      `LLM proxy returned ${response.status}`,
    );
  }

  return parseProxyJson(response);
}

export async function generateStructured<T>(
  prompt: string,
  requestSchema: Record<string, unknown>,
  responseSchema: { parse: (data: unknown) => T },
  provider = getLlmConfig().provider,
): Promise<T> {
  const proxyBody = await requestProxyCompletion(
    {
      prompt: {
        system: buildStructuredSystemPrompt(requestSchema),
        user: prompt,
      },
      provider,
    },
    20_000,
  );

  if (!proxyBody.success || proxyBody.data === undefined) {
    throw new LLMError(
      "LLM_INVALID_RESPONSE",
      proxyBody.error?.message ?? "LLM proxy returned unsuccessful response",
    );
  }

  try {
    return responseSchema.parse(proxyBody.data);
  } catch (error) {
    throw new LLMError(
      "LLM_INVALID_RESPONSE",
      `LLM response failed schema validation: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export async function complete<T>(
  systemPrompt: string,
  userPrompt: string,
  schema: { parse: (data: unknown) => T },
): Promise<LlmResult<T>> {
  try {
    const json = await requestProxyCompletion(
      {
        prompt: { system: systemPrompt, user: userPrompt },
      },
      120_000,
    );

    if (!json.success || json.data === null || json.data === undefined) {
      logger.error({ json }, "LLM proxy returned unsuccessful response");
      return {
        data: null,
        meta: {
          degraded: true,
          source: "seed",
          error: "LLM proxy returned unsuccessful response",
        },
      };
    }

    const data = schema.parse(json.data);
    const meta: LlmResult<T>["meta"] = { degraded: false, source: "llm" };
    if (json.meta?.provider !== undefined) {
      meta.provider = json.meta.provider;
    }
    if (json.meta?.degraded === true) {
      meta.degraded = true;
    }
    return { data, meta };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error({ err: error }, "LLM proxy call failed");
    return {
      data: null,
      meta: { degraded: true, source: "seed", error: message },
    };
  }
}
