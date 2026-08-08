/**
 * Spec 32 v3 §8 — the TEN themed preset decks.
 *
 * Every preset follows the owner's recipe exactly: 4 copies × 2 unique
 * commons, 2 copies × 2 unique uncommons, 1 copy × 3 unique rares (the rare
 * spell finisher + an enchantment + a disenchant) = 15 cards, and no
 * in-combat escape card is appended to any of them (no retreat exists once
 * combat is joined).
 *
 * STARTER-DECK FRAMING (load-bearing doctrine 2026-07-08, canonical in
 * VISION.md → Combat vision): these ten presets are the STARTER decks —
 * early/mid-game by design, held to the blind-policy curve early ~80% /
 * mid ~50% / late ~25-35% / impossible 0%. The player trades into a new
 * mid-game deck after the labyrinth (draft-maturation), so a starter
 * overperforming that curve late is a dominance finding, not a success;
 * underperforming it at early/mid is a real balance failure. Late-game
 * presets are a separate, future library (in-band, clean-replace — they
 * stay inside the existing rank/price bands rather than raising them).
 *
 * THE COLOR LAW OF RECIPES (ratified 2026-07-12, spec 32 §12 item 9): every
 * preset carries exactly 5 body / 5 mind / 5 heart cards by
 * `philosophicalAspect`. All three die colors are always possible in the
 * tray and the Color Law otherwise strands off-color dice (the owner
 * playtest found foundry/standstill/tithe at ZERO heart — every purple die
 * dead for card play). Under the fixed 4/4/2/2/1/1/1 recipe the only legal
 * partition of 15 into 5/5/5 is 4+1 / 4+1 / 2+2+1: commons in two different
 * colors, both uncommons in the third, rares one of each color. Where a
 * theme's own 7 cards cannot cover the partition, the preset BORROWS
 * utility-leaning cards of the missing color from a neighbor theme (same
 * rarity slot, same cardType slot) — see {@link PRESET_COLOR_BORROWS}.
 * Color playability outranks strict theme purity; each theme's hallmark
 * engine cards stay home. Cards squeezed out of every recipe by the law
 * remain in the 70-card reward pool as reward/draft-only cards.
 *
 * Each deck still plays fundamentally differently (the deck-distinctness
 * law): Erosion ramps DoTs and detonates; Oratory builds Premises toward a
 * declared conclusion (CONCEDE at 8); Foundry manufactures dice and cashes
 * the pips; Penitent buys power with blood and turns Fallen into a state of
 * grace; Standstill strips action rungs and lets BACKFIRE bleed the denied
 * blows; Augury sees the future and collects when it arrives; Tithe churns
 * short afflictions into Souls and swings the scythe; Grace never strikes —
 * SWAY to CAPITULATION; Bastion lets their aggression kill them; Refrain
 * replays its greatest hits until the tune kills.
 *
 * Pure data + pure helpers — card ids are validated against the library at
 * call time (an id that no longer resolves is dropped).
 */

import { getCardById } from '../Cards/cards.library';
import { isUpgradeableDiceEnabled } from './combat.upgradeable-dice';

/**
 * The design lever a preset leans on. Kept coarse for the draft/sim-policy
 * consumers; `theme` (below) carries the v3 identity.
 */
export type CombatDeckFocus = 'dot' | 'control' | 'utility' | 'damage' | 'rush-execute' | 'balanced';

/** A curated, ready-to-play combat deck with a single design focus. */
export interface CombatDeckPreset {
    /** Stable kebab-case id. */
    id: string;
    /** Display name (the mobile deck-picker label). */
    name: string;
    /** Spec 32 v3 theme key (T1-T10). */
    theme: string;
    /** The coarse lever this deck leans on (sim-policy compatibility). */
    focus: CombatDeckFocus;
    /** One-line pitch for the deck-picker. */
    description: string;
    /** Curated card ids on the 4/4/2/2/1/1/1 recipe. DUPLICATES intentional. */
    cardIds: readonly string[];
}

