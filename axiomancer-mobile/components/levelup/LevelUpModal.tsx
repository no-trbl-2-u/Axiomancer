/**
 * LevelUpModal — "the ledger opens"
 *
 * Phase 73 port of the 2026-05-23 design handoff
 * (`design/handoff-2026-05-23/project/screens/levelup.jsx:246-449`).
 *
 * Full-screen non-tap-out-dismissible stat-allocation modal. Three
 * stance rows (HEART / BODY / MIND) with ± controls, derived-preview
 * ribbon (ATK / SKL / DEF), reset link, COMMIT primary + "keep
 * deliberating" ghost, plus the discard-confirm inset when the player
 * cancels mid-allocation.
 *
 * Mounted from `app/(tabs)/character/index.tsx` when the `<AscendStrip>`
 * tap fires. State (`spent: { heart, body, mind }`) lives locally
 * until COMMIT, then the engine's `actions.allocateStatPoint(stat)`
 * fires N times to materialize the allocations.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { DerivedPreviewRibbon } from '@/components/levelup/DerivedPreviewRibbon';
import { StanceRow, type LevelStance } from '@/components/levelup/StanceRow';
import { pickFlavor } from '@/components/levelup/levelUpFlavor';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';
import { toRomanLower } from '@/state/presenters/roman';
import { STANCES } from '@/state/presenters/stances';
import { calculateDerivedPreview } from '@/state/presenters/levelup.engine';


export interface LevelUpModalProps {
    characterName: string;
    fromLevel: number;
    toLevel: number;
    totalPoints: number;
    /** Base-stat values BEFORE the allocation session. */
    current: { heart: number; body: number; mind: number };
    /** Current derived stats for preview baseline (Phase 88) */
    currentDerived?: {
        heart: { attack: number; skill: number; defense: number };
        body: { attack: number; skill: number; defense: number };
        mind: { attack: number; skill: number; defense: number };
    };
    /**
     * Called once per allocation; the parent dispatches the engine
     * action. The modal manages local `spent` state until COMMIT.
     */
    onCommit: (spent: { heart: number; body: number; mind: number }) => void;
    /** Called when the player taps "keep deliberating" without spending. */
    onCancel: () => void;
}


