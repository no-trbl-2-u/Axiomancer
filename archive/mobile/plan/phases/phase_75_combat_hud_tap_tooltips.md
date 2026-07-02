# Phase 75 — Combat HUD tap-tooltips (Phase 74 Tick B)

> Promoted via /oversight 2026-05-23 (36th call) from Phase 74
> Tick B (combat HUD wiring). Phase 74 Tick A shipped the
> `<TapTooltip>` primitive, `TooltipProvider`, and the
> `selectTooltipContentFor` presenter with content authored
> only for `kind: 'stat'`. Tick B (this phase) wires the
> primitive to the combat HUD surfaces called out in the
> Phase 74 brief's "Follow-ups (out of scope)" list and fills
> in the presenter branches for `kind: 'effect'`,
> `kind: 'stance-chip'`, and `kind: 'skill'`.

## 1. Why

The combat surface is the densest concentration of "what does
this icon do?" elements in the app: buff/debuff chips on the
enemy + player HUDs, ADV/DIS chips on every stance card, skill
picker rows whose descriptions truncate at two lines. Phase 74
Tick A locked the primitive's voice and dismiss contract.
This phase makes the primitive *useful* on the surface where
the player spends most of their reading attention.

The 36th `/oversight` call also set a combat-modal-audit bias:
no structural rewrites of combat-modal surfaces this tick.
Phase 75 honours that — the change shape is **additive tap
targets only**, no layout or chrome changes to existing
components.

## 2. Scope

### A. Presenter content (`state/presenters/tooltip.engine.ts`)

Fill in three of the `null` branches Tick A left open:

- **`kind: 'effect'`** — id is the engine `effectId`
  (e.g. `'tier1_body_attack'`). Look up via
  `lookupEffect(id)` from `axiomancer-mechanics`. Return
  `{ title: def.name.toUpperCase(), body: def.description,
  footnote: 'tier <I|II|III>' }` (Roman tier per
  `def.tier ∈ {1,2,3}`). Returns `null` if the id is unknown
  to the engine library — preserves Tick A's defensive
  contract.
- **`kind: 'stance-chip'`** — id ∈ `'adv' | 'dis'`. Static
  content:
  - `adv` → title `ADVANTAGE`; body `roll twice this exchange,
    keep the higher value.`; footnote `your stance counters
    theirs`.
  - `dis` → title `DISADVANTAGE`; body `roll twice, keep the
    lower value.`; footnote `your stance falls to theirs`.
- **`kind: 'skill'`** — id is the engine skill id
  (e.g. `'ad-hominem-strike'`). Look up via
  `getCombatSkillById(id)` from
  `state/selectors/combat-skills.ts`. Return `{ title:
  skill.name, body: skill.description, footnote: 'cost
  <manaCost> · stance <UPPER>' }`. Returns `null` if the
  engine library doesn't know the id (legacy save / unknown
  fixture).

