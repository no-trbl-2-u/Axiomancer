/**
 * Hermetic e2e — agent Vitest reporter (Phase 39).
 *
 * Drives `automation/agent-vitest-reporter.mjs` with structurally
 * minimal stand-ins for Vitest's TestModule / TestCase objects. The
 * reporter only touches a small slice of the public API
 * (`children.allTests()`, `moduleId`, `ok()`, `state()`,
 * `diagnostic()` on the module; `fullName`, `result()`, `diagnostic()`
 * on each test case), so the stubs stay tiny.
 *
 * Tests cover:
 *   - JSON shape + markdown delimiters for a 2-file, 3-test run with
 *     one failure (golden path).
 *   - Failure block carries `location` parsed from the first stack
 *     frame.
 *   - Empty run produces a valid report with all-zero rollup.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';

// @ts-ignore — .mjs file outside the TS module graph; import for runtime only.
import AgentVitestReporter from '../../../automation/agent-vitest-reporter.mjs';

type TestStatus = 'passed' | 'failed' | 'skipped' | 'pending';

interface StubCase {
    fullName: string;
    result: () => { state: TestStatus; errors?: unknown[] };
    diagnostic: () => { duration: number };
}

interface StubModule {
    moduleId: string;
    children: { allTests: () => Iterable<StubCase> };
    state: () => 'passed' | 'failed' | 'skipped' | 'queued';
    ok: () => boolean;
    diagnostic: () => { duration: number };
}

const tmpFiles: string[] = [];
function tmpPath(): string {
    const p = path.join(os.tmpdir(), `axiomancer-verify-${randomUUID()}.json`);
    tmpFiles.push(p);
    return p;
}

afterEach(() => {
    while (tmpFiles.length > 0) {
        const f = tmpFiles.pop();
        if (f) { try { fs.unlinkSync(f); } catch { /* ignore */ } }
    }
});

interface StubStream {
    written: string;
    write(chunk: string): boolean;
}

function makeStream(): StubStream {
    return {
        written: '',
        write(chunk: string): boolean { this.written += chunk; return true; },
    };
}

function passingCase(name: string, durationMs: number): StubCase {
    return {
        fullName: name,
        result: () => ({ state: 'passed', errors: [] }),
        diagnostic: () => ({ duration: durationMs }),
    };
}

function failingCase(
    name: string,
    message: string,
    location?: { file: string; line: number; column: number },
    snapshotDiff?: { diff?: string; actual?: string; expected?: string },
): StubCase {
    const stacks = location ? [{ method: '', ...location }] : undefined;
    return {
        fullName: name,
        result: () => ({ state: 'failed', errors: [{ message, stacks, ...snapshotDiff }] }),
        diagnostic: () => ({ duration: 5 }),
    };
}

function makeModule(opts: { absPath: string; cases: StubCase[]; durationMs: number; ok: boolean; state: 'passed' | 'failed' | 'skipped' }): StubModule {
    return {
        moduleId: opts.absPath,
        children: { allTests: () => opts.cases.values() },
        state: () => opts.state,
        ok: () => opts.ok,
        diagnostic: () => ({ duration: opts.durationMs }),
    };
}

