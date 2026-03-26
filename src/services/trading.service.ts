import { PublicKey, VersionedTransaction } from "@solana/web3.js";
import { env } from "../config/env.js";

const JUPITER_QUOTE = "/v6/quote";
const JUPITER_SWAP = "/v6/swap";

export interface JupiterQuoteParams {
  inputMint: string;
  outputMint: string;
  /** Raw amount in smallest units (lamports / token atoms) */
  amount: string;
  slippageBps?: number;
  onlyDirectRoutes?: boolean;
  asLegacyTransaction?: boolean;
}

/**
 * Fetches a swap quote from Jupiter Aggregator v6.
 * @see https://station.jup.ag/docs/apis/swap-api
 */
export async function getJupiterQuote(params: JupiterQuoteParams): Promise<unknown> {
  const base = env.JUPITER_API_BASE.replace(/\/$/, "");
  const slippage = params.slippageBps ?? env.DEFAULT_SLIPPAGE_BPS;
  const url = new URL(base + JUPITER_QUOTE);
  url.searchParams.set("inputMint", params.inputMint);
  url.searchParams.set("outputMint", params.outputMint);
  url.searchParams.set("amount", params.amount);
  url.searchParams.set("slippageBps", String(slippage));
  if (params.onlyDirectRoutes !== undefined) {
    url.searchParams.set("onlyDirectRoutes", String(params.onlyDirectRoutes));
  }
  if (params.asLegacyTransaction !== undefined) {
    url.searchParams.set("asLegacyTransaction", String(params.asLegacyTransaction));
  }

  const res = await fetch(url.toString(), { method: "GET" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Jupiter quote failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<unknown>;
}

export interface BuildSwapTransactionParams {
  /** Full quote response from `getJupiterQuote` */
  quoteResponse: unknown;
  /** User wallet that will sign the swap */
  userPublicKey: string;
  wrapAndUnwrapSol?: boolean;
  dynamicComputeUnitLimit?: boolean;
  prioritizationFeeLamports?: "auto" | number;
}

/**
 * Builds a VersionedTransaction (base64) for the user to sign in-wallet.
 */
export async function buildJupiterSwapTransaction(
  params: BuildSwapTransactionParams,
): Promise<{ swapTransactionBase64: string }> {
  const base = env.JUPITER_API_BASE.replace(/\/$/, "");
  const body = {
    quoteResponse: params.quoteResponse,
    userPublicKey: params.userPublicKey,
    wrapAndUnwrapSol: params.wrapAndUnwrapSol ?? true,
    dynamicComputeUnitLimit: params.dynamicComputeUnitLimit ?? true,
    prioritizationFeeLamports: params.prioritizationFeeLamports ?? "auto",
  };

  const res = await fetch(base + JUPITER_SWAP, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Jupiter swap build failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as { swapTransaction?: string };
  if (!data.swapTransaction) {
    throw new Error("Jupiter swap response missing swapTransaction");
  }
  return { swapTransactionBase64: data.swapTransaction };
}

/**
 * Deserialize Jupiter swap tx for inspection or relay (sign carefully).
 */
export function decodeSwapTransaction(base64: string): VersionedTransaction {
  const buf = Buffer.from(base64, "base64");
  return VersionedTransaction.deserialize(buf);
}

/**
 * Validates that swap transaction fee payer / account keys look sane (basic check).
 */
export function assertUserInTransaction(
  tx: VersionedTransaction,
  user: PublicKey,
): void {
  const keys = tx.message.staticAccountKeys;
  if (!keys.some((k) => k.equals(user))) {
    throw new Error("User public key not present in swap transaction accounts");
  }
}
