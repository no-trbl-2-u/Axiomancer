/**
 * BLOOD PRICE SANDBOX RUNTIME (branch sandbox/blood-price-sims only).
 *
 * Resolves cards that carry a `bloodPrice` spec (`Cards/blood-price.types.ts`):
 * SACRIFICE, HEAL, EXILE, the Global and Curse card types, Global triggers
 * (start of turn / SACRIFICE / Curse played) and VITAE conditions. Every
 * card line is one program run three ways:
 *
 *   'cost'  — the SACRIFICE probe: what the line would make the player pay.
 *             A line whose SACRIFICE would leave the player below 1 VITAE
 *             cannot be played (plan/revamp/cards.md).
 *   'value' — the witness bot's estimate of the line, so the greedy policy can
 *             rank it (combat.encounter.sim.ts).
 *   'apply' — the real resolution.
 *
 * The engine (`combat.engine.ts`) calls in here only when a card or state
 * carries Blood Price data, so a fight without these cards is untouched.
 *
 * Glossary as applied (sandbox ruling, not library law):
 *   DEAL n      body-scaled damage to the foe (VULNERABLE applies)
 *   GUARD n     mind-scaled block
 *   HEAL n      mind-scaled VITAE restore, capped at max VITAE
 *   VULNERABLE  the existing status, heart-scaled
 *   foe loses n unscaled VITAE loss on the foe (not a DEAL)
 *   SACRIFICE n lose n VITAE, unscaled; a cost
 *   EXILE       PAID only: the card leaves combat instead of going to discard
 *
 * THE CARD HOLD (D37) stands: nothing here is library content.
 */

import type {
    BloodPriceSpec, BpCtx, BpCursePlayMode, BpGlobalTrigger, BpLine, BpQuery, BpSacModifier,
} from '../Cards/blood-price.types';
import type { Card } from '../Cards/types';
import { getCardById } from '../Cards/cards.library';
import { lookupEffect, applyEffect } from '../Effects';
import type { Enemy } from '../Enemy/types';
import { applyDamage, heal as healCombatant, isDefeated } from './health';
import { fireDotTrigger, getDamageTakenMultiplier } from './effects';
import { scaleFor, scaleEffectIntensity } from './stat-scaling';
import { spendDice } from './combat.dice';
import { recordAttribution } from './combat.attribution';
import type {
    CombatEncounterState, CombatEvent, CombatHandEntry, CombatManaDie,
} from './combat.encounter.types';

/** The grey Curse's card id (plan/revamp/cards.md, "The first Curse"). */
export const BP_CURSE_ID = 'bp-curse';

/** A FREE Global stays in play this many turns (D69). */
export const BP_GLOBAL_FREE_TURNS = 3;

// ── State ───────────────────────────────────────────────────────────────────

export interface BpGlobalInPlay {
    cardId: string;
    paid: boolean;
    /** Turn starts left before a FREE Global leaves play; null = rest of combat. */
    turnsLeft: number | null;
}

export interface BpSacMods {
    nextFree: number;
    allFree: boolean;
    nextHalf: boolean;
    nextCounts: number;
    nextDouble: boolean;
    allCountTwice: boolean;
}

/** The Blood Price ledger a fight carries when its deck holds Blood Price cards. */
export interface BloodPriceCombatState {
    globals: BpGlobalInPlay[];
    exiled: string[];
    lostThisRound: number;
    lostLastRound: number;
    lostThisCombat: number;
    takenThisRound: number;
    takenLastRound: number;
    /** VITAE SACRIFICED this combat, as counted (n × times counted). */
    sacrificedVitae: number;
    /** SACRIFICES made this combat, as counted. */
    sacrificeCount: number;
    /** VITAE actually paid to SACRIFICE this combat. */
    sacrificePaid: number;
    lowestVitae: number;
    mods: BpSacMods;
    drains: { perHit: number; untilRound: number }[];
    overhealToGuard: boolean;
    carryGuard: number;
    deathWardRound: number | null;
    pendingHeal: number;
    cursesPlayed: number;
    cursesAdded: number;
    curseUid: number;
    /** TETHER is live through this round (inclusive); 0 = none. */
    tetherUntil?: number;
    tetherCardId?: string;
    /** LEECH n on the foe (drops by 1 each foe turn). */
    leech?: number;
    leechCardId?: string;
    /** VITAE the foe lost to LEECH this combat (sim telemetry). */
    leechDrained?: number;
}

const freshMods = (): BpSacMods => ({
    nextFree: 0, allFree: false, nextHalf: false, nextCounts: 1, nextDouble: false, allCountTwice: false,
});

export function initBloodPriceState(vitae: number): BloodPriceCombatState {
    return {
        globals: [], exiled: [],
        lostThisRound: 0, lostLastRound: 0, lostThisCombat: 0,
        takenThisRound: 0, takenLastRound: 0,
        sacrificedVitae: 0, sacrificeCount: 0, sacrificePaid: 0,
        lowestVitae: vitae,
        mods: freshMods(),
        drains: [], overhealToGuard: false, carryGuard: 0, deathWardRound: null, pendingHeal: 0,
        cursesPlayed: 0, cursesAdded: 0, curseUid: 0,
    };
}

function cloneBp(bp: BloodPriceCombatState): BloodPriceCombatState {
    return {
        ...bp,
        globals: bp.globals.map(g => ({ ...g })),
        exiled: bp.exiled.slice(),
        mods: { ...bp.mods },
        drains: bp.drains.map(d => ({ ...d })),
    };
}

// ── Lookups ─────────────────────────────────────────────────────────────────

export function bloodPriceSpec(cardId: string): BloodPriceSpec | undefined {
    return getCardById(cardId)?.bloodPrice;
}

