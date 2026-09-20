# Verification System

Not all claims can be verified to the same standard. RELL makes the confidence level of every claim explicit, rather than presenting all information as equally certain.

## Verification Labels

**VERIFIED ONCHAIN**
Directly observable from blockchain data — contract code, contract state, or onchain events. Highest confidence for anything it covers.

**VERIFIED FROM ISSUER / DOCUMENTATION**
Supported by authoritative documentation from the issuer or a legal/custodial source. High confidence, but dependent on the source document remaining current and accurate.

**REPORTED / INFERRED**
Information that cannot currently be independently verified — pulled from secondary sources, inferred from pattern/precedent, or self-reported without a verifiable primary source. Lowest confidence.

## The Core Rule

Inferred information is never presented as fact. Every claim in a rights profile shows its label alongside the claim itself, so a user can immediately see the difference between "this is directly verifiable" and "this is reported but unconfirmed."

## Handling Conflicts

Where onchain data and offchain documentation appear to disagree (e.g. a contract technically allows a transfer that issuer terms prohibit), RELL surfaces both rather than silently picking one:

- The onchain claim reflects **technical capability**
- The offchain claim reflects **permitted / legal use**

Both are shown with their own label so the user understands that technical capability does not necessarily equal legally sanctioned use.
