import { Connection } from "@solana/web3.js";
import { env } from "../config/env.js";

let connection: Connection | null = null;

export function getConnection(): Connection {
  if (!connection) {
    connection = new Connection(env.SOLANA_RPC_URL, {
      commitment: "confirmed",
    });
  }
  return connection;
}
