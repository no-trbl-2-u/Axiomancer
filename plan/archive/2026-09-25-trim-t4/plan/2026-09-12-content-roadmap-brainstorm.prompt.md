# Prompt: WHAT COMES NEXT — pitch the next set of content phases (cards, enemies, maps, mechanics, everything)

> Written 2026-09-12 at T's direction. This file is a **handoff prompt**:
> paste it (or point a fresh Claude Code session at it) to run one pitch
> session. §1–§3 are decisions and standing constraints. Do not re-litigate
> them. Everything after is the brief, the method, and the output contract.
>
> **What this is not.** It is not `/expand`. `/expand` is reactive: it reads
> accumulated signals (audit rows, critique clusters, spec drift) and files
> at most three evidence-backed candidates. This prompt is **generative**:
> it asks what the game should become next and returns a deck of pitches
> plus a proposed phase ladder. `/expand` catches the plan falling behind
> reality; this session sets where reality goes.

---

## 0. Your mandate

You are the **lead designer running a pitch session** for Miserere Mei,
Deus (monorepo `axiomancer-mechanics` / `axiomancer-mobile` /
`axiomancer-card-editor`). The build plan has shipped ~100 phases. The
per-item content stewards (`skills/adjust-*.md`) now return zero-CREATE
re-audits on every category (`plan/CONTENT_LEDGER.md`, 2026-09-12), and
`/expand` has twice closed a pass with nothing to file. The signal-driven
pipeline has no forward pull left. **Your job is to supply the pull**: a
set of pitches for what comes next across every content surface, ranked,
sequenced, and written so `/oversight` can promote them straight into
`plan/steps/01_build_plan.md`.

Work mode:

- **Pitch, do not ship.** Zero code, zero content edits. The deliverables
  are two markdown files (§8) and a PR.
- **Everything means everything.** Cards, keywords/mechanics, enemies,
  maps/continents, events, equipment/signatures, NPCs/story, art, run
  structure, and the UI surfaces new content needs. Every lane in §4 gets
  at least one pitch; the best pitches cross lanes.
- **Bold, in register.** THE OPEN GATE ¶8 (`plan/bearings.md`) makes
  content growth a standing mandate: *"The game is too small"* is a
  permanent open finding. Pitch at the scale of the 2026-09-02 rewrite,
  not at the scale of a tuning pass. The tonal North Star is Mörk Borg
  by way of the Profane Canon (`plan/north-star-mork-borg.md`, spec 34
  §2.5): doom-liturgical, terse, cruel, funny in the dark. Pitch names
  should read like *the Black Cap*, *Communion of the Worm*.
- **Grounded, not imagined.** Every count you cite is re-derived from the
  live tree at session time (§3 is a snapshot, not truth). Every prior-art
  claim carries a `kb:<game-slug>/<doc> (src-NNN)` receipt from the
  `kb-query` MCP, or is labelled UNGROUNDED if the corpus is down.
- **Questions.** Attended session: exactly ONE `AskUserQuestion` batch
  (≤4 questions, recommended option first, per `docs/asking-well.md`) at
  the §6 Step 4 checkpoint, never earlier, never a second one. Unattended
  session: no questions; decide, and tag each owner-flavoured call
  `[loop-call]` in §8's file so `/oversight` can review it.

---

## 1. Standing constraints (decided — read, obey, move on)

1. **The keep-list** (THE LONGER LEASH + LOCKED MECHANICS,
   `plan/bearings.md`): the deckbuilding core, the Dice system
   (upgradeable model), Conviction + signature skills, the Surge meter,
   and the 5-slot equipment system **stay**. Pitches may feed, spend,
   bend, and extend them. A pitch that removes, no-ops, or routes around
   one needs overwhelming design evidence and a `[loop-call]` tag.
2. **The three surviving combat constraints** (big-numbers prompt §2):
   preset decks split into exact aspect thirds; every card has a FREE
   line; one tray roll per threat phase. Everything else about cards,
   enemies, pricing, and curves is open.
3. **Non-goals** (`spec.md` § Non-goals): no servers/databases in
   mechanics; no npm-publish loop; no auto-deploy from `main`; no return
   of the two-track combat win model; no governing objective function or
   win-rate curve. ADR-0005's "new continents deferred" is already
   superseded by THE OPEN GATE ¶8 and Phases W1–W6; do not cite it as a
   blocker.
4. **Engineering rails** are not design space: hermetic deterministic
   engine, seeded RNG, tests alongside code, `GAME_STATE_VERSION`
   migration discipline, the verify + deploy gates, the `@mechanics`
   alias contract, canon copy (VITAE / STANCE), truthful art provenance.
