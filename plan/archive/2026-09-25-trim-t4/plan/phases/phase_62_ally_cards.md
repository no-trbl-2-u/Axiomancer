# Phase 62 — Ally cards (design + schema)

## Outcome

An Ally card now has a real, implemented mechanical answer: it is a `Card`
of the EXISTING `cardType: 'oath'`, living in a new sibling registry
(`src/Cards/cards.allies.ts`, mirroring the established Haunt sibling-pool
pattern) outside the pinned 57-card library. No new `CardType`, no new
`CardSpecialMechanic` kind, and no new keyword were needed. One reference
Ally — **The Sworn Second** — ships wired all the way through the engine
(a capped, round-end THORNS grant), priced (unscored, "engine text," same
as every other oath), and covered by a 16-case hermetic e2e. The loot-cache
sacrifice chain (Phase 65) is now unblocked: it has a real id
(`the-sworn-second`), a real lookup (`getAllyById`/`isAllyCard`), and a
proven pattern to add more Allies against, without owning the actual
grant/goodwill-counter wiring, which stays out of scope here.

## The design decision, and why

The brief's central question: **what is an Ally card, mechanically — a
card type? a rank? a persistent companion?**

**Answer: a persistent companion, built from the type that already means
exactly that.** `cardType: 'oath'` (spec 32 v4 §2.1) is already "a
persistent, player-side passive": its FREE (dieless) line grants a TIMED
taste of the passive for a few rounds, its PAID line makes the SAME passive
PERMANENT for the rest of that combat, unique-in-play, and the card leaves
the deck cycle. That is a companion who rides along once recruited and
answers for you in every fight you call on them — the "persistent
companion" reading the brief asked about, assembled entirely from
vocabulary the engine already has. Minting a fourth `CardType` (spell /
oath / hex / ally) would have meant new engine dispatch branches
(`combat.engine.ts`'s PAID/FREE routing, `combat.cards.ts`'s verb-class
classifier, the card-editor's `SPECIAL_MECHANIC_KINDS` contract) to
reproduce behavior `oath` already has — real risk for zero new expressive
power. Per the standing "prefer drilling existing keywords/types over
minting near-synonyms" doctrine (THE PIPELINE LIBERATION), the drill-not-mint
answer wins.

**Reward, not draft/theme content.** An Ally is not part of any of the six
Profane Canon archetype packages — it doesn't speak rot/debt/grave/vigil/
trial/choir's vocabulary, it speaks its OWN vocabulary (a named companion),
so it carries no `CardTheme`. It is granted, never drafted or found, so it
must never appear in `COMBAT_REWARD_POOL`, a stage's `stageEligibleCardIds`,
or any theme preset — the same shape Haunts (`cards.haunts.ts`, WS2.1 /
correction C-11) already solved for CONJURE targets: a real `Card` outside
`cardLibrary`, resolved through `getCardById`'s lookup chain, structurally
invisible to every pool that maps over `cardLibrary`. Allies reuse that
exact sibling-pool pattern rather than inventing a second one. The
difference from a Haunt: a Haunt is one-use and reached only via
`conjure_card`; an Ally is meant to be granted ONCE into the player's
permanent collection and fought with like any other owned card thereafter
— Phase 65's job, not this one's.

**The passive speaks an existing keyword.** The Sworn Second's persistent
effect ("your retainer answers a blow leveled at you") is built entirely
from THORNS (Bulwark's existing hallmark, `buff_thorns` in
`Effects/buffs.library.json`) — no new keyword, no new mobile gloss, no new
glyph. Capped at 3 stacks (mirrors the `grace-momentum` cap's shape,
`irresistible-grace`'s `GRACE_MOMENTUM_MAX_STACKS`) so a long fight's
standing reflect never runs away.

**Unscored.** `scoreCard` already returns 0 for any `cardType !== 'spell'`
— every oath/hex in the curated library is "engine text, priced by hand,"
and Allies follow the identical convention (see the card's own `// pts:`
comment for the hand-priced arithmetic).

**No `GAME_STATE_VERSION` bump.** The hooked passive reads/writes fields
that already exist on `CombatEncounterState` (`persistentZone`, `tempZone`,
`player.effects`) — nothing new is persisted. A future grant mechanism
(Phase 65) that adds a NEW persisted field (e.g., a per-map goodwill
counter, or an "owned allies" list) will need its own migration hop at that
time; it is explicitly not needed for this phase's schema-only scope.

## Schema / type changes

**None to `src/Cards/types.ts`.** `Card`, `CardType`, `CardSpecialMechanic`
are all unchanged — this is the point of the design decision above. The
new surface is entirely in a new file:

```ts
// src/Cards/cards.allies.ts
export const allyLibrary: Card[] = [theSwornSecond];
export function getAllyById(id: string): Card | undefined;
export function isAllyCard(id: string): boolean;
```

`theSwornSecond` is a normal `Card` literal (`cardType: 'oath'`, no
`theme`, `tags: ['ally', 'reward', 'oath']`). `getCardById`'s lookup chain
(`src/Cards/cards.library.ts`) is extended one link: sandbox → haunt →
**ally** → library.

## Pricing arithmetic

Unscored (oath convention). Hand-priced comment on the card:

```
// pts: engine text — a capped, refreshed THORNS 1 (2t) at round end
// (statusPerIntensityTurn 0.75 x i1 x d2 = 1.5/application, hand-priced
// per the min-4-triggers convention every oath/hex comment uses) sustained
// across a full fight -> Skull-adjacent. The 3-stack cap keeps the payoff
// bounded rather than a runaway reflect stack (grace-momentum precedent).
```

`rank: 5` (Skull) reflects that a granted, named companion should read as
a significant reward, not a common trinket — there is no draft/reward-pool
rank-band lint to satisfy (Allies are outside `cardLibrary`, so
`pricing.engine.test.ts`'s band lint never sees them), but the pricing e2e
still asserts `scoreCard(ally) === 0` for every entry, matching every other
oath/hex.

## Wiring checklist covered

- [x] **Engine** — one new `zoneHas(state, 'the-sworn-second')` round-end
      hook in `processBetweenPhases` (`src/Combat/combat.engine.ts`),
      applying a capped `buff_thorns` grant to the player via the existing
      `applyEffect` helper. Same shape as every other oath/hex hook
      (`every-stone-an-oath`, `writ-of-attainder`, `grace-momentum`) —
      additive content, not a dispatcher/control-flow change.
- [x] **Pricing** — no new verb; `scoreCard` already returns 0 for
      non-'spell' types. Covered by a dedicated pricing describe block in
      the new e2e.
- [x] **Display** — no new mechanic kind, so `combat.cards.ts`'s
      `mechanicText`/`PAYOFF_KINDS` need no new arm; the oath's
      `persistentEffect` string drives display exactly like every other
      oath.
- [ ] **Mobile keyword-registry/gloss** — not triggered. The passive text
      uses only the EXISTING `THORNS` keyword (already glossed in
      `axiomancer-mobile/state/combat/keywords.ts`); no new UPPERCASE
      face word ships.
- [x] **Card-editor union support** — not triggered by a type change (none
      shipped), and moot regardless: the editor's `cardCodegen`/
      `cardEditorPlugin` read ONLY `cardLibrary` from `cards.library.ts`
      (`ssrLoadModule`), exactly like Haunts — an Ally is structurally
      invisible to the editor, so there is nothing for it to choke on.
      Verified green: `npm run type-check -w axiomancer-card-editor`.
- [ ] **`docs/retheme-map.json` naming registry** — not triggered (no new
      keyword). The card NAME was run through the naming law regardless:
      `node scripts/check-naming-law.mjs --kind=card "The Sworn Second"` →
      clean (no NL-8 collision, no NL-4/5 format violation, no V-1
      philosophy-register hit).
- [ ] **`GAME_STATE_VERSION` migration** — not triggered; see "No
      `GAME_STATE_VERSION` bump" above.
- [x] **`docs/keyword-atlas.md`** — appended a receipt-carrying note to the
      THORNS row citing the new cross-theme carrier (a granted reward, not
      a Bulwark package card).
- [x] **Doc-drift fix (adjacent, not scope creep):** `cards.haunts.ts` and
      `Cards/index.ts` both still said "pinned 70-card library" — stale
      since the 2026-08-08 Profane Canon rework dropped the library to 57.
      Corrected in the same commit (comment-only, no behavior change) so
      the new Ally comments don't sit next to a wrong number.

## Decisions made upfront — DO NOT ASK

1. **`cardType: 'oath'`, not a new `CardType`.** See "The design decision"
   above — `oath` already models "persistent companion passive" with zero
   new engine dispatch.
2. **Outside the pinned library, in a new sibling file — not inside
   `cards.library.ts`.** Mirrors the Haunt precedent exactly; keeps the
   57/45 pins untouched and Allies structurally excluded from every
   reward/draft/stage pool without a single new exclusion check anywhere.
3. **No `CardTheme`.** Allies are cross-cutting rewards, not a seventh
   archetype package; forcing one of the seven existing themes onto a
   card that doesn't speak that theme's vocabulary would be dishonest
   theming.
4. **Unscored.** Matches every other oath/hex; no new pricing verb needed.
5. **No new keyword.** The Sworn Second's passive is built from THORNS,
   already registered and already glossed — drilling, not minting.
6. **No `GAME_STATE_VERSION` bump.** Nothing new is persisted by this
   phase; a future grant mechanism (Phase 65) bumps it when it actually
   adds a persisted field (a goodwill counter, an owned-allies list, etc).
7. **The grant mechanism itself is NOT built here.** Phase 65 decides how
   a village-goodwill payout actually adds an ally id to a player's
   collection (a `knownCards` mutation? a dedicated "owned allies" list?
   does it insert into the live combat deck immediately or only future
   combats?) — guessing that shape now risks building the wrong primitive
   and having Phase 65 throw it away. What Phase 65 gets instead: a real
   id to grant (`the-sworn-second`), a real predicate to gate on
   (`isAllyCard`), and a hermetic "grant smoke" test proving the
   deck→draw→hand→play round trip already works once an id lands in the
   right arrays.
8. **Rank 5 (Skull).** A granted, named companion should read as a
   significant reward. No band lint applies (Allies sit outside
   `cardLibrary`), so this is a flavor/consistency call, not an
   arithmetic one.

## Test matrix

All in the new `src/Cards/e2e/allies.engine.test.ts` (16 cases), modeled on
`haunts.engine.test.ts`'s exclusion suite + `themed-decks.engine.test.ts`'s
ENCHANT/DISENCHANT suite:

| Surface | Cases |
|---|---|
| Exclusion | disjoint from `cardLibrary` (57, unchanged) and the Haunt registry; never in `COMBAT_REWARD_POOL`; never in any stage's eligible pool |
| Resolution | `getCardById` resolves the ally id; a sandbox card shadows it; unknown ids miss the whole chain |
| Oath shape | FREE → `tempZone` (3 rounds), recycles the card; PAID → `persistentZone`, spends the die, leaves the deck cycle; second PAID copy fizzles (unique-in-play) |
| Hooked passive | round-end THORNS lands from either zone; caps at 3 stacks across 6 repeated rounds; inert with neither zone holding the id |
| Pricing | `scoreCard` === 0 |
| Grant smoke | an id placed only in `deck`/`drawPile`/`knownCards` draws into hand via `processBetweenPhases` and plays its FREE face cleanly |

## Verify gate

Touches `src/Cards/**` and `src/Combat/combat.engine.ts` (inside the
`@mechanics` alias) — ran all three legs:

- `npm run verify --workspace axiomancer-mechanics` — green (202 test
  files / 2761 passed, build clean).
- `npm run verify --workspace axiomancer-mobile` — green (248 suites /
  2526 tests).
- `npm run type-check --workspace axiomancer-card-editor` — clean.

## Commit body template

```
feat(mechanics): ally card schema — phase 62

- design decision: an Ally is a `cardType: 'oath'` Card (no new CardType,
  no new CardSpecialMechanic kind, no new keyword) living in a new
  sibling registry (src/Cards/cards.allies.ts), mirroring the Haunt
  sibling-pool pattern (WS2.1) — outside the pinned 57-card library, so
  every reward/draft/stage pool that maps over cardLibrary never sees one
- ships one reference Ally, The Sworn Second: a capped (3-stack), round-end
  THORNS grant, hooked at the same zoneHas() site every other oath/hex
  uses (combat.engine.ts processBetweenPhases) — no new keyword, reuses
  the existing THORNS vocabulary
- getCardById's lookup chain extended: sandbox -> haunt -> ally -> library
- unscored (scoreCard returns 0, same convention as every other oath/hex);
  card-editor needs no changes (it reads only cardLibrary, same as Haunts)
- 16-case hermetic e2e (src/Cards/e2e/allies.engine.test.ts): exclusion,
  resolution chain, FREE/PAID oath shape, the hooked passive + its cap,
  pricing, and a grant-smoke round trip (deck -> draw -> hand -> play)
- doc-drift fix: cards.haunts.ts / Cards/index.ts still said "pinned
  70-card library" (stale since the 2026-08-08 Profane Canon rework
  dropped it to 57) — corrected alongside the new ally comments
- docs/keyword-atlas.md: THORNS row gets a receipt for the new carrier

Decisions:
- oath over a new CardType/rider/separate-entity shape (drill, don't mint
  — oath already means "persistent companion passive")
- outside cards.library.ts, in its own sibling file (Haunt precedent)
- no CardTheme (a cross-cutting reward, not a seventh archetype package)
- no GAME_STATE_VERSION bump (nothing new persisted this phase)
- the actual grant/goodwill-counter mechanism is explicitly Phase 65's job

Closes #<PHASE_ISSUE if captured>
```

## DoD

- [x] Design decision made and documented (oath, outside-library, unscored,
      no new keyword).
- [x] Schema landed: `cards.allies.ts` + `getCardById` chain extension +
      one reference card wired through engine + pricing.
- [x] Hermetic e2e (16 cases) green.
- [x] `npm run verify` green on mechanics + mobile; card-editor
      type-check clean.
- [x] `docs/keyword-atlas.md` updated (THORNS row receipt).
- [x] Naming law checked (`check-naming-law.mjs` clean on "The Sworn
      Second").

## Follow-ups (out of scope)

- **Phase 63** — the loot cache becomes a three-way choice (card / item /
  sacrifice) and introduces the per-map goodwill counter the sacrifice
  branch writes.
- **Phase 64** — the journal (memoir tab) reads the goodwill counter back.
- **Phase 65** — village goodwill rewards: the shop discount hook, the
  actual ally-card GRANT (deciding how an id lands in the player's
  collection — the open question this phase deliberately left to it, per
  Decision 7 above), and "other various rewards," gated on Phase 63's
  counter. This phase's `the-sworn-second` id and `isAllyCard` predicate
  are what Phase 65 has to grant against; no mobile surface for
  granting/viewing allies exists yet.
- Authoring additional Allies beyond the single reference card is
  content-authoring scope for whichever phase actually needs a second one
  (likely 65, if the goodwill tiers want more than one companion).
