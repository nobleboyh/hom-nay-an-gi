import type { NextFunction, Request, RequestHandler, Response } from "express";

export function asyncHandler(
  fn: RequestHandler,
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
