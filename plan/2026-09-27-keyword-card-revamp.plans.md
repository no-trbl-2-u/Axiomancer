# Keyword / card revamp — three plans to drive the phase

> Written 2026-09-27 for T, ahead of the guided sessions D37 requires. This
> is a **process** document: it decides *how* the post-purge keyword, card
> and card-type work is run, not what any keyword or card is. No keyword,
> card or card type is defined here (THE CARD HOLD, D37). Each plan is a
> different order of operations with its own gates; pick one, or splice.
> Research sources are in §6; every claim that rests on inference carries a
> confidence score (0 = guess, 100 = fact).

## 0. Where the tree stands (facts, confidence 100 unless marked)

| Fact | Value |
|---|---|
| After P1 the player owns | 3 grey cards (`grey-strike`, `grey-ward`, the VULNERABLE grey card) and 3 keywords (DEAL, GUARD, VULNERABLE) |
| Card types in the engine | `CardType = 'spell' \| 'oath' \| 'hex'` — an **open enum** by design (`Cards/types.ts:65`); plus the haunt class (CONJURE-only) and allies (typed `oath`) |
| Card anatomy that survives | FREE line + PAID line, rank ladder Ash→Saint (6), tier 1–3, `color` body/mind/heart, one tray roll per threat phase |
| Stat model (S3, D40–D41) | Body = damage to the foe; Mind = anything on you; Heart = anything on the foe; Grey = unscaled. `base × stat ÷ 5`, no caps |
| Enemy side after P1 | 78 enemies keep 11 enemy keywords (HIDE, SWIFT, BRUTAL, VENOM, UNSHAKEN, ELUSIVE, REGROW, RAVENOUS, WOUNDING, FLURRY, SUMMON) and their statuses |
| Machinery kept for the rework | card rewards + cache offers (gated off, not deleted), `card-upgrades.ts` (D8), die growth `bonusTurnDice` / `dieUpgradeLevel` (D20), the card editor, the sandbox A/B harness, `combat-playtest` matrix + `playtester` agents, `baseline:regen` |
| Keyword discipline still on the books | ≥2 carriers + Vilain's three tests (flavor, compresses, class); complexity budget by rank (Ash/Tooth ≤1 keyword, no trigger; Splinter/Rib ≤2, one condition; Skull/Saint open) |
| Keyword wiring cost | 12 touch points per keyword (engine piece, runtime switch, display, pricing, carriers, hermetic e2e, exports, ban-list, mobile registry + gloss + glyph ×3, editor union, atlas) |
| Baseline | `b5fb0ac9`, 2026-09-27, STALE by one mechanics commit (T6). The matrix measures presets P1 deletes; it must be re-shaped to the grey deck before any number here is cited |

**The two previous runs (confidence 65 that these are the "last 2 times").**

| Run | Shape | What happened |
|---|---|---|
| Phase 29/30, 2026-07-10 | **Keywords first.** A 31-row registry was defined and ratified, then a 70-card FREE-line pass fitted cards to it | The language outran the cards; by 2026-09-02 the library was "tuned to death under ~35 laws" (the rewrite's own words) |
| THE BIG NUMBERS REWRITE, 2026-09-02 | **Cards first, one shot.** 112 cards, 8 new keywords and a 72-row registry in a single unattended session | Purged 24 days later (D36). Nobody had played a slice of it before the whole of it existed |

Common failure: in both runs the **unit of work was the whole library**, and
the first playable moment came after the last card was written. No plan
below allows that. Every plan makes something playable by session 2 and
lets it die before the next slice starts.

## 1. What every plan shares

- **Guided sessions only** (D37). Each plan is a sequence of attended
  sessions; between sessions, agents prepare evidence, never content.
- **A slice is the unit.** A slice is ≤12 cards, ≤2 new keywords, ≤1 new
  card type, playable end-to-end (engine, mobile face, editor) before the
  next slice opens.
- **Kill gate before growth gate.** Each session opens by cutting from the
  previous slice (StS/Balatro practice, §6) and only then adds.
- **Types are the scarcest thing.** A new `CardType` is proposed only with
  the four-question test in §5 answered in writing.
- **Numbers come from the ladder, verdicts come from play.** No governing
  objective function returns (CLAUDE.md doctrine §3). The matrix and the
  `playtester` agents are bug detectors and a witness, not a grade.
- **Residue is filed.** Every session ends with decisions appended to
  `plan/2026-09-25-refactor-strategy.decisions.md` (D43+) and the brief for
  the next slice in `plan/`.

## 2. Plan A — Vision first (the staged pipeline)

Model: Wizards' four-stage process (exploratory → vision → set → play
design) and the "design skeleton" (§6 A1–A4). Best when T wants the
player fantasies fixed before any card exists.

