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

/** Phase 31 — the three stance colors the combat MOMENTUM wheel and THE
 *  STAKE both key off (a strict subset of {@link CombatDieColor}: wild/x
 *  never participate in either mechanic). */
export type WheelStance = 'heart' | 'body' | 'mind';

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
     * Spec 32 v3 §5 — a GHOST die: forged by the FORGE verb, joins the tray
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
    /**
     * Spec 33 (Upgradeable Dice, flag-gated) — the FACE this fixed-color die
     * rolled this round: `mana` powers a card of its color, `special` powers a
     * card AND fires its gear payload (+◆) when USED, `miss` is dead (state
     * `locked`). Absent on every legacy face-bag die — flag-off states never
     * carry it.
     */
    face?: 'special' | 'mana' | 'miss';
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
    | 'stat-debuff'       // applies exposure debuffs (MARK / QUARTER) → soft control
    | 'buff-self'         // buffs the player / engine verbs → utility
    | 'direct-damage'     // status-payoff bursts (RUPTURE / REAP) — never raw strikes
    | 'befriend'          // Befriend card → opens the mercy choice (§6 Q6)
    | 'defend'            // Guard/defense card → shields against the enemy's next threat
    | 'oath'              // spec 32 v3 — persistent player-side passive (spec 34 R-9: renamed from enchant)
    | 'hex'               // spec 32 v3 — persistent curse attached to the enemy (spec 34 R-10: renamed from disenchant)
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
    /** Spec 32 v3 — rank 1-6 (Ash → Saint); printed on the face. */
    rank?: 1 | 2 | 3 | 4 | 5 | 6;
    /** Spec 32 v3 — card type (spell / oath / hex). */
    cardType?: 'spell' | 'oath' | 'hex';
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
    /** Chosen X for a chosen-X mechanic (`recoil_x`, WS7.2); the engine clamps
     *  it to [min, affordable]. Absent → the printed minimum. */
    chosenX?: number;
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
    | 'draw'           // draw cards + refund Conviction (mind economy)
    // Phase 85 (equipment progression — head/hands/feet accessories):
    | 'empower'        // grant WRATH: every future hit lands harder, for the rest of the fight, never fades (body)
    | 'surge';         // grant CHAIN: the next hit lands harder, fades if the turn adds no more (body)

export type SignatureSkillId =
    | 'sig-read-opponent'
    | 'sig-press-the-point'
    | 'sig-second-wind'
    | 'sig-overwhelming-argument'
    | 'sig-conviction-strike'
    // Per-archetype exclusives (Spec 26b tuning §B)
    | 'sig-disarming-plea'    // heart
    | 'sig-rallying-blow'     // body
    | 'sig-clever-gambit'     // mind
    // Phase 85 — head/hands/feet accessory relics
    | 'sig-mounting-dread'    // mind (head)
    | 'sig-endless-labor'     // body (hands)
    | 'sig-unbroken-stride';  // body (feet)

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
    /** WS9 (spec 32 §12 #7) — the enemy sheds up to this many of its OWN
     *  afflictions when the action fires (spec 29 guardrail: a fraction,
     *  never the last one). Written only by the threat-branch resolver. */
    enemyCleanse?: number;
    /** Phase 33a — enemy counterplay against the player's PLEA
     *  (charm/grace RELENT) track: reduces the live `sway` value by
     *  this flat amount, floored at 0. Never resets the milestone-fired
     *  flags (`swayMilestoneWaveringFired`/`swayMilestoneFalteringFired`)
     *  — only the raw counter moves. Authorable on any threat phase,
     *  branch or linear. */
    swayCleanse?: number;
    /** Phase 33a — enemy counterplay against the player's Premise
     *  (peroration/oratory CONDEMN) track: reduces the live, spendable
     *  `premises` tally by this flat amount, floored at 0. Never touches
     *  `premiseMilestoneTotal` (the lifetime milestone-drip counter).
     *  Authorable on any threat phase, branch or linear. */
    premiseShed?: number;
    /** Phase 33d (GLYPHS pilot) — enemy counterplay against the player's
     *  GLYPHS zone: mirrors `swayCleanse`/`premiseShed`'s shape exactly.
     *  When true (and `!doubtId`, and the player controls >= 1 glyph),
     *  destroys the LOWEST-charge glyph (stable first-on-tie, no RNG).
     *  Authorable on any threat phase, branch or linear. */
    glyphShatter?: boolean;
    /** Profane-canon rework — CURSE INJECTION (the StS/Arkham deck-
     *  contamination vector): when the action fires, this curse card is
     *  shuffled into the player's COMBAT deck cycle (persistent collection
     *  untouched; the injection dies with the encounter). The player answers
     *  with PURGE (playing the curse exiles it) or IMMOLATE (burning it as
     *  fuel). Mirrors `swayCleanse`/`premiseShed`'s authoring shape. */
    curseCardId?: string;
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

/**
 * WS9 (spec 32 §12 item 7, Ratified 2026-07-11) — a threat branch's authored
 * condition. CLOSED union, authored data only, zero RNG: the fork commits from
 * observable state at phase START, so the telegraph can show both outcomes AND
 * the reason the taken one was taken.
 */
export type ThreatBranchCondition =
    | { kind: 'bearer-afflictions-gte'; n: number }   // the ENEMY carries >= n afflictions
    | { kind: 'prior-threat-fully-blocked' };         // `lastThreatFullyBlocked` ledger

