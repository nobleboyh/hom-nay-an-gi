import { env, logger } from "@hom-nay-an-gi/shared";
import type { ZodSchema } from "zod";

const TIMEOUT_MS = 120_000;
const RETRY_DELAY_MS = 2_000;
const CIRCUIT_BREAKER_THRESHOLD = 3;
const CIRCUIT_BREAKER_RESET_MS = 60_000;

interface ProviderAdapter {
  complete(
    systemPrompt: string,
    userPrompt: string,
    signal: AbortSignal,
  ): Promise<unknown>;
}

interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  open: boolean;
}

const providerCircuitBreakers: Record<string, CircuitBreakerState> = {};

function getCircuitBreaker(provider: string): CircuitBreakerState {
  const existing = providerCircuitBreakers[provider];
  if (existing !== undefined) {
    return existing;
  }

  const newState: CircuitBreakerState = {
    failures: 0,
    lastFailureTime: 0,
    open: false,
  };
  providerCircuitBreakers[provider] = newState;
  return newState;
}

function isCircuitOpen(provider: string): boolean {
  const state = getCircuitBreaker(provider);
  if (!state.open) return false;

  const elapsed = Date.now() - state.lastFailureTime;
  if (elapsed >= CIRCUIT_BREAKER_RESET_MS) {
    state.open = false;
    state.failures = 0;
    return false;
  }

  return true;
}

function recordFailure(provider: string): void {
  const state = getCircuitBreaker(provider);
  state.failures++;
  state.lastFailureTime = Date.now();

  if (state.failures >= CIRCUIT_BREAKER_THRESHOLD) {
    state.open = true;
  }
}

function recordSuccess(provider: string): void {
  const state = getCircuitBreaker(provider);
  state.failures = 0;
  state.open = false;
}

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

function createGeminiAdapter(apiKey: string): ProviderAdapter {
  return {
    async complete(
      systemPrompt: string,
      userPrompt: string,
      signal: AbortSignal,
    ): Promise<unknown> {
      const url = `${GEMINI_API_BASE}/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        signal,
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.3,
          },
        }),
      });

      if (!response.ok) {
        throw new ProviderError(
          `Gemini API error: ${response.status}`,
          response.status,
        );
      }

      const data = (await response.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";

      return JSON.parse(text) as Record<string, unknown>;
    },
  };
}

const OPENAI_API_BASE = "https://api.openai.com/v1";

function createOpenAiCompatibleAdapter(
  apiKey: string,
  baseUrl: string,
  model: string,
  providerLabel: string,
  responseFormat: { type: "json_object" } | undefined,
): ProviderAdapter {
  return {
    async complete(
      systemPrompt: string,
      userPrompt: string,
      signal: AbortSignal,
    ): Promise<unknown> {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`,
        },
        signal,
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.3,
          ...(responseFormat ? { response_format: responseFormat } : {}),
        }),
      });

      if (!response.ok) {
        throw new ProviderError(
          `${providerLabel} API error: ${response.status}`,
          response.status,
        );
      }

      const data = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
      };

      const text = data.choices?.[0]?.message?.content ?? "{}";

      return JSON.parse(text) as Record<string, unknown>;
    },
  };
}

function createOpenAiAdapter(apiKey: string): ProviderAdapter {
  return createOpenAiCompatibleAdapter(
    apiKey,
    OPENAI_API_BASE,
    "gpt-4o-mini",
    "OpenAI",
    { type: "json_object" },
  );
}

const DEEPSEEK_API_BASE = "https://api.deepseek.com/v1";
const DEEPSEEK_MODEL = "deepseek-chat";

function createDeepSeekAdapter(apiKey: string): ProviderAdapter {
  return createOpenAiCompatibleAdapter(
    apiKey,
    DEEPSEEK_API_BASE,
    DEEPSEEK_MODEL,
    "DeepSeek",
    undefined,
  );
}

const ANTHROPIC_API_BASE = "https://api.anthropic.com/v1";

function createAnthropicAdapter(apiKey: string): ProviderAdapter {
  return {
    async complete(
      systemPrompt: string,
      userPrompt: string,
      signal: AbortSignal,
    ): Promise<unknown> {
      const response = await fetch(`${ANTHROPIC_API_BASE}/messages`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        signal,
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
          max_tokens: 4096,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new ProviderError(
          `Anthropic API error: ${response.status}`,
          response.status,
        );
      }

      const data = (await response.json()) as {
        content?: { text?: string }[];
      };

      const text = data.content?.[0]?.text ?? "{}";

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      return JSON.parse(jsonMatch?.[0] ?? "{}") as Record<string, unknown>;
    },
  };
}

const OLLAMA_BASE_URL = env.OLLAMA_BASE_URL;
const OLLAMA_MODEL = env.OLLAMA_MODEL;