All three branches read engine static data (no `state`
access required beyond Tick A's signature), so the
presenter remains pure.

### B. Combat presenter wiring (`state/presenters/combat.engine.ts`)

`CombatEffectDisplay` currently strips the engine `effectId`
during `classifyEffect`. Add a new `effectId: string` field
(the **raw** engine id, not the lowercased `id` already used
for `kind` inference) so the chip caller can pass it to the
tooltip. Falls back to empty string when the source effect
has no `effectId` (test fixtures); empty-string ids will
naturally produce a `null` tooltip lookup → no chip-side
breakage.

### C. Tap targets in `app/(tabs)/combat.tsx`

Three additive wires. **No layout or styling changes** to
existing chips/rows.

1. **Effect chips** — both `vm.enemy.effects` and
   `vm.player.effects` map calls in `EnemyPanel` / `PlayerHud`.
   Each chip wraps in a new local `<TooltipTarget>` component
   (defined once in the file, shared by both maps). The
   wrapper owns its own `useRef`, calls `useTooltip().show({
   kind: 'effect', id: effect.effectId, anchorRef })` onPress,
   and renders the existing `<EffectChip>` inside a
   `<Pressable>`. Empty `effectId` → wrapper renders the chip
   without tap wiring (defensive against fixture data).
2. **Stance ADV/DIS chip** — inside `StancePhase`'s per-stance
   card. The existing badge `<View>` becomes a `<Pressable>`
   with its own ref; onPress fires `tooltip.show({ kind:
   'stance-chip', id: isAdv ? 'adv' : 'dis', anchorRef })`.
   The outer `TouchableOpacity` (stance commit) still fires
   when the player taps elsewhere on the card — RN's nested
   touch resolution gives the inner Pressable the badge area.
3. **Skill picker rows** — `SkillPhase`. Add `onLongPress` to
   the existing `<TouchableOpacity>` that calls `tooltip.show({
   kind: 'skill', id: s.id, anchorRef })`. The single-tap
   `onPress` keeps its existing behaviour (commit the skill).
   `accessibilityHint='hold to read full description'`
   surfaces the affordance to screen readers.

### D. Tests

- **Presenter unit tests** (`state/presenters/__tests__/tooltip.engine.test.ts`,
  existing file): add cases for each new kind:
  - `'effect'` with a known engine id (e.g. `'tier1_body_attack'`)
    returns the engine name uppercased + verbatim description
    + `'tier i'` footnote.
  - `'effect'` with unknown id returns `null`.
  - `'stance-chip'` with `'adv'` and `'dis'` return the locked
    static content; unknown id returns `null`.
  - `'skill'` with a known engine skill id returns name,
    description, and `'cost <n> · stance <UPPER>'` footnote;
    unknown id returns `null`.
- **Component tests** (new
  `components/combat/__tests__/CombatHudTooltipTargets.test.tsx`
  or extension to existing `app/(tabs)/__tests__/combat.test.tsx`
  if present): hermetic tests pressing the effect chip,
  stance ADV chip, and skill row long-press; assert the
  TooltipProvider mounts the expected body text. Mock
  `measureInWindow` via the same pattern Tick A used.

## 3. Decisions made upfront — DO NOT ASK

1. **Effect tap-target = the entire EffectChip.** Not just
   the glyph — the whole chip's hit area becomes tappable.
   Larger target = more forgiving on small viewports.
2. **Skill tap-target = `onLongPress`** on the existing
   picker row, NOT a sibling tap-target. Single-tap already
   commits the skill (locked behaviour from Phase 73); a
   second tap-target would compete for the same touch area.
   Long-press is the natural mobile pattern when tap is
   reserved for an action. Documented in the row's a11y
   hint.
3. **Stance chip tap-target = the ADV/DIS badge `<View>`,
   not the whole stance card.** The card commits the stance
   on tap; the badge is the affordance that begs explanation.
4. **Effect ids use the engine's raw `effectId`** (not the
   lowercased `id` the chip kind-inference uses). This is
   what `lookupEffect()` keys on — guaranteed roundtrip with
   the engine library.
5. **Effect tooltip footnote = `'tier <I|II|III>'`.** Simple,
   constant per effect. Payload-derived footnotes (per-tick
   damage, modifier values) are a follow-up — engine
   `EffectPayload` is union-typed and would need its own
   formatter helper.
6. **Skill tooltip footnote = `'cost <n> · stance <UPPER>'`.**
   Mirrors what the picker row already shows in the cost
   column + stance glyph, but explicit for screen-reader and
   first-paint clarity.
7. **Stance chip tooltip content is static.** The engine
   doesn't currently expose "which effects flipped this
   stance to ADV/DIS" — just the relative comparison to the
   enemy's last stance. Static text explains the dice rule;
   dynamic effect-attribution is a follow-up (would need a
   new presenter that walks `player.effects` for
   `advantageModifier` entries).
8. **Tooltip `kind: 'stance-chip'` id space stays
   lowercase** (`'adv' | 'dis'`). Mirrors the
   `StanceOption.advantage` field. The `'neutral'` case has
   no chip rendered, so no id is needed.
9. **No new combat-modal surface restructuring.** Honours
   the 36th /oversight call's combat-modal-audit bias.
10. **Test mock for `measureInWindow`** — re-use the same
    `requestAnimationFrame` + zero-callback pattern Tick A
    established. No new mock primitive.
11. **EffectChip itself stays untouched.** No prop changes,
    no internal wrapping. The `<TooltipTarget>` wrapper in
    `combat.tsx` is the new piece. Keeps the shared chip
    component free of tooltip coupling — other callers
    (aftermath panels, future surfaces) keep the lean shape.