/** One fully-resolved fork of a branch phase (the telegraph shows both). */
export interface CombatThreatBranchOutcome {
    enemyStance: Stance;
    threatAction: CombatThreatAction;
    intentType?: CombatIntentType;
    stanceHint?: string;
    /** Phase 33b — this fork's authored STAGGER-rung count (1-4), overriding
     *  the flat `THREAT_RUNGS`/`THREAT_RUNGS_BOSS` default. Undefined = the
     *  fork carries the enemy's natural rung count. */
    rungs?: number;
    /** Phase D9 (spec 33 §2) — this fork's authored open stance check, if any.
     *  Carried onto the committed phase by `commitThreatBranch`. Undefined =
     *  no authored check on this fork (the `getThreatSequence` backfill fills
     *  the uniform default). */
    stanceCheck?: { punishes?: Stance; yields?: Stance };
    /** Phase 33c (spec 33 §1) — this fork carries THE COVETED DIE. Undefined =
     *  no coveted die on this fork (the common case; no boss/unique fork is
     *  authored with one — see `combat.threat-sequences.ts`). */
    stake?: boolean;
}

/**
 * WS9 — the branch payload carried on a resolved `CombatThreatPhase`. While the
 * phase is upcoming (`taken` undefined) the phase's top-level face is the ELSE
 * (baseline) fork and the telegraph surfaces `conditionText` + both outcomes;
 * at phase START the engine evaluates the condition, copies the taken fork
 * onto the face, and stamps `taken`.
 */
