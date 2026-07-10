import React from 'react';
import { Text, View } from 'react-native';

import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';
import { TooltipTarget } from '@/components/tooltip/TooltipTarget';
import type { EquipDelta, SignatureDeltaEntry } from '@mechanics';

/**
 * Character-update delta surface (Phase 133; slimmed to the signet model in
 * Phase 23).
 *
 * Renders **only what changes** when an item is equipped, unequipped, or
 * swapped. After the equipment-signature epic equipment carries only static
 * `statModifiers` and one `grantsSignature`, so the delta is just the net signed
 * **stat** changes plus the **signature** gained / lost. Unchanged values never
 * render; the whole panel is suppressed when `delta.isEmpty`.
 *
 * Polarity doctrine (Phase 137): increases / gains use the **green** (heal)
 * treatment; decreases / losses use the **red** (blood) treatment.
 */

const MODE_EYEBROW: Record<EquipDelta['mode'], string> = {
    equip: 'CHARACTER UPDATES — ON EQUIP',
    unequip: 'CHARACTER UPDATES — ON UNEQUIP',
    swap: 'CHARACTER UPDATES — ON SWAP',
};

export interface EquipDeltaPanelProps {
    itemId: string;
    delta: EquipDelta;
}

export function EquipDeltaPanel({ itemId, delta }: EquipDeltaPanelProps) {
    const styles = useStyles();
    if (delta.isEmpty) return null;

    return (
        <View style={styles.panel} testID={`equip-delta-${itemId}`}>
            <Text style={styles.eyebrow}>{MODE_EYEBROW[delta.mode]}</Text>

            {delta.stats.length > 0 && (
                <View style={styles.statRow} testID={`equip-delta-stats-${itemId}`}>
                    {delta.stats.map((d) => {
                        const positive = d.delta > 0;
                        return (
                            <TooltipTarget
                                key={d.stat}
                                kind="item-stat"
                                id={d.stat}
                                accessibilityLabel={`Explain ${d.stat}`}
                                accessibilityHint="tap to read description"
                                testID={`equip-delta-stat-${itemId}-${d.stat}`}
                            >
                                <View style={[styles.chip, positive ? styles.chipPos : styles.chipNeg]}>
                                    <Text style={[styles.chipText, positive ? styles.chipTextPos : styles.chipTextNeg]}>
                                        {positive ? '+' : ''}{d.delta} {d.stat}
                                    </Text>
                                </View>
                            </TooltipTarget>
                        );
                    })}
                </View>
            )}

            <SignatureRow itemId={itemId} signatures={delta.signatures} />
        </View>
    );
}

/** Phase 19 — signet relic signature swap: the signature gained (green) and/or
 *  lost (red) by this equip change. */
function SignatureRow({
    itemId,
    signatures,
}: {
    itemId: string;
    signatures: EquipDelta['signatures'];
}) {
    const styles = useStyles();
    if (signatures.gained.length === 0 && signatures.lost.length === 0) return null;
    return (
        <View style={styles.sideBlock} testID={`equip-delta-signatures-${itemId}`}>
            <Text style={[styles.sideLabel, styles.sideLabelPos]}>SIGNATURE</Text>
            <View style={styles.tagWrap}>
                {signatures.gained.map((s: SignatureDeltaEntry) => (
                    <Tag key={`sig-gain-${s.id}`} positive text={`grants ${s.name ?? s.id}`} testID={`equip-delta-sig-gained-${itemId}-${s.id}`} />
                ))}
                {signatures.lost.map((s: SignatureDeltaEntry) => (
                    <Tag key={`sig-lost-${s.id}`} positive={false} text={`loses ${s.name ?? s.id}`} testID={`equip-delta-sig-lost-${itemId}-${s.id}`} />
                ))}
            </View>
        </View>
    );
}

function Tag({ positive, text, testID }: { positive: boolean; text: string; testID: string }) {
    const styles = useStyles();
    return (
        <View style={[styles.tag, positive ? styles.tagPos : styles.tagNeg]} testID={testID}>
            <Text style={[styles.tagText, positive ? styles.tagTextPos : styles.tagTextNeg]}>{text}</Text>
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    panel: {
        marginTop: 6,
        padding: 6,
        paddingHorizontal: 8,
        borderLeftWidth: 2,
        borderLeftColor: AXM.heal,
        backgroundColor: AXM.panelBg,
    },
    eyebrow: {
        fontFamily: FONTS.mono,
        fontSize: 8,
        color: AXM.bone,
        letterSpacing: 1.4,
        marginBottom: 4,
    },
    statRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        alignItems: 'center',
    },
    sideBlock: { marginTop: 6 },
    sideLabel: {
        fontFamily: FONTS.mono,
        fontSize: 7,
        letterSpacing: 1.4,
        marginBottom: 3,
    },
    sideLabelPos: { color: AXM.heal },
    tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, alignItems: 'center' },
    chip: { paddingVertical: 1, paddingHorizontal: 4, borderWidth: 1 },
    chipPos: { backgroundColor: AXM.healSubtle, borderColor: AXM.heal },
    chipNeg: { backgroundColor: AXM.bloodSubtle, borderColor: AXM.blood },
    chipText: { fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 0.8 },
    chipTextPos: { color: AXM.heal },
    chipTextNeg: { color: AXM.blood },
    tag: { paddingVertical: 1, paddingHorizontal: 4, borderWidth: 1 },
    tagPos: { backgroundColor: AXM.healSubtle, borderColor: AXM.heal },
    tagNeg: { backgroundColor: AXM.bloodSubtle, borderColor: AXM.blood },
    tagText: { fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 0.6 },
    tagTextPos: { color: AXM.heal },
    tagTextNeg: { color: AXM.blood },
}));
