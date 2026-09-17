# Skill: adjust-npcs

> **The NPC/dialogue steward.** Audits `src/NPCs/**` — NPC entities,
> dialogue trees, and their staging into maps — for structural
> health, then creates, updates, or retires NPCs and dialogue
> content. Absorbs `/forge`'s former Dialogue/NPCs surface entirely.

## 1. Purpose

An NPC is thin content until it's staged: reachable in a map, with a
dialogue tree that goes somewhere and reacts to what the player's
done. `/forge` used to track this as a spatial side-effect of map
work; `/adjust-npcs` owns it directly — the backlog of authored-but-
unstaged NPCs, dead-end dialogue nodes, and trees that never got the
alignment/quest gating spec 42/spec 10 call for.

## 2. Invocation

```
/adjust-npcs
/adjust-npcs create | update | remove   # optional bias
/loop /march                            # routed via content-lifecycle gate
```

## 3. Procedure

### Step 0 — Sync + doctrine

```bash
git pull --ff-only
```

Read `axiomancer-mechanics/CLAUDE.md`, `plan/bearings.md`, any settled
`axiomancer-mechanics/specs/story/` and `specs/characters/` specs for
the NPCs in scope (character-spec/story-spec skills own the
*personhood* design session; this skill ships the *content* once a
spec exists, or authors minor NPCs directly when no spec is needed —
see Step 2).

### Step 1 — Audit (structural signals)

| Signal | Action |
|---|---|
| An authored NPC not staged into any map node/event (`unstagedNpcs` backlog) | UPDATE (stage it) — treat as the highest-priority finding; authored-but-invisible content is worse than absent |
| A map with fewer than 2 staged NPCs | CREATE |
| A `DialogueTree` node with no `choices` that isn't an intentional terminator (a dead-end that reads as a bug, not an ending) | UPDATE |
| A `DialogueChoice.effect` referencing a retired card (`teachCard`) or removed quest (`startQuest`/`progressQuest`) | UPDATE |
| An NPC using the legacy flat `DialogueMap` where a `DialogueTree` would let spec 42/spec 10 alignment or quest gating apply | UPDATE (migrate to tree) — only when the NPC's spec calls for branching; a genuinely flavor-only NPC keeps the flat map |
| An NPC with a spec in `specs/characters/` or `specs/story/` that was never implemented in `src/NPCs/**` | CREATE |
| An NPC absent from every map (orphaned entity, no spec references it either) | REMOVE candidate |

### Step 1b — Widened audit scope (via `/oversight` 2026-09-15)