export function LevelUpModal({
    characterName,
    fromLevel,
    toLevel,
    totalPoints,
    current,
    currentDerived,
    onCommit,
    onCancel,
}: LevelUpModalProps) {
    const [spent, setSpent] = useState<{ heart: number; body: number; mind: number }>({
        heart: 0,
        body: 0,
        mind: 0,
    });
    const [showDiscard, setShowDiscard] = useState<boolean>(false);

    const sumSpent = spent.heart + spent.body + spent.mind;
    const remaining = totalPoints - sumSpent;
    const fullyAllocated = remaining === 0;

    const onInc = useCallback(
        (stance: LevelStance) => {
            if (remaining <= 0) return;
            setSpent((prev) => ({ ...prev, [stance]: prev[stance] + 1 }));
        },
        [remaining],
    );
    const onDec = useCallback((stance: LevelStance) => {
        setSpent((prev) =>
            prev[stance] > 0 ? { ...prev, [stance]: prev[stance] - 1 } : prev,
        );
    }, []);
    const onReset = useCallback(() => setSpent({ heart: 0, body: 0, mind: 0 }), []);

    const handleCancel = useCallback(() => {
        if (sumSpent > 0) {
            setShowDiscard(true);
            return;
        }
        onCancel();
    }, [sumSpent, onCancel]);

    const handleDiscardConfirm = useCallback(() => {
        // Step back — discard local pending allocations + dismiss modal.
        setSpent({ heart: 0, body: 0, mind: 0 });
        setShowDiscard(false);
        onCancel();
    }, [onCancel]);

    const handleDiscardCancel = useCallback(() => setShowDiscard(false), []);

    const handleCommit = useCallback(() => {
        if (!fullyAllocated) return;
        onCommit(spent);
    }, [fullyAllocated, onCommit, spent]);

    const flavor = useMemo(() => pickFlavor(toLevel), [toLevel]);

    // Phase 88: Derived stats preview calculation
    const derivedPreview = useMemo(() => {
        if (!currentDerived) {
            // Fallback: no preview if derived stats not provided
            return currentDerived;
        }
        
        try {
            return calculateDerivedPreview(current, spent, fromLevel);
        } catch (error) {
            // Error fallback: show current stats without preview
            if (__DEV__) {
                console.warn('Derived stats preview calculation failed:', error);
            }
            return currentDerived;
        }
    }, [current, currentDerived, spent, fromLevel]);

    const styles = useStyles();

    return (
        <View style={styles.root} testID="levelup-modal">
            {/* Top binder */}
            <View style={styles.topBinder}>
                <Text style={styles.binderGlyphs}>{'✠ ✠ ✠ ✠ ✠ ✠ ✠ ✠ ✠ ✠'}</Text>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.eyebrow}>✠ THE LEDGER OPENS</Text>

                {/* Level transition */}
                <View style={styles.levelRow}>
                    <Text style={styles.levelFromLabel}>
                        level {toRomanLower(fromLevel)}
                    </Text>
                    <View style={styles.levelHairline} />
                    <Text style={styles.levelToLabel}>
                        level {toRomanLower(toLevel)}
                    </Text>
                </View>

                {/* Title */}
                <Text style={styles.title}>{characterName.toUpperCase()}</Text>

                {/* Chronicle flavor */}
                <Text style={styles.flavor}>“{flavor}”</Text>

                {/* Points-remaining strip */}
                <View
                    style={[
                        styles.pointsStrip,
                        fullyAllocated && styles.pointsStripLit,
                    ]}
                    testID="levelup-modal-points-strip"
                >
                    <Text style={styles.pointsLabel}>POINTS REMAINING</Text>
                    <Text
                        style={[
                            styles.pointsValue,
                            fullyAllocated && styles.pointsValueLit,
                        ]}
                    >
                        {remaining} / {totalPoints}
                    </Text>
                </View>

                {/* Three stance rows */}
                <View style={styles.stanceRows}>
                    {STANCES.map((stance) => (
                        <StanceRow
                            key={stance}
                            stance={stance}
                            current={current[stance]}
                            spent={spent[stance]}
                            canInc={remaining > 0}
                            canDec={spent[stance] > 0}
                            onInc={() => onInc(stance)}
                            onDec={() => onDec(stance)}
                        />
                    ))}
                </View>

                {/* Phase 88: Derived stats preview ribbon */}
                {currentDerived && derivedPreview && (
                    <DerivedPreviewRibbon
                        current={currentDerived}
                        preview={derivedPreview}
                        hasAllocations={sumSpent > 0}
                    />
                )}

                {/* Reset link */}
                <View style={styles.resetRow}>
                    <Pressable
                        onPress={sumSpent > 0 ? onReset : undefined}
                        accessibilityRole="button"
                        accessibilityLabel="Reset allocation"
                        accessibilityState={{ disabled: sumSpent === 0 }}
                        testID="levelup-modal-reset"
                    >
                        <Text
                            style={[
                                styles.resetLabel,
                                sumSpent === 0 && styles.resetLabelDisabled,
                            ]}
                        >
                            ↺ reset
                        </Text>
                    </Pressable>
                </View>

                {/* Action pair */}
                <View style={styles.actions}>
                    <Pressable
                        onPress={fullyAllocated ? handleCommit : undefined}
                        accessibilityRole="button"
                        accessibilityLabel="Commit allocation"
                        accessibilityState={{ disabled: !fullyAllocated }}
                        testID="levelup-modal-commit"
                        style={[
                            styles.commitBtn,
                            fullyAllocated ? styles.commitBtnLive : styles.commitBtnGhost,
                        ]}
                    >
                        <Text
                            style={[
                                styles.commitLabel,
                                fullyAllocated
                                    ? styles.commitLabelLive
                                    : styles.commitLabelGhost,
                            ]}
                        >
                            ✠ COMMIT
                        </Text>
                        {fullyAllocated && <View style={styles.commitUnderline} />}
                    </Pressable>
                    <Pressable
                        onPress={handleCancel}
                        accessibilityRole="button"
                        accessibilityLabel="Keep deliberating"
                        testID="levelup-modal-deliberate"
                        style={styles.deliberateBtn}
                    >
                        <Text style={styles.deliberateLabel}>keep deliberating</Text>
                    </Pressable>
                </View>

                <Text style={styles.consolation}>
                    the chronicle records each change.
                </Text>
            </ScrollView>

            {showDiscard && (
                <View style={styles.discardOverlay} testID="levelup-modal-discard">
                    <View style={styles.discardInset}>
                        <Text style={styles.discardEyebrow}>✠ the ink is still wet</Text>
                        <Text style={styles.discardBody}>
                            you have spent {sumSpent} of {totalPoints} points but
                            not sealed the page. step back, and the marks fade.
                        </Text>
                        <Pressable
                            onPress={handleDiscardConfirm}
                            accessibilityRole="button"
                            accessibilityLabel="Step back"
                            testID="levelup-modal-discard-confirm"
                            style={styles.discardConfirm}
                        >
                            <Text style={styles.discardConfirmLabel}>✠ STEP BACK</Text>
                        </Pressable>
                        <Pressable
                            onPress={handleDiscardCancel}
                            accessibilityRole="button"
                            accessibilityLabel="Stay on the page"
                            testID="levelup-modal-discard-cancel"
                            style={styles.discardStay}
                        >
                            <Text style={styles.discardStayLabel}>stay on the page</Text>
                        </Pressable>
                    </View>
                </View>
            )}
        </View>
    );
}


