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
| After P1 (merged 2026-09-27, #406) the player owns | 3 grey cards: `grey-strike` A Plain Blow, `grey-ward` A Plain Ward, `grey-word` A Plain Word (D43: PAID VULNERABLE +25% for 2 turns, FREE +10% for 1 turn, stacking and uncapped) and 3 live keywords (DEAL, GUARD, VULNERABLE) |
| Card types in the engine | `CardType = 'spell' \| 'oath' \| 'hex'` — an **open enum** by design (`Cards/types.ts:65`). The haunt class and the ally library were emptied by P1; their modules remain as stubs (`hauntLibrary = []`, `allyLibrary = []`) |
| Card anatomy that survives | FREE line + PAID line, rank ladder Ash→Saint (6), tier 1–3, `color` body/mind/heart, one tray roll per threat phase |
| Stat model (S3, D40–D41) | Body = damage to the foe; Mind = anything on you; Heart = anything on the foe; Grey = unscaled. `base × stat ÷ 5`, no caps |
| Enemy side after P1 | 78 enemies keep 11 enemy keywords (HIDE, SWIFT, BRUTAL, VENOM, UNSHAKEN, ELUSIVE, REGROW, RAVENOUS, WOUNDING, FLURRY, SUMMON) and their statuses |
| Machinery kept for the rework | card rewards and cache offers are **live** on the grey cards (D44 amended D36: a won fight offers Blow, Ward and Word), `card-upgrades.ts` (D8), die growth `bonusTurnDice` / `dieUpgradeLevel` (D20), the card editor, the sandbox A/B harness, `combat-playtest` matrix + `playtester` agents, `baseline:regen` |
| Keyword discipline still on the books | ≥2 carriers + Vilain's three tests (flavor, compresses, class); complexity budget by rank (Ash/Tooth ≤1 keyword, no trigger; Splinter/Rib ≤2, one condition; Skull/Saint open) |
| **Keyword glossary purge: shipped in part** | PR #407 (keyword audit, merged 2026-09-27 after P1) removed the keywords, glosses, glyphs, editor vocabulary and effects that only purged cards used. What remains: 22 player rows in the atlas (dice verbs, afflictions enemies still apply, resolve and tempo verbs the engine owns) plus the 11 enemy rows; the mobile `KEYWORD_GLOSS` holds 31 entries. Only DEAL, GUARD and VULNERABLE have a card carrier. T, 2026-09-27: "Then we're going to purge the keyword glossary of unused keywords." The remaining rows are engine- or enemy-carried, so a further cut is a design call for session 0, not a cleanup (confidence 80) |
| Ownership | S3 residue (PR #404): "A separate card agent owns card, keyword, upgrade and transformation design from here (T, 2026-09-27)." The plans below are that agent's process |
| Keyword wiring cost | 12 touch points per keyword (engine piece, runtime switch, display, pricing, carriers, hermetic e2e, exports, ban-list, mobile registry + gloss + glyph ×3, editor union, atlas) |
| Baseline | `c6fd758c`, 2026-09-27, FRESH: re-stamped after the keyword audit, on the grey deck (`npm run baseline:check`). The S3 residue note warns that stat scaling on top of rank-scaled bases double-counted (mid/late/impossible went to 100%); the purge was expected to undo most of it, and the post-P1 stamp is the one to read before any tuning |

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

### 5.1 Candidate shapes — an inventory to evaluate, not a list to adopt

Sources: Dawncaster's categories (Action, Enchantment, Form, Basic Attack,
Equipment, Affix, Revelation, Artifact, Path, Item; `kb:dawncaster` card
records, `category:` field), Slay the Spire's five (Attack, Skill, Power,
Status, Curse), Monster Train 2 (Equipment, Room), Wildfrost (clunkers),
Astrea (risk-tiered dice), and the shapes this engine already half-owns.
Each row names the rule that would be the type's own (§5 q1), the engine
hook it would ride, and how it fares against the test *today*. Verdicts are
inferences (confidence in the last column); the guided session decides.

