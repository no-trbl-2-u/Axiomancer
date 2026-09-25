# Prompt: THE BIG NUMBERS REWRITE — full card library + enemy overhaul (one shot)

> Written 2026-09-02 at T's direction from a KB-mining pass (Mage Knight,
> Dawncaster, Slay the Spire, Aeon's End, Cthulhu: Death May Die, Arydia, the
> MTG/deckbuilding design references) plus a full repo survey. This file is a
> **handoff prompt**: paste it (or point an agent at it) to open a fresh
> session that performs the overhaul in one shot. Everything in §1–§3 is a
> decision; everything after is the brief and the map. Do not re-litigate §1–§3.

---

## 0. Your mandate

You are rewriting the **entire player card library** and the **entire enemy
roster's combat data** of the Axiomancer monorepo (`axiomancer-mechanics`,
`axiomancer-mobile`, `axiomancer-card-editor`). You have full authority over
card data, enemy data, keyword vocabulary, pricing, tests, docs, and any
engine hook a new keyword needs. You finish with **`npm run verify` green at
the repo root** (all three packages) and the catalog regenerated.

Work mode:

- **One shot.** Don't stop to ask; decide, record the decision in the ADR-style
  log this prompt asks for (§12), and move on. Where this prompt gives a
  number, use it; where it gives a range, pick inside it; where it is silent,
  pick something in the spirit of the three pillars.
- **Bold, not careful.** The previous library was tuned to death under ~35
  "laws" (§3). They are gone. You are not preserving balance numbers, curve
  shapes, pins, or bands — you are replacing them and re-deriving whatever
  guard is still worth having.
- **Sim-verified, not sim-governed.** Run the playtest harness at the end and
  fix anything that fails §13's acceptance criteria. Do not let the harness
  drag you back to small numbers.
- The repo has a nexus loop with hooks (`.claude/settings.json` →
  `.claude/hooks/guard.mjs`): every `.md` write is lexicon-linted, `kb/` and
  `docs/reports/baselines/*.json` are unwritable by hand, `verify`/tests must
  never be backgrounded, no `--no-verify`, no `-F` commit messages, no
  Co-Authored-By trailers. Work with them, not around them.
- Prose register: the game's tonal North Star is Mörk Borg by way of the
  "Profane Canon" (`axiomancer-mechanics/docs/profane-canon.md`,
  `plan/north-star-mork-borg.md`) — doom-liturgical, terse, cruel, funny in
  the dark. This is voice guidance, not a law. Names like *the Black Cap*,
  *Communion of the Worm*, *Edict of the Open Wound* are the register.

---

## 1. The three pillars

### Pillar 1 — BIGGER NUMBERS (a scale reset, not a nudge)

T's words: *"I want to see bigger numbers."* Today an Ash-rank card applies
POISON 1, a Rib-rank guard is 8, a boss telegraphs ~25, and the deadliest
burst in the game is 240 damage that only happens in one test. Numbers must
read like Slay the Spire / Dawncaster: a starter hit is **6–9**, a mid-rank
hit is **20–30**, a Saint-rank finisher is **45–70** flat or **100+** when a
scaler is fed, a boss has **hundreds** of VITAE, and the impossible fight has
**thousands**. Full ladder in §5. The point is not difficulty — it's that
every card play should feel like it *moved* something visibly.

### Pillar 2 — RICHER MECHANICS AND KEYWORDS

Prior art to steal from is in the KB (`kb/KnowledgeBase/`, MCP server
`kb-query`). The keyword language must earn each row by Vilain's three tests
(flavor, compression, class) and MTG's keyword-plus-reminder-text discipline,
budgeted by rank the way New World Order budgets by rarity: Ash/Tooth cards
are simple and lenticular; Skull/Saint cards are where the engine-y stuff
lives. Full keyword brief in §6. Cards should do **more than one thing**,
have **conditions that pay off** (Dawncaster's Ambush/Finale/Flow/Chain
family), **scale** (X-costs on ◆ Conviction, per-affliction, per-Soul), and
sometimes **break the rules** (ignore HIDE, repeat, steal a die, conjure a
card).

### Pillar 3 — ENEMIES THAT ESCALATE AND TELEGRAPH BIG

Enemies go from "a threat sequence with a damage weight" to **creatures with
keywords, defensive stats, and staged decks** (Mage Knight's enemy abilities;
Aeon's End's tiered, non-reshuffled nemesis deck; Cthulhu: DMD's Elder One
stage cards). A boss should change shape mid-fight. A telegraph should say
"**38**", not "moderate".

---

## 2. What is KEPT (the only three constraints)

1. **The 5/5/5 colour law for presets.** Each starter/preset deck is split
   into exact aspect thirds by `philosophicalAspect` (body/mind/heart).
   Today's presets are 18/30/45 cards at 6/6/6 · 10/10/10 · 15/15/15 —
   sizes are yours to change, thirds are not. Enforced at
   `src/Combat/combat.starter-deck-presets.ts:24,:315` and
   `src/Combat/e2e/deck-presets.engine.test.ts:86`. Keep that assertion.
   The die→card colour match (`combat.engine.ts:1947`) is the *mechanic*
   that makes 5/5/5 meaningful; keep the mechanic as the default. You may add
   keyworded exceptions (an "ANY" card, an off-colour-at-half play) if a
   design wants them.
2. **Every card has a FREE line.** A card must be playable without a die
   (`Card.free: CardRider`, `playTopAction` at `combat.engine.ts:1819`).
   Existence only — the old sub-rules (25–35% budget, "constrained fork",
   theme-currency deposits, DRAW-1 kicker, generic-draw ban) are released.
   Today oath/hex author no `free` and instead get a timed FREE instance via
   `playFreeEnchant` (`:1774`); that satisfies "playable without a die" and
   may stay — or give them a real `free` line too. Your call; record it.
3. **The one-tray-roll-per-threat-phase fix stays** (`turnTakenThisPhase`,
   `combat.encounter.types.ts:733`, `startTurn` at `combat.engine.ts:552`,
   `src/Combat/e2e/turn-law.engine.test.ts`). It is a bug fix (the
   endTurn→startTurn Conviction farm), not a design law. Keep it and its test.

Everything else in the design space is open.

---

## 3. What is REPEALED

T: *"I want to remove ALL laws we've created."* The survey enumerated 35
decisions-of-record; the three above survive. The rest are void. You do not
need to honour any of them, and you must **delete or rewrite their
enforcement** so `verify` stops defending them. Locations:

