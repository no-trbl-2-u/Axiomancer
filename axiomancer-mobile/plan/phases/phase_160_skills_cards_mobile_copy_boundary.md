# Phase 160 — Skills ≠ Cards mobile copy boundary

## Outcome

Clear mobile player-facing and dev-facing vocabulary so legacy combat terms no longer teach the wrong model:

- **Skills** are always-available, token-used effects surfaced through the combat skill/action affordance.
- **Cards** are Hazard-style combat deck/hand/staged/reward objects.
- **Skills != Cards.**

After this phase, the mobile UI, presenters, accessibility labels, dev menu deck presets, tests, and docs must not call cards "skills" or call a card deck a "skill loadout." If a card was generated from a mechanics skill, mobile may say **skill-sourced card** in dev/debug contexts, but normal player copy should say **card**.

## Source / user decision

T direct steering, 2026-06-27:

> The "skills" are the "always available, token used" effects, not the cards. Skills != Cards.

This is a UI/copy cleanup phase caused by legacy combat vocabulary crossing into the new Hazard-style combat board. Do not ask for a new naming decision.

## Implementation units

1. **Audit mobile copy and identifiers**
   - Search for conflations: `skill card`, `skillCard`, `card skill`, `skills deck`, `deck skills`, `skill loadout`, `skill preset`, `combat skill card`, and similar.
   - Target likely files:
     - `app/(tabs)/combat.tsx`
     - `components/combat/**`
     - `components/DebugCombatDeck.tsx`
     - `state/presenters/combat.engine.ts`
     - `state/combat/**`
     - `state/dev/**`
     - `state/actions.ts`
     - `docs/combat.md`
     - `docs/engine-upgrade-*.md`
     - `skills/playtest.md` / `skills/deep-playtest.md` if they describe card flows
     - phase docs that become active instructions for combat-card work

2. **Fix visible player-facing copy**
   - Deck/hand/reward/staged surfaces must say **card**, **deck**, **hand**, **reward card**, **combat card**, or **Hazard-style combat card**.
   - Skill affordances must say **skill**, **known skill**, **token cost**, **resource cost**, or **always-available skill**.
   - Accessibility labels must not revive the legacy wording. Screen readers should hear card concepts on cards and skill concepts on skills.

3. **Fix dev menu and evidence wording**
   - Dev menu deck presets are **combat card deck presets**, not skill presets.
   - Keep strategic deck names, but clarify they configure card/deck state:
     - starter baseline/control
     - early/late straightforward
     - early/late enchantment
     - early/late utility
   - If a dev control unlocks `knownSkills`, label it as skill unlock/known-skill setup, not deck/card setup.

4. **Presenter/test cleanup**
   - Rename misleading local variables/props where safe: `skillCard` → `combatCard`, `card`, `projectedCard`, or `skillSourcedCard` depending on truth.
   - Do not change engine-owned data contracts unless mechanics has already published a corrected name. Mobile is presentation glue; respect the installed package.
   - Update tests to assert the corrected labels and accessibility strings.

5. **Add a small regression guard**
   - Add either:
     - focused copy tests for the affected combat card/deck/dev menu surfaces; or
     - a narrow grep-style terminology guard with explicit allowlist for historical phase docs/changelog.
   - The guard must catch the old confusion without blocking valid uses of `skill` for actual token-spending skills.

## Decisions made upfront — DO NOT ASK

- Canon boundary: **Skills != Cards**.
- Skills are always-available token-used effects. Cards are Hazard-style deck/hand/reward objects.
- Cards may be skill-sourced internally, but player-facing card surfaces should still say **card**.
- Dev deck presets are deck/card presets, not skill loadouts.
- Keep `VITAE` and `STANCE` doctrine intact. Do not regress to `HEALTH` in player-facing combat copy.
- This phase is copy/presenter/test/docs cleanup only. No combat balance changes, no deck preset rebalance, no mobile-only rules simulation.

## Verify gate

Run, at minimum:

```bash
git diff --check
npm run typecheck
npm test -- --runInBand
```

Run visual verification if visible combat/dev surfaces change materially:

```bash
npm run verify:visual
```

If `verify:visual` is blocked by existing Metro/browser baseline debt, record the exact blocker and include screenshots or test evidence for the changed surfaces where practical.

## Commit body template

```text
Phase 160 — Skills ≠ Cards mobile copy boundary

- corrected player/dev copy so cards are cards and skills are token-spend skills
- renamed misleading local skill-card identifiers where safe
- updated combat/dev tests and accessibility labels for the terminology boundary
- documented the Skills ≠ Cards rule for future mobile work

Verification:
- git diff --check
- npm run typecheck
- npm test -- --runInBand
- npm run verify:visual (or exact blocker)
```

## Definition of Done

- Combat card/deck/reward UI does not describe cards as skills.
- Skill UI still describes actual known/token-spending skills as skills.
- Dev menu deck presets are visibly and accessibly deck/card presets.
- Tests or a narrow guard prevent the old `skill card` vocabulary from returning in active source/copy.
- Mobile docs include the boundary and point to mechanics truth where needed.

## Follow-ups out of scope

- Mechanics terminology/API cleanup belongs to mechanics Phase 166.
- Combat-card glyph/detail work remains Phase 158/159 and should consume this terminology boundary.
- Deck/reward tuning, starter deck changes, and card library redesign are out of scope.
