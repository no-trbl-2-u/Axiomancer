# Phase 55 — Retire the dead "THE STRIKE IS DEAD" doctrine string from the engine-truth MCP

> Promoted directly via `/oversight` 2026-08-12 (audit-drain mode; `plan/AUDIT.md`
> row "axio-query overview still publishes the retired 'THE STRIKE IS DEAD'
> doctrine after Phase 41", score 72, the queue's stuck top row). Small,
> already-scoped: docs + one selector fix. This brief is deliberately
> condensed — no routes, no components, no cross-links; this is a data/tool
> phase, not a page-family phase. Sections from the standard format that
> don't apply to this shape are marked N/A rather than force-filled.

## Outcome

`mcp__axio-query__axio_overview` (and any human reading
`axiomancer-mechanics/src/Cards/cards.library.ts`'s header) sees the current,
true doctrine — direct damage is legal since the 2026-08-08 unshackling;
Conviction, Surge, and the dice system are the three systems that remain
locked — instead of the retired "THE STRIKE IS DEAD" ban. A regression test
pins both halves of that fact so a future edit can't silently reintroduce the
dead phrase or silently drop the doctrine line back to empty.

## Reality-check first (done during this brief's authoring)

Before touching anything, re-read the live server output and the header it's
sourced from — the AUDIT row was filed 2026-08-08 against commit `e24f9723`,
and the 2026-08-08 "unshackling" commit (`84ef85bd`, THE PROFANE CANON
rework) that the AUDIT blames landed the *same day*, reworded the header from
"THE STRIKE IS DEAD" to "THE STRIKE stays DEAD" in the process:

```
$ node -e "…extractDoctrine() against current cards.library.ts…"
[]
```

So the literal regression the AUDIT described (`axio_overview` printing the
sentence "THE STRIKE IS DEAD — no card touches HP...") is **not currently
reproducible** — `extractDoctrine()`'s selector regex (`/STRIKE IS DEAD|Rank
ladder/`) no longer matches anything in the reworked header, so
`axio_overview` currently prints **no doctrine line at all**. That's still a
defect (a silently empty, dead feature, and — worse — the header text itself
is now factually wrong: it says "no card deals raw HP damage," which
`axiomancer-mechanics/VISION.md` "Combat vision" §2026-08-08 explicitly
contradicts: T's unshackling "retired status dominance as the governing
combat objective and restored ordinary direct damage"). The fix scope is
unchanged from the AUDIT's "next" note — update the header to state current
truth, update the selector so the tool actually surfaces it, add a smoke
assertion — just landing on a header that already changed its wording once
since the row was filed.

## Content / data reads (N/A — no content loader touched)

This phase edits a docstring (`cards.library.ts`'s header comment) and a
regex literal (`axio-mcp-server.mjs`). No `Card` records, no runtime
behavior, no save-data shape changes.

## Components / handlers

- `axiomancer-mechanics/src/Cards/cards.library.ts` — replace the header's
  stale STRIKE-doctrine paragraph (lines ~23-25) with current truth: direct
  damage is legal (2026-08-08 unshackling); Conviction, Surge, and the dice
  system are the three locked systems.
- `scripts/axio-mcp-server.mjs::extractDoctrine()` — update the selector
  regex from `/STRIKE IS DEAD|Rank ladder/` to `/Direct damage is legal|Rank
  ladder/` so it picks up the new paragraph. (`Rank ladder` stays — it's a
  separate, currently-also-dormant selector clause for a paragraph the
  Profane Canon rework dropped; reviving it is out of this phase's scope,
  noted under Follow-ups.)
- `scripts/axio-mcp-server.mjs` tool description for `axio_overview` —
  the description string itself named the retired phrase
  (`"doctrine one-liners (STRIKE IS DEAD, rank vs tier)"`); reworded to
  `"doctrine one-liners (direct-damage legality, locked systems)"`.

## Output schema / contracts

`axio_overview`'s text response gains back a `# Doctrine — …` line (it was
silently absent). No JSON-RPC schema change — `axio_overview`'s
`inputSchema`/response shape are unchanged; only the text content differs.

## Cross-links — N/A

No mobile UI, no routes. The only "surface" is the MCP tool response itself,
consumed by agents (`card-expert`, `mechanics-expert`) via `axio_overview`.

## Empty / loading / error states — N/A

`extractDoctrine()` already degrades gracefully (returns `[]` → no `#
Doctrine` lines emitted) if the header is unparseable or the file is
missing; unchanged by this phase.

## Decisions made upfront — DO NOT ASK

1. **Don't restore the literal phrase "STRIKE IS DEAD" anywhere in the new
   header text**, even as a historical aside — the AUDIT's whole point is
   that the MCP shouldn't publish that phrase as if it's live truth,  and a
   test that greps for its absence is more robust than one that also has to
   parse "is this occurrence historical or a doctrine claim." The new
   paragraph says "the 2026-08-08 unshackling retired the earlier
   raw-HP-damage ban" instead of naming the retired doctrine string.
2. **Leave the `Rank ladder` selector clause alone.** It's been dormant
   since the Profane Canon rework dropped that header paragraph (confirmed
   via `git log -S"Rank ladder"`); reviving a rank-ladder doctrine line is a
   separate, unscoped piece of design work (what should it say now that
   ranks are Ash/Tooth/Splinter/Rib/Skull/Saint rather than
   Doxa/Lemma/Thesis/Theorem/Axiom/Aporia?) — filed as a Follow-up, not
   silently done here.
3. **Don't touch `axiomancer-mechanics/CLAUDE.md` or
   `axiomancer-mechanics/docs/profane-canon.md`**, both of which also still
   assert the retired STRIKE-IS-DEAD doctrine as current. Neither feeds the
   MCP tool (only `cards.library.ts`'s header does), so they're outside this
   AUDIT row's literal scope; filing both as new `plan/AUDIT.md` rows so the
   next doctrine-reconciliation pass (the same lineage as commit `9caf2a26`,
   which reconciled `AGENTS.md`/`VISION.md`/`skills/digest.md` but missed
   these two) picks them up deliberately rather than this phase scope-creeping
   into a second file-sweep.
4. **New test lives in `scripts/axio-mcp-server.test.mjs`**, the existing
   hermetic stdio smoke suite for this server (not part of `npm run verify`
   per that file's own header — the server lives outside every workspace).

## Mobile reflow — N/A

## Pages × tests matrix

| Surface | Test |
|---|---|
| `axio_overview` doctrine line | `scripts/axio-mcp-server.test.mjs` — new test: response does NOT match `/STRIKE IS DEAD/`, DOES match `/# Doctrine — Direct damage is legal/` |
| `extractDoctrine()` (indirectly, via the above) | same test, driven through the real stdio server |

## Verify gate

- `node --test scripts/axio-mcp-server.test.mjs` (this server's own smoke
  suite — not part of `npm run verify`, run directly).
- `npm run verify --workspace axiomancer-mechanics` (the only workspace
  touched — a docstring-only edit to `cards.library.ts`; full typecheck +
  lint + test + build gate run to confirm zero behavioral impact).

## Commit body template

```
docs(mechanics): retire dead STRIKE-IS-DEAD doctrine from engine-truth MCP — phase 55

- cards.library.ts header: replace the stale "no card deals raw HP damage"
  doctrine paragraph with current truth (direct damage legal since the
  2026-08-08 unshackling; Conviction/Surge/dice remain locked).
- axio-mcp-server.mjs: update extractDoctrine()'s selector regex so
  axio_overview surfaces the new paragraph (it was matching nothing after
  the Profane Canon rework reworded the header, so the tool was silently
  printing no doctrine line at all).
- axio_overview tool description: drop the STRIKE-IS-DEAD callout.
- axio-mcp-server.test.mjs: new smoke test pinning both halves — no
  retired phrase, doctrine line present and current.

Decisions:
- Left the dormant `Rank ladder` selector clause alone — reviving it needs
  a real rank-ladder doctrine paragraph, unscoped design work.
- Left axiomancer-mechanics/CLAUDE.md and docs/profane-canon.md (also
  stale) untouched — neither feeds the MCP tool; filed as AUDIT rows.

Closes #<phase-issue-number>
```

## DoD

- [ ] Header paragraph updated, no literal "STRIKE IS DEAD" phrase in
      `cards.library.ts`.
- [ ] `extractDoctrine()` selector updated; live `axio_overview` prints a
      `# Doctrine —` line again.
- [ ] New smoke test added and green.
- [ ] `npm run verify --workspace axiomancer-mechanics` green.
- [ ] Two follow-up AUDIT rows filed (CLAUDE.md, profane-canon.md staleness).

## Follow-ups (out of scope)

1. `axiomancer-mechanics/CLAUDE.md` "Load-bearing doctrine (set 2026-06)"
   section still asserts STRIKE-IS-DEAD / status-effect-primacy doctrine
   verbatim, missed by the 2026-08-13 `9caf2a26` reconciliation pass (that
   commit touched `AGENTS.md`, `VISION.md`, mobile `VISION.md`,
   `skills/digest.md` — not this file). File as a new AUDIT row.
2. `axiomancer-mechanics/docs/profane-canon.md` §"Unchanged, by hard
   constraint" still says "THE STRIKE stays DEAD: no card deals raw HP
   damage" — the design record for the very rework that (later the same
   day) got partially retired by the unshackling. File as a new AUDIT row.
3. The `Rank ladder` doctrine selector clause in `extractDoctrine()` has
   matched nothing since the Profane Canon rework (the old
   Doxa/Lemma/Thesis/Theorem/Axiom/Aporia rank-ladder paragraph didn't
   survive the rework's header rewrite). Decide whether a rank-ladder
   doctrine line is worth reviving for the new Ash/Tooth/Splinter/Rib/
   Skull/Saint ranks, or drop the dead selector clause.
