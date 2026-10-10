/**
 * BLOOD PRICE — the 90 rehearsal-ballot proposals as SANDBOX cards
 * (branch sandbox/blood-price-sims only; never library content).
 *
 * Source: plan/card-ledger/rehearsal-blood-price.ballot.html (the CARDS
 * array). Every number is the ballot's printed number; the deck-tuning loop
 * scales them at resolution (`setBloodPriceTuning`), never here. Ids are
 * `bp-<proposal>` (e.g. `bp-P-01a`). The grey Curse (`bp-curse`) is the
 * first Curse from plan/revamp/cards.md, used wherever a card adds a Curse.
 *
 * Colour = what the PAID line's main effect scales with (colour only gates
 * the PAID die): damage to the foe = body (red), anything on the player
 * (GUARD, HEAL, Conviction, SACRIFICE, Curse handling) = mind (blue), a status
 * on the foe other than damage = heart (purple).
 *
 * Register with `registerBloodPriceCards()`; the sim CLI is the only caller.
 * THE CARD HOLD (D37) stands.
 */

import type { Card, CardAspect, CardType } from '../types';
import type { BloodPriceSpec, BpCtx, BpGlobalTrigger, BpLine, BpQuery } from '../blood-price.types';
import { registerSandboxCards } from '../cards.sandbox';
import { getCardById } from '../cards.library';

const L = (text: string, run: (c: BpCtx) => void, extra?: Partial<BpLine>): BpLine => ({ text, run, ...extra });
const atHalf = (q: BpQuery): boolean => q.atHalf;
const atThird = (q: BpQuery): boolean => q.atThird;
const curseInHand = (q: BpQuery): boolean => q.cursesInHand > 0;
const curseInDiscard = (q: BpQuery): boolean => q.cursesInDiscard > 0;

const RED: CardAspect = 'body';
const BLUE: CardAspect = 'mind';
const PURPLE: CardAspect = 'heart';

interface Proposal {
    id: string;
    type: CardType;
    color: CardAspect;
    reason: string;
    free?: BpLine;
    paid?: BpLine;
    global?: {
        trigger: BpGlobalTrigger; text: string; paidDelta?: string;
        free: (c: BpCtx, n: number) => void; paid: (c: BpCtx, n: number) => void;
    };
}

