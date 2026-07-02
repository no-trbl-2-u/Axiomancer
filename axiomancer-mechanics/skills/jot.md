# Skill: jot

> **The user's quickfire.** Drop a free-text observation into
> `plan/CRITIQUE.md` and push, in seconds. The next `/iterate`
> tick scores it (+0.5 user-source bump) and ships the fix.
> No questions back.

## 1. Purpose

You noticed something in the code — a naming inconsistency, a missing test
case, a doc that's wrong, a mechanic that feels off. Drop a note. The loop
picks it up next tick.

## 2. Invocation

```
/jot <free-text observation>
/jot --severity high <text>    # high (jumps the iterate queue)
/jot --severity low <text>     # low
/jot --category <cat> <text>   # explicit category (tests, docs, types, spec-gap, design)
/jot --file <path> <text>      # attach a file reference
```

Examples:
```
/jot Combat resolver doesn't handle the case where both combatants have 0 HP
/jot --severity high World.processNode missing hermetic e2e for hazard tick path
/jot --category docs docs/combat.md is missing the getThornsReflect export
/jot --file src/Game/store.ts store.ts exceeds 300 lines — should be split
```

## 3. Autonomy contract

- **Never ask questions.** User provided the input; decide the rest.
- **Always commit and push.** Atomic. The loop can't see it until pushed.
- **Never run the verify gate.** No code change.
- **Never run the deploy gate.** No deploy needed.
- **Target <10 seconds end-to-end.**

## 4. The procedure

### Step 0 — Re-sync

```bash
git pull --ff-only
```

### Step 1 — Parse the argument

Strip flags; the rest is **observation text**.

| Flag | Default if absent |
|---|---|
| `--severity <high\|med\|low>` | `med` |
| `--category <cat>` | inferred (see heuristics below) |
| `--file <path>` | `unspecified` |

**Category heuristics:**
- "test", "e2e", "hermetic", "coverage" → `tests`
- "doc", "docs", "comment", "README" → `docs`
- "type", "any", "cast", "infer" → `types`
- "spec", "question", "open q", "gap" → `spec-gap`
- "design", "mechanic", "balance", "feel" → `design`
- "dead", "unused", "remove" → `dead-code`
- Otherwise → `observation`

### Step 2 — Build the row

```markdown
### [<SEVERITY>] <file-or-"general"> — <one-line summary ≤ 60 chars>
- pass: user-jot (commit <git rev-parse HEAD>)
- file: <path or unspecified>
- category: <inferred-or-overridden>
- observation: <the user's text, verbatim>
- evidence: user-spotted at <ISO timestamp>
- suggested_fix: [user has not specified — iterate to determine]
- source: user
```

Append to `## Pending` block of `plan/CRITIQUE.md`.

### Step 3 — Commit + push

```bash
git add plan/CRITIQUE.md
git commit -m "jot: <one-line summary ≤ 70 chars>"
git push origin main
```

### Step 4 — Done

Print one confirmation line:
```
jot: filed [MED] src/Game/store.ts — exceeds 300 lines (commit a3f1e2c).
     Next /iterate or /march tick will score it against pending work.
```

## 5. Hard rules

1. **Never ask questions.** Decide-and-ship.
2. **Never modify code.** Only `plan/CRITIQUE.md`.
3. **Atomic commit, immediate push.**
4. **No verify gate, no deploy gate.**
5. **No emojis. No `Co-Authored-By:`.**
6. **Source field is always `user`.**

## 6. Failure modes

- **`plan/CRITIQUE.md` write fails** — print error, exit 1.
- **`git push` rejected** — pull, re-append, push. Up to 3 retries.
- **Empty argument** — print usage hint, exit 0. No commit.
