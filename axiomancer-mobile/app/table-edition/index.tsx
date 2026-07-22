// Table Edition (VOID / branch-only MVP) — setup screen.
// Solo board-game mode: pick a preset deck, an enemy, and a recipe, exactly
// like laying out the physical kit. Deleting app/table-edition/ +
// lib/table-edition/ removes the whole experiment.
import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';
import {
  PRESET_NAMES,
  ENEMY_NAMES,
  ENEMIES,
  PRESETS,
  SIG_PICKS,
  SIGS,
  PRESET_BLURB,
  STANCE_LABEL,
  type PresetName,
  type EnemyName,
  type Recipe,
} from '@/lib/table-edition/engine';
import { DIE_HEX } from '@/lib/table-edition/colors';

const RECIPES: { key: Recipe; label: string; hint: string }[] = [
  { key: 'easy', label: 'EASY', hint: 'softer tier swaps' },
  { key: 'std', label: 'STANDARD', hint: 'the printed deck' },
  { key: 'hard', label: 'HARD', hint: 'meaner tier swaps' },
];

export default function TableEditionSetup() {
  const styles = useStyles();
  const [preset, setPreset] = useState<PresetName>('STANDSTILL');
  const [enemy, setEnemy] = useState<EnemyName>('SKULK');
  const [recipe, setRecipe] = useState<Recipe>('std');

  const start = () => {
    const seed = Math.floor(Math.random() * 0x7fffffff);
    router.push({ pathname: '/table-edition/play', params: { preset, enemy, recipe, seed: String(seed) } });
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
            <Text style={styles.back}>‹ BACK</Text>
          </Pressable>
          <Text style={styles.kicker}>SOLO BOARD MODE · BETA</Text>
        </View>
        <Text style={styles.title}>Table Edition</Text>
        <Text style={styles.sub}>
          The physical game, played digitally: four dice, one deck, a telegraphed enemy. Win by
          emptying its Vitae before it empties yours.
        </Text>

        <Text style={styles.section}>YOUR DECK</Text>
        {PRESET_NAMES.map((p) => {
          const on = p === preset;
          const sigLine = SIG_PICKS[p].map((s) => `${s} ${SIGS[s].cost}◆`).join(' · ');
          return (
            <Pressable
              key={p}
              onPress={() => setPreset(p)}
              style={[styles.row, on && styles.rowOn]}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
            >
              <View style={[styles.stanceRail, { backgroundColor: DIE_HEX[PRESETS[p].stance] }]} />
              <View style={styles.rowBody}>
                <View style={styles.rowTop}>
                  <Text style={[styles.rowName, on && styles.rowNameOn]}>{p}</Text>
                  <Text style={styles.rowStance}>{STANCE_LABEL[PRESETS[p].stance]}</Text>
                </View>
                <Text style={styles.rowBlurb}>{PRESET_BLURB[p]}</Text>
                <Text style={styles.rowSigs}>Signature Skills: {sigLine}</Text>
              </View>
            </Pressable>
          );
        })}

        <Text style={styles.section}>THE ENEMY</Text>
        <View style={styles.enemyRow}>
          {ENEMY_NAMES.map((e) => {
            const on = e === enemy;
            return (
              <Pressable
                key={e}
                onPress={() => setEnemy(e)}
                style={[styles.enemyCell, on && styles.rowOn]}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
              >
                <Text style={[styles.rowName, on && styles.rowNameOn]}>{ENEMIES[e].title}</Text>
                <Text style={styles.rowBlurb}>{ENEMIES[e].hp} Vitae</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.section}>RECIPE</Text>
        <View style={styles.enemyRow}>
          {RECIPES.map((r) => {
            const on = r.key === recipe;
            return (
              <Pressable
                key={r.key}
                onPress={() => setRecipe(r.key)}
                style={[styles.enemyCell, on && styles.rowOn]}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
              >
                <Text style={[styles.rowName, on && styles.rowNameOn]}>{r.label}</Text>
                <Text style={styles.rowBlurb}>{r.hint}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable onPress={start} style={styles.cta} accessibilityRole="button" accessibilityLabel="Begin the fight">
          <Text style={styles.ctaText}>LAY OUT THE CARDS</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((AXM) => ({
  root: { flex: 1, backgroundColor: AXM.deepBg },
  scroll: { padding: 20, paddingBottom: 48, maxWidth: 560, width: '100%', alignSelf: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  back: { fontFamily: FONTS.sans, fontSize: 14, color: AXM.bone, letterSpacing: 1 },
  kicker: { fontFamily: FONTS.sans, fontSize: 11, color: AXM.sulfur, letterSpacing: 2 },
  title: { fontFamily: FONTS.gothic, fontSize: 34, color: AXM.parchment },
  sub: { fontFamily: FONTS.serif, fontSize: 14, lineHeight: 20, color: AXM.bone, marginTop: 6 },
  section: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    letterSpacing: 2,
    color: AXM.sulfur,
    marginTop: 22,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    backgroundColor: AXM.panelBg,
    borderWidth: 1,
    borderColor: AXM.ash,
    marginBottom: 8,
    overflow: 'hidden',
  },
  rowOn: { borderColor: AXM.sulfur, backgroundColor: AXM.selectFill },
  stanceRail: { width: 6 },
  rowBody: { flex: 1, padding: 10 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  rowName: { fontFamily: FONTS.sans, fontSize: 16, color: AXM.parchment, letterSpacing: 1.5 },
  rowNameOn: { color: AXM.sulfur },
  rowStance: { fontFamily: FONTS.mono, fontSize: 10, color: AXM.bone, letterSpacing: 1 },
  rowBlurb: { fontFamily: FONTS.serif, fontSize: 13, lineHeight: 18, color: AXM.bone, marginTop: 2 },
  rowSigs: { fontFamily: FONTS.mono, fontSize: 10, color: AXM.bone, marginTop: 4, opacity: 0.8 },
  enemyRow: { flexDirection: 'row', gap: 8 },
  enemyCell: {
    flex: 1,
    backgroundColor: AXM.panelBg,
    borderWidth: 1,
    borderColor: AXM.ash,
    padding: 10,
    alignItems: 'center',
  },
  cta: {
    marginTop: 28,
    backgroundColor: AXM.sulfur,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AXM.parchment,
  },
  ctaText: { fontFamily: FONTS.sans, fontSize: 18, letterSpacing: 3, color: AXM.bg },
}));
