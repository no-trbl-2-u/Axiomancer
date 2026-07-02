/**
 * Phase 74 Tick A — TooltipProvider integration pins.
 *
 * Exercises show → measure → position → render → dismiss
 * through the public `useTooltip()` API. Anchor `measureInWindow`
 * is stubbed per-test so positioning math runs deterministically
 * without a real layout pass.
 *
 * Provider reads `useGameState`, so each suite mounts via
 * `withAllProviders`.
 */

import { act, fireEvent, render } from '@testing-library/react-native';
import React, { useRef } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { TooltipProvider } from '@/components/tooltip/TooltipProvider';
import { useTooltip } from '@/hooks/useTooltip';
import { CombatModeProvider } from '@/state/combat-mode';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import { AestheticModeProvider } from '@/state/aesthetic-mode';
import { createAppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';
import { withAllProviders } from '@/test-utils/withAllProviders';

interface AnchorChildProps {
    measureMock: jest.Mock;
    kind?: 'stat' | 'effect';
    id?: string;
}

function AnchorChild({ measureMock, kind = 'stat', id = 'HEART' }: AnchorChildProps) {
    const tooltip = useTooltip();
    const anchorRef = useRef<{ measureInWindow: jest.Mock }>({ measureInWindow: measureMock });
    return (
        <Pressable
            testID="anchor"
            onPress={() => tooltip.show({ kind, id, anchorRef: anchorRef as never })}
        >
            <Text>anchor</Text>
        </Pressable>
    );
}

describe('<TooltipProvider>', () => {
    afterEach(() => {
        jest.useRealTimers();
    });

    it('mounts the tooltip with content matching the kind+id on show', () => {
        const measureMock = jest.fn((cb: (x: number, y: number, w: number, h: number) => void) => {
            cb(40, 200, 80, 24);
        });
        const { tree } = withAllProviders(<AnchorChild measureMock={measureMock} />);
        const screen = render(tree);

        // No tooltip until show fires.
        expect(screen.queryByTestId('tap-tooltip')).toBeNull();

        fireEvent.press(screen.getByTestId('anchor'));

        expect(measureMock).toHaveBeenCalledTimes(1);
        expect(screen.queryByTestId('tap-tooltip')).not.toBeNull();
        expect(screen.queryByTestId('tap-tooltip-title')?.children?.[0]).toBe('HEART');
        expect(screen.queryByTestId('tap-tooltip-body')?.children?.[0]).toContain(
            "will to stay",
        );
    });

    it('dismisses when the backdrop is pressed', () => {
        const measureMock = jest.fn((cb: (x: number, y: number, w: number, h: number) => void) => {
            cb(40, 200, 80, 24);
        });
        const { tree } = withAllProviders(<AnchorChild measureMock={measureMock} />);
        const screen = render(tree);

        fireEvent.press(screen.getByTestId('anchor'));
        expect(screen.queryByTestId('tap-tooltip')).not.toBeNull();

        fireEvent.press(screen.getByTestId('tap-tooltip-backdrop'));
        expect(screen.queryByTestId('tap-tooltip')).toBeNull();
    });

    it('auto-dismisses after the 6s timeout', () => {
        jest.useFakeTimers();
        const measureMock = jest.fn((cb: (x: number, y: number, w: number, h: number) => void) => {
            cb(40, 200, 80, 24);
        });
        const { tree } = withAllProviders(<AnchorChild measureMock={measureMock} />);
        const screen = render(tree);

        fireEvent.press(screen.getByTestId('anchor'));
        expect(screen.queryByTestId('tap-tooltip')).not.toBeNull();

        act(() => {
            jest.advanceTimersByTime(5999);
        });
        expect(screen.queryByTestId('tap-tooltip')).not.toBeNull();

        act(() => {
            jest.advanceTimersByTime(1);
        });
        expect(screen.queryByTestId('tap-tooltip')).toBeNull();
    });

    it('toggles off when the same anchor is tapped twice', () => {
        const measureMock = jest.fn((cb: (x: number, y: number, w: number, h: number) => void) => {
            cb(40, 200, 80, 24);
        });
        const { tree } = withAllProviders(<AnchorChild measureMock={measureMock} />);
        const screen = render(tree);

        fireEvent.press(screen.getByTestId('anchor'));
        expect(screen.queryByTestId('tap-tooltip')).not.toBeNull();

        fireEvent.press(screen.getByTestId('anchor'));
        expect(screen.queryByTestId('tap-tooltip')).toBeNull();
    });

    it('does not mount when content is null (unwired kind)', () => {
        const measureMock = jest.fn((cb: (x: number, y: number, w: number, h: number) => void) => {
            cb(40, 200, 80, 24);
        });
        const { tree } = withAllProviders(
            <AnchorChild measureMock={measureMock} kind="effect" id="unknown-effect" />,
        );
        const screen = render(tree);

        fireEvent.press(screen.getByTestId('anchor'));
        // Content is null → measure should not even be consulted.
        expect(measureMock).not.toHaveBeenCalled();
        expect(screen.queryByTestId('tap-tooltip')).toBeNull();
    });

    it('exposes a no-op show outside the provider (NOOP_CONTEXT)', () => {
        function BareChild() {
            const tooltip = useTooltip();
            const anchorRef = useRef<{ measureInWindow: jest.Mock }>({
                measureInWindow: jest.fn(),
            });
            // Should not throw — NOOP context.
            tooltip.show({ kind: 'stat', id: 'HEART', anchorRef: anchorRef as never });
            return <Text testID="bare">ok</Text>;
        }
        const screen = render(<BareChild />);
        expect(screen.getByTestId('bare')).toBeTruthy();
    });
});

/**
 * Placement-math pins. These mount `<TooltipProvider>` directly
 * with an explicit `windowSize` (the prop the component exposes
 * specifically so tests can pin the geometry without depending on
 * the simulator's `Dimensions`). The anchor `measureInWindow`
 * stub feeds chosen `(x, y, h)` so each `positionTooltip` branch
 * is driven deterministically; the assertion reads the rendered
 * tooltip's resolved `left` / `top` style.
 *
 * Geometry constants the math derives from (mirrored from
 * `TooltipProvider.tsx`): EDGE_MARGIN 16, TOP_FLIP_THRESHOLD 100,
 * BOTTOM_FLIP_PADDING 60, TOOLTIP_ESTIMATED_HEIGHT 96,
 * TOOLTIP_MAX_WIDTH 280, ANCHOR_GAP 8.
 */
describe('<TooltipProvider> placement math', () => {
    function renderWithWindow(
        measureMock: jest.Mock,
        windowSize: { width: number; height: number },
    ) {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        return render(
            <AestheticModeProvider initialMode="canonical" skipHydration>
                <CombatModeProvider>
                    <GameStoreProvider store={store}>
                        <TooltipProvider windowSize={windowSize}>
                            <AnchorChild measureMock={measureMock} />
                        </TooltipProvider>
                    </GameStoreProvider>
                </CombatModeProvider>
            </AestheticModeProvider>,
        );
    }

    function measuredPosition(
        screen: ReturnType<typeof render>,
    ): { left: number; top: number } {
        const node = screen.getByTestId('tap-tooltip');
        const flat = StyleSheet.flatten(node.props.style) as {
            left: number;
            top: number;
        };
        return { left: flat.left, top: flat.top };
    }

    function measureAt(x: number, y: number, h: number) {
        return jest.fn((cb: (x: number, y: number, w: number, h: number) => void) => {
            cb(x, y, 80, h);
        });
    }

    it('renders above the anchor when y is past the top-flip threshold', () => {
        // y=200 ≥ 100 → not flipBelow → top = 200 - 96 - 8 = 96; left = x = 40.
        const screen = renderWithWindow(measureAt(40, 200, 24), { width: 400, height: 800 });
        fireEvent.press(screen.getByTestId('anchor'));
        expect(measuredPosition(screen)).toEqual({ left: 40, top: 96 });
    });

    it('flips below the anchor when y is under the top-flip threshold', () => {
        // y=50 < 100 → flipBelow → top = 50 + 24 + 8 = 82 (fits, tall window).
        const screen = renderWithWindow(measureAt(40, 50, 24), { width: 400, height: 800 });
        fireEvent.press(screen.getByTestId('anchor'));
        expect(measuredPosition(screen).top).toBe(82);
    });

    it('re-flips back above and clamps to the top margin when the below position would bleed off the bottom', () => {
        // y=50 → flipBelow top=82; 82+96=178 > 150-60=90 → re-flip
        // above: 50-96-8 = -54; then < 16 → clamped to EDGE_MARGIN 16.
        const screen = renderWithWindow(measureAt(40, 50, 24), { width: 400, height: 150 });
        fireEvent.press(screen.getByTestId('anchor'));
        expect(measuredPosition(screen).top).toBe(16);
    });

    it('clamps the left edge up to the edge margin when x is too far left', () => {
        // x=4 < 16 → left clamped to EDGE_MARGIN 16.
        const screen = renderWithWindow(measureAt(4, 200, 24), { width: 400, height: 800 });
        fireEvent.press(screen.getByTestId('anchor'));
        expect(measuredPosition(screen).left).toBe(16);
    });

    it('clamps the left edge down to keep the tooltip on-screen when x is too far right', () => {
        // maxLeft = width - 280 - 16 = 400 - 296 = 104; x=9999 > 104 → 104.
        const screen = renderWithWindow(measureAt(9999, 200, 24), { width: 400, height: 800 });
        fireEvent.press(screen.getByTestId('anchor'));
        expect(measuredPosition(screen).left).toBe(104);
    });

    it('retries measurement one frame when the anchor reports a zero box, then positions from the retry', () => {
        const rafSpy = jest
            .spyOn(global, 'requestAnimationFrame')
            .mockImplementation((cb: FrameRequestCallback) => {
                cb(0);
                return 0 as unknown as number;
            });
        // First measure → (0,0,0,0) zero box → schedules rAF retry;
        // retry measure → real coords (40, 200, 24) → top = 96.
        let call = 0;
        const measureMock = jest.fn(
            (cb: (x: number, y: number, w: number, h: number) => void) => {
                call += 1;
                if (call === 1) cb(0, 0, 0, 0);
                else cb(40, 200, 80, 24);
            },
        );
        const screen = renderWithWindow(measureMock, { width: 400, height: 800 });

        fireEvent.press(screen.getByTestId('anchor'));

        expect(rafSpy).toHaveBeenCalledTimes(1);
        expect(measureMock).toHaveBeenCalledTimes(2);
        expect(measuredPosition(screen)).toEqual({ left: 40, top: 96 });
        rafSpy.mockRestore();
    });

    it('retries exactly once — a second zero box is taken at face value, not retried again', () => {
        const rafSpy = jest
            .spyOn(global, 'requestAnimationFrame')
            .mockImplementation((cb: FrameRequestCallback) => {
                cb(0);
                return 0 as unknown as number;
            });
        // Both the initial measure and the retry report a zero box.
        // The retry runs with isRetry=true, so the zero-guard does
        // NOT re-fire: only one rAF is scheduled, measure is called
        // twice total, and the tooltip positions from the (clamped)
        // zero origin rather than looping forever.
        const measureMock = measureAt(0, 0, 0);
        const screen = renderWithWindow(measureMock, { width: 400, height: 800 });

        fireEvent.press(screen.getByTestId('anchor'));

        expect(rafSpy).toHaveBeenCalledTimes(1);
        expect(measureMock).toHaveBeenCalledTimes(2);
        // x=0 → left clamped to EDGE_MARGIN 16; y=0 < 100 → flipBelow
        // top = 0 + 0 + 8 = 8, then < 16 → clamped to EDGE_MARGIN 16.
        expect(measuredPosition(screen)).toEqual({ left: 16, top: 16 });
        rafSpy.mockRestore();
    });
});
