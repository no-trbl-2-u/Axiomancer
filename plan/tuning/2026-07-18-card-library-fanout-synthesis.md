# Card-library fan-out synthesis + owner rulings (2026-07-18)

> Direction session, filed as residue. Owner asked: consult the
> mechanics-expert, fan out on the new metrics — what can we learn, how do we
> apply it to the library, what moves us toward a "real" deckbuilding-RPG
> library, and how do we make card wording clear without wordiness. Four
> specialist agents ran (mechanics-expert on lessons; card-expert on triage,
> genre gap analysis, and wording); this file distills their reports and
> records the owner's four ballot rulings (asked per `docs/asking-well.md`).
>
> **Stamp:** 2026-07-18 · reads the 345,600-encounter dataset at baseline
> `0f7f0500` (confidence full — `plan/tuning/
> 2026-07-18-card-library-metrics-accumulation.md` + `axiomancer-mechanics/
> docs/reports/preset-metrics/2026-07-18-*`). ANALYSIS + RULINGS ONLY — no
> card/engine change ships here; the only tree changes in this session are
> this file, the `/deck-tuning` reword (ruling R2), and the queue rows.
>
> **Reconciliation note (merge, same day):** Phase D8 (`10ec4fe8` — one
> dice valve per preset, a ten-in/ten-out recipe swap) shipped on `main`
> while this session ran. Every per-card/per-seat claim above is measured
> on the PRE-D8 tree at `0f7f0500` — before acting on a seat list (dead
> 10 membership, borrow seats, drag seating), re-derive it on the post-D8
> tree, and read this file's "post-D8" parked items as UNBLOCKED. The
> D8-filed "Post-D8 flag-on curve repair" candidate overlaps §C/§E of
> this file — promote them together, not separately.

---

## A. Owner rulings (policy — never re-ask)

**R1 — Carrier authoring: yes, but as a TUNING SWAP POOL, not a mid-library.**
Owner (near-verbatim): more cards could muddy the water — the player only
starts with the 15-card presets. **Act 1 = the player cycles through the
preset decks in order to learn the mechanics. Act 2 = the player picks ONE
deck, and THAT is where reward cards unlock.** The presets are the current
top concern. Authoring 10–15 new cards per theme is fine, **but they are
used only to swap in/out during tuning runs to refine the preset decks.**
→ Filed into `/deck-tuning` (swap-pool candidate program bullet) and the
Act-1/Act-2 note below. The gap-analysis "carrier-growth mid-library phase"
is therefore REFRAMED: same authoring discipline (existing 29 keywords only,
commons-weighted, hallmarks toward ≥8 home carriers), different destination
(sandbox swap pool serving preset refinement, not a player-facing library).

**R2 — Dead 10: trims PAUSED; reword `/deck-tuning` to swap cards in/out of
presets for better metrics.** Never-played = reachability artifact (all 10
are reward-pool-only post-5/5/5), not a quality verdict. Done this session:
`.claude/commands/deck-tuning.md` gained a "measurement seats (swap
variants)" free tier + the dead-card target row now points at swap sweeps.

