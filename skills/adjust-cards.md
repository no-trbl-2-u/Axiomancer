# Skill: adjust-cards

> **The card-pool steward.** One tick audits the live card library for
> structural health, then creates, updates, and/or retires cards to
> fix what it finds — no cap on how many, no cap on which action.
> Absorbs `/forge`'s former card-creation duty.
> Doctrine: `axiomancer-mechanics/CLAUDE.md` (THE BIG NUMBERS
> REWRITE, 2026-09-02) governs — there is no CQI, no rank-band
> grading, no win-rate curve any more. Judge cards by structural
> signals, not a retired objective function.

## 1. Purpose

The card pool drifts in two directions between passes: thin (a theme
short a rank, a FREE-line gap) and cluttered (a card nobody's deck
ever plays, two cards doing the same job at the same price). Neither
direction fixes itself. `/adjust-cards` is the standing steward for
`src/Cards/cards.library.ts` and its wiring: it runs the audit, picks
every finding worth acting on, and ships create/update/retire fixes
in the same tick.

## 2. Invocation

```
/adjust-cards                # audit, ship every finding
/adjust-cards create         # bias toward creation this tick
/adjust-cards update         # bias toward re-pricing/re-wording
/adjust-cards remove         # bias toward retirement
/loop /march                 # march routes here via the content-lifecycle gate
```

## 3. Procedure

### Step 0 — Sync + doctrine

```bash
git pull --ff-only
```

