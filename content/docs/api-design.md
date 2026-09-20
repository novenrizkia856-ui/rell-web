# API Design

This describes the conceptual surface area the product needs to expose — not request/response schemas or implementation.

| Endpoint | Purpose |
|---|---|
| `GET /assets` | List supported tokenized assets |
| `GET /assets/{asset}` | Full profile for one asset (identity + summary) |
| `GET /assets/{asset}/claims` | The complete rights matrix for the asset |
| `GET /assets/{asset}/rights` | Rights-category breakdown (ownership, economic, control, transfer, DeFi) |
| `GET /assets/{asset}/restrictions` | Transfer and eligibility restrictions specifically |
| `GET /assets/{asset}/sources` | Source documents and onchain references backing the claims |
| `GET /assets/{asset}/status` | Current asset status (active / paused / restricted / corporate action) |

## Design Principles for the API

- Every claims-related response should carry its verification label — the API should never return a claim without also returning its confidence level and source.
- `/status` is separated out because it is the field most likely to need near-real-time freshness, while the rest of the profile changes less frequently.
- The API mirrors the [Data Model](data-model.md) directly — no additional grouping or transformation layer between the model and the API surface.
