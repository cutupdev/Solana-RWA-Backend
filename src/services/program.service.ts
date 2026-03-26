import { readFileSync } from "node:fs";
import * as anchor from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { getConnection } from "../lib/solana-connection.js";
import { env } from "../config/env.js";

function requireIdlPath(): string {
  const idlPath = env.RWA_IDL_PATH?.trim();
  if (!idlPath) {
    throw new Error(
      'Set RWA_IDL_PATH to your Anchor IDL JSON (must include an "address" field).',
    );
  }
  return idlPath;
}

export function loadRwaProgram(payer: Keypair): anchor.Program {
  const idlPath = requireIdlPath();
  const connection = getConnection();
  const wallet = new anchor.Wallet(payer);
  const provider = new anchor.AnchorProvider(
    connection,
    wallet,
    anchor.AnchorProvider.defaultOptions(),
  );
  const idlJson = readFileSync(idlPath, "utf-8");
  const idl = JSON.parse(idlJson) as anchor.Idl;
  const idlProgramId = new PublicKey(idl.address).toBase58();
  const envProgramId = env.RWA_PROGRAM_ID?.trim();
  if (envProgramId && new PublicKey(envProgramId).toBase58() !== idlProgramId) {
    throw new Error(
      `RWA_PROGRAM_ID does not match IDL address (IDL: ${idlProgramId}, env: ${envProgramId})`,
    );
  }
  return new anchor.Program(idl, provider);
}

export interface InvokeMethodParams {
  payer: Keypair;
  /** Anchor method name as defined in IDL */
  method: string;
  /** Positional args for the method (JSON-serializable) */
  args?: unknown[];
  /** Account names -> base58 pubkeys (IDL account names) */
  accounts: Record<string, string>;
  /** Remaining accounts: pubkey, isSigner, isWritable */
  remainingAccounts?: { pubkey: string; isSigner: boolean; isWritable: boolean }[];
}

/**
 * Generic Anchor instruction builder for your RWA program (deposit, redeem, attest, etc.).
 * Prefer strongly typed clients in production; this enables rapid integration against IDL.
 */
export async function invokeAnchorMethod(params: InvokeMethodParams): Promise<string> {
  const program = loadRwaProgram(params.payer);
  const methodFn = (program.methods as Record<string, (...args: unknown[]) => unknown>)[
    params.method
  ];
  if (typeof methodFn !== "function") {
    throw new Error(`Unknown program method: ${params.method}`);
  }

  const accountMap: Record<string, PublicKey> = {};
  for (const [k, v] of Object.entries(params.accounts)) {
    accountMap[k] = new PublicKey(v);
  }

  const remaining = (params.remainingAccounts ?? []).map((r) => ({
    pubkey: new PublicKey(r.pubkey),
    isSigner: r.isSigner,
    isWritable: r.isWritable,
  }));

  let step: unknown = methodFn(...(params.args ?? []));
  step = (step as { accounts: (m: Record<string, PublicKey>) => unknown }).accounts(accountMap);
  if (remaining.length) {
    step = (
      step as {
        remainingAccounts: (
          r: { pubkey: PublicKey; isSigner: boolean; isWritable: boolean }[],
        ) => unknown;
      }
    ).remainingAccounts(remaining);
  }
  const sig = await (step as { rpc: () => Promise<string> }).rpc();
  return sig;
}

export async function fetchProgramAccount<T = unknown>(
  payer: Keypair,
  accountName: string,
  address: string,
): Promise<T> {
  const program = loadRwaProgram(payer);
  const fetcher = (program.account as Record<string, { fetch: (pk: PublicKey) => Promise<T> }>)[
    accountName
  ];
  if (!fetcher?.fetch) {
    throw new Error(`Unknown program account namespace: ${accountName}`);
  }
  return fetcher.fetch(new PublicKey(address));
}
