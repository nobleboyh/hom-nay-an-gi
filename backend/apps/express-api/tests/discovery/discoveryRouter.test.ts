import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockRedis = vi.hoisted(() => ({
  get: vi.fn(),
  setex: vi.fn(),
}));

const mockShared = vi.hoisted(() => {
  class MockAppError extends Error {
    code: string;
    statusCode: number;
    userMessage: string;
    constructor(code: string, statusCode: number, userMessage: string) {
      super(userMessage);
      this.code = code;
      this.statusCode = statusCode;
      this.userMessage = userMessage;
      this.name = "AppError";
    }
  }

  class MockAuthenticationError extends MockAppError {
    constructor(message: string) {
      super("AUTH_TOKEN_EXPIRED", 401, message);
      this.name = "AuthenticationError";
    }
  }

  return {
    redis: mockRedis,
    logger: { warn: vi.fn(), error: vi.fn(), debug: vi.fn(), info: vi.fn() },
    env: {
      LLM_PROXY_URL: "http://localhost:3001",
      JWT_SECRET: "replace-with-a-long-secret",
      CORS_ORIGIN: "http://localhost:3000,http://127.0.0.1:3000",
      NODE_ENV: "test",
      PORT: 3000,
    },
    getLlmConfig: () => ({
      provider: "gemini",
      proxyUrl: "http://localhost:3001",
    }),
    authenticate: (
      req: {
        headers: Record<string, string>;
        user?: { userId: string; authProvider: string };
      },
      _res: unknown,
      next: (error?: unknown) => void,
    ) => {
      const userId = req.headers["x-user-id"];
      if (!userId) {
        next(new MockAuthenticationError("Authentication required"));
        return;
      }
      req.user = { userId, authProvider: "stub" };
      next();
    },
    asyncHandler: (fn: unknown) => fn,
    AppError: MockAppError,
    AuthenticationError: MockAuthenticationError,
    buildSuccessResponse: (data: unknown) => ({ success: true, data }),
    buildErrorResponse: (code: string, message: string) => ({
      success: false,
      error: { code, message },
    }),
    parseCorsOrigins: (origins: string) =>
      origins.split(",").map((s: string) => s.trim()),
    errorHandler: (
      err: Error & { statusCode?: number; code?: string },
      _req: unknown,
      res: { status: (c: number) => { json: (d: unknown) => void } },
      _next: unknown,
    ) => {
      const statusCode = err instanceof MockAppError ? err.statusCode : 500;
      const code = err instanceof MockAppError ? err.code : "INTERNAL_ERROR";
      const message =
        err instanceof MockAppError
          ? err.userMessage
          : (err.message ?? "Internal error");
      res.status(statusCode).json({ success: false, error: { code, message } });
    },
    notFoundHandler: (
      _req: unknown,
      res: { status: (c: number) => { json: (d: unknown) => void } },
    ) => {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Not found" },
      });
    },
    requestLogger: (_req: unknown, _res: unknown, next: () => void) => {
      next();
    },
    generalLimiter: (_req: unknown, _res: unknown, next: () => void) => {
      next();
    },
    llmLimiter: (_req: unknown, _res: unknown, next: () => void) => {
      next();
    },
    SearchParamsSchema: { parse: (data: unknown) => data },
    DishIdParamsSchema: { parse: (data: unknown) => data },
    SurpriseMeSchema: { parse: (data: unknown) => data },
    validate: (_schema: unknown) => (_req: unknown, _res: unknown, next: (err?: unknown) => void) => {
      next();
    },
  };
});

vi.mock("@hom-nay-an-gi/shared", () => mockShared);

vi.mock("../../src/services/index.js", () => ({
  searchNearby: vi.fn().mockResolvedValue([]),
}));

import request from "supertest";
import { buildApp } from "../../src/server.js";

describe("Discovery Router - Trending", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 502,
      json: vi.fn(),
      text: vi.fn(),
    } as unknown as Response);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("GET /api/v1/discovery/trending returns 200 with data", async () => {
    mockRedis.get.mockResolvedValue(null);

    const app = buildApp();
    const res = await request(app).get("/api/v1/discovery/trending");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("items");
    expect(res.body.data).toHaveProperty("total");
  });

  it("GET /api/v1/discovery/trending returns paginated results", async () => {
    mockRedis.get.mockResolvedValue(null);

    const app = buildApp();
    const res = await request(app).get(
      "/api/v1/discovery/trending?offset=0&limit=3",
    );

    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBeLessThanOrEqual(3);
  });

  it("GET /api/v1/discovery/trending with invalid params returns 400", async () => {
    const app = buildApp();
    const res = await request(app).get("/api/v1/discovery/trending?offset=-1");

    expect(res.status).toBe(400);
  });
});

describe("Discovery Router - Nearby", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("GET /api/v1/discovery/nearby with valid params returns 200", async () => {
    const app = buildApp();
    const res = await request(app).get(
      "/api/v1/discovery/nearby?lat=10.7626&lng=106.6601",
    );

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("GET /api/v1/discovery/nearby without lat/lng returns 400", async () => {
    const app = buildApp();
    const res = await request(app).get("/api/v1/discovery/nearby");

    expect(res.status).toBe(400);
  });
});

describe("Discovery Router - For You", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 502,
      json: vi.fn(),
      text: vi.fn(),
    } as unknown as Response);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("GET /api/v1/discovery/for-you with x-user-id header returns 200", async () => {
    mockRedis.get.mockResolvedValue(null);

    const app = buildApp();
    const res = await request(app)
      .get("/api/v1/discovery/for-you")
      .set("x-user-id", "test-user");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.source).toBe("trending");
  });

  it("GET /api/v1/discovery/for-you without auth header returns 401", async () => {
    const app = buildApp();
    const res = await request(app).get("/api/v1/discovery/for-you");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
