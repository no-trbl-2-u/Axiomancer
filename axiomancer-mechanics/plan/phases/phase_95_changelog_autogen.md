# Phase 95 — CHANGELOG public-surface diff autogeneration

## Outcome

Ship a new `scripts/changelog-additions.mjs` that consumes `diff-public-surface.mjs` output and generates properly formatted CHANGELOG.md entries for the `[unreleased]` section, eliminating manual CHANGELOG maintenance and ensuring consistent formatting.

## Source spec

No dedicated spec — this is a tooling enhancement following Phase 61's CHANGELOG structure and Phase 53's `diff-public-surface.mjs` foundation. Builds on existing `scripts/diff-public-surface.mjs` and Keep-a-Changelog format per `CHANGELOG.md`.

## Implementation units

### Unit 1: Create changelog-additions.mjs script
- **File:** `scripts/changelog-additions.mjs`
- **Types:** No new TypeScript types — Node.js script consuming JSON from diff tool
- **Logic:** 
  - Import and execute `diff-public-surface.mjs` programmatically or via child_process
  - Parse `{ added, removed, changedKind }` output into Keep-a-Changelog format
  - Generate markdown sections: `### Added`, `### Removed`, `### Changed`
  - Handle empty sections gracefully (omit if no entries)
  - Format entries as `- \`symbolName\` (type/value) — brief description`
- **Pattern:** Similar to existing `scripts/diff-public-surface.mjs` structure with process.argv parsing and error handling

### Unit 2: CHANGELOG.md integration logic  
- **File:** `scripts/changelog-additions.mjs` (continued)
- **Types:** No new types — string manipulation and file I/O
- **Logic:**
  - Read existing `CHANGELOG.md`
  - Locate `## [unreleased]` section
  - Parse existing Added/Removed/Changed subsections
  - Merge new entries with existing ones (avoid duplicates)
  - Preserve existing subsection order per Keep-a-Changelog convention
  - Write updated content back to `CHANGELOG.md`
- **Pattern:** File manipulation similar to other scripts in `scripts/` directory

### Unit 3: CLI interface and usage documentation
- **File:** `scripts/changelog-additions.mjs` (CLI args), `scripts/README.md` (documentation)
- **Types:** No new types — CLI argument parsing
- **Logic:**
  - Support usage: `node scripts/changelog-additions.mjs <ref-A> <ref-B>` (mirrors diff-public-surface.mjs)
  - Default to `HEAD~1..HEAD` when no refs provided
  - Add `--dry-run` flag to preview changes without writing
  - Add help text and error handling for invalid refs
  - Document in `scripts/README.md` alongside existing script documentation
- **Pattern:** Follow existing CLI patterns from `diff-public-surface.mjs` and `loop-issue.mjs`

### Unit 4: Hermetic test coverage
- **File:** `scripts/test/changelog-additions.test.mjs` (new file)
- **Types:** No new types — test assertions
- **Logic:**
  - Mock filesystem operations for hermetic testing
  - Test cases: empty diff, add-only diff, remove-only diff, mixed diff
  - Verify CHANGELOG section generation and formatting
  - Test dry-run mode and file writing modes
  - Validate error handling for malformed input/missing files
- **Pattern:** Follow Node.js testing patterns with mock filesystem operations

## Decisions made upfront — DO NOT ASK

**D1**: Script consumes `diff-public-surface.mjs` output programmatically via import rather than parsing stdout to avoid shell dependency complexity.

**D2**: Generated entries use the pattern `- \`symbolName\` (type/value)` without attempt to infer semantic descriptions — keep output minimal and factual.

**D3**: Script modifies `CHANGELOG.md` in place rather than outputting to stdout, matching the Phase 61 pattern of direct file modification.

**D4**: No attempt to auto-generate semantic versioning recommendations — the script only populates `[unreleased]` content, version bumps remain manual.

**D5**: Script preserves existing manual entries in the `[unreleased]` section and merges new entries rather than overwriting, supporting mixed manual/automated workflows.

**D6**: Use Keep-a-Changelog subsection order: Added, Changed, Deprecated, Removed, Fixed, Security per the existing CHANGELOG.md pattern.

**D7**: Target refs default to `HEAD~1..HEAD` to support integration with CI/automated workflows that run after each commit.

**D8**: No git integration within the script — ref resolution and validation delegated to the existing `diff-public-surface.mjs` tool.

## Verify gate

- `npm run type-check` — TypeScript compilation (no TS files but ESM imports must resolve)
- `npm test` — includes new test file for script functionality
- `npm run build` — dist generation must complete
- Script execution test: `node scripts/changelog-additions.mjs --dry-run` must run without errors

## Commit body template

```
feat(scripts): phase 95 — CHANGELOG autogeneration from public-surface diff

- changelog-additions.mjs: consumes diff-public-surface output
- Generates Keep-a-Changelog formatted entries for [unreleased]
- Supports --dry-run preview and ref range specification  
- Merges with existing manual entries in [unreleased] section
- Hermetic test coverage for generation and formatting logic

Decisions:
- Direct file modification rather than stdout to match Phase 61 pattern
- Minimal factual entries without semantic description inference
- Preserves manual entries via merge rather than overwrite
- HEAD~1..HEAD default refs for CI/automated workflow integration

Closes #<phase-issue-number>
```

## Definition of Done

- [ ] `scripts/changelog-additions.mjs` script created with CLI interface
- [ ] Script consumes `diff-public-surface.mjs` output programmatically
- [ ] Generates Keep-a-Changelog formatted Added/Removed/Changed sections
- [ ] Supports `--dry-run` flag and ref range specification
- [ ] Merges with existing `[unreleased]` entries without duplication
- [ ] `scripts/README.md` updated with usage documentation
- [ ] Hermetic test file covers generation and formatting logic
- [ ] Script runs successfully on current HEAD without errors
- [ ] Type-check, test, and build verify gates pass
- [ ] No updates to `src/index.ts` needed (pure tooling script)

## Follow-ups (out of scope)

- Integration with CI workflow to auto-run on push
- Semantic description inference for common API patterns
- Integration with semantic versioning recommendation tools
- Support for custom CHANGELOG section templates
- Git integration for automatic commit of CHANGELOG updates