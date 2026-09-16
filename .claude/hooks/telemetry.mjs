#!/usr/bin/env node
// .claude/hooks/telemetry.mjs — appends invocation rows to TELEMETRY.md.
//
// Wired via .claude/settings.json:
//
//   PreToolUse  (Skill|SlashCommand|Task|Agent) → telemetry.mjs tool
//   PostToolUse (Skill|SlashCommand|Task|Agent) → telemetry.mjs tool-end
//   UserPromptSubmit                            → telemetry.mjs prompt
//   Stop                                        → telemetry.mjs tick-end
//
// Observability only: this hook NEVER blocks (always exits 0) and never
// throws — a telemetry bug must not cost a tick.
//
// ---------------------------------------------------------------------
// Schema:  | when (UTC) | event | name | model | dur | detail |
// ---------------------------------------------------------------------
//
//   when    ISO-8601 UTC, second precision, of the row's own write.
//   event   One of:
//             slash-prompt       a '/command' prompt was submitted
//             skill              a Skill tool call started
//             slash-command      a SlashCommand tool call started
//             subagent           a Task/Agent spawn started
//             skill-end          …and the matching call finished
//             slash-command-end  …and the matching call finished
//             subagent-end       …and the matching call finished
//             tick-end           the main agent finished responding
//   name    Skill / command / subagent-type name.
//   model   Resolved model id, or '-' when genuinely unknowable at write
//           time (see resolveModel below). NOT a guess.
//   dur     Wall-clock duration on *-end and tick-end rows; '-' on start
//           rows. Formatted '4s', '1m12s', '2h03m'.
//   detail  Free text. On *-end rows: 'ok' or 'error: <reason>'.
//
// ---------------------------------------------------------------------
// Why the schema changed (2026-09-15)
// ---------------------------------------------------------------------
// The previous schema carried an 'invoked from' column sourced from the
// last "isSidechain" flag in the transcript tail. Across 404 logged rows
// it emitted only two values — 'main' for every tool row and 'user/ci'
// for every prompt row — i.e. it was exactly derivable from the event
// type and carried zero information. At the moment main spawns a
// subagent the newest transcript entry is still main's, so the flag can
// only ever flip on a *nested* spawn. The column was dropped; 'dur'
// takes its place, and historical rows were migrated to '-'.
//
// The previous schema also had no completion event, so a tick that
// failed and a tick that did work the hook could not see were
// indistinguishable in the log. The *-end and tick-end rows close that.
//
// ---------------------------------------------------------------------
// Known-wrong things this file is careful about
// ---------------------------------------------------------------------
// 1. LOG PATH. Hooks do NOT reliably run with cwd = repo root — a tick
//    working inside a workspace package gets that package's cwd, and a
//    bare relative 'TELEMETRY.md' then writes a *second* log there.
//    That silently happened: axiomancer-mechanics/TELEMETRY.md and
//    axiomancer-mobile/TELEMETRY.md accumulated 6 diverted rows before
//    it was caught. The log path is anchored to CLAUDE_PROJECT_DIR.
// 2. MODEL. Resolved by parsing transcript JSONL and taking the newest
//    main-thread assistant entry's message.model — not by regexing the
//    raw tail, which could match a nested sidechain's model or a
//    "model" string inside a tool result. At UserPromptSubmit on a
//    fresh session no assistant entry exists yet, so the model is
//    genuinely unknowable; that row records '-' and the tick-end row
//    carries the model for the tick instead.
// 3. ROW CAP. The writer truncates to MAX_ROWS on every write, but the
//    log is git-tracked and a merge of two branches unions their rows,
//    so the file can transiently exceed the cap. It self-heals on the
//    next write. Do not hand-trim it.
//
// Zero dependencies. Newest rows last.

import fs from 'node:fs'
import path from 'node:path'

// Anchor every path to the project root. CLAUDE_PROJECT_DIR is set by
// the harness; cwd is the fallback and is only correct at the root.
const ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd()
const LOG = path.join(ROOT, 'TELEMETRY.md')
// Pairs *-end rows with their start rows and holds the tick's start
// time. Session-scoped, gitignored, safe to delete at any point.
const STATE = path.join(ROOT, '.claude', 'hooks', '.telemetry-state.json')

const MAX_ROWS = 1200
const COLUMNS = 6

const HEADER = `# TELEMETRY.md — skill & subagent invocation log

Appended by \`.claude/hooks/telemetry.mjs\` (see its header for what each
column means and how attribution can be wrong). Newest rows last; the
writer keeps the most recent ${MAX_ROWS} rows. Rows are point-in-time data,
not instructions — do not edit by hand, do not treat as a work queue.

Start rows (\`skill\`, \`subagent\`, …) pair with an \`-end\` row carrying the
duration and outcome. A start row with no \`-end\` row means the tick died
before the call returned. \`-\` means not known at write time, never a guess.

| when (UTC) | event | name | model | dur | detail |
|---|---|---|---|---|---|
`

