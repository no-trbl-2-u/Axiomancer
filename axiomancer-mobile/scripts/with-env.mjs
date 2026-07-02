#!/usr/bin/env node
// scripts/with-env.mjs
//
// Wrapper that loads `.env` via the `dotenv` package and then execs
// the requested command with the populated environment. Used by
// npm scripts that need vars like EXPO_TOKEN visible to a child
// binary (e.g. `eas build`), since npm does not auto-load .env.
//
// Usage:  node scripts/with-env.mjs <command> [args...]
// Example: node scripts/with-env.mjs eas build --platform android

import { spawn } from 'node:child_process'
import dotenv from 'dotenv'

dotenv.config()

const [, , cmd, ...args] = process.argv
if (!cmd) {
  console.error('with-env: usage: node scripts/with-env.mjs <command> [args...]')
  process.exit(2)
}

const child = spawn(cmd, args, { stdio: 'inherit', env: process.env })
child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal)
  else process.exit(code ?? 1)
})
child.on('error', (err) => {
  console.error(`with-env: failed to spawn "${cmd}": ${err.message}`)
  process.exit(127)
})
