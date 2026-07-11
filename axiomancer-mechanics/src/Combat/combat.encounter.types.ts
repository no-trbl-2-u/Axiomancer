/**
 * Spec 25 — Hazard-Pattern Combat: engine types.
 *
 * The new card-and-dice combat driver, structurally identical to the Hazard
 * minigame (`src/World/Hazard/`). HP MODEL: the enemy's SOLE bar is HP and the
 * player drops it to 0. Status effects are the EFFICIENT path (DoT erodes HP;
 * control hinders the enemy's turn); a raw strike is the weak baseline — every
 * verb is a combat card (projected from a learned card).
 *
 * This is the sole combat driver. It reuses the shared effects engine and
 * card engine (Spec 25 §12 Q4 recommendation (b)): the `executeCard` /
 * `applyEffect` machinery is untouched — the engine *drives* it differently.
 *
 * Doctrine (CLAUDE.md): status effects are the MAIN fun. DoT erosion + control
 * make a fight something the player *assembles a solution* for rather than
 * *trades stats* in.
 */

import type { Character } from '../Character/types';
import type { Enemy } from '../Enemy/types';
import type { Effect, ActiveEffect } from '../Effects/types';
import type { CombatResources } from '../Cards/types';
import type { Stance } from './types';

// ---------------------------------------------------------------------------
// Dice — the stance-color economy (Spec 25 §4.2)
// ---------------------------------------------------------------------------

/**
 * Die face colors. Heart / Body / Mind power same-color cards; Wild powers any
 * color; X is the blocked face (cannot power a card unless a card specifically
 * enables X-die interaction). Mirrors the Hazard `HazardDieKind` (colors + hex).
 */
export type CombatDieColor = 'heart' | 'body' | 'mind' | 'wild' | 'x';

/**
 * Die lifecycle. `available` → `spent` on power; `spent` → `available` again
 * via the self-reinforcing status loop (§4.7), RPS advantage (§4.8 waives the
 * cost entirely), or die-manipulation cards. `exhausted` / `preserved` mirror
 * the Hazard state machine for parity; `locked` is reserved for X dice that a
 * card has not yet unlocked.
 */
export type CombatDieState = 'available' | 'spent' | 'exhausted' | 'preserved' | 'locked';

/** A stance die — a tactile board object rolled at combat start. */
export interface CombatManaDie {
    id: string;           // 'die-0' … 'die-3' (and 'die-N' for temporary dice)
    color: CombatDieColor;
    state: CombatDieState;
    /** Created by card effects; expires between phases (display + cleanup). */
    temporary: boolean;
    /**
     * Spec 32 v3 §5 — a FLOATING die: forged by the FORGE verb, joins the tray
     * NOW, is exempt from every reroll, persists across rounds AND combats
     * (written to the character save at combat end), and is gone forever when
     * spent. Absent/false for rolled, temporary, and Reserve dice.
     */
    floating?: boolean;
    /**
     * Fate Engine P1 (spec 31 R2) — RIPENING pips. Deterministic, no new RNG:
     * fresh-rolled dice have 0; a die BANKED to the Reserve gains +1 pip per
     * threat phase survived (max `RESERVE_PIP_CAP`). Spending a pipped die adds
     * +1 intensity per pip to the status it lands, or +2 Guard per pip on a
     * defend card. Optional for back-compat with state literals (absent = 0).
     */
    pips?: number;
}

// ---------------------------------------------------------------------------
// Cards — combat card projected from a learned Card (Spec 25 §4.3, §6)
// ---------------------------------------------------------------------------

/**
 * Verb-class taxonomy (adapted from the Hazard card classes, §6). Drives the
 * effect-kind a card applies and its hand icon.
 */
