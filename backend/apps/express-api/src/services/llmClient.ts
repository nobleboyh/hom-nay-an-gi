import { env, logger } from "@hom-nay-an-gi/shared";

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

const LLM_PROXY_URL = env.LLM_PROXY_URL;

export async function complete<T>(
  systemPrompt: string,
  userPrompt: string,
  schema: { parse: (data: unknown) => T },
): Promise<LlmResult<T>> {
  try {
    const response = await fetch(`${LLM_PROXY_URL}/complete`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        prompt: { system: systemPrompt, user: userPrompt },
      }),
      signal: AbortSignal.timeout(120_000),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "unknown");
      logger.error(
        { status: response.status, body: errorBody },
        "LLM proxy returned error",
      );
      return {
        data: null,
        meta: {
          degraded: true,
          source: "seed",
          error: `LLM proxy returned status ${response.status}`,
        },
      };
    }

    const json = (await response.json()) as {
      success: boolean;
      data?: unknown;
      meta?: { degraded?: boolean; source?: string; provider?: string };
    };

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
