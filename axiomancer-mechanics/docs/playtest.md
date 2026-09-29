# Hazard-Pattern Combat Playtest Reference

> One-page reference for the combat playtest harness: stage profiles, the
> sim-policy roster, the deck-selection grammar, the sandbox card workflow,
> and the CLI cookbook. Doctrine: the enemy's SOLE bar is HP and status
> effects are the EFFICIENT path to dropping it — the harness exists to keep
> that true at every stage of the campaign.
>
> Loops that consume this: none until Phase R12 writes a new combat-playtest
> command (the old one was archived in R0).
> Card changes happen only in guided sessions with T (D37). Engine constants
> are tuned manually against this harness's evidence.

## Stage profiles

Defined in `src/Combat/combat.stage-profiles.ts` (numbers marked
`// PLAYTEST-CALIBRATION` — the source is authoritative). Each stage builds a
deterministic player (`buildStagePlayer`) whose known skills are the stage's
eligible card pool (`stageEligibleCardIds`: library + registered sandbox
cards, filtered by `tier <= maxCardTier` and learning level).

| Id | Name | Player | HP | Max tier | Enemy roster (slugs) |
|---|---|---|---|---|---|
| `early` | The Shallows | level 3, 5/5/5 | 90 | 1 | float-eye, brine-hag, the-doorwarden |
| `mid` | The Long Road | level 20, 17/17/17 | 255 | 3 | brine-hag, the-doorwarden |
| `late` | The Deep Wood | level 45, 37/39/38 | 570 | 3 | the-doorwarden |

The rosters are the three foes left after the enemy roster reset (revamp
R2); the `impossible` ceiling stage went with its only foe. The rosters
regrow in B2.

## Sim-policy roster

Defined in `src/Combat/combat.sim-policies.ts`; consult
`COMBAT_SIM_POLICIES` for each policy's exact `preferredFocus` (used by
`policy-pick` deck selection), signature list, and Conviction threshold.

| Id | Sees hidden stances? | Plays like |
|---|---|---|
| `greedy` | no | The canonical witness: the original bestCard ordering — payoff timing, new-status-first, status-over-strike. |
| `blind` | no | Identical play to `greedy` since D7: its only difference (drafting off revealed stances only) died with the draft. Kept so the matrix keeps its column. |
| `dot-weaver` | yes | DoT and rupture/amplify payoffs above all; utility only once the enemy is already bleeding. |
| `control-lock` | yes | Control and stat-debuffs first — aims to deny the enemy's telegraphed threat phases. |
| `aggro-brute` | yes | Raw bottom-damage preview, no payoff timing. The doctrine's weak baseline — its underperformance IS the design. |
| `turtle` | yes | Guard/barrier/defend first, DoT second; hoards Conviction (high signature threshold). |
| `chaos` | no | Uniform-random card play and random affordable signatures (seeded rng) — the noise floor. |
| `mercy-seeker` | yes | Controls to survive, befriends as soon as the HP gate opens, always spares. |

Tune player-facing difficulty against `blind`; ceilings against `greedy`;
doctrine assertions against the archetype pairs (e.g. `dot-weaver` must beat
`aggro-brute` on the late stage).

## Deck-selection grammar

One grammar shared by `npm run combat-playtest --deck=...`,
`npm run combat -- --deck ...`, and `CombatDeckSelection`
(`src/Combat/combat.deck-draft.ts`):

| Form | Meaning |
|---|---|
| `preset:<id>` | A curated preset: `grey` — the fresh-run grey deck, the only preset since the card purge (D36; `src/Combat/combat.starter-deck-presets.ts`) |
| `preset:<id>+swap:<out>/<in>,...` | The preset with measurement-seat swaps: every copy of `<out>` replaced by `<in>` (copy count = the seat). Loud-failure: `<out>` must be in the resolved deck and `<in>` must resolve — pair with `--sandbox=<setId>` when `<in>` is a sandbox swap-pool card |
| `draft:<focus>` | Seeded weighted draft from the eligible pool: `dot`, `control`, `utility`, `damage`, `balanced` (focus-fitting verb classes at 4x weight; default size 10, max 2 copies; always >= 1 defend and >= 1 status card when the pool allows) |
| `cards:a,b,c` | An explicit card-id list (invalid ids dropped) |
| `policy-pick` | The harness drafts from the running policy's `preferredFocus` — the default |

No escape card is appended — there is no in-combat retreat; a fight resolves
only by winning or losing. Drafts are deterministic
for a given seed.

## Sandbox card workflow (register → A/B → promote)

Experimental cards and numeric overrides live OUTSIDE the shipped library in
`src/Cards/cards.sandbox-sets.ts` (registry mechanics:
`src/Cards/cards.sandbox.ts`). `getCardById` consults the sandbox first, so
a loaded set is visible to the whole engine — decks, drafts, sims, CLIs.

