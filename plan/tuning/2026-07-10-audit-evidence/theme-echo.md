# THEME AUDIT — ECHO (preset `refrain`) — the loop pedal with one riff

Auditor: mechanics-expert (SNOB lens), 2026-07-10. Companion to `tuning-audit/dossier.md`
and `tuning-audit/baseline.md`. Sims: 5 invocations, seeds/commands cited inline.

**Verdict in one line:** Echo is sold as "nothing is said once" and plays as *nothing is
said, once* — a deck of six multipliers wrapped around a single payload card, whose three
signature decisions (what to reprise, what to replay, what to echo) are all made by the
engine, an argmax, or a coin flip, and whose crescendo silently flatlines against the
intensity cap by turn 7.

---

## 0. Methodology note + a harness finding the whole audit must carry

The baseline said auto-mode has no transcript. Half true: `--state-log <path>` captures the
full engine event log, and I reconstructed line-by-line transcripts from it
(`scratchpad/refrain-early.jsonl`, `refrain-mid.jsonl`). Doing so exposed a **sim-harness
bug that inflates every CLI transcript in this audit fan-out**:

> `autoPlayPhase` (`src/CLI/combat.cli.ts:271-303`) loops `endTurn()` → `startTurn()` up to
> `maxTurns × 6` times **inside a single threat phase** — the enemy acts once while the bot
> gets up to ~40 fresh dice trays of Conviction income. My early transcript shows 38
> `turn-dice-rolled` events between the first and second `threat-fired`; the bot cast
> Overwhelming Argument 5× and Conviction Strike 1× per enemy action, off farmed tokens.

The engine's intended loop (dossier §1) is one roll → draft → plays → threat phase. The CLI
auto loop violates it. **Consequence: the baseline's "signatures deal 90-95% of damage"
transcripts are partly this artifact.** The `combat-playtest` sim does not share the bug
(its rounds are 1.0-2.3, consistent with one tray per threat phase), so I weight the matrix
over the CLI fights. Filed as a cross-cutting finding; every theme auditor quoting a
`npm run combat --auto` transcript should caveat signature-cadence claims.

Sim invocations used:

1. `npm run combat -- --auto --policy status --stage early --deck preset:refrain --seed 3 --max-turns 14` (×2, second with `--state-log`)
2. `npm run combat -- --auto --policy status --stage mid --deck preset:refrain --seed 5 --max-turns 14 --enemy hasshaku-sama --state-log …`
3. `npm run combat-playtest -- --stage=early --policy=blind --deck=preset:refrain --runs=30 --seed=1 --cards`
4. `npm run combat-playtest -- --stage=mid --policy=blind --deck=preset:refrain --runs=30 --seed=1 --cards`

---

## 1. The deck as printed (`src/Cards/cards.library.ts:1341-1486`)

| card | slot | stance | FREE line | PAID line |
|---|---|---|---|---|
| `refrain` ×4 | C1, T1 | mind | draw 1 | MARK d2 + Echo Sting d2, **ECHO** (applied twice) |
| `second-thoughts` ×4 | C2, T1 | mind | draw 1 | REPRISE 1 + rider `ruptureMarks:1` (consumes ALL marks @1/stack) |
| `ad-nauseam` ×2 | U1, T2 | mind | MARK d1 | next spell gains ECHO; die-bonus draw 1 |
| `circular-reasoning` ×2 | U2, T2 | mind | draw 1 | REPRISE 1 + fire the reprised card's FREE line |
| `ouroboros` ×1 | R, T3 | mind | draw 1 | replay last spell ×2 + rider `ruptureMarks:3` |
| `resonant-chamber` ×1 | R-ench | mind | timed 3-round instance | permanent: first spell each turn gains ECHO |
| `stuck-in-their-head` ×1 | R-disench | **heart** | timed | every ECHO/REPRISE drips `max(2, min(16, markStacks))` (`combat.engine.ts:1428-1436`) |

Damage sources: Echo Sting (ramping DoT, `debuffs.library.json:1021`, tick = intensity +
0.5/turn ramp), MARK amplifying it (+1/stack/tick), two mark-detonators (1×/3× per stack),
and the stuck drip. All doctrine-legal; the strike is genuinely dead here.

Three structural facts fall out of this table before a single game is played:

- **Payload:multiplier ratio is 1:6.** `refrain` is the ONLY card with `combatEffects`.
  Everything else doubles, returns, or replays — a Dominion deck of six Throne Rooms and
  one Village. Multiplication of nothing is nothing.
