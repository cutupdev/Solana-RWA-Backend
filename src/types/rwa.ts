/**
 * Off-chain RWA registry record. Link on-chain mints to legal / operational metadata.
 * Replace in-memory store with Postgres + document storage in production.
 */
export type RwaAssetKind = "spl_token" | "nft";

export interface RwaAssetRecord {
  id: string;
  kind: RwaAssetKind;
  /** SPL or NFT mint address */
  mint: string;
  /** Human-readable asset name */
  name: string;
  /** Optional: jurisdiction, ISIN, internal ref */
  externalRef?: string;
  /** IPFS / HTTPS URI for extended metadata JSON */
  metadataUri?: string;
  /** Fractional token decimals (ignored for NFT) */
  decimals?: number;
  /** Supply cap or notes */
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRwaAssetInput {
  kind: RwaAssetKind;
  mint: string;
  name: string;
  externalRef?: string;
  metadataUri?: string;
  decimals?: number;
  notes?: string;
}
