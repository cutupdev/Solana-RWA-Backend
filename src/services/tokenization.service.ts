import {
  AuthorityType,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  createMintToInstruction,
  createSetAuthorityInstruction,
  createTransferInstruction,
  getAssociatedTokenAddress,
  getMinimumBalanceForRentExemptMint,
} from "@solana/spl-token";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { getConnection } from "../lib/solana-connection.js";
import type { Keypair as SolanaKeypair } from "@solana/web3.js";

export interface CreateSplMintParams {
  payer: SolanaKeypair;
  /** Token decimals (e.g. 6 for USDC-like, 9 for many RWAs) */
  decimals: number;
  /** Optional: freeze authority */
  freezeAuthority?: PublicKey;
}

export interface CreateSplMintResult {
  mint: string;
  transactionSignature: string;
}

/**
 * Creates a new SPL Token mint (classic Token program). RWA issuers often use Token-2022
 * for transfer hooks / confidential balances; extend similarly with @solana/spl-token extensions.
 */
export async function createSplMint(
  params: CreateSplMintParams,
): Promise<CreateSplMintResult> {
  const connection = getConnection();
  const payer = params.payer;
  const mintKeypair = Keypair.generate();
  const lamports = await getMinimumBalanceForRentExemptMint(connection);

  const tx = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      space: MINT_SIZE,
      lamports,
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeMintInstruction(
      mintKeypair.publicKey,
      params.decimals,
      payer.publicKey,
      params.freezeAuthority ?? null,
      TOKEN_PROGRAM_ID,
    ),
  );

  const sig = await sendAndConfirmTransaction(connection, tx, [payer, mintKeypair], {
    commitment: "confirmed",
  });

  return {
    mint: mintKeypair.publicKey.toBase58(),
    transactionSignature: sig,
  };
}

export interface MintToRecipientParams {
  payer: SolanaKeypair;
  mint: PublicKey;
  recipientOwner: PublicKey;
  amount: bigint;
}

export async function mintToRecipient(
  params: MintToRecipientParams,
): Promise<{ ata: string; signature: string }> {
  const connection = getConnection();
  const payer = params.payer;
  const ata = await getAssociatedTokenAddress(params.mint, params.recipientOwner);

  const tx = new Transaction();
  const info = await connection.getAccountInfo(ata);
  if (!info) {
    tx.add(
      createAssociatedTokenAccountInstruction(
        payer.publicKey,
        ata,
        params.recipientOwner,
        params.mint,
        TOKEN_PROGRAM_ID,
      ),
    );
  }
  tx.add(
    createMintToInstruction(
      params.mint,
      ata,
      payer.publicKey,
      params.amount,
      [],
      TOKEN_PROGRAM_ID,
    ),
  );

  const sig = await sendAndConfirmTransaction(connection, tx, [payer], {
    commitment: "confirmed",
  });

  return { ata: ata.toBase58(), signature: sig };
}

export interface TransferSplParams {
  owner: SolanaKeypair;
  mint: PublicKey;
  /** Source ATA (must be owned by `owner`) */
  sourceAta: PublicKey;
  /** Destination owner (ATA created if missing) */
  destinationOwner: PublicKey;
  amount: bigint;
}

export async function transferSplTokens(params: TransferSplParams): Promise<string> {
  const connection = getConnection();
  const destAta = await getAssociatedTokenAddress(params.mint, params.destinationOwner);

  const tx = new Transaction();
  const destInfo = await connection.getAccountInfo(destAta);
  if (!destInfo) {
    tx.add(
      createAssociatedTokenAccountInstruction(
        params.owner.publicKey,
        destAta,
        params.destinationOwner,
        params.mint,
        TOKEN_PROGRAM_ID,
      ),
    );
  }
  tx.add(
    createTransferInstruction(
      params.sourceAta,
      destAta,
      params.owner.publicKey,
      params.amount,
      [],
      TOKEN_PROGRAM_ID,
    ),
  );

  return sendAndConfirmTransaction(connection, tx, [params.owner], {
    commitment: "confirmed",
  });
}

export interface RenounceMintAuthorityParams {
  payer: SolanaKeypair;
  mint: PublicKey;
}

export async function renounceMintAuthority(
  params: RenounceMintAuthorityParams,
): Promise<string> {
  const connection = getConnection();
  const ix = createSetAuthorityInstruction(
    params.mint,
    params.payer.publicKey,
    AuthorityType.MintTokens,
    null,
    [],
    TOKEN_PROGRAM_ID,
  );
  const tx = new Transaction().add(ix);
  return sendAndConfirmTransaction(connection, tx, [params.payer], {
    commitment: "confirmed",
  });
}
