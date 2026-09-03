# Skill: adjust-keywords

> **The keyword registry steward.** Audits the keyword registry
> (`docs/keyword-atlas.md` + the `CardSpecialMechanic`/status-effect
> surfaces that carry it) and creates, updates, or retires keywords.
> Sibling to `/adjust-cards`, split out because a keyword touches
> engine + mobile + card-editor surfaces a plain card literal never
> does. Owned in practice by `card-expert`, same as the atlas itself.

## 1. Purpose

`docs/keyword-atlas.md` is GROWABLE (THE PIPELINE LIBERATION,
2026-08-22) but growth without upkeep just accumulates: keywords with
too few carriers to read as real, near-synonyms that should have
drilled an existing keyword instead of minting a new one, atlas rows
missing receipts. `/adjust-keywords` is the standing pass that keeps
the registry a real vocabulary instead of a junk drawer.

## 2. Invocation

```
/adjust-keywords
/adjust-keywords create | update | remove   # optional bias
/loop /march                                # routed via content-lifecycle gate
```

## 3. Procedure

### Step 0 — Sync + doctrine

```bash
git pull --ff-only
```

Read `axiomancer-mechanics/CLAUDE.md` (THE BIG NUMBERS REWRITE — no
CQI/status-engagement-floor grading any more), `docs/keyword-atlas.md`,
and `docs/retheme-map.json` (NL-8 collision law).

### Step 1 — Audit (structural signals)

| Signal | Action |
|---|---|
| Keyword with fewer than 3 carrying cards/enemy abilities | REMOVE candidate (retirement, per atlas doctrine) |
| Two keywords whose semantics + `functions` tags substantially overlap (should have been one drilled keyword) | REMOVE the newer/weaker one, or UPDATE its description to differentiate the niche it actually fills |
| Atlas row missing a `kb:` receipt for its Dawncaster (or nearest) analogue | UPDATE (research + backfill the row) |
| A `CardSpecialMechanic`/`CardRider` kind exists in `src/Cards/types.ts` with no atlas row at all | UPDATE (row is missing, not the keyword) |
| A mechanic idea from `kb-query`'s functions-column sweep has no registry analogue and a real design gap exists (e.g. Energy Management underrepresented) | CREATE candidate |
| A keyword face word (`combat.cards.ts` `mechanicText`, mobile `KEYWORD_GLOSS`) prints but has no popup/glyph wired (a silent `default:` arm) | UPDATE — this is a bug, ship it regardless of audit priority |

Use `kb-query` (`kb_keyword`, `kb_search`) for prior art and
`axio-query` (`axio_keywords`) for the engine's current facts when
available; fall back to grepping `kb/` and the libraries per
`card-expert`'s documented fallback path.

### Step 2 — KB research, then design

**A KB research run is a GATE for every CREATE and UPDATE — nothing
gets written before it.** Query the `kb-query` MCP server first:
`kb_keyword` for the analogue's semantics, `kb_search` for
reception evidence, the `functions`-column sweep for the design-job
landscape. The atlas's own no-receipt-no-row law makes this
non-negotiable for keywords anyway — a new or updated row without a
`kb:` receipt is invalid on its face. Delegating to `card-expert`
counts (its answers cite kb receipts). If the MCP tools are absent
or failing, fall back per its documented path (`node
scripts/kb-sync.mjs`, then the sibling `../game-knowledge-base/`
checkout); a genuine corpus miss files a wish (`node
scripts/kb-sync.mjs wish "..."`) and is stated in the commit body.
REMOVE needs no KB run — carrier count and duplication from Step 1
are sufficient grounds to retire.

Then spawn `card-expert` (consult mode) for every finding — it owns
the atlas and the Dawncaster corpus fluency this needs. Ask it to
judge "dead" via carrier count and duplication (not
CQI/status-engagement, which THE BIG NUMBERS REWRITE repealed) and
to check the retheme-map collision law before proposing a new name.

### Step 3 — Ship

