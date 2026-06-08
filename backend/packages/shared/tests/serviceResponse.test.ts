import { describe, expect, it } from "vitest";
import { ServiceResponse } from "../src/index.js";

describe("ServiceResponse", () => {
  describe("success", () => {
    it("builds the standard success envelope", () => {
      const result = ServiceResponse.success({ status: "ok" }, "req-123");

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ status: "ok" });
      expect(result.meta.requestId).toBe("req-123");
      expect(result.meta.timestamp).toBeDefined();
      expect(result.meta.version).toBeDefined();
    });
  });

  describe("failure", () => {
    it("builds the standard error envelope without details", () => {
      const result = ServiceResponse.failure(
        "NOT_FOUND",
        "Dish not found",
        "req-456",
      );

      expect(result.success).toBe(false);
      expect(result.error.code).toBe("NOT_FOUND");
      expect(result.error.message).toBe("Dish not found");
      expect(result.error.details).toBeUndefined();
      expect(result.meta.requestId).toBe("req-456");
    });

    it("builds the standard error envelope with details", () => {
      const result = ServiceResponse.failure(
        "VALIDATION_ERROR",
        "Validation failed",
        "req-789",
        [
          { field: "email", issue: "Invalid email" },
          { issue: "Required field" },
        ],
      );

      expect(result.success).toBe(false);
      expect(result.error.code).toBe("VALIDATION_ERROR");
      expect(result.error.details).toBeDefined();
      expect(result.error.details).toHaveLength(2);
      expect(result.error.details?.[0]?.field).toBe("email");
      expect(result.error.details?.[1]?.field).toBeUndefined();
    });
  });
});
