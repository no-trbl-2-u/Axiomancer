/**
 * Hazard-Pattern Combat — balance simulator (HP model).
 *
 * Drives full encounters through the pure engine with scripted policies so
 * balance can be asserted in hermetic tests and tuned with evidence. The win
 * condition is enemy HP → 0; status effects do the heavy lifting (DoT erodes
 * HP; control hinders the enemy's turn), strikes are the weak baseline. Every
 * run is reproducible from its seed.
 *
 * The default `greedy` policy models a read-playing human: each turn it rolls
 * 2 dice, drafts the one that wins the hidden-stance read (preferring a
 * color-match), powers the best STATUS card (favouring a NEW distinct status
 * for the combo refresh), rides the combo loop, banks Conviction and spends it
 * on damaging Signatures, and Befriends a low-HP foe to take the mercy/spare
 * path. The full roster (dot-weaver, control-lock, aggro-brute, turtle, chaos,
 * mercy-seeker) lives in `combat.sim-policies.ts`; `greedy`/`blind` keep
 * bit-identical behavior to the pre-roster sim.
 */

import type { Character } from '../Character/types';
import type { Enemy } from '../Enemy/types';
import {
    initializeCombatEncounter, rollEncounterDice, playCombatCard,
    resolveThreatPhase, startTurn, draftStanceDie, endTurn, chooseDraft, revealedCurrentStance,
    playSignatureSkill, getDraftedDie, handCards, selectMercyChoice, selectCapitulationChoice, getSignatureSkill,
    tapFateDie, recoilXRange, placeStake, crackGlyph,
} from './combat.engine';
import { RESERVE_MAX } from './combat.dice';
import { isUpgradeableDiceEnabled, MOMENTUM_CHAIN_ORDER } from './combat.upgradeable-dice';
import { getPendingDotTotal } from './effects';
import { getRng } from '../Utils/rng';
import type {
    CombatAttributionRow, CombatCard, CombatEncounterState, CombatEvent, CombatOutcome,
} from './combat.encounter.types';
import { COMBAT_SIM_POLICIES, type CombatSimPolicy, type CombatSimPolicyId } from './combat.sim-policies';
// Phase 43 — objective function v2. Added BESIDE `statusEngagement`, which
// stays computed and reported: the old metric is now a warning light, not the
// target (see `combat.objective.ts` for the decision and its justification).
import {
    addObjectiveTelemetry, damageCentroid, emptyObjectiveTelemetry, foldObjectiveEvents,
    type CombatObjectiveTelemetry,
} from './combat.objective.telemetry';
import { scoreCombatObjective, type CombatQualityScore } from './combat.objective';

/**
 * `greedy` — a competent omniscient witness: drafts using the enemy's hidden
 * stance for the sharpest balance signal. `blind` — a realistic-player witness:
 * drafts using ONLY player-visible info (the stance is unknown until revealed via
 * the read or a Scout), so it can't pre-seek advantage. Tune player-facing
 * difficulty against `blind`; tune ceilings against `greedy`. The wider roster
 * (dot-weaver, control-lock, aggro-brute, turtle, chaos, mercy-seeker) is
 * defined in `combat.sim-policies.ts`; the id type is re-exported here so
 * existing importers keep working.
 */
export type { CombatSimPolicyId } from './combat.sim-policies';

/**
 * The UN-COLLAPSED win-path distribution: a raw count per `CombatOutcome`
 * across the sim's runs. The legacy `victories`/`mercies` counters fold the
 * three merciful resolutions (mercy + capitulate + concede) into one bucket
 * (`mercies = mercy + capitulate + concede`); this record keeps them apart so a
 * theme's OWN win path is visible — Charm wins via `capitulate`, Peroration via
 * `concede`, Befriend via `mercy`. deck-tuning free-metrics tier (2026-07-08).
 */
export type WinPathCounts = Record<CombatOutcome, number>;

export interface CombatSimStats {
    runs: number;
    victories: number;       // enemy HP → 0
    mercies: number;         // spared a low-HP foe via Befriend
    defeats: number;
    retreats: number;
    /** Win rate = (victories + mercies) / runs. */
    winRate: number;
    /** Un-collapsed win-path mix (victory / mercy / capitulate / concede /
     *  defeat / retreat) — `mercies` folds mercy+capitulate+concede; this keeps
     *  each path visible. Sums to `runs`. */
    winPathCounts: WinPathCounts;
    avgRounds: number;
    /** Population std-dev of rounds across the runs (metrics slate 2026-07-18):
     *  the consistency witness — a high spread means the deck's clock depends
     *  on drawing the right cards, the duplicate-more signal. */
    roundsStdDev: number;
    /** Average share of plays that landed a status effect on the enemy.
     *  **Phase 43 (objective function v2): this is now a WARNING LIGHT, not the
     *  objective.** It measured adherence to the status-dominance doctrine that
     *  THE UNSHACKLING voided; it stays computed and asserted because existing
     *  suites read it and a collapse in it is still worth seeing. The objective
     *  function is `combatQuality` below. */
    statusEngagement: number;
    /** **THE OBJECTIVE FUNCTION (Phase 43).** The Combat Quality Index and its
     *  four weighted components — SPINE (Conviction + Surge + Dice, the locked
     *  systems), ARC, WIDTH, IDENTITY. See `combat.objective.ts`. */
    combatQuality: CombatQualityScore;
    /** The raw counters behind `combatQuality`, pooled over the runs. Exposed
     *  so a stage/preset rollup can MERGE telemetry across cells and re-score
     *  rather than averaging nonlinear component scores. */
    objectiveTelemetry: CombatObjectiveTelemetry;
    /** Average Conviction spent on Signature Skills per run. */
    avgConvictionSpent: number;
    /** Fraction of total enemy HP loss delivered by DoT ticks (0–1).
     *  Doctrine witness: DoT should be the primary damage source in status builds. */
    dotHpFraction: number;
    /** Fraction of total enemy HP loss from direct strikes (excl. mechanic bursts) (0–1). */
    strikeFraction: number;
    /** Fraction of total enemy HP loss from mechanic bursts (rupture/reap/backfire/reflect/conclude) (0–1). */
    mechanicBurstFraction: number;
    /** Guard availability ratio: total guard present when an enemy threat fired /
     *  (that guard + total player HP damage taken). A proxy for how often GUARD was relevant. */
    guardMitigatedFraction: number;
    /** Mean count of active effects on the enemy at the start of each threat phase.
     *  Doctrine witness: a loaded status board = the engine working as intended. */
    avgActiveEffectsPerPhase: number;
    /** Deck utilization: distinct cards actually PLAYED / distinct cards in the
     *  deck (0–1). 1.0 = every card earned a play; a low value on a big deck is
     *  the bloat witness (a 2x late preset that only ever plays 6 of its 15+
     *  uniques). Denominator falls back to distinct cards played when no explicit
     *  deck was threaded (the known-cards path), so it reads 1.0 there. */
    deckUtilization: number;
    /** Normalized Shannon entropy (0–1) over the per-card PLAYS vector — the
     *  decision-spread witness. 0 = one card carried every play (one-note spam);
     *  1 = plays spread evenly across the deck's distinct cards. */
    usageEntropy: number;
    /** The single card that dealt the enemy the most HP (dotDamage + damageDealt,
     *  aggregated across runs), by id. '' when nothing dealt damage. */
    dominantCardId: string;
    /** `dominantCardId`'s share of total attributed enemy-HP damage (0–1). The
     *  single-card-spam witness: deck-tuning §4 flags any card > 0.70. */
    dominantCardShare: number;
}

