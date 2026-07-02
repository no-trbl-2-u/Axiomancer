/**
 * Hermetic component tests — CorruptSaveModal surface (Phase 53).
 *
 * Pins the boot-time save-corrupted prompt: copy register, button
 * routing, accessibility labels. Mount is driven by the `visible`
 * prop so tests don't have to drive React Native's <Modal>
 * mount/unmount lifecycle.
 */

import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import {
    CORRUPT_SAVE_COPY,
    CorruptSaveModal,
} from '@/components/CorruptSaveModal';

describe('CorruptSaveModal: mount contract', () => {
    it('renders nothing when visible=false', () => {
        const tree = render(
            <CorruptSaveModal
                visible={false}
                onConfirm={() => undefined}
                onCancel={() => undefined}
            />,
        );
        // React Native's <Modal visible={false}> doesn't render children.
        // queryByTestId returns null when the modal is hidden.
        expect(tree.queryByTestId('corrupt-save-confirm')).toBeNull();
        expect(tree.queryByTestId('corrupt-save-cancel')).toBeNull();
    });

    it('renders the panel when visible=true', () => {
        const tree = render(
            <CorruptSaveModal
                visible={true}
                onConfirm={() => undefined}
                onCancel={() => undefined}
            />,
        );
        expect(tree.queryByTestId('corrupt-save-confirm')).not.toBeNull();
        expect(tree.queryByTestId('corrupt-save-cancel')).not.toBeNull();
    });

    it('renders the design-source copy block (eyebrow + title + body)', () => {
        const tree = render(
            <CorruptSaveModal
                visible={true}
                onConfirm={() => undefined}
                onCancel={() => undefined}
            />,
        );
        expect(tree.queryByText(CORRUPT_SAVE_COPY.eyebrow)).not.toBeNull();
        expect(tree.queryByText(CORRUPT_SAVE_COPY.title)).not.toBeNull();
        expect(tree.queryByText(CORRUPT_SAVE_COPY.body)).not.toBeNull();
    });
});

describe('CorruptSaveModal: callbacks', () => {
    it('confirm button fires onConfirm exactly once', () => {
        const onConfirm = jest.fn();
        const onCancel = jest.fn();
        const tree = render(
            <CorruptSaveModal visible onConfirm={onConfirm} onCancel={onCancel} />,
        );
        fireEvent.press(tree.getByTestId('corrupt-save-confirm'));
        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(onCancel).not.toHaveBeenCalled();
    });

    it('cancel button fires onCancel exactly once', () => {
        const onConfirm = jest.fn();
        const onCancel = jest.fn();
        const tree = render(
            <CorruptSaveModal visible onConfirm={onConfirm} onCancel={onCancel} />,
        );
        fireEvent.press(tree.getByTestId('corrupt-save-cancel'));
        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(onConfirm).not.toHaveBeenCalled();
    });
});

describe('CorruptSaveModal: voice register (Phase 33)', () => {
    it('title uses lowercase ritual register (no second-person archaic pronouns)', () => {
        // Tight pin: the body sentence must be lowercase + no
        // banned second-person archaic pronouns. The eyebrow + the
        // button labels are uppercase chrome per the existing voice
        // contract (chrome = caps; ritual narrative = lowercase).
        expect(CORRUPT_SAVE_COPY.title).toBe(CORRUPT_SAVE_COPY.title.toLowerCase());
        expect(CORRUPT_SAVE_COPY.body).toBe(CORRUPT_SAVE_COPY.body.toLowerCase());
        const banned = /\b(thou|thee|thy|thine|ye)\b/i;
        expect(CORRUPT_SAVE_COPY.body).not.toMatch(banned);
        expect(CORRUPT_SAVE_COPY.title).not.toMatch(banned);
    });
});

describe('CorruptSaveModal: accessibility', () => {
    it('confirm button surfaces the confirm label as accessibilityLabel', () => {
        const tree = render(
            <CorruptSaveModal
                visible
                onConfirm={() => undefined}
                onCancel={() => undefined}
            />,
        );
        const btn = tree.getByTestId('corrupt-save-confirm');
        expect(btn.props.accessibilityLabel).toBe(CORRUPT_SAVE_COPY.confirmLabel);
        expect(btn.props.accessibilityRole).toBe('button');
    });

    it('cancel button surfaces the cancel label as accessibilityLabel', () => {
        const tree = render(
            <CorruptSaveModal
                visible
                onConfirm={() => undefined}
                onCancel={() => undefined}
            />,
        );
        const btn = tree.getByTestId('corrupt-save-cancel');
        expect(btn.props.accessibilityLabel).toBe(CORRUPT_SAVE_COPY.cancelLabel);
        expect(btn.props.accessibilityRole).toBe('button');
    });
});
