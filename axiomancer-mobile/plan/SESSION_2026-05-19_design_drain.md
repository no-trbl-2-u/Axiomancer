# Session retro — 2026-05-19 design-spec drain

> Written 2026-05-19 via `/oversight` 6th call. Covers a multi-hour
> autonomous-loop session that drained the Claude Design handoff
> bundle from un-shipped → fully-shipped across 17 phases + 1
> regression test + 2 critique passes.

## The arc

**Starting state (start of 2026-05-18 session):**
- Phase 32 was the rolling design-port phase, sub-ticks A–D shipped.
- 459 hermetic tests.
- Design handoff existed but wasn't vendored in-repo (loop couldn't fetch claude.ai/design — auth-gated).

**Ending state (end of 2026-05-19 session):**
- Phase 32 closed `[x]` (8 sub-ticks A–H shipped).
- Phases 34–49 all `[x]` (16 fresh phases, factored out of Phase 32's rolling contract so `/march` could dispatch `/ship-a-phase` autonomously).
- 535 hermetic tests (+76).
- Design handoff bundle vendored at `design/handoff-2026-05-16/` (456KB, 24 files including 3 chat transcripts).
- 0 CRITIQUE Pending, 1 AUDIT Pending (engine-gated; immovable from mobile).
- `design-spec.md` items 1–13 + audits all shipped. Item 4 (cold-codex)
  remains in `PHASE_CANDIDATES.md` as the only un-shipped surface;
  item 14 (day counter) is engine-gated.

## Phases shipped this session

Listed in commit order with the design source they ported / closed-out.

### Phase 32 — UI refresh from Claude Design handoff (rolling port)

- **Tick E** — Inventory Equipment Dock. User port `02beaeb` (paper-doll silhouette + 7 slot cards in 4-row grid). Loop follow-up `2a23047` extracted `EquipmentDockViewModel` onto the presenter + added hermetic tests.
- **Tick F** — Inventory slot filter. User port `9c6024d` (tap-slot-to-filter UX from chat 1 iteration 2). Loop follow-up `cc38107` extracted slot-filter onto `InventoryLocalUi.selectedSlot` + banner chrome on the dock VM.
- **Tick G** — Per-slot ItemGlyphs. Single user port `05127df` ported 5 bespoke SVG paths (helmet / gauntlet / boot / breastplate / ring) from `design/handoff-2026-05-16/.../inventory.jsx:513-541`. Self-contained; no separate loop follow-up needed.
- **Tick H** — Exploration node toast. Single user port `d7489a2` added `'this way is sealed'` / `'walked already'` toasts on locked / completed node taps from `prototype.jsx:29-39` flow.

### Phase 34 — Routing + gesture regression check

Commit `f43374c`. Source-grep hermetic test (`state/e2e/route-registration.engine.test.ts`) pinning:
1. `GestureHandlerRootView` imports + wraps the root layout's JSX
2. Every `<Tabs.Screen name="X">` matches a real expo-router route ID under `app/(tabs)/`
3. No short-form name used where a folder route exists

Filed in response to user-reported runtime bug (commit `3a14f5f`) where `(tabs)/_layout.tsx` used `name="exploration"` etc. but expo-router v6 registers folder routes as `<dir>/index` — the layout config silently failed to apply, tabs rendered with "WILDS --index" fallback labels, and `<GestureDetector>` threw because no wrapper was installed.

### Phase 35 — Inventory equip-preview stat deltas

Commit `82da641`. Added `replacePreview: ReplacePreview | null` to `InventoryItemRow`. Presenter `buildRows` runs a second pass computing signed deltas from `Equipment.statModifiers` (skips multipliers for v1) when a non-equipped equipment item has an equipped sibling in the same slot. Screen renders a blood-rail block on expanded ItemCards with REPLACES eyebrow, strike-through old → arrow → new name, plus NET row of stat-delta chips (sulfur for positive, blood for negative). +6 hermetic tests.

### Phase 36 — Inventory equip-replace label

Commit `e0610ae`. `ItemModalViewModel` gains `replacingName: string | null`. `buildEquipmentModal` branches three ways: `'WORN'` when target is equipped, `'EQUIP · REPLACE <NAME>'` when replacing a sibling, `'EQUIP'` when bare-slot. New `findEquippedInSlot` helper. +1 hermetic case (test fixture reshaped).

### Phase 37 — Inventory item slot tag

Commit `c5bc945`. Small `SLOT · <NAME>` mono eyebrow on every collapsed equipment ItemCard. Hidden when expanded (the expanded "WOULD EQUIP TO" block covers the same affordance). No presenter changes — reads existing `row.sub` field uppercased.

### Phase 38 — Combat phase-stack collapse close-out

Commit `b81bc80`. Audited and discovered the design's vertical-collapse behavior was largely shipped via Phase 32 tick C. Discovery: the JSDoc claim that "action and skill are not buffered across phase changes" was stale — the engine preserves `playerChoice.action` across phase changes, so past-action rows DO surface their committed value. +2 hermetic cases pinning past-action summary + future-row empty summary; JSDoc refreshed.

### Phase 39 — Diegetic-stack backdrop opacity

Commit `5e3a7fd`. Tuned `EncounterModalOverlay`'s backdrop fill from `rgba(10,10,10,0.85)` to `rgba(10,10,10,0.65)` per chat 2 §IV ("map persists at 35% opacity behind every modal"). Mirrors prototype.jsx:454.

### Phase 40 — Event-shell distinction audit + bug fix

Commit `624a6a7`. Audit found a real shell-double-mount regression: `EventGate` was pushing `/event` on every active event regardless of kind, while exploration separately mounted `EncounterModalOverlay` for combat-prelude events. The two would mount simultaneously. Fix: new `selectHasActivePacedEvent(state)` selector — true only for `narrative-choice` events. EventGate now reads the paced-only selector. +3 hermetic tests (mutex with combat-prelude, mid-combat short-circuit).

### Phase 41 — Combat aftermath banner

Commit `c3b1188`. Three parts:
- New `components/AftermathBanner.tsx` (parchment-on-panelBg panel, sulfur 1px border, 2500ms auto-dismiss).
- Extended `state/combat-mode.tsx` with `lastOutcome: CombatOutcome | null` signal (`'victory' | 'defeat' | 'flee' | 'parley'`) + `exitCombatWith()` + `clearLastOutcome()` API. `enterCombat()` resets the signal so a stale outcome can't race the next aftermath.
- Combat screen `onContinueRound` branches outcome on engine state (friendship-max → parley, enemy HP ≤ 0 → victory, player HP ≤ 0 → defeat); early DEPART path stays silent on plain `exitCombat`.
- Exploration screen mounts banner only for victory + parley (defeat/flee silent).

+6 hermetic combat-mode tests using `@testing-library/react-native` `renderHook` pattern.

### Phase 42 — Combat-tab mutex extension

Commit `c55544b`. New `selectHasActiveCombatPrelude(state)` selector — true when there's a pending combat-prelude event. `(tabs)/_layout.tsx` OR's it with `inCombat` and passes to `isTabHidden`, so the WILDS slot flips to STRIFE the moment the encounter modal mounts (not at FIGHT commit). Mirrors prototype.jsx:42. +4 hermetic cases.

### Phase 43 — Encounter modal boss kneel/strike

Commit `56725ae`. `composeCombatPrelude` relabels FIGHT → STRIKE and FLEE → KNEEL when `isBoss` is true. Choice IDs stay `'fight'` / `'flee'` so existing handlers still dispatch. KNEEL stays engine-disabled (no "submit to boss" mechanic yet). +2 hermetic cases.

### Critique pass 16

Commits `fd410cc` + `5fd6fd8`. Reader walked Phases 34–43, surfaced 2 real findings (both Phase 41 follow-ups), both drained inline:
- MED: aftermath banner display literals lifted onto presenter via new `selectAftermathCopy(outcome)` helper.
- LOW: banner accessibility — added `accessibilityLiveRegion="polite"` + `AccessibilityInfo.announceForAccessibility`.

+4 hermetic cases pinning the per-outcome copy contract.

### Phase 44 — Modal enter animations

Commit `6cf1ebb`. Rise (translateY 20→0 + opacity 0→1, 280ms ease-out) on `EncounterModalOverlay` (separate backdrop-fade + panel-rise) and `AftermathBanner`. Fade (opacity 0→1, 200ms) on extracted `<NodeToast>` subcomponent. All use `react-native-reanimated` 4.1.1 `withTiming` + `useSharedValue` + `useAnimatedStyle`. Mirrors `prototype.jsx:632-638` keyframes.

### Phase 45 — Event-modal action-button subtitles

Commit `a18c248`. New `subtitle: string | null` field on `EventChoice`. Combat-prelude composer populates with `'<roman level> · <roman hp> vitae · adv. unknown'` (FIGHT) / `'forfeit the path · -ii morale'` / `'sealed · no retreat'` (FLEE; non-boss / boss). Local `toRomanLowerEvent` helper. EncounterModalOverlay renders subtitle under each label. +3 hermetic cases.

### Phase 46 — Paced-event kind-meta variants

Commit `c68f166`. Refreshed eyebrow + title copy on all 5 paced-event composers per design's kindToMeta table: rest ('A FIRE LOWERS' / 'THE STONE HEARTH'), gathering ('A SMALL HARVEST' / 'A STAND OF MIRE-MINT'), loot-cache ('A FOUND THING' / 'A BURIED CHEST'), interaction ('INTERACTION'), village ('A SETTLEMENT'). Engine kind vocabulary already covered all 5 surfaces. +1 hermetic case.

### Phase 47 — Stance-picker gloss copy

Commit `faf256f`. Audit found gloss copy entirely absent. Added `gloss: string` to `StanceOption`; new `STANCE_GLOSS` map (heart='parley, mercy', body='iron, force', mind='cipher, ruse'); `buildStanceOptions` populates. Screen renders italic-serif bone-color gloss between label and BEATS/WEAK row. +1 hermetic case.

### Phase 48 — EncounterModalOverlay panel position

Commit `ea37425`. Audit found 4px drift: current `bottom: 80` vs design `bottom: 84`. Tightened.

### Phase 49 — Token Crucible inline strip placement

Commit `542ff61`. Audit found placement gap — full TokenCrucible existed at `/crucible` route but the design's compact "above-the-action-picker strip with OPEN ▸ button" was never wired into combat. Shipped: new `<CrucibleStrip>` component at top of `ActionPhase`. CRUCIBLE eyebrow + 5 token chips (mock pool until engine exposes `player.tokens`) + OPEN ▸ button routing to `/crucible`.

## Architectural decisions

### Cascade-cadence gate (oversight 2026-05-18 + tighten 2026-05-19)

The `/iterate` cascade to `/expand` was firing every tick when the loop went idle, producing identical `expand: pass N — no candidates` heartbeat commits. Two-stage tightening:

1. First pass: skip cascade when last expand pass was <12 commits AND <6h ago.
2. Second pass: dropped the <6h time threshold entirely. Gate now releases only on the commit-count condition. Loop stays silent indefinitely during true idle.

Lives in `skills/expand.md` Step 0.5 + cross-referenced from `skills/iterate.md` §6.6.

### Combat-mode outcome signal (Phase 41)

The aftermath banner needed a way to know "did we just exit combat victoriously" without coupling the exploration screen to engine combat state directly. Added a one-shot `lastOutcome: CombatOutcome | null` signal on the `combat-mode` context with a paired `clearLastOutcome()`. The signal is reset on `enterCombat()` to prevent stale-state races. Combat screen branches on engine state to call `exitCombatWith(outcome)` on the way out.

### Paced-only EventGate (Phase 40)

The Phase 40 audit surfaced a real double-mount: `EventGate` was routing every active event to the full-screen `/event` route via `selectHasActiveEvent`, but combat-prelude events render in-place via `EncounterModalOverlay`. Fix added a narrower selector `selectHasActivePacedEvent` (true only for narrative-choice kind) that EventGate reads instead. The original `selectHasActiveEvent` stays exported for consumers that legitimately need "any active event" (tab badges, prelude chrome).

### Phase 32 dispatch-rule grammar (oversight 2026-05-19)

The second design URL the user shared introduced the phrase `port design spec` instead of the original `port from design handoff`. Updated Phase 32's dispatch rule to match either phrase so historic Tick A–F commits keep parsing.

## Open follow-ups

| Item | Status | Where tracked |
|---|---|---|
| Cold-codex aesthetic toggle | Phase 25 candidate | `plan/PHASE_CANDIDATES.md` |
| Day counter in exploration eyebrow | Engine-gated | `design-spec.md` item 14 |
| Engine-handoff issue (skillLibrary re-export + types.d.ts emission + PersistenceAdapter ergonomics) | Local at `/tmp/engine-handoff-body.md`; not yet filed in `axiomancer-mechanics` | `docs/engine-team-handoff-2026-05-16.md` |
| Phase 16 / 20 / 21 skill-resolution work | `[skipped]` pending engine 0.7.1 republish with re-export fixes | `plan/steps/01_build_plan.md` |
| Hardcoded FIGHT/FLEE labels in EncounterModalOverlay | Pre-existing tech debt noted in `feat(spec45)` commit body; not pulled in | _no formal tracking_ |
| Real rewards data on AftermathBanner | Engine doesn't expose per-fight XP/loot yet | `feat(spec41)` commit body |
| Skill-row summary in combat phase-stack | Engine exposes id but no library-label helper yet | `feat(spec38)` commit body |
| Crucible inline strip wired to real engine token state | Mock pool until engine ships `player.tokens` | `feat(spec49)` commit body |

## Numbers

- **17 phases shipped** (Phase 32 ticks E–H + Phases 34–49).
- **2 critique passes** (pass 15 + pass 16) with 5 total findings, all drained.
- **3 expand passes** (26 + 27 + 28) — passes 26-27 fired before the gate tighten; pass 28 fired after the 16-phase drain.
- **6 oversight calls** — each one course-corrected against the prior cycle.
- **76 net new hermetic tests** (459 → 535).
- **Bundle vendored:** `design/handoff-2026-05-16/` (456KB, 24 files).
- **Cron cadence:** 15 minutes; manual `/march` invocations + cron firings combined.

## What worked

- **Detect-and-defer dispatch on Phase 32** made the rolling-port pattern actually behave like a rolling port — the loop never invented a port from the design URL it couldn't fetch.
- **Phase factoring at the 5th oversight call** (Phase 32 → Phases 34–49) unblocked the loop's autonomous shipping. Before that the loop was waiting on user port commits; after, it picked phases off the queue.
- **Cascade-cadence gate** killed noise commits during true idle.
- **Audit phases (47–49) were not 0-LOC** as filed — three of them found real drift, two of them shipped real fixes. Auditing in a structured phase is more reliable than ad-hoc reviews.

## What didn't

- **The 6h heartbeat in the first gate revision** still produced no-op commits every ~6h. The second oversight call dropped the time threshold entirely; a single-knob gate is easier to reason about.
- **Engine-handoff issue stayed local for 6 oversight calls.** Cross-repo gh issue creation is blocked by the auto-mode classifier; needs a manual `! gh ...` paste each time. Should be a saved harness command or a permission rule.
- **Phase 49's "0-LOC audit"** turned out to need a substantial new component (`<CrucibleStrip>`). The phase queue underestimated the scope; the audit phases (47–49) should have been filed with a "0-LOC OR follow-up port" disclaimer.

## How to resume

```bash
# Re-arm the autonomous loop
/loop 15m /march
```

The cron picks the next pending phase. With the queue currently empty, the first non-silent tick will fire `/critique` pass 17 at +2 more commits past `56725ae` (which was the last critique-pass-16 commit) or +20h elapsed.

To add work:
- Manual port: commit with subject `feat: <surface> — port design spec` or `port from design handoff`. Phase 32 stays closed but the dispatch rule still matches the phrase; you'd file a fresh phase row or just let `/critique` surface the change.
- Promote a candidate: `/oversight`, pick "Promote Phase 25 (cold-codex)" or file a new candidate.
- Fresh design bundle: drop a new URL into chat; the WebFetch path extracts gzipped bundles into `/tmp/design-handoff-N/`.
