/**
 * The WRATH meter — a segmented bar under the site's opening eye.
 * Threshold notches mark where the place answers; the eye opens wider
 * as the meter fills. Status tags (dusk / mire / watcher / sickle)
 * ride alongside so every active surcharge is visible at a glance.
 */

import React from 'react';
import { Text, View } from 'react-native';

import type { GatherWrathVM } from '@/state/presenters/gathering.engine';
import type { Palette } from '@/theme/palette';
import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';

import { GraceMark, WrathEye } from './glyphs';

export function segmentColor(index: number, vm: GatherWrathVM, AXM: Palette): string {
    if (index >= vm.value) return 'rgba(0,0,0,0.45)';
    const lastThreshold = vm.thresholds.filter((t) => index + 1 >= t.at).length;
    if (lastThreshold >= 2) return AXM.blood;
    if (lastThreshold === 1) return '#8a3a1e';
    return '#5a4a28';
}

export function WrathMeter({
    vm,
    grace,
    graceNote,
}: {
    vm: GatherWrathVM;
    grace: number;
    graceNote: string | null;
}) {
    const AXM = usePalette();
    const styles = useStyles();
    const tags: { id: string; label: string; tone: string }[] = [];
    if (vm.sickled) tags.push({ id: 'sickled', label: 'SICKLED — next taking free', tone: '#86a821' });
    if (vm.mired) tags.push({ id: 'mired', label: 'MIRED — next taking dearer', tone: '#8a57bd' });
    if (vm.watcherWoken) tags.push({ id: 'watcher', label: 'THE WARDEN WATCHES', tone: AXM.blood });
    if (vm.duskFallen) tags.push({ id: 'dusk', label: 'DUSK', tone: AXM.sulfur });

    return (
        <View style={styles.root} testID="gathering-wrath">
            <View style={styles.row}>
                <View style={styles.eyeBox}>
                    <WrathEye open={vm.ratio} size={26} color={vm.ratio > 0.6 ? AXM.blood : '#8a5a4a'} />
                </View>
                <View style={{ flex: 1 }}>
                    <View style={styles.labelRow}>
                        <Text style={styles.label}>
                            WRATH <Text style={[styles.value, { color: vm.ratio > 0.6 ? AXM.blood : AXM.parchment }]}>{vm.value}</Text>
                            <Text style={styles.max}> / {vm.max}</Text>
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <GraceMark size={13} color={grace > 0 ? AXM.sulfur : AXM.ash} />
                            <Text style={[styles.graceValue, { color: grace > 0 ? AXM.sulfur : AXM.bone }]}>
                                {grace}
                            </Text>
                        </View>
                    </View>
                    <View
                        style={styles.bar}
                        accessibilityLabel={`Wrath ${vm.value} of ${vm.max}${vm.duskFallen ? ', dusk has fallen' : ''}`}
                    >
                        {Array.from({ length: vm.max }, (_, i) => {
                            const notch = vm.thresholds.find((t) => t.at === i + 1);
                            return (
                                <View key={i} style={styles.segmentSlot}>
                                    <View style={[styles.segment, { backgroundColor: segmentColor(i, vm, AXM) }]} />
                                    {notch && (
                                        <View
                                            style={[
                                                styles.notch,
                                                { backgroundColor: notch.fired ? AXM.ash : AXM.blood },
                                            ]}
                                        />
                                    )}
                                </View>
                            );
                        })}
                    </View>
                </View>
            </View>
            {(tags.length > 0 || graceNote !== null) && (
                <View style={styles.tagRow}>
                    {tags.map((tag) => (
                        <Text key={tag.id} style={[styles.tag, { color: tag.tone, borderColor: tag.tone }]}>
                            {tag.label}
                        </Text>
                    ))}
                    {graceNote !== null && <Text style={styles.graceNote}>{graceNote}</Text>}
                </View>
            )}
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    root: { paddingHorizontal: 12, paddingVertical: 6 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    eyeBox: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: AXM.ash,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 },
    label: { fontFamily: FONTS.sans, fontSize: 12, letterSpacing: 1.6, color: AXM.bone },
    value: { fontFamily: FONTS.gothic, fontSize: 14 },
    max: { fontFamily: FONTS.mono, fontSize: 12, color: AXM.bone },
    graceValue: { fontFamily: FONTS.gothic, fontSize: 13 },
    bar: { flexDirection: 'row', gap: 2 },
    segmentSlot: { flex: 1, height: 10, justifyContent: 'center' },
    segment: { height: 10, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.6)' },
    notch: { position: 'absolute', left: -1.5, top: -2, width: 2, height: 14 },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 5, alignItems: 'center' },
    tag: {
        fontFamily: FONTS.sans,
        fontSize: 11,
        letterSpacing: 1,
        borderWidth: 1,
        paddingHorizontal: 5,
        paddingVertical: 1,
    },
    graceNote: { fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 0.5, color: AXM.sulfur },
}));