/** Builds the 15-card recipe list: commons ×4, uncommons ×2, rares ×1. */
function recipe(
    c1: string, c2: string, u1: string, u2: string,
    rareSpell: string, enchantment: string, disenchant: string,
): string[] {
    return [
        c1, c1, c1, c1,
        c2, c2, c2, c2,
        u1, u1,
        u2, u2,
        rareSpell, enchantment, disenchant,
    ];
}

export const COMBAT_DECK_PRESETS: Record<string, CombatDeckPreset> = {
    erosion: {
        id: 'erosion',
        name: 'Erosion',
        theme: 'affliction',
        focus: 'dot',
        description: 'Stack poison and bleed, stretch them, convert them — then detonate everything at once.',
        // Colors 5/5/5: body = poisoned-well×4 + venom | heart = opening×4 +
        // resonance | mind = festering×2 + currys×2 + curse.
        // Borrow: opening-statement (peroration, heart) replaces
        // straw-mans-jab — its mark+poison payload feeds the DoT/RUPTURE
        // engine directly (MARK amplifies every tick).
        // 2026-07-19 promotion: poisoned-well (swap-pool arm e1) evicts
        // slippery-slope from the x4 body common seat — the front-loaded
        // i2d2 read landed mid ON the ~0.50 doctrine target (0.370→0.503
        // blind). slippery-slope remains a library/reward card (and the
        // starting-pair teaching card).
        cardIds: recipe(
            'poisoned-well', 'opening-statement',
            'festering-argument', 'currys-conversion',
            'resonance-detonation', 'venom-and-vein', 'suppurating-curse',
        ),
    },
    oratory: {
        id: 'oratory',
        name: 'Oratory',
        theme: 'peroration',
        focus: 'balanced',
        description: 'Build the case premise by premise; the declared conclusion fires free — and at eight, they concede.',
        // Colors 5/5/5: heart = videtur-quod×4 + QED | body = brace×4 +
        // venom | mind = mounting×2 + peroratio×2 + quagmire.
        // Borrows: brace-for-impact (bulwark, body — GUARD utility keeps the
        // case-builder alive; also keeps the starter card seated),
        // venom-and-vein (affliction, body ench — +1 intensity on the deck's
        // own poison payloads), quagmire-of-doubt (control, mind dis —
        // universal telegraph softener).
        // 2026-07-19 promotions: videtur-quod (arm o1) evicts exordium at
        // the x4 heart common seat; quod-erat-demonstrandum (arm o3) evicts
        // the-closing-word at the rare heart spell seat (late 0.119→0.278 —
        // into band; owner accepted CONCEDE centrality). Both evicted cards
        // remain library/reward cards.
        cardIds: recipe(
            'videtur-quod', 'brace-for-impact',
            'mounting-case', 'peroratio-interrupta',
            'quod-erat-demonstrandum', 'venom-and-vein', 'quagmire-of-doubt',
        ),
    },
    foundry: {
        id: 'foundry',
        name: 'Foundry',
        theme: 'forge',
        focus: 'utility',
        description: 'Manufacture dice from nothing, ripen the pips, then spend every one in a single overwhelming stride.',
        // Colors 5/5/5: heart = signs×4 + practiced-cadence | body =
        // tempered-edge×4 + overtake | mind = bootstrap×2 + ex-nihilo×2 +
        // entropy-tax.
        // Borrows: signs-and-portents (oracle, heart — OMEN rides any
        // powering die, pure draw utility), practiced-cadence (peroration,
        // heart ench — see phase-39 note below).
        // 2026-07-19 promotion: tempered-edge (arm f2) evicts half-step at
        // the x4 body common seat — foundry's first in-theme enemy-facing
        // line (early 0.60→0.80, ON band; sE 0.00→0.21). half-step remains a
        // library/reward card.
        // Phase 39 (2026-08-08) — owner-ruled identity seat: `entropy-tax`
        // (forge's own missing dis, restored §A) replaces the `mirror-of-
        // longing` (charm) borrow at the disenchant seat — forge finally
        // polices its OWN manufactured-die spend instead of borrowing a
        // charm alt-win passive it can't otherwise use (status-doctrine
        // ruling, applied regardless of win-rate delta; swap-sweep evidence
        // in the phase-39 report). Color-law fallout: entropy-tax is `mind`,
        // vacating `mirror-of-longing`'s `heart` seat and overfilling `mind`
        // to 6 — `mind`'s OTHER single-copy seat, the enchantment
        // (`anvil-of-form`, forge's own, also `mind`), is the only lever that
        // nets exactly ±1 without touching `body` (both commons are fixed at
        // 4 copies; the two uncommons are both `mind` already). anvil-of-form
        // is swapped for `practiced-cadence` (peroration, `heart`, restored
        // §A) — a heart RARE enchantment, giving §A's restoration a mid-game
        // second gear (§C4) instead of orphaning it reward-only. anvil-of-
        // form itself becomes reward-only (precedented — half-step, the-
        // adamant-wall, etc. are evicted-not-deleted the same way); its D8
        // valve seat (`forge-masters-stamp` replacing it) is re-pointed to
        // `ex-nihilo` (still `mind`, still in this recipe) in
        // PRESET_DICE_VALVES below. 5/5/5 check: heart = signs×4 (4) +
        // practiced-cadence (1) = 5; mind = bootstrap×2 (2) + ex-nihilo×2 (2)
        // + entropy-tax (1) = 5; body = tempered-edge×4 (4) + overtake (1) = 5.
        cardIds: recipe(
            'signs-and-portents', 'tempered-edge',
            'bootstrap-loop', 'ex-nihilo',
            'the-overtake', 'practiced-cadence', 'entropy-tax',
        ),
    },
    penitent: {
        id: 'penitent',
        name: 'Penitent',
        theme: 'akrasia',
        focus: 'dot',
        description: 'Pay in blood for undercosted power; two different self-afflictions make you Fallen, and the debt starts arguing for you.',
        // Colors 5/5/5: heart = judgment×4 + crown | body = sweet-poison×4 +
        // pact | mind = undistributed×2 + delphic×2 + mirror-of-guilt.
        // Borrows: undistributed-middle (control, mind — stagger+backfire
        // keeps the self-harm deck alive), delphic-ambiguity (oracle, mind —
        // cashes the deck's own enemy DoTs early). Both self-afflictions
        // toward FALLEN stay home in the commons.
        cardIds: recipe(
            'against-my-judgment', 'sweet-poison',
            'undistributed-middle', 'delphic-ambiguity',
            'pact-of-akrasia', 'crown-of-thorns', 'mirror-of-guilt',
        ),
    },
    standstill: {
        id: 'standstill',
        name: 'Standstill',
        theme: 'control',
        focus: 'control',
        description: 'Strip the rungs from every telegraphed blow; what cannot land, lands inward.',
        // Colors 5/5/5: body = zeno×4 + hedgehog | mind = red-herring×4 +
        // turnabout | heart = cassandra×2 + fallen-grace×2 + mirror.
        // Borrows: cassandras-burden (oracle, heart — OMEN guard + chip),
        // fallen-grace (akrasia, heart — bleed chip + draw), hedgehogs-
        // dilemma (bulwark, body ench), mirror-of-longing (charm, heart dis
        // — the deck's heavy guard converts to SWAY). STAGGER/BACKFIRE core
        // (zeno, red-herring) stays home; the rare-spell seat is TURNABOUT
        // (phase 32 part 4a) — the capstone that cashes the whole denial
        // ledger those two build, superseding paralysis-of-analysis's old
        // STAGGER+BACKFIRE seat (same id slot, same 'mind' color).
        cardIds: recipe(
            'zenos-half-step', 'red-herring',
            'cassandras-burden', 'fallen-grace',
            'turnabout', 'hedgehogs-dilemma', 'mirror-of-longing',
        ),
    },
    augury: {
        id: 'augury',
        name: 'Augury',
        theme: 'oracle',
        focus: 'balanced',
        description: 'See the next move, declare it aloud, and collect on every prophecy that comes true.',
        // Colors 5/5/5: mind = glimpse×4 + prophecy | heart = signs×4 + eye |
        // body = arrow×2 + half-spoken×2 + crumbling.
        // Borrows: arrow-paradox (control, body — stagger/lock defense),
        // crumbling-resolve (bulwark, body dis).
        // 2026-07-19 promotion: half-spoken-prophecy (arm a3, RECOLORED
        // mind→body) evicts the self-flagellant borrow at the body uncommon
        // seat — the only augury candidate both win- and engagement-positive
        // (dot 0.217→0.295); its RUPTURE detonates glimpse's poison+mark
        // in-theme. Augury's mid ~0.00 breach remains structural.
        cardIds: recipe(
            'glimpse', 'signs-and-portents',
            'arrow-paradox', 'half-spoken-prophecy',
            'prophecy-fulfilled', 'the-oracles-eye', 'crumbling-resolve',
        ),
    },
    tithe: {
        id: 'tithe',
        name: 'Tithe',
        theme: 'harvest',
        focus: 'rush-execute',
        description: 'Plant short afflictions, harvest the Souls as they expire, and swing the scythe when the bank is full.',
        // Colors 5/5/5: body = candle×4 + reaping | heart = disarming×4 +
        // stuck | mind = gleaners×2 + circular×2 + orchard.
        // Borrows: disarming-smile (charm, heart — rapport softening),
        // circular-reasoning (echo, mind — REPRISE returns the reap payoffs
        // from the discard), stuck-in-their-head (echo, heart dis — drips on
        // circular's reprises).
        cardIds: recipe(
            'brief-candle', 'disarming-smile',
            'the-gleaners-due', 'circular-reasoning',
            'the-reaping', 'bone-orchard', 'stuck-in-their-head',
        ),
    },
    grace: {
        id: 'grace',
        name: 'Grace',
        theme: 'charm',
        // SWAY/RAPPORT cards classify as the control lever (they hinder and
        // soften the enemy); 'control' keeps the draft/sim-policy consumers
        // pointed at the deck's real texture.
        focus: 'control',
        description: 'The deck that never strikes: build SWAY past their resolve and win by capitulation — or mercy.',
        // Colors 5/5/5: heart = soft-word×4 + heart-of-the-matter | mind =
        // second-thoughts×4 + resonant-chamber | body = olive×2 +
        // grace-under-fire×2 + crumbling.
        // Borrows: second-thoughts (echo, mind — zero-damage draw/reprise
        // utility), resonant-chamber (echo, mind ench — see phase-39 note
        // below), crumbling-resolve (bulwark, body dis — NOTE: its
        // standing-wall drip deals HP, a documented dent in grace's
        // never-touches-HP purity, traded for survival).
        // 2026-07-19 promotion: grace-under-fire (arm g2) evicts the
        // measured-answer borrow at the body uncommon seat — in-theme
        // survival whose composure-under-fire converts to SWAY (early
        // 0.689→0.811, ON band). measured-answer remains a library/reward
        // card. The grace HP-purity direction ballot item stays open.
        // Phase 39 (2026-08-08) — owner-ruled identity seat: `heart-of-the-
        // matter` (charm's own SWAY finisher, restored §A) replaces the
        // `ouroboros` (echo) borrow at the rare-spell seat — grace's
        // capstone finally speaks charm's own vocabulary (SWAY+ECHO+heal)
        // instead of borrowing echo's MARK-detonation payoff it has no MARK
        // engine to feed (status-doctrine ruling, applied regardless of
        // win-rate delta; swap-sweep evidence in the phase-39 report).
        // Color-law fallout: heart-of-the-matter is `heart`, vacating
        // ouroboros's `mind` seat and overfilling `heart` to 6 — `heart`'s
        // OTHER single-copy seat, the enchantment (`irresistible-grace`,
        // charm's own, also `heart`), is the only lever that nets exactly ±1
        // without touching `body` (both commons fixed at 4 copies; both
        // uncommons already heart/body respectively).
        //
        // The compensating card is DELIBERATELY NOT `achilles-and-the-
        // tortoise` (control, mind, restored §A — the first pick): measured
        // A/B (full preset:grace, all stages × all policies, seed 1) showed
        // it net-REGRESSED grace (mid win 11%→5% aggregate) because it is
        // synergy-dead here (grace has zero STAGGER) while the card it would
        // evict, `irresistible-grace` (SWAY-never-decays + compounding), was
        // load-bearing for a SWAY-capitulation deck. `resonant-chamber`
        // (echo, mind, rank 5 ench — "your first spell each turn gains
        // ECHO", a GENERIC echo, not gated on the target card's own `echo`
        // mechanic; `combat.engine.ts`'s `chamberEcho`) is real, on-theme
        // synergy instead: it doubles whichever SWAY spell (soft-word / the-
        // olive-branch / grace-under-fire / heart-of-the-matter) leads the
        // turn — more SWAY, faster capitulation, the deck's actual win
        // condition. `irresistible-grace` still becomes reward-only
        // (precedented eviction, as with foundry's anvil-of-form) — no
        // better mind-aspect alternative reclaims its SWAY-compounding role,
        // so this is a real, reported loss, not a wash. No D8 valve
        // collateral (grace's valve seat replaces `soft-word`, not this
        // card). 5/5/5 check: heart = soft-word×4 (4) + heart-of-the-matter
        // (1) = 5; mind = second-thoughts×4 (4) + resonant-chamber (1) = 5;
        // body = olive×2 (2) + grace-under-fire×2 (2) + crumbling-resolve
        // (1) = 5.
        cardIds: recipe(
            'soft-word', 'second-thoughts',
            'the-olive-branch', 'grace-under-fire',
            'heart-of-the-matter', 'resonant-chamber', 'crumbling-resolve',
        ),
    },
    bastion: {
        id: 'bastion',
        name: 'Bastion',
        theme: 'bulwark',
        // Post-5/5/5 the deck's classifier-visible surface is genuinely mixed:
        // nettle/sketch read as dot chip, tu-quoque/adamant as defense,
        // common-ground as control, mirror-of-longing as an alt-win. The old
        // 'utility' label needed brace-for-impact's ×4 defend copies (now
        // seated in oratory); 'balanced' is the honest coarse label.
        focus: 'balanced',
        description: 'Thorns, riposte, and a stinging cloak — stand behind the wall and let their own aggression kill them.',
        // Colors 5/5/5: body = pebble×4 + anvil-speaks | mind = sketch×4 +
        // resonant | heart = tu-quoque×2 + common-ground×2 + mirror.
        // 2026-07-19 promotions: pebble-in-the-boot (arm b1) evicts
        // nettle-cloak at the x4 body common seat (mid 0.070→0.133);
        // the-anvil-speaks (arm b3) evicts the-adamant-wall at the rare body
        // spell seat (the never-swings answer). Both evicted cards remain
        // library/reward cards.
        // Borrows: sketch-of-a-thought (forge, mind — kindle + ember chip +
        // draw), common-ground (charm, heart — rapport softening),
        // resonant-chamber (echo, mind ench — first spell each turn echoes:
        // double guard/thorns), mirror-of-longing (charm, heart dis — THE
        // guard deck's prevented damage becomes SWAY, a real alt-win).
        // THORNS stays on the ×4 body common (nettle) so the reflect engine
        // ignites off the deck's dominant die color; brace-for-impact moves
        // to oratory's body slot (guard is utility-10 anywhere).
        // Thorns/riposte core (nettle, tu-quoque, adamant) stays home.
        cardIds: recipe(
            'pebble-in-the-boot', 'sketch-of-a-thought',
            'tu-quoque', 'common-ground',
            'the-anvil-speaks', 'resonant-chamber', 'mirror-of-longing',
        ),
    },
    refrain: {
        id: 'refrain',
        name: 'Refrain',
        theme: 'echo',
        focus: 'balanced',
        description: 'Nothing is said once: echo, reprise, replay — the tune they cannot stop hearing is yours.',
        // Colors 5/5/5: mind = refrain×4 + ouroboros | heart = opening×4 +
        // stuck | body = winnowing×2 + burden×2 + venom.
        // Borrows: opening-statement (peroration, heart — mark+poison for
        // ECHO to double), winnowing (harvest, body — cashes the echoed
        // DoTs), venom-and-vein (affliction, body ench — the echoed
        // poison lands harder). ECHO core (refrain, ouroboros, stuck) stays
        // home.
        // 2026-07-19 promotion: the-burden-of-repetition (arm r1, RECOLORED
        // heart→body) evicts the self-flagellant borrow at the body uncommon
        // seat — the strongest result of the measurement run (mid blind
        // 0.420→0.583, sE +0.068; purity gain: the akrasia borrow retires).
        // Watch item: winnowing's dominant-card share rose to ~0.90 behind
        // burden in the A/B — measured again in the promotion report; a
        // winnowing downtune is a separate A/B, not this change.
        cardIds: recipe(
            'refrain', 'opening-statement',
            'winnowing', 'the-burden-of-repetition',
            'ouroboros', 'venom-and-vein', 'stuck-in-their-head',
        ),
    },
};

