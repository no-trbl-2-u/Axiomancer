/**
 * Hazard-Pattern Combat — AUTHORED THREAT SEQUENCES, now DERIVED FROM ENEMY
 * DECKS (the Profane Canon rework, 2026-08-08).
 *
 * The enemy uses cards. Every entry here is compiled from that enemy's
 * ordered deck (`combat.enemy-decks.ts`) over the shared enemy-card library
 * (`combat.enemy-cards.ts`): card N of the deck is threat phase N, and the
 * telegraph names the card being played. The hand-authored per-enemy phase
 * tables this module used to hold are retired to git history — the deck +
 * library layer is their successor, with the same escalation doctrine
 * (later cards heavier, final card a spike; the engine's escalation clock
 * still compounds on top) and the same resolver
 * (`combat.threat.ts` consumes this export unchanged).
 */

import type { AuthoredThreatStep } from './combat.threat';
import { ENEMY_DECKS, compileEnemyDeck } from './combat.enemy-decks';

/**
 * enemy id → its compiled threat sequence. Same shape and same consumers as
 * the pre-rework hand-authored table; the DECKS are now the authoring layer.
 */
export const AUTHORED_THREAT_SEQUENCES: Record<string, AuthoredThreatStep[]> =
    Object.fromEntries(Object.keys(ENEMY_DECKS).map(id => [id, compileEnemyDeck(id)]));
