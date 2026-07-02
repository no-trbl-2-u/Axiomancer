import React, { useCallback, useMemo, useState } from 'react';
import { View, Text } from 'react-native';
import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';
import { ScreenBg } from '@/components/ScreenBg';
import { SectionLabel } from '@/components/SectionLabel';
import { StatBar } from '@/components/StatBar';
import { TooltipTarget } from '@/components/tooltip/TooltipTarget';
import { EquipmentDock } from '@/components/inventory/EquipmentDock';
import { InventoryTabs } from '@/components/inventory/InventoryTabs';
import { ItemGrid } from '@/components/inventory/ItemGrid';
import { ItemModal } from '@/components/inventory/ItemModal';
import { SlotBanner } from '@/components/inventory/SlotBanner';
import { useGameActions, useGameState, useGameStore } from '@/state/GameStoreProvider';
import {
    selectInventoryViewModel,
    type EquipmentDockSlot,
    type InventoryTab,
} from '@/state/presenters/inventory.engine';
import {
    selectItemModalViewModel,
    type ItemModalViewModel,
} from '@/state/presenters/inventory.modal.engine';

export default function InventoryScreen() {
    const AXM = usePalette();
    const styles = useStyles();
    const [activeTab, setActiveTab] = useState<InventoryTab>('all');
    const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
    const [modalItemId, setModalItemId] = useState<string | null>(null);
    // Phase 32 sub-tick F follow-up: tap a dock slot to filter the sack
    // to compatible items. selectedSlot === null when no filter active;
    // selecting filter clears the tab pick (mirrors design — slot filter
    // and tab filter are mutually exclusive). Re-tapping the same slot
    // clears the filter.
    const [selectedSlot, setSelectedSlot] = useState<EquipmentDockSlot['key'] | null>(null);
    const onSelectSlot = useCallback((key: EquipmentDockSlot['key'] | null) => {
        setSelectedSlot(key);
        if (key !== null) setActiveTab('all');
    }, []);

    // Subscribe to `player` so the screen re-renders on inventory changes.
    // The selector pattern (`useGameState(s => selectVM(s, localUi))`) breaks
    // referential equality because `freezeViewModel` returns a fresh object
    // each call; rebuilding the VM in `useMemo` keyed by `player` avoids the
    // resulting re-render loop.
    const player = useGameState((s) => s.player);
    const store = useGameStore();
    const actions = useGameActions();

    const vm = useMemo(
        () => selectInventoryViewModel(store.getState(), { activeTab, expandedItemId, selectedSlot }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [store, activeTab, expandedItemId, selectedSlot, player],
    );

    const modalVm = useMemo<ItemModalViewModel | null>(() => {
        if (modalItemId === null) return null;
        return selectItemModalViewModel(store.getState(), modalItemId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [modalItemId, store, player]);

    const onConfirmModal = useCallback(() => {
        if (modalVm === null || modalVm.itemId === null) {
            setModalItemId(null);
            return;
        }
        if (modalVm.mode === 'use') {
            actions.useItem(modalVm.itemId);
        } else if (modalVm.mode === 'equip') {
            actions.equipItem(modalVm.itemId);
        } else if (modalVm.mode === 'unequip') {
            // User-jot 2026-05-22 (oversight 29th): unequip is the
            // swap counterpart to equip; mobile "first-per-slot =
            // worn" convention surfaces it as a slot-peer swap.
            actions.unequipItem(modalVm.itemId);
        }
        // mode === 'view' (e.g. WORN sole-item-in-slot) → no
        // dispatch; just dismiss the modal.
        setModalItemId(null);
        setExpandedItemId(null);
    }, [actions, modalVm]);

    const onDiscard = useCallback(
        (itemId: string) => {
            actions.dropItem(itemId);
            setExpandedItemId(null);
        },
        [actions],
    );

    const onItemTap = useCallback((itemId: string) => {
        const item = vm.items.find(it => it.id === itemId);
        if (!item) return;
        
        // For equipment, go directly to modal instead of expanding
        if (item.category === 'equipment' && item.canUse) {
            setModalItemId(itemId);
        } else {
            // For other items, expand to show details first
            setExpandedItemId(expandedItemId === itemId ? null : itemId);
        }
    }, [vm.items, expandedItemId]);

    return (
        // Non-scrolling page — the header / dock / tabs stay fixed and only
        // the item list scrolls, inside its own bordered panel (below).
        <ScreenBg scrollable={false}>
            <View style={styles.header}>
                <SectionLabel size={9} color={AXM.bone}>{vm.sectionHeader}</SectionLabel>
                <View style={styles.headerRow}>
                    <Text style={styles.title}>INVENTORY</Text>
                    <View style={styles.shillingBox}>
                        <Text style={styles.shillingLabel}>SHILLING</Text>
                        <Text style={styles.shillingVal}>⚜ {vm.shilling}</Text>
                    </View>
                </View>
                <View style={styles.burdenSection}>
                    {/* Phase 74 follow-up walkthrough — wrap the
                        burden bar in a TooltipTarget pointing at
                        the new kind:'burden' content. Tap explains
                        what burden does + the over-cap consequence. */}
                    <TooltipTarget
                        kind="burden"
                        id="burden"
                        accessibilityLabel="Explain burden"
                        accessibilityHint="tap to read description"
                        testID="inventory-burden-tooltip-target"
                    >
                        <StatBar value={vm.burden} max={vm.burdenMax} color={AXM.rust} label="BURDEN · STONE" height={9} />
                    </TooltipTarget>
                </View>
            </View>

            <EquipmentDock vm={vm.equipmentDock} selectedSlot={selectedSlot} onSelectSlot={onSelectSlot} />

            {vm.equipmentDock.selectedSlot !== null && (
                <SlotBanner
                    bannerEyebrow={vm.equipmentDock.bannerEyebrow}
                    bannerSlotLabel={vm.equipmentDock.bannerSlotLabel}
                    bannerClearLabel={vm.equipmentDock.bannerClearLabel}
                    onClear={() => setSelectedSlot(null)}
                />
            )}

            <InventoryTabs
                tabs={vm.tabs}
                activeTab={activeTab}
                onTabPress={setActiveTab}
                dimmed={selectedSlot !== null}
            />

            <ItemGrid
                items={vm.items}
                categoryHeaders={vm.categoryHeaders}
                emptyMessage={vm.emptyMessage}
                isEmpty={vm.isEmpty}
                expandedItemId={expandedItemId}
                onItemTap={onItemTap}
                onUseOrEquip={(itemId) => setModalItemId(itemId)}
                onDiscard={onDiscard}
            />

            <ItemModal
                modalVm={modalVm}
                onConfirm={onConfirmModal}
                onCancel={() => setModalItemId(null)}
            />
        </ScreenBg>
    );
}

const useStyles = makeStyles((AXM) => ({
    header: { padding: 14, paddingBottom: 0 },
    headerRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
    title: { fontFamily: FONTS.gothic, fontSize: 28, lineHeight: 30, color: AXM.parchment, marginTop: 2 },
    shillingBox: { alignItems: 'flex-end' },
    shillingLabel: { fontFamily: FONTS.mono, fontSize: 11, color: AXM.bone, letterSpacing: 1 },
    shillingVal: { fontFamily: FONTS.gothic, fontSize: 22, color: AXM.sulfur, lineHeight: 24 },
    burdenSection: {
        marginTop: 8,
    },
}));