/**
 * The documented cross-theme borrows of the 5/5/5 color law (spec 32 §12
 * item 9) — preset id → the borrowed off-theme card ids in its recipe.
 * Structural tests pin preset composition against exactly this map: a card
 * in a preset is either in-theme or listed here.
 */
export const PRESET_COLOR_BORROWS: Readonly<Record<string, readonly string[]>> = Object.freeze({
    erosion: ['opening-statement'],
    oratory: ['brace-for-impact', 'venom-and-vein', 'quagmire-of-doubt'],
    // Phase 39 (2026-08-08): foundry retires the mirror-of-longing (charm)
    // borrow — entropy-tax is forge's OWN disenchant (native, not a borrow)
    // — and picks up practiced-cadence (peroration) at the enchantment seat
    // (the color-law compensating shuffle; see the foundry preset comment).
    foundry: ['signs-and-portents', 'practiced-cadence'],
    penitent: ['undistributed-middle', 'delphic-ambiguity'],
    standstill: ['cassandras-burden', 'fallen-grace', 'hedgehogs-dilemma', 'mirror-of-longing'],
    // 2026-07-19 promotions: augury/grace/refrain each retired one borrow
    // (self-flagellant ×2 seats, measured-answer) for an in-theme promoted
    // card — the borrow maps shrink accordingly.
    augury: ['arrow-paradox', 'crumbling-resolve'],
    tithe: ['disarming-smile', 'circular-reasoning', 'stuck-in-their-head'],
    // Phase 39 (2026-08-08): grace retires the ouroboros (echo) borrow —
    // heart-of-the-matter is charm's OWN rare spell (native, not a borrow)
    // — and picks up a SECOND echo borrow, resonant-chamber, at the
    // enchantment seat (the color-law compensating shuffle, re-picked after
    // A/B showed the first candidate regressed the deck — see the grace
    // preset comment).
    grace: ['second-thoughts', 'resonant-chamber', 'crumbling-resolve'],
    bastion: ['sketch-of-a-thought', 'common-ground', 'resonant-chamber', 'mirror-of-longing'],
    refrain: ['opening-statement', 'winnowing', 'venom-and-vein'],
});

