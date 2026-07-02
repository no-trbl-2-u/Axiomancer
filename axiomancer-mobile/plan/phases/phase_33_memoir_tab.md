# Phase 33 — MEMOIR tab (journal surface)

> **Status: [ ] — sized 4 sub-ticks.** Filed via `/plan-a-phase`
> 2026-05-16. Topic: "begin implementing the MEMOIR tab which
> will act as the user's journal keeping track of the story,
> quests, their alignment and maybe a philospher quote based on
> their philosophical alignment (exact alignments to come)."

## Outcome

A new fifth tab — **MEMOIR** — gives the player a journal
surface that reads (not writes) four threads of the playthrough:

1. **A chronicle of significant beats** — the recent typed
   events the player has lived through (boss victories, level-
   ups, dialogue choices, continent transitions). Reverse-
   chronological. Persists across app launches via the engine
   save (it's just a snapshot of `_recentEvents`).
2. **Quest log** — active and completed quests from
   `state.quests` (engine `QuestLog`). Each quest's objectives
   render with status badges.
3. **Alignment readouts** — moral meter from
   `state.moralMeter` plus a *provisional* philosophical
   alignment derived from the player's highest base stat
   (Heart / Body / Mind). The provisional mapping ships as a
   placeholder; a follow-up phase swaps in the real alignment
   schema once the user defines it.
4. **Philosopher quote slot** — a `philosopherQuote: string |
   null` VM field that renders nothing today. A follow-up phase
   wires the quote lookup once exact alignments + quote
   inventory are decided.

The tab is read-only this phase: no quest progression, no
alignment shift, no chronicle editing happens here. Those
flows belong to the surfaces that already drive engine state
(exploration, combat, event modal); MEMOIR reflects them.

## Sub-tick decomposition

- **Tick A — Route + tab registration + empty MVP.** Adds the
  fifth tab to expo-router, extends `TAB_TITLES` with
  `memoir: 'MEMOIR'`, adds a new `'scroll'` (or similar) tab
  icon to the `TabIcon` switch in `app/(tabs)/_layout.tsx`,
  registers `<Tabs.Screen name="memoir">`, and ships an empty
  `app/(tabs)/memoir/index.tsx` that renders the four section
  shells with empty-state copy. Skeleton
  `state/presenters/memoir.engine.ts` with `MemoirViewModel`
  shape locked but each section returning empty fixtures.
  Smoke-render harness extended (`state/e2e/smoke-render.engine.test.tsx`)
  to include `<MemoirScreen />` in all three contract suites
  (no-throw, no-template-leak, non-empty body). Hermetic
  shape test pinned in `state/e2e/memoir.engine.test.ts`.
- **Tick B — Quests section.** `selectMemoirViewModel` reads
  `state.quests` and builds `vm.quests: { active, completed,
  hidden }` rows. Each row carries `id`, `name`, `description`,
  `objectives: ObjectiveRow[]`, `status`, optional `rewards`.
  Screen renders the three sub-sections with quest cards;
  objectives expand inline. +3 hermetic cases pinning empty-log
  / mixed-status / completed-only inputs.
- **Tick C — Moral + provisional philosophical alignment.**
  `vm.moralAlignment: { value: number; chip: { label, tint } }`
  derives from `state.moralMeter` (label band lookup: e.g.
  `-100..-66 RUTHLESS`, `-65..-34 STERN`, `-33..33 UNDECLARED`,
  `34..65 BENEVOLENT`, `66..100 SAINTLY` — placeholder bands,
  user can tune). `vm.philosophicalAlignment: { label: string;
  provisional: true; rationale: string }` reads
  `state.player.baseStats`, picks the highest (ties → Heart),
  emits `'of the Heart' | 'of the Body' | 'of the Mind'` plus
  a one-line rationale (`'Heart is your largest measure (12).'`).
  Screen renders both as adjacent chip-cards. Quote slot:
  `vm.philosopherQuote = null` for this tick; screen renders
  nothing until the follow-up phase populates it. +3 hermetic
  cases covering each band transition + a tie-break.
- **Tick D — Story chronicle from typed events.**
  `vm.chronicle: ChronicleEntry[]` derives from
  `state._recentEvents` (the mobile-only ring buffer, capacity
  20, shipped Phase 25). Each engine event maps to one entry
  shape via a pure mapper:
  - `combat:ended` → "FELLED <enemy>" or "ROUTED BY <enemy>" or
    "PARLEYED WITH <enemy>" *(superseded by /oversight
    2026-05-16: the flee outcome now maps to `FLED` /
    `the path bends away.` instead — engine has no parley
    outcome today, so "PARLEYED WITH" was reading as lying to
    the player per CRITIQUE pass 7 reader. The PARLEYED label
    can return when the engine adds a real parley outcome.)*
  - `character:levelup` → "ROSE TO <level>"
  - `world:moved` with continent change → "CROSSED INTO
    <continent>"
  - `dialogue:applied` → "SPOKE WITH <npc>" (when the dialogue
    tree carries an NPC name; else skip)
  - `inventory:changed` with `addItem` → skip (too noisy for
    a chronicle)
  - other event types → skip
  Reverse-chronological list, capped at a sensible visible
  count (default 12, scrolls). +3-4 hermetic cases covering
  each mapped event kind + the noise-skip path.

If `/ship-a-phase` reaches verify-red between sub-ticks, halt
and re-plan; do not stack.

## Routes / API endpoints / CLI surface — locked

**New route added:** `app/(tabs)/memoir/index.tsx` (folder-shaped,
matches `character/` and `inventory/` and `exploration/`
precedent — not the flat `combat.tsx` shape).

The expo-router contract in `bearings.md` line 97-101 lists the
five existing routes (`combat`, `character`, `exploration`,
`inventory`, `event`). This phase adds `memoir` as the sixth
route (fifth tab — `event` is a modal, not a tab). After Tick A
lands, update bearings line 97-101 in a separate commit
(`bearings: add memoir route post-phase-33`).

No other route changes. No engine action layer additions.

## Content / data reads — engine surface

Every read remains through existing engine surfaces. No new
engine consumers required; the philosopher-quote slot stays a
null VM field this phase.

| Helper | From | Use |
|---|---|---|
| `state.quests` (QuestLog) | engine `World/types` | Quest list per status |
| `state.moralMeter` (number) | engine `Game` | Moral alignment chip |
| `state.player.baseStats` | engine `Character` | Provisional philosophical alignment (highest-stat heuristic) |
| `state._recentEvents` (ring buffer) | mobile `state/store.ts` (Phase 25) | Chronicle entries |
| `isCombatEndedEvent` / `isLevelUpEvent` / `isWorldMovedEvent` / `isDialogueAppliedEvent` | top-level engine | Narrow typed events in the chronicle mapper |

No engine package surface needed beyond what already ships.

## Components / handlers — modified

**Tick A:**

- `state/presenters/tabs.engine.ts` — extend `TabKey` union
  with `'memoir'`; extend `TAB_TITLES` with `memoir: 'MEMOIR'`;
  add `'memoir'` to `ALWAYS_VISIBLE`.
- `app/(tabs)/_layout.tsx` — register `<Tabs.Screen name="memoir">`
  with `title: TAB_TITLES.memoir` + `tabBarLabel: TAB_TITLES.memoir`
  (Phase 30 Tick B defensive double-pin); add new `'scroll'` (or
  whichever kind we pick — see Decisions §6) icon to the
  `TabIcon` switch.
- `state/presenters/memoir.engine.ts` (new) — pure
  `selectMemoirViewModel(state) → MemoirViewModel` with
  skeleton sections.
- `app/(tabs)/memoir/index.tsx` (new) — screen consuming the VM
  via slim-slice + `useMemo` (Phase 30 character-screen pattern;
  do NOT call `useGameState(selectMemoirViewModel)` directly).
- `state/e2e/memoir.engine.test.ts` (new) — VM shape contract +
  empty / populated inputs.
- `state/e2e/smoke-render.engine.test.tsx` — extend to mount
  `<MemoirScreen />` in all three contract suites.
- `state/e2e/tabs.engine.test.ts` — extend the TAB_TITLES
  canonical-register pin to include `memoir: 'MEMOIR'`.

**Tick B:** `memoir.engine.ts` quest-row builder; `index.tsx`
quest-section render; test additions.

**Tick C:** `memoir.engine.ts` alignment-band lookup;
`index.tsx` alignment chip-cards; test additions.

**Tick D:** `memoir.engine.ts` typed-event → ChronicleEntry
mapper; `index.tsx` chronicle list render; test additions.

## Cross-links

**In (verify before starting):**

- `pnpm verify` green at baseline (410/410 post-`fb53af0`).
- Phase 25 `_recentEvents` ring buffer exists (`state/store.ts`).
- Phase 30 Tick B's `TAB_TITLES` extraction lives on
  `state/presenters/tabs.engine.ts`.
- Phase 30 Tick A's smoke-render harness covers five surfaces;
  Tick A of this phase extends it to six.

**Out (ships across sub-ticks):**

- `state/presenters/memoir.engine.ts` (new).
- `state/presenters/tabs.engine.ts` (extended).
- `app/(tabs)/_layout.tsx` (new screen registration + new icon).
- `app/(tabs)/memoir/index.tsx` (new).
- `state/e2e/memoir.engine.test.ts` (new).
- `state/e2e/smoke-render.engine.test.tsx` (extended).
- `state/e2e/tabs.engine.test.ts` (extended).
- `plan/bearings.md` — route list update post-Tick-A (separate
  bearings commit).

## SEO / metadata — n/a

(Mobile app, no SEO surface.)

## Hero / body / sub-section composition

Visually, the screen is a single ScrollView with four ordered
sections, in render order:

1. **Header eyebrow** — `✠ THE BOOK OF DEEDS` (or whichever
   string Tick A locks). Player name + level beneath as a thin
   sub-line. No XP bar (that's the SELF tab's job).
2. **Chronicle section** — eyebrow `✠ A CHRONICLE`. Reverse-
   chronological entries; each is one line of mono text
   prefaced by a Roman-numeral round/day token where the
   engine supplies one, else a glyph. Empty state:
   `the page is bare.`
3. **Quests section** — eyebrow `✠ ERRANDS`. Sub-sections:
   `✠ AT HAND` (active), `✠ COMPLETED`, optional `✠ FORGOTTEN`
   (engine `QuestStatus.failed` if it exists; surface only if
   non-empty). Each quest card: gothic title + serif body +
   objective rows.
4. **Alignment section** — eyebrow `✠ MEASURE`. Two adjacent
   chip-cards (Moral / Philosophical) on the same row.
   Beneath them, the philosopher-quote slot (rendered only
   when `vm.philosopherQuote !== null`; this phase always
   renders nothing). Empty state for alignment-undeclared:
   `the scales are level.`

All visible strings live in `MemoirViewModel` per Hard
Rule #8. None on the screen as literals.

## Empty / loading / error states — copy locked

- **Empty chronicle** (`vm.chronicle.length === 0`):
  `the page is bare.` (lowercase ritual; `textTransform:
  'uppercase'`).
- **Empty quest log** (`active.length === 0 && completed.length === 0`):
  `no errands written here.`
- **Moral meter unset** (engine default 0):
  `the scales are level.` Chip rendered as
  `UNDECLARED` with `AXM.bone` tint.
- **Philosophical alignment** (highest-stat heuristic always
  returns a value; empty state is when all three base stats
  are equal):
  if 3-way tie: `untested.` with `AXM.bone` tint.
  Otherwise the provisional label.
- **Loading** (presenter returns FALLBACK_VM, e.g. before the
  store mounts): same FALLBACK pattern as exploration —
  one centered line: `gathering pages…`.
- **No error state** — every read either returns data or the
  documented empty state. The screen never throws.

## Decisions made upfront — DO NOT ASK

1. **Tab key, title, route shape.** `TabKey` gains `'memoir'`.
   `TAB_TITLES.memoir = 'MEMOIR'` (uppercase; matches the all-
   places register from Phase 31 even though MEMOIR is not a
   place — the precedent is uppercase 4-6 letter tokens, and
   the user picked the name). Route at
   `app/(tabs)/memoir/index.tsx` (folder-shaped per character/
   inventory/exploration precedent).
2. **Tab visibility = always visible.** Joins
   `['character', 'inventory']` in `ALWAYS_VISIBLE`; not gated
   by combat. Bottom bar grows to 5 visible (one of WILDS /
   STRIFE swapping based on combat, plus SELF, MEMOIR, SATCHEL).
3. **Tab icon kind = `'scroll'`** (or `'tome'`, builder's call
   when implementing Tick A; pick the name that matches the
   existing `TabIcon` switch convention). Placeholder SVG;
   real artwork swaps in via the `SVG_ASSET_SPEC.md` workflow
   independently.
4. **No tab badge this phase.** A "new chronicle entry" or
   "new quest" badge is a clean follow-up but adds dispatch
   complexity (acknowledge-on-mount pattern like Phase 29 Tick
   A). Out of scope; file as a follow-up if the user wants it.
5. **Read-only screen.** MEMOIR does not dispatch any engine
   action. No tap-to-progress-quest, no tap-to-shift-alignment.
   The journal reflects state; it doesn't change it.
6. **Philosopher quote = nullable, deferred.** VM exposes
   `philosopherQuote: string | null`. This phase always emits
   `null`. A follow-up phase fills in the lookup once the user
   defines exact philosophical alignments and a quote
   inventory (likely as a JSON/TS lookup table keyed by
   alignment + a tiebreaker, possibly seeded by a `scout`
   sub-agent pulling public-domain philosopher quotes).
7. **Provisional philosophical alignment = highest base stat.**
   `Heart > Body > Mind`, ties → Heart. Emits
   `'of the Heart' | 'of the Body' | 'of the Mind'`. Marked
   `provisional: true` on the VM so the follow-up phase that
   ships real alignments can replace the mapping without
   schema change.
8. **Moral meter band table (placeholder, tunable).**
   `-100..-66 → 'RUTHLESS' (blood)`, `-65..-34 → 'STERN'
   (rust)`, `-33..33 → 'UNDECLARED' (bone)`, `34..65 →
   'BENEVOLENT' (sulfur)`, `66..100 → 'SAINTLY' (parchment)`.
   Hermetic test pins the band boundaries; user can re-tune
   in a one-line presenter edit. **Pending an alignment
   document the user signaled they'll share soon (`/oversight`
   2026-05-16) — the document will likely revise both labels
   and cutoffs and may also redefine the philosophical
   alignment heuristic in Decision §7. Tick C ships with the
   placeholder; a follow-up commit re-tunes once the document
   lands.**
