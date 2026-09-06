/**
 * Dev-only EFFECT picker.
 *
 * Every buff and debuff in the engine's `effectsLibrary` is a chip
 * (debuffs in blood). A tap runs the engine's `applyEffect` against the
 * player's active list so stacking / duration rules are the real ones,
 * and CLEAR wipes the list. Pairs with the STATE inspector's `effects`
 * row to watch durations tick.
 *
 * Renders null outside dev builds.
 */

import React, { useState } from 'react';
import { applyEffect, effectsLibrary } from '@mechanics';
import type { Effect } from '@mechanics';

import { DevButton, DevButtons, DevChip, DevChips, DevRow } from '@/components/dev/DevControls';
import { isDevToolsEnabled } from '@/lib/buildProfile';
import { useGameStore } from '@/state/GameStoreProvider';

const BUFFS: readonly Effect[] = effectsLibrary.buffs;
const DEBUFFS: readonly Effect[] = effectsLibrary.debuffs;

export function DebugEffectApply() {
    const store = useGameStore();
    const [feedback, setFeedback] = useState<string | null>(null);

    if (!isDevToolsEnabled()) return null;

    const onApply = (effect: Effect) => {
        const player = store.getState().player;
        const { activeEffects } = applyEffect([...(player.effects ?? [])], effect, 0);
        store.setState({ player: { ...player, effects: activeEffects } });
        setFeedback(`applied · ${effect.id} · ${activeEffects.length} active`);
    };

    const onClear = () => {
        const player = store.getState().player;
        store.setState({ player: { ...player, effects: [] } });
        setFeedback('cleared');
    };

    return (
        <DevRow label="DEBUG · EFFECTS" sub={feedback ?? `${BUFFS.length} buffs · ${DEBUFFS.length} debuffs (red)`} stacked testID="debug-effects">
            <DevChips testID="debug-effect-buffs">
                {BUFFS.map((e) => (
                    <DevChip key={e.id} label={e.name} onPress={() => onApply(e)} a11y={`Apply ${e.name} to the player`} testID={`debug-effect-${e.id}`} />
                ))}
            </DevChips>
            <DevChips testID="debug-effect-debuffs">
                {DEBUFFS.map((e) => (
                    <DevChip key={e.id} label={e.name} accent onPress={() => onApply(e)} a11y={`Apply ${e.name} to the player`} testID={`debug-effect-${e.id}`} />
                ))}
            </DevChips>
            <DevButtons>
                <DevButton label="CLEAR" onPress={onClear} a11y="Remove every active effect from the player" testID="debug-effect-clear" />
            </DevButtons>
        </DevRow>
    );
}