```
  cards.sandbox-sets.ts                 combat-playtest matrix              cards.library.ts
 +---------------------+   --sandbox=  +----------------------+  proven    +----------------+
 | SandboxCardSet      | ------------> | same seeds, with vs  | ---------> | literal moved  |
 |  new Card literals  |    <setId>    | without the set:     |  >=2 stages| into library,  |
 |  + {cardId, patch}  |               | winRate / statusEng  |  >=2 pols  | same PR, with  |
 |    overrides        |               | / per-card usage     |  bands OK  | evidence table |
 +---------------------+               +----------------------+            +----------------+
```

1. **Register.** Add a named `SandboxCardSet` (new cards must have NEW ids;
   overrides patch existing library cards). Example set: `forge-example`.
2. **A/B.** Run the identical matrix invocation with and without
   `--sandbox=<setId>` — same stages, policies, runs, seeds. The delta is
   the card's evidence.
3. **Promote.** A card that proves out across >= 2 stages and >= 2 policies
   without breaking the balance bands moves into `cards.library.ts` in the
   same PR, inside a guided card session (D37). Sandbox content itself
   never ships.

## CLI cookbook

```bash
# Full matrix: all stages, greedy policy, policy-pick decks, 60 runs/cell, seed 1
npm run combat-playtest

# One stage under the player-feel witness, with the per-card usage table
npm run combat-playtest -- --stage=early --policy=blind --runs=100 --seed=7 --cards

# Every policy on the late stage (doctrine check: dot-weaver vs aggro-brute)
npm run combat-playtest -- --stage=late --policy=all --runs=60 --seed=1

# A curated preset against one enemy, machine-readable for agents
npm run combat-playtest -- --stage=mid --enemy=audit-sentinel --deck=preset:grey --json

# Sandbox A/B treatment arm (run the same line without --sandbox for control)
npm run combat-playtest -- --stage=mid --policy=dot-weaver --runs=60 --seed=1 --sandbox=forge-example

# Measurement-seat swap: the grey preset with one seat's copies replaced by a
# sandbox candidate (control = the same line without +swap:.../--sandbox)
npm run combat-playtest -- --stage=early --policy=blind --runs=60 --seed=1 --sandbox=<setId> "--deck=preset:grey+swap:grey-strike/<candidate-id>"

# A single auto-played encounter through the interactive CLI (fast qualitative sweep)
npm run combat -- --enemy float-eye --auto --policy status --seed 5 --deck preset:grey --max-turns 6

# A hand-playable encounter: stage player, drafted deck, JSONL answers on stdin
npm run combat -- --enemy brine-hag --stage mid --deck draft:dot --seed 11 --stdin --json-events
```

The `combat-playtest` CLI (`src/CLI/combat-playtest.cli.ts`) accepts
`--stage=early|mid|late|all`, `--policy=<id|all>`,
`--deck=<grammar above>`, `--enemy=<slug>`, `--runs=N`, `--seed=N`,
`--sandbox=<setId>`, `--cards`, `--json`. Every sweep runs spec 33's
Upgradeable Dice — the only combat model since the flag collapse (D7,
2026-09-25). `--upgradeable-dice` is still accepted as a no-op for old
scripts; `--legacy-dice` fails loudly (that model was deleted), and the report
no longer carries a `Dice model:` header or a `diceModel` field. The interactive
`combat` CLI's answer protocol (script/stdin JSONL) lives in `src/CLI/io.ts`.

## The e2e bands were the balance contract

`src/Combat/e2e/combat-playtest.balance-bands.sim.test.ts` used to pin
per-stage bands over the matrix (win-rate floors/ceilings, the
status-engagement and DoT-erosion witnesses, the `dot-weaver` beats
`aggro-brute` assertion). Those bands were repealed 2026-09-02 by THE BIG
NUMBERS REWRITE; the file is now a smoke test — the matrix runs across every
stage without crashing and every cell's outcome accounting is exact with a
finite win rate. Companion witnesses:
`combat-playtest.matrix.sim.test.ts` (determinism + invariants) and
`combat-playtest.card-coverage.sim.test.ts` (every library card must be
playable — dead cards fail the build).

**Starter-preset win-rate curve (load-bearing doctrine, set 2026-07-08 — see
`VISION.md` → Combat vision):** early ~80%, mid ~50%, late ~25-35%.
The current placeholder bands above (esp. the late win-rate ceiling) predate
this doctrine
and should tighten toward it as calibration runs land — a starter preset
clearing late well above this curve is a dominance finding, not a
success, since starter presets are early/mid-game decks by design (the
player trades into a new mid-game deck after the labyrinth). Correction
history: `plan/archive/2026-09-25-trim-t4/plan/tuning/2026-07-08-win-path-scaling.md`.
