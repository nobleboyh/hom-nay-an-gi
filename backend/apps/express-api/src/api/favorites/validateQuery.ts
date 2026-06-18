import { ValidationError } from "@hom-nay-an-gi/shared";
import type { NextFunction, Request, Response } from "express";

function parseValidationError(error: unknown, next: NextFunction): void {
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

interface ParseSchema {
  parse: (data: unknown) => unknown;
}

export function validateQuery(schema: ParseSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req.query);
      req.validated = parsed;
      next();
    } catch (error) {
      parseValidationError(error, next);
    }
  };
}

export function validateParams(schema: ParseSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req.params);
      req.validated = parsed;
      next();
    } catch (error) {
      parseValidationError(error, next);
    }
  };
}
