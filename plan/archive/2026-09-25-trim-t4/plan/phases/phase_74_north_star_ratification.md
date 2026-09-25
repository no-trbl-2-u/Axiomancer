# Phase 74 — N-1: fold the ratified North Star into spec 34

> Docs/design phase. No runtime code, no engine, no mobile surface. Touches
> `axiomancer-mechanics/specs/34-dark-fantasy-campaign.md`, `plan/bearings.md`,
> and the three unattended-capable design skills
> (`.claude/skills/story-spec/`, `.claude/skills/world-spec/`,
> `.claude/skills/character-spec/`).

## Outcome

`plan/north-star-mork-borg.md` (RATIFIED 2026-08-22) stops being a
plan-only file the loop might not read and becomes load-bearing doctrine
in the two places ticks actually look: the spec a content phase cites,
and the bearings entry the loop treats as its standing-decisions list.

## Why

North star §5 names this exact follow-up (N-1) with four parts. AUDIT's
"THE LONGER LEASH is unratified and invisible to the loop" row is RESOLVED
but explicitly queues N-1 as Phase 74 — this phase discharges it.

## Scope (four parts, per north-star §5 N-1)

1. **Fold §2 into spec 34 as §2.5** — the Mörk Borg delivery register
   (MB-1…MB-8), verbatim from `north-star-mork-borg.md` §2, becomes spec
   34's §2.5 ("Tone and voice register" section gains a subsection). Spec
   34 outranks a plan/ file for downstream citation (`spec 34 §N`).
2. **Update bearings' Voice entry** to cite spec 34 §2.5 alongside the
   existing terse/archaic-flavored/cold-and-old line — same content, now
   traceable to a ratified doctrine, not just a plan file.
3. **Add an unattended-mode posture note to the three design skills**
   (`story-spec`, `world-spec`, `character-spec`) — R-D's full authority
   means the loop (via `content-curator` or a `/ship-a-phase`/`/iterate`
   tick) may invoke these skills without a human present. Today's Phase 1-4
   Socratic ritual assumes an attended session (`AskQuestion` calls,
   waiting on user signal). Add a documented unattended path: skip the
   back-and-forth, resolve Phase 2's questions and Phase 4's alternatives
   internally against the register + prior art, then go straight to Phase
   5 and write the spec file — the file is the record, not a request for
   permission (R-D: "the file is the record, not the permission").
4. **Add R-F ("THE LONGER LEASH") as its own bearings entry** under
   "Decisions standing for the autonomous loop" — T's verbatim quote, the
   surface list (cards/effects/keywords/narration/art/UI/direction/the
   map/mechanics), the net keep-list (deckbuilding core, Dice system,
   Conviction + signatures, Surge meter, equipment), and the not-touched
   list (engineering rigour, no-destructive-git, no-secrets,
   `AskUserQuestion`-only-in-`/oversight`). Placed near the existing
   PIPELINE LIBERATION / LOCKED MECHANICS entries so a tick reading
   bearings top-to-bottom hits it in the same neighborhood as the related
   rulings it cross-references.

## Decisions made upfront — DO NOT ASK

- **§2.5 is new prose, not a link.** Spec 34 is the citable authority
  (`spec 34 §N`); a plan/ file is not designed for that. Copy MB-1…MB-8
  into the spec verbatim (register content doesn't change, only its
  address) rather than pointing spec 34 at the plan file.
- **The Contents table and §12 Index of rulings get new rows.** Spec 34
  is deliberately greppable by ruling; a new §2.5 with no index entry
  would violate its own §11 acceptance bar ("every ruling numbered and
  greppable").
- **R-C/R-F reconciliation is recorded in §2.5's own header**, not
  re-litigated in §2's existing rulings — §2.1-§2.4 (the original voice
  register, forbidden registers, sentence form, six lexicons) stay
  untouched; §2.5 is additive.
- **Bearings' existing Voice bullet is amended, not replaced** (same
  policy the north star's own §2.1 used against the original bearings
  entry: ratify, don't discard).
- **N-2 (the register lint) and N-3 (re-voice pass) are explicitly out of
  scope for this phase.** N-2 already has a partial guardrail (Phase 70's
  `check-prose.mjs`: exclamation-mark + faux-archaic rules); its remaining
  MB-1 mechanical subset (sentence length, semicolons, caps-in-prose) is
  a separate follow-up, not bundled here — the build-plan row for Phase 74
  scopes this as "docs/design," and mixing in lint code would blow that
  scope. N-3 is its own build-plan Phase 75.
- **Unattended-mode note format:** one new bullet in each skill's
  existing "When to break the ritual" section (all three already have
  one, same shape) rather than a new top-level section — keeps the three
  skills structurally identical, which the skills already are by design.

## Verify gate

Docs-only: no `npm run verify` legs are touched by content. Run
`npm run verify --workspace axiomancer-mechanics` only if a `.md`
structural check (contents-table / index-of-rulings linter, if one
exists) could fire on spec 34; otherwise this phase's verification is
read-back (spec renders, cross-references resolve, bearings still parses
as the loop's markdown-derived state file).

## Commit body template

```
plan: fold THE LONGER LEASH north star into spec 34 + bearings — phase 74

- spec 34 gains §2.5 (Mörk Borg delivery register, MB-1..MB-8) + index rows
- bearings' Voice entry cites spec 34 §2.5
- bearings gains a THE LONGER LEASH (R-F) entry near PIPELINE LIBERATION
- story-spec / world-spec / character-spec gain an unattended-mode note

Decisions:
- <as needed>

Closes #<phase-issue-number>
```

## DoD

- [ ] Spec 34 §2.5 exists, contents table + §12 index updated.
- [ ] Bearings Voice entry cites spec 34 §2.5.
- [ ] Bearings has a THE LONGER LEASH entry (quote + surface list +
      keep-list + not-touched list).
- [ ] All three design skills document an unattended-mode path.
- [ ] Build plan row ticked `[x]` with commit hash.

## Follow-ups (out of scope)

- N-2 — the register lint's MB-1 mechanical subset (sentence length,
  semicolons, caps-in-prose) into `check-prose.mjs` or a sibling.
- N-3 — Phase 75, the re-voice pass.
