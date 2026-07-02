# Phase 158 — Combat card compact glyphs + keyword chips

**Source:** T direct steering 2026-06-24.

## Outcome

Small combat cards in the new Hazard-style combat board become readable at a glance: each hand/staged/reward card shows clear action glyphs, concise keyword chips, and useful micro-copy without forcing the player to open the detail modal.

Examples:

- Direct damage / strike-only card: sword glyph (`⚔`) and `DAMAGE` keyword.
- DoT/status card: plague/flame glyph and `DOT` / status keyword.
- Control card: chain glyph and `CONTROL` keyword.
- Mercy/friendship card: dove/hand glyph and `MERCY` / `BEFRIEND` keyword.
- Conviction/signature-related card where applicable: `◆` / `CONVICTION` keyword.

This is a mobile presentation phase only. The engine remains rules authority.

## Current truth

Relevant files at filing:

- `components/combat/encounter/CombatBoard.tsx`
  - `HandCard` currently renders name, stance initial, `EFFECT_GLYPH`, and sometimes `+bottomDamagePreview`.
  - Accessibility label says `${card.name}, ${card.stance} ${card.effectKind} card. ${card.bottomActionText}`.
- `state/presenters/combat-encounter.engine.ts`
  - `CombatCardVM` exposes `verbClass`, `effectKind`, `tier`, `category`, `topActionText`, `bottomActionText`, `bottomDamagePreview`, `read`, and `colorMatch`.
  - It does not yet expose a normalized keyword/glyph surface for card rendering.
- `components/combat/encounter/CombatRewardsOverlay.tsx`
  - Reward offers use similar effect glyph shorthand but not the richer small-card vocabulary.

## Implementation units

### Unit 1 — Add a card keyword/glyph presenter surface

Files:

- Modify: `state/presenters/combat-encounter.engine.ts`
- Test: add or extend a presenter test under `state/presenters/__tests__/` if the repo pattern supports it; otherwise use component tests in Unit 3.

Add typed VM fields to `CombatCardVM` and reward VMs:

```ts
interface CombatCardKeywordVM {
  key: string;          // stable id: damage | dot | control | buff | mercy | draw | discard | conviction | stance
  label: string;        // player-facing: DAMAGE, DOT, CONTROL, MERCY
  icon: string;         // compact glyph: ⚔, ☠, ⛓, ✦, 🕊, ◆
  tone: 'damage' | 'status' | 'control' | 'support' | 'mercy' | 'resource' | 'neutral';
  shortHelp: string;    // one-line definition for accessibility/detail reuse
}
```

Derive keywords from existing engine fields, not from card names:

- `verbClass`
- `effectKind`
- `bottomDamagePreview`
- `category`
- `topActionText` / `bottomActionText` only as fallback text, never as the primary rules parser.

Suggested first vocabulary:

- `damage` — `⚔ DAMAGE` — direct enemy HP damage.
- `dot` — `☠ DOT` — damage over time / erosion status.
- `control` — `⛓ CONTROL` — hinders or weakens enemy threat output.
- `buff` — `✦ BUFF` — strengthens or protects the player.
- `mercy` — `🕊 MERCY` — supports Befriend / spare resolution.
- `draw` — `🃏 DRAW` — changes hand/deck flow.
- `discard` — `🗑 SCRAP` — discards or trims cards.
- `conviction` — `◆ CONVICTION` — interacts with Conviction or Signature Skills.
- `stance` — reuse stance glyph/color — cares about the drafted/read stance.

Decision: keep the vocabulary small and stable. Do not invent deep rules language that the engine cannot prove.

### Unit 2 — Render compact cards with glyphs + keyword chips

Files:

- Modify: `components/combat/encounter/CombatBoard.tsx`
- Modify if needed: `components/combat/encounter/CombatRewardsOverlay.tsx`

Small-card requirements:

- Keep the card name visible.
- Show stance color/bar as today.
- Replace ambiguous `🔥/⛓/◆ + stance initial` shorthand with a clearer compact strip:
  - primary action glyph, e.g. `⚔` for pure damage;
  - 1–2 keyword chips, e.g. `DAMAGE`, `DOT`, `CONTROL`;
  - damage preview only when meaningful, e.g. `⚔ 8` instead of bare `+8`.
- Do not overcrowd the hand. If space is tight, show only icon + first keyword on the hand card and richer chips on staged cards/reward cards.
- Use accessible labels that read keyword labels and one-line meaning.

Decision: this phase improves the small/fanned/staged/reward card surface, not the full selected-card detail modal. Detail explanations are Phase 159.

### Unit 3 — Tests for compact legibility

Files:

- Modify/add: `components/combat/encounter/__tests__/CombatBoard.multistage.test.tsx`
- Modify/add: `components/combat/encounter/__tests__/CombatRewardsOverlay.test.tsx` if reward tests exist or can be added cheaply.
- Modify/add: `state/e2e/combat-encounter.screen.test.tsx` only for smoke-level confirmation.

Required assertions:

- A direct-damage-only card renders `DAMAGE` and a sword/direct-damage glyph.
- A DoT/status card renders `DOT` or the chosen status keyword and status glyph.
- A control card renders `CONTROL` and chain/control glyph.
- Accessibility label includes card name + keyword labels, not only raw `effectKind`.
- Existing multi-stage card render tests still pass.

## Decisions made upfront — DO NOT ASK

1. Use glyphs as legibility aids, not as rules. Engine fields remain truth.
2. `⚔` is the first-pass direct-damage glyph unless design later replaces it with custom SVG assets.
3. Keyword chips must be derived structurally; do not parse card names.
4. Small cards get concise keywords. Full definitions belong in Phase 159 detail overlay.
5. No new mechanics package release is required unless current published card fields prove insufficient; if insufficient, file a mechanics follow-up instead of simulating rules locally.

## Verify gate

Run:

```bash
npm test -- --runTestsByPath components/combat/encounter/__tests__/CombatBoard.multistage.test.tsx state/e2e/combat-encounter.screen.test.tsx --runInBand
npm run typecheck
```

If reward overlay changes:

```bash
npm test -- --runTestsByPath components/combat/encounter/__tests__/CombatRewardsOverlay.test.tsx --runInBand
```

If visible layout changes are material:

```bash
npm run verify:visual
```

## Commit body template

```text
feat(combat-ui): add compact card glyphs and keyword chips

- derive combat card keyword/glyph metadata from engine-owned card fields
- render compact hand/staged/reward cards with clearer action glyphs and keyword chips
- improve accessibility labels for card intent
- cover direct damage, DoT/status, and control cards in tests

Verification:
- npm test -- --runTestsByPath ... --runInBand
- npm run typecheck
- npm run verify:visual (if run)
```

## Definition of Done

- [ ] `CombatCardVM` or equivalent presenter surface exposes structured keyword/glyph metadata.
- [ ] Hand cards show clearer glyphs and keyword chips.
- [ ] Staged/reward card surfaces use the same vocabulary where space permits.
- [ ] Direct-damage-only cards use a sword/direct-damage affordance.
- [ ] Accessibility labels include keyword labels.
- [ ] Tests cover damage, DoT/status, and control card examples.
- [ ] Typecheck passes.

## Follow-ups out of scope

- Full selected-card keyword glossary — Phase 159.
- Custom SVG asset replacement for glyphs.
- Mechanics rule changes or card balance tuning.
- Mobile drag/playthrough harness repair.
