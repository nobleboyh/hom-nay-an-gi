import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";
import { ValidationError } from "../utils/errors.js";

declare global {
  namespace Express {
    interface Request {
      validated?: unknown;
    }
  }
}

export interface ValidatedRequest<T> extends Request {
  validated: T;
}

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req.body);
      req.validated = parsed;
      next();
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "issues" in error &&
        Array.isArray((error as { issues: unknown[] }).issues)
      ) {
        const zodError = error as {
          issues: { path: (string | number)[]; message: string }[];
        };
        const details = zodError.issues.map(
          (issue): { field?: string; issue: string } => {
            const entry: { field?: string; issue: string } = {
              issue: issue.message,
            };
            if (issue.path.length > 0) {
              entry.field = issue.path.join(".");
            }
            return entry;
          },
        );
        next(new ValidationError("Validation failed", details));
      } else {
        next(error);
      }
    }
  };
}
