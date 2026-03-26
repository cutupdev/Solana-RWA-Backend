import { Router } from "express";
import { getConnection } from "../lib/solana-connection.js";

export const healthRouter = Router();

healthRouter.get("/health", async (_req, res, next) => {
  try {
    const connection = getConnection();
    const slot = await connection.getSlot("processed");
    res.json({ ok: true, slot });
  } catch (e) {
    next(e);
  }
});
