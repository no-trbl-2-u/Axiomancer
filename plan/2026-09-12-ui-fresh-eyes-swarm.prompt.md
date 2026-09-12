# Prompt: UI FRESH-EYES SWARM — drain the 309-row candidate set (one shot, ultracode)

> Written 2026-09-12 at T's direction after sweep PR #301 landed. This file is
> a **handoff prompt**: kick off a fresh Claude Code session on the repo with
> the message `ultracode — run plan/2026-09-12-ui-fresh-eyes-swarm.prompt.md`.
> The word `ultracode` is what unlocks the `Workflow` tool; without it the
> swarm in §6 cannot be launched. §1–§5 are decisions. Do not re-litigate.

---

## 0. Your mandate

Sweep #301 (`axiomancer-mobile/docs/reports/UI_FRESH_EYES_2026-09-12.md`)
observed 309 candidate rows, verified and fixed 28, refuted 6, deferred 6, and
**left 275 rows unverified** because its verify fleet and fix fleet never ran
(container concurrency cap of 2; see that report §7). Your job is to give
**every one of the 309 rows a disposition** — `fixed <sha>`, `refuted <lens>`,
`closed-by-decision`, `duplicate-of <cluster>`, or `out-of-scope <wall>` — and
to ship every fix in one PR.

Work mode:

- **One shot.** Decide, record, continue. No questions mid-run.
- **Swarm, not solo.** The unit of work is a `Workflow` script, not a hand
  loop. The main agent keeps the browser, the git index, and the judgement;
  fleets do the clustering, refuting, fixing, and critiquing (§6).
- **Sized to the box.** Concurrency is `min(16, nproc - 2)`. Measure `nproc`
  first and size batches so the fleet stays busy but the agent count stays
  near §6.5's budget. A 4-CPU box gives 2 slots; that is fine — pipelining
  still wins because verify for shard A runs while shard B is still
  clustering. Never cap a stage silently (§6.6).
- **Persona, taxonomy, scope, gate** are inherited unchanged from
  `plan/2026-09-12-ui-fresh-eyes.prompt.md` §1, §4, §5, §6. Read that file
  once, then this one.

## 1. Input (decided)

| Input | Path |
|---|---|
| Candidate rows | `axiomancer-mobile/docs/reports/UI_FRESH_EYES_2026-09-12.candidates.md` — 309 rows, `C-001`… (100 major, 165 minor, 44 polish; 202 issue, 84 misunderstanding, 23 enhancement) |
| Already fixed | report §3, `FE-001`…`FE-028`. A candidate whose cluster maps to one of these is `duplicate-of FE-nnn`, not re-fixed. Re-verify only that the fix landed on the current head. |
| Already refuted | report §4 refuted table. Same rule: `duplicate-of` the refutation. |
| Capture driver | `axiomancer-mobile/scripts/fresh-eyes-capture.mjs` (committed). `OUT=.critique-artifacts-fresh-eyes/before node scripts/fresh-eyes-capture.mjs`. Never write under `.critique-artifacts/` — `critique:drive` wipes it. |
| Transport | §3.3 of the parent prompt. #301 used the static preview export because Docker was absent; expect the same. |

## 2. Deferred decisions from #301 §4 — now decided (T, 2026-09-12)

| # | Decision | Effect on candidate rows |
|---|---|---|
| 1 | Fanned hand stays as authored (owner directive 2026-08-10). | Every row about the fan hiding card ledgers / names / costs (e.g. `C-051`, `C-054`, `C-055`, `C-057`, `C-058`, `C-059`) → `closed-by-decision`. Rows about medallions physically covering cards are **not** covered by this decision — verify them. |
| 2 | Signet rail stays compact; the primer teaches it. | Rows asking for names on the rail (`C-043`, `C-050`, `C-053`, `C-056` and their duplicates) → `closed-by-decision`. Rows about the rail's affordance contradicting the counter's are still live. |
| 3 | `/rest` prints the **binding** disabled reason on the row. | **Fix.** Authorized as an in-scope presenter change. |
| 4 | `/hazard-deck` pastel palette is deliberate. | Palette / chrome rows → `closed-by-decision`. Layout, clipping, glossary-reachability rows on that screen are still live. |
| 5 | `LEAGUES` is a unit: lowercase it in the title copy. | **Fix.** |
| 6 | Crop the Doré plates above their baked-in captions. | **Fix.** Asset edit under `axiomancer-mobile/assets/**` plus `npm run assets:check`. |

