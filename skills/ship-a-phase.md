# Skill: ship-a-phase

> **Full autonomy.** When invoked (manually, via `/ship-a-phase`,
> or under `/loop` / `/march`), you have authority to ship one
> phase of the build plan end-to-end with **no review checkpoint**:
> build, write tests, run the verify gate, commit, push, confirm
> deploy. The user reads the diff after — not before.
>
> **The bar for asking is high.** If you would have asked, decide
> instead and document the call in the commit body. Stop only on
> §10 below.

## 1. Purpose

`plan/steps/01_build_plan.md` carves the build into ~10–20 phases.
Each phase is one self-contained slice that ships end-to-end:
code + unit tests + e2e + commit + push (deploy follows).

This skill drives the build **autonomously, in a loop**, so a
single overnight run can move the project forward by several
phases.

## 2. Invocation

```
/ship-a-phase                       # next [ ] phase
/ship-a-phase phase 8               # specific phase by number
/ship-a-phase phase 8 dry-run       # plan + emit brief, no code commit
/loop 30m /ship-a-phase             # autonomous, every 30 min
/loop /ship-a-phase                 # autonomous, self-paced
/march                              # outer dispatcher (preferred)
/loop /march                        # the autonomous-beast endgame
```

When invoked from `/loop` or `/march`, **do not pause for
review**. After commit + push + deploy:check, return cleanly.

## 3. Autonomy contract

The user's standing instruction: **"more get-it-done, less ask
me questions."** Internalize this:

- **Design / scope ambiguity → decide.** Pick the choice most
  consistent with the canonical sibling phase + `bearings.md`.
  Document the call in the commit body under "Decisions". Never
  block.
- **Empty / missing content → render the empty state and ship.**
- **Missing brief → generate one** per `skills/plan-a-phase.md`
  §5 (the brief format is shared). Commit the brief separately,
  then proceed.
- **Verify failure → read the log + patch.** Iterate up to 3
  times on the same root cause.
- **Deploy failure → same as verify.** Up to 3 same-root-cause
  iterations.
- **External research needed → spawn a sub-agent.** Don't pollute
  main context with citations and source pages.

The only conditions that warrant stopping are §10.

## 4. Delegation

Spawn sub-agents aggressively. They protect main-agent context
and parallelize independent work.

- **`scout`** — every external research need.
- **Design specialists** — a phase that ships cards/keywords
  spawns `card-expert`; a contested mechanic-design call gets a
  `mechanics-expert` consult; narrative content spawns
  `content-curator`. All three carry the `kb-query` (external
  prior art, cited `kb:<game-slug>/<doc> (src-NNN)`) and
  `axio-query` (live engine card/effect/keyword facts) MCP
  tools — and the main agent holds the same grants. A design or
  balance decision made inline instead of via a specialist still
  consults those tools first (AGENTS.md § Truth sources): a
  Decisions bullet with a reception receipt beats one argued
  from model memory.
- **Domain specialists** — for prose drafting, schema work,
  observation. See `.claude/agents/`.
- **Parallel calls** when work is independent.

The main agent's job is wiring, code, decisions. Delegate prose
and research.

## 5. The page-family / feature-surface shape

Every page-family / feature-surface phase ships **all** of these,
mirroring the canonical sibling (typically phase 4 or 5):

```
<your-app-path>/<route-or-surface>/
├── <main entry>                     # the page / endpoint / command
├── <sub-entries>                    # detail pages, sub-routes, sub-commands
└── <test-files>                     # colocated unit tests

<components-or-handlers>/<family>/
├── <Family>Section.tsx              (or equivalent for your stack)
├── <OtherSection>.tsx
└── __tests__/

<lib-or-utils>/<family>/
├── queries.ts | helpers.ts | etc.
└── __tests__/

<e2e>/<family>.spec.ts               # canonical render + cross-link checks
<e2e>/mobile/<family>.mobile.spec.ts # for web projects: 375px viewport
```

Use the canonical sibling's directory as the literal template —
copy structure, swap names + queries.

### Already-built primitives

After phases 1–<substrate count>, these exist and are reused:

- Layout primitives (Header, Footer, Container, …)
- Editorial atoms / UI atoms (cards, chips, etc.)
- Content / data loaders (in shared packages)
- Shared helpers / formatters
- Design tokens

