# Keyword atlas — the live combat vocabulary

One row per LIVE keyword: the word, the reminder text a player reads the first
time they meet it, and what carries it. Rewritten 2026-09-02 for THE BIG
NUMBERS REWRITE (`plan/2026-09-02-big-numbers-overhaul.prompt.md`), which
repealed the atlas's old apparatus — the prior-art-receipt rule, the row-count
gate, the proving-gate scoreboard and the "3+ cards earns a row" bar are all
gone. A `kb:` receipt is welcome in the notes; it is not required.

**Discipline** (overhaul §6.1, replacing the old row policy):

- A keyword exists when **≥2 cards or ≥2 enemies** use it *and* it passes
  Vilain's three tests — it has **flavor** (the word evokes the effect), it
  **compresses** (the reminder text is longer than the word), and it has
  **class** (it groups cards into a family a player recognises). A one-card
  mechanic stays as plain rules text on that card.
- Every keyword prints with reminder text on first sight (the mobile popup,
  `KEYWORD_GLOSS`), and every printed number is the number the engine applies.
- Complexity budget by rank: **Ash/Tooth** carry ≤1 keyword beyond a damage or
  guard verb and never a trigger condition; **Splinter/Rib** carry ≤2 and may
  carry one condition; **Skull/Saint** are unbudgeted.

**Sources of truth.** Reminder text lives in
`axiomancer-mobile/state/combat/keywords.ts` (`KEYWORD_GLOSS`). No enemy
keyword exists since revamp phase R2b (D63). This file is the index, not the
source — when a row disagrees with the code, the code wins and the row is the
bug.

**Carriers.** The card library and the enemy roster are being rewritten in
parallel with this pass, so the carrier column says `(see the catalog)` for
cards and `(see the roster)` for enemies rather than naming ids that are
mid-flight. Run `npm run catalog` for the current binding.

---

## Player keywords — the damage family

| keyword | reminder text | carried by |
|---|---|---|
| **DEAL N** | Direct VITAE damage. Not a keyword — plain English on the face. | grey-strike |

## Player keywords — afflictions and their payoffs

| keyword | reminder text | carried by |
|---|---|---|
| **BLEED iN dM** | Each hit the bearer takes deals extra VITAE per Bleed stack, then removes a stack. | (see the catalog) |
| **VULNERABLE +N% dM** | The foe takes N% more damage from every hit. Re-applying adds up and refreshes the turns; uncapped. Heart scales N (S3, D43). | grey-word |

## Player keywords — walls and reprisal

| keyword | reminder text | carried by |
|---|---|---|
| **GUARD N** | Blocks that much incoming damage during the next threat phase. Unused Guard is lost. | grey-ward, every signature skill (R4) |

## Player keywords — resolve and mercy

| keyword | reminder text | carried by |
|---|---|---|
| **HEAL N** | Restores that much VITAE, up to your maximum. | the healing potions (R5) |

## Player keywords — the dice

| keyword | reminder text | carried by |
|---|---|---|
| **PIP** | Each threat phase a Reserve die survives it gains a pip; each pip spent adds `PIP_INTENSITY_BONUS` intensity, or `PIP_GUARD_BONUS` Guard on a defend card. | (see the catalog) |
| **BOON** | A die's BOON face powers a card of its color and grants Conviction; its equipped gear sets how much. | die gear (`spec 33 §6`) |
| **HONE** | A blacksmith upgrade: adds a mana face to a die's gear, so more of its rolls power a card. | blacksmith service |
| **TEMPER** | A blacksmith upgrade: turns a mana face into a BOON face. | blacksmith service |

---

## Enemy keywords (none)

THE REVAMP deleted all eleven enemy keywords (HIDE, SWIFT, BRUTAL, VENOM,
UNSHAKEN, ELUSIVE, REGROW, RAVENOUS, WOUNDING, FLURRY, SUMMON) and the code
that resolved them in phase R2b (D63): the roster is three plain-damage foes
(D48) and none carried one. `Enemy.keywords` stays as an optional empty slot;
B2 re-adds keywords one at a time, each with a live counter (D45).

### STAGE (boss/unique only)

