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

**Sources of truth.** Player reminder text lives in
`axiomancer-mobile/state/combat/keywords.ts` (`KEYWORD_GLOSS`); enemy reminder
text lives in `axiomancer-mechanics/src/Enemy/enemy-keywords.ts`
(`ENEMY_KEYWORD_GLOSS`). This file is the index, not the source — when a row
disagrees with the code, the code wins and the row is the bug.

**Carriers.** The card library and the enemy roster are being rewritten in
parallel with this pass, so the carrier column says `(see the catalog)` for
cards and `(see the roster)` for enemies rather than naming ids that are
mid-flight. Run `npm run catalog` for the current binding.

---

## Player keywords — the damage family

| keyword | reminder text | carried by |
|---|---|---|
| **DEAL N** | Direct VITAE damage. Not a keyword — plain English on the face; a multi-hit prints `N × k` and each hit is its own damage instance. | (see the catalog) |
| **PIERCE** | This damage ignores the foe's HIDE and every effect that would reduce it. | (see the catalog) |
| **WRATH N** | Every hit you land deals that much more, for the rest of the fight. It stacks and never fades. | (see the catalog) |
| **FLAY N** | Each of your next hits deals half again as much, spending one stack per hit. | (see the catalog) |
| **CHAIN N** | Your next hit deals that much more. Chain fades at the end of a turn that added none. | (see the catalog) |
| **EXECUTE N%** | While the foe is at or below the printed share of its VITAE, this card's damage doubles. | (see the catalog) |
| **OVERKILL** | Damage past the killing blow is not wasted: it converts at the printed rate (Conviction, healing, or Souls). | (see the catalog) |
| **TWIN** | Your next spell this turn resolves its PAID line twice. Never chains — a twinned spell that arms TWIN does not re-arm. | (see the catalog) |

## Player keywords — afflictions and their payoffs

| keyword | reminder text | carried by |
|---|---|---|
| **POISON iN dM** | Each time a card is played, the foe loses VITAE per Poison stack. The longer it holds, the harder it bites. | (see the catalog) |
| **BLEED iN dM** | Each hit the bearer takes deals extra VITAE per Bleed stack, then removes a stack. | (see the catalog) |
| **DOOM iN** | Deals VITAE per stack at the start of each round and grows a stack every time the foe acts. It ends only when consumed. | (see the catalog) |
| **MARK iN dM** | Every damage-over-time tick on the bearer deals +1 VITAE per Mark stack. Marks hold until consumed, not until a calendar expires. | (see the catalog) |
| **RUPTURE N** | Consumes the foe's afflictions and deals their remaining damage at once. ALL-spenders are uncapped. | (see the catalog) |
| **FESTER N** | Every damage-over-time effect on the foe gains that much intensity. | (see the catalog) |
| **PROLONG N** | Adds that many turns to every damage-over-time effect you have on the foe. | (see the catalog) |
| **TICK** | Your strongest damage-over-time effect on the foe ticks again, immediately. | (see the catalog) |
| **SIPHON N%** | Heals you for the printed percentage of the damage this play deals. | (see the catalog) |

## Player keywords — walls and reprisal

| keyword | reminder text | carried by |
|---|---|---|
| **GUARD N** | Blocks that much incoming damage during the next threat phase. Unused Guard is lost unless the card prints "persists". | (see the catalog) |
| **THORNS iN dM** | The foe takes VITAE per Thorns stack each threat phase it attacks you, even through a full block. | (see the catalog) |
| **RIPOSTE iN dM** | Armed for one threat phase: reduces the first attack by its parry value, and if the blow is fully blocked the foe takes the counter instead. | (see the catalog) |

## Player keywords — tempo and control

