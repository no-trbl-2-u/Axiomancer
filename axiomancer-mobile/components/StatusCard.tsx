import React from 'react';
import { View, Text } from 'react-native';
import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';
import { StatBar } from './StatBar';
import { SectionLabel } from './SectionLabel';
import { useGameState } from '@/state/GameStoreProvider';
import { graceBreakLegend, graceTrack } from '@/state/presenters/character.engine';

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
  // (mana is combat-only, owned by the Hazard-Pattern combat panel);
  // the status card surfaces only the HP that exists out-of-combat.
  const playerName = useGameState((s) => s.player?.name ?? 'WORM-EATEN PILGRIM');
  const playerLevel = useGameState((s) => s.player?.level ?? 1);
  const playerHp = useGameState((s) => s.player?.health ?? 0);
  const playerHpMax = useGameState((s) => s.player?.maxHealth ?? 0);
  const moralMeter = useGameState((s) => s.moralMeter ?? 0);

  const name = props.name ?? playerName;
  const level = props.level ?? playerLevel;
  const hp = props.hp ?? playerHp;
  const hpMax = props.hpMax ?? playerHpMax;

  // Audit 2026-09-12: the track's number, fill, tic and arrears verdict all
  // come from the presenter, which reads the engine's band boundary — the
  // HUD, the SELF sheet and /memoir name one threshold.
  const grace = graceTrack(moralMeter);
  const moraleDisplay = grace.value;
  const moraleMax = grace.max;
  const moraleFillPercent = grace.fillPct;
  const moraleBreakPercent = grace.breakPct;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.levelBox}>
          <Text style={styles.levelText}>{level}</Text>
        </View>
        <View style={styles.nameCol}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <SectionLabel size={9} style={styles.levelSubtitle}>
            LVL {level} · PILGRIM
          </SectionLabel>
        </View>
      </View>
      <View style={styles.barsCol}>
        {/* FE-019: a quarter or less of my VITAE turns the readout and the
          * track's edge blood, so a nearly-empty bar reads as danger rather
          * than as a bar that failed to fill. */}
        <StatBar value={hp} max={hpMax} color={AXM.blood} label="VITAE" height={8} alarmAt={0.25} />
        <View style={styles.moraleRow}>
          <View style={styles.moraleHeader}>
            <View style={styles.moraleLabelRow}>
              <Text style={styles.moraleLabel}>GRACE</Text>
              <Text style={styles.moraleGloss}>· KEPT BY THE PARISH</Text>
            </View>
            <Text style={styles.moraleValue}>
              {moraleDisplay}<Text style={styles.moraleMax}> / {moraleMax}</Text>
            </Text>
          </View>
          <View style={styles.moraleTrack}>
            <View style={[styles.moraleFill, { width: `${moraleFillPercent}%` }]} />
            <View style={[styles.moraleBreakTic, { left: `${moraleBreakPercent}%` }]} />
          </View>
          {/* S3-sheet-C12: the red tic sat in the GRACE track unlabelled and
            * read as a notch in the bar. Its key, worded by the presenter. */}
          <Text style={styles.moraleBreakLegend} testID="status-grace-break-legend">
            {graceBreakLegend()}
          </Text>
          {grace.inArrears && (
            <Text style={styles.moraleWarning}>the account runs to arrears.</Text>
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
  // S3-sheet-C12 — the tic's key: blood-coloured so the line and the mark read
  // as one thing.
  moraleBreakLegend: {
    fontFamily: FONTS.mono,
    fontSize: 7,
    color: AXM.blood,
    letterSpacing: 0.6,
    marginTop: 2,
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
