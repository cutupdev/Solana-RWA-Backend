import { Keypair } from "@solana/web3.js";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplToolbox } from "@metaplex-foundation/mpl-toolbox";
import {
  createSignerFromKeypair,
  generateSigner,
  percentAmount,
  signerIdentity,
} from "@metaplex-foundation/umi";
import { fromWeb3JsKeypair } from "@metaplex-foundation/umi-web3js-adapters";
import { createNft, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { env } from "../config/env.js";

export interface CreateRwaNftParams {
  payer: Keypair;
  name: string;
  symbol: string;
  /** Metadata JSON URI (host your JSON on IPFS / HTTPS) */
  uri: string;
  /** Optional royalty in percent (e.g. 2.5) */
  sellerFeePercent?: number;
}

export interface CreateRwaNftResult {
  mint: string;
  signature: string;
}

/**
 * Creates a Metaplex-standard NFT (non-fungible) for unique RWA certificates.
 */
export async function createRwaNft(params: CreateRwaNftParams): Promise<CreateRwaNftResult> {
  const umi = createUmi(env.SOLANA_RPC_URL).use(mplToolbox()).use(mplTokenMetadata());
  const web3Signer = fromWeb3JsKeypair(params.payer);
  const signer = createSignerFromKeypair(umi, web3Signer);
  umi.use(signerIdentity(signer));

  const mint = generateSigner(umi);
  const feePct = params.sellerFeePercent ?? 0;

  const result = await createNft(umi, {
    mint,
    name: params.name,
    symbol: params.symbol,
    uri: params.uri,
    sellerFeeBasisPoints: percentAmount(feePct),
  }).sendAndConfirm(umi);

  const signature =
    typeof result === "object" &&
    result !== null &&
    "signature" in result &&
    typeof (result as { signature: unknown }).signature !== "undefined"
      ? String((result as { signature: unknown }).signature)
      : String(result);

  return {
    mint: String(mint.publicKey),
    signature,
  };
}
