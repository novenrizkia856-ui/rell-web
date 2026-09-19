# RELL Web

Public landing page for RELL, the rights intelligence layer for tokenized assets.
Pure static site. No build step, no backend, no database.

## Structure

```
index.html              entry point, every section in page order
config/contracts.json   contract addresses (source of truth)
config/contracts.js     generated mirror of the JSON, used when opened from disk
css/tokens.css          colors, type, spacing, motion curves
css/base.css            reset, page shell, typography helpers
css/motion.css          keyframes and reveal system carried over from the reference
css/components.css      CA bar, ticker, header, buttons, badges, dropdown, sheet, orb
css/sections.css        hero, problem, solution, verification, example, scope, statement, footer
js/                     config loader, contract bar, header, marquee, dialog, reveal, main
js/wallet.js            wallet connect, an ES module loaded separately
assets/brand/           favicon, apple touch icon, logo, share image
robots.txt              crawl policy, points at the sitemap
sitemap.xml             the one page
vercel.json             caching and security headers
tools/                  sync-config.mjs, check-copy.mjs, make-og-image.py (not deployed)
docs/reference-audit.md section, card, animation and color audit of the reference
```

## Contract addresses

`config/contracts.json` is the source of truth and already carries the live protocol contracts on
Robinhood Chain mainnet, chain id 4663:

| Key | Address |
| --- | --- |
| `contracts.rightsRegistry` | `0xDFfFe7974067D5Deb5020Da1c64A182E2a9aeD92` |
| `contracts.verificationOracle` | `0xBC2236547FfFC98C30b575686bc3E3953D033838` |

`token.address` is empty and `token.launched` is `false` on purpose. There is no RELL token yet, so
the Contract Address bar shows Coming Soon. The copy button stays visible with a short "Soon" state.

### When a token does launch

1. Edit `config/contracts.json`: set `token.address`, set `token.launched` to `true`.
2. Run `node tools/sync-config.mjs` so the file mirror matches.
3. Deploy. No HTML or JS changes are needed.

## Wallet connect

The nav and the mobile sheet carry a Connect Wallet button, backed by Reown AppKit. It connects and
shows the address. Nothing on the page calls a contract, so this is identity only for now.

Reown AppKit is about 300KB and comes from a CDN, so `js/wallet.js` loads it on demand rather than
on every page load:

- on the first click, with the button showing a pending state
- on idle, but only for a visitor who has connected here before, so their session is restored
  without a click

A blocked or failed CDN leaves the rest of the page working. If `walletConnect.projectId` is empty
the button hides itself rather than offering an action that can only fail.

### Before the domain goes live

The project id in `config/contracts.json` is a public client identifier, not a secret, and is meant
to ship in client code. It is origin restricted though, so **add `tryrell.xyz` to the allowlist for
this project in Reown Cloud** or connections will fail in production. Keep `localhost` on the list
for local work.

The wallet list in the modal is served by Reown, and AppKit drops the WalletConnect QR row at narrow
widths by design, offering wallet deep links instead. That is AppKit behaviour, not a bug.

## Run locally

Open `index.html` directly in a browser. It works from disk with no server.
The config is read from `config/contracts.js` in that case.

Or serve the folder, which reads `config/contracts.json` directly:

```
python -m http.server 5230
```

## Checks

```
node tools/check-copy.mjs          no dashes, no sentence over 15 words, in any visible string
node tools/sync-config.mjs --check config mirror is up to date
```

`tools/make-og-image.py` regenerates `assets/brand/og-image.png` from code. It needs Pillow and the
Rubik variable font at `%TEMP%/rubik.ttf`, and is only run when the share card design changes.

## Deploy

Vercel, framework preset "Other", no build command, output directory is the project root.
`vercel.json` sets no-store caching on `config/` so address updates show at once, a day of caching
on brand assets, and `nosniff`, `Referrer-Policy` and `X-Frame-Options` on everything.
`.vercelignore` keeps `tools/` and `docs/` out of the deployment.

The canonical host is `https://tryrell.xyz`. It is hard coded in four places, so a domain change
means editing all four:

- `<link rel="canonical">` and `og:url` in `index.html`
- `og:image` in `index.html`
- `Sitemap:` in `robots.txt`
- `<loc>` in `sitemap.xml`

Point the apex and `www` at Vercel and let it issue the certificate. Once live, run the link through
a card debugger to confirm the share image resolves.
