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

/** The throwaway root's shard directory, and the shard files in it. */
const logDir = () => path.join(root, 'telemetry')
const shards = () => (fs.existsSync(logDir()) ? fs.readdirSync(logDir()).sort() : [])

/**
 * Every data row in the throwaway root's shards, in write order. Each
 * shard is append-only, and within one test run the rows are written
 * sequentially, so sorting by the timestamp cell (stable) recovers the
 * write order across shards.
 */
const rows = () =>
  shards()
    .flatMap((f) => fs.readFileSync(path.join(logDir(), f), 'utf-8').split('\n'))
    .filter((l) => /^\| 20\d\d-/.test(l))
    .sort((a, b) => (a.slice(2, 22) < b.slice(2, 22) ? -1 : a.slice(2, 22) > b.slice(2, 22) ? 1 : 0))

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
/** Forget any tick left open by an earlier test, so a case starts clean. */
const clearTick = () =>
  fs.rmSync(path.join(root, '.claude', 'hooks', '.telemetry-state.json'), { force: true })

// A conversational turn is the user talking, not a tick. Logging it dirtied
// the log every turn and demanded a commit per turn, burying the real
// ticks in churn.
test('a conversational turn writes no tick-end row at all', () => {
  clearTick()
  const before = rows().length
  fire('prompt', { ...base(), prompt: 'a prose question, no slash' })
  fire('tick-end', base())
  assert.equal(rows().length, before, 'a turn that invoked no verb leaves no trace')
})

// …but a tick that did invoke something still closes with a duration, which
// is the whole point of the tick-end row.
test('a tick that invoked a verb closes with a duration', () => {
  clearTick()
  fire('prompt', { ...base(), prompt: 'a prose question, no slash' })
  const call = { ...base(), tool_name: 'Skill', tool_input: { skill: 'critique' } }
  fire('tool', call)
  fire('tool-end', { ...call, tool_response: { status: 'success' } })
  fire('tick-end', base())
  const end = rows().at(-1)
  assert.match(end, /\| tick-end \|/)
  assert.match(end, /\| \d+[smh][^|]*\|/, `tick-end should carry a duration: ${end}`)
})

// A slash dispatch that then does nothing is the signal the tick-end row
// exists to make legible — it must not be silenced as conversational.
test('a slash dispatch that does nothing still closes the tick', () => {
  clearTick()
  fire('prompt', { ...base(), prompt: '/march' })
  fire('tick-end', base())
  const [dispatch, end] = rows().slice(-2)
  assert.match(dispatch, /\| slash-prompt \| \/march \|/)
  assert.match(end, /\| tick-end \|/, 'a dispatch that reached no verb is still a tick')
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
  assert.ok(!fs.existsSync(path.join(pkg, 'telemetry')), 'no second log was created')
})

// The reason the log is sharded (2026-09-23): a single shared file made
// every pair of branches that each logged a row conflict on merge. Two
// sessions must therefore never write to the same file.
test('two sessions write to two separate shards, named by date and session id', () => {
  const call = (session_id) => ({ session_id, transcript_path: transcript, tool_name: 'Skill', tool_input: { skill: 'jot' } })
  fire('tool', call('sess-A'))
  fire('tool', call('sess-B'))
  const today = new Date().toISOString().slice(0, 10)
  const a = path.join(logDir(), `${today}_sess-A.md`)
  const b = path.join(logDir(), `${today}_sess-B.md`)
  assert.ok(fs.existsSync(a) && fs.existsSync(b), `expected both shards, got ${shards().join(', ')}`)
  assert.equal(fs.readFileSync(a, 'utf-8').split('\n').filter((l) => /^\| 20/.test(l)).length, 1)
  assert.equal(fs.readFileSync(b, 'utf-8').split('\n').filter((l) => /^\| 20/.test(l)).length, 1)
})

test('a session id is reduced to filename-safe characters', () => {
  fire('tool', { session_id: '../../etc/pa ss', transcript_path: transcript, tool_name: 'Skill', tool_input: { skill: 'jot' } })
  const today = new Date().toISOString().slice(0, 10)
  assert.ok(fs.existsSync(path.join(logDir(), `${today}_etcpass.md`)), `got ${shards().join(', ')}`)
  assert.ok(!fs.existsSync(path.join(root, '..', 'etc')), 'no path traversal out of the log directory')
})

test('a payload with no session id still logs, to an unknown-session shard', () => {
  fire('tool', { transcript_path: transcript, tool_name: 'Skill', tool_input: { skill: 'jot' } })
  const today = new Date().toISOString().slice(0, 10)
  assert.ok(fs.existsSync(path.join(logDir(), `${today}_unknown-session.md`)))
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

test('every shard carries one table header and stays parseable as a markdown table', () => {
  assert.ok(shards().length > 0)
  for (const f of shards()) {
    const lines = fs.readFileSync(path.join(logDir(), f), 'utf-8').split('\n')
    const headers = lines.filter((l) => l.startsWith('| when'))
    assert.equal(headers.length, 1, `${f} has exactly one table header`)
    assert.equal(headers[0].split('|').length - 2, 6, 'six columns')
  }
  for (const row of rows()) {
    assert.equal(row.split('|').length - 2, 6, `row has six cells: ${row}`)
  }
})
