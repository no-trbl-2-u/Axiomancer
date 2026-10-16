// scripts/eval/parent-replay-lib.mjs
//
// Pure parts of the parent replay (phase EV1b, brief A4): which files are
// tests and which runner owns each, the first-parent pick for a merge,
// test titles new in a PR, runner-output parsing, the per-file verdict,
// acceptance-tick parsing, the unproven-tick list and the report section.
// No I/O here; `scripts/eval/parent-replay.mjs` runs the tests.
//
// A test "could not fail" when it passes on the parent commit with the PR's
// version of the file laid over it: the code it claims to pin was not there
// yet, and it passed anyway. A measurement, not a gate.

/** A test file by name: `*.test.*` or `*.spec.*`, JS or TS. */
const TEST_FILE = /\.(test|spec)\.[cm]?[jt]sx?$/

/** A runner message that means the file could not import what it tests. */
const LOAD_ERROR = /Cannot find module|Could not locate module|ERR_MODULE_NOT_FOUND|does not provide an export named|Failed to resolve import/

/**
 * Whether a path is a test file the replay can run.
 *
 * @param {string} path a repo-relative path.
 * @returns {boolean} true for `*.test.*` / `*.spec.*` files.
 * @example isTestFile('axiomancer-mobile/components/__tests__/TitleScreen.test.tsx') // true
 */
export function isTestFile(path) {
  return TEST_FILE.test(path)
}

/**
 * The runner that owns a test file, and the directory it runs from.
 * `.mjs` / `.cjs` / `.js` files run on `node --test` from the repo root;
 * TypeScript in mechanics on vitest; TypeScript in mobile on jest.
 *
 * @param {string} path a repo-relative test file.
 * @returns {{ runner: 'node'|'vitest'|'jest', cwd: string }|null} null when no runner owns it.
 * @example runnerFor('scripts/loop-pr.test.mjs') // { runner: 'node', cwd: '' }
 */
export function runnerFor(path) {
  if (!isTestFile(path)) return null
  if (/\.[cm]?js$/.test(path)) return { runner: 'node', cwd: '' }
  if (path.startsWith('axiomancer-mechanics/')) return { runner: 'vitest', cwd: 'axiomancer-mechanics' }
  if (path.startsWith('axiomancer-mobile/')) return { runner: 'jest', cwd: 'axiomancer-mobile' }
  return null
}

/**
 * The parent a PR's tests replay on: the first parent of its merge commit
 * (`main` just before the merge), or the only parent of a squash.
 *
 * @param {string} revListLine one line of `git rev-list --parents -n 1 <sha>`.
 * @returns {string|null} the first parent's sha, or null for a root commit.
 * @example firstParent('m p1 p2') // 'p1'
 */
export function firstParent(revListLine) {
  const parts = revListLine.trim().split(/\s+/)
  return parts[1] ?? null
}

/**
 * The literal titles of `it(...)` / `test(...)` cases in a test file.
 * A title with `${...}` is dynamic and skipped, since it cannot be matched
 * against runner output by text.
 *
 * @param {string} source the file's text.
 * @returns {string[]} titles in file order.
 * @example testTitles("it('adds', () => {})") // ['adds']
 */
