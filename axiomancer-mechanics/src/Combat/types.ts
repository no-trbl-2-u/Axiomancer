import { Character } from '../Character/types';
import { Enemy } from '../Enemy/types';

/**
 * The three stances. Combat works as rock-paper-scissors:
 * `heart` > `body` > `mind` > `heart`.
 */
export type Stance = 'heart' | 'body' | 'mind';

/**
 * The action a combatant performs each round.
 * - `attack` deals damage based on the attacker's stance.
 * - `defend` reduces incoming damage based on the defender's stance.
 * - `item`   uses an item from the inventory.
 * - `flee`   attempts to leave combat.
 * - `spare`  Phase 108 - mercy choice to spare/befriend the enemy.
 * - `exploit` Phase 108 - mercy choice to exploit the opening for a free critical.
 */
export type Action = 'attack' | 'defend' | 'item' | 'flee' | 'spare' | 'exploit';

/**
 * The advantage state of a roll, from the attacker's perspective.
 * - `advantage`    — the attacker's stance counters the defender's.
 * - `neutral`      — same stance or no relationship.
 * - `disadvantage` — the defender's stance counters the attacker's.
 */
export type Advantage = 'advantage' | 'neutral' | 'disadvantage';

/**
 * A combatant's choice for a single round: their stance plus their action.
 *
 * @property stance  - heart/body/mind.
 * @property action  - attack/defend/item/flee.
 * @property itemId  - Inventory item ID, required when `action === 'item'`.
 *                    Per Spec 05 only consumables are usable in combat. (The
 *                    legacy resolver that emitted an `item-blocked` event for
 *                    anything else was removed with the turn-based driver.)
 */
export interface CombatAction {
    stance: Stance;
    action: Action;
    itemId?: string;
}

/**
 * The player's combat choice for the round. Currently identical to
 * `CombatAction`; the alias exists so future input-shape changes (Spec 04)
 * land in one place.
 */
export type PlayerCombatAction = CombatAction;

/**
 * The current phase of a combat encounter.
 * - `choosing_stance` — selecting heart/body/mind.
 * - `choosing_action` — selecting attack/defend/item/flee.
 * - `mercy_choice`    — Phase 108 - choosing spare/befriend vs exploit after successful Befriend.
 * - `resolving`       — round resolution in progress.
 * - `ended`           — combat is over.
 */
export type CombatPhase =
    | 'choosing_stance'
    | 'choosing_action'
    | 'mercy_choice'
    | 'resolving'
    | 'ended';

/**
 * Snapshot of a combat encounter in progress.
 *
 * Both `player` and `enemy` are deep-cloned at combat start so mutations
 * during the fight don't leak back into the root game state until combat ends.
 *
 * @property active            - True while combat is in progress.
 * @property phase             - Current step within the round.
 * @property round             - 1-indexed round number.
 * @property friendshipCounter - Incremented by the shared card engine (`executeCard`)
 *                               for cards that carry `incrementsFriendship`.
 * @property playerChoice      - Player's choice for the current round (built up over phases).
 * @property enemyChoice       - Enemy's choice for the current round.
 */
export interface CombatState {
    active: boolean;
    phase: CombatPhase;
    round: number;
    friendshipCounter: number;
    player: Character;
    enemy: Enemy;
    playerChoice: Partial<CombatAction>;
    enemyChoice: Partial<CombatAction>;
    /** Phase 108 - when true, indicates a successful Befriend has opened mercy choice state */
    mercyChoiceActive?: boolean;
    /**
     * Phase 112 — true only after the player explicitly chooses the spare
     * mercy action opened by a successful Befriend attempt. Passive
     * friendship-counter pressure may make an enemy vulnerable, but it no
     * longer authorizes a friendship combat end by itself.
     */
    friendshipResolutionAuthorized?: boolean;
}

/**
 * Convenience union for utilities that operate on either a player or an enemy.
 */
export type Combatant = Character | Enemy;
