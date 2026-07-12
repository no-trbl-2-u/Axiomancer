/** Scratch probe — is `ingot-of-ruin` structurally draftable at late? */
import { applySandboxSet } from '../../../src/Cards/cards.sandbox-sets';
import { getStageProfile, stageEligibleCardIds } from '../../../src/Combat/combat.stage-profiles';
import { draftCombatDeck } from '../../../src/Combat/combat.deck-draft';

const set = applySandboxSet('roles-forge')!;
const late = getStageProfile('late')!;
const ids = stageEligibleCardIds(late, set.cards);
console.log('late pool size:', ids.length, 'has ingot:', ids.includes('ingot-of-ruin'), 'has slag:', ids.includes('slag-runoff'));

function mulberry32(a: number) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const counts: Record<string, number> = {};
const focuses = ['utility', 'balanced', 'dot', 'control', 'damage', 'rush-execute'] as const;
for (const focus of focuses) {
    const local: Record<string, number> = {};
    for (let s = 0; s < 200; s++) {
        const deck: any = draftCombatDeck({ focus, size: 10, stage: late, rng: mulberry32(s * 7 + 1), extraCards: set.cards } as any);
        const list: any[] = deck.cardIds ?? deck.cards ?? deck;
        for (const c of list) {
            const id = typeof c === 'string' ? c : c.id;
            local[id] = (local[id] ?? 0) + 1;
            counts[id] = (counts[id] ?? 0) + 1;
        }
    }
    console.log(`focus=${focus}: ingot=${local['ingot-of-ruin'] ?? 0} slag=${local['slag-runoff'] ?? 0} (200 late drafts)`);
}
console.log('TOTAL ingot:', counts['ingot-of-ruin'] ?? 0, 'slag:', counts['slag-runoff'] ?? 0);
