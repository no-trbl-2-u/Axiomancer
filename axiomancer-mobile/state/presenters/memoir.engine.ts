/**
 * MEMOIR presenter (Phase 33 — shipped).
 *
 * Pure mapper from `GameStore` to the journal surface's view-model.
 * All four sections — chronicle, quests, moral + provisional
 * philosophical alignment — read live engine state. The
 * philosopher-quote slot stays `null` until exact alignments + a
 * quote inventory ship in a follow-up phase. See the JSDoc on
 * `selectMemoirViewModel` for the per-section read map and the
 * Phase 33 sub-tick history.
 *
 * The screen consumes this VM via the slim-slice + `useMemo` pattern
 * (Phase 30 Tick A). Calling `useGameState(selectMemoirViewModel)`
 * directly would churn `useSyncExternalStore` because the VM is a
 * frozen-new object every call.
 */

import type {
    BaseStats,
    DialogueTree,
    GameStore,
    Quest,
    QuestLog,
    QuestObjective,
    TypedGameEvent,
} from 'axiomancer-mechanics';
import {
    isCombatEndedEvent,
    isDialogueAppliedEvent,
    isLevelUpEvent,
    isWorldMovedEvent,
} from 'axiomancer-mechanics';

/**
 * Honest signature for `selectMemoirViewModel`: takes engine
 * `GameStore` (the canonical game state) and optionally the
 * mobile-private `_recentEvents` ring buffer from
 * `AppStoreState` (Phase 25). The optional `_recentEvents`
 * field keeps the presenter usable from hermetic test fixtures
 * that build a `GameStore` via `createGameStore` (no mobile
 * slices) — they pass undefined and chronicle stays empty.
 */
type MemoirStateInput = GameStore & {
    readonly _recentEvents?: readonly TypedGameEvent[];
};
import { freezeViewModel } from './freeze';

/** Visible chronicle entry cap. The screen scrolls if more exist. */
const CHRONICLE_VISIBLE_CAP = 12;

/**
 * One typed-event-derived chronicle row. Ticks D will populate from
 * the mobile `_recentEvents` ring buffer; Tick A ships an empty list.
 */
export interface ChronicleEntry {
    /** Stable id for keying — composed from event type + ordinal. */
    id: string;
    /** One of the engine event types the chronicle mapper recognizes. */
    kind: 'combat:ended' | 'character:levelup' | 'world:moved' | 'dialogue:applied';
    /** Short ALL-CAPS label rendered as the lead of the row. */
    label: string;
    /** Body line in the gothic body register, rendered beneath the label. */
    body: string;
}

/**
 * Bullet glyphs for the objective rows. Pinned at module scope (lifted
 * off `app/(tabs)/memoir/index.tsx` by /iterate addressing CRITIQUE
 * pass 7 HIGH) so the view layer carries no display literals per Hard
 * Rule #8. Same pattern as `EVENT_CHROME` / `ENCOUNTER_LABEL` /
 * `EVENT_CHROME` constants in the event presenter.
 */
export const QUEST_OBJECTIVE_BULLET = Object.freeze({
    done: '✓',
    pending: '○',
}) as { readonly done: '✓'; readonly pending: '○' };

/**
 * One quest row. Tick B will populate from `state.quests`; Tick A
 * ships empty sub-sections.
 */
export interface MemoirQuestRow {
    id: string;
    name: string;
    description: string;
    status: 'active' | 'completed' | 'failed';
    objectives: ReadonlyArray<{
        id: string;
        text: string;
        done: boolean;
        /** Display glyph for the row prefix — pinned per `QUEST_OBJECTIVE_BULLET`. */
        bullet: '✓' | '○';
    }>;
}

/**
 * Moral alignment chip — reads `state.moralMeter` via Tick C.
 * Tick A ships the `'UNDECLARED'` band as a placeholder.
 */
