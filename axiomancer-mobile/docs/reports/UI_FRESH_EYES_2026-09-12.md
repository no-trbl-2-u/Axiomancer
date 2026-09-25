# UI FRESH-EYES SWEEP — 2026-09-12

> Run against [`plan/archive/2026-09-25-trim-t4/plan/2026-09-12-ui-fresh-eyes.prompt.md`](../../../plan/archive/2026-09-25-trim-t4/plan/2026-09-12-ui-fresh-eyes.prompt.md),
> adjusted for ultracode at the head of the run (commit `7d7565c`).
> Persona, taxonomy, scope walls and gate are that prompt's; what ultracode
> changed is how much ran in parallel and how hard each row was tested.

## 1. Header

| | |
|---|---|
| Commit walked | `7d7565c` (prompt adjustment only; tree otherwise at branch point) |
| Commit shipped | see the sha on each row in §3 |
| Branch | `claude/ui-fresh-eyes-ultracode-3rfiji` |
| Viewports | mobile 375x812 (primary), desktop 1280x800 (secondary) |
| Routes | 27 screens x 2 viewports = 54 captured cells; coverage ledger in `.critique-artifacts-fresh-eyes/coverage.md` |
| Transport | **static preview export** (§3.3.2). Docker was absent (`web:container` failed on a missing `docker.sock`) and `npm run web` could not start before `npm install` (`expo: not found`), so the sweep used `BUILD_PROFILE=preview npx expo export --platform web` served on `127.0.0.1:8081`, driven from the main agent context with the Playwright MCP tools plus a throwaway bulk-capture driver. |
| Console | before: 0 page errors, 6 console errors. After: **0 page errors, 0 console errors** across all 54 cells. |

## 2. Misunderstanding map — the wrong models I formed, in walk order

This is the part worth reading. Each entry is a model I actually formed and the
screen element that produced it.

1. **`/` title — "there is a glowing node on this screen."** The only button
   reads `EMBARK…` with the sub-line *tap a glowing node on the map to begin*.
   That is an instruction for a screen two navigations away. I hunted this
   screen for a node before pressing anything.
2. **`/` title — "LEAGUES is a place."** It is the one capitalised noun in the
   framing copy. It turns out to be a distance unit; the map's compass says
   `scale: leagues` in lowercase. *(Filed, not fixed — §4.)*
3. **`EMBARK` → `/cutscene` — "I skipped character creation."** Genre
   convention puts a preset or starter-deck pick here. The game goes straight
   to an OMEN. It is a deliberate opening, but nothing says the choice is not
   coming.
4. **`/exploration` — "the map failed to load."** The `NODE GRAPH` band above
   the chart is ~145px of empty black with one decorative shape in it.
5. **`/exploration` — "I cannot read the key."** The travel hint plate sat on
   top of the legend at 375 and hid part of `TRODDEN / OPEN / SHUT` and part of
   the node count. **FE-005, fixed.**
6. **`/exploration` — "shut and sealed are two different states."** The legend
   said `SHUT`; the counter on the same strip said `sealed`; the tap-tip said
   *This path is sealed.* **FE-008, fixed.**
7. **`/character` — "my level is 2."** The row read `XP · LVL 2` beside a
   medallion reading `1`, and both cells wrapped into each other in a ~130px
   column. **FE-004, fixed.**
8. **`/character` — "the stat table is broken."** `LUCK · AVG
   7.666666666666667`. **FE-001, fixed.**
9. **`/character` — "SKL has no value."** `ATK SKL DEF` over two columns of
   numbers, none of them aligned to their header. **FE-015, fixed.**
10. **`/character` — "I have two grace resources."** A `GRACE 5 / 10` pool bar
    and, further down the same scroll, `✠ GRACE / 0 / account`. **FE-003,
    fixed** — and the numbers were also *wrong*: **FE-017**, the screen never
    passed `moralMeter` or `philosophicalAlignment` to its presenter, so the
    sheet read 5/10 where the HUD read 6/10 on the same save.
11. **`/inventory` — "three of these tabs are broken."** `PHIALS`, `STUFF` and
    `SEALED` carried no count while `ALL` and `WORN` did. **FE-010, fixed.**
    On the midgame save the one count that did show broke `10` across two
    lines. **FE-018, fixed.**
12. **`/inventory` — "trinkets and accessories are different slots."** The dock
    says `TRINKET I/II/III`; the grid directly below says `SLOT · ACCESSORY`.
    **FE-009, fixed.**
