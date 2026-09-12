/**
 * FE-002 — no engine identifier may reach the player.
 *
 * The walked build printed `quest: starting-quest` as a dialogue consequence
 * chip and headlined the ERRANDS journal entry `starting-quest`. These guards
 * pin both the resolver and the two consequence branches that leaked.
 */

import { cardTitle, humanizeEngineId, isEngineSlug, questTitle } from '../engine-id-copy';
import { consequenceLabel, visibleConsequences } from '../consequence-copy';
import type { EventConsequence } from '../event.engine';

/**
 * A slug is a lowercase word joined to another by `-` or `_`
 * (`starting-quest`, `shrine_keeper_met`). Deliberately narrower than "any
 * hyphen": a legitimate label may carry a minus sign (`-1 grace`) or an
 * en-dash, and neither is an identifier leak.
 */
const looksLikeSlug = (s: string) => /[a-z0-9]+[-_][a-z0-9]+/.test(s);

describe('engine-id-copy', () => {
    it('gives the walked quest an authored title, not its slug', () => {
        expect(questTitle('starting-quest')).toBe('The King of Revenge');
        expect(looksLikeSlug(questTitle('starting-quest'))).toBe(false);
    });

    it('titles every quest-log id in the engine union', () => {
        const ids = [
            'starting-quest', 'get-to-forest', 'gather-wood', 'get-to-cave',
            'gather-iron', 'get-to-northern-city', 'find-blacksmith', 'build-boat',
            'kill-some-time', 'get-to-connecting-river', 'find-islanders',
            'join-islanders-for-ritual', 'get-to-town-across-river', 'get-to-the-capital',
        ];
        for (const id of ids) {
            const title = questTitle(id);
            expect(title.length).toBeGreaterThan(0);
            expect(looksLikeSlug(title)).toBe(false);
        }
    });

    it('humanizes an unknown id rather than echoing it', () => {
        expect(questTitle('some-future-quest')).toBe('Some Future Quest');
        expect(humanizeEngineId('shrine_keeper_recognizes_seeker')).toBe('Shrine Keeper Recognizes Seeker');
    });

    it('passes authored text through untouched', () => {
        // Fixtures and future content may put a readable name where the
        // engine normally puts a slug; title-casing it would damage it.
        expect(questTitle('Tend the Hearth')).toBe('Tend the Hearth');
        expect(cardTitle('Rusty Key')).toBe('Rusty Key');
    });

    it('returns empty for empty input so callers can drop the row', () => {
        expect(questTitle('')).toBe('');
        expect(cardTitle('')).toBe('');
        expect(humanizeEngineId('')).toBe('');
    });

    it('recognises slug shape but not authored text', () => {
        expect(isEngineSlug('starting-quest')).toBe(true);
        expect(isEngineSlug('shrine_keeper_met')).toBe(true);
        expect(isEngineSlug('Tend the Hearth')).toBe(false);
        expect(isEngineSlug('capital')).toBe(false);
    });

    it('never returns a slug for an unknown card id', () => {
        expect(looksLikeSlug(cardTitle('no-such-card-id'))).toBe(false);
    });
});

describe('consequenceLabel (FE-002 branches)', () => {
    const q = (kind: EventConsequence['kind'], label?: string, amount?: number) =>
        ({ kind, label, amount }) as EventConsequence;

    it('names the errand instead of printing the quest slug', () => {
        expect(consequenceLabel(q('quest-start', 'starting-quest')))
            .toBe('new errand · The King of Revenge');
        expect(consequenceLabel(q('quest-progress', 'get-to-forest')))
            .toBe('errand · The Coast Road North');
    });

    it('draws no chip for a story flag', () => {
        expect(consequenceLabel(q('flag', 'shrine_keeper_recognizes_seeker'))).toBe('');
    });

    it('uses the canon VITAE word, never HP', () => {
        expect(consequenceLabel(q('damage', undefined, 5))).toBe('-5 VITAE');
        expect(consequenceLabel(q('heal', undefined, 5))).toBe('+5 VITAE');
    });

    it('keeps the currency and grace branches unchanged', () => {
        expect(consequenceLabel(q('currency', undefined, 1))).toBe('+1 shilling');
        expect(consequenceLabel(q('currency', undefined, 4))).toBe('+4 shillings');
        expect(consequenceLabel(q('moral', undefined, 2))).toBe('+2 grace');
    });

    it('no labelled consequence leaks a slug', () => {
        const all: EventConsequence[] = [
            q('quest-start', 'starting-quest'),
            q('quest-progress', 'join-islanders-for-ritual'),
            q('card-learn', 'thin-hymn'),
            q('flag', 'chronicler_met'),
            q('currency', undefined, 3),
            q('moral', undefined, -1),
        ];
        for (const c of all) {
            const label = consequenceLabel(c);
            if (label === '') continue;
            expect(looksLikeSlug(label)).toBe(false);
        }
    });
});

describe('visibleConsequences', () => {
    it('filters the unlabelled rows so the overflow count stays honest', () => {
        const list: EventConsequence[] = [
            { kind: 'flag', label: 'chronicler_met' } as EventConsequence,
            { kind: 'moral', amount: 2 } as EventConsequence,
            { kind: 'flag', label: 'chronicle_contributor' } as EventConsequence,
        ];
        const visible = visibleConsequences(list);
        expect(visible).toHaveLength(1);
        expect(consequenceLabel(visible[0])).toBe('+2 grace');
    });

    it('does not mutate its input', () => {
        const list: EventConsequence[] = [{ kind: 'flag', label: 'x' } as EventConsequence];
        visibleConsequences(list);
        expect(list).toHaveLength(1);
    });
});
