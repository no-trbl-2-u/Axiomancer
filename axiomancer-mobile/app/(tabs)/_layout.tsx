import { Tabs } from 'expo-router';
import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';
import { useCombatMode } from '@/state/combat-mode';
import { TAB_TITLES } from '@/state/presenters/tabs.engine';
import { useGameState } from '@/state/GameStoreProvider';
import { selectTabBadges } from '@/state/presenters/navigation.engine';

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

function TabIconWithBadge({ 
  kind, 
  color, 
  size, 
  badge 
}: { 
  kind: string; 
  color: string; 
  size: number; 
  badge: { text: string; kind: 'event' | 'levelup' } | null;
}) {
  const styles = useStyles();
  return (
    <View style={styles.iconContainer}>
      <TabIcon kind={kind} color={color} size={size} />
      {badge && <TabBadge text={badge.text} kind={badge.kind} />}
    </View>
  );
}

function TabIcon({ kind, color, size }: { kind: string; color: string; size: number }) {
  switch (kind) {
    case 'eye':
      return (
        <Svg viewBox="0 0 32 32" width={size} height={size} fill="none" accessibilityRole="image" accessibilityLabel="Exploration tab">
          <Path d="M2 16 C 8 6 24 6 30 16 C 24 26 8 26 2 16 Z" fill={color} fillOpacity={0.1} stroke={color} strokeWidth={2} />
          <Circle cx={16} cy={16} r={5} fill={color} />
        </Svg>
      );
    case 'sword':
      return (
        <Svg viewBox="0 0 32 32" width={size} height={size} fill="none" accessibilityRole="image" accessibilityLabel="Combat tab">
          <Path d="M22 4 L28 4 L28 10 L13 25 L10 28 L4 28 L4 22 L7 19 Z" fill={color} fillOpacity={0.15} stroke={color} strokeWidth={2} strokeLinejoin="round" />
        </Svg>
      );
    case 'crown':
      return (
        <Svg viewBox="0 0 32 32" width={size} height={size} fill="none" accessibilityRole="image" accessibilityLabel="Character tab">
          <Path d="M3 10 L8 22 H24 L29 10 L23 14 L16 6 L9 14 Z" fill={color} fillOpacity={0.18} stroke={color} strokeWidth={2} strokeLinejoin="round" />
          <Path d="M3 26 H29" stroke={color} strokeWidth={2} />
        </Svg>
      );
    case 'bag':
      return (
        <Svg viewBox="0 0 32 32" width={size} height={size} fill="none" accessibilityRole="image" accessibilityLabel="Inventory tab">
          <Path d="M8 10 H24 L26 28 H6 Z" fill={color} fillOpacity={0.15} stroke={color} strokeWidth={2} strokeLinejoin="round" />
          <Path d="M11 10 V7 A5 5 0 0 1 21 7 V10" stroke={color} strokeWidth={2} />
        </Svg>
      );
    case 'scroll':
      return (
        <Svg viewBox="0 0 32 32" width={size} height={size} fill="none" accessibilityRole="image" accessibilityLabel="Event tab">
          <Path d="M6 6 H26 V22 C26 25 24 27 21 27 H8 C5 27 3 25 3 22 V9 C3 7 5 5 6 6 Z" fill={color} fillOpacity={0.12} stroke={color} strokeWidth={2} strokeLinejoin="round" />
          <Path d="M10 12 H22 M 10 16 H22 M 10 20 H18" stroke={color} strokeWidth={2} />
        </Svg>
      );
    default:
      return null;
  }
}

export default function TabLayout() {
  const AXM = usePalette();
  const styles = useStyles();
  const { inEncounterModal } = useCombatMode();
  // Tab configuration: Combat moved to encounter modal (Phase 63d).
  // STRIFE tab hidden from bar but route preserved for dev tools.
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
        options={{
          title: TAB_TITLES.exploration,
          tabBarLabel: TAB_TITLES.exploration,
          tabBarIcon: ({ color, size }) => (
            <TabIconWithBadge
              kind="eye"
              color={color}
              size={size}
              badge={badges.exploration}
            />
          ),
          // Phase 63d — exploration is the unconditional leftmost tab.
          // Its href stays `undefined` even during the encounter modal
          // so the route remains current and the modal stays mounted.
          // Other tabs lock via `href: null` (see character / memoir /
          // satchel below); exploration itself shouldn't lock or
          // expo-router force-navigates away from the modal-bearing
          // screen (the failure mode that surfaced after commit
          // a18ee12).
          href: undefined,
        }}
      />
      <Tabs.Screen
        name="character/index"
        options={{
          title: TAB_TITLES.character,
          tabBarLabel: TAB_TITLES.character,
          tabBarIcon: ({ color, size }) => (
            <TabIconWithBadge
              kind="crown"
              color={color}
              size={size}
              badge={badges.character}
            />
          ),
          href: lockOtherTabs ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="memoir/index"
        options={{
          title: TAB_TITLES.memoir,
          tabBarLabel: TAB_TITLES.memoir,
          tabBarIcon: ({ color, size }) => (
            <TabIconWithBadge
              kind="scroll"
              color={color}
              size={size}
              badge={badges.memoir}
            />
          ),
          href: lockOtherTabs ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="inventory/index"
        options={{
          title: TAB_TITLES.inventory,
          tabBarLabel: TAB_TITLES.inventory,
          tabBarIcon: ({ color, size }) => (
            <TabIconWithBadge
              kind="bag"
              color={color}
              size={size}
              badge={badges.inventory}
            />
          ),
          href: lockOtherTabs ? null : undefined,
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
  tabLabel: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    letterSpacing: 2,
  },
  iconContainer: {
    position: 'relative',
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