**R3 — Oratory impossible-stage: premiseShed on The Incompleteness**
(recommended option accepted). Author a premise-eating action (shed 3–4) on
its phase 3 — two lesser enemies already carry premiseShed (
`combat.threat-sequences.ts` ~283, ~427) and the boss flavor ("incorporates
your strongest argument") supports it. Optionally raise the unique-tier
concede floor 12 → 14. Do NOT nerf the-closing-word (oratory is UNDER band
late; pricing is honest post-36a). Enemy-content edit — outside
`/deck-tuning`'s card surface; queued as its own small item.

**R4 — Card-text grammar: ADOPT + full copy pass** (recommended option
accepted). Includes the 12 rewrites, authoring the 4 machine-text faces,
6 gloss rewrites, tightening the honesty-guard budget 200 → 130 chars +
em-dash/semicolon lint, and the two riding sub-calls: drop the word
PERORATION from the-closing-word's face (glossary row stays), and reprice
the-overtake's `fuelPerPip` 3.5 → integer via A/B so no face carries a
decimal.

## B. What the data teaches (mechanics-expert, distilled)

1. **One axis explains the headline pathologies: accumulator vs race win
   paths.** Win currencies that accumulate independently of enemy HP
   (CONCEDE tally, CAPITULATE/SWAY) are flip-immune and beat the impossible
   stage; paths that race enemy HP with statuses are flip-wounded and cliff
   at mid. Bastion clinches it: top statusEngagement, barely flip-wounded —
   its statuses convert to capitulate currency, not HP. **The doctrine curve
   (early ~80 / mid ~50 / late 25–35 / imp 0) requires a partially-scaled
   win-path class that does not exist yet** — a bounded internal component
   plus an enemy-coupled component, with alt-win thresholds scaling by
   stage. D8 valves can lift early numbers but cannot produce mid ~50 from a
   fully-scaled path.
2. **THE FLIP taxes landed-status throughput, not fizz.** Land-rate per play
   −10–15 pts flag-ON; status HP throughput −30–40%; the most-wounded decks
   (standstill, augury) have ~0% fizz. D8 should restore status LANDING;
   all future pricing derives on the flag-ON arm.
3. **The dice model may remove decisions:** greedy ≡ blind EXACTLY in all 40
   flag-ON rows (86,400 encounters) — dice-gated turns look near-forced; the
   skill-gap compression is likely agency loss, not variance. Medium
   confidence, artifact-checkable. **Recommended next instrument (the one
   pick): per-turn playable-set-width + forced-turn-rate logging, per arm.**
4. **The mid cliff is a tempo wall:** fights SHORTEN as they harden (early
   4.0 → mid 4.9 → late 4.2 rounds flag-ON) vs 2–3 status setup rounds.
   Survivability/pacing, not bigger DoTs.
5. **Known blind spots for every reader:** the complexity-vs-skill-gap
   finding is the most artifact-prone (scripted policies can't express deep
   decks); foundry/grace 0% statusEngagement is definitional (cite their
   ~100%-capitulate win mix instead); the dead-card list is a coverage fact;
   only both-arm dWR drags (the-overtake, anvil-of-form) are actionable as
   card signals; util/entropy/unpl% columns are saturated for starter
   presets.

## C. Per-card triage (card-expert, distilled — routing in §E)

- **the-overtake** — worst citizen (fizz 20→21%, paid 3%, dWR drag both
  arms). Mechanical failure: priced as an affliction-detonator, seated in
  foundry which lands zero afflictions (hpP 9,616 vs sibling detonator's
  1,020,372). Fix shape: self-fueling `markPer: 1` on the pip-spend, gate
  2→1 pips, `fuelPerPip` 3.5→2 (≈18.85 pts, Axiom band fits) — card-data +
  one tiny scoped engine constant (flag in PR).
- **Fizz league root cause** — PAID lines gated on banks (discard/prior
  spell/souls/afflictions) that fill slower flag-ON (1.83 paid plays/round).
  Genre fix = Dawncaster's "otherwise" floor (condition gates the kicker,
  never the play; kb receipts: night-whispers, ice-lance, fireside-
  blessings). Concrete: second-thoughts + circular-reasoning prepend
  `MILL 1` (self-priming, bands fit); winnowing prepends `BLEED 1`;
  the-gleaners-due REAP cost 2→1 (watch the REAP-erosion rider halving);
  ouroboros gets an `echo_next_spell` otherwise-line (union extension —
  PROPOSE-ONLY, cross-package verify).
- **Enchantment paid-line orphans** (hedgehogs-dilemma, irresistible-grace,
  the-oracles-eye) — RATIONAL orphaning: PAID buys ~1 marginal round at
  current fight lengths. Defer until after D8 moves the clock.