/** Stable display order for the deck-picker (spec §8 table order). */
export const COMBAT_DECK_PRESET_ORDER: readonly string[] = Object.freeze([
    'erosion', 'oratory', 'foundry', 'penitent', 'standstill',
    'augury', 'tithe', 'grace', 'bastion', 'refrain',
]);

/** All presets in display order. */
export function listDeckPresets(): CombatDeckPreset[] {
    return COMBAT_DECK_PRESET_ORDER
        .map(id => COMBAT_DECK_PRESETS[id])
        .filter((p): p is CombatDeckPreset => p !== undefined);
}

/** Looks up a preset by id (undefined when unknown). */
export function getDeckPreset(id: string): CombatDeckPreset | undefined {
    return COMBAT_DECK_PRESETS[id];
}

/** True when a card id resolves to a real card (presets carry only card-sourced cards). */
function isValidPresetCard(id: string): boolean {
    return !!getCardById(id);
}

/**
 * How a card enters the player's collection.
 * - `starter` — it lives in at least one preset deck (the decks a player can
 *   pick at the start); `presetDeck` names that deck.
 * - `reward`  — it is earned some other way (encounter reward, quest, drop).
 *
 * Today the rule is one-directional (starters come from presets; rewards do
 * not appear in presets), but that is NOT enforced — a card could in future be
 * BOTH a preset staple and a reward. This is a derived VIEW of the library, not
 * a gate.
 */