If a primitive doesn't exist, build it inside the appropriate
shared package; tests colocated.

## 6. The procedure

### Step 0 — Re-sync state

```bash
git pull --ff-only
```

If divergence, stop per §10.

### Step 1 — Pick the phase

Read the "Status (at-a-glance)" block at the top of
`plan/steps/01_build_plan.md`. The next phase is the **first
`[ ]` row**. If the user passed `phase N`, ship that one
regardless of order. Skip rows marked `[skipped]` (set by
`/oversight`).

### Step 2 — Read the brief

`plan/phases/phase_<N>_<topic>.md`. If missing, follow
`skills/plan-a-phase.md` §5 to generate (commit separately,
then proceed).

### Step 2.4 — Claim check: is another tick already on this phase?

`/march` runs from more than one place — this session's `/loop`, the
scheduled CI cron, an attended session. Two ticks that pick the same
`[ ]` row build the same phase twice, and their edits collide in the
files the phase owns.

The mirror issue is the claim. Before starting work, check whether one
is already open **and recent**:

```bash
claimed=$(gh issue list --repo "$GH_REPO" --state open \
  --search "Phase <N> — in:title" --json number,createdAt \
  --jq '.[0] | select(. != null) | "\(.number) \(.createdAt)"')
```

- **No open mirror** — proceed; Step 2.5 opens it and the claim is yours.
- **Open mirror, created within the last ~2 hours, and this tick has
  not yet pushed a commit for the phase** — another tick is mid-flight.
  Do NOT build it. Skip to the next unclaimed `[ ]` row and note the
  skip in your summary. Racing produces two briefs, two mirrors, and a
  merge conflict in whatever the phase touches.
- **Open mirror, older than that** — a previous tick started and did not
  finish. Adopt it: the helper reuses the number, so continue the work.

A brief you already pushed for a phase you are yielding gets removed in
the same tick — two briefs for one phase is worse than none.

(Observed 2026-08-27: a local `/loop /march` and a CI `/march` both
picked Phase 74 within 30 seconds. The local tick yielded, deleted its
duplicate brief, and filed this rule.)

### Step 2.5 — Mirror the phase to GitHub

Open (or reuse, or reopen) the phase mirror issue. The repo's
Issues tab gets a public artifact for this phase the moment work
begins; the same artifact closes when the shipping commit lands.
The helper is **idempotent** — find-or-create-or-reopen keyed on
the title prefix `Phase <N> — `, so re-runs of the same phase (or
rapid-fire ticks) reuse the same number instead of spamming
duplicates.

```bash
# 1. Build the body file from the brief's Outcome / Why section.
#    Keep it user-readable: 1–2 lines goal summary, then a link
#    back to the phase brief in this repo.
issue_body=$(mktemp)
cat > "$issue_body" <<EOF
**Goal:** <one-line outcome from the brief's "Outcome" section>

<2–4 line summary of what shipping this phase delivers>

**Brief:** [\`plan/phases/phase_<N>_<topic>.md\`](https://github.com/no-trbl-2-u/Axiomancer/blob/main/plan/phases/phase_<N>_<topic>.md)

---
_Tracked by the autonomous loop. The phase commit will close this issue via a \`Closes #<this-issue>\` trailer; deploy URL is posted as a follow-up comment._
EOF

# 2. Open / reuse / reopen.
PHASE_ISSUE=$(node scripts/loop-issue.mjs phase-open \
    --phase "<N>" \
    --title "Phase <N> — <topic>" \
    --body-file "$issue_body")
echo "phase mirror: #$PHASE_ISSUE"
```

`<N>` here is the phase identifier as it appears on the
`01_build_plan.md` row (e.g. `15a`, not `15`). The title format
**must** be `Phase <N> — <topic>` — the helper rejects mismatched
titles to keep prefix-match reuse working.

On **any failure** of `loop-issue.mjs phase-open` (auth, rate
limit, network, repo unreachable):

- Print stderr to the run log.
- Continue with the build. The mirror is best-effort, not gating
  (Hard rule §7 — phase mirror is non-gating).
- The next ship-a-phase tick on the same phase will retry.

If the open succeeded, capture `$PHASE_ISSUE` for use in Step 10
(commit trailer) and Step 12.5 (close-comment).

