# THE REVAMP — main build plan

> [!NOTE]
> ## STATUS: RATIFIED 2026-09-28 (D64)
>
> T ratified this plan on 2026-09-28, after ruling every open call
> (decisions **D46–D64** in `plan/2026-09-25-refactor-strategy.decisions.md`).
> The R-rows and B4 in `plan/steps/01_build_plan.md` are unblocked, in the
> order of §7; owner-led B-rows stay `[blocked: owner-led]` — the loop never
> starts them. `/march` and `night` stay **disabled** until Phase R0
> (attended) merges; then `gh workflow enable march night`.
>
> **The card part is NOT decided.** THE CARD HOLD (D37) still applies, and
> T has not picked among the three keyword/card process plans (A, B, C) —
> see [cards.md](cards.md). Until T picks one, any agent discussing card
> work **recommends that T open `plan/2026-09-27-keyword-card-revamp.summary.html`** (one tab per plan, with a
> working-backwards verdict) to choose.

## 1. What this is

The revamp resets Miserere Mei, Deus to a small, honest core and rebuilds
from there in owner-led sessions. This folder is the map of both halves:

- **Reset (R-phases)** — delete or park everything the core does not use.
  Loop-shippable once ratified, one phase per PR, main green between them.
- **Rebuild (B-phases)** — T's guided sessions. The loop never starts one
  (D37, D58).

Each major part has its own plan file. This README orders them.

## 2. What "zero" is — the core that survives the reset

