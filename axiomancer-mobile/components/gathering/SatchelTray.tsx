/**
 * The satchel tray — four family stacks with set-progress. Everything
 * in it is AT RISK until the player withdraws; the tray is the
 * temptation made visible (one more pull would complete the set…).
 */

import React from 'react';
import { Text, View } from 'react-native';

import type { GatherSatchelFamilyVM } from '@/state/presenters/gathering.engine';
import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';

import { FamilyGlyph } from './glyphs';
import { FAMILY } from './palette';

function FamilyStack({ vm }: { vm: GatherSatchelFamilyVM }) {
    const AXM = usePalette();
    const styles = useStyles();
    const c = FAMILY[vm.family];
    const empty = vm.pieces === 0;
    const progress = Math.min(1, vm.richness / vm.setThreshold);
    return (
        <View
            style={[styles.stack, { borderColor: vm.set ? c.c : AXM.ash, opacity: empty ? 0.45 : 1 }]}
            accessibilityLabel={`${vm.label}: ${vm.pieces} pieces, richness ${vm.richness} of ${vm.setThreshold}${vm.set ? ', set complete' : ''}`}
        >
            <View style={styles.stackTop}>
                <FamilyGlyph kind={c.glyph} size={16} color={c.c} />
                <Text style={[styles.count, { color: empty ? AXM.bone : AXM.parchment }]}>{vm.pieces}</Text>
            </View>
            <Text style={[styles.familyLabel, { color: c.c }]}>{vm.label}</Text>
            <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: c.c }]} />
            </View>
            {vm.set ? (
                <Text style={[styles.setBadge, { backgroundColor: c.c }]}>SET</Text>
            ) : (
                <Text style={styles.progressText}>
                    {vm.richness}/{vm.setThreshold}
                </Text>
            )}
        </View>
    );
}

export function SatchelTray({
    families,
    count,
    richness,
}: {
    families: GatherSatchelFamilyVM[];
    count: number;
    richness: number;
}) {
    const styles = useStyles();
    return (
        <View style={styles.root} testID="gathering-satchel">
            <View style={styles.header}>
                <Text style={styles.title}>THE SATCHEL</Text>
                <Text style={styles.sub}>
                    {count === 0 ? 'empty — and safe that way' : `${count} pieces · ${richness} richness · at risk until you leave`}
                </Text>
            </View>
            <View style={styles.stacks}>
                {families.map((f) => (
                    <FamilyStack key={f.family} vm={f} />
                ))}
            </View>
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    root: { paddingHorizontal: 12, paddingVertical: 6 },
    header: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 5 },
    title: { fontFamily: FONTS.sans, fontSize: 12, letterSpacing: 1.6, color: AXM.parchment, flexShrink: 0, marginRight: 8 },
    sub: { fontFamily: FONTS.mono, fontSize: 11, color: AXM.bone, letterSpacing: 0.4, flexShrink: 1, textAlign: 'right' },
    stacks: { flexDirection: 'row', gap: 6 },
    stack: {
        flex: 1,
        borderWidth: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
        paddingVertical: 5,
        paddingHorizontal: 6,
        alignItems: 'center',
        gap: 2,
    },
    stackTop: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    count: { fontFamily: FONTS.gothic, fontSize: 16, lineHeight: 17 },
    familyLabel: { fontFamily: FONTS.sans, fontSize: 10, letterSpacing: 1 },
    progressTrack: { alignSelf: 'stretch', height: 3, backgroundColor: 'rgba(0,0,0,0.5)', marginTop: 2 },
    progressFill: { height: 3 },
    progressText: { fontFamily: FONTS.mono, fontSize: 10, color: AXM.bone },
    setBadge: {
        fontFamily: FONTS.sans,
        fontSize: 10,
        letterSpacing: 1.4,
        color: '#0c0a08',
        paddingHorizontal: 5,
        paddingVertical: 0.5,
        overflow: 'hidden',
    },
}));
