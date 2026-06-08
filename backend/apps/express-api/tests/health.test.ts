import { describe, expect, it } from "vitest";
import { healthHandler, helloHandler } from "../src/server.js";

describe("GET /api/v1/health", () => {
  it("returns the standard success envelope", async () => {
    const response = {
      statusCode: 200,
      body: undefined as unknown,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(payload: unknown) {
        this.body = payload;
        return this;
      },
    };

    healthHandler({} as never, response as never);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: {
        status: "ok",
      },
    });
  });
});

describe("GET /api/v1/hello", () => {
  it("returns a hello world payload for smoke testing", async () => {
    const response = {
      statusCode: 200,
      body: undefined as unknown,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(payload: unknown) {
        this.body = payload;
        return this;
      },
    };

    helloHandler({} as never, response as never);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: {
        message: "hello world",
        source: "express-api",
      },
    });
  });
});
