# Phase 37 — Retire the fallacy/paradox card category + the dead combatResources pool

> Agent-facing brief. Ship without asking; document judgment calls in the
> commit body. Owner-directed (chat 2026-07-18). A *deletion* pass — nothing
> new ships. Independent of the D-sequence; ships on its own branch. This is
> barrel-breaking, so it MUST land atomically across all three packages.

## Outcome / Why

`Card.category` (`CardCategory = 'fallacy' | 'paradox'`) is a
pre-Hazard-Pattern vestige. Its only runtime effect is to drive
`generatePhilosophicalResource`, which banks `+1 fallacy/paradox` into
`combatResources` — a **write-only pool that nothing reads or spends**:

- The **live** stance economy is `resonance` (`{heart, body, mind}`), spent by
  card `threshold`/detonation logic (`combat.engine.ts` ~L734/767/2033-2047).
  Fallacy/paradox **never** appear in it.
- `combatResources` is written by `executeCard` on every play but read by no
  gameplay logic. Its one reader — mobile `combat-hud.engine.ts`
  `calculateResourcePercent` — is dead: `combatResources` is hardcoded `null`
  there and `manaPercent` is forced to `1`.
- `scoreCard` (pricing) is category-blind.
- The `resourceCost` gate that once *spent* these tokens was already deleted
  (mechanics CHANGELOG "De-tokenized cards… Removed the `resourceCost` field").

The real card types the owner wants kept — **spell / enchantment /
disenchant** — live under a DIFFERENT key, `Card.cardType` (`CardType`, spec
32 v4). They are UNTOUCHED by this phase.

**Owner call (chat 2026-07-18):** take the fuller cut — remove the category
field AND fully tear down the orphaned `combatResources` pool (heart/body/mind
included) plus its dead synergy machinery. Leave the hazard/gathering
"paradox-token" reward flags alone (a genuinely separate reward system).

**Success state:** a repo-wide grep for `CardCategory` / `combatResources` /
`generatePhilosophicalResource` / `philosophical-generated` returns nothing
(or only git history + the two `docs/references/all-*-reference.md` lore
files, which stay). `Card` has no `category`; `CardSynergy` has no
`consumeAllResources`/`resourceTokenDamageMul`; the `@mechanics` barrel no
longer exports the removed symbols. All three gates green.

## Removal map (concrete sites — re-grep at ship time, this is a snapshot)

### axiomancer-mechanics (engine — the source of the barrel break)

- **`src/Cards/types.ts`** — delete `CardCategory` (L24) and its doc block
  (L19-23); remove `category: CardCategory` from `Card` (L497) + the
  `@property category` doc (L483-484); delete the `CombatResources` interface
  (L81-87) and its doc; remove `consumeAllResources` (L470) +
  `resourceTokenDamageMul` (L464-466) from `CardSynergy` and fix the
  `CardSynergy` side-effects doc (L415-437) that describes the token formula.
- **`src/Cards/card.engine.ts`** — delete `generateBasicActionResources`
  (L51-), `generatePhilosophicalResource` (L71-), `philosophicalCategoryFor`
  (L105-); remove the `consumedTokens`/`consumedAllResources` synergy branch
  (L188-191, L314-321, L367-378) and the `resourceTokenDamageMul` term; remove
  the `generatePhilosophicalResource` call + `philosophical-generated` event
  in `executeCard` (L437-442); drop `synergyForceResources` (L298, L370);
  remove `CombatResources`/`CardCategory` from imports (L29). `executeCard`
  keeps threading state, minus the resource pool.