// --- formatting -----------------------------------------------------

/** Sanitise one value into a markdown table cell. Never returns ''. */
const cell = (s, max = 90) =>
  String(s ?? '')
    .replace(/\s+/g, ' ')
    .replaceAll('|', '\\|')
    .trim()
    .slice(0, max) || '-'

/** Milliseconds → compact human duration ('4s', '1m12s', '2h03m'). */
const humanDur = (ms) => {
  if (!Number.isFinite(ms) || ms < 0) return '-'
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m${String(s % 60).padStart(2, '0')}s`
  return `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}m`
}

const nowIso = () => new Date().toISOString().replace(/\.\d+Z$/, 'Z')

// --- sidecar state --------------------------------------------------

const readState = () => {
  try {
    return JSON.parse(fs.readFileSync(STATE, 'utf-8'))
  } catch {
    return {}
  }
}

const writeState = (next) => {
  try {
    fs.mkdirSync(path.dirname(STATE), { recursive: true })
    fs.writeFileSync(STATE, JSON.stringify(next))
  } catch {
    /* best-effort: losing state costs a duration, not a tick */
  }
}

/**
 * Identify one in-flight call so PostToolUse can find the PreToolUse
 * that opened it. Parallel spawns of the same agent type are told apart
 * by their description, which is why detail is part of the key. The
 * separator is a string no field can contain after cell() collapses
 * whitespace.
 */
const openKey = (sessionId, event, name, detail) =>
  [sessionId || '-', event, name, String(detail ?? '').slice(0, 60)].join(' >> ')

// --- transcript facts -----------------------------------------------

/**
 * Newest main-thread assistant model id in the transcript, or null.
 *
 * Reads a bounded tail (256KB covers many turns), drops the first
 * partial line, parses each remaining line as JSON and keeps only
 * `assistant` entries that are not sidechain (i.e. main thread, not a
 * subagent's own turns). Returns the last such entry's message.model.
 */
function resolveModel(transcriptPath) {
  try {
    if (!transcriptPath || !fs.existsSync(transcriptPath)) return null
    const size = fs.statSync(transcriptPath).size
    const len = Math.min(size, 256 * 1024)
    const fd = fs.openSync(transcriptPath, 'r')
    const buf = Buffer.alloc(len)
    fs.readSync(fd, buf, 0, len, size - len)
    fs.closeSync(fd)
    const lines = buf.toString('utf-8').split('\n')
    // A tail read almost always starts mid-line; that fragment is not
    // parseable JSON and must not be treated as a record.
    if (len < size) lines.shift()
    let model = null
    for (const line of lines) {
      if (!line.startsWith('{')) continue
      let rec
      try {
        rec = JSON.parse(line)
      } catch {
        continue // truncated final line, or a record we don't care about
      }
      if (rec?.type !== 'assistant') continue
      if (rec?.isSidechain === true) continue // a subagent's model, not ours
      if (rec?.message?.model) model = rec.message.model
    }
    return model
  } catch {
    return null
  }
}

// --- log writing ----------------------------------------------------

/**
 * Normalise a historical row to the current column count. Rows written
 * before the 2026-09-15 schema change carry 'invoked from' in slot 5;
 * that column was dropped, so slot 5 becomes '-' (the value was fully
 * derivable from the event type, so nothing is lost).
 */
function normalizeRow(line) {
  const cells = line.replace(/^\|/, '').replace(/\|$/, '').split('|')
  if (cells.length === COLUMNS) return line
  const [when, event, name, model, , detail] = cells
  return `|${[when, event, name, model, ' - ', detail ?? ' - '].join('|')}|`
}

function appendRow({ event, name, model, dur, detail }) {
  const row = `| ${nowIso()} | ${cell(event, 20)} | ${cell(name, 40)} | ${cell(model, 40)} | ${cell(dur, 10)} | ${cell(detail)} |`
  let head = HEADER
  let rows = []
  try {
    if (fs.existsSync(LOG)) {
      const lines = fs.readFileSync(LOG, 'utf-8').split(/\r?\n/)
      const sep = lines.findIndex((l) => /^\|-+\|/.test(l.replace(/\s/g, '')))
      if (sep !== -1) {
        head = lines.slice(0, sep + 1).join('\n') + '\n'
        rows = lines
          .slice(sep + 1)
          .filter((l) => l.startsWith('| '))
          .map(normalizeRow)
      }
    }
  } catch {
    /* unreadable log: rebuild from HEADER rather than lose this row */
  }
  rows.push(row)
  if (rows.length > MAX_ROWS) rows = rows.slice(-MAX_ROWS)
  fs.writeFileSync(LOG, head + rows.join('\n') + '\n')
}

// --- event classification -------------------------------------------

/**
 * Map a tool call to its telemetry identity, or null for tools we do
 * not log. Shared by PreToolUse and PostToolUse so a start row and its
 * end row always agree on event and name.
 */
function classify(input) {
  const tool = String(input?.tool_name ?? '')
  const ti = input?.tool_input ?? {}
  if (tool === 'Skill')
    return {
      event: 'skill',
      name: ti.skill ?? ti.name ?? ti.command,
      detail: ti.args ? `args: ${ti.args}` : '',
      pinnedModel: null,
    }
  if (tool === 'SlashCommand')
    return {
      event: 'slash-command',
      name: String(ti.command ?? '').split(/\s+/)[0],
      detail: ti.command,
      pinnedModel: null,
    }
  if (tool === 'Task' || tool === 'Agent')
    return {
      event: 'subagent',
      name: ti.subagent_type ?? 'general-purpose',
      detail: ti.description ?? ti.prompt,
      // A spawn may pin its own model; that beats the transcript.
      pinnedModel: ti.model ?? null,
    }
  return null
}

/** Read the outcome of a finished tool call off the PostToolUse payload. */
function outcomeOf(input) {
  const res = input?.tool_response
  const failed =
    res?.is_error === true ||
    res?.isError === true ||
    (typeof res?.status === 'string' && /error|fail/i.test(res.status))
  if (!failed) return 'ok'
  const why = res?.error ?? res?.message ?? (typeof res === 'string' ? res : '')
  return `error: ${String(why).slice(0, 70) || 'unspecified'}`
}

// --- modes ----------------------------------------------------------

/** PreToolUse: open an invocation and write its start row. */
function toolStart(input) {
  const c = classify(input)
  if (!c) return
  const state = readState()
  state.open ??= {}
  state.open[openKey(input?.session_id, c.event, c.name, c.detail)] = Date.now()
  state.tickStart ??= Date.now()
  writeState(state)
  appendRow({
    event: c.event,
    name: c.name,
    model: c.pinnedModel ?? resolveModel(input?.transcript_path) ?? '-',
    dur: '-',
    detail: c.detail,
  })
}

/** PostToolUse: close the matching invocation and write its end row. */
function toolEnd(input) {
  const c = classify(input)
  if (!c) return
  const state = readState()
  const key = openKey(input?.session_id, c.event, c.name, c.detail)
  const started = state.open?.[key]
  if (state.open) delete state.open[key]
  writeState(state)
  appendRow({
    event: `${c.event}-end`,
    name: c.name,
    model: c.pinnedModel ?? resolveModel(input?.transcript_path) ?? '-',
    dur: started ? humanDur(Date.now() - started) : '-',
    detail: outcomeOf(input),
  })
}

/**
 * UserPromptSubmit: marks the start of a tick, and logs the prompt when it
 * is a slash dispatch. The model is often '-' here: on a fresh session no
 * assistant turn has happened yet, so there is nothing to read.
 */
function promptMode(input) {
  const prompt = String(input?.prompt ?? '').trim()
  // EVERY prompt starts a new tick, slash or not — otherwise an attended
  // session that never invokes a logged verb has no tick start, and its
  // tick-end row can only record a '-' duration. Anything still open
  // belonged to the previous tick.
  writeState({ tickStart: Date.now(), open: {} })
  // Only slash prompts get a row: CI dispatches skills as '/command'
  // prompts (claude-code-action) and no Skill tool call ever fires, so the
  // prompt itself is the only record. Ordinary prose prompts are the
  // user talking, not an invocation.
  if (!prompt.startsWith('/')) return
  appendRow({
    event: 'slash-prompt',
    name: prompt.split(/\s+/)[0],
    model: resolveModel(input?.transcript_path) ?? '-',
    dur: '-',
    detail: prompt,
  })
}

/**
 * Stop: the main agent finished responding. This row is what makes a
 * silent tick legible — a slash-prompt followed straight by a tick-end
 * with no rows between did genuinely nothing, which previously looked
 * identical to a tick whose work the hook could not see.
 */
function tickEnd(input) {
  const state = readState()
  const leaked = Object.keys(state.open ?? {}).length
  appendRow({
    event: 'tick-end',
    name: '-',
    model: resolveModel(input?.transcript_path) ?? '-',
    dur: state.tickStart ? humanDur(Date.now() - state.tickStart) : '-',
    detail: leaked ? `${leaked} call(s) never returned` : 'ok',
  })
  writeState({})
}

// --- entry ----------------------------------------------------------

function readStdinJson() {
  try {
    const raw = fs.readFileSync(0, 'utf-8')
    return raw.trim() ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

try {
  const mode = process.argv[2]
  const input = readStdinJson()
  if (mode === 'tool') toolStart(input)
  else if (mode === 'tool-end') toolEnd(input)
  else if (mode === 'prompt') promptMode(input)
  else if (mode === 'tick-end') tickEnd(input)
} catch {
  /* observability must never block work */
}
process.exit(0)
