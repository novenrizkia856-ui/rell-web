# Data Model

Every asset tracked by RELL follows one standardized structure. This keeps every profile comparable regardless of asset type or issuer.

```
Asset
├── Identity
│   ├── Name
│   ├── Symbol
│   ├── Contract
│   ├── Chain
│   └── Underlying Asset
│
├── Ownership
│   ├── Legal Ownership
│   └── Token Representation
│
├── Economic Claims
│   ├── Economic Exposure
│   ├── Dividends / Distributions
│   └── Redemption
│
├── Control Rights
│   ├── Voting
│   └── Governance
│
├── Transfer Rights
│   ├── Transferability
│   ├── Restrictions
│   └── Eligibility
│
├── DeFi Compatibility
│   ├── Collateral
│   ├── Lending
│   └── Other Integrations
│
├── Status
│   ├── Active
│   ├── Paused
│   ├── Restricted
│   └── Corporate Action
│
└── Sources
    ├── Onchain
    ├── Issuer
    ├── Legal
    └── Last Updated
```

## Notes on the Model

- **Identity** anchors the profile to one specific contract on one specific chain — no cross-chain ambiguity.
- Each leaf node under Ownership / Economic Claims / Control Rights / Transfer Rights / DeFi Compatibility carries its own verification label (see [Verification System](verification-system.md)) — the model is not scored as a whole, but claim by claim.
- **Sources** is not metadata bolted on at the end — it is a first-class part of the model. A claim without a traceable source should not be presented as a claim.
- **Last Updated** exists at the asset level because status and rights can change (corporate actions, contract upgrades, revised terms) — see [System Mechanism](system-mechanism.md) for how freshness is maintained.
