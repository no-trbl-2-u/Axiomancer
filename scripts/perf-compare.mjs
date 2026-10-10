// scripts/perf-compare.mjs
//
// Pure functions for the weekly performance audit: medians across runs,
// budget and drift checks, first-budget seeding, and the `[perf]` rows the
// audit files into plan/AUDIT.md. No I/O here; `scripts/perf-audit.mjs` is
// the only module that reads or writes anything.

/** Every budgeted metric and the kind that sets its thresholds. */
export const METRIC_KINDS = Object.freeze({
  bundleJsBytes: 'bytes',
  bundleJsGzipBytes: 'bytes',
  firstScreenMs: 'load',
  lcpMs: 'load',
  tbtMs: 'load',
  frameP95Ms: 'runtime',
  slowFramePct: 'runtime',
  longTaskMs: 'runtime',
  'engineMsPerCombat.all': 'engine',
})

/** Week-over-week drift thresholds by kind, as a fraction over the previous value. */
export const DRIFT = Object.freeze({ bytes: 0.05, engine: 0.15, load: 0.25, runtime: 0.25 })

/** `slowFramePct` drift also needs this many percentage points of absolute rise. */
export const SLOW_FRAME_MIN_POINTS = 2

/** Budget multipliers over the seeding median, by kind. */
export const BUDGET_HEADROOM = Object.freeze({ bytes: 1.1, engine: 1.2, load: 1.2, runtime: 1.2 })

/**
 * Lowest budget a metric may be seeded with. A quiet seed run can measure
 * zero blocking or long-task time, and a zero budget would turn the first
 * 1 ms long task into a finding.
 */
export const BUDGET_FLOORS = Object.freeze({ tbtMs: 50, longTaskMs: 50, slowFramePct: 1 })

/**
 * Median of a list of numbers.
 *
 * @param {number[]} xs values, in any order; must be non-empty.
 * @returns {number} the middle value, or the mean of the two middle values.
 * @example median([3, 1, 2]) // 2
 * @example median([4, 1, 3, 2]) // 2.5
 */
export function median(xs) {
  if (!xs.length) throw new Error('median of an empty list')
  const sorted = [...xs].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

/**
 * Medians every numeric leaf across runs, keeping the nesting of the first run.
 *
 * @param {object[]} runs metric objects of the same shape, e.g. three audit runs.
 * @returns {object} one object of the same shape holding the per-leaf medians.
 * @example summarize([{ a: 1, b: { c: 5 } }, { a: 3, b: { c: 1 } }, { a: 2, b: { c: 3 } }])
 *   // { a: 2, b: { c: 3 } }
 */
export function summarize(runs) {
  if (!runs.length) throw new Error('summarize needs at least one run')
  const out = {}
  for (const [key, value] of Object.entries(runs[0])) {
    if (typeof value === 'number') {
      out[key] = median(runs.map((r) => r[key]).filter((v) => typeof v === 'number'))
    } else if (value && typeof value === 'object') {
      out[key] = summarize(runs.map((r) => r[key] ?? {}))
    }
  }
  return out
}

/**
 * Reads a metric by its budget key; dotted keys walk into nested objects.
 *
 * @param {object} metrics a metrics object from a history line.
 * @param {string} key a budget key such as `lcpMs` or `engineMsPerCombat.all`.
 * @returns {number|undefined} the value, or undefined when absent.
 * @example metricValue({ engineMsPerCombat: { all: 1.2 } }, 'engineMsPerCombat.all') // 1.2
 */
export function metricValue(metrics, key) {
  const value = key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), metrics)
  return typeof value === 'number' ? value : undefined
}

/**
 * Has the runner's CPU changed since the previous history line?
 *
 * @param {{ runner?: { cpu?: string } }} current this run.
 * @param {{ runner?: { cpu?: string } } | null} previous the last history line, if any.
 * @returns {string|null} `runner changed: <old> → <new>`, or null when unchanged or unknown.
 * @example runnerChange({ runner: { cpu: 'B' } }, { runner: { cpu: 'A' } }) // 'runner changed: A → B'
 */
export function runnerChange(current, previous) {
  const before = previous?.runner?.cpu
  const after = current?.runner?.cpu
  if (!before || !after || before === after) return null
  return `runner changed: ${before} → ${after}`
}

