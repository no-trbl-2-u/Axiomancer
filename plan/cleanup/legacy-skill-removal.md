# Legacy "skill" removal — remaining cleanup spec

> Status: **COMPLETE** · Created 2026-07-09 · Scope: purge the last legacy
> "skill" vestiges from the codebase so the word means **only** `SignatureSkill`.

## Completion record (2026-07-09) — bundled PR `refactor/legacy-skill-purge-final`

WI-1 through WI-6 all shipped on one branch (WI-1's three commits + WI-2…WI-6):

- **WI-2** ✅ purged the inert `*Skill` stat modifiers (effects JSON, affix
  catalogue, `EffectStatTarget` union, CLI, effect tests); the two live sole-Skill
  procs were repointed (`buff_ad_hoc_patch`→physicalDefense,
  `debuff_affirming_consequent`→physicalAttack).
- **WI-3** ✅ World `Reward` kind `'skill'`/`{kind:'skill';skillId}` →
  `'card'`/`{kind:'card';cardId}` (never constructed/consumed).
- **WI-4** ✅ `Enemy.skills`→`Enemy.cards` (field, `createEnemy`, `skill()`→`card()`
  helper across ~55 records, `executeCard` reader, catalog scripts, tests); plus the
  compound one-offs (`CharacterSkillRow`→`CharacterCardRow`, mobile `skillId`
  params→`cardId`, `skillCard`/`skillCat` styles, `bodySkill`, CLI/comment one-offs).
- **WI-5** ✅ swept `skill`-named `Card` locals→`card`/`sourceCard` and residual
  JSDoc/comment prose across mechanics + mobile source and e2e suites.
- **WI-6** ✅ living reference docs updated (deleted `*Skill` stat rows, repointed
  effect mods, `Enemy.cards` prose).

**Verify:** green across all three packages — mechanics (type-check,
type-check:tests, lint, build; vitest bar the 7 known Windows path-separator
`agent-vitest-reporter` failures), mobile (typecheck, expo lint, 2421 jest),
card-editor (type-check, build).

**Deliberately left as-is (per Non-goals / accuracy):**
- `SignatureSkill` / `combat.signature.ts` and the Phase-166
  `terminology-boundary.engine.test.ts` guard — skill = the Conviction kit is the
  one legitimate meaning.
- Accurate **legacy-migration history** comments that name the pre-rename fields
  (`knownSkills`/`equippedSkills`) and the `phase_49_enemy_skill_caster.md` path —
  renaming them would falsify history.
- Dated **historical reports** (audits, playtest reports, reconciliation-gaps,
  design prompts) and `plan/`/`CHANGELOG`/`RELEASES` — history, left untouched.
- `effects.md` has broader pre-existing drift (lists retired effects); only the
  `*Skill` token was removed, not a full reconciliation.

## Context — what's already done

The bulk of the skill→card unification shipped in two merged PRs:

- **PR #48** (merged): unified `skill`→`card` in the combat system; removed the
  deprecated `Skill`/`skillLibrary` public aliases; deleted the dead §3
  `src/Skills/` ability system; removed learning-requirements
  (`CardLearningRequirement`); removed `CombatCard.skillId`; deleted the empty
  `SYNTHETIC_CARDS` scaffolding; deleted the legacy skills docs
  (`docs/skills.md`, `specs/04-skills-engine.md`, `04b`, `quickstart-skills.md`).
- **PR #49** (merged): **(A)** dropped the save-migration chain (only the current
  `GAME_STATE_VERSION` loads; old saves reset); **(B)** deleted the
  `physicalSkill`/`mentalSkill`/`emotionalSkill` **derived-stat axis** and the
  dead `rollSkillCheck`/`getSkillDamageType` helpers; **(C)** renamed ~55 legacy
  card-system identifiers to `card` (waves 1–2) + preset arrays + test fixtures.
- **WI-1** (branch `refactor/wi1-retire-legacy-combatstate-log`): retired the
  dead `CombatState.log` befriend machinery and renamed the residual `skillId`.
  See the WI-1 section below for the full record.

Everything below is what those PRs **deliberately did not touch** because each
item is either data-shaped, content/balance, collision-prone, or high-volume
cosmetic — i.e. not a safe mechanical rename.

## Definition of done

`grep -rioE "\bskills?\b"` over `axiomancer-mechanics/src` and `axiomancer-mobile`
(excluding `signature`/`SignatureSkill`) returns **zero** hits that refer to the
legacy combat system. The only surviving "skill" is `SignatureSkill` (the
Conviction-funded kit) and the dev-tooling sense in `.claude/` + `skills/`.

## Non-goals (leave these alone)

- **`SignatureSkill`** and everything under it (`SIGNATURE_SKILLS`, `sig-*`,
  `combat.signature.ts`, "Signature Skill" prose). This is the one legitimate
  meaning and must survive.
