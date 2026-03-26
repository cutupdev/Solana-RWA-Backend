import { Router } from "express";
import { PublicKey } from "@solana/web3.js";
import { z } from "zod";
import * as trading from "../services/trading.service.js";

export const tradingRouter = Router();

const quoteSchema = z.object({
  inputMint: z.string(),
  outputMint: z.string(),
  amount: z.string().regex(/^\d+$/),
  slippageBps: z.number().int().min(0).max(10_000).optional(),
  onlyDirectRoutes: z.boolean().optional(),
  asLegacyTransaction: z.boolean().optional(),
});

tradingRouter.post("/quote", async (req, res, next) => {
  try {
    const body = quoteSchema.parse(req.body);
    const quote = await trading.getJupiterQuote(body);
    res.json(quote);
  } catch (e) {
    next(e);
  }
});

const swapTxSchema = z.object({
  quoteResponse: z.unknown(),
  userPublicKey: z.string(),
  wrapAndUnwrapSol: z.boolean().optional(),
  dynamicComputeUnitLimit: z.boolean().optional(),
  prioritizationFeeLamports: z.union([z.literal("auto"), z.number()]).optional(),
});

tradingRouter.post("/swap-transaction", async (req, res, next) => {
  try {
    const body = swapTxSchema.parse(req.body);
    const built = await trading.buildJupiterSwapTransaction(body);
    res.json(built);
  } catch (e) {
    next(e);
  }
});

const decodeSchema = z.object({
  swapTransactionBase64: z.string().min(1),
  userPublicKey: z.string().optional(),
});

tradingRouter.post("/decode-swap", (req, res, next) => {
  try {
    const body = decodeSchema.parse(req.body);
    const tx = trading.decodeSwapTransaction(body.swapTransactionBase64);
    if (body.userPublicKey) {
      trading.assertUserInTransaction(tx, new PublicKey(body.userPublicKey));
    }
    const keys = tx.message.staticAccountKeys.map((k) => k.toBase58());
    res.json({
      numSignatures: tx.signatures.length,
      staticAccountKeys: keys,
    });
  } catch (e) {
    next(e);
  }
});
