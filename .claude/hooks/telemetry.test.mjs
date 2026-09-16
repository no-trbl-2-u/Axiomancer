// .claude/hooks/telemetry.test.mjs — behaviour tests for the telemetry hook.
//
// Part of the root `npm test` suite. Drives .claude/hooks/telemetry.mjs with
// synthetic hook payloads inside a throwaway project root and asserts the rows
// it writes, including a regression test for the relative-LOG-path bug that
// diverted rows into workspace-package logs (fixed 2026-09-15).
//
// The hook must never block a tick, so it always exits 0; these tests assert on
// the rows it produces, not on its exit code.

import { execFileSync } from 'node:child_process'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test, before, after } from 'node:test'

const HOOK = path.resolve('.claude/hooks/telemetry.mjs')

let root // throwaway CLAUDE_PROJECT_DIR for the whole file
let transcript

before(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'telemetry-hook-'))
  fs.mkdirSync(path.join(root, '.claude', 'hooks'), { recursive: true })
  // A minimal transcript: one main-thread assistant turn, plus a sidechain
  // turn on a different model that resolveModel must NOT pick up.
  transcript = path.join(root, 'transcript.jsonl')
  fs.writeFileSync(
    transcript,
    [
      JSON.stringify({ type: 'user', isSidechain: false, message: { role: 'user' } }),
      JSON.stringify({
        type: 'assistant',
        isSidechain: false,
        message: { model: 'claude-opus-5' },
      }),
      JSON.stringify({
        type: 'assistant',
        isSidechain: true,
        message: { model: 'claude-haiku-4-5' },
      }),
    ].join('\n') + '\n',
  )
})

after(() => fs.rmSync(root, { recursive: true, force: true }))

/** Run the hook in `mode` with `payload` on stdin, from a given cwd. */
const fire = (mode, payload, cwd = root) =>
  execFileSync('node', [HOOK, mode], {
    input: JSON.stringify(payload),
    cwd,
    env: { ...process.env, CLAUDE_PROJECT_DIR: root },
  })

/** Every data row currently in the throwaway root's log. */
const rows = () => {
  const log = path.join(root, 'TELEMETRY.md')
  if (!fs.existsSync(log)) return []
  return fs
    .readFileSync(log, 'utf-8')
    .split('\n')
    .filter((l) => /^\| 20\d\d-/.test(l))
}

const base = () => ({ session_id: 's1', transcript_path: transcript })

test('a slash prompt is logged with the main-thread model', () => {
  fire('prompt', { ...base(), prompt: '/march' })
  const [row] = rows()
  assert.match(row, /\| slash-prompt \| \/march \|/)
  assert.match(row, /claude-opus-5/, 'model comes from the main-thread assistant entry')
  assert.doesNotMatch(row, /haiku/, "a sidechain's model is never attributed to the tick")
})

test('a plain prompt is not logged', () => {
  const before = rows().length
  fire('prompt', { ...base(), prompt: 'just a question' })
  assert.equal(rows().length, before)
})

// A plain prompt still opens a tick even though it writes no row. Without
// that, an attended session that never invokes a logged verb has no tick
// start and its tick-end can only report a '-' duration.
test('a plain prompt still starts the tick clock', () => {
  // Isolate: clear any tick left open by an earlier test, so this asserts
  // that THIS prompt started the clock rather than inheriting one.
  fs.rmSync(path.join(root, '.claude', 'hooks', '.telemetry-state.json'), { force: true })
  fire('prompt', { ...base(), prompt: 'a prose question, no slash' })
  fire('tick-end', base())
  const end = rows().at(-1)
  assert.match(end, /\| tick-end \|/)
  assert.match(end, /\| \d+[smh][^|]*\|/, `tick-end should carry a duration: ${end}`)
})

test('a subagent spawn writes a start row, then an end row with its duration', () => {
  const spawn = {
    ...base(),
    tool_name: 'Task',
    tool_input: {
      subagent_type: 'card-expert',
      description: 'Run pass 12',
      model: 'claude-sonnet-5',
    },
  }
  fire('tool', spawn)
  const start = rows().at(-1)
  assert.match(start, /\| subagent \| card-expert \|/)
  assert.match(start, /claude-sonnet-5/, 'a pinned spawn model beats the transcript')
  assert.match(start, /\| - \| Run pass 12 \|$/, 'a start row carries no duration')

  fire('tool-end', { ...spawn, tool_response: { status: 'success' } })
  const end = rows().at(-1)
  assert.match(end, /\| subagent-end \| card-expert \|/)
  assert.match(end, /\| \d+s \|/, 'an end row carries a duration')
  assert.match(end, /\| ok \|$/)
})

test('a failed call records its error on the end row', () => {
  const call = { ...base(), tool_name: 'Skill', tool_input: { skill: 'forge' } }
  fire('tool', call)
  fire('tool-end', {
    ...call,
    tool_response: { is_error: true, error: 'wiring checklist incomplete' },
  })
  assert.match(rows().at(-1), /\| skill-end \| forge \|.*error: wiring checklist incomplete \|$/)
})

test('tick-end reports a call that never returned', () => {
  fire('tool', { ...base(), tool_name: 'Skill', tool_input: { skill: 'iterate' } })
  fire('tick-end', base())
  const end = rows().at(-1)
  assert.match(end, /\| tick-end \|/)
  assert.match(end, /1 call\(s\) never returned \|$/)
  assert.match(end, /\| \d+[smh]/, 'tick-end carries the tick duration')
})

// The bug this suite exists for: hooks do not reliably run with cwd = repo
// root, and a bare relative log path then writes a second log inside the
// workspace package. Six real rows were lost that way before it was caught.
test('a tick running inside a package still writes to the root log', () => {
  const pkg = path.join(root, 'axiomancer-mechanics')
  fs.mkdirSync(pkg, { recursive: true })
  const before = rows().length
  fire('tool', { ...base(), tool_name: 'Task', tool_input: { subagent_type: 'Explore' } }, pkg)
  assert.equal(rows().length, before + 1, 'the row landed in the root log')
  assert.ok(!fs.existsSync(path.join(pkg, 'TELEMETRY.md')), 'no second log was created')
})

test('garbage on stdin never blocks the tick', () => {
  assert.doesNotThrow(() =>
    execFileSync('node', [HOOK, 'tool'], {
      input: 'not json at all',
      cwd: root,
      env: { ...process.env, CLAUDE_PROJECT_DIR: root },
    }),
  )
})

test('the log is capped and stays parseable as a markdown table', () => {
  const log = fs.readFileSync(path.join(root, 'TELEMETRY.md'), 'utf-8')
  const header = log.split('\n').find((l) => l.startsWith('| when'))
  assert.equal(header.split('|').length - 2, 6, 'six columns')
  for (const row of rows()) {
    assert.equal(row.split('|').length - 2, 6, `row has six cells: ${row}`)
  }
})
