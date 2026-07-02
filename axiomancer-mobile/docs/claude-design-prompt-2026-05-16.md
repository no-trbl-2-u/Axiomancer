# Claude Design prompt — Axiomancer Mobile UI/UX rework

> **HISTORICAL (2026-05-16).** Describes the pre-Phase-137 event
> architecture (one generic modal for every paced kind). Since
> 2026-06-12, every encounter kind has a dedicated surface; the
> modal is a defensive fallback only. Kept as the design-handoff
> record.

> Authored 2026-05-16 to hand off to Claude Design
> (<https://claude.ai/design/p/019e0f5a-a0f0-753b-be1e-8939e6011384>)
> for the Phase 32 design refresh. Paste the section below into
> the design board verbatim. Edit freely first if the goal
> framing or focus areas need shifting; everything below the
> horizontal rule is the actual handoff.

---

# Axiomancer Mobile — UI/UX rework

You're designing a comprehensive UI/UX refresh for **Axiomancer Mobile**, a React Native / Expo TTRPG client. The game logic, randomness, and state live in an upstream `axiomancer-mechanics` npm engine that this app cannot modify; the mobile app is the presentation layer on top of it. Every screen you design must be implementable against the engine surface listed below — do not invent fields, screens, or flows that the engine doesn't already produce.

**Source-of-truth note:** This board has accumulated revisions. **Use the current prototype flow** when working through any screen — some earlier mockups in the board are stale and don't represent where the design has landed. When you find a conflict between an early mockup and the prototype flow, the prototype wins.

## Product in one paragraph

A single-player, offline, dark-fantasy TTRPG. Player explores a node-graph world map, triggers stochastic events at each step (encounter / interaction / rest / cutscene / village / hazard / loot-cache), and resolves combat through a stance-action-skill phase loop. Heart / Body / Mind stats are the dice spine; advantage/disadvantage between stances is the tactical lever. Single-player, no online accounts, no UGC. Distributed via EAS Build to TestFlight and Play Internal — there is no web target.

## Goal of this rework

Tighten the UI so the product reads as a **gothic, terse, atmospheric mobile TTRPG** rather than as wireframes-with-art-thrown-on-top. Current state ships every required surface but reads as an assemblage of independent screens; the rework should make the screens feel like rooms in one building.

Specifically:

1. Reduce information density to what the player can read in one tap-to-look. Today many screens cram dense info that's better revealed progressively.
2. Make the **flow between screens** legible. Player taps an encounter node → event modal → combat tab → exploration return. Today each handoff is a hard transition; the design should propose how to soften them.
3. Settle the **navigation chrome** — current bottom-tab labels are `WILDS · STRIFE · SELF · SACK` (just renamed via the last design pass; you can keep or change with rationale). Tab icons currently are eye / sword / crown / bag (placeholder SVGs).
4. Hold the **voice register**: terse, archaic, ritual, *cold and old*. **No second-person archaic pronouns** (thee / thou / thy / thine / ye) — those tip into Renaissance-fair territory.
5. Honor the **dark-only constraint** — this is a gothic TTRPG; there is no light mode. The current palette is near-black background, ivory parchment text, blood red, sulfur yellow, rust orange, bone muted, ash borders.

## The engine surface (what the UI must consume)

Every type below ships from `axiomancer-mechanics@0.7.0`. The UI **renders** these; it does **not** redefine them.

### Core state

```ts
GameState = {
  player: Character
  combat: CombatState | null         // null when not fighting
  inventory: Item[]
  world: WorldState                  // current map, current node, completed/available/locked
  quests: QuestLog
  flags: Record<string, boolean>
  moralMeter: number                 // -100..100 ish
  schemaVersion: number
}
```

### Character

```ts
Character = {
  name: string
  level: number
  experience: number
  experienceToNextLevel: number
  baseStats: { heart: number; body: number; mind: number }
  derivedStats: { /* attack / defense / luck etc., per-stance */ }
  nonCombatStats: { /* perception, stealth, etc. */ }
  inventory: Item[]                  // mirrored at root
  equipment: { head, body, hands, feet, weapon, armor, accessory } // EquipmentSlot[]
  effects: ActiveEffect[]            // buffs / debuffs with duration + intensity
  skills: Skill[]                    // learned skills
  resources: { /* per-resource pools — five tokens, see Token Crucible */ }
}
```

### Combat

The combat loop is a **phase machine**:

```
choosing_stance  →  choosing_action  →  choosing_skill (optional)  →  resolving  →  (back to choosing_stance)
```

- **Stance** is one of `heart | body | mind`. Picked each round.
- **Action** is one of `attack | defend | skill | item | flee`. `flee` is currently a no-op toast.
- **Advantage**: each stance has advantage / disadvantage against another stance (rock-paper-scissors-shaped). Combat surfaces `Advantage` chips per round.
- **Friendship counter**: Heart-stance interactions can fill a friendship track up to `FRIENDSHIP_COUNTER_MAX`; full counter ends the fight in a non-violent resolution.
- **Battle log**: every round emits `RoundEvent`s (RoundStart, ActionRestriction, AdvantageEvent, StanceEffectEvent, ScenarioEvent, RoundEndEvent, ItemPhaseEvent, SkillPhaseEvent, ResourceEvent). The screen lists these as a scroll.
- **End conditions**: victory / defeat / flee — emits `CombatEndReport { outcome, xpGained, loot[] }`.

### Inventory

```ts
Item = Equipment | Consumable | Material | QuestItem
ItemCategory = 'equipment' | 'consumable' | 'material' | 'quest'
EquipmentSlot = 'head' | 'body' | 'hands' | 'feet' | 'weapon' | 'armor' | 'accessory'
ItemRarity = (engine-defined tiers)
```

Inventory also carries `shilling` (currency) and `burden` (encumbrance numerator + max).

### World / Exploration

The map is a node graph: each node has `kind` (rest / gather / current / encounter / treasure / boss / quest / interaction), `x/y` coordinates, `triggersCombat` predicate, and edges to neighbors. The world has `currentContinent`, `currentMap` (with `availableNodes`, `completedNodes`, `lockedNodes`, `consumedNodes`), and the player's `currentNodeId`. Stepping onto a node resolves a `MapEventPayload` (see Events below).

### Events (the modal that fires between map and combat)

```ts
MapEventKind = 'encounter' | 'interaction' | 'gathering' | 'rest' | 'village' | 'cutscene' | 'hazard' | 'loot-cache'
```

Each kind has a typed payload. The event modal renders the appropriate prelude (a "combat is about to start" page with FIGHT/FLEE for encounters, multi-line body for cutscenes, choice tree for interactions, etc.). When the player picks a choice, the engine resolves the event and either pushes to combat / opens a dialogue tree / closes back to exploration.

### Dialogue (inside `interaction` events)

```ts
DialogueTree = { rootId; nodes: DialogueNode[] }
DialogueNode = { id; text; choices: DialogueChoice[]; outcome? }
DialogueChoice = { id; label; visible(state) ; effect(state) }
```

Trees can be deep (multi-step conversations with NPCs in villages).

### Skills (Token Crucible)

The engine ships a five-resource pool (Token Crucible) — when a player uses a skill, the engine spends from the pool per `ResourceCost`. Skills have `category`, `stance` (heart/body/mind), `manaCost`, `target`, `combatEffects`, learning requirements. Currently the mobile app surfaces the Crucible as a standalone modal accessed from the Character screen; the design pass may relocate it.

### Journal surface (MEMOIR)

The mobile app exposes a fifth read-only "journal" tab — MEMOIR — that summarizes four threads of the playthrough without dispatching any engine actions:

- **Chronicle** — recent significant typed events from the mobile `_recentEvents` ring buffer (capacity 20). Reverse-chronological list; one row per recognized event (combat:ended, character:levelup, world:moved continent transitions, dialogue:applied).
- **Errands** — quest list split into active / completed sub-sections. Active quests render their objectives with `✓` / `○` prefixes based on `currentCount >= requiredCount`; completed quests render as dimmed name-only rows (the engine drops the full `Quest` object on completion and keeps just the `QuestName`).
- **Measure** — two adjacent chip-cards: moral alignment (`state.moralMeter` band lookup) + provisional philosophical alignment (placeholder mapping, today derived from the player's highest base stat; real alignments TBD).
- **Wordless Word** — a nullable philosopher-quote slot that renders only when a quote is selected (today: always null pending the alignment definition).

The MEMOIR tab is read-only; designs for this surface should communicate that the player is *reading* their journey, not editing it.

### Engine events (signals the UI listens to)

The engine emits typed events that the UI subscribes to:

```
combat:started | combat:round | combat:ended
world:moved   | world:processed
character:levelup
inventory:changed
dialogue:applied
game:saved    | game:loaded
```

Use these to drive transient feedback: level-up badge auto-clear, inventory pickup toasts, dialogue confirmation flashes, etc.

## What the app currently has (don't redesign for free; redesign for reason)

Five tabs + two full-screen modals. Files in parens.

| Surface | Role | Current shape |
|---|---|---|
| Exploration tab (`app/(tabs)/exploration/index.tsx`) | Walk the world map; pick the next node | Node graph at the top, drawer of "available next steps" below with thematic blurbs. Eyebrow: `✠ WHITHER, PILGRIM?` |
| Combat tab (`app/(tabs)/combat.tsx`) | Resolve a fight | Enemy panel, battle log, player HUD, phase carousel (stance picker / action picker / skill picker / resolve). VS layout in the resolve phase. |
| Character tab (`app/(tabs)/character/index.tsx`) | Read sheet, allocate stat points, see effects, see equipment | Header (name + level + XP), BASE stats, DERIVED table, SAVES & TESTS grid, AFFLICTIONS & BLESSINGS list, WORN & WIELDED diagram + slots, Token Crucible entry button. Tall scrolling page. |
| **Memoir tab** (`app/(tabs)/memoir/index.tsx`) — **new in Phase 33** | Read-only journal | Header, chronicle of recent typed events (reverse-chronological), quest list (`✠ AT HAND` + `✠ COMPLETED`), moral + provisional philosophical alignment chips, philosopher-quote slot (today nullable). |
| Inventory tab (`app/(tabs)/inventory/index.tsx`) | Browse / use / equip items | Header (SACK · WALLET · BURDEN), tabs (ALL / WORN / PHIALS / STUFF / SEALED), grid of items grouped by category, expandable item cards. |
| Event modal (`app/event/index.tsx`) | Resolve a map event | Full-screen modal — illustration + badge + title + body + choice rows. Multiple event kinds reuse this shell with different choice sets. |
| Token Crucible modal (`app/crucible.tsx`) | View five-resource pool, skill costs, accrual rules | Full-screen modal — token meters, skill cost matrix, accrual rules read from engine constants. Currently feels separate from combat where it actually matters. |
| Bottom tab bar | Navigation chrome | Five tabs total; four visible at once (one of `WILDS` / `STRIFE` swapping based on combat, plus `SELF` + `MEMOIR` + `SACK`). Placeholder SVG icons. Tab badges for pending events and unacknowledged level-ups. |

## Locked decisions — these do NOT need redesign

- **Five-tab structure** stays: Exploration, Combat (mutually exclusive with Exploration via tab swap), Character, **Memoir**, Inventory. Event and Crucible are full-screen modals over the tabs, not their own tabs. (The bottom bar shows four tabs at once because Exploration and Combat are mutually exclusive; the bar is always 4-wide in practice.)
- **Dark mode only.**
- **Stance = heart / body / mind.** That's engine. Don't propose a four-stance refactor.
- **Phase machine** (choosing_stance → choosing_action → choosing_skill → resolving). Don't collapse it; you can change how it presents, but the phases must stay distinguishable.
- **Roman numerals** for player + enemy round counts in the VS panel.
- **Friendship counter** is a real Heart-stance win condition; don't remove the meter.
- **Voice rule.** No thee / thou / thy / thine / ye.
- **Hard Rule #8: content stays in the proper layer.** Every visible string on a screen comes from a presenter VM, not as an inline literal — so the design should provide STRINGS as part of each screen spec, not just visuals.

## What I need from you

Deliver a set of screen designs that cover **every surface above**. For each surface:

1. **One reference mockup** (the canonical state — populated, mid-game).
2. **Empty / loading / error variants** — the screen needs to render something visible at fresh-store boot, not collapse to a void. (This was a real production bug we just fixed; design must not re-introduce it.)
3. **Interaction notes** — what taps do what; what motion / transition exists between screens.
4. **Strings** — every visible label, eyebrow, button, placeholder, toast, accessibility label. The mobile codebase requires presenter-sourced strings, so a screen with TBD copy can't ship.
5. **A short rationale** — why this redesign is better than the current state.

### Specific flows I'd like you to focus on

- **Map → encounter → combat → return.** The hardest UX seam. Today it's three hard cuts (exploration tab → modal → combat tab → exploration tab). Propose how to make this a continuous arc.
- **Combat phase carousel.** Today it's a horizontal slide of four sub-screens. Some players miss that they need to swipe; some miss that they can swipe back. Propose a clearer phase indicator and/or restructure.
- **Token Crucible relevance.** Today it lives behind a button on the Character tab. The Crucible is most useful **during combat** (skill costs are paid from it). Propose how the Crucible surfaces during combat, not just as a separate modal.
- **Character sheet density.** Today the sheet is a long scroll of dense tables. Propose progressive disclosure — maybe a hero-stats summary card at the top and tap-to-expand sections below.
- **Event modal voice.** Each event kind (encounter / interaction / rest / cutscene / village / hazard / loot-cache) currently uses the same shell with different copy. Propose whether the shells should diverge visually (different illustration treatments? different choice-row styles per kind?) or stay unified.
- **MEMOIR as a coherent journal.** The newest tab is read-only and shows four threads at once (chronicle / errands / measure / quote). Today it's a long vertical scroll of section blocks. Propose how to make the journal feel like *one book*, not four mini-sections stacked. The chronicle is the most novel signal here — it's a live feed of significant events the player has lived through, and it can scale to dozens of entries; how should it relate visually to the more static quest + alignment sections beside it?

### Platform / implementation constraints (so designs ship cleanly)

- **React Native / Expo SDK 54 / TypeScript strict.** No Tailwind, no CSS-in-JS — styles are `StyleSheet` with tokens from `theme/axm.ts`. New tokens are OK if you propose them explicitly.
- **Typography is already locked:**
  - **Pirata One** — gothic display headers.
  - **IM Fell English** — body serif (regular + italic).
  - **Bebas Neue** — sans labels (buttons, section labels).
  - **JetBrains Mono** — numerics (HP / damage / rolls).
- **SVG is the primary illustration medium.** All current artwork is coded SVG placeholders; real artwork swaps in later. Design with SVG-implementable shapes in mind (geometric, hatched, woodcut-shaped is fine; soft photographic gradients are not).
- **Mobile-first.** Target portrait phones; no tablet or landscape variants needed.
- **No animations beyond fade / slide.** React Native Reanimated is available but the project prefers simple transitions. Propose subtle motion only.

## Optional but welcome

- A **decisions doc** listing locked design decisions, voice rules, color tokens, type scale. Mobile would adopt this as `docs/design.md` and reference it from `bearings.md`.
- A **flow map** (single page) showing all screens + how the player moves between them, including modals.
- **A11y notes** — the project ships `accessibilityLabel`s on every interactive element. Helpful to call out which labels should differ from visible text.

## What to skip

- Web / desktop adaptations — not a target.
- Light mode — not a target.
- New game modes / multiplayer / accounts — engine doesn't support them.
- Onboarding / tutorial flows — out of scope for this pass; a follow-up phase.
- Branding / logo work — separate effort.

---

**Tone reminder:** Cold and old, not theatrical. Closer to a sun-bleached margin gloss than to a stage play. When in doubt, drop the modifier rather than add one.