| Shape | Prior art | The rule that would be its own | Existing hook | Against §5 | Conf. |
|---|---|---|---|---|---|
| **Persistent passive** | StS Power, Dawncaster Enchantment | Lifetime: rest of fight, leaves the cycle | Already `oath` (on you) / `hex` (on the foe) | Exists. Any "power" idea is an oath or a hex, not a type | 95 |
| **Form / stance** | Dawncaster Form, StS stances (Watcher) | Exclusive slot: one Form at a time, replacing the last; changes a *rule* (which die colour matches, what FREE lines do) rather than adding a number | The tray's colour-match step (`cardStanceColor`), `color` on cards | Strongest candidate: no oath expresses "replace the previous one" or "rewrite the match rule". Needs a face marker and one slot in combat state | 65 |
| **Attachment** | MT2 Equipment (to a unit) / Room (to a floor), Dawncaster Equipment | Zone: attaches to a target that isn't the player or the foe — here the only such target is a **die** or a **tray slot**; limit one per target | `Combat/combat.dice.ts` reserve + slots; the relic-granted card path | Viable only if dice become a zone worth building on (D20). Otherwise a keyword on a spell ("your body die gains …") | 55 |
| **Consumable / one-use** | Dawncaster Item, StS Exhaust, MT consumables | Lifetime: removed from the deck after one play (this run, not this fight) | Cache offers, `card.removal.ts` | Fails q1 as a type: a keyword (a BURN-the-card verb) on a spell does it. Fails q4 unless rewards can offer it separately | 75 |
| **Path / self-upgrading card** | Dawncaster Path I→II→III, StS upgrades (+) | Lifetime across plays: the card *becomes* its next stage | `card-upgrades.ts` (D8, held for this rework) | Not a type: D8 decides the grant path; the same card id with `upgradeLevel`. Evaluate at A5 / B5 / C4 with D8 | 80 |
| **Affix / modifier** | Dawncaster Affix, Revelation | Attaches to *another card* in the deck | None; the editor has no card-on-card reference | Fails q4–q5 hard (a new zone in deck state, a face for the host). Defer past the first pool | 85 |
| **Summon / ally** | Dawncaster Monster, MT units, StS orbs | A second combatant with its own VITAE that acts in the threat phase | The ally library was emptied by P1; the `oath`-typed schema and `cards.allies.ts` stub remain; enemy SUMMON exists | Schema half-exists. The question is whether allies need their own type to be *targetable* (q1). Re-examine only if a slice needs the foe to hit them | 70 |
| **Junk / wound** | StS Status + Curse; the 5 purged curses | Unplayable or self-harming, injected by enemies, removed by a specific verb | Curse injection removed in P1; removal machinery kept | Only if an enemy row (Plan C) needs "clogs your deck" as its threat. A type only because it needs a *removal rule*; otherwise a `hex` on yourself | 60 |
| **Die card** | Astrea's safe / balanced / risky dice | Grants or replaces a die for the fight; a risk axis (more power, more corrupted faces) | `bonusTurnDice`, `dieUpgradeLevel` (D20), the KINDLE/FORGE/BANK die economy | Rides D20, not a card type: a die-growth *grant* can be a spell's PAID line. Only becomes a type if the die itself must sit in the deck (q1: zone) | 60 |
| **Basic attack** | Dawncaster Basic Attack | Always available, never drafted, no rarity | The grey office (Phase 104) | Exists as a *theme* (`grey`), not a type. Leave as is | 90 |

Reading the table: **one** shape (Form / stance) passes the test on paper
today; two (Attachment, Die card) become live only if D20 turns the tray
into a zone; the rest are keywords, D8, or later. So the first pool most
likely ships with `spell | oath | hex` plus at most one addition, and the
type ledger below is where every proposal goes to die or live. Confidence
that at most one new type earns its place in the first pool: 70.

### 5.2 The type ledger (all plans)

Every session appends to a `## Card-type proposals` table in the running
brief: proposal, the slice that raised it, answers to §5 q1–q5, verdict
(keyword / type / defer), and the card that motivated it. A shape proposed
twice with the same failing answer is closed for the phase. This is the
"deciduous" tier for types (§6 A7): a shape can be *available* without
being *used*.

**Where each plan discovers types.** Plan A: once, at A2, from empty
skeleton slots. Plan B: by necessity, when a card in a slice can't be
written as spell/oath/hex after two tries and ≥3 cards want the same
shape. Plan C: from a threat row no one-shot or passive answers. All three
paper or sandbox the shape before any engine file changes (§6 C3–C4).

### 5.3 Card progression — how one card changes over a run