13. **`/combat-encounter` — "the enemy heals 11."** The intent badge printed
    `♥11` — damage it will deal to *me* — while my own rail printed `♥ 160`.
    **FE-020, fixed.**
14. **`/combat-encounter` — "160 is… good? bad?"** The enemy's bar reads
    `120 /120`; mine read a bare `♥ 160`. **FE-016, fixed.**
15. **`/combat-encounter` — "◆ is generic mana."** Every rune on the left rail
    is priced in `◆` and the enemy telegraph offers `+1◆`, but the word
    CONVICTION appears nowhere on the board. **FE-021, fixed.**
16. **`/combat-encounter` — "PLEA is the enemy's shield."** A second
    full-width bar directly under the foe's health bar, in the slot the genre
    reserves for armour, with no stated payoff. **FE-022, fixed.**
17. **`/combat-encounter` — "the telegraph is unreadable."** Two coloured 10pt
    lines drawn straight onto the enemy art. **FE-014, fixed** (they were never
    overlapping each other — measured at 193–206 and 207–220 — the problem was
    the ground, not collision).
18. **`/dialogue` — "the game is showing me its database."** The accept reply
    carried the chip `quest: starting-quest`, and after accepting, the ERRANDS
    journal headlined the entry `starting-quest`. **FE-002, fixed.**
19. **`/dialogue` — "that grey line is a caption."** `TIP YOUR CAP AND GO` is
    the only way out of the conversation and was bare text under two boxed
    replies. `/blacksmith` repeats the pattern. **FE-007, fixed.**
20. **`/dialogue` — "the replies failed to load."** The closing node rendered
    `✠ A RECKONING` over an empty list. **FE-011, fixed.**
21. **everywhere — "every quotation is closing."** World content authored ASCII
    `"`, which this display serif maps to a right curl, so 372 speech marks
    across four content files opened the wrong way — while the app's own copy
    used real typographic quotes and looked right on the same screen.
    **FE-006, fixed.**
22. **HUD — "that bar failed to render."** At `VITAE 1/175` the fill is half a
    pixel and the numerals sit in ordinary parchment. One hit from death looked
    like a bar that had not painted. **FE-019, fixed.**
23. **`/rest` — "I cannot afford it."** `THE CUT — 5 SHILLINGS` greyed with a
    purse of 0, and the small print underneath blaming the deck floor instead.
    *(Filed, not fixed — §4.)*
24. **`/rest`, `/cache` — "I can back out of this."** Neither screen has a
    back control and neither said so: the authored node line replaced the
    warning that says the node is already spent. **FE-026, fixed.**
25. **`/rest` — "how much does resting give me?"** `SLEEP WHERE YOU STAND.
    FREE.` beside a bar reading 20/175 — three statements of the price, none
    of the payoff. **FE-024, fixed.**
26. **`/blacksmith` — "the smith charges Conviction."** Every forge price and
    the purse printed with `◆`, the glyph the combat board spends on
    CONVICTION; the prices are shillings. **FE-023, fixed.**
27. **`/combat-encounter` reveal — "what am I taking this fight with?"** The
    commit gate priced the fight entirely in the foe's numbers. **FE-025,
    fixed.**
28. **`/hazard-deck` — "this is a different game."** Pastel cards on light
    chrome inside an otherwise black gothic app. *(Filed, not fixed — §4.)*

## 3. Fixed

Every row below is fixed, has a guarding test, and was re-verified in a fresh
preview export at both viewports.

