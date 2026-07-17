import { CONFIG } from "./site.config";

const TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const TOKEN_2022_PROGRAM = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

export interface Holding {
  mint: string;
  symbol: string;
  name: string;
  uiAmount: number;
}

export interface Activity {
  signature: string;
  blockTime: number | null;
  ok: boolean;
}

export interface WalletData {
  sol: number;
  holdings: Holding[];
  activity: Activity[];
  fetchedAt: number;
}

async function rpc(method: string, params: unknown[]): Promise<any> {
  const res = await fetch(CONFIG.rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!res.ok) throw new Error(`RPC ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error.message ?? "RPC error");
  return json.result;
}

/** Best-effort name resolution via Helius DAS (only if a Helius RPC is configured). */
async function resolveNames(mints: string[]): Promise<Record<string, { symbol: string; name: string }>> {
  const out: Record<string, { symbol: string; name: string }> = {};
  if (!CONFIG.rpcUrl.includes("helius")) return out;
  try {
    const result = await rpc("getAssetBatch", [{ ids: mints }]);
    for (const asset of result ?? []) {
      if (!asset?.id) continue;
      const meta = asset.content?.metadata;
      if (meta?.symbol || meta?.name) {
        out[asset.id] = { symbol: meta.symbol || shortAddr(asset.id), name: meta.name || "" };
      }
    }
  } catch {
    /* metadata is a nice-to-have; ignore failures */
  }
  return out;
}

export async function fetchWalletData(): Promise<WalletData> {
  const w = CONFIG.feeWallet;

  const [balRes, legacy, t22, sigs] = await Promise.all([
    rpc("getBalance", [w, { commitment: "confirmed" }]),
    rpc("getTokenAccountsByOwner", [w, { programId: TOKEN_PROGRAM }, { encoding: "jsonParsed", commitment: "confirmed" }]),
    rpc("getTokenAccountsByOwner", [w, { programId: TOKEN_2022_PROGRAM }, { encoding: "jsonParsed", commitment: "confirmed" }]),
    rpc("getSignaturesForAddress", [w, { limit: CONFIG.activityLimit }]),
  ]);

  const holdings: Holding[] = [];
  for (const acc of [...(legacy?.value ?? []), ...(t22?.value ?? [])]) {
    const info = acc.account?.data?.parsed?.info;
    const amt = info?.tokenAmount;
    if (!info?.mint || !amt || amt.uiAmount === 0) continue;
    holdings.push({
      mint: info.mint,
      symbol: CONFIG.knownTokens[info.mint]?.symbol ?? shortAddr(info.mint),
      name: CONFIG.knownTokens[info.mint]?.name ?? "",
      uiAmount: amt.uiAmount ?? Number(amt.amount) / 10 ** amt.decimals,
    });
  }

  // Fill in names for unknown mints if possible.
  const unknown = holdings.filter((h) => !CONFIG.knownTokens[h.mint]).map((h) => h.mint);
  if (unknown.length > 0) {
    const resolved = await resolveNames(unknown);
    for (const h of holdings) {
      if (resolved[h.mint]) {
        h.symbol = resolved[h.mint].symbol;
        h.name = resolved[h.mint].name;
      }
    }
  }
  holdings.sort((a, b) => b.uiAmount - a.uiAmount);

  const activity: Activity[] = (sigs ?? []).map((s: any) => ({
    signature: s.signature,
    blockTime: s.blockTime ?? null,
    ok: !s.err,
  }));

  return { sol: (balRes?.value ?? 0) / 1e9, holdings, activity, fetchedAt: Date.now() };
}

export function shortAddr(a: string): string {
  return a.length > 12 ? `${a.slice(0, 4)}\u2026${a.slice(-4)}` : a;
}

export function solscanAccount(addr: string): string {
  return `https://solscan.io/account/${addr}`;
}

export function solscanTx(sig: string): string {
  return `https://solscan.io/tx/${sig}`;
}

export function timeAgo(unixSec: number | null): string {
  if (!unixSec) return "";
  const s = Math.max(1, Math.floor(Date.now() / 1000 - unixSec));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
