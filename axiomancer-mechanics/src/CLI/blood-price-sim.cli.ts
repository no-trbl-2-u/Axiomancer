/**
 * BLOOD PRICE SANDBOX SIM (branch sandbox/blood-price-sims only).
 *
 * Builds N seeded 30-card decks from the rehearsal ballot (one proposal per
 * slot P-01..M-10, colour spread minimised), runs every deck against every
 * Act 1 enemy at player levels 1/3/5 with the greedy witness, then tunes
 * each out-of-band cell's card numbers (never the enemies) for up to 6
 * passes. Raw results land as JSON under sandbox-results/blood-price/.
 *
 * Usage:
 *   npx ts-node --transpile-only src/CLI/blood-price-sim.cli.ts
 *     [--decks=20] [--runs=200] [--seed=1] [--passes=6] [--out=sandbox-results/blood-price]
 *
 * THE CARD HOLD (D37) stands: the cards are sandbox-registered for the run.
 */

import * as fs from 'fs';
import * as path from 'path';
import { Player } from '../Character/characters.mock';
import type { Character } from '../Character/types';
import { calculateMaxHealth, deepClone } from '../Utils';
import { stageStats } from '../Game/act1-progression';
import { EnemyLibrary } from '../Enemy/enemy.library';
import type { Enemy } from '../Enemy/types';
import { getCardById } from '../Cards/cards.library';
import {
    BLOOD_PRICE_SLOTS, proposalsForSlot, registerBloodPriceCards,
} from '../Cards/sandbox/blood-price.cards';
import { cursesInHand, setBloodPriceTuning, tuneAmount } from '../Combat/combat.blood-price';
import { simulateHazardPatternCombatDetailed } from '../Combat/combat.encounter.sim';
import type { CombatEncounterState } from '../Combat/combat.encounter.types';

type Colour = 'body' | 'mind' | 'heart';
const COLOURS: Colour[] = ['body', 'mind', 'heart'];
export const LEVELS = [1, 3, 5] as const;

// ── Seeded RNG (mulberry32) ──────────────────────────────────────────────────