export type CombatVerbClass =
    | 'direct-dot'        // applies DoT debuffs (Poison, Bleed) → erodes HP
    | 'direct-control'    // hinders the enemy's turn (STAGGER / BACKFIRE)
    | 'stat-debuff'       // applies exposure debuffs (MARK / RAPPORT) → soft control
    | 'buff-self'         // buffs the player / engine verbs → utility
    | 'direct-damage'     // status-payoff bursts (RUPTURE / REAP) — never raw strikes
    | 'befriend'          // Befriend card → opens the mercy choice (§6 Q6)
    | 'defend'            // Guard/defense card → shields against the enemy's next threat
    | 'enchant'           // spec 32 v3 — persistent player-side passive
    | 'disenchant'        // spec 32 v3 — persistent curse attached to the enemy
    | 'retreat';          // dead — no card ever produces this verb class any more.
                           // No in-combat retreat exists; combat resolves only
                           // by winning or losing. Kept in the union rather than
                           // deleted so every exhaustive Record/switch keyed on
                           // CombatVerbClass elsewhere doesn't need a blind,
                           // unverified edit (this repo has no local TS
                           // toolchain to confirm a full deletion is safe).

/** The effect-kind a card's bottom action applies. `none` = utility / damage only. */
export type CardEffectKind = 'dot' | 'control' | 'none';

/**
 * A combat card — an adapter VIEW over a library `Card`. Pure projection: never
 * mutated, recomputed from the card + effect libraries. `id` is the backing
 * library-card id.
 */
export interface CombatCard {
    /** Card id. For library-backed cards this is the source card id; synthetic
     *  cards use a `card-` prefix (e.g. `card-retreat`). */
    id: string;
    name: string;
    /** Stance color identity (Heart / Body / Mind). Derived from the card's
     *  `philosophicalAspect`. Synthetic cards may be `wild`. */
    stance: CombatDieColor;
    verbClass: CombatVerbClass;
    /** Which effect-kind the bottom action applies (dot / control / none). */
    effectKind: CardEffectKind;
    tier: 1 | 2 | 3;
    /** Spec 32 v3 — rarity band derived from the rank ladder (§4). Drives the
     *  deck recipe, drop weights, and the mobile frame. */
    rarity?: 'common' | 'uncommon' | 'rare';
    /** Spec 32 v3 — rank 1-6 (Doxa → Aporia); printed on the face. */
    rank?: 1 | 2 | 3 | 4 | 5 | 6;
    /** Spec 32 v3 — card type (spell / enchantment / disenchant). */
    cardType?: 'spell' | 'enchantment' | 'disenchant';
    /** Fallacy (⚖) or Paradox (∞) flavour — preserved token generation. */
    category: 'fallacy' | 'paradox' | null;
    /** Human-readable description of the FREE top action. */
    topActionText: string;
    /** Human-readable description of the powered BOTTOM action. */
    bottomActionText: string;
    /** Projected impact if the bottom action lands (a damage-weighted preview;
     *  §7.1, §7.3). */
    bottomDamagePreview: number;
    /** The id of the primary enemy effect this card applies (for the projection
     *  preview's diminishing-returns lookup). Null for damage/buff/synthetic. */
    primaryEffectId: string | null;
    /**
     * Fate Engine P1 — the card's printed DIE LINES (threshold / dieBonus /
     * fate / die-manipulation), generated from the card's riders in REAL units
     * (printed == applied). Absent for cards with no dice interaction.
     */
    dieLines?: string[];
}

/** A physical card instance in hand / play (uid-tracked, like Hazard). */
export interface CombatHandEntry {
    uid: string;
    cardId: string;
}

/** A single card play submitted to `resolveCombatPhase`. */
export interface CardPlay {
    /** Hand-entry uid (preferred) or card id. */
    uid?: string;
    cardId: string;
    /** Bottom (powered) action when true; free top action when false. */
    useBottom: boolean;
    /** Die spent to power the bottom action (ignored for top actions). */
    dieId?: string;
}

// ---------------------------------------------------------------------------
// Stance read + Conviction + Signature Skills (Spec 26b §1, §2, §4)
// ---------------------------------------------------------------------------

/** Outcome of the hidden-stance RPS read when a die is drafted. `none` = the
 *  drafted die was Wild/X (no stance contest). */
export type CombatReadResult = 'advantage' | 'neutral' | 'disadvantage' | 'none';