| Session | Name | Output | Gate to next |
|---|---|---|---|
| A0 | **Pillars** | 3–5 one-line player fantasies per family (body/mind/heart) + the grey office's job. What the deck should *feel* like at level 1, 8, 15 | T signs the fantasy list; ≤1 page |
| A1 | **Exploratory** | Wide brainstorm (`/brainstorm-mechanics`, `card-expert` consult, KB receipts): 30–40 mechanic *ideas*, no wiring, no names. Rejects logged with a reason | Ideas tagged to a fantasy; anything untagged dies |
| A2 | **Vision doc + skeleton** | ≤2 pages: keyword shortlist (≤8), card-type verdict (§5), the **skeleton** — a grid of slots by rank × family × type, each slot a one-line role ("Ash body: cheap multi-hit") | Skeleton slots ≤ 40 for the first pool; T ratifies; the doc **expires** after set design (no law accumulates) |
| A3 | **Set design, in waves** | Fill the skeleton 10–12 slots per session, wired through the checklist; sandbox A/B per wave | Each wave green on all three verify gates before the next |
| A4 | **Play design** | `combat-playtest` matrix + `playtester` agents on seeded fights; kill/replace list | ≥2 cards cut per wave, or the wave is suspicious |
| A5 | **Evergreen ratification** | Which keywords are evergreen (any future set may use them), which are deciduous (this pool only) | Atlas rows labelled; D8 upgrades + D20 die growth decided here |

**Card types in Plan A.** Decided once, at A2, from the skeleton: if a slot
family cannot be filled by spell/oath/hex, that is the evidence for a type.
Prior art gate: Wizards adds a type only when it opens design space no
existing type can and carries a whole set's worth of cards (§6 A5).

Strengths: fantasies fixed first, so keywords are named for a role, not a
verb; the skeleton makes the pool's coverage visible before a card exists.
Risks: the vision doc becomes the ~35-law regime again — mitigated by the
2-page cap and the expiry rule; slowest first playable (session 3).
Sessions: 6–7. Confidence the sequence fits this repo: 80.

## 3. Plan B — Slice first (vertical prototypes)

Model: Slay the Spire's weekly early-access loop, Balatro's prototype
timeline, Hearthstone's "a keyword only when many cards already say it"
(§6 B1–B4). Best when T wants to be playing new cards in session 1.

| Session | Name | Output | Gate to next |
|---|---|---|---|
| B1 | **Slice 1: one fantasy, one family** | ~8–10 cards for a single body fantasy, written as **plain rules text** (no new keyword yet), built in the card editor, playable the same session on seeded fights | Slice beats the Act 1 elite set with the grey deck + slice; `playtester` report |
| B2 | **Kill + extract** | Cut what nobody played; **extract keywords** only where ≥3 cards share identical text and Vilain's tests pass; wire them (12 steps) | Extracted keywords ≤2; cut list ≥2 |
| B3 | **Slice 2: mind** | Same shape for a mind fantasy | Same gate |
| B4 | **Slice 3: heart** + vocabulary review | Same shape; then a **vocabulary review**: merge/rename keywords across all slices, check the rank budget | Atlas consistent across slices |
| B5 | **Cross-slice play** | Mixed decks; the reward/cache pools re-armed on the surviving cards; matrix re-shaped and re-stamped | Baseline stamped; D8/D20 decided from what the slices needed |
| B6+ | Repeat per fantasy | Each further slice is one session + one kill session | — |