| id | sev | kind | route | one line | sha |
|---|---|---|---|---|---|
| FE-001 | major | issue | `/character`, `/combat-encounter` | `LUCK · AVG 7.666666666666667` — an averaged stat printed raw | `8d8a5e4` |
| FE-002 | major | issue | `/dialogue`, `/memoir`, `/event` | engine slugs (`quest: starting-quest`, flag ids) printed to the player; dead `HP` copy against canon VITAE | `1d5e647` |
| FE-003 | major | misunderstanding | `/character` | GRACE printed twice with two different numbers and no stated relationship | `9639754` |
| FE-004 | minor | misunderstanding | `/character` | `XP · LVL 2` beside a medallion reading `1`, both cells wrapping | `0d66713`, `d6cab01` |
| FE-005 | major | issue | `/exploration` | the travel hint plate covered the map legend at 375 | `24fbf80` |
| FE-006 | minor | issue | world content | 372 speech marks opened with a closing curl | `df6e98f` |
| FE-007 | major | issue | `/dialogue`, `/blacksmith` | the walk-away exit read as a caption; ~27px hit target | `8578da9` |
| FE-008 | minor | issue | `/exploration` | legend said SHUT where everything else said sealed | `017c073` |
| FE-009 | minor | issue | `/inventory` | TRINKET in the dock, ACCESSORY in the grid below it | `7ce6455` |
| FE-010 | minor | issue | `/inventory` | an empty filter tab showed no count and read as broken | `0d796f3` |
| FE-011 | minor | issue | `/dialogue` | `A RECKONING` heading over an empty reply list | `d8d7ae9` |
| FE-012 | polish | issue | `/combat-encounter`, `/hazard` | `navigator.vibrate` called before any user gesture — all 6 console errors in the sweep | `379444c` |
| FE-014 | minor | issue | `/combat-encounter` | stance-check telegraph drawn bare on the enemy art | `1ccc124` |
| FE-015 | major | issue | `/character` | DERIVED table: three headers over two unaligned columns | `72889eb` |
| FE-016 | major | issue | `/combat-encounter` | player VITAE printed with no maximum while the enemy's had one | `940687b`, `c9b416c` |
| FE-017 | major | issue | `/character` | the screen never passed `moralMeter`/`philosophicalAlignment`, so grace and alignment were permanently stubbed | `5fc6444` |
| FE-018 | minor | issue | `/inventory` | a two-digit tab count broke across two lines | `583ea99` |
| FE-019 | major | issue | HUD | a nearly-spent VITAE bar had no alarm state | `1f166a9` |
| FE-020 | major | misunderstanding | `/combat-encounter` | the enemy's outgoing damage wore a heart glyph | `62b3198` |
| FE-021 | major | misunderstanding | `/combat-encounter` | the board's whole economy (`◆`) was never named | `969c523` |
| FE-022 | major | misunderstanding | `/combat-encounter` | alt-win meters never said what filling them does | `7782e90` |
| FE-023 | major | misunderstanding | `/blacksmith` | the forge priced shillings with the combat board's conviction glyph | `ff95b12` |
| FE-024 | major | issue | `/rest` | REST never said how much VITAE it restores | `856ffaa` |
| FE-025 | major | issue | `/combat-encounter` | the pre-fight commit gate showed the foe's VITAE and none of mine | `4bd389a` |
| FE-026 | major | issue | `/rest`, `/cache` | the one-way warning was dropped on every authored node | `de762de` |
| FE-027 | minor | misunderstanding | `/inventory` | the dock hint promised a comparison that is behind a tap | `1485dca` |
| FE-028 | major | issue | `/village` | the unselected SELL tab wore the app's disabled treatment | `2aeadf1` |

**Totals (fixed):** 27 rows — 17 major, 9 minor, 1 polish; 7 misunderstandings,
20 issues. Before/after captures: `.critique-artifacts-fresh-eyes/{before,after}/<viewport>/NN-<screen>.png`.

## 4. Deferred and refuted

### Refuted — killed by verification, listed because a sweep that refutes
nothing verified nothing

| candidate | lens that killed it | why |
|---|---|---|
| "a player-facing SELF tab links to the DEV TOOLS route" (raised at confidence 100) | source | `DevToolsLink` returns `null` when `isDevToolsEnabled()` is false. The link is visible only because this sweep's transport is a `BUILD_PROFILE=preview` export, which bakes dev tools **on**. A transport artifact, not a defect. |
| "the two telegraph lines overlap each other" (my own walk note) | evidence | Measured: `Punishes…` occupies y 193–206 and `Yields to…` y 207–220 at both viewports. They stack cleanly. The real defect was contrast against the art — refiled and fixed as FE-014. |
| "hand-card titles are clipped" (my own walk note) | source | The fan deliberately shows "name-start + FREE effect" per the card-face doctrine in `CombatBoard.tsx` (owner directive 2026-08-10). Changing it would re-litigate an owner decision, not fix a defect. Recorded as a deferred design question below. |
| "`NUMBER ]]` on the hazard deck" (raised at confidence 90) | evidence | The DOM says `NUMBER` / `11`, and 11 + 11 = the 22 cards the same screen counts. A display-font numeral read, not a broken string. |
| "the memoir shows no errand after accepting one" (my own walk note) | evidence | Reproduced only when navigating by URL, which reloads the fixture and discards the accepted quest. In-app tab navigation shows the errand correctly. Driver artifact. |
| "the smith takes payment before naming a price" (raised at confidence 90) | source | `SET THEM ON THE ANVIL` is a free doorway — it opens the forge, where the purse and every price are shown before anything is bought. The weaker true statement (the intro says "Costs, of course." and shows no purse) is an enhancement, not a defect. The real defect on that screen was the currency glyph — refiled and fixed as FE-023. |