T, 2026-09-27: *"new card progression (upgrades, merging, transforming). I'm
open to all types of card related ideas."* What is already ruled: THE PATH
(2026-09-02) names six progression axes — staged decks, card removal, card
upgrades (Slay the Spire's model), die upgrades, act-reward dice, items →
signature skills. D8 deferred card upgrades' grant path to this rework; D20
kept die growth for it. Neither ruling said *which* mechanisms; that is this
section's job. Each row: the rule, what the engine already has, the
progression-specific test, and a verdict with confidence. Nothing here is
adopted; every row is a ballot for the guided session.

**The progression test** (in addition to §5 where a mechanism needs a type):
(p1) the changed card must still print the number the engine applies
(`paid-summary-honesty` law); (p2) the change must be visible on the face
without a tooltip; (p3) it must scale with the stat model (D41) without a
second formula; (p4) it must have a *price* on THE PATH (a node, a currency,
a sacrifice, plays) — free progression is a difficulty knob, not a choice.

| Mechanism | Prior art | Rule | Engine today | Test | Verdict | Conf. |
|---|---|---|---|---|---|---|
| **Linear upgrade** (`+`) | Slay the Spire rest-site `+`; Monster Train stones, two slots max | One strictly-better copy per card; computed by bucket (+40% magnitude, +25% rate, +1 count) or an authored patch | `card-upgrades.ts` — the whole rule, minus a grant path and the oath/hex hook-by-id hazard | p1 ✓ (face regenerates), p2 needs a `+` marker, p3 ✓ (base moves, formula unchanged), p4 **missing** — that is D8 | Ship first: the cheapest axis, engine-complete. Grant path is the only decision: rest choice vs Blacksmith vs a currency. Keep the one-upgrade cap (§6 D1: stacking "wasn't deckbuilding"); treat the computed rule as a scaffold and author the `+` per card in the slice | 85 |
| **Branching upgrade** (A / B) | Cobalt Core's A/B; Griftlands' choice-of-two on level | Two authored patches; the player picks one; the other is gone for the run | `CardUpgrade` patch supports one path only | p2 ✓, p4 ✓ if it reuses the `+` grant; costs 2 authored patches per card, so it fights the slice budget | Defer to Skull/Saint cards only, after `+` ships; a `+` with a choice is the same face | 70 |
| **Upgrade by use** (XP) | Griftlands: cards level after N plays | A play counter per card instance; the upgrade fires from the counter, not a node | Nothing counts plays per card instance; combat state has no per-card counter | p4 ✓ (the price is play), p2 needs a pip meter on the face; new deck-state field, saves migrate; needs a per-fight XP cutoff from day one or players draw fights out (§6 D4) | The most *game-shaped* option for a campaign RPG (a card you use becomes yours). Evaluate at B5/C5 once the pick × win table exists | 60 |
| **Merge / fusion** | Inscryption: the altar moves one card's sigil onto another and destroys the source; the Mycologists fuse two identical cards (§6 D5) | Two cards → one; the result carries one card's numbers and the other's keyword or line | No card-on-card reference in the data model (same gap as Affix, §5.1); card removal exists | p1 ✓ only if the fused face is generated, p3 ✓, p4 ✓ (the sacrifice is the price); fails p2 unless the face has room for a second line | Attractive for the doom register (a card *eats* another). Prototype on paper: "the merged card = FREE line of A + PAID line of B" is expressible today as a new authored card, no engine work, so pilot it as **authored fusion results** before generic fusion | 55 |
| **Transform** | Slay the Spire Transform event; Dawncaster Ascension I→II→III and Path I→II→III numbered chains (self-replacement UNVERIFIED, §6 D8) | A card becomes a different card, by chance (event) or by chain (its next stage) | Card ids are static; reward/cache offers gated off; map events exist | Chains satisfy p1–p3 as separate authored cards; p4 is the chain's trigger (plays, an act boundary, a story beat). Random transform fails p4 (no choice) unless it is an event's price | Chains, yes, as a Plan C late slot or a Saint slot: a card that *ends* as something else is the cheapest transformation and pure content. Random transform: an event, not a card system | 70 |
| **Attachment / charm** | Wildfrost charms; Balatro enhancements, editions, seals; Roguebook gems | A modifier object sits on a card and changes one number or adds one keyword | None; the closest live thing is die gear (Blacksmith payload swap) | Fails p2 (a second glyph on the face) and needs a new zone; p3 ✓ if the modifier is a keyword | Not for the first pool. If T wants a "modifier" fantasy, put it on the **dice** (gear already exists) rather than on cards | 75 |
| **Die growth** (the card-adjacent axis) | Astrea's risk-tiered dice; THE PATH axes 4–5 | Hone miss faces to mana; add a die per act | `honedDieGear`, `bonusTurnDice`, `dieUpgradeLevel`; D31a proved these the strongest axes | Passes all four; the only open question is the grant path (D20) | Decide the grant with `+` upgrades in the same session: one Blacksmith / rest surface for both | 80 |
| **Removal** (deck thinning) | StS removal pricing; Dominion trashing | Linear price `base + step × removals` | Shipped (Phase 52a/52f), rest offers "cut a card" | Passes | Untouched. It is the axis that makes a small pool feel curated | 95 |

Reading the table: `+` upgrades and die growth are engine-complete and want
one grant decision; chains and authored fusion results are content, not
engine; upgrade-by-use is the one mechanism worth a real prototype; charms
and generic fusion wait. Confidence in that ordering: 70.

**Where each plan decides progression.** Plan A: A2 names the axes the
skeleton assumes (a `+` column per slot?), A5 ratifies the grant paths. Plan
B: B2 ships `+` for slice 1 as its own mini-slice so the kill session
compares base vs `+`; B5 decides die growth and use-XP. Plan C: C2's answer
slots may be answered by a *progression* (a `+` that turns a chip card into
an answer) rather than a new card; C5 decides grants with the stamp.

### 5.4 Everything else card-shaped (the open backlog)

Ideas T is open to, filed so no session has to rediscover them. None is
scheduled; each names its existing surface.

| Idea | Surface today | One-line note |
|---|---|---|
| Card rewards after fights | Live on the grey cards (D44) | Each slice widens the offer pool; the offer *order* teaches keywords (§6 B5) |
| Cache "take a card" offer | Live on the grey cards (D44) | Same pool as rewards, or a rarer one |
| A shop for cards | Act 1 has no shop (adjust-equipment pass 21 filed it) | Card purchase is also a progression price (p4) |
| Curses / junk injected by enemies | Removed in P1 | Only via Plan C's threat rows (§5.1 junk row) |
| Allies / summons | `cards.allies.ts` stub, library emptied by P1 | Needs a slice that wants a second body on the board |
| Haunts (CONJURE-only class) | `cards.haunts.ts` stub, library emptied by P1 | Conjured cards are a free way to add *temporary* cards without a type |
| Relic-granted cards | Purged; relic effects stay | A relic can hand you a card again once the pool exists |
| Deck-size floor / ceiling | Deck sizes open since 2026-09-02 | A ceiling makes removal and fusion matter |
| Card colour vs die colour | `color`, colour-match +25% | The Form / stance candidate (§5.1) is the one that touches this rule |
| Signature skills from items | THE PATH axis 6 | Not cards; leave to `/adjust-equipment` |

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

### D — card progression (§5.3's model)

| # | Principle | Source | What to copy |
|---|---|---|---|
| D1 | Slay the Spire's first prototype let cards "increase values indefinitely" and was thrown out: "Acquire good card, just upgrade that card. This wasn't deckbuilding!" Reduced to one upgrade per card, then "8 straight hours creating a unique upgrade for every single card". The Rest Site makes the upgrade compete with a 30% heal | Yano, Mega Crit AMA, 2019-01-24, bestofama.com/amas/aj6sq1; slaythespire.wiki.gg/wiki/Rest_Site | One `+` per card, and the grant competes with healing. The engine's computed default rule is a scaffold; the authored patch is the product |
| D2 | Monster Train: upgrade stones bought for gold, "cards only have two upgrade slots" (a third via artifacts); impactful upgrades cost 100+ gold | TheGamer (Alston) 2025-05-28; monster-train.fandom.com/wiki/Upgrades (*snippet, medium*) | If stacking is ever wanted, hard-cap at 2 slots and price it |
| D3 | Cobalt Core: every card has Upgrade A and Upgrade B, chosen at a node that also offers heal or remove; an event lets you flip A↔B | cobaltcore.wiki.gg/wiki/Basic_Shot, /wiki/Annoying_Debate | A/B forks at the same node as `+`; authored per card |
| D4 | Griftlands: cards gain XP per play (3–7 uses), then a choice of two upgrade paths. XP-per-play "incentivizes players to draw out fights"; Fatigue (round 6 cutoff) was the fix | Gamepur (Palm) 2020-06-16; Klei dev log 2019-07-18 (Forbes; *snippet, medium*) | Upgrade-by-use needs a per-fight XP cutoff from day one (added to §5.3's row) |
| D5 | Inscryption: the Sacrificial Altar destroys one card and moves its sigil onto another (sigils union, duplicates don't double); the Mycologists fuse two identical cards, summing stats and unioning sigils | Steam discussion 1092790/3419936083033918051; inscryption.fandom.com/wiki/The_Mycologists (*snippet*) | "Sacrifice X onto Y" is the cheapest fusion: one line moves, the source dies |
| D6 | Across the Obelisk: a Blue (cheaper) and a Gold (stronger) upgrade per card, priced in shards by rarity; converting between them costs gold | TheGamer (Buchalter) 2022-09-13 | Rarity-priced upgrades are a currency sink that scales with rank |
| D7 | Slay the Spire Transform: remove a card, add a random non-basic card of the class, "equally likely across rarities"; sourced from events and two relics, never a shop | slaythespire.wiki.gg/wiki/Transform | Transform is an event's price, not a card system |
| D8 | Dawncaster's Ascension I/II/III and Path I→III exist as numbered cards; whether a stage replaces itself on play is UNVERIFIED (JS-rendered card site; wiki blocked) | blightbane.io/card/Ascension_I; `kb:dawncaster` records 0104–0106, 0071–0073 | Chains stay a *candidate*; verify the rule with the app before copying it |
| D9 | Wildfrost charms: attached between fights, "cannot be removed or undone", max 3 per card. Balatro: one Enhancement, one Edition, one Seal per card; a new one replaces the old. Roguebook: 0–2 sockets, gems permanent | wildfrostwiki.com/Charms; balatrowiki.org/w/Card_modifiers; Game Rant (Meffert) 2021-07-03 | Typed slots, one of each, new replaces old, permanent. Still parked for the first pool (§5.3) |
| D10 | Removal price: StS "starts at 75 gold and increases by 25 each time"; Dominion's Chapel is "probably" the strongest card for its cost | slaythespire.wiki.gg/wiki/The_Merchant; Vaccarino via meadowparty.com 2010-12-19 | The shipped linear removal curve (Phase 52a) is the standard brake; keep it |

Not found: any Rosewater statement on deckbuilder upgrades; LocalThunk on
"modify cards rather than add Jokers"; Chrono Ark's conditional evolution.

## 7. Recommendation and open calls

**Recommended: Plan B**, with A0 (the one-page fantasy list) bolted on as
session 0 and C1 (the threat matrix) prepared by agents before B1 as
briefing material. Reason: both previous runs failed by making the whole
library the unit of work; B is the only plan whose first session ends with
T playing new cards, and its keyword extraction rule makes carrier count a
consequence rather than a gate. Confidence: 70.

**Ballot outcome (2026-09-27).** All four calls were put to T through
`AskUserQuestion` and answered "no preference". Per `docs/asking-well.md`
rule 5 the stated defer paths apply and are policy until T reopens them:
(1) all three plans are filed as one attended candidate in
`plan/PHASE_CANDIDATES.md`; nothing starts. (2) §0's identification of the
two prior runs stays as written, marked unconfirmed (confidence 65).
(3) The D8 / D20 grant paths are held for the ratification session of
whichever plan runs. (4) No progression mechanism beyond `+` and die growth
is prototyped in the first pool; §5.3 stays an inventory.

Open calls for T (put as a ballot, `AskUserQuestion`, not re-asked once
answered; answered 2026-09-27 as above):

1. Which plan (or splice).
2. Whether the "last 2 times" are the two runs named in §0 (confidence 65).
3. Whether card upgrades (D8) and die growth (D20) are decided inside the
   first slice or held for the ratification session.
4. Which progression mechanisms beyond `+` and die growth get a prototype in
   the first pool (§5.3 recommends upgrade-by-use and authored fusion
   results; confidence 60).