5. **Retired vocabulary** is enforced by `scripts/check-lexicon.mjs`
   against `axiomancer-mechanics/docs/lexicon.json`. `plan/` is a zoned
   path (not scanned), but pitches that will become phase briefs should
   not lean on retired terms or the philosophy-era theming.
6. **No emojis, no `Co-Authored-By:` trailers** (AGENTS.md standing
   rule 2). Commit messages inline with `-m`, never `-F`.

---

## 2. Read first (in this order; budget one focused pass each)

| # | File | Why |
|---|---|---|
| 1 | `plan/bearings.md` § "Decisions standing for the autonomous loop" | THE OPEN GATE, THE PIPELINE LIBERATION, THE LONGER LEASH, LOCKED MECHANICS — the authority you pitch under |
| 2 | `plan/steps/01_build_plan.md` "Status (at-a-glance)" | What shipped, what is `[-]` partial, the next free phase number (79 numeric, W7 in the world series at time of writing — re-check) |
| 3 | `spec.md` § Scope + Non-goals | The product as declared |
| 4 | `plan/2026-09-02-big-numbers-overhaul.decisions.md` §THE PATH, §"The late campaign is still too hard", §"Known gaps" | The six progression axes, the 4% late-campaign cliff, and the three design-level fixes the pass explicitly declined |
| 5 | `plan/CONTENT_LEDGER.md` | The zero-CREATE plateau across all five per-item categories |
| 6 | `plan/PHASE_CANDIDATES.md` § Pending + § Considered | Already-filed ideas — extend them or leave them, never re-pitch them unchanged (§7) |
| 7 | `plan/AUDIT.md`, grep `loop-call` and `needs-user-call` | Open owner-flavoured calls: mid/late equipment gap, three empty accessory kinds, 19 orphaned `zoneHas` hooks, W3/W5 art decisions, thin NPC staging |
| 8 | `plan/labyrinth/ROADMAP.md`, `DESIGN.md`, `acts/*.md`; `axiomancer-mechanics/specs/world/W-01-aporia-labyrinth-continent.md` | A fully designed, validator-proven, unshipped continent (~47 rooms, 3 acts, ~1/3 of the game) |
| 9 | `axiomancer-mechanics/specs/characters/C-01-the-sophist.md`, `specs/story/S-0*.md` | The named antagonist and the two shipped story specs |
| 10 | `axiomancer-mechanics/src/Cards/library/*.cards.ts`, `card-upgrades.ts`, `card.removal.ts` | The nine card families; what upgrade/removal machinery already exists |
| 11 | `axiomancer-mobile/state/combat/keywords.ts` (the registry), `axiomancer-mechanics/docs/keyword-atlas.md`, `src/Enemy/enemy-keywords.ts` | The 68-row keyword registry and its atlas; enemy-side keywords |
| 12 | `axiomancer-mechanics/src/Enemy/enemy.library.ts`, `EnemiesByMap` | Roster, per-map natives, boss stages |
| 13 | `axiomancer-mechanics/src/World/Continents/*/maps.ts`, `src/World/MapEvents/content.ts`, `types.ts` | Seven maps, three continents, eleven `MapEventKind`s and their spread |
| 14 | `axiomancer-mechanics/src/Items/relic.library.ts`, `consumable.library.ts`; `SignatureSkillId` in `combat.encounter.types.ts` | 8 signet relics, 22 consumables, 8 signatures — the whole equipment economy |
| 15 | `axiomancer-mechanics/braindump/*.md`, `plan/ideas/`, `plan/tuning/*.md` (skim) | Designs that were started and parked — cheap raw material |
| 16 | `plan/2026-09-12-ui-fresh-eyes.prompt.md` §7 report pointer | The six `[needs-user-call]` product decisions the UI sweep left behind |

Use `axio-query` (`axio_overview` / `axio_cards` / `axio_effects` /
`axio_keywords`) as an accelerator; if it reports STALE, run
`npm run catalog:export` or count from source.

---

## 3. The game as it stands (snapshot 2026-09-12 — re-derive before citing)

