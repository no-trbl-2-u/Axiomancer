# Gate 1 — making one turn a puzzle (2026-07-10)

> Target properties: P-READ (the read changes your line) and P-TURN (≥2
> live options per turn). Evidence: `2026-07-10-audit-evidence/
> cross-puzzle.md`, plus per-theme FREE-line findings in every theme
> report. Numeric claims re-measure after Gate 0.

## 1. The FREE-line rework — the fulcrum  [RATIFIED 2026-07-10 · L · content]

> **OWNER DECISION (2026-07-10): Option A — constrain the fork — with one
> amendment:** a FREE line whose theme-currency deposit is weak enough may
> ALSO carry a `DRAW 1`-class utility kicker (a bare weak deposit wastes
> the card). Generic draw ALONE remains banned. Lint shape: every FREE
> line must include ≥1 theme-currency verb; a utility kicker is permitted
> only below a power floor (pricing owns the floor). TICK is dead
> everywhere (owner: killed entirely, not just on FREE lines — see the
> keyword doc). Option B is NOT ratified; the GLYPHS pilot may still test
> its grammar in sandbox.

**The signal (owner, 2026-07-09, parked in plan/CRITIQUE.md):** "I really
want Axiomancer to FUNDAMENTALLY do away with these 'do low basic damage
OR a status effect' forks. I think it's bogging the game down."

**The census (corrected by the skeptic pass):** of 70 cards, **10 carry
`free: tickOne`** (a weak chip that silently NO-OPS on an empty board —
the affliction transcript shows two FREE jabs doing literally nothing on
turn 3), **12 carry `free: drawCards 1`** (generic, theme-blind), **12
carry free guard lines** (7 of them on non-bulwark themes). That is ~half
the library spending its FREE line on filler that neither expresses the
theme nor advances its engine. Worst case: `resonance-detonation` — a
one-copy rare finisher — burned 29% of its plays on its FREE tickOne line.

**Doctrine already exists** (VISION.md, set 2026-07-09): *"the FREE line
builds the engine… Test: after a free play, is the player closer to their
deck's win condition?"* The enforcement pass never shipped. What remains
is choosing the SHAPE:

### Option A — constrain the fork (recommended first)
Keep FREE/PAID anatomy (spec 32 §2, owner-ratified). Rewrite every FREE
line to deposit **theme currency**: affliction plants a 1-round MARK seed,
peroration lays a Premise fragment, forge banks a pip, oracle PORTENTs
(peeks 1 + places a marker its PAID lines cash), harvest plants a
short-fuse seed worth ripening (NOT a raw Soul coupon — see the theme
doc), echo advances the loop (mill-to-discard feeds REPRISE), akrasia may
price FREE in blood (RECOIL as cost, sin as currency), charm builds
rapport toward milestones, bulwark lays persistent BARRIER bricks instead
of fading guard chips, control exposes/notches the telegraph.
- Per-theme FREE verbs are itemized in the theme doc (§ per-theme items).
- **The FREE-currency law as a lint:** FREE never deals damage (TICK is
  dead registry-wide per the 2026-07-10 ratification) and never draws
  ALONE — a `DRAW 1`-class kicker is legal only alongside a
  theme-currency deposit weak enough to earn it (owner amendment;
  pricing owns the floor). Enforced like the no-strike data-lint.
  (Arbitration note: two theme proposals that minted new FREE TICK
  lines — echo-p2, akrasia A2 as written — are amended to comply.)
- Cost: ~70 card edits + pricing re-arithmetic; no schema change.

### Option B — replace the fork (bigger swing, pilot first)
Kill the two-line anatomy: one effect per card, **condition-amplified**
(Dawncaster conditional grammar — "X; if <theme condition>, X+"). The
dieless play disappears; the die decides WHETHER you play, the condition
decides HOW BIG. Cleaner card faces, deeper theme texture, but it
contradicts spec 32 §2's ratified anatomy, reworks the pricing law
(FREE ≈ 25-35% of points), and touches every card, the face renderer,
and the tutorial at once.
- **Recommendation:** decide A now, ship A with Gate 2's per-theme work,
  and pilot B's grammar on ONE surface — GLYPHS (Gate 4) are designed as
  charge-pump cards that behave like Option B natively. If glyph-feel
  beats fork-feel in playtest, revisit.