| keyword | reminder text | carried by |
|---|---|---|
| **STAGGER N** | Removes that many rungs (the steps of the foe's telegraph) from its next action. Strip them all and the action is denied. | (see the catalog) |
| **BACKFIRE iN dM** | The foe takes VITAE per Backfire stack for each rung its telegraphed action loses; a denied action counts all of its rungs. | (see the catalog) |
| **CHARGE** | A running tally. When it reaches the count printed on the card that spends it, that payoff fires free and the tally resets. | (see the catalog) |
| **FORETELL N** | Reveals the foe's next stance and looks at that many cards of your deck, moving the best to the top. | (see the catalog) |
| **OMEN** | Stake a stance and a window of phases it must land within, paying a Conviction ante up front. A hit fires the payoff free; a miss keeps the ante. | (see the catalog) |
| **QUARTER iN dM** | The foe's attacks deal less damage per Quarter stack. | (see the catalog) |

## Player keywords — turn shape (the conditions a line waits on)

| keyword | reminder text | carried by |
|---|---|---|
| **AMBUSH** | This line fires only when the card is your first spell of the turn. (Engine: the `opening` predicate at `maxPriorSpells: 0`.) | (see the catalog) |
| **FLOW N** | This line fires once you have already played that many spells this turn. | (see the catalog) |
| **FINALE** | This line fires when playing the card leaves at most the printed number of cards in hand. | (see the catalog) |
| **REQUIEM N** | A card's REQUIEM line fires free while your discard pile holds that many cards. | (see the catalog) |
| **FALLEN** | A state: you carry 2 or more different afflictions. A card's FALLEN line fires free while you are Fallen. | (see the catalog) |
| **EVENTIDE** | A card's EVENTIDE line fires free while your draw pile holds an even number of cards. | (see the catalog) |
| **UNMOVED** | A card's UNMOVED line fires free while the foe dealt you no damage last round. | (see the catalog) |

## Player keywords — the deck as a resource

| keyword | reminder text | carried by |
|---|---|---|
| **DRAW N** | Draw that many cards from your deck, up to your hand limit. | (see the catalog) |
| **MILL N** | Sends that many cards from your deck to your discard pile. | (see the catalog) |
| **RECALL N** | Returns that many cards from your discard pile to your hand, highest rank first. | (see the catalog) |
| **ECHO** | The card's PAID line fires twice. FREE lines never echo. | (see the catalog) |
| **REPLAY N** | Says your last spell again: its PAID payload fires that many more times. | (see the catalog) |
| **IMMOLATE** | Burns the lowest-rank cards in your hand as a cost, and they leave the fight entirely. A curse burns as well as anything. | (see the catalog) |
| **PURGE** | Playing this curse removes it from the fight entirely. A die and a beat buy the deck clean. | (see the catalog) |

## Player keywords — resolve, harvest and mercy

| keyword | reminder text | carried by |
|---|---|---|
| **SOUL** | You gain 1 Soul each time an affliction on the foe expires or is consumed. | (see the catalog) |
| **REAP N** | Spends the printed number of Souls to fire the printed effect. With fewer Souls, it fizzles. REAP ALL is uncapped. | (see the catalog) |
| **PLEA N** | Builds on the foe and decays each round. At their resolve, they relent. | (see the catalog) |
| **HEAL N** | Restores that much VITAE, up to your maximum. | (see the catalog) |
| **CLEANSE N** | Removes up to that many afflictions from you. | (see the catalog) |
| **RECOIL N** | Pay the printed VITAE as a cost when the card is played. No defense can prevent it. | (see the catalog) |

## Player keywords — the dice

| keyword | reminder text | carried by |
|---|---|---|
| **FORGE** | Forges a GHOST die (or revives a dead X die as WILD) that joins your tray and is spent for good. At 3 dice, it grants +1 Conviction instead. | (see the catalog) |
| **KINDLE** | Creates a temporary die of the printed color in your Reserve. If the Reserve is full, it grants Conviction instead. | (see the catalog) |
| **PIP** | Each threat phase a Reserve die survives it gains a pip; each pip spent adds `PIP_INTENSITY_BONUS` intensity, or `PIP_GUARD_BONUS` Guard on a defend card. | (see the catalog) |
| **BOON** | A die's BOON face powers a card of its color and grants Conviction; its equipped gear sets how much. | die gear (`spec 33 §6`) |
| **HONE** | A blacksmith upgrade: adds a mana face to a die's gear, so more of its rolls power a card. | blacksmith service |
| **TEMPER** | A blacksmith upgrade: turns a mana face into a BOON face. | blacksmith service |

---

## Enemy keywords (11)

New with THE BIG NUMBERS REWRITE. An enemy carries 0–1 at simple/normal, 1–2
at elite, 2–3 plus a STAGE at boss/unique. They print on the enemy pane with
popups. Glosses below are copied from `src/Enemy/enemy-keywords.ts`
(`ENEMY_KEYWORD_GLOSS`); `{n}` is substituted with the instance's own number,
so one foe can carry HIDE 3 and another HIDE 12.

**The early HIDE ramp (2026-09-20).** HIDE is capped by the foe's LEVEL at
`max(0, level − 3)` (`hideCapForLevel`, `Enemy/index.ts`), applied to the
difficulty defaults, to authored lists in `createEnemy`, and to every live
encounter in `scaleEnemyToLevel`. A level-1..3 foe carries no HIDE at all —
the fishing village's pinned level-3 King of Revenge fights bare-skinned
against the grey office — and the cap only reaches the authored mid-tier
values (HIDE 3 at level 6) where those kits already sit. Only HIDE ramps;
WOUNDING, BRUTAL and the rest are untouched.

| keyword | reminder text | applied in | carried by |
|---|---|---|---|
| **HIDE N** | Every hit against this foe is reduced by N, never below 1. PIERCE ignores it. | `applyEnemyDamage` | (see the roster) |
| **SWIFT** | Your GUARD and BARRIER count for half against this foe. | `resolveThreatPhase` | (see the roster) |
| **BRUTAL** | Damage this foe gets past your defenses is doubled. | `resolveThreatPhase` | (see the roster) |
| **VENOM N** | Damage this foe lands also poisons you for N. | `resolveThreatPhase` | (see the roster) |
| **UNSHAKEN** | This foe cannot be staggered. Its rungs never fall. | `computeRungDenial` | (see the roster) |
| **ELUSIVE** | This foe's HIDE counts double until you stagger it this round. | `applyEnemyDamage` | (see the roster) |
| **REGROW N** | This foe heals N at the end of each of its phases. | `processBetweenPhases` | (see the roster) |
| **RAVENOUS** | This foe heals for the damage it lands on you. | `resolveThreatPhase` | (see the roster) |
| **WOUNDING N** | An unguarded hit of N or more puts a WOUND in your deck. | `resolveThreatPhase` | (see the roster) |
| **FLURRY N** | This foe's hit lands as N separate strikes instead of one — RIPOSTE only blunts the first. | `resolveThreatPhase` | (see the roster) |
| **SUMMON N** | This foe fields N of its own. Each bites you for its printed number every phase, even while the foe is denied. | `processBetweenPhases` + `resolveThreatPhase` + `strikeAdd` | (see the roster) |

HIDE is the reason one big hit beats many small ones: it is subtracted from
each damage instance, so `7 × 4` and `28 × 1` play differently against armour.

FLURRY splits the SAME threat-damage budget into N strikes rather than
inflating it — GUARD/BARRIER are additive pools that drain to the same total
either way (order-invariant), so FLURRY doesn't punish a stacked wall the way
HIDE punishes a spread-out attack. What it does change: RIPOSTE's flat,
one-shot parry only blunts the FIRST strike (the rest land clean), and any
VENOM/RAVENOUS/WOUNDING this foe also carries fires once per landed strike
instead of once per phase — a flurry foe paired with VENOM stacks poison
fast. Prior art: StS-BG's Buffer, `kb:slay-the-spire-the-board-game/rules/
edge-cases-faq` (src-002) — "triggers separately per hit of a multi-attack."

SUMMON is the one enemy keyword that changes a fight's SIZE rather than only
its arithmetic, and it is a deliberate exception. Its brood spawns once at a
phase boundary (and once more on a STAGE), never on emptiness — clearing a wave
is progress you keep. Each add's bite is FLAT: no escalation, stage bonus,
weaken or stance term touches it, so the number on the chip is the number you
take. Your armour, GUARD and BARRIER soak it; RIPOSTE, BRUTAL, RAVENOUS, VENOM
and WOUNDING do not ride it, and a STAGE's cleanse does not clear it (a body is
not an affliction). Staggering the foe does not silence its brood — not even
stripping every rung to deny its action outright: bodies act on their own. But
killing the foe ends the fight regardless of it — a deliberate divergence from
`kb:slay-the-spire-the-board-game/rules/edge-cases-faq` (src-002), where
"Summons don't 'flee' combat when the enemy that summoned them is killed."
Adds are never a win condition: clearing the brood cannot end a fight, because
`checkImmediateOutcome` reads the foe's VITAE alone. Clear them with the
dieless STRIKE action for 2 Conviction, or hold a wall and eat them.

### STAGE (boss/unique only)

Not a keyword — a boss/unique data structure (`EnemyStage`). At a printed VITAE
fraction or round the foe changes shape: a name shouted into the log, a
telegraphed line, keywords gained, an optional cleanse, heal, threat bonus or
curse injection. Every boss authors ≥2 stages; every unique ≥3. The numbers on
the pane must visibly jump when one fires.

---

## System terms (printed, glossed, not keywords)

These get popups but are engine systems rather than card vocabulary; they live
in `SYSTEM_GLOSSARY` (mobile).

| term | what it is |
|---|---|
| CONVICTION ◆ | A spend-anytime resource banked from unspent dice and overflow. It never decays. |
| TOLL ⬡ | A whole-combat running tally of dice you spend by color; a ⬡ threshold line fires at its count. |
| RESERVE & PIPS | Dice held between phases instead of played, ripening a pip per phase. |
| GHOST ✦ | A forged die that joins your tray, never rerolls, and is gone forever when spent. |
| RUNGS | The steps of the foe's telegraphed action. Losing all of them denies the action. |
| WILD / X | A WILD die counts as any color. A dead X die powers nothing, but can be Forged wild. |
| SENTENCE | A declared conclusion: at the printed CHARGE count its payoff fires free and the tally resets. |
| CONDEMN | An alternate win: reaching the printed CHARGE count in one SENTENCE ends the fight. |
| RELENT | An alternate win: PLEA reaching the foe's resolve opens an explicit accept-or-continue choice. |

**OATH** and **HEX** are card *types*, not keywords: a passive on your side and
a standing curse on the foe respectively, three rounds when played free and
permanent when paid with a die. They carry glossary rows for the help surfaces
but never render in the inspect keyword panel.

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
