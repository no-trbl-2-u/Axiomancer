# Skill: adjust-enemies

> **The enemy roster steward.** Audits `enemy.library.ts` /
> `EnemiesByMap` / `ENEMY_REGISTRY` for roster health, then creates,
> updates, or retires enemies. Absorbs `/forge`'s former Enemies
> surface entirely.

## 1. Purpose

Two failure shapes indict a roster: **thin** (a map with too small a
pool, so runs repeat the same three fights) and **stale** (an enemy
with a deck or loot table that no longer obeys current combat law, or
one that's fallen out of every map's pool and just sits dead in the
library). `/adjust-enemies` runs the roster audit and ships fixes for
whichever shape it finds — in the same tick if both are present.

## 2. Invocation

```
/adjust-enemies
/adjust-enemies create | update | remove   # optional bias
/loop /march                               # routed via content-lifecycle gate
```

## 3. Procedure

### Step 0 — Sync + doctrine

```bash
git pull --ff-only
```

Read `axiomancer-mechanics/CLAUDE.md` (THE BIG NUMBERS REWRITE — VITAE
and damage bands per its §5 ladder; no win-rate grading; the old enemy
stat and art laws are repealed), `plan/bearings.md`, `spec.md` /
`axiomancer-mechanics/specs/world/` for any settled enemy-design
decisions.

### Step 1 — Audit (structural signals)

