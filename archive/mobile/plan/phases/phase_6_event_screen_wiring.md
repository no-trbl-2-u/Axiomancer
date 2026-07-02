# Phase 6 — Spec 08: Event screen wiring

> **\[SUPERSEDED 2026-05-15 by Phase 23 — engine 0.7.0 migration\]**
>
> This brief documents the Phase 6 implementation that shipped
> against `axiomancer-mechanics@0.6.0` (commits `2c4d2b0` / `31e42f0`
> / `beba7d4` / `87d0b4c`). Engine 0.7.0 (commit `ee3b9ad`)
> removed `processNode` / `ProcessNodeResult` / `ProcessedEvent`
> in favour of `resolveMapEvent` / `ResolvedEvent` /
> `ResolveMapEventResult`; the event-subsystem rewrite for the
> new engine surface is **Phase 23**. See
> `plan/phases/phase_23_mapevents_migration.md` for the live
> shape; this brief stays as historical record of what shipped
> against 0.6.0 and the Spec 08 product-question rationale
> (A / C / B / Future spec / Yes) which still binds.

> **Status: [x] — shipped 2026-05-15.**
> Engine surface present in `axiomancer-mechanics@0.6.0`; all
> five product questions in `specs/08-event-screen-wiring.md`
> answered in-spec at lines 63 / 72 / 80 / 85 / 89
> (A / C / B / Future spec / Yes).
>
> Sized **3–5 ticks** per the cross-repo versioning audit
> integrated 2026-05-15. One brief; `/ship-a-phase` can split
> at the sub-tick boundaries marked below.

## Outcome

The mobile event screen renders engine-driven narrative.
When `processNode()` produces a `ProcessedEvent` with a
non-`'none'` kind, `selectHasActiveEvent` flips to `true`,
`EventGate` pushes the player into the full-screen modal,
the screen reads `selectEventViewModel`, the player picks a
choice, and the engine advances state (`applyDialogue` for
NPC dialogue trees; `startCombat` for combat-prelude
encounters; auto-resolved for rest / treasure / gather).
Nothing in the screen is hard-coded; the procedural SVG
illustrations live behind a presenter-supplied `artSlug`.

## Routes / API endpoints / CLI surface — locked

Single route is already locked. No tab additions.

| Path | Owner | Status |
|---|---|---|
| `app/event.tsx` → `app/event/index.tsx` | this phase | move-to-folder per Spec 08 Acceptance |
| Stack.Screen `name="event"` `presentation="fullScreenModal"` | `app/_layout.tsx` line 91-94 | **unchanged** — already wired in Phase 14 (`5dd597b`) |
| `EventGate` reads `selectHasActiveEvent`, calls `router.push('/event')` | `components/EventGate.tsx` | **unchanged signature**, semantics flip from no-op (always `false`) to engine-truth |
| Files under `app/(tabs)/` | n/a | **not touched by this phase** |

Folder shape after ship:

```
app/event/
  index.tsx                 # screen — reads VM, renders, dispatches choices
  components/
    EncounterIllustration.tsx
    BossIllustration.tsx
    RestIllustration.tsx
    GatherIllustration.tsx
    NpcIllustration.tsx
state/presenters/
  event.engine.ts           # rewritten: real selectEventViewModel + selectHasActiveEvent
  event-assets.ts           # NEW: slug → component map (Q3=B mobile-local)
state/e2e/
  event.engine.test.ts      # rewritten — fixture ProcessNodeResult → VM
  event.screen.test.tsx     # NEW — mirrors combat.screen.test.tsx
```

## Content / data reads — engine surface

Every read is from `axiomancer-mechanics` (top-level barrel).
**No `state/mocks/` for event data.**

