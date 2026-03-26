import type { NextFunction, Request, Response } from "express";
import { getCorsOrigins } from "../config/env.js";

export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const allowed = getCorsOrigins();
  const origin = req.headers.origin;

  if (allowed === true) {
    res.setHeader("Access-Control-Allow-Origin", (origin as string) || "*");
  } else if (Array.isArray(allowed) && origin && allowed.includes(String(origin))) {
    res.setHeader("Access-Control-Allow-Origin", String(origin));
  }

  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
}
