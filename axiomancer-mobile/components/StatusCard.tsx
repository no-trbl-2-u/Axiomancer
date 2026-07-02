import React from 'react';
import { View, Text } from 'react-native';
import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';
import { StatBar } from './StatBar';
import { SectionLabel } from './SectionLabel';
import { useGameState } from '@/state/GameStoreProvider';

interface StatusCardProps {
  /**
   * Optional override props for tests / fixtures. In production
   * the card reads from engine state directly via `useGameState`;
   * the props win only when explicitly passed. Closes the
   * `[5.5]` AUDIT row from the live-drive playtest 2026-05-22 —
   * the card was previously rendered with NO props by every
   * caller, so the defaults (HP 22/38, level 7, hardcoded name)
   * were what every player saw, regardless of real game state.
   */
  name?: string;
  level?: number;
  hp?: number;
  hpMax?: number;
}

export function StatusCard(props: StatusCardProps = {}) {
  const AXM = usePalette();
  const styles = useStyles();
  // Read from engine `state.player` so the card reflects real
  // game state. Test fixtures may still inject props directly —
  // the prop wins when defined, otherwise we fall through to the
  // store. Phase-62 bug-sweep 2026-05-21 dropped the mana bar
  // (mana is combat-only via Phase 60d's combatMana slice); the
  // status card surfaces only the HP that exists out-of-combat.
  const playerName = useGameState((s) => s.player?.name ?? 'WORM-EATEN PILGRIM');
  const playerLevel = useGameState((s) => s.player?.level ?? 1);
  const playerHp = useGameState((s) => s.player?.health ?? 0);
  const playerHpMax = useGameState((s) => s.player?.maxHealth ?? 0);
  const moralMeter = useGameState((s) => s.moralMeter ?? 0);

  const name = props.name ?? playerName;
  const level = props.level ?? playerLevel;
  const hp = props.hp ?? playerHp;
  const hpMax = props.hpMax ?? playerHpMax;

  // Map moralMeter (-100 to +100) to display scale (1-10)
  // 0 maps to ~5.5, with break threshold at 2 representing very low morale
  const moraleDisplay = Math.max(1, Math.min(10, Math.round((moralMeter + 100) / 20)));
  const moraleMax = 10;
  const moraleFillPercent = (moraleDisplay / moraleMax) * 100;
  const moraleBreakPercent = (2 / moraleMax) * 100; // Break threshold at 2/10

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.levelBox}>
          <Text style={styles.levelText}>{level}</Text>
        </View>
        <View style={styles.nameCol}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <SectionLabel size={9} style={styles.levelSubtitle}>
            LEVEL · LVL {level} PILGRIM
          </SectionLabel>
        </View>
      </View>
      <View style={styles.barsCol}>
        <StatBar value={hp} max={hpMax} color={AXM.blood} label="VITAE" height={8} />
        <View style={styles.moraleRow}>
          <View style={styles.moraleHeader}>
            <View style={styles.moraleLabelRow}>
              <Text style={styles.moraleLabel}>MORALE</Text>
              <Text style={styles.moraleGloss}>· RESOLVE TO WALK</Text>
            </View>
            <Text style={styles.moraleValue}>
              {['', 'i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'][moraleDisplay] || 'x'}<Text style={styles.moraleMax}> of x</Text>
            </Text>
          </View>
          <View style={styles.moraleTrack}>
            <View style={[styles.moraleFill, { width: `${moraleFillPercent}%` }]} />
            <View style={[styles.moraleBreakTic, { left: `${moraleBreakPercent}%` }]} />
          </View>
          {moraleDisplay <= 2 && (
            <Text style={styles.moraleWarning}>the road begins to lie.</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const useStyles = makeStyles((AXM) => ({
  card: {
    margin: 8,
    marginBottom: 0,
    padding: 8,
    paddingHorizontal: 10,
    paddingBottom: 10,
    backgroundColor: AXM.panelBg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelBox: {
    width: 36,
    height: 36,
    borderWidth: 2,
    borderColor: AXM.parchment,
    backgroundColor: AXM.deepBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelText: {
    fontFamily: FONTS.gothic,
    fontSize: 22,
    color: AXM.sulfur,
  },
  nameCol: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontFamily: FONTS.gothic,
    fontSize: 15,
    lineHeight: 18,
    color: AXM.parchment,
    letterSpacing: 1,
  },
  barsCol: {
    marginTop: 6,
    gap: 6,
  },
  moraleRow: {},
  moraleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 2,
  },
  moraleLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  moraleLabel: {
    fontFamily: FONTS.sans,
    fontSize: 9,
    color: AXM.sulfur,
    letterSpacing: 1.5,
  },
  moraleGloss: {
    fontFamily: FONTS.mono,
    fontSize: 7,
    color: AXM.bone,
    letterSpacing: 1,
  },
  moraleValue: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: AXM.parchment,
  },
  moraleTrack: {
    position: 'relative' as const,
    height: 8,
    backgroundColor: AXM.deepBg,
    borderWidth: 1,
    borderColor: AXM.ash,
  },
  moraleFill: {
    position: 'absolute' as const,
    top: 1,
    bottom: 1,
    left: 1,
    backgroundColor: AXM.sulfur,
  },
  moraleBreakTic: {
    position: 'absolute' as const,
    top: -2,
    bottom: -2,
    width: 1,
    backgroundColor: AXM.blood,
  },
  levelSubtitle: {
    color: AXM.bone,
    marginTop: 2,
  },
  moraleMax: {
    color: AXM.bone,
  },
  moraleWarning: {
    fontFamily: FONTS.serifItalic,
    fontSize: 9,
    color: AXM.blood,
    marginTop: 2,
  },
}));
