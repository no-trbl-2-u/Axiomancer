# Phase R2 — Enemy reset

## Sources

- Part plan: [`plan/revamp/enemies.md`](../revamp/enemies.md) § R2 (items 1–8).
- Reset rules: [`plan/revamp/README.md`](../revamp/README.md) §5.
- Decisions: **D48** (roster → Float-Eye / Brine Hag / The Doorwarden, all
  keywords and afflictions stripped), **D61** (the Doorwarden on every
  region's door fight; Float-Eye takes normal fights, the Brine Hag is a rarer
  mid-region fight), **D63** (all 11 enemy-keyword systems deleted; an optional
  empty `Enemy.keywords` kept for B2), **D45** (carrier rule), **D50** (git
  history is the source archive), **D58** (nothing is authored).
- Walkthrough: `plan/revamp/walkthrough.md` § R2.

## Outcome

Three foes that deal plain damage (Float-Eye L1 normal, Brine Hag L7 elite,
The Doorwarden L8 boss) plus the `sandbag-01` dev dummy. No enemy keyword,
affliction rider, PLEA/premise rider or curse-injection path survives in the
engine, the telegraph, the mobile glosses or the atlas.

## Scope

1. **Roster.** Delete the 76 retired `createEnemy` blocks, the playtest
   ceiling `TheIncompleteness` included (it is not a survivor; the
   `impossible` stage profile goes with it). `EnemyLibrary` and
   `ENEMY_REGISTRY` list the three survivors (+ `sandbag`). Delete their decks
   (`ENEMY_DECKS`), stance maps (`DECK_STANCE_CHECKS`), and every enemy card
   no survivor plays (`ENEMY_CARD_LIBRARY` keeps the 15 cards the three decks
   name). Portraits, the art registry rows and provenance rows for retired
   foes go too.
2. **Afflictions.** Survivor cards lose `effectId` / `intensity` (and any
   branch-face equivalents): they deal plain damage.
3. **Keywords.** The Doorwarden loses HIDE / UNSHAKEN and its stages lose
   their `gain` lists. Delete `EnemyKeyword`'s 11 members and every
   resolution site (HIDE/ELUSIVE floor, SWIFT/BRUTAL soak, VENOM/WOUNDING/
   RAVENOUS riders, UNSHAKEN denial, REGROW heal, FLURRY split, SUMMON's
   adds state, `strikeAdd` verb and UI). `enemy-keywords.ts` keeps only the
   `EnemyStage` shape and an empty `EnemyKeyword` type; `Enemy.keywords?`
   stays optional for B2.
4. **Riders + curses.** Delete `swayCleanse`, `premiseShed` and
   `curseCardId` from cards, faces, threat phases, stages, telegraph text and
   `effectIsDebuff`; delete the curse-injection code paths.
5. **Pools and pins.** `EnemiesByMap`: every Act 1 map (breakwater,
   charcoal-wood, beacon-crags, lantern-deep) draws Float-Eye; each region
   keeps one mid-region node pinned to the Brine Hag; each region's door
   fight (`bw-17`, `cw-17`, `bc-15`, the Lantern Deep's column-5 node) pins
   the Doorwarden as a boss. Every other pinned node re-points to Float-Eye.
6. **Retired-foe references** in engine and tests: quests, dialogue gates,
   bestiary, stage profiles, CLI defaults, fixtures, e2e journeys, mobile
   presenters/tests/scripts.
7. **Stale comments** named in the part plan.
8. **Carrier sweep (D45), last:** HIDE, SWIFT, BRUTAL, VENOM, UNSHAKEN,
   ELUSIVE, REGROW, RAVENOUS, WOUNDING, FLURRY, SUMMON, POISON, BLEED, MARK,
   DOOM leave the atlas, the mobile gloss/glyph tables and the DevLog catalog
   — where no other carrier (a player card, a relic, an item, a hazard) still
   prints the word.

## Consumers to update

`axiomancer-mechanics/src/index.ts` and `Combat/index.ts` exports; the mobile
combat presenter, combatant pane, encounter panel and `state/combat/keywords.ts`;
the dev enemy picker; enemy-art registry; the DevLog art-licence and catalog
scripts; `scripts/content-drift.mjs`.

## Save / schema contracts

- `CombatEncounterState.adds` (SUMMON) leaves the encounter state; a save
  that carries it drops the field on load (migration + test).
- A save whose in-flight encounter names a retired enemy id is re-pointed
  to Float-Eye by the same migration (the reload lands on a live foe).
- Befriend flags / codex entries for retired foes stay in old saves as
  inert strings; nothing reads them.

## Decisions made upfront — DO NOT ASK

- **Parked and to-be-purged maps keep a Float-Eye pool, not an empty one.**
  The part plan says "parked maps' pools empty", but R3 (which parks and
  purges them) has not shipped: fishing-village, the northern maps and the
  Labyrinth are still reachable, and `generateEncounter` throws on an empty
  pool. They hold `[FloatEye]` until R3; R3 empties them as it parks.
- **Labyrinth act bosses** (`the-index`, `the-sophist`) re-point to
  `the-doorwarden`; the Labyrinth is sealed in R3.
- **Re-pointed node descriptions.** A node whose description names a retired
  foe's look loses its description (the encounter falls back to the foe's
  own), rather than gaining new prose (D58). Descriptions that already
  describe the survivor stay.
- **The Doorwarden's stages stay** (name, text, heal, threat bonus: a boss
  phase change, not a keyword) minus their `gain` lists. Its printed VITAE and
  stats are unchanged; B2 retunes.
- **Survivors' `mapName`** moves to an Act 1 map (Float-Eye, Brine Hag →
  `breakwater`; Doorwarden → `lantern-deep`) since fishing-village and the
  Aporia do not survive R3.
- **Survivor loot tables** are left to R5 (items reset).
- **Tests pinned to retired foes** are re-pointed at the survivors where
  the test's subject survives, and deleted where the subject was the retired
  foe or a deleted keyword (reset rule 2).

## Tests matrix

- Deleted with their subjects: SUMMON, HIDE-ramp, the-incompleteness,
  enemy-archetype and keyword suites, stance-check variety pinned to retired
  decks, curse/rider suites.
- Re-pointed: every suite that only needed "some foe" (grave-larva /
  chattering-skull / tri-eyes → float-eye, etc.).
- New: roster pin (exactly three survivors + sandbag), no survivor card
  carries an affliction or rider, Act 1 pools and door pins, save migration.

## Verify gate

`npm run verify --workspace axiomancer-mechanics`,
`npm run verify --workspace axiomancer-mobile`, root `npm test`,
`npm run lint:content`, `node scripts/check-lexicon.mjs`.

## DoD

- `ENEMY_REGISTRY` = sandbag + the three survivors.
- No `EnemyKeyword` member, no rider/curse field, no adds state in the tree.
- Every Act 1 door fight is the Doorwarden.
- All gates green.

## Follow-ups (out of scope)

- R3 empties the parked maps' pools and seals the Labyrinth / deep stair.
- R5 re-points survivor loot; B2 regrows the roster and retunes the survivors.
