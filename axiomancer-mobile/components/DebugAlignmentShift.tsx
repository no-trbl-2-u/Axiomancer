/**
 * Dev-only ALIGNMENT + MORAL controls.
 *
 * Three philosophical axes (epistemology / outlook / scope, each
 * -100..+100) shift by ±10 through the engine's
 * `shiftPhilosophicalAlignment`, and the moral meter (-100..+100) by
 * ±25 through `shiftMoralMeter` — so alignment-gated dialogue choices,
 * the Ledger's cube readout, and consequence copy can be driven to any
 * cell. Live values print on each row. Renders null outside dev builds.
 */

import React from 'react';
import type { GameState } from '@mechanics';

import { DevButton, DevButtons, DevRow } from '@/components/dev/DevControls';
import { isDevToolsEnabled } from '@/lib/buildProfile';
import { useGameState, useGameStore } from '@/state/GameStoreProvider';

const SHIFT_STEP = 10;
const MORAL_STEP = 25;

type AxisKey = 'epistemology' | 'outlook' | 'scope';

const AXES: readonly { key: AxisKey; label: string }[] = [
    { key: 'epistemology', label: 'EPIST' },
    { key: 'outlook', label: 'OUTLOOK' },
    { key: 'scope', label: 'SCOPE' },
];

export function DebugAlignmentShift() {
    const store = useGameStore();
    const alignment = useGameState((s) => (s as unknown as GameState).philosophicalAlignment);
    const moral = useGameState((s) => (s as unknown as GameState).moralMeter ?? 0);

    if (!isDevToolsEnabled()) return null;

    const onShift = (axis: AxisKey, sign: 1 | -1) =>
        store.getState().shiftPhilosophicalAlignment({ [axis]: sign * SHIFT_STEP });
    const onMoral = (sign: 1 | -1) => store.getState().shiftMoralMeter(sign * MORAL_STEP);

    return (
        <>
            {AXES.map((axis) => (
                <DevRow key={axis.key} label={`DEBUG · ${axis.label}`} sub={`${alignment?.[axis.key] ?? 0} · shift ±${SHIFT_STEP}`}>
                    <DevButtons>
                        <DevButton label={`−${SHIFT_STEP}`} onPress={() => onShift(axis.key, -1)} a11y={`Shift ${axis.key} alignment down by ${SHIFT_STEP}`} testID={`debug-align-${axis.key}-minus`} />
                        <DevButton label={`+${SHIFT_STEP}`} onPress={() => onShift(axis.key, 1)} a11y={`Shift ${axis.key} alignment up by ${SHIFT_STEP}`} testID={`debug-align-${axis.key}-plus`} />
                    </DevButtons>
                </DevRow>
            ))}
            <DevRow label="DEBUG · MORAL" sub={`${moral} · shift ±${MORAL_STEP}`}>
                <DevButtons>
                    <DevButton label={`−${MORAL_STEP}`} onPress={() => onMoral(-1)} a11y={`Shift the moral meter down by ${MORAL_STEP}`} testID="debug-moral-minus" />
                    <DevButton label={`+${MORAL_STEP}`} onPress={() => onMoral(1)} a11y={`Shift the moral meter up by ${MORAL_STEP}`} testID="debug-moral-plus" />
                </DevButtons>
            </DevRow>
        </>
    );
}
