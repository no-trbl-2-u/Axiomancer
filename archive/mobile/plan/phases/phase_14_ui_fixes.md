# Phase 14 — UI Fixes: Event Modal + Character Crash

## Context

Three issues from `notes-on-ui.md`:

1. The UI was originally wired as a design-system demo — screens were connected as examples before real gameplay logic existed.
2. "Event" should not be a permanent tab. It should appear as a modal when triggered by game state (same pattern as combat).
3. The Character tab crashes on render.

---

## Issue 1 — Event tab → full-screen modal

### Problem

`app/(tabs)/event.tsx` is registered as a permanent tab (title: "EVENT", icon: scroll). Events in the game are transient narrative moments — encounters, boss introductions, lore drops — not a place the player navigates to. The tab makes it look like a persistent destination.

### Target state

- No EVENT entry in the tab bar (4 tabs: MAP, COMBAT, SHEET, SACK).
- The Event screen appears as a full-screen modal when an event is active in game state.
- Dismissing the modal returns the player to whatever tab they were on.
- The existing `event.tsx` demo content (encounter/boss toggle) is preserved for now, since the real event system (Spec 08) hasn't landed yet.

### Implementation

**Step 1 — Move the screen out of the tab group**

Move `app/(tabs)/event.tsx` → `app/event.tsx` (or `app/(modals)/event.tsx`).

Add a `Stack.Screen` for it in `app/_layout.tsx` with modal presentation:

```tsx
<Stack.Screen
  name="event"
  options={{ headerShown: false, presentation: 'fullScreenModal' }}
/>
```

**Step 2 — Remove from tab bar**

In `app/(tabs)/_layout.tsx`, delete the `<Tabs.Screen name="event" …/>` entry entirely.

Also remove the `event` badge from `selectTabBadges` in `state/presenters/navigation.engine.ts` — it no longer makes sense on a tab that doesn't exist.

**Step 3 — Add an event-active selector**

In `state/presenters/event.engine.ts`, add:

```ts
export function selectHasActiveEvent(state: GameStore): boolean {
  // Spec 08 will populate state.activeEvent. Until then, always false.
  return false;
}
```

**Step 4 — Auto-navigate to modal when event becomes active**

Inside `app/(tabs)/_layout.tsx` (or a small `EventGate` component mounted inside the `<GameStoreProvider>`), watch the selector and push the route:

```tsx
const hasEvent = useGameState(selectHasActiveEvent);
const router = useRouter();

useEffect(() => {
  if (hasEvent) router.push('/event');
}, [hasEvent]);
```

Because the selector returns `false` until Spec 08 lands, this is a no-op in the current build. The modal can still be reached manually via the router for demo/testing purposes.

**Step 5 — Remove variant toggle from event screen (deferred)**

The ENCOUNTER / BOSS toggle buttons are a demo artifact. Leave them in place for now — they're useful for testing the UI before the real engine fires events. File a follow-up to strip them when Spec 08 wires live events.

### Acceptance criteria

- [x] EVENT tab is not visible in the tab bar (neither in combat nor out-of-combat).
- [x] Navigating to `/event` manually renders the event screen as a full-screen modal.
- [x] Closing the modal returns to the previous tab without error.
- [x] `selectHasActiveEvent` returns `false` by default (no regression).
- [x] Badge removal doesn't break `selectTabBadges` type shape.

---

## Issue 2 — Character tab crash

### Problem

`selectCharacterViewModel` in `state/presenters/character.engine.ts` accesses `(player as any).derivedStats` and `(player as any).nonCombatStats` without null guards. The `Character` type declares these as required fields, but a persisted save from an older engine version may lack them — causing an unhandled exception on property access and crashing the render.

### Root cause (lines 125–147 of `character.engine.ts`)

```ts
function buildDerived(player: Character) {
  const d = (player as any).derivedStats;          // can be undefined on old saves
  return [
    { label: 'PHYSICAL', attack: d.physicalAttack, … }, // 💥 if d is undefined
    …
  ];
}

function buildSaves(player: Character) {
  const n = (player as any).nonCombatStats;        // same risk
  return [
    { label: 'Body Save', value: String(n.physicalSave) }, // 💥
    …
  ];
}
```

### Fix

Add null-safe fallbacks in both builder functions. When a field is missing, display `—` or `0` rather than throwing.

```ts
function buildDerived(player: Character): readonly DerivedStatRow[] {
  const d = (player as any).derivedStats ?? {};
  return [
    { label: 'PHYSICAL', attack: d.physicalAttack ?? 0, skill: d.physicalSkill ?? 0, defense: d.physicalDefense ?? 0 },
    { label: 'MENTAL',   attack: d.mentalAttack   ?? 0, skill: d.mentalSkill   ?? 0, defense: d.mentalDefense   ?? 0 },
    { label: 'EMOTIONAL',attack: d.emotionalAttack ?? 0, skill: d.emotionalSkill ?? 0, defense: d.emotionalDefense ?? 0 },
  ];
}

function buildSaves(player: Character): readonly SaveOrTestRow[] {
  const n = (player as any).nonCombatStats ?? {};
  const sign = (v: number) => (v >= 0 ? `+${v}` : `${v}`);
  return [
    { label: 'Body Save',  value: String(n.physicalSave  ?? 0) },
    { label: 'Mind Save',  value: String(n.mentalSave    ?? 0) },
    { label: 'Heart Save', value: String(n.emotionalSave ?? 0) },
    { label: 'Body Test',  value: sign(n.physicalTest    ?? 0) },
    { label: 'Mind Test',  value: sign(n.mentalTest      ?? 0) },
    { label: 'Heart Test', value: sign(n.emotionalTest   ?? 0) },
  ];
}
```

Also guard the `luck` line in `selectCharacterViewModel` (already done: `?? 0` at line 189 — confirm it's still there).

### Why not fix the type instead of guarding?

`derivedStats` is non-optional on the `Character` type, so TypeScript believes it's always present. The real fix is a migration that backfills missing fields on load (see `state/persistence/`). But that's a separate concern and shouldn't block this fix — the null guard is cheap insurance and causes no regression on correctly-structured saves.

### Acceptance criteria

- [x] Tapping the SHEET tab does not crash.
- [x] Character screen renders with `0` values when `derivedStats` / `nonCombatStats` are missing.
- [x] Character screen renders correct values when engine state is fully populated.
- [x] Existing character presenter tests still pass.

---

## Out of scope

- Wiring real events from the engine to the modal (Spec 08).
- Removing the encounter/boss demo toggle from `event.tsx`.
- Persistence migration to backfill missing `derivedStats`/`nonCombatStats` on old saves.

## Suggested ship order

1. Character crash fix (self-contained, highest user impact — the tab is dead today).
2. Event modal (structural change to nav — test in dev before shipping).