describe('AgentVitestReporter — golden path', () => {
    it('writes the documented JSON shape and a delimited markdown block', async () => {
        const rootDir = process.cwd();
        const jsonPath = tmpPath();
        const stream = makeStream();

        const fileA = path.join(rootDir, 'src/A/e2e/a.engine.test.ts');
        const fileB = path.join(rootDir, 'src/B/e2e/b.engine.test.ts');

        const modules: StubModule[] = [
            makeModule({
                absPath: fileA,
                durationMs: 12,
                ok: true,
                state: 'passed',
                cases: [
                    passingCase('Alpha > does the thing', 7),
                    passingCase('Alpha > does the slow thing', 42),
                ],
            }),
            makeModule({
                absPath: fileB,
                durationMs: 18,
                ok: false,
                state: 'failed',
                cases: [
                    failingCase('Beta > fails as expected', 'expected 1 to be 2', {
                        file: fileB,
                        line: 17,
                        column: 9,
                    }),
                ],
            }),
        ];

        const reporter = new AgentVitestReporter({
            jsonOutputPath: jsonPath,
            markdownStream: stream,
            rootDir,
        });
        await reporter.onTestRunEnd(modules, [], 'failed');

        const raw = fs.readFileSync(jsonPath, 'utf-8');
        const parsed = JSON.parse(raw);

        expect(parsed.rollup.total).toBe(3);
        expect(parsed.rollup.passed).toBe(2);
        expect(parsed.rollup.failed).toBe(1);
        expect(parsed.rollup.skipped).toBe(0);
        expect(parsed.rollup.reason).toBe('failed');
        expect(parsed.rollup.unhandledErrors).toBe(0);
        expect(parsed.rollup.slowest5.length).toBe(2);
        expect(parsed.rollup.slowest5[0].name).toBe('Alpha > does the slow thing');
        expect(parsed.rollup.slowest5[0].durationMs).toBe(42);

        expect(parsed.files.length).toBe(2);
        expect(parsed.files[0].path).toBe('src/A/e2e/a.engine.test.ts');
        expect(parsed.files[0].status).toBe('passed');
        expect(parsed.files[0].tests).toHaveLength(2);
        expect(parsed.files[1].path).toBe('src/B/e2e/b.engine.test.ts');
        expect(parsed.files[1].status).toBe('failed');
        expect(parsed.files[1].tests[0].failure.message).toBe('expected 1 to be 2');
        expect(parsed.files[1].tests[0].failure.location).toBe(`${fileB}:17:9`);

        expect(stream.written).toContain('## Verify summary');
        expect(stream.written).toContain('- total: 3');
        expect(stream.written).toContain('- passed: 2');
        expect(stream.written).toContain('- failed: 1');
        expect(stream.written).toContain('- reason: failed');
        expect(stream.written).toContain('### Failed tests');
        expect(stream.written).toContain(`${fileB}:17:9 — Beta > fails as expected: expected 1 to be 2`);
        expect(stream.written).toContain('### Slowest 5 (passed)');
        expect(stream.written).toContain('42ms — src/A/e2e/a.engine.test.ts: Alpha > does the slow thing');
        expect(stream.written).toContain('## End summary');

        const start = stream.written.indexOf('## Verify summary');
        const end = stream.written.indexOf('## End summary');
        expect(start).toBeGreaterThan(-1);
        expect(end).toBeGreaterThan(start);
    });
});

describe('AgentVitestReporter — durationMs precision (iterate AUDIT row)', () => {
    it('rounds fractional Vitest durations to integer milliseconds in JSON', async () => {
        const rootDir = process.cwd();
        const jsonPath = tmpPath();
        const stream = makeStream();

        const fileD = path.join(rootDir, 'src/D/e2e/d.engine.test.ts');

        // Stub a TestCase whose diagnostic returns a non-integer duration
        // (Vitest emits raw floats like `66.41922499999987`).
        const fractionalCase: StubCase = {
            fullName: 'Delta > fractional duration',
            result: () => ({ state: 'passed', errors: [] }),
            diagnostic: () => ({ duration: 66.41922499999987 }),
        };

        const modules: StubModule[] = [
            makeModule({
                absPath: fileD,
                durationMs: 12.7,   // module-level fractional too
                ok: true,
                state: 'passed',
                cases: [fractionalCase],
            }),
        ];

        const reporter = new AgentVitestReporter({
            jsonOutputPath: jsonPath,
            markdownStream: stream,
            rootDir,
        });
        await reporter.onTestRunEnd(modules, [], 'passed');

        const parsed = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

        // Test-level durationMs is rounded.
        expect(parsed.files[0].tests[0].durationMs).toBe(66);
        // File-level durationMs is rounded.
        expect(parsed.files[0].durationMs).toBe(13);
        // slowest5 inherits the rounded test entry.
        expect(parsed.rollup.slowest5[0].durationMs).toBe(66);
        // Every emitted durationMs is an integer (no float noise leaks).
        expect(Number.isInteger(parsed.files[0].tests[0].durationMs)).toBe(true);
        expect(Number.isInteger(parsed.files[0].durationMs)).toBe(true);
        expect(Number.isInteger(parsed.rollup.slowest5[0].durationMs)).toBe(true);
    });
});