/** What a signature skill does (drives the engine dispatch + the UI icon). */
export type SignatureSkillKind =
    | 'scout'          // reveal current + next enemy stance
    | 'reroll'         // re-roll only the SPENT / blocked-X dice, keeping usable ones (Press Fate)
    | 'sustain'        // draw cards + small heal
    | 'control'        // apply a control debuff to the enemy (hinders its turn)
    | 'dot'            // guaranteed DoT application at boosted intensity
    | 'mercy'          // disarming hit that softens a low-HP foe toward mercy (heart)
    | 'conclude'       // finisher: damage = sum of (intensity × per-stack weight) across all enemy effects (body)
    | 'draw';          // draw cards + refund Conviction (mind economy)

export type SignatureSkillId =
    | 'sig-read-opponent'
    | 'sig-press-the-point'
    | 'sig-second-wind'
    | 'sig-overwhelming-argument'
    | 'sig-conviction-strike'
    // Per-archetype exclusives (Spec 26b tuning §B)
    | 'sig-disarming-plea'    // heart
    | 'sig-rallying-blow'     // body
    | 'sig-clever-gambit';    // mind

/** Player archetype, derived from the dominant base stat. Drives the signature
 *  kit + (mobile) the portrait. */
export type PlayerArchetype = 'heart' | 'body' | 'mind';

/** A signature skill — an always-available ability funded by Conviction (◆),
 *  independent of the shuffled deck (Spec 26b §4). */
export interface SignatureSkill {
    id: SignatureSkillId;
    name: string;
    description: string;
    /** Conviction (◆) cost. */
    cost: number;
    kind: SignatureSkillKind;
    /** Which effect-kind a `control`/`dot` card applies (default of the kind). */
    effectKind?: CardEffectKind;
    /** Effect id a `control`/`dot` card applies to the enemy. */
    effectId?: string;
    /** Magnitude knob (intensity / heal / draw count). */
    magnitude: number;
}

// ---------------------------------------------------------------------------
// Threat phases — the enemy redesign (Spec 25 §4.4, §10)
// ---------------------------------------------------------------------------

/** A single effect an enemy threat action applies to the player when a phase
 *  is not cleared. */
export interface CombatThreatEffect {
    /** Direct HP damage dealt to the player. */
    damage?: number;
    /** Effect id (from the effects library) applied to the player. */
    effectId?: string;
    /** Intensity override for the applied effect (default 1). */
    intensity?: number;
    /** Duration override for the applied effect. */
    duration?: number;
    /** Self-heal the enemy performs (escalation). */
    enemyHeal?: number;
}

export interface CombatThreatAction {
    /** Shown in the threat timeline. */
    description: string;
    /** Applied to the player if the phase is Overwhelmed (not cleared). */
    effects: CombatThreatEffect[];
}

/**
 * Spec 26 §2 — the enemy's telegraphed intent type, derived from the threat
 * action's effects. The STANCE (the RPS axis) stays hidden; the INTENT (what the
 * enemy will do if not cleared) is shown.
 */
export type CombatIntentType =
    | 'damage'     // only direct HP damage
    | 'debuff'     // only a debuff applied to the player
    | 'buff'       // only enemy self-heal / self-buff
    | 'block'      // a defensive / damage-reduction effect on the enemy
    | 'pass'       // no effects (damage 0, no effectId)
    | 'combo';     // multiple types at once

export interface CombatThreatPhase {
    index: number;                            // 1-indexed for display
    enemyStance: Stance;                      // dominant stance — HIDDEN until revealed (Spec 26b §2)
    threatAction: CombatThreatAction;         // the enemy's telegraphed attack each phase (HP model)
    isFinalPhase: boolean;                    // last telegraph in the sequence (then it loops)

    // ── Spec 26 — intent telegraph ──────────────────────────────────────────
    /** Auto-derived from `threatAction.effects` (deriveIntentType); override for
     *  boss clarity. Drives the mobile intent icon + label. */
    intentType?: CombatIntentType;
    /** Optional short flavor label, e.g. "Charges up". Presenter defaults per type. */
    intentLabel?: string;
    /** Spec 26b §2 — thematic tell that *implies* (never states) this phase's
     *  hidden stance. Falls back to the enemy-level `stanceHint`. */
    stanceHint?: string;

