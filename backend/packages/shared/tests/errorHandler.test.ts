import { describe, expect, it } from "vitest";
import {
  AuthenticationError,
  type ErrorResponse,
  errorHandler,
  LLMError,
  NotFoundError,
  RateLimitError,
  ValidationError,
} from "../src/index.js";
import { createMockRequest, createMockResponse } from "./helpers.js";

function renderError(error: Error, requestId = "req-test") {
  const req = createMockRequest({ requestId });
  const res = createMockResponse();

  errorHandler(error, req, res, (() => {}) as never);

  return res;
}

function getBody(res: ReturnType<typeof renderError>): ErrorResponse {
  return res.body as ErrorResponse;
}

describe("errorHandler middleware", () => {
  it("maps NotFoundError to 404 with correct envelope", async () => {
    const res = renderError(new NotFoundError("Dish"));
    const body = getBody(res);

    expect(body.success).toBe(false);
    expect(body.error.code).toBe("NOT_FOUND");
    expect(body.error.message).toBe("Dish not found");
    expect(body.meta).toBeDefined();
    expect(body.meta.requestId).toBeDefined();
    expect(body.meta.timestamp).toBeDefined();
    expect(body.meta.version).toBeDefined();
  });

  it("maps NotFoundError without resource to generic message", async () => {
    const res = renderError(new NotFoundError());
    const body = getBody(res);

    expect(body.error.message).toBe("Resource not found");
  });

  it("maps ValidationError to 400 with details", async () => {
    const res = renderError(
      new ValidationError("Invalid input", [
        { field: "email", issue: "Invalid email" },
        { issue: "Required" },
      ]),
    );
    const body = getBody(res);

    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.details).toHaveLength(2);
    expect(body.error.details?.[0]?.field).toBe("email");
    expect(body.error.details?.[1]?.field).toBeUndefined();
  });

  it("maps AuthenticationError to 401", async () => {
    const res = renderError(new AuthenticationError("Token expired"));
    const body = getBody(res);

    expect(body.error.code).toBe("AUTH_TOKEN_EXPIRED");
    expect(body.error.message).toBe("Token expired");
  });

  it("maps LLMError to 502", async () => {
    const res = renderError(
      new LLMError("LLM_TIMEOUT", "LLM request timed out"),
    );
    const body = getBody(res);

    expect(body.error.code).toBe("LLM_TIMEOUT");
  });

  it("maps LLMError with INVALID_RESPONSE code", async () => {
    const res = renderError(
      new LLMError("LLM_INVALID_RESPONSE", "Invalid LLM output"),
    );
    const body = getBody(res);

    expect(body.error.code).toBe("LLM_INVALID_RESPONSE");
  });

  it("maps RateLimitError to 429 with Retry-After header", async () => {
    const res = renderError(new RateLimitError(120));
    const body = getBody(res);

    expect(body.error.code).toBe("RATE_LIMIT_EXCEEDED");
    expect(res.headers["retry-after"]).toBe("120");
  });

  it("maps generic Error to 500 with INTERNAL_ERROR", async () => {
    const res = renderError(new Error("Something broke"));
    const body = getBody(res);

    expect(body.success).toBe(false);
    expect(body.error.code).toBe("INTERNAL_ERROR");
  });

  it("masks error message in production for non-AppErrors", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    const res = renderError(new Error("Sensitive details"));
    const body = getBody(res);

    expect(body.error.message).toBe("Internal server error");

    process.env.NODE_ENV = originalEnv;
  });

  it("exposes error message in development for non-AppErrors", async () => {
    const res = renderError(new Error("Dev debug info"));
    const body = getBody(res);

    expect(body.error.message).toBe("Dev debug info");
  });
});
