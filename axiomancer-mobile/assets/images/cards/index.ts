/**
 * Per-card art registry — temp art pass (2026-07-06 drop).
 *
 * 18 paintings back the 50-card combat pool, assigned by keyword/theme match
 * (e.g. bleed → the dark blade, CONFUSION → the twin rings) and reused where
 * the pool outnumbers the paintings. Unmapped ids (sandbox / future cards)
 * fall back to the original circe placeholder.
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
    // poison / septic — the toxic luna moth
    'slippery-slope': dreamFlutter,
    'poisoned-well': dreamFlutter,
    'the-final-word': devilBook,
    // guard family — armor, shield, stone torso
    'brace-for-impact': guardArmor,
    'suspend-judgment': guardShield,
    'stoic-reserve': guardTorso,
    'apophatic-aegis': guardShield,
    'unmoved-mover': guardTorso,
    // bleed family — the dark blade
    'achilles-gambit': bleedBlade,
    'resonance-bleed': bleedBlade,
    'sunk-cost-momentum': bleedBlade,
    'leeching-syllogism': bleedBlade,
    // aggression / vulnerable — the burning blade
    'ad-hominem-strike': burnBlade,
    'breach': burnBlade,
    'pyrrhic-victory': burnBlade,
    // confusion — the twin rings
    'false-dilemma': confuseRings,
    'undistributed-middle': confuseRings,
    'barbers-paradox': confuseRings,
    'moving-the-goalposts': confuseRings,
    // cold / preserved / executioner steel
    'ship-in-a-bottle': freezeCrystal,
    'existential-collapse': freezeCrystal,
    'achilles-overtake': iceSword,
    // lightning / cascade / rupture
    'eternal-regress': spark,
    'the-inevitable': spark,
    'resonance-detonation': spark,
    'sorites-cascade': spark,
    // radiant ring — halos, loops, renewal
    'appeal-to-pity': lightRing,
    'soothing-words': lightRing,
    'bootstrap-paradox': lightRing,
    // the misleading light
    'liars-echo': willOWisp,
    'gamblers-folly': willOWisp,
    'nirvana-fallacy': willOWisp,
    'card-retreat': willOWisp,
    // shifting orbs — swarms, conversions
    'ship-of-theseus': blueLight,
    'equivocation-cascade': blueLight,
    'bat-swarm-thoughtform': blueLight,
    // flaring sphere — rallies, transcendence
    'mob-appeal': brightSphere,
    'mounting-contradictions': brightSphere,
    'transcendent-synthesis': brightSphere,
    // the divine stag — seeing truly, wagers with god
    'empathetic-understanding': godEye,
    'pascals-wager': godEye,
    // the sinister tome — authority, fear, debt
    'appeal-to-authority': devilBook,
    'appeal-to-consequences': devilBook,
    'existential-debt': devilBook,
    // the hummingbird — quick jabs and peace offerings
    'hasty-generalization': meatPecker,
    'befriend': meatPecker,
    'peaceful-gesture': meatPecker,
    // the world tree — thorns and recurrence
    'tu-quoque': yggdrasil,
    'briar-riposte': yggdrasil,
    'eternal-recurrence': yggdrasil,
};

export function getCardArt(cardId: string): number {
    return CARD_ART_BY_ID[cardId] ?? FALLBACK_CARD_ART;
}
