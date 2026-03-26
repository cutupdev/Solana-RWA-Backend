# Solana RWA Backend

TypeScript backend for **real-world asset (RWA)** workflows on Solana: **SPL tokenization**, **Metaplex NFT certificates**, **Jupiter-powered trading** (quotes and unsigned swap transactions), **Anchor program calls**, plus **registry**, **simulation**, and a **compliance stub** you can replace with real policy engines.

## Stack

- **Runtime**: Node.js 20+, ESM, TypeScript
- **HTTP**: Express
- **Solana**: `@solana/web3.js`, `@solana/spl-token`
- **NFTs**: Metaplex Token Metadata + Umi (`createNft`)
- **Programs**: `@coral-xyz/anchor` (IDL-driven)
- **DEX aggregation**: Jupiter Swap API v6 (HTTP)

## Quick start

1. Copy environment template and fill in values:

   ```bash
   cp .env.example .env
   ```

2. Install dependencies and run (when you are ready in your environment):

   ```bash
   npm install
   npm run dev
   ```

3. Build for production:

   ```bash
   npm run build
   npm start
   ```

The server listens on `PORT` (default **8080**). Base path for APIs: **`/api`**.

## Environment

See [`.env.example`](./.env.example). Important variables:

| Variable | Purpose |
|----------|---------|
| `SOLANA_RPC_URL` | RPC endpoint (devnet, mainnet, or private) |
| `PAYER_SECRET_BASE58` / `PAYER_KEYPAIR_PATH` | Keypair used for **server-signed** flows (minting, transfers, Anchor calls). **Do not use a hot treasury key in production.** |
| `RWA_IDL_PATH` | Path to Anchor IDL JSON; must include top-level **`address`** (program id). Anchor 0.30+ `Program` reads the program id from the IDL. |
| `RWA_PROGRAM_ID` | Optional; if set, must match the IDL `address`. |
| `JUPITER_API_BASE` | Jupiter quote API base (default `https://quote-api.jup.ag`) |
| `CORS_ORIGINS` | Comma-separated allowed origins, or leave empty (dev: permissive) |

## API overview

### Health

- `GET /api/health` — Liveness + current processed slot from RPC.

### RWA registry (off-chain)

In-memory store for linking mints to business metadata. **Swap for Postgres (or similar) in production.**

- `GET /api/rwa/assets`
- `GET /api/rwa/assets/:id`
- `GET /api/rwa/assets/by-mint/:mint`
- `POST /api/rwa/assets` — register `{ kind, mint, name, ... }`
- `PATCH /api/rwa/assets/:id/notes`

### SPL tokenization (classic Token program)

- `POST /api/tokenization/spl/mint` — `{ decimals, freezeAuthority? }` → new mint (requires payer).
- `POST /api/tokenization/spl/mint-to` — `{ mint, recipientOwner, amount }` (`amount` as decimal string).
- `POST /api/tokenization/spl/transfer` — `{ mint, sourceAta, destinationOwner, amount }` (payer is token **owner**).
- `POST /api/tokenization/spl/renounce-mint-authority` — `{ mint }`
- `GET /api/tokenization/spl/mint/:mint` — mint info
- `GET /api/tokenization/spl/account/:ata` — token account info

For **Token-2022** (transfer hooks, confidential balances, interest-bearing tokens), extend `tokenization.service.ts` using SPL Token extensions; the API shape can stay similar.

### NFT (RWA certificate)

- `POST /api/nft/mint` — `{ name, symbol, uri, sellerFeePercent? }` — Metaplex NFT (requires payer).

Host metadata JSON (name, image, attributes, legal references) on **HTTPS** or **IPFS** and point `uri` to it.

### Trading (Jupiter)

- `POST /api/trade/quote` — `{ inputMint, outputMint, amount, slippageBps?, ... }` — returns Jupiter quote JSON.
- `POST /api/trade/swap-transaction` — `{ quoteResponse, userPublicKey, ... }` — returns `{ swapTransactionBase64 }` for the **user wallet** to sign.
- `POST /api/trade/decode-swap` — inspect static account keys (optional `userPublicKey` assertion).

RWA products often combine **primary issuance** (your mint) with **secondary liquidity** via DEX pools or RFQ; Jupiter covers many liquid routes on mainnet.

### Anchor program interaction

- `POST /api/program/invoke` — `{ method, args?, accounts, remainingAccounts? }`  
  - `method`: camelCase name matching your IDL **after** Anchor’s camelCase conversion.  
  - `accounts`: map of IDL account names → base58 pubkeys.  
  - `args`: JSON array; for large integers use **strings** where Anchor expects BN/u64.
- `GET /api/program/account/:namespace/:address` — fetch deserialized account (`namespace` is the camelCase account name from the IDL, e.g. `rwaVault`).

Prefer generating a **typed** client from your IDL for production instead of fully dynamic calls.

### Chain utilities

- `POST /api/chain/simulate` — `{ versionedTransactionBase64 }` — RPC simulation (logs, units consumed).

### Compliance (stub)

- `POST /api/compliance/check` — `{ wallet, mint?, action }` — always returns `allow` until you implement real rules (allowlists, KYC providers, jurisdiction).

## Project layout

```
src/
  config/          env loading + validation
  lib/             connection, payer, HTTP errors
  middleware/      CORS, errors (incl. Zod)
  routes/          Express routers
  services/        tokenization, nft, trading, program, registry, etc.
idl/               place your `*.json` IDL here (see .gitkeep)
```

## Security and operations

- **Never commit** real private keys. `.gitignore` excludes `.env` and common keypair file patterns.
- **Server-side payer** is appropriate for **devnet** and **controlled automation** only. For production, use **hardware security modules**, **KMS**, or **user-signed** transactions for sensitive actions.
- **Jupiter swap transactions** should be signed by the **end user**; this backend only requests unsigned transactions from Jupiter unless you deliberately add a signing relay (high trust and compliance surface).
- Use **rate limiting**, **authentication**, and **idempotency** on mint and transfer endpoints before exposing to the public internet.

## Extending for production RWA

- Persist registry and audit logs in a database; store **hashes** of legal documents on-chain or on IPFS.
- Add **identity** (wallet login, SIWS) and **authorization** per route.
- Integrate **oracles** or **attestation** programs for NAV, collateral, or redemption events.
- Add **indexing** (Helius, Triton gRPC, Yellowstone) for balances and events instead of polling RPC heavily.

## Contact Information
- Telegram: https://t.me/DevCutup
- Twitter: https://x.com/devcutup
