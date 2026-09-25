# Content pipelines audit — 2026-08-22

> Scope: every content pipeline — cards, keywords/effects, narrative,
> enemies/world/minigame content, art — audited against one question:
> **can the nexus loop take this content type from idea to shipped,
> unattended, and if not, what exactly blocks it?** Six parallel
> deep-audits (one per pipeline plus the enforcement/permission layer)
> feed this synthesis. Findings are filed as rows in `plan/AUDIT.md`
> (same date); this report carries the full detail.

## Verdict at a glance

| Pipeline | Can the loop ship it end-to-end today? | Binding blocker |
|---|---|---|
| Cards (new/revamp) | **No — despite full authority on paper** | The "transitional library, do not tune" ruling outlived the library it was written against; `/deck-tuning`'s own procedure is unexecutable as written (deleted swap-pool, empty sandbox sets, dead preset ids, no CQI reference); `addedIn === '2026-08-08'` pin fails any new card |
| Keywords / effects | **Partially** — new card-local effect species: yes; new keyword or mechanic *kind*: no | Keyword #31 needs owner ratification; new `specialMechanics` kinds are doctrine-level propose-only; seven wiring surfaces drift silently (four with no failing test) |
| Narrative / story | **Yes, via `/ship-a-phase` only** — proven (44g, 53a–53e) | No dedicated shipping skill; spec skills are attended-only; Phase 58 unshipped so 59 authored event descriptions never reach the player; `.ts` prose is un-linted |
| Enemies / world / minigame content | **Only through a hand-planned phase** | No skill holds new-content authority for enemies, maps, event kinds, or any minigame's content surface — every tuning command is numeric-only/propose-only; roster pinned at exactly 52 with no growth doctrine |
| Art | **No — hard stop** | No image generation or processing tooling in-repo; the AI-art pipeline proposal (§9 decision) has sat unanswered since 2026-07-19; 116 on-theme card paintings in `Potential Assets/MCP-Axiomancer/images/` are unusable for lack of a provenance/license line |
| Harness / permissions | CI ticks: unconstrained (skip-permissions). Local/attended ticks: prompt-walled | Allowlist omits the exact commands the skills instruct (baseline:check/regen, minigame CLIs, critique:drive, PR-delivery git verbs, npx expo/playwright) |

The one-sentence synthesis: **the loop's freedoms are mostly granted in
prose but revoked in practice** — by stale doctrine that outlived its
rationale, by procedures whose tooling was deleted out from under them,
by authority that exists only in an unratified draft, and by a handful
of owner calls that were queued but never answered.

---

## 1. Cards

**Machinery: strong.** 57-card Profane Canon in
`axiomancer-mechanics/src/Cards/cards.library.ts`; derived reward pools;
sandbox registry with atomic collision checks; playtest matrix with
`--sandbox` / `--deck=preset:<id>+swap:<out>/<in>` A/B flags; a dense
gate wall (shape/pricing/effectiveness/coverage/wording suites; the
card-face-honesty guard sweeping the whole library through the real
mobile presenter). Face copy flows engine→mobile automatically; the only
manual mobile step for a new card is a `KEYWORD_GLOSS` entry when it
introduces a new uppercase word.

**Governance: the blocker.**

1. **The transitional-library ruling has outlived its subject.**
   `plan/bearings.md` ("THE CURRENT CARD LIBRARY IS TRANSITIONAL", T
   direct 2026-08-08) forbids tuning passes and replacement-card
   authoring against "the present 86-card library". That library was
   replaced wholesale by the 57-card Profane Canon the same day, and
   Phase 43 shipped the CQI objective function the ruling was waiting
   on — yet no bearing lifts the order, `skills/digest.md:79` still
   enforces it, and a `/march` tick routing card work to `/deck-tuning`
   would be pre-empted by it. The loop is standing-ordered not to do
   card work for a reason that has expired. **Owner call needed.**
