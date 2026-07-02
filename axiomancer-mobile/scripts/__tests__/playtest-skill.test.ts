/**
 * Hermetic structural tests — `skills/playtest.md` deliverable
 * contract (Phase 67 Tick A).
 *
 * The /playtest skill is markdown the Claude harness reads.
 * These tests don't exercise the skill's runtime behavior
 * (live Playwright drives are observation work, not
 * verification) — they pin the skill file's structural
 * contract so accidental deletion / drift of the canonical
 * sections surfaces here, not in the field on next run.
 */

import { describe, expect, it } from '@jest/globals';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const SKILL_PATH = resolve(__dirname, '..', '..', 'skills', 'playtest.md');

describe('skills/playtest.md: file + structural sections', () => {
    it('file exists', () => {
        expect(existsSync(SKILL_PATH)).toBe(true);
    });

    it('starts with the canonical skill header', () => {
        const body = readFileSync(SKILL_PATH, 'utf8');
        expect(body.startsWith('# Skill: playtest')).toBe(true);
    });

    const REQUIRED_SECTIONS = [
        '## 1. Purpose',
        '## 2. Invocation',
        '## 3. Prereqs',
        '## 4. The canonical walk',
        '## 5. What gets surfaced',
        '## 6. Procedure',
        '## 7. Hard rules',
        '## 8. Failure modes',
        '## 9. Quick reference',
    ];

    it.each(REQUIRED_SECTIONS)('contains the canonical section "%s"', (section) => {
        const body = readFileSync(SKILL_PATH, 'utf8');
        expect(body).toContain(section);
    });
});

describe('skills/playtest.md: AUDIT row template + contract', () => {
    const body = readFileSync(SKILL_PATH, 'utf8');

    it('documents the AUDIT row template under §5', () => {
        // The template block is what makes findings filable in a
        // shape /iterate can consume; if the template drifts, the
        // skill's output would too.
        expect(body).toContain('### AUDIT row template');
        // Required fields the template must enumerate so callers
        // know what to fill in.
        expect(body).toContain('category:');
        expect(body).toContain('impact:');
        expect(body).toContain('observed:');
        expect(body).toContain('next:');
        expect(body).toContain('source: live-drive playtest');
    });

    it('enumerates the canonical walk steps that future runs follow', () => {
        // Pin the specific clicks / snapshots that compose the
        // canonical walk. If a future edit removes a step (e.g.
        // drops the NEXT ROUND tap), the playtest stops covering
        // the [9.5] Next Round regression class.
        const walkBeats = [
            'Navigate',
            'Snapshot the exploration screen',
            'Walk to an encounter node',
            'Tap the encounter step-card',
            'Tap FIGHT',
            'Pick a stance',
            'Tap ATTACK',
            'Tap NEXT ROUND',
            'Read console messages',
            'Close the browser',
        ];
        for (const beat of walkBeats) {
            expect(body).toContain(beat);
        }
    });

    it('mentions the prereq + opt-in design (no autostart)', () => {
        // The skill must NOT promise to start the dev server —
        // that's a hard rule in §7 and a chicken-and-egg constraint
        // documented in the brief.
        expect(body).toContain('Never start the dev server');
        expect(body).toContain('user-started `pnpm web`');
    });
});
