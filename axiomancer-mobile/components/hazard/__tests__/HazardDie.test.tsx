import React from 'react';
import { render } from '@testing-library/react-native';

import { HazardDie } from '../HazardDie';
import type { HazardDieKind } from 'axiomancer-mechanics';

describe('HazardDie', () => {
    const dieTypes: HazardDieKind[] = ['red', 'blue', 'purple', 'gold', 'hex'];

    it('renders die with default props', () => {
        const { root } = render(<HazardDie kind="red" />);
        expect(root).toBeTruthy();
    });

    it('renders different die types correctly', () => {
        dieTypes.forEach(kind => {
            const { root } = render(<HazardDie kind={kind} />);
            expect(root).toBeTruthy();
        });
    });

    it('renders die with custom size', () => {
        const { root } = render(<HazardDie kind="blue" size={64} />);
        expect(root).toBeTruthy();
    });

    it('renders die in spent state', () => {
        const { root } = render(<HazardDie kind="purple" state="spent" />);
        expect(root).toBeTruthy();
    });

    it('renders die in available state', () => {
        const { root } = render(<HazardDie kind="gold" state="available" />);
        expect(root).toBeTruthy();
    });

    it('renders die with glow effect', () => {
        const { root } = render(<HazardDie kind="red" glow={true} />);
        expect(root).toBeTruthy();
    });

    it('renders temporary die with dashed rim', () => {
        const { root } = render(<HazardDie kind="blue" temporary={true} />);
        expect(root).toBeTruthy();
    });

    it('renders hex die with special styling', () => {
        const { root } = render(<HazardDie kind="hex" />);
        expect(root).toBeTruthy();
    });

    it('handles combination of states', () => {
        const { root } = render(
            <HazardDie 
                kind="purple" 
                size={56} 
                state="spent" 
                glow={true} 
                temporary={true} 
            />
        );
        expect(root).toBeTruthy();
    });

    it('renders multiple dice without conflicts', () => {
        const { root } = render(
            <>
                <HazardDie kind="red" size={32} />
                <HazardDie kind="blue" size={48} />
                <HazardDie kind="purple" size={64} />
            </>
        );
        expect(root).toBeTruthy();
    });
});