export interface MoralAlignment {
    /** Raw moral-meter value from the engine. Tick A: 0. */
    value: number;
    /** Display chip — band label + theme tint key. */
    chip: { label: string; tintKey: 'blood' | 'rust' | 'bone' | 'sulfur' | 'parchment' };
    /**
     * `true` for the default/undeclared band; the screen renders its
     * empty-state hint when this is set rather than pinning to the
     * `'UNDECLARED'` label literal (which is free to be renamed in a
     * later voice pass without breaking the conditional).
     */
    isEmpty: boolean;
}

/**
 * Provisional philosophical alignment — Tick C derives from the
 * highest base stat (heart > body > mind, ties → heart) and marks
 * `provisional: true`. The follow-up phase that ships real
 * alignments swaps the mapping without schema change.
 */
export interface PhilosophicalAlignment {
    /** Display label: 'of the Heart' / 'of the Body' / 'of the Mind' / 'UNTESTED'. */
    label: string;
    /** One-line rationale shown beneath the label (or empty in the untested state). */
    rationale: string;
    /** Always `true` until exact alignments are defined upstream. */
    provisional: boolean;
}

export interface MemoirViewModel {
    /** Header eyebrow + sub-line. */
    headerEyebrow: string;
    headerSubline: string;
    /** Section eyebrows — pinned on the VM so the screen carries no literals. */
    chronicleEyebrow: string;
    questsEyebrow: string;
    questsActiveEyebrow: string;
    questsCompletedEyebrow: string;
    questsForgottenEyebrow: string;
    measureEyebrow: string;
    /** Chronicle section — Tick D populates from `_recentEvents`. */
    chronicle: ReadonlyArray<ChronicleEntry>;
    /** Quest sections — Tick B populates from `state.quests`. */
    quests: {
        active: ReadonlyArray<MemoirQuestRow>;
        completed: ReadonlyArray<MemoirQuestRow>;
        forgotten: ReadonlyArray<MemoirQuestRow>;
    };
    /** Alignment readouts — Tick C populates. */
    moralAlignment: MoralAlignment;
    philosophicalAlignment: PhilosophicalAlignment;
    /**
     * Philosopher quote slot. Renders nothing when `null` — a
     * follow-up phase wires the lookup once exact alignments + a
     * quote inventory are defined. Tick A through Tick D all emit
     * `null` here.
     */
    philosopherQuote: string | null;
    /** Empty-state copy lines, pinned per Phase 33 brief. */
    emptyChronicle: string;
    emptyQuests: string;
    emptyMoral: string;
    emptyPhilosophical: string;
}

const DEFAULT_MORAL: MoralAlignment = Object.freeze({
    value: 0,
    chip: Object.freeze({ label: 'UNDECLARED', tintKey: 'bone' }),
    isEmpty: true,
}) as MoralAlignment;

/**
 * Empty-state philosophical alignment when no stat has emerged as
 * the player's largest measure (3-way tie). The chip label sits in
 * chrome register (`UNTESTED`, all-caps, no period) so it visually
 * rhymes with the other alignment chips (RUTHLESS / STERN /
 * UNDECLARED / BENEVOLENT / SAINTLY). The screen pairs the chip
 * with the narrative empty-state line `vm.emptyPhilosophical`
 * (`'untested.'`, lowercase + period) per the brief's
 * empty-state copy contract. CRITIQUE pass 7 LOW drain split the
 * two registers — before, both strings were `'untested.'`, which
 * read as a stray narrative fragment promoted into a chrome slot.
 */
const DEFAULT_PHILOSOPHICAL: PhilosophicalAlignment = Object.freeze({
    label: 'UNTESTED',
    rationale: '',
    provisional: true,
}) as PhilosophicalAlignment;

/**
 * Moral-meter band lookup (Tick C). Bands per Phase 33 brief
 * §"Sub-tick decomposition / Tick C": -100..-66 RUTHLESS, -65..-34
 * STERN, -33..33 UNDECLARED, 34..65 BENEVOLENT, 66..100 SAINTLY.
 * Pure function; chip is frozen to keep referential equality stable
 * across calls with the same band (lets the screen's React.memo see
 * a stable chip reference).
 */
