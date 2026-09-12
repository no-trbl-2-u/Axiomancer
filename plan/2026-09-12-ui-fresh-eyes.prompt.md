# Prompt: UI FRESH-EYES SWEEP — find and fix every UI misunderstanding, issue, enhancement (one shot)

> Written 2026-09-12 at T's direction. This file is a **handoff prompt**:
> paste it (or point a fresh Claude Code session at it) to run the sweep.
> §1–§4 are decisions. Do not re-litigate them.
>
> **Adjusted 2026-09-12 for ultracode** (`§10`). The persona (§1), taxonomy
> (§4), scope walls (§5), gate (§6), and acceptance criteria (§8) are
> unchanged decisions. What ultracode changes is **how much of the sweep runs
> in parallel and how hard each finding is tested before it is fixed** —
> §3.3 transport, §3.4 orchestration, §5's fix fleet, §7's provenance.

---

## 0. Your mandate

You are a **genre-literate first-time player** of the Axiomancer mobile app
(`axiomancer-mobile`, Expo web build at `http://localhost:8081`). You have
played Slay the Spire / Dawncaster-class deckbuilders. You have **never seen
this game**. You walk every player-facing screen, at two viewports, and log
every place the UI makes you misunderstand, stumble, or wish for more. Then
you **fix each one on the spot**, prove it, and ship one PR.

Work mode:

- **One shot.** Decide, record, move on. Genuine product decisions go in the
  report as `[needs-user-call]`; never block on them.
- **Fresh eyes are the asset.** Do §2 before reading any prior critique.
- **Fix, don't file.** Every finding you can fix inside §5's scope, you fix
  in the same sitting. The report is the record, not the deliverable.
- **Exhaustive, not fast (ultracode).** There is no finding cap and no token
  budget. Where a stage can fan out, it fans out (§10). Where a finding can
  be wrong, it is adversarially tested before it costs a commit (§4.1).

## 1. Persona (decided)

Genre-literate first-time player. Assume the player:

- Knows: deck, hand, draw, discard, energy/mana, intents, status stacking,
  map nodes, rest/shop/event conventions.
- Does not know: this game's vocabulary (stances, Conviction, Surge, Dice,
  vitae, shillings, signets, hazards, moral state), its iconography, or its
  navigation.

A finding is valid when **this** player would be confused. Genre education
("what is a deckbuilder") is not a finding. Total-novice friction is not a
finding.

## 2. Freshness protocol (do this first, in order)

1. Read only: `AGENTS.md`, `axiomancer-mobile/AGENTS.md`,
   `docs/state-fixtures.md`, this file. Nothing else yet.
2. Boot the web build (§3.3) and complete the **entire walk** (§3) taking
   notes as you go. Write raw notes to
   `axiomancer-mobile/.critique-artifacts/fresh-eyes-notes.md` (gitignored
   artifact dir) so nothing is lost.
3. **Only after the walk**: read `plan/CRITIQUE.md`, `plan/AUDIT.md`,
   `axiomancer-mobile/docs/reports/`. Mark each of your notes
   `new` / `known-open` / `known-closed-but-regressed`. Never drop a note
   because it was known; a repeat is evidence.

**Ultracode freshness rule.** Fan-out does not launder freshness. Every
observation agent in §10's Observe phase is given **captured evidence only**
(screenshot paths, DOM text dumps, console dumps) plus §1's persona — never
`plan/CRITIQUE.md`, `plan/AUDIT.md`, or `docs/reports/`. The freshness
classification in step 3 is done **after** the Observe phase closes, by the
main agent, against the merged finding set. An agent that was handed prior
critique is a contaminated agent: discard its rows.

## 3. Surfaces (decided)

### 3.1 Viewports

| Name | Size | Why |
|---|---|---|
| mobile | 375×812 | Target device. Primary. |
| desktop | 1280×800 | Expo web reflow. Secondary. |

