import { Router } from "express";
import { z } from "zod";
import * as simulation from "../services/simulation.service.js";

export const chainRouter = Router();

const simSchema = z.object({
  versionedTransactionBase64: z.string().min(1),
});

chainRouter.post("/simulate", async (req, res, next) => {
  try {
    const body = simSchema.parse(req.body);
    const result = await simulation.simulateVersionedTransactionBase64(
      body.versionedTransactionBase64,
    );
    res.json(result);
  } catch (e) {
    next(e);
  }
});