export function isBloodPriceCard(cardId: string): boolean {
    return bloodPriceSpec(cardId) !== undefined;
}

export function isCurseCard(cardId: string): boolean {
    return bloodPriceSpec(cardId)?.curse === true;
}

/** True when a deck holds any Blood Price card (the fight then carries a ledger). */
export function deckHasBloodPrice(deck: readonly string[]): boolean {
    return deck.some(isBloodPriceCard);
}

// ── Tuning (sandbox deck tuning, step 5 of the sim brief) ────────────────────

export interface BpTuning {
    /** Factor on DEAL / GUARD / HEAL / VULNERABLE / foe-loses amounts. */
    effect: number;
    /** Factor on SACRIFICE costs. */
    sac: number;
}

let tuning: BpTuning = { effect: 1, sac: 1 };

/** Sets the tuning every Blood Price card (except the grey Curse) resolves with. */
export function setBloodPriceTuning(t: BpTuning): void {
    tuning = { ...t };
}

export function getBloodPriceTuning(): BpTuning {
    return { ...tuning };
}

/** A printed amount under a factor: rounded, minimum 1 (0 stays 0). */
export function tuneAmount(n: number, factor: number): number {
    if (n <= 0 || factor === 1) return n;
    return Math.max(1, Math.round(n * factor));
}

// ── Engine kit (passed in by the engine, so this module never imports it) ────

export interface BpKit {
    convictionCap: number;
    /** The telegraphed hit, netted against live GUARD (projectIncomingThreat). */
    incomingNet(state: CombatEncounterState): number;
}

// ── The line context ────────────────────────────────────────────────────────

type Mode = 'cost' | 'value' | 'apply';

/** The SACRIFICE mode a line runs in (a Curse played by another card). */
type SacMode = 'normal' | BpCursePlayMode;

interface Work {
    s: CombatEncounterState;
    bp: BloodPriceCombatState;
    events: CombatEvent[];
    kit: BpKit;
    /** Cost accumulated in 'cost' mode (and in 'value' mode, for the bot). */
    cost: number;
    value: number;
    /** VITAE the cost probe has already spent (so X lines see what is left). */
}

interface Frame {
    cardId: string;
    tuned: boolean;
    sacMode: SacMode;
}

const BEFRIEND_CONVICTION_VALUE = 1.5;
const PLAIN_CONVICTION_VALUE = 0.3;
const SAC_COST_VALUE = 0.6;
const CURSE_ADDED_VALUE = -4;
const CURSE_CLEARED_VALUE = 5;
const VULN_VALUE_PER_PCT_TURN = 0.08;
const TETHER_VALUE_PER_TURN = 3;
const LEECH_VALUE_PER_POINT = 1.6;

function expectedGlobalFires(trigger: BpGlobalTrigger, paid: boolean): number {
    const base = trigger === 'turn' ? BP_GLOBAL_FREE_TURNS : trigger === 'sac' ? 2 : 1.5;
    return paid ? base * 2 : base;
}

class LineCtx implements BpCtx {
    constructor(private w: Work, private mode: Mode, private f: Frame) {}

    // -- query -------------------------------------------------------------
    get q(): BpQuery {
        return buildQuery(this.w.s, this.w.bp, this.mode === 'cost' ? this.w.cost : 0);
    }

    private stats() { return this.w.s.player.baseStats; }
    private effT(n: number): number { return this.f.tuned ? tuneAmount(n, tuning.effect) : n; }
    private sacT(n: number): number { return this.f.tuned ? tuneAmount(n, tuning.sac) : n; }
    private incoming(): number { return this.w.kit.incomingNet(this.w.s); }

    // -- foe -----------------------------------------------------------------
    deal(n: number): number {
        const base = this.effT(n);
        if (base <= 0) return 0;
        const enemy = this.w.s.enemy;
        if (isDefeated(enemy)) return 0;
        let dmg = scaleFor(base, this.stats(), 'body', 'one-shot');
        const vuln = getDamageTakenMultiplier(enemy);
        if (vuln !== 1) dmg = Math.round(dmg * vuln);
        if (this.mode === 'cost') return dmg;
        if (this.mode === 'value') {
            const landed = Math.min(dmg, enemy.health);
            this.w.value += landed + (dmg >= enemy.health ? 20 : 0) + this.drainValue();
            return dmg;
        }
        this.hitFoe(dmg, true);
        return dmg;
    }

    /** The foe loses n VITAE: unscaled, not a DEAL (no VULNERABLE). */
    foeLoses(n: number): void {
        const amt = this.effT(n);
        if (amt <= 0 || isDefeated(this.w.s.enemy)) return;
        if (this.mode === 'value') {
            const enemy = this.w.s.enemy;
            this.w.value += Math.min(amt, enemy.health) + (amt >= enemy.health ? 20 : 0) + this.drainValue();
            return;
        }
        if (this.mode === 'apply') this.hitFoe(amt, false);
    }

    /** TETHER n: for n turns (this one included), each SACRIFICE instance
     *  makes the foe take DEAL x, x = the VITAE that instance paid (unscaled;
     *  VULNERABLE applies). A second TETHER extends the window, never doubles it. */
    tether(turns: number): void {
        if (turns <= 0) return;
        if (this.mode === 'value') {
            const left = Math.max(0, (this.w.bp.tetherUntil ?? 0) - this.w.s.round + 1);
            this.w.value += Math.max(0, turns - left) * TETHER_VALUE_PER_TURN;
            return;
        }
        if (this.mode !== 'apply') return;
        this.w.bp.tetherUntil = Math.max(this.w.bp.tetherUntil ?? 0, this.w.s.round + turns - 1);
        this.w.bp.tetherCardId = this.f.cardId;
    }

