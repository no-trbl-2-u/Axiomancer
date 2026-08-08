/**
 * Per-card art registry — the Profane Canon pass (2026-08-08).
 *
 * The same 18 paintings back the 57-card canon, reassigned by THEME so each
 * archetype reads as a visual family (rot → the toxic moth, vigil → the
 * armor set, grave → the misleading light, debt → the sinister tome, trial →
 * the radiant rings, choir → the hummingbird + light) with the rare cards
 * taking the strongest painting in the family. Curses take the devil book —
 * they should look like something you were handed against your will.
 * Unmapped ids (sandbox / conjured Thoughtforms) fall back to the circe
 * placeholder.
 *
 * Metro needs static require literals, so this map is the one place a card id
 * meets a file path; the mechanics package stays art-free.
 */

const blueLight = require('./blue-light.webp');
const brightSphere = require('./bright-sphere-yellow.webp');
const devilBook = require('./devil-book.webp');
const dreamFlutter = require('./dream-flutter.webp');
const godEye = require('./god-eye-silver.webp');
const iceSword = require('./ice-sword.webp');
const lightRing = require('./light-ring.webp');
const meatPecker = require('./meat-pecker.webp');
const spark = require('./spark.webp');
const willOWisp = require('./will-o-wisp.webp');
const yggdrasil = require('./yggdrasil.webp');
const bleedBlade = require('./bleed.webp');
const burnBlade = require('./burn.webp');
const confuseRings = require('./confuse.webp');
const freezeCrystal = require('./freeze.webp');
const guardTorso = require('./guard-1.webp');
const guardArmor = require('./guard-2.webp');
const guardShield = require('./guard-3.webp');

export const FALLBACK_CARD_ART = require('./circe-placeholder.jpg');

const CARD_ART_BY_ID: Record<string, number> = {
    // ── The Threadbare Office (starters — worn, plain things) ──
    'spoiled-poultice': dreamFlutter,
    'thumbprick-oath': devilBook,
    'first-spadeful': willOWisp,
    'chilblain-watch': guardTorso,
    'petty-indictment': lightRing,
    'thin-hymn': meatPecker,
    'grandmothers-psalter': brightSphere,
    'threadbare-cope': guardArmor,
    // ── The reliquary dice (valve relics) ──
    'knucklebone-recant': confuseRings,
    'ossuary-drawer': blueLight,
    'saints-finger-bone': godEye,
    // ── The curses (enemy-injected — they look like a bad bargain) ──
    'mouthful-of-brine': devilBook,
    'gnaw-marks': devilBook,
    'arrears': devilBook,
    'overheard-name': devilBook,
    // ── rot — the toxic moth + the dark blade ──
    'unction-of-boils': dreamFlutter,
    'the-sextons-bell': bleedBlade,
    'the-long-lent': dreamFlutter,
    'gangrene-gospel': bleedBlade,
    'communion-of-the-worm': spark,
    'the-untended-garden': yggdrasil,
    'edict-of-the-open-wound': devilBook,
    // ── debt — the sinister tome + the burning blade ──
    'promissory-cut': burnBlade,
    'the-vig': devilBook,
    'dead-pledge': devilBook,
    'distraint': burnBlade,
    'blank-indenture': devilBook,
    'the-red-ledger': devilBook,
    'joint-and-several': devilBook,
    // ── grave — the misleading light + the pale glow ──
    'spadework': willOWisp,
    'shallow-grave': willOWisp,
    'paupers-pyre': burnBlade,
    'dirge-for-the-disinterred': blueLight,
    'open-every-grave': willOWisp,
    'the-sextons-count': blueLight,
    'the-congregation-below': yggdrasil,
    // ── vigil — the armor set (the wall) ──
    'frostbitten-palisade': guardTorso,
    'hoarfrost-teeth': yggdrasil,
    'nothing-crossed-the-ice': freezeCrystal,
    'the-reprisal-bell': guardShield,
    'the-besiegers-winter': iceSword,
    'every-stone-an-oath': guardArmor,
    'caltrops-under-the-snow': guardShield,
    // ── trial — the radiant rings (the case, built in circles) ──
    'reading-of-the-charges': lightRing,
    'scolds-bridle': confuseRings,
    'the-pricking-needle': iceSword,
    'contempt-of-court': confuseRings,
    'the-black-cap': brightSphere,
    'the-assize-bell': lightRing,
    'writ-of-attainder': devilBook,
    // ── choir — the hummingbird + the divine eye (sung mercy) ──
    'alms-of-breath': meatPecker,
    'passing-bell': lightRing,
    'last-rites-sung-early': iceSword,
    'the-offertory-plate': brightSphere,
    'miserere': godEye,
    'choirbone-reliquary': meatPecker,
    'the-long-amen': godEye,
};

export function getCardArt(cardId: string): number {
    return CARD_ART_BY_ID[cardId] ?? FALLBACK_CARD_ART;
}
