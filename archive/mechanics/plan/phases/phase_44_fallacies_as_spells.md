# Phase 44 — Fallacies-as-spells / abilities (Phase 42 content payoff)

> Phase 42 closing line: 81 named logical fallacies stored on the
> 27-cell `philosophicalAlignmentLibrary` as content fuel for a
> future skill/effect/spell phase. This is that phase. We pick 7
> marquee fallacies — 4 as Tier 3 skill payloads, 3 as status-effect
> payloads — and wire a `sourcedFromCell?: string` cross-link on
> both `Skill` and `Effect` so consumers can trace any fallacy
> payload back to its philosophical-cell origin in the library.

## Outcome

- `Skill.sourcedFromCell?: string` exists; the field carries the
  kebab-case id of the `PhilosophicalAlignmentCell` the skill was
  authored from (e.g. `'logic-pessimistic-individual'`).
- `Effect.sourcedFromCell?: string` exists with the same semantics.
- 4 new Tier 3 fallacy skills land in `src/Skills/skill.library.ts`:
  `appeal-to-consequences`, `nirvana-fallacy`, `pascals-wager`,
  `appeal-to-fear`. Each references its source cell, sets a
  `learningRequirement: { level: 10 }`, and routes through the
  existing combat-effects + resource-cost machinery without
  introducing new combat primitives.
- 3 new fallacy-themed status effects land in the effects library
  JSON: `debuff_no_true_scotsman` (stat debuff — defense down),
  `buff_special_pleading` (defense buff — damage reduction),
  `debuff_category_error` (control debuff — roll-modifier penalty).
  Each carries `sourcedFromCell`.
- Hermetic e2e drives one new skill through `resolveCombatRound` +
  one new effect through `applyEffect`; asserts the
  `sourcedFromCell` cross-link round-trips through the live registry.
- `docs/skills.md` + `docs/effects.md` gain a "Philosophical fallacy
  payloads" subsection cross-linking to `docs/philosophy.md`.
- Phase 44 row in the build plan flips to `[x]`.

## Source spec

- Build-plan row Phase 44 (`plan/steps/01_build_plan.md:66`).
- Promoted via `/oversight` 2026-05-16 (commit `6966461`) as the
  second Phase 42 follow-up in a 3-phase sequence (43 → 44 → 45).
- `content/philosophy/PhilosAxiosDoc.pdf` closing line: "could serve as 'spells' or
  abilities in your RPG system."
- `plan/phases/phase_42_philosophical_alignment.md` Follow-ups
  block — "Fallacies as spells / abilities" item names the scope.
- `plan/bearings.md` Visual & tonal defaults — "Enemies are
  embodiments of logical fallacies. Effect names reference
  philosophical paradoxes." Phase 44 makes that commitment
  mechanically real for 7 named fallacies; later phases can
  promote more from the library on demand.

## Implementation units

### Unit 1 — `sourcedFromCell` on Skill + 4 fallacy Tier 3 skills

**Files (edited):**
- `src/Skills/types.d.ts` — add `sourcedFromCell?: string` on `Skill`.
- `src/Skills/skill.library.ts` — append 4 new Tier 3 skill definitions
  + add them to the `skillLibrary` array export.

**Type addition:**

```ts
// src/Skills/types.d.ts — Skill:
/**
 * Phase 44 — cross-link back to the originating
 * `PhilosophicalAlignmentCell.id` for skills authored from a
 * fallacy in the 27-cell library. Optional; only set on
 * philosophy-sourced skills.
 */
sourcedFromCell?: string;
```

**The four skills:**