    /** Phase 3 — "rage mode": this phase cannot be entered until the
     *  ABOUT-TO-RESOLVE round (state.round + 1 at phase-advance time) is
     *  >= this value. While locked, `processBetweenPhases` holds the phase
     *  pointer at the last reachable phase (repeating it) instead of
     *  advancing into this one. Undefined = never locked (every phase
     *  authored before this epic behaves exactly as before). */
    unlockAfterRound?: number;
}

export type CombatThreatMark = 'clear' | 'overwhelmed' | 'pending';

export interface CombatPhaseResult {
    phaseIndex: number;
    mark: 'clear' | 'overwhelmed';            // clear = enemy hindered (control); overwhelmed = it acted
    enemyActionFired: string;                 // '' when the enemy was hindered (control skip)
    penaltiesApplied: CombatThreatEffect[];
}

// ---------------------------------------------------------------------------
// HP model (the enemy's only bar). Win = enemy HP → 0; lose = player HP → 0.
// Status effects DO real things: DoT erodes enemy HP each phase; control gates
// the enemy's turn via `canAct`. There are no abstract effect kinds/bars.
// ---------------------------------------------------------------------------

/** Per-card attribution row for the post-combat summary (§7.7). */
export interface CombatAttributionRow {
    cardId: string;
    name: string;
    /** Total DoT damage projected/dealt by this card's effects. */
    dotDamage: number;
    /** Total HP damage this card dealt the enemy (strike + DoT, attributed). */
    damageDealt: number;
    /** Phases across which the card's effects were active. */
    phases: number;
}

export interface CombatSummary {
    outcome: CombatOutcome;
    /** e.g. 'Victory — the enemy falls'. */
    headline: string;
    rows: CombatAttributionRow[];
    totalDotDamage: number;
    directDamage: number;
    /** Card that dealt the most enemy HP damage ('' if none). */
    bestCard: string;
}

// ---------------------------------------------------------------------------
// Outcome + phase
// ---------------------------------------------------------------------------

export type CombatOutcome =
    | 'victory'    // enemy HP → 0 (DoT erosion + status payoffs)
    | 'mercy'      // spared a low-HP foe via Befriend (the friendship path)
    | 'capitulate' // spec 32 v3 §9 — SWAY ≥ enemy HP: the enemy yields (merciful)
    | 'concede'    // spec 32 v3 §9 — an 8-Premise Peroration wins the argument
    | 'defeat'     // player HP → 0
    | 'retreat';   // dead — no in-combat retreat exists; combat resolves only
                   // by winning or losing. Kept in the union (see
                   // CombatVerbClass's matching note) rather than deleted.

export type CombatEncounterPhase =
    | 'reveal'         // enemy + opening hand visible before dice are rolled
    | 'dice-roll'      // player rolls stance dice
    | 'phase-play'     // player plays cards
    | 'phase-resolve'  // effect kinds compared, enemy action fires, Clear/Overwhelmed
    | 'between-phases' // DoT ticks, durations tick, draw 5
    | 'mercy-choice'   // Control Saturation opened the Phase 112 spare/exploit modal
    | 'complete';      // combat over, outcome determined

// ---------------------------------------------------------------------------
// Events — typed stream for UI rendering (Spec 25 §7)
// ---------------------------------------------------------------------------

