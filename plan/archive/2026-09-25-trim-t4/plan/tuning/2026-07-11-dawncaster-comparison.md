# Dawncaster comparison — card library, keyword library, combat mechanics

> Three-lens comparison of Axiomancer (70 cards / 30 keywords /
> Hazard-Pattern Combat) against Dawncaster (1,692 cards / 141 keywords),
> run 2026-07-11 by three parallel card-expert passes. Purpose: find what
> would make our card library better. Read alongside
> `plan/tuning/2026-07-08-win-path-scaling.md` — recommendations here are
> deduped against that plan's landed items (1, 2, 4, 6, 7) and shaped to
> feed its open items (3: persistence-by-stack DoTs; 5: theme pressure
> valve).

## Evidence status — read first

The live KB corpus was unreachable this session (kb-query MCP not mounted
to sub-agents, `kb-sync` git auth rejected, GitHub API 403 via egress
proxy, no sibling checkout). Evidence tiers used, honestly labeled
throughout:

- **Receipted (cached)** — the 2026-07-10 audit evidence harvested while
  `kb/` was live: `plan/tuning/2026-07-10-audit-evidence/cross-prior-art.md`,
  `cross-keywords.md`, `cross-new-mechanics.md` — dozens of Dawncaster
  keyword/card records with quoted rules text, one day old. Plus the one
  src-numbered receipt in the atlas: Bleeding
  (`kb:dawncaster/keywords/bleeding.okf.md`, src-001).
- **Corpus-shape stats (cached)** — 1,692 cards / 141 keywords; functions
  column: Deck Management ~65, Offense ~28, Defense ~15, Energy
  Management ~11, Blood Ritual ~7, Healing ~7, Debuff ~6; median 12
  cards per keyword (mean 19.4), only 6% single-card keywords; Conjure
  on 101 cards.
- **(memory)** — unreceipted genre recall, flagged inline. Nothing
  (memory)-tier may promote to the keyword atlas (atlas law: no receipt,
  no row). A "lookups to redo" list closes the report.

The Axiomancer side is fully live (axio-query MCP + working tree) and
authoritative.

---

## 1. Keyword library — 30 vs 141

### Taxonomy of Dawncaster's keyword space (receipted members quoted)

| Family (~count) | Representatives |
|---|---|
| DoT / afflictions (~9) | Burning (end of turn) · Poison (after playing a card; anti-heal 1/stack) · Bleeding (when dealt damage, then stacks −1; src-001) · Doom (end of turn, **grows +1 per Action the victim plays**) · Brittle (one-shot melee amp) · Infected (ticks on discard; removed by any heal) |
| Private resources / banks (~11) | Souls (persist across combats; 100+ → revive-and-lose-all) · Performance (song progress; 0 with no song) · Chain ("fades if a played card did not increase Chain") · Blood/Corruption (pay in HP; 4+ Corruptions in deck unlocks a state) · Momentum (auto-cashes at 5: remove all, draw) |
| Conditional trigger grammar (~14) | Ambush (first card of round) · Finale (≤2 cards in hand) · Flow / Cascade / Continuity (sequence readers) · Frenzy / Unscathed (damage-ledger readers) · Ancestral (4+ in discard) · Bloodlust (requires enemy Bleeding) |
| Win/kill vectors (~7) | Charmed ("lose if Health < Charmed; taking non-Piercing damage removes equal Charmed") · Deep Wound (5+ sustained = instantly slain) · Reaping (**lowers Maximum Health** equal to damage) · Execute/Slay/Overkill |
| Card frame / deck physics (~9) | Charges (X plays per combat) · Persistent · Memorized (starts atop deck) · Lasting (+1 turn each replay) · Rebound (card counts its own plays; special effect at X) |
| Card generation / deck manipulation (largest, ~40-60 by tag) | Conjure (101 cards — the most-drilled verb in the game) · Foretell family · discard-matters |
| Defense (~15) | Insight (prevent damage that **exactly equals** your Insight) · Evasion · block family |
| Song/cadence (~5) | Perform → Performance → Finale/Crescendo ("Perform 6 and start a new performance") |

### Coverage map

