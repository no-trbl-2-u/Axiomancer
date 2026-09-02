import { describe, it } from 'vitest';
import { Player } from '../../Character/characters.mock';
import { GraveLarva } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import { mockSequentialRng } from '../../test-utils/rng';
import {
    initializeCombatEncounter, rollEncounterDice, draftStanceDie, playCombatCard,
} from '../combat.engine';
import type { CombatDieColor, CombatEncounterState } from '../combat.encounter.types';

const POULTICE = 'spoiled-poultice';
const DIRGE = 'dirge-for-the-disinterred';

function open(deck: string[], color: CombatDieColor): CombatEncounterState {
    const p = deepClone(Player);
    p.knownCards = [...new Set(deck)];
    p.baseStats = { heart: 8, body: 8, mind: 8 };
    p.health = 200; p.maxHealth = 200; p.effects = [];
    const e = deepClone(GraveLarva);
    e.id = 'dummy'; e.health = 4000; e.maxHealth = 4000; e.effects = [];
    let s = initializeCombatEncounter(p, e, deck, 7);
    s = rollEncounterDice(s).state;
    s = { ...s, dice: [{ id: 'd0', color, state: 'available', temporary: false }, { id: 'd1', color: 'x', state: 'locked', temporary: false }], draftedDieId: null, turn: s.turn || 1 };
    s = draftStanceDie(s, 'd0').state;
    return s;
}

describe('probe', () => {
    it('requiem rider damage', () => {
        mockSequentialRng(0.05);
        const deck = [DIRGE, POULTICE, POULTICE, POULTICE, POULTICE];
        const cold = open(deck, 'mind');
        const rc = playCombatCard(cold, { uid: cold.hand.find(h => h.cardId === DIRGE)!.uid }, true);
        let warm = open(deck, 'mind');
        warm = { ...warm, discard: Array.from({ length: 14 }, () => POULTICE) };
        const rw = playCombatCard(warm, { uid: warm.hand.find(h => h.cardId === DIRGE)!.uid }, true);
        // eslint-disable-next-line no-console
        console.log('COLD dmg', 4000 - rc.state.enemy.health, 'WARM dmg', 4000 - rw.state.enemy.health);
        // eslint-disable-next-line no-console
        console.log('WARM events', JSON.stringify(rw.events.filter(e => e.kind === 'damage-dealt' || e.kind === 'die-bonus-fired')));
    });
});
