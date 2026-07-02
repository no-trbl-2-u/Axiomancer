# Phase 156 — Status-effect depth expansion (doctrine-central)

## Outcome

The Phase 142 status-effect interaction engine becomes **live and correct**.
Today it is dead-on-arrival: `EFFECT_INTERACTIONS` references effect IDs that
do not exist in the library, and `evaluateInteractions` is never called by the
live combat resolver. Phase 156 fixes the registry to reference only real
effects, wires combo amplification into the live DoT aggregation so combos
actually deepen status play during a fight, and adds a small set of new
combo-enabling effects — all while preserving status-effect breadth and the
STRATEGIST engagement floor.

## Source

Filed via oversight 2026-06-20 (Q3: T — "File a status-effect depth phase").
**Doctrine-load-bearing** per CLAUDE.md / VISION.md: status effects are the MAIN
fun in combat; low engagement is a balance failure. Phase 142 follow-on. Ships
after Phase 155's cleanup baseline (c7d8b44).

## Investigation findings (decisions rest on these)

1. `src/Effects/interactions.ts` + `src/Effects/amplification.registry.ts`
   export `evaluateInteractions` / `applyInteractionResult` / `EFFECT_INTERACTIONS`,
   but grep confirms they are referenced ONLY by the two barrels
   (`src/index.ts`, `src/Effects/index.ts`) and their own e2e test. The live
   combat resolver (`src/Combat/combat.resolver.ts`, `src/Combat/phases/*.ts`)
   never calls them. The combo system has zero effect on a real fight.
2. `EFFECT_INTERACTIONS` triggers/targets reference nonexistent effect IDs:
   `debuff_acid`, `debuff_vulnerability`, `debuff_drain`, `debuff_weakness`,
   `debuff_mind_mark` (real id is `tier1_mind_mark`), `buff_focus`,
   `buff_shield`, `buff_inspire`, `buff_rally`. Most combos could never fire
   even if wired in. `validateInteractions(validIds)` would currently report
   many errors — but nothing calls it as a guard.
3. The single live aggregation pass over a combatant's effects is
   `getActiveEffectModifiers(effects)` in `src/Combat/effect-modifiers.ts`. It
   produces `dotStart`/`dotEnd` (consumed by `processDamageOverTime` in
   `src/Combat/effects.ts`, emitted as `dot` round events). This is the clean,
   single injection point for live combo amplification of DoT.

## Decisions made upfront — DO NOT ASK

1. **Reading of "depth expansion"**: make the existing interaction engine
   real, not add a parallel system. "Within the existing kit" is honoured —
   we reuse the Phase 142 `interactions.ts` types/functions and the
   `resolution.constants.ts` bounds; we don't invent a new engine.
2. **Live wiring point**: amplify DoT inside `getActiveEffectModifiers`, after
   the base aggregation loop, by evaluating `amplify_damage` combos present in
   the same `effects` array and scaling `dotStart`/`dotEnd`. This touches only
   the transient aggregated totals — never the persisted `ActiveEffect.intensity`
   — so there is NO double-application risk with `applyInteractionResult`
   (which the live path does not call). Every consumer of DoT (round-start /
   round-end events, resolution thresholds) sees the boost for free.
3. **Bounds**: amplification is clamped to
   `INTERACTION_AMPLIFICATION.MAX_DAMAGE_MULTIPLIER` (2.0). Multiple
   simultaneous `amplify_damage` combos targeting the same effect take the
   single largest multiplier (no stacking blowups).
4. **Breadth preservation (doctrine guard)**: ONLY `amplify_damage` combos are
   auto-applied live, because DoT is the only purely-numeric round tick that
   can be amplified without touching control resolution. `amplify_duration` /
   `amplify_intensity` / `grant_advantage` / `reduce_resistance` combos remain
   available through the exported `evaluateInteractions` API for skills/UI, so
   control and buff status play is not eclipsed by a DoT-only buff. This keeps
   poison/bleed builds AND control/debuff builds both rewarded.
