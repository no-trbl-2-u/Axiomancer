/**
 * The combat card-detail overlay's SHAPE — owner findings 3, 5 and 6 (W3,
 * 2026-09-21).
 *
 * Finding 4 (the detail disagreeing with the card) is proved data-side by
 * `state/presenters/__tests__/card-detail-agreement.test.ts`. What is left is
 * structural, and structure is what this file pins:
 *
 * - **finding 6** — flavor prose is GONE from the combat overlay. The testID
 *   must not exist here. It is not deleted from the data: `CombatCardVM.flavor`
 *   still carries `card.description`, and the DECK screen renders it.
 * - **finding 5** — the keyword definitions render ABOVE the card face.
 * - **finding 3** — the three standing prose rows under the fork (the ▲/—/▼
 *   legend, the persistent duration footer, the colour-match hint) no longer
 *   render as rows. They survive as VM fields for the out-of-combat DECK
 *   screen; the combat overlay folds their content into the row each one
 *   qualifies.
 * - **D4** — the rarity band renders, from the wave-0 module.
 *
 * Reading the source is deliberate. Every claim above is about what the
 * overlay's JSX contains and in what order — mounting the whole encounter
 * panel to re-discover that would test the fixture, not the change.
 */

import { describe, expect, it } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { getCard, getCardById, cardLibrary } from '@mechanics';
import { detailStats } from '@/state/presenters/combat-encounter.engine';
import { RARITY_LABEL, RARITY_PIPS, rarityFor } from '@/state/presenters/card-rarity.engine';

const SOURCE = readFileSync(join(__dirname, '..', 'CombatEncounterPanel.tsx'), 'utf8');

/** The card-detail overlay's JSX, from its testID to the close button. */
function detailOverlaySource(): string {
    const start = SOURCE.indexOf('testID="combat-card-detail"');
    const end = SOURCE.indexOf('testID="combat-card-detail-close"');
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    return SOURCE.slice(start, end);
}

describe('combat card detail — overlay shape', () => {
    it('renders no flavor prose (finding 6)', () => {
        expect(SOURCE).not.toContain('combat-card-detail-flavor');
        expect(SOURCE).not.toContain('detailCard.flavor');
    });

    it('keeps the flavor DATA alive for the DECK screen to render', () => {
        const id = cardLibrary.find(c => !!c.description)?.id;
        expect(id).toBeDefined();
        expect(getCardById(id!)?.description).toBeTruthy();
    });

    it('renders keyword definitions above the card face (finding 5)', () => {
        const overlay = detailOverlaySource();
        const keywords = overlay.indexOf('detailCard.detail.keywords.map');
        const face = overlay.indexOf('<CombatCardFace');
        expect(keywords).toBeGreaterThan(-1);
        expect(face).toBeGreaterThan(-1);
        expect(keywords).toBeLessThan(face);
    });

    it('spends no row on the three folded prose footers (finding 3)', () => {
        const overlay = detailOverlaySource();
        for (const field of ['detail.readLegend', 'detail.durationFooter', 'detail.colorMatchHint']) {
            expect(overlay).not.toContain(`detailCard.${field}`);
        }
        // The facts themselves did not go away — they ride the rows they qualify.
        expect(overlay).toContain('detailCard.detail.freeTag');
        expect(overlay).toContain('detailCard.detail.paidTag');
    });

    it('renders the rarity band (D4)', () => {
        const overlay = detailOverlaySource();
        expect(overlay).toContain('combat-card-detail-rarity');
        expect(overlay).toContain('detailCard.detail.rarityPips');
        expect(overlay).toContain('detailCard.detail.rarityColor');
        // Never colour alone: the named band is in the meta strip beside it.
        expect(overlay).toContain('detailCard.detail.rarityLabel');
    });

    it('renders the FULL paid line as the ◆ row', () => {
        const overlay = detailOverlaySource();
        expect(overlay).toContain('detailCard.detail.diePaidLine');
        // The `?? outcomeLine` fallback stays as a defensive tail, but it is
        // unreachable for a card that authors any payload — proved over the
        // whole library by `card-detail-agreement.test.ts`.
    });
});

describe('combat card detail — the VM behind the shape', () => {
    function detailFor(id: string) {
        const projected = getCard(id);
        const authored = getCardById(id);
        expect(projected).toBeTruthy();
        return detailStats(projected!, authored);
    }

    it('takes its rarity band from the wave-0 module, never a local re-band', () => {
        for (const authored of cardLibrary) {
            const d = detailFor(authored.id);
            const band = rarityFor(authored);
            expect(d.rarityLabel).toBe(RARITY_LABEL[band]);
            expect(d.rarityPips).toBe(RARITY_PIPS[band]);
            expect(d.metaChip).toContain(RARITY_LABEL[band].toUpperCase());
        }
    });

    it('folds the colour law into the ◆ tag on a spell', () => {
        const d = detailFor('spoiled-poultice');
        expect(d.freeTag).toBe('NO DIE');
        expect(d.paidTag).toBe('+DIE · BODY/WILD');
    });

    it('folds the persistent free-vs-paid duration into the ◇/◆ tags', () => {
        const oath = cardLibrary.find(c => c.cardType === 'oath' || c.cardType === 'hex');
        expect(oath).toBeDefined();
        const d = detailFor(oath!.id);
        expect(d.freeTag).toMatch(/^NO DIE · \d+ rounds?$/);
        expect(d.paidTag).toBe('+DIE · rest of combat');
    });

    it('a persistent card states its passive on the ◆ row, not just its duration', () => {
        // The old overlay printed 'FREE: yours for 3 rounds. PAID: rest of
        // combat.' there — a row about the CLOCK that never said what the oath
        // or hex actually does.
        for (const authored of cardLibrary) {
            if (authored.cardType !== 'oath' && authored.cardType !== 'hex') continue;
            const d = detailFor(authored.id);
            expect(d.diePaidLine).toBeTruthy();
            expect(d.diePaidLine).not.toMatch(/^FREE:/);
        }
    });
});
