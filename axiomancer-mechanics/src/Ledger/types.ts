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
 * `alignment.library.ts`. The system is orthogonal to
 * `moralMeter` — see `docs/oaths.md`.
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

/** A single besetting-sin entry attached to a cell (Phase 44h — spec 34 §6.2.1). */
export interface BesettingSin {
    /** Display name of the sin (e.g. "The Shifting Ledger"). */
    name: string;
    /** Quoted example illustrating the sin in context. */
    example: string;
    /** One-line "why this sin fits this position" rationale. */
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
    /** An in-world Parish figure who held this position, and what it cost them. */
    damnedExemplar: string;
    /** A Parish folk story that carries this position, and where it is told. */
    cautionaryTale: { name: string; toldIn: string };
    /** Three besetting sins signature to this cell (Phase 44h). */
    besettingSins: [BesettingSin, BesettingSin, BesettingSin];
}
