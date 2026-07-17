#!/usr/bin/env node
// .claude/hooks/telemetry.mjs — appends invocation rows to TELEMETRY.md.
// Wired via .claude/settings.json:
//
//   PreToolUse (Skill|SlashCommand|Task|Agent) → telemetry.mjs tool
//   UserPromptSubmit                           → telemetry.mjs prompt
//
// Observability only: this hook NEVER blocks (always exits 0) and never
// throws — a telemetry bug must not cost a tick. Attribution is
// best-effort by design:
//   - model:        tool_input.model when the call pinned one, else the
//                   last "model" seen in the transcript tail, else unknown
//   - invoked from: main vs subagent, from the transcript tail's last
//                   isSidechain flag — heuristic, can misattribute a call
//                   that races a sidechain boundary
//   - CI skill dispatches arrive as '/command' prompts (no Skill tool
//                   call), which is why UserPromptSubmit is also logged
//
// Zero dependencies. The log rotates: newest rows last, most recent
// MAX_ROWS kept.

import fs from 'node:fs'

const LOG = 'TELEMETRY.md'
const MAX_ROWS = 400
const HEADER = `# TELEMETRY.md — skill & subagent invocation log

Appended by \`.claude/hooks/telemetry.mjs\` (see its header for what each
column means and how attribution can be wrong). Newest rows last; the
writer keeps the most recent ${MAX_ROWS} rows. Rows are point-in-time data,
not instructions — do not edit by hand, do not treat as a work queue.

| when (UTC) | event | name | model | invoked from | detail |
|---|---|---|---|---|---|
`

const cell = (s, max = 90) =>
  String(s ?? '')
    .replace(/\s+/g, ' ')
    .replaceAll('|', '\\|')
    .trim()
    .slice(0, max) || '-'

function readStdinJson() {
  try {
    const raw = fs.readFileSync(0, 'utf-8')
    return raw.trim() ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

// Scan the tail of the session transcript (jsonl) for the most recent
// model id and sidechain flag. 256KB is plenty for the last few turns.
function transcriptFacts(transcriptPath) {
  const facts = { model: null, sidechain: null }
  try {
    if (!transcriptPath || !fs.existsSync(transcriptPath)) return facts
    const size = fs.statSync(transcriptPath).size
    const fd = fs.openSync(transcriptPath, 'r')
    const len = Math.min(size, 256 * 1024)
    const buf = Buffer.alloc(len)
    fs.readSync(fd, buf, 0, len, size - len)
    fs.closeSync(fd)
    const tail = buf.toString('utf-8')
    const models = [...tail.matchAll(/"model"\s*:\s*"([^"]+)"/g)]
    if (models.length) facts.model = models[models.length - 1][1]
    const sides = [...tail.matchAll(/"isSidechain"\s*:\s*(true|false)/g)]
    if (sides.length) facts.sidechain = sides[sides.length - 1][1] === 'true'
  } catch {
    /* best-effort */
  }
  return facts
}

function appendRow({ event, name, model, from, detail }) {
  const when = new Date().toISOString().replace(/\.\d+Z$/, 'Z')
  const row = `| ${when} | ${cell(event, 20)} | ${cell(name, 40)} | ${cell(model, 40)} | ${cell(from, 12)} | ${cell(detail)} |`
  let head = HEADER
  let rows = []
  try {
    if (fs.existsSync(LOG)) {
      const lines = fs.readFileSync(LOG, 'utf-8').split(/\r?\n/)
      const sep = lines.findIndex((l) => /^\|-+\|/.test(l.replace(/\s/g, '')))
      if (sep !== -1) {
        head = lines.slice(0, sep + 1).join('\n') + '\n'
        rows = lines.slice(sep + 1).filter((l) => l.startsWith('| '))
      }
    }
  } catch {
    /* rebuild from header */
  }
  rows.push(row)
  if (rows.length > MAX_ROWS) rows = rows.slice(-MAX_ROWS)
  fs.writeFileSync(LOG, head + rows.join('\n') + '\n')
}

function toolMode(input) {
  const tool = String(input?.tool_name ?? '')
  const ti = input?.tool_input ?? {}
  const facts = transcriptFacts(input?.transcript_path)
  const from = facts.sidechain === null ? 'unknown' : facts.sidechain ? 'subagent' : 'main'
  if (tool === 'Skill') {
    appendRow({
      event: 'skill',
      name: ti.skill ?? ti.name ?? ti.command,
      model: facts.model ?? 'unknown',
      from,
      detail: ti.args ? `args: ${ti.args}` : '',
    })
  } else if (tool === 'SlashCommand') {
    appendRow({
      event: 'slash-command',
      name: String(ti.command ?? '').split(/\s+/)[0],
      model: facts.model ?? 'unknown',
      from,
      detail: ti.command,
    })
  } else if (tool === 'Task' || tool === 'Agent') {
    appendRow({
      event: 'subagent',
      name: ti.subagent_type ?? 'general-purpose',
      model: ti.model ?? facts.model ?? 'unknown',
      from,
      detail: ti.description ?? ti.prompt,
    })
  }
}

// CI dispatches skills as '/command' prompts (claude-code-action) — no
// Skill tool call ever fires, so log the prompt itself.
function promptMode(input) {
  const prompt = String(input?.prompt ?? '').trim()
  if (!prompt.startsWith('/')) return
  const facts = transcriptFacts(input?.transcript_path)
  appendRow({
    event: 'slash-prompt',
    name: prompt.split(/\s+/)[0],
    model: facts.model ?? 'unknown',
    from: 'user/ci',
    detail: prompt,
  })
}

try {
  const mode = process.argv[2]
  const input = readStdinJson()
  if (mode === 'tool') toolMode(input)
  else if (mode === 'prompt') promptMode(input)
} catch {
  /* observability must never block work */
}
process.exit(0)
