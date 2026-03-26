import { Router } from "express";
import { z } from "zod";
import { loadPayerKeypair } from "../lib/payer.js";
import * as programSvc from "../services/program.service.js";

export const programRouter = Router();

const invokeSchema = z.object({
  method: z.string().min(1),
  args: z.array(z.unknown()).optional(),
  accounts: z.record(z.string(), z.string()),
  remainingAccounts: z
    .array(
      z.object({
        pubkey: z.string(),
        isSigner: z.boolean(),
        isWritable: z.boolean(),
      }),
    )
    .optional(),
});

programRouter.post("/invoke", async (req, res, next) => {
  try {
    const body = invokeSchema.parse(req.body);
    const payer = loadPayerKeypair();
    const signature = await programSvc.invokeAnchorMethod({
      payer,
      method: body.method,
      args: body.args,
      accounts: body.accounts,
      remainingAccounts: body.remainingAccounts,
    });
    res.json({ signature });
  } catch (e) {
    next(e);
  }
});

const fetchAccountSchema = z.object({
  namespace: z.string().min(1),
  address: z.string().min(32),
});

programRouter.get("/account/:namespace/:address", async (req, res, next) => {
  try {
    const params = fetchAccountSchema.parse(req.params);
    const payer = loadPayerKeypair();
    const data = await programSvc.fetchProgramAccount(
      payer,
      params.namespace,
      params.address,
    );
    res.json(data);
  } catch (e) {
    next(e);
  }
});
