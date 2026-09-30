# Phase R6 — Hazard reset

## Sources

- Part plan: [`plan/revamp/hazards.md`](../revamp/hazards.md) § R6 (items 1–6).
- Reset rules: [`plan/revamp/README.md`](../revamp/README.md) §5.
- Decisions: **D52** (hazards reset; B3 redesigns them), **D63** (the minimal
  playable core, T 2026-09-28), **D64** (part plan ratified), **D45** (carrier
  rule, which applies to the hazard glossary too), **D50** (git history is the
  source archive; markdown moves to `plan/archive/`), **D58** (nothing is
  authored), **D37** (the card hold).
- T, 2026-09-28 (quoted in the part plan): "Reset hazards too. I plan on
  changing some of the fundamental mechanics of hazard."
- Siblings: phase R2 (`phase_R2_enemy_reset.md`) for the data/code split;
  phase R5 (`b2f91e00`) for a reward re-point plus a save migration.

## Outcome

A hazard still plays end-to-end: roll, place dice, fill the meters, pick a
route, claim the spoils. Every reward does what its chip says (shillings, a
heal), every consequence does what its chip says (lost VITAE, a scar that an
inn mends, a CRACK card), and nothing sets a flag that nothing reads. The deck
is a small core of cards per meter, the engine runs only the mechanics those
cards print, and the glossary lists only words a live card prints.

## Split (decided upfront, 2026-09-30)

The hazard system is ~3.7k engine LOC plus ~4.2k mobile LOC, and the
reward-card pool alone is ~150 cards. Like R2 and R3, R6 ships as two rows, in
order, one per tick:

- **R6a — honest rewards, no sub-quests.** Scope 1–7 below.
- **R6b — the minimal deck and its engine.** Scope 8–14 below.

R7a requires R6b; RC requires both.

## Scope

### R6a — honest rewards, no sub-quests

