# Phase 74 — N-1: fold the ratified North Star into spec 34

> `plan/north-star-mork-borg.md` was ratified as-is by T on 2026-08-22.
> Brief generated 2026-08-27 by `/ship-a-phase` §9.

## Outcome

The ratified doctrine stops living only in a `plan/` file. Its §2
delivery register becomes spec 34 **§2.5**, the R-C/R-F reconciliation
becomes a spec ruling rather than a header note, and `plan/bearings.md`
cites the ratified doctrine instead of leaving a loop tick to infer it.

## Why

The 2026-08-22 audit called this **"the single largest content-authority
gap"**: a loop tick reads `bearings.md` — the file it is *told* to read —
and sees only the narrow 2026-08-08 postures. The widening T ratified is
invisible to it. Doctrine that only exists somewhere the loop does not
look is doctrine the loop does not follow.

Spec 34 is the durable home: `plan/` is a working surface (and is zoned
out of the lexicon lint as a dated record), while `specs/` is where the
source-of-truth hierarchy says settled rules live.

## Surface

| File | Change |
|---|---|
| `axiomancer-mechanics/specs/34-dark-fantasy-campaign.md` | new §2.5 (MB-1…MB-8) + the R-C/R-F reconciliation as a ruling; §12 index row |
| `plan/bearings.md` | Voice entry cites §2.5; a ratified-North-Star entry |
| `plan/north-star-mork-borg.md` | header points at the spec as the live home |

## Decisions made upfront — DO NOT ASK

- **§2.5, not a rewrite of §2.** The North Star's own §2 says spec 34's
  register, V-bans, six lexicons and the whole Naming Law are
  **unchanged**, and that its rules *extend* §2.3 from card text to all
  player-facing prose. A new subsection preserves that relationship;
  editing §2.1-§2.4 would obscure which ruling came from where and when.
- **The MB rules are copied verbatim, lintable/judgement markers and
  all.** They are ratified text. Paraphrasing settled doctrine into a
  spec is how a rule quietly changes meaning between two documents.
- **The R-C/R-F reconciliation becomes a numbered ruling.** Today it
  lives in a `plan/` file's header blockquote — the least durable place
  in the repo for the sentence that decides whether the loop may touch
  art at all. It says: R-F is later and outranks; art IS in scope; the
  Phase V Woodcut Codex masterplan survives as the current art bearings,
  evolvable by the loop rather than barring it from the visual layer.
- **`north-star-mork-borg.md` is kept, not deleted.** It is the record
  of a session and its rulings, with the before/after voice guide and
  the scout receipts that the spec has no business absorbing. Its header
  gains a pointer saying the register now lives in spec 34 §2.5.
- **MB-1's lintable half is NOT wired here.** Sentence length and the
  semicolon ban are mechanically checkable and belong in Phase 70's
  prose lint, but adding a rule that flags existing prose is Phase 75's
  re-voice sweep — the phase built to fix what it finds. Wiring the lint
  first would either fail the build or ship an exemption list longer
  than the rule. Recorded as this phase's hand-off, not skipped.

## Tests

Documentation. Verification by inspection plus:

| Case | Assert |
|---|---|
| spec 34 | §2.5 present, all eight MB rules, index row added |
| bearings | Voice entry cites the spec section |
| lexicon lint | clean (bearings is a LIVE surface) |
| `npm run verify` | green |

## DoD

- [ ] §2.5 in spec 34 with MB-1…MB-8 verbatim.
- [ ] R-C/R-F reconciliation as a numbered spec ruling.
- [ ] Bearings cites it; the North Star file points at it.
- [ ] Phase 75's hand-off recorded.

## Follow-ups (out of scope)

- **Phase 75 (N-3)** — the re-voice sweep, which is where MB-1's
  lintable half gets wired and the prose it flags gets fixed.
- The North Star's §6 open questions for T, still open.