const MORAL_BANDS: ReadonlyArray<{
    min: number;
    max: number;
    label: string;
    tintKey: MoralAlignment['chip']['tintKey'];
}> = Object.freeze([
    { min: -100, max: -66, label: 'RUTHLESS', tintKey: 'blood' },
    { min: -65, max: -34, label: 'STERN', tintKey: 'rust' },
    { min: -33, max: 33, label: 'UNDECLARED', tintKey: 'bone' },
    { min: 34, max: 65, label: 'BENEVOLENT', tintKey: 'sulfur' },
    { min: 66, max: 100, label: 'SAINTLY', tintKey: 'parchment' },
]);

const MORAL_CHIP_BY_BAND: ReadonlyMap<string, MoralAlignment['chip']> = new Map(
    MORAL_BANDS.map(
        (b): [string, MoralAlignment['chip']] => [
            b.label,
            Object.freeze({ label: b.label, tintKey: b.tintKey }) as MoralAlignment['chip'],
        ],
    ),
);

function buildMoralAlignment(rawValue: unknown): MoralAlignment {
    const value: number = typeof rawValue === 'number' && Number.isFinite(rawValue) ? rawValue : 0;
    const clamped = Math.max(-100, Math.min(100, value));
    const band =
        MORAL_BANDS.find((b) => clamped >= b.min && clamped <= b.max) ?? MORAL_BANDS[2];
    const chip = MORAL_CHIP_BY_BAND.get(band.label) ?? DEFAULT_MORAL.chip;
    return Object.freeze({
        value: clamped,
        chip,
        isEmpty: band.label === DEFAULT_MORAL.chip.label,
    }) as MoralAlignment;
}

/**
 * Provisional philosophical alignment (Tick C). Reads
 * `state.player.baseStats` (engine shape: `{ heart, body, mind }`,
 * lowercase keys per `Game/game.reducer.js:32`). Highest stat wins;
 * pairwise ties favour Heart (per brief §"Tick C"). A 3-way tie
 * returns the `UNTESTED` chip + `untested.` narrative line so the player sees an empty-state chip rather
 * than a spuriously-emitted alignment.
 */
const PHILOSOPHICAL_BY_STAT: Readonly<Record<'heart' | 'body' | 'mind', string>> = Object.freeze({
    heart: 'of the Heart',
    body: 'of the Body',
    mind: 'of the Mind',
});

const STAT_PROPER_NAME: Readonly<Record<'heart' | 'body' | 'mind', string>> = Object.freeze({
    heart: 'Heart',
    body: 'Body',
    mind: 'Mind',
});

/**
 * Tick D: chronicle mapper. Reads `state._recentEvents` (Phase 25
 * ring buffer, capacity 20) and emits at most `CHRONICLE_VISIBLE_CAP`
 * entries in reverse-chronological order. Per Phase 33 brief §"Tick D":
 *
 * - `combat:ended` → "FELLED" / "ROUTED BY" / "FLED" depending on
 *   `report.outcome` (engine outcomes are 'victory' / 'defeat' /
 *   'flee'). The Phase 33 brief originally targeted "PARLEYED WITH"
 *   for the flee outcome; CRITIQUE pass 7 + /oversight 2026-05-16
 *   reverted that to "FLED" because the engine has no parley outcome
 *   today and the journal was reading as misleading (player fled,
 *   chronicle claimed they negotiated). When/if engine ships a real
 *   parley outcome, PARLEYED WITH can return as its own mapping.
 *   Enemy name is lost from the event payload after END_COMBAT (the
 *   reducer clears `state.combat`), so the body line carries the
 *   outcome flavour + xp grant rather than naming the foe.
 * - `character:levelup` → "ROSE TO <level>" with the new level read
 *   off `event.payload.state.player.level`.
 * - `world:moved` → "CROSSED INTO <continent>" only when the moved-to
 *   continent differs from the most-recently-seen continent (cross-
 *   event tracking inside the pure mapper — the input array is the
 *   source of truth, no external state needed).
 * - `dialogue:applied` → "SPOKE WITH <npc>" when the tree carries an
 *   identifiable NPC name; defensively skipped when not extractable.
 * - Every other event type (inventory:changed etc.) → skipped per
 *   brief ("too noisy for a chronicle").
 */
