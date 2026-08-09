/**
 * Phase 28 (Show the Engine legibility sweep) — presenter coverage for the
 * mobile-side surfaces: the Premise/CONDEMN VM, discard-pile names (the
 * REPRISE picker's data source), the live rupture-burst card face, the
 * `needsReprisalChoice` flag, and the wall-math intent projection.
 */

import { describe, it, expect } from '@jest/globals';
import { createCharacter, initializeCombatEncounter, rollEncounterDice, capitulateThreshold } from '@mechanics';
import type { CombatEncounterState } from '@mechanics';

import { buildCombatViewModel } from '@/state/presenters/combat-encounter.engine';
import { createMockEncounterEnemy } from '@/state/mocks/combat.mock';

// Fallback deck — any playable spell works; these three exercise the three
// surfaces under test (rupture face, reprise mechanic, plain filler).
const DECK = ['resonance-detonation', 'second-thoughts', 'slippery-slope'];

function openState(): CombatEncounterState {
    const player = createCharacter({ name: 'Hero', level: 3, baseStats: { heart: 8, body: 8, mind: 8 } });
    player.knownCards = Array.from(new Set([...(player.knownCards ?? []), ...DECK]));
    const state = initializeCombatEncounter(player, createMockEncounterEnemy(), DECK, 7);
    return rollEncounterDice(state).state;
}

describe('CombatViewModel.peroration — the Premise track + CONDEMN beat (phase 28)', () => {
    it('is inactive with no declared Peroration', () => {
        const vm = buildCombatViewModel(openState());
        expect(vm.peroration.active).toBe(false);
        expect(vm.peroration.premises).toBe(0);
    });

    it('surfaces the declared card, tally, and tier-floored CONDEMN threshold', () => {
        let s = openState();
        // createMockEncounterEnemy is difficulty 'elite' -> CONCEDE_PREMISES_ELITE (10)
        // floors The Black Cap's authored concedeAt (8).
        s = { ...s, premises: 3, peroration: { cardId: 'the-black-cap', at: 6, concedeAt: 8 } };
        const vm = buildCombatViewModel(s);
        expect(vm.peroration.active).toBe(true);
        expect(vm.peroration.premises).toBe(3);
        expect(vm.peroration.at).toBe(6);
        expect(vm.peroration.concedeAt).toBe(10); // tier-floored, not the raw 8
        expect(vm.peroration.cardName).toBe('The Black Cap');
    });
});

// WI-5 — the invisible alt-win currencies (PLEA → RELENT, CHARGE →
// ORATORY) now render as meters on the enemy pane. A GRACE run used to play its
// whole plan and die with zero feedback on progress.
describe('WI-5 — PLEA / CHARGE alt-win meters', () => {
    function deckState(deck: string[], seed = 7): CombatEncounterState {
        const player = createCharacter({ name: 'Hero', level: 3, baseStats: { heart: 8, body: 8, mind: 8 } });
        player.knownCards = deck.slice();
        return rollEncounterDice(initializeCombatEncounter(player, createMockEncounterEnemy(), deck, seed)).state;
    }

    it('surfaces the PLEA meter with the engine capitulate target when sway accrues', () => {
        const s = { ...openState(), sway: 5 };
        const vm = buildCombatViewModel(s);
        expect(vm.enemy.swayVisible).toBe(true);
        expect(vm.enemy.sway).toBe(5);
        expect(vm.enemy.swayTarget).toBe(capitulateThreshold(s.enemy)); // engine-owned, not duplicated
    });

    it('shows the PLEA meter from turn 1 when the deck plan is PLEA, before any is gained (GRACE)', () => {
        const vm = buildCombatViewModel(deckState(['thin-hymn', 'thin-hymn', 'thin-hymn']));
        expect(vm.enemy.sway).toBe(0);
        expect(vm.enemy.swayVisible).toBe(true);
    });

    it('surfaces the undeclared CHARGE tally, then yields to the peroration track once declared', () => {
        let s = deckState(['petty-indictment', 'petty-indictment', 'petty-indictment']);
        s = { ...s, premises: 2 };
        let vm = buildCombatViewModel(s);
        expect(vm.enemy.premiseVisible).toBe(true);
        expect(vm.enemy.premises).toBe(2);
        expect(vm.enemy.premiseAt).toBe(0); // no target bar until a Peroration is declared

        // Declaring a SENTENCE hands the readout to the existing peroration track.
        s = { ...s, peroration: { cardId: 'the-black-cap', at: 6, concedeAt: 8 } };
        vm = buildCombatViewModel(s);
        expect(vm.enemy.premiseVisible).toBe(false);
    });

    it('hides both meters for a deck that feeds neither currency', () => {
        const vm = buildCombatViewModel(openState()); // DECK: rupture / reprise / dot
        expect(vm.enemy.swayVisible).toBe(false);
        expect(vm.enemy.premiseVisible).toBe(false);
    });
});

