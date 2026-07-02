# Phase 121 — Three-anchor playtest balance scaffold

> Replace the single Coastal Tyrant witness with a repeatable Easy / Normal / Difficult-but-doable playtest matrix for Sage.

## Outcome

The mechanics worker ships a broader balance/playtest audit that tests Sage against three stat-law-compliant enemy anchors, 25 runs per playstyle per enemy, and reports actual Sage win rates against T's target bands.

## Source

Promoted on 2026-06-05 by T direct order after the balance/playtest planning pass.

T's direction:

- Use **three enemies** for the playtest face:
  - Easy win: existing Coastal Tyrant fixed to accurate level-6 stats, plus a few skills.
  - Normal: new level-15 non-boss enemy with ordinary stats and 1–2 low-tier skills.
  - Difficult-but-doable: new level-18 boss with several skills, including 1–2 fairly devastating skills.
- Sage should acquire **2–3 devastating skills**.
- Test each enemy with Sage **25 times with each playstyle/strategy**.
- Required target actual-win bands:
  - Easy: **100%** Sage wins.
  - Normal: **75–100%** Sage wins.
  - Difficult-but-doable: **25–50%** Sage wins.

Context already established:

- Enemies must obey the same stat law as characters: **5 stat points per level**.
- The tuning target is **actual win rate**, not friendship/mercy/resolution success, unless T explicitly changes the metric.
- Current canonical playstyles are AGGRESSIVE, DEFENSIVE, MIXED, and STRATEGIST.
- Per-policy breakdown must remain visible; aggregate success alone is not enough.
- Enemy skills are supported by the model (`skills?: Skill[]`) and the combat resolver.
- Current authored roster previously had no level-20+ enemy and highest implemented enemy was level 12.
- Existing old single-enemy evidence showed policy imbalance despite aggregate viability, so this phase must not hide weak policy paths behind aggregate totals.

## Implementation units

### Unit 1 — Verify current baseline and legal stat budgets

**Files:**
- `src/Character/presets.ts`
- `src/Character/e2e/presets.engine.test.ts`
- `src/Enemy/enemy.library.ts`
- relevant enemy e2e tests if present

**Work:**
- Reconfirm the current Sage preset and Coastal Tyrant values before editing.
- Enforce the 5-stat-points-per-level law:
  - Coastal Tyrant level 6 total stats must equal **30**.
  - New normal enemy level 15 total stats must equal **75**.
  - New difficult boss level 18 total stats must equal **90**.
- If Sage is level 15 for this audit, its base stats should total **75**.
- Add or update hermetic assertions so this specific audit scaffold cannot silently drift off the stat law again.

### Unit 2 — Author the three enemy anchors

**Files:**
- `src/Enemy/enemy.library.ts`
- `src/Enemy/index.ts` if new exports/registry entries are required
- relevant docs only if enemy inventory docs exist

**Work:**
- Easy anchor:
  - Use existing `coastal-tyrant`.
  - Keep level 6.
  - Correct stat total to exactly 30.
  - Give it a few skills appropriate to a low/mid anchor; do not overfit it into a boss wall.
- Normal anchor:
  - Create a new level-15 non-boss enemy.
  - Total stats exactly 75.
  - Use ordinary/non-boss role pressure.
  - Give it 1–2 low-tier skills only.
- Difficult-but-doable anchor:
  - Create a new level-18 boss.
  - Total stats exactly 90.
  - Give it several skills, including 1–2 fairly devastating skills.
  - Prefer role and skill pressure over pure HP/stat inflation.

### Unit 3 — Equip Sage for the audit

**Files:**
- `src/Character/presets.ts`
- `src/Character/e2e/presets.engine.test.ts`
- `docs/playtest.md` if preset-playtest docs need the audit loadout recorded

**Work:**
- Give Sage 2–3 devastating skills for this late-game audit.
- Use currently authored high-impact skills where possible; do not invent new skill mechanics unless the existing skill library cannot express the need.
- Preserve the unlocked-skill doctrine: Sage's skills belong in `knownSkills`; do not revive `equippedSkills` as the canonical access gate.
- If `equippedSkills` remains as compatibility data, keep it secondary and consistent with `knownSkills`.

### Unit 4 — Expand playtest scenario/harness to the three-anchor matrix

**Files:**
- `automation/playtest/scenarios/late-game-coastal-tyrant.json` or a new scenario such as `automation/playtest/scenarios/sage-three-anchor-balance.json`
- `src/Playtest/playtest.runner.ts`
- `src/Playtest/policies.ts`
- `src/Playtest/e2e/playtest-harness.engine.test.ts`
- `docs/playtest.md`

**Work:**
- Prefer a new scenario name if the old Coastal Tyrant scenario would become misleading.
- Run each enemy against Sage under each current policy:
  - AGGRESSIVE: 25 runs
  - DEFENSIVE: 25 runs
  - MIXED: 25 runs
  - STRATEGIST: 25 runs