/** Per-card telemetry for one run (or aggregated over many), keyed by the
 *  card/card id — NOT the hand-entry uid. `statusLands` counts powered plays
 *  that landed at least one status on the enemy (the doctrine witness).
 *
 *  WS1.1 line telemetry — the OPTIONAL fields below are populated only on
 *  AGGREGATED rows (`simulateHazardPatternCombatDetailed` / the playtest
 *  report); per-run rows from `runOneEncounter` omit them so the pinned
 *  per-run row shapes stay stable (the numbers ride the parallel
 *  `cardLineTelemetry` record instead). */
export interface CombatCardUsage {
    cardId: string;
    plays: number;
    bottomPlays: number;
    topPlays: number;
    statusLands: number;
    discards: number;
    /** Attempted plays (either line) that emitted an `effect-fizzled` event
     *  for this card. A fizzled PAID attempt that the policy drains via the
     *  FREE line counts one fizzle AND one top play. */
    fizzles?: number;
    /** HP-swing attributed per line: immediate enemy-HP loss during the play
     *  plus the projected DoT of effects it landed (`damagePerRound ×
     *  intensity × remainingDuration` — the `recordAttribution` formula).
     *  `free` = top-line plays, `paid` = powered bottom-line plays. */
    lineContribution?: { free: number; paid: number };
    /** Hand entries discarded un-played at phase end (the engine's draw-fresh
     *  discard site) — the dead-in-hand denominator. */
    unplayedAtPhaseEnd?: number;
    // ── Metrics slate (2026-07-18) — draw telemetry. AGGREGATED rows only,
    //    like the WS1.1 fields above: per-run rows keep their pinned shape and
    //    the numbers ride `runOneEncounter`'s `cardDrawCounts` instead. ──────
    /** Hand entries of this card across the runs (opening hand + every
     *  `hand-drawn` event) — the play-rate-when-drawn denominator. */
    drawsSeen?: number;
    /** Runs in which this card entered the hand at least once. */
    runsDrawn?: number;
    /** Of `runsDrawn`, runs that ended in a win (victory or any merciful
     *  resolution). With the cell's total runs/wins this yields the
     *  win-rate-when-drawn delta — the "does drawing this card help?" witness. */
    winsWhenDrawn?: number;
}

/** WS1.1 — per-run FREE/PAID line telemetry, kept SEPARATE from the per-run
 *  `CombatCardUsage` rows (whose exact shape is pinned by the sim-policy
 *  decision-sequence e2e). Aggregators fold these into the optional
 *  `CombatCardUsage` fields. */
export interface CombatCardLineTelemetry {
    cardId: string;
    /** Attempted plays that emitted `effect-fizzled` for this card. */
    fizzles: number;
    /** HP swing (immediate + projected DoT) from FREE (top) plays. */
    freeHpSwing: number;
    /** HP swing (immediate + projected DoT) from PAID (bottom) plays. */
    paidHpSwing: number;
    /** Hand entries discarded un-played at phase end. */
    unplayedAtPhaseEnd: number;
}

/** Optional per-run knobs threaded through `runOneEncounter`. */
export interface CombatSimRunOptions {
    /** Explicit deck (card ids) passed to `initializeCombatEncounter`; omitted →
     *  the engine builds the deck from the player's known cards. */
    deck?: readonly string[];
    /** Card ids boosted to the FRONT of every policy's ranking — used by the
     *  card-coverage e2e to guarantee a specific card gets exercised. */
    focusCardIds?: readonly string[];
}

const currentPhase = (s: CombatEncounterState) =>
    s.threatPhases[Math.min(s.currentPhaseIndex, s.threatPhases.length - 1)];

/** Dominates every policy score band so a focused card always ranks first. */
const FOCUS_CARD_BOOST = 1e18;

/** Phase 31 (EA-7) — the wager size an informed sim policy risks per stake;
 *  the cheapest tier (a colored float, no pip bonus). */
const STAKE_SIM_AMOUNT = 2;

/**
 * The best card in hand to POWER now, per the active policy's `rankCard`
 * (highest score wins; ties resolve to the earliest card in hand order, which
 * matches the legacy stable sort). Token-gated cards that fizzle are skipped
 * via `notUids`; `focusIds` (card-coverage harness) trump every band.
 */
function selectCard(
    s: CombatEncounterState,
    policy: CombatSimPolicy,
    rng: () => number,
    notUids?: Set<string>,
    focusIds?: ReadonlySet<string>,
    matchColor?: string,
): { uid: string; card: CombatCard } | null {
    // Dice-law (2026-07-09): with a powering die in hand, only cards of ITS
    // color are playable (wild matches everything) — mismatches hard-fizzle.
    const cards = handCards(s)
        .filter(c => c.card.verbClass !== 'retreat' && !(notUids && notUids.has(c.uid)))
        .filter(c => !matchColor || matchColor === 'wild' || c.card.stance === matchColor);
    let best: { uid: string; card: CombatCard } | null = null;
    let bestScore = -Infinity;
    for (const c of cards) {
        let score = policy.rankCard(s, c.card, rng);
        if (focusIds && focusIds.has(c.card.id)) {
            score += FOCUS_CARD_BOOST;
        }
        if (score > bestScore) { bestScore = score; best = c; }
    }
    return best;
}

/**
 * Phase 43 (objective v2) — the LEGAL card options at one powering die: hand
 * entries whose stance that die can power and that have not already fizzled.
 * Pure observation — it mirrors `selectCard`'s filter without ranking, scoring,
 * consuming rng or touching state, so instrumenting decision width can never
 * perturb a seeded run.
 */
function countLiveOptions(
    s: CombatEncounterState,
    notUids: ReadonlySet<string>,
    matchColor: string,
): number {
    return handCards(s).filter(c =>
        c.card.verbClass !== 'retreat'
        && !notUids.has(c.uid)
        && (matchColor === 'wild' || c.card.stance === matchColor)).length;
}

/** An affordable Signature (kind allowed by the policy) to spend banked
 *  Conviction on. Without a policy `rankSignature`, the FIRST affordable match
 *  in `state.signatures` order wins — the legacy `greedy`/`blind` behavior. */
