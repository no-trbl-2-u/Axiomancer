import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';
import { ActionIcon } from '@/components/ActionIcon';
import type { ExplorationOption, NodeType } from '@/state/presenters/exploration.engine';

const OPTION_ICON: Record<NodeType, string> = {
    rest: 'flame',
    gather: 'bag',
    current: 'eye',
    encounter: 'sword',
    treasure: 'diamond',
    boss: 'crown',
    quest: 'scroll',
    hazard: 'warning',
};

interface OptionRowProps {
    option: ExplorationOption;
    onPress: (option: ExplorationOption) => void;
    leaguesLabel: string;
}

export function OptionRow({ option: opt, onPress, leaguesLabel }: OptionRowProps) {
    const styles = useStyles();
    const AXM = usePalette();
    const accent =
        opt.type === 'encounter' || opt.type === 'boss'
            ? AXM.blood
            : opt.type === 'treasure'
              ? AXM.sulfur
              : AXM.parchment;

    return (
        <TouchableOpacity
            style={[styles.stepCard, { borderLeftColor: accent }]}
            onPress={() => onPress(opt)}
            accessibilityRole="button"
            accessibilityLabel={`Travel to ${opt.label}, ${opt.leagues} leagues away`}
            testID={`option-${opt.nodeId}`}
        >
            <View style={[styles.stepCardIconBox, { borderColor: AXM.bone }]}>
                <ActionIcon
                    kind={OPTION_ICON[opt.type]}
                    size={18}
                    color={accent}
                />
            </View>
            <View style={styles.stepCardMid}>
                <Text style={styles.stepCardTitle} numberOfLines={1}>
                    {opt.label}
                </Text>
                <Text style={styles.stepCardHint} numberOfLines={1}>
                    {opt.description.toUpperCase()}
                </Text>
            </View>
            <View style={styles.stepCardLeagues}>
                <Text style={styles.stepCardLeaguesLabel}>{leaguesLabel}</Text>
                <Text style={styles.stepCardLeaguesNum}>{opt.leagues}</Text>
            </View>
        </TouchableOpacity>
    );
}

const useStyles = makeStyles((AXM) => ({
    stepCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: AXM.panelBg,
        borderWidth: 1,
        borderColor: AXM.divider,
        borderLeftWidth: 2,
    },
    stepCardIconBox: {
        width: 28,
        height: 28,
        borderWidth: 1,
        backgroundColor: AXM.bg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepCardMid: {
        flex: 1,
        minWidth: 0,
    },
    stepCardTitle: {
        fontFamily: FONTS.serif,
        fontSize: 14,
        color: AXM.parchment,
        lineHeight: 16,
    },
    stepCardHint: {
        fontFamily: FONTS.sans,
        fontSize: 9,
        color: AXM.bone,
        letterSpacing: 1.6,
        marginTop: 3,
    },
    stepCardLeagues: {
        alignItems: 'flex-end',
        gap: 2,
    },
    stepCardLeaguesLabel: {
        fontFamily: FONTS.mono,
        fontSize: 9,
        color: AXM.bone,
    },
    stepCardLeaguesNum: {
        fontFamily: FONTS.mono,
        fontSize: 18,
        color: AXM.parchment,
    },
}));