export interface CombatThreatBranch {
    condition: ThreatBranchCondition;
    /** Human condition text, e.g. "if it carries 3+ afflictions". */
    conditionText: string;
    then: CombatThreatBranchOutcome;
    else: CombatThreatBranchOutcome;
    /** The fork committed at phase START (undefined while still upcoming). */
    taken?: 'then' | 'else';
}

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

    /** WS9 (spec 32 §12 #7) — conditional fork: condition + BOTH outcomes,
     *  committed at phase START (`commitThreatBranch`). Undefined on every
     *  linear phase — byte-identical to before. */
    branch?: CombatThreatBranch;

    /** Phase 33b — variable-rung telegraph: this phase's authored STAGGER-rung
     *  count (1-4), overriding the flat `THREAT_RUNGS`/`THREAT_RUNGS_BOSS`
     *  default (`computeRungDenial`, `combat.engine.ts`). Undefined = the
     *  phase carries the enemy's natural (difficulty-derived) rung count —
     *  every phase authored before this epic behaves exactly as before. */
    rungs?: number;

    /** Spec 33 §2 (Upgradeable Dice, flag-gated) — the phase's OPEN stance
     *  check, resolved against the player's stance-from-cards at phase END
     *  (`resolveThreatPhase`): ending in `punishes` lands the hit at
     *  `READ_DAMAGE_MULT.advantage` (x1.5); ending in `yields` blunts it to
     *  `READ_DAMAGE_MULT.disadvantage` (x0.5) and pays +1 Conviction. No
     *  hidden information — the telegraph renders both fields. Undefined =
     *  no check this phase (and always inert while the flag is off). */
    stanceCheck?: { punishes?: Stance; yields?: Stance };

    /** Phase 33c (spec 33 §1) — this phase carries THE COVETED DIE: denying
     *  its telegraph (STAGGER-to-0), fully blocking it, or answering its
     *  `stanceCheck`'s `yields` converts it to a temp gold die
     *  (`resolveThreatPhase`, ceiling-gated — overflow → +1◆). Authored ONLY
     *  on one phase (the 2nd authored step) per BOSS/UNIQUE
     *  `AUTHORED_THREAT_SEQUENCES` entry — never backfilled, never on
     *  elite/normal/simple. Undefined = no coveted die this phase (the
     *  common case). Inert while the flag is off. */
    stake?: boolean;
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
    /** ACTUAL DoT damage the enemy took from ticks of THIS card's effects, summed
     *  from emitted `dot-tick` events at summary time (WI-9). No longer a
     *  projection of the DoT's whole life — post trigger-migration a poison/bleed
     *  can sit for its whole duration and never tick. */
    dotDamage: number;
    /** Total DIRECT HP damage this card dealt the enemy now (strikes + payoff
     *  bursts), overkill-clamped to HP actually applicable. */
    damageDealt: number;
    /** Phases across which the card's effects were active. */
    phases: number;
    /** WI-9 — the DoT effect ids this card applied, so the summary can attribute
     *  their ACTUAL emitted ticks back to this card. Optional (absent = none). */
    effectIds?: string[];
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
    | 'capitulate' // PLEA reached live resolve and the player explicitly accepted the yield
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
    // Gate 0 (2026-07-10 round-turn law) — a second `startTurn` inside one
    // threat phase was refused (the state is untouched; the tray stays as-is).
    | { kind: 'turn-law-blocked'; turn: number; phaseIndex: number }
    | { kind: 'die-drafted'; dieId: string; color: CombatDieColor; read: CombatReadResult }
    | { kind: 'conviction-gained'; amount: number; total: number; reason: 'unpicked-die' | 'read-win' | 'effect' | 'scrap' }
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
    // Phase 32 part 4c (Forge — OVERHEAT): a pip pushed past `RESERVE_PIP_CAP`
    // busted — the targeted die's pips are HALVED (floored), not zeroed (a
    // partial setback, not a wipeout — Quacks' own bust cost is "choose
    // points or coins, not both," never total loss). A SUCCESSFUL overheat
    // push still reuses 'die-ripened' (the pip count simply now exceeds the
    // safe cap); this event exists only for the bust half of the gamble, own
    // event so 'die-ripened' consumers are unaffected, matching
    // 'debt-tier-payoff'/'max-hp-eroded' precedent.
    | { kind: 'overheat-bust'; dieId: string; cardId: string; pips: number }
    | { kind: 'omen-revealed'; dieColor: CombatDieColor; phaseIndex: number; stance: Stance }
    | { kind: 'fate-tapped'; dieId: string; choice: 'dot-tick' | 'conviction'; amount: number }
    | { kind: 'resonance-gained'; color: 'heart' | 'body' | 'mind'; total: number }
    | { kind: 'threshold-fired'; cardId: string; color: 'heart' | 'body' | 'mind'; count: number; riderText: string }
    | { kind: 'die-bonus-fired'; cardId: string; riderText: string }
    | { kind: 'fate-powered'; cardId: string; dieId: string; recoil: number; riderText: string }
    // WS4.1 — `bonus: 'mark'` = spend_all_pips `markPer` (amount = MARK stacks
    // landed); `pips-overflowed` = grant_pip pips that found no room and fired
    // the printed overflow rider instead (Slag Runoff class).
    | { kind: 'pips-cashed'; cardId: string; pips: number; bonus: 'intensity' | 'guard' | 'mark'; amount: number }
    | { kind: 'pips-overflowed'; cardId: string; pips: number; riderText: string }
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
    // Phase 32 part 4b (Oratory — milestone drip): fires alongside
    // 'premise-gained' whenever a NEW lifetime Premise milestone is crossed —
    // own event (not a field on 'premise-gained') so existing consumers are
    // unaffected, matching 'debt-tier-payoff's precedent from Part 3.
    // 'total' is the lifetime `premiseMilestoneTotal`, not the (resettable)
    // spendable Premise tally 'premise-gained' reports.
    | { kind: 'premise-milestone'; tiersCrossed: number; rungs: number; total: number }
    | { kind: 'peroration-declared'; cardId: string; at: number }
    | { kind: 'peroration-fired'; cardId: string; premisesSpent: number }
    | { kind: 'premises-spent'; spent: number; marks: number; drawn: number }
    | { kind: 'staggered'; rungs: number; total: number }
    | { kind: 'backfired'; amount: number; rungs: number }
    | { kind: 'rung-regrown'; rungs: number; total: number }
    | { kind: 'stance-locked'; phaseIndex: number; stance: Stance }
    | { kind: 'foretold'; count: number; topCardId: string | null }
    // Phase 32 part 4d (Oracle — OMEN v2): `window` and `ante` are the
    // player's resolved CLAIM (window clamped to the card's printed
    // `maxWindow`; ante already deducted from Conviction in this same play,
    // clamped to what was affordable — see `omenClaim` on `playCombatCard`).
    | { kind: 'omen-declared'; cardId: string; stance: CombatDieColor; phaseIndex: number; window: number; ante: number }
    | { kind: 'omen-hit'; cardId: string; phaseIndex: number; riderText: string }
    // `expired: true` — the window is now exhausted (0 tries left); the
    // pending claim is gone for good, its ante already sunk. `expired: false`
    // — a wider claim missed THIS boundary but still has tries left and
    // stays in `pendingOmens`.
    | { kind: 'omen-missed'; cardId: string; phaseIndex: number; expired: boolean }
    | { kind: 'soul-gained'; amount: number; total: number; reason: 'expiry' | 'consumed' | 'granted' }
    // ── THE BIG NUMBERS REWRITE (2026-09-02) — the damage-scaler ledgers ─────
    /** WRATH gained: a combat-long flat bonus to every hit the player lands. */
    | { kind: 'wrath-gained'; cardId: string; amount: number; total: number }
    /** FLAY stacks applied to the foe (each spends on one of the next hits). */
    | { kind: 'flay-applied'; cardId: string; amount: number; total: number }
    /** CHAIN gained: a bonus to the player's NEXT hit, spent on landing. */
    | { kind: 'chain-gained'; cardId: string; amount: number; total: number }
    /** CHAIN faded at the turn boundary: no play fed it this turn. */
    | { kind: 'chain-faded'; from: number }
    /** TWIN armed: the next PAID spell this turn resolves twice. */
    | { kind: 'twin-armed'; cardId: string }
    /** TWIN fired: this spell's PAID payload resolved a second time. */
    | { kind: 'twin-fired'; cardId: string }
    /** OVERKILL converted the damage that overshot the foe's last VITAE. */
    | { kind: 'overkill-cashed'; cardId: string; excess: number }
    /** A foe crossed one of its STAGE thresholds and became another fight. */
    | { kind: 'stage-entered'; enemyId: string; name: string; text: string }
    /** An enemy keyword changed the arithmetic of a resolved threat. */
    | { kind: 'enemy-keyword-fired'; enemyId: string; keyword: string; amount?: number }
    /**
     * The foe's VITAE went UP (playtest fix 2026-09-04). `amount` is the HP
     * ACTUALLY restored after the max-VITAE clamp — never the printed figure —
     * so the attribution ledger can reconcile "HP lost" against damage dealt.
     * Every enemy-heal site (RAVENOUS, REGROW, a STAGE's `heal`, a threat's
     * `enemyHeal`) emits one; `enemy-keyword-fired` stays the popup, this is
     * the ledger row.
     */
    | { kind: 'enemy-healed'; enemyId: string; source: 'RAVENOUS' | 'REGROW' | 'STAGE' | 'THREAT'; amount: number }
    | { kind: 'reaped'; cardId: string; soulsSpent: number; amount: number }
    // Phase 32 part 1 (Harvest — REAP attacks MAXIMUM HP): fires alongside
    // 'reaped' whenever a REAP verb (single or ALL) permanently lowers the
    // enemy's ceiling. Own event rather than a field on 'reaped' so existing
    // 'reaped' consumers are unaffected and the erosion gets its own legible
    // telemetry hook (e.g. a future mobile toast).
    | { kind: 'max-hp-eroded'; cardId: string; amount: number; newMax: number }
    | { kind: 'sway-gained'; amount: number; total: number }
    // Phase 32 part 4e (Charm — Resolve milestones): fires alongside
    // 'sway-gained' whenever PLEA crosses a NEW named fractional waypoint of
    // the enemy's live `capitulateThreshold` — own event (not a field on
    // 'sway-gained') so existing 'sway-gained' consumers are unaffected,
    // matching 'premise-milestone'/'debt-tier-payoff' precedent. 'threshold'
    // is the live waypoint value crossed (see `swayResolveMilestoneThresholds`);
    // 'total' is the PLEA total AFTER this milestone's own dividend (the
    // Faltering bonus PLEA included). Discriminated by 'milestone' so each
    // variant's own payoff field is real, not a shared/optional guess.
    | { kind: 'sway-milestone'; milestone: 'wavering'; threshold: number; total: number; effectId: string; intensity: number }
    | { kind: 'sway-milestone'; milestone: 'faltering'; threshold: number; total: number; bonus: number }
    | { kind: 'sway-decayed'; total: number }
    | { kind: 'capitulation-offered'; threshold: number }
    | { kind: 'capitulation-declined' }
    | { kind: 'echoed'; cardId: string }
    | { kind: 'reprised'; cardId: string; returned: string[] }
    | { kind: 'dots-extended'; turns: number; affected: string[] }
    | { kind: 'dots-converted'; from: string; to: string; intensity: number }
    | { kind: 'dots-boosted'; intensity: number; affected: string[] }
    | { kind: 'affliction-consumed'; effectId: string; fuel: number }
    | { kind: 'recoil-paid'; cardId: string; amount: number }
    // Phase 32 part 3 (Akrasia — DEBT ledger): fires alongside 'recoil-paid'
    // whenever RECOIL HP posts to the per-combat ledger — own event (not a
    // field on 'recoil-paid') so existing 'recoil-paid' consumers are
    // unaffected, matching 'max-hp-eroded's precedent from Part 1.
    | { kind: 'debt-paid'; amount: number; total: number }
    // The tiered payoff: fires only when a NEW debt tier is crossed WHILE
    // FALLEN — 'tiersCrossed' lets a single big RECOIL cross more than one.
    | { kind: 'debt-tier-payoff'; tiersCrossed: number; guard: number; total: number }
    // Phase 32 part 4a (Control — TURNABOUT): the ledger cashed out — every
    // rung STAGGER/BACKFIRE ever denied this combat converts to one burst,
    // then `rungsDeniedTotal` resets to 0 in the SAME call (no stale read).
    | { kind: 'turnabout-fired'; cardId: string; rungsSpent: number; amount: number }
    | { kind: 'phase-resolved'; phaseIndex: number; mark: 'clear' | 'overwhelmed' }
    | { kind: 'threat-fired'; phaseIndex: number; description: string; effects: CombatThreatEffect[] }
    // WS9 (spec 32 §12 #7) — a branch phase committed its fork at phase START.
    | { kind: 'threat-branch'; phaseIndex: number; conditionText: string; taken: 'then' | 'else' }
    // WS9 — the enemy's reactive cleanse shed some of its own afflictions.
    | { kind: 'threat-cleansed'; phaseIndex: number; effectIds: string[] }
    // Phase 33a — the enemy's reactive counterplay shed the player's live
    // PLEA / spendable Premise tally (never their milestone flags / the
    // lifetime premiseMilestoneTotal counter).
    | { kind: 'threat-sway-cleansed'; phaseIndex: number; amount: number }
    | { kind: 'threat-premise-shed'; phaseIndex: number; amount: number }
    // Profane-canon rework — deck contamination + its answers. `curse-injected`
    // fires when an enemy action shuffles a curse into the player's combat
    // deck cycle; `immolated` when a play burns hand cards as fuel (they leave
    // the combat); `purged` when a curse card exiles itself on play.
    | { kind: 'curse-injected'; phaseIndex: number; cardId: string }
    | { kind: 'immolated'; cardId: string; burned: string[] }
    | { kind: 'purged'; cardId: string }
    // Phase 33d (GLYPHS pilot) — the charge-and-crack seal zone. Inscribe
    // (PAID line), charge (FREE line or the between-phases tick — the tick
    // itself is silent, see `processBetweenPhases`), crack (`crackGlyph`),
    // and the enemy counterplay hook (`glyphShatter`, mirrors the 33a pair).
    | { kind: 'glyph-inscribed'; glyphId: string; cardId: string }
    | { kind: 'glyph-charged'; glyphId: string; charges: number; cap: number }
    | { kind: 'glyph-cracked'; glyphId: string; cardId: string; charges: number }
    | { kind: 'glyph-shattered'; phaseIndex: number }
    | { kind: 'hand-drawn'; cards: string[] }
    | { kind: 'cards-milled'; cards: string[] }
    | { kind: 'mercy-opened'; message: string }
    // THE CLOCK, discrete tier (combat-depth-epic): every
    // THREAT_ENCHANT_CURSE_EVERY_ROUNDS the enemy grows a new passive
    // strength or lays a fresh curse on the player.
    | { kind: 'threat-clock-enchant'; target: 'enemy' | 'player'; effectId: string; round: number }
    // Phase 31 — the engine-native momentum wheel (ported from the mobile
    // host-side write; see `momentumWheel` on state).
    | { kind: 'wheel-lit'; lit: WheelStance[] }
    | { kind: 'wheel-completed'; dieId: string }
    // Phase 31 — THE STAKE: a pre-play Conviction wager on the hidden stance.
    | { kind: 'stake-placed'; color: WheelStance; amount: 2 | 4 | 6 }
    | { kind: 'stake-won'; color: WheelStance; payout: 'colored' | 'colored-pip' | 'wild' }
    | { kind: 'stake-lost'; amount: 2 | 4 | 6 }
    // ── Spec 33 (Upgradeable Dice, flag-gated) — none of these fire while the
    //    flag is off. ─────────────────────────────────────────────────────────
    // The player's stance shifted (stance = the last PAID card's stance).
    | { kind: 'stance-shifted'; stance: WheelStance }
    // Momentum chain advanced (length grew) or started (length 1).
    | { kind: 'momentum-advanced'; color: WheelStance; length: number }
    // A paid card of a non-successor color broke the chain to NULL (owner-locked
    // D1 rule: the breaking card builds nothing).
    | { kind: 'momentum-broken'; by: WheelStance }
    // The 3-color chain completed: a temporary gold die (until spent, this
    // combat) is granted and momentum resets to null.
    | { kind: 'momentum-surged'; dieId: string }
    // A BOON face fired its gear payload because its die was USED to power a
    // card (the owner-ratified use-triggered rule).
    | { kind: 'special-fired'; dieId: string; conviction: number; total: number }
    // Press Fate (flag-on form): 1 Conviction rerolled ALL miss faces, honestly.
    | { kind: 'press-fate-rerolled'; dieIds: string[]; cost: number }
    // The phase's open stance check resolved at phase end.
    | { kind: 'stance-check-resolved'; phaseIndex: number; outcome: 'punished' | 'yielded' | 'none'; stance: Stance | null }
    // The 7-object table ceiling refused a die grant; it converted to +1◆.
    | { kind: 'die-overflowed'; source: 'surge' | 'kindle' | 'materialize' | 'coveted'; total: number }
    // An OVERHEAT push armed a second play but cracked the die: all-miss next
    // round, excluded from that round's Press Fate.
    | { kind: 'die-cracked'; dieId: string; color: CombatDieColor }
    // Phase 33c — a boss/unique phase's coveted die was claimed: its telegraph
    // was denied (STAGGER-to-0), fully blocked, or its open stance check was
    // answered with a yield. `dieId` is absent when the table was full and the
    // payout converted to +1◆ instead (see the paired `die-overflowed` event).
    | { kind: 'coveted-die-stolen'; phaseIndex: number; method: 'stagger' | 'block' | 'yield'; dieId?: string }
    // Phase 102 (SUMMON) — the brood. Own events, never folded into
    // `threat-fired`/`penaltiesApplied`: the authored telegraph must keep
    // reporting only what the foe itself announced.
    | { kind: 'add-spawned'; enemyId: string; wave: number; addIds: string[]; bite: number }
    /** `raw` is the printed sum of bites; `dealt` is what survived armor /
     *  GUARD / BARRIER. Deliberately NOT counted in `attacksLanded`. */
    | { kind: 'add-bit'; addIds: string[]; raw: number; dealt: number }
    | { kind: 'add-struck'; addId: string; name: string; cost: number }
    | { kind: 'combat-ended'; outcome: CombatOutcome };

