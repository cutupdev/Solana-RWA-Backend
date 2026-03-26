import { Router } from "express";
import { z } from "zod";
import { HttpError } from "../lib/http-error.js";
import * as registry from "../services/rwa-registry.service.js";

export const rwaRouter = Router();

const createSchema = z.object({
  kind: z.enum(["spl_token", "nft"]),
  mint: z.string().min(32),
  name: z.string().min(1).max(256),
  externalRef: z.string().max(256).optional(),
  metadataUri: z.string().max(2048).optional(),
  decimals: z.number().int().min(0).max(9).optional(),
  notes: z.string().max(4000).optional(),
});

rwaRouter.get("/assets", (_req, res) => {
  res.json({ assets: registry.listAssets() });
});

rwaRouter.get("/assets/by-mint/:mint", (req, res, next) => {
  try {
    const found = registry.getAssetByMint(req.params.mint);
    if (!found) throw new HttpError(404, "Asset not found");
    res.json(found);
  } catch (e) {
    next(e);
  }
});

rwaRouter.get("/assets/:id", (req, res, next) => {
  try {
    const found = registry.getAssetById(req.params.id);
    if (!found) throw new HttpError(404, "Asset not found");
    res.json(found);
  } catch (e) {
    next(e);
  }
});

rwaRouter.post("/assets", (req, res, next) => {
  try {
    const body = createSchema.parse(req.body);
    const record = registry.registerAsset(body);
    res.status(201).json(record);
  } catch (e) {
    next(e);
  }
});

const notesSchema = z.object({ notes: z.string().min(1).max(4000) });

rwaRouter.patch("/assets/:id/notes", (req, res, next) => {
  try {
    const { notes } = notesSchema.parse(req.body);
    const updated = registry.updateAssetNotes(req.params.id, notes);
    if (!updated) throw new HttpError(404, "Asset not found");
    res.json(updated);
  } catch (e) {
    next(e);
  }
});
