/**
 * Unique card-icon registry.
 *
 * Every live library card owns one transparent SVG selected from the supplied
 * `Potential Assets` Game Icons archive. Metro requires literal asset paths,
 * so keep the static requires here and the source attribution in
 * `icon-sources.json`.
 */

export const FALLBACK_CARD_ART = require('./icons/fallback.svg');

const CARD_ART_BY_ID: Record<string, number> = {
    'against-my-judgment': require('./icons/against-my-judgment.svg'),
    'anvil-of-form': require('./icons/anvil-of-form.svg'),
    'arrow-paradox': require('./icons/arrow-paradox.svg'),
    'bank-the-yield': require('./icons/bank-the-yield.svg'),
    'bleed-for-it': require('./icons/bleed-for-it.svg'),
    'bone-orchard': require('./icons/bone-orchard.svg'),
    'bootstrap-loop': require('./icons/bootstrap-loop.svg'),
    'brace-for-impact': require('./icons/brace-for-impact.svg'),
    'break-the-tempo': require('./icons/break-the-tempo.svg'),
    'brief-candle': require('./icons/brief-candle.svg'),
    'cassandras-burden': require('./icons/cassandras-burden.svg'),
    'change-of-heart': require('./icons/change-of-heart.svg'),
    'circular-reasoning': require('./icons/circular-reasoning.svg'),
    'common-ground': require('./icons/common-ground.svg'),
    'crown-of-thorns': require('./icons/crown-of-thorns.svg'),
    'crumbling-resolve': require('./icons/crumbling-resolve.svg'),
    'currys-conversion': require('./icons/currys-conversion.svg'),
    'delphic-ambiguity': require('./icons/delphic-ambiguity.svg'),
    'disarming-smile': require('./icons/disarming-smile.svg'),
    'ex-nihilo': require('./icons/ex-nihilo.svg'),
    'exordium': require('./icons/exordium.svg'),
    'fallen-grace': require('./icons/fallen-grace.svg'),
    'festering-argument': require('./icons/festering-argument.svg'),
    'forge-masters-stamp': require('./icons/forge-masters-stamp.svg'),
    'glimpse': require('./icons/glimpse.svg'),
    'grace-under-fire': require('./icons/grace-under-fire.svg'),
    'half-spoken-prophecy': require('./icons/half-spoken-prophecy.svg'),
    'half-step': require('./icons/half-step.svg'),
    'hedgehogs-dilemma': require('./icons/hedgehogs-dilemma.svg'),
    'hold-the-line': require('./icons/hold-the-line.svg'),
    'irresistible-grace': require('./icons/irresistible-grace.svg'),
    'measured-answer': require('./icons/measured-answer.svg'),
    'mirror-of-guilt': require('./icons/mirror-of-guilt.svg'),
    'mirror-of-longing': require('./icons/mirror-of-longing.svg'),
    'mounting-case': require('./icons/mounting-case.svg'),
    'nettle-cloak': require('./icons/nettle-cloak.svg'),
    'opening-statement': require('./icons/opening-statement.svg'),
    'ouroboros': require('./icons/ouroboros.svg'),
    'pact-of-akrasia': require('./icons/pact-of-akrasia.svg'),
    'pebble-in-the-boot': require('./icons/pebble-in-the-boot.svg'),
    'peroratio-interrupta': require('./icons/peroratio-interrupta.svg'),
    'poisoned-well': require('./icons/poisoned-well.svg'),
    'prophecy-fulfilled': require('./icons/prophecy-fulfilled.svg'),
    'quagmire-of-doubt': require('./icons/quagmire-of-doubt.svg'),
    'quod-erat-demonstrandum': require('./icons/quod-erat-demonstrandum.svg'),
    'recurring-symptom': require('./icons/recurring-symptom.svg'),
    'red-herring': require('./icons/red-herring.svg'),
    'refrain': require('./icons/refrain.svg'),
    'resonance-detonation': require('./icons/resonance-detonation.svg'),
    'resonant-chamber': require('./icons/resonant-chamber.svg'),
    'restate-the-point': require('./icons/restate-the-point.svg'),
    'second-sight': require('./icons/second-sight.svg'),
    'second-take': require('./icons/second-take.svg'),
    'second-thoughts': require('./icons/second-thoughts.svg'),
    'self-flagellant': require('./icons/self-flagellant.svg'),
    'signs-and-portents': require('./icons/signs-and-portents.svg'),
    'sketch-of-a-thought': require('./icons/sketch-of-a-thought.svg'),
    'slippery-slope': require('./icons/slippery-slope.svg'),
    'soft-word': require('./icons/soft-word.svg'),
    'stuck-in-their-head': require('./icons/stuck-in-their-head.svg'),
    'suppurating-curse': require('./icons/suppurating-curse.svg'),
    'sweet-poison': require('./icons/sweet-poison.svg'),
    'tempered-edge': require('./icons/tempered-edge.svg'),
    'the-adamant-wall': require('./icons/the-adamant-wall.svg'),
    'the-anvil-speaks': require('./icons/the-anvil-speaks.svg'),
    'the-burden-of-repetition': require('./icons/the-burden-of-repetition.svg'),
    'the-closing-word': require('./icons/the-closing-word.svg'),
    'the-gleaners-due': require('./icons/the-gleaners-due.svg'),
    'the-olive-branch': require('./icons/the-olive-branch.svg'),
    'the-oracles-eye': require('./icons/the-oracles-eye.svg'),
    'the-overtake': require('./icons/the-overtake.svg'),
    'the-reaping': require('./icons/the-reaping.svg'),
    'tu-quoque': require('./icons/tu-quoque.svg'),
    'turnabout': require('./icons/turnabout.svg'),
    'undistributed-middle': require('./icons/undistributed-middle.svg'),
    'venom-and-vein': require('./icons/venom-and-vein.svg'),
    'videtur-quod': require('./icons/videtur-quod.svg'),
    'winnowing': require('./icons/winnowing.svg'),
    'zenos-half-step': require('./icons/zenos-half-step.svg'),
};

/** File names are exported for registry integrity tests and catalog tooling. */
export const CARD_ART_FILE_BY_ID: Readonly<Record<string, string>> = Object.freeze(
    Object.fromEntries(Object.keys(CARD_ART_BY_ID).map((cardId) => [cardId, `icons/${cardId}.svg`])),
);

export function getCardArt(cardId: string): number {
    return CARD_ART_BY_ID[cardId] ?? FALLBACK_CARD_ART;
}