/**
 * Checks this run against the budgets and against the previous history line.
 * One finding per metric: a budget breach outranks drift on the same metric.
 * Only increases count; a metric getting better is never a finding.
 *
 * @param {object} args
 * @param {{ metrics: object, runner?: object }} args.current this run's summary.
 * @param {{ metrics: object, runner?: object, commit?: string } | null} args.previous the last history line.
 * @param {Record<string, number>} args.budgets budget per metric key.
 * @param {Record<string, number>} [args.drift] drift fraction per kind; defaults to DRIFT.
 * @returns {{ metric: string, kind: string, type: 'budget breach'|'drift', value: number, limit: number, previous?: number }[]}
 * @example compare({ current: { metrics: { lcpMs: 900 } }, previous: null, budgets: { lcpMs: 800 } })
 *   // [{ metric: 'lcpMs', kind: 'load', type: 'budget breach', value: 900, limit: 800 }]
 */
export function compare({ current, previous, budgets, drift = DRIFT }) {
  const timingDriftOff = runnerChange(current, previous) !== null
  const findings = []
  for (const [metric, kind] of Object.entries(METRIC_KINDS)) {
    const value = metricValue(current.metrics, metric)
    if (value === undefined) continue
    const budget = budgets?.[metric]
    if (typeof budget === 'number' && value > budget) {
      findings.push({ metric, kind, type: 'budget breach', value, limit: budget })
      continue
    }
    if (!previous || (timingDriftOff && kind !== 'bytes')) continue
    const before = metricValue(previous.metrics, metric)
    if (before === undefined || before <= 0) continue
    const limit = before * (1 + drift[kind])
    const pointsOk = metric !== 'slowFramePct' || value - before >= SLOW_FRAME_MIN_POINTS
    if (value > limit && pointsOk) {
      findings.push({ metric, kind, type: 'drift', value, limit: roundLimit(metric, limit), previous: before })
    }
  }
  return findings
}

/**
 * Rounds a budget up the way its unit wants: bytes to the next KB, percent
 * to one decimal, milliseconds to the next whole ms.
 *
 * @param {string} metric a budget key.
 * @param {number} x the raw limit.
 * @returns {number} the rounded-up limit.
 * @example roundLimit('bundleJsBytes', 1500) // 2048
 * @example roundLimit('slowFramePct', 1.23) // 1.3
 * @example roundLimit('lcpMs', 812.2) // 813
 */
export function roundLimit(metric, x) {
  if (METRIC_KINDS[metric] === 'bytes') return Math.ceil(x / 1024) * 1024
  if (metric.endsWith('Pct')) return Math.ceil(Math.round(x * 1e6) / 1e5) / 10
  return Math.ceil(Math.round(x * 1e6) / 1e6)
}

/**
 * Seeds first budgets from a summary: bytes +10%, everything else +20%,
 * rounded up per unit and never under the floors.
 *
 * @param {object} summary a metrics object (the median of the seed runs).
 * @returns {Record<string, number>} budget per metric key, for the metrics present.
 * @example seedBudgets({ lcpMs: 1000, bundleJsBytes: 10000 }) // { bundleJsBytes: 11264, lcpMs: 1200 }
 */
export function seedBudgets(summary) {
  const budgets = {}
  for (const [metric, kind] of Object.entries(METRIC_KINDS)) {
    const value = metricValue(summary, metric)
    if (value === undefined) continue
    budgets[metric] = Math.max(roundLimit(metric, value * BUDGET_HEADROOM[kind]), BUDGET_FLOORS[metric] ?? 0)
  }
  return budgets
}

/**
 * Formats a metric value with its unit for an AUDIT row.
 *
 * @param {string} metric a budget key.
 * @param {number} x the value.
 * @returns {string} e.g. `512.0 KB`, `812 ms`, `3.4%`, `1.234 ms`.
 * @example formatValue('lcpMs', 812.4) // '812 ms'
 */
export function formatValue(metric, x) {
  if (METRIC_KINDS[metric] === 'bytes') return `${(x / 1024).toFixed(1)} KB`
  if (metric.endsWith('Pct')) return `${x.toFixed(1)}%`
  if (METRIC_KINDS[metric] === 'engine') return `${x.toFixed(3)} ms`
  return `${Math.round(x)} ms`
}

/**
 * The heading an AUDIT row for this finding carries.
 *
 * @param {{ metric: string, type: string, value: number, limit: number }} finding from `compare`.
 * @param {string} date ISO date of the run.
 * @returns {string} the `### [ ] [perf] …` heading line.
 * @example auditRowTitle({ metric: 'lcpMs', type: 'drift', value: 900, limit: 750 }, '2026-10-11')
 *   // '### [ ] [perf] lcpMs drift: 900 ms vs 750 ms (2026-10-11)'
 */
