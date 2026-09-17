# Phase 90 — Summoner / multi-hit enemy archetype

> Promoted via `/oversight` 2026-09-17 from `PHASE_CANDIDATES.md` [score 4.5].
> Brief generated 2026-09-17 by `/ship-a-phase` §9 (no prior brief existed).
> Corroborates `/adjust-enemies` pass 11's filed roster gap, commit `b718b421`.

## Outcome

A new `EnemyKeyword` — **FLURRY N** — makes a foe's telegraphed hit land as N
separate damage instances instead of one, same total threat-damage budget.
Shipped on `enemy-guild-knife` (the "clause by clause" elite), whose existing
cause-line prose already describes exactly this. The **summoner/add-spawning**
half of the candidate row is explicitly deferred — see Decisions.

## What exists, measured

- `resolveThreatPhase` (`combat.engine.ts`) already resolves
  `phase.threatAction.effects` as an ARRAY, applying GUARD → BARRIER → RIPOSTE
  soak and every per-hit rider (VENOM, RAVENOUS, WOUNDING, the
  damage-instance DoT trigger) independently per array entry — the multi-hit
  control flow the filed finding worried was missing already exists. The
  `projectIncomingThreat` selector's own doc comment confirms this was
  anticipated: "a phase with more than one damaging effect is... not scaled
  per-effect like the real resolution; a known, documented simplification."
- The gap is authoring-only: `buildThreatAction` (`combat.threat.ts`) takes a
  single `damage: number` and only ever pushes one `{ damage }` entry. No
  roster enemy has ever had a reason to push two.
- `EnemyKeyword` (`enemy-keywords.ts`) is the existing "arithmetic changer"
  shape for exactly this kind of trait (HIDE/SWIFT/BRUTAL/VENOM/UNSHAKEN/
  ELUSIVE/REGROW/RAVENOUS/WOUNDING) — each read inside `resolveThreatPhase`
  off `enemy.keywords`, not baked into per-phase authoring. FLURRY fits this
  shape exactly, and reading it at resolution time (not authoring time) means
  it applies uniformly whether the enemy's sequence is hand-authored
  (`combat.threat-sequences.ts`) or generated (`defaultThreatAction`) — zero
  changes needed to the authoring layer.
- The player side already has this exact doctrine one layer up: the `deal`
  special mechanic's `hits` field (`{ kind: 'deal', amount: 10, hits: 3 }`)
  fires N **full-amount** instances — a damage amplifier. FLURRY is
  deliberately NOT that shape (see Decisions).

## Decisions made upfront — DO NOT ASK

- **Ship FLURRY (multi-hit); defer the summoner (add-spawning) half of the
  candidate row entirely.** Verified before touching code: combat is
  hard-coded to one enemy (`World/encounter.ts`'s `enemies: [scaled]`,
  `combat.engine.ts` reads a singular `state.enemy` throughout the ~250-line
  `resolveThreatPhase` alone). A literal summoner needs real multi-enemy
  combat state — new `CombatEncounterState` shape, new UI (multiple enemy
  panes), new targeting, every soak/rider/keyword function re-plumbed from
  `state.enemy` to an array. That is its own phase (or several), not a
  same-tick addition alongside a keyword. Filed as a follow-up below rather
  than attempted partially.
- **FLURRY splits the SAME damage budget across N hits; it does not add
  damage.** The alternative (copy the player-side `deal.hits` shape — N
  *full* instances) would silently reinflate the level/difficulty threat
  budget the whole roster retunes from, and the filed finding explicitly
  wants the antagonist to feel "structurally different... not just
  numerically bigger." A same-budget split serves that framing; a damage
  amplifier would not.
