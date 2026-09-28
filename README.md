# RELL Web

Public site and read only dapp for RELL, the rights intelligence layer for tokenized assets.
The deployment is static. The dapp reads the onchain registry through public JSON RPC and loads
the profile document anchored by each record. No backend or database is required.

## Design

The landing page is the Aureum Framer template ("Design at the speed of intelligence"), supplied by
the client as a SingleFile save and reworked for RELL. The export's markup and CSS are kept as they
were; only the copy, the logo and the product pieces changed.

| | Value |
| --- | --- |
| Canvas | Cream `#f3f1ed`, with night `#1d1d1d` and black sections |
| Ink | `#000`, grey `#949494` for secondary text |
| Display type | Ancizar Serif, 55px titles, the hero wordmark set at 500px |
| Body type | TASA Orbiter, with Bitcount Grid Single for mono labels and buttons |
| Nav | A floating blurred bar, 20px from the top, logo centred, dark over dark sections |
| Buttons | Black label block plus a square arrow block, the arrow slides on hover |
| Art | Marble sculptures in painted Tuscan landscapes, from the template |

How the landing is built:

- `index.html` is the export with RELL copy. Framer class names and inline styles stay, so the
  template CSS keeps applying. Edit copy in place.
- `css/template.css` holds the export's styles verbatim, with fonts and images pointed at files in
  `assets/fonts/` and `assets/img/` instead of data URIs. Do not hand edit it.
- `css/landing.css` restores what the static export lost (motion start states, the tablet and phone
  layouts of multi column sections, the mobile menu, the accordion) and styles the RELL additions:
  the contract address pill, the statement block and the source names strip.
- `js/landing.js` restores the Framer runtime behaviour: the intro curtain and loader, the scroll
  linked hero, the statement word reveal, the growing problem card, count ups, the process fade to
  black, both tickers, the FAQ accordion and the nav. It also binds `config/contracts.json`.

The app and docs pages use the same language through `css/site.css` (fonts, bar, buttons, footer),
with `css/app.css` and `css/docs.css` on top.

**Licensing.** The template's paintings (`assets/img/`) and its layout come from the Framer template.
Confirm the template licence covers this use before launch. The fonts are Google Fonts under the OFL.

The three verification accents stay semantic in the app:

| Accent | Meaning |
| --- | --- |
| Green | Verified onchain |
| Violet | Verified from issuer |
| Amber | Reported or inferred |

Earlier builds are kept at the `popart-v1` tag and in the git history.

## Structure

```
index.html              landing, the Aureum export with RELL copy
app.html                live rights lookup app
docs.html               generated, do not edit by hand, see tools/build-docs.mjs
config/contracts.json   contract addresses and the wallet project id (source of truth)
config/contracts.js     generated mirror of the JSON, used when opened from disk
css/template.css        the export's styles, verbatim
css/landing.css         landing overrides and RELL pieces
css/site.css            shared shell for app and docs: fonts, bar, sheet, buttons, footer
css/app.css             the live app only
css/docs.css            the docs page only
js/config.js            config loader, JSON over http, mirror from disk
js/contract-bar.js      the hero pill: Coming soon until a token launches, then copy
js/landing.js           landing motion, nav, tickers, accordion, config binding
js/header.js            bar state and mobile sheet for app and docs
js/wallet.js            wallet connect, an ES module loaded separately
js/app.js               registry RPC reader, profile loader and integrity check
content/docs/           the documentation source, markdown, ordered by SUMMARY.md
content/brand/          the logo kit as supplied, the source the svg was traced from
assets/brand/           the logo in svg, favicon, apple touch icon, share image
assets/fonts/           Ancizar Serif, TASA Orbiter, Bitcount Grid Single, Azeret Mono
assets/img/             the template paintings
robots.txt              crawl policy, points at the sitemap
sitemap.xml             the landing page and the docs page
vercel.json             caching and security headers
tools/                  sync-config.mjs, check-copy.mjs, check-app.mjs, build-docs.mjs,
                        make-og-image.py
```

## Sections

| Section | What it does |
| --- | --- |
| Hero | Title, contract address pill, the RELL wordmark and two flying sculptures. |
| Statement | The client's one line description, revealed word by word on scroll. |
| The problem | A card that grows to full width while the section is pinned. |
| At a glance | Three numbers that count up: categories, verification states, sourced claims. |
| How it works | Four steps with a sticky index. The section fades to black at the end. |
| The rights map | The six categories as a ticker of cards, each with its question and usual source. |
| Sources | A ticker of the public sources RELL reads. |
| FAQ | Six questions in an accordion. |
| Call to action | Into the app. |
| Footer | Product, resources and the deployed contracts. No social links by request. |
| Docs | A separate page, linked from the top menu, built from markdown. |

## Contract address bar

The pill in the hero is driven by `config/contracts.json`:

