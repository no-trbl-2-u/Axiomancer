# Combat Overhaul: Hazard-Pattern Combat — 2026-06-21

## Surface question
How do we recenter combat on status effects? How do we stop players from ignoring effects and winning via basic-attack trading?

## Better question surfaced
Status effects are already mechanically rich, but the simpler path (attack → defend → HP attrition) is viable and legible. The real question is: **how do we make basic-attack trading feel like a losing tax, not an alternative strategy — and replace it with something as engaging as the Hazard minigame?**

## Prior art consulted

- **Slay the Spire — Silent Poison build + Catalyst:** Pure DoT win condition. Catalyst's "×2" animation makes the stack visible and the win feel legible. Loved; failure mode is one-card-combo sameness once optimized.
- **Darkest Dungeon — Bleed/Blight primary strategy:** Structurally hostile to HP attrition. Bleeding icons are large and threatening; tick numbers fly in distinct color. Status effects are the intended kill path, not supplementary.
- **Into the Breach — Board state as win condition:** Almost no fights are won by HP attrition. Win by controlling *state*. Full information at all times. Universally praised for decisiveness.
- **Hades — Hangover/Doom stacking:** Visible stack counter + dramatic trigger animation. Players report "watching the number grow" as intrinsically satisfying.
- **Mage Knight — Puzzle assembly:** Players assemble solutions from cards + mana, not stat comparison. Basic (non-combined) cards are genuinely weak. The benchmark the Hazard minigame was designed against, and the reason the user flagged Hazard as more engaging than current combat.

## Design directions considered

### Option A — DoT Saturation as Only Kill Path
Tune enemy HP so high that HP attrition is infeasible. Only Phase 125 DoT Erosion / Saturation Yield can realistically end fights. Basic attacks are token generators. Trade-off: requires large retuning; early game feels helpless.

### Option B — Status Pressure Meter
Replace enemy HP bar with a visible pressure meter (two tracks: DoT and Control). Basic attacks contribute 0 to either track. Track reaches threshold → combat resolves. Win condition is visible at all times.

### Option C — Combat as a Hazard (CHOSEN)
Replace the turn-based attack/defend loop with the Hazard minigame structure. Every verb is a skill card. The player draws 5 cards, rolls stance dice, and plays cards that apply status effects. Status effects fill Pressure Tracks. Tracks are the only practical win conditions. Enemy is a threat sequence (like Hazard rounds), not a reactive agent.

## Decision / leaning

**Option C — Combat as a Hazard.** Full spec written at [`specs/25-hazard-pattern-combat.md`](../specs/25-hazard-pattern-combat.md).

## Key design choices locked in the spec

**Stance Dice replace basic actions as the resource input.** 4 dice rolled at combat start: Heart/Body/Mind/Wild/X (1/6 each, 2/6 X). Dice persist; no auto-reset between threat phases. Skill cards cost 1 die of matching stance color to power their bottom action.

**Self-reinforcing status loop confirmed.** When a skill card's bottom action lands a status effect, 1 spent die of matching color refreshes. Direct-damage cards that apply no effect: no die refresh. This makes status-effect play economically self-sustaining.

**RPS advantage survives as per-phase card die cost scaling.** Each enemy threat phase has a dominant stance. Advantage → bottom action is free. Disadvantage → costs an extra die. Cards still have stance identities; players still read enemy phases.

**Two Pressure Tracks are the primary win conditions.** DoT Track → DoT Erosion victory. Control Track → Control Saturation mercy path. Both were already in Phase 125; this spec makes them visible front-and-center.

**Three presentation requirements confirmed by user:** effects invisible in-combat, no "you're winning via status" signal, no post-combat attribution. The spec addresses all three: real-time track preview, threat timeline showing phase-clear proximity, and explicit post-combat summary naming each contributing effect.

**Hazard engine is the foundation, not a copy.** `drawCards`, `shuffleDeck`, `canAffordCost`, `spendMana` are imported from `src/World/Hazard/`. The new combat engine wraps them rather than duplicating.

## Open questions

- Hand persistence between phases: discard-all vs. keep-unplayed? (Pilot discard-all)
- Retreat card mechanics: cost? automatic vs. probabilistic?
- Basic deck size: 8–10 to start, growing to 15–20?
- Co-existence of `CombatManaDie` and `HazardManaDie` types during transition
- Enemy skill use in new system: removed from per-round loop, fold into threat action payloads?
- Befriend / friendship counter replacement: Control Saturation path + Befriend card as threshold reducer

## Raw notes

The user's mention of the Hazard minigame being "just so much more engaging" was the load-bearing signal in this session. The design problem isn't "make effects more valuable" — it's "replace the verb that competes with effects." Attack and defend compete with skill cards; once those are removed as options, the player has no choice but to engage with the effect system.

The Hazard engine was specifically praised for the "assembling a solution" feel (user confirmed this maps to Mage Knight). The card draw → dice roll → play cards structure is exactly what the user wants for combat.

Key tension flagged: Option C is a near-complete rewrite of `combat.resolver.ts` and `phases/scenario.ts`. The existing effects engine (`applyEffect`, `tickAllEffects`, all 88 effects, Phase 125) is fully preserved. The investment is in the driver, not the payloads.