Read `axiomancer-mechanics/CLAUDE.md` (load-bearing doctrine — THE
BIG NUMBERS REWRITE repealed CQI/rank-bands/count-pin-as-gate/
status-engagement-floor; nothing older than 2026-09-02 governs
combat numbers), `axiomancer-mechanics/VISION.md`, and
`plan/bearings.md` (LOCKED MECHANICS: Conviction, Surge, Dice —
never removed or no-op'd, may be interacted with).
`docs/profane-canon.md` is HISTORICAL — its tonal brief (names,
register) survives as voice guidance; its counts, package shapes,
and structural rules are a period record, not law.

### Step 1 — Audit (structural signals, no runtime telemetry)

There is no player telemetry and no win-rate grading any more —
score every card against signals derivable from the codebase and
tests:

| Signal | Action it points to |
|---|---|
| Absent from every preset AND every draft pool (`combat.starter-deck-presets.ts`, `combat.deck-draft.ts`) | REMOVE candidate |
| Two cards with near-identical `specialMechanics` + cost + `philosophicalAspect` (a near-duplicate) | REMOVE the weaker-authored one, or UPDATE one to differentiate |
| A card whose `// pts:` comment no longer matches its actual verbs (doc-only since the 2026-09-02 repeal, but a lying comment misleads the next pass) | UPDATE |
| A card that fails the pricing sanity guard (`src/Cards/e2e/pricing.engine.test.ts` — `scoreCard` finite, non-negative for non-curse; a bug detector, not a rank-band law) or the card-face-honesty guard (printed number != applied number) | UPDATE (bug, not a design call) |
| A card's numbers sit far below the CLAUDE.md §5 scale ladder for its rank (pre-rewrite leftovers — small numbers are a drift, not a style) | UPDATE |
| A `philosophicalAspect` third light on cards relative to the other two (the aspect-thirds preset law — one of the three surviving constraints — needs raw material to stay satisfiable) | CREATE |
| A theme with no FREE-line-viable card (the FREE-line law survives; the old package-shape counts do not) | CREATE |
| No card carries a keyword the atlas lists as active (feeds `/adjust-keywords`, don't duplicate — file it, let that skill own the fix) | note only, no action here |

Read the live libraries directly (`cards.library.ts`,
`cards.sandbox-sets.ts`) or query `axio-query` MCP
(`axio_cards`/`axio_effects`) when available — never grade from
memory.

### Step 1b — Widened audit scope (via `/oversight` 2026-09-15)

If Step 1's structural-signal table returns nothing actionable (a
zero-diff pass), don't stop there — passes 9-10 across all five content
stewards logged consecutive zero-diff results, a plateau worth checking
before trusting it as steady-state health. Run one additional deeper
check before concluding zero-diff: a KB cross-reference pass comparing
the current card pool against corpus prior-art gaps (`kb_search`/
`kb_cards`/`kb_find_games` for mechanics or themes well-represented in
comparable games but absent or thin here — not just Step 1's structural
completeness signals). File anything this turns up as a normal finding
(Step 1's table categories still apply) and act on it in the same tick.
If the deeper check also turns up nothing, the zero-diff result stands
and gets logged as usual — this is a floor-raise on the audit, not a
mandate to invent findings.

### Step 2 — KB research, then design

**A KB research run is a GATE for every CREATE and UPDATE — nothing
gets written before it.** Query the `kb-query` MCP server on the
mechanic/theme/shape in play (`kb_cards` for comparable cards,
`kb_keyword` for mechanic semantics, `kb_search` /`kb_find_games`
for reception evidence) and carry the receipts
(`kb:<game-slug>/<doc> (src-NNN)`) into the design. Delegating the
research to `card-expert` counts — its consult answers already cite
kb receipts — but a CREATE/UPDATE authored with neither a receipt
nor a documented corpus miss doesn't ship. The MCP tools are the only
route to the corpus — there is no local snapshot to fall back to — so
if they are absent or failing, the tick may proceed with
`(memory)`-labeled design only by saying plainly in the commit body
that the corpus was unreachable and the grounding is UNGROUNDED. REMOVE needs no KB run — Step 1's structural
signals are sufficient grounds to retire.

Then spawn `card-expert` (consult mode) for every finding that needs
a design call: propose the new card, the reprice, or confirm the
retirement candidate is genuinely dead weight. `card-expert`'s
internal doctrine notes (CQI, rank bands, the empirical win-rate
court) predate THE BIG NUMBERS REWRITE — when its analysis leans on
those, this skill's doctrine order wins:
`axiomancer-mechanics/CLAUDE.md` > `card-expert`'s legacy framing.
Ask it explicitly to size numbers against the CLAUDE.md §5 scale
ladder (rank bands and the pinned `VERB_POINTS` constants were
repealed 2026-09-02) and judge "dead" via reachability (never
draftable/playable) and duplication, not CQI or a win-rate delta.

### Step 3 — Ship each finding

**Ship small, file large (THE GROWTH FLOOR ¶2, `plan/bearings.md`,
2026-09-17).** Before filing any CREATE-shaped finding as a candidate,
size it. **Small** — at most **3** new items on this steward's own
surface, reusing existing keywords, effects, engine hooks and art, and
touching only that surface and its registries — is BUILT IN THIS TICK
through the CREATE path below, with no candidate row. **Large** — new
engine wiring, a new keyword, new art, a cross-surface change, or more
than 3 items — is filed as a candidate in `plan/PHASE_CANDIDATES.md`.
When the call is genuinely ambiguous, **ship the small reading**: the
failure this rule corrects is over-filing, so the tie goes to shipping
and the residue records the call. Re-confirming a finding this steward
already filed is not an output — ship it under this rule, or say in the
commit body why it is still large.

**CREATE** — hand off to `card-expert` (implement mode) for the full
card-authoring wiring checklist (engine + pricing comment + display
+ `addedIn` stamp; no count-pin step — pins were repealed
2026-09-02), or author directly for a
simple literal-only addition. Every new card satisfies the FREE
line law and speaks its theme's voice (the self-contained-theme
package *law* is repealed; theme vocabulary coherence survives as
guidance, per the profane-canon tonal brief).

**UPDATE** — edit the card in place through the same wiring surfaces
its change touches (pricing comment, display text, any keyword payload
it carries). A reprice is not a retire-and-recreate — same `id`,
same `addedIn`.

**REMOVE (retire, never delete silently)** — cards are never dropped
from history; they're retired per the existing ban-list convention
(`card-expert` owns this: retired ids die, never renamed or
resurrected). Steps:
1. Remove the card's entry from `cards.library.ts` and every preset
   / draft pool that referenced it.
2. Add its id to the retired/ban list the deprecated-effects e2e
   enforces (`src/Effects/e2e/deprecated-effects.engine.test.ts` and
   any card-id equivalent) so it can never silently resurrect.
3. Note it in the ledger log (§4) with the reason — retirement is a
   design call worth a paper trail, same bar as a `[loop-call]`.
   (Count pins were repealed 2026-09-02; there is no pin to
   decrement.)

### Step 4 — Gates, ledger, commit

```bash
npm run verify --workspace axiomancer-mechanics
npm run verify --workspace axiomancer-mobile        # Cards/** is cross-package
npm run type-check --workspace axiomancer-card-editor
```

Update `plan/CONTENT_LEDGER.md`: bump the `cards` row (last pass /
commit / pass count) and append a log entry (§ format in that file).

```bash
git add <explicit files> plan/CONTENT_LEDGER.md
git commit -m "$(cat <<'EOF'
content: adjust-cards pass <N> — <one-line: created X, updated Y, retired Z>

- <finding> -> <action>, per <signal from §1>.
- Verify: green (mechanics + mobile + card-editor).
EOF
)"
git push origin main
npm run deploy:check
```

### Step 5 — File the residue

Follow-on ideas that need a bigger call (a whole new theme, an engine
constant change) go to `plan/PHASE_CANDIDATES.md` or `plan/AUDIT.md`
as `[loop-call]`, same as `/forge`.

## 4. Hard rules

1. Nexus standing rules 1–7 (`AGENTS.md`) apply in full.
2. **No CQI, no rank-band grading, no win-rate curve.** THE BIG
   NUMBERS REWRITE repealed the objective function; judge cards on
   reachability, duplication, and sanity-guard honesty.
3. **LOCKED MECHANICS stand** (Conviction, Surge, Dice) — cards may
   interact with them, never remove or no-op them.
4. **Retire, never delete silently.** The ban-list convention is the
   only removal path; a card id is never renamed or resurrected.
5. **Count pins are repealed (2026-09-02)** — don't reintroduce pin
   bookkeeping, and don't let a stale checklist (an old phase
   brief's, a pre-rewrite report's) talk you into bumping one.
