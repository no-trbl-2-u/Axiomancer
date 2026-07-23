// Table Edition (VOID / branch-only MVP) — the fight screen.
// One screen = the whole table: enemy mat on top, your mat below, dice pool,
// hand of five. Rules live in lib/table-edition/engine.ts (the sim port);
// this file only presents state and forwards taps as engine actions.
import { useMemo, useReducer, useRef, useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';
import {
  newGame,
  startPlayerTurn,
  endPlayerTurn,
  resolveEnemyAndFade,
  applyAction,
  payableDice,
  effPower,
  knownEnemyCards,
  sigDiscount,
  cardOf,
  dieUsable,
  ENEMY_CARDS,
  ENEMIES,
  SIGS,
  CYCLE,
  COLOR_LABEL,
  FACE_LABEL,
  PHASE_LABEL,
  PLAYER_MAX_HP,
  ALLY_CARDS,
  type GameState,
  type PresetName,
  type EnemyName,
  type Recipe,
  type Die,
} from '@/lib/table-edition/engine';
import { DIE_HEX, FACE_GLYPH } from '@/lib/table-edition/colors';

const CHAIN_ORDER: Record<string, string> = { P: 'HEART', R: 'BODY', B: 'MIND' };

export default function TableEditionPlay() {
  const styles = useStyles();
  const params = useLocalSearchParams<{ preset: string; enemy: string; recipe: string; seed: string; minions: string }>();
  const preset = (params.preset ?? 'STANDSTILL') as PresetName;
  const enemy = (params.enemy ?? 'SKULK') as EnemyName;
  const recipe = (params.recipe ?? 'std') as Recipe;
  const seed0 = parseInt(params.seed ?? '1', 10) || 1;
  const minionsOn = params.minions === '1';

  const [seed, setSeed] = useState(seed0);
  const gameRef = useRef<GameState | null>(null);
  const [, force] = useReducer((x: number) => x + 1, 0);
  const [selCard, setSelCard] = useState<number | null>(null); // hand index
  const [selDie, setSelDie] = useState<number | null>(null); // dice index

  // Lazy init + reset on "play again"
  const S = useMemo(() => {
    // Common Ground (Accord) is a universal sig — always live in the app.
    const g = newGame(preset, enemy, recipe, seed, { concede: true, minions: minionsOn });
    startPlayerTurn(g);
    gameRef.current = g;
    return g;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, enemy, recipe, seed, minionsOn]);

  const refresh = useCallback(() => {
    setSelCard(null);
    setSelDie(null);
    force();
  }, []);

  const handCard = selCard !== null && S.p.hand[selCard] !== undefined ? cardOf(S, S.p.hand[selCard]) : null;
  const payable = handCard ? payableDice(S, handCard) : [];
  // Default die: exact color before gold, SPECIAL last (bank the +2◆? No — sim
  // greedy spends SPECIAL first for ◆; the player chooses, this is only the default).
  const defaultDie: Die | null = payable.length
    ? payable.slice().sort((a, b) => ((a.color === 'G' ? 1 : 0) - (b.color === 'G' ? 1 : 0)) || ((a.face === 'S' ? 0 : 1) - (b.face === 'S' ? 0 : 1)))[0]
    : null;
  const chosenDie: Die | null = selDie !== null && S.p.dice[selDie] && handCard && payable.includes(S.p.dice[selDie])
    ? S.p.dice[selDie]
    : defaultDie;

  const doFree = () => {
    if (selCard === null || !handCard) return;
    S.log.push(`You play ${handCard.nm} — FREE (${handCard.freeText}).`);
    applyAction(S, { k: 'free', h: selCard });
    refresh();
  };
  const doPaid = () => {
    if (selCard === null || !handCard || !chosenDie) return;
    S.log.push(`You pay ${COLOR_LABEL[chosenDie.color]} ${FACE_LABEL[chosenDie.face]} for ${handCard.nm}.`);
    applyAction(S, { k: 'paid', h: selCard, die: chosenDie });
    refresh();
  };
  const doDiscard = () => {
    if (selCard === null || !handCard) return;
    S.log.push(`You discard ${handCard.nm} for +1◆.`);
    applyAction(S, { k: 'discard', h: selCard });
    refresh();
  };
  const doSig = (s: string) => {
    applyAction(S, { k: 'sig', s });
    refresh();
  };
  const doPress = () => {
    applyAction(S, { k: 'press' });
    refresh();
  };
  const doEndTurn = () => {
    S.log.push(`— Round ${S.round}: you pass. The enemy acts. —`);
    endPlayerTurn(S);
    resolveEnemyAndFade(S);
    if (!S.over) startPlayerTurn(S);
    refresh();
  };

  const telegraph = S.e.telegraph;
  const tCard = telegraph ? ENEMY_CARDS[telegraph] : null;
  const tPower = effPower(S);
  const known = knownEnemyCards(S);
  const disc = sigDiscount(S);
  const canPress = !S.p.pressed && S.p.conv >= 1 && S.p.dice.some((d) => d.face === 'X');
  const logTail = S.log.slice(-5);

  return (
    <View style={styles.root}>
      {/* ---------- top bar ---------- */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Leave the fight">
          <Text style={styles.back}>‹ QUIT</Text>
        </Pressable>
        <Text style={styles.topTitle}>
          {preset} · ROUND {S.round}
        </Text>
        <Text style={styles.topRecipe}>{recipe.toUpperCase()}</Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {/* ---------- enemy mat ---------- */}
        <View style={styles.mat}>
          <View style={styles.matHeader}>
            <Text style={styles.enemyName}>{ENEMIES[enemy].title}</Text>
            <Text style={styles.phase}>{PHASE_LABEL[S.e.phase]}</Text>
          </View>
          <Bar styles={styles} value={S.e.hp} max={S.e.maxhp} danger />
          <View style={styles.chipRow}>
            <Chip styles={styles} label={`VITAE ${Math.max(0, S.e.hp)}/${S.e.maxhp}`} />
            {S.e.enraged ? <Chip styles={styles} label="ENRAGED" warn /> : null}
            {S.e.guard > 0 ? <Chip styles={styles} label={`GUARD ${S.e.guard}`} /> : null}
            {S.e.thorns > 0 ? <Chip styles={styles} label={`THORNS ${S.e.thorns}`} /> : null}
            {S.e.blight > 0 ? <Chip styles={styles} label={`BLIGHT ${S.e.blight}`} warn /> : null}
            {S.e.progress > 0 ? <Chip styles={styles} label={`PROGRESS ${S.e.progress}/3`} gold /> : null}
            <Chip styles={styles} label={`DECK ${S.e.deck.length}`} dim />
            {S.e.fired.length ? <Chip styles={styles} label={`CURSES FIRED ${S.e.fired.length}`} dim /> : null}
          </View>

          {/* minions in play */}
          {S.e.minions.length > 0 ? (
            <View style={styles.chipRow}>
              {S.e.minions.map((m, i) => (
                <View key={`${m.nm}-${i}`} style={styles.minion}>
                  <Text style={styles.minionName}>
                    {m.nm} · {m.hp} HP{m.silenced ? ' · SILENCED' : ''}
                  </Text>
                  <Text style={styles.minionLine}>{PHASE_LABEL[S.e.phase]}: {m.spec.lines[S.e.phase]}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* telegraph */}
          <View style={styles.telegraph}>
            <Text style={styles.telegraphKicker}>TELEGRAPH — resolves when you pass</Text>
            {tCard && telegraph ? (
              <>
                <View style={styles.telegraphTop}>
                  <Text style={styles.telegraphName}>{telegraph}</Text>
                  {S.e.staggers > 0 ? (
                    <Text style={styles.stagger}>STAGGER ×{Math.min(S.e.staggers, 99)}</Text>
                  ) : null}
                </View>
                <Text style={styles.telegraphText}>{tCard.text}</Text>
                <Text style={[styles.telegraphPower, tPower <= 0 && styles.fizzled]}>
                  {tPower <= 0
                    ? 'FIZZLES — power staggered to 0'
                    : tCard.kind === 'attack'
                      ? `Incoming: ${tPower + (S.e.enraged ? 1 : 0)}${(tCard.hits ?? 1) > 1 ? ` × ${tCard.hits}` : ''}`
                      : `Power: ${tPower}`}
                </Text>
              </>
            ) : (
              <Text style={styles.telegraphText}>Nothing revealed.</Text>
            )}
            {known.length > 0 ? (
              <Text style={styles.known}>
                SCRYED NEXT: {known.map((k) => (k.isCurse ? `⟪${k.label}⟫` : k.label)).join(' → ')}
              </Text>
            ) : null}
          </View>
        </View>

        {/* ---------- log ---------- */}
        <View style={styles.logBox}>
          {logTail.length === 0 ? <Text style={styles.logLine}>The table is set.</Text> : null}
          {logTail.map((l, i) => (
            <Text key={`${i}-${l}`} style={[styles.logLine, i === logTail.length - 1 && styles.logLast]}>
              {l}
            </Text>
          ))}
        </View>

        {/* ---------- player mat ---------- */}
        <View style={styles.mat}>
          <View style={styles.matHeader}>
            <Text style={styles.youName}>YOU · {preset}</Text>
            <Text style={styles.conv}>◆ {S.p.conv}</Text>
          </View>
          <Bar styles={styles} value={S.p.hp} max={PLAYER_MAX_HP} />
          <View style={styles.chipRow}>
            <Chip styles={styles} label={`VITAE ${Math.max(0, S.p.hp)}/${PLAYER_MAX_HP}`} />
            {S.p.guard > 0 ? <Chip styles={styles} label={`GUARD ${S.p.guard}`} /> : null}
            {S.p.pguard > 0 ? <Chip styles={styles} label={`GUARD ${S.p.pguard} (persists)`} /> : null}
            {S.p.thorns > 0 ? <Chip styles={styles} label={`THORNS ${S.p.thorns}`} /> : null}
            {S.p.attune > 0 ? <Chip styles={styles} label={`ATTUNE ${S.p.attune}`} /> : null}
            {S.p.surge > 0 ? <Chip styles={styles} label={`SURGE ${S.p.surge}`} /> : null}
            <Chip styles={styles} label={`DECK ${S.p.deck.length}`} dim />
          </View>

          {/* chain */}
          <View style={styles.chainRow}>
            <Text style={styles.chainLabel}>CHAIN</Text>
            {[0, 1, 2].map((i) => (
              <View key={i} style={[styles.chainPip, i < S.p.links && styles.chainPipOn]} />
            ))}
            <Text style={styles.chainNext}>
              {S.p.links === 0 ? 'any color starts it' : `next: ${CHAIN_ORDER[CYCLE[S.p.chainPos ?? 'P']]}`}
            </Text>
          </View>

          {/* enchants + rite */}
          {(S.p.ench.length > 0 || S.p.rite) && (
            <View style={styles.chipRow}>
              {S.p.ench.map((e, i) => (
                <Chip key={`${e}-${i}`} styles={styles} label={`ENCH · ${e.toUpperCase()}`} gold />
              ))}
              {S.p.rite ? (
                <Chip styles={styles} label={`RITE · ${S.p.rite.name} ${S.p.rite.charges}/${S.p.rite.threshold}`} gold />
              ) : null}
            </View>
          )}

          {/* allies in play / exiled */}
          {(S.p.allies.length > 0 || S.p.exiled.length > 0) && (
            <View style={styles.chipRow}>
              {S.p.allies.map((a, i) => (
                <View key={`${a.aix}-${i}`} style={[styles.minion, styles.allyChip, a.exhausted && styles.allySpent]}>
                  <Text style={styles.minionName}>
                    {ALLY_CARDS[a.aix].nm}{a.exhausted ? ' ↷' : ''}
                  </Text>
                  <Text style={styles.minionLine}>
                    {PHASE_LABEL[S.e.phase]}: {ALLY_CARDS[a.aix].lines[S.e.phase]}
                  </Text>
                </View>
              ))}
              {S.p.exiled.map((aix, i) => (
                <Chip key={`ex-${aix}-${i}`} styles={styles} label={`EXILED · ${ALLY_CARDS[aix].nm}`} dim />
              ))}
            </View>
          )}

          {/* sigs + press fate */}
          <View style={styles.sigRow}>
            {S.p.sigs.map((s) => {
              const cost = Math.max(0, SIGS[s].cost - disc);
              const ok = S.p.conv >= cost && !S.over;
              return (
                <Pressable
                  key={s}
                  onPress={() => ok && doSig(s)}
                  style={[styles.sigBtn, !ok && styles.btnOff]}
                  accessibilityRole="button"
                  accessibilityLabel={`${s}, costs ${cost} conviction`}
                >
                  <Text style={[styles.sigName, !ok && styles.textOff]}>{s}</Text>
                  <Text style={[styles.sigCost, !ok && styles.textOff]}>{cost}◆ · {SIGS[s].text}</Text>
                </Pressable>
              );
            })}
            <Pressable
              onPress={() => canPress && doPress()}
              style={[styles.sigBtn, styles.pressBtn, !canPress && styles.btnOff]}
              accessibilityRole="button"
              accessibilityLabel="Press Fate: pay 1 conviction to reroll all misses"
            >
              <Text style={[styles.sigName, !canPress && styles.textOff]}>PRESS FATE</Text>
              <Text style={[styles.sigCost, !canPress && styles.textOff]}>1◆ · reroll all MISSES (once/round)</Text>
            </Pressable>
          </View>
        </View>

        {/* ---------- dice pool ---------- */}
        <View style={styles.diceRow}>
          {S.p.dice.map((d, i) => {
            const usable = dieUsable(d);
            const isSel = chosenDie === d && handCard !== null;
            return (
              <Pressable
                key={i}
                onPress={() => setSelDie(i)}
                style={[
                  styles.die,
                  { backgroundColor: DIE_HEX[d.color] },
                  !usable && styles.dieDead,
                  isSel && styles.dieSel,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${COLOR_LABEL[d.color]} die, ${FACE_LABEL[d.face]}${d.temp ? ', burst die' : d.kindled ? ', kindled' : ''}`}
              >
                <Text style={styles.dieFace}>{FACE_GLYPH[d.face]}</Text>
                <Text style={styles.dieTag}>
                  {d.temp ? 'BURST' : d.kindled ? 'KINDLE' : d.echoed ? 'ECHO' : FACE_LABEL[d.face]}
                </Text>
              </Pressable>
            );
          })}
          {S.p.dice.length === 0 ? <Text style={styles.noDice}>no dice left this round</Text> : null}
        </View>

        {/* ---------- action bar for selected card ---------- */}
        {handCard ? (
          <View style={styles.actionBar}>
            <Pressable onPress={doFree} style={styles.actBtn} accessibilityRole="button">
              <Text style={styles.actLabel}>FREE</Text>
              <Text style={styles.actHint}>{handCard.freeText}</Text>
            </Pressable>
            <Pressable
              onPress={doPaid}
              style={[styles.actBtn, styles.actPaid, !chosenDie && styles.btnOff]}
              accessibilityRole="button"
              disabled={!chosenDie}
            >
              <Text style={[styles.actLabel, !chosenDie && styles.textOff]}>
                PAID{chosenDie ? ` — ${COLOR_LABEL[chosenDie.color]} ${FACE_GLYPH[chosenDie.face]}` : ' — no die'}
              </Text>
              <Text style={[styles.actHint, !chosenDie && styles.textOff]} numberOfLines={2}>
                {handCard.paidText}
              </Text>
            </Pressable>
            <Pressable onPress={doDiscard} style={styles.actBtn} accessibilityRole="button">
              <Text style={styles.actLabel}>DISCARD</Text>
              <Text style={styles.actHint}>+1◆</Text>
            </Pressable>
          </View>
        ) : null}

        {/* ---------- hand ---------- */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hand}>
          {S.p.hand.map((ix, h) => {
            const c = cardOf(S, ix);
            const on = selCard === h;
            const canPay = payableDice(S, c).length > 0;
            return (
              <Pressable
                key={`${h}-${ix}`}
                onPress={() => { setSelCard(on ? null : h); setSelDie(null); }}
                style={[styles.card, on && styles.cardOn]}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`${c.nm}, ${COLOR_LABEL[c.col]} ${c.t}`}
              >
                <View style={[styles.cardRail, { backgroundColor: DIE_HEX[c.col] }]} />
                <View style={styles.cardBody}>
                  <Text style={styles.cardType}>
                    {COLOR_LABEL[c.col]} · {c.t}
                  </Text>
                  <Text style={styles.cardFree}>{c.freeText}</Text>
                  <Text style={styles.cardPaid} numberOfLines={4}>
                    ⬢ {c.paidText}
                  </Text>
                  {c.payload ? (
                    <Text style={styles.cardPayload} numberOfLines={2}>
                      {c.payload}
                    </Text>
                  ) : null}
                  <Text style={[styles.cardName, !canPay && styles.cardNameDim]}>{c.nm}</Text>
                </View>
              </Pressable>
            );
          })}
          {S.p.hand.length === 0 ? <Text style={styles.noDice}>hand empty</Text> : null}
        </ScrollView>
      </ScrollView>

      {/* ---------- end turn ---------- */}
      {!S.over ? (
        <Pressable onPress={doEndTurn} style={styles.endTurn} accessibilityRole="button" accessibilityLabel="End your turn">
          <Text style={styles.endTurnText}>
            PASS — {tPower <= 0 && tCard ? 'telegraph fizzles' : tCard?.kind === 'attack' ? `take the ${telegraph}` : 'enemy acts'}
          </Text>
        </Pressable>
      ) : null}

      {/* ---------- game over ---------- */}
      {S.over ? (
        <View style={styles.overOverlay}>
          <View style={styles.overCard}>
            <Text style={styles.overTitle}>
              {S.over === 'win' ? 'THE ARGUMENT HOLDS' : S.over === 'accord' ? 'ACCORD' : S.over === 'loss' ? 'REFUTED' : 'STALEMATE'}
            </Text>
            <Text style={styles.overStats}>
              {S.over === 'win'
                ? `${ENEMIES[enemy].title} falls in ${S.round} rounds. Vitae kept: ${S.p.hp}/${PLAYER_MAX_HP}.`
                : S.over === 'accord'
                  ? `Common ground in ${S.round} rounds. ${ENEMIES[enemy].title} may join you as an ally.`
                  : S.over === 'loss'
                    ? `You fall in round ${S.round}.`
                    : '40 rounds without a kill.'}
            </Text>
            <Text style={styles.overDetail}>
              {S.stats.freePlays} free · {S.stats.paidPlays} paid · {S.stats.sigFires} sigs · {S.stats.bursts} bursts ·{' '}
              {S.stats.convEarned}◆ earned · {S.stats.pressFates} Press Fates
              {S.stats.hexFired ? ` · ${S.stats.hexFired} curses fired` : ''}
            </Text>
            <View style={styles.overRow}>
              <Pressable
                style={styles.overBtn}
                onPress={() => setSeed((s) => (s * 48271 + 7) % 0x7fffffff)}
                accessibilityRole="button"
              >
                <Text style={styles.overBtnText}>PLAY AGAIN</Text>
              </Pressable>
              <Pressable style={styles.overBtn} onPress={() => router.back()} accessibilityRole="button">
                <Text style={styles.overBtnText}>NEW SETUP</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function Chip({ styles, label, warn, dim, gold }: { styles: ReturnType<typeof useStyles>; label: string; warn?: boolean; dim?: boolean; gold?: boolean }) {
  return (
    <View style={[styles.chip, warn && styles.chipWarn, dim && styles.chipDim, gold && styles.chipGold]}>
      <Text style={[styles.chipText, dim && styles.chipTextDim]}>{label}</Text>
    </View>
  );
}

function Bar({ styles, value, max, danger }: { styles: ReturnType<typeof useStyles>; value: number; max: number; danger?: boolean }) {
  const frac = Math.max(0, Math.min(1, value / max));
  return (
    <View style={styles.barTrack}>
      <View style={[styles.barFill, danger && styles.barDanger, { width: `${frac * 100}%` }]} />
    </View>
  );
}

const useStyles = makeStyles((AXM) => ({
  root: { flex: 1, backgroundColor: AXM.deepBg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  back: { fontFamily: FONTS.sans, fontSize: 13, color: AXM.bone, letterSpacing: 1 },
  topTitle: { fontFamily: FONTS.sans, fontSize: 14, color: AXM.parchment, letterSpacing: 2 },
  topRecipe: { fontFamily: FONTS.mono, fontSize: 10, color: AXM.bone },
  body: { flex: 1 },
  bodyContent: { padding: 12, paddingBottom: 24, gap: 10, maxWidth: 640, width: '100%', alignSelf: 'center' },

  mat: { backgroundColor: AXM.panelBg, borderWidth: 1, borderColor: AXM.ash, padding: 10, gap: 8 },
  matHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  enemyName: { fontFamily: FONTS.gothic, fontSize: 20, color: AXM.blood },
  youName: { fontFamily: FONTS.gothic, fontSize: 18, color: AXM.parchment },
  enrage: { fontFamily: FONTS.sans, fontSize: 11, color: AXM.blood, letterSpacing: 2 },
  conv: { fontFamily: FONTS.sans, fontSize: 16, color: AXM.sulfur, letterSpacing: 1 },

  barTrack: { height: 8, backgroundColor: AXM.silhouette, borderWidth: 1, borderColor: AXM.ash },
  barFill: { flex: 1, backgroundColor: AXM.heal },
  barDanger: { backgroundColor: AXM.blood },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  chip: { borderWidth: 1, borderColor: AXM.ash, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: AXM.dockBg },
  chipWarn: { borderColor: AXM.rust },
  chipGold: { borderColor: AXM.sulfur },
  chipDim: { opacity: 0.6 },
  chipText: { fontFamily: FONTS.mono, fontSize: 10, color: AXM.parchment },
  chipTextDim: { color: AXM.bone },

  phase: { fontFamily: FONTS.sans, fontSize: 11, color: AXM.sulfur, letterSpacing: 2 },
  minion: { borderWidth: 1, borderColor: AXM.rust, backgroundColor: AXM.debuff, padding: 5, maxWidth: 220 },
  allyChip: { borderColor: AXM.heal, backgroundColor: AXM.buff },
  allySpent: { opacity: 0.55 },
  minionName: { fontFamily: FONTS.sans, fontSize: 11, color: AXM.parchment, letterSpacing: 1 },
  minionLine: { fontFamily: FONTS.serif, fontSize: 10, color: AXM.bone, marginTop: 1 },
  telegraph: { borderWidth: 1, borderColor: AXM.rust, backgroundColor: AXM.dockBg, padding: 8, gap: 3 },
  telegraphKicker: { fontFamily: FONTS.sans, fontSize: 9, letterSpacing: 1.5, color: AXM.bone },
  telegraphTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  telegraphName: { fontFamily: FONTS.gothic, fontSize: 18, color: AXM.parchment },
  stagger: { fontFamily: FONTS.mono, fontSize: 11, color: AXM.sulfur },
  telegraphText: { fontFamily: FONTS.serif, fontSize: 13, color: AXM.parchment },
  telegraphPower: { fontFamily: FONTS.mono, fontSize: 11, color: AXM.blood },
  fizzled: { color: AXM.heal },
  known: { fontFamily: FONTS.mono, fontSize: 10, color: AXM.sulfur, marginTop: 2 },

  logBox: { paddingHorizontal: 4, gap: 1 },
  logLine: { fontFamily: FONTS.mono, fontSize: 10, color: AXM.bone, opacity: 0.75 },
  logLast: { color: AXM.parchment, opacity: 1 },

  chainRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chainLabel: { fontFamily: FONTS.sans, fontSize: 10, letterSpacing: 1.5, color: AXM.bone },
  chainPip: { width: 10, height: 10, borderRadius: 5, borderWidth: 1, borderColor: AXM.ash },
  chainPipOn: { backgroundColor: AXM.sulfur, borderColor: AXM.sulfur },
  chainNext: { fontFamily: FONTS.mono, fontSize: 10, color: AXM.bone },

  sigRow: { gap: 6 },
  sigBtn: { borderWidth: 1, borderColor: AXM.sulfur, backgroundColor: AXM.buff, padding: 8 },
  pressBtn: { borderColor: AXM.rust, backgroundColor: AXM.dockBg },
  btnOff: { opacity: 0.4 },
  textOff: { color: AXM.bone },
  sigName: { fontFamily: FONTS.sans, fontSize: 13, letterSpacing: 1.5, color: AXM.parchment },
  sigCost: { fontFamily: FONTS.serif, fontSize: 12, color: AXM.bone, marginTop: 1 },

  diceRow: { flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  die: {
    width: 54,
    height: 54,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.4)',
  },
  dieDead: { opacity: 0.35 },
  dieSel: { borderColor: AXM.parchment },
  dieFace: { fontFamily: FONTS.sans, fontSize: 22, color: AXM.pixelHighlight },
  dieTag: { fontFamily: FONTS.mono, fontSize: 7, color: AXM.pixelHighlight, letterSpacing: 0.5 },
  noDice: { fontFamily: FONTS.serifItalic, fontSize: 12, color: AXM.bone },

  actionBar: { flexDirection: 'row', gap: 6 },
  actBtn: { flex: 1, borderWidth: 1, borderColor: AXM.parchment, backgroundColor: AXM.selectFill, padding: 8 },
  actPaid: { flex: 2 },
  actLabel: { fontFamily: FONTS.sans, fontSize: 12, letterSpacing: 1.5, color: AXM.sulfur },
  actHint: { fontFamily: FONTS.serif, fontSize: 11, color: AXM.parchment, marginTop: 2 },

  hand: { gap: 8, paddingVertical: 4 },
  card: {
    width: 148,
    minHeight: 168,
    flexDirection: 'row',
    backgroundColor: AXM.panelBg,
    borderWidth: 1,
    borderColor: AXM.ash,
    overflow: 'hidden',
  },
  cardOn: { borderColor: AXM.sulfur, backgroundColor: AXM.selectFill },
  cardRail: { width: 8 },
  cardBody: { flex: 1, padding: 8, gap: 3 },
  cardType: { fontFamily: FONTS.mono, fontSize: 8, letterSpacing: 1, color: AXM.bone },
  cardFree: { fontFamily: FONTS.sans, fontSize: 16, color: AXM.parchment, letterSpacing: 1 },
  cardPaid: { fontFamily: FONTS.serif, fontSize: 11, lineHeight: 14, color: AXM.bone, flexGrow: 1 },
  cardPayload: { fontFamily: FONTS.serifItalic, fontSize: 10, lineHeight: 12, color: AXM.bone, opacity: 0.85 },
  cardName: { fontFamily: FONTS.gothic, fontSize: 14, color: AXM.parchment },
  cardNameDim: { opacity: 0.85 },

  endTurn: {
    marginHorizontal: 12,
    marginBottom: 12,
    backgroundColor: AXM.rust,
    borderWidth: 1,
    borderColor: AXM.parchment,
    paddingVertical: 14,
    alignItems: 'center',
  },
  endTurnText: { fontFamily: FONTS.sans, fontSize: 15, letterSpacing: 2, color: AXM.parchment },

  overOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  overCard: {
    backgroundColor: AXM.panelBg,
    borderWidth: 1,
    borderColor: AXM.sulfur,
    padding: 20,
    gap: 10,
    maxWidth: 420,
    width: '100%',
  },
  overTitle: { fontFamily: FONTS.gothic, fontSize: 28, color: AXM.sulfur, textAlign: 'center' },
  overStats: { fontFamily: FONTS.serif, fontSize: 14, color: AXM.parchment, textAlign: 'center' },
  overDetail: { fontFamily: FONTS.mono, fontSize: 10, color: AXM.bone, textAlign: 'center' },
  overRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  overBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: AXM.parchment,
    backgroundColor: AXM.selectFill,
    paddingVertical: 10,
    alignItems: 'center',
  },
  overBtnText: { fontFamily: FONTS.sans, fontSize: 13, letterSpacing: 2, color: AXM.parchment },
}));
