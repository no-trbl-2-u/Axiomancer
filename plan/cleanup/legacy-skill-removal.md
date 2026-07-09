# Legacy "skill" removal — remaining cleanup spec

> Status: **open backlog** · Created 2026-07-09 · Scope: purge the last legacy
> "skill" vestiges from the codebase so the word means **only** `SignatureSkill`.

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

### WI-1 — Retire the legacy `CombatState` turn-based cluster  ★ biggest, do first

**Why it's not a rename:** `skillId` (~107 occurrences) is the combat-log field
`playerAction.skillId` on the legacy turn-based `CombatState` — a *different*
thing from a card id, and it **collides with `cardId`** in 8 files, so a blanket
`skillId`→`cardId` is unsafe. The right move is to remove the legacy cluster
rather than rename it.

**The cluster (all in `src/Combat/types.ts` unless noted):**
- `Action = 'attack' | 'defend' | 'skill' | 'item' | 'flee' | 'spare' | 'exploit'`
- `CombatPhase` value `'choosing_skill'`
- `PlayerCombatAction.skillId`, `BattleLogEntry`, `CombatState.log`
- The `CombatState` shim that `executeCard` runs on (`card.engine.ts`,
  `combat.engine.ts`, `combat.reducer.ts`)
- The **befriend predicate** `befriendabilityPredicatesPass` in
  `src/Combat/index.ts` — it reads `state.log` filtering
  `playerAction.action === 'skill' && playerAction.skillId !== undefined`, and
  `Enemy.befriendabilityConfig.requiredCardUse` depends on it.

**Files with the `skillId`↔`cardId` collision (handle per-file, no blanket sed):**
`Cards/card.engine.ts`, `Combat/combat.cards.ts`, `Combat/combat.encounter.types.ts`,
`Combat/combat.engine.ts`, `Combat/combat.loadout.ts`, `Combat/combat.rewards.ts`,
`Combat/e2e/hazard-pattern-combat.engine.test.ts`, `axiomancer-mobile/state/actions.ts`.

**Approach:**
1. Investigate whether the legacy `CombatState`/`Action`/log is still genuinely
   needed, or whether the Hazard-Pattern engine (`CombatEncounterState`) can
   fully replace the shim `executeCard` runs on.
2. If it can be retired: delete `Action`/`choosing_skill`/`PlayerCombatAction`/
   `BattleLogEntry`/`CombatState.log`, and re-express the befriend
   `requiredCardUse` predicate against the Hazard-Pattern play log instead of
   the legacy log. `skillId` disappears wholesale.
3. If it must stay: rename `skillId`→`cardId` **per file**, resolving each
   collision by hand (an object never legitimately carries both).

**Acceptance:** no `skillId`/`choosing_skill`/`action: 'skill'` in code; the
befriend `requiredCardUse` path still works (Enemy befriendability e2e green).

**Risk:** high — data-shaped, collision-prone, touches the befriend win-path.

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
- `nSkills`, `_skill`, `_enemy_skill_caster`, `unknownSkillId`.
- Residual `equippedSkills` / `knownSkills` **in comments** (`game.migrate.ts`,
  `game.reducer.ts`, a couple of test comments) — the code is gone; update the
  prose.

**Acceptance:** none of the above tokens remain.

**Risk:** low.

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