| Signal | Action |
|---|---|
| A map's `EnemiesByMap` pool below the roster-size floor, or >70% pool overlap with a sibling map | CREATE |
| An enemy absent from every `EnemiesByMap` pool (orphaned in the library) | REMOVE candidate |
| An enemy's deck violates current deck laws (e.g. references a retired card-side mechanic, or a keyword that `/adjust-keywords` retired) | UPDATE |
| An enemy's `portraitAsset` collides with another enemy's, or is a placeholder with a licensed/generated replacement now available (the 1:1 art *law* was repealed 2026-09-02, but don't orphan existing bindings, and unique art remains the quality bar) | UPDATE |
| An enemy's VITAE / damage numbers fall outside the current CLAUDE.md §5 band for its intended stage (leftover from a pre-2026-09-02 pass) | UPDATE |
| Aftermath prose missing, or in a voice that violates spec 34 §2.5 (no thee/thou/thy/thine/ye; terse, cold, priced) | UPDATE |
| Loot table (`loot.ts`) referencing a retired item/card | UPDATE |

Read `enemy.library.ts`, `EnemiesByMap`, `loot.ts`, `enemy-keywords.ts`
directly, or query `axio-query` when available. Consult `kb-query`
(Dawncaster corpus + board-game reception) for roster-shape prior art
(repeat-rate tolerances, "trash mob" complaints) when scoring
thinness.

### Step 1b — Widened audit scope (via `/oversight` 2026-09-15)

If Step 1's structural-signal table returns nothing actionable (a
zero-diff pass), don't stop there — passes 9-10 across all five content
stewards logged consecutive zero-diff results, a plateau worth checking
before trusting it as steady-state health. Run one additional deeper
check before concluding zero-diff: a KB cross-reference pass comparing
the current enemy roster against corpus prior-art gaps (`kb_search`/
`kb_find_games` for enemy archetypes/patterns well-represented in
comparable games but absent or thin here — not just Step 1's structural
completeness signals). File anything this turns up as a normal finding
(Step 1's table categories still apply) and act on it in the same tick.
If the deeper check also turns up nothing, the zero-diff result stands
and gets logged as usual — this is a floor-raise on the audit, not a
mandate to invent findings.

### Step 2 — KB research, then design

**A KB research run is a GATE for every CREATE and UPDATE — nothing
gets written before it.** Query the `kb-query` MCP server first:
`kb_search` / `kb_find_games` against the board-game reception
corpus for roster-shape prior art (repeat-rate tolerances, trash-mob
and same-three-fights complaints), `kb_cards` / `kb_keyword` for any
card-side mechanic the enemy's deck carries. Carry the receipts
(`kb:<game-slug>/<doc> (src-NNN)`) into the design. The MCP tools are
the only route to the corpus — there is no local snapshot to fall back
to — so if they are absent or failing, the tick may proceed with
`(memory)`-labeled design only by saying plainly in the commit body
that the corpus was unreachable and the grounding is UNGROUNDED. REMOVE needs no KB run — an orphaned enemy is
retirable on Step 1's structural evidence alone.

Then design directly (no dedicated enemy sub-agent exists) — same
process `/forge` used: house voice per spec 34 §2.5. For any deck
the new/updated enemy carries, run it past `card-expert` (consult
mode) if it leans on card-side keywords, to confirm the wiring is
honest.

### Step 3 — Ship

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

**CREATE** (~10 coupled edits, per the former `/forge` checklist):
`enemy.library.ts` entry + `ENEMY_REGISTRY` slug + `EnemiesByMap` pool
key + a deck where every card id resolves + aftermath prose + mobile
art key with a `portraitAsset` (unique preferred — the 1:1 law is
repealed but shared art is a thinness smell; source from the licensed
trove or the generation pipeline, provenance recorded). Count pins
were repealed 2026-09-02 — no pin bump.

**UPDATE** — edit the enemy in place: deck contents, VITAE/damage
numbers, portrait, aftermath prose, loot table. Same `id`/slug; no
re-creation.

**REMOVE (retire, never delete silently)** — enemies don't have a
ban-list convention like cards/keywords; follow `/iterate`'s standing
rule instead — **archive, don't silently delete**:
1. Remove the enemy from every `EnemiesByMap` pool it's in.
2. Move its `enemy.library.ts` entry to a clearly marked retired
   section (or `docs/retired-content.md` if one exists — check
   before inventing a new convention) rather than deleting the
   record outright, so its slug/history stays inspectable.
3. Log the retirement with reasoning (§4 ledger). (Count pins were
   repealed 2026-09-02; there is no pin to decrement.)

### Step 4 — Gates, ledger, commit

```bash
npm run verify --workspace axiomancer-mechanics
npm run verify --workspace axiomancer-mobile   # Enemy/** renders portraitAsset + EnemiesByMap
```

Update `plan/CONTENT_LEDGER.md`: bump the `enemies` row, append a log
entry.

Rotate the log when it grows: it keeps at most 3 entries per
category. If your new entry makes 4 for this category, move the older
ones (every entry but the new one) verbatim to the end of
`plan/archive/CONTENT_LEDGER_<YYYY>.md` (rotation year; create it with
a one-line header if missing) and `git add` it in the same commit.
Archive, never delete or edit an entry.

```bash
git add <explicit files> plan/CONTENT_LEDGER.md
git commit -m "$(cat <<'EOF'
content: adjust-enemies pass <N> — <one-line: created X, updated Y, retired Z>

- <finding> -> <action>, per <signal from §1>.
- Verify: green (mechanics + mobile).
EOF
)"
git push origin main
npm run deploy:check
```

### Step 5 — File the residue

Roster ideas needing a new continent/map to land in → `plan/PHASE_CANDIDATES.md`.
Owner-flavored calls → `plan/AUDIT.md` as `[loop-call]`.

## 4. Hard rules

1. Nexus standing rules 1–7 apply in full.
2. **Ship content, not stubs.** An enemy in no pool doesn't count as
   shipped, whichever direction the action runs.
3. **Provenance is truthful or the art doesn't ship.**
4. **Never delete shipped content silently** — archive + update
   routing (iterate.md's standing rule, inherited here).
5. **Count pins are repealed (2026-09-02)** — don't reintroduce pin
   bookkeeping from stale checklists.
6. **New persisted fields ride `GAME_STATE_VERSION`** with a
   migration + pinned test, same as any other content surface.
7. **No CREATE or UPDATE without the KB research run** (§3 Step 2)
   — receipts cited, or the fallback miss documented in the commit
   body. REMOVE is exempt.

## 5. Failure modes

1. **Verify/deploy gate fails ≥3 times on one root cause** — stop,
   file to `plan/AUDIT.md`.
2. **A finding needs an engine constant change** (threat damage,
   global VITAE curve) — file it, don't fake it with one enemy's
   numbers.
3. **Art generation key/licensed asset missing** — ship the largest
   real subset, file the gap (same as `/forge`'s failure mode 2).
4. **Audit finds nothing actionable** — commit only the ledger bump.

## 6. Quick reference

```bash
# Reads
axiomancer-mechanics/CLAUDE.md
axiomancer-mechanics/src/Enemy/enemy.library.ts
axiomancer-mechanics/src/Enemy/loot.ts
axiomancer-mechanics/src/Enemy/enemy-keywords.ts
plan/CONTENT_LEDGER.md

# Gates
npm run verify --workspace axiomancer-mechanics
npm run verify --workspace axiomancer-mobile
npm run deploy:check
```
