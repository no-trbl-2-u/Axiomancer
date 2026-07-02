# Phase 92 — Flee narrative feedback + morale surface

> Promoted via `/oversight` 2026-05-27 (42nd call) from
> PHASE_CANDIDATES `[score 5.0]`. Deep-playtest F03 showed that
> fleeing from encounters gives no feedback and morale cost is
> invisible. This phase adds narrative feedback after fleeing
> and exposes morale value for player visibility.

**Source-of-truth lines:**
- `plan/PHASE_CANDIDATES.md` — `[score 5.0] Flee narrative feedback + morale surface`
- deep-playtest 2026-05-25 — `[F03]` FLEE gives no feedback or morale indication
- `plan/CRITIQUE.md` — HIGH priority finding about flee missing feedback
- Mechanics audit row [4.5] — Wire FLEE's `-ii morale` into the engine moralMeter

---

## Routes / API endpoints / CLI surface

No new routes. Enhanced exploration tab and SELF tab surfaces only.

## Content / data reads

| Source | Use |
|---|---|
| Engine `moralMeter` state | Display current morale value to player |
| Flee action resolution | Trigger narrative feedback after fleeing |
| Existing aftermath text patterns | Template for flee narrative prose style |

## Components / handlers

**Enhanced:**
- Exploration screen — add morale indicator on exploration card or context
- SELF screen — expose morale value in character stats/alignment section
- Flee action flow — add narrative beat after successful flee

**Reused:**
- Existing prose/narrative formatting patterns (matches death/victory text style)
- Current aftermath modal or toast display system
- Existing engine moralMeter accessor

**New:**
- Flee narrative formatter/presenter
- Morale display component or integration
- Regression coverage pinning playtest F03

## Cross-links

**In (verify):** Existing flee action tests should keep passing.

**Out (ship):** No downstream phase required.

**Retro-fit:** None required - this is additive surface enhancement.

## SEO / metadata / output schema

N/A. Runtime UI enhancement only.

## Hero / body / sub-section composition

**Flee narrative target example:**
```text
You fled the encounter. The path bends away.

Morale -2
```

**Morale surface options:**
1. **Exploration card context** — small indicator showing current morale
2. **SELF tab integration** — morale meter/value in character sheet alignment section
3. **Both** — visibility on exploration for immediate context, full detail on SELF

Match existing prose style (lowercase ritual register, terse phrasing). No long explanatory text.

## Empty / loading / error states

- **Morale at default/neutral** — show "untested" or hide indicator
- **Morale at extremes** — clamp display appropriately
- **No recent flee** — no narrative surface needed

## Decisions made upfront — DO NOT ASK

1. **Prose style matches existing aftermath patterns.** Use lowercase ritual register like death/victory text, not modern UI copy.
2. **Morale surface on SELF tab primarily.** If exploration card addition is simple, include it; otherwise defer to iteration.
3. **Narrative beat after flee success only.** No change to flee mechanics, just post-action feedback.
4. **Preserve existing flee behavior.** This is additive feedback only - don't modify flee mechanics or morale calculation.
5. **Use existing modal/toast patterns.** Don't build new surface system - use existing aftermath or toast display.

## Mobile reflow / responsive / paginate / output limits

Morale indicator must not disrupt existing exploration card layout. If space is limited, defer morale display to SELF tab only.

## Pages × tests matrix

| Surface | Unit | E2E |
|---|---:|---:|
| Flee narrative text generation | ✓ | — |
| Morale value display on SELF | ✓ | — |
| Flee action shows narrative feedback | ✓ | ✓ |
| F03 regression: flee gives visible feedback | ✓ | — |
| Morale visibility after flee action | ✓ | — |

## Verify gate

```bash
npm run verify    # lint + typecheck + test
```

## Commit body template

```text
feat: flee narrative feedback + morale surface — phase 92

- Add narrative beat after fleeing encounters (prose style)
- Expose morale value on SELF tab for player visibility
- Add regression coverage for deep-playtest F03
- Preserve existing flee mechanics and morale calculation

Decisions:
- Prose style matches existing aftermath patterns (lowercase ritual)
- Morale surface primarily on SELF tab to avoid exploration layout disruption
- Additive feedback only - no flee mechanics changes
```

## DoD

- [ ] Add narrative feedback after successful flee action
- [ ] Expose morale value on SELF tab character sheet
- [ ] Consider simple morale indicator on exploration card if layout permits
- [ ] Style narrative text to match existing aftermath prose (lowercase ritual register)
- [ ] Add regression coverage for F03 (flee feedback missing)
- [ ] Preserve existing flee mechanics and morale calculation
- [ ] `npm run verify` passes

## Follow-ups (out of scope)

- Full combat UX redesign with integrated morale bar visuals
- Morale impact visualization/animation
- Death screen presenter fixes (Phase 93)
- Sealed node tap feedback (Phase 94)
- Combat ITEM button tooltip (Phase 95)