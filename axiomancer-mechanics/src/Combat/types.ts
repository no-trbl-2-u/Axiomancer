import { Character } from '../Character/types';
import { Enemy } from '../Enemy/types';

/**
 * The three stat families: `heart`, `body`, `mind`. A card's colour, a die's
 * colour and the stat a mechanic scales by are each one of these.
 */
export type Stance = 'heart' | 'body' | 'mind';

/**
 * The slice of a fight `executeCard` reads: the round and both combatants.
 * The encounter (`CombatEncounterState`) builds it per card play.
 */
export interface CombatState {
    round: number;
    player: Character;
    enemy: Enemy;
}

/**
 * Convenience union for utilities that operate on either a player or an enemy.
 */
export type Combatant = Character | Enemy;