**Blocked on:** nothing — ratified; execute as EA-5.
**Files (Option A):** `src/Cards/cards.library.ts` (all 70),
`src/Cards/cards.pricing.ts`, a new lint test beside the no-strike lint,
KEYWORD_GLOSS, card-face projections.

## 2. Monetize the read — do NOT reveal it  [S · engine, via Gate 4]

The audit measured the hidden-stance read as worth 0pp (greedy = blind
everywhere). Two proposals wanted to fix this by weakening hiding or the
color law (reveal-stance-before-draft; advantage-makes-die-wild). **Both
rejected here**: the first deletes the read the locked dice law defines
the draft around; the second softens the color law the owner locked
(skeptic verdict: REFUTED, "a veto always dominates a modifier" cuts both
ways).

The surviving fix inverts the problem: keep the information hidden, make
ACTING on a read profitable — **THE STAKE** (wager Conviction on the
enemy's hidden stance before the draft; correct call pays out in floating
dice). Full spec in `2026-07-10-out-of-flow-mechanics.md` §1. It is also
the missing Conviction sink (Gate 0 §4). Success metric: the re-baselined
greedy-vs-blind gap moves off zero.

## 3. The telegraph asks a question every turn  [CONFIRMED · L · feature]

Specs 29 (reactive enemies) and 30 (projected lethality) are both
`Draft — handoff` and unimplemented. The audit found the telegraph is
read by NOTHING (policies ignore it; nothing on the board says what the
incoming hit will do to you). Minimum slice, not the whole specs:

- **One reactive verb** shipped engine-wide (spec 29's cleanse or harden):
  the enemy occasionally ANSWERS the player's engine, so "race it or
  answer it?" is a real fork. Couples with per-theme enemy counterplay
  (CAUTERIZE etc., Gate 2 §enemy).
- **The lethality readout** (spec 30): the projected next-phase damage vs
  your VITAE+Guard, on the board. The wall-math UX item from the bulwark
  audit (show what the telegraph will do against your current wall) is
  this readout's first customer.
- **Variable-rung telegraphs** (control audit P1, CONFIRMED): rung count
  = visible magnitude (1-4 rungs instead of flat 2/3). Makes STAGGER a
  sized answer to a sized threat instead of an always-on denial; feeds
  the same readout. L-effort: touches 56 authored threat sequences.

**Files.** `src/Combat/combat.threat.ts`, `combat.threat-sequences.ts`,
`src/Combat/effect-modifiers.ts` (THREAT_RUNGS), specs 29/30 status
updates, mobile intent VM + board readout.

## 4. Turn-anatomy legibility quick wins  [S · ux]

Engine-side projections that exist but never reach a surface, plus lying
copy. These are cheap and compound with everything above:

- Rupture fuel/cap preview on the card face while targeting
  (projectRupture, combat.engine.ts:2009 — already computed).
- Premise track + CONCEDE beat (currently ZERO combat-UI rendering of
  Premises; the deck's whole win condition is invisible).
- BACKFIRE drip attribution (its damage shows up unlabeled), Overtake
  burst preview + 2-pip gate, REAP bank ledger, SWAY-vs-threshold bar.
  (Per-theme UX items are consolidated in the theme doc; listed here
  because they are all one pattern: **show the gauge the theme fills**.)
- Fix capstone copy that lies (the-closing-word prints a rider it fires
  past; getDisruptMeter's willDeny omits a case — see control report P5).

## Order

§2 (STAKE, via Gate 4's shared batch) and §4 can start immediately after
Gate 0 lands. §1 is ratified (2026-07-10) and executes as EA-5. §3 is the
largest item and can proceed in parallel with Gate 2 (same enemy-content
surface).
