# Claude playtest — let Claude drive the live app

This guide walks you through starting the dev server in a way
Claude (running in this Claude Code session) can drive the running
app through Playwright. Once set up, Claude can navigate, tap
buttons, screenshot states, and verify fixes end-to-end without
asking you to manually retest after every change.

**Audience:** the project owner (you), or anyone running Claude
Code against this repo who wants the loop to self-verify gameplay
changes instead of round-tripping through preview builds.

**Time:** 2–5 minutes the first time. After that, one-line
restart.

---

## 0. Prerequisites

You probably already have these — most are already set up by
`pnpm install` and the existing dev workflow.

- **Node + pnpm** — `node --version` should print 20+;
  `pnpm --version` should print 8+.
- **Project deps installed** — run `pnpm install` once at the
  repo root if you haven't.
- **A free TCP port for the web build** — Expo defaults to
  **8081**. Nothing else on your machine should be listening on
  it. (If something is, see step 4.)
- **Claude Code session with Playwright MCP enabled.** This is
  the standard config for this project. Verify by checking that
  Claude has access to tools whose names start with
  `mcp__playwright__`. If they aren't available, ask the Claude
  Code admin to enable the Playwright MCP server.

You do **not** need: an Expo account, EAS CLI, a phone, a
simulator, a build of any kind. The web target compiles
on-the-fly when the page loads.

---

## 1. Start the web dev server (the one thing you do)

In a terminal at the repo root:

```bash
pnpm web
```

That's it. Wait until you see something like:

```
› Web is waiting on http://localhost:8081
› Logs for your project will appear below.
```

The Expo dev server is now running. **Leave this terminal open
for the whole Claude session.** If you close it or hit `Ctrl-C`,
the live app goes away and Claude can no longer drive it.

If you want the server to keep running after you close the
terminal (e.g. you're stepping away), wrap it in `nohup` or use
`tmux`/`screen`:

```bash
nohup pnpm web > /tmp/expo-web.log 2>&1 &
echo $! > /tmp/expo-web.pid    # write PID for later kill
```

…and to stop it later:

```bash
kill $(cat /tmp/expo-web.pid)
```

---

## 2. Confirm the app loads (in your own browser, once)

The first time you do this, open
**http://localhost:8081** in your browser. You should see the
Axiomancer Mobile splash → first screen sequence. Tap around
briefly to confirm. This is sanity-only — Claude does not need
your browser; it opens its own headless one through Playwright.

---

## 3. Hand the URL to Claude

In the Claude Code session, type something like:

> The dev server is running at http://localhost:8081. Use it to
> verify the fix on Phase 65 Tick A.

Claude will then navigate to the URL with
`mcp__playwright__browser_navigate`, take a `browser_snapshot`
or `browser_take_screenshot` to see the current state, and drive
the app by tapping buttons via `mcp__playwright__browser_click`.

The first navigation can take 10–30 seconds while Expo bundles
the web build. Subsequent renders are fast (Expo caches the
bundle).

### What Claude can do

- Navigate to any in-app route by URL or by tapping nav
  affordances.
- Tap buttons, select stances, commit actions in combat.
- Read on-screen text via `browser_get_page_text` or
  `browser_snapshot` (the snapshot is a structured a11y tree —
  great for asserting state).
- Read the dev console via `browser_read_console_messages`
  (catches the `__DEV__` diagnostic streams in `combat.tsx` /
  `actions.ts` while they're still alive).
- Reset state by reloading the page (re-runs the
  rehydrate-from-AsyncStorage flow).

### What Claude cannot do (currently)

- See your local browser. Claude runs its own headless Chrome.
- Edit code while the dev server is running and have changes
  show up without a refresh. (Claude can reload the page after
  editing.)
- Drive native iOS/Android targets. Web target only.

---

## 4. Troubleshooting

### Port 8081 already in use

```bash
PORT=8090 pnpm web    # pick any free port
```

…and hand the new URL to Claude:
`http://localhost:8090`.

### "Cannot find module" or other Expo errors at startup

```bash
pnpm install                   # ensure deps are up to date
rm -rf node_modules/.cache .expo
pnpm web
```

### Claude says "no Playwright tools available"

The Playwright MCP server isn't loaded in this session.
- If you're running `claude` from a project that has its own
  `.claude/settings.json`, check that
  `mcp.servers.playwright` is enabled there.
- Otherwise, in this repo's `.claude/settings.json` (if it
  exists) or your user config, add the Playwright MCP server
  entry per the Claude Code MCP setup docs.

### Claude's headless browser can't reach localhost

This usually means Claude is running inside a sandbox/VM that
can't see your host's `localhost`. Two fixes:
- Bind Expo to all interfaces so it's reachable from inside the
  sandbox: `EXPO_PACKAGER_HOSTNAME=0.0.0.0 pnpm web`.
- Or — for the rare case Claude is running on a different host
  entirely — expose the dev server via a tunnel
  (`pnpm dlx localtunnel --port 8081`) and hand the public URL
  to Claude.

### Bundle fails with "module 'react-native-svg' not found"

Web target needs `react-native-svg-web` shim or the metro config
to alias. Check `metro.config.js` if you see this; the project
ships a working web bundle config out of the box, but custom
forks may need a tweak.

---

## 5. Wind down cleanly

When you're done:

1. In Claude, ask: "close the Playwright tabs". Claude calls
   `mcp__playwright__browser_close` and tab/browser process
   exit.
2. In your terminal, `Ctrl-C` the `pnpm web` process.
3. If you used `nohup`, run `kill $(cat /tmp/expo-web.pid)` and
   then `rm /tmp/expo-web.pid`.

---

## 6. What this unlocks

Once this workflow is in place, Claude can:

- **Verify Phase 65 fixes** by walking an encounter end-to-end
  inside one Claude turn — no waiting for an EAS preview build.
- **Catch regressions** before they ship. The `/march` loop can
  add a "playtest tick" cadence that drives a fresh combat
  every N ticks and flags any visible drift.
- **Author the mechanics-vs-UI audit** ([3.7] in
  `plan/AUDIT.md`) by driving each UI branch and comparing it
  against the engine state.
- **Ship UI fixes with confidence** — the loop now has an end-
  to-end signal, not just hermetic Jest tests.

---

## 7. Verification status

> **Workflow verified by Claude on 2026-05-21** during the
> iterate tick that filed this runbook (`[5.9]` AUDIT row).
> Smoke: navigate to http://localhost:8081 → land on
> `/exploration` → snapshot reads stats (LVL 7, HP 22/38) + the
> Fishing Village node graph + four tabs (WILDS / SELF / MEMOIR
> / SATCHEL) → click "Travel to Crossing" via Playwright →
> post-click snapshot confirms move executed (Crossing is now
> "here"; Hanged Wood + Drowned Shrine opened as adjacent
> options; sealed count dropped from 8 → 6). All six Playwright
> MCP calls (resize → navigate → snapshot → screenshot → click
> → snapshot → close) succeeded on first attempt against an
> existing user-started `pnpm web` instance on port 8081.