### Deferred `[needs-user-call]`

Each names the decision and the recommended option first.

1. **The fanned hand hides every card's ledger but the last one.** Measured at
   1280: card 1's keyword cell spans x 459–490 and card 2 begins at x 471, so
   the cell is entirely covered; the same holds for cards 2 and 3.
   *Decision:* keep the reference fan as authored (recommended — it is an
   explicit owner directive and the inspect modal carries the full face), or
   move the ledger's PAID cell to the card's visible left edge.
2. **The left signet rail is five unnamed glyphs.** Their names and costs exist
   only in `accessibilityLabel`; long-press opens an info popup.
   *Decision:* leave the rail compact and teach it through the primer
   (recommended), or surface names on first availability.
3. **`/rest` greys an option for two possible reasons.** With a purse of 0 and
   a 5-shilling cost, the disabled reason printed is the deck floor.
   *Decision:* print the binding reason on the row (recommended), or show both.
4. **`/hazard-deck` uses a light pastel visual language** inside an otherwise
   black gothic app. *Decision:* deliberate (recommended, if the hazard deck is
   meant to read as a separate object), or bring it into the AXM palette.
5. **`LEAGUES` is a proper noun on the title screen and a unit on the map.**
   *Decision:* lowercase it in the title copy (recommended), or make it a real
   place name the map also uses.
6. **The opening art carries its source plate's baked-in caption** (a Doré
   engraving's original text), visible behind `/cutscene`, `/dialogue`,
   `/village` and `/blacksmith`. *Decision:* crop the plates above the caption
   (recommended), or accept it as texture.

## 5. Still open — the candidate set this sweep did not reach

The Observe fleet finished: **16 of 16 agents, 0 errors, 309 candidate rows**
(100 major, 165 minor, 44 polish) over ~1h54m of agent time. String-keyed dedup
collapsed almost none of them, because independent agents word the same finding
differently — the true unique count is lower and needs a semantic pass, not a
string key. Where several rows describe one thing, the repetition is itself
signal: the fan's clipped card ledger was raised by four separate lenses, one
at confidence 100. Twenty-seven rows are fixed above; the rest are filed, not
fixed.

The full table is in [`UI_FRESH_EYES_2026-09-12.candidates.md`](./UI_FRESH_EYES_2026-09-12.candidates.md),
sorted by severity with each row's confidence and suspected source. Strongest
recurring themes, each raised independently by three or more lenses:

- **One concept, several words.** currency (`SHILLING` / `PURSE` / `WALLET` /
  `12s`), the journal (`THE LEDGER` tab over a `THE BOOK OF DEEDS` page),
  `SEALED` (inventory tab, map state, no-retreat lock), `SURGE` (enemy phase,
  hazard keyword, momentum chain), and "the deck" when the run carries two.
- **Glyphs with no key.** `◆`, `⛨4`, `☾`, `🜲`, the four dice colours, the
  status tray's dotted rings.
- **Meters with no unit and no goal.** `PLEA` and `CHARGE` are fixed above;
  `PHASE 1/5 · R1 · T1`, `BURDEN · STONE`, `ACQUIRED` and `SCARS` are not.
- **Definitions that exist but are unreachable** — the hazard deck's fourteen
  keyword chips render in a plain `View` with no tooltip target.

## 6. Before / after

Per-finding pairs, both viewports:

| finding | before | after |
|---|---|---|
| FE-001, FE-003, FE-004, FE-015, FE-017 | `before/<vp>/05-character-fresh.png`, `before/<vp>/06-character-midgame.png` | `after/<vp>/05-character-fresh.png`, `after/<vp>/06-character-midgame.png` |
| FE-002 | `before/<vp>/13-dialogue.png` | `after/<vp>/13-dialogue.png` |
| FE-005, FE-008 | `before/<vp>/04-exploration-midgame.png` | `after/<vp>/04-exploration-midgame.png` |
| FE-006 | `before/<vp>/13-dialogue.png`, `before/<vp>/19-blacksmith.png` | `after/<vp>/13-dialogue.png`, `after/<vp>/19-blacksmith.png` |
| FE-007 | `before/<vp>/13-dialogue.png`, `before/<vp>/19-blacksmith.png` | same paths under `after/` |
| FE-009, FE-010, FE-018 | `before/<vp>/07-inventory-fresh.png`, `before/<vp>/08-inventory-midgame.png` | same paths under `after/` |
| FE-011 | `before/<vp>/13-dialogue.png` | `after/<vp>/13-dialogue.png` |
| FE-012, FE-014, FE-016, FE-020, FE-021, FE-022 | `before/<vp>/12-combat-board.png` | `after/<vp>/12-combat-board.png` |
| FE-019 | `before/<vp>/17-rest-broke.png` | `after/<vp>/17-rest-broke.png` |
| FE-023 | `before/<vp>/19-blacksmith.png` | `after/<vp>/19-blacksmith.png` |
| FE-024, FE-026 | `before/<vp>/16-rest.png`, `before/<vp>/18-cache.png` | `after/<vp>/16-rest.png`, `after/<vp>/18-cache.png` |
| FE-025 | `before/<vp>/11-combat-preview.png` | `after/<vp>/11-combat-preview.png` |
| FE-027 | `before/<vp>/07-inventory-fresh.png` | `after/<vp>/07-inventory-fresh.png` |
| FE-028 | `before/<vp>/14-village.png` | `after/<vp>/14-village.png` |

