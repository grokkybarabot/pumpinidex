# PumpIndex — official site

Live-proof landing page for $PUMPINDEX. No backend, no keys, no funds touched:
the site reads the fee wallet straight from Solana in the visitor's browser and
displays holdings + activity with Solscan links for verification.

## Run locally
    npm install
    npm run dev        # http://localhost:5173

## The only file you edit
`src/site.config.ts`
- `mint` — paste the CA the moment you launch on pump.fun (empty = "Launching soon" mode)
- `pumpFunUrl`, `xUrl`, `telegramUrl` — your links
- `rpcUrl` — swap the public endpoint for a free Helius mainnet URL before going
  live (public RPC gets rate-limited). In the Helius dashboard, restrict the key
  to your domain so it's useless if copied.
- `knownTokens` — add the mints of the xStocks your bot buys, so they show as
  "TSLAx" etc. instead of a shortened address. (With a Helius RPC, names for
  unknown tokens are auto-resolved too.)

## Deploy (Vercel + your domain)
1. Push this folder to a GitHub repo.
2. vercel.com -> Add New Project -> import repo (framework: Vite, build `npm run build`, output `dist`).
3. Project Settings -> Domains -> add your domain, set the DNS records Vercel
   shows you at your registrar (A 76.76.21.21 for the apex, CNAME
   cname.vercel-dns.com for www). HTTPS is automatic.

Every `git push` redeploys. At launch day: paste the CA into site.config.ts,
push, done — buy buttons and CA copy appear automatically.