function bestSignature(s: CombatEncounterState, policy: CombatSimPolicy, rng: () => number): string | null {
    let best: string | null = null;
    let bestScore = -Infinity;
    for (const id of s.signatures) {
        const sig = getSignatureSkill(id);
        if (!sig || s.conviction < sig.cost) continue;
        if (!policy.signatureKinds.includes(sig.kind)) continue;
        if (!policy.rankSignature) return id;
        const score = policy.rankSignature(s, sig, rng);
        if (score > bestScore) { bestScore = score; best = id; }
    }
    return best;
}

/** The card's line-telemetry row, created zeroed on first touch. */
function lineRow(
    lines: Record<string, CombatCardLineTelemetry>,
    cardId: string,
): CombatCardLineTelemetry {
    return lines[cardId] ?? (lines[cardId] = {
        cardId, fizzles: 0, freeHpSwing: 0, paidHpSwing: 0, unplayedAtPhaseEnd: 0,
    });
}

/**
 * WS1.1 — the HP swing one play produced, measured sim-side so it needs no
 * engine tag: the enemy HP the play removed RIGHT NOW (payoff bursts, TICK
 * advances, reflect) plus the projected DoT of every enemy-side effect it
 * landed — the same `damagePerRound × max(1,intensity) ×
 * max(1,remainingDuration)` projection `recordAttribution` uses, read off the
 * post-play active effect (falling back to the landed intensity × 1 when the
 * active row is gone, e.g. instantly consumed).
 */
function playHpSwing(
    before: CombatEncounterState,
    after: CombatEncounterState,
    events: readonly CombatEvent[],
): number {
    let swing = Math.max(0, before.enemy.health - after.enemy.health);
    for (const ev of events) {
        if (ev.kind !== 'effect-landed' || ev.target !== 'enemy') continue;
        const dot = ev.effect.payload.damageOverTime;
        if (!dot) continue;
        const active = after.enemy.effects.find(ae => ae.effectId === ev.effectId);
        swing += dot.damagePerRound
            * Math.max(1, active?.intensity ?? ev.intensity)
            * Math.max(1, active?.remainingDuration ?? 1);
    }
    return swing;
}

/** Records one play against the card's usage row (keyed by card/card id). */
function bumpUsage(
    usage: Record<string, CombatCardUsage>,
    card: CombatCard,
    kind: 'top' | 'bottom',
    landedStatus = false,
): void {
    const key = card.id;
    const row = usage[key] ?? (usage[key] = {
        cardId: key, plays: 0, bottomPlays: 0, topPlays: 0, statusLands: 0, discards: 0,
    });
    row.plays++;
    if (kind === 'top') row.topPlays++;
    else row.bottomPlays++;
    if (landedStatus) row.statusLands++;
}

/** §3 — the chain-successor color to build toward from the current momentum
 *  (null when momentum is null — any color legally starts a fresh chain, so
 *  there's no single "advance" target to steer for). */
function momentumSuccessor(momentum: CombatEncounterState['momentumV2']): string | null {
    if (!momentum) return null;
    const i = MOMENTUM_CHAIN_ORDER.indexOf(momentum.color);
    return i < 0 ? null : MOMENTUM_CHAIN_ORDER[(i + 1) % MOMENTUM_CHAIN_ORDER.length];
}

/** Momentum-steer ordering: a die that can produce the chain-successor stance
 *  (its own color, or wild which powers any) sorts first, so the policy builds
 *  toward a surge instead of breaking to null. No preference when `want` is
 *  null (momentum null / off-chain). */
function momentumSourceScore(color: string, want: string | null): number {
    if (!want) return 0;
    if (color === want) return 2;
    if (color === 'wild') return 1;
    return 0;
}

/**
 * What one played threat phase reports back. `decisionPoints`/`liveOptions`
 * are the Phase 43 decision-width sample (see `countLiveOptions`); everything
 * else predates it and is unchanged.
 */
export interface PlayPhaseResult {
    state: CombatEncounterState;
    plays: number;
    statusPlays: number;
    /** Powered-play decisions the driver made this phase. */
    decisionPoints: number;
    /** Σ legal card options at those decisions. */
    liveOptions: number;
}

/**
 * Spec 33 (Upgradeable Dice, flag-on) — the four-die play phase. No draft: the
 * four fixed dice (+ Reserve + surge floats) each power one paid line of their
 * color (gold = wild), momentum-steered toward the chain successor. A whiffed
 * round Presses Fate (a `reroll`-kind signature, repriced to 1◆ flag-on) when
 * it can afford it. FREE tops drain the leftover hand, then `endTurn` banks the
 * best unspent die to Reserve. A pure measurement instrument — legible, not an
 * AI: it reuses the policy's `rankCard`/`bestSignature`, adding only the
 * momentum-steer ordering and the whiff-reroll, both spec-mandated levers.
 *
 * Phase 51 — also the ONLY driver that reads `policy.crackAt` (GLYPHS): a
 * witness with the field set cracks its highest-charge eligible Seal once
 * per loop pass, alongside the existing signature-cast check. The flag-off
 * legacy `policyPlayPhase` body never reads it — see that function's own
 * comment for why it stays byte-identical.
 */
