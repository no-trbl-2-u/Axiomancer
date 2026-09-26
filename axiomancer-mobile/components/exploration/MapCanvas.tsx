import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
} from 'react-native-reanimated';
import Svg, { Path, Circle, G, Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { Image } from '@/lib/platform/image';
import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';
import { Splatter } from '@/components/Splatter';
import type { ExplorationNode, ExplorationEdge } from '@/state/presenters/exploration.engine';
import type { MapSheet } from '@/state/exploration-maps';
import { LEGACY_SHEET_SIZE } from '@/state/exploration-maps/sheet';
import { MapSheetContext, type SheetSize } from './mapSheetContext';

interface MapCanvasProps {
    nodes: readonly ExplorationNode[];
    edges: readonly ExplorationEdge[];
    /**
     * The map's sheet: canvas size, scale, plate and plate opacity (map revamp
     * M2). Omitted, the canvas uses the legacy 360×400 ×2.6 size with no plate.
     */
    sheet?: MapSheet | null;
    /**
     * Viewport-fixed chart furniture (legend, compass copy, sheet label) —
     * rendered as a sibling of the vignette/compass SVGs, NOT inside the
     * pannable canvas, so absolute positions resolve against the visible
     * viewport instead of the 936×1040 spread canvas (CRITIQUE pass 20:
     * the legend clipped to a bare "25" on desktop when it panned with
     * the map).
     */
    overlays?: React.ReactNode;
    children: React.ReactNode;
}

// Node coordinates live on the map's sheet (`MapSheet`), rendered `scale`x
// into a larger pannable canvas so each node has breathing room — the window
// clips to a viewport the user pans/zooms around. (Visual-audit 2026-06; the
// one global SPREAD became a per-sheet scale in map revamp M2.)

/** The canvas size in device px for a sheet at 1x zoom. */
export function canvasSizeOf(size: SheetSize): { w: number; h: number } {
    return { w: size.width * size.scale, h: size.height * size.scale };
}

const MIN_SCALE = 0.6;
const MAX_SCALE = 3;

// CRITIQUE.md [MED] "open map nodes just off-screen no-op silently on tap"
// (pass, 2026-08-29): the prior initial-camera effect centred on the focus
// nodes' centroid at a fixed scale of 1, so a wide branch (several
// simultaneously-open nodes spread further apart than the viewport) still
// left the outermost ones off-screen the moment the map opened. This fits
// the whole focus bounding box in frame instead, zooming out (never in —
// a lone node shouldn't get punched in past 1x) just enough that every
// currently-open node starts visible.
const FIT_PADDING = 40;

/**
 * The identity of the camera's SUBJECT — where the player stands, plus the
 * steps open from there — as a stable string.
 *
 * Exported for unit coverage. This function is the whole safety argument for
 * re-fitting the camera, so it is pinned directly rather than inferred from a
 * rendered transform.
 *
 * Two findings meet here and pull in opposite directions:
 *
 *   - PLAYTEST_BUGS_2026-09-18 BUG-04: the camera fitted once at mount and
 *     never again, so after the player moved, their onward choices could sit
 *     entirely off-screen. Measured at the Crossing on a 414px viewport, two of
 *     three onward paths were off opposite edges and 19 of 25 nodes were out of
 *     frame. The camera therefore MUST re-fit when the road ahead changes.
 *   - `plan/CRITIQUE.md`'s RESOLVED row at :2140 ("the map recenters against
 *     manual panning", commit 6fe4e47c, issue #294): the camera MUST NOT fight
 *     a player panning to look around.
 *
 * Keying the re-fit on this value satisfies both structurally instead of by
 * heuristic. Panning changes neither where the player stands nor what is open
 * to them, so it cannot produce a key change and therefore cannot produce a
 * re-fit — no "has the user panned?" flag, and no window in which the camera
 * could snap back mid-gesture. The camera moves only at moments the player
 * themselves changed the map's subject.
 *
 * `completed` and `locked` nodes are deliberately NOT part of the key: they are
 * not the camera's subject, and folding them in would re-fit the view for
 * changes the player did not make to their own position or options.
 *
 * @param nodes - the exploration nodes as the presenter built them.
 * @returns a key that is equal for any two node arrays describing the same
 *   position and the same set of open steps, regardless of array identity or
 *   ordering.
 */
export function focusKeyOf(nodes: readonly ExplorationNode[]): string {
    const current = nodes.find((n) => n.kind === 'current')?.id ?? '';
    // Sorted so a reordering of the same options is NOT a change.
    const open = nodes.filter((n) => n.kind === 'available').map((n) => n.id).sort();
    return `${current}|${open.join(',')}`;
}

interface FocusTransform { scale: number; tx: number; ty: number; }

/** Exported for unit coverage — the pure math behind the initial camera fit. */
export function computeFocusTransform(
    nodes: readonly ExplorationNode[],
    viewport: { w: number; h: number },
    size: SheetSize = LEGACY_SHEET_SIZE,
): FocusTransform {
    const focus = nodes.filter((n) => n.kind === 'available' || n.kind === 'current');
    if (focus.length === 0) {
        const canvas = canvasSizeOf(size);
        return { scale: 1, tx: (viewport.w - canvas.w) / 2, ty: (viewport.h - canvas.h) / 2 };
    }

    const xs = focus.map((n) => n.x * size.scale);
    const ys = focus.map((n) => n.y * size.scale);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const bboxW = maxX - minX;
    const bboxH = maxY - minY;
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    const fitScaleX = bboxW > 0 ? (viewport.w - FIT_PADDING * 2) / bboxW : MAX_SCALE;
    const fitScaleY = bboxH > 0 ? (viewport.h - FIT_PADDING * 2) / bboxH : MAX_SCALE;
    const scale = Math.max(MIN_SCALE, Math.min(1, fitScaleX, fitScaleY));

    return { scale, tx: viewport.w / 2 - cx * scale, ty: viewport.h / 2 - cy * scale };
}

/** How one edge is inked. Exported with `edgeStroke` for unit coverage. */
export interface EdgeStroke {
    color: string;
    width: number;
    opacity: number;
    /** SVG dash pattern, or `undefined` for a solid line. */
    dash: string | undefined;
    /** Whether the dark "road casing" is drawn under the stroke. */
    casing: boolean;
}

/** The palette tokens `edgeStroke` reads. Narrowed so the function stays pure. */
interface EdgePalette { parchment: string; ash: string; bone: string; }

/**
 * The ink for one edge — the whole of how the chart tells its road types
 * apart, as a pure function so it can be asserted without reading SVG.
 *
 * ── owner finding 9 / D1, 2026-09-21: RIBS ARE NOT ROADS ──
 *
 * D1 landed 69 LATERAL LANE RIBS across the seven maps — sideways steps
 * between neighbouring lanes of the same column. They are traversal, not
 * progression: the engine's own route audits walk the forward skeleton and
 * deliberately ignore them (`forwardEdges()` in `world.reducer.ts`).
 *
 * Inked at the same weight as the forward roads, they very nearly undo the
 * thing they were added for. A column of five lanes gains four ribs, the fan
 * out of the gate before it already draws five diagonals, and the chart
 * becomes an even mesh in which the spine the player is progressing along is
 * no longer findable — "branching" read as "tangled". So a rib is drawn at
 * half the weight, without the dark casing that makes a road read as a road,
 * and finely dashed. The hierarchy on the page then matches the hierarchy in
 * the rules: solid, cased lines carry you forward; hairlines let you step
 * across.
 *
 * The three progression states keep their existing separation, and it is not
 * hue-only either: travelled is the widest and solid, open is mid-weight and
 * solid, sealed is thin and coarsely dashed.
 */
export function edgeStroke(e: ExplorationEdge, AXM: EdgePalette): EdgeStroke {
    const color = e.traveled ? AXM.parchment : (e.locked ? AXM.ash : AXM.bone);
    const baseWidth = e.traveled ? 3.5 : (e.locked ? 2 : 2.5);
    const baseOpacity = e.traveled ? 0.95 : 0.7;
    if (e.lateral) {
        return {
            color,
            width: baseWidth * 0.5,
            opacity: baseOpacity * 0.55,
            dash: '2 4',
            casing: false,
        };
    }
    return {
        color,
        width: baseWidth,
        opacity: baseOpacity,
        dash: e.locked ? '5 5' : undefined,
        casing: true,
    };
}

// Phase V1/V2 (the Woodcut Codex) — the map reads as a chart, not a
// void: a faint diagonal hatch over the whole sheet (the handoff's
// `.axm-hatch` texture, redrawn as strokes so no Pattern support is
// needed), cartographic contour "hills" in the dead zones, a
// viewport-fixed compass rose, and an edge vignette. All tokenized;
// swapped for real backdrop art at Phase V5 (procedural stays as the
// fallback).
const HATCH_STEP = 18;

/**
 * 45° hatch lines across a sheet: sweep the x-intercept from -height (a line
 * entering from the left edge) to width. On the legacy 360×400 sheet this is
 * the original fixed set.
 */
export function hatchLines(width: number, height: number): string[] {
    const lines: string[] = [];
    for (let x0 = -height; x0 <= width; x0 += HATCH_STEP) {
        lines.push(`M ${x0} 0 L ${x0 + height} ${height}`);
    }
    return lines;
}

/** Nested contour rings — hand-authored cartographic hills, on the legacy 360×400 sheet. */
const CONTOUR_GROUPS: readonly string[][] = [
    [
        'M40 250 q 20 -22 44 -10 q 12 14 -10 20 q -26 4 -34 -10 z',
        'M50 252 q 14 -14 28 -6 q 8 9 -7 13 q -16 3 -21 -7 z',
    ],
    [
        'M250 280 q 30 -22 62 -6 q 10 20 -20 24 q -40 -2 -42 -18 z',
        'M262 282 q 20 -13 40 -4 q 6 12 -13 15 q -25 -1 -27 -11 z',
    ],
    [
        'M282 74 q 18 -16 38 -6 q 8 12 -12 16 q -22 2 -26 -10 z',
    ],
];

export function MapCanvas({ nodes, edges, sheet, overlays, children }: MapCanvasProps) {
    const styles = useStyles();
    const AXM = usePalette();
    const size: SheetSize = sheet ?? LEGACY_SHEET_SIZE;
    const canvas = canvasSizeOf(size);
    const chartTexture = sheet?.chartTexture ?? true;
    const hatch = React.useMemo(() => hatchLines(size.width, size.height), [size.width, size.height]);
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
    /**
     * The identity of the camera's SUBJECT — where the player stands plus the
     * steps open from there — as a stable string.
     *
     * PLAYTEST_BUGS_2026-09-18 BUG-04: the camera fitted once at mount and never
     * again (`initialized.current` latched on first run), so after the player
     * moved, the newly-opened branch could sit entirely off both edges. Measured
     * at the Crossing on a 414px viewport: of the three onward paths, `fv-16`
     * landed at x = -49 and `fv-11` at x = 419 — two of three choices invisible,
     * 19 of 25 nodes off-screen, with nothing on screen saying more existed.
     *
     * Keying the fit on THIS rather than on `nodes` is what makes the fix safe.
     * `nodes` is a fresh array every render, which is why the latch existed in
     * the first place; this key changes only when the player's actual position
     * or set of options changes. See the effect below for why that matters.
     */
    const focusKey = React.useMemo(() => focusKeyOf(nodes), [nodes]);
    const [viewport, setViewport] = React.useState<{ w: number; h: number } | null>(null);
    const onWrapLayout = React.useCallback(
        (e: { nativeEvent: { layout: { width: number; height: number } } }) => {
            const { width, height } = e.nativeEvent.layout;
            if (width === 0) return;
            setViewport((prev) => prev ?? { w: width, h: height });
        },
        [],
    );

    /**
     * Commit a camera transform to every shared value at once.
     *
     * Both the automatic fit and the manual RECENTRE go through here, so the
     * two can never drift into different ideas of what "framed on the player"
     * means — and, just as importantly, both write the `saved*` values as
     * well. Leaving those stale is what would make the next pan snap the
     * chart back to wherever it was before the recentre.
     */
    const commitCamera = React.useCallback((fit: FocusTransform) => {
        scale.value = fit.scale;
        savedScale.value = fit.scale;
        tx.value = fit.tx;
        ty.value = fit.ty;
        savedTx.value = fit.tx;
        savedTy.value = fit.ty;
    }, [scale, savedScale, tx, ty, savedTx, savedTy]);

    /**
     * RECENTRE — the drag affordance's missing return leg.
     *
     * owner finding 9 / D1, 2026-09-21. The chart is a 936x1040 spread behind
     * a phone-sized window and the pan is unbounded, so a player who drags to
     * look down a side strand can end up holding a blank corner of the sheet
     * with no way back except guessing. That was survivable while the map was
     * a vertical ladder and the only interesting thing was directly ahead;
     * with lateral ribs and D1's frontier roaming, looking sideways is now
     * the point, so looking sideways has to be undoable.
     *
     * It re-runs the SAME fit the camera performs on mount and whenever the
     * road ahead changes, which is why it needs no geometry of its own and
     * cannot disagree with the automatic camera. Chosen over clamping the pan
     * because a clamp has to model where the scaled canvas actually sits on
     * screen, and this file's fit math and React Native's transform origin do
     * not currently agree about that; a wrong clamp fights the player's drag
     * on every gesture, whereas a redundant recentre costs one tap.
     */
    const recenter = React.useCallback(() => {
        if (!viewport || nodes.length === 0) return;
        commitCamera(computeFocusTransform(nodes, viewport, size));
    }, [viewport, nodes, size, commitCamera]);

    React.useEffect(() => {
        if (!viewport || nodes.length === 0) return;
        // The choosable nodes: where the player stands + the steps they
        // can take from here, fit whole into frame (zoomed out if a wide
        // branch demands it) rather than just centred at 1x.
        //
        // This runs on every CHANGE OF `focusKey` — not once, and not on every
        // render. That distinction is the whole design, because it has to
        // satisfy two findings at once:
        //
        //   - BUG-04 (this phase): fitting only once left the player's onward
        //     choices off-screen after they moved. So the camera must re-fit
        //     when the road ahead changes.
        //   - CRITIQUE.md's RESOLVED row at :2140 ("the map recenters against
        //     manual panning", commit 6fe4e47c, issue #294): the camera must
        //     NOT fight a player who is panning to look around.
        //
        // Keying on `focusKey` satisfies both structurally rather than by
        // heuristic: panning does not change where the player stands or what
        // is open to them, so it cannot produce a re-fit — no "has the user
        // panned?" flag is needed, and there is no window in which the camera
        // could snap back mid-gesture. The camera moves only at the moments the
        // player themselves changed the map's subject, which is precisely when
        // that RESOLVED row's own text anticipated a re-fit would be wanted:
        // "a tap-to-pan affordance is separable follow-up if a future pass
        // still finds nodes going out of frame after a move."
        commitCamera(computeFocusTransform(nodes, viewport, size));
        // `nodes` is deliberately NOT a dependency — it is a fresh array every
        // render, and depending on it would re-fit constantly, which is exactly
        // the defect issue #294 closed. `focusKey` is its stable projection.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewport, focusKey, size.width, size.height, size.scale, commitCamera]);

    const pinch = Gesture.Pinch()
        .onUpdate((e) => {
            const next = savedScale.value * e.scale;
            scale.value = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next));
        })
        .onEnd(() => {
            savedScale.value = scale.value;
        });

    // `withTestId` is RNGH's own test affordance, inert in production — it
    // lets the suite drive a real pan and then prove the BUG-04 re-fit does
    // not undo it (issue #294).
    const pan = Gesture.Pan()
        .withTestId('map-pan')
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
                <Animated.View
                    testID="map-canvas"
                    style={[styles.canvas, { width: canvas.w, height: canvas.h }, mapTransform]}
                >
                    {/* The engraving plate — pans and zooms with the chart so the
                        wood feels painted onto the page. An atmosphere plate is
                        dimmed so roads and nodes keep contrast (dim, never blur);
                        a plate that is the map itself reads near full (D15). */}
                    {sheet != null && (
                        <Image
                            source={sheet.backdrop}
                            style={[styles.backdropPlate, { opacity: sheet.plateOpacity }]}
                            contentFit="cover"
                            testID="map-backdrop"
                        />
                    )}
                    {/* SVG edges — drawn across the spread canvas */}
                    <Svg
                        viewBox={`0 0 ${size.width} ${size.height}`}
                        width={canvas.w}
                        height={canvas.h}
                        style={StyleSheet.absoluteFillObject}
                    >
                        {/* The chart sheet: diagonal hatch + contour hills under the
                            roads — only over an atmosphere plate, never over a plate
                            that draws its own terrain. */}
                        {chartTexture && (
                            <G stroke={AXM.parchment} strokeWidth={0.4} opacity={0.05}>
                                {hatch.map((d) => (
                                    <Path key={d} d={d} fill="none" />
                                ))}
                            </G>
                        )}
                        {chartTexture && CONTOUR_GROUPS.map((group, gi) => (
                            <G
                                key={gi}
                                opacity={0.45}
                                stroke={AXM.ash}
                                strokeWidth={1}
                                fill="none"
                                transform={`scale(${size.width / 360} ${size.height / 400})`}
                            >
                                {group.map((d) => (
                                    <Path key={d} d={d} />
                                ))}
                            </G>
                        ))}
                        {edges.map((e) => {
                            const A = nodeById.get(e.fromId);
                            const B = nodeById.get(e.toId);
                            if (!A || !B) return null;
                            // Straight node-to-node paths so the graph reads as
                            // a connected route. A dark casing under the stroke
                            // gives each path a defined "road" edge.
                            const d = `M ${A.x} ${A.y} L ${B.x} ${B.y}`;
                            const ink = edgeStroke(e, AXM);
                            const mx = (A.x + B.x) / 2;
                            const my = (A.y + B.y) / 2;
                            return (
                                <G key={`${e.fromId}|${e.toId}`}>
                                    {ink.casing && (
                                        <Path d={d} stroke={AXM.deepBg} strokeWidth={ink.width + 3} fill="none" opacity={0.95} strokeLinecap="round" />
                                    )}
                                    <Path
                                        d={d}
                                        stroke={ink.color}
                                        strokeWidth={ink.width}
                                        strokeDasharray={ink.dash}
                                        fill="none"
                                        opacity={ink.opacity}
                                        strokeLinecap="round"
                                    />
                                    {/* The travelled-road bead marks progression, so a rib
                                        never wears one even once both its lanes are spent. */}
                                    {e.traveled && !e.lateral && <Circle cx={mx} cy={my} r={2.5} fill={AXM.sulfur} />}
                                </G>
                            );
                        })}
                    </Svg>

                    <MapSheetContext.Provider value={size}>{children}</MapSheetContext.Provider>
                </Animated.View>
            </GestureDetector>

            {/* Viewport-fixed chart furniture — never pans with the map.
                Sized explicitly: an SVG with no width/height falls back to
                300×150 on web, which drew this vignette as a dark box in the
                chart's top-left corner (invisible under the dim atmosphere
                plates; plain over the Act 1 plates, map revamp M3a). */}
            <Svg
                width="100%"
                height="100%"
                style={StyleSheet.absoluteFillObject}
                pointerEvents="none"
                testID="map-vignette"
            >
                <Defs>
                    <RadialGradient id="axmMapVignette" cx="50%" cy="50%" rx="72%" ry="66%">
                        <Stop offset="55%" stopColor={AXM.deepBg} stopOpacity={0} />
                        <Stop offset="100%" stopColor={AXM.deepBg} stopOpacity={0.6} />
                    </RadialGradient>
                </Defs>
                <Rect x="0" y="0" width="100%" height="100%" fill="url(#axmMapVignette)" />
            </Svg>
            <Svg
                width={52}
                height={52}
                viewBox="0 0 52 52"
                style={styles.compassRose}
                pointerEvents="none"
                accessibilityRole="image"
                accessibilityLabel="Compass rose"
                testID="map-compass"
            >
                <Circle cx={26} cy={26} r={21} stroke={AXM.bone} strokeWidth={1} fill="none" opacity={0.45} />
                <Circle cx={26} cy={26} r={16} stroke={AXM.bone} strokeWidth={0.6} fill="none" opacity={0.3} strokeDasharray="2 4" />
                <Path d="M6 26 H16 M36 26 H46 M26 36 V46" stroke={AXM.bone} strokeWidth={1} opacity={0.4} />
                <Path d="M26 6 L29 26 L26 32 L23 26 Z" fill={AXM.blood} opacity={0.75} />
                <Path d="M26 46 L29 26 L23 26 Z" fill={AXM.bone} opacity={0.5} />
                <Circle cx={26} cy={26} r={2} fill={AXM.parchment} opacity={0.7} />
            </Svg>
            {/* Viewport-fixed overlays (legend etc.) — pointerEvents none so
                they never swallow a pan that starts over them. */}
            {overlays != null && (
                <View style={StyleSheet.absoluteFillObject} pointerEvents="none" testID="map-overlays-fixed">
                    {overlays}
                </View>
            )}
            {/* RECENTRE — the one piece of chart furniture that takes a touch.
                Rendered AFTER the pointerEvents="none" overlay layer so the
                legend can never sit on top of it, and stacked directly above
                the compass rose so the right margin reads as one column of
                instruments rather than two scattered chips. */}
            <Pressable
                accessibilityRole="button"
                accessibilityLabel="Recentre the chart on your position"
                accessibilityHint="Frames where you stand and every path open to you"
                onPress={recenter}
                hitSlop={8}
                style={styles.recenter}
                testID="map-recenter"
            >
                <Text style={styles.recenterGlyph}>◎</Text>
            </Pressable>
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
        // `computeFocusTransform`'s tx/ty pivot the scale around the canvas's
        // own TOP-LEFT corner. The platform default pivots around the CENTER
        // instead, which is invisible whenever scale lands at 1 (desktop
        // always does — `Math.min(1, …)` caps it) but throws the whole canvas
        // off-frame the moment a narrow viewport clamps to MIN_SCALE (CRITIQUE
        // pass 48: the late-game hub's node graph rendered fully blank on
        // mobile — the fitted canvas landed almost entirely below the fold).
        transformOrigin: '0 0',
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
    compassRose: {
        position: 'absolute',
        right: 10,
        bottom: 10,
        opacity: 0.85,
    },
    // Stacked directly above the 52x52 rose pinned at right:10, bottom:10,
    // with an 8px gutter — 10 + 52 + 8 = 70. Same right edge, so the two read
    // as one column of instruments.
    recenter: {
        position: 'absolute',
        right: 10,
        bottom: 70,
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: AXM.ash,
        backgroundColor: 'rgba(10,10,10,0.72)',
        zIndex: 4,
    },
    recenterGlyph: {
        fontFamily: FONTS.mono,
        fontSize: 15,
        lineHeight: 18,
        color: AXM.bone,
    },
    backdropPlate: {
        ...StyleSheet.absoluteFillObject,
    },
}));