Not a keyword — a boss/unique data structure (`EnemyStage`). At a printed VITAE
fraction or round the foe changes shape: a name shouted into the log, a
telegraphed line, an optional cleanse, heal or threat bonus. The numbers on
the pane must visibly jump when one fires.

---

## System terms (printed, glossed, not keywords)

These get popups but are engine systems rather than card vocabulary; they live
in `SYSTEM_GLOSSARY` (mobile).

| term | what it is |
|---|---|
| CONVICTION ◆ | A spend-anytime resource banked from unspent dice and overflow. It never decays. |
| RESERVE & PIPS | Dice held between phases instead of played, ripening a pip per phase. |
| RUNGS | The steps of the foe's telegraphed action. Losing all of them denies the action. |
| WILD / X | A WILD die counts as any color. A dead X die powers nothing. |

**OATH** and **HEX** are card *types*, not keywords: a passive on your side and
a standing curse on the foe respectively, three rounds when played free and
permanent when paid with a die. They carry glossary rows for the help surfaces
but never render in the inspect keyword panel.

---

## Wiring a keyword (the full touch-set)

Folded here from the retired `card-expert` agent and `/adjust-keywords` skill
(R0, 2026-09-28). New keywords are made only in a guided card session with T
(D37). This is the checklist such a session follows. A keyword that misses any
step does not ship. R1 deleted the card editor and the naming registry, and
R7 rewrites the card types, so re-read the paths after R7 lands.

1. Status piece: a new entry in `src/Effects/{buffs,debuffs}.library.json`.
   Add a new `EffectPayload` field in `src/Effects/types.ts` if the payload
   shape is new, handled in `src/Effects/index.ts` / `src/Combat/effects.ts`.
2. Verb piece: a new `{ kind: 'foo'; … }` member on `CardSpecialMechanic`
   (or a `CardRider` field) in `src/Cards/types.ts`.
3. Runtime: `case 'foo':` in the `src/Combat/combat.engine.ts` mech switch.
4. Display: `case 'foo':` in `src/Combat/combat.cards.ts`. Register it in
   `PAYOFF_KINDS` if it is an affliction payoff.
5. Pricing: the verb cost in `src/Cards/cards.pricing.ts`, so the sanity
   lint can score it.
6. Carriers: the cards using it in `src/Cards/cards.library.ts`.
7. A hermetic e2e at `src/<Module>/e2e/<feature>.engine.test.ts`, with
   deterministic RNG from `src/test-utils/rng.ts` and
   `vi.restoreAllMocks()` in `afterEach`.
8. Public-surface exports from `src/Cards/index.ts` if new types ship.
9. A new card-facing effect id goes in `CARD_EFFECT_SET` in
   `src/Effects/e2e/deprecated-effects.engine.test.ts`. New ids are banned
   there by default until deliberately allowed.
10. Mobile: the keyword registry and gloss in
    `axiomancer-mobile/state/combat/keywords.ts` (a new UPPERCASE face word
    needs a `KEYWORD_GLOSS` entry and the pinned glossary count bumped); the
    headline mapping in `state/presenters/combat-encounter.engine.ts`
    (`mechanicHeadline`, `MECH_HEADLINE_PRIORITY`); a glyph in
    `components/combat/statusGlyphs.ts` / `glyphShapes.ts`. The glyph table is
    hand-synced in two places: mobile `glyphShapes` and
    `scripts/build-catalog.mjs` (the drift gate pins them together).
11. Registries: a row in this atlas.

Two surfaces fail silently. The `combat.engine.ts` mech switch and
`combat.cards.ts` `mechanicText` both have `default:` arms, so a kind that
skips steps 3–4 type-checks clean while doing nothing and printing no face
text. A library carrier plus the card-face-honesty guard is what catches the
omission, so never ship a kind without a carrier.

A keyword that extends a type union touches every consumer of `src/Cards/**`,
`src/Effects/**`, `src/Combat/**` and `src/index.ts`. Run
`npm run verify -w axiomancer-mobile` before it ships.

---

## Known drift (2026-09-02)

Rows whose reminder text in `KEYWORD_GLOSS` still carries a pre-rewrite number,
pending the effects/library rescale (overhaul §5.2):

- **POISON / BLEED / DOOM** — `debuffs.library.json` still carries
  `damagePerRound` 2 / 3 / 1. §5.2 asks for roughly ×3–4.
