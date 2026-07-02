---
description: Card Forge balance loop for Hazard-Pattern Combat — sandbox-first card and deck tuning; A/B experimental cards/overrides through the playtest matrix, tune presets/draft weights, promote proven cards into the library, deliver report + changes via PR. For engine constants use /combat-tuning.
---

You are invoked under the `deck-tuning` skill — run one Card Forge tick
end-to-end for the **Hazard-Pattern Combat card pool**. Read
`skills/deck-tuning.md` in full before doing anything else; it describes the
tiered tunable surface (sandbox sets in `src/Cards/cards.sandbox-sets.ts` are
free; deck presets and draft weights are free with evidence; library card
numerics in `src/Cards/cards.library.ts` are guarded behind a sandbox-override
A/B; new mechanics kinds / verb classes / engine paths are propose-only), the
evidence matrix (`npm run combat-playtest` across stages and policies, with
`--sandbox=<setId>` for A/Bs and `--cards` for per-card usage), the
balance-band e2e as the contract, the sandbox → A/B → promote path, and the
one-PR delivery.

North star: the enemy's SOLE bar is HP and status effects are the EFFICIENT
path there — the card pool exists to make status play central at every stage.
Forge so no card is dead (card-coverage e2e), no card dominates (>70% of a
win's impact is spam), the pool ratios hold (DoT >= 25%, control >= 15%,
direct-damage <= 20%), and the aggro baseline stays weak (its
underperformance IS the design). A sandbox card is promoted into the library
only after proving out across >= 2 stages and >= 2 policies without breaking
the bands.

Deliver everything on ONE new branch + PR
(`balance/deck-<ts>`, report at `plan/deck-tuning-<ts>.md`), ready for
review. Never push to `main`. Never auto-merge.

When invoked under `/loop`, the user is not present. Return cleanly after the
tick completes.

Argument: $ARGUMENTS