export type CardSource = 'starter' | 'reward';

/** A card's origin, DERIVED live from {@link COMBAT_DECK_PRESETS}. */
export interface CardOrigin {
    source: CardSource;
    /** The preset deck this card belongs to (only when `source === 'starter'`). */
    presetDeck?: string;
    /** The preset's stable id (only when `source === 'starter'`). */
    presetDeckId?: string;
}

/**
 * Computes a card's origin dynamically: a card in any preset's recipe is a
 * `starter` tagged with that preset; everything else is a `reward`. Because it
 * reads the presets at call time, adding a card to (or removing it from) a
 * preset re-tags it automatically — no per-card metadata to keep in sync.
 */
export function cardOrigin(cardId: string): CardOrigin {
    for (const id of COMBAT_DECK_PRESET_ORDER) {
        const preset = COMBAT_DECK_PRESETS[id];
        if (preset && preset.cardIds.includes(cardId)) {
            return { source: 'starter', presetDeck: preset.name, presetDeckId: preset.id };
        }
    }
    return { source: 'reward' };
}

// ── PHASE D8 — the flag-on dice-valve seats (spec 33 §4 valve 3) ────────────
// Under Upgradeable Dice every preset's BUILT deck is "14 inherited cards +
// one singleton valve": exactly one same-aspect card INSTANCE of `replacesId`
// is replaced by the theme's dice-interaction card. `cardIds` above stays the
// flag-off truth, byte-identical to pre-D8. Seats were ratified by the D8
// promotion court (plan/tuning/2026-07-18-d8-preset-dice-valves.md): per-seat
// A/B at early stage, blind+greedy, seeds 1-5, flag-on.