**CREATE** — hand off to `card-expert` (implement mode) for the FULL
12-step keyword wiring checklist it owns (status/verb piece, runtime
switch case, display case, pricing, carrying cards, hermetic e2e,
public exports, deprecated-effects allow-list, mobile registry +
gloss + headline + glyph in all three hand-synced places, card-editor
`SPECIAL_MECHANIC_KINDS` + `wx.ts`, and the atlas + retheme-map rows).
No kind ships without a carrier — a half-wired kind is worse than no
kind (the `default:` arms make it silently inert).

**UPDATE** — atlas row edits, description/receipt backfills, or a
description narrowed to state the keyword's actual differentiated
niche. Re-verify no carrier print/glyph regressed.

**REMOVE (retire, never delete silently)** — keywords die via the
ban-list convention `card-expert` already enforces:
1. Remove/replace the mechanic from every carrying card (routes
   through `/adjust-cards` if the card itself also needs a content
   change beyond dropping the mechanic — file it there rather than
   improvising a card edit here).
2. Add the retired id to the ban list in
   `src/Effects/e2e/deprecated-effects.engine.test.ts` so it can
   never resurrect.
3. Remove the atlas row (or mark it retired, matching current atlas
   convention) and the mobile gloss/glyph entries.
4. Log the retirement with reasoning (§4 ledger).

### Step 4 — Gates, ledger, commit

```bash
npm run verify --workspace axiomancer-mechanics
npm run verify --workspace axiomancer-mobile
npm run type-check --workspace axiomancer-card-editor
npm test    # exercises content-drift.test.mjs — catches hand-synced
            # table drift across atlas / mobile gloss / card-editor
```

Update `plan/CONTENT_LEDGER.md`: bump the `keywords` row, append a
log entry.

```bash
git add <explicit files> plan/CONTENT_LEDGER.md
git commit -m "$(cat <<'EOF'
content: adjust-keywords pass <N> — <one-line: created X, updated Y, retired Z>

- <finding> -> <action>, per <signal from §1>.
- Verify: green (mechanics + mobile + card-editor + content-drift).
EOF
)"
git push origin main
npm run deploy:check
```

### Step 5 — File the residue

Design ideas needing owner ratification beyond the atlas's own
criteria → `plan/AUDIT.md` as `[loop-call]`.

## 4. Hard rules

1. Nexus standing rules 1–7 apply in full.
2. **Full wiring or nothing.** A new keyword without all 12
   `card-expert` checklist steps doesn't ship.
3. **Drill before minting.** A near-synonym is a REMOVE/consolidate
   finding, not two keywords doing one job.
4. **Retired ids never resurrect.** Ban list is permanent.
5. **The atlas is a cache with receipts** — no `kb:` receipt, no row.
6. **No CQI / status-engagement-floor grading** (THE BIG NUMBERS
   REWRITE, 2026-09-02) — judge by carrier count, duplication, and
   wiring honesty.
7. **No CREATE or UPDATE without the KB research run** (§3 Step 2)
   — receipts cited, or the fallback miss documented in the commit
   body. REMOVE is exempt.

## 5. Failure modes

1. **Verify/deploy gate fails ≥3 times on one root cause** — stop,
   file to `plan/AUDIT.md`.
2. **A keyword needs a new payload shape the effects engine can't
   express** — that's an engine-design call (mechanics-expert
   consult), not a keyword-content edit; file it.
3. **`kb/` unreachable** — fall back per `card-expert`'s documented
   path (sibling checkout, then memory-labeled); don't block the
   whole tick on it.
4. **Audit finds nothing actionable** — commit only the ledger bump.

## 6. Quick reference

```bash
# Reads
axiomancer-mechanics/docs/keyword-atlas.md
axiomancer-mechanics/docs/retheme-map.json
axiomancer-mechanics/src/Cards/types.ts        # CardSpecialMechanic union
axiomancer-mechanics/src/Combat/combat.cards.ts # mechanicText switch
axiomancer-mobile/state/combat/keywords.ts      # KEYWORD_GLOSS
plan/CONTENT_LEDGER.md

# Sub-agent
Agent({ subagent_type: "card-expert", prompt: "consult|implement: keyword ..." })

# Gates
npm run verify --workspace axiomancer-mechanics
npm run verify --workspace axiomancer-mobile
npm run type-check --workspace axiomancer-card-editor
npm test
npm run deploy:check
```
