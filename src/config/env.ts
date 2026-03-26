import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(8080),
  SOLANA_RPC_URL: z.string().url(),
  PAYER_SECRET_BASE58: z.string().optional(),
  PAYER_KEYPAIR_PATH: z.string().optional(),
  RWA_PROGRAM_ID: z.string().optional(),
  RWA_IDL_PATH: z.string().optional(),
  JUPITER_API_BASE: z.string().url().default("https://quote-api.jup.ag"),
  DEFAULT_SLIPPAGE_BPS: z.coerce.number().min(0).max(10_000).default(50),
  CORS_ORIGINS: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment:", parsed.error.flatten().fieldErrors);
  throw new Error("Environment validation failed");
}

export const env = parsed.data;

export function getCorsOrigins(): string[] | boolean {
  if (!env.CORS_ORIGINS?.trim()) {
    return env.NODE_ENV === "development";
  }
  return env.CORS_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean);
}