export type CombatEvent =
    | { kind: 'dice-rolled'; dice: CombatManaDie[] }
    | { kind: 'turn-dice-rolled'; turn: number; dice: CombatManaDie[] }
    | { kind: 'die-drafted'; dieId: string; color: CombatDieColor; read: CombatReadResult }
    | { kind: 'conviction-gained'; amount: number; total: number; reason: 'unpicked-die' | 'read-win' | 'effect' }
    | { kind: 'stance-revealed'; phaseIndex: number; stance: Stance }
    | { kind: 'read-result'; stance: CombatDieColor; enemyStance: Stance; result: CombatReadResult }
    | { kind: 'signature-cast'; signatureId: SignatureSkillId; name: string; cost: number }
    | { kind: 'card-played'; cardId: string; useBottom: boolean; dieId: string | null;
        advantage: 'advantage' | 'neutral' | 'disadvantage'; colorMatch?: boolean }
    | { kind: 'effect-landed'; cardId: string; effectId: string; target: 'self' | 'enemy';
        effectKind: CardEffectKind; intensity: number; effect: Effect }
    | { kind: 'effect-fizzled'; cardId: string; effectId: string; message: string }
    // A `strip_random_buff` mechanic (e.g. Ad Hominem Strike) removed one buff
    // from a combatant. `effectId`/`effectName` are null when there was no buff
    // to strip. Surfaced so the live combat log can show the harassment landing.
    | { kind: 'buff-stripped'; cardId: string; target: 'self' | 'enemy';
        effectId: string | null; effectName: string | null }
    | { kind: 'damage-dealt'; cardId: string; target: 'self' | 'enemy'; amount: number }
    | { kind: 'die-refreshed'; dieId: string; color: CombatDieColor }
    | { kind: 'die-spent'; dieId: string; color: CombatDieColor }
    | { kind: 'dot-tick'; effectId: string; label: string; amount: number; target: 'self' | 'enemy' }
    // ── 0.34.0 status-depth epic — new card-mechanic events ──────────────────
    | { kind: 'rupture-detonated'; amount: number; consumed: string[] }
    | { kind: 'amplify-detonated'; amount: number; pendingDot: number }
    | { kind: 'compound-hit'; amount: number; debuffs: number }
    | { kind: 'disrupt-denied'; pips: number }
    | { kind: 'thorns-reflected'; amount: number; target: 'enemy' }
    | { kind: 'barrier-absorbed'; amount: number }
    | { kind: 'riposte-fired'; amount: number }
    | { kind: 'execute-fired'; amount: number; recoil: number }
    // Master Spec §4 — wild-die permanent-growth mechanic. `grant_permanent_wild_die`
    // cards fire this when powered by a die (weak plays never touch the pool).
    | { kind: 'permanent-wild-die-granted'; wildAdded: number; deadAdded: number; totalWild: number }
    | { kind: 'conclude-hit'; amount: number; totalStacks: number }
    // ── Fate Engine P1 (spec 31 §1) — dice-layer events ──────────────────────
    | { kind: 'die-banked'; dieId: string; color: CombatDieColor; pips: number }
    | { kind: 'die-ripened'; dieId: string; pips: number }
    | { kind: 'omen-revealed'; dieColor: CombatDieColor; phaseIndex: number; stance: Stance }
    | { kind: 'fate-tapped'; dieId: string; choice: 'dot-tick' | 'conviction'; amount: number }
    | { kind: 'resonance-gained'; color: 'heart' | 'body' | 'mind'; total: number }
    | { kind: 'threshold-fired'; cardId: string; color: 'heart' | 'body' | 'mind'; count: number; riderText: string }
    | { kind: 'die-bonus-fired'; cardId: string; riderText: string }
    | { kind: 'fate-powered'; cardId: string; dieId: string; recoil: number; riderText: string }
    | { kind: 'pips-cashed'; cardId: string; pips: number; bonus: 'intensity' | 'guard'; amount: number }
    | { kind: 'react-detonated'; cardId: string; amount: number; consumed: string[] }
    | { kind: 'die-forged'; dieId: string; color: CombatDieColor; destination: 'reserve' | 'conviction' }
    | { kind: 'die-converted'; dieId: string; color: CombatDieColor }
    // ── Spec 32 v3 — themed-deck events ──────────────────────────────────────
    | { kind: 'die-floated'; dieId: string; color: CombatDieColor; poolSize: number }
    | { kind: 'floating-die-spent'; dieId: string; color: CombatDieColor; poolSize: number }
    // Spec 32 v4 — `temporary`/`roundsLeft` are set when the card entered play via
    // the FREE (dieless) line (a timed instance); absent/false = the PAID permanent
    // play (rest of combat).
    | { kind: 'enchant-played'; cardId: string; name: string; temporary?: boolean; roundsLeft?: number }
    | { kind: 'disenchant-attached'; cardId: string; name: string; temporary?: boolean; roundsLeft?: number }
    // Spec 32 v4 — a FREE-line temporary enchant/disenchant ticked out of its zone.
    | { kind: 'enchant-expired'; cardId: string; name: string; side: 'player' | 'enemy' }
    | { kind: 'premise-gained'; amount: number; total: number }
    | { kind: 'peroration-declared'; cardId: string; at: number }
    | { kind: 'peroration-fired'; cardId: string; premisesSpent: number }
    | { kind: 'premises-spent'; spent: number; marks: number; drawn: number }
    | { kind: 'staggered'; rungs: number; total: number }
    | { kind: 'backfired'; amount: number; rungs: number }
    | { kind: 'rung-regrown'; rungs: number; total: number }
    | { kind: 'stance-locked'; phaseIndex: number; stance: Stance }
    | { kind: 'foretold'; count: number; topCardId: string | null }
    | { kind: 'omen-declared'; cardId: string; stance: CombatDieColor; phaseIndex: number }
    | { kind: 'omen-hit'; cardId: string; phaseIndex: number; riderText: string }
    | { kind: 'omen-missed'; cardId: string; phaseIndex: number }
    | { kind: 'soul-gained'; amount: number; total: number; reason: 'expiry' | 'consumed' | 'granted' }
    | { kind: 'reaped'; cardId: string; soulsSpent: number; amount: number }
    | { kind: 'sway-gained'; amount: number; total: number }
    | { kind: 'sway-decayed'; total: number }
    | { kind: 'echoed'; cardId: string }
    | { kind: 'reprised'; cardId: string; returned: string[] }
    | { kind: 'dots-extended'; turns: number; affected: string[] }
    | { kind: 'dots-converted'; from: string; to: string; intensity: number }
    | { kind: 'dots-boosted'; intensity: number; affected: string[] }
    | { kind: 'affliction-consumed'; effectId: string; fuel: number }
    | { kind: 'recoil-paid'; cardId: string; amount: number }
    | { kind: 'phase-resolved'; phaseIndex: number; mark: 'clear' | 'overwhelmed' }
    | { kind: 'threat-fired'; phaseIndex: number; description: string; effects: CombatThreatEffect[] }
    | { kind: 'hand-drawn'; cards: string[] }
    | { kind: 'mercy-opened'; message: string }
    // THE CLOCK, discrete tier (combat-depth-epic): every
    // THREAT_ENCHANT_CURSE_EVERY_ROUNDS the enemy grows a new passive
    // strength or lays a fresh curse on the player.
    | { kind: 'threat-clock-enchant'; target: 'enemy' | 'player'; effectId: string; round: number }
    | { kind: 'combat-ended'; outcome: CombatOutcome };

