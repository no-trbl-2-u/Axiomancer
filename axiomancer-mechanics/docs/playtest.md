# Hazard-Pattern Combat Playtest Reference

> One-page reference for the combat playtest harness: stage profiles, the
> sim-policy roster, the deck-selection grammar, the sandbox card workflow,
> and the CLI cookbook. Doctrine: the enemy's SOLE bar is HP and status
> effects are the EFFICIENT path to dropping it — the harness exists to keep
> that true at every stage of the campaign.
>
> Loops that consume this: `/combat-playtest` (evidence + verdict, report
> only), `/deck-tuning` (cards/decks), `/combat-tuning` (engine constants).
> The LEGACY turn-based playtest module is documented separately in
> `docs/playtest-legacy.md`.

## Stage profiles

Defined in `src/Combat/combat.stage-profiles.ts` (numbers marked
`// PLAYTEST-CALIBRATION` — the source is authoritative). Each stage builds a
deterministic player (`buildStagePlayer`) whose known skills are the stage's
eligible card pool (`stageEligibleCardIds`: library + registered sandbox
cards, filtered by `tier <= maxCardTier` and learning level).

| Id | Name | Player | HP | Max tier | Enemy roster (slugs) |
|---|---|---|---|---|---|
| `early` | The Shallows | level 3, 5/5/5 | 90 | 1 | tidepool-crab, salt-gnaw-rat, mournful-gull, hollow-eyed-beggar, hush-wraith, coastal-tyrant |
| `mid` | The Long Road | level 20, 17/17/17 | 255 | 2 | audit-sentinel, rimeclaw-prowler, glassmind-oracle, mire-of-consensus, the-lich-of-missing-steps |
| `late` | The Deep Wood | level 45, 37/39/38 | 570 | 3 | famine-of-the-deep-wood, warrant-of-the-void, graveward-keeper, the-last-consensus, axiom-breaker, the-terminal-proof |
| `impossible` | The Unprovable | level 50, 40/44/42 | 630 | 3 | the-incompleteness |

The `impossible` stage is a ceiling probe: The Incompleteness never appears
in random map encounters and losing to it is the design — the bands assert a
LOW win rate there, not a high one.

## Sim-policy roster

Defined in `src/Combat/combat.sim-policies.ts`; consult
`COMBAT_SIM_POLICIES` for each policy's exact `preferredFocus` (used by
`policy-pick` deck selection), signature list, and Conviction threshold.

| Id | Sees hidden stances? | Plays like |
|---|---|---|
| `greedy` | yes (omniscient) | The canonical ceiling: the original bestCard ordering — payoff timing, new-status-first, status-over-strike. Bit-identical to the pre-roster sim. |
| `blind` | no | The canonical player-feel witness: greedy's ordering on revealed information only. Bit-identical to the pre-roster sim. |
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
| `preset:<id>` | A curated preset: `dot-erosion`, `control-lock`, `utility-bulwark`, `aggro-strike`, `balanced` (`src/Combat/combat.deck-presets.ts`) |
| `draft:<focus>` | Seeded weighted draft from the eligible pool: `dot`, `control`, `utility`, `damage`, `balanced` (focus-fitting verb classes at 4x weight; default size 10, max 2 copies; always >= 1 defend and >= 1 status card when the pool allows) |
| `cards:a,b,c` | An explicit card-id list (invalid ids dropped) |
| `policy-pick` | The harness drafts from the running policy's `preferredFocus` — the default |

Every resolved deck gets `card-retreat` appended. Drafts are deterministic
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
   same PR (the `/deck-tuning` skill owns this path). Sandbox content itself
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
npm run combat-playtest -- --stage=mid --enemy=audit-sentinel --deck=preset:dot-erosion --json

# Sandbox A/B treatment arm (run the same line without --sandbox for control)
npm run combat-playtest -- --stage=mid --policy=dot-weaver --runs=60 --seed=1 --sandbox=forge-example

# The ceiling probe: greedy should still lose to The Incompleteness
npm run combat-playtest -- --stage=impossible --policy=greedy --runs=60 --seed=1

# A single auto-played encounter through the interactive CLI (fast qualitative sweep)
npm run combat -- --enemy mournful-gull --auto --policy status --seed 5 --deck preset:dot-erosion --max-turns 6

# A hand-playable encounter: stage player, drafted deck, JSONL answers on stdin
npm run combat -- --enemy audit-sentinel --stage mid --deck draft:dot --seed 11 --stdin --json-events
```

The `combat-playtest` CLI (`src/CLI/combat-playtest.cli.ts`) accepts
`--stage=early|mid|late|impossible|all`, `--policy=<id|all>`,
`--deck=<grammar above>`, `--enemy=<slug>`, `--runs=N`, `--seed=N`,
`--sandbox=<setId>`, `--cards`, `--json`. The interactive `combat` CLI's
answer protocol (script/stdin JSONL) lives in `src/CLI/io.ts`.

## The e2e bands are the balance contract

`src/Combat/e2e/combat-playtest.balance-bands.sim.test.ts` pins per-stage
bands over the matrix (blind win-rate floors per stage, the impossible
ceiling `winRate <= 0.15` with `defeats > 0`, `statusEngagement > 0.2` on
every non-impossible stage, `dotHpFraction > 0.25` under greedy, and the
doctrine assertion that `dot-weaver` beats `aggro-brute` late). Every
threshold is marked `// PLAYTEST-CALIBRATION`: currently generous
placeholders that tighten as calibration runs land. Because the bands run in
`npm run verify`, any card, deck, or constant change that breaks the
doctrine fails the gate — that is the point. Companion witnesses:
`combat-playtest.matrix.sim.test.ts` (determinism + invariants) and
`combat-playtest.card-coverage.sim.test.ts` (every library card must be
playable — dead cards fail the build).
