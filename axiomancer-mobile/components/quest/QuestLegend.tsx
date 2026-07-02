/**
 * QuestLegend — the "what the marks mean" key for the board.
 *
 * Lists every space kind present on the current board with its glyph,
 * accent colour, label, and a one-line meaning. Collapsed by default so
 * it never crowds the table; tap the header to unfold. Pure presentation
 * over the space VMs.
 */

import React, { useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import type { QuestSpaceVM } from '@/state/presenters/quest.engine';
import {
    QUEST_SPACE_KIND_BLURBS,
    QUEST_SPACE_KIND_LABELS,
} from '@/state/presenters/quest.engine';
import { questKindAccents } from '@/components/quest/QuestBoardTrack';
import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';

export function QuestLegend({ spaces }: { spaces: readonly QuestSpaceVM[] }) {
    const styles = useStyles();
    const AXM = usePalette();
    const QUEST_KIND_ACCENTS = questKindAccents(AXM);
    const [open, setOpen] = useState(false);

    // Unique kinds in first-seen board order — only mark the spaces in play.
    const entries = useMemo(() => {
        const seen = new Set<string>();
        const out: { kind: string; glyph: string }[] = [];
        for (const s of spaces) {
            if (seen.has(s.kind)) continue;
            seen.add(s.kind);
            out.push({ kind: s.kind, glyph: s.glyph });
        }
        return out;
    }, [spaces]);

    return (
        <View testID="quest-legend">
            <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
                accessibilityLabel="What the marks mean"
                onPress={() => setOpen(o => !o)}
                style={styles.header}
                testID="quest-legend-toggle"
            >
                <Text style={styles.headerLabel}>WHAT THE MARKS MEAN</Text>
                <Text style={styles.chevron}>{open ? '▾' : '▸'}</Text>
            </TouchableOpacity>

            {open && (
                <View style={styles.grid}>
                    {entries.map(e => (
                        <View key={e.kind} style={styles.row} testID={`quest-legend-${e.kind}`}>
                            <Text style={[styles.glyph, { color: QUEST_KIND_ACCENTS[e.kind] ?? AXM.bone }]}>
                                {e.glyph}
                            </Text>
                            <View style={styles.flexOne}>
                                <Text style={styles.label}>
                                    {QUEST_SPACE_KIND_LABELS[e.kind as keyof typeof QUEST_SPACE_KIND_LABELS] ?? e.kind}
                                </Text>
                                <Text style={styles.blurb}>
                                    {QUEST_SPACE_KIND_BLURBS[e.kind as keyof typeof QUEST_SPACE_KIND_BLURBS] ?? ''}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 12,
        marginBottom: 4,
        paddingHorizontal: 6,
    },
    headerLabel: {
        fontFamily: FONTS.sans,
        fontSize: 12,
        letterSpacing: 2.2,
        color: AXM.bone,
    },
    chevron: { fontFamily: FONTS.sans, fontSize: 12, color: AXM.bone },
    grid: {
        gap: 8,
        paddingHorizontal: 6,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: AXM.ash,
        backgroundColor: AXM.panelBg,
    },
    row: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
    glyph: { fontSize: 18, lineHeight: 22, width: 22, textAlign: 'center' },
    label: {
        fontFamily: FONTS.gothic,
        fontSize: 14,
        letterSpacing: 1,
        color: AXM.parchment,
    },
    blurb: { fontFamily: FONTS.mono, fontSize: 11, lineHeight: 15, color: AXM.bone },
    flexOne: { flex: 1 },
}));
