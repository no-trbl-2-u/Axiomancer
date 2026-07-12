# Card-detail cleanup — follow-up plan (2026-07-12)

> **RESOLVED 2026-07-12** (owner directive: "fix everything you find"). All 13
> Bucket A fixes landed as planned. Bucket B rulings applied: #14 **(P)**
> (the ramp-to-10 is printed), #15 **(P)**, #16 **(E)** — the enemy-inflicted
> mirror hook was removed and the self-debuff mirror gated to afflictions
> valid on an enemy (DoT / MARK), with a hermetic engine test — #17 **(P)**,
> #18 **(P)** + REPRISE→RECALL. Two per-card corrections to this plan's own
> rows, found while re-verifying engine truth:
>
> - **#18's suggested wording was wrong.** The drip is
>   `clamp(markStacks, 2, 16)` — damage *equals* mark stacks (floor 2), not
>   "2 + 1 per stack". The face prints the clamp. It also fires on
>   `replay_last` (Ouroboros), which the row's trigger list had right but the
>   old face didn't.
> - **#16 undersold the card.** Mirror-of-guilt has a THIRD hook neither
>   audit caught: 1 mirrored stack per 3 RECOIL HP paid in a play
>   (`MIRROR_RECOIL_HP_PER_STACK`). Kept (it's the Penitent identity), now
>   printed on the face.
>
> Fresh-audit extras fixed in the same pass (outside the 18):
> `crumbling-resolve`'s face omitted its unconditional Wall Upkeep drip
> (max(4, 20% of standing Guard) per phase — printed now); the frame legend
> lacked the `(K/hit)` / `(K/payoff)` DoT glosses and the
> `RIPOSTE N (parry K)` notation (added); the legend's fate row glossed the
> X die as "(wild)" when the engine treats X as a dead, normally
> unspendable face (corrected).
>
> **Round 2 (same day, owner directive: popups + word budget).** Two more
> stale faces found and fixed: `crown-of-thorns` prints its depth scaling
> (+1 per affliction beyond the first, max +4 — the face claimed flat +1)
> and `venom-and-vein` prints its +1 duration (the 2026-07-08 Erosion
> rebalance added it engine-side only). Popup coverage: the inspect panel
> now chips EVERY keyword a card prints (whole printed surface swept —
> statuses, mechanic kinds, uppercase registry words), PERORATION and
> CONCEDE joined the system glossary, and a new face-honesty guard fails
> any card printing a term with no popup (pre-wiring it flagged ~30 cards).
> All faces then re-shaved to minimum wording that still resolves.

## Where this comes from

The original audit (`detail-cleanup-2026-07-12.md`) found 36 cards whose
rendered face didn't state what the card does. The catalog exporter was then
rebuilt to reuse the game's own renderer (`toCombatCard`) and a
[`card-frame-legend.md`](../../axiomancer-mechanics/docs/card-frame-legend.md)
was added for the shared frame (PR #76). Re-auditing under **face + keyword
atlas + frame legend** dropped failures to **18/70** — and those 18 are all
genuine card-authoring debt, not rendering artifacts.

This plan closes the 18. An engine-truth pass (reading `combat.engine.ts`,
`effects.ts`, `Effects/index.ts`) established the key fact:

> **The engine is unambiguous for all 18.** `persistentEffect` strings are
> display-only (`combat.cards.ts:336`); every passive resolves through an
> explicit `zoneHas(state, <id>)` hook. So no card needs a *new* design — each
> value (intensity, duration, ratio, trigger granularity, damage type) is
> already determined in code and can simply be printed.

That splits the work cleanly:

- **Bucket A — surface the value (13 cards).** The face is merely incomplete;
  the engine value doesn't contradict it. Print it. No decision required.
- **Bucket B — face-vs-engine mismatch (5 cards).** The printed text is *wrong
  or stale*, not just missing. Here "print what the engine does" and "make the
  engine match the printed intent" diverge — that is an **owner ruling**, not
  something the engine can answer.

Shared engine facts (feed every row): **MARK** = `debuff_mark`, base duration 2,
`stacking:"intensity"`, `tickAmplifyFlat:1` (+1 flat per stack to each DoT tick
the enemy takes), cap `MAX_EFFECT_INTENSITY = 10`; re-applying a stack resets
duration to 2 (not additive). Enemy bar is HP-only (no armor). `zoneHas` is
boolean membership, so **a second copy of any enchantment does nothing extra.**

---

## Bucket A — surface the value (no decision)

Fix location legend: **[mech]** = `mechanicText()` in `combat.cards.ts` (flows to
both game + catalog); **[str]** = authored `persistentEffect` string in
`cards.library.ts`; **[def]** = card's `specialMechanics` rider already in the def.

| # | Card | Current face | Engine truth (file:line) | Fix |
|---|------|--------------|--------------------------|-----|
| 1 | Peroratio Interrupta | `RUPTURE` | bare `rupture` = `consumeAfflictions(enemy)` → **consume ALL** (`combat.engine.ts:1838`) | **[mech]** print `RUPTURE ALL` |
| 2 | Prophecy Fulfilled | `RUPTURE (+3 fuel per omen hit)` | consume ALL, same resolver | **[mech]** `RUPTURE ALL (+3 fuel per omen hit)` |
| 3 | Resonance Detonation | `RUPTURE` | consume ALL | **[mech]** `RUPTURE ALL` |
| 4 | Self-Flagellant | `RUPTURE` | consume ALL | **[mech]** `RUPTURE ALL` |
| 5 | The Overtake | `RUPTURE (+3.5 fuel per pip)` | consume ALL, **but no-ops below 2 spent pips** (`combat.engine.ts:1838` gate) | **[mech]** `RUPTURE ALL (+3.5 fuel per pip; needs 2+ pips)` |
| 6 | The Closing Word | `PERORATION at 6 (CONCEDE at 8)` | `peroration.rider = {ruptureMarks:3, drawCards:2, conviction:2}` — dropped by print (`cards.library.ts` def) | **[mech]** append `riderText(rider)` → "consume all marks — 3 per stack · draw 2 · +2 Conviction". *Note:* `CONCEDE at 8` is raised to `CONCEDE_PREMISES_ELITE/_BOSS` vs elite/boss (`combat.engine.ts:1011`) — consider "8+ (more vs elites)". |
| 7 | Arrow Paradox | `lock the enemy stance` | `stanceLockedNext=true` → the enemy's **next** telegraph keeps its stance (`combat.engine.ts:1776,3138`) | **[mech]** `lock the enemy's next stance` |
| 8 | Fated Course | `Every OMEN that hits MARKs the foe.` | each omen hit → MARK **i1 d2**; also forces telegraph to omened stance (`3234`) | **[str]** add `(mark i1)` |
| 9 | Hedgehog's Dilemma | `Every THORNS reflection also marks the enemy.` | each reflect → MARK **i1 d2** (`2886`) | **[str]** add `(mark i1)` |
| 10 | Irresistible Grace | `…each new gesture of it lands harder.` | SWAY stops decaying; `grace_momentum` +1/turn (cap 9), each SWAY gain ×`(1 + 0.12·stacks)` rounded → up to **+108%**, compounding (`3264,964`) | **[str]** `each new SWAY gain +12% per turn held (compounding)` |
| 11 | The Oracle's Eye | `…your OMENs hit harder.` | every hitting omen's numeric rider fields ×**1.5 (round up)** while attached (`3209`) | **[str]** `OMEN rider payoffs ×1.5` |
| 12 | Mirror of Longing | `Damage your defenses prevent is converted into SWAY.` | prevented (riposte-parry + guard + barrier) → SWAY **1:1** per phase, then grace mult (`2920`) | **[str]** `1 SWAY per damage prevented (guard/riposte)` |
| 13 | Suppurating Curse | `Doubles the total POISON and BLEED damage… each round.` | at **round end**, one lump = the round's real DoT throughput (poison+bleed, mark bonus included), `applyDamage` so no re-cascade; once/round (`3054`) | **[str]** `at round end, repeat the round's total POISON+BLEED damage` |

---

## Bucket B — face-vs-engine mismatch (needs your ruling)

For each: the face is not merely incomplete, it says something the engine does
not do. Two ways to resolve — **(P) print the engine truth** or **(E) change the
engine to match the printed intent**. My recommendation per card is noted;
none should be implemented until you rule.

| # | Card | Face says | Engine actually does (file:line) | Recommendation |
|---|------|-----------|----------------------------------|----------------|
| 14 | Captive Audience | "the enemy **stays** MARKed" (reads as a hold) | while `premises≥4`, **+1 mark stack and reset dur 2 every turn** → ramps to cap 10 (`3287`) | **(P)** if the ramp is intended — print "adds a mark each turn (to 10)". Ramp-to-10 is a strong effect; confirm it's intended vs a hold. |
| 15 | Entropy Tax | "**Every** KINDLEd or FORGEd die you spend" | fires **once per play**, keyed to the single powering die — one play that eats several manufactured dice triggers once (`2495`) | **(P)** fix the face: "once per play, when a manufactured die powers a card". Engine behavior is the sensible one. |
| 16 | Mirror of Guilt | "every self-debuff **toward FALLEN**" | mirrors **any** self-debuff **and** any enemy-inflicted debuff to the enemy, **with no target-validity check** (`2231,2832`) | **Genuine "is the engine a bug?" case.** Mirroring enemy-inflicted debuffs and effects with no enemy-side meaning smells unintended. Lean **(E)**: gate the hook to player self-debuffs valid on an enemy, then the face is honest. Your call. |
| 17 | Bone Orchard | "**Drain** 1 VITAE from the enemy" (implies leech) | pure enemy HP loss, 1 per Soul; **player does not heal** (`938`) | **(P)** reword to drop the leech implication: "deal 1 to the enemy per Soul gained". |
| 18 | Stuck in Their Head | "drips **2** damage"; keyword **REPRISE** | drip = `clamp(markStacks, 2, 16)` — 2 is only the floor; once per ECHO / RECALL-op / replay (`1719`). REPRISE is the **retired** name for RECALL (`keyword-atlas.md:100`) | REPRISE→RECALL is not a decision (do it). The **2-vs-2..16** is: **(P)** print "2, +1 per mark stack (max 16)" if the mark-scaling is intended, else **(E)** flatten to 2. Scaling fits the Echo+Mark theme; lean **(P)**. |

---

## Implementation sequence

1. **Bucket A, [mech] fixes (1–7):** edit `mechanicText()` — `rupture` → `RUPTURE ALL`
   (+ Overtake pip gate), `peroration` → append `riderText(m.rider)`, `lock_stance`
   → "next stance". One file, propagates to game + catalog. Add/extend the
   `card-face-honesty.guard.test.ts` expectations.
2. **Bucket A, [str] fixes (8–13):** edit the `persistentEffect` strings in
   `cards.library.ts` to carry the engine value, keeping them terse (frame
   legend still carries structure).
3. **Bucket B (14–18):** hold for owner ruling. Then apply (P) as a text/string
   edit or (E) as an engine change — (E) items (#16, maybe #18) additionally need
   a hermetic engine test and a `mechanics-expert` balance check.
4. `npm run catalog` to regenerate; `npm run verify --workspace axiomancer-mechanics`.
5. Re-run the resolvability audit over all 70.

## Acceptance gate

- Every Bucket A card resolves from face + keyword atlas + frame legend.
- Every Bucket B card either resolves (ruling applied) or is explicitly logged
  as an accepted owner decision.
- No new `check-lexicon` / face-honesty-guard failures; `npm run verify` green.
- A fresh 70-card audit returns **zero** "I cannot know exactly what this does"
  findings that aren't a logged design decision.

## Word-budget note (standing constraint)

Keep card faces and keyword definitions terse; push shared structure into the
frame legend. Prefer compact renderings (`RUPTURE ALL`, `mark i1`, `×1.5`) over
sentences. No keyword-atlas row should grow to fix a card.
