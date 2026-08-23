# Card frame legend — the structure every card shares

<!-- lexicon-ok: doxa, lemma, thesis, theorem, axiom -->

The [keyword atlas](./keyword-atlas.md) defines the *verbs* (STAGGER, POISON, …).
This legend defines the *frame* they sit in — the die economy, the two-line
FREE/PAID split, the conditional die-line glyphs, and the status notation. It is
stated once here so no card face or keyword row has to repeat it. A card is
"resolvable" when its face + the atlas + this legend leave nothing unstated.

## The two lines

Every card prints two lines:

- **FREE —** the top line. Fires automatically, **costs no die**.
- **PAID —** the bottom line. The card's main effect. **Costs 1 die** (any
  colour) to fire. Every PAID line costs exactly one die, so the cards no longer
  print it.

Oaths split by *duration* instead: **FREE (N rounds) —** grants the
passive for N rounds; **PAID (rest of combat) —** makes it permanent. A
hex's passive **attaches to the enemy**.

## Die-line glyphs (conditional riders)

Riders print after the PAID line, each led by a glyph naming its trigger:

| Glyph | Trigger | Reading |
|-------|---------|---------|
| `⬡ COLOR ×N spent` | **Threshold** — you have spent N dice of COLOR this turn (across all cards) | rider fires once the count is met |
| `⬢ COLOR die` | **Powering-die bonus** — the die you commit to *this* card is COLOR | `MIND/WILD` = the card's own colour or a wild; `off-colour` = any other |
| `✕ an X die may power this` | **Fate** — an X (**dead**, normally unspendable) die may pay the die cost | rider fires; may cost `recoil N HP` |
| `◆ <condition>` | **Synergy** — a combat-state condition holds | rider fires while true |

The text after the colon is the rider's full payload, in the same units the
atlas uses (`PLEA 4`, `draw 1`, `+1 intensity · STAGGER 1`).

## Status notation

- `name iN dM` — a status at **intensity N**, **duration M**.
- `(K over its run)` — total damage a damage-over-time effect deals across its
  life.
- `(K/play)` / `(K/hit)` / `(K/payoff)` — an event DoT's bite **per clock
  event** at its printed intensity: POISON bites per **card you play**, BLEED
  per **damage instance** (then decays 1 intensity per trigger), payoff-clock
  DoTs per **payoff verb fired**. See the atlas rows for the clocks.
- `RIPOSTE N (parry K)` — the counter deals N on a full block; the **parry**
  additionally shaves K off the first incoming hit each phase (that shave
  counts as prevented damage).

## Rank tag

`Ash · Tooth · Splinter · Rib · Skull · Saint` (spec 34 R-14; was
`Doxa · Lemma · Thesis · Theorem · Axiom · Aporia`) is the rarity ladder. It
shows as a chip, not on the face — it never affects resolution.

## Card-text grammar (phase 40, 2026-08-23)

Ruled R4 (2026-07-18), re-scoped at ship time against PR #193 ("strip the
prose off the card face", merged 2026-08-10): the authored PAID
sentence no longer prints on the glance FACE at all — the face is
`KEYWORD` over its value only (see `docs/keyword-atlas.md`; the projection
is `paidValueFor`/`CombatCardFace` in mobile). The authored sentence
(`Card.paidSummary` for spells, `Card.persistentEffect` for oath/hex
passives) now renders on the **INSPECT OVERLAY**, which already owns the
keyword definitions per that PR's stated design ("the card details already
define the keywords"). This grammar governs that overlay sentence — the
`KEYWORD_GLOSS` / `SYSTEM_GLOSSARY` popup prose in mobile's
`state/combat/keywords.ts` follows the same bans.

**The rules (hard, linted):**

1. **No em dash (—) and no semicolon (;)** anywhere in an authored string. A
   clause break is a new sentence (`. `); a trigger or consequence label is
   a colon (`REQUIEM 8: …`, `SENTENCE 6: …`) — never a scaffold for a whole
   second clause.
2. **One effect, one sentence.** Gate / cost / condition comes before the
   payoff it unlocks (`RECOIL 3, then DRAW 2.` not the reverse).
3. **Colon = trigger label only.** `LABEL N: payoff.` — never a stand-in for
   "and" or "which".
4. **Parens carry the honesty-required trigger/clock note** — an event DoT's
   real tick (`ticks each card you play`) or a non-decaying clock's growth
   rule (`grows +1 each time the foe acts`) — plus its duration where one
   applies, comma-joined (`(ticks each card you play, 2 turns)`), never
   `KEYWORD N for M turns` immediately adjacent: that exact word order is
   the WI-2 round-clock lie the honesty guard bans for event-triggered DoTs
   (see `Combat/e2e/paid-summary-honesty.engine.test.ts` and the mobile
   `card-face-honesty.guard.test.ts` WI-2 sweep) even when a correcting
   parenthetical follows.
5. **Bare keywords.** The overlay IS the gloss; an authored sentence never
   re-explains what a keyword already means, only its printed numbers.
6. **"The foe" is the fixed vocabulary.** "The enemy" is retired from every
   authored `paidSummary` / `persistentEffect` string and from the mobile
   glossary prose (`KEYWORD_GLOSS`, `SYSTEM_GLOSSARY`).
7. **Budget:** `paidSummary` (spells) ≤ 130 characters, ends in terminal
   punctuation, never restates the "PAID —" scaffold. `persistentEffect`
   (oath/hex passives) carries no fixed cap — a trigger clause plus its
   payoff legitimately runs longer than a spell's single payoff — but stays
   a single dense read, not a paragraph.

**Seven clause shapes** the authored corpus resolves into (mix freely; a
card uses only the shapes its payload needs):

1. **Bare payoff** — `KEYWORD N.` (`PLEA 3.`)
2. **Sequential payoffs** — `KEYWORD N. KEYWORD M.` (`MILL 2. FORETELL 1.`)
3. **Gated payoff** — `COST, then PAYOFF.` (`RECOIL 3, then DRAW 2.`)
4. **Duration-qualified payoff** — `KEYWORD N (trigger note, D turns).`
   (`Inflict POISON 1 (ticks each card you play, 2 turns).`)
5. **Trigger-labeled payoff** — `LABEL N: PAYOFF.`
   (`REQUIEM 8: TICK every DoT on the foe and DRAW 1 (8+ cards in discard).`)
6. **Multi-clause sequence** — `PAYOFF, then PAYOFF.` / `PAYOFF and PAYOFF.`
   (`Apply DOOM 1 (grows +1 each time the foe acts), then FESTER 1: …`)
7. **Passive trigger** (persistentEffect only) — `Whenever X, PAYOFF.` /
   `At the end of each round, PAYOFF.`
   (`Whenever you pay RECOIL, afflict the foe with BLEED 1 …`)

**Known residue (filed, not fixed this pass):** the engine's OWN generated
strings in `Combat/combat.cards.ts` (`statePredicateText`'s `UNMOVED`/
`enemy-drew-blood` clauses, the hex `Attaches to the enemy.` suffix, and the
`lock_stance` / `boost_all_dots` mechanic-text lines) and the mobile
presenter's per-mechanic `verbLine` prose in
`state/presenters/combat-encounter.engine.ts` (`mechanicHeadline`) still say
"the enemy" and still carry stray em dashes in places. Both are engine/
presenter-generated (not authored per-card prose) and are a materially
larger surface with their own review burden — out of scope for this pass;
see `plan/AUDIT.md`.