**Card types in Plan B.** Types by necessity: a type is proposed only when a
card in a slice cannot be written as spell/oath/hex after two attempts, and
at least 3 cards in the slice need the same shape. The proposal is answered
with §5 before wiring.

Strengths: first playable in session 1; keywords are extracted from real
text, so every one has carriers by construction; the kill gate is built into
the cadence. Risks: local optima per slice (a keyword that made sense in
slice 1 collides with slice 3) — mitigated by B4's vocabulary review; plain
rules text on Ash cards can breach the rank budget until extraction — the
budget is checked at B2, not B1.
Sessions: 6 for three fantasies, then 2 per added fantasy. Confidence: 85.

## 4. Plan C — Threat first (answers to the roster)

Model: the enemies survived the purge; the player's toolkit is derived from
what they do. Slay the Spire designed enemies as tests of specific deck
weaknesses; this inverts it — cards as answers, then fantasies layered on
(§6 C1–C3). Best when T wants the pool to be provably relevant to the fights
that already exist.

| Session | Name | Output | Gate to next |
|---|---|---|---|
| C1 | **Threat matrix** | Inventory the 78 enemies' 11 keywords, telegraph patterns and statuses by Act; each row a *problem* ("HIDE walls chip damage", "FLURRY punishes single big GUARD") | Matrix ≤ 25 rows, agent-prepared, T prunes |
| C2 | **Answer slots** | For each row, the answer *shapes* each family could own (body: burst through; mind: absorb; heart: pre-empt). This is the skeleton, derived instead of imagined | Every Act 1 row has ≥1 answer slot per family; rows nobody wants to answer are enemy-side work, filed |
| C3 | **Slice by Act** | Cards for Act 1 answers (~12), plain text, wired, played on the actual Act 1 encounter pools | Matrix + `playtester` on Act 1; kill list |
| C4 | **Fantasy pass** | Give each surviving card a role in a fantasy; rename; extract keywords (≥3 carriers) | Atlas; rank budget |
| C5 | **Measure** | Re-shape the baseline to the grey deck + Act 1 pool; stamp; then Act 2 rows | Stamp cited in the brief for C6 |
| C6+ | Next Act | Repeat C3–C5 per Act | — |

**Card types in Plan C.** A type is justified by a threat row that no
one-shot or passive card answers (for example a row that needs something
that lives *between* fights, or on the die tray). The §5 test still applies.

Strengths: nothing in the pool is decorative; the matrix doubles as the
enemy roster's audit, and the baseline is re-shaped early. Risks: reactive
design reads as a toolbox, not a fantasy — C4 exists for that; Act-by-Act
sequencing can delay late-game keywords (WRATH-class scalers) — allow one
"late" slot per family from C2. Confidence: 75.

## 5. The card-type test (all plans)

A new `CardType` costs a face layout, an editor union, a FREE-line rule
(spell authors one; oath/hex derive a timed one), reward weighting and a
tutorial beat. The research (§6 A5, B7, C2–C4) agrees on one criterion: a
type exists when it carries **its own rule** — a lifetime, a zone, a cost
family or a per-fight limit — that rules text on an existing type cannot.
Before any type is wired, answer in writing:

1. **Which rule is the type's own?** Name the lifetime / zone / limit and the
   card that fails without it. If a keyword on a spell expresses it, it's a
   keyword.