/** One preset's valve seat: the valve card and the flag-off source it replaces. */
export interface PresetDiceValveSeat {
    /** The promoted dice-interaction card (tagged `dice` + `valve`). */
    valveId: string;
    /** The flag-off card whose ONE instance the valve replaces (same aspect). */
    replacesId: string;
}

/** The ratified valve seat per preset (D8 court, 2026-07-18).
 *
 * 2026-07-19 promotion re-seats (forced by the seat evictions — the valve
 * law requires `replacesId` to be IN the flag-off recipe, same aspect):
 * erosion slippery-slope→poisoned-well (body, the mandate's named rider),
 * oratory exordium→videtur-quod (heart), bastion
 * the-adamant-wall→the-anvil-speaks (body). All three are same-aspect
 * like-for-like instance swaps, so the valve-law arithmetic (5/5/5, one
 * displaced instance) holds; flag-on cells re-ratified in
 * docs/reports/deck-tuning-2026-07-19-promotions.md.
 *
 * Phase 39 (2026-08-08) re-seat (forced by the foundry color-law
 * compensating shuffle — §B of the phase-39 brief evicted `anvil-of-form`
 * from foundry's recipe to make room for `practiced-cadence`'s heart seat):
 * foundry anvil-of-form→ex-nihilo (mind — the valve law only requires
 * matching `philosophicalAspect`, not `cardType`; ex-nihilo is still in the
 * foundry recipe post-swap). grace's valve seat (`change-of-heart`
 * replacing `soft-word`) is untouched by grace's own compensating shuffle —
 * soft-word never moved. */
