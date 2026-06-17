import type http from "node:http";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@hom-nay-an-gi/shared", () => ({
  buildSuccessResponse: (data: unknown) => ({
    success: true,
    data,
  }),
  buildErrorResponse: (code: string, message: string) => ({
    success: false,
    error: { code, message },
  }),
  logger: { warn: vi.fn(), error: vi.fn(), debug: vi.fn(), info: vi.fn() },
  env: { PORT: 3001 },
  getLlmConfig: () => ({
    provider: "gemini",
    proxyUrl: "http://localhost:3001",
  }),
}));

async function withServer(
  fn: (baseUrl: string) => Promise<void>,
): Promise<void> {
  const { createServer } = await import("../index.js");
  const server: http.Server = createServer();

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const addr = server.address();
  const baseUrl =
    typeof addr === "object" && addr
      ? `http://127.0.0.1:${addr.port}`
      : "http://127.0.0.1:0";

  try {
    await fn(baseUrl);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const realFetch = global.fetch.bind(global);

async function _geminiFetch(url: RequestInfo | URL, options?: RequestInit) {
  const response = await realFetch(url, options);
  const body = await response.clone().text();
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve(JSON.parse(body)),
    text: () => Promise.resolve(body),
  } as unknown as Response;
}

function mockGemini(
  geminiResponse: () => Promise<
    | { candidates: Array<{ content: { parts: Array<{ text: string }> } }> }
    | { ok: false; status: number; text: () => Promise<string> }
  >,
) {
  vi.spyOn(global, "fetch").mockImplementation(
    async (url: RequestInfo | URL, options?: RequestInit) => {
      if (typeof url === "string" && url.startsWith(GEMINI_URL)) {
        const data = await geminiResponse();
        if ("ok" in data && data.ok === false) {
          return {
            ok: false,
            status: data.status,
            text: data.text,
          } as unknown as Response;
        }
        return {
          ok: true,
          status: 200,
          json: () => Promise.resolve(data),
          text: () => Promise.resolve(JSON.stringify(data)),
        } as unknown as Response;
      }
      return realFetch(url, options);
    },
  );
}

describe("LLM Proxy - Generate endpoint", () => {
  beforeEach(() => {
    process.env.LLM_API_KEY = "test-api-key";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.LLM_API_KEY;
  });

  it("should return 200 with generated content for valid request", async () => {
    mockGemini(async () => ({
      candidates: [
        {
          content: {
            parts: [{ text: JSON.stringify([{ dishId: "1", name: "Pho" }]) }],
          },
        },
      ],
    }));

    await withServer(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/generate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          provider: "gemini",
          prompt: "Generate trending dishes",
          schema: {
            type: "array",
            items: {
              type: "object",
              properties: {
                dishId: { type: "string" },
                name: { type: "string" },
              },
            },
          },
        }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.content).toBeTruthy();
    });
  });

  it("should return 400 when prompt is missing", async () => {
    await withServer(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/generate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ provider: "gemini" }),
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  it("should return 400 for invalid JSON body", async () => {
    await withServer(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/generate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "not-json",
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  it("should return 502 when LLM_API_KEY is not configured", async () => {
    delete process.env.LLM_API_KEY;

    await withServer(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/generate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ provider: "gemini", prompt: "test" }),
      });

      expect(res.status).toBe(502);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("LLM_PROVIDER_ERROR");
    });
  });

  it("should return 200 on /health", async () => {
    await withServer(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/health`);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.status).toBe("ok");
    });
  });

  it("should return 404 for unknown routes", async () => {
    await withServer(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/unknown`);

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("NOT_FOUND");
    });
  });

  it("should return 502 when Gemini API returns error", async () => {
    mockGemini(async () => ({
      ok: false,
      status: 502,
      text: async () => "Bad Gateway",
    }));

    await withServer(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/generate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ provider: "gemini", prompt: "test" }),
      });

      expect(res.status).toBe(502);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("LLM_PROVIDER_ERROR");
    });
  });

  it("should return 502 when Gemini returns safety-blocked response (empty candidates)", async () => {
    mockGemini(async () => ({
      candidates: [],
    }));

    await withServer(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/generate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ provider: "gemini", prompt: "test" }),
      });

      expect(res.status).toBe(502);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("LLM_INVALID_RESPONSE");
    });
  });

  it("should return 400 for unsupported provider", async () => {
    await withServer(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/generate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ provider: "unsupported", prompt: "test" }),
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  it("should return 400 when body exceeds character limit", async () => {
    await withServer(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/generate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          provider: "gemini",
          prompt: "x".repeat(11_000),
        }),
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  it("should return 502 when Gemini request is aborted", async () => {
    mockGemini(async () => {
      throw new DOMException("The operation was aborted", "AbortError");
    });

    await withServer(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/generate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ provider: "gemini", prompt: "test" }),
      });

      expect(res.status).toBe(502);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("LLM_TIMEOUT");
    });
  });
});
