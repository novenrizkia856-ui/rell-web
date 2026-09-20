# Problem Statement

## The Core Issue

A tokenized stock or RWA can *look like* the underlying asset without giving the holder all the rights normally associated with owning that asset.

For example, a stock token might provide:

- Economic exposure
- Distribution / dividend entitlement
- Redemption rights
- Transferability
- DeFi / collateral compatibility

But it may **not** provide:

- Legal ownership of the underlying security
- Voting rights
- Direct shareholder rights

## Why It's Hard to Know

Figuring out which of these apply for a given token currently requires reading:

- The token's smart contract
- Issuer terms and conditions
- Legal / custodial structure documents
- Distribution and redemption policies
- Corporate action disclosures

Most holders never do this. Even when they try, the information is scattered across sources that use different terminology, different disclosure standards, and different levels of detail.

## The Consequence

Holders, integrators, and protocols end up making decisions — buying, using as collateral, assuming certain rights exist — based on assumption rather than verified fact. Misunderstanding what a token represents is a structural risk, not just a UX inconvenience.
