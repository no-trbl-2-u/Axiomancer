/**
 * Dev-only HAZARD PUZZLES board: the three demo puzzles, a route pick, the
 * board under its clock and the outcome panel. Gated to dev builds;
 * production renders nothing.
 *
 * Route: /devpuzzle. Optional `?id=<demo id>` opens a demo, `&route=safe|risk`
 * starts it, `&confirm=1` confirms at once (the smoke shot of the outcome
 * panel), and `&paused=1` holds the clock (the smoke shot of the board).
 */

import React from 'react';
import { ScrollView, View } from 'react-native';

import { HazardPuzzleDemo } from '@/components/hazard/puzzle/HazardPuzzleDemo';
import { isDevToolsEnabled } from '@/lib/buildProfile';
import { useLocalSearchParams } from '@/lib/platform/router';
import { makeStyles } from '@/theme/runtime';

function routeParam(value: string | undefined): 'safe' | 'risk' | undefined {
    return value === 'safe' || value === 'risk' ? value : undefined;
}

export default function DevHazardPuzzles() {
    const styles = useStyles();
    const params = useLocalSearchParams<{ id?: string; route?: string; confirm?: string; paused?: string }>();
    if (!isDevToolsEnabled()) {
        return <View style={styles.root} testID="devpuzzle-disabled" />;
    }
    return (
        <ScrollView style={styles.root} contentContainerStyle={styles.content} testID="devpuzzle-screen">
            <HazardPuzzleDemo
                initialId={params.id}
                initialRoute={routeParam(params.route)}
                autoConfirm={params.confirm === '1'}
                clockPaused={params.paused === '1'}
            />
        </ScrollView>
    );
}

const useStyles = makeStyles((AXM) => ({
    root: { flex: 1, backgroundColor: AXM.bg },
    content: { padding: 12, paddingBottom: 48 },
}));
