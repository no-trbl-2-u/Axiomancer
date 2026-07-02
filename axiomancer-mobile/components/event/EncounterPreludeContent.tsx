import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path as SvgPath } from 'react-native-svg';
import { EventArt } from '@/components/event/EventArt';
import { EventCodexHeader } from '@/components/event/EventCodexHeader';
import { Splatter } from '@/components/Splatter';
import { ActionIcon } from '@/components/ActionIcon';
import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';
import { useAesthetic } from '@/state/aesthetic-mode';
import { selectEventCodexHeader } from '@/state/presenters/event.codex.engine';
import type { EventViewModel } from '@/state/presenters/event.engine';

interface EncounterPreludeContentProps {
    vm: EventViewModel;
    onFight: () => void;
    onFlee: () => void;
}

export function EncounterPreludeContent({
    vm,
    onFight,
    onFlee,
}: EncounterPreludeContentProps) {
    const AXM = usePalette();
    const styles = useStyles();
    const { mode: aesthetic } = useAesthetic();
    const isBoss = vm.variant === 'boss';
    const fightChoice = vm.choices.find((c) => c.id === 'fight');
    const fleeChoice = vm.choices.find((c) => c.id === 'flee');
    const fleeEnabled = fleeChoice?.enabled ?? !isBoss;
    const fightSubtitle = fightChoice?.subtitle ?? null;
    const fightDecode = fightChoice?.decode ?? null;
    const fleeSubtitle = fleeChoice?.subtitle ?? null;
    const fleeDecode = fleeChoice?.decode ?? null;

    return (
        <View style={styles.preludeRoot}>
            <ScrollView style={styles.preludeScroll} contentContainerStyle={styles.preludeScrollPad} showsVerticalScrollIndicator={false}>
            {aesthetic === 'codex' && (() => {
                const { left, right } = selectEventCodexHeader(vm);
                return <EventCodexHeader left={left} right={right} />;
            })()}

            <View style={styles.preludeHeader}>
                <Svg width={10} height={10} viewBox="0 0 10 10">
                    <SvgPath d="M5 1 L 7 7 L 3 7 Z" fill={AXM.blood} />
                </Svg>
                <Text style={styles.preludeHeaderText}>
                    {vm.preludeChrome!.eyebrow}
                </Text>
            </View>

            <View style={styles.illustration}>
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: AXM.deepBg }]} />
                <EventArt slug={vm.artSlug} enemyArtKey={vm.enemyArtKey} />
                <View style={styles.strifeSash} testID="encounter-modal-sash">
                    <Text style={styles.strifeSashText}>
                        {vm.preludeChrome!.sashLabel}
                    </Text>
                </View>
                <Splatter
                    color={AXM.bloodMed}
                    size={140}
                    seed={45}
                    style={{ position: 'absolute', top: -20, right: -30, opacity: isBoss ? 0.7 : 0.5 }}
                />
            </View>

            <View style={styles.titleArea}>
                <Text style={[styles.title, isBoss && styles.titleBoss]} numberOfLines={2}>
                    {vm.title}
                </Text>
                {vm.subtitle.length > 0 && (
                    <Text style={styles.subtitle} numberOfLines={2}>— {vm.subtitle}</Text>
                )}
            </View>

            <View style={styles.body}>
                <Text style={styles.bodyText} numberOfLines={3}>
                    {vm.body}
                </Text>
                {/* One-doom-grammar pass — the same hopeless register
                  * as the hazard danger intro, ending on "Unless…". */}
                <Text style={styles.doomLine} numberOfLines={3} testID="encounter-modal-doom-line">
                    {vm.preludeChrome!.doomLine}
                </Text>
            </View>
            </ScrollView>

            {/* ENGAGE / FLEE are PINNED below the scroll — always visible, never
              * scrolled off (the modal is full-height; you never scroll to act). */}
            <View style={styles.choices}>
                <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Engage"
                    onPress={onFight}
                    style={[styles.choiceRow, { borderColor: AXM.blood, borderLeftColor: AXM.blood }]}
                    testID="encounter-modal-fight"
                >
                    <ActionIcon kind="sword" size={20} color={AXM.blood} />
                    <View style={{ flex: 1 }}>
                        <View style={styles.choiceLabelRow}>
                            <Text style={[styles.choiceLabel, { color: AXM.blood }]}>ENGAGE</Text>
                            {fightSubtitle !== null && (
                                <Text style={styles.choiceSubtitle} testID="encounter-modal-fight-subtitle">
                                    {fightSubtitle}
                                </Text>
                            )}
                        </View>
                        {fightDecode !== null && (
                            <Text style={styles.choiceDecode} testID="encounter-modal-fight-decode">
                                {fightDecode}
                            </Text>
                        )}
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Flee"
                    accessibilityState={{ disabled: !fleeEnabled }}
                    disabled={!fleeEnabled}
                    onPress={onFlee}
                    style={[
                        styles.choiceRow,
                        { borderColor: AXM.bone, borderLeftColor: AXM.bone, opacity: fleeEnabled ? 1 : 0.4 },
                    ]}
                    testID="encounter-modal-flee"
                >
                    <ActionIcon kind="flee" size={20} color={AXM.bone} />
                    <View style={{ flex: 1 }}>
                        <View style={styles.choiceLabelRow}>
                            <Text style={[styles.choiceLabel, { color: AXM.bone }]}>FLEE</Text>
                            {fleeSubtitle !== null && (
                                <Text style={styles.choiceSubtitle} testID="encounter-modal-flee-subtitle">
                                    {fleeSubtitle}
                                </Text>
                            )}
                        </View>
                        {fleeDecode !== null && (
                            <Text style={styles.choiceDecode} testID="encounter-modal-flee-decode">
                                {fleeDecode}
                            </Text>
                        )}
                        {!fleeEnabled && fleeSubtitle === null && (
                            <Text style={styles.choiceSub}>
                                {vm.preludeChrome!.fleeDisabledHint}
                            </Text>
                        )}
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    preludeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderBottomWidth: 1,
        borderBottomColor: AXM.divider,
    },
    preludeHeaderText: {
        fontFamily: FONTS.sans,
        fontSize: 10,
        letterSpacing: 2.2,
        color: AXM.blood,
    },
    illustration: {
        height: 200,
        position: 'relative',
        overflow: 'hidden',
        borderBottomWidth: 1,
        borderBottomColor: AXM.divider,
    },
    strifeSash: {
        position: 'absolute',
        top: 0,
        left: 0,
        backgroundColor: AXM.blood,
        paddingTop: 3,
        paddingBottom: 3,
        paddingLeft: 14,
        paddingRight: 18,
    },
    strifeSashText: {
        fontFamily: FONTS.sans,
        fontSize: 10,
        letterSpacing: 1.4,
        color: AXM.bg,
    },
    titleArea: { paddingHorizontal: 14, paddingTop: 10 },
    title: {
        fontFamily: FONTS.gothic,
        fontSize: 24,
        lineHeight: 26,
        letterSpacing: 1,
        color: AXM.parchment,
    },
    titleBoss: {
        fontSize: 30,
        lineHeight: 32,
        textShadowColor: AXM.bloodStrong,
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 0,
    },
    subtitle: {
        fontFamily: FONTS.serifItalic,
        fontSize: 11,
        color: AXM.bone,
        marginTop: 2,
    },
    preludeRoot: { flex: 1 },
    preludeScroll: { flex: 1 },
    preludeScrollPad: { paddingBottom: 4 },
    body: { paddingHorizontal: 14, paddingTop: 6, paddingBottom: 4 },
    bodyText: {
        fontFamily: FONTS.serif,
        fontSize: 12,
        color: AXM.parchment,
        lineHeight: 16,
        fontStyle: 'italic',
    },
    doomLine: {
        fontFamily: FONTS.serifItalic,
        fontStyle: 'italic',
        fontSize: 11,
        color: AXM.bone,
        lineHeight: 15,
        marginTop: 8,
    },
    choices: { padding: 12, gap: 6 },
    choiceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 10,
        paddingVertical: 9,
        backgroundColor: AXM.bg,
        borderWidth: 2,
    },
    choiceLabelRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 6,
    },
    choiceLabel: {
        fontFamily: FONTS.gothic,
        fontSize: 18,
        letterSpacing: 1.5,
    },
    choiceDecode: {
        fontFamily: FONTS.mono,
        fontSize: 8.5,
        color: AXM.parchment,
        letterSpacing: 0.3,
        marginTop: 3,
    },
    choiceSub: {
        fontFamily: FONTS.serifItalic,
        fontSize: 10,
        color: AXM.bone,
        marginTop: 2,
    },
    choiceSubtitle: {
        fontFamily: FONTS.mono,
        fontSize: 8,
        color: AXM.bone,
        letterSpacing: 1.4,
    },
}));