#!/usr/bin/env node
// scripts/check-harness-grants.mjs — harness grant consistency (phase 72).
// Zero dependencies.
//
//   node scripts/check-harness-grants.mjs
//
// The failure this exists to stop: the `reader` agent declared a roster of
// `mcp__claude-in-chrome__*` tools that was granted NOWHERE — not in
// `.claude/settings.json`, not in `_claude-skill.yml`, and whose servers were
// not in `.mcp.json` at all. Nothing failed at definition time, so it sat there
// until the 2026-08-22 audit read the files side by side. An agent spawned with
// that roster dies at its first tool call, in whatever run happens to need it.
//
// Three checks, all mechanical:
//   1. Every `mcp__*` tool an agent declares is granted somewhere.
//   2. Every `.mcp.json` server's command target exists (or is external, e.g.
//      an `npx` package), so a granted tool has a server that can start.
//   3. `settings.json` has no duplicate allow entries — a duplicate means two
//      people added the same grant and neither saw the other's.
//
// Exit codes: 0 clean; 1 findings.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf-8')
const exists = (rel) => fs.existsSync(path.join(ROOT, rel))

/** Every `mcp__…` tool named in the local settings allowlist. */
export function grantedLocally() {
  const settings = JSON.parse(read('.claude/settings.json'))
  return new Set((settings.permissions?.allow ?? []).filter((a) => a.startsWith('mcp__')))
}

/** Every `mcp__…` tool named in the CI skill workflow's --allowedTools. */
export function grantedInCi() {
  const yml = read('.github/workflows/_claude-skill.yml')
  return new Set([...yml.matchAll(/mcp__[A-Za-z0-9_-]+__[A-Za-z0-9_]+/g)].map((m) => m[0]))
}

/** `{ agent -> [mcp tools it declares] }` from the agent frontmatter. */
export function agentTools() {
  const dir = path.join(ROOT, '.claude', 'agents')
  const out = new Map()
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.md'))) {
    const text = fs.readFileSync(path.join(dir, file), 'utf-8')
    const line = text.split(/\r?\n/).find((l) => l.startsWith('tools:'))
    if (!line) continue
    const tools = line.slice('tools:'.length).split(',').map((t) => t.trim())
      .filter((t) => t.startsWith('mcp__'))
    if (tools.length) out.set(file.replace(/\.md$/, ''), tools)
  }
  return out
}

/** `{ server -> { command, target, external } }` from `.mcp.json`. */
export function mcpServers() {
  const cfg = JSON.parse(read('.mcp.json'))
  const out = new Map()
  for (const [name, def] of Object.entries(cfg.mcpServers ?? {})) {
    // `npx`-launched servers come from the registry, not the repo.
    const external = def.command !== 'node'
    const target = external ? null : (def.args ?? []).find((a) => a.endsWith('.mjs') || a.endsWith('.js'))
    out.set(name, { command: def.command, target, external })
  }
  return out
}

export function check() {
  const findings = []
  const notes = []
  const local = grantedLocally()
  const ci = grantedInCi()
  const servers = mcpServers()

  // 1 — an agent's roster must be grantable somewhere.
  for (const [agent, tools] of agentTools()) {
    const ungranted = tools.filter((t) => !local.has(t) && !ci.has(t))
    if (ungranted.length) {
      findings.push(
        `.claude/agents/${agent}.md declares ${ungranted.length} tool(s) granted nowhere: `
          + `${ungranted.slice(0, 4).join(', ')}${ungranted.length > 4 ? ', …' : ''}`,
      )
    }
    // A tool whose server prefix is not configured at all cannot ever start.
    for (const tool of tools) {
      const server = tool.slice('mcp__'.length).split('__')[0]
      if (!servers.has(server)) {
        findings.push(`.claude/agents/${agent}.md names server "${server}", absent from .mcp.json`)
      }
    }
  }

  // 2 — a configured server must have something to run.
  for (const [name, def] of servers) {
    if (def.external) continue
    if (!def.target) findings.push(`.mcp.json server "${name}" has no script argument`)
    else if (!exists(def.target)) {
      // A missing target is not automatically a failure. `kb-query` points into
      // `kb/`, a gitignored corpus that `scripts/kb-sync.mjs` fetches — legitimately
      // absent from a fresh clone and present on a synced workstation, which is
      // what the LOCAL grant is for.
      //
      // CI is the case that cannot recover: the workflow never syncs `kb/`, so a
      // CI grant for a server whose script is not in the checkout promises a run
      // a tool that can never start. That is the failure.
      const ciTools = [...ci].filter((t) => t.startsWith(`mcp__${name}__`))
      if (ciTools.length) {
        findings.push(
          `_claude-skill.yml grants ${ciTools.length} "${name}" tool(s), but its server `
            + `${def.target} is not in the checkout (gitignored or unbuilt) — a CI run `
            + `cannot start it`,
        )
      } else {
        notes.push(
          `"${name}" -> ${def.target} absent from this checkout; granted locally only `
            + `(synced corpus — run scripts/kb-sync.mjs)`,
        )
      }
    }
  }

  // 3 — duplicate grants mean two edits that did not see each other.
  const allow = JSON.parse(read('.claude/settings.json')).permissions?.allow ?? []
  const seen = new Set()
  for (const entry of allow) {
    if (seen.has(entry)) findings.push(`.claude/settings.json: duplicate allow entry ${entry}`)
    seen.add(entry)
  }

  return { findings, notes }
}

function main() {
  const { findings, notes } = check()
  notes.forEach((n) => console.error(`check-harness-grants: note — ${n}`))
  if (findings.length) {
    console.error(`check-harness-grants: ${findings.length} finding(s):`)
    findings.forEach((f) => console.error(`  ${f}`))
    console.error('\nGrant the tool, drop it from the agent, or fix the server path.')
    process.exit(1)
  }
  const agents = agentTools()
  console.error(
    `check-harness-grants: ${agents.size} agent roster(s) and ${mcpServers().size} server(s) consistent`,
  )
}

if (import.meta.url === `file://${process.argv[1]}`) main()
