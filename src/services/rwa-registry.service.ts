import { randomUUID } from "node:crypto";
import type { CreateRwaAssetInput, RwaAssetRecord } from "../types/rwa.js";

/** In-memory registry; swap for a database in production. */
const store = new Map<string, RwaAssetRecord>();

export function listAssets(): RwaAssetRecord[] {
  return [...store.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function getAssetById(id: string): RwaAssetRecord | undefined {
  return store.get(id);
}

export function getAssetByMint(mint: string): RwaAssetRecord | undefined {
  return [...store.values()].find((a) => a.mint === mint);
}

export function registerAsset(input: CreateRwaAssetInput): RwaAssetRecord {
  const now = new Date().toISOString();
  const id = randomUUID();
  const record: RwaAssetRecord = {
    id,
    kind: input.kind,
    mint: input.mint,
    name: input.name,
    externalRef: input.externalRef,
    metadataUri: input.metadataUri,
    decimals: input.decimals,
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
  };
  store.set(id, record);
  return record;
}

export function updateAssetNotes(id: string, notes: string): RwaAssetRecord | undefined {
  const existing = store.get(id);
  if (!existing) return undefined;
  const updated: RwaAssetRecord = {
    ...existing,
    notes,
    updatedAt: new Date().toISOString(),
  };
  store.set(id, updated);
  return updated;
}