1. **Rewards** (`hazard.types.ts`, `hazard.content.ts`, `hazard.tuning.ts`):
   `HazardRewardId` becomes `'shillings' | 'riskShillings' | 'vitae'`.
   `cache` (Shrine Cache, "of relics", paid shillings), `relic` (Bonus Relic,
   paid shillings) and `token` (Paradox Token, set a flag nothing reads) are
   deleted. The two shilling chips say exactly what they pay:
   `shillings` "+12 shillings." and `riskShillings` "+32 shillings." (the old
   cache and cache+relic sums, so the risk route's premium is unchanged).
   Tuning keys `cacheShillings` / `relicShillings` become `shillings` /
   `riskShillings`; the exports follow (`HAZARD_SHILLINGS_REWARD`,
   `HAZARD_RISK_SHILLINGS_REWARD`).
2. **Payout table** (`computeOutcome`):

   | Tier | Safe route | Risk route |
   |---|---|---|
   | perfect | shillings, vitae | riskShillings, vitae |
   | complete, 2+ wins | vitae | riskShillings |
   | complete, 1 win | vitae | shillings |
   | failure | — | — |

   The token slot on a perfect run is not replaced on the safe route (it
   already heals); on the risk route it becomes the heal.
3. **Consequences**: `tokens` (Sundered, cleared paradox-token flags) and
   `curse` (Hexed, set a flag nothing reads) are deleted. `minhp`, `maxhp`
   and `deadcard` stay. By losses: 0 → none, 1 → none (the route penalty
   still applies), 2 → scar + CRACK, 3 → bleeding + scar + CRACK.
4. **Sub-quests go**: `HAZARD_SUBQUESTS`, `getHazardSubquestDef`, the
   `subquests` tuning block, the `HazardSubquest*` / `HazardQuestMetrics`
   types, session fields `subquests` / `subquestDraft` / `questMetrics`, the
   outcome fields `subquests` / `questShillings` / `questVitae` /
   `questTokens`, `rollSubquests`, `hazardSubquestStatus`,
   `hazardSubquestResults`, `selectSubquestFromDraft`, and
   `generateSubquestDraft` / `chooseSubquest` in `hazard.engagement.ts`. The
   session RNG stream does not change: the sub-quest roll used its own
   branched seed, and the draft call only read the RNG.
5. **Route copy**: the six risk routes' `rewardLabel` stops promising relics,
   caches and hoards and reads "More shillings".
6. **Save migration v30 → v31** (`Game/game.migrate.ts`,
   `GAME_STATE_VERSION` 31): drop every `hazard-token-banked:*` flag and the
   `hazard-hexed` flag. Idempotent, pure over a raw payload, tested.
7. **Mobile**: `state/hazard/store-actions.ts` claims only the surviving
   rewards and consequences (`HAZARD_HEXED_FLAG`, `HAZARD_TOKEN_FLAG_PREFIX`
   and the `tokensBanked` / `tokensLost` / `hexed` result fields go);
   `state/dev/flags.ts` loses its HEXED row; the presenter
   (`state/presenters/hazard.engine.ts`) loses the sub-quest VM, the
   objective bonus note and `subquestRewardLabel`; `HazardBoard` loses
   `SubquestStrip`; `RewardsOverlay` loses the objectives ledger and shows the
   route-penalty line whenever it is non-zero (a one-loss run now has a
   penalty and no consequence chip, so "flawless" shows only when both are
   empty). The playtest guide's sub-quest test IDs go.

### R6b — the minimal deck and its engine

8. **The core deck** (`HAZARD_DECK`) is the prototype's ten cards, a few per
   meter: FORCE `haul`, `grip`; ESCAPE `scram`, `runner`, `leap`; both meters
   `footing` (DRAW), `windread` (CONVERT), `pole` (RE-CAST), `oath` (GILDED
   DRAW), `blessing` (GILDED RE-CAST). The weight-0 legacy `steps` and the six
   keyword-expansion starters (`steadied`, `fork`, `ironwill`, `spite`,
   `firstlight`, `refrain`) go. `HAZARD_CRACK_CARD` stays (failed rounds and
   the `deadcard` consequence deal it).
9. **The reward-card pool goes.** `HAZARD_REWARD_CARDS` (the expansion and
   codex roster) is deleted. The pick-one offer after a clear draws three
   distinct cards from the core deck (a perfect run's first slot is a gold
   rare; a one-win run offers no rare), the same move P1 made for combat card
   rewards (D44). `hazard.engagement.ts` keeps only what a live surface calls
   (the remove-card grid, if mobile still mounts it); deck-focus
   classification and deck identity go with the archetypes they named.
10. **Engine code with no carrier goes** (`hazard.engine.ts`,
    `hazard.types.ts`): effects `aura`, `burst`, `goldvow`, `purge`,
    `transmute`, `mend`, `bounty`, `ward`, `anchor`, `foretell` (with the
    `foretell-pending` phase and `confirmHazardForetell`), `echo`, `scour`;
    card fields for CHOOSE (and `chooseHazardCardKey`), two-tone `colors`,
    JEOPARDY, MIRACLE, BUYBACK, DELVE, SACRIFICE, momentum bonus; session
    fields `modifiers`, `goldVow`, `vitaeCost`, `vitaeRestore`,
    `bountyShillings`, `wardPenaltyReduction`, `carryFloor`,
    `foretellPending`; the outcome's `vitaeCost` / `vitaeRestore` /
    `bountyShillings`. Mobile loses the matching VM fields, notes and
    overlays (enchantments strip, gold-vow note, foretell overlay, choose
    toggle).
11. **Glossary** (`HAZARD_KEYWORDS`, `HazardKeywordId`): only words the core
    prints — FORCE, ESCAPE, SURGE, DRAW, CONVERT, RE-CAST, GILDED, SALVAGE,
    CRACK. The Phase 82 tooltip mount for the hazard keyword chips shrinks
    with it; any mobile gloss or glyph for a dropped word goes (D45).
12. **Tuning and sims**: `hazard.tuning.ts` drops the `expansion` and `codex`
    bands; `hazard.sim.ts` keeps what `e2e/hazard.balance.sim.test.ts` needs
    and its bands are re-measured on the core deck with thresholds unchanged
    (a band that moves is re-blessed with the measured value in the test
    comment, not retuned: B3 owns hazard difficulty).
    `docs/hazard-balance-recommendations.md` moves to `plan/archive/`.
13. **Save migration v31 → v32**: drop every `hazard-card:<id>:<n>` flag
    whose id is not a core card or `crack`. No refund.
14. **Docs**: `docs/encounters/hazard.md` and `docs/hazard-minigame-api.md`
    describe the reset system only.

## Consumers to update

`World/Hazard/index.ts` and `src/index.ts` exports; `CLI/hazard.cli.ts` and
`CLI/game.cli.ts` (and their e2e suites); mobile `state/presenters/hazard.engine.ts`,
`state/presenters/hazard-deck.engine.ts`, `state/hazard/store-actions.ts`,
`components/hazard/*`, the debug hazard tools (`DebugHazardDeckRandomize`,
`state/hazard/__tests__/deck-presets.test.ts`); the tooltip presenter for the
hazard chips (R6b).

## Save / schema contracts

The hazard session is transient (never saved), so no session migration.
R6a: `GAME_STATE_VERSION` 30 → 31 (flags). R6b: 31 → 32 (deck flags).

## Carrier sweep (D45)

R6a removes no glossary word (the rewards and sub-quests were never keywords).
R6b's sweep is item 11: after the deck shrinks, every hazard keyword, gloss,
glyph and tooltip row not printed by a core card goes.

## Decisions made upfront — DO NOT ASK

- **Split in two, rewards first.** R6a is the honesty fix the part plan
  leads with and touches the claim path; R6b is the large mechanical purge.
  Doing rewards first means R6b never edits a reward it is about to delete.
- **Two shilling chips, not one variable chip.** A chip's text is static
  catalogue copy; a per-route amount would need the presenter to rewrite it.
  Two ids keep every chip literal and the risk premium (32 vs 12) intact.
- **One lost round now costs only the route penalty.** Its only consequence
  was Sundered, which cleared a flag nothing read, so the player-visible cost
  is unchanged.
- **Sub-quests go in R6a**, because one of their three reward kinds was the
  paradox token: they cannot stay without keeping a dishonest reward.
- **The core deck is the prototype ten.** They print only the base loop's
  words (FORCE, ESCAPE, SURGE, DRAW, CONVERT, RE-CAST, GILDED, SALVAGE) and
  cover both meters and both utility tiers. Every other starter taught a
  keyword the part plan cuts.
- **The card offer stays and offers core cards** (P1 / D44 precedent) rather
  than being deleted: the rewards overlay keeps its shape (part plan item 1)
  and B3 decides what a hazard should pay in cards.
- **Thresholds are not retuned** in R6b; B3 owns hazard difficulty.
- **No refund** for stripped flags or deck cards.

## Tests matrix

R6a:
- `Game/e2e/hazard-reset-migration.engine.test.ts` (new): a v30 save with
  token flags and `hazard-hexed` loads at v31 without them, keeps its other
  flags (`hazard-card:*`, `hazard-scar:*`), and re-migrating is a no-op.
- Hazard engine suite: the payout table above, row by row; consequences by
  loss count; no outcome carries `cache`, `relic`, `token`, `tokens` or
  `curse`; sub-quest cases deleted; a determinism case still passes.
- Mobile: the claim action pays 12 / 32 shillings and the heal, sets no
  token or hexed flag; the rewards overlay shows the penalty line on a
  one-loss run; the board renders with no sub-quest strip.

R6b:
- The deck holds exactly the ten core cards; every card's keywords are in
  the glossary and every glossary word is printed by a card or CRACK.
- The offer yields only core ids, honouring the rarity rules.
- Migration v31 → v32 strips non-core deck flags and is idempotent.
- The balance sim runs on the core deck with its re-measured bands.

## Verify gate

`npm run verify` (both workspaces: mechanics' public surface changes), root
`npm test`, `npm run lint:content`, `node scripts/check-lexicon.mjs`.

## Commit body template

```
chore: hazard reset, honest rewards — phase R6a

- <rewards>
- <consequences>
- <sub-quests>
- <migration>
- <mobile>

Decisions:
- <from the list above>

Closes #<mirror>
```

## DoD

R6a: no hazard reward or consequence names a relic, a cache of relics, a
paradox token or a hex; no code writes or reads `hazard-token-banked:*` or
`hazard-hexed` outside the migration and its test; no sub-quest code remains.
R6b: the deck, glossary and engine hold only the core; no deleted card id or
hazard keyword is referenced outside the migration and git history. Each row
`[x]` with its hash and the gates green.

## Follow-ups (out of scope)

- B3 (owner): the hazard mechanics redesign, difficulty, what hazards pay.
- B1 (owner): relics may get a real source; a hazard could be one.
