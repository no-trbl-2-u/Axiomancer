import { Tabs } from '@/lib/platform/router';
import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';
import { AxmIcon, type AxmIconName } from '@/components/icons';
import { useCombatMode } from '@/state/combat-mode';
import {
  TAB_BAR_LABEL_FONT_SIZE,
  TAB_BAR_LABEL_LETTER_SPACING,
  TAB_TITLES,
} from '@/state/presenters/tabs.engine';
import { useGameState } from '@/state/GameStoreProvider';
import { selectTabBadges } from '@/state/presenters/navigation.engine';
import ExplorationScreen from './exploration/index';
import CharacterScreen from './character/index';
import MemoirScreen from './memoir/index';
import InventoryScreen from './inventory/index';
import DeckScreen from './deck/index';

function TabBadge({ text, kind }: { text: string; kind: 'event' | 'levelup' }) {
  const AXM = usePalette();
  const styles = useStyles();
  const badgeColor = kind === 'levelup' ? AXM.sulfur : AXM.blood;

  return (
    <View style={[styles.badge, { backgroundColor: badgeColor }]}>
      <Text style={styles.badgeText}>{text}</Text>
    </View>
  );
}

// Tab icons come from the icon canon (Phase V1) — the same registry
// marks the exploration drawer and combat surfaces draw, so the art
// upgrades in one place. Per-tab a11y labels override the registry's
// generic ones. The active tab wears the handoff active-tick: a short
// sulfur bar above the icon (design handoff 2026-05-23, tab contract).
const TAB_ICONS: Record<string, { name: AxmIconName; label: string }> = {
  eye: { name: 'action-eye', label: 'Exploration tab' },
  sword: { name: 'action-sword', label: 'Combat tab' },
  crown: { name: 'action-crown', label: 'Character tab' },
  bag: { name: 'action-bag', label: 'Inventory tab' },
  scroll: { name: 'action-scroll', label: 'Event tab' },
  quill: { name: 'action-quill', label: 'Memoir tab' },
  // DECK (2026-09-21, finding 7 / D2). The icon canon has no stacked-cards
  // glyph and minting one would mean editing the shared registry from a tab
  // change, so DECK borrows `action-arcane` — the canon's spell mark, which
  // is literally what the combat deck is a stack of. Its a11y label is
  // overridden here, as every tab's is. A bespoke card-stack glyph is filed
  // as a follow-up for the icon canon's own pass.
  cards: { name: 'action-arcane', label: 'Deck tab' },
};

function TabIconWithBadge({
  kind,
  color,
  size,
  focused,
  badge,
}: {
  kind: string;
  color: string;
  size: number;
  focused: boolean;
  badge: { text: string; kind: 'event' | 'levelup' } | null;
}) {
  const styles = useStyles();
  const AXM = usePalette();
  const icon = TAB_ICONS[kind];
  if (!icon) return null;
  return (
    <View style={styles.iconContainer}>
      <View style={[styles.activeTick, focused && { backgroundColor: AXM.sulfur }]} />
      <AxmIcon name={icon.name} size={size} color={color} label={icon.label} />
      {badge && <TabBadge text={badge.text} kind={badge.kind} />}
    </View>
  );
}

