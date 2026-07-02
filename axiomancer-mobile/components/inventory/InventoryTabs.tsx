import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';
import type { InventoryTab, InventoryTabRow } from '@/state/presenters/inventory.engine';

interface InventoryTabsProps {
    tabs: readonly InventoryTabRow[];
    activeTab: InventoryTab;
    onTabPress: (tab: InventoryTab) => void;
    dimmed?: boolean;
}

export function InventoryTabs({ tabs, activeTab, onTabPress, dimmed = false }: InventoryTabsProps) {
    const styles = useStyles();
    return (
        <View style={[styles.tabRow, dimmed && styles.tabRowDimmed]}>
            {tabs.map((t) => (
                <TouchableOpacity
                    key={t.key}
                    accessibilityRole="button"
                    accessibilityLabel={`${t.label}${t.count > 0 ? `, ${t.count} ${t.count === 1 ? 'item' : 'items'}` : ''}`}
                    accessibilityState={{ selected: activeTab === t.key }}
                    onPress={() => onTabPress(t.key)}
                    style={[styles.tab, activeTab === t.key && styles.tabActive]}
                    testID={`tab-${t.key}`}
                >
                    <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>
                        {t.label}
                    </Text>
                    {t.count > 0 && (
                        <Text style={[styles.tabCount, activeTab === t.key && styles.tabCountActive]}>
                            {t.count}
                        </Text>
                    )}
                </TouchableOpacity>
            ))}
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    tabRow: {
        flexDirection: 'row',
        marginHorizontal: 10,
        marginBottom: 6,
        gap: 1,
    },
    tabRowDimmed: {
        opacity: 0.4,
        pointerEvents: 'none',
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: 8,
        paddingHorizontal: 8,
        backgroundColor: AXM.panelBg,
        borderWidth: 1,
        borderColor: AXM.divider,
        borderBottomWidth: 2,
    },
    tabActive: {
        backgroundColor: AXM.bg,
        borderBottomColor: AXM.sulfur,
    },
    tabText: {
        fontFamily: FONTS.sans,
        fontSize: 11,
        color: AXM.bone,
        letterSpacing: 1.4,
        textTransform: 'uppercase',
    },
    tabTextActive: {
        color: AXM.parchment,
    },
    tabCount: {
        fontFamily: FONTS.mono,
        fontSize: 10,
        color: AXM.ash,
        backgroundColor: AXM.deepBg,
        borderRadius: 6,
        paddingHorizontal: 4,
        paddingVertical: 1,
        minWidth: 16,
        textAlign: 'center',
    },
    tabCountActive: {
        color: AXM.bone,
        backgroundColor: AXM.panelBg,
    },
}));