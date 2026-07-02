# Phase 99 — Unlocked skill access, no equipped-skill gate

> Status: queued. Promoted from T correction on 2026-05-31: skills should not be "equipped"; once unlocked/learned, they should be available, and combat should show only skills usable at that moment.

## Goal

Remove the legacy `equippedSkills` loadout gate from player skill access. A character's learned/unlocked skills are the whole combat-accessible catalogue. Combat selection filters that catalogue by current resources through `canUseSkill(combatResources, skill)`.

This phase aligns implementation with `docs/skills.md`: there is no mana, resonance is derived from simultaneous token requirements, and there is no separate skill-equipment ritual between learning a skill and being allowed to use it.

## Doctrine

- `knownSkills` means learned/unlocked skills.
- There is no player-facing skill equipment/loadout limit.
- In combat, the UI lists only `knownSkills` whose `resourceCost` is currently payable.
- Unaffordable unlocked skills may be shown in non-combat skill screens as locked-by-resource/context, but they should not be offered as cast choices.
- Enemy skill rotations may keep their own `Enemy.skills`/AI rotation concept; this phase concerns player character access.

## Implementation units

### Unit 1 — State and compatibility

- Update `Character` and `CharacterPreset` types so `knownSkills` is the canonical skill-access field.
- Remove `equippedSkills` from new state creation/presets once all consumers are migrated.
- Add a save/load migration or normalization step that merges legacy `equippedSkills` into `knownSkills` and then ignores/drops the old field.
- Preserve backward compatibility at package boundaries long enough for consumers to migrate, or document the breaking removal if the release target permits it.

### Unit 2 — Combat and playtest consumers

- Change player skill validation in `src/Combat/phases/scenario.ts` and `executeSkill` callers from `player.equippedSkills.includes(skillId)` to `player.knownSkills.includes(skillId)`.
- Change `src/CLI/game.cli.ts` skill-choice logic to compute:

```ts
const castableSkillIds = player.knownSkills.filter(id => {
  const skill = getSkillById(id);
  return skill !== undefined && canUseSkill(combat.combatResources, skill);
});
```

- Update `src/Playtest/policies.ts` to choose from affordable unlocked skills, not equipped skills.
- Ensure unavailable skills produce a clear blocked event/message only when directly requested by script/dev tooling, not in the normal cast menu.

### Unit 3 — CLI/dev-tools cleanup

- Rename or retire `devEquipSkills`; add a dev unlock command that can grant named skills or all skills by writing `knownSkills`.
- Update Skills/Character tabs to say "Known/Unlocked" rather than "Equipped".
- Update scripted walkthroughs that currently depend on `equippedSkills`.

### Unit 4 — Tests and documentation

- Update character preset tests, CLI dev-tool tests, combat scenario tests, and playtest policy tests to assert unlocked-skill access.
- Add a hermetic e2e test proving a known-but-not-legacy-equipped skill can be cast once resources are sufficient.
- Add a hermetic e2e test proving combat menus/policies expose only affordable known skills.
- Refresh `docs/skills.md`, `docs/character.md`, `docs/combat.md`, and quickstarts after code lands.

## Acceptance

- [x] No player-facing runtime path requires a skill to be in `equippedSkills`.
- [x] Learned/unlocked skills become castable as soon as resources satisfy `resourceCost`.
- [x] Combat choice surfaces show only currently affordable unlocked skills.
- [x] Legacy saves/states with `equippedSkills` do not lose access to those skills.
- [x] `npm run verify` passes.
- [x] Docs no longer present equipped skills as the canonical model.

## Notes

This is deliberately not an enemy-AI rotation rewrite. Enemy authored rotations remain a separate concept because enemies do not share the player's learning/progression UX.
