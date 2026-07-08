# Phase 9 — Author the first real character/story/world specs

> Agent-facing brief. Concise, opinionated, decisive. Ship without
> asking; document any judgment calls in the commit body.

## Outcome / Why

The build-plan row: *"Author the first real character/story/world
specs via the design skills, replacing the template-only `specs/*`
folders (both)."*

Investigation (this phase's Step 3 research) found the goal was
**already achieved**, just not tracked against this row:

- `axiomancer-mechanics/specs/characters/C-01-the-sophist.md` —
  authored in commit `7ea06a6e` ("specs: promote the Aporia — W-01
  continent spec + C-01 the Sophist", 2026-07-07).
- `axiomancer-mechanics/specs/world/W-01-aporia-labyrinth-continent.md`
  — same commit `7ea06a6e`.
- `axiomancer-mechanics/specs/story/S-01-fishing-village-northern-forest-dilemmas.md`
  — authored in commit `6fa7f090` ("feat(content): fv-14 'What Do
  I Tell Father?' dinner dilemma replaces placeholder", 2026-07-04).

Each folder's own template file defines "done" explicitly: *"This
file is `00`; the first real \<character/story/world\> spec is
\<C/S/W\>-01-\*.md."* All three `-01-*` files exist, are full
records (voice lock, history/atmosphere, cross-references, open
questions, acceptance checklist), and were authored via the
matching design skill (`/character-spec`, `/story-spec`,
`/world-spec` — confirmed by structure match against each
template). No folder is template-only anymore.

So there is no code or content gap left to ship for the literal
row text. What's left, and what this phase actually does, is
**recognition**: verify the three specs are internally consistent
(mutual cross-references, no stale template artifacts) and tick
the build-plan row against the commits that already did the work.

## Verification performed

- `characters/C-01` <-> `world/W-01`: mutual. C-01's
  Cross-references table points at W-01; W-01's Dependencies line
  lists the Sophist finale as an unblock. Consistent.
- `story/S-01`: explicitly marked "NOT implemented tonight — specs
  only, for a future content pass" at the top of the file. That is
  a true, honest status marker (four dilemma beats fully designed,
  none wired to a map node yet) — not a defect. Implementing those
  beats is separate follow-up work (see Follow-ups), not part of
  authoring the spec itself.
- No stray `plan/AUDIT.md` / `plan/CURRENT-STATE.md` entries
  reference these folders as still template-only — nothing to
  drain.
- `specs/README.md` (the numbered mechanic-spec index) doesn't
  list the characters/story/world folders — by design, they're a
  parallel design-skill spec system with their own per-folder
  template/convention file (`00-*-spec-template.md`), not part of
  the numbered mechanic-spec sequence. No retrofit needed.

## Routes / endpoints / CLI surface (locked in `bearings.md`)

None. Pure design-doc phase; no runtime surface touched.

## Content / data reads

None.

## Components / handlers

None — no code changes. This phase is a build-plan bookkeeping
correction: the work shipped under commits `7ea06a6e` and
`6fa7f090` (both pre-dating this row's phase-tracking), and this
phase records that against Phase 9.

## Cross-links

N/A — no new surface.

## Output schema / contracts

N/A.

## Decisions made upfront — DO NOT ASK

- **Treat as already-shipped, not re-do.** The three specs exist,
  are full (not stub) records, and satisfy each template's own
  literal definition of "the first real spec." Re-authoring them
  would duplicate settled design work for no benefit.
- **Don't chase S-01's "not implemented" note as a gap for this
  phase.** Phase 9's row is about *authoring specs*, not
  implementing their content — that distinction is already made
  explicitly in the phase 8 brief's own Follow-ups section ("A
  story-spec pass ... matches build-plan Phase 9's own scope").
  Implementation is real future work, tracked as a follow-up here,
  not blocking this tick.
- **Don't retrofit `specs/README.md`'s numbered index to include
  characters/story/world.** They are a deliberately separate
  system (own template + numbering scheme, `C-NN`/`S-NN`/`W-NN`
  vs. the mechanic specs' plain `NN`) — folding them into one
  table would blur two conventions that exist for good reasons
  (personhood-focused vs. mechanic-focused).

## Pages × tests matrix

N/A — no runtime code changed; nothing to test.

## Verify gate

No code changed; `npm run verify` is not required for this tick.
(Skipping is safe under the hard rule "verify gate" contract
because there is zero diff to the `src/` surface — confirmed via
`git status --short` before commit.)

## Commit body template

```
plan: phase 9 shipped — character/story/world specs already authored

- Verified specs/characters/C-01-the-sophist.md,
  specs/world/W-01-aporia-labyrinth-continent.md (commit 7ea06a6e)
  and specs/story/S-01-fishing-village-northern-forest-dilemmas.md
  (commit 6fa7f090) already satisfy this row's literal goal — each
  folder's template defines "the first real spec is *-01-*.md" and
  all three exist as full records authored via the matching design
  skill
- Confirmed mutual cross-references (C-01 <-> W-01) and no stale
  AUDIT/CURRENT-STATE debt referencing these folders as
  template-only
- No code or doc change needed beyond ticking the build-plan row

Decisions:
- Treated as already-shipped rather than re-authoring — duplicate
  work with no benefit
- Left S-01's "not implemented" status as-is — implementing those
  dialogue beats is separate follow-up scope, not this row's goal
- Did not fold characters/story/world into specs/README.md's
  numbered index — deliberately separate conventions

Closes #<phase-issue-number>
```

## DoD

Flip Phase 9's `[ ]` -> `[x]` in `plan/steps/01_build_plan.md`,
append commit hash and the citing commits (`7ea06a6e`, `6fa7f090`).

## Confirm deploy

```bash
npm run deploy:check
```

## Follow-ups (out of scope this phase)

- Implement the four dialogue beats designed in `story/S-01`
  (wiring them to real map nodes across fishing-village /
  northern-forest, per that spec's own re-slotting note) — a
  content phase, not a spec-authoring one.
- Author additional character/story/world specs as new named
  NPCs, locations, or story beats are designed — this phase only
  required the *first* of each; the pattern is now proven and
  reusable via `/character-spec`, `/story-spec`, `/world-spec`.