export function mulberry32(seed: number): () => number {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// ── Decks ────────────────────────────────────────────────────────────────────

export interface Deck {
    id: string;
    picks: string[];
    split: Record<Colour, number>;
}

function colourOf(cardId: string): Colour {
    return getCardById(cardId)!.color as Colour;
}

/** Lexicographic deck score: shortfall below 5 per colour, then spread, then
 *  squared distance from 10/10/10. Lower is better. */
function splitScore(split: Record<Colour, number>): [number, number, number] {
    const v = COLOURS.map(c => split[c]);
    const shortfall = v.reduce((s, n) => s + Math.max(0, 5 - n), 0);
    const spread = Math.max(...v) - Math.min(...v);
    const sq = v.reduce((s, n) => s + (n - 10) ** 2, 0);
    return [shortfall, spread, sq];
}

function cmpScore(a: [number, number, number], b: [number, number, number]): number {
    return a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
}

/**
 * Every colour split the ballot can reach (one proposal per slot), best
 * first. A DP over slots: reachable[i] holds the (body, mind) counts after
 * slot i (heart is the rest).
 */
function reachableSplits(slots: string[][]): Record<Colour, number>[] {
    let reach = new Set<string>(['0,0,0']);
    for (const options of slots) {
        const next = new Set<string>();
        for (const key of reach) {
            const [b, m, h] = key.split(',').map(Number);
            for (const id of options) {
                const c = colourOf(id);
                next.add([b + (c === 'body' ? 1 : 0), m + (c === 'mind' ? 1 : 0), h + (c === 'heart' ? 1 : 0)].join(','));
            }
        }
        reach = next;
    }
    return [...reach]
        .map(k => { const [body, mind, heart] = k.split(',').map(Number); return { body, mind, heart }; })
        .sort((a, b) => cmpScore(splitScore(a), splitScore(b)));
}

/** Samples a deck hitting exactly `target`, seeded, uniform per slot among
 *  options that keep the target reachable. */
function sampleDeck(slots: string[][], target: Record<Colour, number>, rng: () => number): string[] | null {
    // feasible[i] = set of remaining (body,mind,heart) achievable from slot i on.
    const n = slots.length;
    const feasible: Set<string>[] = new Array(n + 1);
    feasible[n] = new Set(['0,0,0']);
    for (let i = n - 1; i >= 0; i--) {
        const set = new Set<string>();
        for (const key of feasible[i + 1]) {
            const [b, m, h] = key.split(',').map(Number);
            for (const id of slots[i]) {
                const c = colourOf(id);
                set.add([b + (c === 'body' ? 1 : 0), m + (c === 'mind' ? 1 : 0), h + (c === 'heart' ? 1 : 0)].join(','));
            }
        }
        feasible[i] = set;
    }
    let rem = { ...target };
    if (!feasible[0].has([rem.body, rem.mind, rem.heart].join(','))) return null;
    const picks: string[] = [];
    for (let i = 0; i < n; i++) {
        const ok = slots[i].filter(id => {
            const c = colourOf(id);
            const r = { ...rem, [c]: rem[c] - 1 };
            return r[c] >= 0 && feasible[i + 1].has([r.body, r.mind, r.heart].join(','));
        });
        const id = ok[Math.floor(rng() * ok.length)];
        picks.push(id);
        const c = colourOf(id);
        rem = { ...rem, [c]: rem[c] - 1 };
    }
    return picks;
}

export function buildDecks(count: number, seed: number): { decks: Deck[]; best: Record<Colour, number>[] } {
    const slots = BLOOD_PRICE_SLOTS.map(proposalsForSlot);
    const splits = reachableSplits(slots);
    const rng = mulberry32(seed);
    const decks: Deck[] = [];
    const seen = new Set<string>();
    for (const target of splits) {
        let tries = 0;
        while (decks.length < count && tries < 5000) {
            tries++;
            const picks = sampleDeck(slots, target, rng);
            if (!picks) break;
            const key = picks.join('|');
            if (seen.has(key)) continue;
            seen.add(key);
            decks.push({ id: `D${String(decks.length + 1).padStart(2, '0')}`, picks, split: { ...target } });
        }
        if (decks.length >= count) break;
    }
    return { decks, best: splits.slice(0, 5) };
}

// ── Player ───────────────────────────────────────────────────────────────────

/** The standard sim Player at `level`: stats spent evenly (stageStats 'even'),
 *  VITAE recomputed, worn relic bonus kept. */
export function playerAt(level: number, deck: string[]): Character {
    const p = deepClone(Player);
    const relicBonus = Player.maxHealth - calculateMaxHealth(Player.level, Player.baseStats);
    p.level = level;
    p.baseStats = stageStats(level, 'even');
    p.maxHealth = calculateMaxHealth(level, p.baseStats) + relicBonus;
    p.health = p.maxHealth;
    p.knownCards = deck.slice();
    return p;
}

// ── Cells ────────────────────────────────────────────────────────────────────

export interface CellResult {
    deck: string;
    enemy: string;
    level: number;
    k: number;
    effectFactor: number;
    sacFactor: number;
    runs: number;
    winRate: number;
    meanRounds: number;
    meanVitaeLeft: number;
    meanLowestVitae: number;
    minLowestVitae: number;
    meanSacrificePaid: number;
    meanCursesStuck: number;
    meanCursesAdded: number;
    playsPerFight: Record<string, number>;
    fizzlesPerFight: number;
}

export function factorsFor(k: number): { effect: number; sac: number } {
    if (k === 0) return { effect: 1, sac: 1 };
    return k > 0
        ? { effect: 0.9 ** k, sac: 1.1 ** k }
        : { effect: 1.1 ** -k, sac: 0.9 ** -k };
}

export function runCell(deck: Deck, enemy: Enemy, level: number, k: number, runs: number, seed: number): CellResult {
    const f = factorsFor(k);
    setBloodPriceTuning(f);
    let vitaeLeft = 0, lowest = 0, minLowest = Infinity, sacPaid = 0, stuck = 0, added = 0;
    const onRunEnd = (s: CombatEncounterState): void => {
        vitaeLeft += s.player.health;
        const low = Math.min(s.bp?.lowestVitae ?? s.player.health, s.player.health);
        lowest += low;
        minLowest = Math.min(minLowest, low);
        sacPaid += s.bp?.sacrificePaid ?? 0;
        stuck += cursesInHand(s);
        added += s.bp?.cursesAdded ?? 0;
    };
    const { stats, cardUsage } = simulateHazardPatternCombatDetailed({
        player: playerAt(level, deck.picks), enemy, runs, startSeed: seed, policy: 'greedy',
        deck: deck.picks, onRunEnd,
    });
    setBloodPriceTuning({ effect: 1, sac: 1 });
    const playsPerFight: Record<string, number> = {};
    let fizzles = 0;
    for (const id of deck.picks) playsPerFight[id] = (cardUsage[id]?.plays ?? 0) / runs;
    playsPerFight['bp-curse'] = (cardUsage['bp-curse']?.plays ?? 0) / runs;
    for (const u of Object.values(cardUsage)) fizzles += u.fizzles ?? 0;
    return {
        deck: deck.id, enemy: enemy.name, level, k, effectFactor: f.effect, sacFactor: f.sac, runs,
        winRate: stats.winRate, meanRounds: stats.avgRounds,
        meanVitaeLeft: vitaeLeft / runs, meanLowestVitae: lowest / runs,
        minLowestVitae: minLowest === Infinity ? 0 : minLowest,
        meanSacrificePaid: sacPaid / runs, meanCursesStuck: stuck / runs, meanCursesAdded: added / runs,
        playsPerFight, fizzlesPerFight: fizzles / runs,
    };
}

/** A card's printed numbers under a tuning step (for the per-pass record). */
export function tunedNumbers(text: string, k: number): string {
    const f = factorsFor(k);
    // SACRIFICE n scales by the cost factor, every other number by the effect
    // factor; durations ("for N turns"), thresholds and caps-in-words are
    // printed as is (the engine tunes the resolved amount).
    return text.replace(/(SACRIFICE )?(\d+)(%?)( turns?| VITAE missing| paid| per)?/g, (m, sac, num, pct, tail) => {
        if (tail && /turns?|VITAE missing|paid|per/.test(tail)) return m;
        const n = Number(num);
        const t = sac ? tuneAmount(n, f.sac) : tuneAmount(n, f.effect);
        return `${sac ?? ''}${t}${pct}${tail ?? ''}`;
    });
}

// ── Main ─────────────────────────────────────────────────────────────────────

if (require.main === module) {
    const flag = (k: string, d: string): string => {
        const a = process.argv.find(x => x.startsWith(`--${k}=`));
        return a ? a.slice(k.length + 3) : d;
    };
    const nDecks = Number(flag('decks', '20'));
    const runs = Number(flag('runs', '200'));
    const seed = Number(flag('seed', '1'));
    const maxPasses = Number(flag('passes', '6'));
    const outDir = flag('out', 'sandbox-results/blood-price');
    fs.mkdirSync(outDir, { recursive: true });

    registerBloodPriceCards();
    const { decks, best } = buildDecks(nDecks, seed);
    fs.writeFileSync(path.join(outDir, 'decks.json'), JSON.stringify({ seed, bestSplits: best, decks }, null, 1));
    process.stdout.write(`decks: ${decks.length}; best reachable splits: ${best.map(b => `${b.body}/${b.mind}/${b.heart}`).join(', ')}\n`);

    const enemies = [...EnemyLibrary];
    const key = (d: string, e: string, l: number): string => `${d}|${e}|${l}`;
    const kOf = new Map<string, number>();
    const latest = new Map<string, CellResult>();
    const passes: CellResult[][] = [];

    let todo: { deck: Deck; enemy: Enemy; level: number }[] = [];
    for (const deck of decks) for (const enemy of enemies) for (const level of LEVELS) todo.push({ deck, enemy, level });

    for (let pass = 0; pass <= maxPasses && todo.length > 0; pass++) {
        const t0 = Date.now();
        const results: CellResult[] = [];
        for (const c of todo) {
            const id = key(c.deck.id, c.enemy.name, c.level);
            const r = runCell(c.deck, c.enemy, c.level, kOf.get(id) ?? 0, runs, seed);
            results.push(r);
            latest.set(id, r);
        }
        passes.push(results);
        fs.writeFileSync(path.join(outDir, `pass-${pass}.json`), JSON.stringify(results, null, 1));
        const out = results.filter(r => r.winRate >= 0.9 || r.winRate <= 0.1);
        process.stdout.write(`pass ${pass}: ${results.length} cells in ${((Date.now() - t0) / 1000).toFixed(1)}s, out of band ${out.length}\n`);
        if (pass === maxPasses) break;
        todo = [];
        for (const r of out) {
            const id = key(r.deck, r.enemy, r.level);
            kOf.set(id, (kOf.get(id) ?? 0) + (r.winRate >= 0.9 ? 1 : -1));
            const deck = decks.find(d => d.id === r.deck)!;
            const enemy = enemies.find(e => e.name === r.enemy)!;
            todo.push({ deck, enemy, level: r.level });
        }
    }
    fs.writeFileSync(path.join(outDir, 'final.json'), JSON.stringify([...latest.values()], null, 1));

    // Every distinct tuning step used, with each proposal's tuned text.
    const steps = [...new Set([...latest.values()].map(r => r.k))].sort((a, b) => a - b);
    const numbers: Record<string, Record<string, { free?: string; paid?: string }>> = {};
    for (const k of steps) {
        numbers[String(k)] = {};
        for (const slot of BLOOD_PRICE_SLOTS) {
            for (const id of proposalsForSlot(slot)) {
                const spec = getCardById(id)!.bloodPrice!;
                numbers[String(k)][id] = spec.global
                    ? { free: tunedNumbers(spec.global.text, k), paid: spec.global.paidDelta ? tunedNumbers(spec.global.paidDelta, k) : undefined }
                    : { free: tunedNumbers(spec.free!.text, k), paid: tunedNumbers(spec.paid!.text, k) };
            }
        }
    }
    fs.writeFileSync(path.join(outDir, 'tuned-numbers.json'), JSON.stringify({ factors: Object.fromEntries(steps.map(k => [k, factorsFor(k)])), numbers }, null, 1));
    process.stdout.write(`wrote ${outDir}\n`);
}
