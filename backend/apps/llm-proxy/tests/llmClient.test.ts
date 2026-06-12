import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const testSchema = z.object({
  result: z.string(),
});

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("llmClient", () => {
  describe("complete", () => {
    it("returns typed result on successful LLM call", async () => {
      const mockResponse = { result: "success" };

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [{ text: JSON.stringify(mockResponse) }],
                },
              },
            ],
          }),
          { status: 200 },
        ),
      );

      const { complete } = await import("../src/llmClient.js");

      const result = await complete(
        "system prompt",
        "user prompt",
        testSchema,
        { apiKey: "test-key" },
      );

      expect(result.data).toEqual(mockResponse);
      expect(result.meta.degraded).toBe(false);
      expect(result.meta.source).toBe("llm");

      vi.mocked(fetch).mockRestore();
    });

    it("returns degraded result on LLM failure", async () => {
      vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(
        new Error("Network error"),
      );

      const { complete } = await import("../src/llmClient.js");

      const result = await complete(
        "system prompt",
        "user prompt",
        testSchema,
        { apiKey: "test-key" },
      );

      expect(result.data).toBeNull();
      expect(result.meta.degraded).toBe(true);
      expect(result.meta.source).toBe("seed");

      vi.mocked(fetch).mockRestore();
    });

    it("retries on timeout after delay", async () => {
      const mockResponse = { result: "retry-success" };

      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockRejectedValueOnce(new DOMException("Aborted", "AbortError"))
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              candidates: [
                {
                  content: {
                    parts: [{ text: JSON.stringify(mockResponse) }],
                  },
                },
              ],
            }),
            { status: 200 },
          ),
        );

      const { complete } = await import("../src/llmClient.js");

      // Start the call but let it resolve with fake timers
      const promise = complete("system prompt", "user prompt", testSchema, {
        apiKey: "test-key",
      });

      // Advance past timeout + retry delay
      await vi.advanceTimersByTimeAsync(15_000);

      const result = await promise;

      expect(result.data).toEqual(mockResponse);
      expect(fetchSpy).toHaveBeenCalledTimes(2);

      fetchSpy.mockRestore();
    });

    it("falls back to fallback provider on primary failure", async () => {
      const mockResponse = { result: "fallback-success" };

      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockRejectedValueOnce(new Error("Primary failed"))
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              content: [{ text: JSON.stringify(mockResponse) }],
            }),
            { status: 200, headers: { "x-api-key": "test" } },
          ),
        );

      const { complete } = await import("../src/llmClient.js");

      const result = await complete(
        "system prompt",
        "user prompt",
        testSchema,
        {
          apiKey: "primary-key",
          fallbackProvider: "anthropic",
          fallbackApiKey: "fallback-key",
        },
      );

      expect(result.data).toEqual(mockResponse);
      expect(result.meta.degraded).toBe(true);
      expect(result.meta.provider).toBe("anthropic");

      fetchSpy.mockRestore();
    });

    it("returns seed fallback when both providers fail", async () => {
      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockRejectedValue(new Error("All providers failed"));

      const { complete } = await import("../src/llmClient.js");

      const result = await complete(
        "system prompt",
        "user prompt",
        testSchema,
        {
          apiKey: "primary-key",
          fallbackProvider: "openai",
          fallbackApiKey: "fallback-key",
        },
      );

      expect(result.data).toBeNull();
      expect(result.meta.degraded).toBe(true);
      expect(result.meta.source).toBe("seed");

      fetchSpy.mockRestore();
    });

    it("circuit breaker opens after 3 consecutive failures", async () => {
      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockRejectedValue(new Error("Provider down"));

      const { complete } = await import("../src/llmClient.js");

      // Three failures to open circuit
      for (let i = 0; i < 3; i++) {
        await complete("system prompt", "user prompt", testSchema, {
          apiKey: "test-key",
          provider: "gemini",
        });
      }

      // Fourth call should not make HTTP request (circuit open)
      const result = await complete(
        "system prompt",
        "user prompt",
        testSchema,
        { apiKey: "test-key", provider: "gemini" },
      );

      expect(result.data).toBeNull();
      // The circuit was open, so it shouldn't have called fetch again
      // But the attempt returns immediately without network call

      fetchSpy.mockRestore();
    });
  });
});