- **`src/Cards/index.ts`** — drop `CombatResources` (L13) and `CardCategory`
  (L12) from the type export; drop `generateBasicActionResources`,
  `generatePhilosophicalResource`, `philosophicalCategoryFor` (L36-38); fix
  the module-doc lede (L1-9, "Cards (fallacies and paradoxes) run on the
  five-resource resonance economy").
- **`src/index.ts`** — drop the re-exports of `CardCategory` /
  `CombatResources` / the three generator fns (grep the barrel; ~L292 region).
- **`src/Combat/combat.encounter.types.ts`** — remove `combatResources`
  (L889) from the encounter state; remove the VM `category: 'fallacy' |
  'paradox' | null` (L136); drop the `CombatResources` import (L22).
- **`src/Combat/combat.engine.ts`** — delete `EMPTY_RESOURCES` (L303); remove
  `combatResources` from the `cardShim` builder (L383), encounter init (L508),
  `executeCard` result folds (L1989, L2024), the replay shim (L2630), and the
  final state spread (L3171); drop the `CombatResources` import (L34). Leave
  all `resonance` logic (L731-812, L2030-2047) intact — it is the live
  economy.
- **`src/Combat/combat.cards.ts`** — remove the `category` VM pass-through
  (~L455). Do NOT touch `effect.category` (Effect category — unrelated).
- **Card data** — strip the `category:` line from every record in
  `src/Cards/cards.library.ts` (~70), `src/Cards/cards.sandbox-sets.ts`, and
  `src/Cards/cards.thoughtforms.ts`.
- **Tests** — remove `category` literals + any fallacy/paradox/
  `combatResources`/`philosophical-generated` assertions from
  `src/Combat/e2e/*.engine.test.ts` and `src/Cards/e2e/*`. Delete tests that
  existed only to cover the removed generation/synergy machinery (net test
  delta is negative). Any test asserting a card carries a `category` is
  updated, not preserved.

### axiomancer-card-editor (authoring tool — writes the real library)

- **`src/data/mechanics.ts`** — delete `CATEGORIES` (L96-100) and its stale
  doc; remove `'fallacy'`/`'paradox'` from `RESOURCE_KEYS` (L214-216). If
  `RESOURCE_KEYS`/`ResourceKey` has no remaining consumer once those two keys
  go (its doc references the deleted `resourceCost`), delete the whole export
  and its stale comment; else leave `['heart','body','mind']`. Drop the
  `CardCategory` import (L65).
- **`src/types.ts`** — remove `category` from `CardDraft` (L36), `blankCard`
  (L70), `toDraft` (L96), `fromDraft` (L124); drop `CardCategory` from the
  import (L18-26).
- **`src/components/CardForm.tsx`** — delete the CATEGORY `FieldLabel` +
  `Segmented` block (L385-388) and the `CATEGORIES` import. Keep the
  PHILOSOPHICAL ASPECT and CARD TYPE controls (those are `philosophicalAspect`
  and `cardType` — the real, kept fields).
- **`src/server/cardCodegen.ts`** — delete the line that emits `category:`
  (L207), so saves stop re-writing the field (which would otherwise fail
  mechanics type-check once `Card.category` is gone).
- Grep `CardFace.tsx` / `mechanics.contract.ts` for `category` before shipping
  — `mechanics.contract.ts` currently has none; `CardFace.tsx` hits are
  `effect.category` (unrelated), confirm and leave.

### axiomancer-mobile (presenters + UI)

- **`state/presenters/combat-hud.engine.ts`** — delete `calculateResourcePercent`
  (L33-) and the `combatResources`/`CombatResources` refs (L79-82 already
  null-guarded); `manaPercent` becomes a plain `1` (or the override path is
  simplified). No behavior change (it was already `1`).
- **`state/selectors/combat-cards.ts`** — remove `CardCategoryKey` (L37),
  the `category` field (L47), the `category: card.category` map (L84), and the
  doc line (L16).
- **`state/actions.ts`** — remove `category` from the card VM shape (L811) and
  its assignment (L827); fix the L1474-75 comment referencing paradox/fallacy
  categories. (L1304/L1993 are `Item.category` / quest-item — LEAVE.)
- **`state/presenters/combat-encounter.engine.ts`** — remove the VM
  `category: 'fallacy' | 'paradox' | null` (L514) and the `category:
  card.category` pass-through (L1984). Do NOT touch any `categoryColor` /
  `GLYPH_COLORS` lines (L1199-1414 etc.) — that is glyph coloring, unrelated.
- **`state/presenters/character.engine.ts`** — remove the `category:
  'fallacy' | 'paradox'` VM field (L137) and its source read.
- **`app/(tabs)/character/index.tsx`** — delete the category badge render
  (L468-477): the `s.category === 'paradox'` border-style/color branch and the
  `{s.category.toUpperCase()}` text. Keep the surrounding card row.
- **`components/levelup/LearnCardModal.tsx`** — remove `· {offer.category
  .toUpperCase()}` from the offer tier line (L56); keep `T{offer.tier}`.
- **Tests** — update/remove `category` in fixtures and assertions:
  `state/selectors/__tests__/combat-cards.test.ts` (L37-40),
  `components/levelup/__tests__/LearnCardModal.test.tsx` (L20),
  `components/combat/encounter/__tests__/CombatBoard.reprisal.test.tsx`
  (L114), and rewrite `state/e2e/debug-seed.engine.test.ts` (L70-77) — the
  "cover both paradox + fallacy" assertion is deleted (the categories no
  longer exist); keep the two-card-learned coverage it also provides.

## Reality-check before shipping

1. Re-grep each removed symbol repo-wide at deletion time (this list is a
   snapshot). In particular confirm **zero card data** in library/sandbox/
   thoughtforms carries `consumeAllResources` or `resourceTokenDamageMul`
   before deleting those `CardSynergy` fields (planning confirmed zero, but
   re-verify).
2. Confirm `combatResources` is NOT persisted before skipping the migration:
   `git grep -n "combatResources" src/Game/` returned nothing at planning
   time (it is transient combat-encounter state). If that changes, add a
   `GAME_STATE_VERSION` migration; otherwise none is needed.
3. Distinguish the false-positive `category` fields at every touch: `Item.
   category` (equipment/consumable/material/quest-item), `Effect.category`
   (`EffectCategory`), `categoryColor`/`categoryHeaders`/`categorySection`
   (rendering), the `arrow-paradox` card id (a T5 stance card — its NAME
   contains "paradox", it is not a category), and hazard/gathering
   "paradox-token" reward flags. NONE of these are removed.

## Decisions made upfront — DO NOT ASK

- **Scope = category field + full `combatResources` teardown** (owner call,
  chat 2026-07-18). Not the minimal "keys only" cut. The pool is write-only
  dead accounting; the live economy is `resonance`, a separate structure that
  stays.
- **Delete, don't deprecate.** No live consumer survives the cut; a dead
  compat shim protects nothing (bearings' backwards-compat guidance is for
  *live* consumers, and mobile/card-editor are migrated in this same change).
- **Keep `Card.cardType` and everything about spell/enchantment/disenchant.**
  That is the real card-type taxonomy, under a different key. This phase does
  not touch it.
- **Keep `resonance` and all Fate-Engine threshold/detonation logic** — it is
  the live stance economy and is unrelated to fallacy/paradox.
- **Hazard/gathering "paradox-token" reward flags are OUT of scope** — a
  separate reward system that merely reuses the word "paradox"
  (`HAZARD_TOKEN_FLAG_PREFIX`, boon token rewards). Renaming/removing them is
  a distinct content change; note it as a follow-up, do not touch it here.
- **`docs/references/all-{paradoxes,fallacies}-reference.md` STAY** — design
  lore about philosophical paradoxes/fallacies, not the card-category
  mechanic. Do not delete design provenance.
- **No save migration** — `combatResources` is transient combat state (not in
  the persisted `GameState`); confirm at ship time per Reality-check #2.
- **`philosophicalAspect` (heart/body/mind stance) STAYS** — it is the die
  colour / stance field, distinct from `category`.

## Pages × tests matrix

| Surface | Tests |
|---|---|
| barrel | `CardCategory`/`CombatResources`/the 3 generator fns absent; mechanics + mobile + card-editor type-check green |
| `Card` shape | no `category`; every library/sandbox/thoughtform card compiles against the slimmed type |
| `card.engine` | `executeCard` resolves cards with no resource generation; no `philosophical-generated` event emitted; synergy path has no token term |
| combat engine | encounter init/resolve/replay carry no `combatResources`; `resonance` threshold/detonation regression-green (unchanged) |
| card-editor | CREATE/EDIT round-trip a card with no `category`; codegen output omits `category:`; saved library re-imports clean into mechanics |
| mobile character screen | card row renders without the FALLACY/PARADOX badge; no runtime read of a missing field |
| mobile LearnCard modal | offer line shows tier only; no `category` read |
| mobile combat VMs | combat-cards selector + combat-encounter presenter build without `category` |
| grep sanity | no orphaned `CardCategory`/`combatResources`/`generatePhilosophicalResource`/`philosophical-generated` outside git history + the two lore docs |

Net test delta is **negative** (suites for the removed machinery go). The
gate's job is proving zero dangling references + unchanged live combat
behavior, not new behavior.

## Verify gate

Barrel-breaking → all three gates (the `@mechanics` alias couples them):

```bash
npm run verify --workspace axiomancer-mechanics      # type-check + tests + build
npm run verify --workspace axiomancer-mobile         # lint + typecheck + jest
npm run type-check --workspace axiomancer-card-editor
# sanity: no orphaned references (lore docs + git history excepted)
git grep -nE "CardCategory|combatResources|generatePhilosophicalResource|philosophicalCategoryFor|generateBasicActionResources|philosophical-generated|consumeAllResources|resourceTokenDamageMul" \
  -- ':!plan/' ':!*/docs/references/all-*-reference.md'
```

## Commit body template

```
refactor(mechanics,mobile): retire the fallacy/paradox card category — phase 37

- Remove Card.category + the CardCategory type (a pre-Hazard-Pattern
  vestige; the real card types spell/enchantment/disenchant live under
  Card.cardType and are untouched).
- Tear down the orphaned write-only combatResources pool: delete the
  CombatResources type, generateBasicActionResources /
  generatePhilosophicalResource / philosophicalCategoryFor, the
  philosophical-generated event, and the dead CardSynergy token machinery
  (consumeAllResources / resourceTokenDamageMul / consumedTokens — zero
  live card data used them). The live stance economy (resonance,
  heart/body/mind) is unchanged.
- Card-editor: drop the CATEGORY picker + CATEGORIES/RESOURCE_KEYS + the
  codegen category: emit. Mobile: drop the two cosmetic badges (character
  screen, LearnCard modal) + the dead combat-hud resource-percent path +
  the category VM fields.
- Strip category: from all ~70 library cards + sandbox + thoughtforms.

Decisions:
- Delete over deprecate (no live consumers; all consumers migrated here).
- Full combatResources teardown per owner call 2026-07-18 (write-only
  dead pool; resonance is the live economy and stays).
- Out of scope: hazard/gathering paradox-token reward flags (separate
  system) and the all-{paradoxes,fallacies}-reference lore docs.
- No save migration (combatResources is transient combat state).

Closes #<phase-issue-number>
```

## DoD

Flip Phase 37 `[ ]` → `[x]` in `plan/steps/01_build_plan.md`, append the hash
+ a Phase log line, in the same commit that ships the code. All three gates
green; `deploy:check` green.

## Follow-ups (out of scope)

- Hazard/gathering "paradox-token" reward flags (`HAZARD_TOKEN_FLAG_PREFIX`,
  boon token rewards) — decide rename/remove separately (needs-user-call:
  they reuse the word but are a live reward system).
- If `combatResources` heart/body/mind turn out to have a not-yet-found
  cosmetic consumer, confirm the HUD simplification reads correctly in-app.
- `docs/references/all-{paradoxes,fallacies}-reference.md` — leave as lore;
  revisit only if the design decides that vocabulary is fully retired.