    /** LEECH n: heart-scaled (repeating) and added to the current LEECH. */
    leech(n: number): void {
        const amt = scaleFor(this.effT(n), this.stats(), 'heart', 'repeating');
        if (amt <= 0) return;
        if (this.mode === 'value') {
            const cur = this.w.bp.leech ?? 0;
            const total = (k: number): number => (k * (k + 1)) / 2;
            this.w.value += (total(cur + amt) - total(cur)) * LEECH_VALUE_PER_POINT;
            return;
        }
        if (this.mode !== 'apply') return;
        this.w.bp.leech = (this.w.bp.leech ?? 0) + amt;
        this.w.bp.leechCardId = this.f.cardId;
    }

    private drainValue(): number {
        const round = this.w.s.round;
        return this.w.bp.drains.filter(d => d.untilRound >= round).reduce((s, d) => s + d.perHit, 0) * 0.8;
    }

    /** Applies VITAE loss to the foe: `dealt` routes the damage-instance
     *  clock like any player hit; a plain loss does not. Then drains heal. */
    private hitFoe(amount: number, dealt: boolean): void {
        const w = this.w;
        const before = w.s.enemy.health;
        let enemy: Enemy = applyDamage(w.s.enemy, amount);
        let extra = 0;
        if (dealt) {
            const clock = fireDotTrigger(enemy, 'damage-instance', w.s.round);
            if (clock.damage > 0) { enemy = clock.target; extra = clock.damage; }
        }
        const cardName = getCardById(this.f.cardId)?.name ?? this.f.cardId;
        w.s = {
            ...w.s, enemy,
            directDamageDealt: w.s.directDamageDealt + amount + extra,
            attribution: recordAttribution(w.s.attribution, this.f.cardId, cardName, null, amount, before),
        };
        w.events.push({ kind: 'damage-dealt', cardId: this.f.cardId, target: 'enemy', amount });
        const round = w.s.round;
        for (const d of w.bp.drains) {
            if (d.untilRound >= round) this.healExact(d.perHit, false);
        }
    }

    vulnerable(pct: number, turns: number): void {
        const def = lookupEffect('debuff_vulnerable');
        const amt = this.effT(pct);
        if (!def || amt <= 0) return;
        const intensity = scaleEffectIntensity(def, amt, false, this.stats());
        const duration = turns;
        if (this.mode === 'value') {
            const fresh = !this.w.s.enemy.effects.some(e => e.effectId === def.id);
            this.w.value += intensity * duration * VULN_VALUE_PER_PCT_TURN + (fresh ? 2 : 0);
            return;
        }
        if (this.mode !== 'apply') return;
        const w = this.w;
        const applied = applyEffect(w.s.enemy.effects, def, w.s.round, {
            intensityDelta: intensity, uncapped: true,
            durationMode: 'additive', durationDelta: duration, sourceId: this.f.cardId,
        });
        w.s = { ...w.s, enemy: { ...w.s.enemy, effects: applied.activeEffects } };
        const active = applied.result.activeEffect;
        if (active) {
            w.events.push({
                kind: 'effect-landed', cardId: this.f.cardId, effectId: def.id, target: 'enemy',
                effectKind: 'control', intensity: active.intensity, effect: def,
            });
        }
    }

    // -- self ----------------------------------------------------------------
    guard(n: number, opts?: { exact?: boolean }): number {
        const amt = opts?.exact ? n : scaleFor(this.effT(n), this.stats(), 'mind', 'one-shot');
        if (amt <= 0) return 0;
        if (this.mode === 'value') {
            const need = Math.max(0, this.incoming());
            const useful = Math.min(amt, need);
            this.w.value += useful + 0.2 * (amt - useful);
        } else if (this.mode === 'apply') {
            this.w.s = { ...this.w.s, guard: (this.w.s.guard ?? 0) + amt };
        }
        return amt;
    }

    heal(n: number, opts?: { exact?: boolean; overflowToGuard?: boolean }): number {
        const amt = opts?.exact ? n : scaleFor(this.effT(n), this.stats(), 'mind', 'one-shot');
        if (amt <= 0) return 0;
        return this.healExact(amt, opts?.overflowToGuard === true);
    }

    private healExact(amt: number, overflowToGuard: boolean): number {
        const p = this.w.s.player;
        const healed = Math.min(amt, Math.max(0, p.maxHealth - p.health));
        const overflow = amt - healed;
        const toGuard = (overflowToGuard || this.w.bp.overhealToGuard) ? overflow : 0;
        if (this.mode === 'value') {
            this.w.value += healed * 0.9 + toGuard * 0.5;
            return healed;
        }
        if (this.mode === 'apply') {
            this.w.s = {
                ...this.w.s,
                player: healCombatant(p, healed),
                guard: (this.w.s.guard ?? 0) + toGuard,
            };
        }
        return healed;
    }

    conviction(n: number): void {
        if (n <= 0) return;
        if (this.mode === 'value') {
            const befriendable = this.w.s.enemy.friendshipReward !== undefined;
            const room = Math.max(0, this.w.kit.convictionCap - this.w.s.conviction);
            this.w.value += Math.min(n, room) * (befriendable ? BEFRIEND_CONVICTION_VALUE : PLAIN_CONVICTION_VALUE);
            return;
        }
        if (this.mode !== 'apply') return;
        const total = Math.min(this.w.kit.convictionCap, this.w.s.conviction + n);
        const gained = total - this.w.s.conviction;
        this.w.s = { ...this.w.s, conviction: total };
        if (gained > 0) this.w.events.push({ kind: 'conviction-gained', amount: gained, total, reason: 'effect' });
    }