| Layer | After the reset |
|---|---|
| Player cards | The grey office: A Plain Blow (DEAL), A Plain Ward (GUARD), A Plain Word (VULNERABLE). Card types **Attack / Skill / Spell** (D51) |
| Player keywords | DEAL, GUARD, VULNERABLE — plus whatever the befriend path prints |
| Combat engine | Tray dice, one roll per threat phase, FREE/PAID lines, reads, VITAE, Conviction, S3 stat scaling (`base × stat ÷ 5`) |
| Relics | 11 signet relics keep their names and signatures; every signature is **GUARD 5 at a flat cost**, except the Suppliant's Ring's **The Open Hand = befriend** (D47) |
| Enemies | **Float-Eye** (normal fights), **Brine Hag** (rarer mid-region elite), **The Doorwarden** (every region's door fight) — no keywords, no afflictions; the 11 enemy-keyword systems are deleted (D48, D61) |
| Mercy | Befriend → mercy choice, entered only through The Open Hand (D47) |
| World | Act 1 only: Breakwater → Charcoal Wood → Beacon Crags → Lantern Deep. Fishing-village is purged; the other continents and the Labyrinth are parked; the Lantern Deep's deep stair is sealed; one Anvil per region near its exit (D53, D54, D61) |
| Items | Healing potions (D49); relics |
| Rewards | Post-fight card reward from the grey pool (D44); no theme/keyword steering (D50) |
| Hazards | A minimal set, pending T's redesign (D52) |
| Progression | Levels + S3 stats; XP retuned after the resets (D55); card upgrades (D8) and die growth (D20) stay parked |

Everything else is either deleted (git history is the archive, D50) or
parked unreachable with a plan file saying how it comes back.

## 3. Part plans

| File | Part | Phases |
|---|---|---|
| [loop.md](loop.md) | Skills, commands, agents, hooks, workflows, plan hygiene | R0 |
| [tooling.md](tooling.md) | Card editor, baseline, DevLog, orphan scripts | R1 |
| [enemies.md](enemies.md) | Roster reset, keywords, afflictions; the four-tier revamp | R2, B2 |
| [world.md](world.md) | Act 1 only, fishing-village purge, quests, dialogue | R3 |
| [labyrinth.md](labyrinth.md) | Seal the door, park the module, later re-theme | R3 (door), B9 |
| [relics.md](relics.md) | GUARD 5 placeholders, The Open Hand befriend, the relic pass | R4, B1 |
| [items.md](items.md) | Consumables → healing potions, shops, caches | R5 |
| [hazards.md](hazards.md) | Minimal hazard set; T's mechanics redesign | R6, B3 |
| [engine.md](engine.md) | The 47 dead mechanic kinds, card types, reward logic, alt-wins | R7 |
| [mobile.md](mobile.md) | App cleanup, card art mapping, app name, theme colours; Deck tab, art and dev-menu revamps | R8, R10, B7, B8, B10 |
| [progression.md](progression.md) | XP / level retune | R9 |
| [cards.md](cards.md) | Card-rules inventory, card-creator workflow, card sessions | B4, B5, B6 |

## 4. Build order

`[loop]` = the loop may ship it once ratified. `[attended]` = shipped in a
session with T present. `[owner]` = T's guided session; the loop never
starts it.

| # | Phase | Tag | Requires | Plan |
|---|---|---|---|---|
| R0 | Loop doctrine reset: archive the stewards and design skills, fix every verb's doctrine, fix ci-autofix, telemetry, plan hygiene | attended | — | loop.md |
| R1 | Tooling reset: delete the card editor, retire the baseline, archive the tuning-lab pages, catalog shows live content only | loop | R0 | tooling.md |
| R2 | Enemy reset: 79 → 3 foes, every enemy keyword and affliction stripped, dead riders and curse code deleted | loop | R0 | enemies.md |
| R3 | World reset: Act 1 only, fishing-village purged, other continents parked, Labyrinth door and deep stair sealed, encounters re-pointed, one Anvil per region | loop | R2 | world.md, labyrinth.md |
| R4 | Relic placeholders: 10 signatures → GUARD 5 flat cost; The Open Hand becomes a real befriend | loop | R2 | relics.md |
| R5 | Items reset: healing potions only, save migration, shops/caches/loot re-pointed | loop | R3 | items.md |
| R6 | Hazard reset: minimal hazard deck | loop | R0 | hazards.md |
| R7 | Engine purge: dead mechanic kinds, card types → Attack/Skill/Spell, reward steering logic, alt-win systems, carrier-less keywords | loop | R2, R4, R6 | engine.md |
| R8 | Mobile cleanup: dead flows and glosses, grey card art, app label, VITAE/shillings copy | loop | R7 | mobile.md |
| R9 | Progression retune: XP curve for Act 1 on the 3 survivors | loop | R3, R7 | progression.md |
| R10 | Theme colours: move surviving hard-coded hex colours into named `theme/axm.ts` tokens (no visual change) | loop | R8 | mobile.md |
| B1 | The relic pass: new relics and real signatures | owner | R4 | relics.md |
| B2 | Enemy revamp: four tiers (normal, elite, region boss, **act boss**), roster regrowth, keywords with counters | owner | R9 | enemies.md |
| B3 | Hazard mechanics redesign | owner | R6 | hazards.md |
| B4 | Card-rules inventory (the gate before any card work) | loop | R7 | cards.md |
| B5 | Card-creator workflow (successor to the card editor) | owner | B4 | cards.md |
| B6 | Card sessions (pick a plan from the keyword/card revamp plans) | owner | B4, B5 | cards.md |
| B7 | Deck tab UI revamp | owner | R8 | mobile.md |
| B8 | Card art revamp (incl. the title wordmark) | owner | R8 | mobile.md |
| B9 | Labyrinth re-theme | owner | B2 | labyrinth.md |
| B10 | Dev menu revamp (the reset leaves the dev menu alone except for compile fixes) | owner | R8 | mobile.md |

B4 is the one rebuild phase the loop may run: it writes an inventory and
creates nothing.

## 5. Reset rules (every R-phase)

1. **Delete, don't park, unless the part plan says park.** Git history is
   the archive for source (D50). Markdown moves to `plan/archive/`.
2. **Tests go with their subjects.** A test pinned to a deleted thing is
   deleted or rewritten to the survivors. Never weaken a test to keep a
   deleted thing alive.
3. **Carrier rule (D45) runs last in each phase.** After a phase removes a
   carrier, remove every glossary/atlas row, glyph, gloss and editor word
   left without one.
4. **Save compatibility.** Anything removed from a player's save (items,
   relics, flags, map positions) ships with a migration in
   `Game/game.migrate.ts` and a test.
5. **Gates:** mechanics `verify`, mobile `verify`, root `npm test`,
   `lint:content`, `check-lexicon`. `baseline:check` is retired (D57).
6. **No content creation.** An R-phase re-points and deletes. It never
   authors a card, keyword, enemy, relic, map, NPC, event or art (D58).