Root: `axiomancer-mobile/.critique-artifacts-fresh-eyes/` (gitignored).
`before/` was regenerated from the walked commit `7d7565c` after the original
set was destroyed mid-sweep — see §7.

## 7. Ultracode provenance, and what was dropped

- **Workflow run** `wf_41a17e82-256` — `ui-fresh-eyes-observe`. Eight lenses
  (vocabulary, iconography, affordance, layout, information-scent, flow,
  console, consistency) x two viewports = 16 agents in round 1. Each agent read
  the captured evidence only — never `plan/CRITIQUE.md`, `plan/AUDIT.md` or
  `docs/reports/` — so freshness survived the fan-out.
- **Observe was capped at one round, not run to dry.** This container has 4
  CPUs, so the workflow concurrency cap is 2; the 16 agents took 1h54m of
  wall time (2.65M subagent tokens, 1330 tool calls) and three rounds would
  have taken most of a day. The loop-until-dry rule in the adjusted prompt §10
  was therefore **not satisfied** — a deliberate, logged cap, not a silent one.
  All 16 agents completed with 0 errors and 0 empty results.
- **The three-lens adversarial verify panel (§4.1) did not run as a workflow.**
  With 309 candidates and 2-way concurrency it was not reachable in this
  sitting. Verification was done instead by the main agent, per row, before
  each fix: source read, DOM measurement in the live build, and a re-export
  screenshot. Six candidates were refuted this way (§4) — including one at
  confidence 100 that was a transport artifact. Rows in §5 carry **no**
  verification and must not be treated as confirmed.
- **The fix fleet (§5.1) did not run either**, for the same reason: with two
  slots saturated by Observe, parallel fix agents would have queued behind it.
  All 21 fixes were made in the main agent context, serially, one commit each.
- **`npm run critique:drive` deleted the sweep's own evidence.** It clears
  `.critique-artifacts/` wholesale on start (`critique-drive.mjs:318`), which
  destroyed a complete before/after set mid-run. Both sets were rebuilt — the
  `before` set by checking the walked sources back out, re-exporting and
  re-capturing — and the capture driver now writes to
  `.critique-artifacts-fresh-eyes/` instead. Worth knowing before the next
  sweep shares that directory.
- **The guard hook fired once**, on a commit message containing an emoji
  quoted from the UI (the PLEA meter's dove). Rewritten without it. Recorded
  here per `guard.mjs`'s own instruction that a mid-run block is itself a
  finding.
- **Coverage gaps.** `broke-l1-fv-rest` does not arrive at `/rest` — it stays
  on `/exploration` (the fixture has no `arrive`), so the empty-wallet rest
  screen was reached through `apprentice-fv-rest`, which also has a purse of 0.
  `fresh-start` on `/exploration` lands on `/cutscene` first; that is the
  authored opening, not a defect. `/labyrinth` was reached only by URL — no
  entrance to it was found from `/exploration`. Every other route in §3.2 was
  walked at both viewports.

## 8. Gate

Run in the foreground at the final commit:

| check | result |
|---|---|
| `npm run verify` (all three packages) | green — mechanics 212 test files, mobile 268 suites / 2718 tests, card-editor build |
| `npm run e2e:fixture` | green — all three cold-boot cases |
| `npm run lint:content` | green — 14 content surfaces, 206 shipped ids |
| `CRITIQUE_VIEWPORT=both npm run critique:drive` | green — 22 captures, **0 page errors, 0 console errors** |
| AGENTS.md cross-package checklist (FE-006 touches `World/**`) | run in full — mobile verify green, card-editor type-check green |
