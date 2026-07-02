/**
 * Hermetic component tests — ModalRivet.
 */

import { describe, it, expect } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';
import { ModalRivet } from '../ModalRivet';

describe('ModalRivet', () => {
    it('renders rivet in top-left position', () => {
        const tree = render(<ModalRivet position="tl" />);
        const rivetWrap = tree.root.findByType('View');
        expect(rivetWrap.props.style).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ top: 6, left: 6 })
            ])
        );
    });

    it('renders rivet in top-right position', () => {
        const tree = render(<ModalRivet position="tr" />);
        const rivetWrap = tree.root.findByType('View');
        expect(rivetWrap.props.style).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ top: 6, right: 6 })
            ])
        );
    });

    it('renders rivet in bottom-left position', () => {
        const tree = render(<ModalRivet position="bl" />);
        const rivetWrap = tree.root.findByType('View');
        expect(rivetWrap.props.style).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ bottom: 6, left: 6 })
            ])
        );
    });

    it('renders rivet in bottom-right position', () => {
        const tree = render(<ModalRivet position="br" />);
        const rivetWrap = tree.root.findByType('View');
        expect(rivetWrap.props.style).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ bottom: 6, right: 6 })
            ])
        );
    });

    it('has correct pointer events disabled', () => {
        const tree = render(<ModalRivet position="tl" />);
        const rivetWrap = tree.root.findByType('View');
        expect(rivetWrap.props.pointerEvents).toBe('none');
    });
});