#!/usr/bin/env node
/**
 * changelog-additions.test.mjs — Phase 95 unit 4.
 * 
 * Simple Node.js test runner for changelog-additions.mjs functionality.
 * Uses actual filesystem operations but cleans up after itself.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { strict as assert } from 'node:assert'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function test(name, fn) {
  console.log(`Running test: ${name}`)
  try {
    fn()
    console.log(`✓ ${name}`)
  } catch (err) {
    console.error(`✗ ${name}`)
    console.error(err.message)
    process.exit(1)
  }
}

// Test helper functions
function runScript(args = '', expectError = false) {
  const scriptPath = resolve(__dirname, '../changelog-additions.mjs')
  try {
    const output = execSync(`node "${scriptPath}" ${args}`, {
      encoding: 'utf8',
      cwd: resolve(__dirname, '../../'),
      stdio: ['pipe', 'pipe', 'pipe']
    })
    if (expectError) {
      throw new Error('Expected script to fail but it succeeded')
    }
    return output
  } catch (err) {
    if (!expectError) {
      throw err
    }
    return err.stderr || err.message
  }
}

const originalChangelog = resolve(__dirname, '../../CHANGELOG.md')
let backupContent = null

function setup() {
  if (existsSync(originalChangelog)) {
    backupContent = readFileSync(originalChangelog, 'utf8')
  }
}

function teardown() {
  if (backupContent !== null) {
    writeFileSync(originalChangelog, backupContent, 'utf8')
  }
}

// Run tests
console.log('Starting changelog-additions.mjs tests...\n')

setup()

test('help flag displays usage information', () => {
  const output = runScript('--help')
  assert(output.includes('Usage:'))
  assert(output.includes('--dry-run'))
  assert(output.includes('Examples:'))
})

test('dry-run mode does not modify CHANGELOG.md', () => {
  const testChangelog = `# Changelog

## [unreleased]

### Added

### Changed

### Removed

## [0.10.0] — 2026-05-25

Initial release.
`
  writeFileSync(originalChangelog, testChangelog, 'utf8')
  
  const originalContent = readFileSync(originalChangelog, 'utf8')
  const output = runScript('--dry-run')
  const afterContent = readFileSync(originalChangelog, 'utf8')
  
  assert(originalContent === afterContent)
  assert(output.includes('Dry run mode') || output.includes('No public surface changes'))
})

test('handles no public surface changes gracefully', () => {
  const testChangelog = `# Changelog

## [unreleased]

### Added

### Changed

### Removed

## [0.10.0] — 2026-05-25

Initial release.
`
  writeFileSync(originalChangelog, testChangelog, 'utf8')
  
  // Use same ref twice to guarantee no changes
  const output = runScript('HEAD HEAD')
  assert(output.includes('No public surface changes detected'))
})

test('script is executable and has proper shebang', () => {
  const scriptPath = resolve(__dirname, '../changelog-additions.mjs')
  const content = readFileSync(scriptPath, 'utf8')
  assert(content.startsWith('#!/usr/bin/env node'))
})

teardown()

console.log('\n✓ All tests passed!')