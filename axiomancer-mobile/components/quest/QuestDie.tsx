/**
 * QuestDie — the carved bone die shown in the board's center well.
 *
 * Pure presentation: it renders whatever face the landing choreography
 * hands it. While `rolling`, the face changes every frame and the glyph
 * tilts/pulses off the `tick` so the cast reads as a tumble rather than
 * an instant result. When settled it shows the cast value and bonus.
 */

import React from 'react';
import { Text, View } from 'react-native';

import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';

/** Unicode pip faces for 1-6; falls back to the number outside that range. */
const DIE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

function faceGlyph(face: number | null): string {
    if (face === null) return '⚄';
    if (face >= 1 && face <= 6) return DIE_FACES[face - 1];
    return String(face);
}

export interface QuestDieProps {
    face: number | null;
    rolling: boolean;
    /** Frame counter while rolling — drives the tumble tilt. */
    tick: number;
    bonus: number;
    /** Cast total (die + bonus), shown once settled. */
    total: number | null;
}

export function QuestDie({ face, rolling, tick, bonus, total }: QuestDieProps) {
    const styles = useStyles();
    // Discrete tilt while tumbling; square-on when settled.
    const angle = rolling ? ((tick % 4) - 1.5) * 18 : 0;
    const scale = rolling && tick % 2 === 0 ? 1.12 : 1;

    return (
        <View style={styles.wrap} testID="quest-die">
            <Text
                style={[styles.face, { transform: [{ rotate: `${angle}deg` }, { scale }] }]}
                testID="quest-die-face"
            >
                {faceGlyph(face)}
            </Text>
            {!rolling && total !== null && (
                <Text style={styles.total} testID="quest-die-total">
                    {bonus > 0 ? `${total} (${total - bonus}+${bonus})` : `${total}`}
                </Text>
            )}
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    wrap: { alignItems: 'center', marginTop: 4, minHeight: 34 },
    face: {
        fontFamily: FONTS.gothic,
        fontSize: 26,
        lineHeight: 30,
        color: AXM.sulfur,
    },
    total: {
        fontFamily: FONTS.mono,
        fontSize: 12,
        letterSpacing: 1,
        color: AXM.bone,
        marginTop: -2,
    },
}));
