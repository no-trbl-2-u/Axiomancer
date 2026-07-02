/**
 * The Gleaning board — the full-screen foraging surface. Top to
 * bottom: site strip, stratum ribbon, the WRATH meter, rolled boons,
 * the face-up spread (tap a plot to read it; TAKE/TEND from the card
 * or the detail view), offerings and field tools, the satchel tray,
 * and the two ways out — DESCEND and WITHDRAW.
 *
 * Pure presentational: rules live in the engine, numbers on the VM.
 */

import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import type {
    GatherBoonVM,
    GatherOfferingVM,
    GatherPlotVM,
    GatherToolVM,
    GatheringViewModel,
} from '@/state/presenters/gathering.engine';
import type { GatherToolId } from 'axiomancer-mechanics';
import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';

import { GraceMark, Roots, ToolGlyph } from './glyphs';
import { PlotCard } from './PlotCard';
import { SatchelTray } from './SatchelTray';
import { WrathMeter } from './WrathMeter';

// ---------------------------------------------------------------------------
// Small parts
// ---------------------------------------------------------------------------

function DepthRibbon({ vm }: { vm: GatheringViewModel }) {
    const AXM = usePalette();
    const styles = useStyles();
    return (
        <View style={styles.depthRow}>
            {vm.depthNames.map((name, i) => {
                const here = i === vm.depthIndex;
                const past = i < vm.depthIndex;
                return (
                    <View
                        key={name}
                        style={[
                            styles.depthCell,
                            here && styles.depthCellHere,
                            past && { opacity: 0.4 },
                        ]}
                    >
                        <Text style={[styles.depthCellText, here && { color: AXM.parchment }]}>
                            {past ? '✕ ' : here ? '◆ ' : '· '}
                            {name}
                        </Text>
                    </View>
                );
            })}
        </View>
    );
}

function BoonChip({ boon }: { boon: GatherBoonVM }) {
    const AXM = usePalette();
    const styles = useStyles();
    const tone =
        boon.status === 'done' ? '#86a821' : boon.status === 'failed' ? AXM.ash : AXM.bone;
    return (
        <View style={[styles.boonChip, { borderColor: tone, opacity: boon.status === 'failed' ? 0.55 : 1 }]}>
            <Text style={[styles.boonMark, { color: tone }]}>
                {boon.status === 'done' ? '✓' : boon.status === 'failed' ? '✕' : '◇'}
            </Text>
            <View style={{ flexShrink: 1 }}>
                <Text style={[styles.boonName, { color: tone }]} numberOfLines={1}>
                    {boon.name} <Text style={styles.boonReward}>{boon.rewardLabel}</Text>
                </Text>
                <Text style={styles.boonDesc} numberOfLines={1}>
                    {boon.desc}
                </Text>
            </View>
        </View>
    );
}

function OfferingChip({
    offering,
    onPay,
}: {
    offering: GatherOfferingVM;
    onPay: (id: string) => void;
}) {
    const AXM = usePalette();
    const styles = useStyles();
    const disabled = offering.paid || !offering.payable;
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={
                offering.paid
                    ? `${offering.name}, paid`
                    : `${offering.name}, pay ${offering.demandLabel}`
            }
            testID={`gathering-offering-${offering.id}`}
            disabled={disabled}
            onPress={() => onPay(offering.id)}
            style={[
                styles.offeringChip,
                {
                    borderColor: offering.paid ? '#86a821' : disabled ? AXM.ash : AXM.sulfur,
                    opacity: !offering.paid && disabled ? 0.5 : 1,
                },
            ]}
        >
            <GraceMark size={13} color={offering.paid ? '#86a821' : AXM.sulfur} />
            <View style={{ flexShrink: 1 }}>
                <Text style={[styles.offeringName, offering.paid && { color: '#86a821' }]} numberOfLines={1}>
                    {offering.name}
                </Text>
                <Text style={styles.offeringDemand} numberOfLines={1}>
                    {offering.paid ? 'paid — the place eases' : offering.demandLabel}
                </Text>
            </View>
        </Pressable>
    );
}

function ToolChip({ tool, onUse }: { tool: GatherToolVM; onUse: (id: GatherToolId) => void }) {
    const AXM = usePalette();
    const styles = useStyles();
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={tool.used ? `${tool.name}, spent` : `${tool.name}: ${tool.desc}`}
            testID={`gathering-tool-${tool.id}`}
            disabled={tool.used}
            onPress={() => onUse(tool.id)}
            style={[styles.toolChip, { borderColor: tool.used ? AXM.ash : '#5b86c4', opacity: tool.used ? 0.45 : 1 }]}
        >
            <ToolGlyph kind={tool.id} size={16} color={tool.used ? AXM.bone : '#8fb0dd'} />
            <View style={{ flexShrink: 1 }}>
                <Text style={[styles.toolName, tool.used && { color: AXM.bone }]} numberOfLines={1}>
                    {tool.name}
                </Text>
                <Text style={styles.toolDesc} numberOfLines={1}>
                    {tool.used ? 'spent' : tool.desc}
                </Text>
            </View>
        </Pressable>
    );
}