export default function TabLayout() {
  const AXM = usePalette();
  const styles = useStyles();
  const { inEncounterModal } = useCombatMode();
  // Tab configuration: Combat moved to encounter modal (Phase 63d), so
  // there is no combat tab; the five tabs are registered below.
  // Subscribe to the slim slices `selectTabBadges` reads, then memo
  // the badges object. The presenter returns a stable `EMPTY_BADGES`
  // reference in the no-event / no-levelup steady state but a fresh
  // object whenever a badge is active — passed directly to
  // `useGameState`, the active-badge path would over-render this
  // layout on every unrelated store change (engine events fire on
  // most actions). Slim-slice + memo mirrors the character / event
  // screen pattern.
  const player = useGameState((s) => s.player);
  const eventSlice = useGameState((s) => s.event);
  const notifications = useGameState((s) => s.notifications);
  const badges = useMemo(
    () =>
      selectTabBadges({
        player,
        event: eventSlice,
        notifications,
      } as never),
    [player, eventSlice, notifications],
  );

  // Phase 63c+ (2026-05-21) — hard-stop the tab bar while the
  // encounter modal is open. User confirmed the WILDS tab being
  // visible during the modal breaks the hard-stop feel. Hide the
  // tab bar entirely via `display: 'none'` AND lock every
  // non-exploration tab's href to null (defense in depth). The
  // previous attempt at hiding the bar caused a "blank screen"
  // symptom — root cause was the modal early-return null'ing once
  // the event slice cleared (since fixed in the overlay's
  // mode-gated early-return). Re-enabling now that the modal
  // stays mounted across the combat-active boundary.
  const lockOtherTabs = inEncounterModal;
  const tabBarStyle = inEncounterModal
    ? styles.tabBarHidden
    : styles.tabBar;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarActiveTintColor: AXM.sulfur,
        tabBarInactiveTintColor: AXM.bone,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="exploration/index"
        component={ExplorationScreen}
        options={{
          title: TAB_TITLES.exploration,
          tabBarLabel: TAB_TITLES.exploration,
          tabBarIcon: ({ color, size, focused }) => (
            <TabIconWithBadge
              kind="eye"
              color={color}
              size={size}
              focused={focused}
              badge={badges.exploration}
            />
          ),
          // Phase 63d — exploration is the unconditional leftmost tab.
          // It never locks even during the encounter modal so the route
          // remains current and the modal stays mounted. Other tabs lock
          // via `tabBarButton`/`tabPress` below (phase 47b — expo-router's
          // `href: null` link-disable has no react-navigation equivalent
          // property; hiding the tab button plus blocking a residual
          // `tabPress` reproduces the same "can't navigate here" contract).
          // Exploration itself shouldn't lock or force-navigates away from
          // the modal-bearing screen (the failure mode that surfaced after
          // commit a18ee12).
        }}
      />
      <Tabs.Screen
        name="character/index"
        component={CharacterScreen}
        options={{
          title: TAB_TITLES.character,
          tabBarLabel: TAB_TITLES.character,
          tabBarIcon: ({ color, size, focused }) => (
            <TabIconWithBadge
              kind="crown"
              color={color}
              size={size}
              focused={focused}
              badge={badges.character}
            />
          ),
          tabBarButton: lockOtherTabs ? () => null : undefined,
        }}
        listeners={{
          tabPress: (e) => {
            if (lockOtherTabs) e.preventDefault();
          },
        }}
      />
      <Tabs.Screen
        name="memoir/index"
        component={MemoirScreen}
        options={{
          title: TAB_TITLES.memoir,
          tabBarLabel: TAB_TITLES.memoir,
          tabBarIcon: ({ color, size, focused }) => (
            <TabIconWithBadge
              kind="quill"
              color={color}
              size={size}
              focused={focused}
              badge={badges.memoir}
            />
          ),
          tabBarButton: lockOtherTabs ? () => null : undefined,
        }}
        listeners={{
          tabPress: (e) => {
            if (lockOtherTabs) e.preventDefault();
          },
        }}
      />
      <Tabs.Screen
        name="inventory/index"
        component={InventoryScreen}
        options={{
          title: TAB_TITLES.inventory,
          tabBarLabel: TAB_TITLES.inventory,
          tabBarIcon: ({ color, size, focused }) => (
            <TabIconWithBadge
              kind="bag"
              color={color}
              size={size}
              focused={focused}
              badge={badges.inventory}
            />
          ),
          tabBarButton: lockOtherTabs ? () => null : undefined,
        }}
        listeners={{
          tabPress: (e) => {
            if (lockOtherTabs) e.preventDefault();
          },
        }}
      />
      {/* DECK is registered LAST so no existing tab changes position — the
          four tabs players already have muscle memory for keep their slots,
          and DECK lands beside SATCHEL, the other "what you carry" surface.
          It locks with the rest during the encounter modal: the deck is
          reference material, and reading it mid-fight is exactly the
          hard-stop the modal exists to enforce. */}
      <Tabs.Screen
        name="deck/index"
        component={DeckScreen}
        options={{
          title: TAB_TITLES.deck,
          tabBarLabel: TAB_TITLES.deck,
          tabBarIcon: ({ color, size, focused }) => (
            <TabIconWithBadge
              kind="cards"
              color={color}
              size={size}
              focused={focused}
              badge={badges.deck}
            />
          ),
          tabBarButton: lockOtherTabs ? () => null : undefined,
        }}
        listeners={{
          tabPress: (e) => {
            if (lockOtherTabs) e.preventDefault();
          },
        }}
      />
    </Tabs>
  );
}

const useStyles = makeStyles((AXM) => ({
  tabBar: {
    backgroundColor: AXM.panelBg,
    borderTopColor: AXM.ash,
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 8,
  },
  tabBarHidden: {
    backgroundColor: AXM.panelBg,
    borderTopColor: AXM.ash,
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 8,
    display: 'none' as const,
  },
  // Type size and tracking come from the presenter so the tab-bar FIT
  // contract in `state/e2e/tabs.engine.test.ts` measures the label the bar
  // actually draws. Tracking dropped 2 -> 1 when DECK made the bar five tabs
  // wide: THE LEDGER at tracking 2 clears a 360pt phone by 6pt but overflows
  // a 320pt one, and a clipped label is silent (the navigator's Label is
  // `numberOfLines: 1`, so it ellipsises rather than breaking the layout).
  tabLabel: {
    fontFamily: FONTS.sans,
    fontSize: TAB_BAR_LABEL_FONT_SIZE,
    letterSpacing: TAB_BAR_LABEL_LETTER_SPACING,
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  // The handoff tab contract's active tick — a short bar above the
  // icon; transparent when the tab is at rest so layout never shifts.
  activeTick: {
    width: 14,
    height: 2,
    marginBottom: 2,
    backgroundColor: 'transparent',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: AXM.parchment,
    fontFamily: FONTS.sans,
    fontSize: 10,
    fontWeight: 'bold',
    lineHeight: 16,
  },
}));