12. **Empty `effectId` falls through cleanly.** Test
    fixtures that build effects without an engine id won't
    crash — the wrapper detects empty string and renders
    the chip with no tap wiring. Documented in the wrapper's
    JSDoc.

## 4. Risks

- **Nested touch resolution on the stance card.** RN's
  Pressable inside TouchableOpacity should give the inner
  Pressable the badge area, but iOS gesture system can
  occasionally bubble both. Pin a hermetic test that taps
  the badge testID and asserts only the tooltip fires (no
  stance commit dispatched). If the assertion is unstable,
  fall back to `onLongPress` on the stance card (same
  pattern as skill rows).
- **`onLongPress` default delay (500ms).** Acceptable for
  a tooltip affordance; players already long-press to read.
  No override needed.
- **`lookupEffect` returning `undefined` for legacy
  `effectId`s.** Already handled — presenter returns `null`
  and the chip renders without a tooltip. No crash path.
- **`getCombatSkillById` returning `null`** for unknown ids.
  Same — presenter returns `null`, long-press does nothing.

## 5. Sub-tick log

| Tick | Status | Commit | Notes |
|------|--------|--------|-------|
| —    | `[ ]`  | —      | Single-tick phase: presenter + combat-presenter `effectId` + 3 tap-target wires + tests. |

## 6. Acceptance (DoD)

- `pnpm verify` green; new hermetic tests pass.
- The three new presenter branches return engine-sourced
  content for known ids, `null` for unknown.
- Tapping an effect chip on the enemy or player HUD shows a
  tooltip with the engine effect name + description.
- Tapping the ADV badge on a stance card shows the static
  ADVANTAGE tooltip; tapping DIS shows DISADVANTAGE.
- Long-pressing a skill picker row shows the full skill
  description (un-truncated) + cost/stance footnote.
- No layout regressions on the combat HUD (no new wrapper
  alters spacing — `Pressable` defaults to inline content
  box).
- Existing combat tests still pass; stance commit still
  fires when tapping outside the ADV/DIS badge; skill
  commit still fires on short tap.

## 7. Commit body template

```
feat: combat HUD tap-tooltips — phase 75 (Phase 74 Tick B)

- TapTooltip primitive now wires three combat surfaces:
  buff/debuff effect chips (enemy + player HUDs), stance
  ADV/DIS badges, and skill picker rows (long-press).
- selectTooltipContentFor fills the kind:'effect',
  kind:'stance-chip', kind:'skill' branches Tick A left as
  null. Effects + skills read engine static data via
  lookupEffect / getCombatSkillById; stance chips use locked
  static content.
- CombatEffectDisplay gains `effectId` so the chip caller can
  pass the engine id through to the tooltip lookup.
- No combat-modal layout changes — only additive tap targets.
  Honours the 36th /oversight call's combat-modal-audit bias.

Decisions:
- Skill rows use onLongPress (not onPress) because single-tap
  commits the skill; long-press is the natural mobile pattern
  when tap is reserved for an action.
- Stance chip tap-target is the ADV/DIS badge only, not the
  whole stance card (which commits the stance).
- Effect tooltip footnote is the tier (I/II/III); payload
  introspection deferred to a follow-up.
- Stance chip tooltip is static; dynamic "which effects
  flipped this to ADV/DIS" is a follow-up that needs an
  effect-walking presenter.

Closes #<phase-issue-number>
```

## 8. Follow-ups (out of scope)

- **Tick C — SELF wiring.** Each base stat (Tick A content
  already authored), 9 derived cells, alignment cube,
  affliction / blessing rows.
- **Tick D — Inventory wiring.** Equipment slot labels,
  item-card stat lines, burden bar.
- **Tick E — Memoir wiring.** Chronicle entry types, quest
  objective rows.
- **Payload-derived effect footnotes.** Walk
  `def.payload.statModifiers` / `damageOverTime` /
  `regeneration` to produce per-effect numbers (e.g.
  `+1 physical attack`, `-2 hp / round`).
- **Dynamic stance-chip tooltip.** New presenter that walks
  `player.effects` for `advantageModifier` entries and
  surfaces the source effect names in the footnote.
- **Long-press alternative on Android stance cards.** If the
  nested-touch risk in §4 materialises, fall back to
  long-press on the card itself.
