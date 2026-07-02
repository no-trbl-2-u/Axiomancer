#!/usr/bin/env node
/**
 * changelog-additions.mjs — Phase 95 unit 1.
 *
 * Consumes diff-public-surface.mjs output and generates Keep-a-Changelog
 * formatted entries for CHANGELOG.md [unreleased] section. Merges with
 * existing manual entries.
 *
 * Usage:
 *   node scripts/changelog-additions.mjs <ref-A> <ref-B>
 *   node scripts/changelog-additions.mjs                    # defaults to HEAD~1..HEAD
 *   node scripts/changelog-additions.mjs --dry-run          # preview without writing
 *   node scripts/changelog-additions.mjs v0.10.0 HEAD --dry-run
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const CHANGELOG_PATH = resolve(__dirname, '../CHANGELOG.md')

function showHelp() {
  console.log(`
Usage: node scripts/changelog-additions.mjs [ref-A] [ref-B] [--dry-run] [--help]

Generates CHANGELOG.md entries from public-surface diff output.

Arguments:
  ref-A, ref-B     Git refs to diff (default: HEAD~1 HEAD)
  --dry-run        Preview changes without writing to CHANGELOG.md
  --help           Show this help

Examples:
  node scripts/changelog-additions.mjs
  node scripts/changelog-additions.mjs v0.11.0 HEAD
  node scripts/changelog-additions.mjs --dry-run
`)
}

function getDiff(refA, refB) {
  try {
    const diffScript = resolve(__dirname, 'diff-public-surface.mjs')
    const output = execSync(`node "${diffScript}" "${refA}" "${refB}"`, {
      encoding: 'utf8',
      maxBuffer: 4 * 1024 * 1024,
    })
    return parseDiffOutput(output)
  } catch (err) {
    throw new Error(
      `[changelog-additions] Failed to get diff for ${refA}..${refB}: ${err.message}`
    )
  }
}

function parseDiffOutput(output) {
  const lines = output.split('\n')
  const result = { added: [], removed: [], changedKind: [] }
  let currentSection = null
  
  for (const line of lines) {
    if (line.startsWith('### Added')) {
      currentSection = 'added'
      continue
    } else if (line.startsWith('### Removed')) {
      currentSection = 'removed'
      continue
    } else if (line.startsWith('### Changed kind')) {
      currentSection = 'changedKind'
      continue
    }
    
    if (line.startsWith('- ') && currentSection) {
      const entry = line.substring(2) // Remove '- ' prefix
      result[currentSection].push(entry)
    }
  }
  
  return result
}

function generateChangelogEntry(diff, refA, refB) {
  const sections = []
  
  if (diff.added.length > 0) {
    sections.push('### Added\n')
    for (const entry of diff.added) {
      sections.push(`- ${entry}\n`)
    }
    sections.push('\n')
  }
  
  if (diff.changedKind.length > 0) {
    sections.push('### Changed\n')
    for (const entry of diff.changedKind) {
      sections.push(`- ${entry}\n`)
    }
    sections.push('\n')
  }
  
  if (diff.removed.length > 0) {
    sections.push('### Removed\n')
    for (const entry of diff.removed) {
      sections.push(`- ${entry}\n`)
    }
    sections.push('\n')
  }
  
  return sections.join('')
}

function readChangelog() {
  try {
    return readFileSync(CHANGELOG_PATH, 'utf8')
  } catch (err) {
    throw new Error(
      `[changelog-additions] Could not read CHANGELOG.md: ${err.message}`
    )
  }
}

function updateChangelog(content, newEntries) {
  const lines = content.split('\n')
  const unreleasedIndex = lines.findIndex(line => line.startsWith('## [unreleased]'))
  
  if (unreleasedIndex === -1) {
    throw new Error('[changelog-additions] Could not find ## [unreleased] section in CHANGELOG.md')
  }
  
  // Find the next release section or end of file
  let nextSectionIndex = lines.length
  for (let i = unreleasedIndex + 1; i < lines.length; i++) {
    if (lines[i].startsWith('## [') && !lines[i].includes('[unreleased]')) {
      nextSectionIndex = i
      break
    }
  }
  
  // Extract existing unreleased content
  const existingContent = lines.slice(unreleasedIndex + 1, nextSectionIndex).join('\n')
  
  // Merge new entries with existing content
  const mergedContent = mergeUnreleasedContent(existingContent, newEntries)
  
  // Rebuild changelog
  const updatedLines = [
    ...lines.slice(0, unreleasedIndex + 1),
    ...mergedContent.split('\n'),
    ...lines.slice(nextSectionIndex)
  ]
  
  return updatedLines.join('\n')
}

function mergeUnreleasedContent(existing, newEntries) {
  if (!newEntries.trim()) {
    return existing
  }
  
  // For now, simple append strategy - could be enhanced to merge by section
  const trimmedExisting = existing.trim()
  const trimmedNew = newEntries.trim()
  
  if (!trimmedExisting) {
    return '\n' + trimmedNew + '\n'
  }
  
  return '\n' + trimmedExisting + '\n\n' + trimmedNew + '\n'
}

function main() {
  const args = process.argv.slice(2)
  
  // Parse arguments
  let refA = 'HEAD~1'
  let refB = 'HEAD'
  let dryRun = false
  let help = false
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--dry-run') {
      dryRun = true
    } else if (arg === '--help' || arg === '-h') {
      help = true
    } else if (i === 0 && !arg.startsWith('-')) {
      refA = arg
    } else if (i === 1 && !arg.startsWith('-')) {
      refB = arg
    }
  }
  
  if (help) {
    showHelp()
    return
  }
  
  console.log(`[changelog-additions] Generating entries for ${refA}..${refB}`)
  
  // Get diff
  const diff = getDiff(refA, refB)
  
  if (diff.added.length === 0 && diff.removed.length === 0 && diff.changedKind.length === 0) {
    console.log('No public surface changes detected. CHANGELOG.md unchanged.')
    return
  }
  
  // Generate entries
  const newEntries = generateChangelogEntry(diff, refA, refB)
  
  if (dryRun) {
    console.log('Dry run mode - would add to [unreleased]:\n')
    console.log(newEntries)
    return
  }
  
  // Update CHANGELOG.md
  const currentContent = readChangelog()
  const updatedContent = updateChangelog(currentContent, newEntries)
  
  writeFileSync(CHANGELOG_PATH, updatedContent, 'utf8')
  
  console.log('CHANGELOG.md updated successfully.')
  console.log(`Added ${diff.added.length} additions, ${diff.removed.length} removals, ${diff.changedKind.length} kind changes.`)
}

try {
  main()
} catch (err) {
  console.error(err.message)
  process.exit(1)
}