- **Mono-mind under the color law.** 6/7 cards are mind-stance. P(no mind, no wild in a
  3-die tray) = (4/6)³ ≈ **30% of rounds are PAID-dead** for this deck, with zero in-theme
  dice manipulation (KINDLE/FORGE/TRANSMUTE are foundry's). The tray literally tells you
  "skip your turn" three rounds in ten.
- **The FREE fork is wallpaper.** Four of five spells print the identical `free: {drawCards: 1}`.
  The owner's signal targets "weak chip OR real effect" forks; echo's variant is *worse* —
  the FREE line isn't even a weak version of the theme, it's deck-neutral cantrip filler
  that lays no foundation for any PAID payoff.
- Mislabel: `card-themes.ts:52` advertises **CONJURE** in echo's keyword family; no echo
  card conjures anything.

---

## 2. As played — the numbers

### Playtest matrix (blind, 30 runs/cell, seed 1)

| stage | win | doctrine target | rounds | statusEng | dotFrac | strike | dom |
|---|---|---|---|---|---|---|---|
| early (6 enemies) | **100%** | ~80% | **1.0–1.6** | 26% | 70% | ~30% | **81% (refrain)** |
| mid (5 enemies) | **100%** | ~50% | 2.0–2.3 | 27% | 71% | ~30% | **77% (refrain)** |

- **Worst curve violator in the roster.** `combat-playtest.balance-bands.sim.test.ts:186`
  already pins `refrain` at 1.00/1.00/0.92; my cells confirm 100%/100% at both gated
  stages. Doctrine demands 80→50. Even **rawhead-rex — the enemy that kills 27% of blind
  policy-pick decks (baseline table a) — goes down 30/30 in 2.3 rounds.**
- **Early fights last ONE round.** grave-larva/little-belle/water-holger die at rounds=1.0.
  A theme whose entire fantasy is *repetition compounding over time* kills before it gets
  to repeat anything. There is no setup→payoff arc because there is no arc; the opener IS
  the payoff.
- **statusEngagement 26-27%** — in the "statuses are THE fun" game, barely a quarter of
  echo plays land a status, and the per-card table says why: `refrain` accounts for 1,273
  of ~1,668 statusLands at mid; `second-thoughts` (1,601 plays, the most-played card)
  lands **zero**.
- **dom 76-81%**: one card deals four-fifths of enemy HP damage. The playtest header calls
  >70% "spam". This is the highest dominance I've seen outside the baseline's
  brief-candle late cells.
- Tooling note: `ad-nauseam` shows `statusLands 0` across 974 plays despite its FREE line
  landing `debuff_mark` in both transcripts (early T2: `effect-landed ad-nauseam
  debuff_mark i4/i5`) — the counter misses FREE-line `applyEffect`. Minor accounting bug.

### Transcript moments (state-log reconstructions)

**Early, seed 3, Little Belle (40 HP), victory in 2 phases, player 69/90:**

- T1 is genuinely lovely — the one good turn this deck owns: draft wild → `refrain` PAID
  with ECHO (`effect-landed refrain debuff_mark i3 / debuff_echo_sting i3` ×2 → i6/i6),
  the fresh statuses refresh the die (`die-refreshed t1-d1`), chain into
  `stuck-in-their-head` PAID off the same die. Textbook R9 variety chain.
- T2 rolls `x(X) body x(X)` — off-color, so the color law shuts the deck off — and the bot
  plays **thirteen consecutive FREE lines** (`circular-reasoning`, `resonant-chamber`,
  `second-thoughts` ×4, `refrain` ×3, `ouroboros`, `ad-nauseam` ×2…), all
  `useBottom:false`, all draw-1s cycling each other, net board change: two mark stacks
  from ad-nauseam's FREE. The deck spent an entire turn shuffling itself in public.
  This is the FREE-fork indictment in a single screenshot.
- T3 onward: no library card is played again for ~38 farmed turns (harness bug, §0), then
  Little Belle dies to sting+poison ticks. The DECK's contribution ended at T2.

**Mid, seed 5, Hasshaku-sama (450 HP), status policy — DEFEAT (harness-flavored, but the
card behavior is real):**

- **T2, the finisher fired as tempo:** `ouroboros` PAID at turn 2 replays refrain
  (mark/sting stack to i8) then `damage-dealt ouroboros 24` — the rider consumed all 8
  mark stacks at 3/stack for 24 damage against a 450 HP enemy, **stripping the +8/tick
  amplifier off Echo Sting in the process**. The serpent ate its own engine.
- **T5, the rare fires a blank:** `card-played ouroboros … echoed second-thoughts` —
  followed by *nothing*. `replay_last` re-executes only `combatEffects`
  (`combat.engine.ts:1670-1693` → `executeCard`), and second-thoughts has none. Four of
  the seven deck cards are blanks for ouroboros; only `refrain` is a live target. The
  deck's Axiom-grade finisher is a coin flip on what you happened to cast last, and the
  UI never says so.
- **T7, the crescendo hits the ceiling:** `effect-landed refrain debuff_echo_sting i10` —
  Echo Sting is capped (`MAX_EFFECT_INTENSITY = 10`, `game-mechanics.constants.ts:74`) by
  turn 7. From here, every echoed re-application of sting is **silently wasted**. ECHO's
  doubling anti-scales precisely when the "tune getting louder" fantasy should peak.
- T3/T4: `second-thoughts` PAID twice; `reprised … returned:["ouroboros"]`,
  `["ad-nauseam"]` — the engine's argmax picks (`combat.engine.ts:1653-1654`,
  highest-rank, no player choice), each play also detonating the mark stack at 1/stack
  (`ruptureMarks:1`) for single-digit bursts.

