# Skill: triage

> **Issue inbox.** Read unlabeled open GitHub issues. Classify,
> label, and route. Findings land in `plan/AUDIT.md` or
> `plan/CRITIQUE.md`. Fast when idle — one API call to count.

## 1. Purpose

Keep the GitHub issue inbox clean. Don't let issues accumulate unlabeled
while the loop ships phases — a labeled issue is either queued for the loop
or surfaced to the user.

## 2. Invocation

```
/triage             # full pass on unlabeled issues
```

Called by `/march` at the start of every tick (cheapest check).

## 3. The classification

| Label | Meaning | Route |
|---|---|---|
| `triage:loop-queued` | Loop can address — add to AUDIT.md | plan/AUDIT.md Pending |
| `triage:needs-user` | Requires a design decision by the user | plan/AUDIT.md as `[needs-user-call]` |
| `triage:closed` | Duplicate, stale, or out of scope — close | No state file |
| `triage:reviewed` | Acknowledged; logged but no loop action yet | plan/AUDIT.md INFO row |

Types:
- `bug` — engine behavior is incorrect; high impact
- `feature` — new mechanic or API surface
- `test` — missing or broken test coverage
- `docs` — doc gap
- `spec-gap` — open question not yet answered in a spec file
- `chore` — maintenance (deps, ESLint, etc.)
- `design` — needs game-design decision before code can happen

## 4. The procedure

### Step 0 — Check auth

```bash
export GH_TOKEN=$(awk -F= '/^GH_TOKEN=/ {sub(/^GH_TOKEN=/, ""); print; exit}' .env)
export GH_REPO="no-trbl-2-u/axiomancer-mechanics"
```

If `GH_TOKEN` missing: log warning, return. Don't fail `/march`.

### Step 1 — Count unlabeled issues

```bash
unlabeled=$(gh issue list --repo "$GH_REPO" --state open \
  --search "-label:triage:loop-queued -label:triage:needs-user -label:triage:closed -label:triage:reviewed -label:loop:opened" \
  --json number --jq 'length' 2>/dev/null || echo 0)
```

If `unlabeled == 0`: return immediately. (March checks this before calling
triage; triage re-confirms.)

### Step 2 — Fetch and classify issues

```bash
gh issue list --repo "$GH_REPO" --state open \
  --search "-label:triage:loop-queued -label:triage:needs-user ..." \
  --json number,title,body,labels,author --jq '.[]'
```

For each issue: read title + body, assign:
- A `triage:*` routing label
- A type label (`bug`, `feature`, `test`, `docs`, `spec-gap`, `chore`, `design`)
- Estimated impact (1–10) and ease (1–10)

### Step 3 — Apply labels

```bash
gh issue edit <number> --repo "$GH_REPO" \
  --add-label "triage:loop-queued,bug" 2>/dev/null || true
```

### Step 4 — Route loop-queued issues to AUDIT.md

For `triage:loop-queued` issues, append to `plan/AUDIT.md` Pending:

```markdown
### [<type>] GH#<number> — <title>
- category: <type>
- impact: <N>
- ease: <N>
- next: /iterate (or /ship-a-phase for feature requests)
- notes: <one-line summary>
```

For `triage:needs-user` issues, append as `[needs-user-call]`:

```markdown
### [needs-user-call] GH#<number> — <title>
- category: design
- notes: <why user decision needed>
```

### Step 5 — Comment on closed issues

For `triage:closed`:

```bash
gh issue comment <number> --repo "$GH_REPO" \
  --body "Closing as <duplicate/out-of-scope/stale>. <One-line reason>." 2>/dev/null || true
gh issue close <number> --repo "$GH_REPO" 2>/dev/null || true
```

### Step 6 — Commit + push

```bash
git add plan/AUDIT.md
git commit -m "triage: <N> issues processed — <H>H/<M>M/<L>L"
git push origin main
```

### Step 7 — Done

"Triage pass complete. <N> issues labeled. <M> routed to AUDIT.md.
<K> needs-user-call. <J> closed."

## 5. Hard rules

1. **Never modify code or specs.** Labels and state files only.
2. **Skip already-labeled issues** (`triage:*` or `loop:opened`).
3. **Comment before closing.**
4. **No emojis. No `Co-Authored-By:`.**

## 6. Failure modes

1. **`GH_TOKEN` missing** — log warning, return. Don't fail march.
2. **`gh` CLI not installed** — same as missing token.
3. **Rate-limited by GitHub API** — log, return. Next tick retries.