2. **How many cards will carry it in the first pool?** Fewer than ~6 is a
   keyword or a one-off, not a type (Wizards' "very high bar", §6 A5).
3. **Would it be a drag to explain to a friend?** One sentence of reminder
   text; if it needs two, the type is two ideas (§6 C3).
4. **Does it resolve through the existing loop?** FREE/PAID lines, the tray,
   the threat phase. A type that needs its own turn structure is a second
   game (§6 C2).
5. **What does it cost the face and the editor?** List the files. Paper or
   sandbox it before any of them change (§6 C3–C4).

Candidate shapes to *evaluate* (not adopt) come from the corpora in §6:
Dawncaster's categories (Action, Enchantment, Form, Basic Attack, Equipment,
Affix, Revelation, Artifact, Path, Item) and Slay the Spire's five (Attack,
Skill, Power, Status, Curse) — plus the shapes this engine already half-owns:
haunts, allies, the relic-granted card, die growth (D20) and card upgrades
(D8). Confidence that at most one new type earns its place in the first pool:
70.

## 6. Research receipts

Gathered 2026-09-27 by web scouts; primary sources unless marked
*secondary*. Anything the scouts could not load is marked UNVERIFIED and
carries no weight in §2–§5.

### A — the staged pipeline (Plan A's model)

| # | Principle | Source | What to copy |
|---|---|---|---|
| A1 | Four stages: exploratory (asks questions, scopes problems), vision (fixes the mechanical focus, hands off a file), set design (builds and field-tests), play design (tunes). Each stage has a different job; tuning is separated from building | Rosewater, "Vision Design, Set Design, and Play Design", 2017-10-23, magic.wizards.com/en/news/making-magic/vision-design-set-design-and-play-design-2017-10-23 | A0–A5's stage split; never tune inside the build session |
| A2 | The design skeleton: a slot grid (per colour × rarity, creature vs spell, removal/draw/trick counts) "to see at a glance the needs of the set", filled against gaps rather than ad hoc. "A living, breathing document" | Rosewater, "Nuts & Bolts: Design Skeleton Revisited", 2021-03-22, magic.wizards.com/en/news/making-magic/nuts-bolts-13-design-skeleton-revisited-2021-03-22 | A2's rank × family × type grid; C2 derives the same grid from threats |
| A3 | The vision handoff: 3–5 numbered set goals, one section per mechanic with sample cards, rationale and rarity spread, and explicit notes on where set design has flexibility | Rosewater, "Reality Fracture Vision Design Handoff, Part 1", 2026-09-21, magic.wizards.com/en/news/making-magic/reality-fracture-vision-design-handoff-part-1 | A2's ≤2-page doc shape |
| A4 | Keyword vs ability word: keywords replace rules text and are the only thing other cards can reference; ability words label shared text. Mechanics exist to fill skeleton gaps, solve playtest problems or deliver theme. No fixed card-count minimum exists; a mechanic was keyworded on one cycle so it "could be used again later" | Rosewater, "Finding Your Mechanics, Part 1", 2025-04-07, magic.wizards.com/en/news/making-magic/nuts-and-bolts-17-finding-your-mechanics-part-1; Blogatog 2024-09-06 | B2/C4's extraction rule: keyword what other cards will reference or you will reuse; plain text for the rest |
| A5 | New card type bar: "very high"; a type is warranted only when its rules must be baked into the type itself and would not fit as a subtype's text (Battles); Planeswalkers needed a template no permanent had | Blogatog 2025-05-15, markrosewater.tumblr.com/post/783593925555421184; Wargamer 2023-04-03 quoting Rosewater (*secondary*); Rosewater, "Planeswalking Down Memory Lane", 2018-07-23 | §5 questions 1–2 |
| A6 | New World Order: restrict comprehension and board complexity at common, keep strategic depth; ~12 words of rules text is a red flag; ~20% of commons may break a flag with a reason. Lenticular cards hide complexity in strategy, not text | Rosewater, "New World Order", 2011-12-05; "New New World Order", 2013-04-01; "Lenticular Design", 2014-03-31 (all magic.wizards.com/en/news/making-magic/) | The rank budget already in the atlas; add a word cap on Ash/Tooth |
| A7 | Evergreen (every set), deciduous (toolbox, any set that wants it), set-only. Promote when generic, popular, fills a gap, tests well at common; demote when swingy or confusing | Rosewater, "Deciduous", 2022-03-28; "Evergreen, Eggs & Ham", 2015-06-08 | A5's ratification tiers |
| A8 | Top-down (flavour leads) vs bottom-up (mechanics lead): declare which leads, leave slack for the other | Rosewater, "Creative Elements", 2018-03-26 | Plan A is top-down, B and C are bottom-up; say so in the brief |