6. **One skill, whatever the audit finds** — a single tick may
   create, update, and retire cards together; don't artificially
   cap it, but don't pad the audit to hit a quota either.
7. **No CREATE or UPDATE without the KB research run** (§3 Step 2)
   — receipts cited, or the fallback miss documented in the commit
   body. REMOVE is exempt.

## 5. Failure modes

1. **Verify/deploy gate fails ≥3 times on one root cause** — stop
   cleanly, file the blocker to `plan/AUDIT.md`.
2. **A finding needs an engine constant change, not a card change**
   (e.g. base threat damage) — that's mechanics-expert/manual-tuning
   territory; file it, don't fake it with card numbers.
3. **`card-expert`'s doctrine framing conflicts with current
   CLAUDE.md** — CLAUDE.md wins; note the conflict in the commit body
   so the next pass (or a human) can update `card-expert`'s brief.
4. **Audit finds nothing actionable** — don't manufacture a change;
   commit only the ledger bump (still counts as the pass) and return.

## 6. Quick reference

```bash
# Reads
axiomancer-mechanics/CLAUDE.md               # load-bearing doctrine
axiomancer-mechanics/src/Cards/cards.library.ts
axiomancer-mechanics/src/Cards/cards.pricing.ts
axiomancer-mechanics/src/Cards/cards.sandbox-sets.ts
axiomancer-mechanics/src/Combat/combat.starter-deck-presets.ts
axiomancer-mechanics/docs/profane-canon.md   # HISTORICAL — voice only
plan/CONTENT_LEDGER.md

# Sub-agent
Agent({ subagent_type: "card-expert", prompt: "consult|implement: ..." })

# Gates
npm run verify --workspace axiomancer-mechanics
npm run verify --workspace axiomancer-mobile
npm run type-check --workspace axiomancer-card-editor
npm run deploy:check
```