- The repo-root **`skills/`** directory and **`.claude/`** commands/agents —
  these are the Claude Code slash-command sense of "skill", unrelated to game
  content. Do not rename.
- False-positive substrings: `bossKillingBlowState` (contains "ssKill"),
  `skilled`/`Skilled` (the English word). Ignore.

---

## Work items

Ordered by recommended sequence. Each is independently shippable behind its own
PR; run `npm run verify` (mechanics + mobile + editor) before each.

### WI-1 — Retire the legacy `CombatState` turn-based cluster  ✅ DONE

> Done 2026-07-09 on branch `refactor/wi1-retire-legacy-combatstate-log`
> (commits `9fa7f670` machinery deletion, `f5a96468` renames). Owner decision:
> **delete the machinery** (befriend flows through signatures + SWAY/CAPITULATE).

**Investigation finding (the decider):** the `skillId`-on-log cluster was
*already dead in the live game*, not merely legacy —
- No live card carries the `befriend_attempt` mechanic, so
  `isBefriendAttemptEligible` (the sole reader of the befriend predicate) is
  never reached in real combat.
- Even if it were, the Hazard-Pattern engine drives `executeCard` through a shim
  (`cardShim`) that hard-codes `log: []` and never appends a `BattleLogEntry`.
- `requiredCardUse` (the actual `skillId`-on-log reader) was authored on **zero**
  enemies; `requiredStances` was authored on **9** enemies but read the same
  always-empty log, so that stance-gate never evaluated true in live combat.

**What shipped:**
- Deleted `BattleLogEntry`, `CombatState.log`, and the `'skill'` / `'choosing_skill'`
  tokens + `CombatAction.skillId` from `Combat/types.ts`; dropped the
  `BattleLogEntry` re-exports.
- Gutted the `requiredStances` / `requiredCardUse` log-reading branches of
  `befriendabilityPredicatesPass`; removed both fields from `BefriendabilityConfig`
  and stripped the 9 vestigial `requiredStances` configs from `enemy.library.ts`.
  Surviving befriend predicates: passive counter, `roundsThreshold`, `hpGate`.
- Removed `CombatState.log` from the `cardShim` + `initializeCombat` constructors.
- Renamed the residual `skillId` by what it actually holds: card ids → `cardId`
  (card engine, `CardEvent`, `CardLookup`, `LEARN_CARD` payload, `learnCard`,
  `combat.rewards`, `combat.loadout` codec, CLI dev-tools/game.cli); signature
  ids → `signatureId` (`signature-cast` event, `playSignatureSkill`).
- Deleted two mobile vestiges of the pre-Hazard-Pattern combat log
  (`RUNTIME_TYPE_DIVERGENCE_ISSUE.md`, `aftermath-snapshot.engine.test.ts`) —
  no live mobile source read them.
- Updated the affected mechanics tests (befriendability-config, phase130-constants,
  friendship-increment, autosave-throttling, phase99, combat-loadout, hazard-pattern).

**Verify:** green across mechanics (type-check, tests-tsc, lint, vitest — the 7
`agent-vitest-reporter` failures are the known Windows path-separator baseline),
mobile (typecheck, lint, jest 2421), card-editor (type-check).

**Deferred to other WIs (out of the CombatState cluster):**
- `World/types.ts` reward `{ kind: 'skill'; skillId: string }` → **WI-3** (data value).
- `Enemy.skills` (the enemy card-rotation field) + its readers, e.g. the
  `skillIds` locals in `enemy.engine.test.ts` — a large, separate field rename;
  **new item, see WI-4**. It was never part of the legacy log cluster.

### WI-2 — Purge the deleted `*Skill` stat from effect/affix content

**Why it's not a rename:** the Skill derived-stat axis was deleted (PR #49 B),
but buffs/debuffs/affixes **still grant `physicalSkill`/`mentalSkill`/
`emotionalSkill`** — now **inert** (they modify a stat that no longer exists).
Removing them is a content/balance edit.

**Files:**
- `src/Effects/buffs.library.json`, `src/Effects/debuffs.library.json` — remove
  `statModifiers` entries targeting `*Skill`.
- `src/Items/modifier.catalogue.ts` — remove affix rolls granting `*Skill`.
- `src/Effects/types.ts` — drop `*Skill` from the stat-key union/type.
- `src/CLI/game.cli.ts` — **verify/remove** any residual `*Skill` in the stat log
  (a straggler may remain).
- Tests: `Effects/e2e/{advantage-effects,control-effects,stat-band-effects,
  stronger-effects-phase124}.engine.test.ts` — drop `*Skill` assertions.

