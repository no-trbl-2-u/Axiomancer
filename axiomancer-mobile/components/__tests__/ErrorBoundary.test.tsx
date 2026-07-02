/**
 * Hermetic tests — `<ErrorBoundary>` + `ErrorScreen` debug fallback.
 *
 * The boundary catches subtree render errors so the app shows
 * a debug screen instead of breaking. Tests verify:
 * - Happy path passes children through unchanged
 * - Catches a thrown render error and shows the fallback
 * - Fallback surfaces error message + state snapshot fields
 * - TRY AGAIN resets the boundary
 *
 * React's testing renderer surfaces caught errors as warnings;
 * we silence the expected ones to keep test output clean.
 */

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { withAllProviders } from '@/test-utils/withAllProviders';

// Silence React's "The above error occurred in..." console.error +
// our own ErrorBoundary's `[ErrorBoundary] caught` log during the
// tests that intentionally throw.
const consoleSpy = {
    error: undefined as ReturnType<typeof jest.spyOn> | undefined,
};

beforeEach(() => {
    consoleSpy.error = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    consoleSpy.error?.mockRestore();
    consoleSpy.error = undefined;
});

function Boom({ message = 'kaboom' }: { message?: string }): React.ReactElement {
    throw new Error(message);
}

describe('ErrorBoundary: happy path', () => {
    it('renders children unchanged when no error throws', () => {
        const { tree } = withAllProviders(
            <ErrorBoundary>
                <Text testID="happy-child">all is well</Text>
            </ErrorBoundary>,
        );
        const rendered = render(tree);
        expect(rendered.queryByTestId('happy-child')).not.toBeNull();
        expect(rendered.queryByTestId('error-boundary-screen')).toBeNull();
    });
});

describe('ErrorBoundary: error capture (Phase 70 Tick D — in-world chrome)', () => {
    it('catches a thrown render error and mounts the fallback ErrorScreen', () => {
        const { tree } = withAllProviders(
            <ErrorBoundary>
                <Boom message="state-snapshot test crash" />
            </ErrorBoundary>,
        );
        const rendered = render(tree);
        expect(rendered.queryByTestId('error-boundary-screen')).not.toBeNull();
        // In-world gothic title (rendered twice — shadow + overlay
        // stack for the blood drop-shadow effect). queryAllByText
        // returns ≥1.
        expect(rendered.queryAllByText('THE BINDING TORE').length).toBeGreaterThanOrEqual(1);
    });

    it('renders the in-world error code (defaults to E_BOUND_LOOSE for plain Error)', () => {
        const { tree } = withAllProviders(
            <ErrorBoundary>
                <Boom message="plain-error-test" />
            </ErrorBoundary>,
        );
        const rendered = render(tree);
        expect(rendered.queryByTestId('error-boundary-code')?.props.children).toBe(
            'E_BOUND_LOOSE',
        );
    });

    it('maps TypeError onto E_PAGE_TORN', () => {
        // Throw a real TypeError (not just `new Error()` with name
        // set), so the deriveErrorCode mapping fires its
        // `name === 'TypeError'` branch.
        function BoomTypeError(): React.ReactElement {
            const x = null as unknown as { thing: React.ReactElement };
            return x.thing;
        }
        const { tree } = withAllProviders(
            <ErrorBoundary>
                <BoomTypeError />
            </ErrorBoundary>,
        );
        const rendered = render(tree);
        expect(rendered.queryByTestId('error-boundary-code')?.props.children).toBe(
            'E_PAGE_TORN',
        );
    });

    it('maps a network-mention error onto E_THE_LINE_WENT_QUIET', () => {
        const { tree } = withAllProviders(
            <ErrorBoundary>
                <Boom message="network fetch failed" />
            </ErrorBoundary>,
        );
        const rendered = render(tree);
        expect(rendered.queryByTestId('error-boundary-code')?.props.children).toBe(
            'E_THE_LINE_WENT_QUIET',
        );
    });

    it('renders the error message verbatim inside the technical panel', () => {
        const { tree } = withAllProviders(
            <ErrorBoundary>
                <Boom message="explicit-debug-line-42" />
            </ErrorBoundary>,
        );
        const rendered = render(tree);
        const technical = rendered.queryByTestId('error-boundary-technical');
        expect(technical).not.toBeNull();
        expect(String(technical?.props.children)).toContain('explicit-debug-line-42');
    });

    it('renders the scribe-note hint italic line', () => {
        const { tree } = withAllProviders(
            <ErrorBoundary>
                <Boom />
            </ErrorBoundary>,
        );
        const rendered = render(tree);
        expect(
            rendered.queryByText(/brittle binding came apart/),
        ).not.toBeNull();
    });

    it('renders the bottom consolation line', () => {
        const { tree } = withAllProviders(
            <ErrorBoundary>
                <Boom />
            </ErrorBoundary>,
        );
        const rendered = render(tree);
        expect(
            rendered.queryByText(/chronicle is incomplete/),
        ).not.toBeNull();
    });

    it('keeps the STATE SNAPSHOT diagnostics section accessible', () => {
        const { tree } = withAllProviders(
            <ErrorBoundary>
                <Boom />
            </ErrorBoundary>,
        );
        const rendered = render(tree);
        expect(rendered.queryByText('STATE SNAPSHOT')).not.toBeNull();
    });

    it('keeps the BUILD CONTEXT diagnostics section accessible', () => {
        const { tree } = withAllProviders(
            <ErrorBoundary>
                <Boom />
            </ErrorBoundary>,
        );
        const rendered = render(tree);
        expect(rendered.queryByText('BUILD CONTEXT')).not.toBeNull();
    });
});