| Helper / type | From | Use |
|---|---|---|
| `processNode()` (on `GameActions`) | `Game/store.d.ts:23` | dispatched by `eventActions.processCurrentNode()` (Tick A) to populate the event slice |
| `applyDialogue(tree, choice)` (on `GameActions`) | `Game/store.d.ts:24` | dispatched by `eventActions.pickChoice()` for `'npc'` events |
| `startCombat(encounter)` (on `GameActions`) | `Game/store.d.ts:19` | dispatched by `eventActions.pickChoice()` for `'encounter'` events when choice = FIGHT |
| `ProcessNodeResult` / `ProcessedEvent` | top-level type re-export | input to `selectEventViewModel` composition |
| `DialogueTree` / `DialogueNode` / `DialogueChoice` | top-level type re-export | dialogue-branch input |
| `getDialogueNode(tree, nodeId)` | top-level function | walk dialogue from the current node id |
| `visibleChoices(node, ctx)` | top-level function | filter unmet `requires` before VM-emit |
| `selectMoralMeter` | top-level selector | post-pick moral feedback (Tick C, optional polish) |

Mobile-side store extension (Tick A):

```ts
// state/store.ts — extend the existing slice
interface MobileEventSlice {
  pending: ProcessNodeResult | null;     // result of last processNode()
  dialogueCursor: { tree: DialogueTree; nodeId: string } | null;
  history: { nodeId: string; choiceId: string }[];   // for skip-button + replay
}
```

This is **mobile-only state**, not engine state. The engine
returns `ProcessNodeResult` synchronously from `processNode()`;
the store caches the result so the modal can render it across
re-mounts and present a "skip" affordance over long bodies.

## Components / handlers — new + reused

**New mobile primitives:**

- `state/presenters/event.engine.ts` — rewritten
  - `selectEventViewModel(state): EventViewModel` — composes from `pending` + `dialogueCursor`
  - `selectHasActiveEvent(state): boolean` — `state.event.pending !== null && state.event.pending.event.kind !== 'none'`
- `state/presenters/event-assets.ts` — NEW
  - `EVENT_ART_SLUGS = ['encounter', 'boss', 'rest', 'gather', 'treasure', 'npc-generic'] as const`
  - `selectEventArtSlug(event: ProcessedEvent): EventArtSlug` — pure mapper from `ProcessedEvent` discriminant to slug
- `state/actions.ts` — add `eventActions`:
  - `processCurrentNode()` — wraps store `processNode()`, caches `ProcessNodeResult` in `state.event.pending`
  - `pickChoice(choiceId: string)` — branches on VM `kind`:
    - `'narrative-choice'` + `dialogueCursor !== null` → `applyDialogue(tree, choice)`; if `applyDialogueChoice` returns `nextNode`, update cursor; if null, clear `pending`
    - `'narrative-choice'` + rest/treasure/gather/quest → clear `pending` (engine already auto-resolved via `processNode`)
    - `'combat-prelude'` + choice.id starts with `'fight'` → `startCombat(encounter)`; clear `pending`
    - `'combat-prelude'` + other choice → engine extension (out of scope this phase; see Follow-ups)
  - `dismissEvent()` — clear `pending` and `dialogueCursor` without dispatching (used by skip button on rest/treasure/gather only)
- `app/event/components/{Encounter,Boss,Rest,Gather,Npc}Illustration.tsx` — extracted from current `app/event.tsx` SVG functions

**Reused primitives:**

- `<ScreenBg>` / `<SectionLabel>` / `<ActionIcon>` / `<Splatter>` — same as today
- `@/theme/axm` `AXM` + `FONTS` — same
- `freezeViewModel` from `state/presenters/freeze.ts` — same Spec 03 deep-freeze invariant
- `useGameState` / `useGameActions` from `state/GameStoreProvider` — same
- `EventGate` already wired into `app/_layout.tsx` — keep as-is

## VM shape — locked