| Skill id | Cell (PDF #) | Aspect | Cost | Power | Target | Effects |
|---|---|---|---|---|---|---|
| `appeal-to-consequences` | `logic-optimistic-individual` (1) | body | `{ body: 3, fallacy: 1 }` | 16 | enemy | self-applies `tier1_body_attack` intensity 2 dur 3 |
| `nirvana-fallacy` | `logic-pessimistic-individual` (7) | mind | `{ mind: 2, fallacy: 1 }` | 14 | enemy | applies `debuff_confusion` to enemy |
| `pascals-wager` | `mid-optimistic-transcendent` (12) | heart | `{ heart: 2, paradox: 1 }` | 0 | self | self-heal via `scalingMultiplier: 3` on heart (mirrors `bootstrap-paradox` shape) |
| `appeal-to-fear` | `mid-pessimistic-transcendent` (18) | heart | `{ heart: 2, fallacy: 1 }` | 12 | enemy | applies `debuff_slow` to enemy |

All four set `tier: 3`, `learningRequirement: { level: 10 }`, and
the appropriate `category` (`fallacy` for 3 of them — Pascal's Wager
is a `paradox` per PDF cell-12's classification of the variant).
Descriptions echo the cell's philosophical voice.

**Tests (Unit 1):**

`src/Skills/e2e/fallacy-skills.engine.test.ts` (new) — 4 cases:

1. Each of the 4 new skills resolves through `getSkillById` and
   carries the expected `sourcedFromCell`.
2. `appeal-to-consequences` driven through `resolveCombatRound` deals
   damage to the enemy AND applies the self-buff (assert the buff
   appears on `combat.player.effects`).
3. `nirvana-fallacy` driven through `resolveCombatRound` applies
   `debuff_confusion` to the enemy.
4. The `sourcedFromCell` id resolves to a real entry in
   `philosophicalAlignmentLibrary` via `philosophicalAlignmentLibrary.find(c => c.id === skill.sourcedFromCell)`.

Commit: `feat(skills): Phase 44 unit 1 — sourcedFromCell + 4 fallacy Tier 3 skills`.

### Unit 2 — `sourcedFromCell` on Effect + 3 fallacy status effects

**Files (edited):**
- `src/Effects/types.d.ts` — add `sourcedFromCell?: string` on `Effect`.
- `src/Effects/debuffs.library.json` — append 2 new debuff entries.
- `src/Effects/buffs.library.json` — append 1 new buff entry.

**Type addition:**

```ts
// src/Effects/types.d.ts — Effect:
/**
 * Phase 44 — cross-link back to the originating
 * `PhilosophicalAlignmentCell.id` for effects authored from a
 * fallacy in the 27-cell library. Optional; only set on
 * philosophy-sourced effects.
 */
sourcedFromCell?: string;
```

JSON entries can carry the field as plain optional properties — TS
narrows JSON to `Effect[]` and accepts the extra key.

**The three effects:**

| Effect id | Cell (PDF #) | Type | Category | Tier | Payload |
|---|---|---|---|---|---|
| `debuff_no_true_scotsman` | `logic-pessimistic-transcendent` (9) | debuff | stat | 2 | `statModifiers: [{ stat: 'physicalDefense', value: -2 }]`, `duration: 3`, `stacking: 'intensity'`, `resistedBy: 'mind'`, `resistDR: 12` |
| `buff_special_pleading` | `faith-optimistic-individual` (19) | buff | defense | 1 | `defenseModifier: 2`, `duration: 2`, `stacking: 'intensity'` |
| `debuff_category_error` | `mid-pessimistic-transcendent` (18) | debuff | control | 2 | `rollModifierPerIntensity: -2`, `duration: 3`, `stacking: 'intensity'`, `resistedBy: 'heart'`, `resistDR: 11` |

The mechanics intentionally reuse existing `EffectPayload` fields
(no new payload kinds). The fallacy framing is purely thematic on
top of the existing tier-1/2/3 application + resist machinery.

**Tests (Unit 2):**

Extend `src/Skills/e2e/fallacy-skills.engine.test.ts` (or add a sibling
in `src/Effects/e2e/`) with 3 cases:

1. Each of the 3 new effects resolves through `lookupEffect` and
   carries the expected `sourcedFromCell`.
2. `applyEffect` on `debuff_no_true_scotsman` produces an
   `ActiveEffect` with the right `effectId`, `tier`, `resistedBy`.
3. The `sourcedFromCell` id resolves to a real entry in
   `philosophicalAlignmentLibrary` (same pattern as Unit 1's #4).

Commit: `feat(effects): Phase 44 unit 2 — sourcedFromCell + 3 fallacy status effects`.

### Unit 3 — Docs + plan tick

**Files (edited):**
- `docs/skills.md` — add a "Philosophical fallacy payloads (Phase 44)"
  subsection: table of the 4 new skills with their source cells +
  cross-link to `docs/philosophy.md`.
- `docs/effects.md` — same subsection for the 3 new effects.
- `docs/api.md` — extend the Skills + Effects entries with
  `sourcedFromCell` field notes; extend the Philosophy entry with a
  cross-reference to the new payloads.
- `plan/steps/01_build_plan.md` — flip Phase 44 `[ ]` → `[x]` with
  the three commit hashes and per-unit summary.

Commit: `feat(philosophy): Phase 44 unit 3 — docs + plan tick`.

## Decisions made upfront — DO NOT ASK

- **`sourcedFromCell` on both Skill AND Effect.** Two separate
  optional fields rather than a shared mixin or wrapper type. Keeps
  each library's existing shape stable; the cross-link is data-only,
  not behavioural. A future audit row that says "find all payloads
  sourced from cell X" can grep both libraries with the same string
  key.
- **7 fallacies, not 6 or 8.** Splits as 4 skills + 3 effects so each
  surface ships a non-trivial first batch without ballooning. The
  brief's 6-8 band gives room; 7 is the natural pivot.
- **No new EffectPayload field kinds.** All 3 new effects use the
  existing `statModifiers` / `defenseModifier` / `rollModifierPerIntensity`
  primitives. New mechanics (e.g. "ignore a hit", "convert damage
  type") are out of scope; they belong in a follow-up that extends
  `EffectPayload`.
- **All 4 skills are Tier 3.** Matches the brief's "Tier 3 skill
  payload" framing. `learningRequirement: { level: 10 }` mirrors the
  existing T3 skills (`sorites-cascade`, `straw-giant`, `bootstrap-paradox`).
  Future fallacies at lower tiers are a follow-up.
- **Categories:** 3 skills are `fallacy`; `pascals-wager` is `paradox`
  because the PDF labels it as a "variant" of Pascal's Wager and the
  resource cost includes a `paradox` token (matching `bootstrap-paradox`).
- **Cell-id source-of-truth.** `sourcedFromCell` carries the same
  kebab-case ids used in `philosophicalAlignmentLibrary` (e.g.
  `'logic-optimistic-individual'`, `'mid-pessimistic-transcendent'`).
  Stable across versions per the Phase 42 brief's "Cell ids are
  kebab-case" decision.
- **No runtime validation that `sourcedFromCell` exists in the
  library.** The hermetic tests check the invariant; production code
  trusts the authoring. Mirrors how `learningRequirement.requires`
  doesn't validate against the skill library at load time.
- **JSON payload for effects, not a new TS file.** New debuffs / buffs
  go in `debuffs.library.json` + `buffs.library.json` per the existing
  convention. JSON entries accept the new optional `sourcedFromCell`
  field because TS reads them as `Effect[]` and the field is optional.
- **No new exports for the new skills / effects.** They go through the
  existing `skillLibrary` + `effectsLibrary` registries — looked up by
  id like every other authored skill / effect. The `sourcedFromCell`
  field is added to the public `Skill` and `Effect` types in
  `src/index.ts` (no rename needed; just the field gain).
- **`pascals-wager` flavour matches `bootstrap-paradox` mechanically.**
  Self-heal via `scalingMultiplier`; targetType `self`; resource cost
  paradox. Future spec can differentiate them — for now the parallel
  is intentional.
- **Resist DRs (12 / 11) match the existing T2 debuff band.** No
  re-balance pass; future calibration is out of scope.

## Verify gate

`npm run type-check && npm run lint && npm test && npm run build`.
Then `npm run deploy:check`.

## Commit body template (final commit / Unit 3)

```
feat(philosophy): Phase 44 — fallacies-as-spells / abilities

Promotes 7 named fallacies from the Phase 42 27-cell library into the
live skill + effect registries. New `sourcedFromCell?: string` on both
`Skill` and `Effect` cross-links each payload back to its
`PhilosophicalAlignmentCell.id`.

- 4 Tier 3 skills: appeal-to-consequences, nirvana-fallacy, pascals-wager,
  appeal-to-fear
- 3 status effects: debuff_no_true_scotsman, buff_special_pleading,
  debuff_category_error
- All mechanics reuse existing combat primitives — no new payload kinds.
- Hermetic e2e covers skill resolution + effect application + cell-id
  round-trip through philosophicalAlignmentLibrary.
- docs/skills.md + docs/effects.md gain "Philosophical fallacy payloads"
  subsections cross-linking to docs/philosophy.md.

Refs: content/philosophy/PhilosAxiosDoc.pdf, plan/phases/phase_44_fallacies_as_spells.md,
Phase 42 (bdfda00), Phase 43 (c62702e).
```

## Definition of Done

- [ ] `Skill.sourcedFromCell?: string` exists in `src/Skills/types.d.ts`.
- [ ] `Effect.sourcedFromCell?: string` exists in `src/Effects/types.d.ts`.
- [ ] 4 new Tier 3 skills (`appeal-to-consequences`, `nirvana-fallacy`, `pascals-wager`, `appeal-to-fear`) exist in `src/Skills/skill.library.ts` with `sourcedFromCell` set to a valid library cell id.
- [ ] 3 new status effects (`debuff_no_true_scotsman`, `buff_special_pleading`, `debuff_category_error`) exist in the effects JSON with `sourcedFromCell` set to a valid cell id.
- [ ] Hermetic e2e covers: each new skill resolves via `getSkillById`, each new effect resolves via `lookupEffect`, one skill end-to-end through `resolveCombatRound`, one effect through `applyEffect`, and every `sourcedFromCell` id resolves in `philosophicalAlignmentLibrary`.
- [ ] `docs/skills.md` + `docs/effects.md` gain "Philosophical fallacy payloads (Phase 44)" subsections.
- [ ] `docs/api.md` Skills + Effects entries mention `sourcedFromCell`.
- [ ] Phase 44 row in `plan/steps/01_build_plan.md` flipped to `[x]` with all three commit hashes.
- [ ] `npm run verify` + `npm run deploy:check` green.

## Follow-ups (out of scope)

- **Promote more fallacies.** 81 stored, 7 promoted this phase. A future content phase can pick another 6-10 at a time; the cross-link field is in place.
- **Lower-tier fallacy skills.** All 4 in this phase are Tier 3; Tier 1 / Tier 2 fallacy skills are content work.
- **New `EffectPayload` field kinds.** The more abstract fallacies (e.g. "Begging the Question", "Appeal to Mystery", "Category Error") would benefit from payload kinds the engine doesn't have yet (skip-conditional, narrative-trigger). File as iterate rows when a concrete fallacy needs them.
- **Phase 45 (Enemies-by-alignment AI tuning)** — already promoted, queued next. Now that fallacy skills exist, enemy authoring can pick fallacies per-cell to express archetypes.
- **Alignment-gated learning.** `learningRequirement` could gain a `requiresAlignment?` clause so only-Logic-Pessimistic-Individual characters can learn `nirvana-fallacy`. Pre-emptive; wait for a concrete content need.