The cluster stage (§6.1) tags every cluster that a decision covers; the tag
is a verdict, so those clusters skip verify.

## 3. Shards (decided): by screen group, file-disjoint

Every fix agent owns a **file set**, not a screen set. A row whose suspected
source is in another shard's file set is reassigned to that shard at cluster
time. Two shards never hold the same file. The main agent adds any file the
table below misses to exactly one shard before Fix starts.

| Shard | Screens (candidate `screen` column) | Owned files |
|---|---|---|
| `S1-board` | `12-combat-board`, `combat-board`, `33-combat-after-end-phase`, `combat` | `components/combat/encounter/CombatBoard.tsx`, `CombatCombatantPane.tsx`, `IntentIcon.tsx`, `CombatDie.tsx`, `state/presenters/combat-encounter.engine.ts` |
| `S2-preview` | `11-combat-preview`, `combat-preview` | `components/combat/encounter/CombatEncounterPanel.tsx`; **text-only** in `axiomancer-mechanics/src/Combat/combat.threat.ts` |
| `S3-sheet` | `05-`/`06-character-*`, `07-`/`08-inventory-*`, `character-fresh`, `inventory-fresh` | `app/(tabs)/character/index.tsx`, `app/(tabs)/inventory/index.tsx`, `state/presenters/inventory.engine.ts`, `character.engine.ts`, `stat-format.ts`, `components/StatusCard.tsx`, `components/inventory/**` |
| `S4-world` | `01-title`, `02-onboarding`, `03-`/`04-exploration-*`, `exploration-midgame`, `22-event`, `event`, `late-game-hub`, `title` | `components/TitleScreen.tsx`, `EventGate.tsx`, `ScreenBg.tsx`, `NodeMark.tsx`, `components/exploration/**`, `app/(tabs)/exploration/index.tsx`, `app/event/index.tsx`, `app/cutscene/index.tsx`, `state/presenters/exploration.engine.ts`, `event.engine.ts`, `tabs.engine.ts`, `assets/**` (decision 6) |
| `S5-talk` | `13-dialogue`, `14-village`, `19-blacksmith`, `dialogue`, `village`, `blacksmith` | `app/dialogue/index.tsx`, `app/village/index.tsx`, `app/blacksmith/index.tsx`, `components/LeaveRow.tsx`, `state/presenters/blacksmith.engine.ts`, `dialogue.*`, `village.*` |
| `S6-camp` | `16-rest`, `17-rest-broke`, `18-cache`, `rest` | `app/rest/index.tsx`, `app/cache/index.tsx`, `state/presenters/rest.copy.ts`, `rest.engine.ts`, `cache.copy.ts`, `consequence-copy.ts` |
| `S7-hazard` | `20-hazard`, `21-hazard-deck`, `23-labyrinth`, `hazard`, `hazard-deck` | `app/hazard/index.tsx`, `app/hazard-deck/index.tsx`, `app/labyrinth/index.tsx`, `components/hazard/**`, `state/presenters/hazard*.ts`, `labyrinth*.ts` |
| `S8-memoir` | `09-`/`10-memoir-*`, `memoir-fresh` | `app/(tabs)/memoir/index.tsx`, `state/presenters/memoir.engine.ts` |
| `X-thread` | `cross-screen`, and any cluster whose rows span ≥2 shards' files (currency naming, `SURGE`, `SEALED`, the journal's name, `◆`) | **No files.** Runs **serially after** every shard is committed (§6.4). |

