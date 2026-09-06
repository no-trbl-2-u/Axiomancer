/**
 * Dev-only STATE INSPECTOR.
 *
 * Read-only view of the whole run — progression, economy, deck & gear,
 * world position, story ledger, and the late-game labyrinth ledger —
 * folded by `selectInspectorSections` (state/dev/inspector.ts) into
 * titled key/value groups. Live: it re-renders on every store change,
 * so a tester can watch a reward land or a flag flip as they press the
 * other dev controls.
 *
 * Sections are collapsible chips so the panel stays short by default;
 * RUN + PLAYER open on mount. Renders null outside dev builds.
 */

import React, { useMemo, useState } from 'react';
import { View } from 'react-native';

import { DevChip, DevChips, DevKv, DevRow } from '@/components/dev/DevControls';
import { isDevToolsEnabled } from '@/lib/buildProfile';
import { useGameState } from '@/state/GameStoreProvider';
import { selectInspectorSections } from '@/state/dev/inspector';
import { makeStyles } from '@/theme/runtime';

const OPEN_BY_DEFAULT: readonly string[] = ['RUN', 'PLAYER'];

export function DebugStateInspector() {
    const styles = useStyles();
    // Subscribe to the store identity, then derive rows with useMemo: the
    // selector builds fresh arrays, so selecting it directly would re-render
    // on every store read (useSyncExternalStore snapshot churn).
    const state = useGameState((s) => s);
    const sections = useMemo(() => selectInspectorSections(state), [state]);
    const [open, setOpen] = useState<readonly string[]>(OPEN_BY_DEFAULT);

    if (!isDevToolsEnabled()) return null;

    /** Toggle a section title in the open set (pure list op). */
    const toggle = (title: string) =>
        setOpen((prev) => (prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]));

    return (
        <DevRow label="DEBUG · STATE" sub="live read-only view · tap a section to expand" stacked testID="debug-state-inspector">
            <DevChips>
                {sections.map((s) => (
                    <DevChip
                        key={s.title}
                        label={s.title}
                        active={open.includes(s.title)}
                        onPress={() => toggle(s.title)}
                        a11y={`${open.includes(s.title) ? 'Collapse' : 'Expand'} ${s.title} state`}
                        testID={`debug-state-section-${s.title.toLowerCase().replace(/\s+/g, '-')}`}
                    />
                ))}
            </DevChips>
            {sections
                .filter((s) => open.includes(s.title))
                .map((s) => (
                    <View key={s.title} style={styles.group} testID={`debug-state-group-${s.title.toLowerCase().replace(/\s+/g, '-')}`}>
                        {s.rows.map((r) => (
                            <DevKv key={r.k} k={r.k} v={r.v} />
                        ))}
                    </View>
                ))}
        </DevRow>
    );
}

const useStyles = makeStyles((AXM) => ({
    group: {
        marginTop: 6,
        paddingVertical: 4,
        paddingHorizontal: 6,
        borderWidth: 1,
        borderColor: AXM.ash,
        backgroundColor: AXM.deepBg,
    },
}));