Every route below is walked at **both**.

### 3.2 Route set = every deep-linkable route

Derived from `axiomancer-mobile/app/`. Fixture ids come from
`axiomancer-mechanics/src/Game/fixtures/state-fixture.registry.ts`
(`?fixture=<id>` is honoured because the dev server has dev tools on;
`arrive` fixtures open the gated screen cold).

| Route | Reach it via | Player-facing |
|---|---|---|
| `/` (title) | direct | yes |
| new-game / onboarding | from `/` → new game (also `?fixture=fresh-start`) | yes |
| `/exploration` | `?fixture=fresh-start`, `?fixture=sage-fv-boss-gate` (mid-campaign) | yes |
| `/character` | tab from exploration, both fixtures above | yes |
| `/inventory` | tab from exploration, both fixtures above | yes |
| `/memoir` | tab from exploration, both fixtures above | yes |
| `/combat-encounter` | `?fixture=sage-fv-boss-gate` → step to fv-24; also play a full live round to the end | yes |
| `/dialogue` | `?fixture=apprentice-fv-interaction` | yes |
| `/village` | `?fixture=wanderer-nf-village` | yes |
| `/cutscene` | `?fixture=wanderer-nf-cutscene` | yes |
| `/event` | any non-arrive fixture, then step onto an event node | yes |
| `/rest` | `?fixture=apprentice-fv-rest`; also `broke-l1-fv-rest` (empty wallet) | yes |
| `/cache` | `?fixture=apprentice-fv-cache` | yes |
| `/blacksmith` | `?fixture=wanderer-fv-blacksmith` | yes |
| `/hazard` | `?fixture=l30-caverns-hazard-arrive` | yes |
| `/hazard-deck` | from `/hazard` or `l30-caverns-hazard` | yes |
| `/labyrinth` | find the entry from exploration; if unreachable, note it | yes |
| `/dev`, `/devaftermath`, `/devart`, `/devart/rooms` | direct | **no** — smoke only: must not crash, must not be linked from a player screen |

For each player-facing route also exercise: every tappable element, every
empty state you can reach (empty deck, zero shillings, no inventory), back
navigation, and one theme switch if the screen exposes one.

If a route is missing or a fixture no longer builds, log it as an `issue`
(severity `blocker`) and continue.

### 3.3 Transport

Pick the **first** transport that boots. Record which one in the report §1.

1. **Dev server (preferred when Docker exists):**
   `cd axiomancer-mobile && npm run web:container && npm run web:container:wait`
   (fallback `npm run web`). Confirm `http://localhost:8081/` renders.
2. **Static preview export (the headless-container transport — use when
   Docker or the Expo CLI dev server is unavailable):**
   `npm install` at the repo root first (a fresh container has no
   `node_modules`, so `expo` is not on `PATH`), then
   `BUILD_PROFILE=preview npx expo export --platform web --output-dir <dir>`
   from `axiomancer-mobile`, and serve `<dir>` over a plain static HTTP
   server on `127.0.0.1:8081` with an SPA fallback to `index.html`.
   `BUILD_PROFILE=preview` bakes dev tools **on**, which is what makes
   `?fixture=<id>` honoured (`docs/state-fixtures.md` → Guarantees). This
   transport is equivalent for UI purposes and is **not** itself a finding.
3. **Driving.** Drive the walk **yourself from the main agent context** with
   the Playwright MCP tools (`mcp__playwright__browser_navigate`,
   `_snapshot`, `_take_screenshot`, `_click`, `_resize`,
   `_console_messages`, `_evaluate`). Do **not** delegate the *driving* to a
   sub-agent; MCP grants do not propagate (`skills/critique.md` §3.5,
   `axiomancer-mobile/scripts/critique-drive.mjs` header). Delegating the
   *reading* of captured artifacts is not only allowed, it is the point of
   §10's Observe phase.