### Step 3 — Read the design + canonical sibling

```bash
# Design inputs (may not exist or be partial — that's OK)
ls axiomancer-mechanics/specs/           # formal specs, if any touch this surface
ls axiomancer-mechanics/braindump/       # raw design sessions

# Canonical sibling — typically phase 4 or 5
ls <repo-root>/<your-app-path>/<canonical-family>/
```

If no spec or braindump covers this family, proceed using
the brief + canonical sibling + bearings. Note in commit-body
Decisions.

When the phase ships game content (cards, keywords, enemies,
maps, events, dialogue) or moves balance numbers, also pull the
truth sources before designing: `axio_overview` / `axio_cards` /
`axio_effects` / `axio_keywords` for the engine's own current
facts, and `kb_search` / `kb_find_games` / `kb_cards` /
`kb_keyword` for external prior art worth citing in the brief or
commit body. `axio-query` is an accelerator, not a dependency —
grep the libraries directly when it is absent or erroring.
`kb-query` is the only route to the external corpus: when it is
absent, the prior art is UNGROUNDED and must be labeled so.

### Step 4 — Build

Mirror the canonical sibling's structure into the new family.
Reads via shared loaders (`@mechanics/content`,
`@mechanics/data` if applicable); never reach into
the filesystem from a leaf component.

For each new content / data read pattern, add a helper to the
appropriate shared package with colocated tests.

### Step 5 — Wire the routes / surface

Wire the new entries per the framework's convention (Next.js
App Router auto-discovers; Express / Fastify need explicit
mounting; CLI commands need registration). Update
manifest / index files as needed.

### Step 6 — Output schema / contracts (where applicable)

Keep shared type contracts, event shapes, and save-data
schemas in sync per the brief's output-schema section.

### Step 7 — Tests

- **Unit:** colocated `__tests__/`. Mock content / data loaders
  at module boundaries.
- **E2E (web):** render H1 + canonical + at least one cross-link
  + global footer. At 375px: `scrollWidth - innerWidth ≤ 1`,
  H1 within viewport.
- **E2E (non-web):** equivalent end-to-end test for your domain
  (e.g. CLI snapshot, API contract test).

### Step 8 — Cross-link retrofit

When this family ships, retro-fit incoming links from
already-shipped families. Keep retro-fits **scoped** — modify
the chip / nav / new section, not whole pages. One retro-fit
commit per family.

### Step 9 — Verify gate

```bash
npm run verify    # or your stack's equivalent
```

