# Revamp — the loop (skills, commands, agents, hooks, workflows)

> Part plan of [THE REVAMP](README.md). Phase **R0** (attended — it edits
> `.claude/**`, which is classifier-blocked for unattended runs). Decision
> D58. Status: RATIFIED 2026-09-28 (D64).

## Ruling

T, 2026-09-28:

- **Role during the revamp:** once ratified, `/march` ships **only** phases
  from the ratified revamp build plan, plus fix-ci and critique. **No
  content creation of any kind** — cards, keywords, enemies, relics, maps,
  NPCs, events, art. Owner-led phases (B1–B3, B5–B9) wait for T.
- `/march` and `night` are disabled on GitHub until ratification, and are
  re-enabled only after R0 merges.
- Keep **every** core verb and fix its doctrine; archive the content
  stewards, the design skills and most helper agents.
- **Amended in the R0 session (T, 2026-09-28):** `/march` keeps the
  upstream nexus chain — triage → critique → phase → expand → iterate —
  with only the stewards, `/forge` and the growth floor removed. `/iterate`
  and `/expand` run on their normal turns and create nothing. Red `main`
  stays with the `ci-autofix` workflow, not a march step. Revamp mode ends
  when Phase R11 (the loop's content phases) ships.

Telemetry note: the hook (`.claude/hooks/telemetry.mjs:232-258`) counts only
`Skill`/`SlashCommand` calls, so verbs `/march` dispatches by reading
`skills/*.md` are uncounted. GitHub Actions is the truer usage record.

## R0 — Loop doctrine reset (attended)

### Archive (move to `plan/archive/2026-09-28-revamp-r0/`)

| Item | Why |
|---|---|
| `skills/adjust-cards.md`, `skills/adjust-keywords.md` + stubs | audit presets, aspect thirds, `// pts:`, themes; growth rules contradict D37 |
| `skills/adjust-enemies.md`, `adjust-equipment.md`, `adjust-npcs.md` + stubs | no autonomous content work; every recent pass created nothing; KB gates ran empty |
| `skills/forge.md` + stub | used once; maps are hand-authored; events restricted by THE BLANK PAGE |
| `.claude/agents/card-expert.md` | teaches pricing, presets, six themes; a fresh card agent is written at the first card session (B6) |
| `.claude/agents/mechanics-expert.md` | Heart/Body/Mind + fallacy doctrine |
| `.claude/agents/reader.md` | a website auditor; `Auth: none`, no site |
| `.claude/agents/content-curator.md` | writes content the loop may not create |
| `.claude/skills/brainstorm-mechanics/` | RPS/fallacy/moral-meter identity |
| `.claude/skills/character-spec/`, `story-spec/`, `world-spec/` | ~80% shared text; "moral integration"; wrong output paths |
| `.claude/skills/kb-query/` | the MCP tools stay callable directly |

Fold before archiving: the 12-step keyword wiring checklist (from
`adjust-keywords`/`card-expert`) → `axiomancer-mechanics/docs/keyword-atlas.md`;
the map wiring contract → `docs/world.md` "Map shape" (verify complete).
Drop the stewards' `plan/CONTENT_LEDGER.md` rows, `march.md`'s steward
rotation (`:160-198`, `:194`, `:312-315`) and the growth-floor pre-emption
(`:135-156`). Update `scripts/check-harness-grants.mjs:7` (names `reader`),
AGENTS.md (`:92-121`, `:197-206`), bearings (`:223-248`, `:291-300`),
`axiomancer-mechanics/CLAUDE.md:87-89`, `plan/README.md` "Where design lands".

Mark `axiomancer-mechanics/specs/world/W-01-aporia-labyrinth-continent.md`,
`specs/story/00-story-spec-template.md` and `braindump/BRAINDUMP.md`
HISTORICAL. Owner action (not the repo): remove the globally installed
`anthropic-skills:rpg-mechanics-brainstorm` duplicate.

### Keep and fix

| Verb / file | Fixes |
|---|---|
| All verbs | a **revamp-mode banner**: ratified revamp phases only, no content creation (D58), THE CARD HOLD (D37); strip `card-expert` / `/adjust-*` routing (`iterate.md:243-248, 398`; `ship-a-phase.md:66-67`; `digest.md:79-83`) |
| `march.md` + stub | drop the steward rotation; one home for gate logic (critique §9, expand §9, iterate §6.6 repeat it); stub lists paused stewards and calls a 320-line skill "short" |
| `iterate.md` + stub | cut web-template audit categories (pillars, word counts, `alt`, unused CSS); focus list matches the skill; no content fixes |
| `ship-a-phase.md` | cut web-template text (Next.js/Express, 375px, page families, cross-link retrofit, `:84-122, 266-293, 412-413, 460-466`); "HP is sole win condition" (`:416`) → VITAE + befriend; dated incidents → archive |
| `plan-a-phase.md` | drop "specs win over bearings" (`:35, 118-123`) and the web brief format (`:61-73`); briefs cite `plan/revamp/` |
| `expand.md` | D37/D58 filter; exclude `braindump/` and HISTORICAL specs from signal E; drop the dead autonomous-posture branch; "Axiomancer" → product name |
| `oversight.md` | drop the dead `audit` mode (no callers) and the retired `[needs-user-call]` outputs |
| `critique.md` + stub | drop the dead auth dual-pass; stub must not say "delegate to playtester" (the skill forbids it unattended) |
| `jot.md` + stub | trim to the row append; fix `--authenticated`, the "thock" typo, dead route examples |
| `triage.md` | drop the `triage:needs-user` route (THE OPEN GATE abolished it); §6 defers to `close-trailers.yml` |
| `digest.md` | drop "Report CQI", the ten-preset curve, `/adjust-cards` filing, the nightly baseline re-measure (D57); fix "committed HTML" vs the gitignored build |
| `consolidate.md` | paths: `axiomancer-mechanics/docs/lexicon.json`, `…/docs/LEXICON.md`; archived example docs |
| `.claude/commands/fix-ci.md` | promote to `skills/fix-ci.md`; replace the dice-flag witness example; drop `[needs-user-call]` |
| `.claude/commands/combat-playtest.md` | rewrite around S3 questions (does stat growth track the stage curve; are the three survivors winnable/at risk); no status/mercy-as-alt-win/preset/CQI; findings → `plan/AUDIT.md` |
| `.claude/agents/scout.md` | fill `<DOMAIN_AUTHORITATIVE_SOURCE_*>` placeholders (`:68-70`); name; add kb-query tools or a KB-first rule |
| `.claude/agents/playtester.md` | fix `docs/reports/PLAYTEST_REPORT.md`, `docs/state-fixtures.md`, `docs/logging.md` paths; drop "mercy and other alt-wins"; check preset fixture ids |
| `.claude/hooks/telemetry.mjs` | log a row when `skills/<verb>.md` is read, so march-dispatched verbs count |
| `.claude/hooks/guard.mjs` | R1's baseline items (freshness print, baseline write-block) |
| `.claude/settings.json` | drop `lint:names`/`check-naming-law` allowances; add a guard or remove `Bash(git stash:*)` (shared stash across worktrees) |
| `.claude/launch.json` | drop the card-editor config (R1) |

### Workflows

T ruled: fix only ci-autofix. `.github/workflows/ci-autofix.yml` shares the
`nexus-loop` concurrency group (`:23-25`), so skipped runs enter the group
and displace pending real ones (2 successes, 32 cancelled, 266 skipped —
inferred, confirm in logs). Give it its own group or filter on `conclusion`
before queuing. Also fix `.github/workflows/README.md` drift (`:52` says
Opus 4.8; `:53` combat-playtest "doctrine verdict") and AGENTS.md:229
"weekly tuning loops". The idle verb workflows, `pat-probe` and `triage`
stay as they are.

### Plan hygiene

- `plan/bearings.md`: supersede `:283-285` (aspect thirds survive), `:338-345`
  (THE UNSHACKLING's full card authority), `:386-393` (open keyword growth)
  with D36/D37/D58 notes; reconcile `:691-700` CQI with digest.
- `plan/PHASE_CANDIDATES.md`: move moot rows to Rejected citing D36/D37/D48/
  D50/T6 — card-face parity (`:297`), `PRESET_LINEAGE` (`:347`), 27 damned
  exemplars (`:354`), enchant hooks (`:425`), pricing-lint credit (`:437`),
  starter-library trim (`:448`), swap-pool authoring (`:495`),
  premiseShed (`:524`), choice-width (`:546`), challenge-gradient (`:561`),
  themed enemy decks (`:595`), mid-game preset library (`:649`), preset
  budget lint (`:671`), doctrine curve (`:689`), "foe takes more damage"
  (`:794`, met by VULNERABLE); the card-mechanic gap rows (`:857, :914,
  :1003`) move to a card-session queue in `plan/revamp/cards.md`.
- `plan/AUDIT.md`: close moot rows (`:736, :784, :960, :1046, :1058, :1070,
  :1081, :1127, :1292`, `:326` mechanics-expert, `:1091` combat-playtest).
- `plan/CRITIQUE.md`: close `:413, :423, :433, :546, :560, :627`; re-verify
  `:228, :597` against the grey cards.
- `plan/phases/`: archive shipped briefs 102, 103, 104, M4, M5, T6.
- `plan/CONTENT_LEDGER.md`: drop steward rows (above).

## R11 — Loop content phases (attended, last revamp phase)

Added in the R0 session (T, 2026-09-28). Revamp mode has no other exit, so
without this phase the loop would stay content-free forever. R11 is attended
because it edits `.claude/**` and sets doctrine.

- Decide how content creation returns to the loop **as phases in the build
  plan**, not as a standing steward rotation (the archived `adjust-*` /
  `/forge` model created content outside any plan). For each surface
  (cards, keywords, enemies, relics, maps, NPCs, events, art) decide:
  loop-shippable phases, owner-led sessions, or still held.
- Review the archive in `plan/archive/2026-09-28-revamp-r0/` for anything
  worth reviving in a new shape (a content agent, the wiring checklists
  already folded into docs).
- Check telemetry (`npm run telemetry`, including `verb-read` rows) and
  the GitHub Actions run history for verbs with no invocations since R0;
  fix how they are used or wired rather than cutting them.
- Remove the revamp-mode banner from every verb and the doctrine files
  (AGENTS.md, bearings, the build plan), and record the new standing
  content rules in bearings.

Requires R10 (the reset track done). Card work still follows THE CARD HOLD
and whatever card plan T picked.

### Exit

R0 merges → T re-enables `march` and `night` → the loop picks R1.
