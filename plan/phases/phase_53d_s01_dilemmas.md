# Phase 53d — Author S-01's four dilemmas

> Agent-facing brief. Four dilemmas designed to the fv-14 standard and never
> wired. Both of S-01's open questions were answered at planning time, its
> intended hosts are superseded, and the register they ship in is not the one
> the surrounding prose uses. Mechanics content. Fourth of the
> **narrative-encounters** batch; needs 53c's re-layered grid.

## Why this exists

`specs/story/S-01-fishing-village-northern-forest-dilemmas.md` designs four
coming-of-age dilemmas — The Borrowed Hook, The Frightened Friend, The
Stranger's Net, The Crowning Witnessed — to the pattern `fv-14` proved: a
`narration` pool carrying a real `DialogueTree`, three replies at a root
node, each a leaf outcome setting one distinct flag, no engine-signposted
correct answer.

None is wired. `fv-14` remains the only dilemma in the game, and it is on
29.4% of routes, so seven in ten runs contain no moral choice at all.

The spec has been unblocked: its two open questions were answered
2026-08-09 during phase-53 planning, both reversible and both recorded in
the spec itself. Read them before touching anything — the answers change
where these go and what they are allowed to do.

## Inputs

1. `specs/story/S-01-fishing-village-northern-forest-dilemmas.md` — the four
   scenes, the answered open questions, and the **superseded-hosts table**
   under Open Question 1.
2. `specs/story/S-02-fishing-village-voices.md` — the column law, and the
   post-boss NPCs who will read these flags in 53e.
3. `src/World/MapEvents/content.ts` — `fvFatherWorryDialogue`, the exact
   shape to copy.
4. `src/World/MapEvents/e2e/fv-14-father-worry.engine.test.ts` — the test
   shape to mirror, one file per dilemma.
5. `specs/34-dark-fantasy-campaign.md` §2 — the ratified register, and §2.2's
   hard bans.
6. `src/World/world.reducer.ts` — `auditMapTraversal` and 53c's coverage
   auditor, both re-run after placement.

## Scope

**Four `narration` pools**, each displacing one **encounter** node — the only
kind either map carries a surplus of. The grid stays at 25 on both maps.

The intended hosts named in S-01 are superseded; the answered question gives
the replacements and the reason for each. Two binding constraints on the
exact node ids, which are this phase's call:

1. **A dilemma whose flag is read later must sit in a strictly earlier
   column than every reader.** The gauntlet has no back-travel. The Borrowed
   Hook and The Stranger's Net are both read by 53e's post-boss NPCs, so
   both belong in columns 2-4.
2. **Re-run `auditMapTraversal` and the coverage walk afterward.** Kind
   reassignment does not change topology, but the coverage numbers move and
   the phase should report them.

**Flags only.** No `moralDelta` on any of the four. `alignmentDelta` is
permitted only where a branch names a worldview rather than a virtue —
dilemma 4's "note the spot, mean to tell someone in the city" is a `scope`
move; "leave the hook where it lies" is not. This follows `fv-14`'s own
precedent, where only the joke-deflection branch carries one.

**Prose ships in the ratified register from the first draft.** Terse,
archaic-flavored, cold and old; one clause per line, present tense; no
exclamation marks, no ALL-CAPS inside prose, no explanatory parentheticals,
no thee/thou. The surrounding coastal trees violate all of this — they
predate Phase 42 and carry `"Bless you, kind soul"` and inline `[Moral meter
+5]` readouts. **Do not match them.** Phase 44g rewrites those; anything
authored here in the old register is work 44g has to redo.

## Decisions made upfront — DO NOT ASK

- **Displace encounter nodes; do not grow the grid and do not merge two
  kinds onto one node.** Growing re-opens the strand class the last audit
  closed structurally. Merging needs an engine change to sequence two
  payloads on one node — a real feature, and not this content pass.
- **Flags only, no `moralDelta`.** The meter is not missing from the first
  arc; it is concentrated in Old Marrow and the Coastal Beggar, which is
  where a legible verdict belongs. These scenes are the opposite register on
  purpose: nobody is watching, and the game does not tell the boy what he
  just was. An unwitnessed choice that moves a visible meter *is* a verdict,
  and it would make The Stranger's Net incoherent — "take a few fish and say
  nothing" only lands if nothing announces it as theft.
- **The Frightened Friend and The Crowning Witnessed go on
  northern-forest**, as designed, even though no player can reach that map
  until inter-map travel exists. Splitting the spec across two phases to
  chase reachability would leave S-01 half-shipped indefinitely; the four
  are one authored set with one voice.
- **Flag names ship exactly as S-01 spells them** (`boy-kept-the-hook`,
  `boy-helped-pell`, `boy-returned-the-net`, `boy-witnessed-the-crowning`,
  and siblings). 53e gates on these strings and the spec's own acceptance
  checklist requires the documented flags to match the code.
- **Leaf outcomes only.** Three replies at a root, each terminating. No
  second-level branching — `fv-14`'s shape is the proven one and these are
  small scenes, not conversations.

## Surface as `[needs-user-call]`

- If any dilemma's scene cannot be told in the ratified register without
  losing what makes it land, say which and why rather than quietly reverting
  to the old voice. The register is ratified but the scenes were written
  before it, and a genuine conflict is worth a ruling.

## Prove (DoD)

- One hermetic test per dilemma, mirroring
  `fv-14-father-worry.engine.test.ts`: the pool is registered on its node,
  all three flags are settable, each choice terminates, and no choice sets a
  `moralDelta`.
- The column constraint asserted, not assumed: each dilemma read by a 53e
  NPC resolves at a strictly lower column index than its reader. This is the
  guard against re-creating unreachable content by placement.
- `auditMapTraversal` still clean on both maps; the coverage walk re-run and
  the four dilemmas' route shares reported in the commit body.
- A register check on the new prose: no exclamation marks, no bracketed
  meter readouts, no banned V-1/V-2/V-3 vocabulary. The lexicon lint catches
  some of this; read the rest.
- S-01's acceptance checklist ticked, including "flags documented here match
  the flags actually set in code".
- `npm run verify --workspace axiomancer-mechanics`.

## Follow-ups

- 53e reads these flags. Until it lands, the four dilemmas have the same
  write-only shape as `fv-14` — better than nothing, but not yet the point.
- 44g rethemes the *existing* trees; the prose authored here should need no
  pass. If 44g finds it does, that is a signal the register brief in this
  phase was not followed, and worth recording.