export function upgradeablePlayPhase(
    state: CombatEncounterState,
    policy: CombatSimPolicy,
    rng: () => number,
    usage: Record<string, CombatCardUsage>,
    lines: Record<string, CombatCardLineTelemetry>,
    focusIds?: ReadonlySet<string>,
): PlayPhaseResult {
    let working = state;
    let plays = 0;
    let statusPlays = 0;
    let decisionPoints = 0;
    let liveOptions = 0;
    let guard = 0;
    const fizzledUids = new Set<string>();

    const chosenXFor = (card: CombatCard): { chosenX: number } | undefined => {
        const range = recoilXRange(working, card);
        if (!range) return undefined;
        const x = policy.chooseX ? policy.chooseX(working, card, range, rng) : range.min;
        return { chosenX: x };
    };

    // ── The ONE legal tray roll for this phase (rolls the four fixed dice). ───
    if (working.dice.length === 0 && !working.turnTakenThisPhase) {
        working = startTurn(working).state;
        if (working.phase !== 'phase-play') return { state: working, plays, statusPlays, decisionPoints, liveOptions };
    }

    // Press Fate (§4): a full-miss round rerolls its misses once for 1◆ — cast
    // the player's `reroll` signature (repriced flag-on). Skipped silently when
    // the loadout carries none (a starter-signature gap D4/D5 fills) or the
    // player can't afford it.
    const fixedUsable = () => working.dice.some(d => !d.floating && d.state === 'available' && (d.face === 'special' || d.face === 'mana'));
    if (!fixedUsable() && working.conviction >= 1 && working.pressFateRound !== working.round) {
        const rerollId = working.signatures.find(id => getSignatureSkill(id)?.kind === 'reroll');
        if (rerollId) {
            const cast = playSignatureSkill(working, rerollId);
            if (cast.state !== working) working = cast.state;
        }
    }

    // ── Powered plays: iterate the live dice, momentum-steered. ──────────────
    while (working.phase === 'phase-play' && guard < 60) {
        guard++;
        if (working.finalOutcome || working.mercyChoiceActive) break;

        if (working.conviction >= policy.convictionThreshold) {
            const sigId = bestSignature(working, policy, rng);
            if (sigId) {
                const cast = playSignatureSkill(working, sigId);
                if (cast.state !== working) { working = cast.state; if (working.finalOutcome) break; continue; }
            }
        }

        // Phase 51 (GLYPHS) — crackAt: once a controlled Seal's charges meet
        // the witness's threshold, crack it (dieless, no source/die
        // consumed) — never blocks a signature or a die play in the same
        // iteration, it just takes one guard-counted loop pass when it
        // fires, same as a signature cast above. Highest-charge eligible
        // Seal wins; ties resolve to `state.glyphs` array order.
        if (policy.crackAt !== undefined) {
            const eligible = (working.glyphs ?? []).filter(g => g.charges >= policy.crackAt!);
            if (eligible.length > 0) {
                let target = eligible[0];
                for (const g of eligible) {
                    if (g.charges > target.charges) target = g;
                }
                const cracked = crackGlyph(working, target.id, rng);
                if (cracked.state !== working) { working = cracked.state; if (working.finalOutcome) break; continue; }
            }
        }

        const sources: { dieId: string; color: string }[] = [];
        for (const d of working.dice) {
            if (d.state !== 'available' || d.color === 'x') continue;
            if (d.floating || d.face === 'special' || d.face === 'mana') sources.push({ dieId: d.id, color: d.color });
        }
        for (const banked of working.reserve ?? []) sources.push({ dieId: banked.id, color: banked.color });
        if (sources.length === 0) break;
        const want = momentumSuccessor(working.momentumV2);
        sources.sort((a, b) => momentumSourceScore(b.color, want) - momentumSourceScore(a.color, want));

        let attempted = false;
        for (const src of sources) {
            const card = selectCard(working, policy, rng, fizzledUids, focusIds, src.color);
            if (!card) continue;
            attempted = true;
            // Phase 43 — decision width, sampled where the driver actually chose.
            decisionPoints++;
            liveOptions += countLiveOptions(working, fizzledUids, src.color);
            const res = playCombatCard(working, { uid: card.uid }, true, src.dieId, undefined, chosenXFor(card.card));
            if (res.events.some(e => e.kind === 'effect-fizzled')) {
                lineRow(lines, card.card.id).fizzles++;
                fizzledUids.add(card.uid);
                break;
            }
            lineRow(lines, card.card.id).paidHpSwing += playHpSwing(working, res.state, res.events);
            working = res.state;
            plays++;
            const landed = res.events.some(e => e.kind === 'effect-landed' && e.target === 'enemy');
            if (landed) statusPlays++;
            bumpUsage(usage, card.card, 'bottom', landed);
            break;
        }
        if (!attempted) break;
    }

    // Wind-down: drain the leftover hand through the FREE tops, then end the turn.
    let drain = 0;
    while (working.phase === 'phase-play' && !working.finalOutcome && !working.mercyChoiceActive && drain < 30) {
        drain++;
        const resT = handCards(working).find(c => c.card.verbClass !== 'retreat');
        if (!resT) break;
        const play = playCombatCard(working, { uid: resT.uid }, false);
        const row = lineRow(lines, resT.card.id);
        row.freeHpSwing += playHpSwing(working, play.state, play.events);
        if (play.events.some(e => e.kind === 'effect-fizzled')) row.fizzles++;
        working = play.state;
        plays++;
        bumpUsage(usage, resT.card, 'top');
    }
    if (working.phase === 'phase-play' && !working.finalOutcome && working.turnTakenThisPhase) {
        working = endTurn(working).state;
    }
    return { state: working, plays, statusPlays, decisionPoints, liveOptions };
}

/**
 * Plays a single threat phase to a stop under the ROUND-TURN LAW (Gate 0,
 * 2026-07-10): ONE tray roll (`startTurn`) per phase. The turn's powered plays
 * run off the drafted die (riding the combo refresh), then the Reserve, then
 * the floating pool — the law caps TRAY ROLLS, not card plays — after which
 * the policy drains the leftover hand through the FREE tops and ends the turn.
 * The guard counters are kept but never bind on legal play: the old
 * `endTurn → startTurn` Conviction farm is gone.
 *
 * Spec 33 (Upgradeable Dice): when the flag is on, delegates to
 * `upgradeablePlayPhase` (no draft; four fixed dice). The flag-OFF body below is
 * byte-identical to the pre-spec-33 driver — the pinned sim e2e depend on it.
 */
