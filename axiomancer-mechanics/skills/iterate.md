# Skill: iterate

> **Full autonomy.** Audit axiomancer-mechanics, pick the
> highest-impact weakness, ship one improvement end-to-end.
> Drains queues from `/critique` and `/triage` alongside its
> own audit.

## 1. Purpose

Phases ship features. After features ship, `/iterate` fills gaps:
missing test coverage, spec drift, dead code, type-safety holes,
doc gaps, ESLint fix, and quality improvements from the critique queue.

## 2. Invocation

```
/iterate                     # full audit, ship top finding
/iterate audit               # audit-only; emit plan/AUDIT.md
/iterate <focus>             # bias toward: tests / types / docs / dead-code / spec-gap / deps
/loop 1h /iterate            # autonomous improvement loop
```

## 3. Autonomy contract

- **Many findings → one shipped fix per tick.** Multi-fix commits are
  unreviewable.
- **Research needed → spawn `scout`.** Don't pollute main context.
- **Trivial fix → still ships through verify.**

### User-source bump (from `/jot`)

Findings with `source: user` get a flat **`+0.5`** on their final score
(capped at 10). Apply after `impact × ease / 10`, before user-set bias.

### User-set bias (from `/oversight`)

Check top of `plan/AUDIT.md` for:
```
> Bias: <category> (set via oversight <date>)
```
If present, **multiply that category's scores by 1.5**. Sticky until
cleared via `/oversight reset`.

## 4. The audit

Score every finding `0–10` for `impact × ease`. Bias toward cheap wins.

### Z. External critique (highest priority when present)

`plan/CRITIQUE.md` `## Pending` rows. Map severity → impact:
HIGH=8–10, MED=5–7, LOW=2–4. When shipped, move Pending → Done with
`[x]` + commit hash.

### A. Test-quality gaps

- Modules with no `*.engine.test.ts` hermetic e2e test.
- Tests that use raw `vi.spyOn(Math, 'random')` instead of `test-utils/rng.ts`.
- Tests that aren't hermetic (disk/network/TTY access).
- Low-coverage paths in existing engine tests.

### B. Spec-gap items

- `plan/AUDIT.md` Pending rows tagged `spec-gap`.
- `Knowledge-Gaps.md` questions with ready answers.
- `specs/` open-question placeholders (`> Your answer:` still blank).

### C. Type-safety

- `@ts-ignore` or `as any` casts without justification.
- `unknown` types that should be narrowed.
- Missing return type annotations on exported functions.

### D. Dead code

- Exported functions in `src/index.ts` with no callers.
- Internal files with no imports.
- Commented-out code blocks.

### E. Documentation gaps

- Modules in `src/` with no corresponding `docs/<module>.md`.
- `docs/` files referencing types or functions that have since been renamed.
- `README.md` Public API table out of sync with `src/index.ts`.

### F. ESLint fix (when Phase 13 not yet shipped)

Fix `eslint.config.mts` to correctly register `@typescript-eslint` plugin.
Make `npm run lint` green. High impact (6), high ease (8) → score 4.8. This
finding stays Pending until Phase 13 ships it as a dedicated phase.

### G. Dependency updates

- `npm outdated` — minor/patch bumps that are safe to apply.
- Skip major bumps (those are deliberate phases).

### H. Commit-hygiene

- Uncommitted spec changes from a prior session.
- Plan files out of sync with shipped state.

## 5. The procedure

### Step 0 — Re-sync

```bash
git pull --ff-only
npm test   # confirm baseline green
```

### Step 1 — Run the audit

Walk categories Z–H. For each: grep the codebase, read the plan files,
score findings. Record in `plan/AUDIT.md` Pending (updating existing rows,
adding new ones).

```bash
git add plan/AUDIT.md
git commit -m "iterate: audit — <N> findings, top score <X>"
git push origin main
```

### Step 2 — Pick the top finding

Highest `impact × ease / 10` score (after bumps + bias). Break ties toward
category Z (external critique), then A (tests), then spec-gaps.

### Step 3 — Research (if needed)

Spawn `scout` for external lookups. Spawn `mechanics-expert` for balance/
design questions.

### Step 4 — Fix

Implement the fix. Keep scope tight — address the finding and nothing else.
Tests colocated, or extend existing `*.engine.test.ts`.

### Step 5 — Verify gate

```bash
npm run verify    # npm run type-check && npm test && npm run build
```

If red: patch root cause. Up to 3 same-root-cause iterations.

### Step 6 — Commit + push

```bash
git add <explicit files>
git commit -m "$(cat <<'EOF'
fix|refactor|test|docs(<scope>): <one-line — what was fixed>

Finding: <category> — <brief description>
Score: <impact> × <ease> / 10 = <total>

- <what changed>
EOF
)"
git push origin main
```

Move the finding from Pending → Done in `plan/AUDIT.md` with commit hash.
Move CRITIQUE.md row Pending → Done if it was a critique finding.

```bash
git add plan/AUDIT.md plan/CRITIQUE.md
git commit -m "plan: iterate finding resolved — <one-liner>"
git push origin main
```

### Step 7 — Deploy gate

```bash
npm run deploy:check
```

### Step 8 — Done

"Shipped: <finding summary>. Next iterate: <next top finding or 'queue empty'>."

## 6. Hard rules

1. **One finding per tick.** No bundled fixes.
2. **Verify gate mandatory.**
3. **No emojis, no `Co-Authored-By:`.**
4. **Never break `src/index.ts` exports** — iterate fixes are non-breaking.

## 7. Failure modes

1. **`npm run verify` fails ≥3 times on same root cause** — stop.
2. **Finding requires adding a paid dependency** — write `[needs-user-call]`
   to AUDIT.md, skip.
3. **Audit finds zero findings scoring ≥ 3.0** AND posture is bold →
   dispatch to `/expand` (file candidates to PHASE_CANDIDATES.md).
4. **`git pull` divergence** — stop.

## 8. Quick reference

```bash
# State files
plan/AUDIT.md
plan/CRITIQUE.md

# Verify + commit + push + deploy
npm run verify
git add <files>
git commit -m "fix(<scope>): ..."
git push origin main
npm run deploy:check
```