Rows citing `components/dev/DevToolsLink.tsx` are `duplicate-of` #301's
transport-artifact refutation. Rows citing `scripts/fresh-eyes-capture.mjs`
or `manifest.json` are driver artifacts → `refuted evidence`.

## 4. Verdict rules (decided)

Inherited from parent §4.1 with one change forced by the box: the three
lenses run as **two agents per batch**, not three agents per row.

| Agent | Lenses | Refutes when |
|---|---|---|
| `refute-A` | `evidence` + `persona` | the cited capture does not show it, **or** a genre-literate player would not misread it |
| `refute-B` | `source` + `scope` | the cited `file:line` does not produce it, **or** the fix is a rule/number/state change |

A cluster is `CONFIRMED` only when **neither** agent refutes it. Verifiers
default to refuted when uncertain. Every verdict carries a one-line reason
and a confidence 0–100. A `REFUTED` cluster is listed in the report, never
deleted.

## 5. Fix rules (decided)

Parent §5 applies in full (scope walls, functional style, explicit doc
comments per function and header per component, one test per fix, no
trailers / emoji / `-F`). Swarm additions:

- A fix agent edits **only its shard's owned files**. Touching any other file
  is a failed run: the main agent discards the diff for that file and
  re-queues the row to the owning shard.
- Fix agents run the fast checks (parent §6.1) and **stop without
  committing**. They return `{rows: [{id, files, test, status}]}`.
- The main agent commits **serially**, one commit per row where the row's
  files are disjoint from its shard-mates', otherwise one commit per shard
  listing every `C-` id. Subject: `ui-fresh-eyes: FE-0nn <route> — <one line>`.
  New `FE-` ids continue from `FE-029`.
- Two fix agents may be live at once; a typecheck that fails only because a
  sibling's file is mid-edit is retried **once** after the sibling returns.
  A second failure is real.
- After all shards commit, the main agent re-captures `after/` for every
  route a fix touched, at both viewports, with the committed driver.

## 6. The swarm (how it actually runs)

One `Workflow` per phase, in sequence; the main agent reads each result
before launching the next. Skeleton in §6.7 — start from it, do not reinvent.

### 6.1 Cluster (one agent per shard, `effort: 'low'`)

Input: the shard's rows from the candidates file, verbatim, plus §2's
decision table and #301's `FE-`/refuted tables. Output: clusters
`{clusterId, rowIds[], canonical, severity, kind, suspectedFiles[], tag}`
where `tag ∈ {live, closed-by-decision <n>, duplicate-of FE-nnn,
duplicate-of refuted, driver-artifact, reassign <shard>}`. Semantic, not
string-keyed: the report says string dedup collapsed almost nothing.
Severity of a cluster is its highest member's. Row count in equals row count
out; the main agent asserts this in the script.

### 6.2 Verify (per shard, batches of ≤10 live clusters, 2 agents per batch)

Runs **inside the shard's pipeline** as soon as that shard's cluster stage
returns. Each agent receives the batch, the `before/` capture paths and DOM
text for the batch's screens, and read access to the repo. §4's rule decides.

### 6.3 Fix (one agent per shard, default effort)

Runs inside the shard's pipeline when that shard's verify batches are all
back. Receives every `CONFIRMED` cluster in the shard in parent §5's order
and the owned-file list. Returns per-row status. The main agent commits per
§5.

### 6.4 Thread (serial, after every shard has committed)

`X-thread` clusters are the cross-screen naming rows. One agent per theme
(`currency`, `journal-name`, `SEALED`, `SURGE`, `◆`), run **one at a time**
because they touch many shards' files. Each writes the one-word rule it
applied at the top of its diff summary; the main agent commits one commit
per theme. The `[score 6.5] One concept, one word` candidate in
`plan/PHASE_CANDIDATES.md` is the same work; mark it shipped-in-part with
this PR's number.

### 6.5 Critique + Report

