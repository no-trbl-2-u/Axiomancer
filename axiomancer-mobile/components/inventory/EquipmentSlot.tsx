import React, { useRef } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';
import { ItemGlyph } from '@/components/inventory/ItemCard';
import { useTooltip } from '@/hooks/useTooltip';
import type { EquipmentDockSlot } from '@/state/presenters/inventory.engine';

interface EquipmentSlotProps {
    slot: EquipmentDockSlot | null;
    bareLabel: string;
    selected: boolean;
    onPress: (key: EquipmentDockSlot['key'] | null) => void;
}

export function EquipmentSlot({ slot, bareLabel, selected, onPress }: EquipmentSlotProps) {
    // Phase 74 follow-up walkthrough Tick 1: long-press fires the
    // kind:'slot' tooltip (content shared with the SELF surface).
    // Single-tap stays for slot-filter select (existing behaviour),
    // mirroring Phase 75 skill-row pattern.
    const styles = useStyles();
    const tooltip = useTooltip();
    const slotRef = useRef<View | null>(null);

    if (slot === null) {
        return <View style={styles.dockSlotEmpty} />;
    }
    
    const filled = slot.item !== null;
    
    return (
        <TouchableOpacity
            ref={slotRef}
            accessibilityRole="button"
            accessibilityLabel={`${slot.label} slot${filled && slot.item ? `, ${slot.item.name}` : ', empty'}`}
            accessibilityHint="hold to read slot description"
            accessibilityState={{ selected }}
            onPress={() => onPress(selected ? null : slot.key)}
            onLongPress={() => tooltip.show({ kind: 'slot', id: slot.key, anchorRef: slotRef })}
            style={[
                styles.dockSlot,
                filled ? styles.dockSlotFilled : styles.dockSlotBare,
                selected && styles.dockSlotSelected,
            ]}
            testID={`dock-slot-${slot.key}`}
        >
            <View style={[styles.dockSlotGlyph, filled ? styles.dockSlotGlyphFilled : styles.dockSlotGlyphBare]}>
                {filled && slot.item !== null ? (
                    <ItemGlyph category="equipment" sub={slot.item.sub} />
                ) : (
                    <Text style={styles.dockSlotEmptyMark}>∅</Text>
                )}
            </View>
            <View style={styles.dockSlotText}>
                <Text style={styles.dockSlotLabel}>{slot.label}</Text>
                <Text
                    numberOfLines={1}
                    style={filled ? styles.dockSlotItemName : styles.dockSlotItemBare}
                >
                    {filled && slot.item !== null ? slot.item.name : bareLabel}
                </Text>
            </View>
        </TouchableOpacity>
    );
}

const useStyles = makeStyles((AXM) => ({
    dockSlotEmpty: {
        height: 64,
    },
    dockSlot: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        height: 64,
        borderWidth: 1,
        borderColor: AXM.divider,
        marginBottom: 6,
        backgroundColor: AXM.panelBg,
        paddingHorizontal: 8,
        paddingVertical: 6,
    },
    dockSlotFilled: {
        borderColor: AXM.sulfur,
        backgroundColor: AXM.bg,
    },
    dockSlotBare: {
        backgroundColor: AXM.panelBg,
        borderStyle: 'dashed',
    },
    dockSlotSelected: {
        borderWidth: 2,
        borderColor: AXM.bone,
    },
    dockSlotGlyph: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    dockSlotGlyphFilled: {
        borderColor: AXM.bone,
        backgroundColor: AXM.panelBg,
    },
    dockSlotGlyphBare: {
        borderColor: AXM.ash,
        backgroundColor: AXM.bg,
    },
    dockSlotEmptyMark: {
        fontFamily: FONTS.mono,
        fontSize: 20,
        color: AXM.ash,
        lineHeight: 22,
    },
    dockSlotText: {
        flex: 1,
        minWidth: 0,
    },
    dockSlotLabel: {
        fontFamily: FONTS.sans,
        fontSize: 9,
        color: AXM.bone,
        letterSpacing: 1.6,
        textTransform: 'uppercase',
        lineHeight: 12,
    },
    dockSlotItemName: {
        fontFamily: FONTS.serif,
        fontSize: 12,
        color: AXM.parchment,
        lineHeight: 14,
    },
    dockSlotItemBare: {
        fontFamily: FONTS.serifItalic,
        fontSize: 12,
        color: AXM.bone,
        lineHeight: 14,
    },
}));