import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from '@/lib/platform/router';
import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';
import { TooltipTarget } from '@/components/tooltip/TooltipTarget';
import { AscendStrip } from '@/components/levelup/AscendStrip';
import { LearnCardModal } from '@/components/levelup/LearnCardModal';
import { LevelReadyStrip } from '@/components/levelup/LevelReadyStrip';
import { LevelUpModal } from '@/components/levelup/LevelUpModal';
import { DevToolsLink } from '@/components/dev/DevToolsLink';
import { SettingsLink } from '@/components/menu/SettingsLink';
import { ScreenBg } from '@/components/ScreenBg';
import { SectionLabel } from '@/components/SectionLabel';
import { StanceGlyph } from '@/components/StanceGlyph';
import { EffectGlyph } from '@/components/EffectGlyph';
import { XpChain } from '@/components/XpChain';
import { PlayerPortraitImage } from '@/components/art/PlayerPortraitImage';
import { nextPlayerPortrait, portraitIdFromFlags, PORTRAIT_FLAG_PREFIX } from '@/assets/images/portraits';
import { useGameActions, useGameState, useGameStore } from '@/state/GameStoreProvider';
import { graceBreakLegend, graceTrack, selectCharacterViewModel } from '@/state/presenters/character.engine';

/**
 * The SELF sheet (`/character`).
 *
 * Purpose: render the character view model — identity, POOLS, DERIVED, SAVES &
 * TESTS, the GRACE balance and effects — as the tab's scrolling sheet.
 * Inputs: none by argument; reads the `player`, `moralMeter` and
 * `philosophicalAlignment` store slices and turns them into a view model via
 * `selectCharacterViewModel`.
 * Output: the sheet element tree.
 *
 * Resolves `05-character-fresh / 06-character-midgame (/character, GRACE
 * footer)`: the GRACE break legend added a stacked 12pt line under the pool
 * track, which pushed 'the pool above is this balance, read in tenths.' onto
 * the bottom tab bar and sliced it through the x-height. The legend now rides
 * the pool label row, which is already 13pt tall, so the sheet's below-pools
 * rhythm returns to where it sat before the legend existed.
 */
