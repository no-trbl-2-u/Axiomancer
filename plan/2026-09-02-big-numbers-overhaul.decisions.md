# THE BIG NUMBERS REWRITE — record of decisions

> Every choice `plan/2026-09-02-big-numbers-overhaul.prompt.md` left open, and
> what was actually decided while executing it on 2026-09-02. Written as the
> work happened, in execution order.

## Scope decisions

**D1 — The card library is split into per-theme modules.** The prompt assumed
one `cards.library.ts`. It is now an aggregator over
`src/Cards/library/{starters,relics,rot,debt,grave,vigil,trial,choir}.cards.ts`.
*Why:* six themes could then be authored in parallel without merge conflicts,
and a theme can be reworked later without touching the other five.
*Cost:* `axiomancer-card-editor`'s write-back (`src/server/cardCodegen.ts`)
locates a card by scanning `cards.library.ts` for its `const <ident>: Card`
block. It must be taught to scan the library directory — **open follow-up**.

**D2 — No `neutral` theme.** The prompt floated a theme-less pool of ~10. The
seven existing themes were kept instead and the would-be neutrals distributed
into them (the heirloom `grandmothers-psalter` is `choir`, the watch-vestment
`threadbare-cope` is `vigil`). *Why:* adding a `CardTheme` member means
touching `THEME_KEYWORDS`, the theme-derived tag check, the catalog and the
mobile theme families for no design gain.

**D3 — Library size landed at 112, not 100-120 with a neutral pool.**
8 starters + 3 dice-valve relics + 5 curses + 6 themes x 16.

**D4 — oath/hex keep their engine-derived FREE line.** The prompt allowed
either. They continue to author `persistentEffect` and no `free`; the FREE
line is a timed (3-round) instance of the same passive via `playFreeEnchant`.
*Why:* it already satisfies "playable without a die", and authoring a second
FREE line would make the two faces say different things.

## Mechanics decisions

**D5 — Eight of the eighteen candidate player keywords shipped:** DEAL (with
`hits` and `pierce`), WRATH, FLAY, TWIN, CHAIN, EXECUTE, OVERKILL, plus the
FLOW turn-shape condition. *Not shipped:* CONJURE, CINDER, LEAD, CHARGES,
VOW, die-steal, extra-die, re-roll — the dice economy already carries
KINDLE/FORGE/BANK/OVERHEAT and adding four more die verbs would have made the
tray the whole game. AMBUSH is not a new predicate: it is `opening` with
`maxPriorSpells: 0`, which already existed.

**D6 — DEAL has no keyword row in the registry.** "Deal 24" is plain English;
keywording it would spend the face-term budget on the one verb that needs no
explanation. PIERCE, WRATH, FLAY, TWIN, CHAIN, EXECUTE, OVERKILL, AMBUSH and
FLOW all got rows with reminder text.

**D7 — EXECUTE doubles damage; it does not slay outright.** Dawncaster's
reading (instant kill under a threshold) would let a player skip a boss's
STAGE thresholds, which are the fight's dramatic beats. A double keeps the
finisher fantasy and the staging.

**D8 — FLAY is a state counter, not a status effect.** `CombatEncounterState.flay`
holds stacks on the foe; each damage instance spends one for +50%. *Why:* a
new `debuff_flayed` id would need a library entry, a glyph, an `EFFECT_KEYWORD`
row and DoT-clock semantics it does not want. *Cost:* it does not show in the
foe's status chips like a real affliction — **open follow-up** if it reads
badly in play.

**D9 — The scaler order is authored, not incidental:** read multiplier →
colour-match percentage → WRATH (flat) → CHAIN (flat) → FLAY (x1.5) →
EXECUTE (x2) → HIDE subtracted last, floor 1. HIDE last is the load-bearing
choice: it makes armour a floor on small hits rather than a percentage tax on
big ones, which is what makes `28 x 1` and `7 x 4` play differently.

**D10 — The colour-match bonus became a percentage** (+25%, minimum +2) rather
than a flat +3. A flat bonus that mattered on GUARD 6 is noise on GUARD 40.

**D11 — CHAIN fades at a turn boundary that did not feed it**, WRATH never
fades, FLAY sits on the foe until spent, TWIN never outlives its turn.

## Enemy decisions

**D12 — Enemy VITAE is decoupled from the player's stat formula.** `baseStats`
still drives procs, derived stats and befriend logic; the pool is
`round((30 + 18*level) * ENEMY_VITAE_MULT[difficulty])`, overridable by an
authored `vitae`. Every boss and unique authors one. *Why:* the difficulty
bands then separate cleanly and a boss can be a wall without a grotesque stat
budget. The `5 x level` stat law is gone as a law but `enemyStatBudget` remains
as the stat distributor.