| Surface | Now | Structural note |
|---|---|---|
| Cards | 123 across 9 families (starters, apocrypha, choir, debt, grave, relics, rot, trial, vigil) | Card power is flat in level; upgrades/removal exist as machinery but are not yet a visible campaign axis |
| Keywords | 68 registry rows (player + enemy side) | Several rows have 1–2 carriers; AMBUSH/FINALE/CHAIN/OMEN were backfilled by `adjust-cards` |
| Enemies | ~95 entries, bosses with staged decks | The Capital reuses roster entries; no map beyond W6 has natives |
| Maps | 7: fishing village, northern forest, caverns, northern city, connecting river, town across the river, the Capital | Three continents (coastal, forest, northern). The Capital has **no door onward** |
| Events | 11 `MapEventKind`s; spread led by interaction/cutscene (28 each), blacksmith at 2 | No event kind has been added since `travel` (W1) |
| Equipment | 8 signet relics 1:1 with 8 signatures; 22 consumables | head / hands / feet accessory kinds have zero relics; no mid/late progression |
| NPCs / story | dialogue trees per map; C-01 the Sophist, S-01/S-02 specs | Three of four northern maps carry one staged NPC each |
| Progression | THE PATH's six axes (staged decks, removal, upgrades, die hones, act-reward dice, items → signatures) | Axes 4–5 only reach the harness bands; late campaign measured 4% before D31a, 84% after — neither is a designed curve |
| Unshipped design | The Aporia labyrinth continent (3 acts, ~47 rooms, validator-proven) | The single largest authored-but-unbuilt asset in the repo |

---

## 4. Lanes (every lane gets ≥1 pitch; tentpoles span 3+)

1. **Cards** — new families or archetypes with an identity, not "+N
   cards"; the upgrade/removal axes as player-visible content; cards that
   scale with level or campaign state (the declined fix #1 from the
   late-campaign section); alt-win families.
2. **Keywords and mechanics** — new engine verbs; keyword families with
   payoff conditions; interactions with the keep-list (feed Conviction,
   steer Surge, bend the tray); the `reprisal`-style late answer.
3. **Enemies** — capital-native and per-map rosters; boss shapes that
   change mid-fight; enemy keyword growth; tiered enemy decks that
   escalate across acts; named antagonists as encounters (the Sophist).
4. **Maps and continents** — the door out of the Capital; the Aporia
   (labyrinth) continent as shipped phases; the last continent; map
   shapes that are not linear; per-continent hazard identity.
5. **Events** — new `MapEventKind`s; multi-node event chains; events that
   read alignment/faction/debt state; rebalancing the 28/28/2 spread.
6. **Equipment and signatures** — relics for head/hands/feet; a 9th+
   signature; mid/late relic tiers; consumables that matter in combat.
7. **NPCs and story** — staging depth on thin maps; the Sophist arc
   across continents; quests with stakes in THE OATHS (creed / augury /
   troth); companions or allies (`cards.allies.ts` exists).
8. **Art and presentation** — the arena backdrop per settlement; enemy
   portraits for new natives; a codex/glossary surface that new content
   will need (a filed candidate — extend, do not repeat).
9. **Run structure and difficulty** — acts, act-reward dice as a choice
   screen, a designed late-campaign curve, the "impossible" tier's
   purpose, run-end and memoir consequences.

---

## 5. Pitch format (strict — one block per pitch)

```markdown
### P-NN · <Name in register>
- **Hook:** one sentence a player would repeat to a friend.
- **Lanes:** <primary> (+ <secondary>…)
- **The fantasy:** what the player sees, chooses, and feels. 3–5 lines.
- **What it touches:** systems and files (engine modules, libraries, mobile routes). Name the barrel/contract changes.
- **Prior art:** `kb:<slug>/<doc> (src-NNN)` × 1–3, one line each on what to steal and what players disliked. UNGROUNDED if the KB is unreachable.
- **Why now:** the signal — a ledger plateau row, an AUDIT loop-call, the difficulty cliff, a dead-end map, a spec with no phase. Cite the file and line or section.
- **Depends on / unblocks:** other pitches or shipped phases.
- **Size:** <1 | 2–3 | 4+> phases, and what each phase ships as a playable increment.
- **Keep-list risk:** none | touches <system> — how it feeds rather than displaces it.
- **Kill criteria:** what evidence, mid-build, would make you stop.
- **Done looks like:** 3–5 acceptance bullets a `/ship-a-phase` tick can verify (tests, reachability, gates).
- **Confidence:** 0–100 that this pitch is worth its size. Below 40 goes to §8 "Considered and cut".
```

---

## 6. Method (do it in this order)

**Step 1 — Ground.** Read §2. Re-derive §3's counts. Write the ten-line
"state of the game" that opens §8's pitch file. Run
`npm run baseline:check`; if you cite any win rate, name the stamp.

