import React from 'react';
import { render } from '@testing-library/react-native';

import { 
    DiceRollOverlay, 
    ResolveFlashOverlay, 
    OutcomeOverlay, 
    CardDetailOverlay 
} from '../HazardOverlays';
import type { 
    HazardCardVM, 
    HazardDieVM, 
    HazardResolveFlashVM, 
    HazardOutcomeVM 
} from '@/state/presenters/hazard.engine';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Reanimated = require('react-native-reanimated/mock');
    Reanimated.default.call = () => {};
    return Reanimated;
});

// Mock expo-haptics (calls are promise-chained with .catch; the
// outcome overlay also fires notificationAsync)
jest.mock('expo-haptics', () => ({
    impactAsync: jest.fn(() => Promise.resolve()),
    notificationAsync: jest.fn(() => Promise.resolve()),
    ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
    NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

const mockCard: HazardCardVM = {
    uid: 'test-card-1',
    cardId: 'test-card',
    name: 'Test Card',
    kind: 'red',
    rarity: 'common',
    dead: false,
    utility: false,
    free: { force: 3, escape: 1 },
    powered: { force: 5, escape: 2 },
    freeEffectLabel: '',
    poweredEffectLabel: '',
    flavor: 'Free action description',
    keywords: [],
    dieAvailable: true,
    poweredByDieId: null,
    applied: false,
    salvageLabel: null, powerColors: ['red'], choose: false, chosenKey: null, vowBonus: null,
};

const mockDice: HazardDieVM[] = [
    {
        id: 'die-1',
        kind: 'red',
        state: 'available',
        isHex: false,
        usable: true,
        temporary: false,
        accessibilityLabel: 'Red die, available',
    },
    {
        id: 'die-2',
        kind: 'blue',
        state: 'spent',
        isHex: false,
        usable: false,
        temporary: false,
        accessibilityLabel: 'Blue die, spent',
    },
];

const mockResolveFlash: HazardResolveFlashVM = {
    cleared: true,
    verdict: 'pass',
    roundRoman: 'I',
    stats: [
        { key: 'force', label: 'FORCE', got: 5, need: 4, ok: true },
        { key: 'escape', label: 'ESCAPE', got: 2, need: 3, ok: false },
    ],
    carryNote: null,
};

const mockOutcome: HazardOutcomeVM = {
    tier: 'complete',
    word: 'Victory',
    sub: 'Complete',
    line: 'You have successfully completed the hazard.',
    ctaLabel: 'Continue',
    marks: [],
};

describe('DiceRollOverlay', () => {
    it('renders dice roll animation', () => {
        const { root } = render(
            <DiceRollOverlay 
                dice={mockDice} 
                routeLabel="Risk Route" 
                routeKey="risk" 
                onDone={jest.fn()} 
            />
        );
        expect(root).toBeTruthy();
    });

    it('handles empty dice array', () => {
        const { root } = render(
            <DiceRollOverlay 
                dice={[]} 
                routeLabel="Safe Route" 
                routeKey="safe" 
                onDone={jest.fn()} 
            />
        );
        expect(root).toBeTruthy();
    });
});

describe('ResolveFlashOverlay', () => {
    it('renders resolve flash with pass verdict', () => {
        const { getByText } = render(
            <ResolveFlashOverlay flash={mockResolveFlash} onDone={jest.fn()} />
        );
        expect(getByText(/ROUND I — CLEARED/)).toBeTruthy();
        expect(getByText('pass')).toBeTruthy();
    });

    it('renders resolve flash with fail verdict', () => {
        const failFlash = { ...mockResolveFlash, verdict: 'fail' as const };
        const { root } = render(
            <ResolveFlashOverlay flash={failFlash} onDone={jest.fn()} />
        );
        expect(root).toBeTruthy();
    });
});

describe('OutcomeOverlay', () => {
    it('renders complete outcome', () => {
        const { getByText } = render(
            <OutcomeOverlay outcome={mockOutcome} onContinue={jest.fn()} />
        );
        expect(getByText('Victory')).toBeTruthy();
        expect(getByText('Continue')).toBeTruthy();
    });

    it('renders failure outcome', () => {
        const failureOutcome = { 
            ...mockOutcome, 
            tier: 'failure' as const, 
            word: 'Defeat',
        };
        const { getByText } = render(
            <OutcomeOverlay outcome={failureOutcome} onContinue={jest.fn()} />
        );
        expect(getByText('Defeat')).toBeTruthy();
    });

    it('displays outcome body', () => {
        const { getByText } = render(
            <OutcomeOverlay outcome={mockOutcome} onContinue={jest.fn()} />
        );
        expect(getByText(/You have successfully completed the hazard\./)).toBeTruthy();
    });
});

describe('CardDetailOverlay', () => {
    it('renders card detail view', () => {
        const { getByText } = render(
            <CardDetailOverlay card={mockCard} onClose={jest.fn()} />
        );
        expect(getByText('Test Card')).toBeTruthy();
    });

    it('renders utility card details', () => {
        const utilityCard = { 
            ...mockCard, 
            utility: true, 
            freeEffectLabel: 'Heal 2',
            poweredEffectLabel: 'Heal 4'
        };
        const { getByText } = render(
            <CardDetailOverlay card={utilityCard} onClose={jest.fn()} />
        );
        expect(getByText('Test Card')).toBeTruthy();
    });

    it('renders dead card correctly', () => {
        const deadCard = { ...mockCard, dead: true };
        const { getByText } = render(
            <CardDetailOverlay card={deadCard} onClose={jest.fn()} />
        );
        expect(getByText('Test Card')).toBeTruthy();
    });
});