1. Set `token.address` and flip `token.launched` to `true`.
2. Run `node tools/sync-config.mjs` so the local file mirror matches.
3. Deploy. No HTML or JS changes needed.

While `launched` is `false` the pill reads Coming soon, even if an address is filled in. Once live, it
shows the address, copy writes the real value, and an explorer link appears when
`network.explorerUrl` is set.

## Contract addresses

`config/contracts.json` is the source of truth and carries the live contracts on Robinhood Chain
mainnet, chain id 4663:

| Key | Address |
| --- | --- |
| `contracts.rightsRegistry` | `0xDFfFe7974067D5Deb5020Da1c64A182E2a9aeD92` |
| `contracts.verificationOracle` | `0xBC2236547FfFC98C30b575686bc3E3953D033838` |

The footer's Contracts column links each one to the explorer when both the address and
`network.explorerUrl` are set. Otherwise the entry stays plain text. There is no RELL token yet, so `token` stays empty.

## Wallet connect

The nav carries a Connect button, backed by Reown AppKit. It connects and shows the address.
Nothing on the page calls a contract, so this is identity only for now.

AppKit is about 300KB and comes from a CDN, so `js/wallet.js` loads it on demand: on the first
click, and on idle only for a visitor who has connected here before. A blocked CDN leaves the rest
of the page working, and an empty project id hides the button.

**Add `tryrell.xyz` to the allowlist for this project in Reown Cloud** before launch, or
connections will fail in production. Keep `localhost` on the list for local work.

## RELL app

`/app` is the production dapp entry point. It accepts an EVM token address, calls
`RightsRegistry.getRecord` on Robinhood Chain, and loads the JSON profile from its onchain URI.
IPFS and Arweave pointers are converted to browser friendly gateway URLs. When a document is
available, its raw bytes are checked against the onchain Keccak hash before the claims are shown.

The tracked asset list is discovered from registry events beginning at the configured deployment
block. An empty list is valid before the first asset is registered; direct lookup remains available.
No wallet connection is required for reads.

## Brand

The logo arrived as 4167px artwork. It is traced to vector once and used as svg
everywhere, so it stays sharp and weighs under 4kb.

| File | Where it goes |
| --- | --- |
| `assets/brand/logo-lockup.svg` | Nav, mobile sheet, footer, docs header |
| `assets/brand/logo-lockup-inverse.svg` | The same lockup for a dark surface |
| `assets/brand/logo-mark.svg` | The mark alone, no wordmark |
| `assets/brand/logo-mark-inverse.svg` | The mark alone for a dark surface |
| `assets/brand/favicon.svg` | Browser tab, white mark on a near black chip |
| `assets/brand/apple-touch-icon.png` | Home screen, and the wallet dialog icon |
| `assets/brand/og-image.png` | Link previews, built by tools/make-og-image.py |

The originals live in `content/brand/`, outside the web root. The client asked
for the logo without blue, so the site uses the monochrome art only: near black
`#16181a` on light surfaces, white on dark ones. `--brand` in `css/site.css`
carries that ink, and focus rings follow `currentColor` so they show on both.
The blue `#0946f7` art stays in `content/brand/` for reference only. The purple
in the verification palette is unrelated and stays put.

## Docs page

`docs.html` is generated. Never edit it by hand, the next build overwrites it.

1. Edit or add a markdown file in `content/docs/`.
2. List it in `content/docs/SUMMARY.md`, which sets the order and the titles.
3. Run `node tools/build-docs.mjs`.

The markdown lives outside the web root so it cannot collide with the published `/docs` URL.
Links between documents are rewritten to anchors on the single page, so `[Data Model](data-model.md)`
lands on that section. One mermaid flowchart is redrawn as a numbered list, no library needed.

## Run locally

Open `index.html` directly in a browser. It works from disk with no server, reading
`config/contracts.js`. Or serve the folder, which reads `config/contracts.json` directly:

```
python -m http.server 5240
```

## Checks

```
node tools/check-copy.mjs          no dashes, no sentence over 15 words, in any visible string
node tools/check-app.mjs           ABI decoder, app config and public entry points
node tools/build-docs.mjs          regenerates docs.html, run after editing content/docs/
node tools/sync-config.mjs --check config mirror is up to date
```

`tools/make-og-image.py` rebuilds the share card. It needs Pillow,
and picks up the Geist variable font from `%TEMP%/geist.ttf` when it is there, falling back to Segoe
UI otherwise.

## Deploy

Vercel, framework preset "Other", no build command, output directory is the project root.
`vercel.json` sets no store caching on `config/` so address updates show at once, a day of caching
on brand assets, and `nosniff`, `Referrer-Policy` and `X-Frame-Options` on everything.

The canonical host is `https://tryrell.xyz`, hard coded in four places, so a domain change means
editing all four:

- `<link rel="canonical">` and `og:url` in `index.html`
- `og:image` in `index.html`
- `Sitemap:` in `robots.txt`
- `<loc>` in `sitemap.xml`
