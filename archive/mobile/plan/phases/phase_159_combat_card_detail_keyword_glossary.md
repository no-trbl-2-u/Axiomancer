# Phase 159 — Combat card detail keyword glossary

**Source:** T direct steering 2026-06-24.

## Outcome

When a player selects a new Hazard-style combat card, the detail modal explains what the card does in plain language and defines every keyword shown on the card.

The selected-card surface should answer:

- What does the free/top action do?
- What does the powered/bottom action do?
- What does each keyword mean?
- What stance/read/die relationship matters?
- What will happen if I stage and apply this card?

This phase pairs with Phase 158. Phase 158 makes small cards legible; Phase 159 makes selected cards teach the system.

## Current truth

Relevant files at filing:

- `components/combat/encounter/CombatEncounterPanel.tsx`
  - selected card detail currently renders only:
    - card name;
    - `GOLD / STANCE / TIER / EFFECT KIND` meta;
    - `bottomActionText`;
    - generic hint: `drag the card up to stage it, drag a die onto it, then APPLY`.
- `state/presenters/combat-encounter.engine.ts`
  - card VM has enough raw fields for a first detail pass: `topActionText`, `bottomActionText`, `bottomDamagePreview`, `read`, `colorMatch`, `verbClass`, `effectKind`, `stance`, `tier`, `category`.
- Phase 158 should add structured keyword/glyph metadata to reuse here.

## Implementation units

### Unit 1 — Add reusable keyword glossary metadata

Files:

- Modify: `state/presenters/combat-encounter.engine.ts`
- Optional create: `state/presenters/combat-card-keywords.ts` if the keyword mapping grows too large for the presenter file.

Use the Phase 158 keyword IDs and add player-facing definitions:

```ts
interface CombatCardKeywordVM {
  key: string;
  label: string;
  icon: string;
  tone: string;
  shortHelp: string;  // compact accessibility/help text
  longHelp: string;   // selected-detail explanation
}
```

Suggested first definitions:

- `DAMAGE`: Deals immediate enemy HP damage. Good for finishing a foe or pressing a weak phase.
- `DOT`: Applies damage over time; status erosion can outpace weak direct strikes over multiple phases.
- `CONTROL`: Weakens, slows, confuses, restrains, or otherwise disrupts enemy threat output.
- `BUFF`: Improves the player or protects the current run.
- `MERCY`: Moves toward Befriend / spare-style resolution where supported.
- `DRAW`: Changes the hand/deck flow by drawing or cycling cards.
- `SCRAP`: Discards a card or removes dead weight from the current flow.
- `CONVICTION`: Uses or earns Conviction (`◆`), the resource that fuels Signature Skills.
- `STANCE`: Interacts with the drafted die / hidden enemy stance read. Correct reads amplify output.

Decision: glossary definitions must teach the current HP-only Hazard combat doctrine: enemy HP is the sole bar; status effects are the efficient path; stance/read boosts card output.

### Unit 2 — Upgrade the selected-card detail modal

Files:

- Modify: `components/combat/encounter/CombatEncounterPanel.tsx`
- Consider extracting if it becomes large:
  - Create: `components/combat/encounter/CombatCardDetailModal.tsx`
  - Test: `components/combat/encounter/__tests__/CombatCardDetailModal.test.tsx`

Selected detail modal requirements:

- Show card title, stance, tier, category, rarity.
- Show **Free action** text from `topActionText`.
- Show **Powered action** text from `bottomActionText` and `bottomDamagePreview` where relevant.
- Show keyword chips with glyphs.
- Show a **Keyword meanings** section, one row per keyword:
  - glyph;
  - label;
  - one-to-two sentence explanation.
- Show stance/read help:
  - card stance;
  - current drafted/read preview if available;
  - color-match/read advantage note if present.
- Keep the modal tap-to-dismiss behavior or add explicit `CLOSE`; do not make it harder to leave.

Suggested modal copy structure:

```text
[Card Name]
BODY · TIER 1 · FALLACY

FREE
[card.topActionText]

POWERED
[card.bottomActionText]

KEYWORDS
⚔ DAMAGE — Deals immediate enemy HP damage.
☠ DOT — Applies damage over time; strong if the fight lasts.

HOW TO PLAY
Drag this card into the play area. Use APPLY for the free action, or drag a stance die onto it before APPLY to power it.
```

Decision: detail text should be useful, not encyclopedic. Two sentences per keyword maximum.

### Unit 3 — Accessibility and tests

Files:

- Add/modify: `components/combat/encounter/__tests__/CombatCardDetailModal.test.tsx`
- Modify: `state/e2e/combat-encounter.screen.test.tsx` if selected-card opening is already practical in tests.

Required assertions:

- Detail modal renders Free and Powered sections.
- Detail modal renders keyword chips and explanations.
- A damage-only card includes the `DAMAGE` definition.
- A status/DoT card includes the `DOT` or status definition.
- A control card includes the `CONTROL` definition.
- Accessibility label/role lets screen readers discover the card as an inspectable object.

If opening a fanned card via gesture is not test-practical, extract `CombatCardDetailModal` and test it directly with fixture VMs. Do not make fragile gesture tests the only coverage.

### Unit 4 — Docs / evidence note

Files:

- Modify if relevant: `docs/combat.md` or `docs/testing.md`
- Modify if relevant: `plan/CRITIQUE.md` only if closing an existing finding.

Add a short note that mobile combat cards now have two levels of legibility:

- compact hand/staged cards: glyph + keyword chips;
- selected card detail: action text + keyword glossary.

## Decisions made upfront — DO NOT ASK

1. Use keywords as explanations of engine-owned behavior, not new rules.
2. Enemy HP remains the sole combat bar; explanations should not resurrect pressure-track doctrine.
3. Status/DoT should be described as the efficient path when the card supports it.
4. The detail modal should reuse the same keyword metadata as compact cards; no duplicate hand-written glossary in the component.
5. If engine fields cannot distinguish a keyword cleanly, omit the keyword or file mechanics follow-up. Do not infer from card names.
6. Keep the detail modal short enough for a phone screen; no wall of text.

## Verify gate

Run:

```bash
npm test -- --runTestsByPath components/combat/encounter/__tests__/CombatCardDetailModal.test.tsx components/combat/encounter/__tests__/CombatBoard.multistage.test.tsx state/e2e/combat-encounter.screen.test.tsx --runInBand
npm run typecheck
```

If visible layout changes are material:

```bash
npm run verify:visual
```

## Commit body template

```text
feat(combat-ui): explain combat card keywords in detail modal

- add reusable keyword glossary metadata for combat cards
- render free/powered action sections in selected card details
- define each visible keyword in the selected-card modal
- cover damage, DoT/status, and control definitions in tests

Verification:
- npm test -- --runTestsByPath ... --runInBand
- npm run typecheck
- npm run verify:visual (if run)
```

## Definition of Done

- [ ] Selected card detail shows Free and Powered action sections.
- [ ] Selected card detail shows keyword chips.
- [ ] Selected card detail defines every shown keyword.
- [ ] Definitions teach HP-only Hazard combat and status-effect doctrine.
- [ ] The detail modal stays phone-readable.
- [ ] Tests cover damage, DoT/status, and control examples.
- [ ] Typecheck passes.

## Follow-ups out of scope

- Custom art/icon asset pipeline for cards.
- Card balance tuning.
- Mechanics card text rewrite.
- Full drag/card-play playthrough harness repair.
