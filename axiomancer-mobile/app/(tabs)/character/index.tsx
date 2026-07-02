import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';
import { TooltipTarget } from '@/components/tooltip/TooltipTarget';
import { AscendStrip } from '@/components/levelup/AscendStrip';
import { LearnSkillModal } from '@/components/levelup/LearnSkillModal';
import { LevelReadyStrip } from '@/components/levelup/LevelReadyStrip';
import { LevelUpModal } from '@/components/levelup/LevelUpModal';
import { DevToolsLink } from '@/components/dev/DevToolsLink';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { ScreenBg } from '@/components/ScreenBg';
import { SectionLabel } from '@/components/SectionLabel';
import { StanceGlyph } from '@/components/StanceGlyph';
import { EffectGlyph } from '@/components/EffectGlyph';
import { XpChain } from '@/components/XpChain';
import { PlayerPortrait } from '@/components/art/PlayerPortrait';
import { useGameActions, useGameState, useGameStore } from '@/state/GameStoreProvider';
import { selectCharacterViewModel } from '@/state/presenters/character.engine';

export default function CharacterScreen() {
  const AXM = usePalette();
  const styles = useStyles();
  // Subscribe to stable slices to avoid getSnapshot identity churn:
  // `selectCharacterViewModel` returns a frozen new object every call,
  // which would loop `useSyncExternalStore` if used directly as a
  // selector. Pull the underlying slice and memoize the VM downstream
  // (mirrors the pattern fixed in event screen, Phase 6 Tick A).
  const player = useGameState((s) => s.player);
  const vm = useMemo(
    () => selectCharacterViewModel({ player } as never),
    [player],
  );
  const store = useGameStore();
  const actions = useGameActions();
  const router = useRouter();

  // Phase 29 Tick A: acknowledge any pending level-up the moment the
  // character screen renders. The tab badge clears via
  // `selectTabBadges` (which gates on `levelUpAcknowledged`). Preserve
  // any other notification fields (toast, etc.) on the slice.
  useEffect(() => {
    const prev = store.getState().notifications;
    store.setState({
      notifications: { ...prev, levelUpAcknowledged: true },
    });
  }, [store]);

  // Phase 73 — LevelUpModal mount toggle. Strip tap opens, modal
  // commit / keep-deliberating dismisses. Snapshot the level + base
  // stat values at the moment the modal opens so it has the "before"
  // figures even if the engine mutates underneath us mid-allocation.
  // Morale ledger is static reference (gain/loss rules); collapsed by
  // default so the live sheet fits one screen. One tap reveals it.
  const [ledgerOpen, setLedgerOpen] = useState<boolean>(false);
  const [levelUpOpen, setLevelUpOpen] = useState<boolean>(false);
  const onOpenLevelUp = useCallback(() => setLevelUpOpen(true), []);
  const onCloseLevelUp = useCallback(() => setLevelUpOpen(false), []);

  // Learn-skill pass — LEVEL UP opens the stat ledger with the
  // learn-skill modal stacked on top: one pick of three qualifying
  // skills per level gained (the engine applies stacked level-ups in
  // one dispatch, so a multi-level XP dump queues multiple picks).
  // Offers regenerate after each pick; FORGO spends a pick on nothing.
  const [skillPicksRemaining, setSkillPicksRemaining] = useState<number>(0);
  const [skillOffers, setSkillOffers] = useState<
    ReturnType<typeof actions.getLearnableSkillOffers>
  >([]);
  const onLevelUp = useCallback(() => {
    const before = store.getState().player?.level ?? 0;
    actions.levelUp();
    const after = store.getState().player?.level ?? before;
    const gained = Math.max(0, after - before);
    if (gained > 0) {
      const offers = actions.getLearnableSkillOffers();
      if (offers.length > 0) {
        setSkillOffers(offers);
        setSkillPicksRemaining(gained);
      }
    }
    // The stat ledger opens beneath the learn modal — the user
    // allocates points once the picks are spent.
    setLevelUpOpen(true);
  }, [actions, store]);
  const advanceSkillPick = useCallback(() => {
    setSkillPicksRemaining((remaining) => {
      const next = remaining - 1;
      if (next > 0) {
        setSkillOffers(actions.getLearnableSkillOffers());
      } else {
        setSkillOffers([]);
      }
      return next;
    });
  }, [actions]);
  const onPickSkillOffer = useCallback(
    (skillId: string) => {
      actions.learnSkill(skillId);
      advanceSkillPick();
    },
    [actions, advanceSkillPick],
  );
  const onCommitAllocation = useCallback(
    (spent: { heart: number; body: number; mind: number }) => {
      // Dispatch the engine action N times — once per allocated
      // point. The engine clamps internally; we trust the modal's
      // local state to be valid (sum === totalPoints).
      for (let i = 0; i < spent.heart; i += 1) actions.allocateStatPoint('heart');
      for (let i = 0; i < spent.body; i += 1) actions.allocateStatPoint('body');
      for (let i = 0; i < spent.mind; i += 1) actions.allocateStatPoint('mind');
      setLevelUpOpen(false);
    },
    [actions],
  );

  return (
    <ScreenBg>
      {/* Sheet header — portrait + identity, in the D&D character-sheet
          idiom: bust top-left, name + alignment + XP centre, level box
          top-right. */}
      <View
        style={styles.sheetHeader}
        accessible
        accessibilityLabel={`${vm.a11y.characterName}. ${vm.a11y.level}. ${vm.a11y.experience}.`}
      >
        <View style={styles.sheetHeaderTopRow}>
          <View style={styles.portraitFrame}>
            <PlayerPortrait width={176} height={212} />
          </View>
          <View style={styles.identityCol}>
            <SectionLabel size={9} color={AXM.bone}>{vm.subtitle}</SectionLabel>
            <Text style={styles.characterName} numberOfLines={1}>{vm.displayName}</Text>
            <Text style={styles.identityAlignment} numberOfLines={1}>{vm.alignment.cellName}</Text>
            <View style={styles.xpRow}>
              <Text style={styles.xpLabel}>XP · LVL {vm.level + 1}</Text>
              <Text style={styles.xpValue}>{vm.xp} / {vm.xpMax}</Text>
            </View>
            <XpChain value={vm.xp} max={vm.xpMax} />
          </View>
          <View style={styles.levelBox}>
            <Text style={styles.levelText}>{vm.level}</Text>
            <Text style={styles.levelCaption}>LVL</Text>
          </View>
        </View>
        <View style={styles.baseRow} accessible accessibilityLabel={vm.a11y.baseStats}>
          {vm.base.map((r) => (
            <TooltipTarget
              key={r.stanceKey}
              kind="stat"
              id={r.stanceKey.toUpperCase()}
              accessibilityLabel={`Explain ${r.label} stat`}
              accessibilityHint="tap to read description"
              testID={`self-base-${r.stanceKey}`}
            >
              <View style={styles.baseCard}>
                <StanceGlyph kind={r.stanceKey} size={28} color={AXM.parchment} />
                <Text style={styles.baseStatLabel}>{r.label}</Text>
                <Text style={styles.baseStatValue}>{r.value}</Text>
              </View>
            </TooltipTarget>
          ))}
        </View>
      </View>

      {/* Level-up strips sit full-width beneath the header. */}
      {vm.pendingPoints > 0 && (
        <AscendStrip
          pendingPoints={vm.pendingPoints}
          level={vm.level}
          onOpen={onOpenLevelUp}
        />
      )}
      {vm.pendingPoints === 0 && vm.levelUpReady && (
        <LevelReadyStrip
          level={vm.level}
          onLevelUp={onLevelUp}
        />
      )}

      {/* Phase 73 — LevelUpModal overlays the SELF tab when the
          ASCEND strip is tapped. Non-tap-out-dismissible per the
          design (chat5 brief). Closes via COMMIT (allocates + closes)
          or "keep deliberating" / discard-confirm step. */}
      {levelUpOpen && (
        <LevelUpModal
          characterName={vm.displayName}
          fromLevel={vm.level}
          toLevel={vm.level + 1}
          totalPoints={vm.pendingPoints}
          current={(() => {
            const heart = vm.base.find((r) => r.stanceKey === 'heart')?.value ?? 0;
            const body = vm.base.find((r) => r.stanceKey === 'body')?.value ?? 0;
            const mind = vm.base.find((r) => r.stanceKey === 'mind')?.value ?? 0;
            return { heart, body, mind };
          })()}
          currentDerived={(() => {
            // Phase 88: Map derived stats to modal format
            const physical = vm.derived.find((r) => r.label === 'PHYSICAL');
            const mental = vm.derived.find((r) => r.label === 'MENTAL');
            const emotional = vm.derived.find((r) => r.label === 'EMOTIONAL');
            
            if (!physical || !mental || !emotional) return undefined;
            
            return {
              heart: { attack: emotional.attack, skill: emotional.skill, defense: emotional.defense },
              body: { attack: physical.attack, skill: physical.skill, defense: physical.defense },
              mind: { attack: mental.attack, skill: mental.skill, defense: mental.defense },
            };
          })()}
          onCommit={onCommitAllocation}
          onCancel={onCloseLevelUp}
        />
      )}

      {/* Learn-skill modal — stacks above the stat ledger (zIndex 60
          vs the LevelUpModal's 50) until every pick is spent. */}
      {skillPicksRemaining > 0 && skillOffers.length > 0 && (
        <LearnSkillModal
          offers={skillOffers}
          picksRemaining={skillPicksRemaining}
          onPick={onPickSkillOffer}
          onSkip={advanceSkillPick}
        />
      )}

      {/* Hazard deck — persistent library / remove-card surface
          (Phase 126). Always available outside an encounter. */}
      <Pressable
        style={styles.deckLink}
        onPress={() => router.push('/hazard-deck')}
        accessibilityRole="button"
        accessibilityLabel="Open your Hazard deck"
        accessibilityHint="study the cards you carry and thin the deck"
        testID="self-hazard-deck-link"
      >
        <View style={styles.deckLinkText}>
          <Text style={styles.deckLinkLabel}>✠ HAZARD DECK</Text>
          <Text style={styles.deckLinkSub}>study the cards you carry</Text>
        </View>
        <Text style={styles.deckLinkChevron}>›</Text>
      </Pressable>

      {/* Pools — VITAE + MORALE (Problem 6 design) */}
      <View style={styles.section}>
        <SectionLabel size={13}>✠ POOLS</SectionLabel>
        <View style={styles.poolsCard}>
          {[
            { label: 'VITAE', value: player?.health ?? 0, max: player?.maxHealth ?? 1, color: AXM.blood, gloss: 'flesh holds' },
            { label: 'MORALE', value: Math.max(1, Math.min(10, Math.round(((Number.isFinite(vm.morale) ? vm.morale : 0) + 100) / 20))), max: 10, color: AXM.sulfur, gloss: 'resolve to walk', breakAt: 2 },
          ].map((pool) => (
            <View key={pool.label} style={styles.poolRow}>
              <View style={styles.poolHeader}>
                <View style={styles.poolLabelRow}>
                  <Text style={[styles.poolLabel, { color: pool.color }]}>{pool.label}</Text>
                  <Text style={styles.poolGloss}>· {pool.gloss}</Text>
                </View>
                <Text style={styles.poolValue}>{pool.value}<Text style={styles.boneText}> / {pool.max}</Text></Text>
              </View>
              <View style={styles.poolTrack}>
                <View style={[styles.poolFill, { width: `${(pool.value / pool.max) * 100}%`, backgroundColor: pool.color }]} />
                {'breakAt' in pool && pool.breakAt != null && (
                  <View style={[styles.poolBreakTic, { left: `${(pool.breakAt / pool.max) * 100}%` }]} />
                )}
              </View>
            </View>
          ))}
        </View>
        <View style={styles.moraleLedger}>
          <Pressable
            style={styles.ledgerHeader}
            onPress={() => setLedgerOpen((o) => !o)}
            accessibilityRole="button"
            accessibilityLabel={`Morale ledger, ${ledgerOpen ? 'expanded' : 'collapsed'}`}
            testID="self-morale-ledger-toggle"
          >
            <SectionLabel size={9} color={AXM.sulfur}>MORALE · LEDGER</SectionLabel>
            <Text style={styles.ledgerChevron}>{ledgerOpen ? '▾' : '▸'}</Text>
          </Pressable>
          {ledgerOpen && (
            <>
              <View style={styles.ledgerGrid}>
                {[
                  { v: '+i', l: 'every victory', c: AXM.sulfur },
                  { v: '+ii', l: 'good rest at inn', c: AXM.sulfur },
                  { v: '+i', l: 'mercy granted', c: AXM.sulfur },
                  { v: '−ii', l: 'flee combat', c: AXM.blood },
                  { v: '−i', l: 'ally falls', c: AXM.blood },
                  { v: '−i', l: 'no rest in iii nights', c: AXM.blood },
                ].map((r, i) => (
                  <View key={i} style={styles.ledgerRow}>
                    <Text style={[styles.ledgerValue, { color: r.c }]}>{r.v}</Text>
                    <Text style={styles.ledgerDesc}>{r.l}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.ledgerDivider} />
              <Text style={styles.ledgerLore}>
                {"At "}
                <Text style={styles.bloodText}>ii or below</Text>
                {" the road begins to lie. Maps shift. Nodes whisper wrong names."}
              </Text>
            </>
          )}
        </View>
      </View>

      {/* Derived + Saves — two columns (D&D character-sheet body) */}
      <View style={styles.section}>
       <View style={styles.twoCol}>
        <View style={styles.colHalf} accessible accessibilityLabel={vm.a11y.derivedStats}>
        <SectionLabel size={13}>✠ DERIVED</SectionLabel>
        <View style={styles.derivedTable}>
          <View style={[styles.derivedRow, styles.derivedHeader]}>
            <Text style={[styles.derivedCell, styles.derivedRowLabel]} />
            <Text style={[styles.derivedCell, styles.derivedHeaderCell]}>ATK</Text>
            <Text style={[styles.derivedCell, styles.derivedHeaderCell]}>SKL</Text>
            <Text style={[styles.derivedCell, styles.derivedHeaderCell]}>DEF</Text>
          </View>
          {vm.derived.map((row) => (
            <View key={row.label} style={[styles.derivedRow, styles.derivedDataRow]}>
              <Text style={[styles.derivedCell, styles.derivedRowLabel]}>{row.label.slice(0, 4)}</Text>
              <TooltipTarget kind="item-stat" id={row.attackId} style={styles.derivedCell} accessibilityLabel={`Explain ${row.label} attack`} accessibilityHint="tap to read description" testID={`self-derived-${row.attackId}`}>
                <Text style={styles.derivedData}>{row.attack}</Text>
              </TooltipTarget>
              <TooltipTarget kind="item-stat" id={row.skillId} style={styles.derivedCell} accessibilityLabel={`Explain ${row.label} skill`} accessibilityHint="tap to read description" testID={`self-derived-${row.skillId}`}>
                <Text style={styles.derivedData}>{row.skill}</Text>
              </TooltipTarget>
              <TooltipTarget kind="item-stat" id={row.defenseId} style={styles.derivedCell} accessibilityLabel={`Explain ${row.label} defense`} accessibilityHint="tap to read description" testID={`self-derived-${row.defenseId}`}>
                <Text style={styles.derivedData}>{row.defense}</Text>
              </TooltipTarget>
            </View>
          ))}
          <View style={styles.luckRow}>
            <Text style={styles.luckLabel}>LUCK · AVG</Text>
            <Text style={styles.luckValue}>{vm.luck}</Text>
          </View>
        </View>
        </View>
        <View style={styles.colHalf} accessible accessibilityLabel={vm.a11y.saves}>
        <SectionLabel size={13}>✠ SAVES &amp; TESTS</SectionLabel>
        <View style={styles.savesGrid}>
          {vm.saves.map((s) => (
            // Phase 74 follow-up walkthrough Tick 4: wrap each
            // save/test cell in a TooltipTarget pointing at the
            // new kind:'derived' content (6 ids for the
            // save/test x stance matrix). Closes the SELF
            // walkthrough row.
            <TooltipTarget
              key={s.id}
              kind="derived"
              id={s.id}
              accessibilityLabel={`Explain ${s.label}`}
              accessibilityHint="tap to read description"
              testID={`self-derived-${s.id}`}
            >
              <View style={styles.saveCell}>
                <Text style={styles.saveKey}>{s.label}</Text>
                <Text style={styles.saveVal}>{s.value}</Text>
              </View>
            </TooltipTarget>
          ))}
        </View>
        </View>
       </View>
      </View>

      {/* Phase 92 — Morale */}
      <View style={[styles.section, { marginTop: -18 }]}>
        <SectionLabel size={13}>✠ MORALE</SectionLabel>
        <View style={styles.moraleRow}>
          <Text style={styles.moraleValue}>{Number.isFinite(vm.morale) ? vm.morale : 0}</Text>
          <Text style={styles.moraleLabel}>willpower</Text>
        </View>
      </View>

      {/* Afflictions & Blessings */}
      <View style={styles.section} accessible accessibilityLabel={vm.a11y.effects}>
        <SectionLabel size={13}>✠ AFFLICTIONS &amp; BLESSINGS</SectionLabel>
        <View style={styles.effectsList}>
          {vm.effects.length === 0 ? (
            <Text style={styles.emptyLabel}>{vm.emptyEffectsMessage}</Text>
          ) : (
            vm.effects.map((e) => (
              // Phase 74 follow-up walkthrough Tick 1: wrap the
              // affliction/blessing row in a TooltipTarget so a tap
              // fires the existing kind:'effect' content (Phase 75
              // authored — reads engine `Effect.payload` for the
              // stat-effect line + accent). id is the engine
              // effectId threaded through CharacterEffectRow.
              <TooltipTarget
                key={e.name}
                kind="effect"
                id={e.effectId}
                accessibilityLabel={`Effect ${e.name}`}
                accessibilityHint="tap to read description"
                testID={`self-effect-${e.effectId || e.name}`}
              >
                <View
                  style={[
                    styles.effectRow,
                    {
                      backgroundColor: e.tint === 'buff' ? AXM.buff : AXM.debuff,
                      borderColor: e.tint === 'buff' ? AXM.sulfur : AXM.blood,
                    },
                  ]}
                >
                  <EffectGlyph kind={e.kind} size={20} color={e.tint === 'buff' ? AXM.sulfur : AXM.blood} />
                  <View style={styles.flexOne}>
                    <View style={styles.effectTopRow}>
                      <Text style={styles.effectName}>{e.name}</Text>
                      <Text style={styles.effectMeta}>
                        {e.duration === null ? '∞' : `${e.duration}r`} · ×{e.intensity}
                      </Text>
                    </View>
                    <Text style={styles.effectDesc}>{e.description}</Text>
                  </View>
                </View>
              </TooltipTarget>
            ))
          )}
        </View>
      </View>

      {/* WORN & WIELDED removed from the SELF tab (visual-audit
          2026-06) — equipment lives in the SATCHEL tab; the SELF sheet
          keeps to identity + stats so it fits one screen. */}

      {/* Skills */}
      {vm.skills.length > 0 && (
        <View style={styles.section}>
          <SectionLabel size={13}>✠ FALLACIES &amp; PARADOXES</SectionLabel>
          <View style={styles.skillsGrid}>
            {vm.skills.map((s) => (
              // Phase 74 follow-up walkthrough Tick 2: wrap each
              // skill card in a TooltipTarget pointing at the
              // existing kind:'skill' content (Phase 75 authored
              // — engine description + cost/stance footnote).
              // vm.skills is currently dead surface ([] in the
              // presenter); the wire-up is forward-looking.
              <TooltipTarget
                key={s.id || s.name}
                kind="skill"
                id={s.id}
                accessibilityLabel={`Explain ${s.name} skill`}
                accessibilityHint="tap to read description"
                testID={`self-skill-${s.id || s.name}`}
              >
                <View
                  style={[
                    styles.skillCard,
                    {
                      borderColor: s.category === 'paradox' ? AXM.sulfur : AXM.parchment,
                      borderStyle: s.category === 'paradox' ? 'solid' : 'dashed',
                    },
                  ]}
                >
                  <StanceGlyph kind={s.stanceKey} size={16} color={AXM.bone} />
                  <View style={styles.flexOne}>
                    <Text style={styles.skillName}>{s.name}</Text>
                    <Text style={[styles.skillCat, { color: s.category === 'paradox' ? AXM.sulfur : AXM.parchment }]}>
                      {s.category.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </TooltipTarget>
            ))}
          </View>
        </View>
      )}
      <ThemeSwitcher />
      <DevToolsLink />
    </ScreenBg>
  );
}

const useStyles = makeStyles((AXM) => ({
  // Density pass (visual-audit 2026-06): tightened section spacing and
  // hero-element sizes so the whole SELF tab fits a 390×844 screen
  // without scrolling. Kept legible — only spacing/scale shrank.
  // D&D character-sheet header: portrait bust + identity + level box.
  sheetHeader: { flexDirection: 'column', paddingHorizontal: 12, paddingTop: 4, paddingBottom: 0 },
  sheetHeaderTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  portraitFrame: { width: 180, height: 216, borderWidth: 1, borderColor: AXM.ash, backgroundColor: AXM.deepBg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  identityCol: { flex: 1, paddingTop: 2 },
  identityAlignment: { fontFamily: FONTS.serifItalic, fontSize: 11, color: AXM.bone, marginTop: 1, marginBottom: 4 },
  characterName: { fontFamily: FONTS.gothic, fontSize: 22, lineHeight: 24, color: AXM.parchment, marginTop: 1 },
  levelBox: { width: 60, height: 66, borderWidth: 2, borderColor: AXM.parchment, backgroundColor: AXM.deepBg, alignItems: 'center', justifyContent: 'center' },
  levelText: { fontFamily: FONTS.gothic, fontSize: 34, lineHeight: 36, color: AXM.sulfur },
  levelCaption: { fontFamily: FONTS.sans, fontSize: 8, letterSpacing: 2, color: AXM.bone },
  twoCol: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  colHalf: { flex: 1 },
  ledgerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ledgerChevron: { fontFamily: FONTS.mono, fontSize: 12, color: AXM.sulfur },
  xpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  xpLabel: { fontFamily: FONTS.mono, fontSize: 11, color: AXM.bone, letterSpacing: 1 },
  xpValue: { fontFamily: FONTS.mono, fontSize: 11, color: AXM.sulfur },
  section: { paddingTop: 4, paddingHorizontal: 12, paddingBottom: 0 },
  deckLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 12, marginTop: 6, paddingVertical: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: AXM.ash, backgroundColor: AXM.panelBg },
  deckLinkText: { flex: 1 },
  deckLinkLabel: { fontFamily: FONTS.gothic, fontSize: 15, letterSpacing: 1, color: AXM.parchment },
  deckLinkSub: { fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 0.5, color: AXM.bone, marginTop: 2 },
  deckLinkChevron: { fontFamily: FONTS.gothic, fontSize: 22, color: AXM.bone },
  baseRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: -52, justifyContent: 'flex-end' },
  baseCard: { flex: 1, paddingVertical: 10, paddingHorizontal: 6, backgroundColor: AXM.panelBg, borderWidth: 1, borderColor: AXM.ash, alignItems: 'center' },
  baseStatLabel: { fontFamily: FONTS.sans, fontSize: 13, letterSpacing: 2, color: AXM.bone, marginTop: 3 },
  baseStatValue: { fontFamily: FONTS.gothic, fontSize: 32, color: AXM.sulfur, lineHeight: 34, marginTop: 2 },
  derivedTable: { marginTop: 3, backgroundColor: AXM.panelBg, borderWidth: 1, borderColor: AXM.ash, padding: 5, paddingHorizontal: 8 },
  derivedRow: { flexDirection: 'row' },
  derivedHeader: { borderBottomWidth: 1, borderBottomColor: AXM.ash, borderStyle: 'dashed', paddingBottom: 2, marginBottom: 0 },
  derivedDataRow: { borderBottomWidth: 1, borderBottomColor: AXM.ash, paddingVertical: 2 },
  derivedCell: { flex: 1 },
  // Larger type across the sheet for low-vision readability (visual-audit
  // 2026-06) — the freed space (no WORN & WIELDED, two columns) is spent
  // on legibility, not density.
  derivedRowLabel: { fontFamily: FONTS.sans, fontSize: 11, color: AXM.parchment, letterSpacing: 0.5, flex: 1.8 },
  derivedHeaderCell: { fontFamily: FONTS.mono, fontSize: 10, color: AXM.bone, textAlign: 'center', letterSpacing: 1 },
  derivedData: { fontFamily: FONTS.gothic, fontSize: 15, color: AXM.parchment, textAlign: 'center' },
  luckRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5, paddingTop: 4 },
  luckLabel: { fontFamily: FONTS.sans, fontSize: 11, color: AXM.bone, letterSpacing: 1 },
  luckValue: { fontFamily: FONTS.gothic, fontSize: 17, color: AXM.sulfur },
  // SAVES & TESTS — a clean single-column list (was a cramped 3-up grid of
  // tiny chips): label left, value right, hairline-separated rows.
  savesGrid: { marginTop: 4, borderWidth: 1, borderColor: AXM.ash, backgroundColor: AXM.panelBg, paddingHorizontal: 8 },
  saveCell: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: AXM.ash, borderStyle: 'dashed' },
  saveKey: { fontFamily: FONTS.sans, fontSize: 13, color: AXM.parchment, letterSpacing: 0.5 },
  saveVal: { fontFamily: FONTS.gothic, fontSize: 17, color: AXM.sulfur },
  alignmentCellName: { fontFamily: FONTS.gothic, fontSize: 17, color: AXM.parchment, letterSpacing: 1, marginTop: 3 },
  alignmentAxesRow: { flexDirection: 'row', gap: 6, marginTop: 5 },
  alignmentAxisChip: { flex: 1, borderWidth: 1, borderColor: AXM.ash, borderStyle: 'dashed', paddingVertical: 5, paddingHorizontal: 6 },
  alignmentAxisLabel: { fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1, color: AXM.bone },
  alignmentAxisBucket: { fontFamily: FONTS.mono, fontSize: 14, color: AXM.parchment, marginTop: 2 },
  moraleRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 4 },
  moraleValue: { fontFamily: FONTS.gothic, fontSize: 24, color: AXM.parchment },
  moraleLabel: { fontFamily: FONTS.serif, fontSize: 14, color: AXM.bone, letterSpacing: 1 },
  effectsList: { marginTop: 4, gap: 4 },
  emptyLabel: { fontFamily: FONTS.mono, fontSize: 12, color: AXM.bone, letterSpacing: 1, textTransform: 'uppercase' },
  effectRow: { flexDirection: 'row', gap: 8, alignItems: 'center', borderWidth: 1, padding: 5, paddingHorizontal: 7 },
  effectTopRow: { flexDirection: 'row', justifyContent: 'space-between' },
  effectName: { fontFamily: FONTS.gothic, fontSize: 13, color: AXM.parchment, letterSpacing: 1 },
  effectMeta: { fontFamily: FONTS.mono, fontSize: 9, color: AXM.bone },
  effectDesc: { fontFamily: FONTS.serif, fontSize: 10, color: AXM.bone, lineHeight: 13, marginTop: 1 },
  equipRow: { flexDirection: 'row', gap: 10, marginTop: 4, alignItems: 'center' },
  slotsGrid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  slotCell: { width: '48%', borderWidth: 1, borderColor: AXM.ash, paddingVertical: 2, paddingHorizontal: 5, minHeight: 28, backgroundColor: AXM.panelBg },
  slotEmpty: { backgroundColor: 'transparent', borderStyle: 'dashed' },
  slotName: { fontFamily: FONTS.sans, fontSize: 8, letterSpacing: 1.5, color: AXM.bone },
  slotItem: { fontFamily: FONTS.serif, fontSize: 11, color: AXM.parchment, lineHeight: 14 },
  skillsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 3 },
  boneText: { color: AXM.bone },
  bloodText: { color: AXM.blood },
  flexOne: { flex: 1 },
  marginTop8: { marginTop: 5 },
  skillCard: { width: '48%', borderWidth: 2, padding: 4, paddingHorizontal: 6, backgroundColor: AXM.bg, flexDirection: 'row', alignItems: 'center', gap: 6 },
  skillName: { fontFamily: FONTS.gothic, fontSize: 12, color: AXM.parchment, lineHeight: 14 },
  skillCat: { fontFamily: FONTS.mono, fontSize: 8, letterSpacing: 1 },
  poolsCard: { marginTop: 3, backgroundColor: AXM.panelBg, borderWidth: 1, borderColor: AXM.ash, paddingVertical: 5, paddingHorizontal: 12, gap: 4 },
  poolRow: {},
  poolHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 },
  poolLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  poolLabel: { fontFamily: FONTS.sans, fontSize: 13, letterSpacing: 1.6 },
  poolNewBadge: { fontFamily: FONTS.mono, fontSize: 8, color: AXM.bg, backgroundColor: AXM.sulfur, paddingHorizontal: 4, paddingVertical: 1, letterSpacing: 1, overflow: 'hidden' },
  poolGloss: { fontFamily: FONTS.serifItalic, fontSize: 12, color: AXM.bone },
  poolValue: { fontFamily: FONTS.mono, fontSize: 13, color: AXM.parchment },
  poolTrack: { position: 'relative' as const, height: 10, backgroundColor: AXM.deepBg, borderWidth: 1, borderColor: AXM.ash },
  poolFill: { position: 'absolute' as const, top: 1, bottom: 1, left: 1 },
  poolBreakTic: { position: 'absolute' as const, top: -2, bottom: -2, width: 1, backgroundColor: AXM.blood },
  moraleLedger: { marginTop: 5, backgroundColor: AXM.deepBg, borderWidth: 1, borderColor: AXM.ash, paddingVertical: 7, paddingHorizontal: 12 },
  ledgerGrid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 8, rowGap: 2, marginTop: 4 },
  ledgerRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, width: '48%' },
  ledgerValue: { fontFamily: FONTS.mono, fontSize: 13, width: 24, textAlign: 'right' },
  ledgerDesc: { fontFamily: FONTS.serif, fontSize: 12, color: AXM.parchment },
  ledgerDivider: { height: 1, borderTopWidth: 1, borderTopColor: AXM.ash, borderStyle: 'dashed', marginTop: 5, marginBottom: 4 },
  ledgerLore: { fontFamily: FONTS.serifItalic, fontSize: 12, color: AXM.bone, lineHeight: 15 },
}));
