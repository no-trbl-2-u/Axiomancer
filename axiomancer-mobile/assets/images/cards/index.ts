/**
 * Per-card art registry — spec 32 v3 themed-deck pass (2026-07-08).
 *
 * The same 18 paintings back the 70-card themed library, reassigned by THEME
 * so each deck reads as a visual family (Affliction → the toxic moth,
 * Bulwark → the armor set, Oracle → the divine stag, …) with the rare cards
 * taking the strongest painting in the family. Unmapped ids (sandbox /
 * conjured Thoughtforms) fall back to the circe placeholder.
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
    // ── T1 Affliction — the toxic moth + the dark blade ──
    'slippery-slope': dreamFlutter,
    'straw-mans-jab': bleedBlade,
    'festering-argument': dreamFlutter,
    'currys-conversion': bleedBlade,
    'resonance-detonation': spark,
    'venom-and-vein': dreamFlutter,
    'suppurating-curse': devilBook,
    // ── T2 Peroration — the radiant ring (the case, built in circles) ──
    'exordium': lightRing,
    'opening-statement': lightRing,
    'mounting-case': brightSphere,
    'peroratio-interrupta': lightRing,
    'the-closing-word': brightSphere,
    'practiced-cadence': lightRing,
    'captive-audience': willOWisp,
    // ── T3 Forge — sparks and shifting orbs (dice from nothing) ──
    'sketch-of-a-thought': blueLight,
    'half-step': blueLight,
    'bootstrap-loop': spark,
    'ex-nihilo': brightSphere,
    'the-overtake': iceSword,
    'anvil-of-form': guardTorso,
    'entropy-tax': devilBook,
    // ── T4 Akrasia — the sinister tome + the burning blade (the debt) ──
    'against-my-judgment': devilBook,
    'sweet-poison': dreamFlutter,
    'self-flagellant': burnBlade,
    'fallen-grace': lightRing,
    'pact-of-akrasia': devilBook,
    'crown-of-thorns': yggdrasil,
    'mirror-of-guilt': godEye,
    // ── T5 Control — the twin rings (the fettered mind) ──
    'zenos-half-step': confuseRings,
    'red-herring': willOWisp,
    'undistributed-middle': confuseRings,
    'arrow-paradox': freezeCrystal,
    'paralysis-of-analysis': confuseRings,
    'achilles-and-the-tortoise': freezeCrystal,
    'quagmire-of-doubt': confuseRings,
    // ── T6 Oracle — the divine stag (seeing truly) ──
    'glimpse': godEye,
    'signs-and-portents': willOWisp,
    'cassandras-burden': godEye,
    'delphic-ambiguity': confuseRings,
    'prophecy-fulfilled': godEye,
    'the-oracles-eye': godEye,
    'fated-course': freezeCrystal,
    // ── T7 Harvest — the hummingbird + blades (the gleaning) ──
    'brief-candle': burnBlade,
    'memento-mori': meatPecker,
    'winnowing': iceSword,
    'the-gleaners-due': meatPecker,
    'the-reaping': iceSword,
    'bone-orchard': yggdrasil,
    'the-tithe': devilBook,
    // ── T8 Charm — the radiant ring + the hummingbird (mercy) ──
    'soft-word': meatPecker,
    'disarming-smile': lightRing,
    'common-ground': brightSphere,
    'the-olive-branch': yggdrasil,
    'heart-of-the-matter': brightSphere,
    'irresistible-grace': lightRing,
    'mirror-of-longing': godEye,
    // ── T9 Bulwark — the armor set (the wall) ──
    'brace-for-impact': guardArmor,
    'nettle-cloak': yggdrasil,
    'tu-quoque': yggdrasil,
    'measured-answer': guardShield,
    'the-adamant-wall': guardTorso,
    'hedgehogs-dilemma': guardShield,
    'crumbling-resolve': guardArmor,
    // ── T10 Echo — the misleading light + shifting orbs (the refrain) ──
    'refrain': willOWisp,
    'second-thoughts': blueLight,
    'ad-nauseam': confuseRings,
    'circular-reasoning': lightRing,
    'ouroboros': blueLight,
    'resonant-chamber': spark,
    'stuck-in-their-head': willOWisp,
    // ── Synthetic ──
    'card-retreat': willOWisp,
};

export function getCardArt(cardId: string): number {
    return CARD_ART_BY_ID[cardId] ?? FALLBACK_CARD_ART;
}
