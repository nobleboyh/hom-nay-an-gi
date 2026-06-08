import { describe, expect, it } from "vitest";
import { z } from "zod";
import { type ValidatedRequest, validate } from "../src/index.js";
import {
  createMockRequest,
  createMockResponse,
  createNextSpy,
} from "./helpers.js";

const testSchema = z.object({
  name: z.string().min(1),
  age: z.coerce.number().int().min(0).max(150),
});

describe("validate middleware", () => {
  it("passes valid body through with req.validated", async () => {
    const req = createMockRequest({ body: { name: "Alice", age: "30" } });
    const res = createMockResponse();
    const { calls, next } = createNextSpy();

    validate(testSchema)(req, res, next);

    expect(calls).toEqual([undefined]);
    expect(
      (req as ValidatedRequest<{ name: string; age: number }>).validated,
    ).toEqual({
      name: "Alice",
      age: 30,
    });
  });

  it("returns 400 with details for invalid body", async () => {
    const req = createMockRequest({ body: { name: "", age: 999 } });
    const res = createMockResponse();
    const { calls, next } = createNextSpy();

    validate(testSchema)(req, res, next);

    expect(calls[0]).toBeDefined();
    const error = calls[0] as { code: string; details?: unknown[] };
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.details).toBeDefined();
    expect(error.details?.length).toBeGreaterThan(0);
  });

  it("returns 400 for empty string name", async () => {
    const req = createMockRequest({ body: { name: "", age: 20 } });
    const res = createMockResponse();
    const { calls, next } = createNextSpy();

    validate(testSchema)(req, res, next);

    const error = calls[0] as { details: { field?: string }[] };
    const nameDetail = error.details.find(
      (d: { field?: string }) => d.field === "name",
    );
    expect(nameDetail).toBeDefined();
  });

  it("strips extra fields via Zod parse", async () => {
    const req = createMockRequest({
      body: { name: "Bob", age: 40, extra: "should be stripped" },
    });
    const res = createMockResponse();
    const { calls, next } = createNextSpy();

    validate(testSchema)(req, res, next);

    expect(calls).toEqual([undefined]);
    expect(
      (
        (req as ValidatedRequest<{ name: string; age: number }>)
          .validated as Record<string, unknown>
      ).extra,
    ).toBeUndefined();
  });
});
