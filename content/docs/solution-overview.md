# Solution Overview

RELL creates a **plain-English rights profile** for every supported tokenized asset.

A user searches for a token and receives a standardized breakdown across six rights categories (see [Core Concepts](core-concepts.md)), with every claim tied to a source and a verification status (see [Verification System](verification-system.md)).

## Example

A user searches: `AAPL Stock Token`

RELL displays:

| Claim | Status |
|---|---|
| Economic exposure | Yes |
| Dividend / distribution | Yes — according to issuer terms |
| Legal ownership of Apple shares | No |
| Voting rights | No |
| Redemption | Depends on issuer |
| Permissionless transfer | Depends on restrictions |
| DeFi collateral | Depends on integration |
| Current asset status | Active |

Each row is expandable into a plain-language explanation, its verification label, and a link to the underlying source.

## What Makes This Different

RELL does not just show contract data (that's a block explorer) or price/portfolio data (that's a tracker). It answers one specific, narrow question — **"what rights does this token actually carry?"** — by combining onchain evidence with offchain documentation into one standardized, sourced answer.
