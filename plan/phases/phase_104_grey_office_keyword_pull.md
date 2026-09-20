# Phase 104 — The grey office and the keyword pull

> Filed 2026-09-20 from a direct T ruling (device playtest, learning-curve
> complaint). Decisions below were taken by T in the same session; the two
> derived consequences (deck floor, picker retirement) are recorded here as
> decisions, not questions. Ships via `/ship-a-phase` as its own PR — it is
> deliberately NOT bundled with the v23 loadout-seed fix (PR #349), which
> only removed the bug that hid the current starter bundle.

## Outcome

A brand-new player opens the campaign with a **10-card deck of GREY cards** —
two card shapes, nothing else — and every die colour can power any of them.
The first three reward cards the player TAKES are drawn **completely at
random** — uniform over the whole non-curse pool, no theme weighting, no rarity
weighting, no guarantee. Once three reward cards sit in the deck, **every
reward draft guarantees at least one offer that carries a keyword from the
deck's dominant theme family**, so the deck grows toward the keywords the
player already chose instead of sampling the whole canon each fight.

Player-facing result: fight one teaches STRIKE, WARD, FREE-vs-PAID, and the
die-spend loop with zero colour arithmetic. The first three rewards taken are
a free look at the canon. From the fourth reward screen after that, the draft
already leans the way the player leaned.

## What exists, measured

- **Colour law.** `Card.philosophicalAspect: StatType` (`Cards/types.ts:774`,
  `StatType = 'body' | 'mind' | 'heart'`). `cardStanceColor(card)` returns it
  verbatim (`Combat/combat.cards.ts:91`); `toCombatCard` copies it onto
  `CombatCard.stance`. The engine's power check is
  `combat.engine.ts:2280` — `powering.color !== 'wild' && powering.color !==
  card.stance` refuses the play — plus the colour-match bonus read at `:2301`
  and the wild-die stance fallback at `:2423` / `:3205` (`dieHasStance`).
  `'wild'` already exists as a **die** colour that powers any card; there is
  no **card** colour that any die may power. That is the missing half.
- **Card copies are real.** `buildCombatDeck` deals one copy per `knownCards`
  entry (2026-09-05 repeal of de-dup). A 10-entry `knownCards` IS a 10-card
  deck. `executeCard`'s ownership guard reads `knownCards` — a starter written
  there is owned.
- **Starter seeding.** Mobile `ensureStarterCards` (`state/actions.ts`) seeds
  `knownCards` on first combat from the chosen bundle
  (`chosenStarterBundle`) else `STARTING_CARD_IDS`. `BundleSelectScreen`
  (`components/BundleSelectScreen.tsx`, mounted from `app/index.tsx`) offers
  the three campaign snapshots (threadbare / pilgrim / apostate) as starter
  bundles via `STARTER_BUNDLES` (`state/combat/store-actions.ts`).
- **Deck floor.** `MIN_COMBAT_DECK_SIZE = 12` (`Cards/card.removal.ts`),
  derived from the Threadbare lineage (18 − 6 removed). Pinned by
  `card-removal.engine.test.ts` (`/floor of 12 cards/`) and read by
  `restchoice.engine.ts` to disable the CUT offer.
- **Reward roll.** `rollCombatCardRewards(player, rng, count, extraPool)`
  (`Combat/combat.rewards.ts:194`) — per slot: allegiance roll
  (`REWARD_OFF_THEME_RATE` 0.35) → theme by deck share (`deckThemeShares`)
  → card by rarity weight. `deckThemeCounts(player)` already tallies
  `knownCards` + `combatRewardCards` by `Card.theme`. `THEME_KEYWORDS`
  (`Cards/card-themes.ts:36`) is the per-theme keyword family. No per-card
  keyword list exists on `Card`; keywords are derived from
  `specialMechanics` kinds by the keyword atlas (`/adjust-keywords`).
- **Preset law.** `deck-presets.engine.test.ts` pins exact aspect thirds
  per campaign preset. The presets are untouched by this phase (they remain
  the dev deck-swap tool and the sim matrix's stage profiles); only the
  fresh-run seed changes.
- **Card editor.** `axiomancer-card-editor/src/types.ts:40` declares
  `philosophicalAspect: StatType`; `CardFace.tsx` / `CardForm.tsx` /
  `cardCodegen.ts` read it. Mobile reads it in
  `state/selectors/combat-cards.ts` and
  `state/presenters/combat-encounter.engine.ts` (palette: body RED, mind,
  heart) and in `state/actions.ts`.

## Decisions made upfront — DO NOT ASK

1. **Deck: 10 cards, 7 STRIKE + 3 WARD.** T's numbers (2026-09-20). Not
   6/6, not 12.
2. **The two cards.** They belong to NO archetype, so they must never tilt
   `deckThemeCounts`: introduce `theme: 'grey'` on `CardTheme` for exactly
   these two, excluded from `REWARD_THEMES` and from `COMBAT_REWARD_POOL`
   (the grey office is never a reward). Ids and faces:
   - `grey-strike` — "A Plain Blow". FREE: deal 2. PAID: deal 5. `tier 1,
     rank 1, cardType 'spell', targetType 'enemy'`.
   - `grey-ward` — "A Plain Ward". FREE: GUARD 2. PAID: GUARD 5. `tier 1,
     rank 1, cardType 'spell', targetType 'self'`.
   Pricing: file through `cards.pricing.ts` like any card; the pts budget
   is allowed to come in UNDER the starter curve (these are meant to be
   outgrown — same doctrine as the Threadbare Office).
3. **The grey aspect.** New `CardAspect = StatType | 'any'`;
   `Card.philosophicalAspect: CardAspect`. `cardStanceColor` returns
   `'any'` for grey cards; the engine's power check accepts ANY available
   die (colour, wild) for `stance === 'any'`; colour-match bonus is
   `'neutral'` (never on-colour, never off-colour); `dieBonus.onColor:
   'match'` is unreachable on grey cards (neither starter carries one).
   `dieHasStance`-style fallbacks that need a concrete colour (wild-die
   conversion at `:2423` / `:3205`) treat `'any'` as "keep the die's own
   colour". `StatType` itself is NOT widened — stats stay three.
4. **Fresh-run seeding.** `STARTING_CARD_IDS` becomes the 10-entry grey
   recipe (`grey-strike` ×7, `grey-ward` ×3) and `ensureStarterCards`
   writes it verbatim (copies kept) instead of `engineLearnCard`-ing a set.
   `BundleSelectScreen` is retired from the fresh-run flow (`app/index.tsx`
   no longer routes to it; `BUNDLE_CHOSEN_FLAG` is set by the seed so
   returning saves are unaffected). `STARTER_BUNDLES` /
   `seedStarterBundleAction` stay exported for the dev deck-swap menu only.
5. **Deck floor re-derives to 10.** The grey office is the smallest shipped
   starting deck, so `MIN_COMBAT_DECK_SIZE = 10` (= 2 × `COMBAT_HAND_SIZE`,
   the reshuffle-inside-one-round bound). `card-removal.engine.test.ts`'s
   derivation comment + `/floor of 12 cards/` pin update to 10. A fresh
   run's first CUT is legal only after the first reward is taken — that is
   the intended tempo (T picked 10 knowing the floor was 12).
6. **The first three rewards TAKEN are uniform-random.** T's ruling
   (2026-09-20 follow-up): while `(player.combatRewardCards ?? []).length <
   REWARD_RANDOM_PICKS` (new constant, `3`), `rollCombatCardRewards` fills
   every slot uniformly from `validPool` — no allegiance roll, no theme
   share, no rarity weight, no guaranteed slot; distinct ids per draft as
   today. Counted by cards actually taken, so a SKIP does not advance it
   (T chose "cards taken" over "drafts shown"); derived from
   `combatRewardCards.length`, so no new save field. The grey office never
   tilts the count (its cards live in `knownCards`).
7. **Keyword pull = dominant theme's family, from the fourth taken card
   on.** T's choice over "union of picked rewards" and "most recent pick".
   Definition: `dominantTheme = argmax deckThemeCounts(player)` over
   `REWARD_THEMES`; ties resolve in `REWARD_THEMES` order; when every count
   is 0 there is NO guarantee and the roll is the existing theme-aware one.
   Slot 0 of every draft is the GUARANTEED slot: its candidate pool is
   `validPool ∩ { id : keywordsOf(id) ∩ THEME_KEYWORDS[dominantTheme] ≠ ∅ }`,
   rarity-weighted as today; slots 1..n keep the existing allegiance roll.
   `keywordsOf(id)` is the atlas derivation already used by the catalog
   (theme family ∪ mechanic-kind keywords) — expose it from
   `Cards/card-themes.ts` or `Cards/index.ts`, do not add a `keywords` field
   to `Card`.
8. **Dominant theme, not first pick.** After three random takes the tally
   already has a leader (or a tie, resolved in canon order), so the fourth
   draft guarantees that family without a separate "first pick" memory. No
   new save field.
9. **Sims and presets.** The campaign presets (threadbare / pilgrim /
   apostate) and `deck-presets.engine.test.ts` are untouched. Add a fourth
   stage profile `'grey'` to `combat.stage-profiles.ts` ONLY if the
   combat-playtest matrix needs it to run a fresh-start row; otherwise
   leave the matrix alone. The reward-draft sim
   (`combat.reward-draft.sim.ts`) gains a guaranteed-slot assertion and a
   first-three-uniform assertion.
10. **Colour palette for grey.** Mobile paints `'any'` cards in the neutral
   ink token (`AXM.ink` / the existing `#8a8273`-class Threadbare accent —
   use the token, never the literal). The die-pip glyph on a grey face
   shows the wild glyph. Card editor's aspect select gains `any` and
   `CardFace` paints it neutral.

## Surface

- **mechanics:** `Cards/types.ts` (aspect union), `Cards/card-themes.ts`
  (`'grey'` theme, `keywordsOf`), `Cards/library/starters.cards.ts` (two
  cards), `Cards/cards.library.ts` (aggregator count), `Combat/combat.cards.ts`
  (`cardStanceColor`, ledger copy), `Combat/combat.engine.ts` (power check +
  colour-match + wild fallbacks), `Combat/combat.rewards.ts`
  (`STARTING_CARD_IDS`, guaranteed slot, pool exclusion),
  `Cards/card.removal.ts` (floor), `Game/game.reducer.ts` (no version bump
  needed — no save-shape change).
- **mobile:** `state/actions.ts` (`ensureStarterCards`), `app/index.tsx`
  (picker retired from the fresh path), `state/selectors/combat-cards.ts` +
  `state/presenters/combat-encounter.engine.ts` (grey palette), the card
  face in `CombatBoard.tsx` (wild pip).
- **card-editor:** `src/types.ts`, `CardForm.tsx`, `CardFace.tsx`,
  `server/cardCodegen.ts`.

## Output schema / contracts

- `type CardAspect = StatType | 'any'` — exported beside `StatType`.
- `CombatCard.stance: CardAspect`.
- `CardTheme` gains `'grey'`; `THEME_KEYWORDS.grey = []`; `REWARD_THEMES`
  excludes `'grey'` and `'curse'`.
- `REWARD_RANDOM_PICKS = 3` exported beside `REWARD_OFF_THEME_RATE`.
- `rollCombatCardRewards` signature unchanged; behaviour: uniform over the
  pool while fewer than `REWARD_RANDOM_PICKS` reward cards are held; after
  that, slot 0 guaranteed when a dominant theme exists.
- `MIN_COMBAT_DECK_SIZE = 10`.
- No `GameState` shape change; no migration.

## Empty / loading / error states

- Fewer than three reward cards held: the draft is the uniform roll; copy
  on the reward screen unchanged.
- Guaranteed slot with an empty candidate pool (every family card already
  offered this draft): fall through to the plain roll for that slot —
  never an empty offer, never a throw.

## Tests

- `Cards/e2e/grey-office.engine.test.ts` (new): the two cards resolve;
  every die colour + wild powers `grey-strike` / `grey-ward`; FREE/PAID
  ledgers read 2 / 5; a fresh `ensureStarterCards`-shaped player deals
  exactly 7 + 3; neither grey id is in `COMBAT_REWARD_POOL`.
- `Combat/e2e/reward-keyword-pull.engine.test.ts` (new): with 0, 1, 2
  reward cards held every slot is uniform (a 2000-roll chi-square against
  the pool stays inside the envelope; rares are not under-drawn); with 3
  rot cards held slot 0 always carries a rot-family keyword across 200
  seeded rolls; a SKIP does not advance the count; with 3+ cards and an
  all-zero tally the roll equals today's roll bit-for-bit; tie order is
  `REWARD_THEMES` order; empty-pool fallthrough.
- `card-removal.engine.test.ts`: floor pin 12 → 10 + re-derivation comment.
- `combat-loadout.engine.test.ts` unaffected.
- mobile: `state/e2e` seeding test (fresh save → 10 grey entries, bundle
  flag set, picker not shown); palette snapshot for a grey face.
- card-editor: type-check only (aspect union).

## Verify gate

`npm run verify -w axiomancer-mechanics`, `npm run verify -w
axiomancer-mobile`, `npm run type-check -w axiomancer-card-editor`, and
`npm run baseline:check` (the reward roll is a mechanics-source change —
regenerate the deck-matrix baseline per AGENTS.md → "Measured truth").

## DoD

- A fresh run deals 10 grey cards, no picker, any die powers any card.
- The first three reward cards taken come from uniform drafts; after three
  rot picks, every subsequent draft's first slot is rot-family.
- Floor 10; a fresh run's first CUT is refused until one reward is taken,
  then legal.
- All three package gates green; baseline stamp refreshed.

## Follow-ups (out of scope)

- Enemy art: the alpha-matte holes are masked by the figure plate shipped
  2026-09-20; a per-asset solid backing mask (build-time flood fill over
  all 79 assets) remains a candidate for `PHASE_CANDIDATES.md`.
- Whether the Threadbare / Pilgrim / Apostate presets should be re-cut to
  descend from the grey office (lineage law) — a `/deck-tuning` question,
  not this phase's.
