/**
 * Hazard Minigame v2 — pure engine.
 *
 * Every function takes a `HazardSessionState` and returns a new one
 * (or the same reference when the transition is illegal). All
 * randomness flows through the session's embedded mulberry32 state,
 * so a session is fully reproducible from its seed.
 *
 * Doctrine (user-confirmed 2026-06-10):
 *  - Dice are cast ONCE at route selection and never re-cast between
 *    rounds. Spent dice stay spent. Only the SECOND WIND (re-cast) and
 *    convert cards manipulate the pool mid-hazard.
 *  - Safe route: one combined FORCE+ESCAPE meter per round.
 *  - Risk route: dual meters — BOTH must clear in the same round.
 *  - Momentum (REC#1): surplus progress on a cleared round carries
 *    half (capped at HAZARD_MOMENTUM_CAP) into the next round.
 *  - Reserves (REC#3): unspent non-hex dice at completion each restore
 *    1 VITAE on complete/perfect tiers.
 */

import {
    getHazardCardDef,
    getHazardDef,
    getHazardSubquestDef,
    HAZARD_CRACK_CARD,
    HAZARD_DIE_FACES,
    HAZARD_REWARD_CARDS,
    HAZARD_SUBQUESTS,
} from './hazard.content';
import {
    generateRewardOffer,
    generateSubquestDraft,
    generateDeckIdentity,
    removeCardFromDeck,
} from './hazard.engagement';
import { HAZARD_TUNING } from './hazard.tuning';
import { nextInt, seedRng, shuffle, type HazardRngState } from './hazard.rng';
import { branchMinigameSeed, type SeedInput } from '../seed';
import {
    EMPTY_HAZARD_MODIFIERS,
    EMPTY_HAZARD_QUEST_METRICS,
    HAZARD_DICE_COUNT,
    HAZARD_HAND_SIZE,
    HAZARD_MOMENTUM_CAP,
    type HazardCardDef,
    type HazardColor,
    type HazardConsequenceId,
    type HazardDeckIdentity,
    type HazardDie,
    type HazardHandEntry,
    type HazardMark,
    type HazardModifiers,
    type HazardOutcome,
    type HazardOutcomeTier,
    type HazardProgressKey,
    type HazardQuestMetrics,
    type HazardResolveInfo,
    type HazardRewardId,
    type HazardRouteKey,
    type HazardSessionState,
    type HazardSubquestResult,
    type HazardSubquestState,
    type HazardSubquestStatus,
} from './hazard.types';

/** Card colours (besides the wild gold die) whose dice can power `def`. */
export function hazardCardPowerColors(def: HazardCardDef): HazardColor[] {
    return def.colors ?? [def.kind];
}

