/**
 * Philosophical alignment — three-axis cube (Phase 42).
 *
 * The system encodes a character's philosophical position on three
 * orthogonal axes drawn from `content/philosophy/PhilosAxiosDoc.pdf`:
 *
 *   epistemology  — how truth is known           (Faith ↔ Agnostic ↔ Logic)
 *   outlook       — disposition toward existence (Pessimistic ↔ Neutral ↔ Optimistic)
 *   scope         — focus of meaning             (Individual ↔ Relational ↔ Transcendent)
 *
 * Each axis is an integer in `[-100, +100]`. The current `(low|mid|high)`
 * bucket triple at thresholds `±34` indexes one of 27 cells in
 * `philosophicalAlignment.library`. The system is orthogonal to
 * `moralMeter` — see `docs/philosophy.md`.
 */

/** One of three buckets per axis, computed from a `[-100, +100]` integer. */
export type AxisBucket = 'low' | 'mid' | 'high';

/** Continuous alignment state on three orthogonal axes. */
export interface PhilosophicalAlignment {
    /** -100 = Faith ◀ Agnostic ▶ +100 = Logic. */
    epistemology: number;
    /** -100 = Pessimistic ◀ Neutral ▶ +100 = Optimistic. */
    outlook: number;
    /** -100 = Individual ◀ Relational ▶ +100 = Transcendent. */
    scope: number;
}

/** A single logical-fallacy entry attached to a cell. */
export interface AlignmentFallacy {
    /** Display name of the fallacy (e.g. "Appeal to Consequences"). */
    name: string;
    /** Quoted example illustrating the fallacy in context. */
    example: string;
    /** One-line "why this fallacy aligns with this position" rationale. */
    rationale: string;
}

/**
 * One of the 27 alignment cells, identified by its triple of axis buckets.
 *
 * `id` is `<epistemology>-<outlook>-<scope>` kebab-case (e.g.
 * `logic-optimistic-individual`). Stable across versions.
 */
export interface PhilosophicalAlignmentCell {
    id: string;
    epistemology: AxisBucket;
    outlook: AxisBucket;
    scope: AxisBucket;
    /** Short human-readable label (e.g. "Logic-Optimistic-Individual"). */
    label: string;
    /** Representative real-world philosopher. */
    philosopher: string;
    /** Representative literary character + the work they appear in. */
    literaryCharacter: { name: string; work: string };
    /** Three signature logical fallacies for this cell. */
    fallacies: [AlignmentFallacy, AlignmentFallacy, AlignmentFallacy];
}
