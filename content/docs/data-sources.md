# Data Sources

RELL combines two categories of information. Neither is sufficient on its own — onchain data tells you what's technically possible, offchain data tells you what's legally and economically true.

## Onchain

Read directly from the blockchain:

- Token contract
- Chain
- Token standard
- Supply
- Transfer permissions
- Pause / freeze functionality
- Contract ownership / admin controls
- Related contracts
- Oracle / reference-price information
- DeFi integrations where verifiable onchain

Onchain data answers questions like: *can* this token be paused, *can* the admin blacklist an address, *is* there a redemption function present.

## Offchain

Authoritative issuer, legal, and asset documentation:

- Terms and conditions
- Issuer documentation
- Legal structure
- Distribution terms
- Redemption rules
- Eligibility requirements
- Corporate action information
- Custodian / underlying-asset information

Offchain data answers questions onchain data structurally cannot: whether the holder has legal ownership, whether dividends are contractually owed, what the custodial arrangement actually is.

## Why Both Are Required

A contract can technically allow permissionless transfer while the issuer's terms impose eligibility restrictions enforced off the smart contract (e.g. at a frontend or custodial layer). Relying on only one source produces an incomplete or misleading rights profile. Every claim in RELL is mapped to whichever source category is actually authoritative for that specific claim.