**Approach:** delete the `*Skill` modifiers; where an effect existed *only* to
buff Skill, decide whether to drop the effect or repoint it to attack/defense
(balance call — flag for the owner / `/deck-tuning`).

**Acceptance:** no `physicalSkill`/`mentalSkill`/`emotionalSkill` anywhere in
`src`; effects/affixes no longer carry inert modifiers.

**Risk:** medium — content/balance; coordinate with tuning.

### WI-3 — Rename the remaining data enums

- `World` reward kind **`'skill'`** → `'card'` (`src/World/types.ts`:
  `| { kind: 'skill'; skillId: string }`). Check for authored world-event
  content that emits `kind: 'skill'` and migrate it (data value).
- Fold `Action`'s `'skill'` and `CombatPhase`'s `'choosing_skill'` into WI-1
  (they die with the legacy cluster). If WI-1 keeps the cluster, rename the
  phase to `'choosing_card'`.

**Acceptance:** no `'skill'` string enum values in `Combat`/`World` types or the
content that uses them.

**Risk:** medium — data values may appear in authored content.

### WI-4 — Misc one-off identifiers

Rename or remove (each is small, verify individually):
- `CharacterSkillRow` (mobile type) → `CharacterCardRow` or fold into the derived
  row type.
- `skillCard` / `SkillCard` / `skill_card` / `SkillOption` — leftover types/vars.
- `bodySkill` / `skillMod` / `skillCat` — stat-adjacent leftovers (may be dead
  after WI-2).
- `nSkills`, `_skill`, `_enemy_skill_caster`. (`unknownSkillId` already renamed
  in WI-1.)
- Residual `equippedSkills` / `knownSkills` **in comments** (`game.migrate.ts`,
  `game.reducer.ts`, a couple of test comments) — the code is gone; update the
  prose.

**Bigger, not a one-off — `Enemy.skills` (the enemy card-rotation field).**
Surfaced during WI-1. `Enemy.skills?: Card[]` is the enemy's combat card
rotation (read by `executeCard`'s enemy path, authored across `enemy.library.ts`
via the `skill(...)` helper, and asserted by `enemy.engine.test.ts`'s `skillIds`
locals). Renaming it to `Enemy.cards` / `cardRotation` touches the type, the
authoring helper, ~every enemy record, and the mobile presenters — do it as its
own focused pass, not inline with the small one-offs above.

**Acceptance:** none of the above tokens remain; `Enemy.skills` renamed to a
`card`-based name (or explicitly deferred with owner sign-off).

**Risk:** low for the one-offs; medium for `Enemy.skills` (wide, authored-content
churn).

### WI-5 — Prose / comment sweep (~1,100 mentions)

JSDoc and inline comments still *describe* cards as "skills" (e.g. the
`card.engine.ts` header, combat-engine comments, "the skill engine"). Sweep
`skill`/`skills`/`Skill`/`Skills` → `card` in comments **carefully** — a blanket
replace would mangle legitimate **"Signature Skill"** prose. Do it file-by-file
or with an exclusion for lines containing `Signature`.

**Acceptance:** code comments no longer call cards "skills"; "Signature Skill"
prose intact.

**Risk:** low-but-tedious; the only hazard is over-replacing Signature prose.

### WI-6 — Docs / specs / plan / historical records (~111 files)

Split by the project's living-vs-historical doc rule:
- **Living docs** (consumed for coding): `docs/character.md` (the stale `*Card`
  stat comment + Skill-stat references), `docs/combat.md`, `docs/api.md`,
  `docs/quickstart*.md`, `docs/effects.md`, `docs/enemy.md` — update to match the
  post-cleanup reality (no Skill stat, no learning requirements, `card` not
  `skill`).
- **Consumed-history docs** (ask the owner before rewriting): `ADR-0002`,
  `ADR-0007`, specs `06`/`14`/`25`/`28`/`31`, walkthrough `.goal.md`s.
- **Pure history — leave**: `CHANGELOG.md`, `RELEASES.md`, dated audit/tuning/
  playtest reports, `plan/phases/*`, `plan/labyrinth/*`.

**Acceptance:** living docs match reality; historical records left as-is (or
rewritten only with owner sign-off).

**Risk:** low; mostly judgment about which docs are "living".

---

## Suggested sequencing

1. **WI-1** (legacy `CombatState` cluster) — unblocks WI-3's enum values and the
   bulk of `skillId`.
2. **WI-2** (effect content) — clears the inert `*Skill` modifiers.
3. **WI-3** (World reward kind) + **WI-4** (one-offs) — quick.
4. **WI-5** (comment sweep) + **WI-6** (docs) — cosmetic finish.

Each behind its own PR against `main`, `npm run verify` green (the 7 pre-existing
`agent-vitest-reporter` tooling failures are unrelated and expected).