- **PLEA** — the gloss's "~35% of max VITAE" resolve threshold is scheduled to
  become "35% of VITAE, minimum 20" (§5.4).

These are the numbers to re-read before quoting this file.

(2026-09-05 `/adjust-keywords` pass 1: the FINALE bullet formerly here was
stale. `KEYWORD_GLOSS` has carried a `Finale:` row since 2026-09-02 — the same
day this section was written — and the row above in "Player keywords — turn
shape" already matches it. `node --test scripts/content-drift.test.mjs`
confirms no orphaned atlas row and no unglossed registry keyword. Verified,
not reasoned from memory.)

(2026-09-07 `/adjust-keywords` pass 2: the RUPTURE bullet formerly here was
also stale, in the other direction — `src/Combat/effects.ts` had ALREADY moved
`RUPTURE_CAP_FRACTION` to `Number.POSITIVE_INFINITY` (the cap function returns
`Infinity` unconditionally); only the mobile `KEYWORD_GLOSS.Rupture` string
still hardcoded "up to 60% of its max VITAE" — a printed number that was no
longer the applied number. The live mobile PRESENTER
(`combat-encounter.engine.ts`'s `case 'rupture':`) was already honest — it
branches on `Number.isFinite(RUPTURE_CAP_FRACTION)` and renders "uncapped"
today — so only the static first-sight popup lied. Fixed the gloss to match
the row above (no cap claim); `docs/combat.md`'s matching claim was also
stale and corrected in the same pass.)

## Added

- **EVENTIDE** (2026-09-16, `/adjust-keywords` pass 11) — a new turn-shape
  `SynergyStatePredicate` kind (`{ kind: 'eventide' }`), drilling Dawncaster's
  "Chaos" functions-column family (Balance/Order/Delirious/Dominated/Pinned;
  `kb:dawncaster/keywords.csv`, community, medium confidence — cross-read
  `keywords/balance.okf.md`, `keywords/mergecraft.okf.md`,
  `keywords/dominated.okf.md`). Filed as a genre-toolbox observation by pass
  9 (2026-09-13), DECIDED for a concrete proposal via `/oversight`
  2026-09-15 (`plan/AUDIT.md`). Balance/Order gate on a PARITY property of
  the player's own deck/health, a genuinely different axis than every other
  turn-shape predicate (which gate on position-in-turn or hand/discard
  SIZE) — one drilled keyword (even-only) covers the niche rather than
  minting Dawncaster's two near-synonyms. Two carriers ship with the row:
  The Even Bell (vigil, Splinter 3, GUARD + a THORNS rider) and An Even
  Reckoning (debt, Splinter 3, DEAL + a damage/Soul rider). Full wiring:
  `src/Cards/types.ts` (union member), `src/Cards/synergy-predicates.ts`
  (`drawPile` ledger field + `checkStatePredicate` case),
  `src/Combat/combat.cards.ts` (`statePredicateText` case),
  `axiomancer-mobile/state/combat/keywords.ts` (`KEYWORD_GLOSS` — no glyph:
  same family as AMBUSH/FLOW/FINALE/REQUIEM, which carry no glyph either),
  `src/Combat/e2e/paid-summary-honesty.engine.test.ts` (`KNOWN_UPPER`),
  hermetic coverage in `src/Cards/e2e/sequencing-grammar.engine.test.ts`
  (unit predicate cases + a live-card fire/silent integration test). No
  card-editor change needed: `CardSynergy`/`SynergyStatePredicate` are
  imported types there (`src/types.ts`), and the codegen emits
  `synergy.statePredicate` generically (`cardCodegen.ts`'s `synergyLines`),
  so a new predicate kind round-trips with zero editor-side code —
  confirmed against the same precedent AMBUSH/FLOW/FINALE/REQUIEM already
  set (none of them touch `SPECIAL_MECHANIC_KINDS` or `wx.ts` either, since
  those surfaces are for `CardSpecialMechanic`/display vocabulary, not
  `CardSynergy.statePredicate`). `docs/retheme-map.json` checked for an
  NL-8 collision: "Eventide"/"EVENTIDE" appears nowhere in the file; no new
  row added there, matching every prior predicate CREATE (FLOW/TWIN etc.
  never gained retheme-map rows either — that file is spec-34's historical
  rename ledger, not a running keyword registry).

- **UNMOVED** (2026-09-18, `/adjust-keywords` pass 12) — a backfill, not a
  new mechanic. The `{ kind: 'enemy-dealt-no-damage-last-round' }`
  `SynergyStatePredicate` has been live since the Profane Canon rework on 6
  vigil/apocrypha cards (`src/Cards/library/vigil.cards.ts`:
  quiet-watch/answer-at-the-postern/the-hedgehog/the-sally-port/
  nothing-to-report, `apocrypha.cards.ts`'s late-game capstone) and already
  prints its own face word — `combat.cards.ts`'s `statePredicateText` returns
  `'UNMOVED (the enemy dealt you no damage last round)'` into the card's ◆
  die line (`combat.cards.ts:547-548`) — but the row here and the mobile
  `KEYWORD_GLOSS` entry were never added. Structurally silent: the
  `card-face-honesty.guard.test.ts` sweep that checks "every keyword a card
  prints has a popup" can only flag words `keywordsInPersistentText`
  recognizes, and an ungossed word isn't recognized as a keyword at all, so
  the guard passed green over a real gap — same shape as pass 2's RUPTURE
  finding, on the presentation side instead of the numbers side. Found by
  `/adjust-keywords` pass 12's structural audit (signal: "a keyword face
  word prints but has no popup/glyph wired"), confirmed by tracing
  `statePredicateText` -> `paidText`'s `dieLines` -> the mobile chip
  scanners (`keywordsInPersistentText`, `buildDetailKeywords`) and finding
  zero `Unmoved`/`UNMOVED` hits anywhere in `axiomancer-mobile`. Dawncaster
  prior art: `kb:dawncaster/keywords/unscathed.okf.md` (src-001, community,
  confidence medium) — Unscathed: "You've taken no damage during the enemy
  turn. Inactive on your first turn" — same defensive-parity fantasy as our
  vigil "quiet night" cards; several Dawncaster cards (Recuperate, Standoff,
  Flurry of Steel) gate a payoff on it the same way our carriers gate a
  dieless ◆ rider on UNMOVED. No engine, pricing, or wiring change: only
  `axiomancer-mobile/state/combat/keywords.ts` (`KEYWORD_GLOSS.Unmoved`) and
  this atlas row. No glyph, matching every other turn-shape word (AMBUSH/
  FLOW/FINALE/REQUIEM/FALLEN/EVENTIDE carry none either). Verified via the
  same trace, not reasoned from memory: once `KEYWORD_GLOSS.Unmoved` exists,
  `buildDetailKeywords`'s existing dieLines sweep
  (`combat-encounter.engine.ts:2271-2272`) and the guard test's identical
  sweep pick it up automatically — no other mobile code needed.

## Retired

- **THE ITEMS RESET** (2026-09-30, revamp phase R5, D49, D45) — the
  consumable library is the three healing potions, so CLEANSE, DRAW and MARK
  lost their last carrier: the cleanse consumables, and the haste and
  critical buffs whose combat-log labels borrowed DRAW and MARK. Their rows
  left this file, `KEYWORD_GLOSS`, the FREE-glyph silhouettes and the DevLog
  catalog's bold list. The hazard deck's own DRAW (`HAZARD_KEYWORDS`) is a
  separate glossary and stays. HEAL stays: every potion prints it. The engine
  code behind the swept words (card `cleanse` / `drawCards` riders,
  `applyCleanse`, the Mark amplification) is R7a's to delete.

- **THE SIGNATURE PLACEHOLDERS** (2026-09-29, revamp phase R4, D45, D47) —
  ten signature skills became GUARD 5 placeholders and The Open Hand a plain
  befriend, so WRATH, CHAIN, POISON, DOOM, QUARTER, STAGGER and PLEA lost
  their last carrier (no card, enemy, hazard or item applies them). Their rows
  left this file, `KEYWORD_GLOSS`, the FREE-glyph silhouettes (with PETRIFY),
  the DevLog catalog's bold list and the theme families. The engine code
  behind them (the WRATH/CHAIN state, the effect definitions, the mechanic
  kinds) is R7a's to delete. DRAW and HEAL stay: consumables print them.

- **THE ENEMY RESET** (2026-09-29, revamp phase R2b, D63) — the eleven enemy
  keywords HIDE, SWIFT, BRUTAL, VENOM, UNSHAKEN, ELUSIVE, REGROW, RAVENOUS,
  WOUNDING, FLURRY and SUMMON left this file, their engine resolution code,
  `ENEMY_KEYWORD_GLOSS`, the enemy-pane chips and glyphs and the combat-log
  lines. The D45 sweep also checked POISON, BLEED, MARK and DOOM, which the
  roster no longer applies: each keeps a carrier (POISON and DOOM a
  signature skill, BLEED a map hazard, MARK the consumables mobile labels
  with it), so their rows stay. A returning enemy keyword re-earns its row in
  B2.

- **THE KEYWORD PURGE** (2026-09-28, T: "purge the remaining unused
  keywords from the atlas and glossary") — PIERCE, RIPOSTE and FORETELL
  left their rows here, their `KEYWORD_GLOSS` entries, their FREE and
  silhouette glyphs and the DevLog catalog's bold list. None had a live
  carrier: no card prints them, no enemy or signature skill applies them,
  and no item grants them. The 2026-09-27 audit kept them because the HIDE
  and FLURRY reminders named PIERCE and RIPOSTE and a consumable borrowed
  the FORETELL label; those two reminder clauses were cut and
  `buff_accuracy_up` now shows its own effect name. The engine mechanics
  (`deal.pierce`, the `riposte` and `foretell` kinds, the `foretell` rider)
  and the card editor's authoring vocabulary for them are untouched; a
  returning word re-earns its row in a guided session (D37). Every row
  still listed above has a live carrier.

- **THE KEYWORD AUDIT** (2026-09-27, after the card purge P1) — the player
  library is the grey office alone (A Plain Blow DEAL, A Plain Ward GUARD, A
  Plain Word VULNERABLE), so every keyword whose only carriers were purged
  cards lost its row here, its `KEYWORD_GLOSS` entry, its glyph and its
  editor vocabulary row: FLAY, EXECUTE, OVERKILL, TWIN, RUPTURE, FESTER,
  PROLONG, TICK, SIPHON, THORNS, BACKFIRE, CHARGE, OMEN, AMBUSH, FLOW, FINALE,
  REQUIEM, FALLEN, EVENTIDE, UNMOVED, MILL, RECALL, ECHO, REPLAY, IMMOLATE,
  PURGE, REAP, RECOIL, FORGE, KINDLE and SOUL; and the system terms TOLL,
  GHOST, SENTENCE, CONDEMN and RELENT. Words that enemy text, the relic
  signature skills, consumables or the dice still print stay (PIERCE,
  RIPOSTE, PLEA, STAGGER, WRATH, CHAIN, FORETELL, QUARTER, PIP, DRAW, HEAL,
  CLEANSE, and the OATH/HEX type labels). The engine mechanic kinds behind
  the retired words are untouched; a returning word re-earns its row in a
  guided card session (D37). The EVENTIDE and UNMOVED "Added" entries above are
  history, not live rows.

- **CURDLE** (2026-09-05, `/adjust-keywords` pass 1) — the "afflictions and
  their payoffs" row above is gone. Audit found exactly one live carrier
  (The Lazar's Kiss, rot rank 4, `convert_dots`), below this file's own
  discipline bar (≥2 cards or ≥2 enemies). The mechanic still functions —
  the card still flips Bleed↔Poison — it just prints as plain rules text now
  instead of a badged keyword (the discipline's own escape hatch: "a
  one-card mechanic stays as plain rules text on that card"). The R-7 rename
  record in `docs/retheme-map.json` is historical and is untouched — this is
  a presentation retirement, not an un-rename. No ban-list
  entry: `convert_dots` isn't an effect id, and it keeps working; only the
  keyword badge/gloss/atlas row died. If a second CURDLE-shaped card is ever
  authored, un-retiring means re-adding the `MECHANIC_KEYWORD` mapping, the
  `KEYWORD_GLOSS` row, and this table's row — not resurrecting an id, since
  none was banned.