**Covered:** POISON/BLEED ↔ their DoT family (but see gap 1) · SWAY→CAPITULATE ↔
Charmed (verbatim prior art — theirs thresholds below full HP and damage
erases progress) · FALLEN ↔ Corruption · RECOIL ↔ Blood ·
FORETELL ↔ scry family (ours adds the telegraph glimpse — richer) ·
CONJURE ↔ Conjure (registered but **zero library cards** vs their 101) ·
SOUL/REAP ↔ Souls (ours reset per fight; theirs bank across combats) ·
GUARD/BARRIER ↔ block · HEAL/CLEANSE/DRAW parity.

**Deliberately excluded (doctrine, not gaps):** the entire ~28-keyword
Offense family (THE STRIKE IS DEAD), weapon/equipment frame, multi-class
cost hybrids (our cost axis is the die color law), and anything past 30
(the proving gate — 22 of 30 keywords still carry a `?`/`!` mark, so
every lesson below applies **within** the 30 or via ratified swaps, not
as keyword #31).

**Genuine gaps:**

1. **Trigger-clock diversity.** Their seven DoTs each fire on a
   different clock (end of turn / after playing a card / when damaged /
   on discard / grows with victim's tempo). Ours differ only in slope
   (ramp vs decay) on the same clock — plus 6 unregistered DoT clones as
   raw effect ids.
2. **Conditional rider grammar** — almost no hand/turn/ledger-state
   readers on our card faces.
3. **Max-HP attack vector** (Reaping) — nothing shrinks the bar.
4. **Counting kill vectors** (Deep Wound, Execute) — HP is our only kill
   meter outside the three alt-wins.
5. **Self-counting / replay-state cards** (Rebound, Lasting, Charges).
6. **Cross-combat banks** — only floating dice cross the fight boundary.
7. **Cadence-shaping** (Performance/Finale/Crescendo) — every theme's
   de-facto cadence is "tick until dead."

### What their keyword ECONOMY does that ours doesn't

- **Words are drilled, not declared.** Median 12 cards per keyword;
  6% single-card. Ours: median ~2.5, 15 of 32 terms on ≤2 cards, CONJURE
  on zero — we pay a higher vocabulary rate (1 word per 2.2 cards vs
  their 1 per 12) with none of the rehearsal.
- **Card-local text is a legitimate tier.** They leave 406 of 874
  observed terms as unpromoted card text — the registry is reserved for
  what repeats. We invert this: orphan keywords (PERORATION, KINDLE,
  BARRIER on one card each) alongside unregistered prose on 29% of the
  library.
- **A dependency lattice, not a glossary.** Bloodlust requires Bleeding;
  Finale reads hand position; Damnation/Dark End/Corrosive Spirits read
  the Souls total; Doom reads the victim's tempo. Each keyword is a
  sentence structure whose nouns are other keywords. Our analogues
  (FALLEN gates, MARK amplifies, RUPTURE consumes) are real but sparse.
- **Exit ramps are printed in the definition.** Every stack carries its
  own decay/removal clause — Bleeding self-consumes, Brittle
  self-removes, Infected dies to any heal, Chain fades on a non-Chain
  play, Charmed is erased by damage. Counterplay by construction; no
  status is a pure ratchet. Our duration-decay-everywhere model is what
  produced the late-game decay wall. The lesson is not "no decay" — it's
  "each status's exit ramp should be a different verb someone can act
  on."

---

## 2. Card library — 70 vs 1,692

### Structural patterns they use that we don't

| Pattern | Their evidence | Our status |
|---|---|---|
| Token/generated cards | Conjure on 101 cards | **Wired but dead** — CONJURE priced (`conjure: 2`), implemented (`conjure_card`, Thoughtform plumbing), used by 0 of 70 cards. Cheapest adoption on the board. |
| Exhaust/consume (one-use cards) | Consume-class keywords (memory, med-high) | Absent — all 70 recycle forever via the reshuffle law, which is exactly why finishers needed hard caps instead of scarcity |
| Player-chosen X-costs | X/spend-remaining effects (memory, medium) | Only ALL-costs exist (The Overtake, The Reaping) |
| Cards that reference card categories / play order | Combo/Momentum sequencing (memory, med-high) | Absent — and `CardCategory` (fallacy/paradox → ⚖/∞) already exists in the schema, unread by any card |
| Self-counting cards | Rebound (counts own plays), Lasting, Charges | Absent — all growth lives in status stacks, never on the card |
| Upgrade/rank chains on one card | rank pips upgraded between combats (memory, medium) | Absent — our rank ladder is between distinct cards |
| Drawback-as-cost, scalable | 7-keyword Blood Ritual class | Fixed-magnitude RECOIL, akrasia-only |
| Hand retention / modal cards | (memory, low-medium) | Absent |
| Equipment slots | persistent gear outside the deck | Covered differently — enchant/disenchant ARE our persistent slots (2 of every theme's 7) |

### Curve & rarity

- Our unique-count rarity is inverted from genre norm (43% rare) but 20
  of 30 rares are the mandatory enchant/disenchant slots; play-frequency
  in the 15-card preset is sane (53/27/20).
- **The real thinness is role-singletons.** Their depth is each
  archetype role at 3+ price points; our themes have exactly one payoff,
  one engine piece, one persistent. When the single payoff is capped
  (Forge) or enemy-gated (Bulwark), the theme has no second line — the
  atlas telemetry (Foundry mid/late 0%, Bastion mid 14%) is the direct
  cost.
- **The uncommon band is the growth band and it's the thinnest.** Both
  in-theme uncommons already sit in the starter preset — there is
  nothing in-theme to draft toward. If the library grows, grow the
  Thesis/Theorem spell band first, not rares.
- Overlapping point bands (rank buys reliability/scope, not raw rate)
  match genre practice — no change.

### Missing roles in the three broken themes

- **Forge:** generators over-covered (4/7 cards); missing an **uncapped
  or repeatable spender** and an **overflow converter**. A ramp deck with
  one capped spender is a mid-game deck that loses long fights — verbatim
  the Foundry telemetry.
- **Bulwark:** wall over-covered (5/7); missing the **defense→damage
  converter** (the genre's Body Slam role — every block-retaliate
  archetype carries one precisely because pure reflect loses to
  non-attackers), **anti-stall tech**, and a proactive finisher.
- **Charm:** stacking covered at all ranks; missing a
  **threshold-closer** (charm is the only theme with zero HP pressure of
  any kind, so its win bar never moves — half card-fixable via
  MARK+RUPTURE, half the plan-#1 resolve threshold), an **early-rank
  decay protector** (decay-stop is Axiom-only today), and an
  **accelerator** (no SWAY-scales-on-SWAY shape).

### 13 card sketches (existing 30 keywords only; STRIKE-dead-clean)

Buildable on the current verb surface (7): **Foundry Sprite** (forge
Thesis — CONJURE a one-use Cinder; first library CONJURE),
**Slag Runoff** (forge Lemma — pip overflow → Kindling Ember),
**Grit Between Stones** (bulwark Theorem — proactive Nettle Sting + TICK),
**A Sweeter Poison** (charm Theorem — SWAY + Mark×2 + RUPTURE: the
threshold-closer), **The Long Ledger** (harvest Thesis — TICK twice +
1-turn Bleed: compresses the Soul rebuild cycle), **Seedcorn Sacrifice**
(harvest Theorem — REAP 2 → affliction fuel + draw: closes the Soul
flywheel), **Corollary** (peroration Lemma — CONJURE Minor Premise;
Premise velocity for scaled CONCEDE).

Needing new mechanic kinds — propose-only (6): **Ingot of Ruin** (forge
Axiom — spend ALL pips → Mark per 2 pips, uncapped; the Foundry
finisher), **Rampart Reckoning** (bulwark Axiom — consume ALL
Guard/Barrier → Nettle Sting per 4; the Body Slam role),
**The Unmoved Mover** (bulwark Thesis — "enemy didn't damage you last
round" predicate; anti-stall), **Steadfast Regard** (charm Lemma —
one-turn SWAY decay pause), **Crescendo of Affection** (charm Axiom —
SWAY + half-current-SWAY again), **The Open Vein** (akrasia Theorem —
RECOIL X, you choose X → Poison ⌈X/3⌉; the library's first chosen
X-cost).

Full sketch arithmetic lives in the card-library pass transcript;
`/deck-tuning` remains the court.

---

## 3. Combat mechanics — where the system layer shapes card quality

### Systems side-by-side (abridged)

| Axis | Axiomancer | Dawncaster |
|---|---|---|
| Cost | 3 dice/turn, color law, FREE/PAID binary — one lever | Continuous mana 0-6+ and X-costs — power expressed on the card (memory, medium) |
| Hand | Draw fresh each phase, unplayed discarded | Retention default; Fleeting-class exceptions (memory, medium) |
| Statuses | Duration + intensity, always land, enemy never answers | Stack counts, decay coupled to own trigger (Bleeding, src-001); enemy-side purge/ward answers (memory, low) |
| Enemies | 1v1, deterministic telegraph rungs, escalation clock, no reactions (spec 29 unshipped) | Multi-enemy, visible intents, counterplay in enemy kits (memory, medium/low) |
| Bosses | HP monoliths (1,000+) + x1.6 escalation | Set-piece mechanics over raw HP (memory, low) |

### The four atlas pain points, answered at Dawncaster's system level

1. **DoTs decay before eroding 1,000-HP bosses** → their statuses have
   no duration timer at all; decay is coupled to the status's own
   trigger (src-001). Magnitude scales with investment, never expires by
   calendar. This is the shape plan #3 should take — and spec 32's
   2026-07-10 amendment already ratifies trigger-differentiation.
2. **Flat thresholds (8-Premise, rung denial) ignore the stage curve** →
   their thresholds are denominated in enemy-side quantities that scale.
   Plan #1 (landed) is the convergent fix; the remaining steal is
   Charmed's tension clause — **damage erases charm progress** — which
   would make Charm genuinely refuse DoT splash (real deckbuilding
   tension), and the finding that Oratory/Standstill's remaining 100%
   ceiling is now a BACKFIRE/damage tuning item, not thresholds.
3. **Walls can't kill non-attackers** → two-sided there: enemy rosters
   guarantee an aggression cadence, and block is a legal damage operand
   (block-to-damage conversion is the genre's standard wall kill path).
   We have neither an aggression-cadence lint on threat sequences nor
   any keyword that reads GUARD/BARRIER totals.
4. **Flat payoff floors (max(80/200, 0.25 maxHP))** → they balance the
   **input**, not the output: big payoffs are priced by
   opportunity-cost-bearing inputs (mana, X-costs), so no global output
   clamp exists and payoffs scale to any boss. Our caps exist because
   the input side is flat (1 die). The 0.25x maxHP half of our formula
   already concedes the principle; the flat floor is the vestige.

---

## 4. Recommendations — deduped, prioritized, mapped to the standing plan

### Tier A — sharpen the two OPEN win-path-scaling items

**A1. Plan #3 (persistence-by-stack DoTs) should also diversify the
clock, not just remove the timer.** Adopt the receipted model: no
duration field; decay coupled to each status's own trigger; POISON,
BLEED, MARK (and the 6 unregistered DoT clones) each on a distinct
clock. Include one **Doom-shaped** species — intensity grows with enemy
tempo — because late bosses act more, so it scales exactly where
duration-decay dies. Print each status's exit ramp in its definition.
*Owner-call already flagged in the plan; this adds the shape.*

**A2. Plan #5 (boss-tech rares) has concrete shapes now.** Foundry: the
uncapped Mark-scaling ALL-pip spender (Ingot of Ruin). Bastion: the
defense→damage converter (Rampart Reckoning) and/or a Deep-Wound-style
**counting kill vector** (N reflect procs = slain regardless of HP —
boss counterplay is "stop attacking," which is itself a Bulwark win).
Tithe: Souls persisting across combats + milestone readers (their bank
rules), so a boss fight starts funded instead of hitting the
rebuild-cycle wall. Grace: the threshold-closer card plus Charmed's
damage-erases-progress tension clause.

### Tier B — card-library moves, no engine change, /deck-tuning tier

**B1. Exercise CONJURE.** Engine done, priced, zero cards, gate `????`.
Foundry Sprite + Corollary are the two sketches; the corpus's
most-drilled verb (101 cards) is our only ghost keyword.

**B2. Add role redundancy in the uncommon band.** Each broken theme
needs its missing role (converter/second payoff) at Thesis/Theorem —
the band players graduate into, currently the thinnest. Buildable
sketches: Grit Between Stones, A Sweeter Poison, The Long Ledger,
Seedcorn Sacrifice, Slag Runoff.

**B3. Rework FREE lines into rider setup.** Their conditional grammar
(Bloodlust/Ambush/Finale) puts one effect + a condition-amplified rider
on the same card: the weak line IS the setup state the strong line
checks. Our ten `free: tickOne` chips spend the same real estate on an
unrelated generic — which is why DRAW/GUARD/TICK are our three
most-printed words. Convert FREE lines to lay the theme's named state
(Premise, Mark, Soul-seed) that the PAID line reads.

**B4. Keyword-economy hygiene.** Drill under-supported keywords toward a
~4-6 cards/word median as the library grows; demote true one-card
mechanics to card-local text (their 406-term unpromoted tier proves the
registry should be reserved for what repeats); register or retire the 6
DoT-clone effect ids.

### Tier C — engine/system proposals, [owner-call]

**C1. Retire the flat halves of the payoff caps.** Keep %-of-maxHP,
delete max(80/200) floors, and let ALL-spenders scale linearly with
consumed input. Pairs with B2/A2 — input-side pricing is what makes
uncapped finishers honest. *(Extends landed item #2.)*

**C2. Defense as operand + aggression-cadence lint.** One engine read
(current GUARD/BARRIER total as a payoff operand) plus one data lint
(every threat sequence attacks at least every N phases). Unlocks the
Bulwark kill path with minimal surface.

**C3. Chosen X-costs (RECOIL X first).** The library's missing lever
between FREE/PAID and ALL; akrasia's pay-life fantasy is the natural
home (their 7-keyword Blood Ritual class is the precedent).

**C4. Hand retention with a Fleeting-class exception.** Flips the
draw-fresh law — big, but it opens the setup/hold/charge space (their
largest keyword family exists because card flow permits it) and makes
holding an answer for a telegraphed phase possible, deepening our core
read. Weigh against spec 25's reasons for draw-fresh.

**C5. Boss phases + enemy answer layer (spec 29).** Split HP monoliths
into 2-3 phase pools with a mechanic shift; ship telegraphed
Cleanse/Harden with the doctrine guardrail. Sequence strictly AFTER
A1/C1 — an answer layer on today's failing late math would be punitive.
This is the strongest force against dead-or-dominant card tails: the
correct card changes mid-fight.

**C6. Max-HP attack vector.** Reaping-shaped REAP payoff (Souls → max-HP
reduction) — compounds with the escalation clock instead of racing it;
doctrine-clean as an affliction payoff. Candidate for a Harvest
boss-tech rare under A2.

### Sequencing against the standing plan

1. B1/B3 (free, card-data) → 2. A1 = plan #3 with the trigger-clock
shape (owner-call) → 3. C1 (owner-call, extends item #2) → 4. A2 = plan
#5 boss-tech rares using B2 sketches (deck-tuning) → 5. C2/C3 (small
engine) → 6. C5/C4 (large, after the math is honest).

---

## Lookups to redo once kb/ syncs

1. `keywords.csv` functions column → exact per-family counts; src-NNN
   numbers for every cached citation (only Bleeding src-001 confirmed).
2. Mana rules: per-turn gain, carryover, X-cost semantics (grounds C1).
3. Enemy-side ward/purge/resist mechanics (grounds C5, pain point 2).
4. Poisoned/Burning okf records → confirm stack-decay beyond Bleeding.
5. Hand rules: retention default, Fleeting exact text (grounds C4).
6. `cards.json` cost/rarity histograms; block-scaling card names
   (grounds §2 curve claims, C2).
7. Boss/encounter structure + reception docs (grounds C5; the
   player-complaint cell this report could not fill).
8. Dawncaster card names behind every (memory) pattern in §2's table.

File a KB wish for "Dawncaster — combat system rules (mana carryover,
hand retention, enemy counterplay)" once sync auth works.

## Confidence

High on every Axiomancer-side claim (live axio-query + working tree) and
on quoted Dawncaster rules text (receipted cache, 2026-07-10). Medium on
corpus-shape statistics. Low on (memory)-flagged items — leads, not
canon; nothing (memory)-tier promotes to the atlas until re-receipted.
