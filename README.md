# RELL Web

Public landing page for RELL, the rights intelligence layer for tokenized assets.
Pure static site. No build step, no backend, no database.

## Design

Rebuilt from scratch against the light, minimal infrastructure site the client supplied as a
reference. Measured from that page and rewritten here in our own code:

| | Value |
| --- | --- |
| Canvas | Pure white, with `#f0f2f4` washes to separate long stretches |
| Ink | `#16181a`, greys down to `#8d9ca9` |
| Accent | `#7c5cff`, used sparingly |
| Display type | Geist Light, 72px desktop down to 36px mobile, tracking `-0.03em` |
| Body type | Geist Regular at 16px, Geist Mono for labels |
| Nav | A floating pill, 44px tall, blurred white, with a black action pill inside |
| Buttons | Full radius pills, black on white, accent on hover |
| Cards | 12px corners with one oversized 44px bottom left corner |
| Sections | 100px of vertical air, 80px on mobile |

The signature moves it borrows: the floating pill nav, two tone headings where the first line drops
back to grey, a chrome study under the hero, the asymmetric card corner, the pill of coverage logos,
and a quiet FAQ accordion above the footer.

Nothing was taken from the reference itself. No markup, styling, copy, imagery or compiled code.
That page is another company's production build. What carried over are measurements and layout
conventions, rebuilt here.

The floating chrome objects are our own renders, not photography and nothing borrowed: the shapes
are signed distance fields, ray marched against a procedural studio environment in
`tools/make-chrome.py`. That is where chrome gets its look, from a bright sky, a dark horizon band,
a soft floor and two softboxes. Each object ships as a WebP of roughly 15KB. The three verification accents stay semantic:

| Accent | Meaning |
| --- | --- |
| Green | Verified onchain |
| Violet | Verified from issuer |
| Amber | Reported or inferred |

Earlier builds are kept at the `popart-v1` tag and in the git history.

## Structure

```
index.html              entry point, every section in page order
config/contracts.json   contract addresses and the wallet project id (source of truth)
config/contracts.js     generated mirror of the JSON, used when opened from disk
css/tokens.css          colour, type scale, spacing, radii, motion
css/base.css            reset, page shell, layout primitives, typography, reveal
css/components.css      contract bar, nav, sheet, buttons, chips, cards, accordion, footer
css/sections.css        hero, coverage, stats, features, explorer, states, matrix, scope, roadmap
js/config.js            config loader, JSON over http, mirror from disk
js/contract-bar.js      the top bar: Coming soon until a token launches, then copy
js/header.js            scroll state, product dropdown, mobile sheet, active nav link
js/explorer.js          the six categories as a tab list
js/faq.js               the accordion, one answer open at a time
js/reveal.js            scroll reveal
js/main.js              entry point, config binding, contract links, toast
js/wallet.js            wallet connect, an ES module loaded separately
assets/art/             the floating chrome objects, see tools/make-chrome.py
assets/brand/           favicon, apple touch icon, share image
robots.txt              crawl policy, points at the sitemap
sitemap.xml             the one page
vercel.json             caching and security headers
tools/                  sync-config.mjs, check-copy.mjs, make-chrome.py, make-og-image.py
```

## Sections

| Section | What it does |
| --- | --- |
| Contract address bar | Fixed at the very top. Reads Coming soon until a token launches. |
| Hero | The claim in two tones, two actions, and the chrome study. |
| Coverage | One pill naming the network, the asset class and the category count. |
| Stats | Three honest numbers. Nothing here is inflated. |
| Problem | Why a token can look like ownership without being it. |
| The layer | What RELL reads, and three ways a holder uses it. |
| The map | The six categories as a tab list, with checks and usual source. |
| Verification | The three proof levels, one card each. |
| Example | A sample token read claim by claim. Clearly labelled as sample data. |
| Scope | What is covered today, plus the deployed contracts. |
| Roadmap | Four phases with an honest status on each. |
| FAQ | Six questions, answered plainly. |
| Footer | Product and resource links. No social links by request. |

## Contract address bar

The bar at the top is driven by `config/contracts.json`:

1. Set `token.address` and flip `token.launched` to `true`.
2. Run `node tools/sync-config.mjs` so the local file mirror matches.
3. Deploy. No HTML or JS changes needed.

While `launched` is `false` the bar reads Coming soon, even if an address is filled in, and the same
value is mirrored into the scope section. Once live, the bar shows the address, copy writes the real
value, and an explorer link appears when `network.explorerUrl` is set.

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

The nav carries a Connect button, backed by Reown AppKit. It connects and shows the address.
Nothing on the page calls a contract, so this is identity only for now.

AppKit is about 300KB and comes from a CDN, so `js/wallet.js` loads it on demand: on the first
click, and on idle only for a visitor who has connected here before. A blocked CDN leaves the rest
of the page working, and an empty project id hides the button.

**Add `tryrell.xyz` to the allowlist for this project in Reown Cloud** before launch, or
connections will fail in production. Keep `localhost` on the list for local work.

## Run locally

Open `index.html` directly in a browser. It works from disk with no server, reading
`config/contracts.js`. Or serve the folder, which reads `config/contracts.json` directly:

```
python -m http.server 5240
```

## Checks

```
node tools/check-copy.mjs          no dashes, no sentence over 15 words, in any visible string
node tools/sync-config.mjs --check config mirror is up to date
```

`tools/make-chrome.py` re-renders the floating objects, and needs numpy as well. It takes a couple
of minutes per object at the shipped sizes. `tools/make-og-image.py` rebuilds the share card in the
same language as the hero. It needs Pillow,
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
