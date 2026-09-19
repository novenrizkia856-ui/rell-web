# Reference Frontend Audit

Source: saved Next.js page `Pull Your Next Grail _ PULL.FUN.html` plus its `_files` folder.
This is step 1 of the build brief. Every item below has a home in the RELL page.
The right column says where it lives now.

## Sections and cards, in page order

| # | Reference block | Contents | RELL block |
|---|---|---|---|
| 0 | (new) | none | Contract address bar, topmost, `#ca-bar` |
| 1 | Ticker strip | Brand bar, phrase repeated 8x in two halves, `ticker 72s linear infinite` | Ticker strip under the CA bar, RELL phrases |
| 2 | Header nav | Sticker wordmark, 5 links (first has a "New" tag), language dropdown, Log in, Sign Up, mobile sheet trigger | RELL logo, 5 section links ("Verification" carries the tag), network dropdown, Contract, Explore, mobile sheet |
| 3 | Hero | 480px layered art panel: layer1 bg, layer2 flare counter, layer3 flare, layer4 bob, layer5 mascot bob, 4 sparkles; H1 with accent span; 3 icon pills | Same panel and layer stack, abstract geometry; H1, one supporting line, 3 pills |
| 4 | "Open packs" | Section badge + 5 pack tiles (field bg, 2 tilted slabs, pack, price chip, title, sticker button) | Problem: badge + 5 signal tiles (looks like / may only be) |
| 5 | "Recent pulls" | Revealed badge, auto scrolling track with edge fades, cards (slab art, rarity tag, title, FMV value), card detail dialog | Solution: six rights category cards on the same track, detail dialog kept |
| 6 | "Got a grail? Put it back to work." | Centered badge + paragraph, 4 cards (title, hover animated art, caption chip), sticker CTA | Verification: 3 state badges + 1 "Not Yet Mapped" card, CTA |
| 7 | "The receipts" | Revealed header, snapshot pill, 4 column head, 6 staggered rows with colored tier dot | Example: rights matrix, 6 claims, status and source |
| 7b | (new, brief item 8) | none | Scope: Robinhood Chain and Stock Tokens |
| 8 | CTA banner | Background art, 6 rotated slabs with hover drift, H2, sticker button | Positioning statement panel, 6 glass token slabs |
| 9 | Footer | Zigzag edge, wordmark, copyright, 3 link columns | Logo, one line, 2 link columns (social links removed on request) |
| 10 | Floating music orb | Round glass button, mobile close chip | Floating back to top orb, mobile close chip |
| 11 | Toast region | Empty live region | Live region used for copy feedback |

## Animation triggers (timing kept exactly)

| Name | Trigger | Timing |
|---|---|---|
| `ticker` | always | 72s linear infinite, translate 0 to -50% |
| header background | `scrollY > 32` | 300ms `background-color, box-shadow` |
| `hero-drift` | always | 9s ease-in-out, scale 1.04, translate -10px 4px |
| `hero-flare` | always | 5.8s, origin 60% 55%, scale 1.03 rotate 1deg |
| `hero-flare-counter` | always | 5.1s, origin 65% 60%, scale 1.04 rotate -1.2deg |
| `hero-bob` | always | 4.6s, origin 55% 80%, translateY -6px rotate -1.2deg |
| `hero-twinkle` | always | 2.6s default, inline 2.8s / 2.4s+0.8s / 3.2s+1.4s / 2.1s+0.4s |
| hero hover | panel hover | bg 700ms scale 1.03; layer2 500ms rotate 2.5 scale 1.07; layer3 500ms delay 75 rotate -3 scale 1.09; layer5 500ms up 12px rotate -3 scale 1.02; sparkles 300ms scale 1.5 with delays 0/100/150/75 |
| `tile-field` | tile hover / active | rest scale 1.1 translate 4%, 420ms cubic-bezier(.22,1,.36,1); hover scale 1.26, 220ms cubic-bezier(.34,1.56,.64,1); active 110ms |
| `tile-pack` | tile hover / active | rest rotate -2deg; hover scale 1.09 up 8px; same curves |
| tile slabs | tile hover | 500ms ease-out, rotate 12 to 16deg and -7 to -11deg |
| `sticker-btn` | active | face drops 6px in 90ms, under shadow removed |
| reveal (recent pulls badge) | in view once, margin -60px | opacity 0, y 15, 0.5s |
| reveal (receipts header) | in view once, margin -80px | opacity 0, y 20, 0.6s |
| reveal (receipts rows) | in view once, margin -40px | opacity 0, y 14, 0.35s, delay 0.04 x index |
| marquee track | rAF | 36 px/s, dt cap 0.1s, hover pauses, wheel / pointer / manual scroll pause 1.5s, seamless wrap, min 16 items |
| `card-shimmer` | while loading | 1.8s ease-in-out infinite, translate -100% to 100% |
| `grail-tick / bob / burst / sway` | card hover (play state) | 5.5s / 4.2s / 3.4s / 6.5s ease-in-out |
| `cta-slab` | panel hover | 420ms cubic-bezier(.22,1,.36,1), translate by dx dy and rotate by spin |
| reduced motion | `prefers-reduced-motion` | all loops off, transitions off |

## Color variables in the reference

| Variable | Value | Replaced by |
|---|---|---|
| `--brand` | `#fe62a1` | Hot Pink `#FF007A`, the primary action color |
| `--brand-orange` | `#f18200` | Closing panel now dark slate with pop gradients |
| `--brand-yellow` | `#fec400` | Electric Yellow `#FFE600` (reported state, tags) |
| `--brand-blue` | `#0576ff` | Mint Green `#00FF85` (onchain state only) |
| `--surface-base` | `#10111a` | `--bg #0B0E17` |
| `--surface-raised` | `#19192a` | `--surface #161B26`, 1px `#2A3245` stroke |
| footer bg | `#19182a` | `--surface` |
| muted text | `#6c6c93`, `#7677A2` | `--text-2 #9A9AA5` |
| foreground | `#ebe7e0` | `--text-1 #F5F5F7` |
| sticker button | `#e23681 / #fe62a0 / #feb1d0` | violet under, face, inset |
| tier colors | pink, amber, purple, sky, emerald, white | mint, purple, yellow verification states |

## Assets removed as cartoon or playful

All raster art: `layer1..5.png` (comic burst, mascot octopus), `sparkle-*.png`, `field-*.png` (comic starbursts),
`pack-*.png`, `grail-*.png` (clip art clock, cash), `cta-banner-bg.png`, card photos, sticker wordmark and hand lettered labels.
Each was replaced by inline geometric SVG drawn for this site.