    // -- SACRIFICE -----------------------------------------------------------
    sacrifice(n: number): void {
        this.sacrificeEvent(this.sacT(n), null);
    }

    sacrificeX(max: number | null, opts?: { countPer?: number; usefulMax?: number }): number {
        const x = this.chooseX(max, opts?.usefulMax);
        if (x <= 0) return 0;
        this.sacrificeEvent(x, opts?.countPer ?? null);
        return x;
    }

    /** The bot's X: as much as it may pay without the telegraphed hit becoming
     *  lethal, up to the printed max and what the line can use. A pure dial
     *  (no reward on the line itself) pays 1 unless a 🩸 Global is in play. */
    private chooseX(max: number | null, usefulMax: number | undefined): number {
        const vitae = this.w.s.player.health - (this.mode === 'cost' ? this.w.cost : 0);
        const affordable = vitae - 1;
        if (affordable < 1) return this.mode === 'cost' ? 1 : 0; // the probe reports it unaffordable
        if (this.mode === 'cost') return 1;
        const safe = vitae - Math.max(0, this.incoming()) - 1;
        let cap = Math.min(max ?? Infinity, usefulMax ?? Infinity, affordable);
        if (usefulMax === 0) {
            const sacGlobal = this.w.bp.globals.some(g => bloodPriceSpec(g.cardId)?.global?.trigger === 'sac');
            cap = sacGlobal ? Math.min(max ?? Infinity, affordable) : 1;
        }
        return Math.max(1, Math.min(cap, Math.max(1, safe)));
    }

    /** One SACRIFICE: the per-turn modifiers, the payment, the ledger, then
     *  each INSTANCE (A10) fires the 🩸 Globals and TETHER. `countPer` comes
     *  from an X line that counts once per N paid: each instance is then a
     *  SACRIFICE of N paying N. A WAIVED SACRIFICE pays 0 and still counts. */
    private sacrificeEvent(nominalIn: number, countPer: number | null): void {
        if (nominalIn <= 0) return;
        const mode = this.f.sacMode;
        let nominal = mode === 'half' ? Math.ceil(nominalIn / 2) : nominalIn;
        const m = this.w.bp.mods;
        if (m.nextDouble) { nominal *= 2; m.nextDouble = false; }
        let times = countPer ? Math.floor(nominal / countPer) : 1;
        if (m.nextCounts > 1) { times *= m.nextCounts; m.nextCounts = 1; }
        if (m.allCountTwice) times *= 2;
        let cost = nominal;
        if (mode === 'waived') cost = 0;
        else if (m.allFree) cost = 0;
        else if (m.nextFree > 0) { cost = 0; m.nextFree -= 1; }
        else if (m.nextHalf) { cost = Math.ceil(nominal / 2); m.nextHalf = false; }
        const perN = countPer ?? nominal;
        const perX = (paid: number): number => (countPer ? (paid > 0 ? countPer : 0) : paid);

        if (this.mode === 'cost') { this.w.cost += cost; return; }
        if (this.mode === 'value') {
            this.w.value -= cost * SAC_COST_VALUE;
            const tethered = (this.w.bp.tetherUntil ?? 0) >= this.w.s.round;
            for (let k = 0; k < times; k++) {
                this.fireTriggersValue('sac', perN);
                if (tethered) this.w.value += perX(cost) * getDamageTakenMultiplier(this.w.s.enemy);
            }
            return;
        }
        // apply
        const w = this.w;
        const p = w.s.player;
        const paid = Math.max(0, Math.min(cost, p.health - 1));
        if (paid > 0) {
            w.s = { ...w.s, player: { ...p, health: p.health - paid } };
            w.bp.lostThisRound += paid;
            w.bp.lostThisCombat += paid;
            w.bp.sacrificePaid += paid;
            w.bp.lowestVitae = Math.min(w.bp.lowestVitae, w.s.player.health);
        }
        w.bp.sacrificedVitae += perN * times;
        w.bp.sacrificeCount += times;
        for (let k = 0; k < times; k++) {
            fireTriggers(w, 'sac', perN);
            const x = perX(paid);
            if (x > 0 && (w.bp.tetherUntil ?? 0) >= w.s.round && !isDefeated(w.s.enemy)) {
                const dmg = Math.round(x * getDamageTakenMultiplier(w.s.enemy));
                new LineCtx(w, 'apply', { cardId: w.bp.tetherCardId ?? this.f.cardId, tuned: false, sacMode: 'normal' }).hitFoeAs(dmg);
            }
        }
    }

    /** A TETHER hit: DEAL already computed (unscaled, VULNERABLE applied). */
    hitFoeAs(dmg: number): void {
        if (dmg > 0) this.hitFoe(dmg, true);
    }

    private fireTriggersValue(trigger: BpGlobalTrigger, n: number): void {
        for (const g of this.w.bp.globals) {
            const spec = bloodPriceSpec(g.cardId)?.global;
            if (!spec || spec.trigger !== trigger) continue;
            const ctx = new LineCtx(this.w, 'value', { cardId: g.cardId, tuned: !bloodPriceSpec(g.cardId)?.untuned, sacMode: 'normal' });
            (g.paid ? spec.paid : spec.free)(ctx, n);
        }
    }

    // -- Curses ----------------------------------------------------------------
    addCurse(count: number): void {
        if (count <= 0) return;
        if (this.mode === 'value') {
            const curseGlobal = this.w.bp.globals.some(g => bloodPriceSpec(g.cardId)?.global?.trigger === 'curse');
            this.w.value += count * (curseGlobal ? -1 : CURSE_ADDED_VALUE);
            return;
        }
        if (this.mode !== 'apply') return;
        const w = this.w;
        const added: CombatHandEntry[] = [];
        for (let i = 0; i < count; i++) {
            w.bp.curseUid += 1;
            added.push({ uid: `bpc${w.bp.curseUid}`, cardId: BP_CURSE_ID });
        }
        w.bp.cursesAdded += count;
        w.s = { ...w.s, hand: [...w.s.hand, ...added] };
    }

