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
                    accessibilityLabel={`${t.label}, ${t.count === 0 ? 'empty' : `${t.count} ${t.count === 1 ? 'item' : 'items'}`}`}
                    accessibilityState={{ selected: activeTab === t.key }}
                    onPress={() => onTabPress(t.key)}
                    style={[styles.tab, activeTab === t.key && styles.tabActive]}
                    testID={`tab-${t.key}`}
                >
                    <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>
                        {t.label}
                    </Text>
                    {/* FE-010: always show the count. Hiding a zero left three of
                      * the five tabs (PHIALS, STUFF, SEALED) with a bare word beside
                      * two that carried numbers, which reads as tabs that failed to
                      * load rather than tabs that are empty. A zero renders dimmed so
                      * "empty" still looks different from "has things in it". */}
                    <Text
                        numberOfLines={1}
                        allowFontScaling={false}
                        style={[
                            styles.tabCount,
                            activeTab === t.key && styles.tabCountActive,
                            t.count === 0 && styles.tabCountEmpty,
                        ]}
                    >
                        {t.count}
                    </Text>
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
    // FE-018 — the badge sized to a single digit and sat in a flex row, so a
    // two-digit count broke '10' across two lines inside the pill. It keeps a
    // single-digit minimum but is no longer allowed to shrink or wrap.
    tabCount: {
        fontFamily: FONTS.mono,
        fontSize: 10,
        color: AXM.ash,
        backgroundColor: AXM.deepBg,
        borderRadius: 6,
        paddingHorizontal: 4,
        paddingVertical: 1,
        minWidth: 16,
        flexShrink: 0,
        textAlign: 'center',
    },
    tabCountActive: {
        color: AXM.bone,
        backgroundColor: AXM.panelBg,
    },
    // FE-010 — an empty tab still shows its 0, just quietly.
    tabCountEmpty: {
        opacity: 0.45,
    },
}));