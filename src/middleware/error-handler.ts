import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { HttpError } from "../lib/http-error.js";
import { env } from "../config/env.js";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res.status(400).json({ error: "Validation failed", details: err.flatten() });
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  const message = err instanceof Error ? err.message : "Internal error";
  if (env.NODE_ENV === "development" && err instanceof Error) {
    console.error(err);
    res.status(500).json({ error: message, stack: err.stack });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
}