    playCurseFromHand(line: 'free' | 'paid', mode: BpCursePlayMode, all = false): number {
        const curses = this.w.s.hand.filter(h => isCurseCard(h.cardId));
        const picked = all ? curses : curses.slice(0, 1);
        for (const entry of picked) {
            if (this.mode === 'apply') {
                this.w.s = { ...this.w.s, hand: this.w.s.hand.filter(h => h.uid !== entry.uid) };
            }
            this.resolveCurse(entry.cardId, line, mode);
        }
        return picked.length;
    }

    playCurseFromDiscard(line: 'free' | 'paid', mode: BpCursePlayMode): number {
        const idx = this.w.s.discard.findIndex(isCurseCard);
        if (idx < 0) return 0;
        const cardId = this.w.s.discard[idx];
        if (this.mode === 'apply') {
            const discard = this.w.s.discard.slice();
            discard.splice(idx, 1);
            this.w.s = { ...this.w.s, discard };
        }
        this.resolveCurse(cardId, line, mode);
        return 1;
    }

    /** A Curse played by another card: its own line under the given mode, then
     *  its lifecycle (FREE: discard, PAID: EXILE), then the 📜 Globals. */
    private resolveCurse(cardId: string, line: 'free' | 'paid', mode: BpCursePlayMode): void {
        const spec = bloodPriceSpec(cardId);
        const l = line === 'paid' ? spec?.paid : spec?.free;
        if (!l) return;
        const ctx = new LineCtx(this.w, this.mode, { cardId, tuned: false, sacMode: mode });
        l.run(ctx);
        if (this.mode === 'value') {
            this.w.value += CURSE_CLEARED_VALUE;
            this.fireTriggersValue('curse', 0);
            return;
        }
        if (this.mode !== 'apply') return;
        if (line === 'paid' && l.exile) this.w.bp.exiled.push(cardId);
        else this.w.s = { ...this.w.s, discard: [...this.w.s.discard, cardId] };
        this.w.bp.cursesPlayed += 1;
        fireTriggers(this.w, 'curse', 0);
    }

    returnCurseFromDiscard(all: boolean): number {
        const count = this.w.s.discard.filter(isCurseCard).length;
        const moved = all ? count : Math.min(1, count);
        if (moved === 0) return 0;
        if (this.mode === 'value') {
            const curseGlobal = this.w.bp.globals.some(g => bloodPriceSpec(g.cardId)?.global?.trigger === 'curse');
            this.w.value += moved * (curseGlobal ? 1 : -2);
            return moved;
        }
        if (this.mode !== 'apply') return moved;
        const discard = this.w.s.discard.slice();
        const back: CombatHandEntry[] = [];
        for (let k = 0; k < moved; k++) {
            const i = discard.findIndex(isCurseCard);
            const [cardId] = discard.splice(i, 1);
            this.w.bp.curseUid += 1;
            back.push({ uid: `bpc${this.w.bp.curseUid}`, cardId });
        }
        this.w.s = { ...this.w.s, discard, hand: [...this.w.s.hand, ...back] };
        return moved;
    }

    exileCurseFromHand(all: boolean): number {
        const curses = this.w.s.hand.filter(h => isCurseCard(h.cardId));
        const picked = all ? curses : curses.slice(0, 1);
        if (picked.length === 0) return 0;
        if (this.mode === 'value') { this.w.value += picked.length * CURSE_CLEARED_VALUE; return picked.length; }
        if (this.mode !== 'apply') return picked.length;
        const ids = new Set(picked.map(p => p.uid));
        this.w.s = { ...this.w.s, hand: this.w.s.hand.filter(h => !ids.has(h.uid)) };
        this.w.bp.exiled.push(...picked.map(p => p.cardId));
        return picked.length;
    }

    discardCurseFromHand(): number {
        const entry = this.w.s.hand.find(h => isCurseCard(h.cardId));
        if (!entry) return 0;
        if (this.mode === 'value') { this.w.value += CURSE_CLEARED_VALUE - 2; return 1; }
        if (this.mode !== 'apply') return 1;
        this.w.s = {
            ...this.w.s,
            hand: this.w.s.hand.filter(h => h.uid !== entry.uid),
            discard: [...this.w.s.discard, entry.cardId],
        };
        return 1;
    }

    // -- modifiers and lasting effects -------------------------------------------
    sacModifier(mod: BpSacModifier): void {
        if (this.mode === 'value') { this.w.value += modifierValue(this.w, mod); return; }
        if (this.mode !== 'apply') return;
        const m = this.w.bp.mods;
        switch (mod.kind) {
            case 'next-free': m.nextFree += mod.count; break;
            case 'all-free': m.allFree = true; break;
            case 'next-half': m.nextHalf = true; break;
            case 'next-counts': m.nextCounts = Math.max(m.nextCounts, mod.times); break;
            case 'next-double': m.nextDouble = true; break;
            case 'all-count-twice': m.allCountTwice = true; break;
        }
    }

    deathWard(): void {
        if (this.mode === 'value') {
            const lethal = this.incoming() >= this.w.s.player.health;
            this.w.value += lethal ? 40 : 0.5;
            return;
        }
        if (this.mode === 'apply') this.w.bp.deathWardRound = this.w.s.round;
    }

