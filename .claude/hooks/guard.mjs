#!/usr/bin/env node
// .claude/hooks/guard.mjs — mechanical enforcement of the
// standing rules in AGENTS.md. Wired via .claude/settings.json:
//
//   PreToolUse (matcher: Bash)  → node .claude/hooks/guard.mjs pre-bash
//   PreToolUse (Write|Edit)     → node .claude/hooks/guard.mjs pre-write
//   PostToolUse (Write|Edit)    → node .claude/hooks/guard.mjs post-write
//   SessionStart                → node .claude/hooks/guard.mjs session-start
//   Stop                        → node .claude/hooks/guard.mjs stop
//
// Exit-code contract (Claude Code hooks):
//   0  allow / no opinion
//   2  BLOCK — stderr is fed back to the agent as feedback
//   other non-zero = hook error (logged, non-fatal)
//
// The guard is a backstop, not the primary enforcement — the
// skills' prose rules are. A block firing mid-run is itself a
// finding: record it in the commit body or plan/AUDIT.md.
//
// Modes:
//   pre-bash      check a Bash tool call against the forbidden list
//   pre-write     block hand-edits to measured baselines
//   post-write    run the retired-terminology lint (check-lexicon) on
//                 the .md file just written; findings feed back as
//                 exit 2 so the agent fixes them before CI does
//   session-start print measurement context (baseline freshness) to
//                 stdout for injection into the session
//   stop          warn (or block, with NEXUS_STRICT_STOP=1) when a
//                 turn ends with a dirty tree / unpushed commits
//   self-test     run canned commands through the matcher; exit 1
//                 on any mismatch (use in CI / after editing rules)
//
// Zero dependencies. Never throws: an unexpected error prints to
// stderr and exits 0 (fail-open) so a guard bug can't wedge the
// loop — the provider-level backstops still hold.

