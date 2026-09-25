/**
 * Round-trip fidelity for the card editor (phase 69).
 *
 * The claim under test: saving an existing card through the editor changes
 * nothing except what the user edited. It was false — `CardDraft` carried 19
 * of the `Card` type's 24 fields, so an upsert silently deleted `theme`,
 * `persistentEffect`, `paidSummary`, `intentionallyAsymmetric` and `glyph`
 * (the last cut with GLYPHS, trim T5 2026-09-25),
 * and the codegen dropped the `// pts:` pricing arithmetic (content-pipelines
 * audit, 2026-08-22).
 *
 * "Equal" here means SEMANTICALLY equal, not byte-identical: `serialize` emits
 * one canonical field order and the hand-authored library does not follow one,
 * so the test parses the emitted literal back to an object and compares data.
 * That is the property that matters — no field is lost or altered.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { cardLibrary } from '@mechanics/Cards/cards.library';
import type { Card } from '@mechanics/Cards/types';

import { toDraft, fromDraft } from '../../types';
import { pricingComment, serialize, upsertCard } from '../cardCodegen';

/**
 * Evaluate an emitted `const <ident>: Card = { … };` block back into an object.
 * The block is pure data (strings, numbers, booleans, arrays, objects, and the
 * `'a ' + 'b'` description concatenation), so a Function-body evaluation is a
 * parser here, not an execution risk.
 */
function parseBlock(block: string): Card {
    const open = block.indexOf('{');
    const literal = block.slice(open).replace(/;\s*$/, '');
    return new Function(`return ${literal};`)() as Card;
}

const roundTrip = (card: Card): Card => parseBlock(serialize(toDraft(card)));

/** A card as a plain, key-ordered record — so comparisons are about DATA, not
 *  about the order `fromDraft` / `serialize` happen to build their objects in. */
const asData = (card: unknown): Record<string, unknown> =>
    Object.fromEntries(
        Object.entries(card as Record<string, unknown>)
            .filter(([, v]) => v !== undefined)
            .sort(([a], [b]) => a.localeCompare(b)),
    );

describe('CardDraft carries every Card field', () => {
    it('the library is non-empty (the sweep below is not vacuous)', () => {
        expect(cardLibrary.length).toBeGreaterThan(40);
    });

    it('toDraft -> fromDraft preserves every card exactly', () => {
        for (const card of cardLibrary) {
            expect(asData(fromDraft(toDraft(card))), card.id).toEqual(asData(card));
        }
    });

    it('toDraft -> serialize -> parse preserves every card exactly', () => {
        for (const card of cardLibrary) {
            expect(asData(roundTrip(card)), card.id).toEqual(asData(card));
        }
    });

    /**
     * The fields the editor used to drop, asserted one by one so a regression
     * names the field rather than just "some card broke".
     */
    it.each(['theme', 'persistentEffect', 'paidSummary', 'intentionallyAsymmetric'])(
        '%s survives the round trip on every live carrier',
        (field) => {
            const carriers = cardLibrary.filter(
                (c) => (c as unknown as Record<string, unknown>)[field] != null,
            );
            expect(carriers.length, `no live card carries ${field}`).toBeGreaterThan(0);
            for (const card of carriers) {
                const back = roundTrip(card) as unknown as Record<string, unknown>;
                expect(back[field], `${card.id} lost ${field}`)
                    .toEqual((card as unknown as Record<string, unknown>)[field]);
            }
        },
    );

    it('synergy survives in full, including statePredicate and rider', () => {
        // The allowlist-shaped emitter dropped these two: a hand-written list of
        // known synergy keys silently lost every key added after it was written.
        const carriers = cardLibrary.filter((c) => c.synergy != null);
        expect(carriers.length).toBeGreaterThan(0);
        for (const card of carriers) {
            expect(roundTrip(card).synergy, `${card.id} lost synergy detail`)
                .toEqual(card.synergy);
        }
    });
});

describe('the pricing comment survives a rewrite', () => {
    // The real source text — the same bytes the editor's write-back splices.
    // THE BIG NUMBERS REWRITE (2026-09-02): the library is a directory of
    // per-theme modules; `cards.library.ts` is only the aggregator and holds no
    // card literals. The write-back splices these bytes, so this is what the
    // pricing-comment guard has to read.
    const libraryDir = fileURLToPath(
        new URL('../../../../axiomancer-mechanics/src/Cards/library/', import.meta.url),
    );
    const libraryText = readdirSync(libraryDir)
        .filter(f => f.endsWith('.cards.ts'))
        .sort()
        .map(f => readFileSync(join(libraryDir, f), 'utf-8'))
        .join('\n');

    it('the library source was actually loaded', () => {
        expect(libraryText.length).toBeGreaterThan(1000);
        expect(libraryText).toContain('// pts:');
    });

    it('extracts the contiguous // pts: run and nothing else', () => {
        const block = [
            'const x: Card = {',
            "    paidSummary: 'a',",
            '    // pts: 1 + 2',
            '    // = 3 -> Ash.',
            "    free: { sway: 1 },",
            '};',
        ].join('\n');
        expect(pricingComment(block)).toEqual(['    // pts: 1 + 2', '    // = 3 -> Ash.']);
        expect(pricingComment('const y: Card = {\n    id: \'y\',\n};')).toEqual([]);
    });

    it("an unedited upsert keeps every priced card's arithmetic", () => {
        const priced = cardLibrary.filter((c) => {
            const start = libraryText.indexOf(`id: '${c.id}'`);
            return start !== -1 && /\/\/\s*pts:/.test(libraryText.slice(Math.max(0, start - 400), start + 1200));
        });
        expect(priced.length, 'no priced cards found to test').toBeGreaterThan(10);

        for (const card of priced) {
            const before = pricingComment(cardBlockOf(libraryText, card.id));
            if (!before.length) continue;
            const after = pricingComment(cardBlockOf(upsertCard(libraryText, toDraft(card)), card.id));
            expect(after.map((l) => l.trim()), `${card.id} lost its pricing comment`)
                .toEqual(before.map((l) => l.trim()));
        }
    });
});

/** The `const … : Card = { … };` block for `id`, as source text. */
function cardBlockOf(text: string, id: string): string {
    const marker = text.indexOf(`id: '${id}'`);
    if (marker === -1) return '';
    const start = text.lastIndexOf('const ', marker);
    const end = text.indexOf('\n};', marker);
    return start === -1 || end === -1 ? '' : text.slice(start, end + 3);
}