9. **Chronicle source = `state._recentEvents` only.** Not a
   separate persisted journal. The engine's ring buffer is
   the source of truth; capacity 20 means the chronicle
   shows roughly the last 20 events, of which a subset
   (mapped event kinds in Tick D) render. If the user later
   wants a longer-lived journal, that's a separate
   `chronicle: ChronicleEntry[]` slice on the mobile store
   that the engine save persists — out of scope this phase.
10. **Voice register survives.** Terse, archaic, ritual.
    Lowercase ritual register for placeholder copy; UPPERCASE
    via `textTransform` on section eyebrows and chips. No
    `thee/thou/thy/thine/ye`.
11. **Read pattern uses slim-slice + `useMemo`.** Phase 30
    Tick A's lesson stands: `useGameState(selectMemoirViewModel)`
    would churn `useSyncExternalStore` because the VM is a
    frozen new object every call. MEMOIR ships the corrected
    pattern from the start.

## Mobile reflow / responsive

Portrait phone only (per bearings). Single ScrollView; sections
stack. No tablet / landscape variants.

## Pages × tests matrix

| Surface (per Tick) | Test file | Cases (delta) |
|---|---|---|
| Tab registration + smoke render | Tick A | `state/e2e/tabs.engine.test.ts` (+1 case extending the canonical-register pin); `state/e2e/smoke-render.engine.test.tsx` (+3 cases: no-throw / no-template-leak / non-empty body) |
| MemoirViewModel shape | Tick A | `state/e2e/memoir.engine.test.ts` (new, +2 cases: full shape pin; FALLBACK on missing engine surfaces) |
| Quests section | Tick B | `state/e2e/memoir.engine.test.ts` (+3 cases: empty log; mixed active/completed; completed-only) |
| Alignment readouts | Tick C | `state/e2e/memoir.engine.test.ts` (+3 cases: each band boundary; tie-break; provisional flag stays `true`) |
| Chronicle mapper | Tick D | `state/e2e/memoir.engine.test.ts` (+4 cases: combat:ended (3 outcomes), levelup, world:moved continent transition, noise-skip path) |