describe('ErrorBoundary: COPY button pressed-state', () => {
    it('COPY toggles to COPIED on press (UI-only feedback)', () => {
        const { tree } = withAllProviders(
            <ErrorBoundary>
                <Boom />
            </ErrorBoundary>,
        );
        const rendered = render(tree);
        const copy = rendered.getByTestId('error-boundary-copy');
        // Pre-press label
        expect(rendered.queryByText('✎ COPY')).not.toBeNull();
        expect(rendered.queryByText('✎ COPIED')).toBeNull();
        fireEvent.press(copy);
        // Post-press: label flips
        expect(rendered.queryByText('✎ COPIED')).not.toBeNull();
    });
});

describe('ErrorBoundary: reset affordances', () => {
    it('✠ TRY AGAIN resets the boundary state', () => {
        // Use a parent that controls whether to throw so a second
        // render-after-reset doesn't crash again.
        let shouldThrow = true;
        function Switchable() {
            if (shouldThrow) throw new Error('first time');
            return <Text testID="recovered">recovered</Text>;
        }
        const { tree } = withAllProviders(
            <ErrorBoundary>
                <Switchable />
            </ErrorBoundary>,
        );
        const rendered = render(tree);
        expect(rendered.queryByTestId('error-boundary-screen')).not.toBeNull();

        shouldThrow = false;
        fireEvent.press(rendered.getByTestId('error-boundary-try-again'));

        expect(rendered.queryByTestId('error-boundary-screen')).toBeNull();
        expect(rendered.queryByTestId('recovered')).not.toBeNull();
    });

    it('"return to the hearth" also resets the boundary state', () => {
        let shouldThrow = true;
        function Switchable() {
            if (shouldThrow) throw new Error('first time');
            return <Text testID="recovered">recovered</Text>;
        }
        const { tree } = withAllProviders(
            <ErrorBoundary>
                <Switchable />
            </ErrorBoundary>,
        );
        const rendered = render(tree);
        expect(rendered.queryByTestId('error-boundary-screen')).not.toBeNull();

        shouldThrow = false;
        fireEvent.press(rendered.getByTestId('error-boundary-return-hearth'));

        expect(rendered.queryByTestId('error-boundary-screen')).toBeNull();
        expect(rendered.queryByTestId('recovered')).not.toBeNull();
    });
});
