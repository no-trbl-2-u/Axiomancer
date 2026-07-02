# Phase 158 — Equipment system cleanup (status-centered)

> **DOCTRINE-CENTRAL.** Filed via oversight 2026-06-20 (Q1 write-in:
> "cleanup on … equipment … its own phase … major attention").
> Source: T oversight 2026-06-20. Spec ref: 05e (set items) / 05c
> (templates).

## Goal

Make equipment-set choices revolve around **enabling and resisting status
effects** (per the load-bearing doctrine: status effects are the MAIN fun;
a change that makes basic-attack/flat-stat trading more attractive than
status play is a balance failure). Each named set should read as a
status-effect investment, not a flat-stat investment.

## Audit verdict (what's actually wrong)

- **Affix layer (Phase 157): already status-centered.** `drawAffix` now
  biases offensive status affixes to dominate weapon/hands rolls. The
  per-item *choice* surface is doctrine-aligned. **Leave it.**
- **Base templates (`equipment.templates.ts`): doctrine-justified floors.**
  Spec 05c Q5 makes base items intentionally weak-but-meaningful flat-stat
  floors; the affix layer carries their status content. Trimming the floors
  would just make low-tier drops vendor fodder. **Leave them.**
- **Set library (`set.library.ts`): the real gap.** Of 7 sets, the payoff
  is mostly flat `statModifiers` + resource start-tokens. Only a few grant
  any `passiveEffects`, and **none** grant the two doctrine-central passive
  families that already exist unused in the effect library:
  - `buff_status_chance_up` ("Monty's Advantage") — *your* statuses land
    more often. The marquee status-OFFENSE payoff.
  - `buff_resistance_body` / `_mind` / `_heart` — resist *enemy* statuses.
    The status-DEFENSE payoff.
  Assembling a set currently rewards flat-stat stacking, which is exactly
  the failure mode the doctrine names.

## The fix (smallest change, no new engine machinery)

The `SetBonus.passiveEffects` hook is already materialised combat-scoped by
`initializeCombat` (`getActiveSetPassiveEffectIds` → `applyEffect` with the
`-1` combat-lifetime sentinel). So this is **pure data retuning** of
`set.library.ts` + tests. No resolver/reducer/type changes.

Give every set a clear status identity by adding (not replacing) a
defining status passive to its top threshold:

| Set | Identity | Added passive |
| --- | --- | --- |
| Wanderer's Road (2pc) | nimble status-evader | `buff_resistance_heart` |
| Iron Discipline (3pc) | drilled to land hits | `buff_status_chance_up` (3pc) |
| Scholar's Circle (2pc) | precise mind-strikes | `buff_status_chance_up` (keeps `buff_critical_rate_up`) |
| Veteran's Plate (4pc) | unbreakable line | `buff_resistance_body` (4pc, alongside existing dmg-reduction) |
| Sage's Regalia (3pc) | warded mind | `buff_resistance_mind` (3pc) |
| Embers of Rebirth (2pc) | (already status-rich) | leave (regen + phoenix vigor) |
| Skirmisher's Kit (3pc) | hit-and-run afflicter | `buff_status_chance_up` (3pc, alongside evasion) |

Existing tested flat-stat / resource invariants are **preserved** — the
status passive is layered on, not swapped in.

## Decisions

- **D1 — Retune sets, not base templates/affixes.** The affix layer is the
  per-item choice surface (Phase 157) and is already status-centered; base
  templates are doctrine-justified floors. Sets are the un-fixed gear-choice
  surface, so that's where the leverage is. "Trim flat-stat-only gear" is
  satisfied by re-anchoring every set's *payoff* on status passives rather
  than deleting items.
- **D2 — Reuse existing effect IDs only.** `buff_status_chance_up` +
  `buff_resistance_*` already exist and are wired through the combat-scoped
  set-passive path. No new effects, no new exports, `src/index.ts` stays
  locked.
- **D3 — Offensive passive on multiple sets is acceptable.** It does not
  stack to absurdity (combat-scoped, `stacking: none`), and spreading the
  status-OFFENSE reward across the "aggressive" sets is the whole point —
  it makes status play the default gear goal rather than a niche.

## Commit units

1. Retune `set.library.ts` (data) + extend `sets.engine.test.ts` with
   Phase 158 status-identity cases; update `docs/equipment.md` Set Items
   section; tick this brief's DoD. (single unit — data + tests + docs)

## Verification

- New hermetic cases in `src/Items/e2e/sets.engine.test.ts` asserting each
  retuned set surfaces its status passive via `getActiveSetPassiveEffectIds`
  and at `initializeCombat`.
- `npm run verify` (type-check + test + build) green.
- `npm run deploy:check` exit 0.

## DoD

- [x] Every set in `set.library.ts` carries a status-OFFENSE or
      status-DEFENSE passive as its defining payoff (except the already
      status-rich Embers of Rebirth).
- [x] Existing flat-stat / resource set invariants preserved.
- [x] Hermetic e2e proves the status passives resolve from the right sets
      (6 new Phase 158 cases in `sets.engine.test.ts`; 21/21 green).
- [x] `docs/equipment.md` Set Items section updated (full 7-set table) +
      CHANGELOG Changed entry.
- [x] `npm run verify` (type-check + type-check:tests + lint + build) green;
      tests 1879 pass via the `config:false` bypass for the container's
      vite7/vitest3 ERR_REQUIRE_ESM mismatch (documented env issue, critique
      pass 77). `npm run deploy:check` green.

## Out of scope

- Base-template stat-floor changes (doctrine-justified per Spec 05c Q5).
- Affix-draw changes (done in Phase 157).
- New effect-library entries or new `src/index.ts` exports.
- Adding more sets (iterate-tier content authoring).
