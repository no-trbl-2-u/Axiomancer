# Skill: critique

> **Code-quality pass.** For a library project, critique is NOT
> a live-site observer. It's a structured architecture + quality
> audit that looks at the codebase from the outside-in, as if
> reviewing it for the first time. Findings go to `plan/CRITIQUE.md`.

## 1. Purpose

`/iterate` fixes things the loop already knows about. `/critique` discovers
what the loop has been blind to:

- API surface drift (new exports that don't match the spec contract).
- Modules that grew without tests.
- Abstraction leaks (internals bleeding into the public barrel).
- Structural inconsistencies between sibling modules.
- Naming or type conventions that diverged from established patterns.

Rate-limited so it doesn't dominate the loop (≥12 commits + ≥24h between
passes). Findings land in `plan/CRITIQUE.md` Pending; `/iterate` drains them.

## 2. Invocation

```
/critique                  # full code-quality pass
/critique api              # bias toward public API / barrel audit
/critique tests            # bias toward hermetic e2e coverage
/critique docs             # bias toward docs completeness
```

Called by `/march` when the rate-limit conditions pass and no phases are
pending.

## 3. Autonomy contract

- **Does NOT modify code.** Files findings only.
- **Does NOT ask the user.** Decide category and severity; document.
- **Rate-limited:** march checks the `plan/CRITIQUE.md` metadata header.

## 4. The pass

### Before starting

Verify the rate-limit gate (march checks this, but confirm):
1. ≥12 commits since `Last pass` (or first-ever pass with ≥1 phase shipped).
2. ≥24h since `Last pass`.

### Areas to audit (walk each in order)

#### A. Public API vs. spec contract

Compare `src/index.ts` exports against `spec.md` "Contracts" section and
`plan/bearings.md` CLI/API contract.

- Exported names that aren't in the spec → LOW (may be new additions).
- Spec exports missing from the barrel → HIGH.
- Type shapes that don't match what's documented → MED.

#### B. Hermetic e2e coverage

For each module in `src/` (Character, Combat, Effects, Enemy, Game, Items,
Skills, World, Utils):
- Does `src/<Module>/e2e/*.engine.test.ts` exist?
- Does it cover the module's primary entry point at the highest level?
- Does it stub RNG via `src/test-utils/rng.ts`?

Missing e2e for a module with significant logic → HIGH.

#### C. Module structure consistency

Sample 3–5 modules. Check:
- Logic in `*.resolver.ts` / `*.reducer.ts` (not in `*.types.ts` or CLI).
- No `vi.spyOn(Math, 'random')` — should use `test-utils/rng.ts` stubs.
- Constants in a `constants.ts`, not scattered inline.

Inconsistency → MED.

#### D. Documentation completeness

For each module, is there a `docs/<module>.md`? Is it current with the
exported API? Are new exports since the last doc update reflected?

#### E. Type-safety

- `@ts-ignore` or `as any` casts without explanatory comments.
- Functions with implicit `any` return types.

#### F. Dead code

- Exported functions in `src/index.ts` with zero in-repo callers AND not
  in the spec contract → LOW (flag for confirmation before removal).
- Large commented-out blocks → LOW.

### Cap findings per pass

Max 8 findings per pass (to avoid overwhelming `/iterate`). Prioritise by
severity: HIGH first, then MED, then LOW.

## 5. The procedure

### Step 0 — Sync

```bash
git pull --ff-only
```

### Step 1 — Run the pass

Walk §4 areas. Collect findings.

### Step 2 — Format and file

Append to `plan/CRITIQUE.md` `## Pending`:

```markdown
### [<SEVERITY>] <module-or-area> — <one-line summary ≤ 60 chars>
- pass: critique-<pass-count> (commit <sha>)
- area: api | tests | structure | docs | types | dead-code
- observation: <what was observed>
- evidence: <file path and line if applicable>
- suggested_fix: <one-line fix suggestion>
- source: critique
```

Update the metadata header:

```
> Last pass: <ISO date> at commit <sha>
> Pass count: <N>
```

### Step 3 — Commit

```bash
git add plan/CRITIQUE.md
git commit -m "critique: pass <N> — <N> findings (<HIGH>H/<MED>M/<LOW>L)"
git push origin main
```

### Step 4 — Done

"Critique pass <N> complete. <N> findings filed to CRITIQUE.md.
Top finding: <severity> <area> — <summary>."

## 6. Hard rules

1. **Never modify code.** Files findings only.
2. **Cap at 8 findings per pass.**
3. **No emojis. No `Co-Authored-By:`.**
4. **Don't create duplicate findings.** Check existing Pending rows first.

## 7. Failure modes

1. **`git pull` divergence** — stop.
2. **`plan/CRITIQUE.md` write fails** — stop.

## 8. Quick reference

```bash
# What it reads
src/index.ts                      # public API surface
src/*/e2e/*.engine.test.ts        # e2e coverage check
docs/                             # documentation completeness
plan/bearings.md                  # spec contract reference

# What it writes
plan/CRITIQUE.md                  # findings

# Gate check (run before starting)
git log --oneline plan/CRITIQUE.md | head -1   # find last pass commit
git rev-list --count HEAD ^<last-pass-sha>     # commits since last pass
```