export function auditRowTitle(finding, date) {
  const { metric, type, value, limit } = finding
  return `### [ ] [perf] ${metric} ${type}: ${formatValue(metric, value)} vs ${formatValue(metric, limit)} (${date})`
}

/**
 * Renders one `[perf]` row in the plan/AUDIT.md Pending shape.
 *
 * @param {{ metric: string, kind: string, type: string, value: number, limit: number, previous?: number }} finding
 * @param {string} date ISO date of the run.
 * @param {{ commit?: string, previousCommit?: string }} [ctx] the commits behind the two history lines.
 * @returns {string} the markdown block, ending in a newline.
 * @example renderAuditRow({ metric: 'lcpMs', kind: 'load', type: 'budget breach', value: 900, limit: 800 }, '2026-10-11')
 */
export function renderAuditRow(finding, date, ctx = {}) {
  const { metric, kind, type, value, limit, previous } = finding
  const impact = kind === 'load' || kind === 'runtime' ? 5 : 4
  const was = previous === undefined ? '' : `, previous line ${formatValue(metric, previous)}`
  const limitName = type === 'drift' ? 'drift limit' : 'budget'
  return [
    auditRowTitle(finding, date),
    '- category: perf',
    `- impact: ${impact}`,
    '- ease: 5',
    `- detail: the weekly performance audit measured ${metric} at ${formatValue(metric, value)} `
      + `against a ${limitName} of ${formatValue(metric, limit)}${was}. `
      + `Commit ${ctx.commit ?? '-'}; previous history line at ${ctx.previousCommit ?? '-'} `
      + '(`docs/reports/perf/history.jsonl`).',
    '- next (`/iterate`): bisect the commits between the two history lines; fix or raise the budget with T.',
    '',
  ].join('\n')
}

/**
 * Files findings into plan/AUDIT.md text. A metric with an open `[perf]` row
 * gets an evidence line on that row instead of a second row; every other
 * finding becomes a new row at the top of `## Pending`.
 *
 * @param {string} auditText the current plan/AUDIT.md.
 * @param {object[]} findings from `compare`.
 * @param {string} date ISO date of the run.
 * @param {{ commit?: string, previousCommit?: string }} [ctx] commits for the row detail.
 * @returns {{ text: string, added: { finding: object, title: string }[], evidenced: string[] }}
 * @example fileFindings('## Pending\n', [finding], '2026-10-11').added.length // 1
 */
export function fileFindings(auditText, findings, date, ctx = {}) {
  let lines = auditText.split('\n')
  const added = []
  const evidenced = []
  const fresh = []
  for (const finding of findings) {
    const prefix = `### [ ] [perf] ${finding.metric} `
    const at = lines.findIndex((l) => l.startsWith(prefix))
    if (at === -1) {
      fresh.push(finding)
      continue
    }
    let end = at + 1
    while (end < lines.length && (lines[end].startsWith('- ') || /^\s+\S/.test(lines[end]))) end++
    const evidence = `- evidence ${date}: ${finding.type} ${formatValue(finding.metric, finding.value)} `
      + `vs ${formatValue(finding.metric, finding.limit)} at ${ctx.commit ?? '-'}`
    lines = [...lines.slice(0, end), evidence, ...lines.slice(end)]
    evidenced.push(finding.metric)
  }
  if (fresh.length) {
    const pending = lines.findIndex((l) => l.trim() === '## Pending')
    if (pending === -1) throw new Error('plan/AUDIT.md has no "## Pending" section')
    const blocks = fresh.map((f) => {
      added.push({ finding: f, title: auditRowTitle(f, date) })
      return renderAuditRow(f, date, ctx)
    })
    lines = [...lines.slice(0, pending + 1), '', ...blocks.join('\n').replace(/\n$/, '').split('\n'), ...lines.slice(pending + 1)]
  }
  return { text: lines.join('\n'), added, evidenced }
}

/**
 * Records an issue number on a filed row, directly under its heading.
 *
 * @param {string} auditText plan/AUDIT.md text holding the row.
 * @param {string} title the row's heading line, as `auditRowTitle` built it.
 * @param {number|string} issue the issue number.
 * @returns {string} the text with `- issue: #N` added, or unchanged when the row is missing.
 * @example addIssueLine('### [ ] [perf] x\n- category: perf', '### [ ] [perf] x', 7)
 *   // '### [ ] [perf] x\n- issue: #7\n- category: perf'
 */
export function addIssueLine(auditText, title, issue) {
  const lines = auditText.split('\n')
  const at = lines.indexOf(title)
  if (at === -1) return auditText
  return [...lines.slice(0, at + 1), `- issue: #${issue}`, ...lines.slice(at + 1)].join('\n')
}