function policyPlayPhase(
    state: CombatEncounterState,
    policy: CombatSimPolicy,
    rng: () => number,
    usage: Record<string, CombatCardUsage>,
    lines: Record<string, CombatCardLineTelemetry>,
    focusIds?: ReadonlySet<string>,
): PlayPhaseResult {
    if (isUpgradeableDiceEnabled()) return upgradeablePlayPhase(state, policy, rng, usage, lines, focusIds);
    let working = state;
    let plays = 0;
    let statusPlays = 0;
    let decisionPoints = 0;
    let liveOptions = 0;
    let guard = 0;
    const fizzledUids = new Set<string>();

    // WS7.2 chosen X-costs — the policy's temperament picks X inside the
    // engine's own clamp range; policies without a `chooseX` play the printed
    // minimum. Undefined for cards without a chosen-X mechanic.
    const chosenXFor = (card: CombatCard): { chosenX: number } | undefined => {
        const range = recoilXRange(working, card);
        if (!range) return undefined;
        const x = policy.chooseX ? policy.chooseX(working, card, range, rng) : range.min;
        return { chosenX: x };
    };

    // WS1.1 — plays the FREE (top) line and records its line telemetry. A top
    // play can itself fizzle (e.g. a free enchant whose permanent is already
    // standing); it still counts a play, exactly as before the telemetry.
    const playFreeTop = (uid: string, card: CombatCard): void => {
        const resT = playCombatCard(working, { uid }, false);
        const row = lineRow(lines, card.id);
        row.freeHpSwing += playHpSwing(working, resT.state, resT.events);
        if (resT.events.some(e => e.kind === 'effect-fizzled')) row.fizzles++;
        working = resT.state;
        plays++;
        bumpUsage(usage, card, 'top');
    };

    // ── The ONE legal tray roll + stance draft for this phase ────────────────
    if (working.dice.length === 0 && working.draftedDieId === null && !working.turnTakenThisPhase) {
        working = startTurn(working).state;
        if (working.phase !== 'phase-play') return { state: working, plays, statusPlays, decisionPoints, liveOptions };
    }
    if (working.draftedDieId === null && working.dice.some(d => !d.floating)) {
        const want = selectCard(working, policy, rng, fizzledUids, focusIds);
        // Blind play drafts off only what the player can see: the stance is
        // `null` until revealed (via the read or a Scout), so chooseDraft can't
        // pre-seek advantage — it color-matches like a real player on turn one.
        const enemyStance = policy.blind ? revealedCurrentStance(working) : currentPhase(working).enemyStance;
        const pick = chooseDraft(working.dice, want?.card.stance ?? 'wild', enemyStance);
        if (pick) {
            // Fate Engine P1 — BANK the unpicked die when the Reserve has room
            // and Conviction isn't starved (pips beat a flat +1◆).
            const bankUnpicked = (working.reserve ?? []).length < RESERVE_MAX && working.conviction >= 2;
            working = draftStanceDie(working, pick, { bankUnpicked }).state;
        }
        // Fate Engine P1 — the universal FATE TAP: a dead X die in the tray
        // advances the strongest enemy DoT (or banks +1 Conviction).
        const xDie = working.dice.find(d => d.color === 'x' && d.state !== 'spent' && d.id !== working.draftedDieId);
        if (xDie && working.fateTappedTurn !== working.turn) {
            const choice = getPendingDotTotal(working.enemy, working.round).total > 0 ? 'dot-tick' as const : 'conviction' as const;
            working = tapFateDie(working, xDie.id, choice).state;
        }
    }

    // Phase 31 (EA-7) — THE STAKE: an informed witness (never omniscient —
    // only when the CURRENT phase's stance is already REVEALED) risks a
    // small wager once it has Conviction to spare above its signature
    // threshold, so an informed read pays without starving the signature
    // economy. `blind` never carries `stakesWhenInformed` — that's the
    // measured gap THE STAKE is meant to open.
    if (policy.stakesWhenInformed && !working.stake) {
        const known = revealedCurrentStance(working);
        if (known && working.conviction >= policy.convictionThreshold + STAKE_SIM_AMOUNT) {
            working = placeStake(working, known, STAKE_SIM_AMOUNT).state;
        }
    }

    // ── Powered plays WITHIN the one turn ────────────────────────────────────
    // Power sources in order: the drafted die while it lives (the combo
    // refresh keeps it alive across NEW statuses), then the Reserve (oldest =
    // ripest first), then the floating pool (the multi-float turn: ALL floats
    // are spendable in this one round).
    while (working.phase === 'phase-play' && guard < 60) {
        guard++;
        if (working.finalOutcome || working.mercyChoiceActive) break;

        // Spend banked Conviction on a damaging Signature when flush.
        if (working.conviction >= policy.convictionThreshold) {
            const sigId = bestSignature(working, policy, rng);
            if (sigId) {
                const cast = playSignatureSkill(working, sigId);
                if (cast.state !== working) { working = cast.state; if (working.finalOutcome) break; continue; }
            }
        }

        const drafted = getDraftedDie(working);
        const sources: { dieId?: string; color: string }[] = [];
        if (drafted && drafted.state === 'available' && drafted.color !== 'x') {
            sources.push({ color: drafted.color });
        }
        for (const banked of working.reserve ?? []) sources.push({ dieId: banked.id, color: banked.color });
        for (const f of working.dice) {
            if (f.floating && f.state === 'available') sources.push({ dieId: f.id, color: f.color });
        }
        if (sources.length === 0) break; // powered plays exhausted — wind down

        let attempted = false;
        for (const src of sources) {
            const want = selectCard(working, policy, rng, fizzledUids, focusIds, src.color);
            if (!want) continue;
            attempted = true;
            // Phase 43 — decision width, sampled where the driver actually chose.
            decisionPoints++;
            liveOptions += countLiveOptions(working, fizzledUids, src.color);
            const res = playCombatCard(working, { uid: want.uid }, true, src.dieId, undefined, chosenXFor(want.card));
            if (res.events.some(e => e.kind === 'effect-fizzled')) {
                // Token-gated with no banked token — skip it (the wind-down
                // drain below still gets its free top).
                lineRow(lines, want.card.id).fizzles++;
                fizzledUids.add(want.uid);
                break; // re-enter the loop with the fizzle excluded
            }
            lineRow(lines, want.card.id).paidHpSwing += playHpSwing(working, res.state, res.events);
            working = res.state;
            plays++;
            const landed = res.events.some(e => e.kind === 'effect-landed' && e.target === 'enemy');
            if (landed) statusPlays++;
            bumpUsage(usage, want.card, 'bottom', landed);
            break;
        }
        if (!attempted) break; // no card matches any live die color — wind down
    }

    // ── Wind-down: the turn's dice are exhausted or colorless — drain the
    // leftover hand through the FREE tops (legal, dieless; retreat stays in
    // hand), then end the turn. The engine's draw-fresh site discards what
    // remains at the phase boundary.
    let drain = 0;
    while (working.phase === 'phase-play' && !working.finalOutcome && !working.mercyChoiceActive && drain < 30) {
        drain++;
        const top = handCards(working).find(c => c.card.verbClass !== 'retreat');
        if (!top) break;
        playFreeTop(top.uid, top.card);
    }
    if (working.phase === 'phase-play' && !working.finalOutcome && working.draftedDieId !== null) {
        working = endTurn(working).state;
    }

    return { state: working, plays, statusPlays, decisionPoints, liveOptions };
}

/**
 * Plays ONE threat phase for an external sim harness (the spec-33 D3 economy
 * witness), routed through the same `policyPlayPhase` the matrix uses so the
 * flag-on branch is exactly what gets measured. `usage`/`lines` collect
 * telemetry the caller may discard.
 */
export function playSimPhase(
    state: CombatEncounterState,
    policyId: CombatSimPolicyId,
    rng: () => number,
    usage: Record<string, CombatCardUsage> = {},
    lines: Record<string, CombatCardLineTelemetry> = {},
): PlayPhaseResult {
    const policy = COMBAT_SIM_POLICIES[policyId];
    if (!policy) throw new Error(`Unknown combat sim policy '${String(policyId)}'`);
    return policyPlayPhase(state, policy, rng, usage, lines);
}