Runs `typecheck → test:run → data:validate → build → e2e` (or
your project's gate composition). All hard. Iterate up to 3
times on the same root cause; otherwise stop per §10.

### Step 10 — Commit + push (atomic)

Stage explicitly. Conventional subject; body in 4–8 bullets
describing what shipped + what the user can now do. Add
"Decisions" section listing autonomous design calls.

**If Step 2.5 captured a phase issue number** (`$PHASE_ISSUE`),
add a `Closes #<N>` trailer to the commit body. GitHub auto-closes
the phase mirror when the commit pushes to main; that's
the canonical ship signal on the public timeline.

```bash
git add <explicit files>
git commit -m "$(cat <<'EOF'
feat: <family> page family — phase <N>

- <bullet 1>
- <bullet 2>

Decisions:
- <design call 1 — picked X over Y because <reason>>

Closes #<phase-issue-number>
EOF
)"
git push origin main
```

**No `Co-Authored-By:` trailer. No emojis.**

### Step 11 — Tick the DoD

Flip the shipped `[ ]` to `[x]` in
`plan/steps/01_build_plan.md` and add the commit hash. Commit:

```bash
git add plan/steps/01_build_plan.md
git commit -m "plan: phase <N> shipped — <one-line>"
git push origin main
```

If you generated a brief in step 2, that's a separate prior
commit (subject `phases: brief for phase <N>`).

### Step 12 — Confirm deploy

```bash
npm run deploy:check
```

Outcomes:

- **Exit 0 (ready)** — site green at the pushed commit.
  Continue to Step 13.
- **Exit 1 (error)** — read the log + admin URL. Patch root
  cause. Re-run from Step 9. Up to 3 same-root-cause iterations;
  otherwise stop per §10.
- **Exit 2 (timeout)** — surface the timeout; continue.
- **Exit 3 (config)** — `GH_TOKEN` missing or
  unreachable. Stop per §10.

### Step 12.5 — Phase mirror close (comment + API close)

If Step 2.5 captured `$PHASE_ISSUE` and Step 12 was green:

```bash
node scripts/loop-issue.mjs phase-close \
  --phase "<N>" \
  --commit "<commit-sha>" \
  --deploy-url <ci-run-url>
```

`phase-close` posts the deploy-URL comment **and actively closes the
mirror via the GitHub API** (`state=closed`, `state_reason=completed`).
The `Closes #<N>` trailer in Step 10's commit is a belt-and-suspenders
backup only — it fires reliably solely for commits pushed **directly**
to the default branch, so phases that reach `main` via a cross-session
`claude/*` branch merge reconciliation would leak the mirror open
without the explicit API close (Phase 35 fix, 2026-07-17). The close is
idempotent (an already-closed mirror is a no-op). Failures here are
warnings, not blockers.

If this tick ends before Step 12's `deploy:check` goes green, this
comment never posts — but `.github/workflows/deploy-comment.yml`
(Phase 91) is the floor underneath it: it fires on the gated
`verify-*` workflows' own completion, independent of this tick's
lifetime, and posts the same comment once CI is actually green.

### Step 13 — Done

Return cleanly. The loop's next tick picks up the next phase.
If you ran outside the loop, summarize what shipped + what's
next in 2–3 lines. Do not pick up another `[ ]` row in this same
invocation — see §7 Hard Rule 12.

## 7. Hard rules

1. **No `Co-Authored-By:` in commits.** Plain message bodies.
2. **No emojis** anywhere in code, content, or commit messages.
3. **No `--no-verify`, no force-push, no destructive resets.**
4. **Don't drag in stray working-tree changes.** `git status
   --short` first; stage explicitly.
5. **Don't restart the user's dev servers.** They keep dev up;
   the e2e harness uses a separate port.
6. **Tests alongside code** — never "add tests later".
7. **Small, focused components in folders.** Prefer 5 small
   files over 1 dense file.
8. **Content stays in mechanics src/* + mobile *.copy.ts.** Data stays in
   `n/a (no data layer)`. No hardcoded copy/records in components.
9. Product title is "Miserere Mei, Deus" in player/doc-facing prose (the
   `axiomancer-*` workspaces, repo and scheme keep the former title as
   internal identifiers); VITAE/STANCE copy canon; HP is sole win condition
   (never Pressure Tracks) <!-- lexicon-ok: pressure-tracks -->
10. **Phase issue mirror is best-effort, not gating.** If
    `loop-issue.mjs phase-open` fails, the phase still ships;
    log the stderr and continue. The mirror is a public timeline,
    not a verification step. Do not block phase delivery on
    GitHub issue API hiccups.
11. **Never end the turn waiting on a backgrounded research
    sub-agent.** When a `/ship-a-phase` tick needs a sub-agent's
    findings (e.g. an `Explore` mapping a save-schema migration
    pattern) before code can be written, spawn it in the
    **foreground** (blocking) and synthesize before proceeding —
    do not spawn in the background and end the turn "waiting."
    Each loop invocation is a fresh session with no later turn to
    resume into; a backgrounded call's results are discarded when
    the runner tears down, and the next tick re-starts the same
    research from scratch (confirmed 2026-07-16: two consecutive
    Phase 32 Part 1b ticks each spawned a background `Explore`
    agent and ended the turn deferring to it — zero commits, zero
    carried research, ~$4 combined cost). If the research is
    large enough to want backgrounding anyway, persist its
    findings to a scratch note under `plan/` before ending the
    turn, so the next tick can pick up cheaply instead of
    re-researching. Same rule as `skills/digest.md` §3.6/§4.7,
    extended to research sub-agents (not just `verify`/`deploy`).
12. **One phase per invocation — never chain.** Once Step 13's
    commits are pushed, stop: do not re-open `01_build_plan.md`
    looking for the next `[ ]` row, and do not start a second
    phase's brief/build/commit cycle in the same tick — even
    when the next row is a lettered sibling of the one just
    shipped (e.g. having just shipped `44a`, do not also ship
    `44b`), and even when the job's time budget looks like it
    has room left. This is what turned run `31301228665`
    (2026-08-09, phases 44a+44b chained into one tick) into a
    `timeout_minutes` kill (Phase 92, 2026-09-18): Step 13
    already said "return cleanly" when that run happened and it
    did not hold, because prose is not a stop the way an
    enumerated hard rule is (see rule 11's own precedent). The
    job ceiling is deliberately a per-tick budget cap, not a
    per-phase one (`plan/bearings.md` § Operational notes: "a
    tick that genuinely needs more should be split, not have
    its cap raised silently") — the loop's next tick is the
    mechanism for continuing, not this one running longer.

## 8. Cross-link retrofit policy

When shipping family X, retro-fit links from already-shipped
families to X. The retro-fit is part of the *same* phase commit.
Keep edits scoped. Do not rewrite an already-shipped page's
structure to make room — that's a follow-up commit, not a
retro-fit.

## 9. Brief generation (when missing)

If `plan/phases/phase_<N>_<topic>.md` doesn't exist, follow
`skills/plan-a-phase.md` §5. The brief format is shared; the
generation procedure is owned there. Generated briefs are
committed separately from the code that follows.

## 10. Failure modes — when to actually stop

These are the only conditions that warrant stopping the loop
and asking the user. Everything else: decide, ship, document.

Before any stop: if `scripts/notify.mjs` exists, fire it with
the stop reason (`--priority high`). Best-effort — a failed
notification never becomes its own failure.

Stops come in two shapes. **Repo-shaped** failures (the whole
loop is unsafe to continue) end the tick entirely.
**Phase-shaped** failures (this one phase can't ship; the rest
of the plan is fine) additionally mark the phase row
`[blocked: <short reason> <ISO-date>]` in
`plan/steps/01_build_plan.md`, commit + push that state
change, and return cleanly — the next `/march` tick dispatches
past the blocked row into still-shippable work, and
`/oversight` owns unblocking.

Repo-shaped — stop the tick:

1. **`npm run verify` fails ≥3 times on the same root cause.**
2. **`npm run deploy:check` fails ≥3 times on the same root cause**
   after `npm run verify` passes locally.
3. **`GH_TOKEN` missing or rejected**
   (deploy:check exit 3). Stop and ask the user to populate
   `.env`.
4. **A `git pull` produces a divergence.** Don't `--rebase`
   blind; stop and report.
5. **A deploy fails for an infrastructure reason** (env var
   missing, plugin incompatibility) and the fix isn't local
   code. Stop and report.

Phase-shaped — mark `[blocked: …]`, notify, return:

6. **The phase requires a paid service or API key that isn't
   configured.** Note which env var / runbook is missing in
   the blocked reason.
7. **The design contradicts the URL / API / CLI contract** in a
   way you can't reconcile by trusting the contract.
8. **Phase scope is genuinely ambiguous after reading step 01 +
   the brief + bearings + spec.md.** Generate a more decisive
   brief and proceed; block only if even that fails.

For everything else: **decide, ship, document.**

## 11. Quick reference

```bash
# Where you read
plan/steps/01_build_plan.md                  # status + scope
plan/phases/phase_<N>_<topic>.md             # brief
plan/bearings.md                             # stack + conventions
axiomancer-mechanics/specs/                  # design specs (optional)
axiomancer-mechanics/braindump/              # raw design sessions (optional)
spec.md                                      # product spec
<your-app-path>/<canonical-family>/          # canonical sibling

# Sub-agents
Agent({ subagent_type: "scout", prompt: "..." })
Agent({ subagent_type: "card-expert", prompt: "..." })      # cards/keywords (kb-query + axio-query grounded)
Agent({ subagent_type: "mechanics-expert", prompt: "..." }) # design second opinion
Agent({ subagent_type: "content-curator", prompt: "..." })  # narrative content
# + your domain specialists

# Truth-source MCPs (main agent holds the grants too)
# axio-query: axio_overview / axio_cards / axio_effects / axio_keywords
# kb-query:   kb_overview / kb_find_games / kb_search / kb_read_doc / kb_cards / kb_keyword

# Verify + commit + push + deploy
npm run verify
git add <explicit files>
git commit -m "<subject>"
git push origin main
npm run deploy:check
```
