/**
 * Dev-only ITEM PICKER.
 *
 * Replaces the free-text "add item by id" input: every relic and every
 * consumable in the engine registries is a chip, so a tester never has
 * to remember an id. A tap calls `actions.addItemById` (the same
 * resolver the old input used) and prints the result on the sub line.
 *
 * Renders null outside dev builds.
 */

import React, { useState } from 'react';
import { consumableLibrary, relicLibrary } from '@mechanics';

import { DevChip, DevChips, DevRow } from '@/components/dev/DevControls';
import { isDevToolsEnabled } from '@/lib/buildProfile';
import { useGameActions } from '@/state/GameStoreProvider';

/** `relic-second-wind` → `second wind`; `minor-healing-potion` → `minor healing potion`. */
const chipLabel = (id: string): string => id.replace(/^relic-/, '').replace(/-/g, ' ');

const RELIC_IDS = relicLibrary.map((r) => r.id);
const CONSUMABLE_IDS = consumableLibrary.map((c) => c.id);

export function DebugItemPicker() {
    const actions = useGameActions();
    const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

    if (!isDevToolsEnabled()) return null;

    const onPick = (id: string) => {
        const result = actions.addItemById(id);
        setFeedback(
            result.added
                ? { ok: true, text: `added · ${result.name} (${result.kind})` }
                : { ok: false, text: result.reason ?? 'add failed' },
        );
    };

    return (
        <DevRow
            label="DEBUG · ADD ITEM"
            sub={feedback?.text ?? `${RELIC_IDS.length} relics · ${CONSUMABLE_IDS.length} consumables`}
            subTone={feedback ? (feedback.ok ? 'ok' : 'err') : null}
            stacked
            testID="debug-item-picker"
        >
            <DevChips testID="debug-item-relics">
                {RELIC_IDS.map((id) => (
                    <DevChip key={id} label={chipLabel(id)} accent onPress={() => onPick(id)} a11y={`Add relic ${id} to the inventory`} testID={`debug-item-${id}`} />
                ))}
            </DevChips>
            <DevChips testID="debug-item-consumables">
                {CONSUMABLE_IDS.map((id) => (
                    <DevChip key={id} label={chipLabel(id)} onPress={() => onPick(id)} a11y={`Add consumable ${id} to the inventory`} testID={`debug-item-${id}`} />
                ))}
            </DevChips>
        </DevRow>
    );
}
