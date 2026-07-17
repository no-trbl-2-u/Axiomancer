/**
 * TEMPORARY TEST ENEMIES — price-vs-win-rate probes (hand-run, NOT shipped).
 * ===========================================================================
 *
 * Two throwaway foes for probing the question the harness measures:
 * "does packing more card PRICE (scoreCard power per die) raise win-rate?"
 *
 * They are deliberately NOT wired into `ENEMY_REGISTRY` / `EnemiesByMap` /
 * `EnemyLibrary`, so they never leak into random encounters, the playtest
 * matrix, or verify. Paste them into the real library only for a manual
 * probing session, then delete (see "How to register" at the bottom).
 *
 * ── The two levers this file exploits ──────────────────────────────────────
 * A foe's HP and its telegraph damage are driven by DIFFERENT inputs, and
 * that decoupling is the whole trick:
 *
 *   maxHealth   = (body + heart + mind) × 5           (src/Utils calculateMaxHealth)
 *                 → driven ONLY by the STAT SUM. Level does not multiply HP.
 *
 *   threat dmg  = (4 + 0.95 × level) × difficultyMult × phaseRamp × weight
 *                 (src/Combat/combat.threat.ts threatDamageBudget)
 *                 → driven by LEVEL + DIFFICULTY, NOT by attack stats.
 *                 difficultyMult: simple 0.7, normal 0.92, elite 1.08,
 *                                 boss 1.5, unique 1.45.
 *
 *   THE CLOCK   = every telegraph escalates each round past a grace window;
 *                 boss-difficulty/logic foes escalate faster
 *                 (THREAT_ESCALATION_*). A dragging fight compounds.
 *                 On top of that, an unauthored foe's generated sequence
 *                 appends a locked "rage" phase at round 6 that hits ×1.6 AND
 *                 self-heals 50% of its damage — it specifically punishes slow
 *                 attrition (src/Combat/combat.threat.ts generateDefaultThreatSequence).
 *
 * Because HP comes from stats and threat comes from level, we can build a foe
 * with a mountain of HP but the feeble telegraph of a low-level mook (the
 * Sponge), and a foe with modest HP but a high-level boss telegraph that kills
 * fast (the Racer). A normal roster enemy can't split these — high HP there
 * always rides on a high stat block that also implies a high level band.
 *
 * Neither foe carries an authored threat sequence, so each uses the engine's
 * generated 3-phase escalating fallback + the round-6 rage phase. That's
 * intentional and correct — no per-id sequence needs to be authored.
 *
 * Neither foe is befriendable and neither drops loot: mercy alt-wins
 * (Befriend/CAPITULATE/CONCEDE) and loot rolls would both confound a clean
 * price→rounds→win-rate read, so they are removed (mirrors how
 * `TheIncompleteness` strips both).
 */

import { createEnemy } from '../../../src/Enemy';
import type { Enemy, LootTableEntry } from '../../../src/Enemy';

/** Canonical Tier-1 stance-effect overrides every roster enemy plugs in. */
const T1_DEFAULT = {
    body:  { attack: 'tier1_body_attack',  defend: 'tier1_body_defend'  },
    mind:  { attack: 'tier1_mind_attack',  defend: 'tier1_mind_defend'  },
    heart: { attack: 'tier1_heart_attack', defend: 'tier1_heart_defend' },
} as const;

/** Single no-drop bucket — the fight is the measurement, not the loot. */
const NO_LOOT: LootTableEntry[] = [{ item: null, weight: 100 }];

