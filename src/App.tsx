import { useEffect, useState } from "react";
import { CONFIG } from "./site.config";
import {
  type WalletData,
  fetchWalletData,
  shortAddr,
  solscanAccount,
  solscanTx,
  timeAgo,
} from "./chain";

const preLaunch = !CONFIG.mint;

function Tape({ data }: { data: WalletData | null }) {
  const items =
    data && data.holdings.length > 0
      ? data.holdings.map((h) => ({
          key: h.mint,
          text: `${h.symbol} ${h.uiAmount.toLocaleString("en-US", { maximumFractionDigits: 4 })}`,
        }))
      : [{ key: "none", text: preLaunch ? "AWAITING LAUNCH \u2014 FEE WALLET LIVE ON-CHAIN" : "AWAITING FIRST STOCK BUY \u2014 VERIFY THE WALLET ON SOLSCAN" }];
  const row = [...items, ...items, ...items, ...items];
  return (
    <div className="tape" aria-label="Live holdings of the fee wallet">
      <div className="tape-inner">
        {row.map((it, i) => (
          <span className="tape-item" key={`${it.key}-${i}`}>
            <span className="tape-dot" aria-hidden="true">&#9670;</span> {it.text}
          </span>
        ))}
      </div>
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="step">
      <span className="step-n">{n}</span>
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}

export default function App() {
  const [data, setData] = useState<WalletData | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  async function refresh() {
    setLoading(true);
    setErr(null);
    try {
      setData(await fetchWalletData());
    } catch (e: any) {
      setErr("Live data unavailable right now (RPC limit). Verify directly on Solscan instead.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 90_000);
    return () => clearInterval(t);
  }, []);

  function copyCa() {
    if (!CONFIG.mint) return;
    navigator.clipboard?.writeText(CONFIG.mint).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  const buyUrl = CONFIG.pumpFunUrl || (CONFIG.mint ? `https://pump.fun/coin/${CONFIG.mint}` : "");

  return (
    <div className="page">
      <header className="top">
        <span className="wordmark">PUMP<span>INDEX</span></span>
        <nav className="top-nav">
          <a href="#proof">Proof</a>
          <a href="#how">How it works</a>
          <a className="ext" href={solscanAccount(CONFIG.feeWallet)} target="_blank" rel="noreferrer">
            Solscan &#8599;
          </a>
          {buyUrl ? (
            <a className="btn btn-amber" href={buyUrl} target="_blank" rel="noreferrer">Buy ${CONFIG.ticker}</a>
          ) : (
            <span className="btn btn-ghost soon">Launching soon</span>
          )}
        </nav>
      </header>

      <section className="hero">
        <h1>
          Hold the index.<br />
          <em>Get real stocks.</em>
        </h1>
        <p className="lede">
          100% of ${CONFIG.ticker} creator fees are used to buy tokenized stocks
          on Solana &mdash; and the stocks are sent straight to holder wallets.
          Automated, and fully verifiable on-chain. Don&rsquo;t trust it: check it.
        </p>
        <div className="hero-ctas">
          {buyUrl ? (
            <a className="btn btn-amber big" href={buyUrl} target="_blank" rel="noreferrer">Buy on pump.fun</a>
          ) : (
            <span className="btn btn-ghost big soon">Launching on pump.fun</span>
          )}
          <a className="btn btn-ghost big" href={solscanAccount(CONFIG.feeWallet)} target="_blank" rel="noreferrer">
            Verify the wallet &#8599;
          </a>
        </div>
        <Tape data={data} />
      </section>

      <section className="proof" id="proof">
        <div className="proof-head">
          <h2>The wallet doesn&rsquo;t lie</h2>
          <button className="btn btn-ghost small" onClick={refresh} disabled={loading}>
            {loading ? "Refreshing\u2026" : "Refresh"}
          </button>
        </div>
        <p className="proof-sub">
          Everything below is read live from Solana in your browser &mdash; nothing on this
          page is typed in by us.
        </p>
        {err && <p className="warn">{err}</p>}

        <div className="proof-grid">
          <div className="panel">
            <h3>Fee wallet</h3>
            <a className="addr mono" href={solscanAccount(CONFIG.feeWallet)} target="_blank" rel="noreferrer">
              {CONFIG.feeWallet}
            </a>
            <div className="kv">
              <span>SOL balance</span>
              <span className="mono">{data ? data.sol.toLocaleString("en-US", { maximumFractionDigits: 4 }) : "\u2014"}</span>
            </div>
            <div className="kv">
              <span>Assets held</span>
              <span className="mono">{data ? data.holdings.length : "\u2014"}</span>
            </div>
            <div className="kv">
              <span>Updated</span>
              <span className="mono">{data ? new Date(data.fetchedAt).toLocaleTimeString() : "\u2014"}</span>
            </div>
          </div>

          <div className="panel">
            <h3>Stock holdings</h3>
            {!data || data.holdings.length === 0 ? (
              <p className="muted">
                {preLaunch
                  ? "Empty until launch \u2014 once trading starts, every stock the bot buys shows up here automatically."
                  : "No token holdings right now. Bought stocks appear here between purchase and distribution."}
              </p>
            ) : (
              <table>
                <thead>
                  <tr><th>Asset</th><th className="num">Amount</th><th className="num">Verify</th></tr>
                </thead>
                <tbody>
                  {data.holdings.slice(0, 10).map((h) => (
                    <tr key={h.mint}>
                      <td><span className="mono">{h.symbol}</span>{h.name ? <span className="dim"> {h.name}</span> : null}</td>
                      <td className="num mono">{h.uiAmount.toLocaleString("en-US", { maximumFractionDigits: 4 })}</td>
                      <td className="num"><a className="ext" href={`https://solscan.io/token/${h.mint}`} target="_blank" rel="noreferrer">&#8599;</a></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="panel">
            <h3>Wallet activity</h3>
            {!data || data.activity.length === 0 ? (
              <p className="muted">No transactions yet. Buys and holder payouts will stream in here, each one linked to Solscan.</p>
            ) : (
              <ul className="feed">
                {data.activity.map((a) => (
                  <li key={a.signature}>
                    <a className="mono" href={solscanTx(a.signature)} target="_blank" rel="noreferrer">
                      {shortAddr(a.signature)}
                    </a>
                    <span className="dim">{timeAgo(a.blockTime)}</span>
                    <span className={a.ok ? "ok" : "fail"}>{a.ok ? "confirmed" : "failed"}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="how" id="how">
        <h2>How it works</h2>
        <div className="steps">
          <Step n="I" title={`Buy $${CONFIG.ticker}`} body="Trade the coin on pump.fun like any other. Just holding it is enough — no staking, no claiming, no lockups." />
          <Step n="II" title="Creator fees accrue" body="Every trade generates creator fees, which land in the fee wallet shown above. Public address, public balance." />
          <Step n="III" title="The bot buys stocks" body="An automated program watches the wallet. When fees arrive, it market-buys tokenized stocks (xStocks) on Solana." />
          <Step n="IV" title="Stocks hit your wallet" body="The bot distributes the stocks to holder wallets, pro-rata to holdings. They arrive as tokens you own — check Solscan." />
        </div>
      </section>

      <section className="creed">
        <h2>Why this one is different</h2>
        <p>
          Projects like this live or die on trust, so we removed the need for it. The fee
          wallet is public. The buys are public. The payouts are public. This site has no
          backend and touches no funds &mdash; it only reads the chain and shows you what&rsquo;s
          there. If the numbers ever stop moving, you&rsquo;ll see that too. That&rsquo;s the deal.
        </p>
      </section>

      <footer className="foot">
        <div className="foot-row">
          <span className="dim">CA</span>
          {CONFIG.mint ? (
            <button className="ca mono" onClick={copyCa} title="Copy contract address">
              {CONFIG.mint} {copied ? "\u2713 copied" : "\u29C9"}
            </button>
          ) : (
            <span className="mono">announced at launch</span>
          )}
        </div>
        <div className="foot-row">
          <span className="dim">Fee wallet</span>
          <a className="mono" href={solscanAccount(CONFIG.feeWallet)} target="_blank" rel="noreferrer">{CONFIG.feeWallet}</a>
        </div>
        <div className="foot-links">
          {CONFIG.xUrl && <a href={CONFIG.xUrl} target="_blank" rel="noreferrer">X / Twitter</a>}
          {CONFIG.telegramUrl && <a href={CONFIG.telegramUrl} target="_blank" rel="noreferrer">Telegram</a>}
          <a href={solscanAccount(CONFIG.feeWallet)} target="_blank" rel="noreferrer">Solscan</a>
        </div>
        <p className="disclaimer">
          ${CONFIG.ticker} is a memecoin. Nothing here is financial advice, and rewards are
          not guaranteed. Tokenized stocks are provided by third parties and are not
          available to residents of all jurisdictions. Crypto assets can lose all value.
          Do your own research.
        </p>
      </footer>
    </div>
  );
}