// ---------------------------------------------------------------------------
// GLYPHS (Phase 33d pilot) — sandbox-only charge-and-crack seals. See
// `plan/phases/phase_33d_glyphs_pilot.md`. No new keyword: both payloads
// speak existing status verbs (spec 32 v3 §3's 30-keyword cap untouched).
// ---------------------------------------------------------------------------

/** The closed set of payloads a glyph may carry — existing status verbs
 *  only, no new effect types. `baseIntensity`/`baseAmount` is the FLAT term
 *  printed on the inscribing card; `+ charges` (the accumulated charge
 *  count at crack time) is applied by `crackGlyph`, not printed here. */
export type GlyphPayload =
    | { kind: 'poison'; baseIntensity: number; duration: number }
    | { kind: 'barrier'; baseAmount: number };

/** A charge-and-crack seal on the battlefield: inscribed by a card's PAID
 *  line, charges +1/round (`processBetweenPhases`, capped at `cap`) or via a
 *  FREE-line `CardRider.glyphCharge`, and is cracked (player-initiated, via
 *  the exported `crackGlyph`) for its payload scaled by the accumulated
 *  `charges` — then removed. `id` is `${cardId}-${index-at-inscription}`, so
 *  it stays unique even if the same card is inscribed more than once. */
export interface GlyphInstance {
    id: string;
    cardId: string;
    payload: GlyphPayload;
    charges: number;
    cap: number;
}