**Step 2 — Diverge (target 30+ raw pitches).** Fan out in parallel:

- `card-expert` — lanes 1, 2, 6: card families, keyword verbs, signature
  and relic growth. Ask for pricing arithmetic at the §5 scale ladder.
- `mechanics-expert` — lanes 2, 9: engine verbs, the late-campaign fixes
  as designed systems, keep-list interaction analysis. Analysis only.
- `content-curator` — lanes 7, 5: story arcs, staging, event chains in
  the house voice; the Sophist across continents.
- `scout` or direct `kb-query` — lanes 3, 4, 5, 9: how the corpus games
  structure acts, non-linear maps, escalating enemy tiers, late-game
  answers; harvest better-if complaints that this game plausibly shares.
- You — lanes 4 and 8, plus the Aporia read: is the labyrinth a 3-phase
  build, a 6-phase build, or a different game bolted on?

Every raw pitch gets the §5 block, even if terse. Seed the divergence
with §9's provocations; do not stop at them.

**Step 3 — Score.** Rubric, 0–3 each, sum out of 18:

| Axis | 3 means |
|---|---|
| Player-visible delta | A first-time player would notice it in one session |
| Uses what exists | Rides shipped machinery (upgrades, allies, `travel`, staged decks) rather than inventing a parallel one |
| Opens doors | Later pitches become cheaper because of it |
| THE PATH | Makes one of the six axes a real, visible choice |
| Register | Reads as Mörk Borg / Profane Canon without a rewrite |
| Cost honesty | Size estimate survives a look at the cross-package checklist (`AGENTS.md`) |

Keep 10–14. Everything else is one line under "Considered and cut" with
its score and the axis that sank it.

**Step 4 — Checkpoint (attended sessions only).** One `AskUserQuestion`
batch: which tentpoles (Step 5) resonate, which lane the owner wants
weighted, whether the Aporia is in the next ladder or after it, and any
pitch the owner vetoes outright. Recommended answers first. Unattended:
skip, decide, tag `[loop-call]`.

**Step 5 — Converge into tentpoles.** Group the survivors into 3–4
arcs, each with a name, a one-paragraph thesis, and the pitches it
contains. A tentpole should be pitchable as "the next month of the
loop". Cross-lane by construction.

**Step 6 — The phase ladder.** Sequence the surviving pitches into
build-plan rows, dependency-ordered, in the exact format of
`plan/steps/01_build_plan.md` (`- [ ] Phase <N> — <title>: <scope>
(<package>; <risk>)`). Continue the numeric series from the next free
number and the world series from W7. Each row is one shippable
`/ship-a-phase` tick that leaves `main` green and playable. Mark rows
that need a design session first with `(attended design session)`.
State, per row, which `adjust-*` steward or `/forge` lane inherits the
follow-through once the phase lands.

**Step 7 — Write, verify, ship the PR** (§8, §10).

---

## 7. Do not

- Do not re-pitch a `plan/PHASE_CANDIDATES.md` Pending row unchanged.
  Extend it (new scope, new evidence, new sequencing) or cite it as a
  dependency. The known ones: the Capital's missing door, the arena
  backdrop, the glossary surface, the naming pass, the three empty
  accessory kinds, the late-campaign cliff, the `zoneHas` sweep, the
  early-encounter smoothing.
- Do not pitch tuning. Numbers are `/deck-tuning`, `/combat-playtest`,
  `/world-tuning`, `/hazard-tuning` work. Pitch the system, name the
  loop that will tune it.
- Do not pitch what a steward does on its own cadence ("add three
  enemies") unless the pitch changes the steward's shape (a new native
  roster per continent is a pitch; three more enemies is a tick).
- Do not resurrect retired things: Pressure Tracks, the objective
  function, rank bands, philosophy theming, the status-primacy doctrine,
  small numbers.
- Do not pitch below the keep-list: nothing that makes dice, Conviction,
  Surge, signatures, or the 5-slot loadout irrelevant.
- Do not write code, edit content, regenerate baselines, or touch
  `plan/steps/01_build_plan.md` / `plan/PHASE_CANDIDATES.md` directly.
  Promotion is `/oversight`'s job; you hand it a ladder.
- Do not exceed one question batch. Do not ask in unattended runs.

---

## 8. Output contract

Two files, one branch, one PR.

**A. `plan/<ISO date>-content-pitches.md`**

