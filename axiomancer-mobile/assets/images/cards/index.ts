/**
 * Per-card art registry. Metro needs static require literals, so this map is
 * the one place a card id meets a file path; the mechanics package stays
 * art-free.
 *
 * The three grey starters borrow paintings from the pool as placeholders
 * until the card art revamp (B8) decides art per card type. The other
 * paintings in this folder stay as that pool (`CARD_ART_POOL`,
 * `provenance.json`). Unmapped ids (sandbox and fixture cards) fall back to
 * the circe placeholder.
 */

const godEye = require('./god-eye-silver.webp');
const iceSword = require('./ice-sword.webp');
const guardTorso = require('./guard-1.webp');

/** Every painting in the folder, mapped or not: the pool B8 draws from. */
export const CARD_ART_POOL: readonly number[] = [
    require('./blue-light.webp'),
    require('./bright-sphere-yellow.webp'),
    require('./devil-book.webp'),
    require('./dream-flutter.webp'),
    godEye,
    iceSword,
    require('./light-ring.webp'),
    require('./meat-pecker.webp'),
    require('./spark.webp'),
    require('./will-o-wisp.webp'),
    require('./yggdrasil.webp'),
    require('./bleed.webp'),
    require('./burn.webp'),
    require('./confuse.webp'),
    require('./freeze.webp'),
    guardTorso,
    require('./guard-2.webp'),
    require('./guard-3.webp'),
];

export const FALLBACK_CARD_ART = require('./circe-placeholder.jpg');

const CARD_ART_BY_ID: Record<string, number> = {
    'grey-strike': iceSword,
    'grey-ward': guardTorso,
    'grey-word': godEye,
};

export function getCardArt(cardId: string): number {
    return CARD_ART_BY_ID[cardId] ?? FALLBACK_CARD_ART;
}
