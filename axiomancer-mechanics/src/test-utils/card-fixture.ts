/**
 * Shared card-play fixture for the Cards e2e lints (extracted from
 * `card-effectiveness.engine.test.ts` per WS0.4,
 * `plan/tuning/2026-07-11-card-library-improvement-plan-detailed.md`).
 *
 * Two variants of the same level-20 player + single-WILD-die tray:
 *
 *   - RICH (default, `{ clean: false }`) — the effectiveness lint's
 *     precondition buffet: enemy afflictions with DoT fuel + MARK stacks,
 *     Souls, Premises, discard fodder, reserve/floating dice with pip
 *     headroom, a pre-damaged Fallen player, a banked TURNABOUT denial
 *     ledger. Every library card's PAID-face preconditions are
 *     satisfiable here.
 *   - CLEAN (`{ clean: true }`) — the doctrine witness's null board: the
 *     SAME player and die tray, but the enemy carries NO pre-applied
 *     effects (no DoT fuel, no marks), guard/barrier 0, Souls 0, reserve
 *     pips 0, full enemy HP, zero denial banked. Every printed payoff
 *     prerequisite is zeroed — stacks, souls, banked pips (FORGE's
 *     `rupture.fuelPerPip` legally converts pips to burst fuel, so a
 *     leftover pip would let e.g. the-overtake chip 5 HP legitimately), AND
 *     the TURNABOUT ledger (a leftover bank would let it legitimately chip)
 *     — so every doctrinally legal payoff (RUPTURE fuel 0, REAP 0 souls,
 *     TURNABOUT 0 rungs, tick nothing) must chip NOTHING and any enemy-HP
 *     delta is direct damage, i.e. a strike in disguise.
 *
 * Excluded from the published build via `tsconfig.json` `exclude`
 * (`src/test-utils`); must not be imported from production code.
 */

import { Player } from '../Character/characters.mock';
import type { Character } from '../Character/types';
import { GraveLarva } from '../Enemy/enemy.library';
import type { Enemy } from '../Enemy/types';
import { deepClone } from '../Utils';
import { initializeCombatEncounter } from '../Combat/combat.engine';
import type { CombatEncounterState, CombatManaDie } from '../Combat/combat.encounter.types';
import { cardLibrary } from '../Cards/cards.library';

/** Filler deck/draw-pile content: a real, always-playable spell, so `drawCards`
 *  riders never starve regardless of how many cards a given test draws. */
export const FIXTURE_FILLER: readonly string[] = Array<string>(12).fill('spoiled-poultice');
export const FIXTURE_SEED = 20260708;

export function buildFixtureState(options: { clean?: boolean } = {}): CombatEncounterState {
    const clean = options.clean ?? false;

    const player: Character = deepClone(Player);
    player.baseStats = { heart: 10, body: 10, mind: 10 };
    player.level = 20;
    // executeCard's ownership gate requires the played card in knownCards
    // (or combatRewardCards) — own the whole library so any card id is legal.
    player.knownCards = cardLibrary.map(c => c.id);
    player.maxHealth = 300;
    player.health = 150; // pre-damaged so `healHp` riders are observable, not capped
    // Two DISTINCT self-debuffs -> FALLEN active (getDistinctDebuffCount >= 2);
    // also gives `cleanse` riders something real to remove.
    player.effects = [
        { effectId: 'debuff_mark', remainingDuration: 2, intensity: 2, appliedAt: 0, tier: 1 },
        { effectId: 'debuff_bleed', remainingDuration: 3, intensity: 2, appliedAt: 0, tier: 2 },
    ];

    const enemy: Enemy = deepClone(GraveLarva);
    enemy.id = 'fixture-enemy';
    enemy.maxHealth = 1000;
    enemy.health = 1000;
    enemy.baseStats = { heart: 4, body: 4, mind: 4 };
    // RICH: two DoTs with real remaining fuel (RUPTURE/consume_affliction
    // fodder) + MARK stacks (ruptureMarks fodder). `debuff_poison`/
    // `debuff_bleed`/`debuff_mark` all stack by `intensity`
    // (debuffs.library.json), so any card that re-applies one of these three
    // deepens the existing stack rather than colliding with a
    // `stacking: 'none'` no-op.
    // CLEAN: no pre-applied effects at all — zero payoff fuel by construction.
    enemy.effects = clean ? [] : [
        { effectId: 'debuff_poison', remainingDuration: 4, intensity: 3, appliedAt: 0, tier: 2 },
        { effectId: 'debuff_bleed', remainingDuration: 3, intensity: 3, appliedAt: 0, tier: 2 },
        { effectId: 'debuff_mark', remainingDuration: 2, intensity: 3, appliedAt: 0, tier: 1 },
    ];

    const base = initializeCombatEncounter(player, enemy, FIXTURE_FILLER.slice(), FIXTURE_SEED);

    // A single WILD powering die: payable regardless of a card's own stance
    // color, so no card is starved of a legal play by die-color mismatch.
    const wildDie: CombatManaDie = { id: 'fx-die', color: 'wild', state: 'available', temporary: false, face: 'mana' };

    return {
        ...base,
        phase: 'phase-play',
        turn: 1,
        dice: [wildDie],
        draftedDieId: wildDie.id,
        lastRead: 'neutral',
        // 1 of RESERVE_MAX(2) slots used, with 1 pip (<RESERVE_PIP_CAP(2)) —
        // room for create_temporary_die/reap-kindle/bank_spent_die to add one
        // more, and for grant_pip to ripen further. CLEAN zeroes the pip:
        // banked pips are printed RUPTURE fuel (`fuelPerPip`).
        reserve: [{ id: 'fx-reserve-0', color: 'heart', state: 'available', temporary: false, pips: clean ? 0 : 1 }],
        // 1 of FLOATING_DICE_CAP(3) slots used — room for forge_floating_die.
        floatingDice: [{ id: 'fx-float-0', color: 'wild', state: 'available', temporary: false, floating: true, pips: 0 }],
        guard: clean ? 0 : 4,
        barrier: clean ? 0 : 4,
        souls: clean ? 0 : 12, // clean: REAP must have zero souls to consume
        // Phase 32 part 4a (Control — TURNABOUT ledger): clean: TURNABOUT
        // must have zero rungs banked to consume (same doctrine as souls).
        rungsDeniedTotal: clean ? 0 : 20,
        premises: 3,
        peroration: null, // tallied but undeclared — a 'premise' gain never trips CONDEMN mid-assertion
        sway: 0,
        staggerRungs: 0,
        revealedStances: [],
        pendingOmens: [],
        omenHits: 0,
        echoNextSpell: false,
        spellsPlayedThisTurn: 0,
        lastSpellCardId: 'spoiled-poultice', // a real, different, replayable spell (REPLAY fodder)
        // Phase 39 (2026-08-08): REPLAY_LAST's precondition-width
        // retune requires `lastSpellRound === round` ("landed THIS turn") —
        // the fixture's `round` is 1 (initializeCombatEncounter's default).
        lastSpellRound: 1,
        persistentZone: [],
        enemyAttachments: [],
        discard: ['spoiled-poultice', 'thin-hymn', 'the-long-lent'], // RECALL fodder (canon re-slug 2026-08-08)
        drawPile: FIXTURE_FILLER.slice(),
        deck: FIXTURE_FILLER.slice(),
        hand: [],
    };
}
