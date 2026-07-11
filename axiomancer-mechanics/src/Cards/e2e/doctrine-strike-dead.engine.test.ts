/**
 * Doctrine witness — THE STRIKE IS DEAD (spec 32 v3 §1 / §12; WS0.1 + WS0.4,
 * `plan/tuning/2026-07-11-card-library-improvement-plan-detailed.md`).
 *
 * Three witnesses, one law: no card deals raw enemy-HP damage. Enemy HP falls
 * only through status-gated payoffs, ratified enchant-gated drips, reflect,
 * and the alternate-outcome consequence — never because a spell "hit".
 *
 *   1. CARDS — every one of the 70 library cards' PAID line is played into a
 *      CLEAN board (enemy with zero effects/marks, guard/barrier 0, Souls 0,
 *      reserve pips 0, full HP). With every printed payoff prerequisite
 *      zeroed — stacks, souls, banked pips — every doctrinally legal
 *      payoff (RUPTURE fuel 0, REAP 0 souls, tick nothing) must chip NOTHING:
 *      `after.enemy.health === before.enemy.health`, no exceptions beyond the
 *      spec 32 §12 ratified list (currently empty). Allowed deltas remain
 *      status APPLICATION, reflect setup, alt-win progress, draws, guard.
 *   2. SIGNATURES — every entry in `SIGNATURE_SKILLS` is applied with its
 *      prerequisites synthesized (enemy stacks for Conclusion); only the
 *      ratified kinds (`conclude`, `mercy`) may change enemy HP.
 *   3. VOCABULARY — the engine + signature sources are read from disk and
 *      every line containing "strike" must match a ratified-exception
 *      allowlist enumerated below. New strike vocabulary fails loudly.
 *
 * ── WS0.1 frozen inventory — every enemy-directed `applyDamage` site ─────────
 * `applyDamage` lives in `src/Combat/health.ts:12` (pure, zero-clamped). The
 * engine has 24 call sites, `combat.signature.ts` two more. Line anchors are
 * the 2026-07-11 working tree (branch HEAD) and WILL drift — they are
 * starting points for a re-grep, not addresses. Classification:
 *
 * | Class | Sites (enemy-directed, combat.engine.ts unless noted) |
 * |---|---|
 * | (a) status-gated payoff — doctrinally legal | :643 fate-tap DoT tick ·
 * |   :920/:928 rider ticks · :941 mark-conclusion RUPTURE (capped) ·
 * |   :1523 RUPTURE (capped) · :1539 WINNOWING consume · :1584 REAP-ALL
 * |   (capped) · :1899/:1912/:1923 fired-rider ticks · :2306 BACKFIRE
 * |   per-rung · :2378 RIPOSTE · :2387 THORNS · :2546 suppurating-curse DoT
 * |   amp · :2560 VULNERABLE surcharge |
 * | (b) enchant-gated drips — sanctioned by spec 32 §12 A5 | :754/:1415
 * |   bone-orchard per-Soul · :1431 stuck-in-their-head echo drip ·
 * |   :2438 crumbling-resolve wall upkeep |
 * | (c) alternate-outcome consequence | :2949 mercy-exploit
 * |   `max(10, 0.5 × maxHP)` (Phase 108 — legal only from the mercy screen) |
 * | (d) signature | combat.signature.ts:158 Conclusion per-stack
 * |   (`CONCLUDE_DMG_PER_STACK = 2`, :96) · :190-191 the strike/mercy HP
 * |   branch |
 * | (e) legacy contradiction | engine header line 7 + comment block ~75; the
 * |   `strike` kind arm (combat.signature.ts:189-197) + `STRIKE_DAMAGE_MULT
 * |   = 3` (:93) — NO shipped signature has kind `strike` (plan §0.1 C-4) |
 * | player-directed (not doctrine-relevant) | :1313 fate recoil · :1447
 * |   RECOIL · :2341 enemy attack |
 *
 * WS0.2 ([owner-call], pending) ratifies classes (a)-(d) in spec 32 §12 and
 * DELETES class (e) — the `strike` signature arm, `STRIKE_DAMAGE_MULT`, and
 * the `'strike'` member of `SignatureSkillKind`. When that lands, the class-e
 * allowlist entries and presence witnesses below shrink to zero.
 *
 * Fixture/RNG conventions follow `card-effectiveness.engine.test.ts` (shared
 * builder in `src/test-utils/card-fixture.ts`, `mockSequentialRng(0.5)`,
 * `vi.restoreAllMocks()` in afterEach).
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, it, expect, afterEach, vi } from 'vitest';

import { mockSequentialRng } from '../../test-utils/rng';
import { buildFixtureState } from '../../test-utils/card-fixture';
import { playCombatCard } from '../../Combat/combat.engine';
import { SIGNATURE_SKILL_LIST, applySignatureSkill } from '../../Combat/combat.signature';
import { cardLibrary } from '../cards.library';

afterEach(() => vi.restoreAllMocks());

// ── Ratified exceptions ───────────────────────────────────────────────────────
// Hardcoded copy of spec 32 §12's ratified card-level direct-HP exception list.
// EMPTY today: no library card is ratified to chip a clean enemy (the class-b
// drips are enchant-ZONE-gated and a clean state has no zones populated).
// WS0.2's owner session is the only thing that may grow this list.
const RATIFIED_SPEC32_S12_CARD_EXCEPTIONS: readonly string[] = [];

// Cards allowed to change enemy HP on the clean board, with the reason.
// REQUIRED to mirror the ratified list above — an entry here that is not in
// the §12 copy fails loudly (see the subset assertion below). Expected
// content today: empty.
const NAMED_EXCEPTIONS: Readonly<Record<string, string>> = {};

// Signature kinds ratified to change enemy HP (WS0.2 proposed text): Conclusion
// fires per status stack (`conclude`); Disarming Plea's flat-magnitude chip
// (`mercy`) is a signature-only exception pending the owner's keep/re-payload
// call. `strike` is NOT here — it is class-e dead vocabulary.
const RATIFIED_HP_SIGNATURE_KINDS: ReadonlySet<string> = new Set(['conclude', 'mercy']);

// ── Witness 1: the 70 cards chip nothing on a clean board ────────────────────

function playPaidClean(cardId: string) {
    mockSequentialRng(0.5); // neutral d20 (no fumble/crit)
    const before = {
        ...buildFixtureState({ clean: true }),
        hand: [{ uid: 'under-test', cardId }],
    };
    const { state: after } = playCombatCard(before, { uid: 'under-test' }, true);
    return { before, after };
}

describe('doctrine witness — no card PAID line chips a clean enemy', () => {
    it('the coverage universe is the 70-card themed library (spec 32 v3 §7)', () => {
        expect(cardLibrary.length).toBe(70);
    });

    it('NAMED_EXCEPTIONS is a subset of the ratified spec 32 §12 list (unratified exceptions fail loudly)', () => {
        for (const cardId of Object.keys(NAMED_EXCEPTIONS)) {
            expect(
                RATIFIED_SPEC32_S12_CARD_EXCEPTIONS,
                `${cardId} is excepted in this test but NOT ratified in spec 32 §12 — that is a doctrine breach, not a fixture problem`,
            ).toContain(cardId);
        }
    });

    const cleanCases = cardLibrary
        .filter(c => !(c.id in NAMED_EXCEPTIONS))
        .map(c => [c.id] as const);

    it.each(cleanCases)(
        "'%s' PAID line leaves clean-enemy HP untouched (status/reflect/alt-win/draw/guard deltas are fine; HP is not)",
        (cardId) => {
            const { before, after } = playPaidClean(cardId);
            expect(
                after.enemy.health,
                `${cardId}: enemy HP moved ${before.enemy.health} -> ${after.enemy.health} on a ZERO-stack, `
                + 'zero-soul, zero-pip board — that is direct damage, i.e. a strike in disguise (spec 32 v3 §1)',
            ).toBe(before.enemy.health);
        },
    );

    it('every card is accounted for exactly once (clean cases + named exceptions == 70, no silent drops)', () => {
        expect(cleanCases.length + Object.keys(NAMED_EXCEPTIONS).length).toBe(cardLibrary.length);
    });
});

// ── Witness 2: only ratified signature kinds change enemy HP ─────────────────

describe('doctrine witness — signature skills', () => {
    it("no shipped signature carries kind 'strike' (plan §0.1 C-4 — the arm is dead vocabulary)", () => {
        expect(SIGNATURE_SKILL_LIST.some(s => s.kind === 'strike')).toBe(false);
    });

    const sigCases = SIGNATURE_SKILL_LIST.map(s => [s.id, s.kind] as const);

    it.each(sigCases)(
        "'%s' (kind %s) changes enemy HP iff its kind is ratified (conclude/mercy)",
        (skillId) => {
            mockSequentialRng(0.5);
            const skill = SIGNATURE_SKILL_LIST.find(s => s.id === skillId)!;
            // RICH fixture = prerequisites synthesized: the enemy carries real
            // stacks (poison/bleed/mark, 9 total intensity), so Conclusion's
            // per-stack read is live and a zero-stack degenerate max(1, …)
            // chip cannot mask a doctrine breach as "just the floor".
            const before = buildFixtureState();
            const { state: after } = applySignatureSkill(before, skill, () => 0.5);
            const hpChanged = after.enemy.health !== before.enemy.health;
            expect(
                hpChanged,
                `${skill.id} (kind '${skill.kind}'): enemy HP ${before.enemy.health} -> ${after.enemy.health} — `
                + (RATIFIED_HP_SIGNATURE_KINDS.has(skill.kind)
                    ? 'a ratified HP kind must actually chip with prerequisites synthesized'
                    : 'only conclude/mercy are ratified to touch enemy HP (spec 32 §12 / WS0.2)'),
            ).toBe(RATIFIED_HP_SIGNATURE_KINDS.has(skill.kind));
        },
    );
});

// ── Witness 3: mechanized strike-vocabulary sweep ────────────────────────────
// Reads the two combat sources from disk (same source-lint pattern as
// `curated-library.engine.test.ts`) and requires every line containing
// "strike" to match a ratified-exception pattern below. The scan is a
// case-insensitive SUBSTRING (deliberately stricter than the plan's
// /\bstrike\b/i: the underscore in `STRIKE_DAMAGE_MULT` is a word character,
// so a \b regex would let the class-e constant slip through unswept).
//
// Class (e) entries — the dead `strike` signature arm and
// `STRIKE_DAMAGE_MULT` — still exist PRE-ratification. WS0.2 deletes them;
// when it lands, remove every entry marked `class: 'e'` (and the presence
// witnesses) so the live-code allowlist shrinks to zero.

interface StrikeAllowance {
    /** Matched against the offending line; content-keyed so line drift is harmless. */
    readonly pattern: RegExp;
    /** a-e per the WS0.1 inventory above; 'doc' = doctrine/history comment. */
    readonly class: 'a' | 'b' | 'c' | 'd' | 'e' | 'doc';
    readonly why: string;
}

