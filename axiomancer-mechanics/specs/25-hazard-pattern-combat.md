# Spec 25 — Hazard-Pattern Combat: Status Effects as Win Condition

> **⚠ SUPERSEDED — 2026-06-22**
> The two-pressure-track win-condition model described in this spec (DoT Erosion + Control
> Saturation as the *only* practical win conditions) **was removed** when the HP-only combat
> model shipped. HP is now the sole win condition; basic-attack trading is the weak baseline
> rather than absent. Status effects remain the *efficient* path to 0 HP.
>
> **Authoritative sources:**
> - Game doctrine: `VISION.md` → "Combat vision"
> - Front-door doc: `docs/combat.md` → [§Hazard-Pattern Combat](#hazard-pattern-combat-spec-25)
> - CLAUDE.md "Load-bearing doctrine" block
>
> This file is retained as a **design history artefact** — the mechanical structure (cards,
> dice, phases, threat sequences) is still live; only the win-condition framing is obsolete.

---

> **Status:** Draft — design locked, implementation pending.
> **Date:** 2026-06-21
> **Depends on:** Spec 01 (effects engine), Spec 04/04b (skills), Hazard engine (`src/World/Hazard/`)
> **Replaces:** The `resolveCombatRound` six-phase pipeline as the primary combat driver.
>
> Companion braindump: [`braindump/2026-06-21-hazard-pattern-combat.md`](../braindump/2026-06-21-hazard-pattern-combat.md)

---

## 1. Design Intent

**The problem this spec solves:** Players can win most fights by basic-attack trading — choosing attack or defend every turn without ever applying a status effect. The current system makes status effects *valuable* but not *necessary*. The result is that the richest part of the game (88 effects, the Phase 125 resolution system, the five-resource economy) is routinely bypassed by the simplest path.

**The solution:** Replace the turn-based attack/defend loop with a card-and-dice system structurally identical to the Hazard minigame. Every round the player plays skill cards from a hand. Skill cards that apply status effects fill Pressure Tracks that are the *only practical win conditions*. Basic-attack trading disappears as a concept — there are no "attack" or "defend" basic actions in this system. Every verb is a skill card.

**Design axiom:** The player should *assemble a solution* (like Mage Knight / Hazard) rather than *trade stats* (like a traditional RPG combat). The enemy is a threat to be managed and dismantled via effects, not a HP pool to drain.

**Status effects as the only real kill path:**
- Enemy HP is retained but tuned very high — direct-damage-only skills barely dent it.
- The two practical win conditions are **DoT Erosion** (cumulative damage-over-time destroys the enemy) and **Control Saturation** (cumulative control/debuff overwhelms the enemy's will), both already defined in Phase 125.
- The Pressure Tracks make these win conditions *visible and foreseeable* — the player always knows how close they are.

---

## 2. What Is Preserved From the Hazard Engine

The Hazard engine (`src/World/Hazard/`) is the mechanical foundation. The following surfaces carry over with minimal modification:

| Hazard system | Combat equivalent | Notes |
|---|---|---|
| `HazardManaDie` (color + state) | `CombatManaDie` (stance + state) | Colors → stances (Heart/Body/Mind/Wild/X). Same state machine: available → spent → exhausted → preserved. |
| `drawCards` / `shuffleDeck` / deck management | `CombatCardDeck` | Same Fisher-Yates + draw-up-to-5 pattern. Same reshuffle-discard-on-empty behavior. |
| Round play → resolve → between-rounds loop | Combat phase loop | Same structural shape. `round-play` → `round-resolve` → `between-phases` → repeat. |
| Progress tracks (`Record<ProgressType, number>`) | Pressure tracks (`{ dot: number; control: number }`) | Two named tracks replace the four progress types. Momentum carry applies. |
| O / X round ledger | Threat phase ledger (Clear / Overwhelmed) | Enemy threat phases mark Clear or Overwhelmed instead of O/X. |
| `canAffordCost` / `spendMana` | Same functions, same signature | Die validation and spending logic are identical. |
| Focus buff stacking | Effect Amplifier cards | Focus → pre-play cards that buff the next pressure contribution. |
| Enchantment zone | Persistent Buff zone | ENCHANT cards carry to persistent buff zone; fire between phases. |
| `mockFixedRng` / `mockSequentialRng` | Same test utilities | RNG contract is unchanged. |
| `computeFinalScore` | `resolveCombatOutcome` | Score/outcome logic adapted from O/X sum to pressure track thresholds. |
| Momentum carry (⌊surplus/2⌋ capped at 3) | Same carry rule applied per track | Surplus pressure carries forward, capped. |
| Reserve bonus (unspent dice → VITAE) | Same bonus rule | Unspent non-X dice at combat end grant small VITAE bonus. |
| Persistent deck flags (`hazard-card:*`) | `combat-card:*` flags | Same flag registry pattern; combat deck grows through loot and skill acquisition. |

**The existing effects engine is fully preserved:** `applyEffect`, `tickAllEffects`, `resolveEffectApplication`, `processRoundStartEffects`, `processRoundEndEffects`, all 88 effect definitions, Phase 125's `getEffectsResolutionOutcome`. These functions are unchanged. The new combat engine *drives* them differently but does not replace them.

---

## 3. What Is Retired

| Retired system | Replacement |
|---|---|
| `resolveCombatRound(state, playerAction, enemyAction)` as the main driver | `resolveCombatPhase(state, cardsPlayed)` — card-play driven |
| `attack` / `defend` as player actions | Removed. Every verb is a skill card. |
| Stance token generation from basic attacks (hit +3 / miss +1 / defend +5) | Replaced by dice rolled at combat start |
| Attack roll contest (d20 + modifier vs d20 + modifier) | Removed from the main path. Some skill cards still involve dice rolls per their existing effect definitions. |
| `phases/scenario.ts` attack-vs-attack and attack-vs-defend resolution paths | Removed. Scenario phase becomes card-play resolution only. |
| `flee` action (removed from player's direct action set) | Survives as a skill card `Retreat` in the combat deck |
| `spare` / `exploit` as direct actions post-Befriend | Survives: Befriend skill card opens the mercy choice modal as before (Phase 112 logic intact) |
| Player "choose stance" as a round-by-round decision | Stances survive as card colors. The player picks cards (each has a stance identity); the dice they have determine which cards they can power. |

**Not retired:** The RPS advantage triangle (Heart > Body > Mind > Heart). It survives as stance-keyed cost scaling on enemy phases (see §4.9).

---

## 4. New Combat Architecture

### 4.1 Combat Encounter State

The new top-level state is `CombatEncounterState`, analogous to `HazardMinigameState`.

```ts
type CombatEncounterState = {
  phase: CombatEncounterPhase;
  enemy: Enemy;                          // unchanged — HP, effects, stats
  player: Character;                     // unchanged — HP, effects, stats
  dice: CombatManaDie[];                 // 4 dice; rolled at combat start
  deck: string[];                        // skill card IDs in draw order
  hand: string[];                        // current hand (up to 5)
  discard: string[];                     // used skill cards
  persistentZone: string[];              // ENCHANT-equivalent persistent buff cards
  threatPhases: CombatThreatPhase[];     // enemy's authored threat sequence
  currentPhaseIndex: number;             // 0-indexed into threatPhases
  pressureTracks: CombatPressureTracks;  // DoT + Control accumulation
  phaseResults: CombatPhaseResult[];     // completed phase records
  combatResources: CombatResources;      // Fallacy/Paradox (still generated by skill categories)
  round: number;                         // total rounds elapsed
  log: RoundEvent[];                     // event stream for UI rendering
  finalOutcome: CombatOutcome | null;    // null until combat ends
};

type CombatEncounterPhase =
  | 'reveal'         // enemy + opening hand visible before dice are rolled
  | 'dice-roll'      // player rolls stance dice
  | 'phase-play'     // player plays skill cards
  | 'phase-resolve'  // pressure tracks updated, enemy action fires, marked Clear/Overwhelmed
  | 'between-phases' // DoT ticks, effect durations tick, persistent zone effects fire, draw 5
  | 'complete';      // combat over, outcome determined

type CombatPressureTracks = {
  dot: number;        // cumulative DoT pressure toward DoT Erosion threshold
  control: number;    // cumulative control pressure toward Saturation threshold
  dotThreshold: number;     // victory via DoT Erosion when dot >= dotThreshold
  controlThreshold: number; // mercy resolution via Saturation when control >= controlThreshold
};

type CombatPhaseResult = {
  phaseIndex: number;
  mark: 'clear' | 'overwhelmed';
  dotContributed: number;
  controlContributed: number;
  enemyActionFired: string;   // description of enemy threat action
  penaltiesApplied: any[];
};

type CombatOutcome =
  | 'victory'         // DoT Erosion threshold reached
  | 'mercy'           // Control Saturation threshold reached (friendship path)
  | 'defeat'          // player HP → 0
  | 'retreat';        // player used Retreat card successfully
```

### 4.2 Stance Dice

Four dice rolled at combat start, persisting as board objects. The dice encode the stance-color economy without requiring basic attacks for resource generation.

**Die face distribution (6 faces per die):**

| Face | Probability | Meaning |
|---|---|---|
| Heart (♥) | 1/6 | Powers Heart-color skill cards |
| Body (⚡) | 1/6 | Powers Body-color skill cards |
| Mind (★) | 1/6 | Powers Mind-color skill cards |
| Wild (✦) | 1/6 | Powers any color card |
| X (blocked) | 2/6 | Cannot power cards unless a card specifically enables X-die interaction |

```ts
type CombatDieColor = 'heart' | 'body' | 'mind' | 'wild' | 'x';
type CombatDieState = 'available' | 'spent' | 'exhausted' | 'preserved' | 'locked';

type CombatManaDie = {
  id: string;           // 'die-0' through 'die-3'
  color: CombatDieColor;
  state: CombatDieState;
  temporary: boolean;   // created by card effects; expires between phases
};
```

**Self-reinforcing status loop (user-confirmed):** When a skill card's bottom action successfully applies a status effect to the enemy, one spent die matching the card's stance color is refreshed to `available`. This makes status-effect play economically self-sustaining. Direct-damage cards that apply no effect: no die refresh.

**Dice do not automatically reset between threat phases.** Same rule as Hazard. Card effects (Recast, Convert, Refresh) are the only normal way to reclaim spent dice.

### 4.3 Combat Skill Card Deck

The player's combat deck is built from their learned skills. Each skill card has a stance color (its existing `requiredStance` or primary scaling stat) and two action tiers:

**Top action (free):** A weak version of the skill's effect. No die cost. Contributes a small amount of pressure. Examples:
- A DoT-applying skill's top action applies the DoT at intensity 1 (base pressure +1 dot track).
- A control skill's top action applies the debuff at minimum duration (base pressure +1 control track).
- A buff skill's top action applies the buff to self (0 pressure — utility only).

**Bottom action (costs 1 die of the card's stance color):** Full effect. Full pressure contribution. Also triggers the die-refresh loop if a status effect lands.

**Single-die law inherited from Hazard:** No bottom action costs more than 1 die. Tier 3 skills may require a matching die + a Fallacy/Paradox token (not an additional die).

**Cards that deal direct damage with no status effect contribute 0 to either pressure track.** They still deal HP damage (useful against enemy HP, which matters for DoT Erosion calculation) but they do not advance the win conditions.

**Fallacy / Paradox generation is preserved:** Using a Fallacy-category skill card generates ⚖. Using a Paradox-category skill card generates ∞. These tokens still gate Tier 3 cards.

**Starting combat deck:** Every player starts with a small baseline deck drawn from their learned skills. Skill learning adds cards to the deck. Skill specialization (e.g. acquiring `r_` upgraded versions) replaces the base card with a powered version, analogous to the Hazard reward card system.

### 4.4 Combat Threat Card (Enemy Redesign)

Each enemy has an authored **threat sequence** — a series of 2–5 threat phases representing their escalating behavior. The sequence is revealed to the player at the start of combat (full information, per Hazard doctrine).

```ts
type CombatThreatPhase = {
  index: number;                           // 1-indexed for display
  enemyStance: 'heart' | 'body' | 'mind'; // dominant stance this phase — drives RPS advantage
  threatAction: CombatThreatAction;         // what the enemy does at phase-end if not controlled
  dotPressureRequired: number;             // DoT track threshold for "Clear" this phase
  controlPressureRequired: number;         // Control track threshold for "Clear" this phase (either clears)
  isFinalPhase: boolean;                   // final phase uses harder thresholds
};

type CombatThreatAction = {
  description: string;                     // shown in threat timeline
  effects: CombatThreatEffect[];           // applied to player if phase not cleared
};
```

**Phase resolution:** At the end of a threat phase, compare cumulative pressure tracks against the phase thresholds:
- If `dot >= dotPressureRequired` OR `control >= controlPressureRequired`: phase marked **Clear**. Threat action does not fire.
- Otherwise: phase marked **Overwhelmed**. Threat action fires (enemy damages player, applies debuffs, heals, escalates).

**Note on "either clears":** The player has a tactical choice — race the DoT track for DoT Erosion victory, or race the Control track for Saturation/mercy. Both are valid paths. Most enemies' authored phases have different thresholds for each track, encoding which path the enemy is more "vulnerable" to.

**Enemy HP is still tracked** for the DoT Erosion calculation. Phase 125's DoT Erosion (`EFFECTS_RESOLUTION_DOT_DAMAGE_THRESHOLD`) still measures pending DoT × duration × intensity against enemy HP. The Pressure dot track is a *leading indicator* that feeds into this calculation but is distinct from it.

**Oversimplification guard:** HP-only attrition should still be possible but extremely slow — on the order of 20+ phases without effects. Direct-damage cards exist but the thresholds are authored so that clearing phases through damage alone is infeasible in the authored threat sequence window.

### 4.5 Round and Phase Structure

Within each threat phase, the player plays multiple *rounds* (no set count per phase). A phase resolves when the player signals "end phase" or when the threat phase timer expires (optional auto-resolve after N rounds without clearing — a tension ratchet, not a hard death).

```
[Combat Start]
    │ enemy revealed, opening hand drawn (5 cards)
    ▼
[dice-roll]
    │ player rolls 4 stance dice
    ▼
[phase-play]  ◄──────────────────────────────────────────────────────┐
    │ player plays cards, spends dice                                 │
    │ status effects applied → effects engine fires                   │
    │ pressure tracks update in real time                             │
    │ player may "End Phase" at any time                              │
    ▼                                                                 │
[phase-resolve]                                                       │
    │ compare tracks to phase thresholds                              │
    │ mark Clear or Overwhelmed                                       │
    │ if Overwhelmed: enemy threat action fires                       │
    │ check combat outcome (DoT Erosion / Saturation / defeat)        │
    │                                                                 │
    ├── combat ongoing ──► [between-phases]                          │
    │                           │ DoT ticks (processRoundStartEffects) │
    │                           │ effect durations tick (tickAllEffects)│
    │                           │ persistent zone fires                │
    │                           │ draw 5 new cards                     │
    │                           │ pressure tracks carry momentum       │
    │                           └────────────────────────────────────►│
    │
    └── combat complete ──► [complete]
                               │ compute outcome
                               │ apply XP / loot
                               │ post-combat attribution summary
```

**Cards played per round within a phase:** No limit. The player plays cards until they choose to end the phase or run out of cards. Hand management (which cards to play now vs. save for next phase) is a core decision.

**Between-phase processing:**
- `processRoundStartEffects` fires for all active DoT, regen, and drain effects.
- `tickAllEffects` decrements durations; expired effects are removed.
- Persistent zone cards fire their between-phase ability.
- Momentum carry: `⌊dot_surplus / 2⌋` (capped at 3) carries into next phase dot track. Same for control.
- 5 new cards drawn. Unplayed hand cards from the current phase are discarded (not kept — matches Hazard's "draw fresh" rule for clean decision-making).

### 4.6 Enemy AI

Enemies no longer choose actions on a per-round basis. Instead:
- Their threat sequence is authored.
- Within a phase, the enemy passively accumulates threat (no per-round enemy action).
- At phase-end, if Overwhelmed, the authored threat action fires automatically.
- Enemies retain their existing effect payload for threat actions (can apply fear, stun, poison player, etc.).

**Enemy skill use is removed** from the main loop. Boss enemies may have authored "enrage" effects that fire as between-phase actions (a special threat action tier).

### 4.7 Self-Reinforcing Status Loop — Detail

This is the mechanism that makes status-effect play economically self-sustaining:

1. Player plays a skill card (e.g. "Curry's Corruption" — Poison debuff, Mind stance).
2. Bottom action costs 1 Mind die.
3. `applyEffect` succeeds → DoT applied to enemy → dot track +N.
4. Because an effect landed: the spent Mind die is immediately refreshed to `available`.
5. Player can immediately play another Mind-color card without using a new die.

**The loop breaks on misses:** If a Tier 2 buff card rolls a fumble (caster-side d20 natural 1 per Phase 80), the buff fizzles AND the die is not refreshed (fumble = no effect landed). This preserves caster-side risk on buff plays.

**The loop does not apply to direct-damage-only cards** — they spend a die, deal HP damage, and no die refresh fires.

**Additional loop mechanics:**
- Applying the same effect that's already at max intensity (cap 10): no die refresh (intensity didn't change, so the effect didn't meaningfully "land").
- Applying a status effect to an enemy with an existing Saturation condition reduces the Control Saturation threshold by 1 per overflow stack (effects compound toward the mercy path).

### 4.8 RPS Advantage — Survival

The Heart > Body > Mind > Heart triangle survives as **stance-keyed cost scaling per enemy phase:**

- Each threat phase has an `enemyStance`.
- **Advantage (player's card stance beats enemy phase stance):** The die cost for that card's bottom action is waived this phase — the card can be powered for free. This represents the enemy being open to that type of pressure.
- **Neutral:** Normal die cost.
- **Disadvantage (enemy phase stance beats player's card stance):** The card's bottom action costs 1 additional die (2 dice total, if a second is available) OR the card cannot be powered at all if the player only has 1 available die.

This means: the player reads the enemy's active phase stance and selects cards accordingly. Wrong-stance cards are still playable (top action is always free), but powering them is expensive. Right-stance bottom actions are free — they reward phase-reading.

**RPS advantage is displayed prominently** in the UI as a colored indicator on each card in hand showing cheap / normal / costly for the current phase.

---

## 5. Status Pressure Track — Detail

### 5.1 DoT Pressure Track

The DoT track measures the player's momentum toward **DoT Erosion** (Phase 125 victory path).

**Per-round contribution (during phase-play):**
```
dotContribution = Σ (effect.payload.damageOverTime.damagePerRound × intensity)
                  for each DoT effect newly applied this round
```

**Between-phase contribution:**
- Each active DoT effect on the enemy contributes `damagePerRound × intensity × remainingDuration` to the track's "pending damage" projection.
- The Phase 125 `getEffectsResolutionOutcome` calculation is exposed to the player as the track fill.

**DoT Erosion fires** when `state.pressureTracks.dot >= state.pressureTracks.dotThreshold`. This triggers the `'victory'` outcome.

**Momentum carry on DoT track:** If the player over-fills the threshold in a phase, the surplus carries ⌊surplus/2⌋ (capped at 3) to the next phase, representing already-stacked DoT continuing to tick.

### 5.2 Control Pressure Track

The Control track measures the player's momentum toward **Control Saturation** (Phase 125 friendship/mercy path).

**Per-round contribution (during phase-play):**
```
controlContribution = Σ effect.intensity
                      for each control-category or stat-debuff effect newly applied this round
                    + Σ remainingDuration (capped per effect, as in Phase 155)
                      for each control effect that is actively restricting (forcedStance / blockedStances / skipTurn)
```

**Control Saturation fires** when `state.pressureTracks.control >= state.pressureTracks.controlThreshold`. This triggers the mercy choice modal (Phase 112 logic: player chooses `spare` or `exploit`).

### 5.3 Threshold Authoring

Enemy threat cards specify `dotPressureRequired` and `controlPressureRequired` per phase. The **global** win thresholds `dotThreshold` and `controlThreshold` are derived from the enemy's authored sequence:

```
dotThreshold     = sum of dotPressureRequired across all authored phases
controlThreshold = sum of controlPressureRequired across all authored phases
```

An enemy that is "weak to DoT" has lower dotThreshold. An enemy that is "weak to control" has lower controlThreshold. This is the primary enemy-design knob for varied combat feel.

---

## 6. Skill Card Design Rules

When adapting existing skills (from `docs/skills.md`) into the card format:

**Rule 1 — Effect-applying skills get a meaningful bottom action pressure contribution.**
Any skill that applies a debuff or DoT to the enemy: its bottom action contributes to the pressure track proportional to the effect's tier and intensity. Tier 1 procs → small contribution. Tier 2 debuffs → medium. Tier 3 → large.

**Rule 2 — Direct-damage skills contribute 0 pressure.**
Skills whose primary payload is raw HP damage (`calculateSkillDamage` output without a status effect) contribute 0 to either track. They still deal HP damage, which matters for DoT Erosion calculation, but they are not the path to a clean phase-clear.

**Rule 3 — Buff skills contribute 0 pressure but enable other cards.**
Self-buff skills (resistance up, stat up, regen) contribute 0 to either track directly but are viable as setup — they protect the player from escalating enemy threat actions.

**Rule 4 — Top actions are never zero.**
Every card must do something for free. A top action minimum: +1 to any pressure track, or draw 1 card, or refresh 1 die. Cards with a top action of "nothing" are not valid.

**Rule 5 — The fallacy/paradox flavor should match the effect.**
A "Strawman Argument" card that applies Straw Man's Echo (rollModifier debuff) works thematically. A "Strawman Argument" card that just deals +5 direct damage does not. Prefer mechanic-theme alignment.

**Verb class taxonomy (adapted from Hazard card classes):**

| Class | Combat equivalent | Pressure contribution |
|---|---|---|
| `direct-dot` | Skills that apply DoT debuffs (Poison, Bleed, Burn, etc.) | +dot track |
| `direct-control` | Skills that apply control debuffs (Stun, Fear, Charm, Silence, etc.) | +control track |
| `stat-debuff` | Skills that apply stat-reduction debuffs | +control track (smaller) |
| `buff-self` | Skills that buff the player (regen, resistance, accuracy) | 0 pressure, utility |
| `amplifier` | Focus-equivalent: buffs the next pressure card's contribution | 0 direct, multiplies next |
| `die-manipulation` | Refresh/recast/convert dice | 0 pressure, economy |
| `card-draw` | Draw additional cards | 0 pressure, economy |
| `persistent-enchant` | Between-phase persistent effects | variable |
| `x-die-interaction` | Cards that enable X dice spending | economy / risk |

---

## 7. Presentation Layer

This section specifies what must change in the UI layer. These are requirements on the mobile presenter and any CLI rendering, not suggestions.

### 7.1 Pressure Track Display (Central Element)

**The two Pressure Tracks are the most prominent element of the combat screen.** They replace the single HP-bar-focused combat layout.

Each track is a horizontal meter:

```
DoT Erosion:    [████████░░░░░░░░░░░░] 40% — 8/20 pts
Control Saturation: [██░░░░░░░░░░░░░░░░░] 10% — 2/20 pts
```

Requirements:
- Tracks are always visible, even when the player's hand is displayed.
- Track values update in real-time as the player plays cards (preview mode), before the phase is committed.
- When a card is held/highlighted, the projected fill is shown as a lighter shade extending from the current fill point.
- The threshold for the current phase (the phase-specific clearing target) is indicated with a tick mark distinct from the global victory threshold.
- When a track crosses the phase-clear threshold, it pulses / flashes green.
- When a track crosses the global victory threshold (DoT Erosion or Saturation), an immediate outcome animation fires before the phase-resolve step.

### 7.2 Enemy Threat Timeline

**The full threat sequence is displayed at combat start and remains visible.** Players see every phase before committing to a strategy.

Each phase entry displays:
- Enemy phase stance (Heart / Body / Mind icon) — informs which card colors are advantaged.
- Phase clear thresholds for both tracks.
- Threat action description: "If not cleared — [enemy attacks with +8 body damage and applies Exhaustion]."
- Current phase: highlighted with a border.
- Completed phases: marked Clear (O) or Overwhelmed (X) like the Hazard ledger.
- Future phases: grayed out but readable.

This gives the player the same full-information contract as the Hazard minigame.

### 7.3 Card Hand Display

**Cards in hand must communicate:**
- Stance color identity (Heart red / Body blue / Mind purple / Wild gold — consistent palette).
- Verb class icon (DoT drop / Control chain / Buff shield / Draw card / Die crystal / etc.).
- Pressure contribution preview: when a card is tapped/hovered, the tracks show the projected fill from playing this card.
- Die cost indicator: whether the bottom action is affordable given current dice.
- RPS advantage indicator per current enemy phase stance:
  - **Green border / "cheap"** → card stance has advantage; bottom action is free this phase.
  - **Gray** → neutral; normal cost.
  - **Red border / "costly"** → card stance has disadvantage; extra die cost or unpowerable.

### 7.4 Dice Board Display

The 4 stance dice are displayed as tactile board objects.

Each die shows:
- Its current color face (Heart ♥ / Body ⚡ / Mind ★ / Wild ✦ / X ✕).
- Its current state (available: bright, spent: dark, exhausted: dim, locked: padlock icon).
- When playing a card: dragging the card onto a compatible available die confirms the die spend.
- Temporary dice (created by card effects) are visually distinct (smaller, glowing edge).

### 7.5 DoT Tick Visualization (Between Phases)

**Between-phases DoT damage must be visible and legible, not noise.**

Requirements:
- DoT ticks display as distinct colored numbers over the enemy sprite/icon, in a color matching the DoT type (red for body, blue for mind, purple for heart damage).
- Each active DoT effect ticks separately and is labeled: "Curry's Corruption — 3 damage" rather than a merged "6 damage."
- A brief pause / animation beat shows all ticks before the draw happens.
- The DoT pressure track updates as each tick contributes to the DoT Erosion projection.
- When DoT Erosion fires mid-between-phase processing, the combat end animation fires immediately and remaining ticks don't resolve (clean exit).

### 7.6 Effect Status Panel

**Active effects on the enemy are displayed in a compact but readable panel.**

Requirements:
- Each active effect on the enemy is shown as an icon + intensity number + remaining duration.
- Effect icons are color-coded by category (DoT effects = flame/drop icons; control effects = chain icons; stat debuffs = arrow-down icons; etc.).
- Tapping any effect icon shows a tooltip with the effect's name, description, and current payload values.
- The panel updates in real-time as cards are played (preview mode shows effects that *will* land if the card is committed).
- Effects at max intensity (10) display a "MAX" badge.

### 7.7 Post-Combat Attribution Summary

**After every combat, the player sees an explicit attribution summary before the loot/XP screen.**

Format:
```
Combat Summary — Victory via DoT Erosion

  Curry's Corruption     — 18 damage over 4 phases
  Yablo's Venom          — 12 damage over 2 phases
  Theseus' Dissolution   — 6 damage over 3 phases

  Total DoT damage: 36
  Direct damage: 4

  Control peak: 6 / 12 (did not saturate)

  Best card: Curry's Corruption (12 DoT pressure contributed)
```

Requirements:
- Every fight shows this summary, not just wins.
- Losing fights show "Effects contributed before defeat" with the same breakdown.
- The summary is skippable (tap anywhere) but must appear for at least 2 seconds.
- The "Best card" line names the single skill card that contributed most to the winning track.

---

## 8. Engine Migration Map

How existing code maps to the new architecture:

| Existing location | Action |
|---|---|
| `src/Combat/combat.resolver.ts` — `resolveCombatRound` | **Rename and wrap.** The function still exists for the between-phases DoT/tick processing but is no longer the primary combat driver. The new `resolveCombatPhase(state, cardsPlayed)` takes its place as the main entry point. |
| `src/Combat/phases/scenario.ts` — attack/defend paths | **Remove.** The attack-vs-attack and attack-vs-defend code is deleted. Skill execution paths remain. |
| `src/Combat/phases/advantage.ts` | **Adapt.** `resolveEffectiveAdvantage` is repurposed: instead of resolving per-round matchup, it resolves per-phase stance advantage for die cost scaling. |
| `src/Combat/phases/stance-effects.ts` | **Remove.** Tier 1 auto-effects no longer fire from basic actions. Tier 1 effects may still be applied by specific skill cards. |
| `src/Combat/phases/action-restriction.ts` | **Preserve.** `canAct` still evaluates control effects on the player. The player's options shift (can't play a card if fully stunned) but the logic is the same. |
| `src/Combat/phases/round-start.ts` + `round-end.ts` | **Rename to `between-phases.ts`.** Same logic; fires between threat phases, not every round. |
| `src/Combat/combat.reducer.ts` | **Extend.** New reducer actions for `playCard`, `spendDie`, `endPhase`, `drawHand`, etc. Existing `setPhase`, `endCombat`, `appendLog` survive. |
| `src/Combat/index.ts` | **Preserve barrel.** All existing exports (effect helpers, stat helpers, `determineCombatEnd`) remain. |
| `src/World/Hazard/hazard.deck.ts` | **Reuse.** `drawCards` and `shuffleDeck` are imported directly into the combat engine. Do not copy; import. |
| `src/World/Hazard/hazard.dice.ts` | **Adapt.** `canAffordCost` and `spendMana` are reused. Die color types are extended to include `'heart' | 'body' | 'mind' | 'wild'` in addition to the existing Hazard colors — or extracted to a shared module if both systems will coexist. |
| `src/Skills/skill.engine.ts` — `executeSkill` | **Adapt.** Skill execution now returns a `SkillCardResult` that includes pressure track contribution in addition to the existing event stream. The core `applyEffect` call is unchanged. |

### Suggested new file layout

```
src/Combat/
├── combat.engine.ts          # new: resolveCombatPhase — main entry point
├── combat.threat.ts          # new: threat phase resolution, enemy action fire
├── combat.cards.ts           # new: skill-card-to-combat-card adapter
├── combat.pressure.ts        # new: pressure track update, threshold checks, attribution
├── combat.dice.ts            # new: CombatManaDie — wraps/adapts hazard.dice.ts
├── combat.deck.ts            # new: CombatCardDeck — wraps hazard.deck.ts
├── combat.reducer.ts         # extended: new actions for card-play-driven state
├── combat.resolver.ts        # adapted: now called from between-phases only (DoT ticking)
├── phases/
│   ├── between-phases.ts     # renamed from round-start + round-end
│   ├── advantage.ts          # adapted: per-phase stance advantage
│   ├── action-restriction.ts # preserved: canAct for player
│   └── card-play.ts          # new: card application, die cost check, effect dispatch
└── index.ts                  # preserved barrel
```

---

## 9. New Engine Functions

```ts
// Main phase entry point
function resolveCombatPhase(
  state: CombatEncounterState,
  cardsPlayed: CardPlay[],            // [{cardId, useBottom, dieId?}]
  rng: () => number
): { state: CombatEncounterState; events: CombatEvent[] }

// Card play within a phase
function playCombatCard(
  state: CombatEncounterState,
  cardId: string,
  useBottom: boolean,
  dieId?: string,
  rng: () => number
): { state: CombatEncounterState; events: CombatEvent[] }

// Pressure track update after an effect lands
function updatePressureTracks(
  tracks: CombatPressureTracks,
  effect: ActiveEffect,
  effectDef: Effect
): CombatPressureTracks

// Phase end resolution — compare tracks to thresholds
function resolveThreatPhase(
  state: CombatEncounterState
): { state: CombatEncounterState; mark: 'clear' | 'overwhelmed'; events: CombatEvent[] }

// Between-phases processing
function processBetweenPhases(
  state: CombatEncounterState,
  rng: () => number
): { state: CombatEncounterState; events: CombatEvent[] }

// Post-combat attribution
function buildCombatSummary(
  state: CombatEncounterState
): CombatSummary

// RPS advantage for card die cost
function resolveCardDieCost(
  card: CombatCard,
  enemyPhaseStance: Stance
): { cost: number; advantage: 'advantage' | 'neutral' | 'disadvantage' }

// Combat initialization (rolls dice, draws hand, sets up state)
function initializeCombatEncounter(
  player: Character,
  enemy: Enemy,
  playerDeck: string[],
  rng: () => number
): CombatEncounterState
```

---

## 10. Enemy Authoring — New Fields

Existing `Enemy` type gains a `threatSequence` field. All other enemy fields (HP, stats, effects, procOverrides, befriendabilityConfig, friendshipReward) are unchanged.

```ts
// Appended to existing Enemy type
type Enemy = {
  // ... all existing fields preserved ...

  // New: combat threat structure for Spec 25
  threatSequence?: CombatThreatPhase[];
  // If absent, a default 3-phase sequence is generated from the enemy's stats.
  // Authored sequences override the default.
};
```

**Default threat sequence generation (for unauthored enemies):**
```
Phase 1: enemyStance = random from [heart, body, mind]
         dotPressureRequired = Math.ceil(enemy.hp * 0.15)
         controlPressureRequired = Math.ceil(enemy.hp * 0.20)
         threatAction: { description: 'Attacks', effects: [damagePlayer(enemy.physicalAttack)] }
Phase 2: (escalated — thresholds +20%)
Phase 3: (escalated — thresholds +40%, isFinalPhase: true)
```

Authored boss sequences will have named threat actions, stance patterns, and calibrated thresholds. The seven authored befriendable enemies (MournfulGull, HollowEyedBeggar, etc.) should receive authored threat sequences as part of this spec's implementation.

---

## 11. Acceptance Criteria

- [ ] A combat encounter can be started, played through 3 threat phases, and resolved via DoT Erosion using only skill cards (no attack/defend actions).
- [ ] A combat encounter can be resolved via Control Saturation, opening the Phase 112 mercy choice.
- [ ] Playing a direct-damage card contributes 0 to either pressure track.
- [ ] Playing a status-effect card refreshes 1 spent die of matching stance color.
- [ ] Dice do not reset between threat phases; spent dice remain spent.
- [ ] Between-phases processing fires all active DoT, regen, and drain effects via `processRoundStartEffects`.
- [ ] Effect durations tick via `tickAllEffects` between phases.
- [ ] Momentum carry applies to both tracks between phases.
- [ ] A card with disadvantage stance vs. the current enemy phase costs 1 extra die to power; a card with advantage stance costs 0 dice.
- [ ] The post-combat attribution summary correctly attributes DoT damage per skill card.
- [ ] The Hazard deck-management functions (`drawCards`, `shuffleDeck`) are *imported*, not duplicated.
- [ ] All existing hermetic effect tests still pass unchanged (effects engine is unmodified).
- [ ] All existing skill e2e tests still pass unchanged (skill execution path is preserved in `card-play.ts`).
- [ ] A Monte-Carlo greedy bot simulation can run 300 seeded combats against authored enemies and report Clear/Overwhelmed rates per phase (analogous to the Hazard balance sim).

---

## 12. Open Questions

**Q1 — Hand persistence between phases:** Hazard discards unplayed hand cards at round advance ("draw fresh"). Should combat follow this rule? Argument for: forces commitment each phase, prevents hoarding. Argument against: skill cards are harder to acquire than hazard cards; discarding feels punishing. *Recommendation: pilot "discard all at phase-end"; revisit if playtests show hoarding is not a real behavior.*

**Q2 — Retreat card mechanics:** Does Retreat require a die? Cost? Probability of success vs. enemy threat level? *Defer to skill card design pass. For now, Retreat always succeeds but costs all remaining available dice.*

**Q3 — Basic deck sizing:** How many cards does the player start with? The Hazard starter deck has 11 authored cards at various weights. Combat decks should probably start at 8–10 cards and grow to 15–20 as skills are learned. *Needs playtest to determine.*

**Q4 — Co-existence with Hazard engine during transition:** While both systems are live, `CombatManaDie` and `HazardManaDie` have duplicate shapes. Options: (a) extract a shared `ManaDie` type to a common module; (b) keep them separate until the new combat engine is stable. *Recommendation: (b) for now; merge in a cleanup phase once both are validated.*

**Q5 — Enemy skill use:** Enemies currently can answer with a skill when the player uses a hostile skill (Phase 150, 10% chance). In the new system, enemies act only at phase-end. Should this be preserved for flavor? *Recommendation: Remove per-round enemy skill responses. Enemy threat actions at phase-end are richer and more authored. Enemy skills can be folded into threat action payloads.*

**Q6 — Befriend / friendship counter:** The old friendship counter accumulated on both-defend rounds. With defend removed, what replaces it? Phase 112 requires Befriend skill + mercy choice. Befriend card should still cost 5 heart tokens. The between-phases control saturation path already routes to the mercy choice. *Recommendation: Keep Befriend as a card. Control Saturation resolution IS the new friendship counter trigger. The Befriend card can lower the Control Saturation threshold by a fixed amount, making it a tactical option to accelerate the mercy path.*
