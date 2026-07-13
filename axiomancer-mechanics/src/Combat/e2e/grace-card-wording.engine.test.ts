import { describe, expect, it } from 'vitest';
import { getCardById } from '../../Cards/cards.library';
import { lookupEffect } from '../../Effects';
import { toCombatCard } from '../combat.cards';

const GRACE_CARD_IDS = [
    'soft-word',
    'disarming-smile',
    'common-ground',
    'second-thoughts',
    'the-olive-branch',
    'measured-answer',
    'heart-of-the-matter',
    'irresistible-grace',
    'mirror-of-longing',
    'ouroboros',
    'crumbling-resolve',
] as const;

function face(cardId: string): string {
    const card = toCombatCard(cardId, getCardById, lookupEffect);
    expect(card, `${cardId} must project`).not.toBeNull();
    return `${card!.topActionText}\n${card!.bottomActionText}`;
}

describe('Grace preset card wording', () => {
    it('projects every unique Grace card', () => {
        for (const cardId of GRACE_CARD_IDS) {
            expect(toCombatCard(cardId, getCardById, lookupEffect), cardId).not.toBeNull();
        }
    });

    it('Soft Word states both SWAY gains and its RAPPORT duration', () => {
        const text = face('soft-word');
        expect(text).toContain('rapport i1 d2');
        expect(text).toContain('SWAY 3');
        expect(text).toContain('HEART die: SWAY 1');
    });

    it('Second Thoughts states its discard, RECALL, and MARK payoff', () => {
        const text = face('second-thoughts');
        expect(text).toContain('mill 1 to discard');
        expect(text).toContain('RECALL 1');
        expect(text).toContain('consume all marks — 1 damage per stack');
    });

    it('The Olive Branch states every defensive and persuasion effect', () => {
        const text = face('the-olive-branch');
        expect(text).toContain('rapport i1 d2');
        expect(text).toContain('SWAY 3');
        expect(text).toContain('cleanse 1');
        expect(text).toContain('heal 3');
    });

    it('Disarming Smile states its SWAY, RAPPORT, and healing', () => {
        const text = face('disarming-smile');
        expect(text).toContain('SWAY 1');
        expect(text).toContain('rapport i2 d2');
        expect(text).toContain('heal 2');
    });

    it('Common Ground states its draw, RAPPORT, and both SWAY gains', () => {
        const text = face('common-ground');
        expect(text).toContain('draw 1');
        expect(text).toContain('rapport i1 d2');
        expect(text).toContain('SWAY 2');
        expect(text).toContain('HEART ×3 spent: SWAY 2');
    });

    it('Heart of the Matter states ECHO, healing, and its threshold', () => {
        const text = face('heart-of-the-matter');
        expect(text).toContain('SWAY 1');
        expect(text).toContain('SWAY 6');
        expect(text).toContain('ECHO');
        expect(text).toContain('heal 4');
        expect(text).toContain('HEART ×5 spent: SWAY 4');
    });

    it('Measured Answer states persistent GUARD and the complete RIPOSTE', () => {
        const text = face('measured-answer');
        expect(text).toContain('GUARD 3 (persists)');
        expect(text).toContain('Guard 6');
        expect(text).toContain('RIPOSTE 3 (parry 2)');
    });

    it('Irresistible Grace states duration, decay prevention, scaling, and cap', () => {
        const text = face('irresistible-grace');
        expect(text).toContain('FREE (3 rounds)');
        expect(text).toContain('PAID (rest of combat)');
        expect(text).toContain('SWAY does not decay');
        expect(text).toContain('At the end of each turn');
        expect(text).toContain('increase by 12% (maximum +108%)');
    });

    it('Mirror of Longing states its prevented-damage conversion plainly', () => {
        const text = face('mirror-of-longing');
        expect(text).toContain('Damage prevented by your GUARD or RIPOSTE becomes SWAY, 1:1');
        expect(text).toContain('Attaches to the enemy');
    });

    it('Ouroboros states both the repeated spell and its MARK payoff', () => {
        const text = face('ouroboros');
        expect(text).toContain('mill 1 to discard');
        expect(text).toContain('replay your last spell ×2');
        expect(text).toContain('consume all marks — 3 damage per stack');
    });

    it('Crumbling Resolve names its clock, damage floor, and STAGGER amount', () => {
        const text = face('crumbling-resolve');
        expect(text).toContain('After each threat phase');
        expect(text).toContain('20% of your remaining GUARD (minimum 4)');
        expect(text).toContain('STAGGERs the next telegraph by 1');
        expect(text).toContain('Attaches to the enemy');
    });
});
