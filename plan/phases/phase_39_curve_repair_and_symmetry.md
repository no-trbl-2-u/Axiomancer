# Phase 39 — Post-D8 flag-on curve repair + library theme-symmetry restoration

> Agent-facing brief. ONE bounded tuning phase merging three standing
> candidates (curve repair, theme symmetry, starter-library trim/duplication +
> `scoreCard` v2 retune) per the build-plan row's own instruction — do NOT
> ship them separately. `/deck-tuning` owns the sandbox-first court; delegate
> the forge work to the `card-expert` subagent. Runs against
> `axiomancer-mechanics`.

## Inputs

1. `plan/steps/01_build_plan.md` Phase 39 row (the scope statement + owner
   ruling on foundry/grace).
2. `plan/PHASE_CANDIDATES.md` — the three source rows now struck through and
   merged here: "Post-D8 flag-on curve repair", "Library theme-symmetry
   restoration", "Starter-library trim + duplication pass". Read all three in
   full; this brief compresses but does not replace them.
3. `plan/tuning/2026-07-18-card-library-fanout-synthesis.md` §A (owner
   rulings R1-R4) + §C/E (per-card triage + routing) — R2 (trims paused,
   duplication stays open) and the foundry/grace routing row are load-bearing.
4. `plan/tuning/2026-07-18-d8-preset-dice-valves.md` §gate rerun — the
   measured gap this phase closes (early in-band for erosion/oratory/refrain
   only; mid a cliff for 8/10; late/impossible ~0 except oratory's
   dominance).
5. `axiomancer-mechanics/docs/reports/preset-metrics/2026-07-18-card-library-dashboard.html`
   ("The Card Ledger") — the 13-candidate duplication chart and per-card
   opp%/dWR/rounds-σ data. Read live; this brief does not transcribe it.
6. `axiomancer-mechanics/src/Cards/e2e/curated-library.engine.test.ts`
   `POST_D8_SHAPE` — the pin this phase ends by restoring to a symmetric law.
7. `axiomancer-mechanics/src/Combat/combat.starter-deck-presets.ts` —
   `COMBAT_DECK_PRESETS` + `PRESET_COLOR_BORROWS`.
8. `git show 10ec4fe8` (Phase D8) — the removal commit. All ten retired card
   literals are recoverable verbatim from `10ec4fe8~1:axiomancer-mechanics/src/Cards/cards.library.ts`
   (already extracted below — no re-derivation needed).

## Scope

### A. Library theme-symmetry restoration (data-only for 6 of 7 cards)

Ten cards were retired at D8 as reward-only / zero-played. This phase
restores the **seven** whose types fill an existing ench/dis symmetry gap or
serve a routed identity ruling — verbatim literals below, pulled from
`10ec4fe8~1`:

| Card id | Theme | Type | Fills |
|---|---|---|---|
| `practiced-cadence` | peroration | enchantment | peroration's missing ench |
| `captive-audience` | peroration | disenchant | peroration's missing dis |
| `entropy-tax` | forge | disenchant | forge's missing dis + foundry's status-engine ruling |
| `achilles-and-the-tortoise` | control | enchantment | control's missing ench |
| `fated-course` | oracle | disenchant | oracle's missing dis |
| `the-tithe` | harvest | disenchant | harvest's missing dis |
| `heart-of-the-matter` | charm | spell (alt-win) | grace's SWAY-finisher ruling |

**Do NOT restore** `straw-mans-jab` (affliction), `ad-nauseam` (echo), or
`memento-mori` (harvest spell) — their themes already meet `POST_D8_SHAPE`
without them; restoring would re-break the pin, not fix it. This also
answers the "does akrasia/bulwark keep its 8th card or trade it" question
from the source row: **keep as-is** — neither theme is touched by this
restoration (their 8/10-card counts came from the 2026-07-19 swap-pool
promotions, unrelated to the ench/dis gap this phase closes).

Six of the seven (`practiced-cadence`, `captive-audience`,
`achilles-and-the-tortoise`, `fated-course`, `the-tithe`,
`heart-of-the-matter`) need **zero engine work** — grep confirms their
`persistentEffect`/`specialMechanics` hooks are still live in
`combat.engine.ts` (`zoneHas(state, '<id>')` call sites at the
`practiced-cadence`, `achilles-and-the-tortoise`, `the-tithe`,
`fated-course`, `captive-audience` sites; `heart-of-the-matter` composes
generic `sway`/`echo`/`rider` `specialMechanics`, no per-card hook at all).
Restoring them is: paste the literal back into `cards.library.ts` at its old
position, add it to the `cardLibrary` export array, done.

`entropy-tax` is the one exception — D8 explicitly removed its engine hook
(`combat.engine.ts`, the kindled/floating-die-spend MARK, formerly ~line
3111). Restore this hook verbatim alongside the card:

```ts
// `entropy-tax` (D): spending a KINDLED (temporary) or FLOATING die marks
// the enemy — the manufactured resource has a price (spec 32 v3 T3).
if (zoneHas(state, 'entropy-tax')
    && (poweringSource === 'floating' || (poweringSource === 'reserve' && powering.temporary))) {
    const markDef = lookupEffectDef('debuff_mark');
    if (markDef) {
        const applied = applyEffect(enemy.effects, markDef, state.round, { intensityDelta: 1, sourceId: 'entropy-tax' });
        enemy = { ...enemy, effects: applied.activeEffects };
        events.push({
            kind: 'effect-landed', cardId: 'entropy-tax', effectId: markDef.id, target: 'enemy',
            effectKind: 'control', intensity: applied.result.activeEffect?.intensity ?? 1, effect: markDef,
        });
    }
}
```
(insert in `playBottomAction`, immediately after the `forgedFloating` splice —
same site D8 deleted it from; `zoneHas`/`lookupEffectDef`/`applyEffect` are
already in scope there.)

Restoring these seven grows `cardLibrary` 79 → 86. Update `POST_D8_SHAPE` in
`curated-library.engine.test.ts` (rename the `it` block's post-condition
comment to reflect the restoration) to:

```
affliction: unchanged (8/2/3/3/1/1)
peroration: { n: 10, common: 3, uncommon: 3, rare: 4, enchantment: 1, disenchant: 1 }
forge:      { n: 9,  common: 3, uncommon: 2, rare: 4, enchantment: 2, disenchant: 1 }
akrasia: unchanged (8/2/3/3/1/1)
control:    { n: 8,  common: 2, uncommon: 3, rare: 3, enchantment: 1, disenchant: 1 }
oracle:     { n: 9,  common: 2, uncommon: 4, rare: 3, enchantment: 1, disenchant: 1 }
harvest:    { n: 7,  common: 1, uncommon: 3, rare: 3, enchantment: 1, disenchant: 1 }
charm:      { n: 9,  common: 2, uncommon: 4, rare: 3, enchantment: 1, disenchant: 1 }
bulwark: unchanged (10/4/2/4/1/1)
echo: unchanged (8/3/2/3/1/1)
```
Total 86, sum-checked. Update the `.length).toBe(79)` assertion to `86` and
the "9 owner-ratified..." comment to note the phase-39 restoration.

### B. Foundry/grace identity seats (owner-ruled — needs sandbox swap-sweep evidence first, per `/deck-tuning` §3 guarded tier)

The owner ruling (routed from the fan-out ballot, folded into this phase) is
to **reseat**, not merely re-library:

- `foundry` preset: replace the `mirror-of-longing` borrow (charm, disenchant)
  with `entropy-tax` (forge, disenchant) in `cardIds` — retires the
  `mirror-of-longing` entry from `foundry`'s `PRESET_COLOR_BORROWS` row.
- `grace` preset: replace the `ouroboros` borrow (echo) with
  `heart-of-the-matter` (charm) in `cardIds` — retires `ouroboros` from
  `grace`'s `PRESET_COLOR_BORROWS` row.

**Color-law flag (do not skip):** `entropy-tax`'s `philosophicalAspect` is
`mind`; `mirror-of-longing` currently fills foundry's `heart` slot (per the
recipe comment: "heart = signs×4 + mirror-of-longing"). A straight swap
overfills `mind` (already bootstrap×2+ex-nihilo×2+anvil×1=5) and underfills
`heart` (signs×4=4) — this is NOT a legal 1:1 swap. Resolve the 5/5/5 before
applying: either find a different vacating slot for `entropy-tax` (re-check
its `philosophicalAspect` is genuinely `mind` in the restored literal) or
shuffle a second card. **Verify color balance with the structural test
(`combat.starter-deck-presets` color-law suite) before treating the seat
change as done** — do not hand-wave the arithmetic. `heart-of-the-matter`
(`heart`) replacing `ouroboros` (`mind`) in grace has the identical problem
(grace's mind slot is second-thoughts×4+ouroboros=5, heart is
soft-word×4+irresistible=5) — same resolution discipline applies.

Because this is a recipe/seat change, treat it as `/deck-tuning`'s guarded
tier: run the swap-sweep (`--deck=preset:foundry+swap:mirror-of-longing/entropy-tax`
and `--deck=preset:grace+swap:ouroboros/heart-of-the-matter`) across ≥2
stages × ≥2 policies BEFORE editing the shipped recipe, per the standard
A/B discipline — even though the owner has already ruled on the *direction*
(status-doctrine failure, not identity), the *color-law arithmetic* and
*swap magnitude* still need real numbers. If the swap regresses foundry's or
grace's doctrine bands outright, apply it anyway (the ruling stands — it is
a doctrine-correctness call, not a win-rate optimization) but record the
delta honestly in the report.

### C. Curve repair (the doctrine gap)

Per `plan/tuning/2026-07-18-d8-preset-dice-valves.md`: early in-band only for
erosion/oratory/refrain; mid a cliff for 8/10 presets; late/impossible ~0
except oratory (dominance finding). Close this using the ranked levers from
the Card Ledger dashboard + fan-out synthesis, **in this order**:

1. **Duplicate proven staples into failing decks** (the venom-and-vein
   pattern — read the dashboard's live "ready to duplicate" chart for the
   current 13-candidate list; do not assume last measurement's numbers are
   still current). This is a `recipe()` copy-count change, free tier.