// ═══════════════════════════════════════════════════════════════════════════
// (a) DAMAGE SPONGE — the CONTROL that proves price works once survival is removed
// ═══════════════════════════════════════════════════════════════════════════
/**
 * "The Millstone" — a wall of HP that barely hits back.
 *
 * WHAT IT ISOLATES: the pure damage race. Survival is a non-issue, so the ONLY
 * thing that varies rounds-to-kill (and therefore win-rate, once the clock is
 * out of reach) is how much HP-erosion the deck lands per round. Here MORE
 * card price SHOULD monotonically cut avgRoundsToVictory and push win-rate
 * toward ~100%. If it doesn't on THIS foe, the price lever itself is broken —
 * that's the control finding.
 *
 * HOW IT'S BUILT:
 *   - Stat sum 300 (100/100/100) → maxHealth = 300 × 5 = 1500. A genuine grind.
 *   - level 5 + difficulty 'simple' → threat budget ≈ (4 + 0.95×5) × 0.7 ≈ 6
 *     per phase. Feeble low-rung telegraphs; few rungs to clear.
 *   - Because level is pinned low, even the round-6 rage phase heals only
 *     ~8 HP/cycle against a 1500 pool (<0.6%) — negligible, so the race stays
 *     clean and monotonic.
 *   - logic 'defensive' → it turtles and absorbs rather than spiking.
 *   - Even stat spread → no single defense axis is a soft spot skewing the
 *     race toward one status school; bring your reliable engine and grind.
 *
 * HOW TO FIGHT IT (hand-run): pick a MID or LATE stage player (255–570 HP) so
 * the low-but-escalating chip never catches up over the long grind. The intent
 * is that the player essentially cannot lose on survival — only DPS varies —
 * so the price→rounds curve is read against a fixed ~100% win ceiling. If a
 * very-low-price deck ever dies here, the fight dragged long enough for THE
 * CLOCK to bite; note it and either raise the player stage or drop level to 3.
 */
export const TempDamageSponge: Enemy = createEnemy({
    id: 'enemy-temp-damage-sponge',
    name: 'The Millstone',
    stanceHint: 'It does not strike so much as endure — grind against it long enough and it grinds back, slowly.',
    description:
        'A slab of accreted grievance that has forgotten how to do anything but persist. ' +
        'It soaks punishment the way stone soaks rain: completely, indifferently, and for as long as you care to keep raining.',
    level: 5,
    baseStats: { body: 100, mind: 100, heart: 100 }, // sum 300 → 1500 HP
    mapName: 'fishing-village',
    difficulty: 'simple',
    logic: 'defensive',
    tier1Overrides: T1_DEFAULT,
    loot: NO_LOOT,
    // No befriendabilityConfig: mercy is not an out — the race must run to 0 HP.
    philosophicalAlignment: { epistemology: 0, outlook: 0, scope: 0 },
    addedIn: 'TEMP-price-experiment',
    tags: ['temp', 'price-experiment', 'damage-sponge', 'control'],
});

// ═══════════════════════════════════════════════════════════════════════════
// (b) GLASS RACER — the FOIL that exaggerates the tempo wall
// ═══════════════════════════════════════════════════════════════════════════
/**
 * "The Hourglass" — modest HP, but a boss-tempo telegraph that kills fast.
 *
 * WHAT IT EXAGGERATES: the tempo wall. Here even HUGE card price should FAIL
 * unless that price buys BURST (front-loaded HP erosion) or SURVIVAL
 * (defense/heal/control). Price spent on slow, ramping value — long DoT chains,
 * value engines that mature over many turns — arrives too late: the foe kills
 * the player, or its round-6 rage phase heals back the slow chip. The expected
 * finding is a NON-monotone (or flat-low) price→win-rate curve: expensive decks
 * that don't convert price into tempo do no better than cheap ones.
 *
 * HOW IT'S BUILT:
 *   - Stat sum 60 (20/20/20) → maxHealth = 60 × 5 = 300. Beatable by real burst,
 *     but NOT by slow attrition inside the time it gives you.
 *   - level 40 + difficulty 'boss' → threat budget ≈ (4 + 0.95×40) × 1.5 ≈ 63
 *     per phase at phase 0, ramping to ~100 by the spike phase — before THE
 *     CLOCK's per-round escalation is even added.
 *   - logic 'boss' → the faster boss escalation multiplier: the wall gets
 *     steeper every round you fail to close.
 *   - Unauthored → the round-6 rage phase (×1.6 + 50% self-heal) is the trap
 *     for slow decks specifically: drag past round 6 and it both spikes and
 *     undoes your chip.
 *
 * HOW TO FIGHT IT (hand-run): pick a MID or LATE stage player. At LATE (570 HP)
 * the ~63→100+/phase telegraph kills in roughly 6–8 phases, so the player must
 * erase 300 HP inside that window (burst) or blunt the incoming (survival).
 * Slow-DoT / value decks — however expensive — should visibly stall here. To
 * sharpen the wall, raise `level` (e.g. 50) or switch difficulty to 'unique';
 * to soften it, lower `level`.
 */
