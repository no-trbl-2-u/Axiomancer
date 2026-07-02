# Phase 166 — Skills ≠ Cards terminology boundary

## Outcome

Clear the legacy-combat wording fault line: **Skills are always-available, token-used effects. Cards are Hazard-style combat deck/hand/reward objects. Skills are not cards. Cards are not skills.**

After this phase, mechanics source, docs, tests, public comments, and tuning/playtest copy must use the two nouns with discipline:

- **Skill**: a learned/unlocked action in `knownSkills`, filtered by `combatResources` affordability and executed through the skill engine.
- **Card**: a Hazard-style combat entity in the deck/hand/staged/reward loop, with free/powered halves, stance/color/cost, and draw/discard/deck cadence.
- **Projected card / card projection**: acceptable when a combat card is generated from a skill-library source. Do not call the card itself a skill.

## Source / user decision

T direct steering, 2026-06-27:

> The "skills" are the "always available, token used" effects, not the cards. Skills != Cards.

This is cleanup caused by legacy combat vocabulary crossing into the new Hazard-style combat model. Do not ask for another terminology decision. The boundary above is settled.

## Implementation units

1. **Audit mechanics terminology**
   - Search source/docs/tests for phrases that conflate cards and skills: `skill card`, `skillCard`, `card skill`, `combat skill card`, `skills deck`, `deck skills`, `known skill cards`, and similar.
   - Target likely files:
     - `src/Combat/combat.cards.ts`
     - `src/Combat/combat.deck.ts`
     - `src/Combat/combat.deck-presets.ts`
     - `src/Combat/combat.hazard*.ts` / Spec 25/26b combat files
     - `src/Skills/**`
     - `src/Tuning/**`
     - `docs/combat.md`
     - `docs/skills.md`
     - `docs/api.md`
     - `spec.md`
     - `plan/bearings.md`
     - `skills/combat-tuning.md` and any tuning guidance that still describes cards as skills

2. **Rename misleading identifiers and comments**
   - Prefer `combatCard`, `projectedCard`, `cardSourceSkillId`, `sourceSkill`, or `skillSource` over `skillCard`.
   - Preserve public API compatibility unless a name is purely internal/test-only. If a public export must remain for compatibility, mark the old name deprecated and introduce the correct alias.
   - Do not change game balance or card behavior in this phase.

3. **Make projection language explicit**
   - Where card data is derived from `skillLibrary`, label it as projection:
     - `sourceSkillId`
     - `sourceSkillName`
     - `projectSkillToCombatCard()` or equivalent
   - If current code lacks a clear source-field name, add/rename within compatibility limits.
   - The player-facing concept remains **card** once it enters the Hazard-style deck/hand/reward loop.

4. **Docs and tuning doctrine cleanup**
   - Add a short "Skills vs Cards" doctrine block to `docs/combat.md` and cross-link/echo it from `docs/skills.md`.
   - Update tuning/playtest docs so `/combat-tuning`, balance-sim, and future Hazard-style combat workers do not call deck composition "skill loadout" or cards "skills".
   - Include exact glossary:
     - Skills = always-available token-spending effects.
     - Cards = draw/deck/hand/reward objects.
     - A card may be projected from a skill, but the projected object is still a card.

5. **Regression guards**
   - Add a terminology test or script-level guard if practical. Acceptable forms:
     - a docs/source grep test preventing banned phrases in specific files, with allowlisted historical/changelog lines; or
     - focused tests asserting projected card fields use `sourceSkill*` naming while UI/card names remain card-facing.
   - Do not overbuild. The guard should prevent the exact regression, not become a linter theology machine.

## Decisions made upfront — DO NOT ASK

- Canon boundary: **Skills != Cards**.
- Skills are always available once learned/unlocked and only gated by token/resource affordability.
- Cards live in Hazard-style combat deck/hand/reward systems and may have free/powered action halves.
- If a card is generated from a skill-library entry, call it a **projected card** or **skill-sourced card**, not a skill.
- Player-facing card surfaces should say **card**. Player-facing token-spend ability surfaces should say **skill**.
- This phase is terminology/API/docs cleanup only. No numeric combat tuning, no deck rebalance, no status-effect rebalance.

## Verify gate

Run, at minimum:

```bash
git diff --check
npm run type-check
npm test -- --run
```

If source or public exports change, also run:

```bash
npm run verify
npm run deploy:check
```

If the phase changes only docs/comments plus a grep guard, record the exact command output and justify any skipped full gate.

## Commit body template

```text
Phase 166 — Skills ≠ Cards terminology boundary

- separated skill/token vocabulary from Hazard-style card/deck vocabulary
- renamed misleading skill-card identifiers/comments where safe
- documented Skills vs Cards doctrine in combat/skills docs
- added regression guard against legacy wording drift

Verification:
- git diff --check
- npm run type-check
- npm test -- --run
```

## Definition of Done

- No active mechanics docs/source comments use "skill" to mean a card.
- No active mechanics code identifiers introduce new `skillCard`-style conflation unless preserved as deprecated compatibility shim.
- Hazard-style combat card docs identify cards as cards and skill-derived cards as projections.
- Skill docs identify skills as always-available token-spending effects via `knownSkills`/`combatResources`.
- Worker evidence includes before/after grep summary or equivalent proof.

## Follow-ups out of scope

- Mobile visual copy cleanup belongs to its own mobile phase.
- Combat tuning changes to fit Hazard-style balance belong to dedicated tuning phases.
- Card-library redesign, deck preset rebalance, reward-pool changes, or starter-deck changes are out of scope unless required only to rename fields safely.
