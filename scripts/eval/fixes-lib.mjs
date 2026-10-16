// scripts/eval/fixes-lib.mjs
//
// Pure parts of the report's last section (phase EV1d): the ranked fix list
// (brief A8), the success evidence nobody has to judge (A9: the frozen
// past-PR set, the seeded-defect catch-rate target, the change-failure
// baseline) and the "For `/messy`" dump (A10). No I/O here;
// `scripts/eval/fixes.mjs` reads the EV1 JSON and git, and writes.
//
// Every number comes from the EV1 data files. Which misses a fix would have
// prevented is the one judgement, and it is written down per fix below so
// a reader can disagree with a line rather than with a score.

import { detectFollowUps, isBookkeeping } from './ledger-lib.mjs'
import { rate } from './miss-rates-lib.mjs'

export const SECTION_START = '<!-- eval:fixes:start -->'
export const SECTION_END = '<!-- eval:fixes:end -->'

/** Size points per estimate, the scale `skills/plot.md` sizes a phase on. */
export const SIZE_POINTS = Object.freeze({ S: 1, M: 2, L: 3 })

/** How many recent code merges the change-failure baseline reads. */
export const BASELINE_MERGES = 20

/** The seeded-defect catch-rate target for the mechanical gates (A9). */
export const CATCH_TARGET = Object.freeze({ triggered: 100, caught: 50, seeds: 4 })

const missesOf = (rates, judge) => rates.find((r) => r.judge === judge)?.misses ?? []

/**
 * The candidate fixes (brief A8), each with the A7 misses it would have
 * prevented, why, and the exposure it covers beyond them. `found` marks a
 * fix the evidence suggested that the brief did not list.
 */
