import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
} from 'react-native-reanimated';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { makeStyles, usePalette } from '@/theme/runtime';
import { Splatter } from '@/components/Splatter';
import type { ExplorationNode, ExplorationEdge } from '@/state/presenters/exploration.engine';

interface MapCanvasProps {
    nodes: readonly ExplorationNode[];
    edges: readonly ExplorationEdge[];
    children: React.ReactNode;
}

// The engine packs node coordinates into a 360×400 space; rendered 1:1
// the nodes overlap and labels collide. We spread them across a larger
// pannable canvas (SPREAD×) so each node has breathing room — the window
// clips to a viewport the user pans/zooms around. (Visual-audit 2026-06.)
const SPREAD = 2.6;
const CANVAS_W = 360 * SPREAD;
const CANVAS_H = 400 * SPREAD;

export function MapCanvas({ nodes, edges, children }: MapCanvasProps) {
    const styles = useStyles();
    const AXM = usePalette();
    const nodeById = React.useMemo(() => {
        const m = new Map<string, ExplorationNode>();
        for (const n of nodes) m.set(n.id, n);
        return m;
    }, [nodes]);

    // Pinch + pan over the map view (Q2=B). Reanimated shared values
    // drive a single transform; gestures compose simultaneously so the
    // user can zoom and drag at once.
    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const tx = useSharedValue(0);
    const ty = useSharedValue(0);
    const savedTx = useSharedValue(0);
    const savedTy = useSharedValue(0);

    // Open the map framed on the nodes the player can actually act on
    // right now — the current position plus its available next steps —
    // rather than the geometric middle of the (much larger) spread
    // canvas. We measure the viewport on layout, then centre once both
    // the viewport and the node set are available.
    const initialized = React.useRef(false);
    const [viewport, setViewport] = React.useState<{ w: number; h: number } | null>(null);
    const onWrapLayout = React.useCallback(
        (e: { nativeEvent: { layout: { width: number; height: number } } }) => {
            const { width, height } = e.nativeEvent.layout;
            if (width === 0) return;
            setViewport((prev) => prev ?? { w: width, h: height });
        },
        [],
    );

    React.useEffect(() => {
        if (initialized.current || !viewport || nodes.length === 0) return;
        // The choosable nodes: where the player stands + the steps they
        // can take from here. Fall back to the canvas centre if (somehow)
        // none are flagged.
        const focus = nodes.filter((n) => n.kind === 'available' || n.kind === 'current');
        let cx: number;
        let cy: number;
        if (focus.length > 0) {
            const ax = focus.reduce((s, n) => s + n.x, 0) / focus.length;
            const ay = focus.reduce((s, n) => s + n.y, 0) / focus.length;
            // Node canvas coords = engine coords × SPREAD; initial scale
            // is 1, so placing the centroid at the viewport centre is a
            // straight translate.
            cx = viewport.w / 2 - ax * SPREAD;
            cy = viewport.h / 2 - ay * SPREAD;
        } else {
            cx = (viewport.w - CANVAS_W) / 2;
            cy = (viewport.h - CANVAS_H) / 2;
        }
        tx.value = cx;
        ty.value = cy;
        savedTx.value = cx;
        savedTy.value = cy;
        initialized.current = true;
    }, [viewport, nodes, tx, ty, savedTx, savedTy]);

    const pinch = Gesture.Pinch()
        .onUpdate((e) => {
            const next = savedScale.value * e.scale;
            scale.value = Math.min(3, Math.max(0.6, next));
        })
        .onEnd(() => {
            savedScale.value = scale.value;
        });

    const pan = Gesture.Pan()
        .onUpdate((e) => {
            tx.value = savedTx.value + e.translationX;
            ty.value = savedTy.value + e.translationY;
        })
        .onEnd(() => {
            savedTx.value = tx.value;
            savedTy.value = ty.value;
        });

    const composed = Gesture.Simultaneous(pinch, pan);

    const mapTransform = useAnimatedStyle(() => ({
        transform: [
            { translateX: tx.value },
            { translateY: ty.value },
            { scale: scale.value },
        ],
    }));

    return (
        <View style={styles.graphWrap} onLayout={onWrapLayout} testID="map-canvas-wrapper">
            <View style={[StyleSheet.absoluteFillObject, styles.graphBackground]} />
            <Splatter color={AXM.blood} size={170} seed={3} style={styles.bloodSplatter} />
            <Splatter color={AXM.sulfur} size={130} seed={9} style={styles.sulfurSplatter} />

            <GestureDetector gesture={composed}>
                <Animated.View style={[styles.canvas, mapTransform]}>
                    {/* SVG edges — drawn across the spread canvas */}
                    <Svg viewBox="0 0 360 400" width={CANVAS_W} height={CANVAS_H} style={StyleSheet.absoluteFillObject}>
                        {edges.map((e) => {
                            const A = nodeById.get(e.fromId);
                            const B = nodeById.get(e.toId);
                            if (!A || !B) return null;
                            // Straight node-to-node paths so the graph reads as
                            // a connected route. A dark casing under the stroke
                            // gives each path a defined "road" edge.
                            const d = `M ${A.x} ${A.y} L ${B.x} ${B.y}`;
                            const color = e.traveled ? AXM.parchment : (e.locked ? AXM.ash : AXM.bone);
                            const w = e.traveled ? 3.5 : (e.locked ? 2 : 2.5);
                            const mx = (A.x + B.x) / 2;
                            const my = (A.y + B.y) / 2;
                            return (
                                <G key={`${e.fromId}|${e.toId}`}>
                                    <Path d={d} stroke={AXM.deepBg} strokeWidth={w + 3} fill="none" opacity={0.95} strokeLinecap="round" />
                                    <Path
                                        d={d}
                                        stroke={color}
                                        strokeWidth={w}
                                        strokeDasharray={e.locked ? '5 5' : undefined}
                                        fill="none"
                                        opacity={e.traveled ? 0.95 : 0.7}
                                        strokeLinecap="round"
                                    />
                                    {e.traveled && <Circle cx={mx} cy={my} r={2.5} fill={AXM.sulfur} />}
                                </G>
                            );
                        })}
                        <G opacity={0.4} stroke={AXM.bone} strokeWidth={1} fill="none">
                            <Path d="M40 250 q 20 -20 40 -10 q 10 12 -10 18 q -22 4 -30 -8 z" />
                            <Path d="M250 280 q 30 -20 60 -5 q 8 18 -20 22 q -38 -2 -40 -17 z" />
                        </G>
                    </Svg>

                    {children}
                </Animated.View>
            </GestureDetector>
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    graphWrap: {
        marginHorizontal: 10,
        marginVertical: 6,
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
    },
    canvas: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: CANVAS_W,
        height: CANVAS_H,
    },
    graphBackground: {
        backgroundColor: AXM.deepBg,
    },
    bloodSplatter: {
        position: 'absolute',
        top: -10,
        right: -10,
        opacity: 0.35,
    },
    sulfurSplatter: {
        position: 'absolute',
        bottom: 30,
        left: -20,
        opacity: 0.18,
    },
}));