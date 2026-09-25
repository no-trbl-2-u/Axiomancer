# Card-library improvement plan — how, exactly

> Step-level decomposition, working-tree corrections (C-1..C-11), and
> the reconciliation against build-plan Phases 26-33 live in
> `2026-07-11-card-library-improvement-plan-detailed.md` — read it
> before executing any workstream here.
>
> The execution plan built from `2026-07-11-dawncaster-comparison.md`
> (three-lens Dawncaster comparison, PR #68) plus an external GPT-Sol
> analysis (verified below — not taken as law). Deduped against
> `2026-07-08-win-path-scaling.md` (items 1/2/4/6/7 landed; items 3/5
> open — this plan absorbs and supersedes their execution). Every
> workstream carries: goal, exact steps + files, evidence gate with a
> kill condition, autonomy tier, size, and dependencies.
>
> Owner: card-expert / `/deck-tuning` for card-data tiers; items marked
> **[owner-call]** need ratification before implementation;
> **[needs-user-call]** items are parked as candidates, not scheduled.

## 0. External-claim verification (GPT-Sol analysis)

Checked against the working tree before anything below relies on it:

| Claim | Verdict |
|---|---|
| `combat.engine.ts` opens with legacy raw-strike framing | **Confirmed** — line 7 ("a raw strike is the weak…"), line 75 comment block |
| `resolveCardDieCost` advantage 0 / disadvantage 2 contradicts the color law | **Confirmed as coexistence** — the RPS 0/1/2 model (spec 26b §4.8, `combat.engine.ts:236`) is live alongside the 2026-07-09 COLOR LAW (line 1139), AND it is exported through the locked public barrel (`src/index.ts:101`), so any cut needs the deprecation dance |
| `combat.signature.ts` retains a strike class + direct-damage constants | **Confirmed** — `sig-conviction-strike`, `STRIKE_DAMAGE_MULT`, kinds `strike`/`mercy` chip HP directly (lines 50-197) |
| "Disarming Plea deals direct HP damage" | **Confirmed but reclassified** — it is a SIGNATURE (`sig-disarming-plea`, kind `mercy`), not a library card. Same for "Conclusion" (`sig-rallying-blow`, kind `conclude` — status-gated payoff, likely doctrinal) |
| `selectMercyChoice(..., 'exploit')` free strike ≥10 or 50% maxHP | **Confirmed** — `combat.engine.ts:2948` (Phase 108; alternate-outcome consequence, probably ratifiable) |
| ~30 bespoke `zoneHas(state, 'card-id')` hooks | **Confirmed** — 31 occurrences in `combat.engine.ts` |
| Status bingo (interchangeable Roll/Defense payloads) | **Confirmed** — live `axio_effects` sweep: ≥7 debuffs carry near-identical `Roll -N` payloads (Achilles' Burden, Braess Binding, Quantum Erasure, Ross-Littlewood Fall, Simpson's Confusion, Grelling's Malediction, Lottery Despair…) |
| "Pin early resolution at 65-75%" (GPT rec 2) | **REJECTED — contradicts a ratified decision.** The corrected target curve (`/oversight` 2026-07-08) is early ~80%, mid ~50%, late 25-35%, impossible 0%. Source-of-truth hierarchy: T's explicit decision wins. All gates below use the ratified bands |
| Preset spread numbers (Standstill 98, Grace 92, Foundry/Tithe/Bastion 0…) | **Directionally right, stale snapshot** — post-item-1/2 telemetry differs (Grace late 0.75, Penitent 0.40). Gates below always re-baseline against a fresh seed-1 matrix, never against quoted numbers |
| Dawncaster card names cited (Ancient Whetstone, Dressed to Kill, Force Expulsion…) | **Unverified** — kb corpus unreachable this session; treat as (memory)-tier leads, re-receipt before any atlas promotion |

GPT-Sol's six "do NOT copy" warnings are adopted wholesale as §3
guardrails — they independently converge with our comparison's
conclusions.

---

## 1. Workstreams

Ordered by dependency, not importance. Tiers: **free** (card
data/tests/docs under standing autonomy) · **/deck-tuning** (sandbox-first
card work through the wiring checklist + matrix) · **[owner-call]**
(engine/spec surface — propose, ratify, then implement).

---

### WS0 — Doctrine hygiene: name the sacraments, cut the strike vocabulary

**Goal.** THE STRIKE IS DEAD becomes checkable, not aspirational. Every
direct-HP path is a named, ratified exception or it is gone.

**Steps.**
1. Inventory every `applyDamage`-reaching path in
   `src/Combat/combat.engine.ts` + `combat.signature.ts` (grep callers;
   there are few). Classify three ways: (a) status-gated payoff —
   doctrinally legal (RUPTURE, REAP, Conclusion's per-stack detonation),
   (b) alternate-outcome consequence (mercy-exploit, Phase 108), (c)
   legacy contradiction.
2. **[owner-call]** Ratify (a)/(b) as named exceptions in spec 32 §12
   with their prerequisite printed ("Conclusion: fires only per status
   stack"; "Exploit: only from the mercy screen at low HP"). Rename
   signature kinds: `strike` → a ratified name or delete
   `sig-conviction-strike`'s direct-HP component; fix the misleading
   engine header (line 7) and the line-75 comment block.
3. Reconcile the two die-cost laws: decide whether `resolveCardDieCost`
   (RPS 0/1/2) is (i) dead → deprecate in the barrel (alias kept, doc
   comment says superseded by the color law; mobile migrates next
   minor), or (ii) live as the read-layer preview → re-document both
   functions so each names the other and the surface it owns. Verify
   mobile + card-editor after (locked-barrel rule).
4. Add the doctrine witness: a hermetic test that plays every library
   card's PAID line against a clean enemy (no prerequisite state) and
   asserts enemy HP is unchanged except via DoT application, reflect
   setup, alt-win progress, or a spec-32-§12-listed named exception.
   Extend to signatures with their prerequisites synthesized.

**Files.** `src/Combat/combat.engine.ts`, `src/Combat/combat.signature.ts`,
`src/index.ts` + `src/Combat/index.ts` (barrel doc), spec 32 §12, new
`src/Cards/e2e/doctrine-strike-dead.engine.test.ts` (or extend the
existing effectiveness lint fixture helper).

**Gate.** The doctrine test passes; grep for `strike` in engine comments
returns only ratified-exception references. **Kill condition:** a
clean-enemy direct-damage action remains reachable from ordinary card
play. **Tier:** free (tests/comments) + [owner-call] (exception
ratification, barrel change). **Size:** S-M. **Deps:** none — do first;
every later gate assumes the doctrine witness exists.

---

### WS1 — Measure first: FREE/PAID line telemetry + dominance lint

**Goal.** Before designing new lines, know which existing lines are dead
or auto-picks. "Both halves are temptations" becomes a measured band.

**Steps.**
1. Add per-card, per-line counters to the playtest matrix event stream:
   FREE-use rate, PAID-use rate, fizzle rate (played with no observable
   delta — reuse the effectiveness-lint delta classifier), per-line
   contribution share, and unplayed-at-phase-end rate.
2. Surface them in the matrix report template (per-deck appendix), and
   add a soft lint: for every common/uncommon in its intended preset,
   neither line >85% of legal uses across the threat-diverse suite,
   no line <15%, unless the card carries an explicit
   `intentionallyAsymmetric` tag with a comment.
3. Run the baseline (seed 1 + two confirm seeds), file the offender
   list — this is WS2/WS4's target list, not a card change itself.

**Files.** `src/Combat/e2e/combat-playtest*` harness +
`combat-playtest.balance-bands.sim.test.ts` (new soft bands behind
`// PLAYTEST-CALIBRATION`), report template in
`.claude/commands/deck-tuning.md` §4, possibly `src/Cards/types.ts` for
the tag field.

**Gate.** Telemetry lands with a green matrix run; offender list filed
to this doc's Status section. **Kill condition:** n/a (measurement).
**Tier:** free. **Size:** M. **Deps:** none; parallel with WS0.

---

### WS2 — Exercise the dead vocabulary: CONJURE + FREE-lines-as-setup

**Goal.** Retire the ghost keyword and make FREE lines lay the state
their PAID lines read (the Bloodlust/Ambush pattern), instead of ten
unrelated `free: tickOne` chips.

**Steps.**
1. Sandbox the two CONJURE cards from the comparison: **Foundry Sprite**
   (forge Thesis — FREE +1 pip / PAID CONJURE a one-use "Cinder"
   Thoughtform) and **Corollary** (peroration Lemma — FREE +1 Premise /
   PAID +1 Premise + CONJURE "Minor Premise"). The `conjure_card`
   plumbing already exists (`combat.engine.ts` ~1695) — this is card
   data + Thoughtform definitions only.
2. From WS1's offender list, convert up to 10 dominated FREE lines into
   theme-state setup: FREE lays a Premise / Mark / Soul-seed / pip that
   the same card's PAID line (or the theme's payoff) checks. One theme
   at a time, 2-3 cards per pass.
3. Full wiring checklist per card (library entry, `// pts:` arithmetic,
   pricing lint, keyword atlas exercise marks, preset recipe untouched),
   A/B through the matrix ≥2 stages / 2 policies.

**Files.** `src/Cards/cards.library.ts`, Thoughtform definitions
(wherever conjured cards live — follow `conjure_card`'s existing type),
`docs/keyword-atlas.md` (CONJURE gate `????` → exercised),
`src/Combat/combat.deck-presets.ts` only if a converted card sits in a
preset.

**Gate.** CONJURE gate row earns its first `+`; converted cards exit the
85/15 dominance bands; preset floors (landed item #4) hold. **Kill
condition:** a converted FREE line's use-rate stays <15% or the card's
win-impact exceeds the 70% anti-spam line. **Tier:** /deck-tuning.
**Size:** M. **Deps:** WS1 (target list).

---

### WS3 — Trigger-clock DoT substrate (absorbs open plan item #3)

**Goal.** DoTs persist by stacks and decay on their own trigger — never
by calendar — with clock diversity as the differentiation axis
(receipted Dawncaster model: Bleeding src-001; Doom-shaped tempo-fed
species for late scaling). Kills the "durationed DoTs decay before
eroding 1,000-HP bosses" wall at the root.

**Steps.**
1. **[owner-call] ratify the semantics** (one session): each DoT-class
   effect gets `decay: 'per-trigger' | 'per-tick' | 'none'` +
   `growth?: 'per-enemy-action' | 'per-turn' | 'none'` replacing its
   duration timer; where a payoff needs a bounded window, bound the
   PAYOFF, not the affliction. Assign clocks: POISON = ramp
   (`growth: per-turn`, `decay: none`), BLEED = front-loaded
   (`decay: per-trigger` — already its shape), MARK = battle-long
   (`decay: none`), plus ONE new Doom-shaped species (grows when the
   enemy acts) introduced as a card-local effect first, not keyword #31.
2. Engine: honor the new fields in the DoT tick path
   (`src/Combat/effects.ts` + world-tick), delete duration expiry for
   flagged effects, keep TICK/RUPTURE fuel math reading remaining
   stacks × expected triggers.
3. Data: sweep `src/Effects/debuffs.library.json` — the ~20 DoT-payload
   debuffs get explicit clock fields; the 6 unregistered DoT clones get
   registered to a clock or retired (WS10 overlaps — do together).
4. Re-price every affliction card's `// pts:` arithmetic (lifetime-based
   pricing changes); re-check pricing lint bands.
5. Evidence: sandbox A/B per card where overrides allow; full matrix
   for the engine semantics. Sequencing note from the standing plan
   holds: item #2's scaled caps landed but erosion late is still 0.08,
   so this item remains real.

**Files.** `src/Effects/types.ts`, `src/Effects/debuffs.library.json`,
`src/Combat/effects.ts` + world-tick path, `src/Cards/cards.pricing.ts`
bands if verb points shift, `// pts:` comments across ~⅓ of
`cards.library.ts`, spec 32 §3 semantics table, `docs/keyword-atlas.md`
POISON/BLEED/MARK rows.

**Gate.** Erosion + Tithe late > 0% (target ≥15%) with early inside the
ratified ~80% band; no single card past the 70% win-impact line. **Kill
condition:** early-band violation that per-card re-pricing can't pull
back — revert the clock assignment, not the substrate. **Tier:**
[owner-call] then card-expert implements. **Size:** M-L. **Deps:** WS0
(doctrine witness catches mispriced payoffs), WS1 (before/after
telemetry).

---

### WS4 — Role redundancy + boss-tech rares (absorbs open plan item #5)

**Goal.** Each broken theme gets its missing ROLE (converter / uncapped
spender / anti-stall tech), staged by telemetry severity, choosing plan
item #5's option (b) — boss-tech rares preserve self-containment;
option (a) utility flex slots only if holes remain.

**Steps.** One theme per pass, in this order (post-item-1/2 telemetry):
1. **Forge** (mid/late 0%): sandbox **Slag Runoff** (Lemma — pip
   overflow → Kindling Ember; buildable today) and **Ingot of Ruin**
   (Axiom — spend ALL pips → Mark ×1 per 2 pips, uncapped, then TICK;
   needs WS7's cap-floor retirement to matter — sequence after or
   behind it).
2. **Bulwark** (mid 14%, no kill path): **Grit Between Stones** (Theorem
   — proactive Nettle Sting + TICK; buildable today), then
   **[owner-call]** the two new mechanic kinds: consume-all-defense
   (**Rampart Reckoning**, Axiom — Guard/Barrier → Nettle Sting per 4
   consumed: the Body Slam role) and the "enemy didn't damage you last
   round" threshold predicate (**The Unmoved Mover**, Thesis —
   anti-stall). Alternative shape if consume-all is refused: a
   Deep-Wound-style counting kill (N reflect procs = slain) — pick ONE.
3. **Charm** (Grace late 0.75 post-item-1 — verify need first):
   **A Sweeter Poison** (Theorem — SWAY + Mark ×2 + RUPTURE
   threshold-closer; buildable today). **[owner-call]** decay-pause
   (**Steadfast Regard**) and SWAY-on-SWAY (**Crescendo of Affection**)
   only if the fresh matrix still shows the late hole.
4. **Harvest** (Tithe late 0): **The Long Ledger** (Thesis — TICK twice
   + 1-turn Bleed: compresses the Soul cycle) and **Seedcorn Sacrifice**
   (Theorem — REAP 2 → affliction fuel + draw: closes the flywheel).
   Both buildable today. The cross-combat Souls bank is deliberately
   NOT here — see §2 deferred.

**Files.** `src/Cards/cards.library.ts` (sandbox → promote),
`src/Cards/types.ts` + `combat.engine.ts` only for the [owner-call]
mechanic kinds, `combat.deck-presets.ts` if a rare swaps into a preset
slot (recipe change = [owner-call] per the standing plan), spec 32 §6-8
notes, atlas gate rows.

**Gate (per theme).** Preset floors from landed item #4: theme ≥ its
floor at every stage on a fresh seed-1 matrix + two confirm seeds; no
100% cell; no card >70% win-impact. **Kill condition (per card):**
GPT-style falsifiable — the new card is either never drafted into the
winning line (dead) or present in >70% of wins (dominant); either kills
that sketch, not the workstream. **Tier:** /deck-tuning; [owner-call]
flags as marked. **Size:** L total, S-M per theme. **Deps:** WS1
(telemetry), WS3 (harvest gates on DoT lifecycle), WS7 (forge's uncapped
spender).

---

### WS5 — Sequencing-grammar microset (prototype)

**Goal.** A shared early/late/hold/after-cost grammar across themes —
composing an argument, not emptying a hand — WITHOUT flipping the
draw-fresh law. Six reward-only cards, at most ONE new shared term.

**Steps.**
1. Verify state availability (all already tracked in
   `CombatEncounterState`): `spellsPlayedThisTurn` (read today by
   resonant-chamber), hand count, RECOIL-paid-this-turn, prior card's
   stance. Whatever isn't tracked, [owner-call] before adding.
2. Author 6 cards across 3 themes, reward-only (NOT in any preset):
   two "early" (fires as first/second card of the phase), two "late"
   (fires with ≤2 cards remaining — Finale-shaped), two "after-cost"
   (fires after RECOIL was paid or enemy damage taken this turn —
   Frenzy-shaped). Express conditions as threshold discounts in the
   existing pricing grammar (`threshold ×0.5`), not as new keywords; if
   exactly one term must be named, name it once and register it as
   card-local text per WS10's policy.
3. The falsifiable test (new, hermetic): enumerate legal play orders
   for a fixed 5-card hand containing 2 microset cards against 3
   authored threat stances; assert ≥2 orders produce materially
   different outcomes AND the best order differs by visible threat.

**Files.** `cards.library.ts` (sandbox), reward-pool wiring (draft
weights surface in `/deck-tuning`), new
`src/Cards/e2e/sequencing-grammar.engine.test.ts`.

**Gate.** The order-enumeration test passes; drafted at reward screens
by ≥2 preset origins in draft sims. **Kill condition:** the same play
order dominates every threat stance — cut the microset, log the finding
(draw-fresh cadence may simply not support sequencing; that's a real
answer). **Tier:** /deck-tuning + [owner-call] only if new state
tracking is needed. **Size:** M. **Deps:** WS1 (line telemetry to judge
use), independent of WS3/WS4.

---

### WS6 — Cross-theme bridge rewards (prototype)

**Goal.** Six reward-only cards, each connecting exactly TWO themes via
the utility-10 vocabulary (Draw/Guard/Barrier/Tick/Mark/Cleanse/Heal/
Rupture/Conjure) — no hallmark imports, no preset edits. Breaks the
ten-sealed-classes failure mode; the Dawncaster precedent is its
conversion cards (Dressed to Kill: Poison→Charmed; Force Expulsion:
Barrier→damage — (memory)-tier, re-receipt when kb syncs).

**Steps.**
1. Author one bridge per pairing, biased toward pairings whose SHARED
   verb already exists: affliction↔charm (Mark counts as affliction AND
   closes SWAY's bar — A Sweeter Poison's logic generalized),
   forge↔bulwark (pips → Guard; overflow protects the engine),
   akrasia↔harvest (RECOIL/self-affliction expiry → Souls),
   oracle↔peroration (FORETELL confirms → Premise), control↔echo
   (STAGGER'd rung → REPRISE fuel), bulwark↔charm (unbroken Guard →
   SWAY — the Unscathed shape).
2. Reward-pool only; tune draft weights so bridges appear for both
   parent origins.
3. Draft-simulation evidence: each bridge picked by ≥2 distinct preset
   origins; neither origin's resolution leaves its ratified band.

**Files.** `cards.library.ts` (sandbox), draft-weight tables,
`/deck-tuning` report.

**Gate/kill (per card).** Kill if the bridge is (a) only ever drafted by
one parent — it's just an 8th in-theme card — or (b) an auto-pick for
every deck. **Tier:** /deck-tuning. **Size:** M. **Deps:** WS1; after
WS4 so bridges don't mask missing in-theme roles.

---

### WS7 — Retire flat cap floors + first chosen X-cost

**Goal.** Payoffs scale with consumed input, not clamped output —
extends landed item #2 to its conclusion, and adds the missing lever
between FREE/PAID and ALL.

**Steps.**
1. **[owner-call]** Delete the flat halves of
   `burstCap = max(80|200, 0.25 × maxHp)` → pure fraction, and let
   ALL-spenders (Overtake, Reaping, Ingot of Ruin) scale linearly with
   consumed stacks/Souls/pips, priced by input opportunity cost.
   Supervised constant sweep exactly as item #2's method: full matrix at
   the candidate formulas, pick by "late lifts without any card passing
   70% win-impact."
2. **[owner-call]** Chosen-X plumbing, one card: **The Open Vein**
   (akrasia Theorem — RECOIL X of your choosing, min 3 → Poison
   ⌈X/3⌉). New mechanic kind `chooseX` bounded to RECOIL first; UI needs
   an amount picker (mobile presenter — coordinate the locked-barrel
   verify trio).

**Files.** `combat.engine.ts` (cap constants, RUPTURE/REAP resolution,
`chooseX`), `cards.pricing.ts`, affected `// pts:` comments,
`src/Cards/types.ts`, mobile combat presenter for the X picker.

**Gate.** Foundry/Tithe late lift off 0 with early in band; the X card's
chosen values actually vary across sim policies (if every policy picks
max-X, the choice is fake — kill the picker, keep ALL). **Tier:**
[owner-call] + supervised sweep. **Size:** S-M (caps) + M (chooseX).
**Deps:** WS3 first (a scaled DoT substrate may shrink the needed cap
change — same sequencing logic as the standing plan's #2→#3 note).

---

### WS8 — Control statuses edit different threat surfaces

**Goal.** Fix status bingo: a control status is valuable for WHICH part
of the enemy's intent it corrupts, not for having a distinct id feeding
the variety meter. The threat engine already exposes separate surfaces:
damage, rider application, stance certainty, rung strength, escalation.

**Steps.**
1. Audit the ≥7 Roll-penalty-clone debuffs (Achilles' Burden, Braess
   Binding, Quantum Erasure, Ross-Littlewood Fall, Simpson's Confusion,
   Grelling's Malediction, Lottery Despair, Preface Exhaustion…) — map
   each to ONE primary surface; merge true duplicates (fold-in
   candidates already flagged in docs).
2. Re-payload three soft controls so each hits a different surface:
   one reduces telegraph DAMAGE, one suppresses RIDER application, one
   blurs/locks STANCE certainty (the read economy), leaving rung
   strength to STAGGER and escalation alone. Hard control (skip-turn)
   stays the reliable category.
3. Keep the variety-gated refresh but make it read SURFACES touched,
   not distinct ids — [owner-call], engine reads.
4. Falsifiable test: against three authored threats with different
   rider/damage profiles, the sim's preferred control differs by
   threat. Kill: the biggest Roll penalty is always picked.

**Files.** `src/Effects/debuffs.library.json`,
`src/Combat/combat.threat-*.ts` surface hooks, engine variety-meter
read, affected cards' `// pts:`, atlas.

**Gate/kill** as step 4. **Tier:** effects data = /deck-tuning; the
variety-meter change = [owner-call]. **Size:** M. **Deps:** WS1;
independent of WS3-WS7.

---

### WS9 — Legible conditional threat branches (prototype)

**Goal.** Deterministic enemies stop being answer keys without becoming
random: ONE authored, visible branch condition per prototype enemy.
"The enemy also noticed me."

**Steps.**
1. Two enemies only: one normal ("if carrying ≥3 afflictions at phase
   start, cleanse 1 and swap stance" — a soft, fractional answer, spec
   29's Cleanse with the doctrine guardrail), one boss ("if its prior
   threat was fully blocked, next action is rider-heavy instead of
   damage-heavy"). Both branches authored in the threat sequence;
   condition + both outcomes SHOWN before the player commits (extends
   the telegraph UI contract).
2. Engine: branch nodes in `combat.threat-sequences.ts`'s type (a
   `branch: { condition, then, else }` step), evaluated
   deterministically from state — no RNG.
3. Evidence: fixed-seed encounter trees reproduce exactly; two scripted
   player lines produce different enemy branches; resolution stays in
   the ratified bands.

**Files.** `src/Combat/combat.threat-sequences.ts` (type + 2 entries),
threat resolution in `combat.engine.ts`, mobile telegraph presenter
(show the fork), spec 29 partial-shipment note.

**Gate/kill.** Kill if the branch is never reached across the matrix, or
selects the same response under all ten presets, or playtesters can't
say why it fired (playtester-agent question in the next
`/combat-playtest`). **Tier:** [owner-call] (engine + spec 29 surface).
**Size:** M. **Deps:** after WS3/WS7 land (an answer layer on failing
late math is punitive — same rule as the comparison's C5).

---

### WS10 — Keyword-economy + effect-registry hygiene

**Goal.** The registry describes what repeats; card text owns what
doesn't. Sets the vocabulary policy the other workstreams follow.

**Steps.**
1. Register-or-retire the 6 unregistered DoT-clone effect ids (with
   WS3's clock sweep).
2. Atlas policy note: one-card mechanics stay card-local prose (the
   Dawncaster 406-term unpromoted tier); a term earns registry entry at
   ~3+ cards; drill target median ~4-6 cards/keyword as the library
   grows; BARRIER/GUARD merge decision goes to the owner as flagged.
3. Un-orphan or fold: PERORATION, KINDLE, BARRIER each live on one card
   — WS4's new cards should deliberately drill under-supported words
   where the theme fits (e.g. Slag Runoff exercises KINDLE's ember).

**Files.** `docs/keyword-atlas.md`, `debuffs.library.json`, spec 32 §3.
**Gate.** Atlas row count still exactly 30; zero unregistered repeated
mechanics. **Tier:** free/docs + data. **Size:** S. **Deps:** WS3.

---

## 2. Deliberately deferred / parked

- **Card evolution (GPT rec 3)** — **[needs-user-call]**, parked as a
  phase candidate, NOT scheduled. Doctrine-shaped growth (a card's
  FREE-line evolution / PAID specialization / cost-consequence fork) is
  genuinely novel and fits rank-as-epistemic-maturity, but it needs a
  card-INSTANCE state schema (collection persistence, editor support,
  `GAME_STATE_VERSION` migration) — a full phase, and worthless until
  WS1-WS4 prove which cards deserve longitudinal identity. Prototype
  spec: 3 cards, mutually exclusive branches, each branch must move a
  decision boundary, neither branch >70% pick across policies.
- **Cross-combat Souls bank** — same reason: touches run-level
  persistence, not combat. Park with the evolution candidate.
- **Hand retention (comparison C4)** — deferred pending WS5's verdict.
  If sequencing proves valuable WITHIN draw-fresh, retention is
  unnecessary; if WS5's kill condition fires, revisit retention as the
  bigger hammer, weighing spec 25 §4.5's original rationale.
- **Mercy aftermath (GPT rec 9)** — right idea, wrong layer: that's
  world/story consequence design, not card library. Route to
  `/story-spec` + `/expand` as a candidate ("one enemy, five outcome
  aftermaths").
- **Boss phase-splitting (comparison C5 full form)** — WS9 is the thin
  wedge; full phase pools only if branch prototypes prove legible.

## 3. Guardrails — what NOT to copy (adopted from both analyses)

1. **No basic-attack ecosystem.** The Offense family stays excluded;
   WS0 makes this a test, not a hope.
2. **No 141-keyword goal.** The 30 cap is a virtue. Add RELATIONSHIPS
   between existing words (WS2/WS5/WS6) before any vocabulary — keyword
   #31 requires the proving gate satisfied (22/30 rows still carry
   `?`/`!`).
3. **No generic +N upgrades.** If evolution ever ships, it changes what
   a card MEANS, costs, or permits — never just its magnitude.
4. **No Reliable-style absolver.** Dead hands are solved by Conviction,
   FREE lines, and narrow guarantees — never one keyword that erases
   every prerequisite (it would erase WS5's entire point).
5. **No zone-glossary import.** Adopt only card-location distinctions
   that serve the fresh-hand cadence (CONJURE's one-use Thoughtforms;
   maybe Memorized-shaped "starts on top" LATER if a card needs it) —
   not Persistent/Heavy/Bury/On-Draw wholesale.
6. **No resource fracture.** Heart/Body/Mind + Conviction + theme banks
   stay the whole economy; no per-class cost vectors.
7. **No random intent replacement.** WS9 branches are authored, visible,
   and deterministic — constrained legible branching, never RNG intents.

## 4. Sequencing

```
WS0 doctrine hygiene ──┐
WS1 telemetry ─────────┼─→ WS2 CONJURE + FREE-setup ─→ WS4 roles/boss-tech (per theme)
                       │                                 ↑          ↘
                       ├─→ WS3 DoT clocks [owner-call] ──┘           WS6 bridges
                       │        ↓                                    ↗
                       │   WS7 caps + chooseX [owner-call] ─→ WS4(forge)
                       ├─→ WS5 sequencing microset (independent)
                       ├─→ WS8 control surfaces (independent)
                       └─(after WS3+WS7)→ WS9 threat branches
WS10 hygiene rides with WS3.
```

Owner-session ratification batch (one sitting covers all [owner-call]
flags): WS0 exception naming + barrel decision · WS3 clock semantics ·
WS4 new mechanic kinds (consume-all-defense OR counting-kill; decay
pause; SWAY-on-SWAY) · WS7 formula + chooseX · WS8 variety-meter read ·
WS9 branch nodes. Log decisions in spec 32 §12.

Loop execution: WS0/WS1/WS10 are `/iterate`-sized free ticks; WS2, WS4
per-theme passes, WS5, WS6, WS8 are `/deck-tuning` sessions; WS3, WS7,
WS9 each need the ratification batch first.

## 5. Standing measurement discipline

Every workstream's gate re-baselines on a FRESH seed-1 matrix + two
confirm seeds against the RATIFIED target curve (early ~80 / mid ~50 /
late 25-35 / impossible 0) and the landed per-preset floors — never
against numbers quoted in this doc, the comparison, or the GPT analysis.
Per-card kill conditions kill the card, not the workstream; a killed
workstream (WS5's grammar, WS9's branches) is a finding worth a
CRITIQUE entry, not a silent drop.

## Status

- [ ] WS0 doctrine hygiene (free legs) — [owner-call] batch pending
- [ ] WS1 FREE/PAID telemetry + baseline offender list
  - 2026-07-11: telemetry counters + soft lint in tree; **PROVISIONAL
    offender list cut pre-Phase-26** (seeds 1/2/3, commit `f196d219`)
    — eight cards, all the same failure mode (FREE line <15% of
    plays ⇔ PAID >85%): `cassandras-burden`, `common-ground`,
    `disarming-smile`, `glimpse`, `half-step`, `refrain`,
    `sketch-of-a-thought`, `slippery-slope`. Full table (per-seed
    use %, stage spread, near-band watch list) in the detailed plan's
    "WS1.5 provisional offender list (pre-Phase-26)" subsection
    (`2026-07-11-card-library-improvement-plan-detailed.md`). Numbers
    are pre-Turn-Law — re-cut after Phase 27 before judging any gate.
- [ ] WS2 CONJURE exercise + FREE-line conversions
- [ ] WS3 trigger-clock DoTs (absorbs win-path item #3) — [owner-call]
- [ ] WS4 roles/boss-tech per theme (absorbs win-path item #5)
- [ ] WS5 sequencing microset prototype
- [ ] WS6 cross-theme bridges
- [ ] WS7 cap floors + chooseX — [owner-call]
- [ ] WS8 control-surface reclassification
- [ ] WS9 threat-branch prototype — [owner-call]
- [ ] WS10 registry hygiene
- [ ] Parked candidates filed to PHASE_CANDIDATES (evolution, Souls
      bank, mercy aftermath) via `/expand`