export const PRESET_DICE_VALVES: Readonly<Record<string, PresetDiceValveSeat>> = Object.freeze({
    erosion: { valveId: 'recurring-symptom', replacesId: 'poisoned-well' },
    oratory: { valveId: 'restate-the-point', replacesId: 'videtur-quod' },
    foundry: { valveId: 'forge-masters-stamp', replacesId: 'ex-nihilo' },
    penitent: { valveId: 'bleed-for-it', replacesId: 'pact-of-akrasia' },
    standstill: { valveId: 'break-the-tempo', replacesId: 'red-herring' },
    augury: { valveId: 'second-sight', replacesId: 'prophecy-fulfilled' },
    tithe: { valveId: 'bank-the-yield', replacesId: 'stuck-in-their-head' },
    grace: { valveId: 'change-of-heart', replacesId: 'soft-word' },
    bastion: { valveId: 'hold-the-line', replacesId: 'the-anvil-speaks' },
    refrain: { valveId: 'second-take', replacesId: 'ouroboros' },
});

/** True when a card is a dice valve (tagged `dice` + `valve`). */
function isDiceValveCard(id: string): boolean {
    const tags = getCardById(id)?.tags ?? [];
    return tags.includes('dice') && tags.includes('valve');
}

/**
 * Derives a preset's Upgradeable-Dice deck: the flag-off recipe with exactly
 * one instance of the seat's `replacesId` swapped for its valve. Fails LOUDLY
 * (throws) on any structural-law violation — a silent fallback here would ship
 * a 14-card or valveless deck into live combat. Returns `[]` only for an
 * unknown preset id (mirroring {@link buildPresetDeck}).
 */
