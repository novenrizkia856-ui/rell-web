# RELL Web

Public landing page for RELL, the rights intelligence layer for tokenized assets.
Pure static site. No build step, no backend, no database.

## Design

Rebuilt in September 2026. The client asked for the structure and feel of a well known
infrastructure marketing site, so the page follows that kind of information architecture: a large
quiet hero, a coverage strip, alternating proof and narrative blocks, an interactive section, a
worked example, then a closing call to action.

Everything here is written from scratch. No markup, styling, copy or imagery was taken from any
other site. The visual system is a calm paper canvas, hairline borders, generous space, large type
at medium weight, and colour used only where it carries meaning.

The three accents are semantic and never decorative:

| Accent | Meaning |
| --- | --- |
| Green | Verified Onchain |
| Violet | Verified From Issuer |
| Amber | Reported Inferred |

The previous pop art build is kept at the `popart-v1` tag if it is ever needed.

## Structure

```
index.html              entry point, every section in page order
config/contracts.json   contract addresses and the wallet project id (source of truth)
config/contracts.js     generated mirror of the JSON, used when opened from disk
css/tokens.css          colour, type scale, spacing, radii, motion
css/base.css            reset, page shell, layout primitives, typography helpers
css/motion.css          the reveal system and reduced motion handling
css/components.css      buttons, header, sheet, badges, cards, strip, toast
css/sections.css        hero, rights table, stats, proof, explorer, contracts, cta, footer
js/config.js            config loader, JSON over http, mirror from disk
js/header.js            sticky state, mobile sheet, active nav link
js/explorer.js          the six categories as a tab list
js/reveal.js            scroll reveal
js/main.js              entry point, config binding, contract links, toast
js/wallet.js            wallet connect, an ES module loaded separately
assets/brand/           favicon, apple touch icon, share image
robots.txt              crawl policy, points at the sitemap
sitemap.xml             the one page
vercel.json             caching and security headers
tools/                  sync-config.mjs, check-copy.mjs, make-og-image.py (not deployed)
```

## Sections

| Section | What it does |
| --- | --- |
| Hero | The claim, two actions, and a sample rights profile as the one piece of product art. |
| Coverage strip | A quiet marquee of what RELL covers today. |
| Problem | Why a token can look like ownership without being it. |
| Stats | Four honest numbers. Nothing here is inflated. |
| Verification | The three proof levels, one card each. |
| Statement | A single line on what RELL does when a right cannot be checked. |
| The map | The six categories as a tab list, with the checks and usual source for each. |
| Example | A sample token read claim by claim. Clearly labelled as sample data. |
| Onchain | The two deployed contracts, linked to the explorer. |
| Closing | The final call to action. |

## Contract addresses

`config/contracts.json` is the source of truth and carries the live contracts on Robinhood Chain
mainnet, chain id 4663:

| Key | Address |
| --- | --- |
| `contracts.rightsRegistry` | `0xDFfFe7974067D5Deb5020Da1c64A182E2a9aeD92` |
| `contracts.verificationOracle` | `0xBC2236547FfFC98C30b575686bc3E3953D033838` |

Addresses link to the explorer only when both the address and `network.explorerUrl` are set.
Otherwise the row stays plain text. There is no RELL token yet, so `token` stays empty.

## Wallet connect

The nav and the mobile sheet carry a Connect Wallet button, backed by Reown AppKit. It connects and
shows the address. Nothing on the page calls a contract, so this is identity only for now.

AppKit is about 300KB and comes from a CDN, so `js/wallet.js` loads it on demand: on the first
click, and on idle only for a visitor who has connected here before. A blocked CDN leaves the rest
of the page working, and an empty project id hides the button.

**Add `tryrell.xyz` to the allowlist for this project in Reown Cloud** before launch, or
connections will fail in production. Keep `localhost` on the list for local work.

## Run locally

Open `index.html` directly in a browser. It works from disk with no server, reading
`config/contracts.js`. Or serve the folder, which reads `config/contracts.json` directly:

```
python -m http.server 4178
```

## Checks

```
node tools/check-copy.mjs          no dashes, no sentence over 15 words, in any visible string
node tools/sync-config.mjs --check config mirror is up to date
```

`tools/make-og-image.py` regenerates `assets/brand/og-image.png` from code. It needs Pillow and the
Inter variable font at `%TEMP%/inter.ttf`, and is only run when the share card design changes.

## Deploy

Vercel, framework preset "Other", no build command, output directory is the project root.
`vercel.json` sets no store caching on `config/` so address updates show at once, a day of caching
on brand assets, and `nosniff`, `Referrer-Policy` and `X-Frame-Options` on everything.
`.vercelignore` keeps `tools/` and `docs/` out of the deployment.

The canonical host is `https://tryrell.xyz`, hard coded in four places, so a domain change means
editing all four:

- `<link rel="canonical">` and `og:url` in `index.html`
- `og:image` in `index.html`
- `Sitemap:` in `robots.txt`
- `<loc>` in `sitemap.xml`