5. **Registry-tunable**: combo multipliers stay data in `amplification.registry.ts`,
   consistent with combat-tuning `--focus`. New effects carry `addedIn` + `tags`.
6. **New effects**: add 3 combo-enabling debuffs/buffs to the libraries so combo
   play has fresh hooks (e.g. an `acid`-style armor-melt DoT and a
   `vulnerability`-style exposure debuff that the rebuilt registry pairs with
   existing poison/bleed/burn). Kept HERE (not deferred to 157/158) because the
   combos depend on them; affix/equipment phases consume effects, they don't
   author combat combos.
7. **Guard test**: a hermetic test asserts `validateInteractions` returns zero
   errors against the live effect-id set, so no future combo can silently
   reference a missing effect.
8. **Engagement floor**: `STATUS_ENGAGEMENT_FLOOR_PERCENT` (40) unchanged;
   making combos live raises the payoff of status play, which can only help the
   floor. Witness re-measurement deferred to the next `/combat-tuning` tick per
   Phase 126/155 precedent.

## Implementation units

### Unit 1 — Rebuild the interaction registry against real effects
- File: `src/Effects/amplification.registry.ts`
- Every `primaryEffectId` / `secondaryEffectIds` / `targetEffectId` must resolve
  in the live library. Repoint dead combos onto real ids; add combos that pair
  the new Unit 3 effects with existing DoT debuffs.
- Keep priorities via `INTERACTION_PRIORITY`; keep multipliers within
  `INTERACTION_AMPLIFICATION`.

### Unit 2 — Live DoT combo amplification
- File: `src/Combat/effect-modifiers.ts`
- After the base loop, compute the set of triggered `amplify_damage` interaction
  results for `effects` (via the Effects barrel), derive the largest valid
  multiplier per DoT phase, clamp to `MAX_DAMAGE_MULTIPLIER`, and scale
  `agg.dotStart` / `agg.dotEnd` (floor to int, matching existing DoT math).
- No resolver changes — `processDamageOverTime` already reads these fields.

### Unit 3 — New combo-enabling status effects
- Files: `src/Effects/debuffs.library.json`, `src/Effects/buffs.library.json`
- 3 new effects with philosophy-styled names, `addedIn: 2026-06-20`,
  `tags: ["status-effect", ...]`. Each is referenced by at least one Unit 1
  combo.

### Unit 4 — Hermetic e2e + registry guard
- File: `src/Combat/e2e/status-combo-amplification.engine.test.ts` (new) —
  drive a real combat round through the resolver with poison+bleed present and
  prove the `dot` event amount is amplified vs. the same round without the combo.
- File: `src/Effects/e2e/status-depth.engine.test.ts` (extend) — add a guard
  case asserting `validateInteractions(liveIds)` === [] and that every rebuilt
  combo's ids exist.

## Verify gate

- `npm run type-check`
- `npm test` (incl. new + extended e2e)
- `npm run verify`
- `npm run deploy:check`

## Definition of Done

- [ ] `EFFECT_INTERACTIONS` references only real effect ids (validated by a guard test).
- [ ] `amplify_damage` combos amplify DoT in a LIVE combat round (proven by resolver-level e2e).
- [ ] Amplification clamped to `MAX_DAMAGE_MULTIPLIER`; no double-application.
- [ ] 3 new combo-enabling effects added, each wired into a combo, tagged for `--focus`.
- [ ] Control / duration / advantage combos still reachable via `evaluateInteractions` (breadth preserved).
- [ ] Engagement floor constant unchanged; doctrine breadth guard documented.
- [ ] `npm run verify` + `npm run deploy:check` green.

## Follow-ups (out of scope)

- Skill-driven application of `amplify_duration` / `grant_advantage` combos (separate skill phase).
- Enemy AI awareness of combos.
- Affix/equipment status-coupling (Phases 157/158).
- Witness re-measurement of STRATEGIST engagement (next `/combat-tuning` tick).
