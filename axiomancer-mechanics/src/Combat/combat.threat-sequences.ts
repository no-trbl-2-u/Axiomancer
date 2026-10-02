/**
 * Hazard-Pattern Combat — AUTHORED THREAT SEQUENCES, DERIVED FROM ENEMY
 * DECKS.
 *
 * The enemy uses cards. Every entry here is compiled from that enemy's
 * ordered deck (`combat.enemy-decks.ts`) over the shared enemy-card library
 * (`combat.enemy-cards.ts`): card N of the deck is threat phase N, and the
 * telegraph names the card being played. Escalation: later cards heavier,
 * final card a spike; the engine's escalation clock compounds on top.
 * `combat.threat.ts` consumes this export.
 */

import type { AuthoredThreatStep } from './combat.threat';
import { ENEMY_DECKS, compileEnemyDeck } from './combat.enemy-decks';

/**
 * enemy id → its compiled threat sequence. Same shape and same consumers as
 * the pre-rework hand-authored table; the DECKS are now the authoring layer.
 */
export const AUTHORED_THREAT_SEQUENCES: Record<string, AuthoredThreatStep[]> =
    Object.fromEntries(Object.keys(ENEMY_DECKS).map(id => [id, compileEnemyDeck(id)]));
