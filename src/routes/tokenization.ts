import { Router } from "express";
import { PublicKey } from "@solana/web3.js";
import { z } from "zod";
import { loadPayerKeypair } from "../lib/payer.js";
import * as tokenization from "../services/tokenization.service.js";
import * as onchain from "../services/onchain-read.service.js";

export const tokenizationRouter = Router();

const splMintSchema = z.object({
  decimals: z.number().int().min(0).max(9),
  freezeAuthority: z.string().optional(),
});

tokenizationRouter.post("/spl/mint", async (req, res, next) => {
  try {
    const body = splMintSchema.parse(req.body);
    const payer = loadPayerKeypair();
    const freeze = body.freezeAuthority
      ? new PublicKey(body.freezeAuthority)
      : undefined;
    const result = await tokenization.createSplMint({
      payer,
      decimals: body.decimals,
      freezeAuthority: freeze,
    });
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

const mintToSchema = z.object({
  mint: z.string(),
  recipientOwner: z.string(),
  amount: z.string().regex(/^\d+$/),
});

tokenizationRouter.post("/spl/mint-to", async (req, res, next) => {
  try {
    const body = mintToSchema.parse(req.body);
    const payer = loadPayerKeypair();
    const result = await tokenization.mintToRecipient({
      payer,
      mint: new PublicKey(body.mint),
      recipientOwner: new PublicKey(body.recipientOwner),
      amount: BigInt(body.amount),
    });
    res.json(result);
  } catch (e) {
    next(e);
  }
});

const transferSchema = z.object({
  mint: z.string(),
  sourceAta: z.string(),
  destinationOwner: z.string(),
  amount: z.string().regex(/^\d+$/),
});

tokenizationRouter.post("/spl/transfer", async (req, res, next) => {
  try {
    const body = transferSchema.parse(req.body);
    const owner = loadPayerKeypair();
    const sig = await tokenization.transferSplTokens({
      owner,
      mint: new PublicKey(body.mint),
      sourceAta: new PublicKey(body.sourceAta),
      destinationOwner: new PublicKey(body.destinationOwner),
      amount: BigInt(body.amount),
    });
    res.json({ signature: sig });
  } catch (e) {
    next(e);
  }
});

const renounceSchema = z.object({ mint: z.string() });

tokenizationRouter.post("/spl/renounce-mint-authority", async (req, res, next) => {
  try {
    const body = renounceSchema.parse(req.body);
    const payer = loadPayerKeypair();
    const sig = await tokenization.renounceMintAuthority({
      payer,
      mint: new PublicKey(body.mint),
    });
    res.json({ signature: sig });
  } catch (e) {
    next(e);
  }
});

tokenizationRouter.get("/spl/mint/:mint", async (req, res, next) => {
  try {
    const info = await onchain.readMint(req.params.mint);
    res.json(info);
  } catch (e) {
    next(e);
  }
});

tokenizationRouter.get("/spl/account/:ata", async (req, res, next) => {
  try {
    const info = await onchain.readTokenAccount(req.params.ata);
    res.json(info);
  } catch (e) {
    next(e);
  }
});