4. **Bulk capture lane (run in parallel with the interactive walk):**
   `CRITIQUE_VIEWPORT=both npm run critique:drive` writes a screenshot, the
   DOM innerText, and the console/page errors per screen per viewport into
   `axiomancer-mobile/.critique-artifacts/`, plus `manifest.json`. Its route
   list is narrower than §3.2, so it supplements the walk; it never replaces
   it. Its `manifest.json` is also the §6 zero-`pageErrors` evidence.
   For interaction beyond what the MCP tools reach, write a throwaway
   Playwright library script beside `axiomancer-mobile/scripts/fixture-e2e.mjs`
   and delete it before commit.
5. Screenshot **every** screen at **every** viewport before any fix
   (`before/`) and again after (`after/`). Keep them in
   `axiomancer-mobile/.critique-artifacts/fresh-eyes/`.

### 3.4 Route coverage ledger (required)

Maintain `axiomancer-mobile/.critique-artifacts/fresh-eyes/coverage.md`: one
row per (route × viewport) with `walked` / `captured` / `blocked <why>`. §8
is checked against this ledger, not against memory. A route you could not
reach is a row with `blocked` **and** an `issue` finding — never a silent
omission (§10's no-silent-caps rule).

## 4. Finding taxonomy (decided)

Every note becomes one row:

| Field | Values |
|---|---|
| `id` | `FE-001`… |
| `kind` | `misunderstanding` (UI led me to a wrong model) · `issue` (broken, clipped, overlapping, unreachable, inconsistent, console error) · `enhancement` (works, but a genre-literate player expects more) |
| `severity` | `blocker` (cannot proceed / crash) · `major` (wrong model or lost action) · `minor` (friction) · `polish` |
| `route` + `viewport` | from §3 |
| `what I expected` / `what I saw` | one sentence each, in the player's voice |
| `evidence` | screenshot path + console/DOM excerpt |
| `suspected source` | file:line in `axiomancer-mobile/` (or mechanics text source) |
| `status` | `fixed <sha>` · `deferred [needs-user-call]` · `out-of-scope` |
| `freshness` | `new` / `known-open` / `known-closed-but-regressed` |
| `confidence` | 0–100: how much of this row is observed fact vs inference. 100 = reproduced in a screenshot or a console dump; below 60 = the verify panel kept it on a judgement call. Report it per row. |
| `verdict` | `CONFIRMED` (survived §4.1) · `REFUTED` (dropped — listed, with why) |

Misunderstanding test: write the wrong model you formed, then the screen
element that produced it. No element, no finding.

### 4.1 Adversarial verification (ultracode, required before any fix)

No finding buys a commit on one agent's word. Every merged candidate row goes
to a **perspective-diverse verify panel** of three independent agents, each
prompted to *refute* it from a different lens:

| Lens | The question it asks |
|---|---|
| `evidence` | Does the cited screenshot / DOM text / console dump actually show this? Quote the bytes or refute. |
| `persona` | Would the §1 genre-literate player really misread this, or is this genre education / total-novice friction (§1's exclusions) or taste? |
| `source` | Does the cited `file:line` produce this, and is the fix inside §5's scope — or is it a rule/number/state change that §5 walls off? |

A row is `CONFIRMED` when **≥2 of 3** lenses fail to refute it. A `REFUTED`
row is not deleted: it goes to the report's refuted table with the lens that
killed it. Verifiers default to `refuted: true` when uncertain.

## 5. Fix on the spot (decided)

Fix order: all `blocker` → `major` → `minor` → `polish`, misunderstandings
before issues before enhancements within a tier.

**In scope, fix immediately:**

- Anything under `axiomancer-mobile/` — screens, components, presenters,
  theming, copy strings, layout, hit targets, empty states, navigation.
- Text-only edits to mechanics content that surfaces as UI copy (card
  descriptions, keyword blurbs, NPC lines, tooltip strings) — must pass
  `npm run lint:content`.
- Enhancements that fit in one presenter/component and do not add a new
  screen, route, or persisted field.

**Out of scope — log as `deferred [needs-user-call]`, do not touch:**

- Any rule, number, state transition, or RNG (AGENTS.md hard rule: those
  live in `axiomancer-mechanics`, never in presenters).
- New screens, new routes, new persisted state, new dependencies.
- Anything touching `docs/reports/baselines/*.json` or `kb/`.

**How to fix:**

- Functional style: pure presenter functions, no classes, no mutation.
- Every function you add or change gets an explicit doc comment: purpose,
  inputs, outputs, the finding id it resolves.
- Every component you add gets a header comment: what it renders, what
  state it reads, where it is mounted.
- One commit per finding (or per screen when several polish rows share a
  file). Commit subject: `ui-fresh-eyes: FE-007 <route> — <one line>`.
  Body: expected / saw / fix. **No trailers, no emoji, no `-F`** — the guard
  hook (`.claude/hooks/guard.mjs`) blocks them.
- After each fix: re-screenshot that route at both viewports into `after/`.
- Never skip, disable, or loosen a test to get green.

### 5.1 Fix fleet (ultracode)

Fixes fan out; **commits do not**. Partition the CONFIRMED rows into
**file-disjoint groups** (two rows that touch the same file are one group,
transitively) and run one fix agent per group in parallel. Each agent edits
only its group's files, adds the doc comments and the hermetic test, runs the
fast per-fix checks (§6.1), and **stops without committing**. The main agent
then commits each group serially in §5's fix order, so history stays one
commit per finding and no two agents race the index.

A fix agent that finds its row out of §5's scope once it reads the source
returns `out-of-scope` with the wall it hit, and the row moves to deferred —
it does not widen.

## 6. Verification gate (every fix, then the whole PR)

Run in the foreground, never backgrounded:

```bash
npm run verify                    # root: all three packages
npm run e2e:fixture               # from axiomancer-mobile — every fixture still boots
npm run lint:content              # root — only if mechanics text changed
CRITIQUE_VIEWPORT=both npm run critique:drive   # zero pageErrors in manifest.json
```

A mechanics text edit also triggers the AGENTS.md cross-package checklist:
verify mobile and card-editor against it.

### 6.1 Fast checks (per fix, inside the fix agent)

Before a group is handed back for commit, its agent runs the narrow checks
its diff touches — `npm run lint -w axiomancer-mobile`,
`npm run typecheck -w axiomancer-mobile`, and the jest files covering the
changed components (`npm test -w axiomancer-mobile -- <pattern>`). These are
a pre-filter, never a substitute: the full §6 gate still runs in the
foreground at the final commit, and the AGENTS.md cross-package checklist
still applies to any mechanics text edit.

## 7. Report

Write `axiomancer-mobile/docs/reports/UI_FRESH_EYES_2026-09-12.md`:

1. **Header**: commit walked, commit shipped, viewports, route count,
   transport used, wall time.
2. **Totals table**: rows by `kind` × `severity` × `status`.
3. **Findings table**: every §4 row, sorted by severity then id.
4. **Deferred**: every `[needs-user-call]` row with the exact decision the
   user must make and your recommended option first.
5. **Before/after**: per fixed finding, the two screenshot paths.
6. **Misunderstanding map**: the wrong models you formed, in walk order —
   this is the highest-value section; write it before the tables.
7. **Refuted candidates** (ultracode): every `REFUTED` row, the lens that
   killed it, and its one-line reason. A sweep that refutes nothing did not
   verify anything.
8. **Ultracode provenance** (ultracode): workflow run ids, agent counts per
   phase, the rounds the Observe loop ran before going dry, and every
   coverage gap from §3.4's ledger. Name what was dropped and why.

Append a one-paragraph pointer to `plan/CRITIQUE.md` under the open
section referencing the report (respect its filing format and lexicon
lint). Do not paste the findings there.

File any direction the sweep produced but did not ship to `plan/AUDIT.md`
(findings, `[needs-user-call]` rows) and `plan/PHASE_CANDIDATES.md`
(buildable ideas) per AGENTS.md standing rule 7. `[needs-user-call]` is this
prompt's own tag by T's direction; file the same rows to `plan/AUDIT.md` so
THE OPEN GATE's `[loop-call]` review still sees them.

## 8. Acceptance criteria

- Every route in §3.2 walked at both viewports, with a `before/` screenshot,
  and a row in §3.4's coverage ledger.
- Zero `blocker` or `major` rows left in `deferred` unless out of scope by §5.
- Every `fixed` row has an `after/` screenshot and a commit sha.
- §6 gate green at the final commit.
- Report written; `plan/CRITIQUE.md` pointer appended.
- One PR, branch `claude/ui-fresh-eyes-<suffix>`, body = report §1 + §2 +
  link to the report file.
- **Ultracode:** every fixed row carries a `CONFIRMED` verdict from §4.1's
  3-lens panel; the Observe loop reached a dry round (§10); the completeness
  critic's final pass named no unwalked route, unverified claim, or unread
  artifact.

## 9. Do not

- Do not read prior critique before the walk (§2).
- Do not run as `/critique`; that skill is rate-limited and capped at 6
  findings. This sweep has no cap.
- Do not ask questions mid-run. Decide, record, continue.
- Do not widen into balance, content, or engine work.
- Do not delegate the browser driving (§3.3.3) — only the reading, the
  verifying, the fixing, and the synthesis fan out.
- Do not let a parallel fix agent commit. Commits are serial and the main
  agent's (§5.1).

## 10. Ultracode orchestration (how the sweep is actually run)

Five `Workflow` scripts, in sequence, with the main agent reading each
result before launching the next. The main agent keeps the browser, the git
index, and the judgement; the fleets do the reading, refuting, fixing, and
critiquing.

| # | Workflow | Shape | What it consumes | What it returns |
|---|---|---|---|---|
| 1 | **Observe** | loop-until-dry over a multi-lens fan-out | the `before/` captures + DOM/console dumps from §3.3 (evidence only — never prior critique) | candidate finding rows |
| 2 | **Verify** | pipeline: per row → 3-lens refute panel (§4.1) | one candidate row + its evidence + the repo source | `CONFIRMED` / `REFUTED` + confidence |
| 3 | **Fix** | parallel over file-disjoint groups (§5.1) | a group of CONFIRMED rows | edits + fast-check results, uncommitted |
| 4 | **Critique** | completeness critic + regression readers | the coverage ledger, the `after/` captures, the diff | what is still missing / what a fix broke |
| 5 | **Report** | parallel section writers → main-agent merge | every CONFIRMED/REFUTED row, both capture sets | §7's report sections |

**Observe lenses** (each agent is blind to the others; run them per viewport
and per route batch): `vocabulary` (this game's words vs the genre's),
`iconography` (glyphs, meters, badges — what do they claim to mean),
`affordance` (what looks tappable, what is, what is not), `layout`
(clipping, overlap, truncation, safe area, reflow at the other viewport),
`information-scent` (can I tell what this screen wants from me), `flow`
(what happens on back / after the action / on the empty state),
`console` (every error, warning, and network failure in the dumps),
`consistency` (does this screen contradict another screen's grammar).

**Loop-until-dry:** re-run the Observe fan-out until **two consecutive
rounds** add no new row after dedup. Dedup against every row ever seen (not
only the confirmed ones) or verify-rejected rows resurface forever.

**No silent caps.** Anything bounded — a route not reached, a batch trimmed,
an agent that returned nothing, a re-run not spent — is `log()`ged during the
run and lands in report §8. Silent truncation reads as full coverage; it is
the one failure this sweep cannot recover from after the fact.
