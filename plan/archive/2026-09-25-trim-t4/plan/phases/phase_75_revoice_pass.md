# Phase 75 — N-3: the re-voice pass

> R-E, ratified 2026-08-22; the register it sweeps toward landed in
> spec 34 §2.5 with Phase 74 (2026-08-27). Brief generated 2026-08-27
> by `/ship-a-phase` §9.

## Outcome

MB-1's lintable half is wired into `check-prose.mjs`, and every shipped
narration string it flags is re-voiced: sentences shorten and harden,
semicolons go, names stay (R-A).

## Measured first

Across the 14 content surfaces, 4292 narration sentences:

| Finding | Count | Where it concentrates |
|---|---|---|
| sentences over the 20-word ceiling | 52 | labyrinth acts (37 of 52) |
| literals carrying a semicolon | 70 | enemy descriptions, labyrinth `scene` |

Tractable in one pass, which is why this ships as a sweep rather than a
sampling.

## Decisions made upfront — DO NOT ASK

- **The lint becomes field-aware, and MB-1 applies only to narration
  fields.** `paidSummary` is rules text governed by §2.3 and the
  real-units-or-no-number law; shortening a paid line to satisfy a
  narration rule would trade a mechanical guarantee for a stylistic one.
  The retired-term and voice rules keep applying to every literal — a
  retired keyword in rules text is still wrong.
- **Semicolons are removed by splitting, not by substituting commas.**
  MB-1's point is sentence SHAPE: "full stops are the register". Swapping
  `;` for `,` satisfies the grep and defeats the rule.
- **Names stay untouched** (R-A, and the naming law sweep from Phase 70
  already guards them). This pass edits sentences only.
- **Judgement rules (MB-2…MB-7) are applied opportunistically while
  rewriting, and are NOT claimed as swept.** A machine can find a
  40-word sentence; it cannot find a line that sympathizes. Every line
  this pass touches gets read against the full register, but the lines
  it does not touch are not audited, and saying otherwise would make the
  next reader trust a sweep that did not happen.
- **Card and enemy prose is in scope; card RULES text is not.** Flavor
  `description` reads as narration. `paidSummary` does not.

## Surface

`scripts/check-prose.mjs` (two rules + field awareness),
`scripts/check-prose.test.mjs`, and the narration in: the three
labyrinth acts, `MapEvents/content.ts`, both `npcs.ts`, the minigame
content files, `enemy.library.ts`, `cards.library.ts`, the mobile
`*.copy.ts`.

## Tests

| Case | Assert |
|---|---|
| a 25-word narration sentence | flagged |
| the same text in `paidSummary` | not flagged |
| a semicolon in narration | flagged |
| a semicolon in rules text | not flagged |
| the live tree | `check-prose` exits 0 after the sweep |

## Verify gate

`npm run verify`, `npm run lint:content`, root `npm test`.

## DoD

- [ ] MB-1 wired, field-aware, tested.
- [ ] Every flagged narration string re-voiced.
- [ ] `npm run verify` green; build-plan row ticked.

## Follow-ups (out of scope)

- A judgement pass over the prose this sweep did not touch (MB-2…MB-7).
- The North Star §6 open questions for T.
