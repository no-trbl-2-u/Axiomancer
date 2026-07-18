import { describe, expect, it } from 'vitest';
import { getCardById } from '../../Cards/cards.library';
import { lookupEffect } from '../../Effects';
import { toCombatCard } from '../combat.cards';
import { buildPresetDeck } from '../combat.starter-deck-presets';

/** Unique card ids of the LIVE Grace preset deck, derived from the preset
 *  source itself rather than a hand-copied list (the old literal list had
 *  drifted — it carried heart-of-the-matter, which grace's preset never
 *  contained and which was retired in D8, see
 *  plan/tuning/2026-07-18-d8-preset-dice-valves.md). `buildPresetDeck` is
 *  flag-aware: under Upgradeable Dice (forced ON since THE FLIP) the deck
 *  carries change-of-heart in the valve seat, so its projection is covered
 *  here too. */
const GRACE_CARD_IDS = [...new Set(buildPresetDeck('grace'))];

function face(cardId: string): string {
    const card = toCombatCard(cardId, getCardById, lookupEffect);
    expect(card, `${cardId} must project`).not.toBeNull();
    return `${card!.topActionText}\n${card!.bottomActionText}`;
}

describe('Grace preset card wording', () => {
    it('projects every unique Grace card', () => {
        expect(GRACE_CARD_IDS.length).toBeGreaterThan(0);
        for (const cardId of GRACE_CARD_IDS) {
            expect(toCombatCard(cardId, getCardById, lookupEffect), cardId).not.toBeNull();
        }
    });

    it('Soft Word states its SWAY gain and its RAPPORT duration', () => {
        const text = face('soft-word');
        expect(text).toContain('rapport i1 d2');
        expect(text).toContain('SWAY 3');
    });

    it('Second Thoughts states its discard, RECALL, and MARK payoff', () => {
        const text = face('second-thoughts');
        expect(text).toContain('mill 1 to discard');
        expect(text).toContain('RECALL 1');
        // 2026-07-16 — authored paidSummary (same real units, prose form).
        expect(text).toContain("consume the foe's MARK stacks — 1 damage per stack");
    });

    it('The Olive Branch states every defensive and persuasion effect', () => {
        const text = face('the-olive-branch');
        expect(text).toContain('rapport i1 d2');
        expect(text).toContain('SWAY 3');
        // 2026-07-16 — authored paidSummary (same real units, prose form).
        expect(text).toContain('CLEANSE 1');
        expect(text).toContain('HEAL 3');
    });

    it('Disarming Smile states its SWAY, RAPPORT, and healing', () => {
        const text = face('disarming-smile');
        expect(text).toContain('SWAY 1');
        // 2026-07-16 — authored paidSummary (same real units, prose form).
        expect(text).toContain('RAPPORT 2 for 2 turns');
        expect(text).toContain('HEAL 2');
    });

    it('Common Ground states its draw, RAPPORT, and both SWAY gains', () => {
        const text = face('common-ground');
        expect(text).toContain('draw 1');
        expect(text).toContain('rapport i1 d2');
        expect(text).toContain('SWAY 2');
        expect(text).toContain('HEART ×3 spent: SWAY 2');
    });

    // (The "Heart of the Matter states ECHO, healing, and its threshold"
    //  wording test was deleted when the card was retired in Phase D8 —
    //  ten-in/ten-out ledger in plan/tuning/2026-07-18-d8-preset-dice-valves.md.
    //  change-of-heart, the charm valve that replaced it in the flag-on grace
    //  deck, is projection-covered by "projects every unique Grace card" above.)

    it('Measured Answer states persistent GUARD and the complete RIPOSTE', () => {
        const text = face('measured-answer');
        expect(text).toContain('GUARD 3 (persists)');
        // 2026-07-16 — authored paidSummary (same real units, prose form).
        expect(text).toContain('GUARD 6');
        expect(text).toContain('RIPOSTE 3 with parry 2');
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
        // 2026-07-16 — authored paidSummary (same real units, prose form).
        expect(text).toContain('Replay your last spell ×2');
        expect(text).toContain("consume the foe's MARK stacks — 3 damage per stack");
    });

    it('Crumbling Resolve names its clock, damage floor, and STAGGER amount', () => {
        const text = face('crumbling-resolve');
        expect(text).toContain('After each threat phase');
        expect(text).toContain('20% of your remaining GUARD (minimum 4)');
        expect(text).toContain('STAGGERs the next telegraph by 1');
        expect(text).toContain('Attaches to the enemy');
    });
});
