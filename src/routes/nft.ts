import { Router } from "express";
import { z } from "zod";
import { loadPayerKeypair } from "../lib/payer.js";
import * as nft from "../services/nft.service.js";

export const nftRouter = Router();

const mintNftSchema = z.object({
  name: z.string().min(1).max(32),
  symbol: z.string().min(1).max(10),
  uri: z.string().min(1).max(2048),
  sellerFeePercent: z.number().min(0).max(100).optional(),
});

nftRouter.post("/mint", async (req, res, next) => {
  try {
    const body = mintNftSchema.parse(req.body);
    const payer = loadPayerKeypair();
    const result = await nft.createRwaNft({
      payer,
      name: body.name,
      symbol: body.symbol,
      uri: body.uri,
      sellerFeePercent: body.sellerFeePercent,
    });
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});