export function testTitles(source) {
  const out = []
  const re = /\b(?:it|test)(?:\.(?:only|skip|concurrent|todo))?\s*\(\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1/g
  for (const m of source.matchAll(re)) {
    if (m[1] === '`' && m[2].includes('${')) continue
    out.push(m[2].replace(/\\(['"`\\])/g, '$1'))
  }
  return out
}

/**
 * The case titles a PR added: present in its version of the file and not in
 * the parent's. A file new in the PR has every title new.
 *
 * @param {string} mergeSource the file at the merge.
 * @param {string|null} parentSource the file at the parent, or null when the PR added it.
 * @returns {Set<string>} the new titles.
 * @example newTitles("it('a', f); it('b', f)", "it('a', f)") // Set { 'b' }
 */
export function newTitles(mergeSource, parentSource) {
  const old = new Set(parentSource == null ? [] : testTitles(parentSource))
  return new Set(testTitles(mergeSource).filter((t) => !old.has(t)))
}

/**
 * Per-file results from a jest `--json` or vitest `--reporter=json` report
 * (vitest writes the same shape).
 *
 * @param {{ testResults?: { name: string, status: string, message?: string, assertionResults?: { title: string, status: string }[] }[] }|null} report the parsed JSON.
 * @param {string} root the absolute directory the report's paths are under.
 * @returns {Record<string, { ok: boolean, cases: { title: string, status: string }[], message: string }>} keyed by repo-relative path.
 */
export function parseJsonReport(report, root) {
  const out = {}
  const prefix = root.endsWith('/') ? root : `${root}/`
  for (const r of report?.testResults ?? []) {
    const name = r.name.replace(/\\/g, '/')
    const rel = name.startsWith(prefix) ? name.slice(prefix.length) : name
    const cases = (r.assertionResults ?? []).map((a) => ({ title: a.title, status: a.status }))
    const ok = r.status === 'passed' && cases.every((c) => c.status !== 'failed')
    out[rel] = { ok, cases, message: (r.message ?? '').slice(0, 400) }
  }
  return out
}

/**
 * Per-case results from `node --test --test-reporter=tap` output. Every
 * `ok` / `not ok` line counts, so a suite's line is a case too; the exit
 * code decides the file.
 *
 * @param {string} tap the reporter's stdout.
 * @param {number} exitCode the process's exit code.
 * @returns {{ ok: boolean, cases: { title: string, status: string }[], message: string }} the file's result.
 * @example parseTap('ok 1 - adds\n', 0).cases // [{ title: 'adds', status: 'passed' }]
 */
export function parseTap(tap, exitCode) {
  const cases = []
  for (const line of tap.split(/\r?\n/)) {
    const m = line.match(/^\s*(not )?ok \d+ - (.*?)(\s+#\s*(SKIP|TODO)\b.*)?$/)
    if (m) cases.push({ title: m[2].replace(/\\#/g, '#'), status: m[4] ? 'skipped' : m[1] ? 'failed' : 'passed' })
  }
  return { ok: exitCode === 0, cases, message: exitCode === 0 ? '' : tap.split('\n').filter((l) => /not ok|Error/.test(l)).slice(0, 4).join(' ').slice(0, 400) }
}

/**
 * One test file's verdict from its run at the merge (the control) and at
 * the parent with the PR's version laid over.
 *
 * - `inconclusive`: it fails at its own merge, so the parent run proves nothing;
 * - `fails-on-parent`: it does not load there (no case runs, or none passes
 *   and the runner names a missing module or export), or a case fails there;
 * - `could-not-fail`: every case passes on the parent.
 *
 * `couldNotFailCases` lists the PR's new cases that pass on the parent
 * (all of them for a `could-not-fail` file).
 *
 * @param {{ ok: boolean, cases: { title: string, status: string }[] }|null} control the run at the merge.
 * @param {{ ok: boolean, cases: { title: string, status: string }[] }|null} parent the run at the parent.
 * @param {Set<string>} fresh the PR's new case titles.
 * @returns {{ verdict: 'inconclusive'|'fails-on-parent'|'could-not-fail', reason: string, couldNotFailCases: string[], newCases: number }} the verdict.
 */
export function verdictFor(control, parent, fresh) {
  const newRan = (control?.cases ?? []).filter((c) => fresh.has(c.title) && c.status === 'passed').map((c) => c.title)
  if (!control || !control.ok) return { verdict: 'inconclusive', reason: control ? 'fails at its own merge' : 'no result at its merge', couldNotFailCases: [], newCases: newRan.length }
  if (!parent) return { verdict: 'inconclusive', reason: 'no result on the parent', couldNotFailCases: [], newCases: newRan.length }
  const passed = new Set(parent.cases.filter((c) => c.status === 'passed').map((c) => c.title))
  const couldNotFailCases = newRan.filter((t) => passed.has(t))
  if (parent.ok) return { verdict: 'could-not-fail', reason: 'passes on the parent', couldNotFailCases, newCases: newRan.length }
  const ranNone = !parent.cases.some((c) => c.status === 'passed' || c.status === 'failed')
  const noPass = !parent.cases.some((c) => c.status === 'passed')
  if (ranNone || (noPass && LOAD_ERROR.test(parent.message ?? ''))) return { verdict: 'fails-on-parent', reason: 'does not load on the parent', couldNotFailCases, newCases: newRan.length }
  return { verdict: 'fails-on-parent', reason: 'a case fails on the parent', couldNotFailCases, newCases: newRan.length }
}

/**
 * The acceptance lines in a PR body's `## Acceptance` section.
 *
 * @param {string} body the PR body.
 * @returns {{ id: string, ticked: boolean, text: string }[]} one per `- [x] A<n>` / `- [ ] A<n>` line.
 * @example parseAcceptance('## Acceptance\n- [x] A1 pins it\n\n## Verify\n')[0].id // 'A1'
 */
export function parseAcceptance(body) {
  const lines = (body ?? '').split(/\r?\n/)
  const start = lines.findIndex((l) => /^##\s+Acceptance\b/i.test(l))
  if (start < 0) return []
  const out = []
  for (const line of lines.slice(start + 1)) {
    if (/^##\s/.test(line)) break
    const m = line.match(/^\s*-\s*\[( |x|X)\]\s*\**(A\d+[a-z]?)\b\**\s*(.*)$/)
    if (m) out.push({ id: m[2], ticked: m[1] !== ' ', text: m[3] })
  }
  return out
}

/** Backticked tokens in a line long enough to name a case (`paidLedgerFit`). */
function codeTokens(text) {
  return [...text.matchAll(/`([^`]{4,})`/g)].map((m) => m[1])
}

/**
 * What an acceptance line names among the PR's replayed tests: a file by
 * its base name (or `.suffix` shorthand after a named sibling), and a new
 * case whose title holds one of the line's backticked tokens.
 *
 * @param {string} text the acceptance line.
 * @param {{ path: string, verdict: string, couldNotFailCases: string[], freshTitles: string[] }[]} files the PR's replayed files.
 * @returns {{ kind: 'file'|'case', name: string, couldNotFail: boolean }[]} the named tests.
 */
export function namedTests(text, files) {
  const out = []
  const tokens = codeTokens(text)
  for (const f of files) {
    const base = f.path.split('/').pop()
    const stem = base.replace(TEST_FILE, '')
    const tail = stem.includes('.') ? stem.slice(stem.indexOf('.')) : null
    if (text.includes(base) || text.includes(`\`${stem}\``) || (tail && text.includes(`\`${tail}\``))) {
      out.push({ kind: 'file', name: f.path, couldNotFail: f.verdict === 'could-not-fail' })
      continue
    }
    for (const title of f.freshTitles ?? []) {
      if (tokens.some((t) => title.includes(t))) out.push({ kind: 'case', name: `${base} > ${title}`, couldNotFail: f.couldNotFailCases.includes(title) })
    }
  }
  return out
}

/**
 * Every ticked acceptance line, with the tests it names and whether it is
 * unproven: it names at least one test and every one it names could not fail.
 *
 * @param {{ number: number, body: string, files: object[] }[]} prs the replayed PRs with their bodies.
 * @returns {{ pr: number, id: string, text: string, named: object[], unproven: boolean }[]} one per ticked line.
 */
export function checkTicks(prs) {
  const out = []
  for (const pr of prs) {
    for (const a of parseAcceptance(pr.body)) {
      if (!a.ticked) continue
      const named = namedTests(a.text, pr.files)
      out.push({ pr: pr.number, id: a.id, text: a.text, named, unproven: named.length > 0 && named.every((n) => n.couldNotFail) })
    }
  }
  return out
}

/** Markers that bound this phase's section in `latest.md`. */
export const SECTION_START = '<!-- eval:parent-replay:start -->'
export const SECTION_END = '<!-- eval:parent-replay:end -->'

/**
 * Totals over the replayed files and checked ticks.
 *
 * @param {{ verdict: string, reason: string, couldNotFailCases: string[] }[]} files every replayed file.
 * @param {{ named: object[], unproven: boolean }[]} ticks every ticked line.
 * @returns {Record<string, number>} counts.
 */
export function summarizeReplay(files, ticks) {
  const by = (v) => files.filter((f) => f.verdict === v).length
  return {
    files: files.length,
    failsOnParent: by('fails-on-parent'),
    doesNotLoad: files.filter((f) => f.reason === 'does not load on the parent').length,
    couldNotFail: by('could-not-fail'),
    inconclusive: by('inconclusive'),
    newCasesPassing: files.reduce((n, f) => n + f.couldNotFailCases.length, 0),
    ticks: ticks.length,
    ticksNamingNone: ticks.filter((t) => t.named.length === 0).length,
    unproven: ticks.filter((t) => t.unproven).length,
  }
}

const cell = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ')
const clip = (s, n) => (s.length > n ? `${s.slice(0, n - 3)}...` : s)

/**
 * The parent-replay section of `docs/reports/eval/latest.md`, markers included.
 *
 * @param {{ stamp: { commit: string, date: string }, ledgerStamp: string, prs: { number: number, files: object[] }[], ticks: object[], seedTicks: { pr: number, id: string, status: string }[] }} replay the full replay.
 * @returns {string} markdown.
 */
export function renderReplaySection(replay) {
  const { stamp, ledgerStamp, prs, ticks, seedTicks } = replay
  const files = prs.flatMap((p) => p.files.map((f) => ({ ...f, pr: p.number })))
  const s = summarizeReplay(files, ticks)
  const out = [SECTION_START, '', '## Do the tests fail on the parent? (EV1b)', '']
  out.push(`Stamp: commit \`${stamp.commit}\` (${stamp.date}), over the ledger at \`${ledgerStamp}\`. Regenerate with \`node scripts/eval/parent-replay.mjs\`; the data is \`docs/reports/eval/parent-replay.json\`.`, '')
  out.push("Each test file a ledger PR added or changed runs twice in a detached worktree: at the PR's merge (the control), then at the merge's first parent with the PR's version of the file laid over. A file that passes on the parent could not fail: the code it pins was not there yet. A new case is a test title in the PR's version that the parent's version lacks; dynamic titles are not matched. A new case passing on the parent is not a defect by itself: a guard of behaviour the PR must not change (the other direction of a pinned rule) passes there by design.", '')
  out.push('| Count | Value |', '|---|---|')
  out.push(`| Test files replayed | ${s.files} |`)
  out.push(`| Fail on the parent | ${s.failsOnParent} (${s.doesNotLoad} do not load there) |`)
  out.push(`| Could not fail (pass on the parent) | ${s.couldNotFail} |`)
  out.push(`| Inconclusive (fail at their own merge) | ${s.inconclusive} |`)
  out.push(`| New cases that pass on the parent | ${s.newCasesPassing} |`)
  out.push(`| Ticked acceptance lines | ${s.ticks} |`)
  out.push(`| Ticked lines naming no replayed test | ${s.ticksNamingNone} |`)
  out.push(`| Unproven ticks | ${s.unproven} |`, '')
  out.push('### Unproven ticks', '')
  out.push('A ticked acceptance line is unproven when it names at least one test (a file by name, or a new case by a backticked token in the line) and every test it names could not fail.', '')
  const unproven = ticks.filter((t) => t.unproven)
  if (unproven.length === 0) out.push('None.')
  else {
    out.push('| PR | ID | Tick | Named tests |', '|---|---|---|---|')
    for (const t of unproven) out.push(`| #${t.pr} | ${t.id} | ${cell(clip(t.text, 120))} | ${cell(t.named.map((n) => n.name.split('/').pop()).join('; '))} |`)
  }
  out.push('', '### Seed S3', '')
  for (const t of seedTicks) out.push(`- #${t.pr} ${t.id}: ${t.status}`)
  out.push('', '### Every replayed test file', '')
  out.push('| PR | Test file | In the PR | Verdict | New cases passing on the parent |', '|---|---|---|---|---|')
  for (const f of files) {
    const passing = f.couldNotFailCases.length ? `${f.couldNotFailCases.length} of ${f.newCases}: ${clip(f.couldNotFailCases.slice(0, 2).join('; '), 140)}${f.couldNotFailCases.length > 2 ? '; ...' : ''}` : `0 of ${f.newCases}`
    out.push(`| #${f.pr} | ${f.path.split('/').pop()} | ${f.status} | ${f.verdict} (${f.reason}) | ${cell(passing)} |`)
  }
  out.push('', SECTION_END)
  return out.join('\n')
}

/**
 * How a seeded tick stands after the replay.
 *
 * @param {{ pr: number, id: string, named: object[], unproven: boolean }|undefined} tick the checked tick, if found.
 * @returns {string} a one-line status.
 */
export function seedTickStatus(tick) {
  if (!tick) return 'not found among the ticked lines'
  if (tick.unproven) return `unproven: every named test could not fail (${tick.named.map((n) => n.name.split('/').pop()).join('; ')})`
  if (tick.named.length === 0) return 'names no replayed test, so the replay can neither prove nor clear it'
  const failing = tick.named.filter((n) => !n.couldNotFail).map((n) => n.name.split('/').pop())
  return `cleared: ${failing.join('; ')} fails on the parent`
}

/**
 * A report with one marked section replaced, or appended when absent.
 *
 * @param {string} existing the current `latest.md`.
 * @param {string} section the rendered section, markers included.
 * @returns {string} the whole file.
 */
export function spliceSection(existing, section) {
  const a = existing.indexOf(SECTION_START)
  const b = existing.indexOf(SECTION_END)
  if (a < 0 || b < a) return `${existing.trimEnd()}\n\n${section}\n`
  return existing.slice(0, a) + section + existing.slice(b + SECTION_END.length)
}