- **dWR drag residue** (self-flagellant, stuck-in-their-head, anvil-of-form,
  mirror-of-guilt, crown-of-thorns) — mostly back-loaded 1-ofs indicting the
  curve, not the cards; re-measure post-D8. One queued hypothesis:
  self-flagellant RECOIL 5→3 (post-D8 A/B only).
- **Identity casualties among the dead 10:** entropy-tax is foundry's ONLY
  status engine (its exile causes foundry's 0%-status doctrine failure AND
  the-overtake's empty detonations); heart-of-the-matter is grace's authored
  SWAY finisher, seat held by fizzly off-theme ouroboros. Under R2, both get
  swap-variant telemetry first; recolor/reseat remains the standing owner
  call. Dominance-watch: captive-audience + practiced-cadence are oratory
  boosters whose exile is currently load-bearing.

## D. Genre gap analysis (card-expert, distilled)

- **Carrier density is the inversion:** Dawncaster ≈ 11.2 cards/keyword
  (median 9, archetype hallmarks 36–79 carriers; below ~8 home carriers a
  keyword is a rider, not an identity); we're at 1.6–2.4 with median
  hallmark 2–3 and 12 orphans in penitent alone. **Authoring rule adopted
  (per R1): mint carriers, not mechanics — candidates compose the existing
  29 keywords only.** MARK (18 carriers) is the one genre-shaped keyword.
- **Rarity pyramid inverted:** us 20C/20U/30R (43% rare) vs genre commons-
  plurality (~35–45%); swap-pool authoring weights commons.
- **No neutral glue:** Dawncaster 37% neutral-cost; our color law is airtight
  by design — glue experiments belong in the swap pool, and any actual
  cross-theme legality change is an owner call.
- **Replace-only progression has one successful precedent** (Arkham LCG:
  fixed deck size, forced replacement) — viable, but funded there by pool
  depth; our version is funded by the swap-pool → recipe-refinement loop.
  A One-Use-style self-exile keyword (67 Dawncaster carriers) is the
  genre's most-shipped thinning shape — proving-gate proposal only.
- Role mix is mostly genre-honest (~70% of a real library is engine/utility;
  THE STRIKE IS DEAD diverges only on the 18% direct-damage slice, by
  design).

## E. Routing

| Item | Lane | Status |
|---|---|---|
| Swap-variant measurement of the dead 10 + candidates | `/deck-tuning` (reworded this session) | ready |
| Swap-pool candidate authoring (10–15/theme, 29 keywords only, commons-weighted) | `/deck-tuning` sandbox sets, per R1 | queue row added |
| the-overtake self-fueling fix; fizz-league self-priming fixes; gleaners REAP cost | `/deck-tuning` sandbox A/B (verify mechanic resolution order first) | ready |
| ouroboros otherwise-line (`replay_last` union extension) | PROPOSE-ONLY → ratification + cross-package verify | queued |
| The Incompleteness premiseShed (+ optional unique floor 12→14) | enemy-content edit, own small item (NOT `/deck-tuning` card surface) | ruled R3, queue row added |
| Card-text grammar + full copy pass + guard tightening 200→130 + 4 unauthored faces + 6 glosses | own copy-pass item; honesty guard + mobile keyword lints are the witnesses | ruled R4, queue row added |
| Enchantment paid-line orphans; dWR drag residue; self-flagellant RECOIL A/B | post-D8 re-measure | parked with dates |
| Choice-width instrument (playable-set width + forced-turn rate per arm) | instrument follow-up, feeds the D8 evaluation and the gamble-agency question | queue row added |
| Foundry/grace identity vs status doctrine | ~~standing `[needs-user-call]`~~ **RESOLVED via /oversight 2026-08-08: doctrine failure, not identity** — restore `entropy-tax` to foundry's seat and `heart-of-the-matter` to grace's, folded into build-plan **Phase 39** (curve repair + theme symmetry). The owner declined the "exempt them and fix the statusEngagement blind spot instead" reading. | closed, routed to Phase 39 |

Full agent reports live in this session's transcript only; every load-bearing
number above also appears in the committed metrics files at `0f7f0500`.
