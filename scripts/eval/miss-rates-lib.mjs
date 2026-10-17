// scripts/eval/miss-rates-lib.mjs
//
// Pure parts of the miss-rate table (phase EV1c, brief A7): one row per
// judge, each with its misses, its denominator and the ledger rows they come
// from, computed from the ledger (EV1a), the parent replay (EV1b), the
// planted defects and the mutation scores (EV1c). No I/O here;
// `scripts/eval/miss-rates.mjs` reads the JSON and writes the section.
//
// A judge whose rate this evidence cannot measure says "not measured" and
// why, rather than a number.

import { combineTallies } from './mutation-lib.mjs'

export const SECTION_START = '<!-- eval:miss-rates:start -->'
export const SECTION_END = '<!-- eval:miss-rates:end -->'

/** The seeded escapes the ledger ties to a PR, by seed ID (brief A2). */
export const SEED_PRS = Object.freeze({ S1: [529], S3: [520, 521, 523], S4: [526], S5: [523] })

/**
 * A rate in percent, one decimal, or null with no denominator.
 *
 * @param {number} misses the count.
 * @param {number} of the denominator.
 * @returns {number|null} the rate.
 * @example rate(1, 4) // 25
 */
export function rate(misses, of) {
  return of === 0 ? null : Math.round((misses / of) * 1000) / 10
}

const row = (judge, misses, of, note) => ({ judge, misses, of, rate: rate(misses.length, of), note })
const notMeasured = (judge, note) => ({ judge, misses: null, of: null, rate: null, note })

/**
 * The miss-rate rows.
 *
 * @param {{ ledger: { rows: object[] }, replay: { ticks: object[], seedTicks: object[] }|null, seeded: { seeds: object[] }|null, mutation: { targets: object[] }|null }} evidence the EV1 data files.
 * @returns {{ judge: string, misses: string[]|null, of: number|null, rate: number|null, note: string }[]} one row per judge.
 */
