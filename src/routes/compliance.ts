import { Router } from "express";
import { z } from "zod";
import * as compliance from "../services/compliance-stub.service.js";

export const complianceRouter = Router();

const checkSchema = z.object({
  wallet: z.string().min(32),
  mint: z.string().optional(),
  action: z.enum(["mint", "transfer", "trade", "redeem"]),
});

complianceRouter.post("/check", async (req, res, next) => {
  try {
    const body = checkSchema.parse(req.body);
    const result = await compliance.evaluateComplianceStub(body);
    res.json(result);
  } catch (e) {
    next(e);
  }
});