export const TempGlassRacer: Enemy = createEnemy({
    id: 'enemy-temp-glass-racer',
    name: 'The Hourglass',
    stanceHint: 'Every motion is already the last one — it fights as if the sand is nearly out, because for you it is.',
    description:
        'A thin, fast verdict of a thing, all edges and hurry. It does not out-last opponents; it out-runs them, ' +
        'closing the distance before the fight it started can turn into the fight you wanted.',
    level: 40,
    baseStats: { body: 20, mind: 20, heart: 20 }, // sum 60 → 300 HP
    mapName: 'northern-forest',
    difficulty: 'boss',
    logic: 'boss',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        // Boss-tier proc caps so its telegraphed hits can land higher-tier
        // status riders — reinforces "you must answer tempo with tempo".
        body:  { attack: 3, defend: 3 },
        mind:  { attack: 3, defend: 3 },
        heart: { attack: 3, defend: 3 },
    },
    loot: NO_LOOT,
    // No befriendabilityConfig: mercy is not an out — you either beat the clock or lose to it.
    philosophicalAlignment: { epistemology: 0, outlook: -67, scope: 0 },
    addedIn: 'TEMP-price-experiment',
    tags: ['temp', 'price-experiment', 'glass-racer', 'foil'],
});

/** Convenience bundle for a probing session. */
export const TEMP_PRICE_EXPERIMENT_ENEMIES = {
    'temp-damage-sponge': TempDamageSponge,
    'temp-glass-racer':   TempGlassRacer,
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// HOW TO REGISTER (for a manual probing session; revert afterward)
// ═══════════════════════════════════════════════════════════════════════════
/**
 * These are intentionally standalone. To probe them by hand:
 *
 * 1) Copy the two `createEnemy({...})` blocks into
 *    `src/Enemy/enemy.library.ts` (near the `Sandbag_01` test fixture — the
 *    "not part of the art roster" section is the right neighbourhood). Bring
 *    the `T1_DEFAULT` / `none()` helpers already defined in that file; you can
 *    drop the local copies above.
 *
 * 2) Add BOTH to `ENEMY_REGISTRY` (same file) so any slug-keyed lookup — the
 *    price harness, CLIs, hermetic probes — can resolve them:
 *
 *        export const ENEMY_REGISTRY = {
 *            // ...existing entries...
 *            'temp-damage-sponge': TempDamageSponge,
 *            'temp-glass-racer':   TempGlassRacer,
 *        } as const;
 *
 *    Do NOT add them to `EnemiesByMap` or `EnemyLibrary` — keeping them out of
 *    those pools is what stops them leaking into random encounters and the
 *    52-painting roster invariants (same discipline as `Sandbag_01` /
 *    `TheIncompleteness`).
 *
 * 3) Give the price harness a stage roster to fight them. Either point an
 *    existing stage's `enemySlugs` at the pair, or add a throwaway stage in
 *    `src/Combat/combat.stage-profiles.ts`. A control-vs-foil roster:
 *
 *        // in COMBAT_STAGE_PROFILES — e.g. override `mid.enemySlugs`, or add:
 *        priceProbe: {
 *            id: 'mid',                       // reuse a real CombatStageId, or
 *                                             // extend CombatStageId if adding new
 *            name: 'Price Probe',
 *            description: 'Sponge (pure damage race) vs Racer (tempo wall).',
 *            playerLevel: 45,
 *            playerBaseStats: { heart: 37, body: 39, mind: 38 },
 *            playerMaxHealth: 570,            // LATE-stage HP so survival is a
 *                                             // non-issue vs the Sponge
 *            maxCardTier: 3,
 *            enemySlugs: ['temp-damage-sponge', 'temp-glass-racer'],
 *        },
 *
 *    The stage-profiles e2e asserts every slug exists in `ENEMY_REGISTRY`, so
 *    step 2 must land before step 3.
 *
 * 4) Run the harness against that roster, e.g.:
 *        npx ts-node --transpile-only scratch/price-experiment/price-winrate.harness.ts \
 *            --mode=ladder --out=scratch/price-experiment/out/price-probe.json
 *
 *    Read the two curves:
 *      - Sponge  → avgRoundsToVictory should fall (and win-rate rise toward
 *                  ~100%) monotonically as deck price climbs. (control passes)
 *      - Racer   → win-rate should stay flat/low for slow-value price and only
 *                  move for burst/survival price. (foil exposes the tempo wall)
 *
 * 5) Revert steps 1–3 when done — nothing here should survive into a commit.
 */
