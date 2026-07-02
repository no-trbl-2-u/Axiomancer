# Phase 91 — Battle log two-line format

> Promoted via `/oversight` 2026-05-26 from PHASE_CANDIDATES
> `[score 5.5]` after the build-plan queue emptied. Deep-playtest
> F04 showed the battle log naming effects without connecting them to
> the player's actual choice. This phase makes the log legible as cause
> and consequence.

**Source-of-truth lines:**
- `plan/PHASE_CANDIDATES.md` — `[score 5.5] Battle log two-line format (playtest 2026-05-25 [F04])`
- deep-playtest 2026-05-25 — `[F04]` battle log shows `You apply Fleeting Kindness` without explaining HEART stance + ATTACK as the cause
- Combat log presenter / snapshot surface — locate the log-entry mapping before implementation

---

## Routes / API endpoints / CLI surface

No new routes. Existing combat modal / combat HUD log surface only.

## Content / data reads

| Source | Use |
|---|---|
| Combat round resolution events | Determine the player's chosen stance and action |
| Effect application events | Resolve the applied named effect |
| Existing effect display-name lookup | Preserve human-readable effect names like `Fleeting Kindness` |

## Components / handlers

**Enhanced:**
- Combat battle-log presenter / mapper — emit player-choice and applied-effect text as adjacent lines.
- Combat log render surface — render the two-line format without changing combat semantics.

**Reused:**
- Existing stance/action labels.
- Existing effect display-name lookup used by battle log / effect chips.
- Existing combat resolution state; do not alter resolver behavior.

**New:**
- Regression coverage pinning playtest F04.

## Cross-links

**In (verify):** Existing combat presenter / modal tests should keep passing.

**Out (ship):** No downstream phase required.

**Retro-fit:** If log entries are stored as plain strings, preserve backwards compatibility for old entries while adding structured mapping only for new combat rounds.

## SEO / metadata / output schema

N/A. Runtime UI copy only.

## Hero / body / sub-section composition

Target example:

```text
You chose ATTACK (Heart stance).
Applied: Fleeting Kindness.
```

The first line names player intent. The second line names the mechanical consequence. Do not add long explanation prose.

## Empty / loading / error states

No changes.

## Decisions made upfront — DO NOT ASK

1. **Presenter-first.** Implement in the battle-log view-model / mapper unless inspection proves the source data is missing there. Do not change combat math.
2. **Two adjacent lines.** Prefer adjacent log rows or a two-line single row over a paragraph. The goal is legibility under combat pressure.
3. **Concise labels.** Use `ATTACK`, `SKILL`, `ITEM`, `DEFEND`, etc. and stance labels already visible elsewhere.
4. **Effect names stay human-readable.** No raw effect ids in the battle log.
5. **Backwards compatibility.** Existing historical string log entries may render as-is.

## Mobile reflow / responsive / paginate / output limits

The log surface must not become materially taller per event beyond the intentional second line. If the existing log window clips, preserve scroll behavior rather than shrinking text below current standards.

## Pages × tests matrix

| Surface | Unit | E2E |
|---|---:|---:|
| Battle-log mapper renders player choice line | ✓ | — |
| Battle-log mapper renders applied-effect line | ✓ | — |
| Existing combat round log remains stable | ✓ | ✓ if existing |
| F04 regression: HEART stance + ATTACK → named effect linkage | ✓ | — |

## Verify gate

```bash
npm run verify    # lint + typecheck + test
```

## Commit body template

```text
feat: battle log shows choice then effect — phase 91

- Render combat log entries as player choice followed by effect result
- Connect stance + action input to named effect output
- Add regression coverage for deep-playtest F04
- Preserve existing combat resolution behavior

Decisions:
- Presenter-first change; no combat math changes
- Historical plain-string log entries render unchanged
```

## DoD

- [ ] Locate the combat battle-log mapper / presenter surface.
- [ ] Render player choice line for stance + action outcomes.
- [ ] Render applied-effect line with human-readable effect display name.
- [ ] Preserve existing resolver semantics.
- [ ] Preserve backwards rendering for existing plain-string log entries if applicable.
- [ ] Add regression coverage for F04.
- [ ] `npm run verify` passes.

## Follow-ups (out of scope)

- Full combat UX redesign.
- Flee morale surface.
- ITEM disabled-button tooltip.
- Broad audit of every battle-log phrase.