export default function CharacterScreen() {
  const AXM = usePalette();
  const styles = useStyles();
  // Subscribe to stable slices to avoid getSnapshot identity churn:
  // `selectCharacterViewModel` returns a frozen new object every call,
  // which would loop `useSyncExternalStore` if used directly as a
  // selector. Pull the underlying slice and memoize the VM downstream
  // (mirrors the pattern fixed in event screen, Phase 6 Tick A).
  const player = useGameState((s) => s.player);
  // FE-017: `selectCharacterViewModel` reads three slices — player,
  // moralMeter and philosophicalAlignment — but the screen only ever handed
  // it `{ player }`. The other two arrived undefined on every render, so the
  // sheet's GRACE was pinned to the value for a zero balance and the
  // alignment line to the default cell, no matter what the run had done. The
  // exploration HUD reads moralMeter directly and showed 6/10 on the same
  // save where this screen showed 5/10. Both slices are stable references, so
  // subscribing to them keeps the getSnapshot identity contract intact.
  const moralMeter = useGameState((s) => s.moralMeter);
  const philosophicalAlignment = useGameState((s) => s.philosophicalAlignment);
  const vm = useMemo(
    () => selectCharacterViewModel({ player, moralMeter, philosophicalAlignment } as never),
    [player, moralMeter, philosophicalAlignment],
  );
  // Audit 2026-09-12: GRACE track geometry from the presenter (engine band boundary).
  const grace = graceTrack(vm.morale);
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
  // The Account is static reference (gain/loss rules); collapsed by
  // default so the live sheet fits one screen. One tap reveals it.
  const [ledgerOpen, setLedgerOpen] = useState<boolean>(false);
  const [levelUpOpen, setLevelUpOpen] = useState<boolean>(false);
  const onOpenLevelUp = useCallback(() => setLevelUpOpen(true), []);
  const onCloseLevelUp = useCallback(() => setLevelUpOpen(false), []);

  // Tap the bust to cycle the portrait gallery. Stored as a `portrait:<id>`
  // flag (generic string flags ride the normal save).
  const onCyclePortrait = useCallback(() => {
    store.setState((s) => {
      const flags = s.flags ?? [];
      const next = nextPlayerPortrait(portraitIdFromFlags(flags));
      return { flags: [...flags.filter((f) => !f.startsWith(PORTRAIT_FLAG_PREFIX)), `${PORTRAIT_FLAG_PREFIX}${next.id}`] };
    });
  }, [store]);

  // Learn-card pass — LEVEL UP opens the stat ledger with the
  // learn-card modal stacked on top: one pick of three qualifying
  // cards per level gained (the engine applies stacked level-ups in
  // one dispatch, so a multi-level XP dump queues multiple picks).
  // Offers regenerate after each pick; FORGO spends a pick on nothing.
  const [cardPicksRemaining, setCardPicksRemaining] = useState<number>(0);
  const [cardOffers, setCardOffers] = useState<
    ReturnType<typeof actions.getLearnableCardOffers>
  >([]);
  const onLevelUp = useCallback(() => {
    const before = store.getState().player?.level ?? 0;
    actions.levelUp();
    const after = store.getState().player?.level ?? before;
    const gained = Math.max(0, after - before);
    if (gained > 0) {
      const offers = actions.getLearnableCardOffers();
      if (offers.length > 0) {
        setCardOffers(offers);
        setCardPicksRemaining(gained);
      }
    }
    // The stat ledger opens beneath the learn modal — the user
    // allocates points once the picks are spent.
    setLevelUpOpen(true);
  }, [actions, store]);
  const advanceCardPick = useCallback(() => {
    setCardPicksRemaining((remaining) => {
      const next = remaining - 1;
      if (next > 0) {
        setCardOffers(actions.getLearnableCardOffers());
      } else {
        setCardOffers([]);
      }
      return next;
    });
  }, [actions]);
  const onPickCardOffer = useCallback(
    (cardId: string) => {
      actions.learnCard(cardId);
      advanceCardPick();
    },
    [actions, advanceCardPick],
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
          <Pressable
            style={styles.portraitFrame}
            onPress={onCyclePortrait}
            accessibilityRole="button"
            accessibilityLabel="Change portrait"
            accessibilityHint="cycles through the portrait gallery"
            testID="self-portrait-cycle"
          >
            <PlayerPortraitImage width={176} height={212} />
          </Pressable>
          <View style={styles.identityCol}>
            <SectionLabel size={9} color={AXM.bone}>{vm.subtitle}</SectionLabel>
            <Text style={styles.characterName} numberOfLines={1}>{vm.displayName}</Text>
            {/* S3-sheet-C17: the cell names run to 33 characters
              * ('Agnostic-Pessimistic-Transcendent') and this column is ~106pt
              * wide, so a one-line clamp cut every long alignment to
              * 'Agnostic-Neutral-…' with no second surface carrying the rest.
              * Unclamped it wraps on its own hyphens and is readable in full. */}
            <Text style={styles.identityAlignment} testID="self-identity-alignment">{vm.alignment.cellName}</Text>
            <View style={styles.xpRow}>
              {/* FE-004: value first, then the caption naming what it counts
                * TOWARD. Side-by-side, the label and value each wrapped inside
                * this ~130px column and interleaved into 'XP · 0 /' over
                * 'LVL 2  1000'; stacked, each fits one line and the caption
                * cannot be read as the current level (which the medallion to
                * the right already shows). */}
              <Text style={styles.xpValue} numberOfLines={1}>{vm.xp} / {vm.xpMax}</Text>
              <Text style={styles.xpLabel} numberOfLines={1}>{vm.xpLabel}</Text>
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
              heart: { attack: emotional.attack, defense: emotional.defense },
              body: { attack: physical.attack, defense: physical.defense },
              mind: { attack: mental.attack, defense: mental.defense },
            };
          })()}
          onCommit={onCommitAllocation}
          onCancel={onCloseLevelUp}
        />
      )}

      {/* Learn-card modal — stacks above the stat ledger (zIndex 60
          vs the LevelUpModal's 50) until every pick is spent. */}
      {cardPicksRemaining > 0 && cardOffers.length > 0 && (
        <LearnCardModal
          offers={cardOffers}
          picksRemaining={cardPicksRemaining}
          onPick={onPickCardOffer}
          onSkip={advanceCardPick}
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

      {/* Pools — VITAE + GRACE (Problem 6 design; GRACE né MORALE, Phase 44h) */}
      <View style={styles.section}>
        <SectionLabel size={13}>✠ POOLS</SectionLabel>
        <View style={styles.poolsCard}>
          {[
            { label: 'VITAE', value: player?.health ?? 0, max: player?.maxHealth ?? 1, color: AXM.blood, gloss: 'flesh holds' },
            // Audit 2026-09-12: the GRACE geometry (tenths, fill, arrears tic)
            // comes from the presenter, which reads the engine's band boundary.
            { label: 'GRACE', value: grace.value, max: grace.max, fillPct: grace.fillPct, breakPct: grace.breakPct, color: AXM.sulfur, gloss: 'kept by the parish' },
          ].map((pool) => (
            <View key={pool.label} style={styles.poolRow}>
              <View style={styles.poolHeader} testID={`self-pool-header-${pool.label.toLowerCase()}`}>
                <View style={styles.poolLabelRow}>
                  <Text style={[styles.poolLabel, { color: pool.color }]}>{pool.label}</Text>
                  <Text style={styles.poolGloss}>· {pool.gloss}</Text>
                  {/* S3-sheet-C12: the tic was the only mark on the track and
                    * carried no key, so it read as a notch in the bar. Copy
                    * comes from the presenter; the threshold stays where it was.
                    *
                    * Repair (fresh-eyes GRACE footer): the key used to be its
                    * own line under the track, which cost the sheet 12pt and
                    * pushed 'read in tenths.' down onto the tab bar, sliced
                    * through the x-height at BOTH viewports. Riding the label
                    * line instead costs nothing — this row is already 13pt tall
                    * for the pool name — so the sheet keeps its old rhythm and
                    * the key stays beside the track it keys. */}
                  {'breakPct' in pool && pool.breakPct != null && (
                    <Text style={styles.poolBreakLegend} numberOfLines={1} testID="self-grace-break-legend">
                      {graceBreakLegend()}
                    </Text>
                  )}
                </View>
                <Text style={styles.poolValue}>{pool.value}<Text style={styles.boneText}> / {pool.max}</Text></Text>
              </View>
              <View style={styles.poolTrack}>
                <View style={[styles.poolFill, { width: `${'fillPct' in pool && pool.fillPct != null ? pool.fillPct : (pool.value / pool.max) * 100}%`, backgroundColor: pool.color }]} />
                {'breakPct' in pool && pool.breakPct != null && (
                  <View style={[styles.poolBreakTic, { left: `${pool.breakPct}%` }]} />
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
            accessibilityLabel={`The Account, ${ledgerOpen ? 'expanded' : 'collapsed'}`}
            testID="self-morale-ledger-toggle"
          >
            <SectionLabel size={9} color={AXM.sulfur}>THE ACCOUNT</SectionLabel>
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
                {" you are in arrears. The Parish remembers everything it was owed."}
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
          {/* FE-015: two headers, because there are two columns of numbers.
            * This row advertised ATK / SKL / DEF while every data row below
            * renders only attack and defense, and the header's empty label cell
            * used a different flex from the data rows' label cell — so three
            * headers sat over two values, none of them aligned: '7' landed
            * between ATK and SKL, '21' under DEF. DerivedStatRow carries no
            * skill value, so SKL was advertising a column that does not exist. */}
          <View style={[styles.derivedRow, styles.derivedHeader]}>
            <Text style={[styles.derivedCell, styles.derivedRowLabel]} />
            <Text style={[styles.derivedCell, styles.derivedHeaderCell]}>ATK</Text>
            <Text style={[styles.derivedCell, styles.derivedHeaderCell]}>DEF</Text>
          </View>
          {vm.derived.map((row) => (
            <View key={row.label} style={[styles.derivedRow, styles.derivedDataRow]}>
              <Text style={[styles.derivedCell, styles.derivedRowLabel]}>{row.label.slice(0, 4)}</Text>
              <TooltipTarget kind="item-stat" id={row.attackId} style={styles.derivedCell} accessibilityLabel={`Explain ${row.label} attack`} accessibilityHint="tap to read description" testID={`self-derived-${row.attackId}`}>
                <Text style={styles.derivedData}>{row.attack}</Text>
              </TooltipTarget>
              <TooltipTarget kind="item-stat" id={row.defenseId} style={styles.derivedCell} accessibilityLabel={`Explain ${row.label} defense`} accessibilityHint="tap to read description" testID={`self-derived-${row.defenseId}`}>
                <Text style={styles.derivedData}>{row.defense}</Text>
              </TooltipTarget>
            </View>
          ))}
          <View style={styles.luckRow}>
            <Text style={styles.luckLabel}>LUCK · AVG</Text>
            <Text style={styles.luckValue}>{vm.luckLabel}</Text>
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

      {/* Phase 92 — Grace (né Morale, Phase 44h).
        * FE-003: this section and the GRACE bar under POOLS are the same
        * resource at two scales — the bar is this balance bucketed to 1-10.
        * Headed with the bare word GRACE they read as two separate pools with
        * two different numbers, so the heading now names this one as the
        * balance and a line under it states the relationship. Copy comes from
        * the presenter (`vm.graceCopy`); the screen carries no literal. */}
      <View style={[styles.section, { marginTop: -18 }]}>
        <SectionLabel size={13}>{vm.graceCopy.balanceHeading}</SectionLabel>
        <View style={styles.moraleRow}>
          <Text style={styles.moraleValue}>{Number.isFinite(vm.morale) ? vm.morale : 0}</Text>
          <Text style={styles.moraleLabel}>{vm.graceCopy.balanceUnit}</Text>
        </View>
        <Text style={styles.graceRelation}>{vm.graceCopy.balanceRelation}</Text>
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

      {/* Cards */}
      {vm.cards.length > 0 && (
        <View style={styles.section}>
          <SectionLabel size={13}>✠ FALLACIES &amp; PARADOXES</SectionLabel>
          <View style={styles.cardsGrid}>
            {vm.cards.map((s) => (
              // Phase 74 follow-up walkthrough Tick 2: wrap each
              // card card in a TooltipTarget pointing at the
              // existing kind:'card' content (Phase 75 authored
              // — engine description + cost/stance footnote).
              // vm.cards is currently dead surface ([] in the
              // presenter); the wire-up is forward-looking.
              <TooltipTarget
                key={s.id || s.name}
                kind="card"
                id={s.id}
                accessibilityLabel={`Explain ${s.name} card`}
                accessibilityHint="tap to read description"
                testID={`self-card-${s.id || s.name}`}
              >
                <View
                  style={[
                    styles.cardTile,
                    { borderColor: AXM.parchment, borderStyle: 'dashed' },
                  ]}
                >
                  <StanceGlyph kind={s.stanceKey} size={16} color={AXM.bone} />
                  <View style={styles.flexOne}>
                    <Text style={styles.cardName}>{s.name}</Text>
                  </View>
                </View>
              </TooltipTarget>
            ))}
          </View>
        </View>
      )}
      {/* The COLOUR THEME picker moved to /settings (2026-09-23). */}
      <SettingsLink />
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
  xpRow: { flexDirection: 'column', marginBottom: 2 },
  xpLabel: { fontFamily: FONTS.mono, fontSize: 10, color: AXM.bone, letterSpacing: 1 },
  xpValue: { fontFamily: FONTS.mono, fontSize: 12, color: AXM.sulfur },
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
  // FE-003 — the line that ties the raw balance to the 1-10 pool bar above.
  graceRelation: { fontFamily: FONTS.serifItalic, fontSize: 11, color: AXM.bone, lineHeight: 15, marginTop: 2 },
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
  cardsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 3 },
  boneText: { color: AXM.bone },
  bloodText: { color: AXM.blood },
  flexOne: { flex: 1 },
  marginTop8: { marginTop: 5 },
  cardTile: { width: '48%', borderWidth: 2, padding: 4, paddingHorizontal: 6, backgroundColor: AXM.bg, flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardName: { fontFamily: FONTS.gothic, fontSize: 12, color: AXM.parchment, lineHeight: 14 },
  poolsCard: { marginTop: 3, backgroundColor: AXM.panelBg, borderWidth: 1, borderColor: AXM.ash, paddingVertical: 5, paddingHorizontal: 12, gap: 4 },
  poolRow: {},
  poolHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 },
  // `flexShrink` so the label row yields to the value instead of overflowing
  // the card once the GRACE row carries the break legend as a third child.
  poolLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  poolLabel: { fontFamily: FONTS.sans, fontSize: 13, letterSpacing: 1.6 },
  poolNewBadge: { fontFamily: FONTS.mono, fontSize: 8, color: AXM.bg, backgroundColor: AXM.sulfur, paddingHorizontal: 4, paddingVertical: 1, letterSpacing: 1, overflow: 'hidden' },
  poolGloss: { fontFamily: FONTS.serifItalic, fontSize: 12, color: AXM.bone },
  poolValue: { fontFamily: FONTS.mono, fontSize: 13, color: AXM.parchment },
  poolTrack: { position: 'relative' as const, height: 10, backgroundColor: AXM.deepBg, borderWidth: 1, borderColor: AXM.ash },
  poolFill: { position: 'absolute' as const, top: 1, bottom: 1, left: 1 },
  poolBreakTic: { position: 'absolute' as const, top: -2, bottom: -2, width: 1, backgroundColor: AXM.blood },
  // S3-sheet-C12 — the tic's key: blood-coloured so the line and the mark read
  // as one thing. It rides the pool label row (no `marginTop`, no block of its
  // own): stacked under the track it added 12pt to the sheet and drove the
  // GRACE balance caption under the tab bar at both viewports.
  poolBreakLegend: { fontFamily: FONTS.mono, fontSize: 8, color: AXM.blood, letterSpacing: 0.6, flexShrink: 1 },
  moraleLedger: { marginTop: 5, backgroundColor: AXM.deepBg, borderWidth: 1, borderColor: AXM.ash, paddingVertical: 7, paddingHorizontal: 12 },
  ledgerGrid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 8, rowGap: 2, marginTop: 4 },
  ledgerRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, width: '48%' },
  ledgerValue: { fontFamily: FONTS.mono, fontSize: 13, width: 24, textAlign: 'right' },
  ledgerDesc: { fontFamily: FONTS.serif, fontSize: 12, color: AXM.parchment },
  ledgerDivider: { height: 1, borderTopWidth: 1, borderTopColor: AXM.ash, borderStyle: 'dashed', marginTop: 5, marginBottom: 4 },
  ledgerLore: { fontFamily: FONTS.serifItalic, fontSize: 12, color: AXM.bone, lineHeight: 15 },
}));