```
# Content pitches — <ISO date>
> Session provenance: this prompt, commit <sha>, attended | unattended,
> KB reachable yes | no, baseline stamp <sha · date · confidence>.

## 1. The state of the game (ten lines, re-derived)
## 2. Tentpoles (3–4; name, thesis, member pitches)
## 3. Pitches (10–14, §5 blocks, grouped by tentpole, P-01…)
## 4. The proposed phase ladder (build-plan rows, dependency-ordered)
## 5. Considered and cut (one line each: name · score/18 · sinking axis)
## 6. Decisions taken ([loop-call] rows) and questions asked (with answers)
## 7. Hand-off: which steward / lane owns each tentpole after promotion
```

**B. `plan/PHASE_CANDIDATES.md`** is NOT edited by this session. Instead
append one pointer paragraph to the top of the pitch file's §4 telling
`/oversight` how to promote: copy rows verbatim into the build plan's
"Next up" block, tick provenance to this file.

**Branch and PR.** Work on the branch the session was opened with (or
`claude/content-pitches-<date>`). Commit message:
`plan: content pitch session <date> — <K> pitches, <M> tentpoles,
<R>-row ladder`. Plain body, no trailers. Open the PR against `main`
using `.github/PULL_REQUEST_TEMPLATE.md` (Change Type: Documentation /
design; Affected: Root / tooling). Subscribe to its activity.

---

## 9. Provocations (seeds for Step 2 — questions, not decisions)

1. The Capital is a dead end. What is on the other side of its door, and
   is it the Aporia, a fourth conventional continent, or the sea?
2. The Aporia is ~47 rooms of validated design with zero engine support
   for non-linear traversal, riddles, or an accordion room reader. What
   is the smallest playable slice (one act? one colonnade?) and what
   engine primitive does it need first?
3. THE PATH has six axes. Which of them does the player currently
   *choose* on a screen, versus which happen to them? Card removal and
   act-reward dice look like screens that do not exist yet.
4. Cards are flat in level and the late campaign is either 4% or 84%
   depending on which dice bug was fixed. What does a *designed* late
   curve look like: level-scaling cards, a late answer verb, flattened
   enemy VITAE growth, or acts with their own card pools?
5. Eleven event kinds, two blacksmith nodes, zero event chains. What
   would an event that remembers you look like, and which kinds should
   read THE OATHS, faction reputation, or debt?
6. Eight relics, eight signatures, three empty accessory kinds. Is the
   fix a ninth signature, relic tiers, or breaking the 1:1 identity rule
   for stat-only pieces? (`plan/AUDIT.md` 2026-09-04 loop-call.)
7. The Sophist has a character spec and a finale that needs the Aporia.
   Where does the player meet them first, and what do they cost?
8. Every enemy fights alone. `cards.allies.ts` exists. Is there a pitch
   in company on either side of the board?
9. Sixty-eight keywords. Which ten would a Dawncaster player name after
   one run, and which twenty could vanish unnoticed? Pitch the keyword
   families that make the rest legible.
10. Seven maps share one combat arena image. What does per-continent
    combat identity look like beyond the backdrop: hazards, enemy
    natives, event kinds, a signature verb per continent?
11. The memoir records deaths and keepsakes. What would make a *second*
    run different from the first without a meta-progression layer the
    spec never asked for?
12. The impossible tier is 0% by design. Is it a wall, a puzzle, or a
    story beat, and does it deserve content of its own?

---

## 10. Acceptance criteria (what "done" means for this session)

- [ ] Every §4 lane has ≥1 surviving pitch; ≥3 tentpoles span 3+ lanes.
- [ ] Every pitch carries the full §5 block; no confidence below 40 in
      §3 of the pitch file; every prior-art line has a `src-NNN` or is
      marked UNGROUNDED.
- [ ] Every "why now" cites a file and section that exists at HEAD.
- [ ] The phase ladder continues the live numbering, is
      dependency-ordered, and every row is one green-and-playable tick.
- [ ] No Pending candidate is re-pitched unchanged (§7).
- [ ] Counts in "state of the game" match a fresh read of the tree; any
      win rate names the baseline stamp.
- [ ] Zero code or content diffs in the PR; exactly one new file under
      `plan/` (plus TELEMETRY.md rows if the hooks wrote any).
- [ ] At most one `AskUserQuestion` batch (attended) or zero (unattended)
      with every owner-flavoured call tagged `[loop-call]`.
- [ ] `node scripts/check-lexicon.mjs <pitch file>` reports no findings
      (zoned or not, keep the briefs promotable).
- [ ] PR opened from the template, activity subscribed, summary states
      the pitch count, tentpole count, and ladder length first.