/**
 * Phase 102 (SUMMON) — one member of a foe's brood. Deliberately NOT an
 * `Enemy`: no threat sequence, no stages, no keywords, no loot, no art, no
 * prose (cf. `Enemy/types.ts`, which is exactly the weight that makes literal
 * multi-enemy combat an XL job). `bite` is FLAT: the number printed on the
 * chip is the number the engine applies — it is resolved OUTSIDE the threat
 * loop's multiplier stack, so no escalation, stage bonus, weaken or stance
 * term ever touches it. Every shipped add is 1/1 VITAE (one `strikeAdd` kills
 * it); the vitae fields exist so the chip can show pips and a future
 * multi-strike add is representable without a state migration.
 */
export interface CombatAdd {
    id: string;
    name: string;
    vitae: number;
    maxVitae: number;
    bite: number;
}

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
    /** Gate 0 (2026-07-10 round-turn law) — true once this threat phase's ONE
     *  legal tray roll has happened (`startTurn` stamps it; the phase
     *  boundary in `resolveThreatPhase`/`processBetweenPhases` re-arms it).
     *  A second `startTurn` in the same phase is refused with a
     *  `turn-law-blocked` event. The law caps TRAY ROLLS, not card plays —
     *  Reserve and floating dice still power extra plays within the turn.
     *  Optional for back-compat with state literals (absent = false — the
     *  migration default). */
    turnTakenThisPhase?: boolean;
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
     * Fate Engine P1 (spec 31 R1) — the TOLL tally: every die spent this
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
    /** Phase 33d (GLYPHS pilot) — the player's live charge-and-crack seals.
     *  Optional, "absent = none" back-compat convention (same as `tempZone`).
     *  Ticked +1 charge/round (capped) in `processBetweenPhases`; charged via
     *  a FREE-line `CardRider.glyphCharge`; cracked via `crackGlyph`; culled
     *  by the enemy counterplay hook `CombatThreatEffect.glyphShatter`. */
    glyphs?: GlyphInstance[];
    /** Phase 102 (SUMMON) — the foe's living brood. Optional, "absent = none"
     *  back-compat (the same convention as `tempZone`/`glyphs`). NEVER part of
     *  the win condition: `checkImmediateOutcome` and `pendingOutcome` read
     *  `state.enemy` alone, so clearing every add can no more end a fight than
     *  cracking every Seal can. Spawned at a phase boundary, bites once per
     *  threat phase, cleared by the dieless-but-priced `strikeAdd`. A STAGE's
     *  `cleanse` does NOT clear it — cleanse wipes `enemy.effects`, and a body
     *  is not an affliction. */
    adds?: CombatAdd[];
    /** Phase 102 — waves spawned this combat, capped at `ADD_WAVE_CAP`. Adds
     *  NEVER respawn on emptiness: clearing a wave is progress the player
     *  keeps, because "spawn when none are alive" makes clearing CAUSE the
     *  respawn, which is a tax rather than a decision. */
    addWavesSpawned?: number;
    /** Spec 32 v4 §2.1 — TEMPORARY enemy-attached disenchants from the FREE line;
     *  the timed mirror of `enemyAttachments`. Same tick/promote rules as
     *  {@link tempZone}. Optional (absent = none). */
    enemyTempAttachments?: { cardId: string; roundsLeft: number }[];
    /** Spec 32 v3 §10 — the enemy's own persistent passives (seeded from the
     *  bestiary) + disenchants IT attached to the player live here. Optional. */
    enemyEnchantments?: string[];
    playerAttachments?: string[];
    /** Spec 32 v3 §5 — the GHOST die pool (live tray): merged into every
     *  turn's dice, exempt from rerolls, persists across combats. Optional. */
    floatingDice?: CombatManaDie[];
    /** Phase 31 (EA-6) — the combat MOMENTUM wheel, engine-native (kills the
     *  mobile host-side write). Lights heart -> body -> mind on every LANDED
     *  card play in that stance (top or bottom — the wheel tracks the card's
     *  printed stance, not its power source); a wrong or repeated stance
     *  resets the wheel to just that stance. Lighting the third node mints a
     *  one-shot wild floating die (id-prefixed `momentum-`, always
     *  `temporary: true` so `getFloatingDiceColors` excludes it from the
     *  cross-combat character save — momentum never persists past this fight,
     *  owner-ratified 2026-07-10) and empties the wheel. While a
     *  `momentum-`-prefixed die is still unspent in {@link floatingDice}, the
     *  wheel does not advance on further plays. Optional for back-compat
     *  (absent = empty wheel). */
    momentumWheel?: WheelStance[];
    /** Phase 31 (EA-7) — THE STAKE: an optional pre-play wager placed after
     *  drafting this turn's stance die (`placeStake`), settled at the top of
     *  `resolveThreatPhase` against the phase's hidden `enemyStance`. Cleared
     *  on settlement regardless of outcome; at most one stake live at a time.
     *  Optional (absent = no stake placed this phase). */
    stake?: { color: WheelStance; amount: 2 | 4 | 6 };
    /** Phase 33c (spec 33 §1) — phase INDICES whose coveted die has already
     *  been claimed THIS COMBAT (one-time-per-phase steal, so a repeating/
     *  locked final phase can't be farmed on every loop). Initialized `[]` in
     *  `initializeCombatEncounter`. Optional for back-compat (absent = none
     *  claimed yet). */
    covetedDiceClaimed?: number[];
    /** Phase 31 (EA-7) — extra "round-equivalents" folded into THE CLOCK's
     *  escalation basis (`resolveThreatPhase`'s `state.round - GRACE` term)
     *  every time a placed stake is LOST — a wasted read costs time the same
     *  way a slow round does. Monotonic (never decreases). Optional (absent
     *  = 0, the pre-STAKE behavior). */
    stakeEscalationBonus?: number;
    /** Spec 32 v3 T2 — the CHARGE tally (Peroration theme). Optional. */
    premises?: number;
    /** Phase 32 part 4b (Oratory — milestone drip): cumulative Premises EVER
     *  gained THIS COMBAT — every source that feeds `gainPremises`. Per-combat,
     *  like `souls`/`akrasiaDebt` — reset to 0 in `initializeCombatEncounter`
     *  only. UNLIKE the spendable `premises` tally above, this does NOT reset
     *  when a Peroration pays off or CONDEMN fires, so a milestone already
     *  crossed stays crossed. Optional (absent = 0, back-compat with existing
     *  state literals). */
    premiseMilestoneTotal?: number;
    /** Spec 32 v3 T2 — the declared SENTENCE (one in play at a time). */
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
    /** Phase 32 part 4d (Oracle — OMEN v2 rework, spec 32 v3 T6): pending
     *  OMEN claims awaiting resolution. `windowRemaining` counts down by 1
     *  every phase boundary (`resolveThreatPhase`) until it either matches
     *  the incoming stance (a HIT — the entry is removed) or reaches 0
     *  without matching (a MISS — also removed; the ante was already spent
     *  at cast). `claimScale` (fixed at cast time, independent of the
     *  countdown) is the 1/window payoff multiplier applied to the card's
     *  printed rider on a hit. No more absolute `phaseIndex` — a wider claim
     *  is checked at EVERY boundary while pending, not just one. */
    pendingOmens?: { cardId: string; stance: 'heart' | 'body' | 'mind'; windowRemaining: number; claimScale: number }[];
    /** Spec 32 v3 T6 — omens that CAME TRUE this combat (Oracle payoff fuel). */
    omenHits?: number;
    /** Spec 32 v3 T7 — the SOUL bank (Harvest currency). Optional. */
    souls?: number;
    /** Spec 32 v3 T8 — PLEA on the enemy (decays 1/turn; ≥ enemy HP at a turn
     *  boundary → RELENT). Optional. */
    sway?: number;
    /** Phase 32 part 4e (Charm — Resolve milestones): has the Wavering
     *  waypoint (PLEA ≥ {@link swayResolveMilestoneThresholds}'s `wavering`,
     *  a fraction of the LIVE `capitulateThreshold`) already paid its
     *  one-time QUARTER dividend THIS COMBAT? Per-combat, like `souls`/
     *  `akrasiaDebt` — reset to `false` in `initializeCombatEncounter` only.
     *  Once true, NEVER reset back to false even if the live resolve later
     *  shrinks below the threshold that was crossed (a milestone already
     *  paid stays paid). Optional (absent = false, back-compat with
     *  existing state literals). */
    swayMilestoneWaveringFired?: boolean;
    /** Phase 32 part 4e (Charm — Resolve milestones): the Faltering waypoint
     *  sibling of {@link swayMilestoneWaveringFired} (pays a bonus-PLEA
     *  dividend instead of QUARTER). Same per-combat, never-claws-back
     *  lifecycle. Optional (absent = false). */
    swayMilestoneFalteringFired?: boolean;
    /** PLEA has broken the foe's will; the player must accept the yield or
     * continue fighting. Never resolves combat on threshold alone. */
    capitulationChoiceActive?: boolean;
    /** The player rejected this foe's yield; do not reopen the same offer. */
    capitulationDeclined?: boolean;
    /** Spec 32 v3 T10 — the next spell played this turn gains ECHO. */
    echoNextSpell?: boolean;
    // ── THE BIG NUMBERS REWRITE (2026-09-02) — the damage-scaler ledgers ──────
    /** WRATH — a combat-long flat bonus added to EVERY hit the player lands
     *  (Slay the Spire's Strength). Never decays; only grows. Absent = 0. */
    wrath?: number;
    /** CHAIN — a bonus added to the player's NEXT hit, then spent. Fades to 0
     *  at the end of any turn in which no play added to it, so the payoff
     *  belongs to a deck that keeps swinging (Dawncaster's Chain). Absent = 0. */
    chain?: number;
    /** CHAIN bookkeeping — set when a play added CHAIN this turn; read and
     *  cleared at the turn boundary to decide whether CHAIN fades. */
    chainFedThisTurn?: boolean;
    /** FLAY — stacks on the FOE: each of the player's next N damage instances
     *  deals +50%, consuming one stack (Dawncaster's Vulnerable, front-loaded
     *  rather than percentage-per-stack). Absent = 0. */
    flay?: number;
    /** TWIN — armed: the next PAID spell this turn resolves twice. Cleared when
     *  it fires, so it never chains into the copy it created. */
    twinArmed?: boolean;
    /** THE PATH — extra dice added to every turn's tray (act-reward dice),
     *  seeded from `Character.bonusTurnDice`. Absent = 0. */
    bonusTurnDice?: number;
    /** THE PATH — die-upgrade level (0-2) driving the roll bag's share of live
     *  faces, seeded from `Character.dieUpgradeLevel`. Absent = 0. */
    dieUpgradeLevel?: number;
    /** STAGES already entered this combat, by index into `enemy.stages`. Each
     *  stage fires at most once; this is the ledger that guarantees it. */
    stagesEntered?: number[];
    /** Cumulative `threatBonus` contributed by every STAGE entered so far,
     *  added to each subsequent phase's damage weight. */
    stageThreatBonus?: number;
    /** Spec 32 v3 T10 — spells played this turn (resonant-chamber's gate). */
    spellsPlayedThisTurn?: number;
    /** Spec 32 v3 T10 — the last PAID spell that LANDED A STATUS this combat
     *  (ouroboros's replay target). Phase 32 part 4f: a PAID spell that
     *  resolves without increasing any effect intensity on the enemy (a
     *  fizzle, a pure-mechanic burst, a dieless/no-op play) does NOT
     *  overwrite this — it stays pinned to the most recent status-landing
     *  spell so an intervening no-status play can never "steal" the echo. */
    lastSpellCardId?: string | null;
    /** Phase 39 (2026-08-08) — the `state.round` `lastSpellCardId` was last set
     *  on. Ouroboros's precondition-width retune (target ~25% fizz, was 3-10%
     *  — `lastSpellCardId` never reset across turns, so it almost never
     *  fizzled after the first status-landing spell of the whole combat)
     *  narrows REPLAY_LAST to "landed THIS turn", not "ever this combat". */
    lastSpellRound?: number;
    /** Spec 32 §12 #4 (combat ledgers) — RECOIL HP paid this turn (`recoil`
     *  mechanic + fate recoil). Reset with `spellsPlayedThisTurn` at turn start. */
    recoilPaidThisTurn?: number;
    /** Phase 32 part 3 (Akrasia — DEBT ledger): cumulative RECOIL HP paid THIS
     *  COMBAT — every `recoil`/`recoil_x` mechanic, `CardRider.recoil` (FREE or
     *  PAID line), and `fate.recoilHp`. Per-combat, like `souls` — unlike
     *  `recoilPaidThisTurn` this does NOT reset at `startTurn`. No cash-out
     *  path exists yet (Absolution-fork follow-up); it only ever grows this
     *  combat. Optional (absent = 0, back-compat with existing state literals). */
    akrasiaDebt?: number;
    /** Phase 32 part 4a (Control — TURNABOUT ledger): cumulative STAGGER/
     *  BACKFIRE rung-denial THIS COMBAT — every phase's `rungsForBackfire`
     *  (the same quantity BACKFIRE's per-phase drip already reads), whether or
     *  not BACKFIRE itself is live. Per-combat, like `souls`/`akrasiaDebt` —
     *  reset to 0 in `initializeCombatEncounter` only. UNLIKE those two, this
     *  ledger is CONSUMED (zeroed) the moment a `turnabout` mechanic cashes it
     *  — the one place this differs structurally from the Souls/DEBT
     *  precedent. Optional (absent = 0, back-compat with existing state
     *  literals). */
    rungsDeniedTotal?: number;
    /** Spec 32 §12 #4 — HP the enemy's threat dealt the player this turn
     *  (post-soak budget); rolls into `enemyDamageLastRound` between phases. */
    enemyDamageThisTurn?: number;
    /** Spec 32 §12 #4 — the prior round's `enemyDamageThisTurn`. The enemy hits
     *  BETWEEN player turns, so this is the value a card played this turn reads. */
    enemyDamageLastRound?: number;
    /** WI-10 (2026-07-12) — scraps taken THIS turn. Scrapping a hand card pays
     *  +1 Conviction only for the first {@link SCRAP_CONVICTION_CAP_PER_TURN}
     *  scraps per turn; further scraps still cycle the card but pay nothing, so
     *  "scrap the whole hand for +6◆/turn" against a 12 cap is closed. Reset each
     *  turn in `startTurn`. Optional for back-compat (absent = 0). */
    scrapsThisTurn?: number;
    /** WI-1 (2026-07-12) — the REAL DoT damage the enemy has taken from
     *  event-triggered ticks so far THIS round (poison `card-played`, bleed
     *  `damage-instance`, fate-tap, TICK riders). Folded in `withLog` at every
     *  enemy `dot-tick` emission, reset each turn in `startTurn`, and consumed
     *  by `suppurating-curse` in `processBetweenPhases` (which adds the
     *  round-clock ticks on top) so the curse can double the round's true DoT
     *  total instead of the structurally-empty round-clock pool. Optional for
     *  back-compat with state literals (treated as 0 when absent). */
    enemyDotDamageThisRound?: number;
    /** Spec 32 §12 #4 — the prior threat's damage was FULLY prevented (every
     *  budgeted hit soaked to 0 by riposte/guard/barrier). Persists until the
     *  next threat resolves (WS9 `prior-threat-fully-blocked` branch fuel). */
    lastThreatFullyBlocked?: boolean;
    /** Spec 32 v3 — uids of CONJURED one-use Haunts (removed on play). */
    conjuredUids?: string[];
    threatPhases: CombatThreatPhase[];     // enemy's authored / generated threat sequence
    threatMarks: CombatThreatMark[];       // O / X ledger per phase (hindered / acted)
    currentPhaseIndex: number;             // 0-indexed into threatPhases
    phaseResults: CombatPhaseResult[];     // completed phase records
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

    // ── Spec 33 (Upgradeable Dice, flag-gated) — all optional; absent on every
    //    flag-off state (byte-identical back-compat). ─────────────────────────
    /** §2 — the player's stance: the stance of the last PAID card played.
     *  Fights open stance-less (null/absent). FREE lines never change it. */
    playerStance?: WheelStance | null;
    /** §3 — the momentum chain: `{color, length}` of the live chain, or null.
     *  Breaks reset to NULL (owner-locked D1); persists across rounds; surge
     *  (length 3) grants the temp gold die and resets to null. */
    momentumV2?: { color: WheelStance; length: number } | null;
    /** §4 — the round Press Fate (flag-on form: 1◆ rerolls all miss faces) was
     *  last used, gating it to once per round. Absent = never used. */
    pressFateRound?: number;
    /** §6 OVERHEAT — dice cracked by an overheat push: each entry forces that
     *  color's NEXT roll to all-miss (`turn` = the turn the crack bites; under
     *  the round-turn law one turn == one round) and excludes it from that
     *  turn's Press Fate. Entries are consumed by the bitten turn's roll. */
    crackedDice?: { color: 'heart' | 'body' | 'mind' | 'wild'; turn: number }[];
    /** §6 — the die-gear loadout driving the four dice's face tables + special
     *  payloads. ABSENT in D2 (the engine falls back to the hardcoded default
     *  gear); D5 makes this a real persisted equipment rail. */
    dieGear?: Partial<Record<'heart' | 'body' | 'mind' | 'wild', UpgradeableDieGear>>;
    seed?: number;                         // seed used to drive the encounter (sim/tests)
}

/**
 * Spec 33 §6 (Upgradeable Dice) — one die's GEAR: the equipment piece that
 * defines everything mutable about its die. The DICE are permanent immutable
 * 6-siders; gear carries the face distribution and the special payload.
 * Caps (enforced where gear is authored/upgraded, D5): colored dice keep
 * >= 1 miss face and <= 2 special faces; the wild (gold) die keeps <= 1
 * special face.
 */
export interface UpgradeableDieGear {
    /** Which die this piece drives (stance-named; `wild` = the gold die). */
    dieColor: 'heart' | 'body' | 'mind' | 'wild';
    /** Number of special faces on the driven die (default 1). */
    specialFaces: number;
    /** Number of mana faces on the driven die (default 2; gold default 1). */
    manaFaces: number;
    /** The special payload: Conviction granted when a special-face die is USED
     *  to power a card (default 2 — "powers this color AND grants 2◆"). */
    specialConviction: number;
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
