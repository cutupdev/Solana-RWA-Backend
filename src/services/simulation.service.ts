import { VersionedTransaction } from "@solana/web3.js";
import { getConnection } from "../lib/solana-connection.js";

export async function simulateVersionedTransactionBase64(
  base64Tx: string,
): Promise<unknown> {
  const connection = getConnection();
  const tx = VersionedTransaction.deserialize(Buffer.from(base64Tx, "base64"));
  const sim = await connection.simulateTransaction(tx, {
    commitment: "processed",
    sigVerify: false,
  });
  return {
    err: sim.value.err,
    logs: sim.value.logs,
    unitsConsumed: sim.value.unitsConsumed,
    returnData: sim.value.returnData,
  };
}