describe('AgentVitestReporter — failure block details', () => {
    it('omits the location field when the error has no stack', async () => {
        const rootDir = process.cwd();
        const jsonPath = tmpPath();
        const stream = makeStream();

        const fileC = path.join(rootDir, 'src/C/e2e/c.engine.test.ts');
        const modules: StubModule[] = [
            makeModule({
                absPath: fileC,
                durationMs: 5,
                ok: false,
                state: 'failed',
                cases: [failingCase('Gamma > stackless fail', 'boom')],
            }),
        ];

        const reporter = new AgentVitestReporter({
            jsonOutputPath: jsonPath,
            markdownStream: stream,
            rootDir,
        });
        await reporter.onTestRunEnd(modules, [], 'failed');

        const parsed = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
        expect(parsed.files[0].tests[0].failure.message).toBe('boom');
        expect(parsed.files[0].tests[0].failure.location).toBeUndefined();
        expect(stream.written).toContain('- src/C/e2e/c.engine.test.ts — Gamma > stackless fail: boom');
    });
});

describe('AgentVitestReporter — empty run', () => {
    it('writes a valid report with all-zero rollup and no failure block', async () => {
        const rootDir = process.cwd();
        const jsonPath = tmpPath();
        const stream = makeStream();

        const reporter = new AgentVitestReporter({
            jsonOutputPath: jsonPath,
            markdownStream: stream,
            rootDir,
        });
        await reporter.onTestRunEnd([], [], 'passed');

        const parsed = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
        expect(parsed.rollup).toEqual({
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            reason: 'passed',
            unhandledErrors: 0,
            slowest5: [],
            slowestFailures: [],
            diff: null,
            callouts: [],
        });
        expect(parsed.files).toEqual([]);
        expect(parsed.failures).toEqual([]);

        expect(stream.written).toContain('## Verify summary');
        expect(stream.written).toContain('- total: 0');
        expect(stream.written).not.toContain('### Failed tests');
        expect(stream.written).not.toContain('### Slowest 5 (passed)');
        expect(stream.written).not.toContain('### Slowest 5 (failed / skipped)');
        expect(stream.written).not.toContain('### Changes since last run');
        expect(stream.written).not.toContain('### Call-outs');
        expect(stream.written).toContain('## End summary');
    });
});

describe('AgentVitestReporter — per-test source location (iterate, Phase 39 self-critique)', () => {
    it('stamps `tests[].location` undefined when the testCase is a synthetic stub (runner returns nothing)', async () => {
        // The reporter wires experimental_getRunnerTask + the
        // includeTaskLocation: true config flag (vitest.config.ts) so live
        // runs populate `tests[].location` with `file:line:col`. Synthetic
        // stubs in this file don't expose runner tasks; the helper
        // try/catches and yields undefined. Pin that fallback.
        const rootDir = process.cwd();
        const jsonPath = tmpPath();
        const stream = makeStream();
        const fileA = path.join(rootDir, 'src/A/e2e/a.engine.test.ts');

        const reporter = new AgentVitestReporter({
            jsonOutputPath: jsonPath, markdownStream: stream, rootDir,
        });
        await reporter.onTestRunEnd([
            makeModule({
                absPath: fileA, durationMs: 5, ok: true, state: 'passed',
                cases: [passingCase('Alpha > ok', 3)],
            }),
        ], [], 'passed');

        const parsed = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
        expect(parsed.files[0].tests[0].location).toBeUndefined();
        // The presence of the key itself is fine (it's serialised) — the
        // value is what consumers check. Reporter never crashes when the
        // runner-task lookup throws for a non-vitest test object.
    });
});