// ---------------------------------------------------------------------------
// Top-level encounter state (Spec 25 §4.1)
// ---------------------------------------------------------------------------

export interface CombatEncounterState {
    phase: CombatEncounterPhase;
    enemy: Enemy;                          // unchanged — HP, effects, stats (deep-cloned)
    player: Character;                     // unchanged — HP, effects, stats (deep-cloned)
    /** Spec 26b §1 — the CURRENT TURN's rolled dice (2 of them). Rolled fresh
     *  each turn; one is drafted as the stance, the other → Conviction. */
    dice: CombatManaDie[];
    /** The drafted stance die id for this turn (null before draft / between turns). */
    draftedDieId: string | null;
    /** Turn counter within the encounter (drives die ids + display). */
    turn: number;
    /** Conviction (◆) bank — funds Signature Skills (Spec 26b §4). */
    conviction: number;
    /** Hazard GUARD — a transient shield (HP) granted by defense cards that
     *  absorbs the enemy's NEXT telegraphed threat, then resets each phase.
     *  Optional for back-compat with state literals (treated as 0 when absent). */
    guard?: number;
    /** BARRIER — a STACKING, persistent damage soak (distinct from the per-phase
     *  `guard`, which resets every phase). Absorbed AFTER guard in
     *  `resolveThreatPhase`; only the absorbed amount is subtracted, the rest
     *  carries across phases. Optional for back-compat with state literals
     *  (treated as 0 when absent). 0.34.0 status-depth epic. */
    barrier?: number;
    /** RIPOSTE — a one-shot parry armed by a Briar Riposte card: reduces the
     *  enemy's next telegraphed hit by `reduce` and counters for `damage`. Cleared
     *  each phase (like guard). Optional for back-compat with state literals.
     *  0.34.0 status-depth epic. */
    riposte?: { damage: number; reduce: number };
    /** Phase indices whose hidden enemy stance the player has revealed (§2). */
    revealedStances: number[];
    /** Read result of the most recent draft (transient — for the UI flash). */
    lastRead: CombatReadResult;
    /** Distinct OFFENSIVE effect ids landed during the current drafted-die chain
     *  (this turn). The status-combo loop refreshes the die only when a card lands
     *  a status NEW to this chain, so a long "big turn" comes from playing
     *  DIFFERENT cards; re-applying the same status ends the turn. Reset on each
     *  draft. Optional for back-compat with state literals. */
    chainEffectIds?: string[];
    /** A carried unspent drafted die color, kept into the next turn so a good die
     *  isn't wasted (Spec 26b tuning §3). Null when nothing carried.
     *  @deprecated Fate Engine P1 — superseded by the visible `reserve` (R2).
     *  Kept for state-literal back-compat; the engine no longer writes it. */
    carriedDie: CombatDieColor | null;
    /**
     * Fate Engine P1 (spec 31 R2) — the RESERVE: banked dice (max
     * `RESERVE_MAX`), each ripening +1 pip per threat phase survived. A bottom
     * action may be powered by the drafted die OR a Reserve die (still exactly
     * one die — the single-die law is untouched). Optional for back-compat
     * (absent = empty).
     */
    reserve?: CombatManaDie[];
    /**
     * Fate Engine P1 (spec 31 R1) — the RESONANCE tally: every die spent this
     * encounter (powering, burning for Conviction, banking) adds 1 of its color;
     * a Wild adds to the color of the card it powered. Cards with a `threshold`
     * check this tally at play time. Optional for back-compat (absent = zeros).
     */
    resonance?: { heart: number; body: number; mind: number };
    /**
     * Fate Engine P1 (spec 31 R4) — the turn number of the last universal
     * FATE TAP (tap an X die → +1 tick on one enemy DoT or +1 Conviction),
     * gating it to once per turn. Optional for back-compat (absent = never).
     */
    fateTappedTurn?: number;
    /** The player's archetype (dominant base stat). */
    archetype: PlayerArchetype;
    /** The player's resolved Signature Skill kit for this combat (per-archetype). */
    signatures: SignatureSkillId[];
    deck: string[];                        // full combat deck (card ids) — reshuffle source
    drawPile: string[];                    // remaining draw order
    discard: string[];                     // used / discarded card ids
    hand: CombatHandEntry[];               // current hand (up to 5)
    persistentZone: string[];              // player-side ENCHANTMENTS (spec 32 v3 §2.1)
    /** Spec 32 v3 §2.1 — DISENCHANTS the player attached to the ENEMY (standing
     *  curses, rest of combat). Optional for back-compat (absent = none). */
    enemyAttachments?: string[];
    /** Spec 32 v4 §2.1 — TEMPORARY player-side enchantments from the FREE (dieless)
     *  line: the same themed passive as the PAID version, but timed. `roundsLeft`
     *  ticks down each round in `processBetweenPhases`; the entry drops at 0. A
     *  PAID play of the same card promotes it to the permanent `persistentZone`.
     *  Optional for back-compat (absent = none). */
    tempZone?: { cardId: string; roundsLeft: number }[];
    /** Spec 32 v4 §2.1 — TEMPORARY enemy-attached disenchants from the FREE line;
     *  the timed mirror of `enemyAttachments`. Same tick/promote rules as
     *  {@link tempZone}. Optional (absent = none). */
    enemyTempAttachments?: { cardId: string; roundsLeft: number }[];
    /** Spec 32 v3 §10 — the enemy's own persistent passives (seeded from the
     *  bestiary) + disenchants IT attached to the player live here. Optional. */
    enemyEnchantments?: string[];
    playerAttachments?: string[];
    /** Spec 32 v3 §5 — the FLOATING die pool (live tray): merged into every
     *  turn's dice, exempt from rerolls, persists across combats. Optional. */
    floatingDice?: CombatManaDie[];
    /** Spec 32 v3 T2 — the PREMISE tally (Peroration theme). Optional. */
    premises?: number;
    /** Spec 32 v3 T2 — the declared PERORATION (one in play at a time). */
    peroration?: { cardId: string; at: number; concedeAt?: number } | null;
    /** Spec 32 v3 T5 — STAGGER rungs accumulated against the enemy's NEXT
     *  telegraphed action (consumed at threat resolution). Optional. */
    staggerRungs?: number;
    /** plan/tuning/2026-07-08-win-path-scaling.md item 1c — boss/unique
     *  anti-permalock: rungs a boss/unique has REGROWN back after a phase
     *  where its telegraph was denied/weakened by STAGGER. Raises the
     *  effective rung total (`THREAT_RUNGS_BOSS` + this, capped at double)
     *  so a denial deck that reliably meets the flat threshold every round
     *  cannot lock a boss out of acting for the whole fight. Normal enemies
     *  never accrue this. Optional (absent = 0, byte-identical to before). */
    bossRungGrowth?: number;
    /** Spec 32 v3 T5 — arrow-paradox: the NEXT phase keeps the current stance. */
    stanceLockedNext?: boolean;
    /** Spec 32 v3 T6 — pending OMENS awaiting the next phase boundary. */
    pendingOmens?: { cardId: string; stance: 'heart' | 'body' | 'mind'; phaseIndex: number }[];
    /** Spec 32 v3 T6 — omens that CAME TRUE this combat (Oracle payoff fuel). */
    omenHits?: number;
    /** Spec 32 v3 T7 — the SOUL bank (Harvest currency). Optional. */
    souls?: number;
    /** Spec 32 v3 T8 — SWAY on the enemy (decays 1/turn; ≥ enemy HP at a turn
     *  boundary → CAPITULATE). Optional. */
    sway?: number;
    /** Spec 32 v3 T10 — the next spell played this turn gains ECHO. */
    echoNextSpell?: boolean;
    /** Spec 32 v3 T10 — spells played this turn (resonant-chamber's gate). */
    spellsPlayedThisTurn?: number;
    /** Spec 32 v3 T10 — the last PAID spell resolved this combat (ouroboros). */
    lastSpellCardId?: string | null;
    /** Spec 32 v3 — uids of CONJURED one-use Thoughtforms (removed on play). */
    conjuredUids?: string[];
    threatPhases: CombatThreatPhase[];     // enemy's authored / generated threat sequence
    threatMarks: CombatThreatMark[];       // O / X ledger per phase (hindered / acted)
    currentPhaseIndex: number;             // 0-indexed into threatPhases
    phaseResults: CombatPhaseResult[];     // completed phase records
    combatResources: CombatResources;      // Fallacy/Paradox bank (+ stance scratch)
    round: number;                         // total rounds elapsed
    /** Per-effect attribution accumulator keyed by the card that applied it. */
    attribution: Record<string, CombatAttributionRow>;
    directDamageDealt: number;             // raw HP damage (for the summary)
    log: CombatEvent[];                    // event stream for UI rendering
    finalOutcome: CombatOutcome | null;    // null until combat ends
    /** Phase 112 — set when a successful Befriend / Control Saturation opens the
     *  spare/exploit mercy choice. */
    mercyChoiceActive?: boolean;
    /**
     * Master Spec §4 — permanent wild-die pool growth. Unlike `dice` (rolled
     * fresh each turn) and `carriedDie` (one turn's carryover), these persist
     * for the REST of the encounter once granted by a `grant_permanent_wild_die`
     * card special mechanic: `startTurn` appends `permanentWildDice` extra Wild
     * dice and `permanentDeadDice` extra locked X dice to every turn's draft
     * pool from here on. Never reset by `startTurn`/`endTurn`. Optional for
     * back-compat with state literals (treated as 0 when absent).
     */
    permanentWildDice?: number;
    /** See `permanentWildDice`. Every permanent Wild die is paired with one
     *  permanent dead (locked `x`) die — the visible "fate pushes back" cost. */
    permanentDeadDice?: number;
    seed?: number;                         // seed used to drive the encounter (sim/tests)
}

/** Return shape of every engine transition (mirrors `CardResolution`). */
export interface CombatTransition {
    state: CombatEncounterState;
    events: CombatEvent[];
}

/** A snapshot of one live effect for HP attribution. */
export interface LandedEffect {
    effectId: string;
    effect: Effect;
    active: ActiveEffect;
    target: 'self' | 'enemy';
}
