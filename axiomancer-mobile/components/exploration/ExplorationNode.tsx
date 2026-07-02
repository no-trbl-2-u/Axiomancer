import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';
import { NodeMark } from '@/components/NodeMark';
import { ActionIcon } from '@/components/ActionIcon';
import { useTooltip } from '@/hooks/useTooltip';
import {
    ACTION_ICON_BY_TYPE,
    type ExplorationNode as ExplorationNodeType,
    type NodeType,
} from '@/state/presenters/exploration.engine';

interface ExplorationNodeProps {
    node: ExplorationNodeType;
    onNodePress: (n: ExplorationNodeType) => void;
    /** True for the node the player has tapped but not yet confirmed. */
    isSelected: boolean;
}

/**
 * ExplorationNode — per-node touch target on the exploration map.
 *
 * Single-tap commits movement (existing onNodePress behaviour);
 * long-press fires the kind:'map-node' tooltip (Phase 74 follow-up
 * walkthrough — Exploration Tick 1). Mirrors the Phase 75
 * skill-row pattern: tap is reserved for the action, long-press
 * for the explanation. Extracted from the parent's map() body so
 * each node owns its own measure ref.
 */
// Visual-audit 2026-06: larger, more-defined nodes. The wrap is centred
// exactly on (n.x, n.y) via a percentage position + a half-node negative
// margin (px), so centring is correct regardless of the canvas size the
// map is spread across (see MapCanvas SPREAD).
const NODE_SIZE = 44;

export function ExplorationNode({ node: n, onNodePress, isSelected }: ExplorationNodeProps) {
    const styles = useStyles();
    const AXM = usePalette();
    const EVENT_COLOR: Record<NodeType, string> = {
        encounter: AXM.blood,
        treasure: AXM.sulfur,
        boss: AXM.blood,
        quest: AXM.sulfur,
        rest: AXM.rust,
        gather: AXM.bone,
        current: AXM.sulfur,
        hazard: AXM.rust,
    };
    const tooltip = useTooltip();
    const ref = useRef<View | null>(null);
    const color = EVENT_COLOR[n.type] ?? EVENT_COLOR.encounter;

    // Pulse glow for available (tappable) nodes so new players see they're interactive.
    const pulseOpacity = useSharedValue(1);
    useEffect(() => {
        if (n.kind === 'available') {
            pulseOpacity.value = withRepeat(
                withSequence(
                    withTiming(0.45, { duration: 900 }),
                    withTiming(1, { duration: 900 }),
                ),
                -1,
                false,
            );
        } else {
            pulseOpacity.value = 1;
        }
    }, [n.kind, pulseOpacity]);
    const pulseStyle = useAnimatedStyle(() => ({ opacity: pulseOpacity.value }));
    const iconKey = ACTION_ICON_BY_TYPE[n.type] ?? 'sword';
    const left = (n.x / 360) * 100;
    const top = (n.y / 400) * 100;
    const dim = n.kind === 'locked';
    // Adjacent (reachable) nodes show a kind glyph so the player can see what
    // each one is before choosing it.
    const showKindIcon = n.kind === 'available' || n.kind === 'current';

    return (
        <TouchableOpacity
            ref={ref}
            accessibilityRole="button"
            accessibilityLabel={`${n.label}, ${
                n.kind === 'locked' ? 'sealed'
                    : n.kind === 'completed' ? 'walked'
                        : n.kind === 'current' ? 'here'
                            : `open, ${n.type}`
            }`}
            accessibilityHint="hold to read node type description"
            accessibilityState={{ disabled: n.kind !== 'available', selected: isSelected }}
            onPress={() => onNodePress(n)}
            onLongPress={() => tooltip.show({ kind: 'map-node', id: n.type, anchorRef: ref })}
            activeOpacity={n.kind === 'available' ? 0.7 : 1}
            testID={`node-${n.id}`}
            style={[
                styles.nodeWrap,
                { left: `${left}%` as unknown as number, top: `${top}%` as unknown as number },
                dim && styles.nodeWrapLocked,
            ]}
        >
            <Animated.View style={[styles.glyphWrap, isSelected && { borderColor: AXM.sulfur, borderWidth: 2 }, n.kind === 'available' && pulseStyle]}>
                <NodeMark kind={n.kind} size={NODE_SIZE} />
                {showKindIcon && (
                    <View style={styles.kindIcon} pointerEvents="none">
                        <ActionIcon kind={iconKey} size={18} color={color} />
                    </View>
                )}
            </Animated.View>
            {isSelected && (
                <View style={[styles.nodeLabel, { backgroundColor: AXM.nodeBg }]}>
                    <Text style={[styles.nodeLabelText, { color: AXM.parchment }]}>
                        {n.label}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

const useStyles = makeStyles((AXM) => ({
    nodeWrap: {
        position: 'absolute',
        width: NODE_SIZE,
        // Pull back half a node so the glyph sits centred on (n.x, n.y).
        marginLeft: -NODE_SIZE / 2,
        marginTop: -NODE_SIZE / 2,
        alignItems: 'center',
        zIndex: 3,
    },
    nodeWrapLocked: {
        opacity: 0.45,
    },
    glyphWrap: {
        width: NODE_SIZE,
        height: NODE_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: NODE_SIZE / 2,
        borderColor: 'transparent',
    },
    kindIcon: {
        ...({ position: 'absolute' } as const),
        alignItems: 'center',
        justifyContent: 'center',
    },
    nodeLabel: {
        marginTop: 2,
        paddingHorizontal: 4,
        paddingVertical: 1,
        backgroundColor: AXM.nodeBg,
    },
    nodeLabelText: {
        fontFamily: FONTS.sans,
        fontSize: 9,
        letterSpacing: 1.4,
        textTransform: 'uppercase',
    },
}));