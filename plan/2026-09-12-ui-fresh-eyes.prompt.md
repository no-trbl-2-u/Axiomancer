# Prompt: UI FRESH-EYES SWEEP — find and fix every UI misunderstanding, issue, enhancement (one shot)

> Written 2026-09-12 at T's direction. This file is a **handoff prompt**:
> paste it (or point a fresh Claude Code session at it) to run the sweep.
> §1–§4 are decisions. Do not re-litigate them.

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

1. Boot: `cd axiomancer-mobile && npm run web:container && npm run web:container:wait`
   (fallback `npm run web`). Confirm `http://localhost:8081/` renders.
2. **Drive it yourself from the main agent context** with the Playwright
   MCP tools (`mcp__playwright__browser_navigate`, `_snapshot`,
   `_take_screenshot`, `_click`, `_resize`, `_console_messages`). Do **not**
   delegate the walk to a sub-agent; MCP grants do not propagate
   (`skills/critique.md` §3.5).
3. If the MCP tools are absent: `CRITIQUE_VIEWPORT=both npm run critique:drive`
   for captures, then read every screenshot and `.txt` under
   `axiomancer-mobile/.critique-artifacts/`. For interaction, write a
   throwaway Playwright library script beside
   `axiomancer-mobile/scripts/fixture-e2e.mjs` and delete it before commit.
4. Screenshot **every** screen at **every** viewport before any fix
   (`before/`) and again after (`after/`). Keep them in
   `axiomancer-mobile/.critique-artifacts/fresh-eyes/`.

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

Misunderstanding test: write the wrong model you formed, then the screen
element that produced it. No element, no finding.

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

Append a one-paragraph pointer to `plan/CRITIQUE.md` under the open
section referencing the report (respect its filing format and lexicon
lint). Do not paste the findings there.

## 8. Acceptance criteria

- Every route in §3.2 walked at both viewports, with a `before/` screenshot.
- Zero `blocker` or `major` rows left in `deferred` unless out of scope by §5.
- Every `fixed` row has an `after/` screenshot and a commit sha.
- §6 gate green at the final commit.
- Report written; `plan/CRITIQUE.md` pointer appended.
- One PR, branch `claude/ui-fresh-eyes-<suffix>`, body = report §1 + §2 +
  link to the report file.

## 9. Do not

- Do not read prior critique before the walk (§2).
- Do not run as `/critique`; that skill is rate-limited and capped at 6
  findings. This sweep has no cap.
- Do not ask questions mid-run. Decide, record, continue.
- Do not widen into balance, content, or engine work.