/** Runs a single seeded encounter and returns its outcome (+ per-card telemetry). */
export function runOneEncounter(
    player: Character,
    enemy: Enemy,
    seed: number,
    policy: CombatSimPolicyId = 'greedy',
    options?: CombatSimRunOptions,
): {
    outcome: CombatOutcome; rounds: number; plays: number; statusPlays: number; convictionSpent: number;
    dotHpDamage: number; mechanicBurstDamage: number; directHpDamage: number;
    guardOnAttack: number; playerHpTaken: number;
    /** Gate 0 (round-turn law) — `turn-law-blocked` events in the run's
     *  transcript. A legal policy NEVER trips the law: pinned 0 by the
     *  turn-law e2e. */
    turnLawBlocked: number;
    /** Phase 31 (EA-7) — THE STAKE: how many times this run wagered and how
     *  many of those wagers won. Zero for every policy without
     *  `stakesWhenInformed` (the `blind` baseline THE STAKE's win-rate gap is
     *  measured against). */
    stakesPlaced: number;
    stakesWon: number;
    /** Phase 31 (EA-8/Gate 0 §4) — signature-cast counts by id, for the
     *  repricing pass's dominance measurement (signature damage isn't
     *  attributed per-card the way `attribution` is — cast-share is the
     *  available proxy). */
    signatureCastsByKind: Record<string, number>;
    activeEffectSamples: number[];
    cardUsage: Record<string, CombatCardUsage>;
    /** WS1.1 — per-card FREE/PAID line telemetry (fizzles, per-line HP swing,
     *  unplayed-at-phase-end), parallel to `cardUsage` so the pinned per-run
     *  usage-row shape stays untouched. */
    cardLineTelemetry: Record<string, CombatCardLineTelemetry>;
    /** Metrics slate (2026-07-18) — hand entries per card id this run: the
     *  opening hand plus every `hand-drawn` event in the transcript (the
     *  opening deal emits no event, so it is counted from the initialized
     *  hand). Parallel to `cardUsage` for the same pinned-shape reason. */
    cardDrawCounts: Record<string, number>;
    /** The final per-card HP-damage ledger (already accumulated by the engine —
     *  surfaced, not recomputed) so the detailed sim can aggregate the
     *  dominant-card share across runs. */
    attribution: Record<string, CombatAttributionRow>;
    /** Phase 43 (objective function v2) — this run's raw counters for the
     *  Combat Quality Index: the three LOCKED systems (Conviction / Surge /
     *  Dice) read off their own events, plus the arc, width and identity
     *  readings. Additive: callers pool it across runs and RE-SCORE. */
    objective: CombatObjectiveTelemetry;
} {
    const policyObj = COMBAT_SIM_POLICIES[policy];
    if (!policyObj) throw new Error(`Unknown combat sim policy '${String(policy)}'`);
    const focusIds = options?.focusCardIds ? new Set(options.focusCardIds) : undefined;
    const deck = options?.deck ? [...options.deck] : undefined;
    let state = initializeCombatEncounter(player, enemy, deck, seed);
    // Phase 43 — the opening Conviction bank emits no `conviction-gained`
    // event, so the objective telemetry seeds income from it; without this the
    // spend SHARE can exceed 1 (spending ◆ the transcript never granted).
    const openingConviction = state.conviction;
    // Metrics slate — the opening deal emits no `hand-drawn` event; seed the
    // draw ledger from the initialized hand before play begins.
    const cardDrawCounts: Record<string, number> = {};
    for (const entry of state.hand) {
        cardDrawCounts[entry.cardId] = (cardDrawCounts[entry.cardId] ?? 0) + 1;
    }
    state = rollEncounterDice(state).state;
    // Policy randomness (chaos ranking) rides the same seeded global stream the
    // engine uses — never Math.random. greedy/blind never consume it, keeping
    // their engine stream (and therefore behavior) bit-identical to the
    // pre-roster sim.
    const rng = (): number => getRng().random();

    let plays = 0;
    let statusPlays = 0;
    let loopGuard = 0;
    let guardOnAttack = 0;
    let playerHpTaken = 0;
    // Phase 43 — the ARC sample: enemy HP at every round boundary (plus the
    // post-fight value pushed after the loop). `damageCentroid` turns the
    // series into "when in the fight did the HP actually fall?".
    const enemyHpSamples: number[] = [];
    let decisionPoints = 0;
    let liveOptions = 0;
    const activeEffectSamples: number[] = [];
    const cardUsage: Record<string, CombatCardUsage> = {};
    const cardLineTelemetry: Record<string, CombatCardLineTelemetry> = {};

    while (state.phase !== 'complete' && loopGuard < 200) {
        loopGuard++;
        if (state.capitulationChoiceActive) {
            state = selectCapitulationChoice(state, policyObj.capitulationChoice).state;
            if (state.phase === 'complete' || state.finalOutcome) break;
            continue;
        }
        if (state.mercyChoiceActive) {
            state = selectMercyChoice(state, policyObj.mercyChoice).state;
            if (state.phase === 'complete' || state.finalOutcome) break;
            continue;
        }
        if (state.phase === 'phase-play') {
            enemyHpSamples.push(state.enemy.health);
            const r = policyPlayPhase(state, policyObj, rng, cardUsage, cardLineTelemetry, focusIds);
            state = r.state;
            plays += r.plays;
            statusPlays += r.statusPlays;
            decisionPoints += r.decisionPoints;
            liveOptions += r.liveOptions;
            if (state.finalOutcome) break;
            if (state.capitulationChoiceActive) {
                state = selectCapitulationChoice(state, policyObj.capitulationChoice).state;
                if (state.phase === 'complete' || state.finalOutcome) break;
                continue;
            }
            if (state.mercyChoiceActive) {
                state = selectMercyChoice(state, policyObj.mercyChoice).state;
                if (state.phase === 'complete' || state.finalOutcome) break;
                continue;
            }
            if (state.phase === 'phase-play') {
                // WS1.1 — every hand entry still here is about to be discarded
                // un-played by the engine's draw-fresh site in
                // `resolveThreatPhase` (the phase-end discard).
                for (const h of handCards(state)) {
                    lineRow(cardLineTelemetry, h.card.id).unplayedAtPhaseEnd++;
                }
                // Sample active effects and guard BEFORE the threat resolves.
                activeEffectSamples.push(state.enemy.effects.length);
                const guardBefore = state.guard ?? 0;
                const playerHpBefore = state.player.health;
                const result = resolveThreatPhase(state);
                state = result.state;
                // If the threat actually fired, attribute guard availability + HP taken.
                if (result.events.some(e => e.kind === 'threat-fired')) {
                    guardOnAttack += guardBefore;
                    playerHpTaken += Math.max(0, playerHpBefore - state.player.health);
                }
            }
        } else {
            break;
        }
    }

    const convictionSpent = Math.max(0, state.turn - state.conviction);

    // Metrics slate — every draw after the opening deal rides a `hand-drawn`
    // event in the transcript (draw riders, conjure, phase-boundary refills).
    for (const ev of state.log) {
        if (ev.kind !== 'hand-drawn') continue;
        for (const cardId of ev.cards) {
            cardDrawCounts[cardId] = (cardDrawCounts[cardId] ?? 0) + 1;
        }
    }

    // Derive HP-damage breakdown from the accumulated event log.
    let dotHpDamage = 0;
    let mechanicBurstDamage = 0;
    for (const ev of state.log) {
        if (ev.kind === 'dot-tick' && ev.target === 'enemy') dotHpDamage += ev.amount;
        // Spec 32 v3 — the payoff-burst vocabulary: RUPTURE / REAP bursts, the
        // conclusion classes, plus the engine-gated drips (BACKFIRE, thorns,
        // riposte are credited via their own events).
        if (ev.kind === 'rupture-detonated') mechanicBurstDamage += ev.amount;
        if (ev.kind === 'reaped') mechanicBurstDamage += ev.amount;
        if (ev.kind === 'backfired') mechanicBurstDamage += ev.amount;
        if (ev.kind === 'thorns-reflected') mechanicBurstDamage += ev.amount;
        if (ev.kind === 'riposte-fired') mechanicBurstDamage += ev.amount;
        if (ev.kind === 'conclude-hit') mechanicBurstDamage += ev.amount;
    }
    // directDamageDealt includes mechanic bursts; subtract them to get pure strikes.
    const directHpDamage = Math.max(0, state.directDamageDealt - mechanicBurstDamage);

    // ── Phase 43 — objective-function telemetry for this run ─────────────────
    // Locked-mechanic counters come straight off the transcript; arc, width and
    // identity come from the loop above and the engine's own damage ledger.
    enemyHpSamples.push(state.enemy.health);
    const objective = emptyObjectiveTelemetry();
    foldObjectiveEvents(state.log, objective);
    objective.convictionGained += openingConviction;
    objective.runs = 1;
    objective.rounds = state.round;
    const centroid = damageCentroid(enemyHpSamples);
    if (centroid !== null) {
        objective.arcRuns = 1;
        objective.arcCentroidSum = centroid;
    }
    objective.decisionPoints = decisionPoints;
    objective.liveOptions = liveOptions;
    // IDENTITY denominator. Deliberately NOT `state.attribution` alone: post
    // strike-death that ledger's `dotDamage` is filled at SUMMARY time, so the
    // raw rows carry direct damage only and the whole fight collapses onto
    // whichever signature burst last — which is why `dominantCardShare` reads
    // ~100% on nearly every cell. Cards are credited from the sim's own
    // per-line HP swing (immediate + projected DoT, the `playHpSwing`
    // measure); non-card damage sources still in the ledger (signatures,
    // engine drips) are folded in afterwards so "the generic engine won it"
    // stays visible as an identity failure rather than disappearing.
    for (const row of Object.values(cardLineTelemetry)) {
        const dmg = row.freeHpSwing + row.paidHpSwing;
        if (dmg > 0) objective.damageByCard[row.cardId] = (objective.damageByCard[row.cardId] ?? 0) + dmg;
    }
    for (const row of Object.values(state.attribution)) {
        if (cardLineTelemetry[row.cardId]) continue;
        const dmg = row.dotDamage + row.damageDealt;
        if (dmg > 0) objective.damageByCard[row.cardId] = (objective.damageByCard[row.cardId] ?? 0) + dmg;
    }

    return {
        outcome: state.finalOutcome ?? 'defeat',
        rounds: state.round,
        plays,
        statusPlays,
        convictionSpent,
        turnLawBlocked: state.log.filter(ev => ev.kind === 'turn-law-blocked').length,
        stakesPlaced: state.log.filter(ev => ev.kind === 'stake-placed').length,
        stakesWon: state.log.filter(ev => ev.kind === 'stake-won').length,
        signatureCastsByKind: state.log.reduce<Record<string, number>>((acc, ev) => {
            if (ev.kind === 'signature-cast') acc[ev.signatureId] = (acc[ev.signatureId] ?? 0) + 1;
            return acc;
        }, {}),
        dotHpDamage,
        mechanicBurstDamage,
        directHpDamage,
        guardOnAttack,
        playerHpTaken,
        activeEffectSamples,
        cardUsage,
        cardLineTelemetry,
        cardDrawCounts,
        attribution: state.attribution,
        objective,
    };
}

