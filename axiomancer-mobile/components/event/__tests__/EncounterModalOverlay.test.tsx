/**
 * Hermetic component tests — EncounterModalOverlay surface.
 *
 * Pins the contracts the screen depends on for the
 * encounter-modal-over-map seam (Phase 32 sub-tick D port,
 * `components/event/EncounterModalOverlay.tsx`, commit `7dab20c`).
 * The presenter-layer pin lives in
 * `state/e2e/exploration.engine.test.ts: encounter-modal seam`;
 * this file covers the component-level branches the screen
 * relies on:
 *
 *   1. Returns null on non-combat-prelude VMs (so a paced /
 *      narrative-choice event never accidentally mounts the
 *      overlay).
 *   2. FLEE is disabled when the event VM's flee choice is
 *      `enabled: false` (boss encounters per chat1's
 *      "no retreat from a boss" intent).
 *   3. Backdrop has no `onPress` handler — non-dismissibility
 *      is the diegetic SEALED · NO RETREAT contract (chat1:
 *      "user cannot exit these modals").
 *
 * Hermetic = self-contained + deterministic + isolated.
 * See docs/testing.md.
 */

import { afterEach, describe, it, expect, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { EncounterModalOverlay } from '../EncounterModalOverlay';
import { AestheticModeProvider, type AestheticMode } from '@/state/aesthetic-mode';
import { CombatModeProvider, useCombatMode } from '@/state/combat-mode';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import { createAppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';
import type { EventViewModel } from '@/state/presenters/event.engine';
import { createMockEncounterEnemy } from '@/state/mocks/combat.mock';

// Phase 64 follow-up: overlay now reads `useGameState((s) => s.combat?.phase)`
// for the auto-scroll-on-phase-change effect, so it requires
// GameStoreProvider even for prelude-mode mount tests.
// Phase 70 Tick A follow-up: overlay also reads `useCombatMode()` to
// watch `lastOutcome` / `aftermathData` for the in-modal aftermath
// swap. Tests now mount inside <CombatModeProvider> too.
function withAesthetic(child: React.ReactNode, mode: AestheticMode = 'canonical') {
    const store = createAppStore({ adapter: createMemoryAdapter() });
    return (
        <AestheticModeProvider initialMode={mode} skipHydration>
            <GameStoreProvider store={store}>
                <CombatModeProvider>{child}</CombatModeProvider>
            </GameStoreProvider>
        </AestheticModeProvider>
    );
}

afterEach(() => {
    jest.restoreAllMocks();
});

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

function makeNarrativeChoiceVm(): EventViewModel {
    return makeCombatPreludeVm({
        kind: 'narrative-choice',
        variant: 'npc',
        artSlug: 'interaction-generic',
        preludeChrome: null,
    });
}

describe('EncounterModalOverlay: mount conditions', () => {
    it('returns null when the VM is narrative-choice (paced event, not combat-prelude)', () => {
        const tree = render(
            withAesthetic(<EncounterModalOverlay vm={makeNarrativeChoiceVm()} onFight={() => {}} onFlee={() => {}} />),
        );
        // A null return from a component renders no children; the
        // root tree is `null` when the component renders nothing.
        expect(tree.toJSON()).toBeNull();
    });

    it('returns null when preludeChrome is null (defensive — should not happen post-withPreludeChrome)', () => {
        const vm = makeCombatPreludeVm({ preludeChrome: null });
        const tree = render(
            withAesthetic(<EncounterModalOverlay vm={vm} onFight={() => {}} onFlee={() => {}} />),
        );
        expect(tree.toJSON()).toBeNull();
    });

    it('mounts the overlay on a combat-prelude VM with populated preludeChrome', () => {
        const tree = render(
            withAesthetic(<EncounterModalOverlay vm={makeCombatPreludeVm()} onFight={() => {}} onFlee={() => {}} />),
        );
        // Two chain bars (top + bottom) carry the SEALED · NO RETREAT
        // signal — both should be present.
        const chains = tree.queryAllByTestId('encounter-modal-chain');
        expect(chains).toHaveLength(2);
        // Sash + overlay container also present.
        expect(tree.queryByTestId('encounter-modal-sash')).not.toBeNull();
        expect(tree.queryByTestId('encounter-modal-overlay')).not.toBeNull();
    });

    it('mounts the codex header when aesthetic mode is codex (Phase 50 tick C)', () => {
        const tree = render(
            withAesthetic(
                <EncounterModalOverlay vm={makeCombatPreludeVm()} onFight={() => {}} onFlee={() => {}} />,
                'codex',
            ),
        );
        // Tokens come from selectEventCodexHeader — variant=encounter,
        // kind=combat-prelude → EVENT/ENCOUNTER, KIND/COMBAT.PRELUDE.
        expect(tree.queryByText('EVENT/ENCOUNTER')).not.toBeNull();
        expect(tree.queryByText('KIND/COMBAT.PRELUDE')).not.toBeNull();
    });

    it('omits the codex header in canonical mode', () => {
        const tree = render(
            withAesthetic(
                <EncounterModalOverlay vm={makeCombatPreludeVm()} onFight={() => {}} onFlee={() => {}} />,
                'canonical',
            ),
        );
        expect(tree.queryByText('EVENT/ENCOUNTER')).toBeNull();
        expect(tree.queryByText('KIND/COMBAT.PRELUDE')).toBeNull();
    });
});

describe('EncounterModalOverlay: FLEE-disabled-for-boss branch', () => {
    it('FIGHT is enabled regardless of variant', () => {
        const tree = render(
            withAesthetic(<EncounterModalOverlay vm={makeCombatPreludeVm()} onFight={() => {}} onFlee={() => {}} />),
        );
        const fight = tree.getByTestId('encounter-modal-fight');
        expect(fight.props.accessibilityState?.disabled).not.toBe(true);
    });

    it('FLEE is enabled on a regular encounter (variant === "encounter")', () => {
        const tree = render(
            withAesthetic(<EncounterModalOverlay vm={makeCombatPreludeVm()} onFight={() => {}} onFlee={() => {}} />),
        );
        const flee = tree.getByTestId('encounter-modal-flee');
        expect(flee.props.accessibilityState?.disabled).not.toBe(true);
    });

    it('FLEE is disabled when the VM flee choice has enabled: false', () => {
        const vm = makeCombatPreludeVm({
            variant: 'boss',
            choices: [
                {
                    id: 'fight',
                    label: 'FIGHT',
                    description: 'Combat · BOSS',
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
                    enabled: false,
                    subtitle: null, decode: null,
                },
            ],
        });
        const tree = render(
            withAesthetic(<EncounterModalOverlay vm={vm} onFight={() => {}} onFlee={() => {}} />),
        );
        const flee = tree.getByTestId('encounter-modal-flee');
        expect(flee.props.accessibilityState?.disabled).toBe(true);
    });

    it('FLEE shows the disabled-hint caption from vm.preludeChrome when disabled', () => {
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
            withAesthetic(<EncounterModalOverlay vm={vm} onFight={() => {}} onFlee={() => {}} />),
        );
        // The hint text from vm.preludeChrome.fleeDisabledHint
        // renders beneath the FLEE label when disabled.
        expect(tree.queryByText('no retreat from this one.')).not.toBeNull();
    });
});

describe('EncounterModalOverlay: non-dismissible backdrop (chat1 invariant)', () => {
    it('the overlay container has no onPress handler (backdrop swallows taps)', () => {
        const tree = render(
            withAesthetic(<EncounterModalOverlay vm={makeCombatPreludeVm()} onFight={() => {}} onFlee={() => {}} />),
        );
        const overlay = tree.getByTestId('encounter-modal-overlay');
        // The pin: a future refactor that adds onPress to the overlay
        // root would silently break the "user cannot exit" invariant.
        expect(overlay.props.onPress).toBeUndefined();
    });
});

// ---------------------------------------------------------------------------
// Phase 63b — mode state machine (prelude → combat in-place)
// ---------------------------------------------------------------------------

describe('EncounterModalOverlay: prelude → combat mode transition', () => {
    function withAllProviders(child: React.ReactNode) {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        return (
            <AestheticModeProvider initialMode="canonical" skipHydration>
                <CombatModeProvider>
                    <GameStoreProvider store={store}>
                        {child}
                    </GameStoreProvider>
                </CombatModeProvider>
            </AestheticModeProvider>
        );
    }

    it('mounts the prelude content by default (FIGHT button visible)', () => {
        const tree = render(
            withAllProviders(
                <EncounterModalOverlay vm={makeCombatPreludeVm()} onFight={() => {}} onFlee={() => {}} />,
            ),
        );
        expect(tree.queryByTestId('encounter-modal-fight')).not.toBeNull();
        expect(tree.queryByTestId('encounter-modal-combat-mode')).toBeNull();
    });

    it('transitions to combat mode after FIGHT is pressed', () => {
        const tree = render(
            withAllProviders(
                <EncounterModalOverlay vm={makeCombatPreludeVm()} onFight={() => {}} onFlee={() => {}} />,
            ),
        );
        fireEvent.press(tree.getByTestId('encounter-modal-fight'));

        // Prelude content is gone; combat mode scroll wrap is mounted.
        expect(tree.queryByTestId('encounter-modal-fight')).toBeNull();
        expect(tree.queryByTestId('encounter-modal-combat-mode')).not.toBeNull();
    });

    it('still calls the onFight callback when FIGHT is pressed', () => {
        const onFight = jest.fn();
        const tree = render(
            withAllProviders(
                <EncounterModalOverlay vm={makeCombatPreludeVm()} onFight={onFight} onFlee={() => {}} />,
            ),
        );
        fireEvent.press(tree.getByTestId('encounter-modal-fight'));
        expect(onFight).toHaveBeenCalledTimes(1);
    });
});

// ---------------------------------------------------------------------------
// Phase 63c follow-up — modal stays mounted after engine clears the event
// slice (the regression user surfaced 2026-05-21).
// ---------------------------------------------------------------------------

describe('EncounterModalOverlay: combat mode survives vm.kind change', () => {
    function withAllProviders(child: React.ReactNode) {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        return (
            <AestheticModeProvider initialMode="canonical" skipHydration>
                <CombatModeProvider>
                    <GameStoreProvider store={store}>
                        {child}
                    </GameStoreProvider>
                </CombatModeProvider>
            </AestheticModeProvider>
        );
    }

    it('combat mode stays mounted even when vm.kind flips to "none" mid-encounter', () => {
        const localRender = render;
        // Initial vm is combat-prelude; user taps FIGHT; on the next
        // render the parent (exploration) passes a non-prelude vm
        // because pickEventChoice('fight') clears the event slice.
        // The overlay must NOT return null in this state — the user-
        // facing regression "combat modal disappears when I tap FIGHT".
        const initialVm = makeCombatPreludeVm();
        const { rerender, queryByTestId } = localRender(
            withAllProviders(
                <EncounterModalOverlay vm={initialVm} onFight={() => {}} onFlee={() => {}} />,
            ),
        );
        fireEvent.press(queryByTestId('encounter-modal-fight'));
        expect(queryByTestId('encounter-modal-combat-mode')).not.toBeNull();

        // Now simulate the parent re-rendering with a cleared event slice
        // (vm.kind flips to a non-prelude shape — what selectEventViewModel
        // returns when state.event.pending is null).
        const clearedVm: EventViewModel = {
            ...initialVm,
            kind: 'narrative-choice',
            preludeChrome: null,
        };
        rerender(
            withAllProviders(
                <EncounterModalOverlay vm={clearedVm} onFight={() => {}} onFlee={() => {}} />,
            ),
        );

        // Pre-fix this would unmount (vm.kind !== 'combat-prelude' →
        // early-return null). Post-fix: combat mode stays mounted.
        expect(queryByTestId('encounter-modal-overlay')).not.toBeNull();
        expect(queryByTestId('encounter-modal-combat-mode')).not.toBeNull();
    });
});

// ---------------------------------------------------------------------------
// Phase 70 Tick A — combat → aftermath transition inside the modal
// ---------------------------------------------------------------------------

describe('EncounterModalOverlay: combat → aftermath swap', () => {
    function withAllProvidersAndOutcome(child: React.ReactNode) {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        // Helper component that fires the victory outcome after mount,
        // so the modal advances from combat → aftermath inside one
        // render cycle.
        function VictoryTrigger() {
            const { exitCombatWith } = useCombatMode();
            React.useEffect(() => {
                exitCombatWith('victory', {
                    variant: 'victory',
                    enemy: {
                        name: 'Larch-Stalker',
                        description: 'A figure long since gnawed.',
                        level: 3,
                    },
                    finalBlow: { skillName: 'STRIKE', damage: 24, descriptor: 'cleaves the rib' },
                    xpReward: 18,
                });
            }, [exitCombatWith]);
            return null;
        }
        return (
            <AestheticModeProvider initialMode="canonical" skipHydration>
                <CombatModeProvider>
                    <GameStoreProvider store={store}>
                        {child}
                        <VictoryTrigger />
                    </GameStoreProvider>
                </CombatModeProvider>
            </AestheticModeProvider>
        );
    }

    it('swaps to <CombatVictoryPanel> when lastOutcome flips to victory mid-combat', () => {
        const tree = render(
            withAllProvidersAndOutcome(
                <EncounterModalOverlay
                    vm={makeCombatPreludeVm()}
                    onFight={() => {}}
                    onFlee={() => {}}
                />,
            ),
        );
        // Tap FIGHT to enter combat mode first; the VictoryTrigger
        // effect then fires exitCombatWith('victory', snapshot),
        // which the overlay watches via useEffect.
        fireEvent.press(tree.getByTestId('encounter-modal-fight'));

        // Aftermath panel mounted; combat ScrollView gone.
        expect(tree.queryByTestId('combat-victory-panel')).not.toBeNull();
        expect(tree.queryByTestId('encounter-modal-combat-mode')).toBeNull();

        // The enemy name was sourced from the snapshot, not the (now-null) combat slice.
        expect(tree.queryByTestId('combat-victory-panel-enemy-name')?.props.children).toBe(
            'LARCH-STALKER',
        );
    });

    it('CARRY ON dismisses the aftermath and unmounts the panel', () => {
        const tree = render(
            withAllProvidersAndOutcome(
                <EncounterModalOverlay
                    vm={makeCombatPreludeVm()}
                    onFight={() => {}}
                    onFlee={() => {}}
                />,
            ),
        );
        fireEvent.press(tree.getByTestId('encounter-modal-fight'));
        expect(tree.queryByTestId('combat-victory-panel')).not.toBeNull();

        // Press CARRY ON; dismissAftermath fires, lastOutcome clears,
        // aftermathData clears, modal-mode collapses back to combat
        // (the aftermath useEffect won't re-flip without aftermathData).
        fireEvent.press(tree.getByTestId('combat-victory-panel-carry-on'));
        expect(tree.queryByTestId('combat-victory-panel')).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// Phase 70 Tick B — parley swap
// ---------------------------------------------------------------------------

describe('EncounterModalOverlay: combat → aftermath swap (parley)', () => {
    function withParleyOutcome(child: React.ReactNode) {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        function ParleyTrigger() {
            const { exitCombatWith } = useCombatMode();
            React.useEffect(() => {
                exitCombatWith('parley', {
                    variant: 'parley',
                    enemy: {
                        name: 'Larch-Stalker',
                        description: 'A figure long since gnawed.',
                        level: 4,
                    },
                    xpReward: 12,
                    journalEntry: null,
                });
            }, [exitCombatWith]);
            return null;
        }
        return (
            <AestheticModeProvider initialMode="canonical" skipHydration>
                <CombatModeProvider>
                    <GameStoreProvider store={store}>
                        {child}
                        <ParleyTrigger />
                    </GameStoreProvider>
                </CombatModeProvider>
            </AestheticModeProvider>
        );
    }

    it('swaps to <CombatFriendshipPanel> when lastOutcome flips to parley', () => {
        const tree = render(
            withParleyOutcome(
                <EncounterModalOverlay
                    vm={makeCombatPreludeVm()}
                    onFight={() => {}}
                    onFlee={() => {}}
                />,
            ),
        );
        fireEvent.press(tree.getByTestId('encounter-modal-fight'));

        expect(tree.queryByTestId('combat-friendship-panel')).not.toBeNull();
        // Victory panel must NOT mount for the parley path.
        expect(tree.queryByTestId('combat-victory-panel')).toBeNull();
        // The pixel emblem (the lone carve-out) is present.
        expect(tree.queryByTestId('pixel-emblem')).not.toBeNull();
    });

    it('PART AS FRIENDS dismisses the aftermath', () => {
        const tree = render(
            withParleyOutcome(
                <EncounterModalOverlay
                    vm={makeCombatPreludeVm()}
                    onFight={() => {}}
                    onFlee={() => {}}
                />,
            ),
        );
        fireEvent.press(tree.getByTestId('encounter-modal-fight'));
        expect(tree.queryByTestId('combat-friendship-panel')).not.toBeNull();

        fireEvent.press(tree.getByTestId('combat-friendship-panel-part-as-friends'));
        expect(tree.queryByTestId('combat-friendship-panel')).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// Phase 70 Tick C — defeat swap
// ---------------------------------------------------------------------------

describe('EncounterModalOverlay: combat → aftermath swap (defeat)', () => {
    function withDefeatOutcome(child: React.ReactNode) {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        function DefeatTrigger() {
            const { exitCombatWith } = useCombatMode();
            React.useEffect(() => {
                exitCombatWith('defeat', {
                    variant: 'defeat',
                    enemy: {
                        name: 'Hierophant',
                        description: 'A figure long since gnawed.',
                        level: 7,
                    },
                    characterName: 'Worm-Eaten Pilgrim',
                    finalBlow: { skillName: 'AXE-FALL', damage: 28, descriptor: 'cleaves the rib' },
                    runSummary: { roundsEndured: 4, encountersFaced: 12, deepestNodeId: 'iii.b', currentMapId: 'fishing-village' },
                });
            }, [exitCombatWith]);
            return null;
        }
        return (
            <AestheticModeProvider initialMode="canonical" skipHydration>
                <CombatModeProvider>
                    <GameStoreProvider store={store}>
                        {child}
                        <DefeatTrigger />
                    </GameStoreProvider>
                </CombatModeProvider>
            </AestheticModeProvider>
        );
    }

    it('swaps to <CombatDefeatPanel> when lastOutcome flips to defeat', () => {
        const tree = render(
            withDefeatOutcome(
                <EncounterModalOverlay
                    vm={makeCombatPreludeVm()}
                    onFight={() => {}}
                    onFlee={() => {}}
                />,
            ),
        );
        fireEvent.press(tree.getByTestId('encounter-modal-fight'));

        expect(tree.queryByTestId('combat-defeat-panel')).not.toBeNull();
        expect(tree.queryByTestId('combat-victory-panel')).toBeNull();
        expect(tree.queryByTestId('combat-friendship-panel')).toBeNull();
    });

    it('let-the-page-close dismisses the panel', () => {
        const tree = render(
            withDefeatOutcome(
                <EncounterModalOverlay
                    vm={makeCombatPreludeVm()}
                    onFight={() => {}}
                    onFlee={() => {}}
                />,
            ),
        );
        fireEvent.press(tree.getByTestId('encounter-modal-fight'));
        expect(tree.queryByTestId('combat-defeat-panel')).not.toBeNull();

        fireEvent.press(tree.getByTestId('combat-defeat-panel-let-close'));
        expect(tree.queryByTestId('combat-defeat-panel')).toBeNull();
    });

    it('BEGIN AGAIN dismisses the panel', () => {
        const tree = render(
            withDefeatOutcome(
                <EncounterModalOverlay
                    vm={makeCombatPreludeVm()}
                    onFight={() => {}}
                    onFlee={() => {}}
                />,
            ),
        );
        fireEvent.press(tree.getByTestId('encounter-modal-fight'));
        expect(tree.queryByTestId('combat-defeat-panel')).not.toBeNull();

        fireEvent.press(tree.getByTestId('combat-defeat-panel-begin-again'));
        expect(tree.queryByTestId('combat-defeat-panel')).toBeNull();
    });

    // Phase 77 — BEGIN AGAIN now dispatches the engine's resetRun
    // primitive instead of patching player.health directly. Assert
    // the post-state reflects an actual engine reset (new runId,
    // full health, cleared effects).
    it('BEGIN AGAIN dispatches engine resetRun (new runId, full health, cleared effects)', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        // Seed a dirty player state so the engine reset has something
        // to actually clear: half health + a synthetic active effect.
        const initial = store.getState();
        store.setState({
            player: {
                ...initial.player,
                health: Math.max(1, Math.floor(initial.player.maxHealth / 2)),
                effects: [
                    {
                        effectId: 'tier1_body_attack',
                        intensity: 1,
                        remainingDuration: 2,
                        appliedAt: 1,
                        tier: 1,
                    } as any,
                ],
            },
        });
        const beforeRunId = store.getState().runId;
        const fullHealth = store.getState().player.maxHealth;
        expect(store.getState().player.health).toBeLessThan(fullHealth);
        expect(store.getState().player.effects).toHaveLength(1);

        function DefeatTrigger() {
            const { exitCombatWith } = useCombatMode();
            React.useEffect(() => {
                exitCombatWith('defeat', {
                    variant: 'defeat',
                    enemy: {
                        name: 'Hierophant',
                        description: 'A figure long since gnawed.',
                        level: 7,
                    },
                    characterName: 'Worm-Eaten Pilgrim',
                    finalBlow: { skillName: 'AXE-FALL', damage: 28, descriptor: 'cleaves the rib' },
                    runSummary: { roundsEndured: 4, encountersFaced: 12, deepestNodeId: 'iii.b', currentMapId: 'fishing-village' },
                });
            }, [exitCombatWith]);
            return null;
        }

        const tree = render(
            <AestheticModeProvider initialMode="canonical" skipHydration>
                <CombatModeProvider>
                    <GameStoreProvider store={store}>
                        <EncounterModalOverlay
                            vm={makeCombatPreludeVm()}
                            onFight={() => {}}
                            onFlee={() => {}}
                        />
                        <DefeatTrigger />
                    </GameStoreProvider>
                </CombatModeProvider>
            </AestheticModeProvider>,
        );

        fireEvent.press(tree.getByTestId('encounter-modal-fight'));
        expect(tree.queryByTestId('combat-defeat-panel')).not.toBeNull();

        fireEvent.press(tree.getByTestId('combat-defeat-panel-begin-again'));

        const after = store.getState();
        expect(after.runId).not.toBe(beforeRunId);
        expect(after.player.health).toBe(fullHealth);
        expect(after.player.effects).toHaveLength(0);
    });
});

// ---------------------------------------------------------------------------
// Phase 71 — phase-aware seal chrome (chain bars + border / glow)
// ---------------------------------------------------------------------------

describe('EncounterModalOverlay: phase-aware seal chrome', () => {
    function withAllProviders(child: React.ReactNode) {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        return (
            <AestheticModeProvider initialMode="canonical" skipHydration>
                <CombatModeProvider>
                    <GameStoreProvider store={store}>
                        {child}
                    </GameStoreProvider>
                </CombatModeProvider>
            </AestheticModeProvider>
        );
    }

    it('renders the prelude chain-bar labels (SEALED · AT ARMS + NO RETREAT)', () => {
        const tree = render(
            withAllProviders(
                <EncounterModalOverlay
                    vm={makeCombatPreludeVm()}
                    onFight={() => {}}
                    onFlee={() => {}}
                />,
            ),
        );
        // Both chain bars mount (top + bottom) — two testIDs.
        const bars = tree.queryAllByTestId('encounter-modal-chain');
        expect(bars).toHaveLength(2);
        expect(tree.queryByText('SEALED · AT ARMS')).not.toBeNull();
        expect(tree.queryByText('NO RETREAT')).not.toBeNull();
    });

    it('swaps to a ROUND chain-bar label after FIGHT (combat mode)', () => {
        const tree = render(
            withAllProviders(
                <EncounterModalOverlay
                    vm={makeCombatPreludeVm()}
                    onFight={() => {}}
                    onFlee={() => {}}
                />,
            ),
        );
        fireEvent.press(tree.getByTestId('encounter-modal-fight'));
        // The engine combat slice isn't seeded in this test (no
        // startCombat() called), so round defaults to 1 — the
        // chrome's combat branch fires with round=1 → "ROUND i".
        expect(tree.queryByText('SEALED · ROUND i')).not.toBeNull();
        expect(tree.queryByText('SEALED · AT ARMS')).toBeNull();
    });

    it('swaps to IT IS DONE + CARRY ON when the outcome lands (aftermath)', () => {
        function VictoryTrigger() {
            const { exitCombatWith } = useCombatMode();
            React.useEffect(() => {
                exitCombatWith('victory', {
                    variant: 'victory',
                    enemy: { name: 'Foe', description: 'A figure.', level: 1 },
                    finalBlow: { skillName: 'STRIKE', damage: 12, descriptor: 'd' },
                    xpReward: 5,
                });
            }, [exitCombatWith]);
            return null;
        }
        const tree = render(
            withAllProviders(
                <>
                    <EncounterModalOverlay
                        vm={makeCombatPreludeVm()}
                        onFight={() => {}}
                        onFlee={() => {}}
                    />
                    <VictoryTrigger />
                </>,
            ),
        );
        fireEvent.press(tree.getByTestId('encounter-modal-fight'));
        // After fight + victory outcome:
        expect(tree.queryByText('IT IS DONE')).not.toBeNull();
        expect(tree.queryByText('CARRY ON')).not.toBeNull();
        // Old labels are gone.
        expect(tree.queryByText('SEALED · AT ARMS')).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// Phase 200 — in-place hazard-pattern combat (Spec 26b) wired into the modal.
// Live map encounters now run the NEW combat full-screen over the dimmed map
// (legacy <CombatPanel> stays only as the no-foe fallback / dev /combat tab).
// ---------------------------------------------------------------------------

describe('EncounterModalOverlay: in-place hazard combat (Phase 200)', () => {
    function withAllProviders(child: React.ReactNode, store: ReturnType<typeof createAppStore>) {
        return (
            <AestheticModeProvider initialMode="canonical" skipHydration>
                <CombatModeProvider>
                    <GameStoreProvider store={store}>{child}</GameStoreProvider>
                </CombatModeProvider>
            </AestheticModeProvider>
        );
    }

    // Mirror the real `beginHazardEncounter` → ensureStarterSkills fallback so
    // the panel boots from a player with a real deck.
    function seedPlayerWithDeck(store: ReturnType<typeof createAppStore>) {
        const p = store.getState().player;
        store.setState({
            player: {
                ...p,
                knownSkills: Array.from(new Set([
                    ...(p.knownSkills ?? []),
                    'slippery-slope', 'eternal-regress', 'achilles-gambit',
                ])),
            },
        });
    }

    it('renders the FULL-SCREEN hazard combat (not legacy CombatPanel) after FIGHT when a foe is supplied', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        seedPlayerWithDeck(store);
        const tree = render(
            withAllProviders(
                <EncounterModalOverlay
                    vm={makeCombatPreludeVm()}
                    encounterEnemy={createMockEncounterEnemy()}
                    onFight={() => {}}
                    onFlee={() => {}}
                />,
                store,
            ),
        );
        fireEvent.press(tree.getByTestId('encounter-modal-fight'));

        // New hazard layer mounts; the legacy combat-mode ScrollView does NOT.
        expect(tree.queryByTestId('encounter-modal-hazard-combat')).not.toBeNull();
        expect(tree.queryByTestId('encounter-modal-combat-mode')).toBeNull();
        // The new board opens on its reveal screen (read the foe before committing).
        expect(tree.queryByTestId('combat-reveal')).not.toBeNull();
    });

    it('falls back to legacy combat mode when no foe is supplied (encounterEnemy null)', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const tree = render(
            withAllProviders(
                <EncounterModalOverlay
                    vm={makeCombatPreludeVm()}
                    onFight={() => {}}
                    onFlee={() => {}}
                />,
                store,
            ),
        );
        fireEvent.press(tree.getByTestId('encounter-modal-fight'));
        expect(tree.queryByTestId('encounter-modal-hazard-combat')).toBeNull();
        expect(tree.queryByTestId('encounter-modal-combat-mode')).not.toBeNull();
    });
});