describe('AgentVitestReporter — callouts[] heuristics (iterate, Phase 39 self-critique)', () => {
    it('precomputes failure-count, skipped-count, slow-test and diff-aware call-outs', async () => {
        const rootDir = process.cwd();
        const jsonPath = tmpPath();
        const stream = makeStream();
        const fileA = path.join(rootDir, 'src/A/e2e/a.engine.test.ts');
        const fileB = path.join(rootDir, 'src/B/e2e/b.engine.test.ts');

        // Plant a prior report so the diff-aware callouts fire too.
        const prior = {
            rollup: { total: 1, passed: 1, failed: 0, skipped: 0, reason: 'passed', unhandledErrors: 0, slowest5: [] },
            failures: [],
            files: [{
                path: 'src/A/e2e/a.engine.test.ts',
                status: 'passed',
                durationMs: 1,
                tests: [{ name: 'Alpha > steady', status: 'passed', durationMs: 1 }],
            }],
        };
        fs.writeFileSync(jsonPath, JSON.stringify(prior, null, 2));

        const reporter = new AgentVitestReporter({
            jsonOutputPath: jsonPath, markdownStream: stream, rootDir,
        });
        await reporter.onTestRunEnd([
            makeModule({
                absPath: fileA, durationMs: 80, ok: false, state: 'failed',
                cases: [
                    passingCase('Alpha > steady', 1),
                    failingCase('Alpha > broken now', 'fresh fail', { file: fileA, line: 9, column: 1 }),
                    passingCase('Alpha > slow', 75),
                ],
            }),
            makeModule({
                absPath: fileB, durationMs: 5, ok: true, state: 'skipped',
                cases: [{
                    fullName: 'Bravo > paused',
                    result: () => ({ state: 'skipped' }),
                    diagnostic: () => ({ duration: 0 }),
                }],
            }),
        ], [], 'failed');

        const parsed = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
        const c = parsed.rollup.callouts;
        expect(c).toContain('1 test failed (top file: src/A/e2e/a.engine.test.ts)');
        expect(c).toContain('1 test skipped');
        expect(c).toContain('1 test exceeded 50ms');
        // diff-aware: Alpha > broken now and Alpha > slow + Bravo > paused are new vs prior.
        expect(c.some((s: string) => /\d+ tests? added since last report/.test(s))).toBe(true);
        // markdown subsection renders.
        expect(stream.written).toContain('### Call-outs');
        expect(stream.written).toContain('- 1 test failed (top file: src/A/e2e/a.engine.test.ts)');
    });

    it('emits an empty callouts list when nothing is notable', async () => {
        const rootDir = process.cwd();
        const jsonPath = tmpPath();
        const stream = makeStream();
        const fileA = path.join(rootDir, 'src/A/e2e/a.engine.test.ts');

        const reporter = new AgentVitestReporter({
            jsonOutputPath: jsonPath, markdownStream: stream, rootDir,
        });
        await reporter.onTestRunEnd([
            makeModule({
                absPath: fileA, durationMs: 5, ok: true, state: 'passed',
                cases: [passingCase('Alpha > ok', 3)],
            }),
        ], [], 'passed');

        const parsed = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
        expect(parsed.rollup.callouts).toEqual([]);
        expect(stream.written).not.toContain('### Call-outs');
    });
});

