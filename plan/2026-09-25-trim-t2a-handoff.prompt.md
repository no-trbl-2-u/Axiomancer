# Prompt: TRIM THE FAT — finish T2a, then T2b

> **Status: EXECUTED 2026-09-25.** §3 steps 1–4 merged (#371–#374; T4 #375). Continue from `plan/2026-09-25-trim-t5-handoff.prompt.md`.

> Written 2026-09-25 at T's direction, mid-T2a. T asked the session to stop,
> write this handoff, file the residue, and merge the branch **as-is**
> (owner call: merge without re-running the gates). Main may therefore be
> red when you start. **Your first job is to make main green.**
>
> Read first, in order: `plan/2026-09-25-refactor-strategy.decisions.md`
> (D1–D14), `plan/2026-09-25-trim-the-fat.spec.md`,
> `plan/2026-09-25-trim-the-fat.prompt.md` (standing frame ¶1–¶9 still
> binds), then this file. Nothing here overrides those.

## 0. State at hand-off

T1 merged (PR #369). T2a was split from T2 by D13 (T2a = engine dead code +
Tier 0 items 1–5; T2b = D7 dice-flag collapse). T2a landed on main in one
merge whose last commits were **not verified end to end**.

Last verified points:

| Check | Last known result | When |
|---|---|---|
| mechanics `vitest` | 224 files / 3611 pass | after test-only module deletions, BEFORE Tier 0 items 2–4 and Faction |
| mechanics `tsc` src / tests / cli | clean | after Faction + migration edit (tests had 1 error, fixed by a one-line edit in `Game/e2e/game.loop.engine.test.ts`, not re-checked) |
| mobile `tsc` + `jest` | 0 errors / 3193 pass | after the D14 derived-stat cut, BEFORE Faction and the consumable/enchant cuts |
| card-editor `type-check` | clean | after the synergy-field cut |
| `verify:visual`, `baseline:check` | **not run** | — |

Known to be broken on main until fixed:

1. **Mobile type-check**: `axiomancer-mobile/state/dev/inspector.ts:141`
   reads `g.factionReputations`, which no longer exists on `GameStore`.
   Delete that inspector row.
2. **Mobile test**: `components/combat/encounter/__tests__/CombatEncounterPanel.endcombat-routing.test.ts:102-103`
   asserts faction reputations after befriending the King of Revenge.
   Faction is deleted; drop those two assertions and the "faction" mention
   in its header, keep the rest of the befriend routing coverage.
3. **Unverified mechanics suite** after: Tier 0 item 2 (consumables),
   item 3 (enchant), item 4 (relic VITAE), Faction deletion, v25 migration
   faction strip. Run it; fix what the deletions explain; treat anything
   else as a real finding (frame ¶7).
4. **Visual baselines**: `axiomancer-mobile/screenshots/baseline/character.png`
   (Derived + Saves section removed) and likely `combat-encounter.png`
   (pilgrim modal table/LUCK chip removed — only if the capture opens it).
   Re-capture with the repo's approve flow and eyeball the diff.
5. **Perf baseline**: mechanics source changed (RNG stream changed — the
   threat-clock enchant no longer draws `rng()` every 5th round; loot tables
   changed). `npm run baseline:check` will read STALE; re-stamp with
   `npm run baseline:regen` (or the digest's reduced nightly) and cite it.

## 1. What T2a did (on main now)

- **Legacy d20 pipeline deleted**: combat-effects (+JSON), damage,
  damage-resist, advantage, dice, stats, difficulty, combat.constants,
  getEffectiveStats, calculateCardDamage, EFFECT_BASE_PROC_INTENSITY;
  moral-meter enemy scaling in START_COMBAT; Tier 1 stance effects/procs
  (tier1Overrides/procUnlocks/procOverrides + 126 enemy data blocks).
- **Dead synergy code**: Phase 66 branch in `executeCard`, `synergy-fired`
  event, six CardSynergy fields, Phase 142 extended predicates
  (`checkStatePredicate` kept). Card-editor codegen arm dropped.
- **D12** (Tier 0 item 5): hidden d20 on Tier 2 buffs removed.
- **D14** (Tier 0 item 1 + Tier 1 derived-stats row): DerivedStats,
  NonCombatStats, luck, multipliers, recomputeDerivedStats,
  getEquipmentModifiers, EffectStatTarget, effect statModifiers, relic
  body/mind/heart lines. `StatModifier` is now `{ stat: 'maxHp'; value }`.
  DoT `damageType` is a `Stance`. `isCharacter` keys on `knownCards`.
  Save **v24→v25** hop strips derivedStats/nonCombatStats, non-maxHp stat
  lines, enemy derivedStats, and `factionReputations`.
  Mobile: Derived/Saves section, LUCK, level-up derived ribbon + presenter,
  stat-format, derived tooltips, multiplier rendering all removed.
- **Test-only modules**: Hazard/audit, minigame-harness, map.dispatcher,
  combat.curve-shape, Effects/world-tick, 3 Phase-135 route helpers
  (`isRouteBlocked` is LIVE — kept), 4 interaction helpers,
  `resolveCardDieCost` / `cardDieCostPreview` (CLI now uses `resolveRead`).
  `combat.autoplay` was **moved** to `src/test-utils/combat-autoplay.ts`
  (three surviving tests use it as a harness), not deleted.
- **Faction** deleted (src/Faction, GameState slice, reducer/store wiring,
  4 enemy factionDeltas blocks).
- **Tier 0 item 2**: 11 no-op consumables removed from every loot table
  (weight folded into `none`; guaranteed-drop tables just lose the entry),
  friendship rewards, presets and shops. Definitions kept for old saves.
  One enemy's loot table now drops nothing (it only held no-ops).
- **Tier 0 item 3**: threat-clock EMPOWER/CURSE tier removed (constant,
  event kind, docs row).
- **Tier 0 item 4**: worn armor relic's +5 max VITAE now survives
  `allocateStatPoint` and `LEVEL_UP`.
- Each Tier 0 fix has a hermetic test that failed before and passed after.

## 2. Residue (also filed in `plan/AUDIT.md` Pending)

Small, mechanical, in-scope for finishing T2a:

- `axiomancer-mobile/state/presenters/village.engine.ts` `modWords` still
  has an `isMultiplier` branch (`x${value}`) — dead.
- `axiomancer-mobile/state/presenters/tooltip.engine.ts`
  `formatEffectStatEffect` / `accentForEffect` still read
  `payload.statModifiers` (dead; its tests still exercise it — delete both).
- `axiomancer-mobile/state/presenters/inventory.modal.engine.ts`:
  `STAT_LABELS` luck/derived entries and "luck" comments on
  `round1`/`signed`; `computeItemModifiers` doc still promises tooltip ids.
- `axiomancer-mobile/components/inventory/ItemModal.tsx`: the
  `TooltipTarget` path for `d.id` / `item-mod-${m.id}` is unreachable.
- `CardEvent` kinds `damage` / `heal` in `src/Cards/card.engine.ts` are no
  longer emitted by the card engine.
- `MapState.hazardOutcomes` / `HazardNodeOutcome` are now write-never
  state (their only writer was deleted); consider a v26 strip or leave.
- `buff_all_stats_up` and `debuff_curse` now carry only an inert
  `rollModifier`; nothing applies them after the enchant + consumable cuts.
  Candidate for the deprecated-effects list (keyword/steward decision).
- `validateInteractions` kept (spec listed 5 interaction helpers; it guards
  the live `EFFECT_INTERACTIONS` registry).
- Spec's "~198 barrel exports with no consumer" pass was **not done**.
- Docs still describing removed code: grep `docs/` and `specs/` for
  derivedStats, luck, Faction, factionReputations, tier1Overrides,
  procUnlocks, THREAT_ENCHANT, world-tick, minigame harness.
- `.claude/agents/mechanics-expert.md` rewrite (already in AUDIT Pending).

## 3. Your mandate, in order

1. **Green main** (§0 items 1–3). Run
   `npm run verify -w axiomancer-mechanics`, `npm run verify -w axiomancer-mobile`,
   `npm run type-check -w axiomancer-card-editor`, root `npm test`. Fix
   only what the deletions explain. Push to your designated branch, PR,
   merge when green.
2. **Baselines** (§0 items 4–5): visual re-capture + perf re-stamp, cited
   in the PR body.
3. **Residue** (§2), one PR.
4. **T2b** — D7 collapse of the Upgradeable-Dice flag (engine
   `isUpgradeableDiceEnabled` branches in `combat.engine.ts`, mobile
   `state/combat/flags.ts` + kill-switch, `upgradeable-dice-e2e`, 16 test
   files pinning OFF → rewrite to the shipped model). Tier 0 item 2's
   `advantageGrants` path dies here too.
5. Then T3 (mobile orphans + Tier 0 items 6–8), T4 (plan/ compaction incl.
   D9), T5 (GLYPHS cut per D8; retire the eight commands per D10 **with a
   `/jot` note** to rebuild them once the mechanics settle).

## 4. Standing notes

- Line endings: many engine files are CRLF. Preserve them (open with
  `newline=''`); check `git diff --stat` for whole-file rewrites.
- Commit bodies are plain; the guard hook rejects trailers.
- Never run the verify gate in the background (guard hook, standing rule 3).
- `Potential Assets/icons-TBR` is the icon pool (D11) — never trim it.