const ENGINE_ALLOWED: readonly StrikeAllowance[] = [
    { pattern: /raw strike is the weak/i, class: 'e', why: 'engine header line ~7 — WS0.2 rewrites it to status-first' },
    { pattern: /now scale the strike's HP damage/i, class: 'e', why: 'read-tuning banner ~75 — WS0.2 rewrites' },
    { pattern: /Strike-damage multipliers/i, class: 'e', why: 'READ_DAMAGE_MULT doc comment' },
    { pattern: /the strike was purged from the/i, class: 'doc', why: 'spec 32 v3 §1 purge note (DIRECT_DAMAGE_WEIGHT is DEAD)' },
    { pattern: /no immediate-strike path/i, class: 'doc', why: 'spec 32 v3 §1 purge note, second line' },
    { pattern: /Strike\/defend keep the flat/i, class: 'doc', why: 'stance-extension doc comment' },
    { pattern: /strike any more\)/i, class: 'doc', why: 'STANCE-KEYED vulnerability comment ~1245' },
    { pattern: /heavy strike that may finish/i, class: 'c', why: 'mercy-exploit doc comment' },
    { pattern: /free heavy strike \(Phase 108\)/i, class: 'c', why: 'mercy-exploit inline comment' },
    { pattern: /const strike = Math\.max\(10, Math\.round\(state\.enemy\.maxHealth \* 0\.5\)\)/, class: 'c', why: 'mercy-exploit magnitude — alternate-outcome consequence, mercy screen only' },
    { pattern: /applyDamage\(state\.enemy, strike\)/, class: 'c', why: 'mercy-exploit applies its consequence' },
    { pattern: /amount: strike \}/, class: 'c', why: 'mercy-exploit damage-dealt event' },
    { pattern: /immediate-strike number any more/i, class: 'doc', why: 'cardDieCostPreview doc — amount is always 0' },
    { pattern: /strike is dead/i, class: 'doc', why: 'the doctrine, by name' },
];