```ts
export type EventKind = 'combat-prelude' | 'narrative-choice';
export type EventArtSlug = 'encounter' | 'boss' | 'rest' | 'gather' | 'treasure' | 'npc-generic';
export type EventVariant = 'encounter' | 'boss' | 'quest' | 'rest' | 'gather' | 'npc';

export type ConsequenceKind =
  | 'damage' | 'heal' | 'currency' | 'item' | 'flag'
  | 'moral' | 'quest-start' | 'quest-progress' | 'skill-learn';

export interface EventConsequence {
  kind: ConsequenceKind;
  amount?: number;          // for damage / heal / currency / moral
  label?: string;           // for item / flag / quest / skill
}

export interface EventChoice {
  id: string;                                // engine choice id; for combat: 'fight' | 'flee' | etc.
  label: string;
  description: string;                       // human-readable sub (Q2=C: both)
  consequences: readonly EventConsequence[]; // machine-readable preview (Q2=C: both)
  iconKey: string;
  accentKey: ChoiceAccentKey;
  enabled: boolean;
}

export interface EventViewModel {
  kind: EventKind;                           // Q1=A: two kinds
  variant: EventVariant;                     // visual hint preserved from Spec 03 contract
  artSlug: EventArtSlug;                     // Q3=B: mobile slug → asset
  badge: string;
  badgeAccentKey: ChoiceAccentKey;
  title: string;
  subtitle: string;
  body: string;
  choices: readonly EventChoice[];
  lore: string | null;
  canSkip: boolean;                          // Q5=Yes: skip affordance when body is long
}
```

The `variant` field stays for back-compat with existing
hermetic test in `state/e2e/event.engine.test.ts`. The new
`kind` discriminator is the primary screen-behaviour switch.

## Cross-links

**In (verify before starting):**

- `pnpm verify` green at baseline (`HEAD` = `261a238` "Token Crucible port" — pending push)
- `node_modules/axiomancer-mechanics/package.json` version is `0.6.0` or higher
- `state/store.ts` and `state/actions.ts` mergeable without conflicts (Tick A extends store; Crucible WIP does not touch event state per inspection)

**Out (ships in this phase):**

- `app/event.tsx` — **deleted** (content moves into folder)
- `app/event/index.tsx` — **new** (rewritten against VM)
- `app/event/components/*.tsx` — **new** (illustrations extracted)
- `state/presenters/event.engine.ts` — **rewritten** (real composition)
- `state/presenters/event-assets.ts` — **new**
- `state/actions.ts` — **patched** (add `eventActions` block)
- `state/store.ts` — **patched** (add `event` slice; gated to ignore Crucible WIP zones)
- `state/e2e/event.engine.test.ts` — **rewritten** (fixture-driven)
- `state/e2e/event.screen.test.tsx` — **new** (mirrors `combat.screen.test.tsx`)
- `state/e2e/route-tree.engine.test.ts` — **patched** to reflect `app/event/` folder shape (already modified by Crucible WIP — coordinate)
- `specs/08-event-screen-wiring.md` — Acceptance checklist ticked; H1 gets `[DONE on <date> — see commit <sha>]`

**Retro-fit (out of scope, follow-up):**

- `selectHasActiveEvent` consumer in `state/presenters/navigation.engine.ts` — currently a stub returning `false`. Status block Phase 26 (presenter-stub drain) owns the navigation-side read; Status block Phase 19 owns flipping `selectHasActiveEvent` itself if Phase 6's Tick D doesn't absorb it. This brief assumes Tick D flips `selectHasActiveEvent`; the navigation badge follow-on lands in Phase 26.

## Decisions made upfront — DO NOT ASK

Sourced from `specs/08-event-screen-wiring.md`'s answered Open
Questions block. Authority order per `skills/plan-a-phase.md`
§3: spec answers > `plan/bearings.md` > phase-specific.

1. **VM kind split (Spec Q1 = A):** Two `kind` values —
   `'combat-prelude'` and `'narrative-choice'`. Sub-discriminant
   via `variant` (kept for back-compat). Mapping from engine:

   | `ProcessedEvent.kind` | VM `kind` | VM `variant` |
   |---|---|---|
   | `'encounter'` (`isBoss=false`) | `combat-prelude` | `encounter` |
   | `'encounter'` (`isBoss=true`) | `combat-prelude` | `boss` |
   | `'npc'` (with `dialogue`) | `narrative-choice` | `npc` |
   | `'rest'` | `narrative-choice` | `rest` |
   | `'gather'` | `narrative-choice` | `gather` |
   | `'treasure'` | `narrative-choice` | `quest` (visual reuse — engine has no `treasure` variant slot, mapped to existing `quest` flavour) |
   | `'quest'` | `narrative-choice` | `quest` |
   | `'shop'` | **deferred** — see Follow-ups |
   | `'none'` | `selectHasActiveEvent === false`; modal not pushed |