// ---------------------------------------------------------------------------
// The board
// ---------------------------------------------------------------------------

export function GatheringBoard({
    vm,
    onHarvest,
    onInspect,
    onDescend,
    onPayOffering,
    onUseTool,
    onWithdraw,
}: {
    vm: GatheringViewModel;
    onHarvest: (uid: string) => void;
    onInspect: (plot: GatherPlotVM) => void;
    onDescend: () => void;
    onPayOffering: (id: string) => void;
    onUseTool: (id: GatherToolId) => void;
    onWithdraw: () => void;
}) {
    const styles = useStyles();
    return (
        <View style={styles.root} testID="gathering-board">
            {/* top strip */}
            <View style={styles.topStrip}>
                <Text style={styles.topStripSide}>❧ GATHERING</Text>
                <Text style={styles.topStripMid}>{vm.approachLabel}</Text>
                <Text style={styles.topStripSide}>TAKINGS {vm.turn}</Text>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 8 }}>
                {/* scene strip */}
                <View style={styles.scene}>
                    <Roots seed={3} opacity={0.35} />
                    <Text style={styles.headline}>{vm.boardHeadline}</Text>
                    <Text style={styles.boardNote}>— {vm.boardNote}</Text>
                    <DepthRibbon vm={vm} />
                    <View style={styles.sceneFooter}>
                        <Text style={styles.bagCount}>
                            {vm.bagCount > 0
                                ? `${vm.bagCount} plots left in ${vm.depthName.toLowerCase()}`
                                : `${vm.depthName.toLowerCase()} is picked clean`}
                        </Text>
                        {vm.duskNote !== null && <Text style={styles.duskNote}>{vm.duskNote}</Text>}
                    </View>
                </View>

                <WrathMeter vm={vm.wrath} grace={vm.grace} graceNote={vm.graceNote} />

                {/* boons */}
                <View style={styles.boonsRow}>
                    {vm.boons.map((b) => (
                        <BoonChip key={b.id} boon={b} />
                    ))}
                </View>

                {/* the spread */}
                <Text style={styles.sectionLabel}>THE SPREAD — WHAT THE PLACE SHOWS YOU</Text>
                <View style={styles.spreadRow} testID="gathering-spread">
                    {vm.spread.length === 0 ? (
                        <Text style={styles.emptySpread}>
                            nothing left on offer — descend, or take your leave
                        </Text>
                    ) : (
                        vm.spread.map((plot, i) => (
                            <Animated.View key={plot.uid} entering={FadeInDown.delay(i * 60).duration(220)}>
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel={plot.accessibilityLabel}
                                    testID={`gathering-plot-${plot.uid}`}
                                    onPress={() => onInspect(plot)}
                                >
                                    <PlotCard plot={plot} mode="spread" />
                                </Pressable>
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel={plot.isBreath ? `Tend ${plot.name}` : `Take ${plot.name}`}
                                    testID={`gathering-take-${plot.uid}`}
                                    onPress={() => onHarvest(plot.uid)}
                                    style={[styles.takeButton, plot.isBreath && { borderColor: '#5b86c4' }]}
                                >
                                    <Text style={[styles.takeButtonText, plot.isBreath && { color: '#8fb0dd' }]}>
                                        {plot.isBreath ? 'TEND' : 'TAKE'}
                                    </Text>
                                </Pressable>
                            </Animated.View>
                        ))
                    )}
                </View>

                {/* offerings + tools */}
                {(vm.offerings.length > 0 || vm.tools.length > 0) && (
                    <View style={styles.aidsRow}>
                        <View style={{ flex: 1, gap: 5 }}>
                            <Text style={styles.aidsLabel}>OFFERINGS</Text>
                            {vm.offerings.map((o) => (
                                <OfferingChip key={o.id} offering={o} onPay={onPayOffering} />
                            ))}
                        </View>
                        <View style={{ flex: 1, gap: 5 }}>
                            <Text style={styles.aidsLabel}>FIELD TOOLS</Text>
                            {vm.tools.map((t) => (
                                <ToolChip key={t.id} tool={t} onUse={onUseTool} />
                            ))}
                        </View>
                    </View>
                )}

                <SatchelTray
                    families={vm.satchelFamilies}
                    count={vm.satchelCount}
                    richness={vm.satchelRichness}
                />
            </ScrollView>

            {/* the two ways out */}
            <Animated.View entering={FadeIn.duration(220)} style={styles.ctaRow}>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                        vm.canDescend ? `Descend to ${vm.depthNames[vm.depthIndex + 1]}` : 'At the root — no deeper'
                    }
                    testID="gathering-descend"
                    disabled={!vm.canDescend}
                    onPress={onDescend}
                    style={[styles.cta, styles.descendCta, !vm.canDescend && { opacity: 0.4 }]}
                >
                    <Text style={styles.descendText}>DESCEND ▾</Text>
                    <Text style={styles.ctaSub}>
                        {vm.canDescend ? vm.depthNames[vm.depthIndex + 1] : 'NO DEEPER'}
                    </Text>
                </Pressable>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Withdraw. ${vm.withdrawSubLabel}`}
                    testID="gathering-withdraw"
                    disabled={!vm.withdrawEnabled}
                    onPress={onWithdraw}
                    style={[styles.cta, styles.withdrawCta]}
                >
                    <Text style={styles.withdrawText}>{vm.withdrawLabel} ›</Text>
                    <Text style={styles.ctaSub}>{vm.withdrawSubLabel}</Text>
                </Pressable>
            </Animated.View>
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    root: { flex: 1, backgroundColor: '#0b0c08' },
    topStrip: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 5,
        paddingHorizontal: 12,
        backgroundColor: '#000',
        borderBottomWidth: 1,
        borderBottomColor: AXM.ash,
    },
    topStripSide: { fontFamily: FONTS.mono, fontSize: 11, color: '#86a821', letterSpacing: 2 },
    topStripMid: { fontFamily: FONTS.mono, fontSize: 11, color: AXM.bone, letterSpacing: 2 },
    scene: {
        paddingHorizontal: 14,
        paddingTop: 10,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: AXM.ash,
        overflow: 'hidden',
    },
    headline: { fontFamily: FONTS.gothic, fontSize: 19, lineHeight: 21, color: AXM.parchment, letterSpacing: 0.4 },
    boardNote: { fontFamily: FONTS.serifItalic, fontStyle: 'italic', fontSize: 13, color: AXM.bone, marginTop: 2 },
    depthRow: { flexDirection: 'row', gap: 4, marginTop: 8 },
    depthCell: {
        flex: 1,
        borderWidth: 1,
        borderColor: AXM.ash,
        paddingVertical: 3,
        paddingHorizontal: 5,
        backgroundColor: 'rgba(0,0,0,0.35)',
    },
    depthCellHere: { borderColor: '#86a821', backgroundColor: 'rgba(134,168,33,0.1)' },
    depthCellText: { fontFamily: FONTS.sans, fontSize: 10, letterSpacing: 0.8, color: AXM.bone },
    sceneFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5, alignItems: 'baseline' },
    bagCount: { fontFamily: FONTS.mono, fontSize: 11, color: AXM.bone, letterSpacing: 0.4 },
    duskNote: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 1, color: AXM.sulfur },
    boonsRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingVertical: 4 },
    boonChip: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderWidth: 1,
        paddingHorizontal: 7,
        paddingVertical: 4,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    boonMark: { fontFamily: FONTS.gothic, fontSize: 14 },
    boonName: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 0.8 },
    boonReward: { fontFamily: FONTS.mono, fontSize: 10, color: AXM.bone, letterSpacing: 0 },
    boonDesc: { fontFamily: FONTS.serif, fontSize: 12, color: AXM.bone },
    sectionLabel: {
        fontFamily: FONTS.sans,
        fontSize: 12,
        letterSpacing: 1.6,
        color: AXM.bone,
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 6,
    },
    spreadRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-start',
        gap: 10,
        paddingHorizontal: 8,
        minHeight: 150,
        flexWrap: 'wrap',
    },
    emptySpread: {
        fontFamily: FONTS.serifItalic,
        fontStyle: 'italic',
        fontSize: 14,
        color: AXM.bone,
        textAlign: 'center',
        paddingVertical: 40,
    },
    takeButton: {
        marginTop: 4,
        borderWidth: 1.5,
        borderColor: '#86a821',
        paddingVertical: 4,
        alignItems: 'center',
        backgroundColor: 'rgba(134,168,33,0.08)',
    },
    takeButtonText: { fontFamily: FONTS.gothic, fontSize: 14, letterSpacing: 2, color: '#86a821' },
    aidsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, marginTop: 10 },
    aidsLabel: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 1.6, color: AXM.bone },
    offeringChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderWidth: 1,
        paddingHorizontal: 7,
        paddingVertical: 5,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    offeringName: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 0.8, color: AXM.parchment },
    offeringDemand: { fontFamily: FONTS.mono, fontSize: 11, color: AXM.bone },
    toolChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderWidth: 1,
        paddingHorizontal: 7,
        paddingVertical: 5,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    toolName: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 0.8, color: AXM.parchment },
    toolDesc: { fontFamily: FONTS.mono, fontSize: 11, color: AXM.bone },
    ctaRow: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 9,
        borderTopWidth: 1,
        borderTopColor: AXM.ash,
        backgroundColor: '#0a0a07',
    },
    cta: { flex: 1, alignItems: 'center', paddingVertical: 8, borderWidth: 2 },
    descendCta: { borderColor: AXM.ash, backgroundColor: 'rgba(0,0,0,0.4)' },
    descendText: { fontFamily: FONTS.gothic, fontSize: 15, letterSpacing: 1.5, color: AXM.bone },
    withdrawCta: { borderColor: AXM.parchment, backgroundColor: AXM.bg },
    withdrawText: { fontFamily: FONTS.gothic, fontSize: 15, letterSpacing: 1.5, color: AXM.parchment },
    ctaSub: { fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1, color: AXM.bone, marginTop: 1 },
}));