2. **`/deck-tuning` cannot be executed as written.**
   `.claude/commands/deck-tuning.md` §8 references
   `src/Cards/swap-pool/` (deleted) and a 10-preset roster
   (`erosion`…`refrain`) replaced by 3 (`threadbare`/`pilgrim`/
   `apostate`); `SANDBOX_CARD_SETS` is `{}`; the skill never mentions
   CQI (spec 35) and still teaches the voided status-dominance
   objective; `.github/workflows/deck-tuning.yml`'s preset dropdown
   offers only retired ids, and its cron is disabled — so the one skill
   with "full card authority" has no working procedure *and* no trigger.
3. **`.claude/agents/card-expert.md` describes a dead world** — "70-card
   library", "10 themes", "exactly 30 keywords", "THE STRIKE IS DEAD",
   "sandbox-first is law" — all superseded 2026-08-08.
   `axiomancer-mechanics/CLAUDE.md:22-32` and `plan/archive/2026-09-25-trim-t5/axiomancer-mechanics/docs/profane-canon.md:33`
   carry the same drift; `cards.library.ts:22` says the opposite in the
   same tree.
4. **New-card tripwires with no doctrine.** Five hardcoded `57` count
   pins (curated-library, card-effectiveness, haunts, deck-presets,
   card-coverage) plus derived pins (41 spells, 53 reward pool, glossary
   42) must be bumped per add — acceptable as a deliberateness gate, but
   nothing documents that this is *expected* of a card add. Worse,
   `curated-library.engine.test.ts:190` pins `addedIn` to exactly
   `'2026-08-08'` for every card — a card added today fails the suite.
   And despite "the strike is alive" in bearings, no damage field exists
   in the schema and the `basePower`/`chipHp` source-string ban still
   stands, so direct damage remains propose-only in practice.
5. **No "add a card" checklist exists anywhere** — the only wiring
   checklist is keyword-shaped (card-expert.md) and factually stale.
6. **Card-editor round-trip is lossy**: `CardDraft` omits `theme`,
   `paidSummary`, `persistentEffect`; codegen drops the `// pts:`
   comment — an editor upsert of an existing card would fail the theme
   test and destroy pricing arithmetic.
7. **Art fallback is silent**: 18 paintings cover 57 cards by theme
   family; unknown ids fall back to `circe-placeholder.jpg` with no
   coverage test.

## 2. Keywords / effects

**What works unattended:** a new *effect species* (new id in
`Effects/{buffs,debuffs}.library.json` + payload + card carriers) is
loop-addable end-to-end. The strongest gates steer it correctly:
`deprecated-effects.engine.test.ts`'s `CARD_EFFECT_SET` allowlist (a new
card-facing id is banned until deliberately added), mobile KW-1/KW-2,
the card-face-honesty guard, pricing lints.

**What is closed:** a new keyword or mechanic *kind*.
- Doctrine: "no keyword #31 without owner ratification" (card-expert.md;
  deck-tuning.md:363) and "new `specialMechanics` kinds … or any engine
  path are propose-only" (deck-tuning.md:232) — deliberately left
  standing by THE UNSHACKLING.
- Even if unlocked, the wiring would drift: the two switches that matter
  (`combat.engine.ts:2312` mech switch, `combat.cards.ts` mechanicText)
  carry explicit `default:` arms, so a new kind type-checks clean while
  doing nothing and printing no face text. No `assertNever` exists in
  mechanics.