export const FIXES = Object.freeze([
  {
    id: 'F1', gate: 'The merge gate', size: 'S',
    fix: 'branch protection with required status checks, replacing comment matching',
    prevents: ({ rates }) => missesOf(rates, 'The merge gate'),
    why: 'every merge-gate miss is a merge before a check on the final head finished; a required check refuses that merge',
    exposure: ({ ledger }) => `${ledger.rows.filter((r) => r.ran.some((c) => c.finishedAfterMerge)).length} of ${ledger.rows.length} ledger PRs merged before a check finished (S1)`,
  },
  {
    id: 'F2', gate: 'CI and its path filters', size: 'S',
    fix: 'a path-coverage audit so no diff merges unverified',
    prevents: ({ rates, seeded }) => [
      ...(seeded?.seeds ?? []).filter((s) => s.triggered.length === 0).map((s) => `${s.id} (#${s.pr})`),
      ...missesOf(rates, 'The antagonist').filter((m) => /S4/.test(m)),
    ],
    why: 'a planted defect no `verify-*` workflow triggers on, and #526, which merged with only Cloudflare Pages run, both fail a check that every changed path has a gate',
    exposure: ({ ledger }) => `${ledger.rows.filter((r) => r.uncovered.length > 0).length} of ${ledger.rows.length} ledger PRs changed code no filter covers`,
  },
  {
    id: 'F3', gate: 'The plan queue files', size: 'S',
    fix: 'a structural lint for the plan queue files',
    prevents: ({ seeded }) => (seeded?.seeds ?? []).filter((s) => s.planted.some((p) => p.includes('pr-resolve'))).map((s) => `${s.id} (#${s.pr})`),
    why: 'the `pr-resolve` defect shows as split queue rows on `main`; a lint on the queue files fails that push even though no test covers the merge script',
    exposure: ({ ledger }) => `S2: ${(ledger.seeds.find((s) => s.id === 'S2')?.evidence ?? []).join(', ')}`,
  },
  {
    id: 'F4', gate: "The builder's own `[x]`", size: 'M',
    fix: 'an acceptance-ID-to-test map',
    prevents: ({ rates }) => missesOf(rates, "The builder's own `[x]`"),
    why: 'each builder miss is a ticked line with no test or shot behind it; a map that refuses a tick naming no test catches all three',
    exposure: ({ replay }) => replay ? `${replay.ticks.filter((t) => t.named.length === 0).length} of ${replay.ticks.length} ticked lines name no test` : 'no parent replay',
  },
  {
    id: 'F5', gate: 'verify', size: 'M',
    fix: 'a fail-on-parent check for new tests',
    // Only a builder miss whose ticked line rests on named tests the replay proved could not fail.
    prevents: ({ rates, replay }) => missesOf(rates, "The builder's own `[x]`").filter((m) => {
      const [, pr, id] = m.match(/^#(\d+) (\S+)/) ?? []
      const tick = replay?.ticks.find((t) => t.pr === Number(pr) && t.id === id)
      return Boolean(tick?.named.length) && tick.named.every((n) => n.couldNotFail)
    }),
    why: 'it refuses a test that passes before the change; the replay found no tick that rests only on such a test, so it prevents no measured miss yet',
    exposure: ({ replay }) => {
      if (!replay) return 'no parent replay'
      const files = replay.prs.flatMap((p) => p.files)
      return `${files.filter((f) => f.verdict === 'could-not-fail').length} of ${files.length} replayed test files could not fail; ${files.reduce((n, f) => n + f.couldNotFailCases.length, 0)} new cases pass on the parent`
    },
  },
  {
    id: 'F6', gate: "The builder's own `[x]`", size: 'L',
    fix: 'builder/judge separation',
    prevents: ({ rates }) => missesOf(rates, "The builder's own `[x]`"),
    why: 'a judge that is not the builder re-runs each acceptance line; it catches what F4 catches only if it runs the checks, since the antagonist, already separate, passed 4 of 5 escapes',
    exposure: ({ rates }) => { const a = rates.find((r) => r.judge === 'The antagonist'); return a?.misses ? `the antagonist missed ${a.misses.length} of ${a.of}` : 'antagonist not measured' },
  },
  {
    id: 'F7', gate: 'Android', size: 'L',
    fix: 'an Android smoke test on the preview APK',
    prevents: () => [],
    why: 'no gate exists, so no miss is on record to prevent (S6)',
    exposure: () => 'S6: no `verify-*` workflow runs on Android',
  },
  {
    id: 'F8', gate: 'verify', size: 'L', found: true,
    fix: 'diff-scoped mutation testing on a PR\'s changed lines',
    prevents: () => [],
    why: 'the tests as they stood caught none of the planted defects, and survivors sit in the combat code; whether mutants on the diff would have flagged them is not measured',
    exposure: ({ mutation }) => {
      const ok = (mutation?.targets ?? []).filter((t) => t.outcome === 'ok')
      return ok.map((t) => `${t.name}: ${t.files.reduce((n, f) => n + f.tally.survived + f.tally.noCoverage, 0)} of ${t.files.reduce((n, f) => n + f.tally.total, 0)} mutants survive or are uncovered`).join('; ') || 'no mutation run'
    },
  },
  {
    id: 'F9', gate: '`/critique`', size: 'S', found: true,
    fix: 'a per-pass critique record (commit range played, findings filed) so `/critique` gets a denominator',
    prevents: () => [],
    why: 'it catches nothing itself; it turns the one "not measured" judge into a measured one',
    exposure: ({ rates }) => rates.find((r) => r.judge === '`/critique`')?.note.replace(/^.*Context: /, '') ?? 'n/a',
  },
])

/**
 * The fix list scored and ranked: misses prevented per size point, highest
 * first; ties go to the smaller fix, then to the ID. `adds` is how many
 * misses a fix covers that no fix above it already did.
 *
 * @param {{ rates: object[], ledger: object, replay: object|null, seeded: object|null, mutation: object|null }} ev the EV1 data.
 * @returns {{ id: string, gate: string, size: string, fix: string, found: boolean, prevents: string[], score: number, adds: number, why: string, exposure: string }[]} ranked.
 */
export function rankFixes(ev) {
  const scored = FIXES.map((f) => {
    const prevents = [...new Set(f.prevents(ev))]
    return { id: f.id, gate: f.gate, size: f.size, fix: f.fix, found: Boolean(f.found), prevents, score: Math.round((prevents.length / SIZE_POINTS[f.size]) * 100) / 100, why: f.why, exposure: f.exposure(ev) }
  })
  scored.sort((a, b) => b.score - a.score || SIZE_POINTS[a.size] - SIZE_POINTS[b.size] || a.id.localeCompare(b.id))
  const seen = new Set()
  return scored.map((f) => {
    const adds = f.prevents.filter((m) => !seen.has(m)).length
    f.prevents.forEach((m) => seen.add(m))
    return { ...f, adds }
  })
}

const SEED_VERDICTS = Object.freeze({
  S1: 'block: merged before `verify-mobile` finished on its final head, over a "not a pass"',
  S3: 'block: a ticked acceptance line whose test could not fail',
  S4: 'block: no `verify-*` workflow ran on code it changed',
  S5: 'block: a ticked acceptance line whose `verify:visual` shot was not taken',
})

/**
 * The frozen past-PR set (A9): the A2 escapes with an expected "block" and
 * every known-good ledger PR with an expected "pass". Known-good means no
 * follow-up fix within the window, no uncovered code, every check finished
 * before the merge, no antagonist "not a pass" and no seed. A gate fix is
 * judged by replaying this set, so the set is written once and kept.
 *
 * @param {{ rows: object[], seeds: { id: string, evidence: string[] }[] }} ledger the escape ledger.
 * @param {Record<string, number[]>} seedPrs seed ID to the PRs carrying it.
 * @returns {{ kind: 'pr'|'commit', ref: string, head: string|null, expected: 'block'|'pass', why: string }[]} the set, escapes first.
 */
export function frozenSet(ledger, seedPrs) {
  const byPr = new Map(ledger.rows.map((r) => [r.number, r]))
  const escapes = new Map()
  for (const [seed, prs] of Object.entries(seedPrs)) {
    for (const n of prs) {
      const prior = escapes.get(n)
      escapes.set(n, { kind: 'pr', ref: `#${n}`, head: byPr.get(n)?.head ?? null, expected: 'block', why: prior ? `${prior.why}; ${seed}: ${SEED_VERDICTS[seed]}` : `${seed}: ${SEED_VERDICTS[seed]}` })
    }
  }
  const out = [...escapes.values()].sort((a, b) => a.ref.localeCompare(b.ref))
  const s2 = []
  for (const e of ledger.seeds.find((s) => s.id === 'S2')?.evidence ?? []) {
    const [what, sha] = e.split(' ')
    if (what !== 'merge') continue
    s2.push(sha)
    out.push({ kind: 'commit', ref: sha, head: sha, expected: 'block', why: 'S2: a `pr-resolve` merge that cut `plan/CRITIQUE.md` rows apart' })
  }
  // A PR whose final head is an S2 merge would need two verdicts on one head, so it is left out.
  const good = ledger.rows.filter((r) => !escapes.has(r.number) && !s2.some((sha) => r.head?.startsWith(sha)) && r.followUps.length === 0 && r.uncovered.length === 0
    && !r.ran.some((c) => c.finishedAfterMerge) && r.antagonist?.verdict !== 'not-pass')
  for (const r of good) out.push({ kind: 'pr', ref: `#${r.number}`, head: r.head, expected: 'pass', why: 'known-good: no follow-up in 7 days, every path covered, every check done before the merge' })
  return out
}

/**
 * The change-failure baseline (A9): of the last `BASELINE_MERGES` PR merges
 * on `main` that changed code (not only bookkeeping), how many drew a fix
 * or revert touching the same files within 7 days. A shared file names a
 * candidate, not a cause, so this is an upper bound; reverts are counted
 * apart as the strict floor.
 *
 * @param {{ sha: string, date: string, subject: string, pr: number|null, files: string[] }[]} landings first-parent commits on `main`, newest first.
 * @param {string} stampDate the stamp commit's ISO date.
 * @param {number} [n] how many merges.
 * @returns {{ merges: object[], failed: number, reverted: number, open: number, finalOn: string|null, of: number, rate: number|null, revertRate: number|null }} the baseline; `finalOn` is the day the newest merge's window closes.
 */
export function changeFailureBaseline(landings, stampDate, n = BASELINE_MERGES) {
  const merges = landings.filter((l) => l.pr != null && l.files.some((f) => !isBookkeeping(f))).slice(0, n)
  const stamp = Date.parse(stampDate)
  const rows = merges.map((m) => {
    const followUps = detectFollowUps({ mergeCommit: m.sha, mergedAt: m.date, files: m.files }, landings)
    return {
      pr: m.pr, sha: m.sha.slice(0, 8), date: m.date, subject: m.subject,
      followUps: followUps.map((f) => ({ sha: f.sha.slice(0, 8), subject: f.subject })),
      reverted: followUps.some((f) => /\brevert\b/i.test(f.subject)),
      windowOpen: stamp - Date.parse(m.date) < 7 * 86400000,
    }
  })
  const newest = rows.reduce((t, r) => Math.max(t, Date.parse(r.date)), 0)
  const finalOn = rows.length ? new Date(newest + 7 * 86400000).toISOString().slice(0, 10) : null
  const failed = rows.filter((r) => r.followUps.length > 0).length
  const reverted = rows.filter((r) => r.reverted).length
  return { merges: rows, failed, reverted, open: rows.filter((r) => r.windowOpen).length, finalOn, of: rows.length, rate: rate(failed, rows.length), revertRate: rate(reverted, rows.length) }
}

/**
 * The catch-rate target against today's planted-defect numbers.
 *
 * @param {{ seeds: object[] }|null} seeded the planted-defect run.
 * @returns {{ now: { triggered: number|null, caught: number|null, of: number }, target: typeof CATCH_TARGET }} both.
 */
export function catchTarget(seeded) {
  const seeds = seeded?.seeds ?? []
  return {
    now: { triggered: rate(seeds.filter((s) => s.triggered.length > 0).length, seeds.length), caught: rate(seeds.filter((s) => s.gates.before.verdict === 'caught' || s.gates.ci.verdict === 'caught').length, seeds.length), of: seeds.length },
    target: CATCH_TARGET,
  }
}

/**
 * The "For `/messy`" dump (A10): one theme per gate, raw prose T can paste.
 *
 * @param {object[]} rates the miss-rate rows (A7).
 * @param {object[]} ranked the ranked fixes.
 * @returns {string[]} one paragraph per gate.
 */
export function messyThemes(rates, ranked) {
  const gates = [...new Set([...rates.map((r) => r.judge.replace(/`/g, '')), ...ranked.map((f) => f.gate.replace(/`/g, ''))])]
  return gates.map((gate) => {
    const r = rates.find((x) => x.judge.replace(/`/g, '') === gate)
    const fixes = ranked.filter((f) => f.gate.replace(/`/g, '') === gate)
    const measured = r == null ? 'not one of the A7 judges.' : r.misses == null ? `not measured: ${r.note}` : `missed ${r.misses.length} of ${r.of}${r.misses.length ? ` (${r.misses.join(', ')})` : ''}.`
    const options = fixes.length ? ` Candidate fixes: ${fixes.map((f) => `${f.fix} (${f.size}, prevents ${f.prevents.length}, ranked ${ranked.indexOf(f) + 1} of ${ranked.length})`).join('; ')}.` : ' No candidate fix aims at this gate.'
    return `${gate}: ${measured}${options}`
  })
}

const cell = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ')

/**
 * The EV1d section of `docs/reports/eval/latest.md`, markers included.
 *
 * @param {{ stamp: { commit: string, date: string }, inputs: Record<string, string>, ranked: object[], frozen: { frozenAt: string, set: object[] }, target: object, baseline: object, messy: string[] }} report the computed section.
 * @returns {string} markdown.
 */
export function renderFixesSection(report) {
  const { ranked, frozen, target, baseline } = report
  const out = [SECTION_START, '', '## Ranked fixes and how to tell they worked (EV1d, A8-A10)', '']
  out.push(`Stamp: commit \`${report.stamp.commit}\` (${report.stamp.date}). Regenerate with \`node scripts/eval/fixes.mjs\`; inputs: ${Object.entries(report.inputs).map(([k, v]) => `${k} at \`${v}\``).join(', ')}. The data is \`docs/reports/eval/fixes.json\`; the frozen set is \`docs/reports/eval/frozen-set.json\`.`, '')

  out.push('### Ranked fix list (A8)', '')
  out.push(`Score: the A7 misses a fix would have prevented, per size point (${Object.entries(SIZE_POINTS).map(([k, v]) => `${k} ${v}`).join(', ')}). "Adds" counts the misses no fix ranked above it already covers. "Found" marks a fix the evidence suggested beyond the brief's list. No fix is built here.`, '')
  out.push('| Rank | Fix | Gate | Size | Prevents | Score | Adds | Why | Exposure beyond the misses |', '|---|---|---|---|---|---|---|---|---|')
  ranked.forEach((f, i) => {
    out.push(`| ${i + 1} | ${f.id} ${cell(f.fix)}${f.found ? ' (found)' : ''} | ${cell(f.gate)} | ${f.size} | ${f.prevents.length ? `${f.prevents.length}: ${cell(f.prevents.join(', '))}` : '0'} | ${f.score} | ${f.adds} | ${cell(f.why)} | ${cell(f.exposure)} |`)
  })

  out.push('', '### Success evidence (A9)', '')
  out.push(`**Frozen past-PR set.** Frozen at commit \`${frozen.frozenAt}\` and never regenerated: a gate fix works when, replayed on each head below, it blocks every "block" row and passes every "pass" row. ${frozen.set.filter((s) => s.expected === 'block').length} escapes, ${frozen.set.filter((s) => s.expected === 'pass').length} known-good.`, '')
  out.push('| Ref | Head | Expected | Why |', '|---|---|---|---|')
  for (const s of frozen.set) out.push(`| ${s.ref} | ${s.head ? s.head.slice(0, 8) : '-'} | ${s.expected} | ${cell(s.why)} |`)

  const pct = (v) => (v == null ? 'n/a' : `${v}%`)
  out.push('', `**Seeded-defect catch-rate target.** On the next ${target.target.seeds} real bugs fixed on \`main\` after this stamp, replayed by \`node scripts/eval/seeded-replay.mjs\`: every planted defect triggers at least one \`verify-*\` workflow (target ${target.target.triggered}%, now ${pct(target.now.triggered)} of ${target.now.of}), and CI or the tests as they stood at the defect's parent catch at least ${target.target.caught}% (now ${pct(target.now.caught)}). The fix's own tests are not counted; they are written after the bug is known.`, '')

  out.push(`**Change-failure baseline.** Of the last ${baseline.of} PR merges on \`main\` that changed code (merges that touch only \`plan/\`, \`telemetry/\`, \`docs/reports/\` or \`devlog/entries/\` are left out), ${baseline.failed} drew a fix or revert touching the same files within 7 days: ${pct(baseline.rate)}, an upper bound, since a shared file names a candidate, not a cause. Reverts alone, the floor: ${baseline.reverted} (${pct(baseline.revertRate)}). ${baseline.open} of the ${baseline.of} merges are under 7 days old at the stamp, so their window is still open${baseline.open ? `; rerun on or after ${baseline.finalOn}, when the newest window closes, for the final baseline` : ''}. Compare the next ${baseline.of} code merges by the same method, read from \`git log --first-parent\` alone.`, '')
  out.push('| PR | Merge | Merged | Follow-ups (7d) | Window |', '|---|---|---|---|---|')
  for (const m of baseline.merges) {
    out.push(`| #${m.pr} ${cell(m.subject)} | ${m.sha} | ${m.date.slice(0, 16)} | ${cell(m.followUps.map((f) => `${f.sha} ${f.subject}`).join('; ') || 'none')} | ${m.windowOpen ? 'open' : 'closed'} |`)
  }

  out.push('', '## For `/messy`', '')
  out.push('One theme per gate, raw, for T to paste into `/messy`. EV1 builds none of it.', '')
  out.push('```text', ...report.messy.flatMap((p) => [p, '']), 'Evidence for every line: docs/reports/eval/latest.md (EV1a-EV1d) and its JSON beside it.', '```', '', SECTION_END)
  return out.join('\n')
}