If Step 1's structural-signal table returns nothing actionable (a
zero-diff pass), don't stop there — passes 9-10 across all five content
stewards logged consecutive zero-diff results, a plateau worth checking
before trusting it as steady-state health. Run one additional deeper
check before concluding zero-diff: a KB cross-reference pass comparing
current NPC/dialogue coverage against corpus prior-art gaps (`kb_search`/
`kb_find_games` for staging/dialogue patterns well-represented in
comparable games but absent or thin here — not just Step 1's structural
completeness signals). File anything this turns up as a normal finding
(Step 1's table categories still apply, and hard rule 3's carve-out for
autonomously inventing a named character's personhood still governs —
file a gap, don't improvise a voice). If the deeper check also turns up
nothing, the zero-diff result stands and gets logged as usual — this is
a floor-raise on the audit, not a mandate to invent findings.

### Step 2 — KB research, then design

**A KB research run is a GATE for every CREATE and UPDATE — nothing
gets written before it.** Query the `kb-query` MCP server first:
`kb_search` / `kb_find_games` against the board-game reception
corpus for NPC/dialogue prior art (what players say about flavor
NPCs vs reactive ones, quest-gating complaints, dead-end dialogue
findings). The corpus is card- and board-game-centric, so dialogue
coverage may genuinely miss — a miss is acceptable: file a wishlist
issue (`gh issue create --repo no-trbl-2-u/game-knowledge-base --label
wishlist --title "<topic>" --body "<why>"`) and state the miss in the
commit body rather than skipping the run. If the MCP tools are absent
or failing there is no local snapshot to fall back to: say the corpus
was unreachable and label the grounding UNGROUNDED. REMOVE needs no
KB run — an
orphaned NPC is retirable on Step 1's structural evidence alone.
Pass whatever receipts the run produced to `content-curator` with
the authoring brief.

Then: narrative authoring is `content-curator`'s job, not the main
agent's
(the standing rule `/iterate` already follows: "content gap → spawn
`content-curator`, don't write prose from main agent"). Spawn it for
every CREATE/UPDATE that involves writing dialogue text. When a
finding implies a full new named character (not just a staging fix or
a minor NPC), that's `character-spec`/`story-spec` territory — those
are interactive Socratic sessions with the user, not something this
autonomous tick can complete alone; file it to `plan/AUDIT.md` as
`[needs-user-call]` rather than improvising a personhood.

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

**CREATE** — new `NPC` entry with a `dialogueTree` (preferred over
the legacy flat map for new authoring) + staged at a real map
node/event + wired triggers (`teachCard`/`startQuest`/quest-objective
effects only reference live content) + `GAME_STATE_VERSION` migration
if the tree introduces a new persisted flag/id shape.

**UPDATE** — stage an unstaged NPC, patch a dead-end node, repoint a
stale `effect` reference, or migrate a flat map to a tree. Same NPC
identity (`name` key); no re-creation.

**REMOVE (retire, never delete silently)** — archive discipline, same
as enemies/equipment:
1. Remove the NPC from every map node/event that references it.
2. Move its entry to a clearly marked retired section rather than
   deleting the record outright.
3. Log the retirement with reasoning (§4 ledger).

### Step 4 — Gates, ledger, commit

```bash
npm run verify --workspace axiomancer-mechanics
npm run verify --workspace axiomancer-mobile   # NPCs/** drives mobile's dialogue route
```

Update `plan/CONTENT_LEDGER.md`: bump the `npcs` row, append a log
entry.

```bash
git add <explicit files> plan/CONTENT_LEDGER.md
git commit -m "$(cat <<'EOF'
content: adjust-npcs pass <N> — <one-line: created X, updated Y, retired Z>

- <finding> -> <action>, per <signal from §1>.
- Verify: green (mechanics + mobile).
EOF
)"
git push origin main
npm run deploy:check
```

### Step 5 — File the residue

A finding needing a full personhood design session →
`plan/AUDIT.md` as `[needs-user-call]` (route to `character-spec` /
`story-spec` next time the user is present). Other follow-ons →
`plan/PHASE_CANDIDATES.md`.

## 4. Hard rules

1. Nexus standing rules 1–7 apply in full.
2. **Don't write dialogue prose from the main agent** — delegate to
   `content-curator`.
3. **Don't invent a named character's personhood autonomously** —
   that's `character-spec`/`story-spec`'s interactive job; file it,
   don't improvise it.
4. **Ship content, not stubs.** An NPC staged nowhere doesn't count
   as shipped — the unstaged backlog is the #1 audit priority for a
   reason.
5. **Never delete shipped content silently** — archive + update
   routing.
6. **New persisted dialogue state rides `GAME_STATE_VERSION`** with a
   migration + pinned test.
7. **No CREATE or UPDATE without the KB research run** (§3 Step 2)
   — receipts cited, or the wish-filed miss documented in the
   commit body. REMOVE is exempt.

## 5. Failure modes

1. **Verify/deploy gate fails ≥3 times on one root cause** — stop,
   file to `plan/AUDIT.md`.
2. **Finding needs a full character-spec session** — file as
   `[needs-user-call]`, don't decide it solo.
3. **Audit finds nothing actionable** — commit only the ledger bump.

## 6. Quick reference

```bash
# Reads
axiomancer-mechanics/src/NPCs/types.ts
axiomancer-mechanics/src/NPCs/dialogue.ts
axiomancer-mechanics/specs/story/
axiomancer-mechanics/specs/characters/
plan/CONTENT_LEDGER.md

# Sub-agent
Agent({ subagent_type: "content-curator", prompt: "..." })

# Gates
npm run verify --workspace axiomancer-mechanics
npm run verify --workspace axiomancer-mobile
npm run deploy:check
```
