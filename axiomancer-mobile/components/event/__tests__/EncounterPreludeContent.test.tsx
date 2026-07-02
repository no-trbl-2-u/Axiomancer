/**
 * Hermetic component tests — EncounterPreludeContent.
 */

import { describe, it, expect, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { EncounterPreludeContent } from '../EncounterPreludeContent';
import { AestheticModeProvider, type AestheticMode } from '@/state/aesthetic-mode';
import type { EventViewModel } from '@/state/presenters/event.engine';

function withAesthetic(child: React.ReactNode, mode: AestheticMode = 'canonical') {
    return (
        <AestheticModeProvider initialMode={mode} skipHydration>
            {child}
        </AestheticModeProvider>
    );
}

function makeCombatPreludeVm(overrides: Partial<EventViewModel> = {}): EventViewModel {
    return {
        kind: 'combat-prelude',
        variant: 'encounter',
        artSlug: 'encounter',
        badge: 'ENCOUNTER',
        badgeAccentKey: 'blood',
        title: 'CAIRN-ROT',
        subtitle: 'something stirs',
        body: 'level 1 · 10 hp.',
        choices: [
            {
                id: 'fight',
                label: 'FIGHT',
                description: 'Combat · turns',
                consequences: [],
                iconKey: 'sword',
                accentKey: 'blood',
                enabled: true,
                subtitle: null, decode: null,
            },
            {
                id: 'flee',
                label: 'FLEE',
                description: 'Luck Save',
                consequences: [],
                iconKey: 'flee',
                accentKey: 'bone',
                enabled: true,
                subtitle: null, decode: null,
            },
        ],
        lore: null,
        canSkip: false,
        preludeChrome: {
            eyebrow: 'ENCOUNTER',
            sashLabel: 'STRIFE STIRS',
            sealLabel: 'SEALED · NO RETREAT',
            fleeDisabledHint: 'no retreat from this one.',
            doomLine: 'It has done this before. Unless…',
        },
        chrome: {
            reckoningEyebrow: '✠ A RECKONING',
            skipLabel: 'SKIP ›',
            emptyBackLabel: 'BACK',
            emptyBackSub: 'RETURN',
        },
        sourceNodeType: null,
        ...overrides,
    };
}

describe('EncounterPreludeContent', () => {
    it('renders fight and flee buttons', () => {
        const tree = render(
            withAesthetic(
                <EncounterPreludeContent
                    vm={makeCombatPreludeVm()}
                    onFight={() => {}}
                    onFlee={() => {}}
                />
            )
        );
        
        expect(tree.getByTestId('encounter-modal-fight')).toBeTruthy();
        expect(tree.getByTestId('encounter-modal-flee')).toBeTruthy();
        expect(tree.getByText('ENGAGE')).toBeTruthy();
        expect(tree.getByText('FLEE')).toBeTruthy();
    });

    it('calls onFight when fight button is pressed', () => {
        const onFight = jest.fn();
        const tree = render(
            withAesthetic(
                <EncounterPreludeContent
                    vm={makeCombatPreludeVm()}
                    onFight={onFight}
                    onFlee={() => {}}
                />
            )
        );
        
        fireEvent.press(tree.getByTestId('encounter-modal-fight'));
        expect(onFight).toHaveBeenCalledTimes(1);
    });

    it('calls onFlee when flee button is pressed', () => {
        const onFlee = jest.fn();
        const tree = render(
            withAesthetic(
                <EncounterPreludeContent
                    vm={makeCombatPreludeVm()}
                    onFight={() => {}}
                    onFlee={onFlee}
                />
            )
        );
        
        fireEvent.press(tree.getByTestId('encounter-modal-flee'));
        expect(onFlee).toHaveBeenCalledTimes(1);
    });

    it('disables flee button for boss encounters', () => {
        const vm = makeCombatPreludeVm({
            variant: 'boss',
            choices: [
                ...makeCombatPreludeVm().choices.slice(0, 1),
                {
                    id: 'flee',
                    label: 'FLEE',
                    description: 'Luck Save',
                    consequences: [],
                    iconKey: 'flee',
                    accentKey: 'bone',
                    enabled: false,
                    subtitle: null, decode: null,
                },
            ],
        });
        
        const tree = render(
            withAesthetic(
                <EncounterPreludeContent
                    vm={vm}
                    onFight={() => {}}
                    onFlee={() => {}}
                />
            )
        );
        
        const fleeButton = tree.getByTestId('encounter-modal-flee');
        expect(fleeButton.props.accessibilityState?.disabled).toBe(true);
    });

    it('shows codex header in codex mode', () => {
        const tree = render(
            withAesthetic(
                <EncounterPreludeContent
                    vm={makeCombatPreludeVm()}
                    onFight={() => {}}
                    onFlee={() => {}}
                />,
                'codex'
            )
        );
        
        expect(tree.getByText('EVENT/ENCOUNTER')).toBeTruthy();
        expect(tree.getByText('KIND/COMBAT.PRELUDE')).toBeTruthy();
    });

    it('does not show codex header in canonical mode', () => {
        const tree = render(
            withAesthetic(
                <EncounterPreludeContent
                    vm={makeCombatPreludeVm()}
                    onFight={() => {}}
                    onFlee={() => {}}
                />,
                'canonical'
            )
        );
        
        expect(tree.queryByText('EVENT/ENCOUNTER')).toBeNull();
        expect(tree.queryByText('KIND/COMBAT.PRELUDE')).toBeNull();
    });

    it('renders encounter content elements', () => {
        const tree = render(
            withAesthetic(
                <EncounterPreludeContent
                    vm={makeCombatPreludeVm()}
                    onFight={() => {}}
                    onFlee={() => {}}
                />
            )
        );
        
        expect(tree.getByText('ENCOUNTER')).toBeTruthy();
        expect(tree.getByText('STRIFE STIRS')).toBeTruthy();
        expect(tree.getByText('CAIRN-ROT')).toBeTruthy();
        expect(tree.getByText('— something stirs')).toBeTruthy();
        expect(tree.getByText('level 1 · 10 hp.')).toBeTruthy();
        expect(tree.getByTestId('encounter-modal-sash')).toBeTruthy();
    });
});