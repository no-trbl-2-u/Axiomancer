/**
 * cardCodegen — pure Node codegen for the card (Action) editor write-back.
 *
 * Renders a {@link CardDraft} into a `const <ident>: Card = { … };` TypeScript
 * block that matches the hand-authored style of
 * `axiomancer-mechanics/src/Cards/cards.library.ts` (4-space indent, single
 * quotes with smart double-quote fallback, wrapped multi-line descriptions,
 * inline single-element `specialMechanics`, multi-line `combatEffects`), and
 * splices that block into the library file text. Replacing an existing card
 * carries its `// pts:` pricing comment across (phase 69) — replacing an existing card
 * located by `id`, or appending a brand-new one and registering it in the
 * exported `cardLibrary` array.
 *
 * Terminology note: the user-facing editor calls these "Cards" / "Actions".
 * The literal `Card` type name survives only here, where it is the real TS
 * type emitted into the source file.
 *
 * No TS-AST dependency: a string-level, string/comment-aware brace matcher
 * locates each `const … : Card = { … };` block. This module is browser-free
 * and runs in Node (invoked by the Vite dev-server plugin and the round-trip
 * test). It only manipulates STRINGS — it never touches the filesystem itself.
 */
import type { CardDraft } from '../types';

const IND = '    '; // 4-space indent, mirrors cards.library.ts

// ─────────────────────────────────────────────────────────────────────────────
// String literal emitters
// ─────────────────────────────────────────────────────────────────────────────

/** Single-quoted literal, backslash- and single-quote-escaped. */
function strSingle(s: string): string {
    return `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

/**
 * Smart-quoted literal: prefer single quotes, but switch to double quotes when
 * the value contains a `'` and no `"` (matches the source's `"Pascal's Wager"`).
 */
function str(s: string): string {
    if (s.includes("'") && !s.includes('"')) {
        return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
    }
    return strSingle(s);
}

function num(n: number): string {
    return String(n);
}

/** Emit an arbitrary scalar value (string / number / boolean) — objects and
 *  arrays recurse through an inline literal (nested riders on omen/peroration/
 *  reap and the FREE line serialize as real TS object literals). */
function valOf(v: unknown): string {
    if (typeof v === 'string') return str(v);
    if (typeof v === 'number') return num(v);
    if (typeof v === 'boolean') return String(v);
    if (Array.isArray(v)) return `[${v.map(valOf).join(', ')}]`;
    if (v != null && typeof v === 'object') return objLiteral(v as Record<string, unknown>);
    return JSON.stringify(v);
}

/** Inline object literal: `{ k: v, … }` (undefined entries pruned). */
function objLiteral(o: Record<string, unknown>): string {
    const entries = Object.entries(o).filter(([, v]) => v !== undefined);
    return `{ ${entries.map(([k, v]) => `${k}: ${valOf(v)}`).join(', ')} }`;
}

const notBlank = (s: string | undefined | null): boolean =>
    s != null && String(s).trim() !== '';

// ─────────────────────────────────────────────────────────────────────────────
// Identifier derivation: 'slippery-slope' -> 'slipperySlope'
// ─────────────────────────────────────────────────────────────────────────────

const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

export function identFromId(id: string): string {
    const parts = id.trim().split(/[^A-Za-z0-9]+/).filter(Boolean);
    if (parts.length === 0) return 'card';
    const head = parts[0];
    let ident =
        head.charAt(0).toLowerCase() + head.slice(1) + parts.slice(1).map(cap).join('');
    if (/^[0-9]/.test(ident)) ident = 'card' + cap(ident);
    return ident;
}

// ─────────────────────────────────────────────────────────────────────────────
// Field emitters
// ─────────────────────────────────────────────────────────────────────────────