| # | Repealed law | Where it lives — delete / rewrite |
|---|---|---|
| L4 | "THE STRIKE IS DEAD" (no `basePower`/`chipHp`; HP only falls to DoT/payoff) | `docs/lexicon.json` rows `base-power`, `chip-hp`, `strike-ban-doctrine` (:13-25, :169-175); `docs/LEXICON.md:29-33`; `src/Cards/e2e/curated-library.engine.test.ts:162-177`. **Direct damage is back** as a first-class verb. |
| L5 | Status-effect-focused / status-primacy doctrine | `docs/lexicon.json:176-183` (`status-primacy-doctrine`); `spec.md:42-46` prose; test prose `combat-playtest.balance-bands.sim.test.ts:12`, `card-coverage.sim.test.ts:11`; live assertion `balance-bands.sim.test.ts:65-77` (`statusEngagement > 0`, `dotHpFraction > 0`). Delete. |
| L6 | "TICK killed" ratification | Not executed anyway. TICK is yours to keep, rename, or drop. `keywords.ts:173`, `src/Cards/types.ts:392-395`, `combat.card-complexity.ts:52`, `cards.pricing.ts tickOne`. |
| L7 | DoT clock per family (POISON=card-played, BLEED=damage-instance, MARK no calendar, DOOM per-enemy-action; event clocks never round-tick) | `src/Effects/types.ts:62-84`, `debuffs.library.json`, `src/Combat/e2e/dot-trigger-clocks.engine.test.ts`, `pricing.engine.test.ts:85-120`, `card-face-honesty.guard.test.ts:110,:155`. The **mechanism** (`DotTriggerClock`) is useful — keep the type; the **assignment** per family is yours. |
| L9 | Momentum ratifications (global, engine-native, temp die) | `combat.engine.ts:235-311`, `momentum-wheel.engine.test.ts`, mobile `momentum.ts`. Keep the wheel if it serves; it's no longer sacred. |
| L10 | Concede/CONDEMN ladder 8/10/12 | `src/Combat/effects.ts:154-174`, `combat.engine.ts:1461-1471`, `the-black-cap`, `keywords.ts:383`. Rescale or redesign alt-wins freely (§8.6). |
| L11 | RELENT 35%/floor 10, Wavering 45%/Faltering 80% | `effects.ts:181-240`, `combat.engine.ts:1322-1420`, `win-path-scaling.engine.test.ts:182`, `charm-resolve-milestones.engine.test.ts`. |
| L12 | RUPTURE cap 0.60×maxHP; ALL-spenders uncapped | `types.ts:110-117,:211-214,:237-240`, `keyword-atlas.md:79,:99`, `themed-decks.engine.test.ts` (240-burst pin). |
| L13 | THE COVETED DIE (bosses stake exactly card #2) | `combat.enemy-decks.ts:12-19,:171-175,:222`, `coveted-die.engine.test.ts`, `new-enemies.engine.test.ts:148-152,:184-188`. Stakes become a free design tool. |
| L14 | Enemy deck laws (2–5 cards, last = spike, one curse-injector/archetype) | `combat.enemy-decks.ts:12-19`, `new-enemies.engine.test.ts:64-88`. |
| L15 | Enemy stat law total = k×level | `Enemy/e2e/enemy.engine.test.ts:85-118`, `ENEMY_STAT_PER_LEVEL` (`src/Game/game-mechanics.constants.ts:168`), `enemyStatBudget` (`Enemy/index.ts:97`). |
| L16 | 1:1 art law | `enemy.library.ts:4-6`, `new-enemies.engine.test.ts:54-62`. (Practically: keep every existing `portraitAsset` binding — art exists, don't orphan it — but the *law* is gone.) |
| L17 | Rank bands / pricing lint (common 1.5–7.5 … rare 7–19) | `pricing.engine.test.ts:41-82` **and the three clones** `roles-themes.engine.test.ts:86`, `bridge-rewards.engine.test.ts:69`, `haunts.engine.test.ts:376`; `cards.pricing.ts VERB_POINTS`. See §10. |
| L18 | Archetype package shape (7 cards = 2c/2u/1r/1 oath/1 hex; library = 57) | `curated-library.engine.test.ts:35-66`, `docs/profane-canon.md §2`, `cards.library.ts:1-52`. |
| L19 | Deck-size laws 18/30/45, cap 50, ≤4 copies, LINEAGE multiset | `combat.starter-deck-presets.ts:22-30,:65,:169`, `deck-presets.engine.test.ts` (keep only the thirds assertion). |
| L20 | Card-keyword doctrine (every mechanic a registry KEYWORD; atlas row at 3+ cards) | `keywords.ts:20-24`, `keyword-atlas.md:27-45`. Replaced by §6's own discipline. |
| L21 | Registry count pin (42 rows) | `axiomancer-mobile/state/combat/__tests__/keywords.test.ts:31-44`. No count pins survive (§10). |
| L22 | P0-truth style clauses (≤130 chars, no em dash/semicolon, "the foe") | `paid-summary-honesty.engine.test.ts:1-38`, `types.ts:629-641`. **Keep the number-parity half** (every number the engine applies appears on the face) — that's a bug detector, not a law. Drop the style clauses. |
| L23 | Doctrine win-rate curve 80/50/30/0 | `combat.playtest.ts:127-133,:418`, `combat.curve-shape.ts`, `balance-bands.sim.test.ts:159-239`, `axiomancer-mechanics/CLAUDE.md`, `VISION.md`. |
| L24 | CQI objective function / win-rate-not-a-term | `specs/35-objective-function-v2.md`, `docs/lexicon.json:184-191`. |
| L25 | HP sole win condition; alt-wins are exceptions | `VISION.md:20-28`, `spec.md:114-125`, `lexicon.json:26-32` (`pressure-tracks`). |
| L26 | Reshuffle law / no fatigue ever | `specs/32:151`. (Dawncaster's HEAVY/One Use and Mage Knight's wounds are now legal ideas.) |
| L27 | Conditionality law (exactly one condition line at Tier 2+) | `src/Cards/types.ts:672-675`, `specs/32:150-151`. |
| L28 | Naming law NL-1..NL-9 / V-1..V-6 | `specs/34 §3`, `scripts/check-naming-law.mjs`, `docs/retheme-map.json`, root `npm run lint:names`, `scripts/check-naming-law.test.mjs`. Delete the enforcer from root `test` or gut it to "id is kebab-case and unique". |
| L29 | The 15 spec-34 renames as *enforced vocabulary* | `docs/lexicon.json` rename rows; `docs/LEXICON.md`; post-write hook. You may keep the current words (PLEA, CHARGE, CONDEMN, RELENT, QUARTER, TOLL…) — they're good — but if you rename anything, **edit `lexicon.json` in the same commit** or the hook will block your own docs. |
| L30 | Spec-34 §8 "What does NOT change" | `specs/34-dark-fantasy-campaign.md:845-882`. Void. |
| L31/L32 | Pipeline-liberation checklist; atlas prior-art receipt rule | `docs/keyword-atlas.md:1-45`. Replace the atlas header with §6's discipline; receipts are welcome, not required. |
| L33 | Card-editor drift contract | `axiomancer-card-editor/src/data/mechanics.contract.ts`. **Keep as a correctness guard** (it's a type assertion, cheap, catches real breakage) — just update it as you add kinds. |
| L34 | Cross-package impact checklist | `AGENTS.md:55-100`, `verify-mechanics.yml`. Keep the CI job (it's just "run the other packages' verify"), but you are not bound to it as ritual. |
| L3 | THE COLOR LAW as *law* | See §2.1 — kept as a mechanic, released as a law. |
| L8 | Round-turn law as *law* | See §2.3 — kept as a bug fix. |

Doc hygiene after repeal: mark `specs/32`, `specs/34 §3/§8`, `specs/35`,
`plan/archive/2026-09-25-trim-t4/plan/tuning/2026-07-10-*.md`, `plan/archive/2026-09-25-trim-t4/plan/tuning/2026-07-11-*`, `docs/profane-canon.md`
as `**Status:** HISTORICAL` in their first 40 lines (this is also the
check-lexicon banner exemption). Rewrite `axiomancer-mechanics/CLAUDE.md`'s
"Load-bearing doctrine" block and `VISION.md`'s combat section to state §1–§2
of this prompt and nothing older. Prune every `doctrine`-type row from
`docs/lexicon.json`.

---

## 4. The tree you are editing (read these first, in this order)

Paths are relative to `axiomancer-mechanics/` unless prefixed.

**Card side**
- `src/Cards/types.ts` — `Card` (:582-711), `CardRider` (:377-447, 24 fields),
  `CardSpecialMechanic` union (:295-339; 43 kinds; `AssertNever` :342-359),
  `CardRank` 1–6 = Ash/Tooth/Splinter/Rib/Skull/Saint, `CardType`
  spell/oath/hex, `CardTheme` rot/debt/grave/vigil/trial/choir/curse.
- `src/Cards/cards.library.ts` (1448 ln, 57 cards) — the whole library.
- `src/Cards/card-themes.ts:16-47` — `THEME_KEYWORDS`.
- `src/Cards/cards.pricing.ts` — `VERB_POINTS`, `CONDITION_DISCOUNTS`,
  `DOT_TEMPO_SURVIVAL`; `src/Cards/card.engine.ts` (legacy, no-ops combat
  mechanics); `cards.sandbox.ts`, `cards.haunts.ts`, `cards.allies.ts`,
  `synergy-predicates.ts`.
- `src/Effects/debuffs.library.json`, `buffs.library.json`,
  `src/Effects/types.ts` (`DotTriggerClock` :68).
- `src/Combat/combat.cards.ts` — `toCombatCard`, `mechanicText`, `riderText`
  (face projection); `combat.card-complexity.ts`.

**Engine**
- `src/Combat/combat.engine.ts` (5287 ln). Entry `playCombatCard` :1028 →
  `playTopAction` :1819 (FREE) / `playBottomAction` :1854 (PAID; colour
  check :1947; `combatEffects` → `specialMechanics` in authored order →
  condition lines via `applyRiderToState` :1524) / `playFreeEnchant` :1774.
  Resolvers: `applyEnemyDamage` :1240, `gainSouls` :1299, `gainSway` :1333,
  `gainPremises` :1428, `applyForetell` :1490, `computeRungDenial` :3505,
  `settleStake` :3535, `resolveThreatPhase` :3576, `processBetweenPhases`
  :4147, `crackGlyph` :4909, `endCombat` :3487. Projections :5044-5265.
- Constants: `READ_DAMAGE_MULT` :101-103 (1.5/1.0/0.5),
  `COLOR_MATCH_DAMAGE_BONUS = 3` :112, `THREAT_DAMAGE_SCALE = 1.7` :116,
  `CONVICTION_CAP = 12` :137, `THREAT_WEAKEN_PER_ROLL` :133,
  `SWAY_DECAY_PER_TURN` :150, escalation block :164-202,
  `PIP_INTENSITY_BONUS/PIP_GUARD_BONUS` :222-224, `FATE_TAP_CONVICTION` :229,
  momentum :235-311, `stanceBeats` :319-323.
- `src/Combat/combat.dice.ts` — face bag `['heart','body','mind','wild','x','x']`
  :26-36, `RESERVE_MAX`/`RESERVE_PIP_CAP` :107-109, `TURN_DICE_COUNT = 3`,
  overheat bust 35%. **Leave the dice model alone** unless a keyword needs a
  hook (e.g. STEAL-DIE, an extra die, a re-roll).
- `src/Combat/combat.threat.ts` (512 ln) — `AuthoredThreatPhase` :34-98,
  branches :108-114, `DIFFICULTY_MULT` :197-199, damage budget :274-283,
  rage :433-435, `defaultStanceCheck` :451.
- `src/Combat/effects.ts` — DoT clocks, `capitulateThreshold`, concede floors.
- `src/Combat/combat.starter-deck-presets.ts` — the presets (§2.1).
- `src/Combat/combat.encounter.types.ts` — `CombatEncounterState`
  (counters: `conviction` :736, `premises` :855, `souls` :892, `sway` :895,
  `staggerRungs` :868; pools `guard`, `barrier`, `riposte`), `CombatEvent`.
- `src/Game/game-mechanics.constants.ts` — `HEALTH_PER_STAT = 5` (:29;
  VITAE = (body+heart+mind)×5 for player AND enemy via
  `Utils/index.ts:198 calculateMaxHealth`), `ENEMY_STAT_PER_LEVEL = 3` (:168),
  gear-tier term.

**Enemy side**
- `src/Enemy/types.ts:222-326` — `Enemy` schema (no authored VITAE field
  today; `difficulty` simple/normal/elite/boss/unique; `logic`;
  `befriendabilityConfig` :29-53; `friendshipReward` :103-141).
- `src/Enemy/enemy.library.ts` (2904 ln; 73 `createEnemy`, 72 in
  `EnemyLibrary`, `EnemiesByMap`, `ENEMY_REGISTRY`; 68-portrait roster).
- `src/Enemy/index.ts` (`createEnemy`, `enemyStatBudget`, XP table :66-72).
- `src/Combat/combat.enemy-cards.ts` (108 cards, `EnemyCard` :69-93, 7
  archetypes :36-38), `combat.enemy-decks.ts` (72 decks, `DECK_STANCE_CHECKS`
  :147-162, `compileEnemyDeck`), `combat.threat-sequences.ts`, `src/Enemy/loot.ts`.

**Keyword surface (four channels — every keyword you add touches all four)**
1. `axiomancer-mobile/state/combat/keywords.ts` — `KEYWORD_GLOSS` :164-258,
   `EFFECT_KEYWORD` :35-56 (effect id → keyword), `MECHANIC_KEYWORD` :112-150
   (mechanic kind → keyword), `SYSTEM_GLOSSARY` :371-387,
   `keywordsInPersistentText` :288-300.
2. `axiomancer-mechanics/docs/keyword-atlas.md`.
3. `src/Effects/debuffs.library.json` / `buffs.library.json` (status ids).
4. `axiomancer-mobile/state/presenters/combat-encounter.engine.ts:1953`
   (`mechanicHeadline` per-mechanic face text) + `components/combat/statusGlyphs`.

**Downstream consumers**
- `axiomancer-card-editor/src/data/mechanics.ts` (adapter),
  `mechanics.contract.ts` (kind-union assertion — update),
  `src/server/cardCodegen.ts` (rewrites `cards.library.ts` blocks by id — keep
  the `const <ident>: Card = {…}` block shape so it still round-trips;
  `src/server/__tests__/round-trip.test.ts`).
- `scripts/export-catalog.ts` → `devlog/data/*.json` (gitignored; run
  `npm run catalog` at the end).
- `axiomancer-mobile/state/mocks/combat.mock.ts:8-18` (hardcoded Brine Hag
  placeholder — update to the new numbers), `state/presenters/combat-encounter.engine.ts:967-1005`
  (alt-win meters), mobile tests `deck-presets.test.ts`, `starter-bundles.test.ts`,
  `combat-reward-draft.test.ts`, `card-face-honesty.guard.test.ts`.

**KB (read-only, `kb/KnowledgeBase/`; or MCP `kb-query`: `kb_keyword`,
`kb_cards`, `kb_search`, `kb_read_doc`)**
- `DigitalCardGames/dawncaster/keywords/*.okf.md` (141 keyword docs) and
  `cards/` (1,692 cards; `cards.json`).
- `DigitalCardGames/slay-the-spire/cards/` (`cards.json`).
- `BoardGames/games/mage-knight/rules/{overview,actions,turn-structure}.okf.md`.
- `BoardGames/games/aeons-end/rules/{overview,turn-structure,setup}.okf.md`.
- `BoardGames/games/cthulhu-death-may-die/rules/`, `BoardGames/games/arydia-the-paths-we-dare-tread/rules/`.
- `References/mtg/{keywords-and-reminder-text,new-world-order-complexity-budget,lenticular-design,color-pie-as-permission-system}.okf.md`.
- `References/deckbuilding/{card-design-and-keywords,balance-methodology,deck-economy-thinning-and-bloat}.okf.md`.

---

## 5. THE SCALE LADDER (Pillar 1, concrete)

Reference points from the KB: Slay the Spire Strike 6 → Bash 8 → Clothesline
12 → Carnage 20 → Bludgeon 32; Dawncaster Lightning Bolt 1–12, Elite Lightning
Bolt 1–20, Deathblow 15, Heavy Swing 15, Big Bomb 40, Meteor Storm 12/turn;
Mage Knight enemies armour 3–10 / attack 3–9 against a hero with ~7-card
hand and 5 wounds to death. Use those registers; ours below.

### 5.1 VITAE

- **Player:** replace `VITAE = stats × 5` with
  `PLAYER_VITAE = 50 + (body+heart+mind) × 8` (`HEALTH_PER_STAT` at
  `game-mechanics.constants.ts:29`, `calculateMaxHealth` `Utils/index.ts:198`).
  Level-1 ≈ 100, level-3 ≈ 120, level-18 ≈ 350. Update
  `Character/e2e/character.engine.test.ts:117`, `Utils/e2e/utils.engine.test.ts:207`.
- **Enemy:** add an authored `vitae?: number` to the `Enemy` schema; when
  absent derive `round((30 + 18 × level) × VITAE_MULT[difficulty])` with
  `VITAE_MULT = { simple: 0.6, normal: 1.0, elite: 1.6, boss: 2.5, unique: 3.2 }`.
  Targets: L1 normal ≈ 50, L7 elite ≈ 250, L6 boss ≈ 350, L13 normal ≈ 260,
  L16 boss ≈ 800, L18 boss ≈ 900, Kudan (L10 unique) ≈ 670, **The Unfinished
  (L110 unique) ≈ 6,400**. Hand-author `vitae` on every boss/unique.
  Stats (`baseStats`) stay for stance/proc logic but no longer drive VITAE.

### 5.2 Player card numbers by rank (PAID line, before die/read bonuses)

| Rank | Single hit | Multi-hit | GUARD | BARRIER | DoT per tick (initial stacks) | HEAL | ◆-scaler per ◆ |
|---|---|---|---|---|---|---|---|
| 1 Ash | 6–9 | 3 × 2 | 8–10 | — | POISON 3 / BLEED 4 | 5 | — |
| 2 Tooth | 9–14 | 4 × 3 | 12–16 | 8 | 4–5 | 8 | 3 |
| 3 Splinter | 14–20 | 5 × 4 | 16–22 | 12 | 6 | 12 | 4 |
| 4 Rib | 20–30 | 7 × 4 | 22–30 | 18 | 8 | 16 | 5 |
| 5 Skull | 30–45 | 9 × 5 | 30–40 | 25 | 10–12 | 22 | 6 |
| 6 Saint | 45–70 | 12 × 6 | 40–60 | 35 | 15 | 30 | 8 (12 ◆ → 96) |

- **FREE line** ≈ 30–45% of the PAID headline, or a different verb entirely
  (a FREE MARK, a FREE draw, a FREE ◆). It must be worth playing; a FREE line
  nobody would ever choose is a design failure (StS: dead cards are bugs).
- Payoffs (RUPTURE, REAP, CONDEMN, ◆-dumps, Soul-dumps) are **uncapped** and
  should reach **100–300** in a fed deck. The 240 REAP burst is the floor of
  the new ceiling, not its peak.
- Colour-match bonus: replace flat `COLOR_MATCH_DAMAGE_BONUS = 3` with
  **+25% (min +2)** on damage/guard numbers so the bonus scales with rank.
  `PIP_GUARD_BONUS` 2 → 5, `PIP_INTENSITY_BONUS` 1 → 2. Keep
  `READ_DAMAGE_MULT` 1.5/1.0/0.5. Keep `CONVICTION_CAP = 12` (the ◆-scalers
  make it matter).
- DoT: rescale every `damagePerRound` in `debuffs.library.json` ~×3–4 and
  give each DoT a growth story (POISON decays per tick like Dawncaster,
  BLEED spikes on hit, DOOM grows per play and detonates — Dawncaster Doom:
  "+1 each time an Action is played"). Pinned arithmetic in
  `pricing.engine.test.ts:85-120` is void — re-derive or delete.

### 5.3 Enemy threat numbers

Replace `threatDamageBudget` (`combat.threat.ts:274-283`) with
`round((6 + 2.5 × level) × DIFFICULTY_MULT × (1 + 0.2 × phaseIndex) × damageWeight)`
and delete `THREAT_DAMAGE_SCALE`. Keep `DIFFICULTY_MULT`. Weights now range
0.8–1.6. Resulting telegraphs: L1 normal 8 → spike ~18; L6 boss 31 → spike
~70; L18 boss 76 → spike ~170; The Unfinished 400+. Keep the escalation
clock (`THREAT_ESCALATION_*`) but audit its max (2.0) against the new
VITAE — the intent is "bosses end fights", not "everything ends fights".

### 5.4 Alt-win and resource counters

Rescale to the new VITAE: RELENT threshold = 35% of VITAE (min 20); CONDEMN
floors 12/16/20 (or redesign, §8.6); Souls/PLEA/CHARGE gains per card ×2–3
so their payoffs reach the 100–300 band above. Exploit strike
(`max(10, 0.5 × maxHealth)`) stays as a fraction.

---

## 6. THE KEYWORD LANGUAGE (Pillar 2, concrete)

### 6.1 Discipline (replaces L20/L31/L32)

- A keyword exists when ≥2 cards (or ≥2 enemies) use it **and** it passes
  Vilain's three tests: it has *flavor* (the word evokes the effect), it
  *compresses* (the reminder text is longer than the word), and it has
  *class* (it groups cards into a family a player can recognise). One-card
  mechanics stay as plain rules text on the card.
- Every keyword prints with reminder text on first sight (the mobile
  popup — `KEYWORD_GLOSS`) and every printed number is the number the
  engine applies (§10's parity guard).
- Complexity budget by rank (New World Order): **Ash/Tooth** cards carry ≤1
  keyword beyond a damage/guard verb and never a trigger condition;
  **Splinter/Rib** carry ≤2 keywords, may carry one condition; **Skull/Saint**
  are unbudgeted. Lenticular design is the goal at Ash: a card that reads
  simply to a new player and reveals a trick to an expert.
- Colour pie (MTG): each *aspect* has primary/secondary/tertiary access to
  verbs. Suggested: **body** = damage, multi-hit, GUARD, WRATH, RUPTURE;
  **mind** = FORETELL, draw, MARK, CHAIN, TWIN, STAGGER, CONDEMN;
  **heart** = HEAL, BARRIER, SOUL/REAP, PLEA, SIPHON, DOOM. A theme spans
  aspects (5/5/5 must be buildable inside every theme's pool).

### 6.2 Keep (rescaled per §5): POISON, BLEED, DOOM, MARK, RUPTURE, SIPHON,
PROLONG, FESTER, RECOIL, FALLEN, IMMOLATE, DRAW, HEAL, MILL, RECALL, REPLAY,
REQUIEM, ECHO, FORETELL, GUARD, THORNS, RIPOSTE, BARRIER, CHARGE, STAGGER,
BACKFIRE, PLEA, QUARTER, SOUL, REAP, CLEANSE, KINDLE, PURGE, SENTENCE,
CONDEMN, TOLL, BOON/HONE/TEMPER (die gear). Audit each for a definition
that still reads well at the new scale; merge any two that have become
synonyms (e.g. decide whether ECHO and REPLAY are one thing; whether TICK
survives as "advance every DoT one step" — it can, if ≥2 cards want it).

### 6.3 New player-side keywords (source in brackets — steal the *feel*,
adapt the *rule* to our die/stance/single-foe model)

| Keyword | Rule | Source |
|---|---|---|
| **Deal N** | Direct VITAE damage. Plain text, not a keyword. Multi-hit prints `N × k`. | StS/Dawncaster |
| **PIERCE** | This damage ignores HIDE and cannot be reduced. | Dawncaster *Piercing*; MK "ignore armor" |
| **OVERKILL** | Damage beyond lethal (or beyond a stated threshold) converts: +◆ or heal or Souls. | Dawncaster *Overkill* |
| **EXECUTE N** | If the foe is at ≤ N% VITAE, this hit slays outright (or deals ×2 — pick one and keep it). | Dawncaster *Execute*/*Deep Wound* |
| **WRATH N** | Combat-long: your hits deal +N each. Stacks. | StS *Strength*; Dawncaster *Rampage/Anger* |
| **FLAY N** | Foe takes +50% damage from your next N hits. | StS/Dawncaster *Vulnerable* (10%/stack, cap 100%) |
| **TWIN** | The next spell you play this turn resolves twice. | Dawncaster *Echo* (cast twice), StS Double Tap |
| **CHAIN** | +N damage to your next hit per stack; fades if a play didn't add CHAIN. Ties into a HIGH-TIDE style state at ≥3. | Dawncaster *Chain/Tides* |
| **AMBUSH** | Bonus if this is the first card played this round. | Dawncaster *Ambush* |
| **FINALE** | Bonus if this is your last die / ≤2 cards in hand. | Dawncaster *Finale* |
| **FLOW N** | Bonus if you have played ≥N cards this turn. | Dawncaster *Flow* |
| **CONJURE** | Put a temporary named card in hand; it vanishes after use / at combat end. | Dawncaster *Conjure* |
| **CINDER** | Removed from the deck for the rest of this combat when played (stronger than IMMOLATE if IMMOLATE means "to discard"). | Dawncaster *Untempered/One Use* |
| **LEAD** | This card does not reshuffle when the deck runs out. | Dawncaster *Heavy* |
| **CHARGES N** | Playable N times this combat, then depleted. | Dawncaster *Charges/Durability* |
| **WOUND** | A curse card the foe puts in your deck when an unguarded hit ≥ N lands; unplayable / FREE-only "bleed 2". | Mage Knight wounds; Dawncaster *Corruption* |
| **VOW** | Oath-type: persists while a condition holds, breaks (with a cost) when it doesn't. | Dawncaster *Channel*; MK "until end of turn" |
| **DIE-STEAL / EXTRA DIE / RE-ROLL** | Skull/Saint-only: take the foe's staked die, roll a fourth die, re-roll the tray. | Mage Knight mana; the STAKE system |

Add 8–14 of these (not all). Each addition must be wired through all four
channels in §4 plus: `CardSpecialMechanic` kind (with the `AssertNever`),
`CardRider` field if it is a rider, `mechanicText`/`riderText`,
`combat.card-complexity.ts` weights, `cards.pricing.ts` points, the editor's
`SPECIAL_MECHANIC_KINDS` + `mechanics.contract.ts`, the atlas, and a test in
`src/Combat/e2e/` proving the engine applies exactly the printed number.

### 6.4 New enemy-side keywords (Mage Knight enemy abilities are the model)

| Keyword | Rule |
|---|---|
| **HIDE N** | Flat −N to every hit against this foe (armour floor 1 as in MK: a hit always deals ≥1 unless HIDE ≥ hit). PIERCE ignores it. This is *the* reason bigger single hits matter versus many small ones. |
| **SWIFT** | GUARD/BARRIER count at half against this threat. |
| **BRUTAL** | Any unguarded remainder of this threat is doubled. |
| **VENOM N** | Any VITAE damage this threat deals also applies POISON N. |
| **UNSHAKEN** | Immune to STAGGER (rungs can't be denied). |
| **ELUSIVE** | HIDE is doubled until you STAGGER it this round. |
| **REGROW N** | Heals N at the end of each of its phases. |
| **RAVENOUS** | Heals for VITAE damage it deals. |
| **WOUNDING N** | Unguarded hit ≥ N puts a WOUND in your deck. |
| **STAGE** | Boss/unique only: at a VITAE threshold (or round) it changes stage — new deck tier, cleanse, keyword gain, telegraph text. See §8.3. |

Give every enemy 0–1 keywords at simple/normal, 1–2 at elite, 2–3 plus STAGE
at boss/unique. Enemy keywords print on the enemy pane with popups
(`SYSTEM_GLOSSARY` / a new `ENEMY_KEYWORD_GLOSS`).

---

## 7. THE CARD LIBRARY REWRITE

### 7.1 Shape

- **Target 100–120 cards** (hard floor 90). Rewrite all 57 existing cards to
  the §5 scale — keep an id and name when the card's identity survives,
  retire it when it doesn't — and add the rest. The 7-card package shape is
  gone; a theme may have 12–18 cards unevenly spread across ranks 1–6 and
  types spell/oath/hex, plus a small **neutral** pool (theme-less, any aspect)
  and **6–10 curse/WOUND cards** (rank 1, `purge_self` or unplayable).
- Keep the 7 themes and their names (rot, debt, grave, vigil, trial, choir,
  curse) — they carry art, lore, and enemy archetype ties — but re-cut
  `THEME_KEYWORDS` so each theme has **one axis it owns** and one it borrows:
  - **rot** — affliction stacking and payoff: POISON, BLEED, FESTER, RUPTURE,
    FLAY, EXECUTE. The DoT deck that ends with a 200-point RUPTURE.
  - **debt** — power now, cost later: RECOIL, FALLEN, WRATH, OVERKILL,
    CINDER, WOUND-eating. The deck that hits 45 at Splinter and pays VITAE.
  - **grave** — deck as resource: MILL, RECALL, REPLAY, ECHO, TWIN, LEAD,
    CONJURE, REQUIEM. The deck that plays the same 30-point card three times.
  - **vigil** — walls and reprisal: GUARD, BARRIER, THORNS, RIPOSTE, CHARGES,
    VOW. The deck whose 40 GUARD *is* 40 damage back.
  - **trial** — tempo and control: CHARGE, STAGGER, MARK, CHAIN, AMBUSH,
    FLOW, FINALE, FORETELL, CONDEMN. The deck that denies the spike and wins
    the argument.
  - **choir** — resolve and harvest: PLEA, QUARTER, SOUL, REAP, HEAL,
    CLEANSE, KINDLE, SIPHON, DOOM. The deck that relents a boss or reaps 12
    Souls for 150.
  - **curse** — the negative pool: PURGE, WOUND; player-side curses stay
    rank 1.
- **Every card**: FREE line + PAID line (§2.2). PAID = one die of the card's
  aspect (default), read/pips/colour bonuses apply. Conditions
  (`threshold`/`dieBonus`/`fate`/`fallen`/`glyph`/`synergy`) are free to
  stack; the one-condition law is gone — but obey the §6.1 rank budget.
- Preset decks: rebuild THREADBARE/PILGRIM/APOSTATE (or rename/resize them)
  on the new library at exact aspect thirds (§2.1). ≤4 copies and the
  LINEAGE multiset law are gone; a preset may be any legal thirds deck.
  Reward pool = everything not seated in a preset and not a curse.

### 7.2 Worked examples at scale (write to this register; adapt freely)

```
Spoiled Poultice (rot · Ash · spell · body)
  FREE: POISON 3.
  PAID: Deal 7. POISON 4.                                   [was POISON 1 d2]

Chilblain Watch (vigil · Ash · spell · body)
  FREE: GUARD 5.
  PAID: GUARD 12. THORNS 4.                                 [was GUARD 6 / THORNS 1]

The Reprisal Bell (vigil · Rib · spell · heart)
  FREE: RIPOSTE 8.
  PAID: GUARD 24. RIPOSTE 18. FINALE: RIPOSTE hits twice.

Communion of the Worm (rot · Skull · spell · heart)
  FREE: FESTER 2 (every affliction on the foe gains 2 stacks).
  PAID: RUPTURE ALL — deal 6 per affliction stack consumed. SIPHON 50%.
        PIERCE.                                             [uncapped; 30 stacks = 180]

Blank Indenture (debt · Tooth · spell · body)
  FREE: Deal 6. RECOIL 3.
  PAID: Deal 18. RECOIL 6. OVERKILL: excess heals you.

The Black Cap (trial · Saint · oath · mind)
  FREE: CHARGE 2.
  PAID: SENTENCE — CONDEMN at 20. While this oath holds, every AMBUSH card
        adds CHARGE 2. FINALE: CONDEMN at 16 instead.

Miserere (choir · Saint · spell · heart)
  FREE: SOUL 1. HEAL 6.
  PAID: REAP ALL — deal 14 per Soul. HEAL half the damage dealt.

Open Every Grave (grave · Skull · spell · mind)
  FREE: RECALL 1.
  PAID: TWIN. REPLAY the last spell you played.

The Besieger's Winter (vigil · Skull · spell · body)
  FREE: BARRIER 8.
  PAID: BARRIER 30. VOW: while BARRIER ≥ 20, your THORNS deal double.

Wound (curse · Ash · —)
  FREE only: lose 2 VITAE. PURGE this.                     [dealt by WOUNDING foes]
```

### 7.3 Text rules that survive as *bug guards*

- Every number the engine applies appears on the face (`paidSummary`,
  `free` riders, `persistentEffect`). Keep the parity half of
  `paid-summary-honesty.engine.test.ts`; drop the style clauses.
- Every UPPERCASE token on a face is a registry keyword with a gloss
  (mobile `card-face-honesty.guard.test.ts` "every printed keyword has a
  popup" — keep).
- Every card registers ≥1 play across the coverage sim
  (`combat-playtest.card-coverage.sim.test.ts`) — keep the dead-card
  detector, drop its count pin.

---

## 8. THE ENEMY OVERHAUL

### 8.1 Roster

Keep the 72 enemies' ids, names, portraits, maps, lore lines, loot, XP,
befriendability, and alignment — the *identity* layer is fine and hooked
into world/NPC/journal code. Rewrite the **combat** layer of every one:
`vitae` (§5.1), `keywords` (§6.4, new field `keywords?: EnemyKeyword[]`),
`difficulty`, deck, threat sequence, `stanceHint`, and add `stages` to
every boss/unique. Add 4–8 new enemies **only** if you can reuse an existing
portrait honestly (variants: "the Harbormaster's Ledger", "Kudan Reborn") —
do not ship portrait-less roster entries.

### 8.2 Enemy decks → tiered, escalating, non-reshuffled (Aeon's End)

Replace the flat 2–5-card sequence with a **three-tier deck**:

```ts
interface EnemyDeck {
  tier1: EnemyCardId[];     // 2-4 cards: openers, cheap tells
  tier2: EnemyCardId[];     // 2-4 cards: the pattern, first stake, first keyword use
  tier3: EnemyCardId[];     // 1-3 cards: spikes, signature, finale
  shuffleWithinTier?: boolean;   // default false = authored order (zero RNG stays possible)
  loop?: 'tier3' | 'rage';        // what happens when tier3 is exhausted
}
```

Tiers resolve in order; a tier never reshuffles into an earlier one
(Aeon's End: nemesis deck tiers 1→2→3 escalate by construction). Simple
enemies may have only tier1+tier3. Bosses get all three plus `stages`.
Keep `AuthoredThreatPhase`/`branch` as the per-card model; keep zero-RNG
branch commits. `rungs`, `stake`, `unlockAfterRound`, `curseCardId` remain
tools with no law attached (any card may stake; any archetype may carry
several curse-injectors).

Enemy cards: rewrite the 108 to the §5.3 weights (0.8–1.6), give each an
explicit **printed number** in `actionText` (the engine's computed damage,
not "moderate"), and add ~40–60 new cards for tier3/stage/keyword use
(target 150–170). Grades `common/escalation/signature` → `tier1/tier2/tier3`
(or keep grades and add `tier`; your call).

### 8.3 Boss stages (Cthulhu: DMD Elder One / Aeon's End nemesis)

```ts
interface EnemyStage {
  at: { vitaePct?: number; round?: number };   // first satisfied wins
  name: string;                                // "THE COURT ADJOURNS"
  text: string;                                // telegraphed one line, printed in the log + pane
  gain?: EnemyKeyword[];                       // e.g. ['BRUTAL']
  cleanse?: boolean;                           // strip player afflictions on it
  heal?: number | { pct: number };
  deck?: Partial<EnemyDeck>;                   // swap/append tiers
  threatBonus?: number;                        // +weight to every phase after
  curseCardId?: string;                        // WOUND/curse injection
}
```

Every boss: 2 stages (e.g. 60% and 25% VITAE); every unique: 3. Stage
changes are the moment a fight "becomes another fight" — the numbers on the
pane must visibly jump. The Unfinished gets 4 stages and never a mercy out.

### 8.4 Enemy keywords → engine hooks

`applyEnemyDamage` (:1240) applies HIDE (floor 1; PIERCE bypasses; ELUSIVE
doubles until `staggerRungs` > 0 this round). `resolveThreatPhase` (:3576)
applies SWIFT (halve guard/barrier), BRUTAL (double unguarded remainder),
VENOM (post-damage POISON), WOUNDING (curse injection via the existing
`curseCardId` path), RAVENOUS. `processBetweenPhases` (:4147) applies REGROW
and checks `stages`. `computeRungDenial` (:3505) respects UNSHAKEN. Each
keyword gets an e2e test with a hand-built enemy.

### 8.5 Threat telegraphs

The pre-fight reveal and the per-phase telegraph print the **number**
(post-multiplier, pre-guard), the stance, the keywords in play, and stage
warnings ("at 60% VITAE: gains BRUTAL"). Mobile's telegraph presenter and
`projectIncomingThreat` must agree to the digit (parity guard).

### 8.6 Alt-wins

Keep Befriend / RELENT (PLEA) / CONDEMN (CHARGE) — they are what makes
choir and trial decks *decks* — rescaled per §5.4. You may also add
**OVERKILL-into-mercy** (excess lethal damage counts toward Befriend) or
let a STAGE gate an alt-win ("cannot RELENT before stage 2"). Record what
you pick.

---

## 9. ENGINE CHANGES CHECKLIST

1. `HEALTH_PER_STAT` → player VITAE formula; enemy `vitae` field + derivation.
2. `threatDamageBudget` rewrite; delete `THREAT_DAMAGE_SCALE`.
3. `COLOR_MATCH_DAMAGE_BONUS` → percentage; pip bonuses rescaled.
4. New `CardSpecialMechanic` kinds / `CardRider` fields for §6.3 picks;
   `applyRiderToState`, `playBottomAction`, `mechanicText`, `riderText`,
   projections (`projectCardImpact` etc.) updated so previews are truthful.
5. Turn-scoped ledgers for AMBUSH/FLOW/FINALE/CHAIN/TWIN (`playsThisTurn`,
   `chain`, `twinArmed`, `wrath`, `flay`) on `CombatEncounterState` +
   `CombatEvent` rows for each so the mobile log can narrate them.
6. Enemy `keywords`, `stages`, tiered `EnemyDeck`; hooks per §8.4;
   `compileEnemyDeck` and `getThreatSequence` learn tiers.
7. Remove the RUPTURE cap, concede floor clamp, and any other
   ceiling/floor from the repealed list you don't re-adopt on purpose.
8. `debuffs.library.json`/`buffs.library.json` rescaled; new ids (FLAY,
   WRATH, CHAIN…) added with glyphs.
9. Legacy `card.engine.ts executeCard` — leave as a no-op shim or delete if
   nothing imports it.

---

## 10. TESTS AND GUARDS — what to delete, what to rewrite, what to keep

Principle: **no count pins, no bands, no curves; keep bug detectors.**
A bug detector is a test that fails only when the game is *wrong*
(a printed number ≠ applied number, a keyword with no popup, a card that
can never be played, a die kind with no editor row). A law is a test that
fails when the game is *different*. Delete laws.

| File | Action |
|---|---|
| `src/Cards/e2e/curated-library.engine.test.ts` | Rewrite. Keep: unique ids, valid theme/rank/type, every card has a FREE path (spell `free` non-empty; oath/hex either `free` or `persistentEffect`), presets never seat a curse, oath→self / hex→enemy targeting. Delete: 57 pin, package shape, 8/3/4 counts, 34/23 split, reward pool = 53, `basePower`/`chipHp` ban, `addedIn` floor, unreachable-`dieBonus` (re-derive if you add off-colour plays). |
| `src/Cards/e2e/pricing.engine.test.ts` + `roles-themes:86`, `bridge-rewards:69`, `haunts:376` | Delete `RANK_BANDS` and every in-band assertion. Keep `cards.pricing.ts` as an **advisory** scorer (rescale `VERB_POINTS` to §5; export a per-card score into the catalog for the devlog) and keep only "score is finite and ≥0" plus "rank-monotone *median* is non-decreasing" if you still want a smell test. Delete the DoT arithmetic anchors (:85-120). |
| `src/Combat/e2e/paid-summary-honesty.engine.test.ts` | Keep number-parity + UPPERCASE-is-a-keyword. Delete ≤130 chars, em dash/semicolon, "the foe" clauses. |
| `src/Combat/e2e/combat-playtest.balance-bands.sim.test.ts` | Delete `PRESET_FLOORS`, `PRESET_CEILING`, `KNOWN_CURVE_VIOLATORS` (exact-set trap), status-engagement assertions, doctrine-curve evaluation. Replace with §13's sanity envelope. |
| `src/Combat/e2e/combat-playtest.card-coverage.sim.test.ts` | Keep the dead-card detector; drop the 57 pin (iterate the live library). |
| `src/Combat/e2e/deck-presets.engine.test.ts` | Keep **exact aspect thirds** (:86). Delete size pins, ≤4 copies, lineage. |
| `src/Combat/e2e/combat-playtest.line-telemetry.sim.test.ts` | Delete the 85/15 FREE/PAID bands. Keep the telemetry shape. |
| `src/Combat/e2e/themed-decks.engine.test.ts` | Rewrite the 240-burst pin as "REAP-ALL is uncapped: 12 Souls × 14 = 168 ≥ any cap". |
| `src/Combat/e2e/coveted-die.engine.test.ts`, `new-enemies.engine.test.ts` (:40-45 roster count, :54-62 art law, :64-88 deck laws, :148-152/:184-188 stake law), `hazard-pattern-combat-helpers.engine.test.ts:406` | Delete the law assertions; keep "every roster enemy has a resolvable deck and every deck id resolves". |
| `src/Enemy/e2e/enemy.engine.test.ts:85-118` | Delete the stat law. Add: every boss/unique has authored `vitae` and ≥2 `stages`; derived VITAE matches the §5.1 formula. |
| `src/Combat/e2e/win-path-scaling.engine.test.ts`, `charm-resolve-milestones.engine.test.ts`, `dot-trigger-clocks.engine.test.ts`, `turn-law.engine.test.ts`, `momentum-wheel.engine.test.ts` | turn-law: **keep**. Others: keep as behaviour tests of whatever you ship; rewrite constants; delete what you removed. |
| `axiomancer-mobile/state/combat/__tests__/keywords.test.ts` | Delete KW-2 (`=== 42`). Keep KW-1 (every applied effect id → keyword), KW-3 (no dead rows), KW-6 (theme families ⊆ registry). |
| `axiomancer-mobile/.../card-face-honesty.guard.test.ts` | Keep as a guard; update fixtures to new faces; drop the WI-2 "event DoT names its trigger" clause if you change DoT clocks. |
| `axiomancer-card-editor/src/data/mechanics.contract.ts`, `round-trip.test.ts` | Keep; update kind union. |
| Root `scripts/check-naming-law.mjs` + `.test.mjs` | Gut to "ids kebab-case + unique" or delete and drop from root `test`/`lint:names`. |
| `scripts/check-lexicon.mjs` | Keep the tool; prune `docs/lexicon.json` doctrine rows and any rename row whose old word you decide to allow. |
| `hazard-pattern-combat.balance.sim.test.ts`, `combat-dice-economy.sim.test.ts:130`, `status-depth.balance.sim.test.ts:59` | Already `describe.skip`. Delete them or un-skip with new expectations; do not leave skipped tombstones. |
| `docs/reports/baselines/*.json` | Unwritable by hand. Regenerate at the end: `npm run baseline:regen` then `npm run baseline:check`. |

---

## 11. CROSS-PACKAGE WORK

- **Mobile**: `keywords.ts` (all four channels), `statusGlyphs` for new
  status ids, presenters (`combat-encounter.engine.ts` mechanic headlines,
  telegraph numbers, enemy keyword chips + popups, STAGE banner event),
  `state/mocks/combat.mock.ts` Brine Hag placeholder → real numbers,
  preset/starter/reward tests. `npm run verify -w axiomancer-mobile`
  (jest + tsc + eslint + asset checks) must pass.
- **Card editor**: `SPECIAL_MECHANIC_KINDS`, `mechanics.contract.ts`,
  `KeywordHint.tsx` hints for new keywords, `CardFace.tsx` if faces gained
  a line; round-trip test must pass against the rewritten
  `cards.library.ts` (keep the block-per-card shape).
- **Catalog**: `npm run catalog` (export + build) after everything; add
  `vitae`, `keywords`, `stages`, per-card advisory score to the export.
- **Docs**: `docs/keyword-atlas.md` rewritten (one row per live keyword,
  reminder text, which cards/enemies use it, optional `kb:` receipt);
  `docs/combat.md` numbers; `docs/profane-canon.md` → HISTORICAL banner;
  `axiomancer-mechanics/CLAUDE.md` doctrine block → §1–§2 of this prompt;
  `VISION.md` combat section; `spec.md:42-46, :114-125`; `plan/bearings.md`
  one paragraph pointing at this overhaul (bearings is lexicon-linted —
  don't use words you deleted from `lexicon.json` before deleting them).

---

## 12. RECORD OF DECISIONS

Write `plan/2026-09-02-big-numbers-overhaul.decisions.md` as you go: one
line per choice this prompt left open (which §6.3 keywords, oath/hex FREE
handling, EXECUTE semantics, DoT clock assignments, preset sizes/names,
enemy deck tier semantics, alt-win rescale, anything repealed you chose to
re-adopt on purpose). Also append a row to `plan/PHASE_CANDIDATES.md` or
the build plan naming this as the shipped phase, per the repo's convention
(read `plan/bearings.md` "how phases ship" first).

---

## 13. ACCEPTANCE CRITERIA (what "done" means)

Hard gates:
1. `npm run verify` green at the root (mechanics + mobile + card-editor).
2. `npm run test` (root scripts) green after the naming/lexicon changes.
3. `npm run catalog` regenerates without error; `devlog/catalog.html` shows
   every card and enemy with the new numbers.
4. `npm run baseline:regen && npm run baseline:check` clean.
5. Zero skipped test suites left as tombstones.

Design gates (assert these in the rewritten balance sim; wide envelopes,
not curves):
6. Library ≥ 90 cards; every non-curse card registers a play in the
   coverage sim; every theme has cards at ranks 1, 3, and 6.
7. Median PAID hit at Ash ≥ 6; at Saint ≥ 45; at least 5 cards can exceed
   100 damage in one resolution in a fed deck (prove with a scripted
   encounter test, not a sim).
8. Every enemy has `vitae` ≥ 40; every boss/unique has authored `vitae`,
   ≥2 keywords, ≥2 stages, a three-tier deck; every telegraph prints a digit.
9. Playtest matrix (`npm run combat-playtest -w axiomancer-mechanics`, seed
   1, ≥30 runs per cell): no preset × stage cell at 0% or 100% except
   `impossible` (The Unfinished may be 0%); median fight length 3–7 rounds
   vs normal, 6–12 vs boss; no single card > 40% of total damage across a
   preset's wins (dominance smell) — if one is, buff its neighbours rather
   than nerf it.
10. Cross-package parity: for 10 sampled cards and 5 sampled enemies, the
    number the mobile presenter prints equals the number the engine event
    carries (extend `preview-truth.engine.test.ts` / the face-honesty guard).

---

## 14. EXECUTION ORDER (do it in this order; commit at each ✔)

1. **Repeal** — delete/rewrite every law-test and doc in §3/§10 so the
   suite fails only on missing content, not on old constraints. Prune
   `lexicon.json`. ✔
2. **Engine scale** — §9.1–9.3, §5.1 VITAE, §5.3 threat budget. Re-run
   engine e2e; fix constant-dependent tests. ✔
3. **Keyword language** — pick the §6.3/§6.4 set; wire kinds, riders,
   effects JSON, engine hooks, four channels, editor contract, atlas. Each
   keyword gets its e2e. ✔
4. **Enemy schema** — `vitae`, `keywords`, `stages`, tiered `EnemyDeck`;
   hooks §8.4; telegraph numbers §8.5. ✔
5. **Card library** — write all 100–120 cards + curses/wounds; presets at
   thirds; reward pool. Run the coverage sim and the parity guards. ✔
6. **Enemy content** — rewrite all 72 combat layers + 150–170 enemy cards;
   boss stages. Run roster e2e. ✔
7. **Mobile + editor** — glosses, glyphs, presenters, mocks, hints,
   contract. Package verifies. ✔
8. **Sim + tune** — playtest matrix; adjust to §13.9 by buffing/adding, not
   by shrinking numbers; regen baselines. ✔
9. **Docs + catalog + decisions record** — §11, §12. Root verify. ✔

---

## Appendix A — KB prior-art digest with source paths (so you don't have to re-mine)

All paths are under `kb/KnowledgeBase/` (the gitignored sync of
`game-knowledge-base`; refresh with `node scripts/kb-sync.mjs`). Read them
with `kb_read_doc <path>` on the `kb-query` MCP server, or grep with
`kb_search`. Every keyword doc has a `## Definition` section; every card doc
has the card text at its `Deal [damage:N]` line and a keyword list.

**Mage Knight** — `BoardGames/games/mage-knight/rules/`
- `overview.okf.md:57-59` — Deed cards: basic effect / mana-powered stronger
  effect / played sideways for a generic 1 (rulebook p.4). This is our
  FREE/PAID line and the FREE-line floor.
- `edge-cases-faq.okf.md:72-74` — armour never below 1 (the HIDE floor).
- `edge-cases-faq.okf.md:69-71` — Wounds as cards in hand; Rest to shed
  them (the WOUND curse model).
- *Not in the KB* (cited from the base rulebook, verify before leaning on
  it): enemy abilities Fortified / Swift / Brutal / Poison / Paralyze /
  Elusive; phased combat ranged → block → damage → attack; typical enemy
  armour 3–10, attack 3–9. If you want a receipt, add a wish:
  `node scripts/kb-sync.mjs wish "Mage Knight enemy ability list"`.

**Dawncaster** — `DigitalCardGames/dawncaster/keywords/<slug>.okf.md`
(141 docs; `keywords.json` is the index)
- `crushing.okf.md` "requires a card to deal 10 or more damage" ·
  `overkill.okf.md` negative Health after lethal · `execute.okf.md` triggers
  on defeat · `reaping.okf.md` lowers max Health by damage dealt ·
  `chain.okf.md` +1 per stack to the next action, fades if a play didn't
  add Chain, fuels `tides.okf.md` · `finale.okf.md` ≤2 cards in hand ·
  `ambush.okf.md` first card of the round · `flow.okf.md` after ≥X plays
  this turn · `cascade.okf.md` ±1 cost adjacency · `continuity.okf.md`
  same type as previous · `flanking.okf.md` hand position ·
  `reliable.okf.md` "conditions are always met" · `brittle.okf.md` +1 per
  stack removed on melee · `stagger.okf.md` take half at turn start ·
  `piercing.okf.md` ignores all reduction · `deep-wound.okf.md` 5 stacks =
  slain · `echo.okf.md` cast twice · `heavy.okf.md` no reshuffle ·
  `charges.okf.md` / `durability.okf.md` N uses per combat ·
  `channel.okf.md` extended by spare Energy · `conjure.okf.md` temporary
  card · `one-use.okf.md` / `untempered.okf.md` removed · `zeal.okf.md`
  +damage per stack, take Zeal at turn start · `doom.okf.md` +1 per action
  played, damage at end of turn · `souls.okf.md` revive at 100 ·
  `corruption.okf.md` deck pollution, 4+ threshold · `vulnerable.okf.md`
  +10%/stack cap 100% · `poison.okf.md` 1 per card played, decays ·
  `rampage.okf.md` double the Anger bonus · `interrupt.okf.md`,
  `stances.okf.md`, `ki.okf.md`, `lifedrain.okf.md`.
- Card scale, `DigitalCardGames/dawncaster/cards/`:
  `0940-lightning-bolt-755228.okf.md` (1–12),
  `0595-elite-lightning-bolt-712602.okf.md` (1–20),
  `0499-deathblow-116721.okf.md` (15), `0803-heavy-swing-929928.okf.md` (15),
  `0814-hexterminate-41020028.okf.md` (1–6 × 1–6),
  `1014-meteor-storm-647227.okf.md` (12/turn),
  `0212-big-bomb-382294.okf.md` (40; Ready after 4 turns, Persistent,
  Rampage), `0195-battlespear-c-121918.okf.md` (Crushing: Interrupt).
  Whole set: `cards.json` / `cards.csv` (1,692 rows) — `kb_cards` queries it.

**Slay the Spire** — `DigitalCardGames/slay-the-spire/cards/`
- `0308-strike-strike_b.okf.md` … `0311-strike-strike_r.okf.md` (6),
  `0025-bash-bash.okf.md` (8 + Vulnerable), `0067-clothesline-clothesline.okf.md`
  (12), `0055-carnage-carnage.okf.md` (20), `0038-bludgeon-bludgeon.okf.md`
  (32), `0065-cleave-cleave.okf.md` (AoE), `0183-immolate-immolate.okf.md`.
  Whole set: `cards.json`. Strength / Vulnerable ×1.5 / X-cost / exhaust are
  in the card texts. Balance metric (pick rate × win-correlation, dead cards
  = design failures) is in `References/deckbuilding/balance-methodology.okf.md`.

**Aeon's End** — `BoardGames/games/aeons-end/rules/`
- `setup.okf.md:28,:44-46,:56` — Nemesis deck built in three tiers, tier 1
  on top → tier 3 on the bottom; never reshuffled, so escalation is
  structural. `overview.okf.md:64`. `turn-structure.okf.md` — turn-order
  deck; breach economy (our die economy).

**Cthulhu: Death May Die** — `BoardGames/games/cthulhu-death-may-die/rules/`
- `overview.okf.md:49-53` (Elder One box = its own behaviour set),
  `turn-structure.okf.md:57` (summoning symbols advance the Elder One's
  progression — the STAGE trigger model).

**Arydia** — `BoardGames/games/arydia-the-paths-we-dare-tread/rules/`
- `overview.okf.md:39-41`, `turn-structure.okf.md:30` — Variable Threat
  System; enemy AI cards respond to threat level (printed numbers +
  conditional branches).

**MTG design refs** — `References/mtg/`
- `keywords-and-reminder-text.okf.md` (keyword + reminder text on first
  sight), `new-world-order-complexity-budget.okf.md` (complexity budget at
  common; board vs comprehension complexity), `lenticular-design.okf.md`,
  `color-pie-as-permission-system.okf.md` (primary/secondary/tertiary),
  `storm-scale.okf.md`.

**Deckbuilding refs** — `References/deckbuilding/`
- `card-design-and-keywords.okf.md` (Vilain's three keyword tests),
  `deck-economy-thinning-and-bloat.okf.md` (lean vs fat decks),
  `core-loop-and-acquisition.okf.md` (multi-use cards),
  `balance-methodology.okf.md` (measure, don't legislate),
  `player-experience-and-interaction.okf.md`.
- `References/communities-and-playtesting.okf.md`.

## Appendix B — survey artefact

The full 87 KB repo survey that produced §3/§4/§10's file:line map is at
`plan/archive/2026-09-25-trim-t4/plan/2026-09-02-big-numbers-overhaul.survey.md` (§1 card data, §2 keyword
registry, §3 enemy model with six verbatim enemies, §4 engine hooks, §5
every test/guard and which ones block a scale-up, §6 editor/mobile, §7 the
35-law table). Line numbers were true on 2026-09-02; re-grep before editing.