### B — the prototype loop (Plan B's model)

| # | Principle | Source | What to copy |
|---|---|---|---|
| B1 | Balance by data, not intuition: pick rate when offered × presence in winning decks, weekly patches; feedback channel for "feel" because "the numbers are not telling us how things feel". Rework before delete (Dual Wield) | Game Developer, "How Slay the Spire's devs use data", 2018-02-27, gamedeveloper.com/design/how-i-slay-the-spire-i-s-devs-use-data-to-balance-their-roguelike-deck-builder; GDC 2019 "Metrics Driven Design and Balance" (video; the "largest mechanic cut" section UNVERIFIED) | B2's kill session reads a pick × win table from the matrix plus the `playtester` feel report |
| B2 | Build the scoring core first, add a layer only when the core proves out; every Joker went through a balance change, some scrapped; cut anything that "cannibalises all the adjacent strategies" | LocalThunk, "Balatro Timeline", 2024-03, localthunk.com/blog/balatro-timeline-3aarh; Rogueliker interview 2024-03-07 | B1 starts from the grey core; B2's cut criterion |
| B3 | Keyword only when the effect recurs; a two-card effect was left unkeyworded; "keywords are double-edged swords" between condensing and vocabulary load. Expansion keywords rotate so players "don't have to learn a hundred new mechanics" | Brode via hearthstone.wiki.gg/wiki/Ability (*wiki-mediated*); Yong Woo, Gamescom 2014 (*wiki-mediated*); Ayala, hsreplay interview 2018-11-07 | B2's ≥3-carrier extraction; a short evergreen list per A7 |
| B4 | Keyword stacks lose identity ("Fearsome is much less impactful when it already has Challenger and Elusive") | Riot (Morgan) via outof.games 2022-07 (*secondary*) | Rank budget: ≤2 keywords per card below Skull |
| B5 | Marvel Snap: one card type, two keywords, ~11 words per card; "simplify, even if your team hates you"; teach each keyword by the card that showcases it, in unlock order | mobilegamer.biz 2023-03-23 and 2023-03-21 (Brode, Hagman; GDC 2023) | The reward pool's re-arm order teaches keywords one at a time |
| B6 | Inscryption: one icon per ability, reminder text one click away, never on the face; legibility "constantly fretted over" | thumbsticks.com 2022-03-25; gamedeveloper.com 2022-03-14 (Couture) | The glyph + gloss popup the atlas already mandates |
| B7 | Monster Train 2 added two card types (Equipment attaches to a unit, Room modifies a floor), each limited to one per slot; Dawncaster's keyword count grew ~10 per expansion | gamingbolt.com 2025-04-09 (Cooke, *secondary*); dawncasterrpg.fandom.com/wiki/Keywords | §5: a type earns a slot limit and a clear attachment target, or it's a keyword |

### C — threat-led and gated evaluation (Plan C's model)