function buildChronicle(rawEvents: unknown): ReadonlyArray<ChronicleEntry> {
    if (!Array.isArray(rawEvents) || rawEvents.length === 0) {
        return Object.freeze([]) as readonly ChronicleEntry[];
    }
    const events = rawEvents as ReadonlyArray<TypedGameEvent>;
    const entries: ChronicleEntry[] = [];
    let lastSeenContinent: string | null = null;
    let ordinal = 0;
    for (const e of events) {
        ordinal += 1;
        if (isCombatEndedEvent(e)) {
            // Engine `EnginePayload.report?: CombatEndReport` with
            // `{outcome: 'victory'|'defeat'|'friendship'|'flee',
            // xpGained: number, loot: Item[]}`. Memoir-audit [3.0]
            // fix 2026-05-22 dropped the `(e.payload as any)` cast.
            const report = e.payload.report;
            const outcome = report?.outcome;
            if (!outcome) continue;
            const xp: number = typeof report?.xpGained === 'number' ? report.xpGained : 0;
            const label =
                outcome === 'victory'
                    ? 'FELLED'
                    : outcome === 'defeat'
                      ? 'ROUTED BY'
                      : 'FLED';
            const body =
                outcome === 'victory'
                    ? xp > 0
                        ? `a foe falls. +${xp} xp.`
                        : 'a foe falls.'
                    : outcome === 'defeat'
                      ? 'the path turns dark.'
                      : 'the path bends away.';
            entries.push(
                Object.freeze({
                    id: `combat-${ordinal}`,
                    kind: 'combat:ended' as const,
                    label,
                    body,
                }),
            );
            continue;
        }
        if (isLevelUpEvent(e)) {
            // Engine `EnginePayload.state: GameState`;
            // `Character.level: number` — typed directly.
            const level = e.payload.state?.player?.level;
            if (typeof level !== 'number') continue;
            entries.push(
                Object.freeze({
                    id: `levelup-${ordinal}`,
                    kind: 'character:levelup' as const,
                    label: `ROSE TO ${level}`,
                    body: 'a measure deepens.',
                }),
            );
            continue;
        }
        if (isWorldMovedEvent(e)) {
            // Engine `WorldState.currentContinent: Continent` (an
            // object with `.name`), NOT a string. The previous
            // `typeof world?.currentContinent === 'string'` read was
            // dead code; current shape pulls the continent name off
            // the typed Continent object. Defensive `?? null` on
            // each chain step.
            const world = e.payload.state?.world;
            const continent: string | undefined =
                typeof world?.currentContinent?.name === 'string'
                    ? world.currentContinent.name
                    : undefined;
            if (!continent) continue;
            if (lastSeenContinent !== null && continent === lastSeenContinent) continue;
            lastSeenContinent = continent;
            entries.push(
                Object.freeze({
                    id: `world-${ordinal}`,
                    kind: 'world:moved' as const,
                    label: `CROSSED INTO ${continent.toUpperCase()}`,
                    body: 'new ground underfoot.',
                }),
            );
            continue;
        }
        if (isDialogueAppliedEvent(e)) {
            // Engine `EnginePayload.action: GameAction` is a
            // discriminated union; narrow to APPLY_DIALOGUE to
            // access the tree payload. DialogueTree itself has no
            // `npcName` field — that's a mobile-side convention
            // (some fixtures inject one). Cast only at the deepest
            // boundary so the rest of the chain stays typed.
            if (e.payload.action.type !== 'APPLY_DIALOGUE') continue;
            const tree = e.payload.action.payload.tree as DialogueTree & {
                npcName?: string;
                name?: string;
            };
            const npcName: string | undefined =
                typeof tree.npcName === 'string' && tree.npcName.length > 0
                    ? tree.npcName
                    : typeof tree.name === 'string' && tree.name.length > 0
                      ? tree.name
                      : undefined;
            if (!npcName) continue;
            entries.push(
                Object.freeze({
                    id: `dialogue-${ordinal}`,
                    kind: 'dialogue:applied' as const,
                    label: `SPOKE WITH ${npcName.toUpperCase()}`,
                    body: 'words exchanged.',
                }),
            );
            continue;
        }
        // every other event type → skip (inventory:changed, combat:round, …)
    }
    // Reverse-chronological + cap at the visible cutoff.
    const reversed = entries.reverse();
    const capped = reversed.slice(0, CHRONICLE_VISIBLE_CAP);
    return Object.freeze(capped) as readonly ChronicleEntry[];
}