describe('AgentVitestReporter — slowestFailures (iterate, Phase 39 self-critique)', () => {
    it('surfaces failing / skipped tests in a parallel slowest-5 list with status preserved', async () => {
        const rootDir = process.cwd();
        const jsonPath = tmpPath();
        const stream = makeStream();
        const fileA = path.join(rootDir, 'src/A/e2e/a.engine.test.ts');
        const fileB = path.join(rootDir, 'src/B/e2e/b.engine.test.ts');

        // A passing-and-fast test (should NOT appear in slowestFailures),
        // a failing-and-slow test (should be first), a skipped-but-mid test.
        const slowFail: StubCase = {
            fullName: 'Bravo > timed out',
            result: () => ({ state: 'failed', errors: [{ message: 'timeout', stacks: [{ method: '', file: fileB, line: 1, column: 1 }] }] }),
            diagnostic: () => ({ duration: 250 }),
        };
        const skipped: StubCase = {
            fullName: 'Bravo > skipped for now',
            result: () => ({ state: 'skipped' }),
            diagnostic: () => ({ duration: 30 }),
        };

        const reporter = new AgentVitestReporter({
            jsonOutputPath: jsonPath, markdownStream: stream, rootDir,
        });
        await reporter.onTestRunEnd([
            makeModule({
                absPath: fileA, durationMs: 5, ok: true, state: 'passed',
                cases: [passingCase('Alpha > snappy', 3)],
            }),
            makeModule({
                absPath: fileB, durationMs: 280, ok: false, state: 'failed',
                cases: [slowFail, skipped],
            }),
        ], [], 'failed');

        const parsed = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

        // slowest5 only carries the passing entry (existing behaviour).
        expect(parsed.rollup.slowest5).toHaveLength(1);
        expect(parsed.rollup.slowest5[0].name).toBe('Alpha > snappy');

        // slowestFailures carries the failed + skipped, sorted slowest-first,
        // status preserved on each entry.
        expect(parsed.rollup.slowestFailures).toHaveLength(2);
        expect(parsed.rollup.slowestFailures[0]).toEqual({
            name: 'Bravo > timed out',
            file: 'src/B/e2e/b.engine.test.ts',
            durationMs: 250,
            status: 'failed',
        });
        expect(parsed.rollup.slowestFailures[1]).toEqual({
            name: 'Bravo > skipped for now',
            file: 'src/B/e2e/b.engine.test.ts',
            durationMs: 30,
            status: 'skipped',
        });

        // Markdown renders the new subsection with the status badge.
        expect(stream.written).toContain('### Slowest 5 (failed / skipped)');
        expect(stream.written).toContain('250ms (failed) — src/B/e2e/b.engine.test.ts: Bravo > timed out');
        expect(stream.written).toContain('30ms (skipped) — src/B/e2e/b.engine.test.ts: Bravo > skipped for now');
    });
});

// ─── Phase 40 — failures[] + prior-run diff ───────────────────────────────────

describe('AgentVitestReporter — Phase 40 failures[] flat list', () => {
    it('populates a top-level failures[] entry per failed test (and is [] when all pass)', async () => {
        const rootDir = process.cwd();
        const stream = makeStream();
        const fileA = path.join(rootDir, 'src/A/e2e/a.engine.test.ts');
        const fileB = path.join(rootDir, 'src/B/e2e/b.engine.test.ts');

        const failingPath = tmpPath();
        const failingReporter = new AgentVitestReporter({
            jsonOutputPath: failingPath, markdownStream: stream, rootDir,
        });
        await failingReporter.onTestRunEnd([
            makeModule({
                absPath: fileA, durationMs: 5, ok: true, state: 'passed',
                cases: [passingCase('Alpha > ok', 3)],
            }),
            makeModule({
                absPath: fileB, durationMs: 7, ok: false, state: 'failed',
                cases: [failingCase('Beta > nope', 'boom', { file: fileB, line: 11, column: 7 })],
            }),
        ], [], 'failed');

        const failingParsed = JSON.parse(fs.readFileSync(failingPath, 'utf-8'));
        expect(failingParsed.failures).toHaveLength(1);
        expect(failingParsed.failures[0]).toEqual({
            file: 'src/B/e2e/b.engine.test.ts',
            name: 'Beta > nope',
            message: 'boom',
            // iterate (critique-16) — diff/actual/expected carried through.
            // The synthetic stub doesn't set them, so they round-trip as
            // undefined (omitted on JSON.stringify).
            location: `${fileB}:11:7`,
        });

        const passingPath = tmpPath();
        const passingReporter = new AgentVitestReporter({
            jsonOutputPath: passingPath, markdownStream: makeStream(), rootDir,
        });
        await passingReporter.onTestRunEnd([
            makeModule({
                absPath: fileA, durationMs: 5, ok: true, state: 'passed',
                cases: [passingCase('Alpha > ok', 3)],
            }),
        ], [], 'passed');

        const passingParsed = JSON.parse(fs.readFileSync(passingPath, 'utf-8'));
        expect(passingParsed.failures).toEqual([]);
    });
});