/** Options for `simulateHazardPatternCombatDetailed`. */
export interface CombatSimDetailedOptions {
    player: Character;
    enemy: Enemy;
    /** Number of seeded runs (default 300). */
    runs?: number;
    /** Per-run seed = startSeed + runIndex (default 1). */
    startSeed?: number;
    /** Scripted witness (default 'greedy'). */
    policy?: CombatSimPolicyId;
    /** Explicit deck threaded to every run. */
    deck?: readonly string[];
    /** Cards boosted to the front of ranking in every run (coverage harness). */
    focusCardIds?: readonly string[];
}

/** The AGGREGATED usage row for a card, created zeroed (WS1.1 line-telemetry
 *  fields included — aggregated rows always carry them) on first touch. */
function aggUsageRow(cardUsage: Record<string, CombatCardUsage>, cardId: string): CombatCardUsage {
    return cardUsage[cardId] ?? (cardUsage[cardId] = {
        cardId, plays: 0, bottomPlays: 0, topPlays: 0, statusLands: 0, discards: 0,
        fizzles: 0, lineContribution: { free: 0, paid: 0 }, unplayedAtPhaseEnd: 0,
        drawsSeen: 0, runsDrawn: 0, winsWhenDrawn: 0,
    });
}

/** A zeroed win-path tally with every `CombatOutcome` key present. */
function emptyWinPathCounts(): WinPathCounts {
    return { victory: 0, mercy: 0, capitulate: 0, concede: 0, defeat: 0, retreat: 0 };
}

/** The card with the largest share of total attributed enemy-HP damage. */
function dominantCard(damageByCard: Record<string, number>): { dominantCardId: string; dominantCardShare: number } {
    const entries = Object.entries(damageByCard);
    const total = entries.reduce((s, [, d]) => s + d, 0);
    if (total <= 0 || entries.length === 0) return { dominantCardId: '', dominantCardShare: 0 };
    let bestId = '';
    let bestDmg = -Infinity;
    for (const [id, dmg] of entries) {
        if (dmg > bestDmg) { bestDmg = dmg; bestId = id; }
    }
    return { dominantCardId: bestId, dominantCardShare: bestDmg / total };
}

/**
 * Normalized Shannon entropy (0–1) of the per-card PLAYS distribution. 0 when
 * one card carried every play (one-note spam); 1 when plays are spread evenly
 * across the distinct cards that saw play. A single played card (or none)
 * yields 0 — there is no spread to measure.
 */
function normalizedPlayEntropy(usage: readonly CombatCardUsage[]): number {
    const plays = usage.map(u => u.plays).filter(p => p > 0);
    const total = plays.reduce((s, p) => s + p, 0);
    if (total <= 0 || plays.length <= 1) return 0;
    let h = 0;
    for (const p of plays) {
        const prob = p / total;
        h -= prob * Math.log(prob);
    }
    return h / Math.log(plays.length);
}

/**
 * Monte-Carlo simulation with per-card telemetry: runs `runs` seeded
 * encounters and reports the win/mercy/defeat distribution + engagement
 * witnesses, plus a per-card usage table aggregated over all runs.
 */