Approx **+16 hermetic tests** across the phase. Verify target:
~426-430 after Tick D (baseline 410).

## Verify gate

```bash
pnpm verify
```

Baseline 410/410 (post-`fb53af0`). Each Tick lands +verify
delta as documented in its commit body. Phase closes after
Tick D's plan-flip commit; if any of A-D leaves verify red on
a same-root-cause-third-try, halt per `ship-a-phase` §10.

## Deploy gate

Stub (manual EAS). Real device verification of the new tab
waits for the next manual `npm run deploy:preview` after the
phase closes. The hermetic harness substitutes during the
rolling implementation.

## Commit body templates

**Tick A (route + tab registration + skeleton VM):**

```
feat(spec33 tick A): MEMOIR tab — route + skeleton VM + empty state

Phase 33 sub-tick A — adds the fifth tab to expo-router and a
read-only journal surface skeleton. No real content yet; Ticks
B/C/D fill the four sections (chronicle, quests, alignment,
philosopher-quote slot).

- state/presenters/tabs.engine.ts: TabKey += 'memoir';
  TAB_TITLES += 'memoir: MEMOIR'; ALWAYS_VISIBLE += 'memoir'.
- app/(tabs)/_layout.tsx: register <Tabs.Screen name="memoir">
  with title + tabBarLabel double-pin; add 'scroll' icon to
  TabIcon switch.
- state/presenters/memoir.engine.ts (new): MemoirViewModel
  with four sections; all empty placeholders.
- app/(tabs)/memoir/index.tsx (new): screen consuming the VM
  via slim-slice + useMemo (Phase 30 character pattern).
- state/e2e/memoir.engine.test.ts (new): +2 shape cases.
- state/e2e/smoke-render.engine.test.tsx: +3 cases covering
  the new surface in all three contract suites.
- state/e2e/tabs.engine.test.ts: canonical-register pin
  extended to include memoir.

Verify: <new>/<new>.

Closes #<phase mirror>.
```