function buildPhilosophicalAlignment(stats: BaseStats | undefined): PhilosophicalAlignment {
    // Engine `BaseStats` declares `heart/body/mind: number` as required;
    // the `Number.isFinite` guard stays as defense against NaN /
    // Infinity that a downstream effect might inject before the
    // memoir reads here.
    const heart = stats && Number.isFinite(stats.heart) ? stats.heart : 0;
    const body = stats && Number.isFinite(stats.body) ? stats.body : 0;
    const mind = stats && Number.isFinite(stats.mind) ? stats.mind : 0;
    // 3-way tie → untested
    if (heart === body && body === mind) return DEFAULT_PHILOSOPHICAL;
    // Pairwise tie-break favours Heart per brief
    const max = Math.max(heart, body, mind);
    const winner: 'heart' | 'body' | 'mind' =
        heart === max ? 'heart' : body === max ? 'body' : 'mind';
    return Object.freeze({
        label: PHILOSOPHICAL_BY_STAT[winner],
        rationale: `${STAT_PROPER_NAME[winner]} is your largest measure (${max}).`,
        provisional: true,
    }) as PhilosophicalAlignment;
}

const FALLBACK_VM: MemoirViewModel = Object.freeze({
    headerEyebrow: '✠ THE BOOK OF DEEDS',
    headerSubline: 'gathering pages…',
    chronicleEyebrow: '✠ A CHRONICLE',
    questsEyebrow: '✠ ERRANDS',
    questsActiveEyebrow: '✠ AT HAND',
    questsCompletedEyebrow: '✠ COMPLETED',
    questsForgottenEyebrow: '✠ FORGOTTEN',
    measureEyebrow: '✠ MEASURE',
    chronicle: Object.freeze([]) as ReadonlyArray<ChronicleEntry>,
    quests: Object.freeze({
        active: Object.freeze([]) as ReadonlyArray<MemoirQuestRow>,
        completed: Object.freeze([]) as ReadonlyArray<MemoirQuestRow>,
        forgotten: Object.freeze([]) as ReadonlyArray<MemoirQuestRow>,
    }) as MemoirViewModel['quests'],
    moralAlignment: DEFAULT_MORAL,
    philosophicalAlignment: DEFAULT_PHILOSOPHICAL,
    philosopherQuote: null,
    emptyChronicle: 'the page is bare.',
    emptyQuests: 'no errands written here.',
    emptyMoral: 'the scales are level.',
    emptyPhilosophical: 'untested.',
}) as MemoirViewModel;

/**
 * Synthesize a one-line text for a quest objective. The engine's
 * `QuestObjective` runtime shape carries `{id, type, target,
 * currentCount, requiredCount}` plus an optional human-readable
 * `text` / `label` / `description` field (engine fixtures vary).
 * Read whichever's present; fall back to a synthetic
 * `<type> <target>` line so the screen always has SOMETHING to
 * render. Progress fraction is appended only when the engine
 * actually returns a useful count.
 */
/**
 * Mobile-extended `QuestObjective` shape: engine `description` is the
 * canonical field; tests + older fixtures sometimes inject `text` or
 * `label` for free-form objective copy. Memoir-audit [2.5] fix
 * 2026-05-22 replaced the `as any` cast with this narrower extension.
 */