---

## 3. Judgment

### Identity as played

**"Cast Refrain as many times as the dice allow; everything else is packaging around
Refrain."** The fantasy on the tin — echo, reprise, replay, small effects multiplied
relentlessly — resolves at the table into: stack one DoT + one amplifier fast (echo = ×2
application speed), then detonate marks. That is not an echo deck; that is an affliction
deck with the numbers pre-doubled and the card variety removed.

### Nearest neighbor

**Affliction (`erosion`), unambiguously.** Same loop: apply DoT → amplify (MARK) → detonate
(RUPTURE-class rider). Echo's mark-detonators are RUPTURE wearing a costume; Echo Sting is
POISON with a different ramp constant. What erosion does with seven distinct verbs, refrain
does with one card and five mirrors. The hallmarks that should differentiate it — REPRISE
(discard recursion) and replay — are decision-free as implemented, so they read as card
advantage, not identity.

### Where the player thinks — and where the game confiscated the thought

The deck has, on paper, the best sequencing puzzle in the roster:

- `resonant-chamber` blesses the FIRST spell each turn (`combat.engine.ts:1222`) → lead
  with your best payload;
- `ad-nauseam` charges the NEXT spell → order your hand;
- `ouroboros` replays the LAST spell → what you cast before the finisher matters.

Three genuinely elegant position-in-sequence hooks. **All three collapse because there is
exactly one payload**: the answer to "what do I lead with / charge / replay?" is always
"Refrain," every turn, every fight. And the theme's other two decisions were confiscated
outright: REPRISE auto-picks the highest-rank discard (the player never chooses what to
bring back), and mark-detonation timing is degenerate because fights end in 1-2 rounds and
two different cards eat the stack on-curve. Autopilot is not a failure of the player here;
it is the designed state.

### Is there a setup→payoff arc with a felt spike?

No. The measured spike (`ouroboros` T2: 24 burst) is *smaller than the ambient sting tick*
(25 the same phase). Wildfrost, Monster Train and StS all make their multiplier decks feel
like a held breath released; here the balloon is inflated and popped in the same turn for
less than the cost of holding it.

### What is it missing?

1. **A choice about WHAT gets doubled/returned** — the entire genre lives there (Dominion's
   Throne Room, StS Dual Cast/Hologram, Dawncaster's `Spell Echo`).
2. **A cost or tension on repetition.** KB: Dawncaster's `Spell Echo`
   (`kb/KnowledgeBase/DigitalCardGames/dawncaster/cards/1414-spell-echo-168727.okf.md`)
   copies your last magic action **and gains you Slow equal to its cost** — doubling is a
   bargain you can misjudge. Axiomancer's ECHO is free, always-on, always-correct;
   Dawncaster's `Vexing Echoes` (1615) even makes repetition a curse vector. Repetition
   with no price is not a mechanic, it's a font size.
3. **A crescendo that survives the math.** The intensity cap (i10 by T7) plus two
   stack-eating detonators means the "tune gets louder" curve is actually
   loud→capped→eaten→flat.
4. **Counterplay/texture on off-color turns** — 30% of trays offer this mono-mind deck no
   PAID line and its FREE lines don't advance the theme, so 3 turns in 10 are dead air.

### Card-level dead weight / traps / mislabels

| card | finding |
|---|---|
| `second-thoughts` | **Trap.** Most-played card (1,601 mid plays); its `ruptureMarks:1` consumes ALL marks at 1/stack — cannibalizing the ×3 detonation of `ouroboros`, the sting amplifier, AND `stuck-in-their-head`'s stack-scaled drip, for single digits. The deck's common actively fights its rare. |
| `ouroboros` | **Blank-fire risk 4/7.** `replay_last` lands nothing unless the last spell was `refrain` (only card with `combatEffects`). Transcript T5: `echoed second-thoughts` → zero events. Also routinely fired at T2 as tempo, not as finisher. |
| `refrain` | Deliberately over-budget T1 (pts comment `cards.library.ts:1354-1356`) and it shows: dom 76-81%. It IS the deck. |
| `ad-nauseam` | The one FREE line with theme content (MARK d1); its PAID `echo_next_spell` is a real decision in theory, solved in practice (target: always refrain). `statusLands` accounting misses it entirely. |
| `circular-reasoning` | `fireFree: true` on the reprised card means the engine plays a card FOR you off an argmax — double confiscation. Fine value, zero authorship. |
| `stuck-in-their-head` | Correct design direction (per-echo drip scaling with marks) but starved by the two detonators; in practice rides its floor of 2. |
| `resonant-chamber` | Honest card, best-designed of the seven; its "first spell each turn" gate would create real sequencing choices in a deck with >1 payload. |
| theme family | `card-themes.ts:52` lists CONJURE; no echo card conjures. Either add a Thoughtform-conjuring echo card or fix the label. |

---

## 4. Proposals (respect the dice law, the strike's death, and the FREE/PAID signal)

### P1 — REPRISE becomes a choice: show the songbook `S`

Change REPRISE from engine-argmax (`combat.engine.ts:1652-1657`) to: reveal the top 3
discard cards by rank, **player picks one** (sims keep argmax as default policy). UX: the
discard pile is already the theme's flavor ("the discard is a songbook",
`cards.library.ts:1341`) — render it. One line of decision texture on 3,000+ plays per
matrix cell, zero new rules mass. Prior art: StS Hologram/Exhume are picks, never random,
because the pick IS the fun.

