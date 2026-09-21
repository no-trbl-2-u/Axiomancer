/**
 * THE CARD LIBRARY — the aggregator (THE BIG NUMBERS REWRITE, 2026-09-02).
 *
 * Solo, dark-fantasy, PvE. 134 cards (count pins repealed 2026-09-02 — this
 * total drifts as `/adjust-cards` ships CREATEs, or as sibling `adjust-*`
 * passes / build phases author cards on this surface (e.g. `/adjust-keywords`'
 * EVENTIDE pair, pass 11, 2026-09-16, its FORGE-carrier grave pair — The
 * Unpaid Sexton / It Gets Up Again — pass 13, 2026-09-19, and Phase 104's
 * two grey-office starters, 2026-09-20); read `cardLibrary.length` for the
 * live figure, never trust this comment as a source of truth): 8 starters
 * (the deliberately weak Threadbare Office, the campaign-preset lineage's
 * starting recipe), 2 grey-office starters (Phase 104's colourless,
 * even-weaker-on-purpose fresh-run seed — aspect `'any'`, no archetype
 * keywords, never a reward), 3 dice-valve relics, 5 enemy-injected curses,
 * twelve Saint-rank apocrypha (two per theme), and six theme modules
 * (16-20 cards each). The cards themselves live in `./library/*.cards.ts` —
 * one module per theme, so a theme can be reworked without touching the
 * other five, and so the six decks read as six decks.
 * This file only assembles and indexes them.
 *
 *   rot   — the Blight: plant POISON/BLEED, PROLONG and FESTER them, FLAY the
 *           foe open, then detonate with RUPTURE and drink it back with SIPHON.
 *   debt  — the Reckoning: power bought in blood — RECOIL, chosen-X prices,
 *           FALLEN payoffs, WRATH compounding out of every cost you pay.
 *   grave — the Exhumation: MILL yourself, RECALL and REPLAY the dead, TWIN
 *           the best card you own, REQUIEM gates, IMMOLATE the unworthy.
 *   vigil — the Cold Watch: GUARD/BARRIER walls, THORNS and RIPOSTE, payoffs
 *           for bloodless nights; winter itself as the clock.
 *   trial — the Indictment: CHARGE toward the declared verdict (the CONDEMN
 *           alt-win), STAGGER objections, BACKFIRE contempt, AMBUSH and FLOW.
 *   choir — the Pale Choir: PLEA toward RELENT, QUARTER, SOULs harvested from
 *           expiring afflictions, REAP to spend the whole collection at once.
 *
 * THE THREE SURVIVING CONSTRAINTS (everything else was repealed 2026-09-02 —
 * see `plan/2026-09-02-big-numbers-overhaul.prompt.md` §2/§3):
 *   1. A preset deck is split into EXACT aspect thirds (the 5/5/5 colour law).
 *   2. Every card is playable without a die: a spell authors a non-empty
 *      `free`, an oath/hex gets an engine-derived timed FREE instance.
 *   3. One tray roll per threat phase (a bug fix, not a design law).
 *
 * There is no rank band, no pricing gate, no win-rate curve and no governing
 * objective function. Numbers are authored against the scale ladder in the
 * overhaul prompt §5 and judged by playing the game.
 *
 * Direct damage is a first-class verb again (DEAL): the strike-ban doctrine
 * that deleted `basePower` is repealed. Enemy VITAE falls to any authored mix
 * of hits, DoT ticks, affliction payoffs, engine drips and reflect.
 *
 * DOOM prints without a duration: `debuff_creeping_doom` carries no calendar
 * (it grows each time the foe acts, and ends only by consumption or combat
 * end), so a printed turn-count would be a lie (the P0-truth rule).
 *
 * This file is data-only. All runtime behaviour lives in
 * `src/Cards/card.engine.ts` and `src/Combat/combat.engine.ts`.
 */

import { Card } from './types';
import { bindSandboxLibraryGuard, getSandboxCard } from './cards.sandbox';
import { getHauntById } from './cards.haunts';
import { getAllyById } from './cards.allies';
import { getUpgradedCardById, isUpgradedCardId } from './card-upgrades';
import { STARTER_CARDS, CURSE_CARDS, GREY_OFFICE_CARDS } from './library/starters.cards';
import { RELIC_CARDS } from './library/relics.cards';
import { ROT_CARDS } from './library/rot.cards';
import { DEBT_CARDS } from './library/debt.cards';
import { GRAVE_CARDS } from './library/grave.cards';
import { VIGIL_CARDS } from './library/vigil.cards';
import { TRIAL_CARDS } from './library/trial.cards';
import { CHOIR_CARDS } from './library/choir.cards';
import { APOCRYPHA_CARDS } from './library/apocrypha.cards';

export const cardLibrary: Card[] = [
    ...STARTER_CARDS,
    ...GREY_OFFICE_CARDS,
    ...RELIC_CARDS,
    ...CURSE_CARDS,
    ...ROT_CARDS,
    ...DEBT_CARDS,
    ...GRAVE_CARDS,
    ...VIGIL_CARDS,
    ...TRIAL_CARDS,
    ...CHOIR_CARDS,
    ...APOCRYPHA_CARDS,
];

const registry = new Map<string, Card>(cardLibrary.map(card => [card.id, card]));

// Sandbox integration: experimental cards / overrides (loaded via --sandbox)
// take precedence over the curated library at lookup time.
bindSandboxLibraryGuard(id => registry.get(id));

/** O(1) lookup by card id; sandbox-aware. Chain (WS2.1, extended phase 62):
 *  sandbox first (so experiments can shadow anything), then the Haunt
 *  registry (CONJURE targets — real cards, deliberately outside the pinned
 *  library), then the Ally registry (village-goodwill grants — also
 *  deliberately outside the pinned library), then the curated library. */
export function getCardById(id: string): Card | undefined {
    const direct = getSandboxCard(id) ?? getHauntById(id) ?? getAllyById(id) ?? registry.get(id);
    if (direct) return direct;
    // THE PATH — card upgrades (Slay the Spire's model). An upgraded copy sits
    // in a deck as a plain id string, `some-card+`, and resolves here by
    // upgrading its base on demand. Last in the chain so nothing else changes
    // and a literal `+` card in any registry above still wins.
    // Guarded on the suffix: without it an unknown `foo` would bounce between
    // this function and the resolver forever (baseCardId('foo') === 'foo').
    return isUpgradedCardId(id) ? getUpgradedCardById(id) : undefined;
}