- **Completeness critic** (1 agent): reads the disposition table and asks
  what is missing — a `C-` id with no verdict, a shard whose fix agent
  returned fewer rows than it was given, a `closed-by-decision` tag on a row
  the decision does not actually cover. Anything found is one more Fix or
  Verify call, not a report footnote.
- **Regression readers** (2 agents, one per viewport): read `before/` vs
  `after/` for every touched route and return anything a fix broke.
- **Report writers** (3 agents: disposition table, misunderstanding deltas,
  provenance): parallel; the main agent merges.

Agent budget (log the real numbers in provenance): cluster 8 + verify
≈2×⌈clusters/10⌉ (≈40) + fix 8 + thread 5 + critique 3 + report 3 ≈ **65–70
agents**. This is the scale this prompt calls for; the session's default
"under 15" guideline does not apply.

### 6.6 No silent caps

Any bound — a batch trimmed, a shard skipped, a verify agent that returned
null, a retry not spent, a stage not run — is `log()`ged during the run and
lands in the report's provenance section. #301's honest "Observe was capped
at one round" is the model.

### 6.7 Skeleton (plain JS, no TS; no `Date.now()` / `Math.random()`)

```js
export const meta = {
  name: 'ui-fresh-eyes-swarm',
  description: 'Cluster, verify, and fix the 309 UI fresh-eyes candidates by file-disjoint shard',
  phases: [
    { title: 'Cluster', detail: 'one agent per shard, semantic dedup + decision tags' },
    { title: 'Verify',  detail: 'two refute lenses per batch of ≤10 clusters' },
    { title: 'Fix',     detail: 'one agent per shard, owned files only, no commits' },
  ],
}
// args = { shards: [{id, screens[], files[], rows[]}], decisions: [...], fixed: [...], refuted: [...] }
const CLUSTERS = { type: 'object', required: ['clusters'], properties: { clusters: { type: 'array', items: {
  type: 'object', required: ['clusterId', 'rowIds', 'canonical', 'severity', 'kind', 'suspectedFiles', 'tag'],
  properties: { clusterId: {type:'string'}, rowIds: {type:'array', items:{type:'string'}}, canonical: {type:'string'},
    severity: {type:'string'}, kind: {type:'string'}, suspectedFiles: {type:'array', items:{type:'string'}}, tag: {type:'string'} } } } } }
const VERDICT = { type: 'object', required: ['verdicts'], properties: { verdicts: { type: 'array', items: {
  type: 'object', required: ['clusterId', 'refuted', 'reason', 'confidence'],
  properties: { clusterId:{type:'string'}, refuted:{type:'boolean'}, reason:{type:'string'}, confidence:{type:'number'} } } } } }
const FIXED = { type: 'object', required: ['rows'], properties: { rows: { type: 'array', items: {
  type: 'object', required: ['clusterId', 'status', 'files', 'test'],
  properties: { clusterId:{type:'string'}, status:{type:'string'}, files:{type:'array', items:{type:'string'}}, test:{type:'string'} } } } } }

const chunk = (xs, n) => xs.reduce((acc, x, i) => (i % n ? acc[acc.length - 1].push(x) : acc.push([x]), acc), [])

const results = await pipeline(
  args.shards,
  // Stage 1 — cluster. Cheap, one per shard.
  s => agent(`Shard ${s.id}. Cluster these candidate rows semantically ... rows: ${JSON.stringify(s.rows)} decisions: ${JSON.stringify(args.decisions)} fixed: ${JSON.stringify(args.fixed)} refuted: ${JSON.stringify(args.refuted)}`,
             { label: `cluster:${s.id}`, phase: 'Cluster', schema: CLUSTERS, effort: 'low' })
        .then(r => { const n = r.clusters.flatMap(c => c.rowIds).length
                     if (n !== s.rows.length) log(`${s.id}: cluster lost rows ${s.rows.length}→${n}`)
                     return r.clusters }),
  // Stage 2 — verify live clusters only, two lenses per batch. No barrier across shards.
  (clusters, s) => {
    const live = clusters.filter(c => c.tag === 'live')
    log(`${s.id}: ${clusters.length} clusters, ${live.length} live`)
    return parallel(chunk(live, 10).flatMap(batch => [
      () => agent(`Refute via evidence+persona ... ${JSON.stringify(batch)}`, { label: `refute-A:${s.id}`, phase: 'Verify', schema: VERDICT }),
      () => agent(`Refute via source+scope ... ${JSON.stringify(batch)}`,     { label: `refute-B:${s.id}`, phase: 'Verify', schema: VERDICT }),
    ])).then(vs => {
      const refutedIds = new Set(vs.filter(Boolean).flatMap(v => v.verdicts).filter(v => v.refuted).map(v => v.clusterId))
      const dropped = live.length - vs.filter(Boolean).length / 2 * 10
      if (vs.some(v => v === null)) log(`${s.id}: a verify agent returned null — its batch is UNVERIFIED, not confirmed`)
      return { s, clusters, confirmed: live.filter(c => !refutedIds.has(c.clusterId)), verdicts: vs.filter(Boolean).flatMap(v => v.verdicts) }
    })
  },
  // Stage 3 — fix, owned files only, no commit.
  r => r.confirmed.length === 0 ? { ...r, fixed: [] }
     : agent(`Shard ${r.s.id}. Fix every cluster below in severity order. Edit ONLY: ${r.s.files.join(', ')}. Run fast checks. Do NOT commit. ${JSON.stringify(r.confirmed)}`,
             { label: `fix:${r.s.id}`, phase: 'Fix', schema: FIXED }).then(f => ({ ...r, fixed: f ? f.rows : null }))
)
return results.filter(Boolean)
// Thread, Critique, and Report are separate Workflow calls after the main agent has committed every shard.
```