const P: Proposal[] = [
    // ── PAYOFF ────────────────────────────────────────────────────────────────
    { id: 'P-01a', type: 'attack', color: RED, reason: 'DEAL 12 on the foe',
        free: L('SACRIFICE 2, DEAL 5.', c => { c.sacrifice(2); c.deal(5); }),
        paid: L('SACRIFICE 4, DEAL 12.', c => { c.sacrifice(4); c.deal(12); }) },
    { id: 'P-01b', type: 'attack', color: RED, reason: 'DEAL 14 on the foe',
        free: L('DEAL 3.', c => { c.deal(3); }),
        paid: L('SACRIFICE 5, DEAL 14.', c => { c.sacrifice(5); c.deal(14); }) },
    { id: 'P-01c', type: 'attack', color: RED, reason: 'DEAL 8 twice on the foe',
        free: L('SACRIFICE 3, DEAL 8.', c => { c.sacrifice(3); c.deal(8); }),
        paid: L('SACRIFICE 3, DEAL 8, twice.', c => { c.sacrifice(3); c.deal(8); c.sacrifice(3); c.deal(8); }) },
    { id: 'P-02a', type: 'skill', color: BLUE, reason: 'GUARD 12 on you',
        free: L('SACRIFICE 2, GUARD 5.', c => { c.sacrifice(2); c.guard(5); }),
        paid: L('SACRIFICE 4, GUARD 12.', c => { c.sacrifice(4); c.guard(12); }) },
    { id: 'P-02b', type: 'skill', color: BLUE, reason: 'GUARD 14 on you',
        free: L('GUARD 3.', c => { c.guard(3); }),
        paid: L('SACRIFICE 5, GUARD 14.', c => { c.sacrifice(5); c.guard(14); }) },
    { id: 'P-02c', type: 'skill', color: BLUE, reason: 'tie GUARD 10 vs DEAL 5: GUARD is the larger number and the slot role',
        free: L('SACRIFICE 3, GUARD 7.', c => { c.sacrifice(3); c.guard(7); }),
        paid: L('SACRIFICE 6, GUARD 10, DEAL 5.', c => { c.sacrifice(6); c.guard(10); c.deal(5); }) },
    { id: 'P-03a', type: 'attack', color: RED, reason: 'DEAL on the foe',
        free: L('DEAL 3, or 6 at half VITAE or less.', c => { c.deal(c.q.atHalf ? 6 : 3); }),
        paid: L('DEAL 6, or 14 at half VITAE or less.', c => { c.deal(c.q.atHalf ? 14 : 6); }) },
    { id: 'P-03b', type: 'attack', color: RED, reason: 'DEAL on the foe',
        free: L('DEAL 2.', c => { c.deal(2); }),
        paid: L('DEAL 5, doubled at half VITAE or less.', c => { c.deal(c.q.atHalf ? 10 : 5); }) },
    { id: 'P-03c', type: 'attack', color: RED, reason: 'DEAL on the foe',
        free: L('DEAL 3.', c => { c.deal(3); }),
        paid: L('DEAL 5, +1 per 10 VITAE missing (max +10).', c => { c.deal(5 + Math.min(10, Math.floor(c.q.missing / 10))); }) },
    { id: 'P-04a', type: 'attack', color: RED, reason: 'DEAL 25 on the foe',
        free: L('Only at one-third VITAE or less: DEAL 10.', c => { c.deal(10); }, { requires: atThird }),
        paid: L('Only at one-third VITAE or less: DEAL 25.', c => { c.deal(25); }, { requires: atThird }) },
    { id: 'P-04b', type: 'attack', color: RED, reason: 'DEAL 20 on the foe',
        free: L('DEAL 2.', c => { c.deal(2); }),
        paid: L('Only at half VITAE or less: DEAL 20.', c => { c.deal(20); }, { requires: atHalf }) },
    { id: 'P-04c', type: 'attack', color: RED, reason: 'DEAL 18 on the foe',
        free: L('Only at half VITAE or less: DEAL 8.', c => { c.deal(8); }, { requires: atHalf }),
        paid: L('Only at half VITAE or less: DEAL 18. EXILE.', c => { c.deal(18); }, { requires: atHalf, exile: true }) },
    { id: 'P-05a', type: 'spell', color: PURPLE, reason: 'VULNERABLE on the foe',
        free: L('VULNERABLE +10% for 1 turn.', c => { c.vulnerable(10, 1); }),
        paid: L('VULNERABLE +1% per VITAE missing (max +50%) for 2 turns.', c => { c.vulnerable(Math.min(50, c.q.missing), 2); }) },
    { id: 'P-05b', type: 'spell', color: PURPLE, reason: 'VULNERABLE on the foe',
        free: L('SACRIFICE 3, VULNERABLE +15% for 1 turn.', c => { c.sacrifice(3); c.vulnerable(15, 1); }),
        paid: L('SACRIFICE 6, VULNERABLE +40% for 2 turns.', c => { c.sacrifice(6); c.vulnerable(40, 2); }) },
    { id: 'P-05c', type: 'spell', color: PURPLE, reason: 'VULNERABLE on the foe',
        free: L('VULNERABLE +10% for 1 turn.', c => { c.vulnerable(10, 1); }),
        paid: L('VULNERABLE +25% for 2 turns, or +50% at half VITAE or less.', c => { c.vulnerable(c.q.atHalf ? 50 : 25, 2); }) },
    { id: 'P-06a', type: 'skill', color: BLUE, reason: 'GUARD on you',
        free: L('GUARD 3.', c => { c.guard(3); }),
        paid: L('GUARD 1 per 5 VITAE missing (max 20).', c => { c.guard(Math.min(20, Math.floor(c.q.missing / 5))); }) },
    { id: 'P-06b', type: 'skill', color: BLUE, reason: 'GUARD on you',
        free: L('GUARD 2.', c => { c.guard(2); }),
        paid: L('GUARD 5, or 15 at half VITAE or less.', c => { c.guard(c.q.atHalf ? 15 : 5); }) },
    { id: 'P-06c', type: 'skill', color: BLUE, reason: 'GUARD on you',
        free: L('GUARD equal to VITAE you lost last turn (max 10).', c => { c.guard(Math.min(10, c.q.lostLastTurn)); }),
        paid: L('GUARD equal to VITAE you lost last turn (max 25).', c => { c.guard(Math.min(25, c.q.lostLastTurn)); }) },
    { id: 'P-07a', type: 'attack', color: RED, reason: 'DEAL on the foe',
        free: L('DEAL 3.', c => { c.deal(3); }),
        paid: L('DEAL equal to the VITAE you SACRIFICED this combat (max 30).', c => { c.deal(Math.min(30, c.q.sacrificedThisCombat)); }) },
    { id: 'P-07b', type: 'attack', color: RED, reason: 'DEAL on the foe',
        free: L('DEAL half the VITAE you lost this combat (max 10).', c => { c.deal(Math.min(10, Math.floor(c.q.lostThisCombat / 2))); }),
        paid: L('DEAL all the VITAE you lost this combat (max 30). EXILE.', c => { c.deal(Math.min(30, c.q.lostThisCombat)); }, { exile: true }) },
    { id: 'P-07c', type: 'attack', color: RED, reason: 'DEAL on the foe',
        free: L('DEAL 2.', c => { c.deal(2); }),
        paid: L('DEAL 5, +1 per SACRIFICE you made this combat (max +15).', c => { c.deal(5 + Math.min(15, c.q.sacrificesThisCombat)); }) },
    { id: 'P-08a', type: 'skill', color: BLUE, reason: 'Conviction is on you (unscaled; "anything on the player")',
        free: L('SACRIFICE 3, gain 2 Conviction.', c => { c.sacrifice(3); c.conviction(2); }),
        paid: L('SACRIFICE 5, gain 3 Conviction.', c => { c.sacrifice(5); c.conviction(3); }) },
    { id: 'P-08b', type: 'skill', color: BLUE, reason: 'Conviction and GUARD are on you',
        free: L('SACRIFICE 4, gain 2 Conviction.', c => { c.sacrifice(4); c.conviction(2); }),
        paid: L('SACRIFICE 4, gain 2 Conviction, GUARD 5.', c => { c.sacrifice(4); c.conviction(2); c.guard(5); }) },
    { id: 'P-08c', type: 'skill', color: BLUE, reason: 'Conviction is on you',
        free: L('SACRIFICE 2, gain 2 Conviction.', c => { c.sacrifice(2); c.conviction(2); }),
        paid: L('SACRIFICE any amount; gain 1 Conviction per 4 paid (max 4).', c => {
            const x = c.sacrificeX(null, { usefulMax: 16 });
            c.conviction(Math.min(4, Math.floor(x / 4)));
        }) },
    { id: 'P-09a', type: 'spell', color: RED, reason: 'the foe loses VITAE (damage to the foe)',
        free: L('SACRIFICE 3; the foe loses 3 VITAE.', c => { c.sacrifice(3); c.foeLoses(3); }),
        paid: L('SACRIFICE 6; the foe loses 12 VITAE.', c => { c.sacrifice(6); c.foeLoses(12); }) },
    { id: 'P-09b', type: 'spell', color: RED, reason: 'tie foe-loses 8 vs VULNERABLE: the VITAE loss is the headline',
        free: L('SACRIFICE 4; the foe loses 4 VITAE.', c => { c.sacrifice(4); c.foeLoses(4); }),
        paid: L('SACRIFICE 8; the foe loses 8 VITAE, VULNERABLE +25% for 1 turn.', c => { c.sacrifice(8); c.foeLoses(8); c.vulnerable(25, 1); }) },
    { id: 'P-09c', type: 'spell', color: RED, reason: 'the foe loses VITAE (damage to the foe)',
        free: L('DEAL 3.', c => { c.deal(3); }),
        paid: L('SACRIFICE 5; the foe loses 15 VITAE, ignoring GUARD.', c => { c.sacrifice(5); c.foeLoses(15); }) },
    { id: 'P-10a', type: 'global', color: RED, reason: 'the foe loses VITAE on each SACRIFICE',
        global: { trigger: 'sac', text: 'The foe loses n VITAE.',
            free: (c, n) => { c.foeLoses(n); }, paid: (c, n) => { c.foeLoses(n); } } },
    { id: 'P-10b', type: 'global', color: RED, reason: 'DEAL on each SACRIFICE',
        global: { trigger: 'sac', text: 'DEAL n÷2.', paidDelta: 'DEAL n instead.',
            free: (c, n) => { c.deal(Math.floor(n / 2)); }, paid: (c, n) => { c.deal(n); } } },
    { id: 'P-10c', type: 'global', color: RED, reason: 'tie GUARD (FREE) vs DEAL (PAID): the PAID line takes the die, so DEAL',
        global: { trigger: 'sac', text: 'GUARD n.', paidDelta: 'DEAL n instead.',
            free: (c, n) => { c.guard(n); }, paid: (c, n) => { c.deal(n); } } },

    // ── ENGINE ────────────────────────────────────────────────────────────────
    { id: 'E-01a', type: 'spell', color: BLUE, reason: 'Curses and Conviction are on you',
        free: L('Add a grey Curse to your hand. Gain 2 Conviction.', c => { c.addCurse(1); c.conviction(2); }),
        paid: L('Add 2 grey Curses to your hand. Gain 3 Conviction.', c => { c.addCurse(2); c.conviction(3); }) },
    { id: 'E-01b', type: 'spell', color: RED, reason: 'DEAL 8 is the only scaled effect',
        free: L('Add a grey Curse to your hand. DEAL 4.', c => { c.addCurse(1); c.deal(4); }),
        paid: L('Add a grey Curse to your hand. Gain 2 Conviction, DEAL 8.', c => { c.addCurse(1); c.conviction(2); c.deal(8); }) },
    { id: 'E-01c', type: 'spell', color: BLUE, reason: 'Curse and Conviction are on you',
        free: L('GUARD 3.', c => { c.guard(3); }),
        paid: L('Add a grey Curse to your hand. Gain 3 Conviction. EXILE.', c => { c.addCurse(1); c.conviction(3); }, { exile: true }) },
    { id: 'E-02a', type: 'skill', color: BLUE, reason: 'SACRIFICE is on you',
        free: L('SACRIFICE 1, twice.', c => { c.sacrifice(1); c.sacrifice(1); }),
        paid: L('SACRIFICE 1, four times.', c => { for (let i = 0; i < 4; i++) c.sacrifice(1); }) },
    { id: 'E-02b', type: 'skill', color: BLUE, reason: 'SACRIFICE and GUARD are on you',
        free: L('SACRIFICE 1, twice. GUARD 2.', c => { c.sacrifice(1); c.sacrifice(1); c.guard(2); }),
        paid: L('SACRIFICE 2, three times. GUARD 5.', c => { for (let i = 0; i < 3; i++) c.sacrifice(2); c.guard(5); }) },
    { id: 'E-02c', type: 'skill', color: BLUE, reason: 'SACRIFICE is on you',
        free: L('SACRIFICE 2.', c => { c.sacrifice(2); }),
        paid: L('SACRIFICE 1 for each card in your hand (max 5).', c => { c.sacrifice(Math.min(5, c.q.handSize)); }) },
    { id: 'E-03a', type: 'global', color: BLUE, reason: 'SACRIFICE is on you',
        global: { trigger: 'turn', text: 'SACRIFICE 2.',
            free: c => { c.sacrifice(2); }, paid: c => { c.sacrifice(2); } } },
    { id: 'E-03b', type: 'global', color: BLUE, reason: 'SACRIFICE and Conviction are on you',
        global: { trigger: 'turn', text: 'SACRIFICE 2, gain 1 Conviction.', paidDelta: 'SACRIFICE 3 instead.',
            free: c => { c.sacrifice(2); c.conviction(1); }, paid: c => { c.sacrifice(3); c.conviction(1); } } },
    { id: 'E-03c', type: 'global', color: BLUE, reason: 'SACRIFICE and GUARD are on you',
        global: { trigger: 'turn', text: 'SACRIFICE 3, GUARD 3.',
            free: c => { c.sacrifice(3); c.guard(3); }, paid: c => { c.sacrifice(3); c.guard(3); } } },
    { id: 'E-04a', type: 'spell', color: BLUE, reason: 'a SACRIFICE modifier on you',
        free: L('Your next SACRIFICE this turn costs no VITAE but still counts.', c => { c.sacModifier({ kind: 'next-free', count: 1 }); }),
        paid: L('Your SACRIFICES this turn cost no VITAE but still count.', c => { c.sacModifier({ kind: 'all-free' }); }) },
    { id: 'E-04b', type: 'spell', color: BLUE, reason: 'a SACRIFICE modifier on you',
        free: L('Your next SACRIFICE this turn costs half.', c => { c.sacModifier({ kind: 'next-half' }); }),
        paid: L('Your next 2 SACRIFICES this turn cost no VITAE but still count.', c => { c.sacModifier({ kind: 'next-free', count: 2 }); }) },
    { id: 'E-04c', type: 'spell', color: BLUE, reason: 'a SACRIFICE modifier and Conviction on you',
        free: L('GUARD 3.', c => { c.guard(3); }),
        paid: L('Your next SACRIFICE this turn costs no VITAE but still counts. Gain 1 Conviction.', c => { c.sacModifier({ kind: 'next-free', count: 1 }); c.conviction(1); }) },
    { id: 'E-05a', type: 'skill', color: BLUE, reason: 'Curse handling is on you',
        free: L('Play a Curse from your hand on its FREE line at no VITAE cost.', c => { c.playCurseFromHand('free', 'no-cost'); }, { requires: curseInHand }),
        paid: L('Play a Curse from your hand on its PAID line at no VITAE cost.', c => { c.playCurseFromHand('paid', 'no-cost'); }, { requires: curseInHand }) },
    { id: 'E-05b', type: 'skill', color: BLUE, reason: 'Curse handling is on you',
        free: L('Play a Curse from your hand; its SACRIFICE is halved.', c => { c.playCurseFromHand('free', 'half'); }, { requires: curseInHand }),
        paid: L('Play every Curse in your hand; their SACRIFICE is halved.', c => { c.playCurseFromHand('free', 'half', true); }, { requires: curseInHand }) },
    { id: 'E-05c', type: 'skill', color: BLUE, reason: 'tie DEAL 3 (FREE) vs Curse handling (PAID): the PAID line takes the die',
        free: L('DEAL 3.', c => { c.deal(3); }),
        paid: L('Play a Curse from your hand on its PAID line at no VITAE cost; it still counts as a SACRIFICE.', c => { c.playCurseFromHand('paid', 'no-cost-counts'); }, { requires: curseInHand }) },
    { id: 'E-06a', type: 'attack', color: RED, reason: 'DEAL on the foe',
        free: L('DEAL 5, then SACRIFICE 2.', c => { c.deal(5); c.sacrifice(2); }),
        paid: L('DEAL 12, then SACRIFICE 3.', c => { c.deal(12); c.sacrifice(3); }) },
    { id: 'E-06b', type: 'attack', color: RED, reason: 'DEAL on the foe',
        free: L('DEAL 4, then SACRIFICE 2.', c => { c.deal(4); c.sacrifice(2); }),
        paid: L('DEAL 7, twice; SACRIFICE 2 after each.', c => { c.deal(7); c.sacrifice(2); c.deal(7); c.sacrifice(2); }) },
    { id: 'E-06c', type: 'attack', color: RED, reason: 'DEAL on the foe',
        free: L('DEAL 3.', c => { c.deal(3); }),
        paid: L('SACRIFICE 3, DEAL 10, then SACRIFICE 3 again.', c => { c.sacrifice(3); c.deal(10); c.sacrifice(3); }) },
    { id: 'E-07a', type: 'spell', color: BLUE, reason: 'a SACRIFICE modifier on you',
        free: L('Your next SACRIFICE this turn counts twice.', c => { c.sacModifier({ kind: 'next-counts', times: 2 }); }),
        paid: L('Your next SACRIFICE this turn counts three times.', c => { c.sacModifier({ kind: 'next-counts', times: 3 }); }) },
    { id: 'E-07b', type: 'spell', color: BLUE, reason: 'a SACRIFICE modifier on you',
        free: L('Your next SACRIFICE this turn is doubled (its cost and its payoffs).', c => { c.sacModifier({ kind: 'next-double' }); }),
        paid: L('Same, and gain 2 Conviction.', c => { c.sacModifier({ kind: 'next-double' }); c.conviction(2); }) },
    { id: 'E-07c', type: 'spell', color: BLUE, reason: 'a SACRIFICE modifier on you',
        free: L('GUARD 3.', c => { c.guard(3); }),
        paid: L('Your SACRIFICES this turn count twice (you pay once).', c => { c.sacModifier({ kind: 'all-count-twice' }); }) },
    { id: 'E-08a', type: 'skill', color: BLUE, reason: 'Curse recursion is on you',
        free: L('Return a Curse from your discard to your hand.', c => { c.returnCurseFromDiscard(false); }, { requires: curseInDiscard }),
        paid: L('Return every Curse from your discard to your hand. Gain 1 Conviction each.', c => { c.conviction(c.returnCurseFromDiscard(true)); }, { requires: curseInDiscard }) },
    { id: 'E-08b', type: 'skill', color: BLUE, reason: 'Curse recursion and GUARD are on you',
        free: L('Return a Curse from your discard to your hand. GUARD 3.', c => { c.returnCurseFromDiscard(false); c.guard(3); }),
        paid: L('Return a Curse from your discard to your hand. GUARD 8.', c => { c.returnCurseFromDiscard(false); c.guard(8); }) },
    { id: 'E-08c', type: 'skill', color: BLUE, reason: 'Curse recursion is on you',
        free: L('Return a Curse from your discard to your hand.', c => { c.returnCurseFromDiscard(false); }, { requires: curseInDiscard }),
        paid: L('Return a Curse from your discard and play it at no VITAE cost.', c => { c.playCurseFromDiscard('free', 'no-cost'); }, { requires: curseInDiscard }) },
    { id: 'E-09a', type: 'global', color: BLUE, reason: 'Conviction is on you',
        global: { trigger: 'curse', text: 'Gain 1 Conviction.',
            free: c => { c.conviction(1); }, paid: c => { c.conviction(1); } } },
    { id: 'E-09b', type: 'global', color: BLUE, reason: 'GUARD is on you',
        global: { trigger: 'curse', text: 'GUARD 4.', paidDelta: 'Also gain 1 Conviction.',
            free: c => { c.guard(4); }, paid: c => { c.guard(4); c.conviction(1); } } },
    { id: 'E-09c', type: 'global', color: RED, reason: 'DEAL on the foe',
        global: { trigger: 'curse', text: 'DEAL 4.', paidDelta: 'DEAL 6 instead.',
            free: c => { c.deal(4); }, paid: c => { c.deal(6); } } },
    { id: 'E-10a', type: 'spell', color: BLUE, reason: 'SACRIFICE is on you',
        free: L('SACRIFICE any amount (max 5).', c => { c.sacrificeX(5, { usefulMax: 0 }); }),
        paid: L('SACRIFICE any amount (max 15).', c => { c.sacrificeX(15, { usefulMax: 0 }); }) },
    { id: 'E-10b', type: 'spell', color: BLUE, reason: 'GUARD and Conviction are on you',
        free: L('SACRIFICE any amount (max 6); GUARD that much.', c => { c.guard(c.sacrificeX(6)); }),
        paid: L('SACRIFICE any amount (max 15); gain 1 Conviction per 5 paid.', c => { c.conviction(Math.floor(c.sacrificeX(15) / 5)); }) },
    { id: 'E-10c', type: 'spell', color: BLUE, reason: 'SACRIFICE is on you',
        free: L('SACRIFICE 3.', c => { c.sacrifice(3); }),
        paid: L('SACRIFICE any amount (max 20); it counts as one SACRIFICE per 5 paid.', c => { c.sacrificeX(20, { countPer: 5 }); }) },

    // ── MISC ──────────────────────────────────────────────────────────────────
    { id: 'M-01a', type: 'skill', color: BLUE, reason: 'HEAL on you',
        free: L('Heal 3.', c => { c.heal(3); }),
        paid: L('Heal 10.', c => { c.heal(10); }) },
    { id: 'M-01b', type: 'skill', color: BLUE, reason: 'HEAL and GUARD on you',
        free: L('GUARD 2.', c => { c.guard(2); }),
        paid: L('Heal 8. GUARD 4.', c => { c.heal(8); c.guard(4); }) },
    { id: 'M-01c', type: 'skill', color: BLUE, reason: 'HEAL on you',
        free: L('Heal 4.', c => { c.heal(4); }),
        paid: L('Heal 12. EXILE.', c => { c.heal(12); }, { exile: true }) },
    { id: 'M-02a', type: 'attack', color: RED, reason: 'tie DEAL 8 vs heal: the heal is fed by the DEAL',
        free: L('DEAL 3; heal 1.', c => { c.deal(3); c.heal(1); }),
        paid: L('DEAL 8; heal half the damage dealt.', c => { const d = c.deal(8); c.heal(Math.floor(d / 2), { exact: true }); }) },
    { id: 'M-02b', type: 'attack', color: RED, reason: 'tie DEAL 6 vs heal: the heal is fed by the DEAL',
        free: L('DEAL 2.', c => { c.deal(2); }),
        paid: L('DEAL 6; heal all the damage dealt (max 8).', c => { const d = c.deal(6); c.heal(Math.min(8, d), { exact: true }); }) },
    { id: 'M-02c', type: 'attack', color: RED, reason: 'DEAL 8 is the headline',
        free: L('DEAL 4.', c => { c.deal(4); }),
        paid: L('DEAL 8; heal 4 if you are at half VITAE or less.', c => { c.deal(8); if (c.q.atHalf) c.heal(4); }) },
    { id: 'M-03a', type: 'skill', color: BLUE, reason: 'GUARD on you',
        free: L('GUARD 3, or 6 at half VITAE or less.', c => { c.guard(c.q.atHalf ? 6 : 3); }),
        paid: L('GUARD 6, or 14 at half VITAE or less.', c => { c.guard(c.q.atHalf ? 14 : 6); }) },
    { id: 'M-03b', type: 'skill', color: BLUE, reason: 'GUARD on you',
        free: L('GUARD 2.', c => { c.guard(2); }),
        paid: L('GUARD 5; at half VITAE or less, this GUARD also lasts into your next turn.', c => {
            const low = c.q.atHalf;
            const g = c.guard(5);
            if (low) c.carryGuard(g);
        }) },
    { id: 'M-03c', type: 'skill', color: BLUE, reason: 'GUARD and HEAL on you',
        free: L('GUARD 3.', c => { c.guard(3); }),
        paid: L('GUARD 8; heal 3 at half VITAE or less.', c => { c.guard(8); if (c.q.atHalf) c.heal(3); }) },
    { id: 'M-04a', type: 'spell', color: BLUE, reason: 'Curse removal and Conviction are on you',
        free: L('EXILE a Curse from your hand.', c => { c.exileCurseFromHand(false); }, { requires: curseInHand }),
        paid: L('EXILE a Curse from your hand. Gain 2 Conviction.', c => { c.exileCurseFromHand(false); c.conviction(2); }, { requires: curseInHand }) },
    { id: 'M-04b', type: 'spell', color: BLUE, reason: 'Curse removal and HEAL are on you',
        free: L('Discard a Curse from your hand at no cost.', c => { c.discardCurseFromHand(); }, { requires: curseInHand }),
        paid: L('EXILE every Curse in your hand; heal 3 for each.', c => {
            const k = c.exileCurseFromHand(true);
            for (let i = 0; i < k; i++) c.heal(3);
        }, { requires: curseInHand }) },
    { id: 'M-04c', type: 'spell', color: RED, reason: 'DEAL 10 is the only scaled effect',
        free: L('GUARD 3.', c => { c.guard(3); }),
        paid: L('EXILE a Curse from your hand. DEAL 10.', c => { c.exileCurseFromHand(false); c.deal(10); }) },
    { id: 'M-05a', type: 'skill', color: BLUE, reason: 'Conviction is on you',
        free: L('At half VITAE or less: gain 2 Conviction.', c => { c.conviction(2); }, { requires: atHalf }),
        paid: L('At half VITAE or less: gain 4 Conviction.', c => { c.conviction(4); }, { requires: atHalf }) },
    { id: 'M-05b', type: 'skill', color: BLUE, reason: 'Conviction is on you',
        free: L('GUARD 2.', c => { c.guard(2); }),
        paid: L('Gain 2 Conviction, or 4 at half VITAE or less.', c => { c.conviction(c.q.atHalf ? 4 : 2); }) },
    { id: 'M-05c', type: 'skill', color: BLUE, reason: 'Conviction is on you',
        free: L('GUARD 3.', c => { c.guard(3); }),
        paid: L('At one-third VITAE or less: gain 4 Conviction. EXILE.', c => { c.conviction(4); }, { requires: atThird, exile: true }) },
    { id: 'M-06a', type: 'skill', color: BLUE, reason: 'a death ward on you',
        free: L('GUARD 3.', c => { c.guard(3); }),
        paid: L('This turn, your VITAE cannot drop below 1. EXILE.', c => { c.deathWard(); }, { exile: true }) },
    { id: 'M-06b', type: 'skill', color: BLUE, reason: 'a death ward on you',
        free: L('At half VITAE or less: GUARD 4.', c => { c.guard(4); }, { requires: atHalf }),
        paid: L('Until your next turn, damage cannot take you below 1 VITAE.', c => { c.deathWard(); }) },
    { id: 'M-06c', type: 'skill', color: BLUE, reason: 'a death ward and HEAL on you',
        free: L('Heal 2.', c => { c.heal(2); }),
        paid: L('This turn, damage cannot take you below 1 VITAE; heal 5 next turn. EXILE.', c => { c.deathWard(); c.healNextTurn(5); }, { exile: true }) },
    { id: 'M-07a', type: 'spell', color: PURPLE, reason: 'VULNERABLE on the foe (the slot role is "mark the foe")',
        free: L('VULNERABLE +10% for 1 turn.', c => { c.vulnerable(10, 1); }),
        paid: L('VULNERABLE +25% for 2 turns; heal 2 each time you damage the foe while it lasts.', c => { c.vulnerable(25, 2); c.drain(2, 2); }) },
    { id: 'M-07b', type: 'spell', color: PURPLE, reason: 'tie: the heal lands on you, but the card is a drain MARK on the foe (slot role), so heart',
        free: L('For 1 turn, heal 1 whenever you damage the foe.', c => { c.drain(1, 1); }),
        paid: L('For 3 turns, heal 2 whenever you damage the foe.', c => { c.drain(2, 3); }) },
    { id: 'M-07c', type: 'spell', color: PURPLE, reason: 'tie VULNERABLE vs HEAL 5: VULNERABLE leads the line and the slot role is the mark',
        free: L('VULNERABLE +10% for 1 turn.', c => { c.vulnerable(10, 1); }),
        paid: L('VULNERABLE +20% for 2 turns. Heal 5.', c => { c.vulnerable(20, 2); c.heal(5); }) },
    { id: 'M-08a', type: 'global', color: BLUE, reason: 'HEAL on you',
        global: { trigger: 'turn', text: 'Heal 2.', paidDelta: 'Heal 3 instead.',
            free: c => { c.heal(2); }, paid: c => { c.heal(3); } } },
    { id: 'M-08b', type: 'global', color: BLUE, reason: 'HEAL and GUARD on you',
        global: { trigger: 'turn', text: 'Heal 3.', paidDelta: 'Heal 2 and GUARD 2 instead.',
            free: c => { c.heal(3); }, paid: c => { c.heal(2); c.guard(2); } } },
    { id: 'M-08c', type: 'global', color: BLUE, reason: 'HEAL on you',
        global: { trigger: 'turn', text: 'Heal 1 per Curse in your hand.', paidDelta: 'Heal 2 per Curse in your hand (max 6) instead.',
            free: c => { c.heal(c.q.cursesInHand); }, paid: c => { c.heal(Math.min(6, 2 * c.q.cursesInHand)); } } },
    { id: 'M-09a', type: 'skill', color: BLUE, reason: 'HEAL on you',
        free: L('Heal 4; healing past max VITAE becomes GUARD.', c => { c.heal(4, { overflowToGuard: true }); }),
        paid: L('Heal 10; healing past max VITAE becomes GUARD.', c => { c.heal(10, { overflowToGuard: true }); }) },
    { id: 'M-09b', type: 'skill', color: BLUE, reason: 'a HEAL rule on you',
        free: L('GUARD 3.', c => { c.guard(3); }),
        paid: L('For the rest of combat, healing past max VITAE becomes GUARD. EXILE.', c => { c.overhealToGuard(); }, { exile: true }) },
    { id: 'M-09c', type: 'skill', color: BLUE, reason: 'HEAL and GUARD on you',
        free: L('Heal 3.', c => { c.heal(3); }),
        paid: L('Heal 8; GUARD equal to the healing done.', c => { const h = c.heal(8); c.guard(h, { exact: true }); }) },
    { id: 'M-10a', type: 'spell', color: RED, reason: 'the foe loses VITAE (damage to the foe)',
        free: L('The foe loses VITAE equal to the damage you took last turn (max 5).', c => { c.foeLoses(Math.min(5, c.q.takenLastTurn)); }),
        paid: L('Same, max 15.', c => { c.foeLoses(Math.min(15, c.q.takenLastTurn)); }) },
    { id: 'M-10b', type: 'spell', color: RED, reason: 'DEAL on the foe',
        free: L('DEAL 3.', c => { c.deal(3); }),
        paid: L('DEAL equal to the damage you took last turn (max 20).', c => { c.deal(Math.min(20, c.q.takenLastTurn)); }) },
    { id: 'M-10c', type: 'spell', color: RED, reason: 'tie VULNERABLE (FREE) vs foe-loses (PAID): the PAID line takes the die',
        free: L('VULNERABLE +10% for 1 turn.', c => { c.vulnerable(10, 1); }),
        paid: L('The foe loses half the VITAE you lost this combat (max 15). EXILE.', c => { c.foeLoses(Math.min(15, Math.floor(c.q.lostThisCombat / 2))); }, { exile: true }) },
];