### P2 — Kill the draw-1 wallpaper: FREE lines advance the loop `M` (the FREE/PAID signal fix)

Replace the four identical `free: {drawCards:1}`:

- `refrain` FREE → **hum it**: apply Echo Sting i1/d1 (the melody enters play even without
  a die — foundation for every PAID multiplier);
- `second-thoughts` FREE → **mill 2** (deck → discard): grows the songbook REPRISE selects
  from — recursion fuel, the archetype's classic FREE action (dredge, Dawncaster corruption);
- `circular-reasoning` FREE → mill 1 + draw 1 (the loop turns);
- `ouroboros` FREE → **TICK** (one enemy DoT ticks now — "the tail already swallowed").

Now the 30% off-color turns (color-law math, §1) are *theme turns* instead of dead air:
you hum, you fill the songbook, you tick the sting. FREE lays foundation for PAID exactly
as the owner demanded, and none of it touches the dice law.

### P3 — Ouroboros repeats what was WORTH saying `S`

`replay_last` → `replay_last_status`: replay the last spell **that landed a status** (track
`lastStatusSpellCardId` beside `lastSpellCardId`, `combat.encounter.types.ts:558`). The
blank-fire (transcript T5) dies; sequencing still matters (you must have said something);
the card face previews "will replay: Refrain ×2 + detonate N marks → 3N". With P5's new
payload card, the replay target becomes a real choice again rather than refrain-or-blank.

### P4 — Second Thoughts stops eating the finisher `S` (tuning)

`ruptureMarks:1` → **consume at most 2 marks** (partial detonation, 1/stack, "a sip, not
the bottle") or swap the rider to TICK. The common keeps early tempo; ouroboros, the sting
amplifier, and stuck-in-their-head keep their fuel; and "when do we detonate?" becomes a
held decision instead of something two cards do to you by accident. Combined with
re-budgeting `refrain` DOWN to stock T1 (it is deliberately over-budget and delivers 81%
dom + a 100%/100% curve violation), this shifts the deck's power from turn 1 into the
build — which simultaneously drags early fights past 1.0 rounds and pushes the curve back
toward 80/50.

### P5 — CRESCENDO: overflow is the payoff `L` (theme-scoped mechanic)

The i10 cap currently deletes echo's doubling at peak (T7 evidence). Rule, echo-scoped:
**when an ECHO application would overflow `MAX_EFFECT_INTENSITY`, the overflow resolves as
immediate DoT-class damage** ("the note breaks the glass"). Doctrine-clean (it IS tick
damage), invisible to other themes (only echo double-applies), and it converts the cap
from a silent whiff into the felt spike this deck has none of — echoing *at* cap becomes
the moment you play for. It also gives the theme a legal late-stage outlet (the
keyword-atlas late wall: durationed DoTs can't erode 1,000 HP bosses), which matters
because this deck must decay by *early-fight tuning* (P4), not by its engine dying. Add
one new common in the C2 slot swap space carrying a second `combatEffects` payload
(heart-stance, to crack the mono-mind tray lock) and P1/P3's choices finally have two
answers.

---

## 5. Scores

- **Distinctiveness as played: 4/10.** The machinery (chamber/charge/replay sequencing) is
  distinct on paper; on the table it is erosion with fewer verbs and bigger fonts, because
  one card is the whole payload and the engine makes the theme's choices.
- **Engagement: 3/10.** 100% win at both gated stages, 1.0-round early kills, 26%
  status-engagement, one card at 81% damage share, the most-played card lands zero
  statuses, and the rare fires blanks. The best turn (T1 chain) is genuinely good — and
  then the fight is over.