## 6. Open calls — resolved 2026-09-28 (D61–D63)

T walked the agent defaults one at a time the same day. None remain open.

| # | Call | Ruling |
|---|---|---|
| 1 | Where the survivors stand | **The Doorwarden on every region's door fight** (a region-boss preview; overturns D30 everywhere); Brine Hag as a rarer mid-region fight; Float-Eye on normal fights (D61) |
| 2 | Enemy-keyword engine code | Delete all 11; keep an optional empty `Enemy.keywords` (D63) |
| 3 | The Lantern Deep's exit | **Sealed**, like the vault door; the player keeps wandering Act 1; no end-of-run state (D61) |
| 4 | Level-up Learn Card | Deleted; level-ups give stat points only (D63) |
| 5 | RELENT (PLEA/capitulation) and CONDEMN (premises/peroration) | Both cut; befriend → mercy is the only non-lethal ending (D63) |
| 6 | Dev menu | **Left alone** by the reset except compile/test fixes forced by deletions; a new owner-led **B10 Dev Menu revamp** does the rest (D62; D19 stands) |
| 7 | Hard-coded hex colours | A small loop phase **R10** after R8 (D62) |
| + | Hazard reset depth | Minimal playable core, as drafted in hazards.md (D63) |
| + | The Anvil (found during call 6) | Its only placement was on fishing-village; **re-home it once per region, near the exit** (D61) |

## 7. Roadmap — recommended order (D64)

### Reset track (loop, one phase per PR)

| Step | Phase | Why here |
|---|---|---|
| 1 | **R0** Loop doctrine reset (attended) | The loop must stop teaching retired doctrine and routing to archived agents before it ships anything. Re-enable `march`/`night` after it merges |
| 2 | **R1** Tooling reset | Deleting the card editor frees R7 from a third package; retiring the baseline stops every session printing a stale stamp |
| 3 | **R2** Enemy reset | Everything downstream (world, relics' befriend data, the engine carrier sweep) keys off the three survivors |
| 4 | **R3** World reset | Needs the survivors to re-point encounters; shrinks the world before items/shops are touched |
| 5 | **R4** Relic placeholders | Removes the Bill exploit and most signature carriers early; gives B1 its floor |
| 6 | **R5** Items reset | Only Act 1's shops and caches remain to re-point |
| 7 | **R6** Hazard reset | Independent; placed here so R7's carrier sweep sees the final hazard glossary |
| 8 | **R7** Engine purge | Last big deletion — needs R2, R4, R6 to have removed their carriers |
| 9 | **B4** Card-rules inventory (loop) | Straight after R7 so the inventory records the final tree and card work can start in parallel with the rest |
| 10 | **R8** Mobile cleanup | Consumes R7's final exports |
| 11 | **R9** Progression retune | Needs Act 1 and the engine final; its XP numbers feed B2 |
| 12 | **R10** Theme colours | Last: R8 has already deleted about half the literals |

### Rebuild track (T's sessions, alongside the reset when ready)

| Step | Phase / decision | Ready after | Why here |
|---|---|---|---|
| a | **Pick the card process plan** (A, B or C) — open `plan/2026-09-27-keyword-card-revamp.summary.html` | now | Nothing else in card work can be scheduled until it is picked; picking early lets B5/B6 follow B4 immediately |
| b | **B1** Relic pass | R4 | Signatures are the player's only non-card actions; small, and it restores texture to fights early |
| c | **B5** Card-creator workflow | B4 | The tool shape follows the inventory and the picked plan |
| d | **B6** Card sessions | B4, B5 | The player's kit — the biggest rebuild |
| e | **B2** Enemy revamp (four tiers, Act Boss) | R9 (and B6 under way) | Threats are designed against a real kit. **If T picks Plan C (threat first), move B2 before B6** |
| f | **B3** Hazard redesign | R6 | Independent of combat; any time after R6 |
| g | **B10** Dev menu revamp | R8, R10 | Builds on the final palette and the post-reset content |
| h | **B7** Deck tab revamp | R8 (better after B6 adds cards) | A deck of 3 cards gives the redesign little to show |
| i | **B8** Card art revamp | B6 | Art per card type once the types beyond Attack/Skill/Spell exist |
| j | **B9** Labyrinth re-theme | B2 | Needs the enemy roster and tiers |
