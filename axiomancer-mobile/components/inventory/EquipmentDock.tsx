import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';
import { SectionLabel } from '@/components/SectionLabel';
import { PlayerPortraitImage } from '@/components/art/PlayerPortraitImage';
import { EquipmentSlot } from './EquipmentSlot';
import type { EquipmentDockViewModel, EquipmentDockSlot } from '@/state/presenters/inventory.engine';

/** Pair the flat slot list into rows of {left, right} per the design grid. */
function pairDockRows(
    slots: readonly EquipmentDockSlot[],
): readonly (readonly [EquipmentDockSlot, EquipmentDockSlot | null])[] {
    // Chunk two-per-row in slot order, padding a trailing odd slot with `null`.
    // The dock ships 5 slots — Weapon, Armor, Trinket I/II/III — so this yields
    // rows [weapon, armor], [accessory-0, accessory-1], [accessory-2, null].
    // The portrait sits in the centre column, flanked by the two slot columns.
    const rows: (readonly [EquipmentDockSlot, EquipmentDockSlot | null])[] = [];
    for (let i = 0; i < slots.length; i += 2) {
        rows.push([slots[i], slots[i + 1] ?? null] as const);
    }
    return rows;
}

interface EquipmentDockProps {
    vm: EquipmentDockViewModel;
    selectedSlot: EquipmentDockSlot['key'] | null;
    onSelectSlot: (key: EquipmentDockSlot['key'] | null) => void;
}

export function EquipmentDock({ vm, selectedSlot, onSelectSlot }: EquipmentDockProps) {
    const styles = useStyles();
    const AXM = usePalette();
    const rows = useMemo(() => pairDockRows(vm.slots), [vm.slots]);

    return (
        <View style={styles.dock} testID="equipment-dock">
            {/* iron rivets in each corner */}
            {[
                [4, 4],
                [undefined, 4],
                [4, undefined],
                [undefined, undefined],
            ].map(([left, top], i) => (
                <View
                    key={i}
                    style={[
                        styles.dockRivet,
                        left !== undefined ? { left } : { right: 4 },
                        top !== undefined ? { top } : { bottom: 4 },
                    ]}
                />
            ))}
            <View style={styles.dockHeaderRow}>
                <SectionLabel size={9} color={AXM.bone}>{vm.headerLabel}</SectionLabel>
                <Text style={styles.dockHint}>{vm.hintLabel}</Text>
            </View>
            <View style={styles.dockGrid}>
                <View style={styles.dockCol}>
                    {rows.map(([L], r) => (
                        <EquipmentSlot
                            key={r}
                            slot={L}
                            bareLabel={vm.bareLabel}
                            selected={L !== null && selectedSlot === L.key}
                            onPress={onSelectSlot}
                        />
                    ))}
                </View>
                <View style={styles.dockSilhouette}>
                    <PlayerPortraitImage width={64} height={160} fit="contain" />
                </View>
                <View style={styles.dockCol}>
                    {rows.map(([, R], r) => (
                        <EquipmentSlot
                            key={r}
                            slot={R}
                            bareLabel={vm.bareLabel}
                            selected={R !== null && selectedSlot === R.key}
                            onPress={onSelectSlot}
                        />
                    ))}
                </View>
            </View>
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    dock: {
        position: 'relative',
        marginHorizontal: 10,
        marginVertical: 8,
        borderWidth: 2,
        borderColor: AXM.divider,
        backgroundColor: AXM.deepBg,
        padding: 10,
    },
    dockRivet: {
        position: 'absolute',
        width: 6,
        height: 6,
        backgroundColor: AXM.ash,
        borderRadius: 3,
    },
    dockHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 8,
    },
    dockHint: {
        fontFamily: FONTS.mono,
        fontSize: 8,
        color: AXM.bone,
        letterSpacing: 0.8,
    },
    dockGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    dockCol: {
        flex: 1,
    },
    dockSilhouette: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
    },
}));