const SIGNATURE_ALLOWED: readonly StrikeAllowance[] = [
    { pattern: /sig-conviction-strike/i, class: 'doc', why: "id/name only — the skill's KIND is 'dot' (poison applier), not strike (plan §0.1 C-4)" },
    { pattern: /and strike, softening it toward mercy/i, class: 'd', why: "Disarming Plea flavour copy (kind 'mercy')" },
    { pattern: /strike-class signature/i, class: 'e', why: 'STRIKE_DAMAGE_MULT doc comment — WS0.2 deletes' },
    { pattern: /STRIKE_DAMAGE_MULT/, class: 'e', why: 'the dead constant (decl + sole use) — WS0.2 deletes' },
    { pattern: /case 'strike':/, class: 'e', why: 'the unreachable kind arm — WS0.2 deletes' },
    { pattern: /'strike'\/'mercy' also hit HP/, class: 'e', why: 'kind-arm comment — WS0.2 deletes' },
    { pattern: /strike = a heavy bleeding blow/i, class: 'e', why: 'kind-arm comment — WS0.2 deletes' },
    { pattern: /skill\.kind === 'strike'/, class: 'e', why: 'kind-arm guards (three sites) — WS0.2 deletes' },
    { pattern: /BODY strike/i, class: 'e', why: 'kind-arm comment — WS0.2 deletes' },
    { pattern: /for strike\/draw/i, class: 'e', why: 'refreshDraftedDie doc — WS0.2 rewords to draw-only' },
];