**Silently-drifting surfaces (no failing test):** the card-editor's
independent `wx.ts` KEYWORDS vocabulary (still lists dead spec-32-v2
words); the glyph table triplicated across mobile `glyphShapes.ts`,
editor `CardFace.tsx`, and `scripts/build-catalog.mjs` ("keep the three
tables in sync" by hand); `axio_keywords` parses the hand-written
`docs/keyword-atlas.md` and hardcodes "/30" — a new keyword is invisible
to it until the atlas is hand-edited (unlike `axio_cards`/`axio_effects`,
which auto-regen via `catalog:export`); mobile KW-2's mechanic-kind
check iterates a hardcoded 17-kind array rather than the union.

**Checklist gaps:** card-expert's 8-step keyword checklist stops at
mechanics — it omits the mobile registry/gloss, `CARD_EFFECT_SET`, the
keyword atlas, `docs/retheme-map.json` (NL-8), the editor's uncontracted
surfaces, and `MECH_HEADLINE_PRIORITY` + the inline control/affliction
kind lists in `combat-encounter.engine.ts:1576-1581`.

## 3. Narrative / story

**The loop has already shipped narrative end-to-end** (Phases 44g,
53a–53e, committed by the loop) and the data layer is genuinely good:
`DialogueTree` object literals + one pool entry, guarded by
`auditNarrativeReachability` (cannot ship an orphaned tree), alignment
authoring bands asserted in tests.

**Gaps:**
1. **Phase 58 first.** `MapEventPayload.description` is authored on 59
   of 74 nodes but `ResolvedEvent` never carries it — players see eleven
   three-word placeholders. The loop can author narration today that no
   player will ever see. The build plan itself says "ship it first."
2. **No shipping verb.** Narrative has zero dedicated skills or
   workflows (contrast: seven balance loops). Story ships only when a
   human writes a build-plan row. The design skills
   (`story-spec`/`character-spec`/`world-spec`) are attended-only
   Socratic spec-writers, and `skills/iterate.md` still instructs
   "Content gap → spawn `<content-curator>`" — **an agent that does not
   exist**.
3. **Prose is un-linted where it ships.** `check-lexicon.mjs` scans
   `.md` only; every dialogue tree, `content.ts`, `act*.content.ts`, and
   `rest.copy.ts` string is `.ts` — the shipped in-game prose has no
   machine voice/lexicon check at all. `check-naming-law.mjs` exists but
   is wired into nothing (no npm script, no CI).
4. The voice constitution (`docs/narrative/STYLE_CONSTITUTION.md`,
   `EVALUATION.md` rubric) is judgment-only — fine, but its hard gates
   have no automated proxy, so every phase re-litigates voice.
5. Authority for autonomous narrative shipping exists only in
   `plan/north-star-mork-borg.md` R-D — an **unratified draft** (see §6).

## 4. Enemies / world / minigame content

**The asymmetry is the sharpest structural risk found by this audit:**
the player-facing card pool has (paper) authority to grow autonomously,
while every opposing surface — enemies, maps, event kinds, hazard cards,
gathering sites, loot-cache layers, quest boards — is numeric-only or
propose-only for every loop skill. New content on those surfaces ships
only when a phase brief happens to be written for it.

- Adding an enemy is a phase-sized, two-package change (~10 coupled
  edits: library + registry + map pool + deck obeying deck laws +
  aftermath prose + mobile art key + count-pin bumps). No authoring
  checklist exists in `docs/enemy.md`.
- `new-enemies.engine.test.ts` asserts **exactly 52 roster enemies** —
  any growth requires editing the test that guards growth, with no
  doctrine for when that is legitimate (same pattern as the card pins).
- `/world-tuning` explicitly bans new `MapEventKind` values, pools,
  maps, continents; its proposed `world.sim.ts` was never built.
  Northern continent's four map names exist in the type union with zero
  registered definitions — an authoring seam waiting for a phase.
- **Cross-package impact checklist holes (CI blind spots):**
  `src/Enemy/**`, `src/World/MapEvents/**`, `src/World/Continents/**`,
  `map.registry.ts`/`map.library.ts`, `src/NPCs/**`,
  `src/World/Labyrinth/**`, `src/World/Blacksmith/**` are absent from
  the AGENTS.md checklist / `ci-e2e-scope.mjs`, yet mobile consumes all
  of them (e.g. `layout-engine-parity.test.ts` breaks on any engine map
  node change and CI won't run it). The checklist's `src/World/Rest/**`
  entry points at a directory that no longer exists (`RestChoice/` is
  the live successor, unguarded).
- `GAME_STATE_VERSION` (17) discipline is healthy: kinds/persisted
  fields ride version bumps with pinned migration tests; plain content
  additions don't need one.

## 5. Art

**Hard stop, and it is documented as such.**
`plan/ideas/AI_ART_PIPELINE_OPTIONS.md` (486 lines, 2026-07-19) is a
complete, decision-ready proposal — Options A (gpt-image API) / B
(ComfyUI+FLUX) / C (hosted) / D (Midjourney, ToS-barred from
automation), with legal/disclosure analysis — whose §9 "Decision
needed" has never been answered. Nothing in `plan/` since traces a
decision; every roadmap checkbox is unticked.

What exists: an excellent provenance convention (per-dir `index.ts`
registry + `provenance.json`, all current art honestly labeled
`user-supplied` temp art); one proven public-domain acquisition
(Wikimedia Doré plate → Pillow post-process → WebP + provenance) whose
recipe was run with tooling that is not in the repo; one committed asset
script (`extract-game-icons.mjs`, 27 curated marks from the 8,360-icon
game-icons.net trove); a real review harness (`/devart` galleries,
reachable by the loop's Playwright tools).

What's missing for autonomy: any image generation or processing
dependency (no sharp/Pillow/ImageMagick; masterplan forbids new deps
without a phase case; no curl/wget allowlisted); an asset
naming-convention doc (conventions live only in provenance blobs); a
provenance-completeness or registry-drift test; **a license line for
`Potential Assets/MCP-Axiomancer/images/`** — 116 painted card-art PNGs
keyed by live card names, called "V7 fuel" by the masterplan, blocked
purely on unstated origin. V4–V8 pending, V2/V3 deferred; no art skill,
no art workflow, no art candidates in `PHASE_CANDIDATES.md`. Audio is
nonexistent by scope (spec 11 excludes it; no phase covers it).

What the loop can already do unattended: extract more icons from the
licensed trove; re-map existing paintings to new content (pure data
edits); ingest the two `tmp-images/` stragglers; extend
`mapBackdropFor`; build a contact-sheet/coverage harness; write the
missing convention doc and provenance test.

## 6. Harness, authority, and doctrine coherence

1. **THE LONGER LEASH is not in force.** `plan/north-star-mork-borg.md`
   R-D (full authority to ship NPCs/regions/beats/copy) and R-F (bold
   authority over "new cards, new effects, new keywords, narration,
   art, UI, direction, the map") are headed **DRAFT-FOR-RATIFICATION**;
   its own follow-ups N-1 (fold into bearings/spec 34), N-2 (register
   lint — R-D's authority is *conditioned* on it), N-3 (re-voice pass)
   appear in no build plan and no candidates file, and bearings has no
   longer-leash entry. A loop tick reading bearings — the file it is
   told to read — sees only the narrow 2026-08-08 postures. **This is
   the single largest content-authority gap**: the widening T sketched
   on 2026-08-20 is invisible to the loop. R-C ("prose only") and R-F
   (art in scope) also contradict each other inside the same draft.
2. **Stale doctrine text in bearings**: the "until Phase 42 is
   ratified, do not improvise dark-fantasy flavor" gate is satisfied
   (42 and all of 44a–44i are `[x]`) but still reads as live; the
   "every doctrine-curve reading measures a dead law" line predates
   Phase 43 landing.
3. **Permission allowlist vs. what the skills actually run** (bites
   attended/local ticks only — CI runs `--dangerously-skip-permissions`):
   missing `npm run baseline:check`/`baseline:regen` (the guard's own
   prescribed escape hatch for its baseline write-block!), the minigame
   CLIs (`npm run hazard`/`gathering`/…), `critique:drive`,
   `devlog:build`/`catalog*`, `npx expo|playwright|tsx|vitest`,
   `check-lexicon.mjs`/`audit-*` scripts, and the PR-delivery verbs
   every tuning skill ends with (`git checkout -b`, `git push -u origin
   <branch>`, `gh pr create`) — only `git push origin main` is
   allowlisted.
4. **CI tool grants**: the `reader` agent declares
   `mcp__claude-in-chrome__*` tools granted nowhere — `/critique`'s
   external-observer path is dead in CI; no MCP tools (kb-query,
   axio-query) are granted in CI, so card-expert's prior-art grounding
   degrades to file reads on unattended runs.
5. **Scheduling reality**: only `/march` (4×/day), `/digest` (odd
   days), monthly consolidate and weekly lexicon lint are live. All
   seven tuning crons are disabled (Actions budget, 2026-07-08) — so
   the only autonomous route into *any* domain skill is `/march`
   choosing to route there.
6. **guard.mjs edge cases**: the trailer/emoji commit rule
   misdiagnoses an emoji in quoted card text as a trailer violation;
   `backgroundedGate`'s regex catches any command containing the word
   "test".
7. `telemetry.mjs` dirties the tree by design; benign, handled by the
   pre-commit auto-stage.

---

## Recommendations, ranked

**Owner calls (each is one line from T; filed as `[needs-user-call]`):**
1. **Lift or restate the transitional-library ruling** against the
   57-card Profane Canon. Until then, "full card authority" is a dead
   letter and no card content ships autonomously.
2. **Ratify or trim THE LONGER LEASH** (`plan/north-star-mork-borg.md`)
   and fold the result into bearings (its own N-1); resolve the R-C/R-F
   art contradiction while doing it.
3. **Answer AI_ART_PIPELINE_OPTIONS §9** (A/B/C/Hold) — one line
   unblocks the art roadmap's Phase art-1.
4. **State the provenance of `Potential Assets/MCP-Axiomancer/images/`**
   — the cheapest art win in the repo, blocked on a missing license line.
5. **Growth doctrine for pinned counts**: rule on when the loop may bump
   the exactly-57-cards / exactly-52-enemies / `addedIn` pins (e.g. "a
   content add updates its pins in the same commit, citing this
   ruling").

**Loop-doable now (no ruling needed; queue via the normal pipeline):**
6. **Rewrite the card-work docs against the Profane Canon**:
   card-expert.md, deck-tuning.md (procedure, presets, CQI), mechanics
   CLAUDE.md, profane-canon.md §strike line, deck-tuning.yml inputs.
   Without this, even a lifted ruling lands on an unexecutable skill.
7. **Ship Phase 58** (thread `description` through `ResolvedEvent`) —
   59 authored strings reach players; pure plumbing, already queued
   "ship it first".
8. **Extend the cross-package impact checklist + `ci-e2e-scope.mjs`**
   with `src/Enemy/**`, `src/World/{MapEvents,Continents,Labyrinth,
   Blacksmith,RestChoice}/**`, `src/NPCs/**`, `map.registry.ts`; delete
   the dead `src/World/Rest/**` entry.
9. **A `.ts`-aware prose lint** (extend check-lexicon beyond `.md`;
   wire `check-naming-law.mjs` into CI) so shipped in-game prose gets
   the machine check docs already get.
10. **Close the silent keyword-drift surfaces**: derive KW-2's kind
    list from the union; a drift test for the three glyph tables and
    the editor's `wx.ts` vocabulary; regenerate `axio_keywords` from
    data instead of the hand-written atlas (or lint the atlas against
    the registry).
11. **Author the missing checklists** where they'll be read: "add a
    card" (with the pin-bump list) in profane-canon.md or
    card-expert.md; "add an enemy" in `docs/enemy.md`; the asset
    naming/ingest convention doc + provenance-completeness test.
12. **Allowlist the commands the skills already run** (baseline:*,
    minigame CLIs, critique:drive, catalog*, npx expo/playwright/tsx/
    vitest, the PR-delivery verbs) so attended ticks stop prompt-walling.
13. **A narrative shipping skill** (paralleling the tuning loops,
    modeled on the Phase 44g brief's pre-decided-judgment pattern) —
    contingent on call 2 for its authority language, but the skill can
    be drafted propose-only today.

**Explicitly not recommended without new rulings:** re-enabling the
tuning crons (Actions budget was an owner call), opening the keyword
registry past 30, adding a raw-damage schema field, or touching the
LOCKED MECHANICS carve-out (Conviction / Surge / Dice) — all of these
are correctly gated today.