    healNextTurn(n: number): void {
        const amt = scaleFor(this.effT(n), this.stats(), 'mind', 'one-shot');
        if (this.mode === 'value') {
            const p = this.w.s.player;
            this.w.value += 0.8 * Math.min(amt, p.maxHealth - p.health + this.incoming());
            return;
        }
        if (this.mode === 'apply') this.w.bp.pendingHeal += amt;
    }

    drain(perHit: number, turns: number): void {
        const amt = scaleFor(this.effT(perHit), this.stats(), 'mind', 'one-shot');
        if (this.mode === 'value') { this.w.value += amt * 2 * turns * 0.8; return; }
        if (this.mode === 'apply') this.w.bp.drains.push({ perHit: amt, untilRound: this.w.s.round + turns - 1 });
    }

    overhealToGuard(): void {
        if (this.mode === 'value') { this.w.value += 2; return; }
        if (this.mode === 'apply') this.w.bp.overhealToGuard = true;
    }

    carryGuard(amount: number): void {
        if (amount <= 0) return;
        if (this.mode === 'value') { this.w.value += 0.5 * amount; return; }
        if (this.mode === 'apply') this.w.bp.carryGuard = Math.max(this.w.bp.carryGuard, amount);
    }
}

/** Bot value of a SACRIFICE modifier: what it saves on the other Blood Price
 *  lines in hand, or what an extra count is worth with a 🩸 Global out. */
function modifierValue(w: Work, mod: BpSacModifier): number {
    const costs: number[] = [];
    for (const h of w.s.hand) {
        const spec = bloodPriceSpec(h.cardId);
        if (!spec || spec.global) continue;
        for (const line of [spec.free, spec.paid]) {
            if (!line) continue;
            const c = probeLineCost(w.s, w.bp, h.cardId, line, w.kit);
            if (c > 0) costs.push(c);
        }
    }
    const sacGlobal = w.bp.globals.some(g => bloodPriceSpec(g.cardId)?.global?.trigger === 'sac');
    const biggest = costs.length ? Math.max(...costs) : 0;
    switch (mod.kind) {
        case 'next-free': return SAC_COST_VALUE * biggest * Math.min(mod.count, costs.length);
        case 'all-free': return SAC_COST_VALUE * costs.reduce((s, c) => s + c, 0) / 2;
        case 'next-half': return SAC_COST_VALUE * biggest / 2;
        case 'next-counts': return costs.length ? (mod.times - 1) * (sacGlobal ? 4 : 1) : 0;
        case 'next-double': return costs.length ? (sacGlobal ? 4 : -SAC_COST_VALUE * biggest) : 0;
        case 'all-count-twice': return costs.length ? (sacGlobal ? 4 * costs.length : 1) : 0;
    }
}

function buildQuery(s: CombatEncounterState, bp: BloodPriceCombatState, spent: number): BpQuery {
    const vitae = s.player.health - spent;
    const maxVitae = s.player.maxHealth;
    return {
        vitae, maxVitae,
        missing: Math.max(0, maxVitae - vitae),
        atHalf: vitae <= maxVitae / 2,
        atThird: vitae <= maxVitae / 3,
        lostLastTurn: bp.lostLastRound,
        takenLastTurn: bp.takenLastRound,
        lostThisCombat: bp.lostThisCombat,
        sacrificedThisCombat: bp.sacrificedVitae,
        sacrificesThisCombat: bp.sacrificeCount,
        cursesInHand: s.hand.filter(h => isCurseCard(h.cardId)).length,
        cursesInDiscard: s.discard.filter(isCurseCard).length,
        handSize: s.hand.length,
    };
}

/** Fires every Global in play on `trigger` (apply mode). A turn-start
 *  trigger whose SACRIFICE cannot be paid does not resolve. */
function fireTriggers(w: Work, trigger: BpGlobalTrigger, n: number): void {
    for (const g of w.bp.globals.slice()) {
        const spec = bloodPriceSpec(g.cardId);
        const glob = spec?.global;
        if (!glob || glob.trigger !== trigger) continue;
        if (isDefeated(w.s.enemy)) return;
        const body = g.paid ? glob.paid : glob.free;
        const frame: Frame = { cardId: g.cardId, tuned: !spec?.untuned, sacMode: 'normal' };
        const probe: Work = { ...w, bp: cloneBp(w.bp), cost: 0, value: 0, events: [] };
        body(new LineCtx(probe, 'cost', frame), n);
        if (probe.cost > 0 && w.s.player.health - probe.cost < 1) continue;
        body(new LineCtx(w, 'apply', frame), n);
    }
}

// ── Legality, cost and value (shared by the engine and the witness bot) ──────

function lineFor(spec: BloodPriceSpec, paid: boolean): BpLine | undefined {
    return paid ? spec.paid : spec.free;
}

function probeLineCost(
    s: CombatEncounterState, bp: BloodPriceCombatState, cardId: string, line: BpLine, kit: BpKit,
): number {
    const w: Work = { s, bp: cloneBp(bp), events: [], kit, cost: 0, value: 0 };
    line.run(new LineCtx(w, 'cost', { cardId, tuned: !bloodPriceSpec(cardId)?.untuned, sacMode: 'normal' }));
    return w.cost;
}

/** The state with the played card out of hand (lines never see themselves). */
function withoutEntry(state: CombatEncounterState, uid: string): CombatEncounterState {
    return { ...state, hand: state.hand.filter(h => h.uid !== uid) };
}

/**
 * Why a line cannot be played right now (null = it can). Covers the Global
 * uniqueness rule, printed conditions, Curse targets, and the SACRIFICE floor
 * (a line whose SACRIFICE would leave less than 1 VITAE cannot be played).
 * The die and the Color Law are checked by the play itself.
 */