2. **Cut flag-off-seated drags**: `crown-of-thorns` (dWR −19), `mirror-of-guilt`
   (−15), `self-flagellant` (−10) — all seated in `penitent`, all
   untouchable during D8 by the byte-identity law, now unblocked. Re-measure
   post-D8 first (the fan-out synthesis flagged these as "mostly back-loaded
   1-ofs indicting the curve, not the cards" — confirm the drag still holds
   on the current tree before cutting).
3. **Retune fizz gates**: `ouroboros` (target ~25% fizz) and
   `second-thoughts` (~16%) — precondition-width tuning, not pricing.
4. **Give each deck an oratory-style mid-game second gear** — the restored
   ench/dis cards from §A/§B ARE this lever where they land (per
   `PHASE_CANDIDATES.md`: "new cards can be the mid-game second-gear payoffs
   the failing decks need"); where a preset's restoration doesn't reach it
   (e.g. a preset with no restored card), duplication (lever 1) is the
   fallback second gear.

Every lever needs sandbox-first A/B evidence per `/deck-tuning` §3/§5 before
applying — same seeds, before/after, ≥2 stages × ≥2 policies. One change per
axis at a time.

### D. `scoreCard` v2 retune + starter-library trim/dedup

The owner-led starter-library pass (source: 2026-07-18 metrics-slate
session) asked to TRIM first, then duplicate. **Trims are PAUSED by owner
ruling R2** (2026-07-18) — never-played is a reachability artifact for the
reward-only dead cards, not a quality verdict. This phase therefore does
**duplication only** (§C lever 1) and does NOT cut any card for being
low-play, EXCEPT the three named dWR drags in §C lever 2 (which are cut for
negative win-rate contribution, not low play count — a different, permitted
justification).

`scoreCard` v2 (parts 1/2 shipped as Phase 36a/36b) already prices
alt-win/tempo axes; "retune" here means: after §A-C land, re-run the pricing
lint (`src/Cards/e2e/pricing.engine.test.ts`) over the changed cards
(restorations + any duplicated/cut seats) and fix any `// pts:` comment that
no longer sums into its printed rank's band. No `scoreCard` formula change is
authorized by this phase — if the retune reveals the formula itself is
wrong (not just a stale comment), file it as a follow-up, don't fix it here
(formula changes are their own review, per `/deck-tuning` §3 propose-only
tier for anything touching `toCombatCard`/`effectImpact`; `scoreCard` itself
is data-adjacent but a formula change is out of this phase's bounded scope).

## Decisions made upfront — DO NOT ASK

- Restore exactly the seven cards listed in §A; leave `straw-mans-jab`,
  `ad-nauseam`, `memento-mori` retired.
- akrasia and bulwark keep their 8/10-card counts as-is (not touched by this
  phase).
- Foundry/grace seat swaps proceed per the owner ruling regardless of
  win-rate delta (doctrine-correctness call) — but the color-law arithmetic
  must actually balance before the recipe edit ships; if `entropy-tax`'s or
  `heart-of-the-matter`'s aspect can't be reconciled into the vacated slot
  with a single swap, work out the smallest compensating shuffle (e.g. an
  in-theme card trading positions between two color slots) and show the
  5/5/5 arithmetic in the commit body.
- No `scoreCard` formula change; comment/pricing-lint fixes only.
- No further trims beyond the three named dWR drags.
- If the Card Ledger dashboard's 13-candidate list has drifted from the
  quoted count since 07-18, trust the live dashboard over this brief.

## Surface as `[needs-user-call]`

- Any duplication or cut whose color-law fallout requires a genuine recolor
  (not just a slot shuffle within the existing 5/5/5) — list, don't invent.
- If the foundry/grace color-law arithmetic cannot be resolved without
  touching a THIRD card's color assignment in a way that changes its
  identity — surface rather than force it.

## Prove (DoD)

- `npm run verify` green, including balance-band, card-coverage,
  line-telemetry, curated-library (shape pin), and pricing-lint witnesses.
- Every applied lever (§A restorations, §B seat swaps, §C duplications/cuts/
  fizz retunes) carries before/after matrix evidence in the commit body or an
  attached report, per `/deck-tuning` §5 delivery discipline.
- `POST_D8_SHAPE` pin restored to a symmetric law (§A table) and the
  `cardLibrary.length` assertion updated to 86.
- Re-run `npm run combat-playtest -- --stage=all --policy=all --deck=preset:all --runs=60 --seed=1 --cards`
  post-change; regenerate the baseline (ROOT `npm run baseline:regen`).
- Flip Phase 39 `[x]` in `plan/steps/01_build_plan.md` + commit hash.

## Follow-ups

- Phase 40 (card-text grammar + copy pass) depends on this phase landing
  first — it covers the card set this phase leaves standing.
- Any `scoreCard` formula defect found during the pricing-lint retune is a
  new candidate, not silently fixed here.
- Enchantment paid-line orphans, dWR drag residue beyond the three named
  cuts, and the choice-width instrument all stay parked per the fan-out
  synthesis routing table — not this phase's scope.
