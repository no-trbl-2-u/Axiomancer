import React from 'react';
import { View, Text } from 'react-native';
import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';
import { SectionLabel } from '@/components/SectionLabel';
import { PlayerPortraitImage } from '@/components/art/PlayerPortraitImage';
import { EquipmentSlot } from './EquipmentSlot';
import type { EquipmentDockViewModel, EquipmentDockSlot } from '@/state/presenters/inventory.engine';

/** Stable React key per dock slot (the 3 accessory rows share a slot key, so
 *  fold in `accessoryIndex` to disambiguate — mirrors EquipmentSlot's testID). */
function dockSlotKey(slot: EquipmentDockSlot): string {
    return slot.accessoryIndex !== undefined ? `${slot.key}-${slot.accessoryIndex}` : slot.key;
}

interface EquipmentDockProps {
    vm: EquipmentDockViewModel;
    selectedSlot: EquipmentDockSlot['key'] | null;
    onSelectSlot: (key: EquipmentDockSlot['key'] | null) => void;
}

export function EquipmentDock({ vm, selectedSlot, onSelectSlot }: EquipmentDockProps) {
    const styles = useStyles();
    const AXM = usePalette();

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
            {/* Portrait on the left, all 5 worn slots stacked in a single column
                on the right. */}
            <View style={styles.dockGrid}>
                <View style={styles.dockPortrait} testID="equipment-dock-portrait">
                    <PlayerPortraitImage width="100%" height={260} fit="contain" contentPosition="center" />
                </View>
                <View style={styles.dockCol} testID="equipment-dock-slots">
                    {vm.slots.map((slot) => (
                        <EquipmentSlot
                            key={dockSlotKey(slot)}
                            slot={slot}
                            bareLabel={vm.bareLabel}
                            selected={selectedSlot === slot.key}
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
        alignItems: 'center',
        gap: 12,
    },
    dockCol: {
        // S3-sheet-C11: the gear list is the information in this dock, so it
        // takes every point the portrait does not claim. Under the old 50/50
        // split each row had ~110pt for its text and the grants sub-label broke
        // mid-word ('GRANTS READ THE ENTRA…').
        flex: 1,
        alignItems: 'stretch',
    },
    dockPortrait: {
        // S3-sheet-C11: a fixed narrow gutter instead of flex:1 — the bust is
        // decoration beside five named slots, not half the panel.
        width: 96,
        flexShrink: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
}));