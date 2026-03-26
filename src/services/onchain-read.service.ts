import { PublicKey } from "@solana/web3.js";
import { getMint, getAccount } from "@solana/spl-token";
import { getConnection } from "../lib/solana-connection.js";

export async function readMint(mint: string) {
  const connection = getConnection();
  const pk = new PublicKey(mint);
  const m = await getMint(connection, pk);
  return {
    address: mint,
    mintAuthority: m.mintAuthority?.toBase58() ?? null,
    freezeAuthority: m.freezeAuthority?.toBase58() ?? null,
    decimals: m.decimals,
    supply: m.supply.toString(),
    isInitialized: m.isInitialized,
  };
}

export async function readTokenAccount(ata: string) {
  const connection = getConnection();
  const pk = new PublicKey(ata);
  const acc = await getAccount(connection, pk);
  return {
    address: ata,
    mint: acc.mint.toBase58(),
    owner: acc.owner.toBase58(),
    amount: acc.amount.toString(),
    delegate: acc.delegate?.toBase58() ?? null,
    state: acc.state,
  };
}