export function bloodPriceIllegalReason(
    state: CombatEncounterState, uid: string, paid: boolean, kit: BpKit,
): string | null {
    const entry = state.hand.find(h => h.uid === uid);
    if (!entry) return 'not in hand';
    const spec = bloodPriceSpec(entry.cardId);
    if (!spec || !state.bp) return 'not a Blood Price card';
    const s = withoutEntry(state, uid);
    if (spec.global) {
        if (state.bp.globals.some(g => g.cardId === entry.cardId)) return 'that Global is already in play';
        return null;
    }
    const line = lineFor(spec, paid);
    if (!line) return 'no such line';
    const q = buildQuery(s, state.bp, 0);
    if (line.requires && !line.requires(q)) return 'its condition is not met';
    const cost = probeLineCost(s, state.bp, entry.cardId, line, kit);
    if (cost > 0 && s.player.health - cost < 1) return 'that SACRIFICE would leave you below 1 VITAE';
    return null;
}

/** The SACRIFICE a line would cost right now (0 for a Global). */
export function bloodPriceLineCost(
    state: CombatEncounterState, uid: string, paid: boolean, kit: BpKit,
): number {
    const entry = state.hand.find(h => h.uid === uid);
    const spec = entry ? bloodPriceSpec(entry.cardId) : undefined;
    if (!entry || !spec || !state.bp || spec.global) return 0;
    const line = lineFor(spec, paid);
    return line ? probeLineCost(withoutEntry(state, uid), state.bp, entry.cardId, line, kit) : 0;
}

/** The witness bot's estimate of a line (higher is better). */
export function bloodPriceLineValue(
    state: CombatEncounterState, uid: string, paid: boolean, kit: BpKit,
): number {
    const entry = state.hand.find(h => h.uid === uid);
    const spec = entry ? bloodPriceSpec(entry.cardId) : undefined;
    if (!entry || !spec || !state.bp) return 0;
    const s = withoutEntry(state, uid);
    const w: Work = { s, bp: cloneBp(state.bp), events: [], kit, cost: 0, value: 0 };
    const frame: Frame = { cardId: entry.cardId, tuned: !spec.untuned, sacMode: 'normal' };
    if (spec.global) {
        const body = paid ? spec.global.paid : spec.global.free;
        const n = spec.global.trigger === 'sac' ? 4 : 0;
        body(new LineCtx(w, 'value', frame), n);
        return w.value * expectedGlobalFires(spec.global.trigger, paid);
    }
    const line = lineFor(spec, paid);
    if (!line) return 0;
    line.run(new LineCtx(w, 'value', frame));
    return w.value;
}

// ── Play ────────────────────────────────────────────────────────────────────

export interface BpPlayResult {
    state: CombatEncounterState;
    events: CombatEvent[];
}

/**
 * Plays a Blood Price card's FREE or PAID line. Illegal plays fizzle with the
 * reason and change nothing. A PAID play spends its die under the Color Law
 * and emits `card-played` with the die, so the engine's BOON and momentum
 * bookkeeping run as for any PAID play.
 */
export function playBloodPriceCard(
    state: CombatEncounterState, uid: string, useBottom: boolean, dieId: string | undefined, kit: BpKit,
): BpPlayResult {
    const entry = state.hand.find(h => h.uid === uid);
    if (!entry || !state.bp) return { state, events: [] };
    const card = getCardById(entry.cardId) as Card;
    const spec = card.bloodPrice as BloodPriceSpec;
    const fizzle = (message: string): BpPlayResult => ({
        state, events: [{ kind: 'effect-fizzled', cardId: card.id, effectId: '', message }],
    });

    const reason = bloodPriceIllegalReason(state, uid, useBottom, kit);
    if (reason) return fizzle(reason);

    let s = state;
    let usedDie: CombatManaDie | null = null;
    if (useBottom) {
        if (dieId === undefined) return fizzle('choose a die to power this card');
        const banked = (s.reserve ?? []).find(d => d.id === dieId);
        const floating = s.dice.find(d => d.id === dieId && d.floating && d.state === 'available');
        const tray = s.dice.find(d => d.id === dieId && !d.floating && d.state === 'available' && d.face !== 'miss');
        const die = banked ?? floating ?? tray;
        if (!die) return fizzle('that die cannot power this card');
        if (!(card.color === 'any' || die.color === 'wild' || die.color === card.color)) {
            return fizzle(`a ${die.color} die cannot power a ${card.color} card — colors must match`);
        }
        usedDie = die;
        if (banked) s = { ...s, reserve: (s.reserve ?? []).filter(d => d.id !== die.id) };
        else if (floating) {
            s = {
                ...s,
                dice: s.dice.filter(d => d.id !== die.id),
                floatingDice: (s.floatingDice ?? []).filter(d => d.id !== die.id),
            };
        } else s = { ...s, dice: spendDice(s.dice, [die.id]) };
    }

    const events: CombatEvent[] = [
        { kind: 'card-played', cardId: card.id, useBottom, dieId: usedDie?.id ?? null },
    ];
    if (usedDie) events.push({ kind: 'die-spent', dieId: usedDie.id, color: usedDie.color });

    const w: Work = {
        s: withoutEntry(s, uid), bp: cloneBp(state.bp), events, kit, cost: 0, value: 0,
    };
    const frame: Frame = { cardId: card.id, tuned: !spec.untuned, sacMode: 'normal' };

    if (spec.global) {
        w.bp.globals.push({ cardId: card.id, paid: useBottom, turnsLeft: useBottom ? null : BP_GLOBAL_FREE_TURNS });
    } else {
        const line = lineFor(spec, useBottom) as BpLine;
        line.run(new LineCtx(w, 'apply', frame));
        if (useBottom && line.exile) w.bp.exiled.push(card.id);
        else w.s = { ...w.s, discard: [...w.s.discard, card.id] };
        if (spec.curse) {
            w.bp.cursesPlayed += 1;
            fireTriggers(w, 'curse', 0);
        }
    }
    if (useBottom) w.s = { ...w.s, spellsPlayedThisTurn: (w.s.spellsPlayedThisTurn ?? 0) + 1 };
    return { state: { ...w.s, bp: w.bp }, events: w.events };
}