function sweepSource(label: string, absPath: string, allowed: readonly StrikeAllowance[]): void {
    const lines = readFileSync(absPath, 'utf8').split('\n');
    const offenders: string[] = [];
    const used = new Set<RegExp>();
    lines.forEach((line, i) => {
        if (!/strike/i.test(line)) return;
        const hit = allowed.find(a => a.pattern.test(line));
        if (hit) used.add(hit.pattern);
        else offenders.push(`${label}:${i + 1}: ${line.trim()}`);
    });
    expect(
        offenders,
        `unratified strike vocabulary in ${label} — either delete it or get it ratified into spec 32 §12 (then allowlist it here with its class)`,
    ).toEqual([]);
    // Stale-entry guard: every allowance must still earn its keep, so WS0.2's
    // deletions force this list to shrink instead of silently re-permitting.
    for (const a of allowed) {
        expect(used.has(a.pattern), `${label}: allowlist entry ${a.pattern} (class ${a.class} — ${a.why}) matched nothing; remove it`).toBe(true);
    }
}

describe('doctrine witness — strike-vocabulary sweep (mechanized grep)', () => {
    const enginePath = resolve(__dirname, '..', '..', 'Combat', 'combat.engine.ts');
    const signaturePath = resolve(__dirname, '..', '..', 'Combat', 'combat.signature.ts');

    it('combat.engine.ts carries no unratified strike vocabulary', () => {
        sweepSource('combat.engine.ts', enginePath, ENGINE_ALLOWED);
    });

    it('combat.signature.ts carries no unratified strike vocabulary', () => {
        sweepSource('combat.signature.ts', signaturePath, SIGNATURE_ALLOWED);
    });

    it('pre-ratification witnesses: the class-e vocabulary still exists (WS0.2 deletes it — then DELETE this test and the class-e allowances)', () => {
        const src = readFileSync(signaturePath, 'utf8');
        expect(src).toMatch(/const STRIKE_DAMAGE_MULT = 3/);
        expect(src).toMatch(/case 'strike': \{/);
    });
});