/** Inline effect-payload object: `{ effectId: '…', appliedTo: '…', … }`. */
function effectObj(e: CardDraft['combatEffects'][number]): string {
    const parts = [`effectId: ${str(e.effectId)}`, `appliedTo: ${str(e.appliedTo)}`];
    if (notBlank(e.description)) parts.push(`description: ${str(e.description as string)}`);
    if (e.intensity != null) parts.push(`intensity: ${num(e.intensity)}`);
    if (e.duration != null) parts.push(`duration: ${num(e.duration)}`);
    return `{ ${parts.join(', ')} }`;
}

function combatEffectsLines(effects: CardDraft['combatEffects']): string[] {
    const lines = [`${IND}combatEffects: [`];
    for (const e of effects) lines.push(`${IND}${IND}${effectObj(e)},`);
    lines.push(`${IND}],`);
    return lines;
}

/** Inline mechanic object, `kind` first, remaining keys in insertion order. */
function mechObj(m: Record<string, unknown>): string {
    const entries = Object.entries(m).filter(([, v]) => v !== undefined);
    // stable sort: `kind` to the front, everything else keeps its order
    entries.sort((a, b) => (a[0] === 'kind' ? -1 : b[0] === 'kind' ? 1 : 0));
    return `{ ${entries.map(([k, v]) => `${k}: ${valOf(v)}`).join(', ')} }`;
}

function specialMechanicsLines(mechs: CardDraft['specialMechanics']): string[] {
    if (mechs.length === 1) {
        return [`${IND}specialMechanics: [${mechObj(mechs[0] as Record<string, unknown>)}],`];
    }
    const lines = [`${IND}specialMechanics: [`];
    for (const m of mechs) lines.push(`${IND}${IND}${mechObj(m as Record<string, unknown>)},`);
    lines.push(`${IND}],`);
    return lines;
}

function predicateObj(p: NonNullable<NonNullable<CardDraft['synergy']>['predicate']>): string {
    const parts = [`effectId: ${str(p.effectId)}`, `on: ${str(p.on)}`];
    if (p.intensityMin != null) parts.push(`intensityMin: ${num(p.intensityMin)}`);
    if (p.durationMin != null) parts.push(`durationMin: ${num(p.durationMin)}`);
    return `{ ${parts.join(', ')} }`;
}

/**
 * `synergy: { … }` — emitted GENERICALLY, one key per line.
 *
 * This used to be a hand-written allowlist of seven known keys, so
 * `statePredicate` and `rider` (the REQUIEM-style condition riders) were
 * silently dropped from every card that carried them. A per-key emitter drifts
 * behind the type the moment a field is added; walking the object cannot.
 */
function synergyLines(s: NonNullable<CardDraft['synergy']>): string[] {
    const entries = Object.entries(s as Record<string, unknown>)
        .filter(([, v]) => v !== undefined);
    if (entries.length === 0) return [];
    const lines = [`${IND}synergy: {`];
    for (const [k, v] of entries) {
        // `predicate` keeps its dedicated shape so the emitted source still
        // matches the library's hand-authored formatting.
        if (k === 'predicate' && v != null) {
            lines.push(`${IND}${IND}${k}: ${predicateObj(v as NonNullable<NonNullable<CardDraft['synergy']>['predicate']>)},`);
        } else {
            lines.push(`${IND}${IND}${k}: ${valOf(v)},`);
        }
    }
    lines.push(`${IND}},`);
    return lines;
}

/** Word-wrap the description into the source's `'…' +`-joined multi-line style. */
function descriptionLines(desc: string): string[] {
    const text = (desc ?? '').replace(/\s+/g, ' ').trim();
    const inline = `${IND}description: ${strSingle(text)},`;
    if (inline.length <= 96) return [inline];

    const inner = IND + IND;
    const MAX = 68; // content width per quoted chunk (≈ matches existing lines)
    const words = text.split(' ');
    const chunks: string[] = [];
    let cur = '';
    for (const w of words) {
        const tentative = cur ? `${cur} ${w}` : w;
        if (tentative.length > MAX && cur) {
            chunks.push(`${cur} `); // keep the boundary space inside the quote
            cur = w;
        } else {
            cur = tentative;
        }
    }
    if (cur) chunks.push(cur);

    const lines = [`${IND}description:`];
    chunks.forEach((c, i) => {
        const last = i === chunks.length - 1;
        lines.push(`${inner}${strSingle(c)}${last ? ',' : ' +'}`);
    });
    return lines;
}