import { execSync, spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const DEFAULT_BRANCH = 'main'

// --- forbidden-command rules ------------------------------------------

// Each rule: name, test(command) → true = block, message for the
// agent. Messages say WHY and what to do instead, so a blocked
// call self-corrects instead of retrying.
const RULES = [
  {
    name: 'no-verify',
    test: (cmd) => /\bgit\b[^|;&]*\bcommit\b[^|;&]*(\s--no-verify\b|\s-n\b)/.test(cmd),
    message:
      'guard: --no-verify is forbidden (AGENTS.md standing rule 3). ' +
      'The verify gate is non-negotiable — fix the root cause of the ' +
      'failing check, then commit normally.',
  },
  {
    name: 'force-push',
    test: (cmd) =>
      /\bgit\b[^|;&]*\bpush\b[^|;&]*(\s--force(-with-lease)?\b|\s-f\b)/.test(cmd) ||
      /\bgit\b[^|;&]*\bpush\b[^|;&]*\s\+\S/.test(cmd),
    message:
      'guard: force-push is forbidden (AGENTS.md standing rule 3). ' +
      'If the push was rejected, run git pull --ff-only and re-apply. ' +
      'If history is genuinely wrong, stop and file [needs-user-call] ' +
      'per your skill\'s failure modes.',
  },
  {
    name: 'destructive-reset',
    test: (cmd) =>
      /\bgit\b[^|;&]*\breset\b[^|;&]*\s--hard\b/.test(cmd) ||
      /\bgit\b[^|;&]*\bclean\b[^|;&]*\s-[a-zA-Z]*f/.test(cmd) ||
      /\bgit\b[^|;&]*\bcheckout\b\s+(--\s+)?\.(\s|$)/.test(cmd) ||
      new RegExp(`\\bgit\\b[^|;&]*\\bbranch\\b[^|;&]*\\s-D\\s+${DEFAULT_BRANCH}\\b`).test(cmd),
    message:
      'guard: destructive resets are forbidden (AGENTS.md standing ' +
      'rule 3). Uncommitted work is either shipped (commit it) or a ' +
      'finding (write it to plan/AUDIT.md) — never discarded.',
  },
  {
    name: 'commit-message-from-file',
    test: (cmd) =>
      /\bgit\b[^|;&]*\bcommit\b[^|;&]*(\s--file\b|\s-[a-zA-Z]*F\b)/.test(cmd),
    message:
      'guard: git commit -F/--file is forbidden — the guard lints commit ' +
      'messages from the command string (AGENTS.md standing rule 2), and a ' +
      'message file is invisible to it. Write the message inline with -m.',
  },
  {
    name: 'trailer-or-emoji-in-commit',
    test: (cmd) =>
      /\bgit\b[^|;&]*\bcommit\b/.test(cmd) &&
      (/Co-Authored-By/i.test(cmd) ||
        /[\u{1F000}-\u{1FAFF}\u{2705}\u{2728}\u{FE0F}]/u.test(cmd)),
    message:
      'guard: commit bodies are plain (AGENTS.md standing rule 2) — ' +
      'no Co-Authored-By trailers, no emojis. The only sanctioned ' +
      'trailer is Cloud-Run: (cloud ticks only). Rewrite the message.',
  },
]

// Backgrounding the gate is its own rule because it needs the
// run_in_background flag, not just the command string. This is
// the "post-result exit hang" — see AGENTS.md standing rule 3.
function backgroundedGate(input) {
  const cmd = String(input?.tool_input?.command ?? '')
  const bg = input?.tool_input?.run_in_background === true
  return bg && /\b(verify|deploy:check|e2e|test)\b/.test(cmd)
}

const BACKGROUND_MESSAGE =
  'guard: never run the verify/deploy gate in the background ' +
  '(AGENTS.md standing rule 3 — the post-result exit hang). Run it ' +
  'as a foreground, blocking call and wait for it. If the gate is ' +
  'too slow, run its legs as sequential foreground calls.'

// --- modes --------------------------------------------------------------

function readStdinJson() {
  try {
    const raw = fs.readFileSync(0, 'utf-8')
    return raw.trim() ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function preBash() {
  const input = readStdinJson()
  const cmd = String(input?.tool_input?.command ?? '')
  if (!cmd) return 0
  if (backgroundedGate(input)) {
    process.stderr.write(BACKGROUND_MESSAGE + '\n')
    return 2
  }
  for (const rule of RULES) {
    if (rule.test(cmd)) {
      process.stderr.write(rule.message + '\n')
      return 2
    }
  }
  return 0
}

// --- write guards --------------------------------------------------------

// Repo-relative forward-slash path, or null. Hooks run with cwd = repo root.
function normalizeRel(p) {
  if (!p) return null
  let rel = String(p).replaceAll('\\', '/')
  const root = process.cwd().replaceAll('\\', '/')
  if (rel.startsWith(root)) rel = rel.slice(root.length).replace(/^\//, '')
  return rel
}

// Files that must never be hand-edited. Same shape as the OKF repo's
// GENERATED map: block + say where the truth actually lives.
const WRITE_BLOCKS = [
  {
    name: 'measured-baseline',
    test: (rel) => /\bdocs\/reports\/baselines\/[^/]+\.json$/.test(rel),
    message:
      'guard: baseline files are MEASURED truth — hand-editing one forges ' +
      'a measurement (see AGENTS.md → "Measured truth"). Re-measure via ' +
      'npm run baseline:regen instead.',
  },
]

function preWrite() {
  const input = readStdinJson()
  const rel = normalizeRel(input?.tool_input?.file_path)
  if (!rel) return 0
  for (const b of WRITE_BLOCKS) {
    if (b.test(rel)) {
      process.stderr.write(b.message + '\n')
      return 2
    }
  }
  return 0
}

// After any .md write, run the retired-terminology lint on just that file
// (same instant-feedback pattern as the OKF repo's post-write validator).
// check-lexicon applies its own zone/banner/pragma exemptions, so zoned
// files come back clean here without special-casing.
function postWrite() {
  const input = readStdinJson()
  const rel = normalizeRel(input?.tool_input?.file_path)
  if (!rel || !rel.endsWith('.md')) return 0
  if (!fs.existsSync(rel) || !fs.existsSync('scripts/check-lexicon.mjs')) return 0
  const res = spawnSync(process.execPath, ['scripts/check-lexicon.mjs', rel], {
    encoding: 'utf-8',
    timeout: 30_000,
  })
  if (res.error || res.status === null) return 0 // fail-open
  if (res.status !== 0) {
    process.stderr.write(
      'guard: retired terminology in the file just written:\n' +
      `${(res.stderr || res.stdout || '').trim()}\n`,
    )
    return 2
  }
  return 0
}

// --- session-start context ------------------------------------------------

// stdout from a SessionStart hook is injected as context, so every session
// opens knowing whether the combat baseline is fresh — mechanizes the
// "cite the baseline's stamp" rule in CLAUDE.md.
function sessionStart() {
  const lines = []
  try {
    const res = spawnSync(process.execPath, ['scripts/check-baseline-freshness.mjs'], {
      encoding: 'utf-8',
      timeout: 20_000,
    })
    const out = (res.stdout || '').trim()
    if (out) lines.push(...out.split(/\r?\n/).slice(0, 4))
  } catch {
    /* best-effort */
  }
  if (lines.length) process.stdout.write(lines.join('\n') + '\n')
  return 0
}

function git(args) {
  return execSync(`git ${args}`, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
}

function notifyBestEffort(title, body) {
  try {
    if (!fs.existsSync('scripts/notify.mjs')) return
    const child = spawn(
      process.execPath,
      ['scripts/notify.mjs', '--title', title, '--body', body, '--priority', 'high'],
      { detached: true, stdio: 'ignore' },
    )
    child.unref()
  } catch {
    /* best-effort */
  }
}

function stopCheck() {
  const input = readStdinJson()
  let dirty = ''
  let unpushed = 0
  try {
    dirty = git('status --porcelain')
  } catch {
    return 0 // not a git repo / git unavailable — nothing to enforce
  }
  try {
    unpushed = Number(git(`rev-list --count @{u}..HEAD`)) || 0
  } catch {
    unpushed = 0 // no upstream yet — push discipline can't apply
  }
  if (!dirty && unpushed === 0) {
    resetBlockCounter()
    return 0
  }

  const reason =
    (dirty ? `dirty tree (${dirty.split('\n').length} paths)` : '') +
    (dirty && unpushed ? ' + ' : '') +
    (unpushed ? `${unpushed} unpushed commit(s)` : '')
  const message =
    `guard: turn is ending with ${reason}. Standing rule 1: commit ` +
    'and push as a single atomic act — the next tick pulls from ' +
    'origin and will not see this work. Finish the commit+push, or ' +
    'file the leftover as a finding.'

  const strict = process.env.NEXUS_STRICT_STOP === '1'
  const alreadyContinuing = input?.stop_hook_active === true
  if (strict && !alreadyContinuing && bumpBlockCounter() < 3) {
    process.stderr.write(message + '\n')
    return 2
  }
  process.stderr.write(message + ' (warning only)\n')
  notifyBestEffort('loop: unclean stop', reason)
  return 0
}

// Strict mode breaks its own cycle: 3 consecutive blocked stops in
// one repo → warn-and-allow (the underlying failure mode is the
// real bug; blocking forever would wedge the session).
const COUNTER = path.join('.git', 'nexus-stop-blocks')

function bumpBlockCounter() {
  let n = 0
  try {
    n = Number(fs.readFileSync(COUNTER, 'utf-8')) || 0
  } catch {
    /* first block */
  }
  try {
    fs.writeFileSync(COUNTER, String(n + 1))
  } catch {
    /* non-fatal */
  }
  return n
}

function resetBlockCounter() {
  try {
    fs.rmSync(COUNTER, { force: true })
  } catch {
    /* non-fatal */
  }
}

function selfTest() {
  const cases = [
    ['git commit -m "x" --no-verify', 'no-verify'],
    ['git commit --no-verify -m "x"', 'no-verify'],
    ['git commit -n -m "x"', 'no-verify'],
    ['git commit -F msg.txt', 'commit-message-from-file'],
    ['git commit --file=msg.txt', 'commit-message-from-file'],
    ['git commit -aF msg.txt', 'commit-message-from-file'],
    ['git push --force origin main', 'force-push'],
    ['git push -f', 'force-push'],
    ['git push --force-with-lease origin main', 'force-push'],
    ['git push origin +main', 'force-push'],
    ['git reset --hard HEAD~3', 'destructive-reset'],
    ['git clean -fd', 'destructive-reset'],
    ['git checkout -- .', 'destructive-reset'],
    ['git commit -m "feat: x\n\nCo-Authored-By: bot"', 'trailer-or-emoji-in-commit'],
    // allowed commands — must NOT match any rule
    ['git push origin main', null],
    ['git commit -m "feat: ship phase 8"', null],
    ['git commit -m "cloud tick\n\nCloud-Run: https://x"', null],
    ['git reset HEAD~1', null],
    ['gh issue list -n 5', null],
    ['git log -n 5', null],
    ['npm run verify', null],
  ]
  let failed = 0
  for (const [cmd, expected] of cases) {
    const hit = RULES.find((r) => r.test(cmd))?.name ?? null
    const ok = hit === expected
    if (!ok) failed++
    process.stdout.write(
      `  ${ok ? 'ok  ' : 'FAIL'}  ${JSON.stringify(cmd).slice(0, 58).padEnd(60)} → ${hit ?? 'allowed'}\n`,
    )
  }
  const writeCases = [
    ['axiomancer-mechanics/docs/reports/baselines/deck-matrix-baseline.json', 'measured-baseline'],
    ['axiomancer-mechanics/docs/reports/2026-07-10-combat-audit.md', null],
    ['plan/AUDIT.md', null],
  ]
  for (const [p, expected] of writeCases) {
    const rel = normalizeRel(p)
    const hit = WRITE_BLOCKS.find((b) => b.test(rel))?.name ?? null
    const ok = hit === expected
    if (!ok) failed++
    process.stdout.write(
      `  ${ok ? 'ok  ' : 'FAIL'}  write ${JSON.stringify(p).slice(0, 52).padEnd(54)} → ${hit ?? 'allowed'}\n`,
    )
  }
  process.stdout.write(failed ? `\nself-test: ${failed} FAILED\n` : '\nself-test: green.\n')
  return failed ? 1 : 0
}

// --- entry ---------------------------------------------------------------

try {
  const mode = process.argv[2]
  const code =
    mode === 'pre-bash' ? preBash()
    : mode === 'pre-write' ? preWrite()
    : mode === 'post-write' ? postWrite()
    : mode === 'session-start' ? sessionStart()
    : mode === 'stop' ? stopCheck()
    : mode === 'self-test' ? selfTest()
    : (process.stderr.write(`guard: unknown mode "${mode}"\n`), 0)
  process.exit(code)
} catch (err) {
  // Fail-open: a guard bug must not wedge the loop.
  process.stderr.write(`guard: internal error (fail-open): ${err?.message}\n`)
  process.exit(0)
}
