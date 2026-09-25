# Content pitches — 2026-09-12

> Session provenance: run from `plan/2026-09-12-content-roadmap-brainstorm.prompt.md`
> (introduced at commit `bbbff90`, merged to `main` as `1119034` via PR #303),
> session base HEAD `1119034`, **UNATTENDED** (no questions asked; every owner-flavoured
> call is tagged `[loop-call]` in §6). **KB reachable: yes** — the prior-art
> receipts in §3 resolve against the live corpus (verified this session:
> `kb:slay-the-spire/cards/0280-searing-blow-searing_blow.okf.md` returns
> "Can be Upgraded any number of times."). Baseline stamp **b1624da0 ·
> measured 2026-09-11 · confidence reduced-nightly**, reported **STALE by one
> mechanics-source commit** (`df6e98f`, a speech-mark edit) — so no win rate
> in this file is quoted as current. Where a rate is cited it is cited as the
> stamp's reading, not as today's.

---

## 1. The state of the game (ten lines, re-derived)

Every figure below was counted from the tree at HEAD during this session, not
recalled from §3 of the brief.

1. **Cards.** 123 authored ids across nine family modules (starters 8,
   apocrypha 12, choir 16, debt 16, grave 16, relics 3, rot 16, trial 20,
   vigil 16), plus five factory-built curses. `src/Cards/card-upgrades.ts` is
   540 lines; `grep -c '^\s*upgrade:'` returns **0 in all nine library files**,
   so every `+` in the game is the same default bump.
2. **Keywords.** 52 `KEYWORD_GLOSS` rows in
   `axiomancer-mobile/state/combat/keywords.ts` (the file's own header still
   declares "30 KEYWORDS"), 9 `ENEMY_KEYWORD_KINDS`, and **9 `CardSpecialMechanic`
   kinds with zero carriers** — `befriend_attempt`, `convert_die_color`,
   `echo_next_spell`, `float_x_die`, `forge_floating_die`, `overheat`,
   `refresh_die`, `spend_all_pips`, `strip_random_buff`. Six of the nine are
   dice verbs. No gloss row exists for OVERHEAT, REFRESH, CONVERT or FLOAT.
3. **Enemies.** 79 production records — 17 boss, 26 elite, 29 normal, 3 simple,
   4 unique. 21 author stage rows; the other 57 inherit `defaultEnemyKeywords`,
   and below the boss line only HIDE and SWIFT ever appear. 16 records carry a
   `journalEntry`.
4. **Maps.** 7 gauntlet maps over 131 nodes across 3 catalogued continents;
   `createStartingWorld()` catalogues coastal and northern only — the
   labyrinth continent stays uncatalogued by its own docblock, so
   `changeContinent` hard-no-ops on it. cap-9 is terminal.
5. **Events.** `MapEventKind` is exactly 11. 95 structural pool entries resolve
   through the map-event factories to roughly **132 instantiated entries**; the
   load-bearing sub-count re-derived exactly this session is **16 instantiated
   rest nodes** (5 hard-authored + 4 fishing village + 3 caverns + 3 northern
   city + 1 connecting river). The anvil is **1 node of 131**.
6. **Equipment.** 8 signet relics, 1:1 with 8 signatures; head, hands and feet
   accessory kinds hold zero relics. 22 consumables, none usable in combat —
   `src/Combat/types.ts:41` claims in writing that only consumables are, and
   nothing under `src/Combat/` reads `Character.inventory`.
7. **Story.** 46 distinct dialogue flags are written; 15 are read. 11
   befriend flags are set by `flagSet:`; exactly one is ever read. No dialogue
   gate can read a faction, a goodwill tally, a codex entry or a spared region,
   though all four slices persist.
8. **Persistence.** `GAME_STATE_VERSION` is 21 (`game.reducer.ts:106`); the tree
   carries **10** migration functions, `migrateV11ToV12` through
   `migrateV20ToV21` (`game.migrate.ts:36-313`). House convention is a capital
   `To`.
9. **The plan.** `plan/steps/01_build_plan.md` runs to Phase 78 with no gaps and
   to Phase W6 in the world series, so **79 and W7 are free**. `Phase W5` is
   `[-]` **partial** at `:2546` (per-map enemy roster growth) — a surface two
   ladder rows below build on and neither can call finished.
10. **Measurement.** Baseline b1624da0 · 2026-09-11 · reduced-nightly, STALE by
    `df6e98f`. Its readings: early 0.9729 / mid 0.9700 / late 0.8201 /
    impossible 0.0875 across 4,320 fights; `deadCardRate` 0.6222; mercy **0 at
    every stage**; the impossible tier's win-path counts are victory 1,
    capitulate 20, defeat 219 — so RELENT accounts for 20 of 21 non-defeats.

Two facts the reader should have before §2, said deliberately rather than
discovered:

- **Applied consistently, this ladder ships zero new art.** `[loop-call] 8`
  rules art sourcing a steward call, not a phase, and the sourced cap-9
  portrait has been struck from Phase 95 accordingly. Lane 8 (art and
  presentation) is therefore carried entirely by the **reader surface** —
  the codex page (Phase 82) and the glossary half (Phase 89) — which brief §4
  lane 8 explicitly names as a lane-8 deliverable ("a codex/glossary surface
  that new content will need").
- **Every numeric row in this ladder collides with a pre-nexus phase number.**
  Re-derived this session over `axiomancer-mechanics/src` and
  `axiomancer-mobile`: **133 live source comments** cite a "Phase N" in the
  79-110 band, spread over 22 of the 32 numbers. See `[loop-call] 1`.

---

## 2. Tentpoles

Three arcs. Each spans three or more of the brief's nine lanes; all fourteen
surviving pitches belong to exactly one, and all fourteen carry ladder rows.

### T1 · THE WAGES OF THE ROAD
*(lanes: equipment, cards, run)*

THE PATH names six axes by which a pilgrim gets stronger; at HEAD four of them
are furniture. Card upgrades are 540 shipped lines with three non-test consumers
and zero mobile ones; act reward dice are written at exactly one site and that
site is a measurement fixture (`combat.stage-profiles.ts:256`); signatures
deliver COUNT and never POWER because `SIGNATURE_SKILLS` freezes every cost and
magnitude as a literal; and twenty-two consumables ride inside
`CombatEncounterState.player`, deep-cloned, unread, while `src/Combat/types.ts:41`
claims in writing that only consumables are usable in combat. This tentpole pays
the pilgrim for walking. A satchel that opens mid-fight, a rest node that amends
a card instead of only cutting one, a Station at every door that hands over a die
of your choosing, and a signet that can be fed until the rite it grants is worth
saving Conviction for. Nothing is invented — every one of the four is a writer
for a read path that already ships. The measure of success is that the harness
stops projecting a campaign nobody has ever played.

Members: **P-01** The Strap · **P-02** The Recension · **P-03** The Stations of
the Road · **P-04** The Translation of Relics.

### T2 · THE PARISH KEEPS ACCOUNTS
*(lanes: events, story, maps, cards)*

Thirty-nine of every hundred instantiated map entries resolve with no decision in
them, forty-six dialogue flags are written and fifteen are read, the whole
die-gear economy stands on one node of a hundred and thirty-one, and the
Capital's wall has no gate. The world happens TO the pilgrim and forgets them
immediately afterwards. This tentpole makes the road ask and makes it remember:
one generic `EventChoice` contract lifted out of the two bespoke offer engines
already shipped, so hazards and gatherings can offer terms instead of outcomes;
four hidden-when-unmet dialogue clauses plus a CI audit that fails the World
suite on any consequence written and read by nothing; a Tally-Man who sells what
you cannot afford and a collection that finds you two maps later; a seventh door
out of the Capital into a continent that has been finished since July and
reachable only from a debug row; and a reward pool that differs by parish, so a
second road down is a different deck rather than the same deck reshuffled. The
through-line is accountability — a bad outcome must trace to a decision the
player made and can see written down.

Members: **P-05** Every Door Asks · **P-06** The Parish Remembers ·
**P-07** The Tally-Man · **P-08** The Seventh Door ·
**P-09** Every Parish Its Own Heresy.

### T3 · NINE WORDS AND NO MOUTH
*(lanes: keywords, art, cards, enemies)*

Two independent nine-counts describe the same disease. Nine `CardSpecialMechanic`
kinds resolve in the engine and are printed on no card; nine enemy keywords ship
and seven of them never leave the boss tier, so fifty-eight of seventy-nine foes
carry none at all. Around them: `befriend_attempt` priced at three points with
zero carriers while ten enemies carry `befriendabilityConfig` and the faction and
journal writes are shipped; two CONDEMN carriers holding an entire win path;
sixteen authored codex entries whose only reader is a CLI; and fifty-two glossary
rows reachable from no screen a confused player is standing on. This tentpole
gives the vocabulary a mouth or a funeral, and then a page to read it on. It
opens with a census gate that fails CI on any printed keyword with no carrier —
so the disease cannot silently recur — and closes with a boss that takes off the
face it was wearing and a fight that can end without a corpse. The register is
the point: a game whose words nobody speaks is a liturgy nobody attends.

Members: **P-10** Nine Verbs Nobody Speaks · **P-11** The Book of the Spared ·
**P-12** Not Every Fight Ends In A Body · **P-13** The Lesser Orders ·
**P-14** The Second Mask.

| Tentpole | Lanes spanned | Pitches | Ladder rows |
|---|---|---|---|
| T1 · THE WAGES OF THE ROAD | equipment, cards, run | 4 | 79, 80, 85, 86, 96, 97, 98, 99, 100 |
| T2 · THE PARISH KEEPS ACCOUNTS | events, story, maps, cards | 5 | 83, 84, 101, 104, 105, 106a, 106b, 107, 108, W7, W8, 109, 110 |
| T3 · NINE WORDS AND NO MOUTH | keywords, art, cards, enemies | 5 | 81, 82, 87, 88, 89, 90, 91, 92a, 92b, 93, 94, 95 |

Lane coverage: cards P-02/P-09/P-12 · keywords P-10 · enemies P-13/P-14 ·
maps P-08 · events P-05/P-07 · equipment P-01/P-04 · story P-06 ·
art P-11 (reader surface only, per §1) · run P-03.

---

## 3. Pitches

Fourteen survivors, renumbered P-01 … P-14 in tentpole order. Every block
carries the brief's full §5 field set. Sizes are the **auditor's honest size**
wherever it differs from the pitch's own estimate; the pitch's original claim is
named beside it so nothing is quietly softened.

---

### T1 · THE WAGES OF THE ROAD

---

### P-01 · The Strap — Drink It Or Die With It

- **Hook:** Twenty-two potions in your bag and not one of them can be opened
  while something is killing you.
- **Lanes:** equipment (+ cards, run)
- **The fantasy:** The threat card says 31. You have 14 VITAE, a hand of GUARD
  you cannot pay for, and a Phoenix Tear you have carried across two maps. Right
  now you close the app, walk to the inventory tab, drink it there, and walk
  back — except you cannot, because the fight owns the screen. So you die
  holding it. After this: a strap of three phials sits under your hand. Reaching
  for one is a real turn cost and a real choice against playing a card, and the
  bag you have been hoarding since the fishing village finally has a reason to
  have been hoarded.
- **What it touches:** THE SEAM ALREADY EXISTS AND IS UNREAD.
  `CombatEncounterState.player: Character`
  (`src/Combat/combat.encounter.types.ts:746`, deep-cloned at
  `combat.engine.ts:475`) and `Character.inventory: Item[]`
  (`src/Character/types.ts:114`) — the satchel is already inside combat state;
  nothing in `src/Combat/**` reads it (grep for `consumable` across
  `src/Combat/` returns two unrelated comment lines). ENGINE:
  `src/Combat/combat.engine.ts` — a new exported transition
  `useSatchelItem(state, itemId, rng)`, phase-gated on `'phase-play'` and shaped
  exactly like `playSignatureSkill` (`:5550-5566`), including the loud
  `effect-fizzled` refusal. It calls the ALREADY-PURE `useConsumableEffect`
  (`src/Items/equipment.engine.ts:51`) plus the `useConsumable` inventory reducer
  (`src/Items/item.reducer.ts:26`) — no new resolution logic, no new effect
  channel. A new `CombatEvent` variant (`combat.encounter.types.ts`) so the log
  and the presenter can narrate it. THE COST MODEL is the design decision:
  a per-fight SATCHEL allowance (a strap of N, N small) rather than a Conviction
  price — a Conviction price makes the bag a signature competitor and pulls a
  locked resource into the item economy. `src/index.ts` barrel export (deliberate
  public-surface add; flag it in the phase report). MOBILE:
  `state/presenters/combat-encounter.engine.ts` — a `satchelVM` beside
  `signaturesVM:2695`, listing only usable consumables with their remaining
  allowance; `state/combat/store-actions.ts` — the action;
  `components/combat/encounter/CombatEncounterPanel.tsx` — the phial strap,
  mirroring the existing rune-info long-press pattern at `:1110`; the existing
  out-of-combat path at `state/actions.ts:954 useItemAction` stays untouched.
  CONTENT CONSEQUENCE, name it in the report: the 22-entry library was authored
  for an out-of-combat world — five shipped with no payload at all and were
  patched by `/adjust-equipment` pass 1 (the 2026-09-04 comment at
  `src/Items/consumable.library.ts:59`), and only six distinct ids are actually
  sold across the world's shops (`src/World/MapEvents/content.ts:136,370,1180,1413`).
  A combat-legal satchel makes `src/Items/cache-reward.ts`'s uniform 22-way roll
  (tier scales COUNT only, `CACHE_REWARD_TUNING` modest [1,2] / rich [2,3]) a
  live balance surface for the first time — hand that to `/adjust-equipment`, do
  not fix it here. Card editor: no coupling, mobile verify only. Docs:
  `docs/items.md`, `docs/combat.md`.
- **Prior art:**
  `kb:slay-the-spire-the-board-game/rules/turn-structure.okf.md` (src-008,
  secondary review, high) — "Players can play cards, use potions, and activate
  abilities in any order they choose", identified as the fine-grained play the
  design turns on; the same line recurs across
  `kb:patterns/downtime.okf.md`, `kb:patterns/turn-pacing.okf.md`,
  `kb:patterns/player-interaction.okf.md` and
  `kb:patterns/cooperative-game.okf.md` (src-008, src-003) as the mechanism that
  turns co-op tactical. STEAL: potions are a first-class in-combat action
  interleaved with cards, not a menu you leave the fight to visit. |
  `kb:slay-the-spire-the-board-game/rules/actions.okf.md` (src-002, official
  rulebook, high) — "Potions and relics are item-area resources with effects
  that modify play." STEAL: the ITEM AREA — potions live in a visible zone
  beside the board. That is the argument for a phial strap on the combat screen
  rather than an inventory modal launched from combat. DON'T STEAL: their
  potions are unbounded per combat because the physical item area is the limit;
  we have no physical limit, so the allowance is ours to author. |
  `kb:slay-the-spire-the-board-game/reception/better-if.okf.md` (src-008,
  src-003) — the free-order rule is praised while the file note records v2.30
  CUTTING the optional sequential-turn rules. DISLIKED: added ordering
  restrictions. Price the satchel in an allowance, not in tempo.
- **Why now:** `src/Items/consumable.library.ts` ships 22 consumables and
  `src/Enemy/enemy.library.ts` carries 78 loot tables that drop all 22. The only
  call site that consumes one is
  `axiomancer-mobile/app/(tabs)/inventory/index.tsx:69` via
  `state/actions.ts:789`; grep across `axiomancer-mobile/app/combat-encounter/`
  returns ZERO hits for inventory, consumable or item.
  `axiomancer-mechanics/src/Combat/types.ts:41` still carries the comment "Per
  Spec 05 only consumables are usable in combat" — **the code contradicts its own
  docblock at HEAD**. This is the brief's §4 lane-6 item "consumables that matter
  in combat", it is the ONLY sub-item of that lane with no filed candidate
  anywhere in `plan/PHASE_CANDIDATES.md` or `plan/AUDIT.md`, and it is the
  cheapest player-visible delta in the equipment lane by a wide margin because
  the resolution engine (`useConsumableEffect`) is already pure and already
  tested. Authority: THE OPEN GATE ¶8 (`plan/bearings.md:553`, "Content growth
  is a standing MANDATE, not just permission") makes "the game is too small" a
  permanent open finding; 22 authored items the player can never use in the only
  place they would matter is the smallest version of that finding and the
  easiest to close. *(Citation corrected: the paragraph is `:553`; `:501` is the
  OPEN GATE heading line.)*
- **Depends on / unblocks:** Depends on nothing. Independent of P-02 and P-04 and
  shippable before either — recommended FIRST in the ladder for that reason.
  UNBLOCKS: the graded-signature row shares the combat-board real estate and the
  presenter shape, so building the satchel strap first establishes the pattern
  and halves that row's mobile half; and it turns `src/Items/cache-reward.ts`
  into a surface worth tiering by quality rather than count. CITES AS A
  NEIGHBOUR, does not re-pitch: the late-campaign cliff row
  `plan/PHASE_CANDIDATES.md:343`.
- **Size:** **2** phases (the pitch claimed 2-3; the auditor priced it at 2 and
  the ladder ships two rows). Phase A — THE STRAP (engine + barrel):
  `useSatchelItem`, the per-fight allowance, the `CombatEvent` variant, the
  `src/Combat/types.ts:41` docblock corrected to match reality, hermetic e2e,
  `npm run verify` in mechanics and mobile. Playable increment: the CLI combat
  driver drinks mid-fight and the log narrates it; the mobile screen does not
  change, so nothing regresses. Phase B — THE PHIALS (mobile): `satchelVM`, the
  store action, the strap on the combat board with its own testID, the empty and
  exhausted states, and a screen test. Playable increment: a player finishes a
  fight they would have lost, holding a bottle they earned three maps ago. A
  third phase is possible but is NOT scoped here — re-pricing the 22 consumables
  against the §5 scale ladder and tiering `cache-reward.ts` by quality is
  `/adjust-equipment` steward work with a `/combat-playtest` evidence table.
- **Keep-list risk:** None to the locked mechanics if the allowance model is
  used. It does NOT touch Conviction, Surge or the Dice: a satchel use costs a
  per-fight allowance, never Conviction, never a die, never a tray roll — so the
  one-tray-roll-per-threat-phase constraint is structurally untouched. The
  FREE-line constraint does not apply (items are not cards). The one real risk
  is to the DECKBUILDING CORE (keep-list): if drinking is strictly better than
  playing a card, the satchel displaces the deck. Mitigations, both authored not
  hoped-for: the allowance is small and per-fight, and **no consumable may draw,
  mill, or otherwise touch the deck** — items heal, cleanse and buff, and the
  deck remains the only source of damage.
- **Kill criteria:** STOP if (1) a `/combat-playtest` A/B on identical seeds
  shows the satchel flattening the difficulty curve — late-stage win rate moving
  materially against the baseline stamp b1624da0 purely from healing, with no
  change in rounds or plays, which means the allowance is a VITAE cheat rather
  than a decision; (2) the honest implementation requires reading or writing
  `Character.inventory` from inside the combat resolution loop in a way that
  breaks determinism or the no-side-channel contract — the inventory is on the
  cloned player, so the write-back at combat end is the risky seam and must stay
  a host concern; (3) the strap cannot be placed on the combat board without
  displacing the signature runes or the hand — a UI-budget failure; ship Phase A
  alone and hand the layout to a V-series row; (4) the six-id shop reality means
  the strap is almost always empty in a real run, in which case the blocking
  problem is the loot economy and this pitch is premature.
- **Done looks like:** A hermetic e2e at `src/Combat/e2e/satchel.engine.test.ts`
  on a seeded RNG: use a healing consumable mid-fight, assert VITAE moved by
  exactly the printed amount, assert the stack decremented on the combat-state
  player, assert the allowance blocks the next use with the loud
  `effect-fizzled` refusal, and assert a fresh encounter restores the allowance. |
  `src/Combat/types.ts:41`'s claim is TRUE at HEAD for the first time — docblock
  and code agree, verified by that test. | The mobile combat screen renders a
  phial strap with a stable testID; a screen test covers stocked,
  exhausted-for-this-fight and empty-bag, and the out-of-combat inventory path at
  `state/actions.ts:954` is proven unchanged. | Both verify gates green; the
  `src/index.ts` barrel addition named explicitly in the phase report as a
  deliberate public-surface change. | A `/combat-playtest` before/after table on
  IDENTICAL seeds and flags for at least mid and late, reported as diagnostic
  (no win-rate curve to hit, per the 2026-09-02 repeal) — acceptance is that the
  numbers were measured and argued, not that they hit a shape.
- **Confidence:** 84.

---

### P-02 · The Recension

- **Hook:** Every card in the parish can be read a second time, and the second
  reading is worse for somebody.
- **Lanes:** cards (+ events, equipment)
- **The fantasy:** You carry the same pages the whole campaign; what changes is
  what is written in them. At a rest you hand over one card and a price and it
  comes back AMENDED — not merely louder. The Black Cap amended does not hit
  harder, it lowers the floor the verdict has to clear. The Whole Body Confesses
  amended grows a seventh hit and every BLEED stack on the board fires once more
  for it. You choose between two amendments and the one you refuse is gone. The
  card keeps its name and grows a cross beside it.
- **What it touches:** `axiomancer-mechanics/src/Cards/card-upgrades.ts` (540
  lines; the +40%/+25%/+1 default rule stays as the FALLBACK). The pitch is the
  AUTHORED patch layer: `Card.upgrade` / `CardUpgrade` / `CardRiderUpgrade`
  already exist at `src/Cards/types.ts:590, :535, :898` and are used by EXACTLY 0
  of the 128 library cards. Authored patches land in
  `src/Cards/library/*.cards.ts` (12 apocrypha + 6 theme capstones first), each
  with its own `// pts:` line and a regenerated or authored `paidSummary`
  (`src/Combat/e2e/paid-summary-honesty.engine.test.ts` is the honesty gate).
  THE DOOR: `src/World/RestChoice/restchoice.types.ts`
  (`RestChoiceOfferId = 'rest' | 'cut'` gains `'amend'`), `restchoice.engine.ts`,
  `restchoice.content.ts`, plus an escalating price module modelled on
  `src/Cards/card.removal.pricing.ts` (base 5 / step 5) and `ANVIL_VERB_PRICING`
  (hone 3 / temper 5 / swap 8, `src/World/Blacksmith/blacksmith.engine.ts:57`).
  Mobile: `axiomancer-mobile/app/rest/index.tsx` (the `rest-cut-sheet` picker at
  `:157` is the exact component to fork), `state/actions.ts`,
  `state/combat/store-actions.ts` — grep for `upgradeCard` / `UPGRADE_SUFFIX` /
  `getUpgradedCardById` across `axiomancer-mobile` and `axiomancer-card-editor`
  returns ZERO hits today. Persistence: an upgraded card is the plain string
  `<id>+` in `knownCards` / `combatRewardCards`, so `Character` needs no new
  field and `GAME_STATE_VERSION` is untouched; only an amendments-made counter
  would need a hop. Known engine hazard already documented in
  `card-upgrades.ts`: oath/hex passives are hooked by literal id and must resolve
  through `baseCardId` (`src/Combat/combat.engine.ts:1291`). Barrel:
  `src/Cards/index.ts`, `src/index.ts` if authoring helpers ship. Cross-package:
  the card-editor write-back does not know `<id>+`.
- **Prior art:**
  `kb:slay-the-spire/cards/0280-searing-blow-searing_blow.okf.md` (src-001,
  verified live this session) — "Deal 12 damage. Can be Upgraded any number of
  times." STEAL: an upgrade that is a repeatable CHOICE SINK, not a one-time
  +40%. | `kb:dawncaster/keywords/upgradeable.okf.md` (src-001, community draft,
  medium) — "This card can be Upgraded, which improves the card in unusual
  ways." The genre's own word for the authored patch is UNUSUAL, not bigger;
  caveat that the corpus is community-sourced, treat wording as a lead. |
  `kb:arkham-horror-the-card-game/rules/scoring-endgame.okf.md` (src-003,
  official Learn to Play, high) — "Experience purchases convert performance into
  future deck strength." DISLIKED
  (`kb:arkham-horror-the-card-game/reception/better-if.okf.md`): campaign upgrade
  paths need upgrade-path tooling or they become collection friction — so the
  amendment must be legible on the card face, not in a menu. |
  `kb:slay-the-spire-the-board-game/reception/better-if.okf.md` (src-008, high) —
  post-Act progression was "very unclear"; the doc's implication is to ritualize
  what persists, resets and unlocks. Our rest node is that ritual.
- **Why now:** THE PATH axis 3 is machinery with no door.
  `axiomancer-mechanics/src/Cards/card-upgrades.ts` has exactly three non-test
  consumers (`cards.library.ts getCardById`, `combat.engine.ts:1291`,
  `combat.stage-profiles.ts:214-231 upgradedCardShare`) and zero in
  `axiomancer-mobile` or `axiomancer-card-editor`;
  `grep -c '^\s*upgrade:' src/Cards/library/*.cards.ts` sums to **0 across all
  nine modules** (re-derived this session), so every `+` in the game is the same
  bump. Meanwhile the stamped matrix fights the late campaign WITH upgrades the
  player cannot obtain: `dominantCardId` at late and impossible is
  `the-bench-does-not-retire+` at 0.901 / 0.842 share (baseline stamp b1624da0 ·
  2026-09-11 · reduced-nightly; `baseline:check` reads STALE from the
  content-only commit `df6e98f` per `plan/AUDIT.md:229`).
- **Depends on / unblocks:** EXTENDS `plan/PHASE_CANDIDATES.md:1431` ("Card
  evolution", UNPARKED and ruled design-now 2026-08-10) — that row is blocked on
  a card-INSTANCE state schema; this pitch deliberately needs none, because the
  `<id>+` string IS the instance, so it is the cheap first half of that row and
  leaves the free-line-evolution fork for later. Depends on P-05's generic offer
  contract (ladder Phase 84) so the third rest offer lands on one contract rather
  than forking a two-member union. Unblocks P-04's `translate` offer, which is
  the same door's fourth prong.
- **Size:** **2-3** phases (auditor concurs). Phase 1 — authored `upgrade:`
  patches for the 12 apocrypha and the 6 theme capstones, each with pricing
  arithmetic and honest face text; immediately playable through
  `DebugCombatDeck` and measurable in the matrix, zero mobile risk. Phase 2 —
  THE DOOR: the rest node's third offer `amend`, its escalating shilling price,
  and the picker forked from `rest-cut-sheet`; a player can amend a card on the
  map. Phase 3 (optional, and CUT from the ladder per `[loop-call] 10`) — an
  in-combat amendment payoff verb, once the door is real.
- **Keep-list risk:** none — it feeds the deckbuilding core, which is on the
  keep-list, and touches neither Conviction, the Surge meter nor the Dice system.
  An amendment may buy interaction with all three; none may be removed or
  no-op'd.
- **Kill criteria:** Stop at phase 1 if authored patches cannot keep the printed
  face honest — if every patch needs a hand-written `paidSummary` to survive
  `src/Combat/e2e/paid-summary-honesty.engine.test.ts`, the layer is a
  text-maintenance tax and the default rule stays alone. Stop at phase 2 if a
  `/world-tuning` read shows the third offer starving the `cut` axis (removals
  per run collapsing): the amendment then gets its own node kind rather than
  competing with removal for the same locked choice.
- **Done looks like:** Every apocryphon and theme capstone carries an authored
  `upgrade:` patch with a `// pts:` line; paid-summary-honesty and the pricing
  sanity guard are green. | A hermetic e2e (`src/Cards/e2e/`, deterministic RNG
  via `src/test-utils/rng.ts`) proves `getCardById('<id>+')` returns the AUTHORED
  patch for every patched card and the DEFAULT rule for every unpatched one, and
  that `baseCardId` still resolves oath/hex hooks. | The rest node offers three
  things, locks after one, and a claimed amendment survives a save/load round
  trip with `GAME_STATE_VERSION` asserted unchanged. | `npm run verify -w
  axiomancer-mechanics`, `npm run verify -w axiomancer-mobile` and
  `npm run type-check -w axiomancer-card-editor` all green. | A `/deck-tuning`
  before/after on identical seeds shows amended cards changing WHICH cards get
  played, not only how hard they hit.
- **Confidence:** 82.

---

### P-03 · The Stations of the Road

- **Hook:** Six doors already cut the world into stages; at each one the road
  stops, takes stock of what it cost you, and hands you a die of your choosing —
  and the tray you fight with after is not the tray you fought with before.
- **Lanes:** run (+ equipment, events)
- **The fantasy:** You beat the Waterreeve at cr-12 and step onto the bridge. The
  screen goes black-and-bone: THE THIRD STATION. A tally of what this leg took —
  rounds endured, foes felled, VITAE spent, doors closed behind you. Then one
  choice, three faces: a RED die, a BLUE die, a PURPLE die. You pick, the die
  joins your tray permanently, and the next map opens knowing you are heavier
  than you were. Four Stations across the run, four dice, and by the Capital you
  are rolling seven where you started with four. The choice is small and total:
  you never un-choose it, and the colour you starve is the colour that betrays
  you at cap-9.
- **What it touches:** ENGINE: a new `src/World/Acts/` module (`act.library.ts` —
  an ACT_SEAM table keyed to the six shipped travel doors fv-10, nf-10, nc-26,
  ncy-26, cr-13, tar-7, plus the act ordinal and its reward offer).
  `src/World/MapEvents/types.ts` § `TravelPayload` gains an optional
  `stationId?: ActId` — NO new `MapEventKind`, it rides `travel` (shipped W1,
  2026-08-28), so `MapEventKind` stays at 11.
  `src/World/MapEvents/handlers.ts` § `resolveTravel` (line ~298, already the
  only production caller of `completeMap`) emits the station event alongside the
  map-completion write. PERSISTED STATE: `GameState` gains a run-scoped
  `stations` slice (which stations are passed, which die was taken at each) —
  **GAME_STATE_VERSION 21 → 22**, a hop in `src/Game/game.migrate.ts` named
  **`migrateV21ToV22`** (capital `To`, matching `migrateV20ToV21` at
  `game.migrate.ts:313`), plus its pinned test. HEAD carries **10** migration
  functions (`migrateV11ToV12` … `migrateV20ToV21`), so this would be the
  **11th**. WRITER: `Character.bonusTurnDice` (`src/Character/types.ts:185`) gets
  its SECOND writer — today the only one is `combat.stage-profiles.ts:256`, a
  harness fixture. The read path is already shipped and needs no change:
  `rollUpgradeableDice` appends one duplicate-colour die per banked reward at
  `combat.upgradeable-dice.ts:230`, and the station screen must be able to
  override its fixed body/mind/heart rotation (`actRewardDieColors`) with the
  player's pick. MOBILE: a new route `app/station/index.tsx`, presenter
  `state/presenters/station.engine.ts`, wired off the travel resolution the
  exploration screen already handles. BARREL: `src/index.ts` gains additive
  exports only (`ActId`, `STATIONS`, `resolveStation`) — no rename, no removal.
  `npm run verify -w axiomancer-mobile` MUST be re-run for the barrel growth;
  UNKNOWN at pitch time, flagged as a gate not a silent pass. Steward after
  landing: `/forge` owns the seam placement, `/world-tuning` owns the offer
  contents.
- **Prior art:**
  `kb:slay-the-spire-the-board-game/rules/edge-cases-faq.okf.md` (src-002,
  confidence high) — the acts are load-bearing procedure, not flavour: players
  heal at the start of Acts II, III and IV, and Act IV is gated behind
  collecting all three keys by the end of Act III. STEAL: an act boundary is a
  scripted, resource-moving ritual the player can see coming. AVOID: the
  key-collection gate — that is a second currency this run does not need. |
  `kb:slay-the-spire-the-board-game/rules/scoring-endgame.okf.md` (src-008,
  confidence high) — a reviewer with no video-game background found
  post-Act-III progression "very unclear"; the campaign-progression pattern doc
  reads the implied fix as "a ritualized reset procedure". DISLIKED: an act
  boundary that happens without saying so — precisely what the six travel doors
  are today. | `kb:gi-joe-deck-building-game/rules/setup.okf.md` — Story Missions
  arranged into three Acts of two random missions plus a Finale each. STEAL the
  shape: a short, legible act with a named terminal beat. Our six doors and six
  pinned boss levels (3/6/9/10/12/22) already draw this shape and nothing names
  it.
- **Why now:** `axiomancer-mechanics/src/Combat/combat.upgradeable-dice.ts` lines
  ~205-218, the docblock over `actRewardDieColors`, self-declares the gap in the
  owner's own voice: "NOT A SHIPPED FEATURE YET (owner note 2026-09-03): the game
  is still in act one, so no player has ever been handed an act-reward die. This
  field is the harness PROJECTING the campaign the design intends."
  `Character.bonusTurnDice` is written at exactly one site in the whole monorepo
  — `combat.stage-profiles.ts:256` — and that site is a measurement fixture. THE
  PATH axis 5 (`plan/2026-09-02-big-numbers-overhaul.decisions.md` § THE PATH,
  line 205, item 5: "ACT REWARD DICE — a base die of the player's choice after
  each act") is measured in every baseline cell and delivered to no player.
  Meanwhile there is no `act` concept anywhere outside `src/World/Labyrinth/` —
  grep for act/actId across `src/World/` returns only labyrinth hits. The run has
  no acts, so the axis has nowhere to attach.
- **Depends on / unblocks:** Depends on nothing unshipped. UNBLOCKS P-04 (the
  grade ladder inherits a proven hop discipline and a named act to hang a
  difficulty band on). EXTENDS `plan/PHASE_CANDIDATES.md:212` [score 5.5] "The
  Capital is the new frontier" — that row asks what is behind the Capital's
  missing door; this one asks what every door the player ALREADY walks through
  should have been doing, and makes cap-9 the Fourth Station whether or not a
  seventh map exists. Cites `plan/AUDIT.md:279` (the W5/W6 numbering loop-call)
  as the reason the act ordinal must NOT be derived from the W-series phase
  labels.
- **Size:** **2-3** phases (auditor concurs; the ladder ships two rows and cuts
  the third per `[loop-call] 10`). Phase 1 (mechanics; medium risk) — the seam
  and the state: ACT_SEAM table over the six shipped doors, `stationId` on
  `TravelPayload`, the `stations` `GameState` slice, the v21→v22 hop
  (`migrateV21ToV22`) + pinned test, `resolveStation` returning the three-colour
  offer. Playable increment: the CLI crosses a door, is offered a die, takes one,
  and shows the tray grow on the next roll. Phase 2 (mobile; medium risk) — the
  screen: `app/station/index.tsx` + `state/presenters/station.engine.ts`, the
  tally readout, the three-face pick, the permanent write to
  `Character.bonusTurnDice` with the chosen colour honoured over
  `actRewardDieColors`' fixed rotation. Playable increment: a real player
  crossing nf-10 sees the First Station and fights the caverns with five dice.
  Phase 3 (mechanics + content; low risk, OPTIONAL, CUT from the ladder) — the
  Stations get voices: authored per-station narration and a Station codex entry.
- **Keep-list risk:** Touches the Dice system (LOCKED MECHANICS #3,
  `plan/bearings.md:566`). It FEEDS it and does not displace it: no face table
  changes, no change to HONE/TEMPER/SWAP or `DEFAULT_DIE_GEAR`, no change to the
  one-tray-roll-per-threat-phase constraint, no change to `validateDieGear`'s
  miss floor. The pitch supplies a player-facing WRITER for a field the shipped
  roll already READS (`combat.upgradeable-dice.ts:230`), which is the carve-out's
  own explicitly-encouraged shape: "cards, keywords, enemies and content MAY
  read, feed, spend, block, amplify or otherwise interact with all three." A
  larger tray also makes Conviction and the Surge chain MORE relevant per turn,
  not less.
- **Kill criteria:** STOP IF: (a) the seam cannot ride `travel` and a twelfth
  `MapEventKind` is required — that changes the blast radius from additive to a
  persisted-kind rewrite and the pitch should be re-scoped before the mobile
  phase; (b) a `/combat-playtest` read on a four-Station tray shows the colour
  pick is not a choice — one colour taken >80% of the time across seeded runs
  means the offer is a formality and needs asymmetric faces, not three identical
  dice in three coats of paint; (c) the tray at seven dice makes OVERHEAT
  (`OVERHEAT_CRACK_CHANCE` 0.35, colour-keyed) so punishing that the reward reads
  as a tax — the docblock already warns "it makes OVERHEAT costlier the more
  duplicates you own", and if measured round-1 crack rate past three bonus dice
  exceeds the round-1 crack rate at zero by more than double, the reward is a
  trap.
- **Done looks like:** Crossing any of the six shipped doors (fv-10, nf-10,
  nc-26, ncy-26, cr-13, tar-7) resolves a Station event; a hermetic e2e in
  `src/World/MapEvents/e2e/` asserts one Station per door, exactly once,
  idempotent on a re-consumed node. | `GAME_STATE_VERSION` is 22,
  `migrateV21ToV22` defaults the `stations` slice on legacy saves, and the
  migration has its own pinned test alongside the existing **10** migration
  functions in `src/Game/game.migrate.ts` — it is the **11th**. | A die taken at
  a Station survives a save/load round-trip and appears in the next encounter's
  tray: `rollUpgradeableDice` returns `UPGRADEABLE_DIE_COLORS.length + N` dice
  with N ids matching `-act`, in the player's chosen colour rather than the fixed
  body/mind/heart rotation. | `MapEventKind` is still exactly 11 members and no
  new persisted MapEvent kind was introduced. | `npm run verify` green in
  axiomancer-mechanics AND `npm run verify -w axiomancer-mobile` green and STATED
  as re-run in the phase record — the `@mechanics` barrel grew and the
  cross-package gate is not assumed.
- **Confidence:** 82.

---

### P-04 · The Translation of Relics

- **Hook:** Your signet does not get replaced — it gets fed, and the rite it
  grants gets worse for everyone else.
- **Lanes:** equipment (+ events, cards)
- **The fantasy:** You have carried the Gambler's Knot since the beach. It has
  never changed. Now, at a rest, you are offered a third option beside FEED and
  CUT: TRANSLATE — lay one worn relic on the stone and give it something. It
  takes a price (shillings, or VITAE, or a card off your deck) and it comes back
  a grade higher, with a new name and a bigger number printed on the rite it
  grants. The Butcher's Bill was 2 per stack when you found it. At its third
  grade it is 7 per stack, and a twenty-stack board is 140 damage in one cast.
  You never get a ninth signature. You get the same eight, and three of them are
  yours.
- **What it touches:** ENGINE. `src/Items/types.ts` — `Equipment` gains
  `tier?: 1 | 2 | 3` (additive optional, no slot change; mirrors the file's own
  "adding a kind later is additive" note at `:48-53`).
  `src/Items/relic.library.ts` — `RelicSpec` gains a per-grade
  `stat`/`value`/`name`/`description` ladder; `relicFromSpec` takes a grade;
  `getRelicById` stays 1:1 (relic identity `grantsSignature !== undefined` is
  PRESERVED). `src/Combat/combat.signature.ts:35-93` — `SIGNATURE_SKILLS` stops
  being flat literals: `getSignatureSkill(id, tier)` resolves cost/magnitude off
  a 3-row ladder; `SECOND_WIND_HEAL_FRAC` (0.12, at `:112`) and
  `CONCLUDE_DMG_PER_STACK` (2, at `:115`) become per-grade tuples.
  `src/Items/relic.library.ts:175 getSignaturesForLoadout` must return
  `{id, tier}` pairs, which widens `CombatEncounterState.signatures`
  (`src/Combat/combat.encounter.types.ts:191-200` neighbourhood) and
  `combat.engine.ts:513` + `playSignatureSkill` (`combat.engine.ts:5550-5580`,
  the cost gate). PERSISTED. `Equipment.tier` rides `Character.equipment`
  (`src/Character/types.ts:13-17, :114`), so a hop is owed — **the ladder's
  migration queue assigns this row v22→v23 with `migrateV22ToV23`** (capital
  `To`), backfilling `tier: 1` on every worn/benched relic; pinned by
  `src/Game/e2e/relic-migration.engine.test.ts`. THE DOOR.
  `src/World/RestChoice/restchoice.types.ts:20` — `RestChoiceOfferId` gains
  `'translate'` **through the generic `EventChoice` contract P-05 ships, not by
  widening the union bespoke** (`[loop-call] 3`); `restchoice.engine.ts`,
  `restchoice.content.ts` (RESTCHOICE_TUNING), and a subset of the **16
  instantiated rest nodes** in `src/World/MapEvents/content.ts` (re-derived this
  session: 5 hard-authored + 4 fishing village + 3 caverns + 3 northern city +
  1 connecting river; earlier drafts of this pitch said 18 and were wrong).
  Prices follow the ratified anvil precedent
  (`src/World/Blacksmith/blacksmith.engine.ts:57 ANVIL_VERB_PRICING`, shillings).
  BARREL. `src/index.ts` + `src/Items/index.ts` re-export the tier type — a
  deliberate public-surface add, flag it in the phase report. MOBILE.
  `axiomancer-mobile/app/rest/index.tsx` (third offer + testID),
  `components/inventory/EquipmentSlot.tsx` / `EquipDeltaPanel.tsx` / `ItemCard`
  (grade badge), `state/presenters/combat-encounter.engine.ts:2695 signaturesVM`
  + `:2824` (the rune must print the graded cost/magnitude, not the base one).
  TESTS TO REWRITE, NOT PATCH. `src/Items/e2e/relic-library.engine.test.ts` lines
  47-73 pin the lean shape and the exact stat pool (Body x2 / maxHp x2 / Mind x2
  + Heart x2) — those two `it`s are repealed-law-shaped and get re-derived;
  `ships exactly 8 relics` and `every relic grants exactly one signature … no
  dupes` STAY as the 1:1 guard. DOCS. `axiomancer-mechanics/docs/equipment.md`,
  `docs/items.md`, `docs/keyword-atlas.md` (no new keyword row; the grade names go
  in `docs/retheme-map.json` under NL-8, and are **provisional pending the filed
  naming pass**, `plan/PHASE_CANDIDATES.md:189`). Card editor: ZERO coupling
  (grep confirms no `SignatureSkill`/`Equipment`/`relic` in
  `axiomancer-card-editor/src`) — mobile verify only.
- **Prior art:** `kb:slay-the-spire-the-board-game/rules/setup.okf.md` (src-002,
  official rulebook, high) — the Act I deck list separates a `Relic` deck from a
  `Boss Relic` deck. STEAL: relic power is TIERED BY ACT, and the top tier is
  gated behind a boss, not behind a shop. DON'T STEAL: two physically separate
  decks means two content pools to author; our ladder is one relic that moves
  grade, which is a third the content for the same felt curve. |
  `kb:slay-the-spire-the-board-game/rules/actions.okf.md` (src-006, medium) —
  "Shops let players buy potions, relics, cards, and pay to remove cards;
  campfires present Rest vs Upgrade decisions." STEAL: the campfire's
  Rest-vs-Upgrade fork is EXACTLY the shape of `RestChoiceOfferId` at
  `restchoice.types.ts:20`, which already carries `rest | cut`. The third offer
  is a genre-standard third prong, not an invention. |
  `kb:patterns/campaign-progression.okf.md` (src-005, src-006 via
  heroes-of-terrinoth, high) — two independent reviewers say upgrades resetting
  each quest makes character growth "lack earned power", named as the game's
  clearest missed opportunity despite otherwise strong praise. Our failure mode
  is worse than a reset: the loadout NEVER changes past character creation. The
  same doc's arkham-horror line (src-007, medium) says campaign state lands when
  it is "tangible deck improvement" — a grade badge on a worn relic and a bigger
  printed number on its rite is the tangible form.
- **Why now:** Three live signals converge on one file. (1) `plan/AUDIT.md:533`
  `[loop-call]` "No mid/late equipment progression" poses the (a)/(b)/(c) fork
  and has sat open since 2026-09-04; (2) `plan/CRITIQUE.md:499` [HIGH] "no
  mid/late equipment or signature skills exist for THE PATH's sixth axis" is the
  owner jot it answers, still Pending; (3) `plan/CONTENT_LEDGER.md` records the
  equipment category at pass 8, commit 030e26ae, 2026-09-12, ZERO-CREATE — the
  steward re-derived the whole item economy and closed on this loop-call because
  it cannot proceed without a shape ruling. THE DECISIVE FACT is arithmetic:
  `src/Combat/combat.signature.ts` carries no dated note newer than 2026-07-17
  and `src/Items/relic.library.ts` none newer than 2026-07-18 — BOTH PREDATE THE
  BIG NUMBERS REWRITE (2026-09-02). Against
  `plan/2026-09-02-big-numbers-overhaul.prompt.md` §5.2,
  `CONCLUDE_DMG_PER_STACK = 2` on a board capped at `MAX_EFFECT_INTENSITY 30`
  cannot reach the 100-300 payoff band the rewrite mandates;
  `sig-conviction-strike` prints magnitude 3 (a rank-1 DoT number) for 8 of a
  `CONVICTION_CAP` of 12. The signature kit is the last unrescaled surface in
  combat. See `[loop-call] 7` for the ruling on `AUDIT.md:533`.
- **Depends on / unblocks:** Depends on P-05's generic offer contract for the
  door (ladder Phase 84) and on P-03 only for hop order, not for behaviour.
  UNBLOCKS a mid/late relic tier the `/adjust-equipment` steward can extend
  without a schema change. EXTENDS AND SUPERSEDES the Pending row
  `plan/PHASE_CANDIDATES.md:1598` "[score 5.5] Fill the 3 empty accessory kinds
  with new mid/late signature skills + relics" — that row assumes fork (a); this
  pitch rules against it with a reason and re-scopes. DOES NOT depend on the
  late-campaign cliff row (`plan/PHASE_CANDIDATES.md:343`) but is the cheapest
  live lever against it: at the stamp, late reads 0.8201 carried by one card at
  0.901 of plays — a graded signature is a second win path that does not touch
  the card library.
- **Size:** **3-4** phases — the auditor's honest size; the pitch claimed 2-3 and
  that estimate does not survive widening `getSignaturesForLoadout` to graded
  pairs (which widens `CombatEncounterState.signatures` and the
  `playSignatureSkill` cost gate) on top of a migration hop, a rest door and
  three mobile surfaces. The ladder ships it as three rows plus the shared offer
  contract it borrows. Phase 1 — THE GRADE (engine): `Equipment.tier`, the 3-row
  signature ladder, `getSignaturesForLoadout` returning graded pairs, the v22→v23
  hop backfilling tier 1, hermetic e2e, both cross-package verifies. Playable
  increment: nothing changes for the player (everything is grade 1) but the CLI
  dev-tools can grade a relic and the combat rune prints the graded number — the
  whole ladder is provable before a single door exists. Phase 2 — THE STONE
  (world): the `translate` offer on the shared `EventChoice` contract, priced in
  shillings off the anvil precedent, authored onto a subset of the 16 rest nodes,
  plus the mobile third option. Playable increment: a player can translate a
  relic. Phase 3 — THE GRADE ON THE FACE (mobile presentation): grade badge in
  the inventory slot/delta panel, graded copy in the signature-rune info sheet,
  the three per-grade relic names. Playable increment: the player can SEE which
  grade they carry without opening a rune popup.
- **Keep-list risk:** Touches Conviction + signature skills (keep-list, and
  LOCKED MECHANICS item 1). It FEEDS them and cannot displace them: the grade
  ladder only ever moves a `SIGNATURE_SKILLS` cost or magnitude, never removes a
  signature, never no-ops a cast, never routes around
  `CombatEncounterState.conviction`. The 8-member `SignatureSkillId` union is
  UNCHANGED and the 1:1 relic-to-signature mapping is preserved and stays
  test-pinned. Net effect on the locked system is more Conviction pressure, not
  less: a grade-3 rite is worth saving for. Also touches the 5-slot equipment
  system — `SLOT_CAPACITY` and `EquipmentLoadout` are untouched; only a piece's
  grade changes.
- **Kill criteria:** STOP if (1) the graded signature becomes the whole game — a
  `/combat-playtest` matrix run with grade-3 relics shows a single signature
  above ~60% of all plays at any stage, reproducing the pre-D33 dominance the
  attribution fix just moved off signatures onto one card; (2)
  `getSignaturesForLoadout` returning graded pairs forces a change to
  `CombatEncounterState`'s persisted-adjacent shape needing a SECOND migration
  hop beyond the one this row claims — that means the tier belongs on the
  character, not the item, and the design is wrong; (3) the third rest offer
  cannot be priced without touching engine constants (threat damage, Conviction
  economy) — a hand-tuned surface; hand it back and stop; (4) the
  `relic-library.engine.test.ts` rewrite cannot keep BOTH the 8-relic pin and the
  no-duplicate-signature pin green, which would mean the grade ladder is secretly
  breaking 1:1.
- **Done looks like:** `npm run verify -w axiomancer-mechanics` green, plus
  `npm run verify -w axiomancer-mobile` and
  `npm run type-check -w axiomancer-card-editor` (the barrel widened, so both run
  even though the editor has no equipment coupling). | `GAME_STATE_VERSION` reads
  the value this row claims in the ladder's migration queue; a prior-version save
  loads with every worn and benched relic at `tier: 1`, pinned by a new case in
  `src/Game/e2e/relic-migration.engine.test.ts`; no save-shape change is possible
  without the hop. | `src/Items/e2e/relic-library.engine.test.ts` still asserts
  exactly 8 relics and exactly 8 distinct `grantsSignature` values with no
  duplicates — the 1:1 identity rule survives the change in the test suite, not
  just in a comment. | A hermetic e2e at
  `src/Combat/e2e/signature-grades.engine.test.ts` casts one signature at each of
  the three grades from a seeded RNG and asserts the printed number equals the
  applied number at every grade. | From a fresh run: reach a rest node, choose
  TRANSLATE, pay, and see the worn relic's name and grade change on the inventory
  tab AND the signature rune's cost/magnitude change on the next combat screen —
  one player-visible session, no dev menu.
- **Confidence:** 78.

---

### T2 · THE PARISH KEEPS ACCOUNTS

---

### P-05 · Every Door Asks

- **Hook:** Thirty-nine of every hundred nodes on this road happen TO you. After
  this, every one of them asks you something first.
- **Lanes:** events (+ maps, cards)
- **The fantasy:** The mine gallery fills with bad air. Today that is two damage;
  after this it is: go through fast and take the damage, go back and lose the
  node, or brace the props with the timber you gathered and take nothing. Three
  lines, no dice, no minigame, and one of them greyed out because you already
  spent the timber. The ribbon-scraps node in the Capital does not just hand you
  the scraps. It asks whether you take them off the ground or off the body.
  Nothing is invented — the rest node and the reliquary already work exactly this
  way, a plain slate of offers and one irreversible pick. This takes that shape
  out of two bespoke engines and makes it the thing an event IS. And the anvil
  stops being one door on one map in a world of a hundred and thirty-one nodes.
- **What it touches:** NEW
  `axiomancer-mechanics/src/World/EventChoice/{eventchoice.types.ts, eventchoice.engine.ts}`
  — the `offer → (optional sub-phase) → outcome → done` contract lifted verbatim
  from the two shipped instances and made generic:
  `src/World/RestChoice/restchoice.types.ts:19-49` (two offers, `cost`,
  `disabledReason`, one `cut-pick` sub-phase) and
  `src/World/LootCacheChoice/lootcachechoice.types.ts:20-46` (three offers, no
  picker). Both retrofit onto it; both keep their ids, prices and outcomes
  byte-identical. `src/World/MapEvents/types.ts` — `HazardPayload` (`:118`) and
  `GatheringPayload` (`:64`) gain an optional `offers` array; absent means
  today's behaviour, so the 23 authored hazard and gathering entries need no
  rewrite before they are ready. `src/World/MapEvents/handlers.ts` — the payout
  branches learn to hand a session to the host instead of settling inline.
  `src/World/MapEvents/content.ts:655` `FV_BLACKSMITH_NODES` — the one-node anvil
  placement, ruled a fixed placement in Phase 60 and never revisited; a per-map
  kind floor is the honest place to reopen it. Mobile:
  `state/presenters/rest.engine.ts` + `rest.copy.ts` and `cache.engine.ts` +
  `cache.copy.ts` collapse onto a shared `state/presenters/eventchoice.engine.ts`;
  `app/rest/index.tsx` and `app/cache/index.tsx` collapse onto one offer-sheet
  component — both already render an offer list with a disabled reason, which is
  the root of the `/rest` finding at **`plan/AUDIT.md:253`** (the line "`/rest`
  greying an option for two possible reasons while naming only one", a sub-clause
  inside the `[loop-call]` row headed at `:247`). `skills/world-tuning.md`
  inherits the per-map kind floor as a lever once the shape lands; `skills/forge.md`
  inherits new-kind authoring per THE CONTENT LIFECYCLE SPLIT
  (`plan/bearings.md:261`). No `GAME_STATE_VERSION` hop: sessions are transient,
  exactly as `RestChoiceSession` and `LootCacheChoiceSession` are today.
- **Prior art:** `kb:BoardGames/patterns/randomness` (aeons-end src-004,
  confidence high) — no-shuffle deterministic ordering is praised precisely
  because it converts a loss into an accountable planning failure: "it wasn't a
  bad draw, it was a bad choice." The whole pitch in one line. Steal the
  principle, not the no-shuffle rule: give the player a lever over the roll so a
  bad outcome traces to a legible decision. | `kb:BoardGames/patterns/randomness`
  (spirit-island src-005, confidence high) — the base box's thin fear/blight pool
  "repeat[s] often", making rounds predictable enough to solve in advance.
  DISLIKED, and directly ours. Same doc's counter-warning (ark-nova src-008,
  high): a 212-card deck makes plans "not pan out", so adding MORE random entries
  is the wrong fix; the rewarded fix is a lever. |
  `kb:slay-the-spire-the-board-game/rules/setup` (src-002, confidence high) — at
  the start of Acts II and III the game replaces the Act decks for Encounters,
  Elites, Summons AND Events. Steal the per-act event pool as the sequencing
  target once the shape exists. DISLIKED, same game
  (`kb:BoardGames/patterns/campaign-progression` src-008, high): a reviewer found
  post-Act-III progression "very unclear" without outside knowledge — whatever
  floor is set per map must be visible on the map, not in a tuning table.
- **Why now:** The brief's §3 event-spread figure is wrong and so is the reader
  digest's, and the ladder needs the corrected numbers before it sequences
  anything. Re-derived at HEAD: `grep -o "kind: '...'"`
  `src/World/MapEvents/content.ts` returns 186 because `kind:` appears at BOTH
  the pool-entry and the payload level — 186 is 2 × 93, and "interaction/cutscene
  28 each, blacksmith at 2" is that double-count read straight. The structural
  count (`kind: '<k>', weight:` on one line) is **95 authored entries**
  (re-verified this session); resolving the factory pools (`fvRestPool`,
  `ncEncounterPool`, `ncyGatherPool`, `crGatherPool` and siblings, which a
  `const X: MapEventPool =` grep misses) gives roughly **132 INSTANTIATED
  entries** over 131 gauntlet nodes. Live spread: encounter 26, interaction 17,
  **rest 16** (re-derived exactly this session: 5 hard-authored + 4 + 3 + 3 + 1
  from four factories), cutscene 14, gathering 13, loot-cache 13, hazard 10,
  narration 9, village 7, travel 6, blacksmith 1. Two further corrections: every
  one of the 131 gauntlet nodes carries a pool (`registerMapEventContent`,
  `content.ts:2211`) — the "42 poolless nodes / 32%" figure is the same
  factory-blind grep — and `cap-5` (`content.ts:2066`) is the only two-entry pool
  in the world, so 130 of 131 nodes have a pool with nothing to roll between. The
  lopsidedness that is real: blacksmith on 1 node of 131 and 1 map of 7;
  town-across-river missing five of eleven kinds; and 52 of 132 entries (39%) —
  cutscene 14, narration 9 (authored as leaf monologues by contract,
  `types.ts:139-152`), travel 6, gathering 13, hazard 10 — resolving with zero
  player decision. `plan/PHASE_CANDIDATES.md:598` is the closed fold-candidate
  whose own text names what was never answered: "what an encounter event's
  choice+effect data shape looks like (is it a static option list with numeric
  effects, or does it carry conditionals/rolls…)". Phases 58-65 and 76 answered
  it twice, bespoke, and never generally.
- **Depends on / unblocks:** Depends on nothing hard; strictly better after P-06,
  whose `requires` clause is what lets an offer be greyed out for a stated reason
  rather than hidden. MUST PRECEDE P-02's `amend` offer and P-04's `translate`
  offer (`[loop-call] 3`). Extends, does not re-pitch, the CLOSED candidate at
  `plan/PHASE_CANDIDATES.md:598` — new evidence (the corrected spread, the 52
  decisionless entries, two bespoke implementations of one shape) and new scope
  (generalize rather than fold). Answers the parked quest-board thesis at
  `axiomancer-mechanics/braindump/2026-06-13-quest-board-micro-games.md`
  inverted: its complaint was eight fictions sharing one decision shape; ours is
  eleven fictions sharing none. Unblocks a per-act or per-continent event pool,
  which is where the Aporia's weighted default pools
  (`src/World/Labyrinth/labyrinth.pools.ts`) already point.
- **Size:** **3-4** phases — the auditor's honest size; the pitch claimed 2-3 and
  that does not survive retrofitting two shipped price-calibrated engines onto a
  generic contract with byte-identical snapshot proof, collapsing two mobile
  routes onto one component, adding offers to two payload types, and authoring
  ten node slates. Phase 1 — the shape: `EventChoice` types and engine,
  `RestChoice` and `LootCacheChoice` retrofitted with zero behaviour change
  (snapshot-pinned), and the two mobile screens collapsed onto one offer sheet.
  Playable increment: nothing visibly changes and the `/rest` double-reason
  finding at `plan/AUDIT.md:253` is closed by **naming which of the two reasons
  binds, per the recommended option in
  `axiomancer-mobile/docs/reports/UI_FRESH_EYES_2026-09-12.md` section 4** — the
  `:247` row explicitly forbids the loop deciding those six product calls
  silently, so this is not a side effect. Phase 2 — the decisions: `offers` on
  hazard and gathering, and ten authored nodes across the northern continent
  given a real three-line slate. Playable increment: the mine gallery asks.
  Phase 3 — the floor: a per-map minimum kind spread, the anvil off `fv-21`
  alone, and town-across-river's five missing kinds; then `/world-tuning` owns
  the weights and `/forge` owns any twelfth kind.
- **Keep-list risk:** None to the five keep-list systems. The near-miss to guard:
  a hazard "offer" must resolve as a stated cost, never as a second combat
  resolution — hazard-pattern combat stays the one place a fight happens, the
  same line the 2026-08-10 fold ruling drew. Do not price any offer in
  Conviction, Surge or dice faces; offers are priced in VITAE, shillings, items,
  time (a forfeited node) and alignment, all already world currencies.
- **Kill criteria:** Stop if the retrofit of `RestChoice` and `LootCacheChoice`
  cannot be made behaviour-identical under a snapshot test. Those two carry the
  shipped shilling calibration (`card.removal.pricing.ts`, Phase 52f) and the
  goodwill counter Phases 64-65 pay back; a generalization that moves one price
  has silently reopened a tuning phase and should be **abandoned rather than
  absorbed** — and the fallback is written into ladder Phase 84's own row, not
  only into a loop-call. Stop also if authoring three offers per node costs more
  than the node is worth: if the first ten read as three flavours of one payout,
  the shape is a template and not a decision, and the honest outcome is to ship
  the harness, the `/rest` fix and the blacksmith spread, and leave the 52
  decisionless entries alone.
- **Done looks like:** `RestChoice` and `LootCacheChoice` both run on the shared
  `EventChoice` contract, and a snapshot test over every offer id, cost,
  `disabledReason` and outcome field proves nothing moved — including the 5 + 5
  per-removal price and the `MIN_COMBAT_DECK_SIZE` 12 floor. | At least ten
  authored nodes across at least two maps resolve to a real slate of offers, each
  with a stated cost and a stated reason when unaffordable; a hermetic e2e
  commits each offer on one node and asserts three distinct outcomes. |
  `app/rest/index.tsx` and `app/cache/index.tsx` render from one offer-sheet
  component, and `plan/AUDIT.md:253`'s finding closes with a screen test
  asserting the named reason matches the binding one, and the phase record cites
  which of the two the UI-fresh-eyes report's section 4 recommended. | The
  per-map kind spread is asserted by a content-parity test in
  `src/World/MapEvents/e2e/`, in the manner of the existing
  `getShadowedNodeOverrideKeys` guard (`resolve-map-event.ts:108`), and the phase
  brief states the before and after spread over all instantiated entries. |
  `GAME_STATE_VERSION` asserted unchanged; both verify gates green; the corrected
  event spread is written into `axiomancer-mechanics/docs/gameloop.md`, which
  carries no event-spread figure today, so the next session does not re-derive
  the double-count.
- **Confidence:** 70.

---

### P-06 · The Parish Remembers

- **Hook:** Every mercy and every skimmed net is an entry, and somewhere down the
  road a stranger reads your account back to you before you have said a word.
- **Lanes:** story (+ events)
- **The fantasy:** You spared the Mournful Gull at the breakwater. Forty leagues
  north a toll-sergeant you have never met declines to search your satchel, and
  says only: they wrote ahead. You broke the strike in the fishing village; the
  Capital's Herald reads your ribbon and gives you the shorter line and the worse
  room. Nothing announces itself as a consequence screen. The world simply knows,
  and speaks to you in a register you earned. The player learns, once, that a
  choice left the map with them — and every subsequent choice is made under that
  suspicion.
- **What it touches:** ENGINE, additive and non-persisted:
  `axiomancer-mechanics/src/NPCs/types.ts` — new `DialogueChoice.requires`
  clauses (`faction: { id, op, value }`, `goodwillAtLeast: { map, n }`,
  `codexEntry: string`, `regionSpared|regionExploited: MapName`), each a
  hidden-when-unmet filter exactly like `requiresAlignment`.
  `axiomancer-mechanics/src/NPCs/dialogue.ts:38-50` — `DialogueContext` grows the
  four read-only slices (today it carries only activeQuests / completedQuests /
  flags / alignment / lastSeenAlignmentCellId); `visibleChoices`
  (`dialogue.ts:56-70`) grows four predicate lines. Callers that build the
  context: `axiomancer-mechanics/src/World/dialogue.runtime.ts`,
  `src/Game/store.ts`, `axiomancer-mobile/app/dialogue/index.tsx` + its
  presenter. NO new persisted state — `GameState.factionReputations`,
  `mapGoodwill`, `regionConsequences` and `codex` all already ship
  (`src/Game/types.ts:131-149`), so no `GAME_STATE_VERSION` hop. GUARD: extend
  `src/World/narrative-reachability.ts` with a fifth audit — a flag written by a
  `setFlag`/`flagSet` and read by no `requires` anywhere is a DEAD CONSEQUENCE
  and fails the World suite, the same way `sceneryAsPeople` fails today. CONTENT:
  reckoning branches authored into `src/World/Continents/*/npcs.ts`,
  `Continents/*/maps.ts` and `src/World/MapEvents/content.ts` — **that authoring
  is routed to `/adjust-npcs`, not to a ladder row** (`[loop-call] 15`). Barrel:
  four new exported types through `src/NPCs/index.ts` and `src/index.ts:541`.
- **Prior art:** `kb:heroes-of-terrinoth/reception/better-if.okf.md` (src-005,
  src-006) — steal the prescription verbatim: "Link quests into optional short
  arcs with a small persistent choice, scar, or branch; avoid converting the game
  into a full legacy campaign." Both reviewers independently named missing
  quest-to-quest continuity as the clearest missed opportunity while praising the
  short form. DISLIKED: not the absence of a campaign layer but growth that
  visibly evaporated between sessions. |
  `kb:arkham-horror-the-card-game/rules/scoring-endgame.okf.md` (src-007) — "the
  outcome of each scenario has lasting implications both on your character and
  also on the town of Arkham itself." Steal the two-address model: the
  consequence lands on the PLACE as well as the person. Steal also its cost side
  (src-003, trauma) so the ledger is not reward-only. |
  `kb:mage-knight/reception/better-if.okf.md` (src-012) — the complaint we are
  answering: "Narration as campaign or events are missing" from an
  otherwise-praised optimization engine. Players who found the puzzle underthemed
  wanted connective tissue, not more content.
- **Why now:** Grounded at HEAD. The tree writes **46 distinct dialogue flags**
  (`setFlag: '<id>'` across `src/World/Continents/*/npcs.ts`,
  `Continents/*/maps.ts`, `src/World/MapEvents/content.ts`) and READS only **15**
  (`requires: { flag: … }`) — 35 flags are set and never read again, including
  every branch of the strike (`union_supporter` / `strike_breaker`), the widow
  (`widow_mediator` / `widow_vengeance_supporter`), the forest
  (`forest_conservation_supporter` / `forest_exploitation_supporter`) and the
  Capital selection (`capital-selection-witnessed`). Separately,
  `src/Enemy/enemy.library.ts` writes 11 befriend flags via `flagSet:` and
  exactly ONE (`befriended-little-belle`, read at
  `src/World/Continents/Coastal-Village/maps.ts:277`) is ever read.
  `src/Faction/faction.library.ts` declares 4 factions and 4 enemies carry
  `factionDeltas`; `src/NPCs/dialogue.ts:38-50` proves NO dialogue gate can read
  a faction, a goodwill tally, a codex entry or a spared region — the state
  persists and nothing in the world can see it. This EXTENDS rather than repeats
  `plan/AUDIT.md:380` (`[needs-user-call]` thin NPC staging): the answer to a map
  with one voice is not a second body, it is making the one voice know things.
- **Depends on / unblocks:** Depends on nothing unshipped. MUST PRECEDE P-05's
  authored offer slates and P-07's hard-placed consequences, so the CI guard that
  fails on a flag nobody reads exists before thirty-five more are written.
  UNBLOCKS every reckoning branch `/adjust-npcs` will author on its own cadence.
  Cites as dependency, does not re-pitch: `plan/PHASE_CANDIDATES.md:212` (the
  Capital's missing door) and the Pending row "[5.0] Retheme the six
  Northern-Forest dialogue trees to spec 34 §2 register" — the retheme pass
  should land on trees that already have the new branches, not before.
- **Size:** **3** phases as pitched; **the ladder promotes only the engine
  phase** and routes the two content phases to `/adjust-npcs` per
  `[loop-call] 15`, because brief §7 forbids pitching what a steward does on its
  own cadence. Phase 1 (engine, mechanics-only, PROMOTED): the four `requires`
  clauses, the `DialogueContext` widening, `visibleChoices` predicates, the
  dead-consequence audit in `narrative-reachability.ts`, hermetic e2e per clause,
  and the dead-flag count pinned as a **descending ceiling**. Playable increment:
  nothing visible yet, but the audit immediately names all 35 dead flags in CI
  and no future flag can be written without a reader. Phase 2 (content, ROUTED):
  reckoning branches on the five staged Northern voices — The Delver, The
  Boatwoman, The Sweetheart, The Herald, The Ribbon-Picker — each reading one
  coastal decision. Phase 3 (content, ROUTED): Captain Blackwater and the
  Chronicler read faction standing; the coastal and forest cast gain the
  receiving half; the ceiling drops.
- **Keep-list risk:** None. Touches no combat system. The deckbuilding core, the
  Dice system, Conviction, the Surge meter and the 5-slot loadout are not read,
  written or referenced. The only engine surface is dialogue gate evaluation,
  which is pure and hermetic.
- **Kill criteria:** Stop if Phase 1's audit shows the 35 dead flags are dead
  because the branches would be UNREACHABLE — i.e. if the maps that could read a
  coastal flag are all past a point the player reaches with a fresh save in the
  majority of runs, the payoff never fires and the correct fix is staging, not
  gates. Also stop if `DialogueContext` cannot be built in the mobile presenter
  without pulling reducer state into a view-model (that would violate the
  engine/presenter split and means the plumbing belongs in
  `dialogue.runtime.ts` first). And abandon the faction clause specifically if
  the 4-faction library with 4 carrier enemies proves too thin to gate on — fall
  back to goodwill and `regionConsequences`, which have real per-map spread.
- **Done looks like:** `npm run verify -w axiomancer-mechanics` and
  `-w axiomancer-mobile` green (the diff touches `src/World/**` and
  `src/NPCs/**`, so the CI classifier routes both). | A hermetic e2e per new
  clause in `src/NPCs/e2e/` or `src/World/e2e/` proving hidden-when-unmet and
  visible-when-met, with deterministic RNG from `src/test-utils/rng.ts`. | The
  narrative-reachability audit fails a deliberately-added flag that nothing
  reads, and the World suite pins the current dead-flag count as a descending
  ceiling — that ceiling is this row's measurable increment, not a later content
  row's. | `GAME_STATE_VERSION` unchanged and asserted unchanged in the phase's
  test — no new persisted field. | At least one authored branch per clause, each
  gated on a slice written on a DIFFERENT map from where it is read, verified by
  an e2e that walks the two nodes in one seeded run.
- **Confidence:** 80.

---

### P-07 · The Tally-Man

- **Hook:** You can have it now. He writes your name in a book, and the book
  walks after you.
- **Lanes:** events (+ cards, equipment)
- **The fantasy:** A man with a folding desk sits at a crossroads and offers you
  exactly what you cannot afford: the heal, the hone, the card, the eight
  shillings for the ferry. No dice, no minigame. Three terms, all ruinous in
  different currencies, and one refusal that costs you nothing but the thing you
  wanted. You take it. Nothing happens. Nothing happens for two maps. Then a
  collection finds you on a road you chose, and it is not a fight — it is a
  second page of the same ledger. Pay the principal in shillings, or pay it in
  ARREARS: the curse is written into your deck for the rest of the run, and
  buying it back out costs the rest-node cut you were saving for something you
  actually chose. Debt is the first thing in this game that gets worse while you
  are not looking at it.
- **What it touches:** NEW
  `axiomancer-mechanics/src/World/DebtChoice/{debtchoice.types.ts, debtchoice.engine.ts, debtchoice.content.ts, index.ts}`
  + `e2e/` — built to the shipped two-way sandbox contract, not a new one:
  `offer → outcome → done`, engine never reads `GameState`, host settles at claim
  time. The two live precedents are `src/World/RestChoice/restchoice.types.ts:19-49`
  and `src/World/LootCacheChoice/lootcachechoice.types.ts:20-46`.
  `src/World/MapEvents/types.ts:27-38` — `'debt'` becomes the twelfth
  `MapEventKind` (verified 11 at HEAD); `DebtPayload` (principal, offered terms,
  the creditor's name); a `ResolvedEvent` arm;
  `src/World/MapEvents/handlers.ts` gets the twelfth branch. `src/Game/types.ts`
  — an `arrears` slice (principal, term, taken-on-map, comes-due-after-N-nodes).
  This is a NEW PERSISTED KIND, so a hop is owed — **the ladder's migration queue
  assigns this row v23→v24 with `migrateV23ToV24`** (capital `To`) and a pinned
  migration test, the discipline THE PIPELINE LIBERATION keeps walled
  (`plan/bearings.md:352`). `src/Cards/library/starters.cards.ts:257` — the
  `arrears` curse is ALREADY PRINTED (mind; FREE line: recoil 2 and mill 2) and
  already used as a boss-stage `curseCardId` four times in
  `src/Enemy/enemy.library.ts`. The collection writes its id into
  `Character.combatRewardCards` (`src/Combat/combat.deck.ts:78`, duplicates
  deliberately kept), and `removeCardFromCombatDeck`
  (`src/Cards/card.removal.ts:143`, price 5 + 5 per removal, floor
  `MIN_COMBAT_DECK_SIZE` 12) is the shipped way to buy it back out at a rest.
  `src/World/Blacksmith/blacksmith.engine.ts:57` — HONE 3 / TEMPER 5 / SWAP 8
  shillings become a term the Tally-Man can extend on credit, the only route by
  which the die-gear economy reaches a player not standing on `fv-21` (the single
  blacksmith node in the world, `src/World/MapEvents/content.ts:655`). Mobile:
  `app/debt/index.tsx`, `state/debt/store-actions.ts`,
  `state/presenters/debt.engine.ts` + `debt.copy.ts`, the interception in
  `state/actions.ts` beside the `loot-cache` one at ~1539, the switch arm in
  `state/presenters/event.engine.ts:621-653`, and `KIND_TO_NODE_TYPE` in
  `state/presenters/exploration.engine.ts:184` — an exhaustive
  `Record<MapEventKind, NodeType>` (verified at HEAD), so the compiler names
  every mobile site the new kind breaks.
- **Prior art:**
  `kb:dead-of-winter-a-crossroads-game/rules/colony-crisis-crossroads` (src-001)
  — when the colony cannot pay food, no food is removed, one PERMANENT starvation
  token is added, and morale falls by the total starvation tokens then in play.
  Steal the compounding shape: the miss is not a flat fine, it is a permanent
  marker that makes the next miss worse. Steal also the mercy — the debt is paid
  in a currency the player can see and plan around, never in a hidden roll. |
  `kb:BoardGames/patterns/campaign-progression`
  (arkham-horror-the-card-game src-007, confidence medium) — completing a
  scenario "enables you to purchase better cards for your deck" while scars and
  consequences also persist, so campaign state reads as tangible deck change in
  BOTH directions. Our deck already has both directions shipped and neither is
  reachable from the world. | `kb:BoardGames/patterns/randomness` (aeons-end
  src-004, confidence high) — deterministic ordering is praised because it turns
  a loss into an accountable planning failure. The Tally-Man must therefore be a
  stated schedule, never a random collection roll. DISLIKED, same doc
  (heat-pedal-to-the-metal src-005/006/007): mechanisms that impose an outcome
  the player did not earn read as "too forgiving or artificial" — exactly what an
  unannounced debt would be.
- **Why now:** THE PATH's axis 4 is unreachable and its axis 3 has no door. The
  Anvil sells HONE 3 / TEMPER 5 / SWAP 8
  (`src/World/Blacksmith/blacksmith.engine.ts:57`) at exactly ONE node in 131 —
  `fv-21`, the sole entry in `FV_BLACKSMITH_NODES`
  (`src/World/MapEvents/content.ts:655`) and the sole `blacksmith` entry in the
  live kind spread. Card upgrades are 540 lines with zero mobile consumers
  (`src/Cards/card-upgrades.ts`). Meanwhile the only debt in the whole tree is
  `LabyrinthProgress.assertionDebt` / `settledDebt`
  (`src/World/Labyrinth/labyrinth.engine.ts:255, :375`), locked behind a
  continent absent from `createStartingWorld()`'s catalogue and dev-menu-only
  under T's binding access ruling
  (`axiomancer-mechanics/specs/world/W-01-aporia-labyrinth-continent.md` §
  Access). The best-designed economy in the repo is sealed in the one place a
  player cannot walk. The brief's §9 provocation 5 asks which kinds should read
  debt; at HEAD, none can, because there is no debt outside the labyrinth to
  read.
- **Depends on / unblocks:** Depends on P-06 for the predicate pattern and its CI
  guard, and on P-05 for the offer contract. **It does NOT get a map-event
  placement gate** — verified at HEAD, `src/World/MapEvents/types.ts` carries no
  `requires`, `gate` or `condition` field anywhere, and P-06's `requires` family
  lives in `src/NPCs` on a different surface. The collection node is therefore
  **hard-placed with a stated no-op**, written into ladder Phase 107's acceptance
  line (`[loop-call] 4`). Extends, does not re-pitch, the CLOSED fold-candidate
  at `plan/PHASE_CANDIDATES.md:598`. Feeds the standing mid/late progression
  loop-call at `plan/AUDIT.md:533` from the world side rather than the item side.
- **Size:** **3-4** phases — the auditor's honest size; the pitch claimed 2-3 and
  that does not survive a twelfth `MapEventKind` end-to-end (engine module,
  payload type, handler branch, `ResolvedEvent` arm, a version hop with a pinned
  migration, a mobile route, presenter, copy file, store actions, plus the
  exhaustive `Record<MapEventKind, NodeType>` the pitch itself notes will break
  every mobile site). **The ladder splits it accordingly into 106a (engine, CLI-
  provable) and 106b (the mobile surface).** Phase 1a — the ledger: `DebtChoice`
  engine on the shipped two-way sandbox contract, `debt` as the twelfth
  `MapEventKind`, the `arrears` slice, the v23→v24 hop with `migrateV23ToV24` and
  its pinned test. Playable increment: the CLI takes a loan and the character
  sheet carries it. Phase 1b — the desk: the `/debt` route, presenter, copy file,
  store actions, the `Record<MapEventKind, NodeType>` fix at
  `exploration.engine.ts:184`, and three authored crossroads nodes. Playable
  increment: a phone player takes a loan they cannot afford. Phase 2 — the
  collection: the follow-through event, the ARREARS write into
  `combatRewardCards`, and the rest-node buy-back relabelled so the price reads
  as settling a debt rather than a generic cut. Phase 3 (attended design session)
  — terms that read THE OATHS: a high-CREED debtor offered a vow, a low-TROTH
  debtor offered someone else's name.
- **Keep-list risk:** Touches the deckbuilding core and the Dice system, and
  feeds both. The curse write ADDS a card to `combatRewardCards` — the same slot
  every combat reward already uses — and the shipped `removeCardFromCombatDeck`
  is its inverse, so the debt makes card removal MATTER rather than routing
  around it. The credit term on HONE/TEMPER makes the die-gear economy reachable
  off `fv-21` instead of displacing it. Hard line: the Tally-Man never sells
  Conviction, never sells Surge, never sells a signature.
- **Kill criteria:** Stop if the collection cannot be made to land at a legible
  moment. A debt that comes due mid-boss-approach is a mugging; a debt a player
  dodges forever by not walking one road is a joke. If two authoring passes
  cannot produce a schedule readable off the map BEFORE the player borrows, cut
  the persisted ledger and ship the Tally-Man as a single-node instant trade — a
  curse for a boon, settled on the spot, no hop. Stop also if ARREARS (recoil 2,
  mill 2) prices out as strictly worse than declining every offer at every stage:
  `/deck-tuning` owns that number, and if it cannot be made a real dilemma the
  debt is a tax, not a choice.
- **Done looks like:** `'debt'` is the twelfth `MapEventKind`; the exhaustive
  `Record<MapEventKind, NodeType>` at `exploration.engine.ts:184` compiles, and a
  node carrying the kind renders its own icon on the exploration map. |
  `GAME_STATE_VERSION` reads the value this row claims in the ladder's migration
  queue, `migrateV23ToV24` defaults the arrears slice for every prior save, and a
  pinned migration test loads a prior-version fixture and asserts the default. |
  A hermetic e2e takes a loan on one map, walks the authored distance, resolves
  the collection, and asserts `arrears` is present in
  `buildCombatDeck(player, flags)`; a second pays the principal in shillings and
  asserts it is not. | **A hard-placed collection node resolves to a stated no-op
  with authored narration when the arrears slice is empty, pinned by an e2e that
  walks the node on a debt-free save** — no `requires` primitive exists and none
  is built by this ladder. | A rest node removes the `arrears` copy through the
  shipped `removeCardFromCombatDeck` path at 5 + 5 per removal with the
  `MIN_COMBAT_DECK_SIZE` floor intact — no bespoke removal route added. | Both
  packages' verify gates green; the `/debt` route has a screen test;
  `docs/gameloop.md` and the CLI readout name the new kind.
- **Confidence:** 72.

---

### P-08 · The Seventh Door

- **Hook:** The Capital's wall has one more gate than the map admits, and it
  opens on a house that has been finished since July.
- **Lanes:** maps (+ enemies, run)
- **The fantasy:** The Factor's court closes and you walk one column further than
  any run has ever walked. cap-10 is not a village and not a boss: it is a door
  in a wall with no number on it, and the ground past it stops being a road. The
  Aporia's first act opens as a PLACE on the exploration tab, reached by the same
  travel event that carried you out of the fishing village. No dev menu. No act
  picker. The house admits you because you walked to it.
- **What it touches:** ENGINE: `src/World/index.ts:12-44` `createStartingWorld()`
  gains a third catalogued Continent for `'labyrinth-continent'`
  (`availableMaps []`, `lockedMaps` the three acts) — this is the single line
  that stops `changeContinent` (`world.reducer.ts:189`) hard-no-op'ing on an
  uncatalogued name; verified at HEAD that the function catalogues coastal and
  northern only, and its own docblock says the labyrinth "stays deliberately
  uncatalogued". `src/World/Continents/Northern-Continent/maps.ts:933-968`
  `theCapital` gains cap-10 at location [6,0] with cap-9 → cap-10; cap-9 stops
  being terminal. `src/World/MapEvents/content.ts` `THE_CAPITAL_POOLS` (`:2185`)
  gains a seventh `travel` payload (`destinationContinent 'labyrinth-continent'`,
  `destinationMap 'aporia-colonnade'`) — the exact nc-26/ncy-26/cr-13/tar-7 shape
  at `:1252/:1581/:1835/:1982`. PINS:
  `src/World/e2e/map-traversal.engine.test.ts:70-82` (column law: every edge runs
  column x → x+1) and `:59-65` (terminals live in the final column) both stay
  green because the new node is one column forward and alone; `:330`'s capital
  beat pin goes 5 → 6. MOBILE: `state/exploration-maps/the-capital.layout.ts`
  (+cap-10, `regionProgress` currently "Map v of v"), a new
  `aporia-colonnade.layout.ts`, the `index.ts` REGISTRY,
  `__tests__/layout-engine-parity.test.ts`. `state/labyrinth/store-actions.ts:107-137`
  — `enterLabyrinthAction` stops being the entry point and
  `labyrinthUi.session.savedWorld` (`state/store.ts:144`) retires with it.
  CONTRACT: no `@mechanics` barrel change, no new `MapEventKind` (11 stays 11),
  no new persisted field; `GAME_STATE_VERSION` is **asserted unchanged, never a
  literal** — `GameState.labyrinth` is already optional/lazy, `mapStates` already
  preserves departed maps, and `labyrinthUi` is a non-persisted mobile slice.
  LEVEL HAZARD: The Factor is pinned L22 (`MapEvents/content.ts:2170`
  `CAP_BOSS_LEVEL`) and the Doorwarden L8
  (`src/World/Labyrinth/labyrinth.pools.ts:41-45` `BOSS_LEVEL` act1 8 / act2 12 /
  act3 16) — a 14-level drop across the door. `[loop-call] 6`: the loop re-pins
  the three act bosses upward (24/28/32 as an opening bid) and routes calibration
  to `/world-tuning`; do not ship the door with the ladder running backwards.
- **Prior art:**
  `kb:slay-the-spire-the-board-game/reception/better-if.okf.md` (src-008) — a
  reviewer found moving forward after Act III "very unclear"; the doc's own
  design implication is that a roguelike needs "a ritualized reset procedure:
  what persists, what resets, what unlocks". STEAL: make the door an ordinary
  travel event, not a mode switch. DISLIKED: progression legible only to someone
  who already knows the source material. | `kb:gloomhaven/rules/overview.okf.md`
  (src-003) — a persistent campaign whose spine is unlocking locations through
  campaign decisions. STEAL: the Aporia arriving as an unlocked map on the same
  catalogue as everywhere else, not as a parallel session. |
  `kb:mage-knight/rules/overview.okf.md` (src-006) — players play cards "to move
  around the map and explore it"; one movement verb covers the whole board.
  STEAL: one traversal verb from fv-1 to ap1-1.
- **Why now:** `plan/PHASE_CANDIDATES.md:212` [score 5.5] "The Capital is the new
  frontier — no door onward yet" files the hole and deliberately declines to name
  a destination ("no door was (or should be) wired from the-capital into the
  labyrinth by this pass"); this pitch supplies the destination that row left
  open and the sequencing it asked a `/world-spec` tick to decide — an extension,
  not a re-pitch. `axiomancer-mechanics/specs/34-dark-fantasy-campaign.md:837`
  already declares the arc "Coastal → Northern Forest → the Aporia → the last
  continent". `plan/steps/01_build_plan.md:2594` (Phase W6) shipped the Capital
  terminal on purpose. Live tree: 6 travel doors exist
  (`content.ts:157/983/1252/1581/1835/1982`), 0 travel payloads target
  `labyrinth-continent`, and the Aporia's only player-reachable entry is
  `components/DebugWorldTravel.tsx:124`.
- **Depends on / unblocks:** EXTENDS `plan/PHASE_CANDIDATES.md:212` — promote one
  or the other, never both; `[loop-call] 12` records that row as discharged
  jointly by this pitch and P-14. Depends on P-14 (cap-9 must be a climax before
  it is a doorstep). Requires reopening
  `axiomancer-mechanics/specs/world/W-01-aporia-labyrinth-continent.md:60`
  § Access (T binding 2026-07-07: "dev menu in the character tab ONLY… No
  exploration-tab or story wiring until the last continent exists") —
  `[loop-call] 5` rules that clause superseded and files the reversal for
  `/oversight` review rather than waiting on it, under THE OPEN GATE ¶1
  (`plan/bearings.md:501`, the section head; ¶1 retires `[needs-user-call]` as a
  blocking state) and ¶8 (`:553`, content growth as a standing mandate).
  UNBLOCKS P-09's labyrinth-exclusive card pool.
- **Size:** **2-3** phases (auditor concurs). Phase W7 (engine, mechanics only):
  catalogue entry + cap-10 + the travel payload + traversal pins; act 1 reachable
  and completable end-to-end through `npm run labyrinth` and through a plain CLI
  campaign run. Playable increment: the world has a seventh door. Phase W8
  (mobile): the colonnade layout fixture, the exploration tab routing off
  `currentContinent`, `savedWorld` retired. Playable increment: a phone player
  walks in. Optional Phase W9 (CUT from the ladder): the boss-level
  reconciliation, handed to `/world-tuning` once the ladder is re-pinned.
- **Keep-list risk:** none — no dice, Conviction, Surge, signature or 5-slot
  loadout surface is touched. The labyrinth's own hint and assertion-debt economy
  already spends Souls (`labyrinth.engine.ts:24-32`, `SETTLE_PRICE_PER_POINT` 30),
  not Conviction, so nothing competes with the banked combat resource.
- **Kill criteria:** Stop if the mobile exploration presenter cannot render a
  `traversal: 'labyrinth'` map without a rewrite — i.e. if the seven `*.layout.ts`
  fixtures or the node-options drawer secretly assume the column law. In that
  case ship the Aporia behind its own shipped `/labyrinth` route (RoomScene +
  FogMap) reached BY the travel event, rather than as an exploration-tab map; the
  door is the deliverable, the renderer is not. Also stop if cap-9 → cap-10
  cannot satisfy both the column-law pin and the terminal-in-final-column pin
  without weakening either test.
- **Done looks like:** A fresh-save CLI run walks fv-1 → … → cap-9 → cap-10 →
  ap1-1 with no dev command, and `world.currentContinent.name ===
  'labyrinth-continent'`. | `src/World/e2e/map-traversal.engine.test.ts` green
  with the capital at six beats and cap-10 the sole terminal; the column law and
  terminal-column pins unweakened. | Departing the capital and returning
  preserves its `MapState` under `WorldState.mapStates`, pinned the way the
  existing travel-kind e2e pins nc-26. | `GAME_STATE_VERSION` **asserted
  unchanged** (not asserted equal to a literal — by this point in the ladder the
  live value is 24); a save written before the phase loads and reaches the new
  door. | `layout-engine-parity.test.ts` green with `aporia-colonnade`
  registered; both gates green.
- **Confidence:** 82.

---

### P-09 · Every Parish Its Own Heresy

- **Hook:** The cards you are offered are the cards this place has; walk a
  different road and you get somebody else's bad ideas.
- **Lanes:** cards (+ maps)
- **The fantasy:** Win a fight in the drowned fishing village and the reward
  screen offers you brine, rot and things that were recently people. Win one in
  the northern city and it offers writs, arrears and the law. Win one in the
  Aporia and it offers you nothing you have seen before. Each locale stocks a
  POOL — a slice of the library plus two or three cards that exist nowhere else —
  so the card in your hand tells you where you have been, and a second run down a
  different road is a different deck rather than the same deck reshuffled.
- **What it touches:** `src/Combat/combat.rewards.ts` — `COMBAT_REWARD_POOL`
  (line 30) is today `cardLibrary.filter(theme !== 'curse')`, i.e. all 123
  non-curse ids, uniform, shaped only by `REWARD_RARITY_WEIGHTS` (common 1 /
  uncommon 0.5 / rare 0.2) and `REWARD_OFF_THEME_RATE = 0.35` (line 129). The
  pitch adds a locale term:
  `rollCombatCardRewards(player, rng, count, { locale })` with the off-theme
  pivot preserved. A new content module keyed by `MapName`
  (`src/World/map.library.ts`) and `ContinentName` (`src/World/map.registry.ts:28`,
  `MAP_REGISTRY`, 3 continents / 10 map definitions). Callers already sit on the
  full store and can pass `state.world.currentMap`:
  `axiomancer-mobile/state/combat/store-actions.ts:307` and
  `state/cache/store-actions.ts:79`. Harness parity:
  `src/Combat/combat.deck-draft.ts` and
  `combat.stage-profiles.ts::stageEligibleCardIds` must see the same pool the
  player sees, or the matrix measures a game nobody plays. Sim already exists:
  `src/Combat/combat.reward-draft.sim.ts`. Barrel: `rollCombatCardRewards` is
  exported from `src/Combat/index.ts:315` and `src/index.ts:150` — an optional
  fourth argument keeps both consumers source-compatible and must be called out
  in the report. Content: 2-4 locale-exclusive cards per continent, authored INTO
  the existing theme modules with a provenance tag, never a new family file.
- **Prior art:** `kb:dominion/rules/setup.okf.md` (src-002, official 2E rulebook,
  high) — "The table receives 17 face-up Supply piles: seven base piles and ten
  Kingdom piles chosen for the current game." STEAL: a small VARIABLE market over
  a large fixed library is what makes the second game different; the
  always-present base piles are the guarantee the deck still functions. |
  `kb:aeons-end/rules/setup.okf.md` — nine supply piles, and the doc's own note
  that "setup encodes replayability through variable Nemesis choice and
  chosen/randomized supply piles." STEAL: pair the pool with the ANTAGONIST so a
  locale reads as one authored design rather than two shuffles. |
  `kb:slay-the-spire-the-board-game/reception/better-if.okf.md` (src-008, high) —
  moving forward after Act III was "very unclear"; the doc's design implication is
  that a roguelike needs a ritualized procedure naming what persists, resets and
  unlocks. DISLIKED: the SILENT change — our locale pool must be NAMED on the
  reward screen ("the parish stocks"), not merely applied.
- **Why now:** `src/Combat/combat.rewards.ts:30` makes every reward screen in the
  game draw from the same 123 ids no matter where the player is standing, across
  7 gauntlet maps and 3 continents (`src/World/map.registry.ts` `MAP_REGISTRY`).
  The stamped baseline reports `cardCoverage` exercised 85 / neverPlayed 140 /
  `deadCardRate` **0.6222** (stamp b1624da0 · 2026-09-11 · reduced-nightly) — a
  uniform pool over a library this size is HOW a card becomes dead. THE OPEN GATE
  ¶8 (`plan/bearings.md:553`) makes content growth standing, and every map
  shipped since W1 has arrived with zero card identity of its own.
- **Depends on / unblocks:** Cites `plan/PHASE_CANDIDATES.md:212` (the Capital's
  missing door) as a NEIGHBOUR, not a duplicate: a locale pool is the reason a
  new map is worth walking to, and it makes the next door cheaper to justify.
  Depends on P-08 for the labyrinth pool to have a destination. The Aporia's
  three acts (`src/World/Labyrinth/`, 47 rooms, currently 27 borrowed enemy slots
  and no card identity) are where the mechanism first pays for itself. Answers
  the act-scoped-pool half of the brief's §9 provocation 4.
- **Size:** **2-3** phases (auditor concurs). Phase 1 — the locale term plus
  authored pools for the 7 shipped gauntlet maps built ENTIRELY from existing
  cards: zero new content, immediately playable, immediately measurable against
  `deadCardRate`. Phase 2 — 2-4 locale-exclusive cards per continent (coastal /
  northern / labyrinth), authored into their theme modules with pricing comments.
  Phase 3 — the reward screen names the parish and its stock (mobile presenter),
  which is also the cheapest possible extension of the filed glossary-surface row
  at `plan/PHASE_CANDIDATES.md:203`. **The names the screen prints are
  provisional pending the filed naming pass at `plan/PHASE_CANDIDATES.md:189`**
  (`[loop-call] 16`).
- **Keep-list risk:** none — it feeds the deckbuilding core and touches no locked
  mechanic. It does not gate cards behind a level or a class; the off-theme pivot
  stays, so the pool narrows what you are OFFERED, never what you may own.
- **Kill criteria:** Kill after phase 1 if the A/B shows locale pools funnelling
  every run into one theme — that is, if `REWARD_OFF_THEME_RATE` stops
  functioning because the locale filter has already removed the pivot themes.
  Kill also if `deadCardRate` does not move: the entire justification is that a
  smaller, authored pool exercises MORE of the library, and if the sim says
  otherwise the mechanism is flavour text with a maintenance bill.
- **Done looks like:** `rollCombatCardRewards` takes an optional locale; the
  existing three-argument call still compiles and still rolls the full pool,
  pinned by a test so the `@mechanics` barrel contract is provably unbroken. |
  Every shipped map has an authored pool; a hermetic e2e proves no pool can offer
  a curse-theme card and no pool is empty at any rarity band. | A
  `combat.reward-draft.sim.ts` run prints per-locale offer distributions and a
  measured drop in never-offered ids against the pre-phase figure. | The mobile
  reward screen names the locale and its stock; presenter snapshot updated. |
  `npm run verify -w axiomancer-mechanics` plus mobile verify green
  (`src/Combat/**` and `src/index.ts` are both in the blast radius).
- **Confidence:** 74.

---

### T3 · NINE WORDS AND NO MOUTH

---

### P-10 · Nine Verbs Nobody Speaks

- **Hook:** The engine knows nine words no card has ever said out loud; this is
  the census that gives them a mouth or gives them a funeral.
- **Lanes:** keywords (+ cards)
- **The fantasy:** The player never sees a census. What they see is the dice
  finally getting a deck. FORGE a ghost die, OVERHEAT the reserve past its safe
  cap and gamble the pips, refresh the die that just fired, turn a dead X into a
  wild — a whole tray-bending vocabulary that is glossed in the app, priced in
  the pricing table, and printed on absolutely nothing. Ship the survivors as one
  small package that speaks dice, and bury the rest with the same rites CURDLE
  got: a named row under Retired, a reason, and no resurrection.
- **What it touches:** THE CENSUS, re-derived at HEAD: `src/Cards/types.ts`
  declares 50 `CardSpecialMechanic` kinds; 41 have a carrier in the library; NINE
  have zero — `befriend_attempt`, `convert_die_color`, `echo_next_spell`,
  `float_x_die`, `forge_floating_die`, `overheat`, `refresh_die`,
  `spend_all_pips`, `strip_random_buff`. Ten more sit at exactly one carrier:
  `bank_spent_die`, `conjure_card`, `consume_affliction`, `convert_dots`,
  `grant_pip`, `purge_self`, `reap`, `recoil_x`, `reroll_spent`,
  `spend_premises`. Six of the nine are dice verbs. On the keyword side, FORGE
  has a live `KEYWORD_GLOSS` row (`axiomancer-mobile/state/combat/keywords.ts`,
  **52 keys re-derived this session**) and a live `docs/keyword-atlas.md` row with
  zero card carriers; BOON / HONE / TEMPER are glossed as player keywords but are
  blacksmith services (`World/Blacksmith/blacksmith.engine.ts:57`); `glyph:` has
  zero library carriers and `src/Cards/cards.sandbox-sets.ts:38-42` records
  exactly why. THE FIX, per kind: BACKFILL the six dice verbs as one family,
  FORGE keeping its keyword — **and each backfilled verb ships its own
  `KEYWORD_GLOSS` row in the same tick, because the 52 live keys carry no
  OVERHEAT, REFRESH, CONVERT or FLOAT row** (verified this session), so four of
  the six would otherwise print a word with no gloss and break P-11's drift pin.
  RETIRE `strip_random_buff` and `echo_next_spell` (TWIN already owns
  echo-next space with 3 carriers). LEAVE `befriend_attempt` annotated
  **carrier-pending with its successor row named** — it is the mercy path and
  P-12 gives it carriers six rows later, so a `no-carrier-by-design` annotation
  would be written into CI and reversed. FILES: new or extended carriers in
  `src/Cards/library/` (`relics.cards.ts` already holds the three dice valves at
  `:23/:48/:74` and is the natural host); `src/Cards/cards.pricing.ts`
  `VERB_POINTS` — `forgeFloating: 5` (`:83`), `pip: 1.5` (`:76`), `kindle: 2.5`
  (`:72`) are prices nothing buys, so each is either exercised or deleted;
  `docs/keyword-atlas.md` § Retired in the CURDLE format;
  `axiomancer-mobile/state/combat/keywords.ts` `KEYWORD_GLOSS` +
  `MECHANIC_KEYWORD`; `axiomancer-card-editor/src/data/mechanics.ts`
  `SPECIAL_MECHANIC_KINDS`; and the durable part — `scripts/content-drift.mjs`
  gains a CARRIER census so this cannot silently recur.
- **Prior art:** `kb:mage-knight/reception/better-if.okf.md` (src-012, BGG
  Ultimate Edition ratings comments, community, confidence medium) —
  component-clarity: "Improve iconography and reference cards so site/enemy
  effects are readable without multiple lookups", evidenced by "rules checking is
  30% of playing time" and "really fiddly rules". `src/Enemy/enemy-keywords.ts:1-10`
  names Mage Knight as its own model, so we inherited the complaint with the
  design: a vocabulary larger than its carrier set is precisely that retrieval
  tax. | `kb:dawncaster/keywords/momentum.okf.md` (src-001, community wiki,
  medium/draft) and the corpus's `keywords.csv` functions column — Dawncaster
  sustains 141 keywords by tagging each with a design JOB (Buff, Deck Management,
  Energy Management, Blood Ritual, Debuff…). The discipline is not "few
  keywords", it is "every keyword has a function and a family". Steal the
  functions column as the column our atlas is missing. | **UNGROUNDED on
  retirement specifically:** no corpus document discusses retiring a printed
  keyword from a live game. Our own `docs/keyword-atlas.md` § Retired (CURDLE,
  2026-09-05) is the only procedure of record, and this pitch follows it rather
  than inventing one.
- **Why now:** `plan/CONTENT_LEDGER.md` records the keywords category at pass 7,
  commit `3c39acb9`, 2026-09-12: zero CREATE, zero UPDATE, zero REMOVE. The
  steward has nothing to react to because nothing files the gap — a zero-carrier
  verb is invisible to a per-item re-audit. Meanwhile
  `axiomancer-mobile/state/combat/keywords.ts:5` still declares "30 KEYWORDS
  (down from a drifted 32)" and `:20` still recites the repealed doctrine,
  against **52 live `KEYWORD_GLOSS` keys re-counted at HEAD** — a third stale
  surface that `plan/PHASE_CANDIDATES.md:292` (score 8.0, the status-primacy
  lexicon row) does not name. This EXTENDS that row rather than repeating it: 292
  corrects the doctrine sentence; this corrects the census the doctrine sentence
  is wrong about, and installs the gate that keeps both honest.
- **Depends on / unblocks:** Cite as adjacent, do not bundle:
  `plan/PHASE_CANDIDATES.md:1640` (19 orphaned `zoneHas` sites +
  the-sextons-count's unwired TWIN, score 4.5) is the same disease on the
  engine-hook side — recommend `/oversight` sequence them back to back and let
  this pitch's census gate cover both surfaces. Also cite
  `plan/PHASE_CANDIDATES.md:203` (make the glossary reachable): a glossary that
  lists verbs nothing carries is worse than no glossary, so 203 lands after the
  census gate, not before. MUST PRECEDE P-02's amended faces, P-11's glossary
  tab, and P-13's new enemy kinds. Makes every future keyword claim auditable the
  moment it lands.
- **Size:** **2-3** phases (auditor concurs). Phase A — the gate and the funeral:
  extend `scripts/content-drift.mjs` to FAIL on a printed keyword with zero
  carriers and to report zero-carrier mechanic kinds as a warning ledger; retire
  `strip_random_buff` and `echo_next_spell` with atlas rows; annotate
  `befriend_attempt` carrier-pending with its successor row named; fix the stale
  header at `keywords.ts:5`/`:20` so the count is derived, not declared. One green
  tick, no player-visible change, drift can never recur silently. Phase B — the
  dice-speaking family: 6-8 cards, one per backfilled verb, priced through the
  `VERB_POINTS` dice rows that already exist, **each with its `KEYWORD_GLOSS` row
  in the same tick**. Playable increment: the tray becomes a thing you build
  with, not just roll. Phase C (own tick, has its own Gate-4 history) — the GLYPH
  promotion decision: sandbox set to library, or formal retirement of
  `Card.glyph` and `state.glyphs`.
- **Keep-list risk:** Touches the Dice system — ADDITIVELY. Every backfilled verb
  already exists and already resolves in the engine; this gives them carriers,
  removes nothing from `combat.dice.ts` / `combat.upgradeable-dice.ts`, and
  no-ops nothing. The two retirements are card-side union members with zero
  carriers and zero coupling to the dice economy. The standing judgment stays
  KEEP all three.
- **Kill criteria:** Stop the backfill of any given verb the moment it turns out
  to need `dieSpecialCap` or `validateDieGear`
  (`src/Character/dieGear.reducer.ts:48-95`, which floors miss at 1 — "whiff is
  never forgeable away") to move: that is hand-tuned engine-constant territory,
  and for that verb the honest verdict flips to retirement. Kill Phase B entirely
  if the dice family sims as a strictly-better utility package every preset wants
  regardless of theme (self-contained themes is still doctrine) — keep the
  census, drop the cards to three, and report the negative. Phase A has no kill
  criterion: a census that finds nothing is still a gate.
- **Done looks like:** `node scripts/content-drift.mjs` FAILS on a printed
  keyword with zero carriers and passes at HEAD after the retirements; its test
  at `scripts/content-drift.test.mjs` pins the new check. | Every
  `CardSpecialMechanic` kind either has ≥1 library carrier, or a machine-readable
  `no carrier by design` annotation, or a machine-readable `carrier-pending`
  annotation naming the build-plan row that will supply it — **three states, and
  the pending state expires when its named row lands**. |
  `axiomancer-mobile/state/combat/keywords.ts:5` and `:20` no longer declare a
  keyword count or recite a repealed doctrine; the count is derived from
  `KEYWORD_GLOSS` at build time. | `docs/keyword-atlas.md` § Retired gains its
  rows in the CURDLE format (name, date, carrier evidence, what survives as plain
  text), and `docs/retheme-map.json` NL-8 collision check is clean; no retired id
  is renamed or resurrected, and `src/Effects/e2e/deprecated-effects.engine.test.ts`
  stays green. | Cross-package gates green and `axiomancer-card-editor`'s
  `SPECIAL_MECHANIC_KINDS` matches the union exactly after the two removals.
- **Confidence:** 78.

---

### P-11 · The Book of the Spared

- **Hook:** Sixteen things in this world will tell you what they were, but only
  if you let them live — and right now the book they write in does not exist.
- **Lanes:** art (+ keywords, story)
- **The fantasy:** The pilgrim spares the Brine Hag. A seal turns over and
  something is written down. Later, in a quiet moment, they open a page and find
  the drowned congregation's own account of itself — a full-bleed painting of the
  thing they did not kill, its name, and the prose it earned by surviving. Beside
  the foe-book sits the plainer half: every keyword the deck can print, defined
  once, in one place, reachable from the chip that confused them. Mercy stops
  being a worse ending and starts being the only way to read the world.
- **What it touches:** The write side is entirely shipped and untouched:
  `axiomancer-mechanics/src/Game/types.ts:55-80` (`CodexEntry` / `CodexState`),
  `src/Game/game.reducer.ts:133` (the slice), `:522-530` (the
  `UNLOCK_CODEX_ENTRY` case), `src/Game/store.ts:78` (persist-immediately) and
  `:417-455` (the friendship hook), `src/Game/game.migrate.ts:468` (the guard),
  `src/Enemy/types.ts:306` (`journalEntry?: CodexEntry`). **That write side
  shipped under PRE-NEXUS Phase 73, not build-plan Phase 73** — build-plan Phase
  73 is the art-generation pipeline (`plan/phases/phase_73_art_generation.md`),
  and `game.reducer.ts:522` cites `plan/phases/phase_73_codex_journal_surface.md`,
  **which does not exist at HEAD** (`plan/phases/` holds only phase_70 through
  phase_76 plus phase_78). Correcting that pointer is in scope. The same
  qualifier applies to the tooltip registry and `TooltipTarget`, which shipped
  under pre-nexus Phase 74, not build-plan Phase 74 ("N-1: fold the ratified
  North Star into spec 34"). The read side is what this ships. Engine: a
  `codexRegistry` export on the `@mechanics` barrel (`src/index.ts:397` already
  exports `CodexEntry`/`CodexState`) — this is the barrel/contract change, and
  `src/CLI/game.cli.ts:69-73` already names it in a comment ("Future
  dialogue-driven codex entries will need a centralised codexRegistry export on
  the public barrel"), replacing the in-CLI walk at `game.cli.ts:74-82`. **That
  comment block opens with the literal string "Phase 82" — see `[loop-call] 1`;
  the row that deletes this walk is itself numbered 82.** Mobile: a new reader
  route or a fifth section on
  `axiomancer-mobile/app/(tabs)/memoir/index.tsx`, fed by a new selector beside
  `axiomancer-mobile/state/presenters/memoir.engine.ts:812
  selectMemoirViewModel` (whose four sections are enumerated at
  `memoir.engine.ts:4-9` and include no bestiary). Glossary half:
  `axiomancer-mobile/state/presenters/tooltip.engine.ts:28-43 TooltipKind` has 15
  members and neither a `keyword` nor a `foe` kind, so the filed glossary
  candidate cannot be executed without adding them here;
  `axiomancer-mobile/state/combat/keywords.ts:205 KEYWORD_GLOSS` (52 rows,
  re-derived) and `:404 keywordGloss()` are consumed ONLY by
  `state/presenters/combat-encounter.engine.ts`. Art: the codex page is where
  `axiomancer-mobile/assets/images/enemies/` paintings are first seen at full
  size — today they render at 128-512px inside combat only. **No new art is
  sourced by this pitch; it is a reader over paintings that already ship.**
  Retires the dev-only readers as the sole path:
  `axiomancer-mobile/state/dev/rewards.ts:37 listJournalEntries()` and
  `state/dev/inspector.ts:150`. No new persisted field; `unlockedEntries`
  already exists, so `GAME_STATE_VERSION` is asserted unchanged.
- **Prior art:** `kb:mage-knight/reception/better-if.okf.md` (src-012) — BGG
  Ultimate Edition comments: "rules checking is 30% of playing time", "really
  fiddly rules"; the doc's own Opportunity line is "Improve iconography and
  reference cards so site/enemy effects are readable without multiple lookups."
  STEAL: the reference surface is a first-class fix, not documentation.
  DISLIKED: having to leave the decision to look something up. |
  `kb:the-quacks-of-quedlinburg/reception/reviews.okf.md` (src-004) — "icons that
  help remind players" is the ONLY praised component-clarity design in the corpus
  (`BoardGames/patterns/component-clarity.okf.md` § Where it works). STEAL:
  in-line reminders beat a separate reference book — the codex must be reachable
  FROM the chip, not only from a tab, or it repeats Mage Knight's failure with a
  nicer page. | `kb:BoardGames/patterns/campaign-progression.okf.md` —
  mage-knight (src-012) — players who want the puzzle to feel like an adventure
  "specifically miss campaign or event narration connecting sessions." STEAL:
  write the codex as chronicle prose, which the 16 entries already are, not as a
  stat block.
- **Why now:** `axiomancer-mechanics/src/Game/types.ts:40-51`, the `CodexEntry`
  docblock, names its consumers as "the mobile Codex tab, future CLI surface".
  The CLI surface shipped — `src/CLI/game.cli.ts:65` has `'codex'` in its Tab
  union with a working lookup at `:74`. The mobile tab never did:
  `grep -rn unlockedEntries axiomancer-mobile --include=*.tsx` returns only
  tests, `state/dev/rewards.ts` and `state/dev/inspector.ts`. **Sixteen distinct
  entries** are authored on 16 of 79 enemies (re-derived this session), one of
  which — `codex-the-incompleteness` — belongs to an enemy in no `EnemiesByMap`
  pool and is structurally unobtainable. Separately the stale phase-brief pointer
  above: the brief for the reader was never written, which is exactly how the
  reader never got built. `[loop-call]` This EXTENDS
  `plan/PHASE_CANDIDATES.md:203` [score 6.0] "Make the glossary reachable from
  the screens that need it" by supplying what that row cannot do without: the
  `TooltipKind` members it needs and a page for the definitions to live on.
- **Depends on / unblocks:** Extends `plan/PHASE_CANDIDATES.md:203` [6.0]
  (glossary reachability) — that row is this pitch's phase 2, not a separate
  promotion. Depends on pre-nexus Phase 73 (the codex slice) and pre-nexus Phase
  74 (the tooltip registry + `TooltipTarget`) — **both pre-nexus, neither the
  build-plan row of the same number**. Depends on P-10's census landing first, so
  the glossary does not list verbs nothing carries. Feeds
  `plan/PHASE_CANDIDATES.md:189` [6.5] the naming pass: a single canonical page
  is where LEDGER / BOOK OF DEEDS / THE ACCOUNT / THE FOURTH LEDGER get
  reconciled, so the naming row should be sequenced AFTER this, not before.
  `[loop-call] 16` records that no ladder row schedules it and rules how the
  three rows that author new player-facing copy behave in the meantime. The
  surface's final name is the naming pass's to rule; "THE BOOK OF THE SPARED" is
  the pitch name, not a copy commitment. Unblocks every content lane by giving
  new enemies, keywords and cards a second place to be seen.
- **Size:** **2-3** phases (auditor concurs). Phase 1 (the foe-book): the
  `codexRegistry` barrel export replacing the in-CLI walk, a memoir-adjacent
  reader listing unlocked entries with the full-size enemy painting, title and
  body, and locked rows shown as sealed silhouettes with a count ("4 of 16
  spared"). Ships playable: mercy has a reward the player can look at. Phase 2
  (the glossary half): add `keyword` and `foe` to `TooltipKind`, mount targets on
  the hazard-deck's keyword chips and the combat board's PLEA/CHARGE/diamond
  marks, and give the codex a second tab listing all 52 `KEYWORD_GLOSS` rows plus
  the 9 `ENEMY_KEYWORD_KINDS`. Ships playable: the filed [6.0] row is closed and
  every definition is reachable twice — in place and in the book. Phase 3
  (optional, CUT from the ladder per `[loop-call] 10`): surface which entries are
  unobtainable and route the `codex-the-incompleteness` orphan to
  `/adjust-enemies`; add an unlock route beyond mercy.
- **Keep-list risk:** None. This is a read surface over an existing persisted
  slice; it spends no Conviction, rolls no die, and adds no card. The one
  adjacency to watch: the glossary tab must define the keep-list systems
  (Conviction, the Surge meter, the dice) rather than reframe them — the LOCKED
  MECHANICS carve-out at `plan/bearings.md:566` is on the mechanics and defaults
  to keeping the names too, so the page cites the atlas rather than re-authoring
  it.
- **Kill criteria:** Stop if the 16 authored bodies do not survive a read against
  the register — spec 34 §2, terse and cold. Pre-nexus Phase 73 wrote them under
  the pre-rewrite doctrine and if `content-curator` judges the majority need
  rewriting, the pitch is a prose phase wearing an art phase's clothes and should
  be re-scoped to `/story-spec` before any page ships. Second kill: if the
  friendship outcome is unreachable in ordinary play for the 10 boss/unique
  entries, the book is 6 pages, not 16 — verify the mercy path's real
  reachability against `src/Combat` before committing phase 1's scope.
- **Done looks like:** A player who spares one enemy can open the entry and read
  it without the dev menu; a hermetic route test drives spare → codex row
  visible, and `unlockedEntries` is the only state read. | `codexRegistry` is
  exported from `axiomancer-mechanics/src/index.ts` and `src/CLI/game.cli.ts:74`'s
  in-module walk is deleted, with the CLI's codex tab still passing its tests —
  one registry, two consumers. | `TooltipKind` gains `keyword` and `foe`; every
  one of the 52 `KEYWORD_GLOSS` rows and 9 `ENEMY_KEYWORD_KINDS` resolves through
  `selectTooltipContentFor`, pinned by a drift test that fails when a gloss row
  has no reachable target. | The stale pointer at
  `axiomancer-mechanics/src/Game/game.reducer.ts:522` names a brief that exists
  (write it, or correct the pointer, and say in the phase record that the cited
  Phase 73 is the pre-nexus one) — the phase closes its own citation. |
  `GAME_STATE_VERSION` asserted unchanged; both gates green;
  `scripts/check-lexicon.mjs` clean on the new copy.
- **Confidence:** 84.

---

### P-12 · Not Every Fight Ends In A Body

- **Hook:** There are three ways out that are not a corpse, and two of them are
  currently decoration.
- **Lanes:** cards (+ enemies, story)
- **The fantasy:** A fight ends four ways: the corpse, the plea, the verdict, the
  pardon. Each is a FAMILY — a counter you watch fill, a card that declares the
  ending out loud, and an enemy that can shut that one specific door in your
  face. The choir talks a thing into laying down. The trial reaches a number and
  passes sentence. The pardon spares a thing that can be spared, and the parish
  remembers you did. Refusing to kill becomes a play you made, not an outcome
  that happened to you.
- **What it touches:** `src/Cards/library/choir.cards.ts` (PLEA: 7
  `kind: 'sway'` mechanics + 13 `sway:` rider fields), `trial.cards.ts` (CHARGE:
  8 `kind: 'premise'` + 20 `premises:` riders) — but exactly TWO
  `kind: 'peroration'` carriers exist in the whole library and both carry
  `concedeAt`: the-black-cap (`trial.cards.ts:445`, `concedeAt` 14) and
  the-bench-does-not-retire (`apocrypha.cards.ts:351`, `concedeAt` 12).
  `befriend_attempt` is a live `CardSpecialMechanic` kind with a price
  (`cards.pricing.ts:500`, `befriendAttempt: 3`) and ZERO card carriers anywhere
  — the mercy door has no key, while `src/Combat/combat.engine.ts:3405/5514`
  resolves it, `src/Combat/index.ts:111` gates it, and 10 enemies carry
  `befriendabilityConfig`. Thresholds: `src/Combat/effects.ts:197
  concedeFloorFor` (12/24/40/60) and `:217 CAPITULATE_RESOLVE_FRACTION` 0.35 /
  `CAPITULATE_MIN` 10. Enemy-side denial already exists in exactly one shape (the
  anti-RELENT `swayCleanse` at `src/Combat/combat.enemy-cards.ts:360`) and is the
  template for a CONDEMN answer and a mercy answer. Shipped payoffs nothing can
  reach: `src/Faction/types.ts` and `src/Game/store.ts:104-129` already write
  journal entries and faction deltas on a befriend outcome. Display:
  `src/Combat/combat.cards.ts:342` already prints every floor `concedeFloorFor`
  can raise — the alt-win counters need the same treatment on the enemy plate.
- **Prior art:** `kb:dark-pact/rules/overview.okf.md` (src-002, official rules,
  high) — "A player can win by fulfilling a Dark Pact; if the supply exhausts
  first, compare Insight after subtracting Curse points." STEAL: the alt-win is a
  DECLARED goal, visible from turn one, with a defined fallback when it fails. |
  `kb:dark-pact/reception/better-if.okf.md` (src-007, src-009, medium) —
  "Reviewers raise uneven Pact difficulty as a balance risk… Reviews question
  equivalence across alternate victory conditions," with the recommendation to
  give each condition a difficulty indicator. That is our exact failure mode:
  three doors priced on three different theories read as two traps and one path.
  | `kb:arkham-horror-the-card-game/rules/scoring-endgame.okf.md` (src-003,
  official, high) — "Scenario resolution can advance a campaign even when the
  result is compromised." STEAL: the pardon must be a legitimate resolution with
  consequences, which our Faction and memoir plumbing already supports and no
  card can currently reach.
- **Why now:** The stamped baseline records `winPathCounts` over 144 cells × 30
  runs = **4,320 fights** (stamp b1624da0 · 2026-09-11 · reduced-nightly;
  `baseline:check` reports STALE from the content-only commit `df6e98f`,
  `plan/AUDIT.md:229`): capitulate 460 / 60 / 195 / 20 by stage, concede 20 (mid
  ONLY, zero at early, late and impossible), and **mercy 0 at EVERY stage**. One
  alt-win carries the entire load, one fires twenty times in four thousand
  fights, and one has never happened. Worse, the single most-played card in the
  matrix — `the-bench-does-not-retire+`, 0.901 share at late — IS a CONDEMN
  carrier, and it wins by damage. Pricing arithmetic, load-bearing:
  `cards.pricing.ts:36-45` derives `swayPerStack = 0.9` as exact VITAE-damage
  win-parity (`(maxHealth/3) / (0.35 × maxHealth) = 0.95`, haircut for PLEA
  decay), while `premise = 0.8` is explicitly a BUILD currency and the CONDEMN
  win rides its declaring card as the flat `concedeCapstone = 3`. So a PLEA 8
  rider costs 7.2 pts and buys 8/35% of a win; a 9-Charge play costs 7.2 pts and
  buys nothing toward a win unless one of two cards in the library is also on the
  table. The doors are priced on different theories, and the matrix is the
  receipt.
- **Depends on / unblocks:** EXTENDS `plan/PHASE_CANDIDATES.md:1101` ("The
  Incompleteness premiseShed — close the CONDEMN hole at impossible"; the filed
  row uses the retired word for R-3) — that row closes one enemy's hole; this
  builds the family the hole belongs to, and phase 3 supplies the denial pass
  that row's fix implies. Depends on P-11 (mercy needs its payoff page first, so
  the first pardon lands on a page that already exists). Enemy-side
  follow-through routes to `/adjust-enemies` under R7's tax hierarchy
  (`plan/ideas/COMBAT_SYSTEM_FOUNDATIONAL_REDESIGN_PLAN.md`, gated by
  `plan/ideas/README.md` — cited, not implemented).
- **Size:** **2-3** phases (auditor concurs). Phase 1 — THE PARDON:
  `befriend_attempt` carriers (one per aspect) with a printed gate, so a shipped
  engine payoff (mercy outcome, faction deltas, journal entry) becomes reachable
  by play; immediately testable against the 10 enemies carrying
  `befriendabilityConfig`. Phase 2 — THE VERDICT: 3-4 more `concedeAt` carriers
  spread across ranks 3-6, plus the enemy plate printing the floor the verdict
  must clear (the difficulty indicator Dark Pact's reviewers asked for). Phase 3
  — THE DENIAL: one counter per door on mid/late enemies, taxing timing or
  sequencing before deleting anything — **CUT from the ladder and handed to
  `/adjust-enemies`** per `[loop-call] 10`.
- **Keep-list risk:** none of the three locked systems is removed, no-op'd or
  routed around. It does bend the win condition — but `isDefeated(enemy)` stays
  the primary path and CLAUDE.md §3 is explicit that the alt-wins "compete on
  merit; none of them is the intended path and none is protected". Alt-win
  counters remain card currencies, not a second Pressure Track (retired; do not
  resurrect).
- **Kill criteria:** If the mercy card ships and a full three-seed matrix still
  reads mercy = 0, the door is closed by the ENEMY predicate rather than by the
  missing card, and the phase converts to an enemy-side brief instead of
  authoring more carriers. If phase 2 pushes CONDEMN wins past roughly 15% of
  wins at any stage, the floors move before another carrier ships — the alt-win
  must be reachable and never cheap, which is what the-bench-does-not-retire's
  own pts comment already claims.
- **Done looks like:** `befriend_attempt` has at least two card carriers with a
  printed gate; a hermetic e2e drives one to `finalOutcome: 'mercy'` and asserts
  the faction delta and journal write actually land. | At least five `concedeAt`
  carriers across at least three ranks; every one prints its own floor AND the
  raise `concedeFloorFor` applies at elite/boss/unique, under the existing
  face-honesty rule at `combat.cards.ts:342`. | A fresh combat-playtest matrix
  (stamp named in the report, identical seeds and flags to the control) shows all
  three non-lethal paths non-zero at a minimum of one stage each. |
  `docs/keyword-atlas.md` rows for PLEA, CHARGE, RELENT and CONDEMN updated with
  kb receipts and their re-derived carrier counts. | `npm run verify -w
  axiomancer-mechanics` plus mobile verify and card-editor type-check green.
- **Confidence:** 79.

---

### P-13 · The Lesser Orders

- **Hook:** Nine enemy keywords ship; seven of them never leave the boss tier,
  and every elite in the game carries the same two.
- **Lanes:** enemies (+ keywords)
- **The fantasy:** The thing in the tunnel is not bigger. It REGROWs four at
  every phase boundary, and suddenly your affliction clock is a race you can read
  on the pane. The next one is not bigger either — it tithes, and every die you
  spend past the first feeds it. You stop asking how much VITAE the wandering
  dead have and start asking what shape they are making you fight in. Then the
  boss arrives already fluent in that language, and for once you know the
  sentence before it is read over you.
- **What it touches:** `axiomancer-mechanics/src/Enemy/enemy-keywords.ts` — the
  `EnemyKeyword` union, `ENEMY_KEYWORD_KINDS`, `ENEMY_KEYWORD_LABEL` and
  `ENEMY_KEYWORD_GLOSS`. All three tables are exhaustive Records over the union
  and two AssertNever guards bind the runtime list to the type, so a new kind is
  a compile error until it is fully wired — the discipline is already installed.
  `axiomancer-mechanics/src/Enemy/index.ts:197-224` — `defaultEnemyKeywords`, the
  derivation that actually governs 57 of the 79 production foes. Application
  sites, each named in the module header: `applyEnemyDamage`,
  `resolveThreatPhase`, `computeRungDenial` and `processBetweenPhases` in
  `axiomancer-mechanics/src/Combat/combat.engine.ts`.
  `axiomancer-mobile/state/presenters/combat-encounter.engine.ts:98` —
  `ENEMY_KEYWORD_GLYPHS` is a `Record<EnemyKeyword['kind'], string>`, so a new
  kind breaks the mobile build until it has a glyph;
  `axiomancer-mobile/state/combat/keywords.ts:517-533` (`enemyKeywordChip`,
  `enemyKeywordGlossForToken`). `axiomancer-mechanics/docs/keyword-atlas.md:138-146`
  (the nine enemy rows) and `docs/retheme-map.json`, per THE PIPELINE
  LIBERATION's full wiring checklist — **plus the `TooltipKind` foe target P-11
  mounts, so each new kind is reachable from the enemy plate and P-11's drift
  test stays green**. Content: the elite and normal bands in
  `src/Enemy/enemy.library.ts`. Barrel: union widening is additive; nothing in
  `src/index.ts` is renamed or removed. This touches the Combat public surface —
  the phase must state whether `npm run verify -w axiomancer-mobile` was re-run;
  flag it as an open question otherwise.
- **Prior art:** `kb:mage-knight/rules/edge-cases-faq` (src-005, confidence high)
  — FAQ p.2: "Can armor drop below 1? … No. Armor can never be less than 1. The
  wording 'to a minimum of 1' should be on these cards." The HIDE floor this
  engine already ships IS that ruling, and the corpus evidence is that the floor
  is what keeps an arithmetic keyword from being a wall. Every new kind inherits
  an explicit printed floor. | `kb:mage-knight/rules/edge-cases-faq` (src-011,
  confidence medium) — rules "dispersed across rulebook, walkthrough, cards" is
  the game's named architectural cost. Nine keywords a player only ever meets on
  a boss are that same dispersion in miniature; teaching them on wandering foes
  is the fix, not a tenth keyword. |
  `kb:cthulhu-death-may-die/reception/reviews` (src-003, confidence high) — the
  monster roster read as the weakest part of the design. A keyword on a normal
  foe is the cheapest route to an interesting wandering enemy that does not cost
  a new stat block or a new portrait.
- **Why now:** `axiomancer-mechanics/src/Enemy/types.ts` prints the contract on
  the `keywords` field itself — "Budget: 0-1 at simple/normal, 1-2 at elite, 2-3
  at boss/unique" — and HEAD violates it in exactly one direction. Re-derived
  over all 79 production records INCLUDING the derivation in
  `src/Enemy/index.ts:197` (which a literals-only grep misses): 21 foes author
  keywords, all boss or unique; the other 57 inherit `defaultEnemyKeywords`.
  Below the boss line only TWO of the nine kinds ever appear — HIDE on 48 foes
  and SWIFT on 23 elites. BRUTAL, VENOM, UNSHAKEN, ELUSIVE, REGROW, RAVENOUS and
  WOUNDING are boss/unique-exclusive at HEAD. All 26 elites carry the identical
  derived pair and not one carries a character keyword.
  `src/Enemy/enemy-keywords.ts`'s own header states the purpose — "the reason a
  40-point single hit reads differently from four 10-point hits" — for a system
  the player meets roughly six times a campaign. Separately this is the specific
  direction that `plan/ideas/README.md` requires: R7 in
  `plan/ideas/COMBAT_SYSTEM_FOUNDATIONAL_REDESIGN_PLAN.md` (2-3 mid/late
  counter-enemies per status class under a tax hierarchy; counters tax timing,
  sequencing or resource commitment before deleting stacks, immunity last resort)
  is one of only two R-rows that survived the 2026-09-02 rewrite unbuilt. Tagged
  `[loop-call]`: this pitch un-gates R7 for the enemy side only, under THE OPEN
  GATE ¶1 and ¶5.
- **Depends on / unblocks:** Depends on P-10's census gate, so a new kind cannot
  ship without a carrier and a gloss, and on P-11's foe tooltip target. Makes
  P-14 cheaper: a stage `gain:` payload gets something worth gaining. Cross-refs
  `plan/PHASE_CANDIDATES.md:292` (the keyword-registry drift row, score 8.0) as a
  dependency for the atlas row and the mobile registry, not as scope.
- **Size:** **2-3** phases (auditor concurs on the pitch's own estimate, but the
  ladder splits the first phase in two because 3-4 new kinds through a 12-step
  checklist is not one green tick — see `92a`/`92b`). Phase A1 — two new
  `EnemyKeyword` kinds designed strictly as R7 taxes (they price timing,
  sequencing or resource commitment, never delete stacks, never grant immunity)
  through the full PIPELINE LIBERATION wiring checklist, each with a printed
  floor and a hermetic e2e: the checklist proven once. Phase A2 — the remaining
  one to two kinds on the proven pattern. Playable increment across both: three
  or four new shapes a fight can take, each legal below the boss line. Phase B
  (the elite band): all 26 elites move off the derived pair onto authored,
  budget-compliant lists; `defaultEnemyKeywords` becomes the floor it claims to
  be. Playable increment: no two elites feel alike. Phase C (optional, CUT from
  the ladder): normal and simple bands to budget, handed to `/combat-playtest`
  and `/deck-tuning`.
- **Keep-list risk:** Touches the keep-list deliberately and only by feeding it —
  which THE LOCKED MECHANICS carve-out explicitly encourages ("cards, keywords,
  enemies and content MAY read, feed, spend, block, amplify or otherwise interact
  with all three"). Every candidate tax PRICES a keep-list resource and never
  zeroes one: a foe that charges more Conviction per signature firing, a foe
  whose HIDE climbs while the Surge chain stays unbroken, a foe that taxes one
  die colour for a round. Standing rule for the phase brief, stated up front: **no
  new kind may reduce a keep-list resource to zero or make it unusable; it may
  only make it cost more.**
- **Kill criteria:** Stop if `/combat-playtest` shows any single new kind moving
  a cell's win rate by more than roughly 15 points on its own — that is a wall,
  not a tax, and R7's own hierarchy puts immunity last for exactly this reason.
  Stop if the per-foe keyword count overflows the existing chip row in
  `enemyKeywordChips` — that becomes a UI phase and should be sequenced, not
  smuggled. Stop if the elite pass produces 26 foes carrying the same NEW pair;
  uniformity relocated is not uniformity fixed.
- **Done looks like:** `ENEMY_KEYWORD_KINDS` grows; both AssertNever guards still
  compile; `ENEMY_KEYWORD_LABEL`, `ENEMY_KEYWORD_GLOSS` and the mobile
  `ENEMY_KEYWORD_GLYPHS` Record are exhaustive with no `as` cast anywhere, and
  each new kind resolves through the `TooltipKind` foe target. | A test asserts
  the printed budget from `src/Enemy/types.ts` against the live roster: every
  elite 1-2 keywords, every boss/unique 2-3, every normal/simple 0-1 — **computed
  AFTER the derivation, not from authored literals**. | No keyword kind is
  boss/unique-exclusive except by an explicit, commented design decision; a test
  enumerates the exclusions so the list cannot drift back to seven. | Each new
  kind has a hermetic e2e proving both its effect AND its floor: no kind reduces
  a hit below 1, and no kind denies the player every action for a round (the
  agency rail). | `docs/keyword-atlas.md`'s enemy table and
  `docs/retheme-map.json` land in the same commit; `scripts/check-lexicon.mjs`
  clean; mechanics verify green and `npm run verify -w axiomancer-mobile` re-run
  and stated.
- **Confidence:** 79.

---

### P-14 · The Second Mask

- **Hook:** A boss should stop being the fight you were winning; right now it
  heals a little, gets angrier, and keeps playing the same three cards.
- **Lanes:** enemies (+ art, run)
- **The fantasy:** Half its VITAE gone, the thing steps back and takes off the
  face it had been wearing for you. The telegraph you spent four rounds learning
  to read is replaced by cards you have never seen, and your plan is now a
  correct answer to a fight that no longer exists. You do not get a new resource.
  You get a new question, at the exact moment you thought you had the old one.
  The second mask is where a boss's name actually lives.
- **What it touches:** `axiomancer-mechanics/src/Enemy/enemy-keywords.ts` —
  `EnemyStage` gains one optional field: a stage deck of enemy-card ids that
  REPLACES the remaining compiled threat phases from the next phase boundary.
  Today the interface carries exactly `at` / `name` / `text` / `gain` / `cleanse`
  / `heal` / `threatBonus` / `curseCardId`, and none of them changes what the foe
  PLAYS. `axiomancer-mechanics/src/Combat/combat.engine.ts` ~4938-4990 — the
  stage block inside `processBetweenPhases`; the recompile seam is already
  adjacent, since `commitThreatBranch` rewrites `state.threatPhases` at that same
  boundary a few lines below.
  `axiomancer-mechanics/src/Combat/combat.enemy-decks.ts` — `compileEnemyDeck`
  grows a compile-this-tail entry point; `TieredEnemyDeck` and the grade-derived
  tiers stay exactly as authored.
  `axiomancer-mobile/state/presenters/combat-encounter.engine.ts:1048` — the
  `stage-entered` log line and its banner already render, and the telegraph strip
  re-reads phases from state, so the swap surfaces through shipped components.
  Content: `enemy.library.ts`'s 21 staged foes (17 boss + 4 unique, 47 stage
  rows) plus a boss-difficulty antagonist for cap-9. Barrel: `EnemyStage` is
  re-exported from `src/Enemy/index.ts`; an optional field is additive, so the
  `@mechanics` contract holds — but this touches the Combat public surface and
  the phase MUST state whether `npm run verify -w axiomancer-mobile` was re-run.
- **Prior art:** `kb:cthulhu-death-may-die/reception/reviews` (src-002,
  confidence high) — the Elder One's sequential Stages appear in the
  PRAISED-design section, credited with creating "a clear arc from investigator
  risk to boss confrontation." STEAL: the stage is the arc, not a damage bump.
  The same doc's src-003 shows the roster itself was the weak point, so stages
  alone are not the whole answer — pair with P-13. |
  `kb:aeons-end/rules/setup` (src-003, confidence high) — "The Nemesis deck is
  built in three tiers and stacked with tier 1 on top, tier 2 middle, tier 3
  bottom." STEAL: the escalation is in how the deck was BUILT. A stage deck is
  that stack made conditional on the wound instead of the clock. |
  `kb:slay-the-spire-the-board-game` (src-008, via
  `BoardGames/patterns/campaign-progression.okf.md`, confidence high) — a
  reviewer without video-game familiarity found progression past Act III "very
  unclear." AVOID: a deck swap the log does not announce in plain words.
- **Why now:** Three facts at HEAD. (1) The `EnemyStage` interface carries only
  `gain` / `cleanse` / `heal` / `threatBonus` / `curseCardId` as payload, and all
  47 authored stage rows across the 21 staged foes are keyword-and-number
  changes. A boss's card sequence is fixed for the whole fight. (2)
  `src/Combat/combat.enemy-decks.ts:81-82` sets `TIER3_DEFAULT_ROUND = 6`, while
  the stamped baseline measures `avgRounds` 2.59 early / 2.45 mid / 4.02 late /
  4.57 impossible, with a maximum of 6.07 across all 144 cells (stamp b1624da0 ·
  2026-09-11 · reduced-nightly, STALE by `df6e98f`). Tier 3 of every round-keyed
  boss deck is content almost nobody reaches; a VITAE-keyed trigger reaches what
  a round-6 gate cannot. (3) UNFILED, and verified independently:
  `EnemiesByMap['the-capital']` contains ZERO boss-difficulty members (6 normal,
  2 elite) and `src/World/MapEvents/content.ts:2170-2182` pins cap-9's climax to
  `the-factor`, which `enemy.library.ts:2540` declares `difficulty: 'normal'`.
  `src/World/MapEvents/handlers.ts:50-62` shows `isBoss` only decorates the event
  when `enemySlug` is set — so the boss VITAE multiplier,
  `THREAT_ESCALATION_BOSS_MULT`, `THREAT_RUNGS_BOSS`, the coveted-die default
  (`wagersCovetedDie` reads difficulty) and every stage all skip the game's
  current final fight. `plan/AUDIT.md:300-330` resolved the-capital's POOL
  OVERLAP on 2026-09-11 and never noticed the climax's shape.
- **Depends on / unblocks:** Depends on P-13 (a stage `gain:` wants keywords
  worth gaining). **Builds on an unfinished surface: build-plan Phase W5 is `[-]`
  partial at `plan/steps/01_build_plan.md:2546` (per-map enemy roster growth), so
  the roster this pitch's second half re-authors is not a finished band.**
  Extends `plan/PHASE_CANDIDATES.md:212` with new evidence rather than repeating
  it — that row is the missing door, this is the missing boss behind it, and
  `[loop-call] 12` records the row as discharged jointly with P-08. Unblocks
  P-08: cap-9 must be a climax before it is a doorstep.
- **Size:** **3-4** phases — the auditor's honest size; the pitch claimed 2-3 and
  the second half (18 staged foes' worth of authored stage decks plus a new boss
  record) does not survive the look. **The ladder promotes the engine phase and
  the cap-9 record, and routes the 18 remaining stage decks to `/adjust-enemies`
  under THE CONTENT LIFECYCLE SPLIT** (`[loop-call] 10`). Phase A (the engine):
  the optional `EnemyStage` deck field, the boundary recompile, hermetic e2e,
  applied to three exemplar bosses — one coastal, one northern, one Aporia.
  Playable increment: three fights visibly change their telegraph mid-fight.
  Phase B (the climax): cap-9 gets a boss-difficulty antagonist with two stages,
  and a test asserts every `isBoss` map-event payload resolves to a boss or
  unique record. Playable increment: the last map's climax fights like a climax.
  Phase C (the content tail, ROUTED to `/adjust-enemies`): the remaining 18
  staged foes get stage decks. Phase D (optional, CUT): a VITAE-keyed trigger for
  the flat-deck majority's derived tier 3. **No portrait is sourced by any
  promoted row** — art sourcing is a steward call per `[loop-call] 8`.
- **Keep-list risk:** Touches nothing on the keep-list and feeds all of it. A
  stage deck may wager the coveted die through `DECK_STAKES`, may shove a curse
  that costs a Conviction turn, and may print a card that punishes an unbroken
  Surge chain. Dice, Conviction, Surge and signatures stay the answer; only the
  question changes. Note in passing: `defaultEnemyStages`
  (`src/Enemy/index.ts:235`) currently fires for ZERO production enemies, because
  all 21 boss/unique records author their own — the default is a pinned floor
  with no live consumer, and this pitch is the occasion to either wire it or
  retire-and-archive it.
- **Kill criteria:** Stop if the exemplar swap pushes any late cell's `avgRounds`
  past roughly 8 — the fight has become attritional rather than sharper, and that
  is the wrong direction. Stop if a swapped tail can strand the phase pointer so
  the fight cannot advance; the round-gate design already guarantees the opener
  is never gated, and a stage deck must inherit that guarantee or ship as
  authored-tail-reorder only. Stop if `/combat-playtest` shows the swap reads to
  a player as "it hits harder now" — that is `threatBonus`, which already exists
  and costs nothing.
- **Done looks like:** The new `EnemyStage` field is optional and every one of
  the 47 existing stage rows compiles to byte-identical threat steps, pinned by a
  test. | A hermetic e2e proves the full beat: cross the threshold, the next
  telegraphed phase is a stage card, the pointer never stalls, and
  `stage-entered` fires exactly once. | cap-9's climax resolves to a
  `boss`-difficulty record with at least two stages, and a test asserts that
  every `isBoss: true` map-event payload resolves to a boss or unique enemy. |
  The mobile combat log announces the swap in words a first-time player can act
  on, using the shipped `stage-entered` banner — no new component. | Mechanics
  verify green AND `npm run verify -w axiomancer-mobile` re-run and stated in the
  phase record; `GAME_STATE_VERSION` asserted unchanged (encounter-scoped), or
  one hop with a pinned test if the combat-scoped read proves wrong.
- **Confidence:** 84.

---

## 4. The proposed phase ladder

**For `/oversight`, how to promote.** This session does **not** edit
`plan/PHASE_CANDIDATES.md` and does **not** edit `plan/steps/01_build_plan.md`.
To promote: copy the `- [ ] Phase …` rows below **verbatim** into the build
plan's "Next up" block, in the order given, and tick their provenance to this
file (`plan/2026-09-12-content-pitches.md` §4). The dependency, increment and
steward notes under each row are commentary for the promoting session and the
phase brief — they are not part of the row text. Two structural cautions before
you copy. First, **every numeric row collides with a pre-nexus phase number**
(`[loop-call] 1`), so every row, phase brief, commit message and source comment
this ladder writes must say **"build-plan Phase N"**, never a bare "Phase N".
Second, **Phases 102 and 103 are deliberately unclaimed** — the reckoning-branch
authoring they once held is routed to `/adjust-npcs` (`[loop-call] 15`). Promote
with the gap, or close it by renumbering 104-110 down by two; every dependency
below names its predecessor by **title as well as number**, so a renumber is
safe. Rows split for tick-size carry a letter (`92a`/`92b`, `106a`/`106b`)
rather than renumbering the tail.

**34 rows.** Numeric series continues at 79 (max at HEAD is 78, no gaps); world
series continues at W7 (max at HEAD is W6, and **W5 is `[-]` partial** at
`plan/steps/01_build_plan.md:2546`). Ordering rationale follows the rows.

---

**Head of ladder — pay immediately.**

- [ ] Phase 79 — The Strap: combat-legal consumables — a phase-play-gated `useSatchelItem` transition over the already-pure `useConsumableEffect`, a per-fight satchel allowance (never priced in Conviction, Surge or a die), a new CombatEvent variant, and the `src/Combat/types.ts:41` docblock corrected to match the code (axiomancer-mechanics; low)

> P-01 · depends on nothing — ladder head · Increment: the CLI combat driver
> drinks mid-fight and the log narrates it; the mobile screen is untouched, so
> nothing can regress. `GAME_STATE_VERSION` is **asserted unchanged, never
> asserted equal to a literal** — the value is brittle to any reorder. ·
> Steward after landing: `/adjust-equipment`.

- [ ] Phase 80 — The Phials: a `satchelVM` beside `signaturesVM`, the store action, and a phial strap on the combat board with stocked / exhausted-for-this-fight / empty-bag states under a stable testID (axiomancer-mobile; low)

> P-01 · depends on **Phase 79 (The Strap)** · Increment: a player finishes a
> fight they would have lost holding a bottle they earned three maps ago.
> Twenty-two authored consumables become reachable in the only place they
> matter. · Steward: `/adjust-equipment` inherits the 22-consumable re-pricing
> and the cache-reward quality tiering this makes a live balance surface.

- [ ] Phase 81 — The Census and the Funeral: `scripts/content-drift.mjs` fails on any printed keyword with zero carriers; `strip_random_buff` and `echo_next_spell` retired through the CURDLE rite; `befriend_attempt` annotated carrier-pending with its successor row named (build-plan Phase 87) — a third census state the gate reads and that expires when the carrier lands; the "30 KEYWORDS" header at `keywords.ts:5` and the repealed doctrine at `:20` replaced by a derived count (axiomancer-mechanics + axiomancer-mobile; low)

> P-10 · depends on nothing — runs parallel to Phase 79 · Increment: nothing a
> player sees, and the phase says so. CI now names every zero-carrier verb and
> the 52-row / 9-kind census can never silently drift again. The
> **carrier-pending** state exists so this row does not write an annotation
> Phase 87 must delete six rows later. · Steward: `/adjust-keywords` owns the
> atlas and the derived count from here on.

- [ ] Phase 82 — The Book of the Spared: a `codexRegistry` export on the @mechanics barrel replacing the in-CLI walk at `game.cli.ts:74`, and a memoir-adjacent reader rendering the 16 authored entries at full portrait size with sealed silhouettes and a spared count (axiomancer-mechanics + axiomancer-mobile; low)

> P-11 · depends on nothing — runs parallel to Phase 79 · Increment: sparing a
> thing produces a page the player can open without the dev menu. **The write
> side shipped under PRE-NEXUS Phase 73 (reducer case, friendship hook,
> persist-immediately path, migration guard); `game.reducer.ts:522` cites
> `plan/phases/phase_73_codex_journal_surface.md`, which does not exist at HEAD,
> while build-plan Phase 73 is the art-generation pipeline. Correcting that
> pointer is in scope for this row.** Note the sharpest instance of the
> numbering collision: `src/CLI/game.cli.ts:69` labels the in-CLI codex walk
> "Phase 82", and this row deletes it — the diff will read as Phase 82 deleting
> Phase 82's code. Say so in the brief. The reader's title is **provisional
> copy** pending the filed naming pass (`plan/PHASE_CANDIDATES.md:189`,
> `[loop-call] 16`). · No new art is sourced.

- [ ] Phase 83 — The Parish Stocks: an optional locale term on `rollCombatCardRewards` with the three-argument call pinned source-compatible, authored reward pools for the seven gauntlet maps built entirely from existing cards, and harness parity across `combat.deck-draft.ts` and `stageEligibleCardIds` (axiomancer-mechanics; medium)

> P-09 · depends on nothing — runs parallel to Phase 79 · Increment: reward
> screens differ by map for the first time; `deadCardRate` 0.6222 (stamp
> b1624da0) becomes a measurable target with zero new content authored and the
> barrel contract provably unbroken. · Steward: `/deck-tuning` owns the weights.

---

**Gate before you grow.**

- [ ] Phase 84 — The Offer Shape: a generic `World/EventChoice` contract (offer → optional sub-phase → outcome → done) with RestChoice and LootCacheChoice retrofitted byte-identically under snapshot pins, and `app/rest` and `app/cache` collapsed onto one offer sheet; if the byte-identical retrofit moves one shipped shilling price, this row ships the `/rest` double-reason fix and the shared offer-sheet component alone and Phases 86 and 99 widen `RestChoiceOfferId` directly (axiomancer-mechanics + axiomancer-mobile; high)

> P-05 · depends on nothing structural; **MUST precede Phases 86, 99, 104** ·
> Increment: nothing visibly changes, and the `/rest` finding at
> **`plan/AUDIT.md:253`** ("`/rest` greying an option for two possible reasons
> while naming only one", a sub-clause inside the `[loop-call]` row headed at
> `:247`) closes **by naming which of the two reasons binds, per the recommended
> option in `axiomancer-mobile/docs/reports/UI_FRESH_EYES_2026-09-12.md`
> section 4** — the `:247` row explicitly forbids the loop deciding those six
> product calls silently, so this is not a side effect. The kill-criterion
> fallback is **in the row**, so a `/ship-a-phase` tick that fires it still
> lands something green.

- [ ] Phase 85 — The Amended Page: authored `upgrade:` patches for the 12 apocrypha and the 6 theme capstones — the first non-zero use of `Card.upgrade` across the library — each with a `// pts:` line and an honest paidSummary, the default +40%/+25%/+1 rule kept as fallback and `baseCardId` still resolving oath/hex hooks (axiomancer-mechanics; medium)

> P-02 · depends on **Phase 81 (The Census and the Funeral)** — patched faces
> pass the census gate · Increment: amended cards are playable through
> `DebugCombatDeck` and measurable in the matrix. Every `+` in the game stops
> being the same number bump; the amendment lowers a floor or grows a seventh
> hit instead. · Steward: `/deck-tuning` owns the patch arithmetic.

- [ ] Phase 86 — The Third Offer: `amend` as a third EventChoice offer at the rest node, priced on an escalating module modelled on `card.removal.pricing` (5 + 5) and ANVIL_VERB_PRICING, with the picker forked from the shipped rest-cut-sheet (axiomancer-mechanics + axiomancer-mobile; medium)

> P-02 · depends on **Phase 84 (The Offer Shape)** and **Phase 85 (The Amended
> Page)** · Increment: a player amends a card on the map and it comes back with
> a cross beside its name. THE PATH axis 3 has a door; the `<id>+` string is the
> instance, so `GAME_STATE_VERSION` is asserted unchanged.

- [ ] Phase 87 — The Pardon: `befriend_attempt` card carriers, one per aspect with a printed gate, making a live mechanic kind priced at 3 points with zero carriers reachable by play against the 10 enemies already carrying `befriendabilityConfig` (axiomancer-mechanics; low)

> P-12 · depends on **Phase 82 (The Book of the Spared)** — mercy needs its
> payoff page first — and **discharges Phase 81's carrier-pending annotation** ·
> Increment: a fight ends in mercy for the first time in the stamped 4,320
> measured fights, and the shipped faction delta and journal write actually
> land. · Steward: `/adjust-cards` owns the alt-win carriers thereafter.

- [ ] Phase 88 — The Verdict: 3-4 further `concedeAt` carriers across ranks 3-6 and the enemy plate printing the floor the verdict must clear, under the existing face-honesty rule at `combat.cards.ts:342` (axiomancer-mechanics + axiomancer-mobile; medium)

> P-12 · depends on **Phase 87 (The Pardon)** · Increment: CONDEMN stops being
> two cards and a hidden 12/24/40/60 ladder; the player can see the number the
> sentence has to reach before they commit to reaching it.

- [ ] Phase 89 — The Glossary Half: `keyword` and `foe` added to TooltipKind, targets mounted on the hazard-deck chips and the combat board's marks, and a second codex tab listing all 52 KEYWORD_GLOSS rows and 9 ENEMY_KEYWORD_KINDS, pinned by a drift test that fails when a gloss row has no reachable target (axiomancer-mobile + axiomancer-mechanics; medium)

> P-11 + P-10 · depends on **Phase 81 (The Census)** and **Phase 82 (The Book of
> the Spared)** · Increment: every definition is reachable twice — in place and
> in the book. `plan/PHASE_CANDIDATES.md:203` closes, and it closes on a census
> that no longer lists verbs nothing carries. **This row's drift pin binds
> Phases 90 and 92a/92b**, both of which mint printable words after it.

- [ ] Phase 90 — The Tray Speaks: 6-8 cards backfilling the six zero-carrier dice verbs (`forge_floating_die`, `float_x_die`, `overheat`, `refresh_die`, `convert_die_color`, `spend_all_pips`), priced through the VERB_POINTS rows that already exist and nothing buys — each backfilled verb ships its KEYWORD_GLOSS row in the same tick, because the 52 live gloss keys carry no OVERHEAT, REFRESH, CONVERT or FLOAT row (axiomancer-mechanics + axiomancer-mobile; medium)

> P-10 · depends on **Phase 81 (The Census)**; must not break **Phase 89's**
> drift pin · Increment: the tray becomes a thing you build with rather than
> only roll, and FORGE finally has a card. Stop any verb the moment it needs
> `validateDieGear`'s miss floor to move — that verb flips to retirement.

- [ ] Phase 91 — The Glyph Decision (attended design session): promote the sandbox glyph set into the library (carriers authored, atlas row, card-editor union widened) OR retire `Card.glyph` and `state.glyphs` through the CURDLE rite (atlas Retired row, deprecated-effects test green, card-editor union narrowed) — either branch leaves the census gate green with nothing annotated away, and either is one tick (axiomancer-mechanics + axiomancer-mobile + axiomancer-card-editor; medium)

> P-10 · depends on **Phase 90 (The Tray Speaks)** · Increment: a card field that
> has shipped with zero library carriers stops being ambiguous. **Both branches'
> acceptance is stated in the row**, so the tick is green whichever way the
> session rules. A standing Gate-4 deferral is discharged in one direction or
> the other.

---

**The roster: vocabulary first, then the band, then the masks.**

- [ ] Phase 92a — The Lesser Orders (the checklist proven): two new EnemyKeyword kinds designed strictly as R7 taxes — pricing timing, sequencing or resource commitment, never deleting stacks, never granting immunity — through the full PIPELINE LIBERATION wiring checklist plus the TooltipKind foe target mounted in Phase 89, each with a printed floor and a hermetic e2e (axiomancer-mechanics + axiomancer-mobile; medium)

> P-13 · depends on **Phase 81 (The Census)** and **Phase 89 (The Glossary
> Half)** · Increment: two new shapes a fight can take, each legal below the
> boss line, and the 12-step checklist proven once. The exhaustive Records and
> two AssertNever guards make a half-wired kind a compile error, not a review
> finding.

- [ ] Phase 92b — The Lesser Orders (the pattern spent): the remaining one to two EnemyKeyword kinds on the pattern Phase 92a proved, same checklist, same floor-and-e2e discipline, same TooltipKind foe target (axiomancer-mechanics + axiomancer-mobile; low)

> P-13 · depends on **Phase 92a** · Increment: three or four taxes in total, all
> reachable below the boss line, and Phase 89's drift test still green. ·
> Steward: `/adjust-keywords` owns every future carrier claim.

- [ ] Phase 93 — The Elite Band: all 26 elites moved off the derived HIDE/SWIFT pair onto authored budget-compliant lists, with a test asserting the printed 0-1 / 1-2 / 2-3 budget computed AFTER `defaultEnemyKeywords` rather than from authored literals (axiomancer-mechanics; medium)

> P-13 · depends on **Phase 92b (The Lesser Orders, the pattern spent)**; note
> **build-plan Phase W5 is `[-]` partial at
> `plan/steps/01_build_plan.md:2546`** (per-map roster growth), so the elite band
> this row re-authors is not a finished surface · Increment: no two elites feel
> alike, and seven of nine enemy keywords stop being boss-exclusive. Uniformity
> relocated is not uniformity fixed — the test enumerates any remaining
> exclusions. · Steward: `/adjust-enemies` owns the band thereafter.

- [ ] Phase 94 — The Second Mask: an optional stage-deck field on `EnemyStage` that replaces the remaining compiled threat phases from the next phase boundary, the compile-this-tail entry point in `combat.enemy-decks.ts`, and three exemplar bosses — one coastal, one northern, one Aporia — with all 47 existing stage rows pinned byte-identical (axiomancer-mechanics; high)

> P-14 · depends on **Phase 93 (The Elite Band)** — a stage `gain:` wants
> keywords worth gaining · Increment: three fights visibly change what they hold
> mid-fight, narrated through the shipped stage-entered banner.
> Encounter-scoped, so `GAME_STATE_VERSION` is asserted unchanged.

- [ ] Phase 95 — The Factor Is Not a Clerk: a boss-difficulty antagonist record for cap-9 with two stages, and a test asserting every `isBoss` map-event payload resolves to a boss or unique record (axiomancer-mechanics; medium)

> P-14 · depends on **Phase 94 (The Second Mask)**; note **build-plan Phase W5 is
> `[-]` partial at `plan/steps/01_build_plan.md:2546`**, so the roster this row
> climaxes is not a finished surface · Increment: the last map's climax fights
> like a climax. The boss VITAE multiplier, `THREAT_ESCALATION_BOSS_MULT`,
> `THREAT_RUNGS_BOSS` and the coveted-die default stop skipping the game's final
> fight — verified at HEAD, `content.ts:2170-2182` pins cap-9 to `the-factor` at
> `CAP_BOSS_LEVEL` 22 with `isBoss` true while `enemy.library.ts:2540` declares
> TheFactor `difficulty: 'normal'`. · **Scope deliberately narrowed:** the stage
> decks for the remaining 18 staged foes go to `/adjust-enemies` under THE
> CONTENT LIFECYCLE SPLIT, and **the sourced portrait is struck from this row
> entirely** and routed to `/adjust-enemies` per `[loop-call] 8`.

---

**The wages: hop in a queue.**

- [ ] Phase 96 — The First Station: an ACT_SEAM table over the six shipped travel doors, an optional `stationId` on TravelPayload (MapEventKind stays 11), a run-scoped `stations` slice, GAME_STATE_VERSION 21→22 with `migrateV21ToV22` and its pinned test, and `resolveStation` returning the three-colour offer (axiomancer-mechanics; high)

> P-03 · depends on nothing hard; **owns the v22 hop by ladder ruling**
> (`[loop-call] 2`) · Increment: the CLI crosses a door, is offered a die, takes
> one, and the tray grows on the next roll. `Character.bonusTurnDice` gains its
> second writer and its first non-fixture one. This is the **11th** migration
> function; HEAD carries 10. · Steward: `/forge` owns seam placement,
> `/world-tuning` owns the offer contents.

- [ ] Phase 97 — The Colour You Starve: `app/station` and its presenter — the leg tally, the three-face pick, and the permanent write to `Character.bonusTurnDice` honouring the player's colour over `actRewardDieColors`' fixed body/mind/heart rotation (axiomancer-mobile; medium)

> P-03 · depends on **Phase 96 (The First Station)** · Increment: a player
> crossing nf-10 sees the First Station and fights the caverns with five dice.
> THE PATH axis 5 leaves the measurement seat; watch round-one OVERHEAT crack
> rate past three bonus dice.

- [ ] Phase 98 — The Grade: `Equipment.tier`, a three-row cost/magnitude ladder replacing the frozen literals in SIGNATURE_SKILLS, `getSignaturesForLoadout` returning graded pairs, and GAME_STATE_VERSION 22→23 with `migrateV22ToV23` backfilling tier 1 — with the 8-relic and no-duplicate-signature pins kept green (axiomancer-mechanics; high)

> P-04 · depends on **Phase 96 (The First Station)** for hop order only; **owns
> the v23 hop** · Increment: every relic is grade 1 and nothing changes for the
> player, but the rune prints the graded number and the whole ladder is provable
> before a door exists. The 1:1 relic-to-signature identity survives in the test
> suite, not just in a comment.

- [ ] Phase 99 — The Stone: `translate` as a further EventChoice offer priced off ANVIL_VERB_PRICING, authored onto a subset of the 16 instantiated rest nodes, with the mobile third option (axiomancer-mechanics + axiomancer-mobile; medium)

> P-04 · depends on **Phase 84 (The Offer Shape)** and **Phase 98 (The Grade)** ·
> Increment: a player lays a worn signet on the stone, pays, and the rite it
> grants is measurably bigger next fight. THE PATH axis 6 delivers power instead
> of count. **16, not 18** — re-derived this session as instantiated rest nodes
> (5 hard-authored + 4 + 3 + 3 + 1 from four pool factories); the same figure
> Phase 105 canonises.

- [ ] Phase 100 — The Grade on the Face: grade badge in EquipmentSlot and EquipDeltaPanel, graded copy in the signature-rune sheet, and the three per-grade relic names registered in `docs/retheme-map.json` (axiomancer-mobile; low)

> P-04 · depends on **Phase 99 (The Stone)** · Increment: the player can see
> which grade they carry without opening a rune popup. The per-grade names are
> **provisional copy** pending the filed naming pass
> (`plan/PHASE_CANDIDATES.md:189`, `[loop-call] 16`). · Steward:
> `/adjust-equipment` inherits the grade economy.

---

**The parish: gate, then ask, then collect.**

- [ ] Phase 101 — They Wrote Ahead: four hidden-when-unmet `DialogueChoice.requires` clauses (faction, goodwillAtLeast, codexEntry, regionSpared/regionExploited), the matching DialogueContext widening and `visibleChoices` predicates, a fifth `narrative-reachability` audit failing the World suite on any flag written and read by nothing, and the 35-flag dead count pinned as a descending ceiling (axiomancer-mechanics; medium)

> P-06 · depends on nothing hard; **MUST precede Phases 104, 106a and 107** ·
> Increment: nothing visible; CI names all 35 dead flags and pins the count as a
> descending ceiling — **that ceiling is this row's measurable increment**, since
> the two content rows that once carried it are routed to `/adjust-npcs`
> (`[loop-call] 15`). No new persisted field — all four slices already ship, so
> `GAME_STATE_VERSION` is asserted unchanged. · Steward: `/adjust-npcs` inherits
> the reckoning branches on its own cadence.

*(Phases 102 and 103 are deliberately unclaimed — see the pointer paragraph and
`[loop-call] 15`.)*

- [ ] Phase 104 — The Road Asks: an optional `offers` array on HazardPayload and GatheringPayload (absent means today's behaviour) and ten authored node slates across the northern continent, each offer carrying a stated cost and a stated reason when unaffordable (axiomancer-mechanics + axiomancer-mobile; medium)

> P-05 · depends on **Phase 84 (The Offer Shape)** and **Phase 101 (They Wrote
> Ahead)** · Increment: the mine gallery asks instead of happening. Of ~132
> instantiated entries, the 52 that resolve with no decision start falling.
> Hazard offers resolve as stated costs, never as a second combat. **Nodes are
> hard-placed** — no map-event `requires` primitive exists at HEAD and no row
> builds one (`[loop-call] 4`).

- [ ] Phase 105 — The Kind Floor: a per-map minimum kind spread asserted by a content-parity test, the anvil off fv-21 alone, town-across-river's five missing kinds authored, and the corrected instantiated spread written into `docs/gameloop.md` (axiomancer-mechanics; medium)

> P-05 · depends on **Phase 104 (The Road Asks)** · Increment: the die-gear
> economy is reachable from more than one node in 131, every map carries a
> legible kind spread, and the next session inherits the corrected arithmetic.
> **`docs/gameloop.md` carries no event-spread figure at HEAD** (grep for 186 /
> 132 / 131 / 93 returns nothing), so this row **writes the number fresh rather
> than correcting one** — the 186-is-two-times-93 double-count lives in the
> brief's §3 and the reader digest, and writing the true spread here is what
> stops it being re-derived from a factory-blind grep. Canonise **rest 16**, the
> figure Phase 99 spends. · Steward: `/world-tuning` owns the weights.

- [ ] Phase 106a — The Tally-Man's Ledger: a DebtChoice engine module on the shipped two-way sandbox contract, `debt` as the twelfth MapEventKind, an `arrears` ledger slice, and GAME_STATE_VERSION 23→24 with `migrateV23ToV24` and its pinned test — CLI-provable, no mobile surface (axiomancer-mechanics; high)

> P-07 · depends on **Phase 98 (The Grade)** for hop order, **Phase 101 (They
> Wrote Ahead)** and **Phase 105 (The Kind Floor)**; **owns the v24 hop** ·
> Increment: the CLI takes a loan it cannot afford and the ledger carries it
> across a map boundary. If the collection cannot be made to land at a legible
> moment, fall back to a single-node instant trade and drop the hop.

- [ ] Phase 106b — The Tally-Man's Desk: the `/debt` mobile route, presenter, copy file and store actions, the exhaustive `Record<MapEventKind, NodeType>` fix at `exploration.engine.ts:184`, and three authored crossroads nodes (axiomancer-mobile + axiomancer-mechanics; medium)

> P-07 · depends on **Phase 106a (The Tally-Man's Ledger)** · Increment: a player
> takes a loan they cannot afford and sees it on the character sheet. The
> exhaustive Record names every mobile break site at compile time.

- [ ] Phase 107 — The Collection: the follow-through event, the already-printed `arrears` curse written into `combatRewardCards` through the shipped path, the rest-node buy-back relabelled so 5 + 5 per removal reads as settling a debt rather than a generic cut, and a hard-placed collection node that resolves to a stated no-op with authored narration when the arrears slice is empty, pinned by an e2e that walks the node on a debt-free save (axiomancer-mechanics + axiomancer-mobile; medium)

> P-07 · depends on **Phase 106b (The Tally-Man's Desk)** · Increment: the loan
> comes due on a road the player chose, and card removal finally matters — the
> debt makes the shipped inverse verb load-bearing instead of routing around it.
> **The no-op clause is load-bearing, not decoration:** verified at HEAD,
> `src/World/MapEvents/types.ts` carries no `requires`, `gate` or `condition`
> field, and Phase 101 builds `DialogueChoice.requires` in `src/NPCs` — a
> different type on a different surface. Without the clause this row ships a
> mugging (`[loop-call] 4`). · Steward: `/world-tuning` owns the debt schedule.

- [ ] Phase 108 — Terms in Oaths (attended design session): debt terms that read the alignment axes — a high-CREED debtor offered a vow, a low-TROTH debtor offered someone else's name — with the register settled before a line is authored (axiomancer-mechanics; medium)

> P-07 · depends on **Phase 107 (The Collection)** · Increment: the Tally-Man's
> third term prices a choice in something other than coin, and the
> enchant-grammar braindump's oldest open question gets an answer of record.

---

**Open the door last — but not never.**

- [ ] Phase W7 — The Seventh Door: `labyrinth-continent` catalogued in `createStartingWorld()` so `changeContinent` stops hard-no-op'ing, cap-10 at [6,0] carrying a travel payload to aporia-colonnade on the exact nc-26 precedent, the column-law and terminal-column pins held unweakened, and the three act bosses re-pinned upward from 8/12/16 so the ladder does not run backwards across the door (axiomancer-mechanics; high)

> P-08 · depends on **Phase 95 (The Factor Is Not a Clerk)** — cap-9 must be a
> climax before it is a doorstep · Increment: a fresh-save CLI run walks fv-1
> through cap-10 to ap1-1 with no dev command. MapEventKind stays 11 and no
> persisted field is added, so **`GAME_STATE_VERSION` is UNCHANGED by this row —
> v24 at this point in the ladder, after Phases 96, 98 and 106a — because
> `GameState.labyrinth` is already optional and `mapStates` already preserves
> departed maps; the row asserts unchanged, never a literal.** · Steward:
> `/world-tuning` owns the re-pinned act-boss ladder; `/forge` owns the seventh
> door thereafter.

- [ ] Phase W8 — The House Admits You: an aporia-colonnade layout fixture in the exploration registry, the labyrinth screen routed off `currentContinent`, and `labyrinthUi.session.savedWorld` retired along with `enterLabyrinthAction` as an entry point (axiomancer-mobile; high)

> P-08 · depends on **Phase W7 (The Seventh Door)** · Increment: a phone player
> walks into the Aporia from the exploration tab; a side-session becomes a
> place. If the layout fixtures secretly assume the column law, ship the Aporia
> behind its own shipped `/labyrinth` route reached BY the travel event — the
> door is the deliverable, the renderer is not.

- [ ] Phase 109 — The Parish's Own Heresies: 2-4 locale-exclusive cards per continent — coastal, northern, labyrinth — authored into their existing theme modules with pricing comments and provenance tags, never a new family file (axiomancer-mechanics; medium)

> P-09 · depends on **Phase 83 (The Parish Stocks)** and **Phase W8 (The House
> Admits You)** · Increment: the card in your hand says where you have been, and
> the Aporia — 47 rooms with no card identity and no native bestiary — offers
> things seen nowhere else on the road. · Steward: `/adjust-cards`.

- [ ] Phase 110 — The Stock Named: the reward screen names the locale and its stock, so the pool is announced rather than silently applied (axiomancer-mobile; low)

> P-09 · depends on **Phase 109 (The Parish's Own Heresies)** · Increment: the
> player reads which parish stocked the offer instead of inferring it — the
> corpus's own complaint about silent progression, closed on the cheapest screen
> that can close it. The parish names this screen prints are **provisional copy**
> pending the filed naming pass (`plan/PHASE_CANDIDATES.md:189`,
> `[loop-call] 16`).

---

### Ordering rationale

The ladder is ordered by four constraints, in this priority: **pay immediately,
gate before you grow, hop in a queue, and open the door last.**

**PAY IMMEDIATELY.** Phases 79-80 lead because they are the cheapest
player-visible delta in the whole deck: the resolution function is already pure
and tested, the inventory is already inside the deep-cloned combat state, there
is no migration, no keep-list contact, and the file's own docblock currently lies
about it. Two ticks in, a player can drink the Phoenix Tear they have been
carrying since the fishing village. Phases 81-83 run alongside and are cheap for
different reasons — 81 is a CI gate with no player-visible change, 82 is a reader
over sixteen entries that shipped in July and were never read, 83 is a locale
term with zero new content authored. Four of the first five rows cost almost
nothing and three are visible in the first hour.

**GATE BEFORE YOU GROW.** Phase 81 precedes every row that adds vocabulary — the
glossary tab (89), the dice-verb backfill (90), the new enemy kinds (92a/92b) and
the amended card faces (85) — because a glossary that lists verbs nothing carries
is worse than no glossary. Phase 89 then pins a drift test over the 52 gloss rows
and 9 enemy kinds, so 90 and 92a/92b each carry their own gloss and tooltip
obligations **inside the row** rather than breaking a pin six rows later. Phase 84
precedes every row that adds an offer to a choice node, so the third and fourth
rest offers land on one contract rather than forking a two-member union twice.
Phase 101 precedes every row that ships a consequence, so the CI guard that fails
on a flag nobody reads exists before thirty-five more are written.

**HOP IN A QUEUE.** The three persisted-state rows are strung out deliberately:
96 owns v22, 98 owns v23, 106a owns v24, each named `migrateV21ToV22` /
`migrateV22ToV23` / `migrateV23ToV24` in the house's capital-`To` convention
(`migrateV20ToV21`, `game.migrate.ts:313`). Each is separated by at least one
intervening row so a failed migration is a single-tick rollback rather than a
three-tentpole one. **No row asserts a literal version number except the row that
owns the hop**; every other row asserts *unchanged*.

**OPEN THE DOOR LAST — but not never.** W7 and W8 sit late because the Capital is
seven maps of walking away and because the door must not open on a boss ladder
that runs backwards (L22 into L8) or on a climax fought by a normal-difficulty
clerk; Phase 95 fixes that climax first. They sit before the final two rows
rather than at the end because Phase 109's locale-exclusive cards are the reason
the new continent is worth walking to, and those cards cannot be authored for a
place no player can reach.

Two secondary orderings fall out of the same logic. The mercy pair is sequenced
payoff-first: Phase 82 gives the codex a reader, then Phase 87 gives mercy a key,
so the first pardon in the stamped 4,320 measured fights lands on a page that
already exists. And the roster is sequenced vocabulary-first: 92a/92b mint the
taxes, 93 spreads them across the elite band, then 94-95 give the bosses a second
face worth wearing — a stage that gains a keyword is only interesting once
keywords are worth gaining.

---

## 5. Considered and cut

One line each: name · score/18 · the axis that sank it. Scores are the panel's
verbatim figures.

| Pitch | Lane | Score | Sinking axis |
|---|---|---|---|
| P-C2 · Nothing Is Forgiven | cards | 13.7/18 | Player-visible delta — at hour one the counter is zero and the card reads flat; ACCRUE is a promissory note the one-session player never cashes. Rides existing Character state with no migration, the cheapest honest answer to the declined level-scaling fix. |
| P-C5 · The Keeping | cards | 13.3/18 | Player-visible delta — five curses with five different taxes is felt, but a first-timer has no baseline to feel it against, and the part that lands (contamination that follows you home) is phase 2 behind a migration. |
| P-K1 · The Wall Collects | keywords | 13.7/18 | Player-visible delta — only pays if the session hands you vigil, 20 of 128 cards. A combat verb, not a road the player walks. |
| P-K2 · The Wheel Eats | keywords | 12.7/18 | Opens doors — the wheel already turns in front of the player; nothing about the run gets bigger, and phase B is the first card-side write to a locked system's state at an unpriced cost. |
| P-K4 · The Counting Words | keywords | 13/18 | THE PATH — no progression axis moves, and phase C rewrites the atlas's last surviving quality bar; doctrine work hiding in a data phase. |
| P-E1 · THE BORROWED CONGREGATION | enemies | 12.7/18 | Cost honesty — the fishing village is already 13/13 native, so session one never meets the borrowed vestments; archetypes plus records plus licence-clean portraits is more than two phases. |
| P-E4 · HE SIGNS IN THIRDS | enemies | 11/18 | **KILLED — duplicate and false premise.** It is P-raw-27's Sophist arc restated one lane over at lower confidence, and its placement premise ("three of the 42 gauntlet nodes that carry no pool at all") is false at HEAD: every gauntlet node carries a pool, so the free-real-estate argument evaporates. |
| P-02 · A BUILDING IN THE SHAPE OF A COUNTRY | maps | 13.7/18 | Player-visible delta — entirely invisible to a first session, and it says 4+ out loud. Finds a real data-loss bug (a save inside the Aporia writes an empty continent catalogue) worth routing to `/iterate`. |
| P-03 · THE UNREVISED | maps | 10.7/18 | Cost honesty — a fourth continent nobody in one session will see, built on a ContinentName widening that touches both consumers; honestly 4+, and its own alternative (the run simply ends at the Unfounded Door) is the better pitch. |
| P-04 · CROOKED GROUND | maps | 12.3/18 | Player-visible delta — the cheapest hub candidate is town-across-river, five maps out. The cycle-safe traversal audit is the quiet gift; route it to `/forge`. |
| P-05 · EVERY COUNTRY KILLS YOU ITS OWN WAY | maps | 13.3/18 | Player-visible delta — a coastal hazard reading coastal is invisible without a second continent to compare it to. The bug underneath is not: mobile discards the engine's authored hazard damage outright. Cheapest row in the deck; route the bug to `/iterate`. |
| P-E1 · THE ROAD KEEPS ACCOUNTS | events | 13/18 | Player-visible delta — a gate is invisible until something earlier has been decided, so session one only pays in. Its 44-flags finding survives inside P-06. |
| P-E3 · THE PROCESSION | events | 12/18 | Uses what exists — bending the one-shot consumption rule sits against the resolution-control-flow wall, and the sibling map-chain pitch does the same job without touching it. |
| P-E2 · The Martyr's Thirds | equipment | 14/18 | Cost honesty — nothing drops one until phase C, so the session-one player wears empty slots; a new keyword through a three-way hand-synced glyph table is the V6 residue this deck keeps stepping around. |
| P-S2 · THE PRICE OF A STRAIGHT ANSWER | story | 11.7/18 | Register and cost honesty — a grey figure selling certainty by the sentence is the right scene, but the game's named antagonist is unreachable in any shipped build and this does not change that. |
| P-S3 · THE SWORN AND THE SPENT | story | 13.3/18 | Cost honesty — the revoke path has to floor on `MIN_COMBAT_DECK_SIZE` and stay idempotent without a hop, which is where the estimate gets thin. |
| P-S4 · THE PROCESSION AHEAD OF YOU | story | 11/18 | **KILLED — false premise.** Its entire justification is 42 poolless nodes "the largest playability hole in the shipped world"; caverns has full pool coverage and two other pitches in the same deck identify the figure as a factory-blind grep artefact. |
| P-A1 · THE GROUND UNDER THE FIGHT | art | 13.3/18 | Player-visible delta — one session sees one arena, so per-map ground is invisible now and obvious in hour six. The labyrinth kit precedent is the right answer to a ten-plate ask; route to `/forge`. |
| P-A3 · THE UNSIGNED PLATES | art | 11.7/18 | Cost honesty — production hygiene wearing a cassock, and it says 4+ honestly. |
| P-R2 · THE ROAD DOES NOT BEND | run | 13.3/18 | Uses what exists — phase 83 admits it works against the engine-structure wall, and the stamped late `avgRounds` of 4.02 says the tier may never fire. |
| P-R3 · THE UNFINISHED IS A PLACE | run | 10.7/18 | Opens doors — endgame content behind the last Station and behind another pitch's CONDEMN fix; it opens nothing else. |
| P-R4 · WHAT SURVIVES YOU | run | 14/18 | Cost honesty — the best-named screen in the deck (THE ROAD TAKES ITS TITHE), but migration coordination with the Stations pitch is flagged and not costed. Strong re-pitch candidate next session. |
| P-A · The Third Tier | prior-art:structure | 14.3/18 | **KILLED — duplicate.** Third of four `EnemyStage` deck-swap pitches; carries no finding P-14 and P-13 lack. |
| P-B · The Court Rises | prior-art:structure | 15.3/18 | **KILLED — bundle duplicate.** Its three load-bearing components are P-08, P-03 and P-raw-10; contributes no engine finding of its own at lower confidence than the pitches it subsumes. |
| P-C · The Map Lies | prior-art:structure | 12.3/18 | Cost honesty — the only other pitch that caught the 42-poolless error, but it is unsure whether reveal state fits `mapStates` and says so, leaving the estimate provisional. |
| P-A · THE MARGINALIA | prior-art:lategame | 16.3/18 | **KILLED — duplicate with worse engineering.** Same pitch as P-02 (authored upgrade patches, third rest offer, same filed row 1431) but buys a `GAME_STATE_VERSION` hop P-02 demonstrates is unnecessary. Fold its Storm-Scale receipts into P-02; two rest-node third offers must never both ship. |
| P-B · THE RECKONING | prior-art:lategame | 12/18 | **KILLED — merge duplicate.** P-raw-06's reprisal verb bolted to P-raw-02's campaign-scaling term, both of which carry more engine detail. Carry forward one thing: `the-reprisal-bell` and grave's `reprisalCardId` are a live naming collision to resolve before either verb ships. |
| P-C · THE SECOND BOOK | prior-art:lategame | 15.7/18 | **KILLED — duplicate, reluctantly.** Best prior art of the four stage-deck pitches and the sharpest observation (the docblock names Aeon's End and ships half of it), but the same field on the same interface as P-14, which additionally carries the verified cap-9 finding. Fold in: the Aeon's End no-reshuffle law as a pinned invariant, the three deckless northern bosses, and the read that `PHASE_CANDIDATES.md:1241`'s gate is dead. |
| The Orders of the Word | prior-art:legibility | 12.3/18 | Cost honesty — the half that lands (one mark per order) is the V6 glyph unification with four tables to reconcile, and phase 2 is the expensive one treated as the middle one. |
| The First Telling | prior-art:legibility | 13.3/18 | THE PATH — the most first-session-visible thing in the deck and mobile-only with no migration, but no progression axis moves; a typography argument, correctly so. Strong `/critic-loop` candidate. |
| The Uncarried Names | prior-art:legibility | 14.7/18 | **KILLED — duplicate.** Same nine zero-carrier kinds, same six-verb backfill, same census gate as P-10, which is more precise about the retirements and follows the shipped CURDLE format. Fold in its ballot criteria (the MTG Storm Scale rubric and Vilain's three keyword tests). |

---

## 6. Decisions taken (`[loop-call]` rows) and questions asked

**Questions asked: none.** This was an unattended run, so the brief's §6 Step 4
checkpoint was skipped and every owner-flavoured call was decided and tagged.
Sixteen `[loop-call]` rows follow, for `/oversight`'s ordinary review turn.

**1. NUMBERING — the collision is total, not limited to one row.** Nexus rows
continue at Phase 79 and Phase W7; verified at HEAD that no "Phase 79" string
exists anywhere under `plan/`, that the numeric series 0-78 has zero gaps, and
that W1-W6 are all present — **W5 is `[-]` partial**. But re-derived this session
over `axiomancer-mechanics/src` and `axiomancer-mobile`, pre-nexus phase numbers
in the 79-110 band appear in **133 live source comments** across 22 of the 32
numbers: Phase 80 ×25, Phase 110 ×15, Phase 88 ×13, Phase 93 ×12, Phase 108 ×12,
Phase 92 ×10, Phase 87 ×9, Phase 79 ×6, Phase 109 ×6, Phases 84/91/99/105 ×3
each, Phases 83/95/103/107 ×2, Phases 82/86/97/100/102 ×1 — and
`axiomancer-mechanics/CHANGELOG.md` carries a separate pre-nexus series reaching
166. **Every numeric row in this ladder collides.** The worst instance is
concrete and already inside the ladder's own text:
`src/CLI/game.cli.ts:69` reads `// Phase 82 — Codex lookup. Walks EnemyLibrary
once at module load …`, and ladder Phase 82 proposes deleting exactly that walk;
the diff will read as Phase 82 deleting Phase 82's code. **Ruling: every row,
every phase brief, every commit message and every source comment this ladder
writes says "build-plan Phase N", never a bare "Phase N".**

**2. THE MIGRATION QUEUE.** Three surviving pitches each claimed
`GAME_STATE_VERSION` 21→22 (Stations, the grade ladder, the arrears slice).
Ruled: hops are sequential and named in the row text — **Phase 96 owns v22
(`migrateV21ToV22`), Phase 98 owns v23 (`migrateV22ToV23`), Phase 106a owns v24
(`migrateV23ToV24`)** — capital `To` per `migrateV20ToV21` at
`game.migrate.ts:313`; HEAD carries 10 migration functions, so Phase 96's is the
**11th**. No phase may open a hop it did not claim in its own row, and **no row
asserts a literal version number except the row that owns the hop**. Reasoning:
folding three unrelated persisted slices into one hop couples three tentpoles
into one tick and makes rolling back any one of them a rollback of all three.

**3. THE HARNESS BEFORE THE DOORS.** Phase 84 (the generic `EventChoice`
contract) is promoted ahead of both rest-door rows, so `amend` (86) and
`translate` (99) land on one contract instead of widening `RestChoiceOfferId`
bespoke twice. Verified live that the union is exactly `'rest' | 'cut'`
(`restchoice.types.ts:20`) and that two independent pitches each proposed
widening it. **The contingency now lives IN Phase 84's row text**, not only here:
if the byte-identical retrofit moves one shipped shilling price, that row ships
the `/rest` fix and the shared offer sheet alone and 86 and 99 widen the union
directly, knowingly paying the cost twice.

**4. THE MISSING PLACEMENT GATE — and the row that actually needs it.** Both
events-lane survivors named a `requires` clause for map events as a dependency;
that pitch did not survive the panel. Verified at HEAD:
`src/World/MapEvents/types.ts` carries **no `requires`, `gate` or `condition`
field anywhere**, and Phase 101 builds `DialogueChoice.requires` in `src/NPCs` —
a different type on a different surface. Ruled: **Phases 104, 106a/106b AND 107**
hard-place their nodes and do not wait on a gate no surviving pitch builds; Phase
101 is sequenced first so the predicate pattern and its CI guard exist before any
hard-placed consequence ships. Phase 107 is the row whose whole premise is a node
that should fire only for a player who owes, so it carries an explicit acceptance
line: **a hard-placed collection node resolves to a stated no-op with authored
narration when the arrears slice is empty, pinned by an e2e that walks the node
on a debt-free save.** Without that clause the row ships a mugging.

**5. W-01 § ACCESS IS SUPERSEDED.** T's binding 2026-07-07 ruling ("dev menu in
the character tab ONLY… no exploration-tab or story wiring until the last
continent exists") is ruled superseded for the purpose of Phase W7, and the
reversal is filed for `/oversight` after-the-fact review rather than waited on.
Reasoning: THE OPEN GATE ¶1 (`plan/bearings.md:501` § head) retires
`needs-user-call` as a blocking state and ¶8 (`:553`) makes new continents a
standing mandate; the ruling's own precondition is a deferral that no shipped
work and no surviving pitch will ever satisfy, so it functions as a permanent
gate by accident on 47 finished rooms, 118 POIs, a full mobile UI and 46 tests.

**6. THE LADDER DOES NOT SHIP A BACKWARDS BOSS.** The act-boss re-pin is scoped
INTO Phase W7, not deferred. The Factor is pinned L22 (`CAP_BOSS_LEVEL`) and the
Doorwarden L8 (`labyrinth.pools.ts` act1 8 / act2 12 / act3 16) — a 14-level drop
across the new door would make the game's third continent read as the easy option
the moment it becomes reachable. Opening bid 24/28/32; calibration routed to
`/world-tuning`, which owns the numbers after the door exists.

**7. `plan/AUDIT.md:533` ANSWERED — fork (c).** The mid/late equipment fork is
ruled the grade ladder, and `plan/PHASE_CANDIDATES.md:1598` ("fill the three
empty accessory kinds with new mid/late signature skills + relics") is marked
SUPERSEDED rather than promoted. Fork (b), stat-only accessories, re-opens the
teardown recorded verbatim at `Items/types.ts:7-10` (phases 21-23 retired rarity,
affixes and item sets) and feeds only `derivedStats`, the one channel that never
prints a number on the board. Fork (a), a ninth signature, adds width to a kit
whose problem is fundability — a loadout can already hold two 8-cost signatures
against `CONVICTION_CAP` 12. Depth before width.

**8. THE PARKED ART PICK IS NOT A LADDER ROW — and the consequence is stated.**
The nine W5 portrait candidate sets (`plan/AUDIT.md:657`) are handed to
`/adjust-enemies` on its next ordinary tick and no phase is scheduled for them.
THE OPEN GATE ¶6 makes art sourcing the loop's call outright. **Applied
consistently, this also strikes the sourced cap-9 portrait from Phase 95** — so
the 34-row ladder ships **zero new art**, and lane 8 is carried by the codex and
glossary reader surface (Phases 82 and 89), which brief §4 lane 8 explicitly
names. Said here rather than left for a reader to discover in §1.

**9. TWO ROWS AND ONLY TWO CARRY `(attended design session)`:** Phase 91
(promote-or-retire `Card.glyph`) and Phase 108 (debt terms priced in
CREED/TROTH). Every other row is answerable from the tree by a single tick. Those
two set a card-field contract and a standing register respectively, and each has
a prior deferral of record (Gate-4 for glyph; the 2026-07-13 enchant-grammar
braindump's open question for oath-priced terms). Marking a row is scheduling it
for `/oversight`'s ordinary turn, not waiting on the owner. **Phase 91's row now
states BOTH branches' acceptance**, so the tick is green whichever way the
session rules — a row whose scope is a branch is otherwise not one
green-and-playable tick.

**10. THE OPTIONAL TAILS ARE CUT, NOT CARRIED.** Seven pitch-declared optional
phases are dropped from the ladder and routed to stewards: the in-combat
amendment payoff, the Station narration and codex entry, the normal/simple
enemy-keyword band, the VITAE-keyed flat-deck tier, the alt-win enemy denial
pass, the codex's honest-ledger pass, and — added by this session — **the stage
decks for the remaining 18 staged foes**, which `/adjust-enemies` inherits on the
same reasoning. Under THE CONTENT LIFECYCLE SPLIT each is `/adjust-*` or
`/world-tuning` work, not a `/ship-a-phase` tick.

**11. THE LADDER OPENS WITH THE SATCHEL, NOT A HEADLINE.** Phases 79-80 lead.
Verified at HEAD that `src/Combat/types.ts:41` asserts in writing that only
consumables are usable in combat while nothing under `src/Combat` reads
`Character.inventory` — two rows, no migration, no keep-list contact, resolution
already pure in `useConsumableEffect`, and the payoff is visible in the first
fight a player loses holding a Phoenix Tear. A ladder that starts paying in two
ticks buys the credibility the rows after it will spend.

**12. THE CAPITAL'S PENDING ROW IS DISCHARGED, NOT RE-PITCHED.**
`plan/PHASE_CANDIDATES.md:212` ("The Capital is the new frontier — no door onward
yet", score 5.5) is answered jointly by Phase W7 and Phase 95. Brief §7 forbids
re-pitching a Pending row unchanged; W7 supplies the destination that row
explicitly declined to name, and Phase 95 fixes the defect the row never noticed
— cap-9's climax resolves to `the-factor`, declared `difficulty: 'normal'`, so
the boss VITAE multiplier, `THREAT_ESCALATION_BOSS_MULT`, `THREAT_RUNGS_BOSS`,
the coveted-die default and every stage skip the game's current final fight.

**13. NO ROW MAY CITE THE 4% LATE CLIFF.** The live baseline (stamp b1624da0,
measured 2026-09-11, confidence reduced-nightly, reported STALE only by the
content-only commit `df6e98f`) reads early 0.9729 / mid 0.9700 / late 0.8201 /
impossible 0.0875, and D31b voids every late figure measured before 2026-09-03.
The "still too hard" section of the big-numbers decisions doc is stale text that
reads as live. Any row measuring against the late campaign cites the stamp, not
the doc — and the honest live finding is the opposite one: **impossible is 8.75%,
not 0%, and RELENT is the leak** (win-path counts victory 1, capitulate 20,
defeat 219 — 20 of 21 non-defeats).

**14. SPEC DRIFT IS NOT A LADDER ROW EITHER.** `spec.md`'s dead ADR-0005
non-goal, the retired equipment-library line, and the three retired encounter
drivers still listed as shipped are handed to `/consolidate` rather than given a
phase. They are memory-curation defects, not build work, and brief §1.3 already
forbids citing the ADR-0005 line as a blocker.

**15. THE RECKONING BRANCHES ARE STEWARD WORK — Phases 102 and 103 are
withdrawn.** The synthesis carried two rows (five Northern voices given reckoning
branches; Blackwater and the Chronicler reading faction standing) that are pure
dialogue authoring against machinery Phase 101 ships — the ordinary shape of an
`/adjust-npcs` tick, which brief §7 forbids pitching. `[loop-call] 10` cut six
optional tails on exactly this reasoning and these two survived unexplained.
Ruled: **both are routed to `/adjust-npcs`, Phases 102 and 103 are left
unclaimed, and Phase 101 carries the descending dead-flag ceiling as its own
measurable increment** so it is not a row whose only deliverable is invisible.
`/oversight` may promote with the numbering gap or close it by renumbering
104-110 down by two; every dependency in §4 names its predecessor by title as
well as number.

**16. THE NAMING PASS IS UNSCHEDULED, AND THREE ROWS SHIP PROVISIONAL COPY.**
`plan/PHASE_CANDIDATES.md:189` (score 6.5, "One concept, one word — a naming pass
across the player-facing surfaces") is cited by P-11 as something that must land
AFTER the codex page, yet Phases 82, 100 and 110 each author new canonical
player-facing copy and no ladder row schedules the pass. Ruled: **82, 100 and 110
ship provisional names the pass will reconcile, and each of those three rows says
so**, so the copy is not later defended as canon. The naming pass itself inherits
the codex page (Phase 89) as its canonical surface and is left for `/oversight`
to schedule on its ordinary turn — it is a copy pass across shipped surfaces, not
a build row, and it cannot be written before the surface it reconciles exists.
*(The two citations P-11 originally gave were wrong and are corrected throughout:
the naming pass is `:189`, not `:187` — that line is the bare `## Pending`
header — and the glossary row is `:203`, not `:194`.)*

---

## 7. Hand-off

Which steward or lane owns each tentpole once `/oversight` promotes it.

| Tentpole | Primary owner after promotion | Inherits |
|---|---|---|
| **T1 · THE WAGES OF THE ROAD** | `/deck-tuning` | The amendment patch arithmetic (after Phase 85) and the graded-signature numbers (after Phases 86 and 98). |
| | `/adjust-equipment` | The 22-consumable re-pricing and the cache-reward quality tiering that Phase 79 makes a live balance surface for the first time; the grade economy after Phase 100. |
| | `/world-tuning` | The Station offer contents (after Phase 96) and the escalating rest-door prices. |
| | `/forge` | The ACT_SEAM placement across the six shipped doors. |
| **T2 · THE PARISH KEEPS ACCOUNTS** | `/forge` | The seventh door after W7, the aporia-colonnade layout fixture, and any twelfth `MapEventKind` under THE CONTENT LIFECYCLE SPLIT. |
| | `/world-tuning` | The per-map kind floor (after Phase 105), the debt schedule (after Phase 107), and the re-pinned act-boss ladder (opening bid 24/28/32, after W7). |
| | `/adjust-npcs` | **The reckoning branches outright** — the five Northern voices and the Blackwater/Chronicler receiving half, withdrawn from the ladder per `[loop-call] 15` — plus the descending dead-flag ceiling Phase 101 pins. |
| | `/adjust-cards` | The locale-exclusive card pools after Phase 109. |
| **T3 · NINE WORDS AND NO MOUTH** | `/adjust-keywords` | The atlas, the derived count, and every future carrier claim once the Phase 81 gate stands; the new enemy kinds' atlas rows after 92a/92b. |
| | `/adjust-enemies` | The elite band after Phase 93; **the stage decks for the remaining 18 staged foes** and **the cap-9 portrait**, both routed out of Phase 95 (`[loop-call] 8`, `[loop-call] 10`); the Aporia-native roster the seventh door exposes; the parked W5 portrait candidate sets; and the `codex-the-incompleteness` orphan. |
| | `/adjust-cards` | The alt-win carriers after Phases 87-88 and the enemy-side denial pass deliberately cut from this ladder. |

Cross-cutting, owned by no tentpole:

- `/consolidate` — the spec-drift items in `[loop-call] 14`.
- `/oversight` — the numbering convention in `[loop-call] 1` (enforce
  "build-plan Phase N" in every promoted row and brief), the W-01 § Access
  reversal filed in `[loop-call] 5`, the `AUDIT.md:533` ruling in
  `[loop-call] 7`, and scheduling the naming pass per `[loop-call] 16`.
- `/iterate` — two bugs surfaced by cut pitches and worth filing without a
  phase: mobile discarding the engine's authored hazard damage
  (P-05 · maps), and a save written inside the Aporia writing an empty
  continent catalogue (P-02 · maps).