export function simulateHazardPatternCombatDetailed(
    options: CombatSimDetailedOptions,
): { stats: CombatSimStats; cardUsage: Record<string, CombatCardUsage> } {
    const count = options.runs ?? 300;
    const startSeed = options.startSeed ?? 1;
    const policy = options.policy ?? 'greedy';

    let victories = 0, mercies = 0, defeats = 0, retreats = 0;
    let totalRounds = 0, totalRoundsSq = 0, totalPlays = 0, totalStatusPlays = 0, totalConviction = 0;
    let totalDotHp = 0, totalMechanicBurst = 0, totalDirectHp = 0;
    let totalGuardOnAttack = 0, totalPlayerHpTaken = 0;
    let totalActiveEffectSamples = 0, totalPhaseSamples = 0;
    const winPathCounts = emptyWinPathCounts();
    // Per-card enemy-HP damage across all runs (dominant-card witness).
    const damageByCard: Record<string, number> = {};
    const cardUsage: Record<string, CombatCardUsage> = {};
    // Phase 43 — pooled objective telemetry across the runs (scored once, at
    // the end: the components are nonlinear, so pooling counters is the only
    // correct aggregation).
    const objectiveTelemetry = emptyObjectiveTelemetry();

    for (let i = 0; i < count; i++) {
        const r = runOneEncounter(options.player, options.enemy, startSeed + i, policy, {
            deck: options.deck,
            focusCardIds: options.focusCardIds,
        });
        winPathCounts[r.outcome]++;
        addObjectiveTelemetry(objectiveTelemetry, r.objective);
        if (r.outcome === 'victory') victories++;
        // Spec 32 v3 §9 — RELENT (PLEA) and CONDEMN (Peroration) are
        // merciful resolutions: they count with the mercy wins.
        else if (r.outcome === 'mercy' || r.outcome === 'capitulate' || r.outcome === 'concede') mercies++;
        else if (r.outcome === 'retreat') retreats++;
        else defeats++;
        const won = r.outcome === 'victory' || r.outcome === 'mercy'
            || r.outcome === 'capitulate' || r.outcome === 'concede';
        // Metrics slate — fold the run's draw ledger into the aggregated rows.
        // With an explicit deck, restrict to its cards so a synthetic/conjured
        // id can never violate the "usage ⊆ deck" matrix invariant.
        const deckIds = options.deck ? new Set(options.deck) : null;
        for (const [cardId, drawn] of Object.entries(r.cardDrawCounts)) {
            if (drawn <= 0 || (deckIds && !deckIds.has(cardId))) continue;
            const agg = aggUsageRow(cardUsage, cardId);
            agg.drawsSeen = (agg.drawsSeen ?? 0) + drawn;
            agg.runsDrawn = (agg.runsDrawn ?? 0) + 1;
            if (won) agg.winsWhenDrawn = (agg.winsWhenDrawn ?? 0) + 1;
        }
        for (const row of Object.values(r.attribution)) {
            damageByCard[row.cardId] = (damageByCard[row.cardId] ?? 0) + row.dotDamage + row.damageDealt;
        }
        totalRounds += r.rounds;
        totalRoundsSq += r.rounds * r.rounds;
        totalPlays += r.plays;
        totalStatusPlays += r.statusPlays;
        totalConviction += r.convictionSpent;
        totalDotHp += r.dotHpDamage;
        totalMechanicBurst += r.mechanicBurstDamage;
        totalDirectHp += r.directHpDamage;
        totalGuardOnAttack += r.guardOnAttack;
        totalPlayerHpTaken += r.playerHpTaken;
        for (const s of r.activeEffectSamples) totalActiveEffectSamples += s;
        totalPhaseSamples += r.activeEffectSamples.length;
        for (const row of Object.values(r.cardUsage)) {
            const agg = aggUsageRow(cardUsage, row.cardId);
            agg.plays += row.plays;
            agg.bottomPlays += row.bottomPlays;
            agg.topPlays += row.topPlays;
            agg.statusLands += row.statusLands;
            agg.discards += row.discards;
        }
        // WS1.1 — fold the per-run line telemetry into the aggregated rows
        // (per-run usage rows deliberately omit these fields; see the type).
        for (const row of Object.values(r.cardLineTelemetry)) {
            const agg = aggUsageRow(cardUsage, row.cardId);
            agg.fizzles = (agg.fizzles ?? 0) + row.fizzles;
            agg.unplayedAtPhaseEnd = (agg.unplayedAtPhaseEnd ?? 0) + row.unplayedAtPhaseEnd;
            const lc = agg.lineContribution ?? (agg.lineContribution = { free: 0, paid: 0 });
            lc.free += row.freeHpSwing;
            lc.paid += row.paidHpSwing;
        }
    }

    const totalEnemyHpLost = Math.max(1, totalDotHp + totalMechanicBurst + totalDirectHp);
    const guardDenom = Math.max(1, totalGuardOnAttack + totalPlayerHpTaken);

    // Distinct cards that earned at least one play across the runs.
    const playedIds = Object.values(cardUsage).filter(u => u.plays > 0).map(u => u.cardId);
    // Denominator: distinct non-synthetic cards in the threaded deck; when no
    // explicit deck was given (known-cards path) fall back to the played set so
    // utilization reads 1.0 rather than dividing by an unknown pool.
    const deckDistinct = options.deck
        ? new Set(options.deck).size
        : playedIds.length;
    const deckUtilization = deckDistinct > 0 ? Math.min(1, playedIds.length / deckDistinct) : 0;

    const { dominantCardId, dominantCardShare } = dominantCard(damageByCard);

    const stats: CombatSimStats = {
        runs: count,
        victories,
        mercies,
        defeats,
        retreats,
        winRate: (victories + mercies) / count,
        winPathCounts,
        avgRounds: totalRounds / count,
        // Population σ; the max(0, …) guards float error on a zero-variance set.
        roundsStdDev: Math.sqrt(Math.max(0,
            totalRoundsSq / count - (totalRounds / count) ** 2)),
        statusEngagement: totalPlays > 0 ? totalStatusPlays / totalPlays : 0,
        combatQuality: scoreCombatObjective(objectiveTelemetry),
        objectiveTelemetry,
        avgConvictionSpent: totalConviction / count,
        dotHpFraction: totalDotHp / totalEnemyHpLost,
        strikeFraction: totalDirectHp / totalEnemyHpLost,
        mechanicBurstFraction: totalMechanicBurst / totalEnemyHpLost,
        guardMitigatedFraction: totalGuardOnAttack / guardDenom,
        avgActiveEffectsPerPhase: totalPhaseSamples > 0 ? totalActiveEffectSamples / totalPhaseSamples : 0,
        deckUtilization,
        usageEntropy: normalizedPlayEntropy(Object.values(cardUsage)),
        dominantCardId,
        dominantCardShare,
    };
    return { stats, cardUsage };
}

/**
 * Monte-Carlo simulation: runs `count` seeded encounters and reports the
 * win/mercy/defeat distribution + engagement witnesses.
 */
export function simulateHazardPatternCombat(
    player: Character,
    enemy: Enemy,
    count = 300,
    startSeed = 1,
    policy: CombatSimPolicyId = 'greedy',
): CombatSimStats {
    return simulateHazardPatternCombatDetailed({ player, enemy, runs: count, startSeed, policy }).stats;
}