export function buildUpgradeableDicePresetDeck(
    presetId: string,
    seats: Readonly<Record<string, PresetDiceValveSeat>> = PRESET_DICE_VALVES,
): string[] {
    const preset = getDeckPreset(presetId);
    if (!preset) return [];
    const seat = seats[presetId];
    if (!seat) throw new Error(`D8 valve law: preset '${presetId}' has no valve seat.`);
    const valve = getCardById(seat.valveId);
    if (!valve) throw new Error(`D8 valve law: valve '${seat.valveId}' (${presetId}) is not a library card.`);
    const source = getCardById(seat.replacesId);
    if (!source) throw new Error(`D8 valve law: source '${seat.replacesId}' (${presetId}) is not a library card.`);
    if (valve.philosophicalAspect !== source.philosophicalAspect) {
        throw new Error(
            `D8 valve law: '${seat.valveId}' (${valve.philosophicalAspect}) must match `
            + `'${seat.replacesId}' (${source.philosophicalAspect}) — the 5/5/5 law would break.`,
        );
    }
    const idx = preset.cardIds.indexOf(seat.replacesId);
    if (idx < 0) throw new Error(`D8 valve law: '${seat.replacesId}' is not in preset '${presetId}'.`);
    if (preset.cardIds.some(isDiceValveCard)) {
        throw new Error(`D8 valve law: preset '${presetId}' flag-off recipe already carries a valve.`);
    }
    const deck = [...preset.cardIds];
    deck[idx] = seat.valveId;
    if (deck.length !== 15) {
        throw new Error(`D8 valve law: preset '${presetId}' derived deck is ${deck.length} cards, not 15.`);
    }
    return deck.filter(isValidPresetCard);
}

/**
 * Builds a ready-to-play deck from a preset: the curated cards (invalid ids
 * dropped). There is no escape-hatch card appended — once combat is joined it
 * resolves only by winning or losing (no in-combat retreat exists). Returns an
 * empty array for an unknown preset id (callers can fall back to `buildCombatDeck`).
 *
 * Flag-aware since Phase D8: under Upgradeable Dice the deck is derived by
 * {@link buildUpgradeableDicePresetDeck} (one same-aspect instance swapped for
 * the theme's dice valve); flag-off it is the byte-identical curated recipe.
 */
export function buildPresetDeck(presetId: string): string[] {
    if (isUpgradeableDiceEnabled()) return buildUpgradeableDicePresetDeck(presetId);
    const preset = getDeckPreset(presetId);
    if (!preset) return [];
    return preset.cardIds.filter(isValidPresetCard);
}