// ─────────────────────────────────────────────────────────────────────────────
// serialize — CardDraft -> `const <ident>: Card = { … };`
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Render a draft into a complete `const <ident>: Card = { … };` block.
 * Only set fields are emitted (empty arrays / blank optionals are pruned, just
 * like `fromDraft`), in the canonical `Card` field order. Pass `identOverride`
 * to preserve an existing card's const identifier on replace.
 */
export function serialize(
    draft: CardDraft,
    identOverride?: string,
    preservedComment?: readonly string[],
): string {
    const ident = identOverride ?? identFromId(draft.id);
    const lines: string[] = [];
    lines.push(`const ${ident}: Card = {`);
    lines.push(`${IND}id: ${str(draft.id.trim())},`);
    lines.push(`${IND}name: ${str(draft.name.trim())},`);
    lines.push(`${IND}philosophicalAspect: ${str(draft.philosophicalAspect)},`);
    lines.push(...descriptionLines(draft.description));
    // Spec 32 v3 — tier/rank/cardType share a line, mirroring the library style.
    lines.push(`${IND}tier: ${num(draft.tier)}, rank: ${num(draft.rank)}, cardType: ${str(draft.cardType)},`);
    lines.push(`${IND}targetType: ${str(draft.targetType)},`);
    if (notBlank(draft.theme)) lines.push(`${IND}theme: ${str(draft.theme as string)},`);
    if (notBlank(draft.persistentEffect)) {
        lines.push(`${IND}persistentEffect: ${str(draft.persistentEffect as string)},`);
    }
    if (notBlank(draft.paidSummary)) {
        lines.push(`${IND}paidSummary: ${str(draft.paidSummary as string)},`);
    }
    // The pricing arithmetic (`// pts: …`) is source trivia, not a card field:
    // it is lifted off the block being replaced and re-emitted here, where the
    // library already puts it in 57 of 58 cases (just before `free:`). Phase 69
    // — the codegen used to drop it, deleting a reviewer's only record of how
    // the card's rank was arrived at.
    if (preservedComment?.length) lines.push(...preservedComment);
    // The authored FREE line + die-interaction lines round-trip verbatim.
    if (draft.free != null) lines.push(`${IND}free: ${objLiteral(draft.free as Record<string, unknown>)},`);
    if (draft.threshold != null) lines.push(`${IND}threshold: ${objLiteral(draft.threshold as Record<string, unknown>)},`);
    if (draft.dieBonus != null) lines.push(`${IND}dieBonus: ${objLiteral(draft.dieBonus as Record<string, unknown>)},`);
    if (draft.fate != null) lines.push(`${IND}fate: ${objLiteral(draft.fate as Record<string, unknown>)},`);
    if (draft.fallen != null) lines.push(`${IND}fallen: ${objLiteral(draft.fallen as Record<string, unknown>)},`);
    if (draft.combatEffects?.length) lines.push(...combatEffectsLines(draft.combatEffects));
    if (draft.specialMechanics?.length) {
        lines.push(...specialMechanicsLines(draft.specialMechanics));
    }
    if (draft.synergy != null) lines.push(...synergyLines(draft.synergy));
    if (draft.incrementsFriendship != null) {
        lines.push(`${IND}incrementsFriendship: ${num(draft.incrementsFriendship)},`);
    }
    if (notBlank(draft.addedIn)) lines.push(`${IND}addedIn: ${str(draft.addedIn!.trim())},`);
    if (draft.tags?.length) {
        lines.push(`${IND}tags: [${draft.tags.map((t) => str(t)).join(', ')}],`);
    }
    if (draft.intentionallyAsymmetric != null) {
        lines.push(`${IND}intentionallyAsymmetric: ${String(draft.intentionallyAsymmetric)},`);
    }
    if (draft.glyph != null) {
        lines.push(`${IND}glyph: ${objLiteral(draft.glyph as unknown as Record<string, unknown>)},`);
    }
    lines.push('};');
    return lines.join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// String/comment-aware delimiter matcher + block locator
// ─────────────────────────────────────────────────────────────────────────────

function escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Given the index of an opening `{`/`[`/`(`, return the index of its matching
 * close, skipping string literals (', ", `) and `//` / `/* *\/` comments.
 * Returns -1 if unbalanced.
 */
function matchDelimiter(text: string, openIdx: number): number {
    const open = text[openIdx];
    const close = open === '{' ? '}' : open === '[' ? ']' : ')';
    let depth = 0;
    let quote: string | null = null;
    for (let i = openIdx; i < text.length; i++) {
        const c = text[i];
        if (quote) {
            if (c === '\\') { i++; continue; }
            if (c === quote) quote = null;
            continue;
        }
        if (c === "'" || c === '"' || c === '`') { quote = c; continue; }
        if (c === '/') {
            const n = text[i + 1];
            if (n === '/') {
                const nl = text.indexOf('\n', i);
                if (nl === -1) return -1;
                i = nl;
                continue;
            }
            if (n === '*') {
                const e = text.indexOf('*/', i + 2);
                if (e === -1) return -1;
                i = e + 1;
                continue;
            }
        }
        if (c === open) depth++;
        else if (c === close) {
            depth--;
            if (depth === 0) return i;
        }
    }
    return -1;
}

/**
 * The `// pts:` pricing-arithmetic comment lines inside a card block, as they
 * appear in the source (indent included), or `[]`.
 *
 * A card's pricing comment is one contiguous run of `//` lines led by `// pts:`
 * — the arithmetic often wraps over two or three lines. Anything else in the
 * block that happens to be a comment is left where it is; only the priced run
 * is carried across a rewrite.
 */
export function pricingComment(block: string): string[] {
    const lines = block.split('\n');
    const start = lines.findIndex((l) => /^\s*\/\/\s*pts:/.test(l));
    if (start === -1) return [];
    const out: string[] = [];
    for (let i = start; i < lines.length; i++) {
        if (!/^\s*\/\//.test(lines[i])) break;
        out.push(lines[i].trimEnd());
    }
    return out;
}

interface CardBlock {
    ident: string;
    start: number; // index of 'const'
    end: number;   // index just past the closing '};'
}

/** Locate the `const <ident>: Card = { … };` block whose `id:` equals `id`. */
function findBlockById(text: string, id: string): CardBlock | null {
    const re = /const\s+([A-Za-z_$][\w$]*)\s*:\s*Card\s*=\s*\{/g;
    const idRe = new RegExp(`\\bid:\\s*['"]${escapeRegex(id)}['"]`);
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
        const braceOpen = m.index + m[0].length - 1; // the '{'
        const braceClose = matchDelimiter(text, braceOpen);
        if (braceClose === -1) continue;
        const block = text.slice(m.index, braceClose + 1);
        if (!idRe.test(block)) continue;
        let end = braceClose + 1;
        if (text[end] === ';') end++;
        return { ident: m[1], start: m.index, end };
    }
    return null;
}

/** Find the `[` … `]` span of the exported `cardLibrary` array. */
function findLibraryArray(text: string): { openIdx: number; closeIdx: number } {
    const declRe = /export\s+const\s+cardLibrary\s*:\s*Card\s*\[\s*\]\s*=\s*\[/;
    const m = declRe.exec(text);
    if (!m) {
        throw new Error('cardCodegen: `export const cardLibrary: Card[] = [` not found.');
    }
    const openIdx = text.indexOf('[', m.index + m[0].length - 1);
    const closeIdx = matchDelimiter(text, openIdx);
    if (closeIdx === -1) {
        throw new Error('cardCodegen: unbalanced cardLibrary array brackets.');
    }
    return { openIdx, closeIdx };
}

const lineStartOf = (text: string, pos: number): number =>
    text.lastIndexOf('\n', pos - 1) + 1;

/**
 * Walk upward from `pos` (a line start) over blank lines and, if a `/** … *\/`
 * doc comment directly precedes, return that comment's line start — so a new
 * block is inserted ABOVE the comment, not between it and its declaration.
 */
function backOverDocComment(text: string, pos: number): number {
    let p = pos;
    while (p > 0) {
        const prevLineEnd = p - 1; // the '\n' terminating the previous line
        const prevLineStart = text.lastIndexOf('\n', prevLineEnd - 1) + 1;
        const prevLine = text.slice(prevLineStart, prevLineEnd);
        if (prevLine.trim() === '') { p = prevLineStart; continue; }
        if (prevLine.trim().endsWith('*/')) {
            const cstart = text.lastIndexOf('/**', prevLineEnd);
            if (cstart !== -1) return lineStartOf(text, cstart);
        }
        break;
    }
    return pos;
}

/** Append a member identifier just before the array's closing `]`. */
function addToArray(text: string, ident: string): string {
    const { closeIdx } = findLibraryArray(text);
    const insertAt = lineStartOf(text, closeIdx);
    return `${text.slice(0, insertAt)}${IND}${ident},\n${text.slice(insertAt)}`;
}

/** Remove a member identifier line (with any trailing comment) from the array. */
function removeFromArray(text: string, ident: string): string {
    const { openIdx, closeIdx } = findLibraryArray(text);
    const before = text.slice(0, openIdx);
    const arr = text.slice(openIdx, closeIdx + 1);
    const after = text.slice(closeIdx + 1);
    const lineRe = new RegExp(`^[ \\t]*${escapeRegex(ident)},[^\\n]*\\n`, 'm');
    return before + arr.replace(lineRe, '') + after;
}

// ─────────────────────────────────────────────────────────────────────────────
// upsertCard / removeCard — the public splice operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Insert or replace `draft` in the library file text.
 * - If a block with the same `id` exists, its block is REPLACED in place
 *   (preserving the existing const identifier and array membership).
 * - Otherwise a new block is appended just above the `cardLibrary` array's
 *   doc comment, and its identifier is registered in the array.
 */
export function upsertCard(fileText: string, draft: CardDraft): string {
    const id = draft.id.trim();
    if (id === '') throw new Error('cardCodegen.upsertCard: draft.id is required.');

    const found = findBlockById(fileText, id);
    if (found) {
        const previous = fileText.slice(found.start, found.end);
        const block = serialize(draft, found.ident, pricingComment(previous));
        return fileText.slice(0, found.start) + block + fileText.slice(found.end);
    }

    const ident = identFromId(id);
    const block = serialize(draft, ident);
    const { openIdx } = findLibraryArray(fileText);
    const declLineStart = lineStartOf(fileText, openIdx);
    const insertAt = backOverDocComment(fileText, declLineStart);
    const withBlock =
        fileText.slice(0, insertAt) + block + '\n\n' + fileText.slice(insertAt);
    return addToArray(withBlock, ident);
}

/** Remove a card's block AND its `cardLibrary` array membership by `id`. */
export function removeCard(fileText: string, id: string): string {
    const found = findBlockById(fileText, id.trim());
    if (!found) return fileText;

    let end = found.end;
    while (end < fileText.length && (fileText[end] === '\n' || fileText[end] === '\r')) {
        end++; // also consume the blank-line separator that followed the block
    }
    const withoutBlock = fileText.slice(0, found.start) + fileText.slice(end);
    return removeFromArray(withoutBlock, found.ident);
}