**D13 — Keywords and stages have a DERIVED FLOOR, not just authored lists.**
`defaultEnemyKeywords(level, difficulty)` and `defaultEnemyStages(difficulty,
vitae)` give every foe something; an authored list replaces the default
outright. *Why:* hand-authoring nine keywords across seventy-two enemies would
have produced noise, and a level-1 Float-Eye should teach the dice, not the
exceptions. Simple foes get nothing; normals get HIDE only from level 8.

**D14 — `EnemyStage` has no deck-swap field.** The prompt sketched
`deck?: Partial<EnemyDeck>`. Threat phases are compiled up front from a flat
deck, so a mid-fight tier swap would need a recompile path. Stages instead
change the fight through `gain` (keywords), `cleanse`, `heal`, `threatBonus`
and `curseCardId` — **open follow-up** if tier swapping proves worth it.

**D15 — Enemy decks stayed FLAT rather than becoming a three-tier structure.**
The existing model is an ordered, non-reshuffling sequence whose back half
spikes, which is already Aeon's End's structural escalation; the tier wrapper
would have been vocabulary, not behaviour. The doc comment was rewritten from
DECK LAWS to DECK SHAPE (conventions, not laws). **This is the one place the
prompt's §8.2 was not implemented as written.**

**D16 — THE COVETED DIE is repealed but its behaviour is the default.** A new
`DECK_STAKES` map lets any deck stake any seat; an absent entry falls back to
"a boss/unique wagers on its second card". Nothing is pinned any more.

**D17 — WOUNDING's payload is a real card**, `the-wound`, in the curse pool.
`WOUND_CARD_ID` in the engine points at it; an absent id would be a silent
no-op under the resolve-filter law.

## Alt-win decisions

**D18 — CONDEMN rescaled to `at: 12 / concedeAt: 14`**, not the 12-20 the
prompt suggested. `gainPremises` checks `concedeAt` before `at` and firing
`at` zeroes the tally, so CONDEMN is only reachable by a single filing that
overshoots from below `at` past `concedeAt`. The old geometry was a 2-Charge
gap; that gap is preserved at the new scale. A wider gap would be dead.
**Open follow-up:** if a cumulative ladder was intended, the engine must read
`premiseMilestoneTotal` for the concede check rather than the live tally.

**D19 — The concede floors (10 elite / 12 boss) are now inert** at
`concedeAt: 14`, but still printed on the face because the number-parity guard
requires every number the engine prints to appear in `paidSummary`.

## Test and guard decisions

**D20 — The number-parity guard survives; the style clauses do not.** Kept:
every number the engine applies appears verbatim on the face, every UPPERCASE
run is a registry keyword, every printed keyword has a popup, no card is
unplayable, the card-editor kind-union assertion, the turn-law test. Deleted:
the 130-character budget, the em-dash and semicolon bans, "the foe" not "the
enemy", every count pin, every band, every curve.

**D21 — DOOM's growth clause is excluded from number parity.** The generated
text carries "(grows +1 each time the foe acts)", whose `1` is a rule, not a
number the card applies. Without the exclusion every DOOM carrier would be
forced to print a meaningless 1 on its face.

**D22 — `cards.pricing.ts` survives as an ADVISORY scorer.** `VERB_POINTS`
gained `damagePerHp` (1/3, anchored against HEAL), `pierce`, WRATH's
`expectedHitsLeft`, `flayPerStack`, `twin`, `chainPerPoint`, `execute` and
`overkill`. Nothing gates on the score any more; it feeds the catalog and the
smell tests.

## Known gaps and follow-ups

Raised by the authoring agents, all real, none blocking:

1. **`recoil_x` cannot pay out in damage** — only `poisonPerX`. A
   `damagePerX` / `wrathPerX` would unlock debt's most obvious card
   ("deal 4 per VITAE paid").
2. **`rupture` has no authorable per-stack number**, so a RUPTURE face cannot
   print its own detonation rate. Needs a `perStack` field.
3. **No FESTER/PROLONG rider**, so no FREE line can deepen existing DoTs.
4. **No affliction-count, Soul-count or PLEA-total predicate** in
   `SynergyStatePredicate` — the affliction and harvest themes cannot gate on
   their own currency.
5. **No "deal damage equal to your GUARD" verb.** Vigil's whole pitch is
   faked by printing matched numbers (GUARD 60 / RIPOSTE 60). A
   `{ kind: 'reprisal'; pct }` reading the live defensive pools would make the
   theme do what it says. Vigil's biggest number is a printed 60, below the
   100-300 payoff band every other theme reaches — **the weakest theme as
   shipped.**
6. **No discard-depth scaler** for grave, and **no accumulating quiet-round
   ledger** for vigil.
7. **`overkill` converts to Conviction, Souls and healing but not PLEA.**
8. **A card carries at most one `synergy`**, so a Skull/Saint card cannot gate
   on two conditions despite that band being nominally unbudgeted.
9. **`lock_stance` has no keyword token**, so it prints as prose and renders no
   glossary chip.
10. **The card-editor codegen** (D1) and **FLAY's missing status chip** (D8).