function createOllamaAdapter(): ProviderAdapter {
  return {
    async complete(
      systemPrompt: string,
      userPrompt: string,
      signal: AbortSignal,
    ): Promise<unknown> {
      const response = await fetch(`${OLLAMA_BASE_URL}/v1/chat/completions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        signal,
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.3,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new ProviderError(
          `Ollama API error: ${response.status}`,
          response.status,
        );
      }

      const data = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
      };

      const text = data.choices?.[0]?.message?.content ?? "{}";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      return JSON.parse(jsonMatch?.[0] ?? "{}") as Record<string, unknown>;
    },
  };
}

export class ProviderError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "ProviderError";
    this.statusCode = statusCode;
  }
}

function createProvider(providerName: string, apiKey: string): ProviderAdapter {
  switch (providerName) {
    case "gemini": {
      return createGeminiAdapter(apiKey);
    }
    case "openai": {
      return createOpenAiAdapter(apiKey);
    }
    case "deepseek": {
      return createDeepSeekAdapter(apiKey);
    }
    case "anthropic": {
      return createAnthropicAdapter(apiKey);
    }
    case "ollama": {
      return createOllamaAdapter();
    }
    default: {
      throw new Error(`Unknown LLM provider: ${providerName}`);
    }
  }
}

export interface LlmCompletionOptions {
  provider?: string;
  apiKey?: string;
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function complete<T>(
  systemPrompt: string,
  userPrompt: string,
  schema: ZodSchema<T>,
  options: LlmCompletionOptions = {},
): Promise<{
  data: T | null;
  meta: { degraded: boolean; source: "llm" | "seed"; provider?: string };
}> {
  const provider = options.provider ?? "gemini";
  const apiKey = options.apiKey ?? "";

  const primaryResult = await tryProvider(
    provider,
    apiKey,
    systemPrompt,
    userPrompt,
    schema,
  );

  if (primaryResult.success) {
    return {
      data: primaryResult.data,
      meta: { degraded: false, source: "llm", provider },
    };
  }

  logger.error(
    { err: primaryResult.error, provider },
    "LLM provider call failed",
  );

  return {
    data: null,
    meta: { degraded: true, source: "seed" },
  };
}

interface TrySuccess<T> {
  success: true;
  data: T;
}

interface TryFailure {
  success: false;
  error?: string;
  timedOut?: boolean;
}

type TryResult<T> = TrySuccess<T> | TryFailure;

async function tryProvider<T>(
  providerName: string,
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  schema: ZodSchema<T>,
): Promise<TryResult<T>> {
  if (isCircuitOpen(providerName)) {
    return { success: false };
  }

  if (apiKey.length === 0 && providerName !== "ollama") {
    return { success: false, error: "No API key configured" };
  }

  const adapter = createProvider(providerName, apiKey);

  const firstAttempt = await attemptCall(
    adapter,
    systemPrompt,
    userPrompt,
    schema,
    null,
  );

  if (firstAttempt.success) {
    recordSuccess(providerName);
    return firstAttempt;
  }

  if (
    firstAttempt.error?.includes("Zod") ||
    firstAttempt.error?.includes("validation")
  ) {
    const secondAttempt = await attemptCall(
      adapter,
      systemPrompt,
      userPrompt,
      schema,
      firstAttempt.error,
    );

    if (secondAttempt.success) {
      recordSuccess(providerName);
      return secondAttempt;
    }
  } else if (firstAttempt.timedOut) {
    await delay(RETRY_DELAY_MS);

    const retryAttempt = await attemptCall(
      adapter,
      systemPrompt,
      userPrompt,
      schema,
      null,
    );

    if (retryAttempt.success) {
      recordSuccess(providerName);
      return retryAttempt;
    }
  }

  recordFailure(providerName);
  return { success: false };
}

async function attemptCall<T>(
  adapter: ProviderAdapter,
  systemPrompt: string,
  userPrompt: string,
  schema: ZodSchema<T>,
  validationError: string | null,
): Promise<TryResult<T>> {
  let fullUserPrompt = userPrompt;

  if (validationError !== null) {
    fullUserPrompt += `\n\nPrevious attempt failed with validation error. Please fix: ${validationError}`;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let raw: unknown;
    try {
      raw = await adapter.complete(
        systemPrompt,
        fullUserPrompt,
        controller.signal,
      );
    } finally {
      clearTimeout(timeoutId);
    }

    const data = schema.parse(raw);

    return { success: true, data };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { success: false, timedOut: true, error: "Request timed out" };
    }

    if (
      error !== null &&
      error !== undefined &&
      typeof error === "object" &&
      "issues" in error
    ) {
      return {
        success: false,
        error: `Zod validation error: ${String(error)}`,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