- Total expected run count: **100 runs per enemy**, **300 runs total**.
- Report actual Sage wins separately from defeats, friendship/mercy, and timeouts.
- Preserve per-policy breakdown for each enemy.
- Keep deterministic seed behavior while varying enough per run that the evidence is not a single repeated roll.

### Unit 5 — Tune until the target bands are met without lying

**Files:**
- Same files touched by Units 1–4
- `automation/playtest/BALANCE_LEDGER.md`
- generated report files under `automation/playtest/reports/`

**Work:**
- Run baseline after implementation.
- Tune parameters only inside the authorized balance surface first:
  - enemy stats within legal level budget
  - enemy skill selection/loadout
  - Sage loadout
  - enemy role pressure
  - scenario limits/seeds only if evidence shows harness distortion
- Do not change core combat mechanics without stopping for T.
- Do not tune by raw stat inflation alone.
- Stop when aggregate actual win bands are met and per-policy breakdown is intelligible:
  - Easy: 100% actual wins.
  - Normal: 75–100% actual wins.
  - Difficult: 25–50% actual wins.
- If a target band cannot be met without breaking role identity or mechanics, record the evidence and escalate rather than fabricating success.

### Unit 6 — Closeout evidence

**Files:**
- `automation/playtest/reports/<scenario>.md`
- `automation/playtest/reports/<scenario>.json`
- `automation/playtest/BALANCE_LEDGER.md`
- `docs/playtest.md`
- `CHANGELOG.md` if repo convention requires playtest/tooling changes there

**Work:**
- Record final exact command(s), commit, scenario name, run counts, seeds, enemy stat totals, Sage stats/loadout, and per-enemy/per-policy results.
- Add a ledger entry stating whether each anchor passed its target band.
- Include policy abnormalities explicitly.
- Document what remains out of scope.

## Decisions made upfront — DO NOT ASK

- **D1 — Metric is actual win rate.** Do not substitute resolution success, friendship, mercy, or timeout-adjacent metrics for the target bands.
- **D2 — Four policies.** Use AGGRESSIVE, DEFENSIVE, MIXED, and STRATEGIST unless the current harness has renamed them; if renamed, preserve the same four strategic meanings.
- **D3 — 25 runs per policy per enemy.** The matrix is 100 runs per enemy, 300 total.
- **D4 — Stat law is mandatory.** Enemy base-stat totals must equal level × 5.
- **D5 — Aggregate plus per-policy.** Aggregate passing is not enough if one policy is plainly broken.
- **D6 — Parameter/content tuning first.** Do not alter damage formulae, token economy, action economy, enemy AI architecture, or friendship mechanics without stopping for T.
- **D7 — New enemies are audit anchors, not final lore pillars.** Give them enough identity to test combat roles, but do not let lore/content sprawl consume the phase.
- **D8 — Preserve skill/status-centered combat.** STRATEGIST should have meaningful evidence of skill/status planning, not just attack repetition.

## Verify gate

- `npm run type-check`
- `npm run test -- --run src/Playtest/e2e/playtest-harness.engine.test.ts`
- targeted preset/enemy tests touched by this phase
- `npm test -- --run`
- `npm run playtest`
- `git diff --check`

## Commit body template

```text
Phase 121: Three-anchor playtest balance scaffold

- add Easy/Normal/Difficult enemy anchors for Sage playtesting
- enforce stat-law totals for the audit enemies and Sage fixture
- expand playtest matrix to 25 runs per policy per enemy
- report actual win bands plus per-policy breakdowns
- tune and record final evidence in BALANCE_LEDGER

Verification:
- npm run type-check
- npm run test -- --run src/Playtest/e2e/playtest-harness.engine.test.ts
- npm test -- --run
- npm run playtest
- git diff --check
```

## Definition of Done

- [ ] Coastal Tyrant is level 6 with exactly 30 total stats.
- [ ] Coastal Tyrant has a few skills and passes the Easy target: 100% Sage actual wins.
- [ ] A new level-15 non-boss enemy exists with exactly 75 total stats and 1–2 low-tier skills.
- [ ] The level-15 normal enemy passes the Normal target: 75–100% Sage actual wins.
- [ ] A new level-18 boss exists with exactly 90 total stats and several skills, including 1–2 devastating skills.
- [ ] The level-18 boss passes the Difficult target: 25–50% Sage actual wins.
- [ ] Sage has 2–3 devastating skills available through `knownSkills`.
- [ ] Playtest matrix runs 25 times per policy per enemy.
- [ ] Reports show aggregate actual wins and per-policy breakdowns for all three enemies.
- [ ] `BALANCE_LEDGER.md` records the final evidence and judgment.
- [ ] Verify gate passes.

## Follow-ups out of scope

- Full roster-wide tuning beyond these three anchors.
- New core combat mechanics.
- Final difficulty doctrine rewrite beyond recording evidence.
- Mobile UI playthrough integration.
- New skill mechanics unless existing skills are insufficient and T explicitly approves.
