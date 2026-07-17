// ============================================================
// PUMPINDEX SITE CONFIG — the only file you need to edit.
// ============================================================

export const CONFIG = {
  name: "PumpIndex",
  ticker: "PUMPINDEX",

  // Your fee/payout wallet. All live data on the site is read from this
  // address, in the visitor's browser, straight from Solana.
  feeWallet: "J3xNhgTKsmUGVGtLFC7r4KvPKRiPRuKwhAkDsmxHgVve",

  // Paste your coin's mint address (the CA from pump.fun) here once live.
  // Leave empty ("") before launch — the site shows "Launching soon".
  mint: "7waeW9SiTkvrtQNJhxwFVFgwCStSeFFVKTPmNZY1pump",

  // Links. Leave "" to hide a button.
  pumpFunUrl: "", // e.g. "https://pump.fun/coin/7waeW9SiTkvrtQNJhxwFVFgwCStSeFFVKTPmNZY1pump" — filled after launch
  xUrl: "https://x.com/PumpIndexsol",
  telegramUrl: "",

  // RPC endpoint used for live reads. The public endpoint works but is
  // rate-limited; for production use a free Helius key with your domain
  // allow-listed in the Helius dashboard:
  // "https://mainnet.helius-rpc.com/?api-key=d0917e73-7caf-4a0a-9060-fb96400f41b6"
  rpcUrl: "https://mainnet.helius-rpc.com/?api-key=d0917e73-7caf-4a0a-9060-fb96400f41b6",

  // Friendly names for mints the bot buys. Anything not listed still shows,
  // just as a shortened mint address. Add your xStocks here as you learn
  // their mints (each xStock product page lists its Solana mint).
  knownTokens: {
    EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: { symbol: "USDC", name: "USD Coin" },
    So11111111111111111111111111111111111111112: { symbol: "wSOL", name: "Wrapped SOL" },
  } as Record<string, { symbol: string; name: string }>,

  // How many recent wallet transactions to show in the activity feed.
  activityLimit: 12,
};
