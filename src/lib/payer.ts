import { readFileSync } from "node:fs";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { env } from "../config/env.js";

/**
 * Loads the server payer keypair for automated minting / signing.
 * For user-signed flows, use wallet adapters in the frontend and pass partial txs here.
 */
export function loadPayerKeypair(): Keypair {
  if (env.PAYER_SECRET_BASE58?.trim()) {
    const secret = bs58.decode(env.PAYER_SECRET_BASE58.trim());
    return Keypair.fromSecretKey(secret);
  }
  if (env.PAYER_KEYPAIR_PATH?.trim()) {
    const raw = readFileSync(env.PAYER_KEYPAIR_PATH.trim(), "utf-8");
    const arr = JSON.parse(raw) as number[];
    return Keypair.fromSecretKey(Uint8Array.from(arr));
  }
  throw new Error(
    "Configure PAYER_SECRET_BASE58 or PAYER_KEYPAIR_PATH for server-side signing",
  );
}
