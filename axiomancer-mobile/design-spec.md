# Design spec — pending work

> Generated 2026-05-19 after `/oversight` shipped Phase 32 sub-ticks G + H
> in response to the user's "fetch the design file and implement, then list
> what's left" directive.
>
> **Sources read:**
> - `design/handoff-2026-05-16/README.md` — the bundle's own how-to.
> - `design/handoff-2026-05-16/chats/{chat1,chat2,chat3}.md` — user
>   intent + iteration history. Chat 2 is the canonical
>   redesign-decisions doc; chat 1 covers encounter modals + the
>   inventory equip-flow; chat 3 is empty.
> - `design/handoff-2026-05-16/project/prototype.jsx` — the clickable
>   single-phone flow the user pointed at on 2026-05-19 (the more
>   recent design URL emphasized this file).
> - `design/handoff-2026-05-16/project/screens-canonical.jsx` +
>   `screens-modal.jsx` — every artboard / state, including the
>   cold-codex aesthetic variants for the high-stakes screens.
> - `design/handoff-2026-05-16/project/screens/{inventory,combat,event,
>   exploration,encounter-modal,character,components,tokens}.jsx` — the
>   single-screen detail files (chat 1 + iteration history lives here).
> - `design/handoff-2026-05-16/project/tokens.css` — the canonical
>   `--axm-*` palette + type styles.
>
> **Two URLs landed in this session.** Both pointed at the same gzipped
> bundle; the second one (2026-05-19) only changed `README.md` to
> emphasise `prototype.html` (the clickable flow) over `index.html`
> (the artboard canvas). Everything below is computed against the
> single vendored copy at `design/handoff-2026-05-16/`.

## Shipped (Phase 32 sub-ticks A–H)