## 7. Report

Write `axiomancer-mobile/docs/reports/UI_FRESH_EYES_SWARM_<run-date>.md`:

1. **Header**: branch point sha, final sha, transport, `nproc`, concurrency
   cap, wall time, agent count per phase (planned vs actual).
2. **Disposition table**: all 309 `C-` ids → cluster → verdict → `FE-` id /
   sha or reason. This is the acceptance artifact.
3. **Fixed**: per new `FE-` row, expected / saw / fix / test / before+after
   capture paths.
4. **Refuted**: per cluster, the lens and the reason.
5. **Closed by decision**: per cluster, which of §2's six.
6. **Out of scope / still open**: with the wall hit and a proposed patch.
7. **Provenance**: every `log()` line that named a cap, a null, or a retry.

Append a one-paragraph pointer to `plan/CRITIQUE.md`; file any
`[needs-user-call]` residue to `plan/AUDIT.md`; update the two
`PHASE_CANDIDATES.md` entries #301 filed with what this PR shipped.

## 8. Acceptance criteria

- 309 of 309 `C-` ids have a disposition; the completeness critic found none
  missing on its final pass.
- Every `CONFIRMED` cluster is `fixed` or `out-of-scope <wall>` — never
  silently dropped.
- Parent §6 gate green at the final commit: `npm run verify`,
  `npm run e2e:fixture`, `npm run lint:content` if mechanics text changed,
  `CRITIQUE_VIEWPORT=both npm run critique:drive` with zero page errors.
- `after/` captured for every touched route at both viewports.
- One PR, branch `claude/ui-fresh-eyes-swarm-<suffix>`, body = report §1 +
  totals + link.

## 9. Do not

- Do not re-observe. The 309 rows are the input; new observation is a
  different prompt.
- Do not run one agent per row, or three per row. The box cannot afford it
  and #301 proved it.
- Do not let two shards own one file. Reassign the row, never the file.
- Do not commit from inside a fix agent.
- Do not write under `.critique-artifacts/`.
- Do not ask questions mid-run. Decide, record in provenance, continue.