type MemoirObjectiveInput = Partial<QuestObjective> & {
    readonly text?: unknown;
    readonly label?: unknown;
};

function synthesizeObjectiveText(objective: MemoirObjectiveInput): string {
    const provided: string | undefined =
        (typeof objective.text === 'string' && objective.text) ||
        (typeof objective.label === 'string' && objective.label) ||
        (typeof objective.description === 'string' && objective.description) ||
        undefined;
    if (provided) return provided;
    const verb: string =
        typeof objective.type === 'string' && objective.type.length > 0
            ? objective.type
            : 'task';
    const target: string =
        typeof objective.target === 'string' && objective.target.length > 0
            ? `: ${objective.target}`
            : '';
    return `${verb}${target}`;
}

/**
 * Memoir-audit [2.5] fix 2026-05-22: dropped `(q: any)` /
 * `(o: any)` casts. Engine `Quest` / `QuestObjective` types
 * (axiomancer-mechanics/dist/World/types.d.ts) shape the input;
 * objectives extend via `MemoirObjectiveInput` for the
 * mobile-side `text` / `label` fallback fields that legacy
 * fixtures inject.
 */
function buildActiveRows(activeQuests: readonly Quest[] | undefined): ReadonlyArray<MemoirQuestRow> {
    if (!Array.isArray(activeQuests)) return Object.freeze([]) as readonly MemoirQuestRow[];
    return Object.freeze(
        activeQuests.map((q) => {
            const name: string = typeof q?.name === 'string' ? q.name : '';
            const description: string =
                typeof q?.description === 'string' ? q.description : '';
            const rawObjectives: readonly MemoirObjectiveInput[] = Array.isArray(q?.objectives)
                ? (q.objectives as readonly MemoirObjectiveInput[])
                : [];
            const objectives = Object.freeze(
                rawObjectives.map((o) => {
                    const currentCount =
                        typeof o.currentCount === 'number' ? o.currentCount : 0;
                    const requiredCount =
                        typeof o.requiredCount === 'number' && o.requiredCount > 0
                            ? o.requiredCount
                            : 1;
                    const done = currentCount >= requiredCount;
                    return Object.freeze({
                        id: typeof o.id === 'string' ? o.id : `obj-${name}`,
                        text: synthesizeObjectiveText(o),
                        done,
                        bullet: done ? QUEST_OBJECTIVE_BULLET.done : QUEST_OBJECTIVE_BULLET.pending,
                    });
                }),
            ) as readonly {
                id: string;
                text: string;
                done: boolean;
                bullet: '✓' | '○';
            }[];
            return Object.freeze({
                id: name || 'unnamed',
                name: name || 'unnamed',
                description,
                status: 'active' as const,
                objectives,
            });
        }),
    ) as readonly MemoirQuestRow[];
}

function buildCompletedRows(
    completedNames: unknown,
): ReadonlyArray<MemoirQuestRow> {
    if (!Array.isArray(completedNames)) return Object.freeze([]) as readonly MemoirQuestRow[];
    return Object.freeze(
        completedNames.map((name) => {
            const safeName = typeof name === 'string' ? name : 'unnamed';
            return Object.freeze({
                id: safeName,
                name: safeName,
                description: '',
                status: 'completed' as const,
                objectives: Object.freeze([]) as readonly {
                    id: string;
                    text: string;
                    done: boolean;
                    bullet: '✓' | '○';
                }[],
            });
        }),
    ) as readonly MemoirQuestRow[];
}