The rolling Phase 32 has shipped these surfaces from the design
handoff. Each user port commit's subject contains either `port from
design handoff` or `port design spec` (the dispatch rule accepts
either — see `plan/phases/phase_32_design_refresh.md`).

| Tick | Surface | Status |
|---|---|---|
| A | Tabs + event combat-prelude chrome | ✅ shipped (`ff37b46` + `08bcf5e`) |
| B | Exploration drawer step-cards + LEAGUES column | ✅ shipped (`70c9f7a` + `8c5f985`) |
| C | Combat phase-stack chrome | ✅ shipped (`9222bf9` + `843f304`) |
| D | Encounter modal seam over the map | ✅ shipped (`7dab20c` + `bf13539`) |
| E | Inventory Equipment Dock (paper-doll + 7 slots) | ✅ shipped (`02beaeb` + `2a23047`) |
| F | Inventory slot filter (tap-to-filter UX) | ✅ shipped (`9c6024d` + `cc38107`) |
| G | Per-slot ItemGlyph variants (helmet / gauntlet / boot / breastplate / ring) | ✅ shipped (`05127df`) |
| H | Exploration locked/consumed node toast (`this way is sealed` / `walked already`) | ✅ shipped (`d7489a2`) |

Plus the standing decisions already in place pre-Phase 32:
- ✅ SATCHEL replaces SACK across the tree (Phase 31, drained via critique sweeps).
- ✅ WILDS / STRIFE mutex tab swap during combat (`isTabHidden` in `tabs.engine.ts`).
- ✅ Token Crucible — inline strip + reference modal (Phase 17, commit `261a238`).
- ✅ Hard Rule #8 — display literals on presenters; multiple critique drains.
- ✅ No second-person archaic pronouns (bearings line 180-184).

## Pending — chat 1 follow-ups (inventory equip flow)

Three layers of the equip-flow remain unimplemented, in increasing
scope order. Each is a clean `feat: <surface> — port design spec`
candidate.

### 1. Equip-preview stat deltas

**Source:** `design/handoff-2026-05-16/project/screens/inventory.jsx`
lines 357-380 (`computeDelta`) + 388-432 (`StatDeltaBlock`).

**Scope:** when an unworn equipment item is expanded in the sack,
show its stats + (if a sibling slot is already worn) a "REPLACES:
\<current\> → \<new\>" line with a colour-coded net delta
(`+2 BODY DEF · -1 STAMINA` — yellow when better, red when worse).
The current `selectItemModalViewModel` builds a `statDeltas` block
but only on the modal Use-or-Equip confirmation; the design wants
the delta visible on the expanded card itself, before the modal.

**Touches:**
- `state/presenters/inventory.engine.ts` — extend
  `InventoryItemRow` (or add a sibling presenter) with a
  `replacePreview` field: `{ replacing: {id, name} | null, deltas:
  Array<{label, delta, sign}> }`. Compute from
  `state.player.inventory` (find the equipped item in the same
  slot) + `Equipment.stats` (engine).
- `app/(tabs)/inventory/index.tsx` — render the new block on
  expanded cards.

**Sub-tick body draft:**
> `feat: inventory equip-preview deltas — port design spec`

### 2. Equip-replace flow on the action button

**Source:** chat 1's iteration 2 final paragraph ("`✦ EQUIP ·
REPLACE IRON YOKE`"). Design source lines 380-410 of
`screens/inventory.jsx`.

**Scope:** the EQUIP confirmation button's label changes shape when
replacing: bare-slot equip shows `✦ EQUIP`, replace shows
`✦ EQUIP · REPLACE \<current\>`. Aligned with stat-delta preview.

**Touches:** `state/presenters/inventory.modal.engine.ts` —
`confirmLabel` already lives on the modal VM; extend with a
`replaceName: string | null` so the screen can interpolate without
inline literals.

**Sub-tick body draft:**
> `feat: inventory equip-replace label — port design spec`

### 3. Per-row slot tag

**Source:** chat 1 iteration 2 ("`SLOT · WEAPON` tag on every
equipment tile"). Already partially handled — each row carries
`.sub` ('Weapon' / 'Body' / …). What's missing is the chrome
rendering: a small uppercase eyebrow label on the equipment card
chrome showing the slot. Currently the slot only appears as
description copy on expanded cards.

**Touches:** `app/(tabs)/inventory/index.tsx` `ItemCard` — add a
small mono eyebrow rendering `vm.row.sub.toUpperCase()` for
equipment rows.

**Sub-tick body draft:**
> `feat: inventory item slot tag — port design spec`

## Pending — chat 2 / canvas decisions

### 4. Cold-codex aesthetic variant on high-stakes screens

**Source:** `screens-canonical.jsx` variant branches keyed on
`variant === 'codex'` (search the file for `codex` — every screen
function takes `{ variant = 'canonical' }` and renders the
high-contrast stripped-back monochrome alternative when `'codex'`).
Chat 2 covers combat / event / exploration; SELF / SATCHEL are
listed as "follow-up if you want to commit to that direction".

**Scope:** add an app-wide setting (`bearings.md` decision or a
`__DEV__` toggle) that flips combat / event / exploration to the
codex variant. The variant strips colour to bone+ash, uses heavier
hairlines, drops chrome saturation. Three screens; one fresh
phase.

**Trade-off:** the variant is aesthetically distinct enough that
shipping it as a togglable mode is a much larger surface than the
per-port sub-ticks. Best filed as a fresh `Phase 25 — Aesthetic
toggle` candidate via `/oversight` once a user direction lands.

### 5. Vertical phase-stack collapse for past combat phases

**Source:** `screens-canonical.jsx` `PhaseStack` + `PhaseRow` +
`phasePastSummary` (lines 275-332). Chat 2 §V decision: past
phases collapse to one-line summaries; current expands; no hidden
swipe. The current Phase 32 tick C port shipped the phase-stack
layout but every row stays at full height regardless of position.

**Scope:** `state/presenters/combat.engine.ts` — extend the
phase-stack VM so each row carries a `kind: 'past' | 'current' |
'future'` and a `summary: string | null` for past rows. Screen
collapses past rows to a single line consuming `summary`.

**Sub-tick body draft:**
> `feat: combat phase-stack collapse — port design spec`

### 6. Diegetic-stack opacity tuning

**Source:** chat 2 §IV — "map persists at 35% opacity behind every
modal, never unmounts." The current `EncounterModalOverlay`
backdrop tint may not match 35% exactly; needs a quick
side-by-side against the canvas frame at
`design-canvas.jsx` (search for `seam`).

**Scope:** one-line opacity tweak on the encounter modal backdrop
+ any paced-event modal that shares the same seam pattern. Likely
< 10 LOC.

**Sub-tick body draft:**
> `fix: diegetic-stack backdrop opacity — port design spec`

### 7. Two event shells distinction

**Source:** chat 2 §VI — "combat-adjacent (encounter / hazard) vs
paced (everything else)". Current state has the
`EncounterModalOverlay` for the combat-adjacent path and
`app/event/index.tsx` for paced. The distinction may already exist
via the event VM's `kind` field, but the screen-level wrapping
(does paced-event run full-screen vs combat-event running as
seam-modal?) needs a side-by-side audit.

**Scope:** audit + lift wrapper differences. Possibly 0-LOC fix
if already correct.

## Pending — prototype.jsx flow nuances

The clickable prototype (2026-05-19's emphasized entry) ships a
handful of micro-interactions not yet in the live app.

### 8. Aftermath banner

**Source:** `prototype.jsx:550-560` (`PtAftermathBanner`) +
flow at lines 65-77 (the `letItFall` victory branch).

**Scope:** after a combat victory the prototype shows a brief
overlay banner (~2500ms) before returning the player to the map.
Current `ResolvePanel` in `app/(tabs)/combat.tsx` covers the
resolve step; the post-victory "you have endured" aftermath
splash isn't there.

**Sub-tick body draft:**
> `feat: combat aftermath banner — port design spec`

### 9. Combat-tab mutex extension to encounter-modal mount

**Source:** `prototype.jsx:42` — `const combatTabShown = route ===
'strife' || modal?.kind === 'event-combat'`. The current
`useCombatMode().inCombat` flips on `enterCombat`; the prototype
flips it also when the encounter modal is *mounted* but combat
hasn't been entered yet (player still on FIGHT/FLEE pick). That
makes the tab swap happen one beat earlier, while the modal is
still up.

**Scope:** small — `state/combat-mode.ts` extension or a fresh
`useCombatTabMode` that ORs `inCombat || hasActiveEncounterEvent`.
Visual continuity gain.

### 10. Boss kneel/strike variant

**Source:** `prototype.jsx` + `screens-modal.jsx` `BossModal` — the
prototype's `PtEventModal` exposes `KNEEL` / `STRIKE` buttons for
the boss kind (vs FIGHT/SNEAK/PARLEY/FLEE for the regular encounter
kind). The current `EncounterModalOverlay` ships a fixed
FIGHT/FLEE pair regardless of variant.

**Scope:** branch the modal's `choices` array on `vm.variant
=== 'boss'`. Engine-side: confirm `Enemy` carries an `isBoss` flag
or equivalent so the presenter can drive the branch. If the engine
doesn't yet differentiate, file a `[needs-engine-release]` row.

**Sub-tick body draft:**
> `feat: encounter modal boss kneel/strike variant — port design spec`

## Pending — prototype micro-interactions (discovered 2026-05-19)

A re-read of `design/handoff-2026-05-16/project/prototype.jsx`
against the current implementation surfaced four prototype-flow
details that weren't enumerated in the original chat-2 / chat-1
walk. The 2026-05-19 design URL emphasised `prototype.html` as
the entry; items 11-14 below come from comparing the clickable
flow line-by-line to what mobile actually renders.

### 11. Modal enter animations (rise + fade)

**Source:** `prototype.jsx:632-638`. Two CSS keyframes drive
every modal/toast entry:

```css
@keyframes rise { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
@keyframes fade { from { opacity: 0 } to { opacity: 1 } }
```

`rise` (280ms ease-out) is applied to `PtEventModal` (both
combat + paced shells) and `PtAftermathBanner`. `fade` (200ms
ease-out) is applied to `PtToast`. Current implementation
(`EncounterModalOverlay.tsx` + the exploration node-toast
shipped in Phase 32 tick H) mount instantly with no animation
— the modal feels harder than the design's "rises over the
map" intent (chat 1: "non-dismissible modals rise"; the JSDoc
even uses the word "rises" but no animation is wired).

**Scope:** add `react-native-reanimated` `withTiming` enter
transitions on the existing modal/toast roots. Touches
`EncounterModalOverlay.tsx` + `app/(tabs)/exploration/index.tsx`
node toast + (once Phase 41 ships) the aftermath banner.

**Sub-tick body draft:**
> `feat: modal rise + toast fade animations — port design spec`

### 12. Event-modal action-button metadata subtitles

**Source:** `prototype.jsx:481-489` (combat shell) + `:522-531`
(paced shell). Every action button in the design's event modal
ships a two-line layout: primary `axm-caption` label + a
small italic subtitle in `axm-bodyit` showing the cost or
consequence.

```jsx
<button>
  <span>FIGHT</span>
  <span style={{ italic, bone }}>ix · vi vitae · adv. unknown</span>
</button>
<button>
  <span>FLEE</span>
  <span style={{ italic, bone }}>forfeit the path · -ii morale</span>
</button>
```

Paced shell: `commit` / `no cost` subtitles. The current
`EncounterModalOverlay` action buttons render the label only —
no cost/consequence subtitle. The data already lives on the
VM (`vm.choices[i].consequences` per the existing
`event.engine.ts` presenter); the screen needs to render it as
a subtitle on each choice button.

**Scope:** wire the existing `consequences` field to the
button render path; format as `ix · vi vitae · adv. unknown`
style (lowercase-roman cost + italic). Could be a refinement
of Phase 40 (event-shell audit) or its own follow-up.

**Sub-tick body draft:**
> `feat: event-modal action-button subtitles — port design spec`

### 13. Paced-event kind-specific copy variants

> **SUPERSEDED (Phase 137, 2026-06-12).** Rest / treasure / gather /
> hazard / quest events no longer render in the paced event modal at
> all — they launch dedicated minigames (`/rest`, `/cache`,
> `/gathering`, `/hazard`, `/quest`), and interaction / village /
> cutscene route to dedicated screens. The kind-meta variants below
> shipped, then left with their kinds in the Phase 137 cleanup; the
> generic modal survives only as a defensive fallback. Kept for
> design history.

**Source:** `prototype.jsx:497-503`. The paced event modal
shipped **five** distinct kind-meta variants:

| Node kind | Eyebrow | Title | Body |
|---|---|---|---|
| `rest` | A FIRE LOWERS | The Stone Hearth | Stones laid in a tight ring. Coals still red. No one tends them. |
| `treasure` | A FOUND THING | A Buried Chest | Iron-bound. The lock is rusted through. The wood, somehow, is not. |
| `gather` | A SMALL HARVEST | A Stand of Mire-Mint | Bitter green. The leaves bruise easily. Worth the stoop. |
| `quest` | INTERACTION | The Wagoner | A man at a broken cart. One wheel split. He has not looked up. |
| `town` (fallback) | A SETTLEMENT | (node.title) | (node.hint) |

Each variant pairs with a kind-specific illustration
(`fire` / `chest` / `plant` / `figure` / `town`). The current
`app/event/index.tsx` likely ships a single generic paced
layout. Could fold into Phase 40 (event-shell distinction
audit) if the audit also touches paced surfaces.

**Scope:** lift the `kindToMeta` table onto a presenter; pair
with the existing illustration components (or add new ones).
Will likely require engine support for `gather` / `town`
node types if they aren't already in the engine vocabulary.

**Sub-tick body draft:**
> `feat: paced-event kind-meta variants — port design spec`

### 14. Day counter in exploration eyebrow

**Source:** `prototype.jsx:135`. The exploration screen's
chrome eyebrow reads `'✠ ASH MARCHES · DAY xii'` — continent
name + in-game day number in lowercase Roman. The current
exploration screen shipped only `continent` after Phase 32
sub-tick E's predecessor work; the `dayDisplay` field was
deleted as YAGNI in commit `4913ab9` because the engine has
no day-counter state.

**Status: blocked.** This is engine-gated — restoring the
field requires the engine to expose `world.day` or
equivalent state. Track this on `plan/AUDIT.md` as a
`[needs-engine-release]` row once the user wants to commit
to the day-mechanic surface; file in `docs/engine-team-
handoff-*.md` as a fresh ask. Not a single-port phase.

**Sub-tick body draft (once unblocked):**
> `feat: exploration day counter — port design spec`

## Pending — bigger scope candidates (open for /oversight to promote)

These were noted in `plan/PHASE_CANDIDATES.md` pass 5 already, kept
here for completeness — they're independent of the design bundle
but become more reachable once Phase 32 closes:

- **Phase 20** — drain `combat.skills.fixture.ts` (engine
  release-gated).
- **Phase 21** — engine-driven skill resolution (`executeSkill`
  wiring) (engine release-gated, depends on 20).
- **Phase 22** — character presets adoption (engine 18 consumer).
- **Phase 24** — `PersistenceAdapter` re-grounding.

## How to advance

For each Pending row above, the loop pattern is:

1. **User ports** — author the code, commit with subject
   `feat: <surface> — port design spec` (or `port from design
   handoff` — the dispatch rule matches either), push to `main`.
2. **Loop tests/extracts** — next `/march` tick detects the port
   commit, runs `/ship-a-phase` for Phase 32, ships a
   `feat(spec32 tick <N>): <surface> presenter + hermetic tests`
   follow-up. Presenter extraction + hermetic coverage + smoke-
   render integration land in the same commit.
3. **Repeat** until the user signals "design refresh complete" via
   `/oversight` and the Phase 32 row in
   `plan/steps/01_build_plan.md` flips to `[x]`.

Phase 32 closed `[x]` 2026-05-19 with sub-ticks A–H. The
remaining design-bundle work has been factored into discrete
phases in `plan/steps/01_build_plan.md`:

- **Items 1, 2, 3, 5** (inventory equip-flow + phase-stack
  collapse): shipped as **Phases 35, 36, 37, 38**.
- **Items 6, 7, 8, 9, 10** (chat-2 + prototype-flow):
  queued as **Phases 39–43**, awaiting `/march` dispatch.
- **Item 4** (cold-codex variant): pending in
  `PHASE_CANDIDATES.md` as `Phase 25` candidate; needs
  `/oversight` promotion when the user commits to that
  direction.
- **Items 11, 12** (prototype micro-interactions — modal
  animations, action-button subtitles): newly filed 2026-05-19,
  awaiting promotion to Phases 45+ via `/oversight` or
  auto-promotion if `/expand`. **Item 13 is SUPERSEDED** — Phase
  137's dedicated encounter screens removed those kinds from the
  paced modal entirely; see the note on item 13 above.
  surfaces them as a cluster.
- **Item 14** (day counter in exploration eyebrow):
  engine-gated; lives as a `[needs-engine-release]` row in
  `plan/AUDIT.md` once the user commits to surfacing day
  mechanics. Not a mobile-side phase.

Each pending row has a draft commit subject + design-source
pointer in this doc. The user can drive a specific port
directly, or let `/loop /march` drain the build-plan queue
autonomously.