| # | Principle | Source | What to copy |
|---|---|---|---|
| C1 | Cards are brainstormed in the thousands and the weak ones cut; two metrics decide — pick rate when offered ("too low and it's basically not a card in our game") and presence in winning decks ("too high and you know that card is overpowered"); no formula, change then re-observe; "metrics can be misleading" (super-playtester bias) | Game Developer 2018-02-27 (above); GDC 2019 talk (thresholds in slides, UNVERIFIED) | C3/C5: the matrix's per-card play rate and win-deck presence as floor/ceiling flags, never fixed bands (doctrine §3 forbids a governing curve anyway) |
| C2 | A second deck / new rule set is cheap only when it shares the core turn structure and verbs (Griftlands' negotiation reused the battle engine after a roll-based version was "a lot less fun") | Uppercut, Bailes, 2020-06, uppercutcrit.com/feat-of-klei-how-griftlands-exemplifies-a-nurturing-approach-to-game-development | Any new type must resolve through the existing FREE/PAID + tray loop |
| C3 | "If a rule would be a drag to explain to a friend on board game night, it wasn't good enough"; prototyped in Tabletop Simulator in half an hour; double-digit numbers "extremely rare" | Game Developer (Guerra, Cobalt Core), gamedeveloper.com/design/how-cobalt-core-makes-movement-as-exciting-as-fighting-in-its-roguelike-deckbuilder-combat | §5 question 3; paper the type before code |
| C4 | Wildfrost's clunkers are a type born from one rules exception (health replaced by scrap); "the two major things are simplicity and consistency"; paper prototype first | MCV, Pavey, 2023-06-27, mcvuk.com/business-news/when-we-made-wildfrost | A type is one rule exception with a name, not a bundle |
| C5 | Keywords "make card texts shorter... create classes of cards"; lenticular designs look simple and reveal depth | Game Developer, Harris, 2022-03-04 (Vilain, Roguebook), gamedeveloper.com/design/tackling-deckbuilding-design-in-abrakam-s-roguebook | The atlas's three tests come from here; unchanged |
| C6 | Keyword budget: "8–12 to start and no more than 7 for expansions"; keyword only simple, frequent mechanics, drop unused ones | Game Developer, Kinstler, 2018-07-02, gamedeveloper.com/game-platforms/card-games-what-s-in-a-keyword; Cloudfall (Loewen), 2021-06-30, cloudfallstudios.com/blog/2021/6/17/design-tips-keywords | First-pool ceiling: ~10 player keywords including the 3 that survive; a retire pass per Act |
| C7 | Stage-gate funnel: 2 days to 5 weeks per experiment, gate "engaging for at least 15 minutes"; add one idea, keep if it works, else move on. "Once the idea hits the table you're in a conversation with the idea" | Cook, gamethinking.io/podcast/104-dan-cook; Lantz, forcingfunction.com/podcast/frank-lantz, 2022-11-03 | One idea per slice; the `playtester` session is the 15-minute gate |
| C8 | Cut a part "that isn't working with the whole, even if you personally like it"; start from a strong core, remove what conflicts with it, add what supports it | Forbes (Griftlands, above); Burgun, Clockwork Game Design 2nd ed., 2025 | The kill gate in §1 |
| C9 | Astrea's dice taxonomy is a risk axis (safe / balanced / risky), not a function axis | Indiecator, 2022-09-26 (Castanho) | A candidate axis for the die-growth decision (D20), not for card types |
| C10 | "Most digital games don't have ENOUGH randomness"; luck lets weaker players win sometimes | Garfield, Game Developer spotlight 2020-07-07; Board Game Design Lab 2018-05-02 (audio) | The tray stays the variance source; cards don't add a second one |

Not found, and therefore not used: a Mega Crit keyword cap or text limit;
Giovannetti's rationale for Powers as a type; Dawncaster designer statements
on types (the corpus gives categories only); "Alexander Ostrovski" as a
design writer (no such source).

## 7. Recommendation and open calls

**Recommended: Plan B**, with A0 (the one-page fantasy list) bolted on as
session 0 and C1 (the threat matrix) prepared by agents before B1 as
briefing material. Reason: both previous runs failed by making the whole
library the unit of work; B is the only plan whose first session ends with
T playing new cards, and its keyword extraction rule makes carrier count a
consequence rather than a gate. Confidence: 70.

Open calls for T (put as a ballot, `AskUserQuestion`, not re-asked once
answered):

1. Which plan (or splice).
2. Whether the "last 2 times" are the two runs named in §0 (confidence 65).
3. Whether card upgrades (D8) and die growth (D20) are decided inside the
   first slice or held for the ratification session.