- **What FLURRY actually punishes, verified by tracing the soak arithmetic —
  documented honestly rather than repeating the filed finding's framing
  unchecked.** GUARD and BARRIER are additive point pools drained
  sequentially (`guardAbsorbed = min(floor(guard/divisor), dmg)`); splitting
  one hit into N pieces of the same total is provably order- and
  split-invariant for an additive pool (a telescoping sum: total absorbed =
  `min(pool, total demand)` regardless of how the demand is chunked). So
  FLURRY does **not** make a stacked GUARD/BARRIER wall less effective — the
  filed finding's "punishes GUARD/BARRIER" framing doesn't hold under this
  engine's actual soak formula, and this brief does not ship code pretending
  otherwise. What FLURRY genuinely changes: RIPOSTE's parry (`riposte.reduce`)
  is a flat ONE-SHOT reduction gated by a `riposteFired` flag — it blunts
  only the FIRST strike of a flurry, so the rest land clean where a single
  equivalent hit would have been parried whole. And any per-landed-hit rider
  the foe also carries (VENOM's poison application, RAVENOUS's lifesteal, the
  player's own damage-instance DoT trigger) fires once per strike instead of
  once per phase. That is a real, different fight texture — a single-parry
  deck answers a one-hit foe very differently than a three-hit one — even
  though it is not the GUARD/BARRIER-specific mechanism first proposed.
  Regression-tested (see Tests).
- **Reading FLURRY at resolution time, not authoring time.** Mirrors
  SWIFT/BRUTAL exactly (`findEnemyKeyword(enemy.keywords, 'flurry')` inside
  `resolveThreatPhase`), rather than adding a `hits` field to
  `AuthoredThreatPhase` and touching every phase of a sequence. Smaller
  surface, one enemy-level trait, works identically for authored and
  unauthored sequences.
- **The combat log shows the resolved (split) effects, not the authored
  single number.** `threat-fired`'s `effects` field now carries the
  post-split array, so a FLURRY foe's log reads as three separate "N DAMAGE"
  lines (`enemyActionLines`, mobile presenter) — legible multi-hit texture at
  the moment it resolves. The pre-fight telegraph preview
  (`projectIncomingThreat`) is untouched and keeps showing the summed raw
  number, per its own pre-existing documented simplification — no new
  precedent, just reusing the one already on record.
- **Retrofit exactly one roster enemy: `enemy-guild-knife`.** Elite tier
  (`difficulty: 'elite'`, 1–2 keywords is the stated budget for that tier —
  FLURRY is its only one), and its existing, un-rewritten cause line —
  "Clause by clause, the blade finds where you initialed" — already
  describes multiple small strikes rather than one. No new enemy, no new
  portrait, no flavor-text rewrite needed. `n: 3` (three strikes) chosen to
  make the RIPOSTE-dilution and per-hit-rider effects observable without
  needing a large `n`.
- **No change to `AuthoredThreatPhase`, `buildThreatAction`, or
  `combat.threat-sequences.ts`.** The keyword-at-resolution-time design makes
  every one of these untouched; confirmed by grep that `enemy-guild-knife`
  has no entry in `AUTHORED_THREAT_SEQUENCES` (it uses the generated
  sequence), so this also proves FLURRY works for generated sequences, not
  just hand-authored ones.

## Surface

| File | Change |
|---|---|
| `src/Enemy/enemy-keywords.ts` | New `EnemyKeyword` member `{ kind: 'flurry'; n: number }`; `ENEMY_KEYWORD_KINDS`, `_LABEL`, `_GLOSS` entries |
| `src/Combat/combat.engine.ts` | `splitFlurryDamage` helper; `resolveThreatPhase` reads `foeFlurry`, splits damage-bearing effects before the soak loop, logs the resolved (split) effects on `threat-fired` |
| `src/Enemy/enemy.library.ts` | `enemy-guild-knife` gains `keywords: [{ kind: 'flurry', n: 3 }]` |
| `docs/keyword-atlas.md` | "Enemy keywords (9)" → "(10)"; new FLURRY row + explanatory paragraph on what it does and doesn't change |
| `axiomancer-mobile/state/presenters/combat-encounter.engine.ts` | `ENEMY_KEYWORD_GLYPHS.flurry` (TS exhaustiveness forces this) |

## Output schema / contracts

`EnemyKeyword` union grows by one member (additive, no existing member
changed). `CombatEvent`'s `threat-fired.effects` field's *contents* change for
FLURRY-carrying foes only (more, smaller entries summing to the same total);
its type is unchanged (`CombatThreatEffect[]`).

## Empty / loading / error states

N/A — engine/content phase, no new UI surface. `foeFlurry` defaults to 0
(no-op) for every enemy without the keyword; the split path is fully
opt-in per-enemy.

## Tests

- `src/Combat/e2e/big-numbers.engine.test.ts`, new cases in the existing
  `describe('enemy keywords change the arithmetic of a resolved threat', ...)`
  block (mirrors the SWIFT/BRUTAL/VENOM/WOUNDING tests already there):
  - FLURRY N splits the telegraph into exactly N damage instances summing to
    the *same* raw budget as an unsplit hit (exact equality — the split is
    computed pre-scaling, so no rounding drift).
  - RIPOSTE's one-shot parry only blunts the first flurry strike (a
    dominant `reduce` that fully parries a single hit lets strictly more
    damage through against an equal-budget flurry).
  - A per-hit rider (VENOM) fires once per landed strike under FLURRY, not
    once per phase (`enemy-keyword-fired` event count).
- No mobile-side test added: `ENEMY_KEYWORD_GLYPHS` is a `Record` over the
  full `EnemyKeyword['kind']` union, so a missing entry is a **compile-time**
  failure (`npm run verify`'s typecheck), not a runtime gap needing a test.

## Verify gate

`npm run verify` scoped to `axiomancer-mechanics` (engine + keyword + roster
changes) and `axiomancer-mobile` (typecheck only touches the glyph map).

## DoD

- [x] `FLURRY N` keyword ships (type, label, gloss, resolution logic).
- [x] `enemy-guild-knife` carries `FLURRY 3`.
- [x] `docs/keyword-atlas.md` reflects the 10th enemy keyword.
- [x] Mobile glyph map compiles (TS exhaustiveness).
- [x] New engine tests cover the split, the RIPOSTE interaction, and the
      per-hit rider interaction.
- [x] `npm run verify` green.

## Follow-ups (out of scope)

- **Summoner / add-spawning archetype.** Needs real multi-enemy combat
  state — a dedicated phase (or a short mechanics-expert design session
  first, the way Phase 85 resolved the accessory-kind gap), not a
  same-tick addition. `plan/PHASE_CANDIDATES.md`'s filed finding covers the
  evidence; re-file a fresh candidate row scoped to the engine architecture
  question alone (multi-enemy state shape) once this phase ships.
  Corroborating evidence unchanged from `/adjust-enemies` pass 11.
- **Retrofit FLURRY onto a second roster enemy** (e.g. a bird-of-prey or
  swarm-themed foe) for broader roster presence, once the one-enemy proof
  has been played and confirmed to read well.