2. **Choice consequences (Spec Q2 = C):** Both. Each `EventChoice`
   carries `description: string` AND `consequences: EventConsequence[]`.
   Source for consequences:
   - NPC dialogue: derive from `DialogueChoice.effect` fields
     (`grantCurrency` → `{ kind: 'currency', amount: e.grantCurrency }`,
     `moralDelta` → `{ kind: 'moral', amount: e.moralDelta }`,
     `startQuest` → `{ kind: 'quest-start', label: e.startQuest }`,
     `teachSkill` → `{ kind: 'skill-learn', label: e.teachSkill }`,
     `setFlag` → `{ kind: 'flag', label: e.setFlag }`,
     `progressQuest` → `{ kind: 'quest-progress', amount, label }`,
     `completeQuest` → `{ kind: 'quest-progress', label }`).
   - Combat-prelude: synthetic — `[{ kind: 'damage', amount: encounter.enemy.health }]` is not derivable cheaply; instead, emit `[]` (the engine resolves combat). The "preview" for combat-prelude is the foe name in `body`.
   - Rest: `[{ kind: 'heal', amount: event.healed }]`.
   - Gather / treasure: `[{ kind: 'item', label: item.name }, ...]`.
   The screen renders consequence chips beneath each choice (Q2's stated goal).

3. **Slug → asset map (Spec Q3 = B):** Mobile-local. Lives in
   `state/presenters/event-assets.ts`. Pure mapping; no engine
   call. Slugs are stable strings the screen switches on. If
   engine later ships an `art:` field on `ProcessedEvent`, the
   presenter swaps to read it without touching the screen.

4. **Mid-combat events (Spec Q4 = Future spec):** Out of scope.
   This phase will explicitly NOT subscribe to events while
   `selectIsInCombat === true`. The store-level slice will
   short-circuit `processCurrentNode` if `combat !== null`.

5. **Skip button (Spec Q5 = Yes):** VM exposes `canSkip: boolean`.
   `true` when `body.length > 240` AND `kind === 'narrative-choice'`
   AND there is only one possible choice OR the event is
   auto-resolved (rest / treasure / gather). For real branching
   dialogue (npc with `visibleChoices.length > 1`), `canSkip`
   is `false` — skipping a choice would require the player to
   make the call. Skip dispatches `eventActions.dismissEvent()`
   without selecting a choice.

6. **Folder location:** `app/event/index.tsx` (not
   `app/(tabs)/event/index.tsx`). Spec 08's "Move event.tsx
   into a folder" predates Phase 14 (`5dd597b`) which moved
   the event screen **out** of `(tabs)/` and behind a
   `fullScreenModal` Stack.Screen. The folder lives at the
   route-tree root, not under tabs.

7. **No legacy fixture left behind:** The fixture VM blob
   currently inside `event.engine.ts` (`STUB_VM`) is **deleted**,
   not migrated. Tests build fixtures from real
   `ProcessNodeResult` shapes returned by deterministic
   engine calls (see Verify gate).

8. **No `app/(tabs)/*` mutation:** Phase 6 does NOT modify any
   file under `app/(tabs)/`. The exploration screen's
   `moveToAction` already dispatches the engine's world-move;
   wiring `processNode` into that dispatch chain is a Phase 26
   (presenter stubs) / Phase 23 (MapEvents consumer, candidate)
   concern, not this phase.

9. **Coordinate with Crucible:** `app/_layout.tsx` and
   `state/e2e/route-tree.engine.test.ts` were modified in
   commit `261a238` "Token Crucible port" (now Status block
   Phase 17). Phase 6 does NOT need to edit `app/_layout.tsx` —
   the event stack screen is already registered. The
   `route-tree` test patch for `app/event/index.tsx` rebases
   on top of the Crucible changes already in place.

## SEO / metadata / output schema

N/A — mobile binary surface, no SEO. Output schemas:

- `EventViewModel` is the locked output schema; pinned by
  `state/e2e/event.engine.test.ts`.
- `ProcessNodeResult` is the engine input schema; pinned by
  the engine package.

## Hero / body / sub-section composition

For `kind: 'combat-prelude'`:

```
+-----------------------------+
| <BADGE> (e.g. "ENCOUNTER")  |
+-----------------------------+
| <ART by artSlug>            |   <- EncounterIllustration / BossIllustration
+-----------------------------+
| <title>                     |   <- engine enemy name or boss epithet
| <subtitle>                  |
| <body>                      |   <- prose, 1-3 short paragraphs
+-----------------------------+
| [FIGHT]   [FLEE]            |   <- choices, vertical on mobile
| [SNEAK]   [PARLEY]          |
+-----------------------------+
```

For `kind: 'narrative-choice'`:

```
+-----------------------------+
| <BADGE>                     |
+-----------------------------+
| <ART by artSlug>            |   <- Npc / Rest / Gather illustration
+-----------------------------+
| <title>                     |
| <subtitle>                  |
| <body>                      |   <- may be long; SKIP button if canSkip
+-----------------------------+
| [Choice 1 - description]    |   <- + consequence chips
|   [+5 morale] [-3 HP]       |
| [Choice 2 - description]    |
|   [Quest: ...] [Flag: ...]  |
+-----------------------------+
| <lore quote, italic>        |   <- if non-null
+-----------------------------+
```

## Empty / loading / error states — copy locked

| State | Trigger | Behaviour |
|---|---|---|
| Empty | `selectHasActiveEvent === false` AND user lands on `/event` manually | Render placeholder: title `'NO EVENT IN PROGRESS'`, body `'Walk on. The world has not yet stirred.'`, single choice `'BACK'` → `router.back()` |
| Loading | `pending === null` AND `processCurrentNode` mid-flight | Render `<ScreenBg>` only (no inner content); duration is sync (engine call) so this should flicker briefly or not at all |
| Error | `processNode()` throws | Caught by `eventActions.processCurrentNode`; emit log entry; render empty state; `[needs-user-call]` row filed via `console.warn` (not crash) |
| Combat-active short-circuit | `selectIsInCombat === true` | `processCurrentNode` no-ops; events do not stack on top of combat (Q4) |

No copy is added that is not already in this brief. Any prose
in `body` / `subtitle` / `title` is engine-supplied or
mobile-mapped (rest / gather only) per the consequences table
above.

## Mobile reflow / responsive / paginate / output limits

- Choice rows: 2 columns on `width >= 360px`, single column below. Use existing `<View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>` pattern from `app/event.tsx:170`.
- Body text: `numberOfLines` unbounded; the `canSkip` button gates "too long" prose without truncation.
- Consequence chips: max 3 visible per choice; overflow renders `[+N more]` chip. Implementation: slice on render.
- Lore quote: italic, `fontSize: 11`, max 200 chars; truncate with ellipsis.
- Illustration aspect: viewBox 374x320 (encounter) or 374x360 (boss) — preserved from current code; `width="100%" height="100%"` scales to container.

## Pages x tests matrix

| Surface | Test file | Cases |
|---|---|---|
| `selectEventViewModel` | `state/e2e/event.engine.test.ts` (rewritten) | (1) fresh game -> `selectHasActiveEvent === false`, VM is empty placeholder, (2) `ProcessNodeResult.event.kind === 'encounter'` fixture -> VM `kind === 'combat-prelude'`, variant matches `isBoss`, (3) `kind === 'npc'` with `DialogueTree` fixture -> VM `kind === 'narrative-choice'`, choices map from visibleChoices, consequences derive from `effect`, (4) `kind === 'rest'` -> single-choice VM with healed amount as consequence, (5) `kind === 'gather'` with items -> consequences populated from items, (6) deep-freeze invariant (existing) |
| `eventActions.pickChoice` | new section in `state/e2e/event.engine.test.ts` | (a) narrative-choice pick -> `applyDialogue` called with engine choice; cursor advances if `nextNode !== null`, clears if `null`, (b) combat-prelude `'fight'` pick -> `startCombat` called with `encounter.enemy`, pending clears, (c) auto-resolve pick on rest/treasure/gather -> pending clears, no engine dispatch beyond what `processNode` already did, (d) skip -> `dismissEvent` clears state without dispatch |
| `selectHasActiveEvent` | same file | (i) `pending === null` -> false, (ii) `pending.event.kind === 'none'` -> false, (iii) `pending.event.kind === 'encounter'` -> true, (iv) combat-active short-circuit |
| `selectEventArtSlug` | new `state/e2e/event-assets.test.ts` | each `ProcessedEvent.kind` -> expected slug; exhaustive switch |
| Screen render | `state/e2e/event.screen.test.tsx` (new) | (alpha) renders combat-prelude with fight/flee choices visible, (beta) renders narrative-choice with consequence chips, (gamma) tapping a choice fires `eventActions.pickChoice` with the right id, (delta) skip button visible iff `canSkip`, (epsilon) empty state renders when `selectHasActiveEvent` false |
| Route tree | `state/e2e/route-tree.engine.test.ts` (patched) | `app/event/index.tsx` present; old `app/event.tsx` absent; `event` route still registered as fullScreenModal |
| Navigation badge | (not in scope this phase) | Phase 17 / 19 follow-on |

All tests are hermetic per `docs/testing.md` — no live engine
state outside `createGameStore(createMemoryAdapter())`; choice
dispatches happen against fresh stores.

## Sub-tick decomposition (for `/ship-a-phase`)

The brief is one phase; `/ship-a-phase` may take sub-ticks if
verify-gate green can land between them. Suggested split:

- **Tick A (~1-1.5 ticks):** presenter + store slice. Rewrite
  `state/presenters/event.engine.ts` against fixture
  `ProcessNodeResult`. Add `event` slice to `state/store.ts`.
  Add `selectEventArtSlug` mapper. Rewrite e2e VM shape tests
  with fixtures. **Verify green; no screen change yet.**

- **Tick B (~1-1.5 ticks):** action layer. Add `eventActions`
  block to `state/actions.ts` (`processCurrentNode`,
  `pickChoice`, `dismissEvent`). Add action-layer e2e cases.
  **Verify green; screen still renders against STUB VM via
  feature-flag fallback OR via the rewritten presenter against
  a `null` pending.**

- **Tick C (~1 tick):** screen refactor. Move `app/event.tsx`
  -> `app/event/index.tsx`. Extract illustrations into
  `app/event/components/`. Wire VM consumption + consequence
  chips + skip button. Add `event.screen.test.tsx`.

- **Tick D (~1/2 tick):** route-tree patch + spec close-out.
  Update `state/e2e/route-tree.engine.test.ts`. Tick the Spec 08
  acceptance checklist. Flip Phase 6 `[ ]` -> `[x]` with the
  final commit hash. **`selectHasActiveEvent` flips to engine
  truth here** — this absorbs Status block Phase 19's scope.
  If Tick D ships green, Phase 19 closes as drained-by-Phase-6
  in the same commit; if Tick D is deferred, Phase 19 ships
  standalone.

If `/ship-a-phase` reaches verify-red between sub-ticks, halt
and re-plan; do not stack work on a red gate.

## Verify gate

```bash
pnpm verify        # lint + tsc --noEmit + jest
```

Target: full suite green. Current baseline is 287 / 287 at
commit `e521e2f` (per AUDIT.md). Expected delta after Phase 6:

- `+8 / -3` tests in `event.engine.test.ts` (rewritten with fixtures)
- `+6` tests in `event.screen.test.tsx` (new)
- `+8` tests in `event-assets.test.ts` (new, one per `ProcessedEvent` kind)
- `+1` test in `route-tree.engine.test.ts` (`app/event/index.tsx` row)

Approx **+20 / -3 = ~305 hermetic** after ship. The exact
delta depends on Crucible WIP — if `route-tree.engine.test.ts`
was already extended for `app/crucible.tsx`, the +1 here is
additive.

## Deploy gate

```bash
pnpm deploy:check
```

Stub exits 0 (deploy is opt-in via EAS Build; Phase 11 wired
the contract). No deploy-side change for Phase 6.

## Commit body template

For the canonical "Tick C" commit (the bulk of the screen work):

```
feat(spec08): wire event screen to engine via selectEventViewModel

- app/event.tsx -> app/event/{index.tsx, components/*.tsx}
- state/presenters/event.engine.ts rewritten: composes EventViewModel
  from ProcessNodeResult + DialogueTree cursor; selectHasActiveEvent
  reads engine truth
- state/presenters/event-assets.ts: mobile-local slug->art mapper
  (Spec 08 Q3=B)
- state/actions.ts: eventActions { processCurrentNode, pickChoice,
  dismissEvent }; dispatches startCombat or applyDialogue based on
  VM kind
- state/store.ts: event slice (pending: ProcessNodeResult|null,
  dialogueCursor, history)
- VM choices carry both human description AND machine-readable
  consequences (Spec 08 Q2=C)
- canSkip flag drives the skip-button affordance over long bodies
  (Spec 08 Q5=Yes)
- mid-combat events out of scope (Spec 08 Q4=Future spec)
- e2e: event.engine.test.ts rewritten with ProcessNodeResult fixtures;
  event.screen.test.tsx new; event-assets.test.ts new; route-tree
  patched
- verify green: N hermetic tests

Closes #<phase-mirror-issue>
```

## Definition of Done

After all sub-ticks land:

1. `app/event.tsx` is deleted; `app/event/index.tsx` is the route.
2. `selectEventViewModel` returns a real VM composed from engine state — no `STUB_VM` blob anywhere.
3. `selectHasActiveEvent` reads `state.event.pending` instead of returning `false`.
4. `eventActions.pickChoice` dispatches `applyDialogue` or `startCombat` per VM `kind`; deep-equality e2e proves the engine call shape.
5. Procedural illustrations live under `app/event/components/`; the screen switches on `artSlug`.
6. `specs/08-event-screen-wiring.md` Acceptance checklist all five boxes ticked; H1 carries `[DONE on <date> — see commit <sha>]`.
7. Phase 6 row in `plan/steps/01_build_plan.md` flipped `[ ]` -> `[x]` with the final commit hash.
8. Phase log entry appended (after the Per-phase scope section in `01_build_plan.md` per existing convention).
9. `plan/PHASE_CANDIDATES.md` Phase 18 row (cross-repo audit Block I) marks as drained — link to the Phase 6 commits in its `## Drained via /iterate` analogue (or note inline).
10. `pnpm verify` green; full hermetic suite passes.

## Follow-ups (out of scope this phase)

- **`'shop'` ProcessedEvent handling.** Engine emits this kind for shop nodes; mobile renders nothing today. Future spec — needs a separate shop UI surface, not a narrative-choice subtype.
- **Navigation badge for active events.** `state/presenters/navigation.engine.ts` carries a stub `TODO: When engine exposes a way to check for active events` (now resolvable via `selectHasActiveEvent`). Status block Phase 26 drains this.
- **`moveToAction` -> `processNode` integration.** Exploration's `moveToAction` in `state/actions.ts` currently re-implements unlock propagation locally. Candidate Phase 23 (MapEvents engine consumer) swaps this to `processNode`, at which point Phase 6's event slice receives data automatically. Until then, `eventActions.processCurrentNode()` is dispatched explicitly from the exploration screen after a successful move.
- **`MapEvent` (8 kinds) full coverage.** Today `ProcessedEvent` discriminates only on the 8 enum cases; richer `MapEvent` typing (engine phases 23 / 24 / 25 on the engine side) gives finer presenter mapping — candidate Phase 23 (mobile-side consumer).
- **Combat-prelude richer choices.** Engine encounter result only carries the foe; FIGHT/FLEE/SNEAK/PARLEY are not engine-modelled (the SNEAK/PARLEY rows in the current `EVENT_DATA.encounter` are mock-only). Phase 6 ships FIGHT/FLEE only on combat-prelude; SNEAK/PARLEY wait for engine support.
- **`selectMoralMeter` surfacing.** Status block Phase 26 (presenter-stub drain). Not blocking event wiring.
