/**
 * Rest encounter presenter — maps the engine session
 * (`axiomancer-mechanics` World/Rest) onto a render-ready view-model.
 * Pure: no store writes, no rolls, no rule decisions.
 */

import { REST_POSTURES, REST_TUNING, REST_WARMTH_MAX } from 'axiomancer-mechanics';
import type {
    RestOutcomeTier,
    RestPosture,
    RestSession,
    RestWatchKind,
} from 'axiomancer-mechanics';
import type { AppStoreState } from '@/state/store';

// ---------------------------------------------------------------------------
// VM shapes
// ---------------------------------------------------------------------------

export interface RestPostureVM {
    key: RestPosture;
    name: string;
    desc: string;
    flavor: string;
    /** Display heal band, e.g. "≈ 40% VITAE". */
    healHint: string;
}

export interface RestOptionVM {
    id: string;
    label: string;
    desc: string;
    enabled: boolean;
    disabledReason: string | null;
}

export interface RestResultVM {
    title: string;
    body: string;
    rolls: readonly number[];
    /** Compact delta chips, e.g. "+1 WARMTH", "−1 FIREWOOD". */
    deltaChips: readonly string[];
    keepsake: string | null;
}

export interface RestPendingVM {
    watch: number;
    kind: RestWatchKind;
    title: string;
    body: string;
    options: readonly RestOptionVM[];
    result: RestResultVM | null;
}

export interface RestOutcomeVM {
    tier: RestOutcomeTier;
    tierLabel: string;
    /** Whole-percent heal, e.g. 42. */
    healPercent: number;
    cleansed: boolean;
    warmth: number;
    comfort: number;
    keepsakes: readonly string[];
}

export interface RestVM {
    active: boolean;
    phase: RestSession['phase'] | 'none';
    posture: RestPosture | null;
    postures: readonly RestPostureVM[];
    watch: number;
    watchesPerNight: number;
    warmth: number;
    warmthMax: number;
    wood: number;
    comfort: number;
    keepsakes: readonly string[];
    pending: RestPendingVM | null;
    outcome: RestOutcomeVM | null;
}

export const REST_TIER_LABELS: Record<RestOutcomeTier, string> = Object.freeze({
    restored: 'RESTORED',
    rested: 'RESTED',
    meagre: 'MEAGRE',
});

export const REST_WATCH_GLYPHS: Record<RestWatchKind, string> = Object.freeze({
    embers: '✶',
    dream: '☽',
    stir: '⚠',
    still: '◦',
});

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

const POSTURE_VMS: readonly RestPostureVM[] = Object.freeze(
    REST_POSTURES.map(p => Object.freeze({
        key: p.key,
        name: p.name,
        desc: p.desc,
        flavor: p.flavor,
        healHint: `≈ ${Math.round(p.baseHeal * 100)}% VITAE`,
    })),
);

const EMPTY_VM: RestVM = Object.freeze({
    active: false,
    phase: 'none',
    posture: null,
    postures: POSTURE_VMS,
    watch: 0,
    watchesPerNight: REST_TUNING.watchesPerNight,
    warmth: 0,
    warmthMax: REST_WARMTH_MAX,
    wood: 0,
    comfort: 0,
    keepsakes: Object.freeze([]),
    pending: null,
    outcome: null,
});

export function selectHasActiveRest(state: Pick<AppStoreState, 'rest'>): boolean {
    return state.rest?.session != null;
}

export function selectRestVM(state: Pick<AppStoreState, 'rest'>): RestVM {
    const s = state.rest?.session;
    if (!s) return EMPTY_VM;

    const pending: RestPendingVM | null = s.pending === null ? null : {
        watch: s.pending.watch,
        kind: s.pending.kind,
        title: s.pending.title,
        body: s.pending.body,
        options: s.pending.options.map(o => ({
            id: o.id,
            label: o.label,
            desc: o.desc,
            enabled: !o.disabledReason,
            disabledReason: o.disabledReason ?? null,
        })),
        result: s.pending.result === null ? null : {
            title: s.pending.result.title,
            body: s.pending.result.body,
            rolls: s.pending.result.rolls,
            deltaChips: composeDeltaChips(s.pending.result),
            keepsake: s.pending.result.keepsake || null,
        },
    };

    const outcome: RestOutcomeVM | null = s.outcome === null ? null : {
        tier: s.outcome.tier,
        tierLabel: REST_TIER_LABELS[s.outcome.tier],
        healPercent: Math.round(s.outcome.healFraction * 100),
        cleansed: s.outcome.cleansed,
        warmth: s.outcome.warmth,
        comfort: s.outcome.comfort,
        keepsakes: s.outcome.keepsakes,
    };

    return {
        active: true,
        phase: s.phase,
        posture: s.posture,
        postures: POSTURE_VMS,
        watch: s.watch,
        watchesPerNight: REST_TUNING.watchesPerNight,
        warmth: s.warmth,
        warmthMax: REST_WARMTH_MAX,
        wood: s.wood,
        comfort: s.comfort,
        keepsakes: s.keepsakes,
        pending,
        outcome,
    };
}

function composeDeltaChips(result: {
    warmthDelta: number; woodDelta: number; comfortDelta: number;
}): string[] {
    const chips: string[] = [];
    const sign = (n: number) => (n > 0 ? `+${n}` : `${n}`);
    if (result.warmthDelta !== 0) chips.push(`${sign(result.warmthDelta)} WARMTH`);
    if (result.woodDelta !== 0) chips.push(`${sign(result.woodDelta)} FIREWOOD`);
    if (result.comfortDelta !== 0) chips.push(`${sign(result.comfortDelta)} COMFORT`);
    return chips;
}