/**
 * Pure mapper from game state → `MemoirViewModel`. Builds the full
 * journal surface — header, chronicle, quests, alignment readouts —
 * off the engine state in one pass.
 *
 * Each section reads from a distinct slice:
 *
 * - **Header sub-line** — substitutes the player's display name into
 *   `"<name>, pilgrim."` when `state.player.name` is populated; falls
 *   back to the FALLBACK header otherwise.
 * - **Quests** — reads `state.quests` (engine `QuestLog`). Active
 *   rows mirror the engine's `Quest` objects with their objectives;
 *   completed rows mirror the engine's `completed: QuestName[]` (the
 *   engine drops the full Quest on completion, so the row carries
 *   just the name). `forgotten` stays empty — the engine has no
 *   failed-quest concept today; the field is reserved for future
 *   expansion without forcing a schema change.
 * - **Moral alignment** — reads `state.moralMeter` (number in
 *   [-100, 100]) and buckets into one of five bands per
 *   `MORAL_BANDS` (RUTHLESS / STERN / UNDECLARED / BENEVOLENT /
 *   SAINTLY) with a tint-key for the chip.
 * - **Philosophical alignment** — provisional heuristic that reads
 *   `state.player.baseStats` and picks the highest of
 *   `{ heart, body, mind }`. Pairwise ties favour Heart; 3-way tie
 *   returns the documented `UNTESTED` chip + `untested.` narrative empty state.
 *   `provisional: true` until exact alignments are defined upstream.
 * - **Chronicle** — reads `state._recentEvents` (Phase 25 ring
 *   buffer, capacity 20) and folds typed events into reverse-
 *   chronological `ChronicleEntry` rows via `buildChronicle`. Combat
 *   outcomes → FELLED / ROUTED BY / FLED; levelups → ROSE
 *   TO N; world:moved (continent transition only) → CROSSED INTO X;
 *   dialogue:applied with extractable npcName → SPOKE WITH X. Other
 *   event kinds are skipped per the brief. Capped at
 *   `CHRONICLE_VISIBLE_CAP` (12) rows; the screen scrolls if more
 *   exist.
 * - **Philosopher quote** — currently always `null`. A follow-up
 *   phase wires the lookup once exact alignments + a quote inventory
 *   are defined.
 *
 * The view-model shape is pinned by `state/e2e/memoir.engine.test.ts`;
 * extensions to any section must keep the contract stable.
 *
 * ## Phase 33 history
 *
 * Shipped across 4 sub-ticks on 2026-05-16, all closed via Phase 33's
 * DoD tick (`6c1ddfa`):
 * - Tick A `6515cb5` — route + skeleton VM + empty fixtures.
 * - Tick B `2f70eac` — quests section reads `state.quests`.
 * - Tick C `6105b90` — moral bands + provisional philosophical
 *   alignment from `baseStats`.
 * - Tick D `9ccdee2` — chronicle from `_recentEvents`.
 */
export function selectMemoirViewModel(state: MemoirStateInput): MemoirViewModel {
    // Memoir-audit [2.5] fix 2026-05-22: typed `state` as
    // `MemoirStateInput` (GameStore + optional `_recentEvents`)
    // instead of `GameStore` with `(state as any)` casts. Engine
    // `GameState.quests: QuestLog` and `GameState.moralMeter:
    // number` are typed cleanly on `GameStore`; the
    // `_recentEvents` ring buffer is mobile-private (Phase 25)
    // so we extend with the optional field. Tests that pass an
    // engine `GameStore` (no mobile slices) still work — the
    // optional field is undefined and chronicle stays empty.
    const player = state.player;
    const subline =
        player && typeof player.name === 'string' && player.name.length > 0
            ? `${player.name}, pilgrim.`
            : FALLBACK_VM.headerSubline;
    const log: QuestLog | undefined = state.quests;
    const active = buildActiveRows(log?.active);
    const completed = buildCompletedRows(log?.completed);
    const moralAlignment = buildMoralAlignment(state.moralMeter);
    const philosophicalAlignment = buildPhilosophicalAlignment(player?.baseStats);
    const chronicle = buildChronicle(state._recentEvents);
    return freezeViewModel({
        ...FALLBACK_VM,
        headerSubline: subline,
        chronicle,
        quests: {
            active,
            completed,
            forgotten: Object.freeze([]) as readonly MemoirQuestRow[],
        },
        moralAlignment,
        philosophicalAlignment,
    });
}