// Phase 2 (spec 30) — the status kill-path foresight. The engine selector
// (`projectCombatOutcome`) already had hermetic coverage in mechanics; this
// pins the mobile presenter actually forwards it onto the enemy pane VM,
// which it never did before this pass (the API shipped Phase 2 but was
// never wired to the board — CRITIQUE.md "Combat kill-path legibility").
describe('Phase 2 — projected-lethality readout (spec 30)', () => {
    it('reads zero/hidden when the foe carries no DoT', () => {
        const vm = buildCombatViewModel(openState());
        expect(vm.enemy.pendingDot).toBe(0);
        expect(vm.enemy.roundsToKill).toBeNull();
        expect(vm.enemy.isLethalInFlight).toBe(false);
    });

    it('surfaces a pending tally for a DoT that will not finish the foe', () => {
        let s = openState();
        s = {
            ...s,
            enemy: {
                ...s.enemy, health: 300, maxHealth: 300,
                effects: [{ effectId: 'debuff_bleed', intensity: 1, remainingDuration: 2, appliedAt: 1, tier: 2 }],
            },
        };
        const vm = buildCombatViewModel(s);
        expect(vm.enemy.pendingDot).toBe(3);
        expect(vm.enemy.roundsToKill).toBeNull();
        expect(vm.enemy.isLethalInFlight).toBe(false);
    });

    it('flags isLethalInFlight + a rounds-to-kill countdown when stacked DoT alone clears remaining HP', () => {
        // Same fixture as mechanics' projected-lethality e2e suite (i3 d5
        // bleed vs 15 HP — decay-aware ticks 9, 6, 3; 2 expected ticks/round
        // clears 15 HP on round 1).
        let s = openState();
        s = {
            ...s,
            enemy: {
                ...s.enemy, health: 15, maxHealth: 15,
                effects: [{ effectId: 'debuff_bleed', intensity: 3, remainingDuration: 5, appliedAt: 1, tier: 2 }],
            },
        };
        const vm = buildCombatViewModel(s);
        expect(vm.enemy.pendingDot).toBe(18);
        expect(vm.enemy.roundsToKill).toBe(1);
        expect(vm.enemy.isLethalInFlight).toBe(true);
    });
});

describe('CombatViewModel.discardCards — the REPRISE picker data source (phase 28)', () => {
    it('resolves discard-pile ids to display names', () => {
        let s = openState();
        s = { ...s, discard: ['the-long-lent', 'open-every-grave'] };
        const vm = buildCombatViewModel(s);
        expect(vm.discardCards).toEqual([
            { id: 'the-long-lent', name: 'The Long Lent' },
            { id: 'open-every-grave', name: 'Open Every Grave' },
        ]);
    });
});

describe('CombatCardVM.needsReprisalChoice (phase 28)', () => {
    it('is true for a reprise-mechanic card, false otherwise', () => {
        let s = openState();
        s = {
            ...s,
            hand: [
                { uid: 'u-reprise', cardId: 'shallow-grave' },
                { uid: 'u-plain', cardId: 'spoiled-poultice' },
            ],
        };
        const vm = buildCombatViewModel(s);
        const reprise = vm.hand.find(c => c.uid === 'u-reprise')!;
        const plain = vm.hand.find(c => c.uid === 'u-plain')!;
        expect(reprise.needsReprisalChoice).toBe(true);
        expect(plain.needsReprisalChoice).toBe(false);
    });
});

describe('CombatCardVM rupture face — live projected burst (phase 28)', () => {
    it('shows a real projected number, not the qualitative "detonate" word', () => {
        let s = openState();
        s = { ...s, hand: [{ uid: 'u-rupture', cardId: 'communion-of-the-worm' }] };
        const vm = buildCombatViewModel(s);
        const card = vm.hand.find(c => c.uid === 'u-rupture')!;
        expect(card.face.kind).toBe('rupture');
        expect(card.face.heroText).toMatch(/^\d+$/);
    });
});

describe('CombatIntentVM.wallMath — the telegraph readout (phase 28)', () => {
    it('is present with sane defaults on a fresh encounter', () => {
        const vm = buildCombatViewModel(openState());
        expect(vm.enemy.intent.wallMath).toBeDefined();
        expect(typeof vm.enemy.intent.wallMath.willDeny).toBe('boolean');
        expect(vm.enemy.intent.wallMath.netDamage).toBeLessThanOrEqual(vm.enemy.intent.wallMath.projectedDamage);
    });
});

// Card-wording audit (2026-07-12) — a persistent card's standing passive is
// gated by card id at its engine trigger sites, never an applied effect id, so
// the board used to show NOTHING while an enchantment/curse was attached.
describe('standing enchant/curse chips (card-wording audit 2026-07-12)', () => {
    it('a permanent player enchantment renders a ❖ chip with the passive gloss', () => {
        const s = { ...openState(), persistentZone: ['the-untended-garden'] };
        const vm = buildCombatViewModel(s);
        const chip = vm.player.effects.find(e => e.effectId === 'the-untended-garden');
        expect(chip).toBeDefined();
        expect(chip!.standing).toBe(true);
        expect(chip!.glyph.glyph).toBe('❖');
        expect(chip!.glyph.label).toBe('The Untended Garden');
        expect(chip!.duration).toBe(0);              // permanent → no countdown tag
        expect(chip!.gloss).toBeTruthy();            // Card.persistentEffect
    });

    it('a timed FREE instance carries its rounds-left clock', () => {
        const s = { ...openState(), tempZone: [{ cardId: 'the-untended-garden', roundsLeft: 2 }] };
        const vm = buildCombatViewModel(s);
        const chip = vm.player.effects.find(e => e.effectId === 'the-untended-garden');
        expect(chip?.standing).toBe(true);
        expect(chip?.duration).toBe(2);
    });

    it('a curse attached to the enemy renders a ☒ chip on the enemy pane', () => {
        const s = { ...openState(), enemyAttachments: ['the-congregation-below'] };
        const vm = buildCombatViewModel(s);
        const chip = vm.enemy.effects.find(e => e.effectId === 'the-congregation-below');
        expect(chip).toBeDefined();
        expect(chip!.standing).toBe(true);
        expect(chip!.glyph.glyph).toBe('☒');
    });

    it('no zones → no standing chips (and never a crash on missing ids)', () => {
        const vm = buildCombatViewModel({ ...openState(), enemyAttachments: ['not-a-card'] });
        expect(vm.player.effects.every(e => !e.standing)).toBe(true);
        expect(vm.enemy.effects.find(e => e.effectId === 'not-a-card')).toBeUndefined();
    });
});