**Tick B (quests section):** subject
`feat(spec33 tick B): MEMOIR quest list from state.quests`.

**Tick C (alignment readouts):** subject
`feat(spec33 tick C): MEMOIR moral + provisional philosophical alignment`.

**Tick D (chronicle):** subject
`feat(spec33 tick D): MEMOIR chronicle from _recentEvents`.

## DoD

Phase 33 closes (`[x]`) when **all** of:

1. Tick A through Tick D have shipped (one commit each), each
   passing `pnpm verify` on push.
2. The smoke-render harness covers `<MemoirScreen />` in all
   three contract suites.
3. `state/e2e/memoir.engine.test.ts` has ~16 hermetic cases
   across VM shape, quest-row builder, alignment bands, and
   chronicle mapper.
4. `bearings.md` line 97-101 lists the new `memoir` route
   (separate commit, post-Tick-A).
5. `plan/steps/01_build_plan.md` Phase 33 row flips `[ ]` →
   `[x]` with each sub-tick commit hash listed.

## Follow-ups (out of scope this phase)

- **Philosopher-quote lookup table** — keyed by exact
  philosophical alignments + a tie/round-robin selector. File
  as a separate phase once the user defines the alignments.
  Possibly seeded by a `scout` sub-agent pulling public-domain
  philosopher quotes thematically grouped.
- **Tab badge for new chronicle entries / new quests** —
  acknowledge-on-mount pattern from Phase 29 Tick A. Easy
  follow-up if the user wants the surface to nag attention.
- **Long-lived journal** — if 20 events isn't enough, add a
  mobile-side `chronicle: ChronicleEntry[]` slice that the
  engine save persists. Separate phase; data-shape decision.
- **Quest progression from MEMOIR** — making the screen
  interactive (tap a quest objective to mark progress) would
  require new engine action wiring. Out of scope; the screen
  stays read-only this phase.
- **Update `docs/claude-design-prompt-2026-05-16.md`** —
  after Phase 33 ships, mention the MEMOIR tab in the "What
  the app currently has" table so the Claude Design pass
  includes it in scope.
- **Update bearings.md line 97-101** — separate commit after
  Tick A lands; the deliberate navigation-phase commit makes
  the route addition official.