describe('AgentVitestReporter — failures[] carries diff/actual/expected (iterate, critique-16)', () => {
    it('top-level failures[] entries surface snapshot-diff fields when the error has them', async () => {
        const rootDir = process.cwd();
        const jsonPath = tmpPath();
        const stream = makeStream();
        const fileSnap = path.join(rootDir, 'src/Snap/e2e/snap.engine.test.ts');

        const reporter = new AgentVitestReporter({
            jsonOutputPath: jsonPath, markdownStream: stream, rootDir,
        });
        await reporter.onTestRunEnd([
            makeModule({
                absPath: fileSnap, durationMs: 9, ok: false, state: 'failed',
                cases: [failingCase(
                    'Snap > diffs',
                    'expected snapshot to match',
                    { file: fileSnap, line: 42, column: 5 },
                    {
                        diff: '- old\n+ new',
                        actual: '{"v":2}',
                        expected: '{"v":1}',
                    },
                )],
            }),
        ], [], 'failed');

        const parsed = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
        expect(parsed.failures).toHaveLength(1);
        const f = parsed.failures[0];
        expect(f.file).toBe('src/Snap/e2e/snap.engine.test.ts');
        expect(f.name).toBe('Snap > diffs');
        expect(f.message).toBe('expected snapshot to match');
        expect(f.diff).toBe('- old\n+ new');
        expect(f.actual).toBe('{"v":2}');
        expect(f.expected).toBe('{"v":1}');
        expect(f.location).toBe(`${fileSnap}:42:5`);
    });
});

