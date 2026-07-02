import React from 'react';
import { Text, View } from 'react-native';

import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';
import { TooltipTarget } from '@/components/tooltip/TooltipTarget';
import type {
    EquipDelta,
    EquipDeltaSide,
    EffectDeltaEntry,
    KeywordDeltaEntry,
    ModifierDeltaEntry,
    ResourceDeltaEntry,
} from 'axiomancer-mechanics';

/**
 * Character-update delta surface (Phase 133; polarity reworked Phase 137).
 *
 * Renders **only what changes** when an item is equipped, unequipped,
 * or swapped: every character-facing value the equipment transition
 * affects — stats, rolled modifiers, passive effects, on-hit /
 * on-defend proc hooks, resource interactions, and keyword / affix
 * labels. Unchanged values never render; empty sections (and the whole
 * panel when `delta.isEmpty`) are suppressed.
 *
 * Polarity doctrine (Phase 137): increases / gained values / new-item
 * passive effects use the **green** (heal) treatment; decreases / lost
 * values / old-item passive effects use the **red** (blood) treatment.
 * Sulfur/gold is no longer used for positive deltas in this panel —
 * green/red is the only signal so a glance reads the net character
 * change unambiguously.
 */

const MODE_EYEBROW: Record<EquipDelta['mode'], string> = {
    equip: 'CHARACTER UPDATES — ON EQUIP',
    unequip: 'CHARACTER UPDATES — ON UNEQUIP',
    swap: 'CHARACTER UPDATES — ON SWAP',
};

function resourceLabel(entry: ResourceDeltaEntry): string {
    const verb = entry.kind === 'start' ? 'start' : entry.kind;
    const sign = entry.amount > 0 ? '+' : '';
    return `${sign}${entry.amount} ${entry.resource} (${verb})`;
}

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

            <SideBlock itemId={itemId} tone="gained" label="GAINED" side={delta.gained} />
            <SideBlock itemId={itemId} tone="lost" label="LOST" side={delta.lost} />
        </View>
    );
}

interface SideBlockProps {
    itemId: string;
    tone: 'gained' | 'lost';
    label: string;
    side: EquipDeltaSide;
}

function SideBlock({ itemId, tone, label, side }: SideBlockProps) {
    const styles = useStyles();
    const hasAny =
        side.modifiers.length > 0 ||
        side.passiveEffects.length > 0 ||
        side.onHitEffects.length > 0 ||
        side.onDefendEffects.length > 0 ||
        side.resources.length > 0 ||
        side.keywords.length > 0;
    if (!hasAny) return null;

    const positive = tone === 'gained';
    return (
        <View style={styles.sideBlock} testID={`equip-delta-${tone}-${itemId}`}>
            <Text style={[styles.sideLabel, positive ? styles.sideLabelPos : styles.sideLabelNeg]}>
                {label}
            </Text>
            <View style={styles.tagWrap}>
                {side.keywords.map((kw: KeywordDeltaEntry) => (
                    <Tag key={kw.key} positive={positive} text={kw.label} testID={`equip-delta-${tone}-kw-${itemId}-${kw.key}`} />
                ))}
                {side.modifiers.map((m: ModifierDeltaEntry) => (
                    <Tag
                        key={m.id}
                        positive={positive}
                        text={modifierText(m)}
                        testID={`equip-delta-${tone}-mod-${itemId}-${m.id}`}
                    />
                ))}
                {side.passiveEffects.map((e: EffectDeltaEntry) => (
                    <EffectTag key={`passive-${e.id}`} positive={positive} entry={e} testID={`equip-delta-${tone}-passive-${itemId}-${e.id}`} />
                ))}
                {side.onHitEffects.map((e: EffectDeltaEntry) => (
                    <EffectTag key={`hit-${e.id}`} positive={positive} entry={e} prefix="on-hit" testID={`equip-delta-${tone}-onhit-${itemId}-${e.id}`} />
                ))}
                {side.onDefendEffects.map((e: EffectDeltaEntry) => (
                    <EffectTag key={`def-${e.id}`} positive={positive} entry={e} prefix="on-defend" testID={`equip-delta-${tone}-ondefend-${itemId}-${e.id}`} />
                ))}
                {side.resources.map((r: ResourceDeltaEntry) => (
                    <Tag key={r.key} positive={positive} text={resourceLabel(r)} testID={`equip-delta-${tone}-resource-${itemId}-${r.key}`} />
                ))}
            </View>
        </View>
    );
}

function modifierText(m: ModifierDeltaEntry): string {
    const name = m.name ?? m.id;
    return m.value === null ? name : `${name} (${m.value})`;
}

function EffectTag({
    positive,
    entry,
    prefix,
    testID,
}: {
    positive: boolean;
    entry: EffectDeltaEntry;
    prefix?: string;
    testID: string;
}) {
    const styles = useStyles();
    const label = entry.name ?? entry.id;
    const text = prefix === undefined ? label : `${prefix}: ${label}`;
    if (entry.name === null) {
        return <Tag positive={positive} text={text} testID={testID} />;
    }
    return (
        <TooltipTarget
            kind="effect"
            id={entry.id}
            accessibilityLabel={`Explain ${entry.name}`}
            accessibilityHint="tap to read description"
            testID={`${testID}-tip`}
        >
            <View style={[styles.tag, positive ? styles.tagPos : styles.tagNeg]} testID={testID}>
                <Text style={[styles.tagText, positive ? styles.tagTextPos : styles.tagTextNeg]}>{text}</Text>
            </View>
        </TooltipTarget>
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
    sideLabelNeg: { color: AXM.blood },
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