/** Accumulate an enchantment payload onto the session modifiers. */
function addModifiers(m: HazardModifiers, p: Partial<HazardModifiers>): HazardModifiers {
    return {
        auraForce: m.auraForce + (p.auraForce ?? 0),
        auraEscape: m.auraEscape + (p.auraEscape ?? 0),
        surgeForce: m.surgeForce + (p.surgeForce ?? 0),
        surgeEscape: m.surgeEscape + (p.surgeEscape ?? 0),
    };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

interface Roll<T> {
    value: T;
    rng: HazardRngState;
    uidCounter: number;
}

function rollDie(rng: HazardRngState, uidCounter: number): Roll<HazardDie> {
    const draw = nextInt(rng, HAZARD_DIE_FACES.length);
    const id = `d${uidCounter + 1}`;
    return {
        value: { id, kind: HAZARD_DIE_FACES[draw.value], state: 'available' },
        rng: draw.state,
        uidCounter: uidCounter + 1,
    };
}

/** A fresh usable (non-hex) colour die — for powered re-cast / convert extras. */
function rollManaDie(rng: HazardRngState, uidCounter: number, kind?: HazardColor): Roll<HazardDie> {
    const colors: HazardColor[] = ['red', 'blue', 'purple', 'gold'];
    let nextRng = rng;
    let color = kind;
    if (!color) {
        const draw = nextInt(nextRng, colors.length);
        nextRng = draw.state;
        color = colors[draw.value];
    }
    const id = `d${uidCounter + 1}`;
    return {
        value: { id, kind: color, state: 'available', temporary: true },
        rng: nextRng,
        uidCounter: uidCounter + 1,
    };
}

/** Builds the weighted draw bag from a list of deck card ids. */
function refillPile(rng: HazardRngState, deckBag: readonly string[]): { pile: string[]; rng: HazardRngState } {
    const shuffled = shuffle(rng, deckBag);
    return { pile: shuffled.value, rng: shuffled.state };
}

interface DrawResult {
    drawn: HazardHandEntry[];
    drawPile: string[];
    rng: HazardRngState;
    uidCounter: number;
}

function drawFromPile(
    rng: HazardRngState,
    uidCounter: number,
    drawPile: readonly string[],
    deckBag: readonly string[],
    n: number,
): DrawResult {
    let pile = drawPile.slice();
    let r = rng;
    if (pile.length < n) {
        const refill = refillPile(r, deckBag);
        pile = pile.concat(refill.pile);
        r = refill.rng;
    }
    let uc = uidCounter;
    const drawn = pile.slice(0, n).map((cardId) => {
        uc += 1;
        return { uid: `c${uc}`, cardId, dieId: null };
    });
    return { drawn, drawPile: pile.slice(n), rng: r, uidCounter: uc };
}

/**
 * Per-card {force, escape} contribution. A card pays its numbers whether
 * or not it also carries a utility (purple hybrids always pay their low
 * dual number; gold cards pay nothing until a die is applied, since their
 * free row is 0/0). Dead CRACK cards contribute nothing.
 */
export function hazardCardValue(entry: HazardHandEntry): { force: number; escape: number } {
    const def = getHazardCardDef(entry.cardId);
    if (def.dead) return { force: 0, escape: 0 };
    const powered = entry.dieId !== null;
    let force: number;
    let escape: number;
    if (def.choose && powered) {
        // CHOOSE: the powered value feeds ONE chosen meter (default FORCE).
        const amount = entry.chosenKey === 'escape' ? (def.ep ?? def.fp ?? 0) : (def.fp ?? 0);
        force = entry.chosenKey === 'escape' ? 0 : amount;
        escape = entry.chosenKey === 'escape' ? amount : 0;
    } else {
        force = powered ? (def.fp ?? def.f) : def.f;
        escape = powered ? (def.ep ?? def.e) : def.e;
    }
    if (entry.vowBonus) {
        force += entry.vowBonus.force;
        escape += entry.vowBonus.escape;
    }
    return { force, escape };
}

/**
 * Staged progress (play area only — excludes momentum base). Applies the
 * session's persistent enchantment modifiers per card:
 *  - surge boost (RELIC OF FURY) lifts a POWERED card's contributions;
 *  - aura (AGGRESSION / SWIFTNESS / ZEAL / MARTYR'S) lifts EVERY card that
 *    contributes a given meter — the user's "+X to every card that generates
 *    that value" framing.
 */
export function hazardStagedProgress(s: HazardSessionState): { force: number; escape: number } {
    const m = s.modifiers;
    return s.play.reduce(
        (acc, e) => {
            const v = hazardCardValue(e);
            const powered = e.dieId !== null;
            let f = v.force;
            let escape = v.escape;
            if (powered && f > 0) f += m.surgeForce;
            if (powered && escape > 0) escape += m.surgeEscape;
            if (f > 0) f += m.auraForce;
            if (escape > 0) escape += m.auraEscape;
            return { force: acc.force + f, escape: acc.escape + escape };
        },
        { force: 0, escape: 0 },
    );
}

/** Projected round progress: momentum base + staged cards (enchants applied). */
export function hazardProjectedProgress(s: HazardSessionState): { force: number; escape: number } {
    const staged = hazardStagedProgress(s);
    return {
        force: s.progressBase.force + staged.force,
        escape: s.progressBase.escape + staged.escape,
    };
}

/**
 * RAW staged progress — the bare card numbers, with NO persistent enchant
 * modifiers applied. Momentum carry is computed from this so an enchant only
 * ever boosts the round its cards are PLAYED in; it never gets banked into the
 * surplus carried forward and re-counted in later rounds' totals.
 */
function hazardStagedProgressRaw(s: HazardSessionState): { force: number; escape: number } {
    return s.play.reduce(
        (acc, e) => {
            const v = hazardCardValue(e);
            return { force: acc.force + v.force, escape: acc.escape + v.escape };
        },
        { force: 0, escape: 0 },
    );
}

/** RAW projected progress (momentum base + raw staged), used for carry only. */
function hazardProjectedProgressRaw(s: HazardSessionState): { force: number; escape: number } {
    const staged = hazardStagedProgressRaw(s);
    return {
        force: s.progressBase.force + staged.force,
        escape: s.progressBase.escape + staged.escape,
    };
}

// ---------------------------------------------------------------------------
// Session lifecycle
// ---------------------------------------------------------------------------

/**
 * Rolls the hazard's sub-quests off an INDEPENDENT seeded stream (branched
 * from the session seed) so objective selection never perturbs the card /
 * dice RNG — the play stream stays byte-for-byte identical to a quest-less
 * session, keeping the balance sim and deterministic tests stable.
 */
function rollSubquests(seed: SeedInput): HazardSubquestState[] {
    const rng = seedRng(branchMinigameSeed(seed, 0x5175e57));
    const ids = HAZARD_SUBQUESTS.map((q) => q.id);
    const shuffled = shuffle(rng, ids).value;
    const n = Math.min(HAZARD_TUNING.subquests.pickCount, shuffled.length);
    return shuffled.slice(0, n).map((id) => ({ id }));
}

/**
 * Creates a fresh session in `route-select`: opening hand drawn (the
 * player sees their 5 cards BEFORE committing to a route), dice not
 * yet cast.
 */
export function createHazardSession(
    seed: SeedInput,
    deckBag: readonly string[],
    hazardId: string,
): HazardSessionState {
    const def = getHazardDef(hazardId);
    let rng = seedRng(seed);
    const refill = refillPile(rng, deckBag);
    rng = refill.rng;
    const draw = drawFromPile(rng, 0, refill.pile, deckBag, HAZARD_HAND_SIZE);
    return {
        hazardId,
        phase: 'route-select',
        route: null,
        round: 1,
        totalRounds: def.rounds,
        marks: Array.from({ length: def.rounds }, () => 'pending' as HazardMark),
        drawPile: draw.drawPile,
        discardPile: [],
        hand: draw.drawn,
        play: [],
        dice: [],
        progressBase: { force: 0, escape: 0 },
        modifiers: { ...EMPTY_HAZARD_MODIFIERS },
        subquests: rollSubquests(seed),
        subquestDraft: generateSubquestDraft(HAZARD_SUBQUESTS, rng),
        questMetrics: { ...EMPTY_HAZARD_QUEST_METRICS, roundsCleared: [] },
        goldVow: null,
        momentumCap: HAZARD_MOMENTUM_CAP,
        vitaeCost: 0,
        vitaeRestore: 0,
        bountyShillings: 0,
        wardPenaltyReduction: 0,
        carryFloor: 0,
        foretellPending: null,
        resolveInfo: null,
        outcome: null,
        pickedRewardCardId: null,
        seed,
        rng: draw.rng,
        uidCounter: draw.uidCounter,
    };
}

/** Route choice is binding for the whole hazard; casts the dice (once). */
export function selectHazardRoute(
    s: HazardSessionState,
    route: HazardRouteKey,
    deckBag: readonly string[],
): HazardSessionState {
    void deckBag;
    if (s.phase !== 'route-select') return s;
    let rng = s.rng;
    let uc = s.uidCounter;
    const dice: HazardDie[] = [];
    for (let i = 0; i < HAZARD_DICE_COUNT; i++) {
        const roll = rollDie(rng, uc);
        rng = roll.rng;
        uc = roll.uidCounter;
        dice.push(roll.value);
    }
    return { ...s, phase: 'rolling', route, dice, rng, uidCounter: uc };
}

/** The dice-cast interstitial finished animating; begin round play. */
export function finishHazardRolling(s: HazardSessionState): HazardSessionState {
    if (s.phase !== 'rolling') return s;
    return { ...s, phase: 'playing' };
}

// ---------------------------------------------------------------------------
// Card effects (draw / re-cast / convert)
// ---------------------------------------------------------------------------

/**
 * Fires a card's utility once, in full, at the appropriate tier. The
 * effect now fires on APPLY (not on stage/power), so this draws / recasts
 * / converts the WHOLE amount for the tier rather than a powered delta.
 * `major` is true when a die is attached OR the card is a gold
 * `majorEffect` card (utility-first — always major, the die buys numbers).
 */
function applyUtilityEffect(
    s: HazardSessionState,
    def: HazardCardDef,
    powered: boolean,
    deckBag: readonly string[],
): HazardSessionState {
    const major = powered || def.majorEffect === true;
    if (def.effect === 'draw') {
        const base = def.drawBase ?? 1;
        const n = major ? (def.drawPowered ?? base) : base;
        if (n <= 0) return s;
        const draw = drawFromPile(s.rng, s.uidCounter, s.drawPile, deckBag, n);
        return {
            ...s,
            hand: [...s.hand, ...draw.drawn],
            drawPile: draw.drawPile,
            rng: draw.rng,
            uidCounter: draw.uidCounter,
        };
    }
    if (def.effect === 'recast') {
        let rng = s.rng;
        let uc = s.uidCounter;
        let dice = s.dice.map((d) => {
            if (d.state !== 'available') return d;
            const roll = rollDie(rng, uc);
            rng = roll.rng;
            uc = roll.uidCounter;
            return roll.value;
        });
        if (major) {
            const extra = rollManaDie(rng, uc);
            rng = extra.rng;
            uc = extra.uidCounter;
            dice = [...dice, extra.value];
        }
        return { ...s, dice, rng, uidCounter: uc };
    }
    if (def.effect === 'convert') {
        // CONVERT always mints WILD GOLD dice (so it is never strictly worse
        // than re-cast). Minor turns ONE hostile ✕; major turns them ALL, and
        // — when ≤1 was converted — conjures a floating gold die so a major
        // convert is always strictly better than a minor one.
        const hexIds = s.dice.filter((d) => d.kind === 'hex' && d.state === 'available').map((d) => d.id);
        let rng = s.rng;
        let uc = s.uidCounter;
        let dice: HazardDie[];
        let convertedCount: number;
        if (major) {
            dice = s.dice.map((d) =>
                d.kind === 'hex' ? { ...d, kind: 'gold' as const, state: 'available' as const } : d,
            );
            convertedCount = hexIds.length;
            if (convertedCount <= 1) {
                const extra = rollManaDie(rng, uc, 'gold');
                rng = extra.rng;
                uc = extra.uidCounter;
                dice = [...dice, extra.value];
            }
        } else {
            const targetId = hexIds[0];
            dice = targetId
                ? s.dice.map((d) =>
                      d.id === targetId ? { ...d, kind: 'gold' as const, state: 'available' as const } : d,
                  )
                : s.dice;
            convertedCount = targetId ? 1 : 0;
        }
        void convertedCount;
        return { ...s, dice, rng, uidCounter: uc };
    }
    if (def.effect === 'aura') {
        const payload = (major ? def.auraPowered ?? def.auraBase : def.auraBase) ?? undefined;
        if (!payload) return s;
        return { ...s, modifiers: addModifiers(s.modifiers, payload) };
    }
    if (def.effect === 'burst') {
        // One-round shove: rides progressBase (the round advance overwrites it).
        const payload = major ? def.burstPowered ?? def.burstBase : def.burstBase;
        let force = (payload?.force ?? 0);
        let escape = (payload?.escape ?? 0);
        if (def.burstPerUnspentDieForce) {
            const unspent = s.dice.filter((d) => d.kind !== 'hex' && d.state === 'available').length;
            force += unspent * def.burstPerUnspentDieForce;
        }
        if (def.burstPerUnspentDieEscape) {
            const unspent = s.dice.filter((d) => d.kind !== 'hex' && d.state === 'available').length;
            escape += unspent * def.burstPerUnspentDieEscape;
        }
        // ECHO (MTG Storm analogue): +force/escape per card already applied this round.
        // Powered tier doubles the per-card bonus — ECHO cards shine when played last.
        if (def.echoPerCardForce || def.echoPerCardEscape) {
            const alreadyApplied = s.play.filter((p) => p.applied).length;
            const mult = major ? 2 : 1;
            force += alreadyApplied * (def.echoPerCardForce ?? 0) * mult;
            escape += alreadyApplied * (def.echoPerCardEscape ?? 0) * mult;
        }
        const vitaeCost = s.vitaeCost + (def.vitaeCost ?? 0);
        // MEND rider: sacrifice-burst cards may also promise a vitae mend at claim.
        const vitaeRestore = s.vitaeRestore + (major
            ? (def.burstMendPowered ?? def.burstMendBase ?? 0)
            : (def.burstMendBase ?? 0));
        if (force === 0 && escape === 0 && vitaeCost === s.vitaeCost && vitaeRestore === s.vitaeRestore) return s;
        return {
            ...s,
            progressBase: {
                force: s.progressBase.force + force,
                escape: s.progressBase.escape + escape,
            },
            vitaeCost,
            vitaeRestore,
        };
    }
    if (def.effect === 'goldvow') {
        if (!def.goldVow) return s;
        return { ...s, goldVow: { ...def.goldVow } };
    }
    if (def.effect === 'purge') {
        // PURGE: cut the dead weight. Minor removes ONE crack — from hand
        // first, then the draw pile; major scours hand, pile, AND discard
        // (so a refill never shuffles the flaw back in this session).
        const isCrack = (cardId: string) => getHazardCardDef(cardId).dead === true;
        let afterPurge: HazardSessionState;
        if (major) {
            afterPurge = {
                ...s,
                hand: s.hand.filter((h) => !isCrack(h.cardId)),
                drawPile: s.drawPile.filter((id) => !isCrack(id)),
                discardPile: s.discardPile.filter((id) => !isCrack(id)),
            };
        } else {
            const handIdx = s.hand.findIndex((h) => isCrack(h.cardId));
            if (handIdx >= 0) {
                afterPurge = { ...s, hand: s.hand.filter((_, i) => i !== handIdx) };
            } else {
                const pileIdx = s.drawPile.findIndex(isCrack);
                afterPurge = pileIdx >= 0
                    ? { ...s, drawPile: s.drawPile.filter((_, i) => i !== pileIdx) }
                    : s;
            }
        }
        // Purge+Draw combo: some purge cards reward the clean-up with extra cards.
        if (def.purgeDrawCount && def.purgeDrawCount > 0) {
            const draw = drawFromPile(afterPurge.rng, afterPurge.uidCounter, afterPurge.drawPile, deckBag, def.purgeDrawCount);
            return {
                ...afterPurge,
                hand: [...afterPurge.hand, ...draw.drawn],
                drawPile: draw.drawPile,
                rng: draw.rng,
                uidCounter: draw.uidCounter,
            };
        }
        return afterPurge;
    }
    if (def.effect === 'transmute') {
        // TRANSMUTE: recolor available dice to THIS card's colour (hex
        // stays hostile — that's CONVERT's business). Minor turns the
        // first off-colour die; major turns them all.
        const target = def.kind;
        const candidates = s.dice.filter(
            (d) => d.state === 'available' && d.kind !== 'hex' && d.kind !== target,
        );
        if (candidates.length === 0) return s;
        const ids = major ? candidates.map((d) => d.id) : [candidates[0].id];
        return {
            ...s,
            dice: s.dice.map((d) => (ids.includes(d.id) ? { ...d, kind: target } : d)),
        };
    }
    if (def.effect === 'mend') {
        const amount = (major ? def.mendPowered ?? def.mendBase : def.mendBase) ?? 0;
        if (amount <= 0) return s;
        return { ...s, vitaeRestore: s.vitaeRestore + amount };
    }
    if (def.effect === 'bounty') {
        const amount = (major ? def.bountyPowered ?? def.bountyBase : def.bountyBase) ?? 0;
        if (amount <= 0) return s;
        return { ...s, bountyShillings: s.bountyShillings + amount };
    }
    if (def.effect === 'ward') {
        const amount = (major ? def.wardPowered ?? def.wardBase : def.wardBase) ?? 0;
        if (amount <= 0) return s;
        return { ...s, wardPenaltyReduction: s.wardPenaltyReduction + amount };
    }
    if (def.effect === 'anchor') {
        const amount = (major ? def.anchorPowered ?? def.anchorBase : def.anchorBase) ?? 0;
        if (amount <= 0) return s;
        return { ...s, carryFloor: Math.min(s.momentumCap, s.carryFloor + amount) };
    }
    if (def.effect === 'foretell') {
        // Pause in foretell-pending: reveal top N cards, let player reorder (and
        // in powered/scour mode optionally discard any number of them).
        // confirmHazardForetell resolves the pending state back to 'playing'.
        const n = major ? (def.foretellPowered ?? def.foretellBase ?? 2) : (def.foretellBase ?? 2);
        const revealed = s.drawPile.slice(0, n);
        const drawCount = def.foretellDrawCount ?? 0;
        const scour = def.foretellScour ?? false;
        return {
            ...s,
            phase: 'foretell-pending',
            drawPile: s.drawPile.slice(n),
            foretellPending: { revealed, powered: major, scour, drawCount },
        };
    }
    return s;
}

// ---------------------------------------------------------------------------
// Round play
// ---------------------------------------------------------------------------

/**
 * Moves a hand card into the play area (no cap — the player may stage
 * their whole hand). Number cards begin counting toward the meter
 * immediately; utility effects do NOT fire here — they fire on APPLY.
 */
export function stageHazardCard(
    s: HazardSessionState,
    uid: string,
    deckBag: readonly string[],
): HazardSessionState {
    void deckBag;
    if (s.phase !== 'playing') return s;
    const card = s.hand.find((h) => h.uid === uid);
    if (!card) return s;
    return {
        ...s,
        hand: s.hand.filter((h) => h.uid !== uid),
        play: [...s.play, card],
    };
}

/**
 * Returns a staged card to hand and frees its die. Refused once the card
 * has been APPLIED — applying is a one-way commit.
 */
export function unstageHazardCard(s: HazardSessionState, uid: string): HazardSessionState {
    if (s.phase !== 'playing') return s;
    const card = s.play.find((p) => p.uid === uid);
    if (!card || card.applied) return s;
    let dice = s.dice;
    if (card.dieId) {
        dice = s.dice.map((d) => (d.id === card.dieId ? { ...d, state: 'available' as const } : d));
    }
    return {
        ...s,
        play: s.play.filter((p) => p.uid !== uid),
        hand: [...s.hand, { ...card, dieId: null }],
        dice,
    };
}

/** True if `die` may power a card of colour `kind`: a matching-colour die,
 *  or the WILD gold die (which powers any colour). Hex is never usable. */
export function dieCanPower(dieKind: HazardDie['kind'], cardKind: HazardColor): boolean {
    if (dieKind === 'hex') return false;
    return dieKind === 'gold' || dieKind === cardKind;
}

/** Card-aware variant: honours two-tone `colors` (either of two colours, plus
 *  the wild gold die). Use this everywhere a card def is in hand. */
export function dieCanPowerCard(dieKind: HazardDie['kind'], def: HazardCardDef): boolean {
    if (dieKind === 'hex') return false;
    if (dieKind === 'gold') return true;
    return hazardCardPowerColors(def).includes(dieKind as HazardColor);
}

/**
 * Drops a die onto a staged card to arm its SURGE / numbers. A
 * matching-colour die works, and the WILD gold die powers any colour
 * (gold cards themselves still need a gold die — nothing else is gold).
 * Hex dice are blocked; dead cards and already-applied cards reject
 * everything. The utility effect does NOT fire here — that waits for
 * APPLY.
 */
export function powerHazardCard(
    s: HazardSessionState,
    uid: string,
    dieId: string,
    deckBag: readonly string[],
): HazardSessionState {
    void deckBag;
    if (s.phase !== 'playing') return s;
    const card = s.play.find((p) => p.uid === uid);
    const die = s.dice.find((d) => d.id === dieId);
    if (!card || !die || card.applied) return s;
    if (die.state !== 'available') return s;
    const def = getHazardCardDef(card.cardId);
    if (def.dead) return s;
    if (!dieCanPowerCard(die.kind, def)) return s;
    let dice = s.dice.map((d) => (d.id === dieId ? { ...d, state: 'spent' as const } : d));
    if (card.dieId) {
        dice = dice.map((d) => (d.id === card.dieId ? { ...d, state: 'available' as const } : d));
    }
    // GILDED VOW rides the FIRST gold die spent powering a card; re-powering
    // off a gold die drops the (already-spent) vow bonus so it never lingers.
    let goldVow = s.goldVow;
    let vowBonus = card.vowBonus;
    if (die.kind === 'gold' && goldVow != null) {
        vowBonus = { ...goldVow };
        goldVow = null;
    } else if (die.kind !== 'gold') {
        vowBonus = undefined;
    }
    return {
        ...s,
        dice,
        goldVow,
        play: s.play.map((p) =>
            p.uid === uid
                ? { ...p, dieId, vowBonus, chosenKey: def.choose ? p.chosenKey ?? 'force' : p.chosenKey }
                : p,
        ),
    };
}

/** CHOOSE card: pick which meter its powered value feeds (force | escape). */
export function chooseHazardCardKey(
    s: HazardSessionState,
    uid: string,
    key: HazardProgressKey,
): HazardSessionState {
    if (s.phase !== 'playing') return s;
    const card = s.play.find((p) => p.uid === uid);
    if (!card || card.applied) return s;
    const def = getHazardCardDef(card.cardId);
    if (!def.choose) return s;
    return { ...s, play: s.play.map((p) => (p.uid === uid ? { ...p, chosenKey: key } : p)) };
}

/**
 * APPLIES a staged card: fires its utility effect once (powered tier if a
 * die is attached, else base — gold `majorEffect` cards are always major)
 * and locks the card. Applied cards can no longer be unstaged, re-powered,
 * or discarded. A no-op if the card is missing or already applied.
 */
export function applyHazardCard(
    s: HazardSessionState,
    uid: string,
    deckBag: readonly string[],
): HazardSessionState {
    if (s.phase !== 'playing') return s;
    const card = s.play.find((p) => p.uid === uid);
    if (!card || card.applied) return s;
    let ns: HazardSessionState = {
        ...s,
        play: s.play.map((p) => (p.uid === uid ? { ...p, applied: true } : p)),
    };
    const def = getHazardCardDef(card.cardId);
    if (!def.dead) {
        if (def.effect) ns = applyUtilityEffect(ns, def, card.dieId !== null, deckBag);
        // Riders fire alongside the main effect (SAINT'S PATIENCE: draw + cap).
        if (def.momentumBonus) ns = { ...ns, momentumCap: ns.momentumCap + def.momentumBonus };
        // STORMCALLER sub-quest: tally re-cast / convert effects as they fire.
        if (def.effect === 'recast' || def.effect === 'convert') {
            ns = {
                ...ns,
                questMetrics: {
                    ...ns.questMetrics,
                    recastConvertApplied: ns.questMetrics.recastConvertApplied + 1,
                },
            };
        }
        // JEOPARDY: bonus progress when ≥1 round mark is already 'X'.
        const inJeopardy = ns.marks.some((m) => m === 'X');
        if (inJeopardy) {
            if (def.jeopardyForce) ns = { ...ns, progressBase: { ...ns.progressBase, force: ns.progressBase.force + def.jeopardyForce } };
            if (def.jeopardyEscape) ns = { ...ns, progressBase: { ...ns.progressBase, escape: ns.progressBase.escape + def.jeopardyEscape } };
        }
        // MIRACLE (first-play): bonus when this card is the first applied this round.
        // ns.play already has this card marked applied, so a count of 1 means us.
        const firstPlay = ns.play.filter((p) => p.applied).length === 1;
        if (firstPlay) {
            if (def.firstPlayForce) ns = { ...ns, progressBase: { ...ns.progressBase, force: ns.progressBase.force + def.firstPlayForce } };
            if (def.firstPlayEscape) ns = { ...ns, progressBase: { ...ns.progressBase, escape: ns.progressBase.escape + def.firstPlayEscape } };
        }
        // DELVE: +N per card already in discard pile at apply time.
        if (def.delveForce && ns.discardPile.length > 0) {
            ns = { ...ns, progressBase: { ...ns.progressBase, force: ns.progressBase.force + def.delveForce * ns.discardPile.length } };
        }
        if (def.delveEscape && ns.discardPile.length > 0) {
            ns = { ...ns, progressBase: { ...ns.progressBase, escape: ns.progressBase.escape + def.delveEscape * ns.discardPile.length } };
        }
    }
    return ns;
}

/**
 * Drags a HAND card to the trash bin (staged cards must be returned to
 * hand first; applied cards can never be binned). The card leaves the
 * round for its SALVAGE benefit, when it has one:
 *  - progress salvage rides `progressBase`, so it counts THIS round
 *    only (the round advance overwrites the base with momentum);
 *  - mana salvage conjures a temporary die of the card's colour.
 * Cards without salvage (utilities, CRACK) discard for nothing —
 * thinning the hand is the whole benefit.
 */
export function discardHazardCard(s: HazardSessionState, uid: string): HazardSessionState {
    if (s.phase !== 'playing') return s;
    const card = s.hand.find((h) => h.uid === uid);
    if (!card) return s;
    let ns: HazardSessionState = {
        ...s,
        hand: s.hand.filter((h) => h.uid !== uid),
        discardPile: [...s.discardPile, card.cardId],
        questMetrics: { ...s.questMetrics, cardsSalvaged: s.questMetrics.cardsSalvaged + 1 },
    };
    const def = getHazardCardDef(card.cardId);
    if (def.salvage?.type === 'progress') {
        ns = {
            ...ns,
            progressBase: {
                ...ns.progressBase,
                [def.salvage.key]: ns.progressBase[def.salvage.key] + def.salvage.amount,
            },
        };
    } else if (def.salvage?.type === 'mana') {
        const extra = rollManaDie(ns.rng, ns.uidCounter, def.kind);
        ns = { ...ns, dice: [...ns.dice, extra.value], rng: extra.rng, uidCounter: extra.uidCounter };
    }
    return ns;
}

// ---------------------------------------------------------------------------
// Resolve
// ---------------------------------------------------------------------------

function momentumCarry(value: number, need: number, cleared: boolean, lastRound: boolean, cap: number): number {
    if (!cleared || lastRound) return 0;
    const surplus = Math.max(0, value - need);
    return Math.min(cap, Math.floor(surplus / 2));
}

/**
 * Commits the staged set, judges the round, enters `resolve-flash`.
 * Any staged card not yet APPLIED is applied here (firing its utility)
 * — PLAY auto-commits the whole set, so the engine never judges an
 * un-committed card. The per-card APPLY button remains for players who
 * want a utility (draw / re-cast / convert) to fire mid-round.
 */
export function resolveHazardRound(s: HazardSessionState, deckBag: readonly string[] = []): HazardSessionState {
    if (s.phase !== 'playing') return s;
    if (s.play.length === 0) return s;
    for (const p of s.play) {
        if (!p.applied) s = applyHazardCard(s, p.uid, deckBag);
    }
    const def = getHazardDef(s.hazardId);
    const p = hazardProjectedProgress(s);
    // Carry is computed from the RAW (un-enchanted) total: enchants boost the
    // round their cards are played in, but never bank into the surplus that
    // carries forward — so they are not re-counted in later rounds' totals.
    const praw = hazardProjectedProgressRaw(s);
    const lastRound = s.round >= s.totalRounds;
    let info: HazardResolveInfo;
    if (s.route === 'risk') {
        const [nF, nE] = def.risk.thresholds[s.round - 1];
        const cleared = p.force >= nF && p.escape >= nE;
        info = {
            cleared,
            dual: true,
            round: s.round,
            force: p.force,
            escape: p.escape,
            needF: nF,
            needE: nE,
            carryForce: momentumCarry(praw.force, nF, cleared, lastRound, s.momentumCap),
            carryEscape: momentumCarry(praw.escape, nE, cleared, lastRound, s.momentumCap),
        };
    } else {
        const need = def.safe.thresholds[s.round - 1];
        const combined = p.force + p.escape;
        const cleared = combined >= need;
        // Safe route carry is combined; bank it on the force meter so
        // projected math stays a plain sum.
        info = {
            cleared,
            dual: false,
            round: s.round,
            force: p.force,
            escape: p.escape,
            combined,
            need,
            carryForce: momentumCarry(praw.force + praw.escape, need, cleared, lastRound, s.momentumCap),
            carryEscape: 0,
        };
    }
    // ANCHOR: the momentum floor guarantees a minimum TOTAL carry into
    // the next round — even off a failed round (it is insurance, not a
    // reward). Topped up on the FORCE side (where the safe route banks
    // its combined carry), capped by the session momentum cap.
    if (!lastRound && s.carryFloor > 0 && info.carryForce + info.carryEscape < s.carryFloor) {
        info = {
            ...info,
            carryForce: Math.min(s.momentumCap, s.carryFloor - info.carryEscape),
        };
    }
    const marks = s.marks.slice();
    marks[s.round - 1] = info.cleared ? 'O' : 'X';

    // Accrue sub-quest metrics for this resolved round (display + outcome).
    const roundsCleared = s.questMetrics.roundsCleared.slice();
    roundsCleared[s.round - 1] = info.cleared;
    const questMetrics: typeof s.questMetrics = {
        ...s.questMetrics,
        cardsCommitted: s.questMetrics.cardsCommitted + s.play.length,
        cardsPowered: s.questMetrics.cardsPowered + s.play.filter((e) => e.dieId !== null).length,
        handEmptied: s.questMetrics.handEmptied || s.hand.length === 0,
        momentumCarries:
            s.questMetrics.momentumCarries + (info.carryForce + info.carryEscape > 0 ? 1 : 0),
        roundsCleared,
        finalDiceAvailable: lastRound
            ? s.dice.filter((d) => d.kind !== 'hex' && d.state === 'available').length
            : s.questMetrics.finalDiceAvailable,
    };
    return { ...s, phase: 'resolve-flash', marks, resolveInfo: info, questMetrics };
}

// ---------------------------------------------------------------------------
// Outcome
// ---------------------------------------------------------------------------

export function hazardTierOf(marks: readonly HazardMark[]): HazardOutcomeTier {
    const wins = marks.filter((m) => m === 'O').length;
    if (wins === marks.length) return 'perfect';
    if (wins >= 1) return 'complete';
    return 'failure';
}

/**
 * Judges a single sub-quest against the rolling metrics. `final` is true once
 * the hazard is over (outcome/rewards) — only then can a "reach N by the end"
 * objective be declared failed; mid-hazard such an objective stays `active`
 * (still reachable). Invariant breaks (hand emptied, cap exceeded, a round
 * lost) flip to `failed` the moment they happen, so the board can grey them out.
 */
export function hazardSubquestStatus(
    id: string,
    metrics: HazardQuestMetrics,
    totalRounds: number,
    final: boolean,
): HazardSubquestStatus {
    const Q = HAZARD_TUNING.subquests;
    const cleared = metrics.roundsCleared;
    const reachable = (met: boolean): HazardSubquestStatus => (met ? 'done' : final ? 'failed' : 'active');
    switch (id) {
        case 'travel-light':
            if (metrics.cardsCommitted > Q.travelLightCap) return 'failed';
            return final ? 'done' : 'active';
        case 'dice-reserve':
            if (!final) return 'active';
            return metrics.finalDiceAvailable >= Q.diceReserveCount ? 'done' : 'failed';
        case 'steady-hand':
            if (metrics.handEmptied) return 'failed';
            return final ? 'done' : 'active';
        case 'flawless':
            if (cleared.some((c) => c === false)) return 'failed';
            return final ? 'done' : 'active';
        case 'surge-master':
            return reachable(metrics.cardsPowered >= Q.surgeMasterCount);
        case 'stormcaller':
            return reachable(metrics.recastConvertApplied >= Q.stormcallerCount);
        case 'scavenger':
            return reachable(metrics.cardsSalvaged >= Q.scavengerCount);
        case 'momentum':
            return reachable(metrics.momentumCarries >= 1);
        case 'fast-start':
            if (cleared[0] === true) return 'done';
            if (cleared[0] === false) return 'failed';
            return 'active';
        case 'finisher':
            if (cleared[totalRounds - 1] === true) return 'done';
            if (cleared[totalRounds - 1] === false) return 'failed';
            return final ? 'failed' : 'active';
        default:
            return 'active';
    }
}

/** Judges every rolled sub-quest for the rewards ledger. */
export function hazardSubquestResults(s: HazardSessionState, final: boolean): HazardSubquestResult[] {
    return s.subquests.map((q) => {
        const def = getHazardSubquestDef(q.id);
        return {
            id: q.id,
            name: def.name,
            desc: def.desc,
            status: hazardSubquestStatus(q.id, s.questMetrics, s.totalRounds, final),
            reward: def.reward,
        };
    });
}

function rollRewardCards(
    rng: HazardRngState,
    tier: HazardOutcomeTier,
    wins: number,
    deckBag: readonly string[] = [],
): { cards: HazardCardDef[]; rng: HazardRngState } {
    // Phase 149: Use three-choice reward doctrine instead of random draws
    const offer = generateRewardOffer([...deckBag], rng);
    
    // Convert the three-choice offer back to the expected card array format
    const cards: HazardCardDef[] = [
        offer.focusBenefit,
        offer.offFocusTemptation,
    ];
    
    // MAINTAIN BACKWARD COMPATIBILITY: Preserve original tier guarantees
    if (tier === 'perfect') {
        // Perfect tier MUST have a rare card as the first slot
        const rareOptions = HAZARD_REWARD_CARDS.filter(c => c.rarity === 'rare');
        if (rareOptions.length > 0) {
            const rareRoll = nextInt(rng, rareOptions.length);
            // Replace first slot with guaranteed rare
            cards[0] = rareOptions[rareRoll.value];
            rng = rareRoll.state;
        }
    } else if (wins === 1) {
        // Single win MUST NOT have rare cards (ensure all are common/uncommon)
        cards[0] = ensureNotRare(cards[0]);
        cards[1] = ensureNotRare(cards[1]);
    }
    
    // Add a third card to complete the offer
    if (cards.length < 3) {
        const remaining = HAZARD_REWARD_CARDS.filter(c => 
            !cards.some(existing => existing.id === c.id) &&
            (wins === 1 ? c.rarity !== 'rare' : true) // Respect single-win no-rare rule
        );
        if (remaining.length > 0) {
            const extraRoll = nextInt(rng, remaining.length);
            cards.push(remaining[extraRoll.value]);
            rng = extraRoll.state;
        }
    }
    
    return { cards: cards.slice(0, 3), rng };
}

/**
 * Ensure a card is not rare (for single-win compatibility).
 */
function ensureNotRare(card: HazardCardDef): HazardCardDef {
    if (card.rarity !== 'rare') return card;
    
    // Find a non-rare alternative 
    const alternatives = HAZARD_REWARD_CARDS.filter(c => c.rarity !== 'rare');
    return alternatives[0] ?? card; // Fallback to original if no alternatives
}

const CONSEQUENCES_BY_LOSS: Record<number, HazardConsequenceId[]> = {
    0: [],
    1: ['tokens'],
    2: ['maxhp', 'deadcard'],
    3: ['minhp', 'maxhp', 'deadcard', 'curse'],
};

function computeOutcome(s: HazardSessionState, deckBag: readonly string[] = []): { outcome: HazardOutcome; rng: HazardRngState } {
    const def = getHazardDef(s.hazardId);
    const wins = s.marks.filter((m) => m === 'O').length;
    const losses = s.marks.length - wins;
    const tier = hazardTierOf(s.marks);
    const routeKey = s.route ?? 'safe';
    let rewards: HazardRewardId[] = [];
    if (tier === 'perfect') {
        rewards = routeKey === 'risk' ? ['cache', 'relic', 'token'] : ['cache', 'vitae', 'token'];
    } else if (tier === 'complete') {
        rewards = routeKey === 'risk' ? (wins >= 2 ? ['cache', 'relic'] : ['cache']) : ['vitae'];
    }
    const consequences = CONSEQUENCES_BY_LOSS[Math.min(losses, 3)] ?? [];
    let offerCards: HazardCardDef[] = [];
    let rng = s.rng;
    if (tier !== 'failure') {
        const rolled = rollRewardCards(rng, tier, wins, deckBag);
        offerCards = rolled.cards;
        rng = rolled.rng;
    }
    const reserveBonus =
        tier === 'failure'
            ? 0
            : s.dice.filter((d) => d.kind !== 'hex' && d.state === 'available').length;
    const route = routeKey === 'risk' ? def.risk : def.safe;
    // Sub-quests: judged at the end; bonuses pay out only on a survived
    // crossing (a total failure forfeits them along with the spoils).
    const subquests = hazardSubquestResults(s, true);
    const survived = tier !== 'failure';
    let questShillings = 0;
    let questVitae = 0;
    let questTokens = 0;
    if (survived) {
        for (const q of subquests) {
            if (q.status !== 'done') continue;
            if (q.reward.kind === 'shillings') questShillings += q.reward.amount;
            else if (q.reward.kind === 'vitae') questVitae += q.reward.amount;
            else if (q.reward.kind === 'token') questTokens += q.reward.amount;
        }
    }
    const outcome: HazardOutcome = {
        tier,
        wins,
        losses,
        rewards,
        consequences,
        offerCards,
        canSkip: tier === 'perfect',
        reserveBonus,
        // WARD shaves the route penalty as a flat total, floored at 0.
        penaltyVitae: Math.max(0, route.penaltyVitae * losses - s.wardPenaltyReduction),
        vitaeCost: s.vitaeCost,
        // MEND and BOUNTY pay only on a survived crossing (a total
        // failure forfeits them, like the sub-quest bonuses); SACRIFICE
        // is charged regardless — the blood was already spent.
        vitaeRestore: survived ? s.vitaeRestore : 0,
        bountyShillings: survived ? s.bountyShillings : 0,
        subquests,
        questShillings,
        questVitae,
        questTokens,
    };
    return { outcome, rng };
}

/**
 * Dismisses the resolve flash. Final round → compute outcome and enter
 * `outcome`; otherwise advance the round: PLAYED cards discard, the
 * unplayed hand is KEPT, and the player draws back up to
 * HAZARD_HAND_SIZE (a draw-effect-inflated hand keeps everything and
 * draws nothing). Momentum applies — the dice pool is NOT re-cast.
 */
export function continueHazardAfterResolve(
    s: HazardSessionState,
    deckBag: readonly string[],
): HazardSessionState {
    if (s.phase !== 'resolve-flash' || !s.resolveInfo) return s;
    const info = s.resolveInfo;
    if (info.round >= s.totalRounds) {
        const { outcome, rng } = computeOutcome(s, deckBag);
        return { ...s, phase: 'outcome', outcome, resolveInfo: null, rng };
    }
    let drawPile = s.drawPile;
    // CRACK-as-punishment: a failed round shuffles FRACTURE into the middle
    // of the draw pile — it clogs the hand and only PURGE can remove it.
    if (!info.cleared) {
        const mid = Math.floor(drawPile.length / 2);
        drawPile = [...drawPile.slice(0, mid), HAZARD_CRACK_CARD.id, ...drawPile.slice(mid)];
    }
    // BUYBACK: powered buyback cards return to hand instead of going to discard.
    const buybackHand: HazardHandEntry[] = [];
    const discardFromPlay: string[] = [];
    for (const p of s.play) {
        const def = getHazardCardDef(p.cardId);
        if (def.buyback && p.dieId !== null) {
            buybackHand.push({ uid: `bk-${p.uid}`, cardId: p.cardId, dieId: null, applied: false });
        } else {
            discardFromPlay.push(p.cardId);
        }
    }
    const discardPile = [...s.discardPile, ...discardFromPlay];
    const drawCount = Math.max(0, HAZARD_HAND_SIZE - s.hand.length);
    const draw = drawFromPile(s.rng, s.uidCounter, drawPile, deckBag, drawCount);
    return {
        ...s,
        phase: 'playing',
        round: info.round + 1,
        play: [],
        hand: [...s.hand, ...buybackHand, ...draw.drawn],
        drawPile: draw.drawPile,
        discardPile,
        progressBase: { force: info.carryForce, escape: info.carryEscape },
        resolveInfo: null,
        rng: draw.rng,
        uidCounter: draw.uidCounter,
        // dice untouched — the one cast must last the hazard.
    };
}

/** Outcome modal acknowledged → rewards/consequences ledger. */
export function acknowledgeHazardOutcome(s: HazardSessionState): HazardSessionState {
    if (s.phase !== 'outcome') return s;
    return { ...s, phase: 'rewards' };
}

/**
 * Confirms the rewards modal. `cardId` is the picked reward card
 * (null = skip on perfect, or failure with no offer). Terminal phase;
 * the store applies the outcome to real game state and clears the
 * session.
 */
export function claimHazardRewards(s: HazardSessionState, cardId: string | null): HazardSessionState {
    if (s.phase !== 'rewards') return s;
    if (!s.outcome) return s;
    if (cardId !== null && !s.outcome.offerCards.find((c) => c.id === cardId)) return s;
    if (cardId === null && s.outcome.offerCards.length > 0 && !s.outcome.canSkip) return s;
    return { ...s, phase: 'done', pickedRewardCardId: cardId };
}

// ---------------------------------------------------------------------------
// FORETELL resolution
// ---------------------------------------------------------------------------

/**
 * Resolves a `foretell-pending` pause. The player has seen the revealed cards
 * and chosen their order. `orderedIds` are the card ids to put back on top of
 * the draw pile (in desired order). Any revealed card NOT in `orderedIds` goes
 * to the discard pile — this naturally handles:
 *  - Normal FORETELL (reorder only): pass all revealed cards back.
 *  - Powered FORETELL (discard 1): omit one id from `orderedIds`.
 *  - SCOUR mode: omit any number (or all) of the revealed cards.
 *
 * After reordering, if the foretell carried a `drawCount`, that many cards are
 * drawn into hand as a bonus (DARK KNOWLEDGE / WAYSTONE pattern).
 */
export function confirmHazardForetell(
    s: HazardSessionState,
    orderedIds: string[],
    deckBag: readonly string[],
): HazardSessionState {
    if (s.phase !== 'foretell-pending' || !s.foretellPending) return s;
    const { revealed, drawCount } = s.foretellPending;
    // Any revealed card not included in orderedIds is permanently discarded.
    const keptSet = new Set(orderedIds);
    const permanentDiscard = revealed.filter((id) => !keptSet.has(id));
    let ns: HazardSessionState = {
        ...s,
        phase: 'playing',
        foretellPending: null,
        drawPile: [...orderedIds, ...s.drawPile],
        discardPile: [...s.discardPile, ...permanentDiscard],
    };
    // DARK KNOWLEDGE / WAYSTONE draw reward.
    if (drawCount > 0) {
        const draw = drawFromPile(ns.rng, ns.uidCounter, ns.drawPile, deckBag, drawCount);
        ns = {
            ...ns,
            hand: [...ns.hand, ...draw.drawn],
            drawPile: draw.drawPile,
            rng: draw.rng,
            uidCounter: draw.uidCounter,
        };
    }
    return ns;
}

// ---------------------------------------------------------------------------
// Phase 149 — Engagement functions
// ---------------------------------------------------------------------------

/**
 * Select a sub-quest from the draft candidates.
 */
export function selectSubquestFromDraft(
    s: HazardSessionState,
    subquestId: string
): HazardSessionState {
    if (s.phase !== 'route-select') return s;
    
    const chosen = s.subquestDraft.candidates.find(sq => sq.id === subquestId);
    if (!chosen) return s;
    
    return {
        ...s,
        subquestDraft: {
            ...s.subquestDraft,
            chosen,
        }
    };
}

/**
 * Generate deck identity summary for the current persistent deck.
 */
export function getHazardDeckIdentity(deckCardIds: string[]): HazardDeckIdentity {
    return generateDeckIdentity(deckCardIds);
}

/**
 * Remove a card from the persistent deck (reward option).
 */
export function removeHazardDeckCard(
    deckCardIds: string[],
    cardIdToRemove: string
): string[] {
    return removeCardFromDeck(deckCardIds, cardIdToRemove);
}