describe('AgentVitestReporter — Phase 40 diff against a fabricated prior', () => {
    it('detects added, removed, flipped, and duration-delta tests; renders markdown subsection', async () => {
        const rootDir = process.cwd();
        const jsonPath = tmpPath();
        const stream = makeStream();
        const fileX = path.join(rootDir, 'src/X/e2e/x.engine.test.ts');
        const fileY = path.join(rootDir, 'src/Y/e2e/y.engine.test.ts');

        // Fabricate a prior report at the same path the reporter will write to.
        const prior = {
            rollup: { total: 4, passed: 3, failed: 1, skipped: 0, reason: 'failed', unhandledErrors: 0, slowest5: [] },
            failures: [],
            files: [
                {
                    path: 'src/X/e2e/x.engine.test.ts',
                    status: 'passed',
                    durationMs: 10,
                    tests: [
                        { name: 'Xeno > steady', status: 'passed', durationMs: 5 },
                        { name: 'Xeno > was failing', status: 'failed', durationMs: 4 },
                        { name: 'Xeno > to be removed', status: 'passed', durationMs: 2 },
                    ],
                },
                {
                    path: 'src/Y/e2e/y.engine.test.ts',
                    status: 'passed',
                    durationMs: 8,
                    tests: [
                        { name: 'Yodel > slowing down', status: 'passed', durationMs: 20 },
                    ],
                },
            ],
        };
        fs.writeFileSync(jsonPath, JSON.stringify(prior, null, 2));

        // Current run: Xeno>steady same status (different duration), Xeno>was
        // failing flips to passed, Xeno>to be removed is gone, Yodel>slowing
        // down still passes but jumped from 20→90ms, plus a brand-new
        // Xeno>newly-added test that just got introduced.
        const reporter = new AgentVitestReporter({
            jsonOutputPath: jsonPath, markdownStream: stream, rootDir,
        });
        await reporter.onTestRunEnd([
            makeModule({
                absPath: fileX, durationMs: 12, ok: false, state: 'failed',
                cases: [
                    passingCase('Xeno > steady', 7),
                    passingCase('Xeno > was failing', 4),
                    failingCase('Xeno > newly-added', 'fresh fail', { file: fileX, line: 4, column: 1 }),
                ],
            }),
            makeModule({
                absPath: fileY, durationMs: 95, ok: true, state: 'passed',
                cases: [passingCase('Yodel > slowing down', 90)],
            }),
        ], [], 'failed');

        const parsed = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
        expect(parsed.rollup.diff).not.toBeNull();
        const d = parsed.rollup.diff;
        expect(d.addedTests).toEqual(['src/X/e2e/x.engine.test.ts::Xeno > newly-added']);
        expect(d.removedTests).toEqual(['src/X/e2e/x.engine.test.ts::Xeno > to be removed']);
        expect(d.flippedToPass).toHaveLength(1);
        expect(d.flippedToPass[0].name).toBe('Xeno > was failing');
        expect(d.flippedToFail).toEqual([]);
        expect(d.durationDeltaSlowest5.length).toBeGreaterThan(0);
        // The Yodel test went 20→90 = +70ms; that should be the top entry.
        expect(d.durationDeltaSlowest5[0].name).toBe('Yodel > slowing down');
        expect(d.durationDeltaSlowest5[0].deltaMs).toBe(70);

        // Markdown subsection renders.
        expect(stream.written).toContain('### Changes since last run');
        expect(stream.written).toContain('#### Added tests');
        expect(stream.written).toContain('#### Removed tests');
        expect(stream.written).toContain('#### Flipped to pass');
        expect(stream.written).toContain('#### Largest duration deltas');
        expect(stream.written).toContain('Δ +70ms');
    });
});

describe('AgentVitestReporter — Phase 40 no prior file (fresh-repo path)', () => {
    it('writes the new report with diff: null and emits no stderr warning', async () => {
        const rootDir = process.cwd();
        const jsonPath = tmpPath();
        // Ensure no file is at jsonPath — tmpPath returns an unused path.
        const stream = makeStream();
        const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

        const reporter = new AgentVitestReporter({
            jsonOutputPath: jsonPath, markdownStream: stream, rootDir,
        });
        await reporter.onTestRunEnd([], [], 'passed');

        const parsed = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
        expect(parsed.rollup.diff).toBeNull();
        // No `[agent-vitest-reporter]` warning lines.
        const calls = stderrSpy.mock.calls.map(c => String(c[0]));
        expect(calls.some(s => s.includes('[agent-vitest-reporter]'))).toBe(false);
        stderrSpy.mockRestore();
    });
});

describe('AgentVitestReporter — Phase 40 incompatible-schema prior', () => {
    it('logs one stderr warning, sets diff: null, still writes the new report', async () => {
        const rootDir = process.cwd();
        const jsonPath = tmpPath();
        // Write junk JSON to the path.
        fs.writeFileSync(jsonPath, JSON.stringify({ hello: 'world' }, null, 2));
        const stream = makeStream();
        const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

        const reporter = new AgentVitestReporter({
            jsonOutputPath: jsonPath, markdownStream: stream, rootDir,
        });
        await reporter.onTestRunEnd([], [], 'passed');

        const parsed = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
        expect(parsed.rollup.diff).toBeNull();
        // Exactly one warning line containing the prefix + the "shape mismatch" reason.
        const warnings = stderrSpy.mock.calls
            .map(c => String(c[0]))
            .filter(s => s.includes('[agent-vitest-reporter]'));
        expect(warnings).toHaveLength(1);
        expect(warnings[0]).toContain('shape mismatch');
        stderrSpy.mockRestore();
    });
});