export function computeMissRates({ ledger, replay, seeded, mutation }) {
  const rows = ledger.rows
  const planted = seeded?.seeds ?? []
  const out = []

  // CI and its path filters: a planted defect CI did not fail on.
  const uncovered = rows.filter((r) => r.uncovered.length > 0).map((r) => `#${r.number}`)
  const ciMiss = planted.filter((s) => s.gates.ci.verdict === 'missed')
  const noTrigger = planted.filter((s) => s.triggered.length === 0).map((s) => s.id)
  out.push(planted.length
    ? row('CI and its path filters', ciMiss.map((s) => `${s.id} (#${s.pr})`), planted.length,
      `${noTrigger.length} of ${planted.length} planted defects trigger no \`verify-*\` workflow (${noTrigger.join(', ') || 'none'}). Path coverage: ${uncovered.length} of ${rows.length} ledger PRs changed code no filter covers (${uncovered.join(', ')}).`)
    : notMeasured('CI and its path filters', 'no planted-defect run (`seeded.json`) to score it on.'))

  // verify: the related tests as they stood, on the planted defects; mutation survivors as context.
  const verifyMiss = planted.filter((s) => s.gates.before.verdict !== 'caught')
  const scores = (mutation?.targets ?? []).map((t) => {
    if (t.outcome !== 'ok') return `${t.name}: ${t.outcome}`
    const c = combineTallies(t.files.map((f) => f.tally))
    return `${t.name}: ${c.score}% (${c.survived + c.noCoverage} of ${c.total} mutants survive or are uncovered)`
  })
  out.push(planted.length
    ? row('`verify`', verifyMiss.map((s) => `${s.id} (#${s.pr})`), planted.length,
      `Tests as they stood at each fix's parent. Each fix's own tests catch its defect: ${planted.filter((s) => s.gates.after.verdict === 'caught').length} of ${planted.length}. Mutation: ${scores.join('; ') || 'not run'}.`)
    : notMeasured('`verify`', 'no planted-defect run (`seeded.json`) to score it on.'))

  // The antagonist: reviewed PRs carrying a known escape that it passed.
  const escapePrs = new Map()
  for (const [seed, prs] of Object.entries(SEED_PRS)) for (const n of prs) escapePrs.set(n, [...(escapePrs.get(n) ?? []), seed])
  const verdict = (r) => r.antagonist?.verdict ?? 'none'
  const reviewed = rows.filter((r) => escapePrs.has(r.number) && verdict(r) !== 'none')
  const antMiss = reviewed.filter((r) => verdict(r) === 'pass')
  out.push(reviewed.length
    ? row('The antagonist', antMiss.map((r) => `#${r.number} (${escapePrs.get(r.number).join(', ')})`), reviewed.length,
      `Denominator: PRs carrying a seeded escape that the antagonist reviewed before merge. It reviewed ${rows.filter((r) => verdict(r) !== 'none').length} of ${rows.length} ledger PRs; ${rows.filter((r) => verdict(r) === 'not-pass').length} drew a "not a pass".`)
    : notMeasured('The antagonist', 'no PR carrying a seeded escape has an antagonist verdict on record.'))

  // The shadow reviewer (RV1b): shadow-reviewed PRs that escaped anyway,
  // where its last verdict before merge named no MED+ finding.
  const rv = (r) => r.review?.verdict ?? 'none'
  const shadowed = rows.filter((r) => rv(r) !== 'none')
  const escaped = shadowed.filter((r) => escapePrs.has(r.number) || r.followUps.length > 0)
  out.push(shadowed.length
    ? row('The shadow reviewer (`pr-review`)', escaped.filter((r) => !r.review.medPlus).map((r) => `#${r.number}`), escaped.length,
      `Denominator: shadow-reviewed PRs that escaped (a seeded escape, or a fix within 7 days on the same code). A miss is an escape whose last verdict before merge named no MED+ finding. Verdict before merge: ${shadowed.length} of ${rows.length} ledger PRs; "not-pass" merged anyway: ${shadowed.filter((r) => r.review.mergedOnNotPass).map((r) => `#${r.number}`).join(', ') || 'none'}.`)
    : notMeasured('The shadow reviewer (`pr-review`)', 'no ledger PR has a `pr-review` verdict before its merge yet (the reviewer starts with phase RV1b); the Part 4 shadow table reads 20.'))

  // /critique runs after merge on the web build; nothing records what it saw.
  const critiqueFixes = new Set(rows.flatMap((r) => r.followUps).filter((f) => /CRITIQUE/.test(f.subject)).map((f) => f.sha))
  out.push(notMeasured('`/critique`',
    `it plays the deployed web build after merge and no ledger row records what a pass saw against what had escaped, so it has no denominator. Context: ${critiqueFixes.size} follow-up fix(es) in the ledger cite a critique pass.`))

  // The merge gate: merged before a check on the final head finished, or on a "not a pass".
  const early = rows.filter((r) => r.ran.some((c) => c.finishedAfterMerge) || r.antagonist?.mergedOnNotPass)
  out.push(row('The merge gate', early.map((r) => `#${r.number}`), rows.length,
    'A miss is a merge before every check on the final head finished, or over an antagonist "not a pass" (S1).'))

  // The builder's own [x]: ticked lines the evidence shows unproven.
  if (replay) {
    const unproven = replay.ticks.filter((t) => t.unproven).map((t) => `#${t.pr} ${t.id}`)
    const seededTicks = replay.seedTicks.map((t) => `#${t.pr} ${t.id} (S3)`)
    const misses = [...new Set([...unproven, ...seededTicks, '#523 verify:visual (S5)'])]
    const naming = replay.ticks.filter((t) => t.named.length === 0).length
    out.push(row("The builder's own `[x]`", misses, replay.ticks.length,
      `Misses: ticks the parent replay found unproven (${unproven.length}), the seeded S3 ticks and S5's missing shot. ${naming} of ${replay.ticks.length} ticks name no test, so the replay can neither prove nor clear them.`))
  } else {
    out.push(notMeasured("The builder's own `[x]`", 'no parent replay (`parent-replay.json`) to read the ticks from.'))
  }
  return out
}

const cell = (s) => String(s).replace(/\|/g, '\\|')

/**
 * The miss-rate section of `docs/reports/eval/latest.md`, markers included.
 *
 * @param {{ stamp: { commit: string, date: string }, rows: object[], inputs: Record<string, string> }} table the computed table.
 * @returns {string} markdown.
 */
export function renderMissRateSection(table) {
  const out = [SECTION_START, '', '## Miss rate per judge (EV1c, A7)', '']
  out.push(`Stamp: commit \`${table.stamp.commit}\` (${table.stamp.date}). Regenerate with \`node scripts/eval/miss-rates.mjs\`; inputs: ${Object.entries(table.inputs).map(([k, v]) => `${k} at \`${v}\``).join(', ')}.`, '')
  out.push('| Judge | Missed | Of | Rate | Rows it comes from | How it is counted |', '|---|---|---|---|---|---|')
  for (const r of table.rows) {
    if (r.misses == null) {
      out.push(`| ${r.judge} | not measured | - | - | - | ${cell(r.note)} |`)
      continue
    }
    out.push(`| ${r.judge} | ${r.misses.length} | ${r.of} | ${r.rate == null ? 'n/a' : `${r.rate}%`} | ${cell(r.misses.join(', ') || 'none')} | ${cell(r.note)} |`)
  }
  out.push('', 'Android has no gate at all (S6), so it has no rate (brief Decisions).', '', SECTION_END)
  return out.join('\n')
}
