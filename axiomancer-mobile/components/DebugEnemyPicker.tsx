/**
 * Dev-only ENEMY PICKER.
 *
 * Fight any authored foe from any map — every late-game boss included.
 * Pick a roster (map chips), then a foe (chips; bosses in blood). The
 * pick stages the same `combat-prelude` the live map produces
 * (`stageEncounter`, state/dev/enemy-picker.ts), jumps to the WILDS tab,
 * and `<EncounterModalOverlay>` engages — so rewards, journal unlocks,
 * and alignment deltas all pay out through the real `endCombat`.
 *
 * Renders null outside dev builds.
 */

import React, { useState } from 'react';
import { useRouter } from '@/lib/platform/router';
import type { GameState } from '@mechanics';

import { DevChip, DevChips, DevRow } from '@/components/dev/DevControls';
import { isDevToolsEnabled } from '@/lib/buildProfile';
import { useGameStore } from '@/state/GameStoreProvider';
import { listEnemies, listEnemyMaps, stageEncounter, type EnemyMapKey } from '@/state/dev/enemy-picker';

const MAPS = listEnemyMaps();

export function DebugEnemyPicker() {
    const store = useGameStore();
    const router = useRouter();
    const [feedback, setFeedback] = useState<string | null>(null);
    const [mapKey, setMapKey] = useState<EnemyMapKey | null>(null);

    if (!isDevToolsEnabled()) return null;

    /** Default the roster to wherever the player stands. */
    const currentMap = (store.getState() as unknown as GameState).world?.currentMap?.name;
    const active: EnemyMapKey = mapKey ?? (MAPS.includes(currentMap as EnemyMapKey) ? (currentMap as EnemyMapKey) : MAPS[0]);
    const roster = listEnemies(active);

    const onPick = (choice: (typeof roster)[number]) => {
        router.push('/(tabs)/exploration');
        stageEncounter(store, choice.enemy);
        setFeedback(`staged · ${choice.enemy.name}${choice.isBoss ? ' (boss)' : ''} · L${choice.enemy.level}`);
    };

    return (
        <DevRow label="DEBUG · ENEMY PICKER" sub={feedback ?? 'any foe, any map · bosses in red'} stacked testID="debug-enemy-picker">
            <DevChips testID="debug-enemy-maps">
                {MAPS.map((m) => (
                    <DevChip key={m} label={m} active={m === active} onPress={() => setMapKey(m)} a11y={`Show the ${m} roster`} testID={`debug-enemy-map-${m}`} />
                ))}
            </DevChips>
            <DevChips testID="debug-enemy-roster">
                {roster.map((c) => (
                    <DevChip
                        key={c.enemy.id}
                        label={c.label}
                        accent={c.isBoss}
                        onPress={() => onPick(c)}
                        a11y={`Fight ${c.enemy.name}${c.isBoss ? ', a boss' : ''}`}
                        testID={`debug-enemy-${c.enemy.id}`}
                    />
                ))}
            </DevChips>
        </DevRow>
    );
}