const useStyles = makeStyles((AXM) => ({
    root: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: AXM.deepBg,
        zIndex: 50,
    },
    topBinder: {
        height: 16,
        borderBottomWidth: 1,
        borderBottomColor: AXM.ash,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    binderGlyphs: {
        fontFamily: FONTS.mono,
        fontSize: 8,
        color: AXM.sulfur,
        letterSpacing: 2,
    },
    scroll: { flex: 1 },
    scrollContent: {
        paddingHorizontal: 18,
        paddingTop: 16,
        paddingBottom: 24,
    },
    eyebrow: {
        fontFamily: FONTS.sans,
        fontSize: 11,
        color: AXM.sulfur,
        letterSpacing: 2.2,
        textAlign: 'center',
    },
    levelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginTop: 6,
    },
    levelFromLabel: {
        fontFamily: FONTS.sans,
        fontSize: 10,
        letterSpacing: 1.6,
        color: AXM.bone,
    },
    levelHairline: {
        width: 32,
        height: 1,
        backgroundColor: AXM.sulfur,
    },
    levelToLabel: {
        fontFamily: FONTS.sans,
        fontSize: 10,
        letterSpacing: 1.6,
        color: AXM.parchment,
    },
    title: {
        fontFamily: FONTS.gothic,
        fontSize: 28,
        lineHeight: 30,
        letterSpacing: 1,
        color: AXM.parchment,
        textAlign: 'center',
        marginTop: 14,
        textShadowColor: AXM.bloodMed,
        textShadowOffset: { width: 1.5, height: 1.5 },
        textShadowRadius: 0,
    },
    flavor: {
        fontFamily: FONTS.serifItalic,
        fontSize: 13,
        lineHeight: 18,
        color: AXM.parchment,
        marginTop: 8,
        textAlign: 'center',
        paddingHorizontal: 6,
    },
    pointsStrip: {
        marginTop: 14,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: AXM.ash,
        backgroundColor: AXM.panelBg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    pointsStripLit: {
        borderWidth: 2,
        borderColor: AXM.sulfur,
    },
    pointsLabel: {
        fontFamily: FONTS.sans,
        fontSize: 10,
        letterSpacing: 1.8,
        color: AXM.sulfur,
    },
    pointsValue: {
        fontFamily: FONTS.mono,
        fontSize: 18,
        color: AXM.sulfur,
    },
    pointsValueLit: {
        textShadowColor: AXM.sulfurMed,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 6,
    },
    stanceRows: { marginTop: 12, gap: 6 },
    resetRow: { alignItems: 'flex-end', marginTop: 8 },
    resetLabel: {
        fontFamily: FONTS.serifItalic,
        fontSize: 12,
        color: AXM.bone,
    },
    resetLabelDisabled: { opacity: 0.3 },
    actions: {
        marginTop: 16,
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    commitBtn: {
        flex: 1.4,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: AXM.silhouette,
        position: 'relative',
    },
    commitBtnGhost: {
        borderWidth: 1,
        borderColor: AXM.ash,
    },
    commitBtnLive: {
        borderWidth: 2,
        borderColor: AXM.parchment,
    },
    commitLabel: {
        fontFamily: FONTS.gothic,
        fontSize: 16,
        letterSpacing: 2,
    },
    commitLabelGhost: { color: AXM.bone },
    commitLabelLive: { color: AXM.parchment },
    commitUnderline: {
        position: 'absolute',
        bottom: 4,
        left: 14,
        right: 14,
        height: 1,
        backgroundColor: AXM.sulfur,
    },
    deliberateBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    deliberateLabel: {
        fontFamily: FONTS.serifItalic,
        fontSize: 13,
        color: AXM.bone,
    },
    consolation: {
        fontFamily: FONTS.sans,
        fontSize: 9,
        letterSpacing: 1.6,
        color: AXM.bone,
        textAlign: 'center',
        marginTop: 16,
    },
    discardOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: AXM.overlay, // Using existing overlay token
    },
    discardInset: {
        backgroundColor: AXM.panelBg,
        borderWidth: 1,
        borderColor: AXM.sulfur,
        marginHorizontal: 24,
        padding: 16,
        gap: 8,
    },
    discardEyebrow: {
        fontFamily: FONTS.sans,
        fontSize: 11,
        letterSpacing: 2,
        color: AXM.blood,
    },
    discardBody: {
        fontFamily: FONTS.serifItalic,
        fontSize: 13,
        lineHeight: 18,
        color: AXM.parchment,
        marginTop: 4,
    },
    discardConfirm: {
        marginTop: 8,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: AXM.silhouette,
        borderWidth: 2,
        borderColor: AXM.parchment,
    },
    discardConfirmLabel: {
        fontFamily: FONTS.gothic,
        fontSize: 14,
        color: AXM.parchment,
        letterSpacing: 2,
    },
    discardStay: {
        marginTop: 4,
        paddingVertical: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    discardStayLabel: {
        fontFamily: FONTS.serifItalic,
        fontSize: 12,
        color: AXM.bone,
    },
}));