/**
 * Start of the player's turn: the per-turn SACRIFICE modifiers reset, a
 * pending HEAL lands, ⟳ Globals fire, then each FREE Global counts down and
 * leaves play (to discard) after its third turn start.
 */
export function bloodPriceTurnStart(state: CombatEncounterState, kit: BpKit): BpPlayResult {
    if (!state.bp) return { state, events: [] };
    const w: Work = { s: state, bp: cloneBp(state.bp), events: [], kit, cost: 0, value: 0 };
    w.bp.mods = freshMods();
    w.bp.drains = w.bp.drains.filter(d => d.untilRound >= state.round);
    if (w.bp.pendingHeal > 0) {
        const p = w.s.player;
        w.s = { ...w.s, player: healCombatant(p, w.bp.pendingHeal) };
        w.bp.pendingHeal = 0;
    }
    fireTriggers(w, 'turn', 0);
    const stay: BpGlobalInPlay[] = [];
    const leaving: string[] = [];
    for (const g of w.bp.globals) {
        if (g.turnsLeft === null) { stay.push(g); continue; }
        const left = g.turnsLeft - 1;
        if (left > 0) stay.push({ ...g, turnsLeft: left });
        else leaving.push(g.cardId);
    }
    w.bp.globals = stay;
    if (leaving.length) w.s = { ...w.s, discard: [...w.s.discard, ...leaving] };
    return { state: { ...w.s, bp: w.bp }, events: w.events };
}

/**
 * Start of the foe's turn (before its telegraphed action): LEECH n makes the
 * foe lose n VITAE (not a DEAL: unscaled, no VULNERABLE), the player HEALs the
 * VITAE actually lost (unscaled, capped at max), then LEECH drops by 1.
 */
export function bloodPriceFoeTurnStart(state: CombatEncounterState): BpPlayResult {
    const bp = state.bp;
    const n = bp?.leech ?? 0;
    if (!bp || n <= 0 || isDefeated(state.enemy)) return { state, events: [] };
    const lost = Math.min(n, state.enemy.health);
    const cardId = bp.leechCardId ?? 'leech';
    const cardName = getCardById(cardId)?.name ?? cardId;
    const before = state.enemy.health;
    const enemy = applyDamage(state.enemy, lost);
    const p = state.player;
    const healed = Math.min(lost, Math.max(0, p.maxHealth - p.health));
    const overflow = bp.overhealToGuard ? lost - healed : 0;
    return {
        state: {
            ...state, enemy,
            player: healCombatant(p, healed),
            guard: (state.guard ?? 0) + overflow,
            directDamageDealt: state.directDamageDealt + lost,
            attribution: recordAttribution(state.attribution, cardId, cardName, null, lost, before),
            bp: { ...bp, leech: n - 1, leechDrained: (bp.leechDrained ?? 0) + lost },
        },
        events: [{ kind: 'damage-dealt', cardId, target: 'enemy', amount: lost }],
    };
}

/** Damage the player takes from the foe or a DoT: the death ward clamps it,
 *  and the loss ledgers record it. Returns the clamped damage. */
export function bloodPriceClampDamage(state: CombatEncounterState, health: number, dmg: number): number {
    const bp = state.bp;
    if (!bp || dmg <= 0) return dmg;
    if (bp.deathWardRound === state.round) return Math.max(0, Math.min(dmg, health - 1));
    return dmg;
}

/** Folds VITAE the player lost to damage this phase into the ledger. */
export function bloodPriceRecordDamage(
    bp: BloodPriceCombatState, taken: number, vitaeAfter: number,
): BloodPriceCombatState {
    if (taken <= 0) return { ...bp, lowestVitae: Math.min(bp.lowestVitae, vitaeAfter) };
    return {
        ...bp,
        lostThisRound: bp.lostThisRound + taken,
        lostThisCombat: bp.lostThisCombat + taken,
        takenThisRound: bp.takenThisRound + taken,
        lowestVitae: Math.min(bp.lowestVitae, vitaeAfter),
    };
}

/** The round boundary: this round's losses become last round's. */
export function bloodPriceRollRound(bp: BloodPriceCombatState): BloodPriceCombatState {
    return {
        ...bp,
        lostLastRound: bp.lostThisRound, lostThisRound: 0,
        takenLastRound: bp.takenThisRound, takenThisRound: 0,
    };
}

/** GUARD after the threat resolves: 0, unless a lasting GUARD carries over. */
export function bloodPriceGuardAfterThreat(state: CombatEncounterState, guardLeft: number): number {
    const carry = state.bp?.carryGuard ?? 0;
    return carry > 0 ? Math.min(guardLeft, carry) : 0;
}

/** Curses still in hand (the sim's stuck-Curse count). */
export function cursesInHand(state: CombatEncounterState): number {
    return state.hand.filter(h => isCurseCard(h.cardId)).length;
}

/** Is a die able to power this Blood Price card under the Color Law? */
export function bloodPriceDieFits(cardId: string, die: { color: string }): boolean {
    const card = getCardById(cardId);
    if (!card) return false;
    return card.color === 'any' || die.color === 'wild' || die.color === card.color;
}