/** The first Curse (D71, T's text): grey, any die. */
const GREY_CURSE: Card = {
    id: 'bp-curse',
    name: 'Grey Curse',
    color: 'any',
    description: 'A dead card that holds a hand slot until played.',
    tier: 1, rank: 1, cardType: 'curse', targetType: 'self',
    paidSummary: 'SACRIFICE 10. EXILE.',
    tags: ['sandbox', 'blood-price', 'curse'],
    bloodPrice: {
        proposal: 'CURSE', slot: 'CURSE', curse: true, untuned: true,
        free: L('SACRIFICE 5.', c => { c.sacrifice(5); }),
        paid: L('SACRIFICE 10. EXILE.', c => { c.sacrifice(10); }, { exile: true }),
    },
};

function toCard(p: Proposal): Card {
    const spec: BloodPriceSpec = {
        proposal: p.id, slot: p.id.slice(0, 4), colorReason: p.reason,
        ...(p.free ? { free: p.free } : {}),
        ...(p.paid ? { paid: p.paid } : {}),
        ...(p.global ? { global: p.global } : {}),
    };
    const paidText = p.global
        ? `${p.global.text}${p.global.paidDelta ? ` PAID: ${p.global.paidDelta}` : ''}`
        : (p.paid?.text ?? '');
    return {
        id: `bp-${p.id}`,
        name: `Blood Price ${p.id}`,
        color: p.color,
        description: `Rehearsal ballot proposal ${p.id} (sandbox only).`,
        tier: 1, rank: 1, cardType: p.type,
        targetType: p.color === BLUE ? 'self' : 'enemy',
        paidSummary: paidText,
        tags: ['sandbox', 'blood-price'],
        bloodPrice: spec,
    };
}

/** All 90 proposals plus the grey Curse. */
export const BLOOD_PRICE_CARDS: Card[] = [...P.map(toCard), GREY_CURSE];

/** The 30 ballot slots, in ballot order. */
export const BLOOD_PRICE_SLOTS: string[] = [...new Set(P.map(p => p.id.slice(0, 4)))];

/** The three proposals of a slot, as card ids. */
export function proposalsForSlot(slot: string): string[] {
    return P.filter(p => p.id.startsWith(slot)).map(p => `bp-${p.id}`);
}

/** Registers the Blood Price sandbox cards (idempotent). */
export function registerBloodPriceCards(): void {
    if (getCardById(GREY_CURSE.id)) return;
    registerSandboxCards(BLOOD_PRICE_CARDS);
}
