/**
 * Dev-only Skills + token-bank readout (Master Spec §6.2 — Skills are NOT
 * cards, they are a separate always-available ability system spent from
 * `CombatResources` tokens, triggerable independent of the drawn hand).
 *
 * Unlike the other `Debug*` dev-menu affordances, this panel cannot live in
 * the global `/dev` route: `CombatEncounterState` is local React state owned
 * by `CombatEncounterPanel` (the hazard-pattern engine has no store/economy
 * layer — see that panel's own header comment), unreachable from the
 * `DevToolsSections` tree mounted elsewhere. So this panel is a *presenter*
 * — it takes the live encounter state + a trigger callback as props and is
 * mounted directly inside `CombatEncounterPanel`, gated the same way every
 * other Debug* control is (`isDevToolsEnabled()`), rather than being wired
 * through `DevToolsSections`/`app/dev/index.tsx` like the pre-combat
 * (deck-preset) dev tools. Establishes the "combat-only, not always-visible"
 * dev-panel pattern `DevToolsSections.tsx` doesn't yet have one for.
 *
 * - Token readout: 5 read-only pills (heart/body/mind/fallacy/paradox) off
 *   the live `CombatResources`.
 * - Skill trigger grid: one button per `SKILLS_LIBRARY` entry (ALL of them —
 *   bypasses `getKnownSkills()` gating for dev purposes, mirroring how the
 *   deck presets already bypass `knownSkills`), disabled when unaffordable.
 *   The engine handles once-per-combat/cooldown gating and reports a fizzle.
 * - Wild-die pool: one line, `permanentWildDice`/`permanentDeadDice` off the
 *   live state (Master Spec §4).
 *
 * Renders null in production.
 */

import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import {
    SKILLS_LIBRARY,
    canAffordSkillDefinition,
    type CombatEncounterState,
    type SkillDefinition,
} from '@mechanics';

import { isDevToolsEnabled } from '@/lib/buildProfile';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';

const RESOURCE_ORDER = ['heart', 'body', 'mind', 'fallacy', 'paradox'] as const;

function costLabel(cost: SkillDefinition['cost']): string {
    return Object.entries(cost)
        .filter(([, v]) => (v ?? 0) > 0)
        .map(([k, v]) => `${k[0].toUpperCase()}${v}`)
        .join(' ') || 'free';
}

export interface DebugTokensAndSkillsProps {
    /** The live encounter state (owned by `CombatEncounterPanel`). */
    state: CombatEncounterState;
    /** Trigger a skill by id against the live encounter. */
    onTriggerSkill: (skillId: string) => void;
}

export function DebugTokensAndSkills({ state, onTriggerSkill }: DebugTokensAndSkillsProps) {
    const styles = useStyles();
    const [lastResult, setLastResult] = useState<string | null>(null);

    if (!isDevToolsEnabled()) return null;

    const resources = state.combatResources;
    const wild = state.permanentWildDice ?? 0;
    const dead = state.permanentDeadDice ?? 0;

    const onPress = (def: SkillDefinition) => () => {
        onTriggerSkill(def.id);
        setLastResult(def.name);
    };

    return (
        <View style={styles.panel} testID="debug-tokens-and-skills">
            <Text style={styles.label}>DEBUG · TOKENS &amp; SKILLS</Text>

            <View style={styles.pillRow}>
                {RESOURCE_ORDER.map((r) => (
                    <View key={r} style={styles.pill} testID={`debug-token-pill-${r}`}>
                        <Text style={styles.pillLabel}>{r.toUpperCase()}</Text>
                        <Text style={styles.pillValue}>{resources[r] ?? 0}</Text>
                    </View>
                ))}
            </View>

            <Text style={styles.sub} testID="debug-wild-die-pool">
                WILD DIE POOL: {1 + wild} (base 1 + {wild} permanent{dead > 0 ? ` · ${dead} dead-die cost` : ''})
            </Text>

            <View style={styles.skillGrid}>
                {SKILLS_LIBRARY.map((def) => {
                    const affordable = canAffordSkillDefinition(resources, def.cost);
                    return (
                        <Pressable
                            key={def.id}
                            style={[styles.skillButton, !affordable && styles.skillButtonDisabled]}
                            onPress={onPress(def)}
                            disabled={!affordable}
                            accessibilityRole="button"
                            accessibilityLabel={`Trigger skill: ${def.name}`}
                            testID={`debug-skill-trigger-${def.id}`}
                        >
                            <Text style={styles.skillName} numberOfLines={1}>{def.name}</Text>
                            <Text style={styles.skillCost}>{costLabel(def.cost)}</Text>
                        </Pressable>
                    );
                })}
            </View>

            {lastResult && (
                <Text style={styles.status} testID="debug-skill-last-triggered">
                    last triggered: {lastResult}
                </Text>
            )}
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    panel: {
        marginTop: 8,
        marginHorizontal: 12,
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: AXM.ash,
        borderStyle: 'dashed',
        backgroundColor: AXM.panelBg,
    },
    label: {
        fontFamily: FONTS.mono,
        fontSize: 9,
        letterSpacing: 1.5,
        color: AXM.bone,
    },
    pillRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 6,
    },
    pill: {
        borderWidth: 1,
        borderColor: AXM.ash,
        paddingVertical: 3,
        paddingHorizontal: 6,
        alignItems: 'center',
    },
    pillLabel: { fontFamily: FONTS.mono, fontSize: 8, color: AXM.ash, letterSpacing: 1 },
    pillValue: { fontFamily: FONTS.gothic, fontSize: 13, color: AXM.bone },
    sub: {
        fontFamily: FONTS.mono,
        fontSize: 9,
        color: AXM.parchment,
        marginTop: 6,
    },
    skillGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 8,
    },
    skillButton: {
        width: '48%',
        borderWidth: 1,
        borderColor: AXM.sulfur,
        backgroundColor: AXM.bg,
        paddingVertical: 6,
        paddingHorizontal: 8,
    },
    skillButtonDisabled: {
        borderColor: AXM.ash,
        opacity: 0.5,
    },
    skillName: { fontFamily: FONTS.gothic, fontSize: 11, color: AXM.sulfur, letterSpacing: 0.5 },
    skillCost: { fontFamily: FONTS.mono, fontSize: 8, color: AXM.ash, marginTop: 2 },
    status: {
        fontFamily: FONTS.mono,
        fontSize: 9,
        color: AXM.parchment,
        marginTop: 6,
    },
}));
