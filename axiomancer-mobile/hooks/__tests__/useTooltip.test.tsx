/**
 * Phase 74 Tick A — useTooltip hook pin.
 *
 * Thin wrapper around `useTooltipContext`; verifies the hook
 * surfaces `show` + `hide` from the provider context.
 */

import { render } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import { useTooltip } from '@/hooks/useTooltip';
import { withAllProviders } from '@/test-utils/withAllProviders';

type Captured = ReturnType<typeof useTooltip>;

describe('useTooltip', () => {
    it('returns { show, hide } as functions inside the provider', () => {
        const capture: { value?: Captured } = {};
        function Probe() {
            capture.value = useTooltip();
            return <Text>probe</Text>;
        }
        const { tree } = withAllProviders(<Probe />);
        render(tree);
        expect(typeof capture.value?.show).toBe('function');
        expect(typeof capture.value?.hide).toBe('function');
    });

    it('returns no-op { show, hide } outside the provider', () => {
        const capture: { value?: Captured } = {};
        function Probe() {
            capture.value = useTooltip();
            return <Text>probe</Text>;
        }
        render(<Probe />);
        expect(typeof capture.value?.show).toBe('function');
        expect(typeof capture.value?.hide).toBe('function');
        expect(() => capture.value?.hide()).not.toThrow();
    });
});
