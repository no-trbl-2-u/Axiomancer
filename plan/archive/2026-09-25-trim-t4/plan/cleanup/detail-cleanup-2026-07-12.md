# Card-detail cleanup — 2026-07-12

## Purpose

A visual audit of all 70 rendered cards in `devlog/catalog.html`, rebuilt from current `main` with:

```bash
npm run catalog
```

Audit question: **Assuming the reader knows every registered keyword, does the rendered card face state exactly what the card does?**

Result: **34 cards read exactly; 36 cards do not.** No card text was visually truncated or hidden. The failures below concern missing rules information, not layout.

## Cleanup standard

A repaired card face must state every operation needed to resolve it without consulting `cards.library.ts`:

- Trigger and timing.
- Target.
- Numerical magnitude.
- Duration, where applicable.
- Conversion ratio and rounding, where applicable.
- The complete payload of every rider.
- Registered, current vocabulary rather than retired or private engine terms.

Generic text such as `rider`, `fires a rider`, `lands harder`, or a parameterized keyword without its parameters does not pass.

---

## Cards with hidden rider payloads

### 1. Ad Nauseam

**Rendered problem:** `Die bonus: powering die mind fires a rider`.

**Why it is unknowable:** The face identifies the die condition but never states the rider's effect.

**Missing information:** State the complete Mind-die rider payload, including magnitude and target. The source payload must be rendered directly rather than represented by the word `rider`.

### 2. Against My Judgment

**Rendered problem:** A standalone `rider` follows the self-MARK lines.

**Why it is unknowable:** No trigger or payload is attached to the word.

**Missing information:** State what triggers this rider and exactly what it grants, removes, applies, or modifies, including target and magnitude.

### 3. Bootstrap Loop

**Rendered problem:** `Threshold: 2× mind die fires a rider`.

**Why it is unknowable:** The threshold is visible, but its reward is hidden.

**Missing information:** Print that satisfying the 2× Mind threshold adds the actual number of PIPs, and identify which die or dice receive them.

### 4. Common Ground

**Rendered problem:** `Threshold: 3× heart die fires a rider`.

**Why it is unknowable:** The face never states what the Heart threshold does.

**Missing information:** Print the complete threshold payload, including the modified effect, magnitude, target, and duration if it changes RAPPORT.

### 5. Delphic Ambiguity

**Rendered problem:** `Die bonus: powering die mind fires a rider`.

**Why it is unknowable:** The rider is not described.

**Missing information:** Print the complete Mind-die bonus—apparently an additional FORETELL operation—using its exact value and timing.

### 6. Disarming Smile

**Rendered problem:** A standalone `rider` follows `SWAY 1` and RAPPORT application.

**Why it is unknowable:** The player cannot identify the rider's trigger or effect.

**Missing information:** Print the full rider operation, its trigger, target, magnitude, and duration.

### 7. Exordium

**Rendered problem:** A standalone `rider` appears after the PREMISE and POISON lines.

**Why it is unknowable:** The catalog hides the source rider payload.

**Missing information:** State explicitly that the rider draws the actual number of cards, and state when it fires.

### 8. Heart of the Matter

**Rendered problem:** The face contains both a standalone `rider` and `Threshold: 5× heart die fires a rider`.

**Why it is unknowable:** Neither rider payload is printed, and it is impossible to tell whether these are the same effect or two separate effects.

**Missing information:** Print each rider separately with its own trigger and payload. Clarify what the standalone `ECHO` repeats and whether it repeats the base SWAY, threshold rider, or whole paid line.

### 9. Mounting Case

**Rendered problem:** `Threshold: 2× heart die fires a rider`.

**Why it is unknowable:** The threshold reward is hidden.

**Missing information:** Print the exact PREMISE gain or other payload granted by the Heart threshold.

### 10. Ouroboros

**Rendered problem:** `replay your last spell ×2` is followed by a standalone `rider`.

**Why it is unknowable:** The replay instruction is readable, but the separate rider has no trigger or payload.

**Missing information:** Print the rider's complete effect. Also state whether `×2` means two total resolutions or two additional resolutions beyond the original cast.

### 11. Paralysis of Analysis

**Rendered problem:** `Die bonus: powering die mind fires a rider`.

**Why it is unknowable:** The face omits the rider payload.

**Missing information:** Print all effects of the Mind-die bonus—both additional STAGGER and any BACKFIRE intensity increase—with exact values.

### 12. Red Herring

**Rendered problem:** `Die bonus: powering die mind fires a rider`.

**Why it is unknowable:** The player cannot determine what changes when a Mind die powers the card.

**Missing information:** Print the exact duration increase or other payload and identify the affected status.

### 13. Second Thoughts

**Rendered problem:** A standalone `rider` follows `RECALL 1`.

**Why it is unknowable:** The trigger and payload are absent.

**Missing information:** Print the rider's complete effect and whether it applies to the recalled card, the current card, or another target.

### 14. Sketch of a Thought

**Rendered problem:** `Die bonus: powering die mind fires a rider`.

**Why it is unknowable:** The bonus effect is hidden.

**Missing information:** State exactly which effect gains intensity and by how much when powered by a Mind die.

### 15. Soft Word

**Rendered problem:** `Die bonus: powering die heart fires a rider`.

**Why it is unknowable:** The Heart-die rider is not printed.

**Missing information:** State the exact bonus, including whether it increases RAPPORT intensity, SWAY, duration, or another value.

### 16. Straw Man's Jab

**Rendered problem:** `Die bonus: powering die body fires a rider`.

**Why it is unknowable:** The Body-die condition is stated but its result is absent.

**Missing information:** Print the exact intensity or duration change and identify the affected BLEED or MARK application.

### 17. The Olive Branch

**Rendered problem:** A standalone `rider` follows RAPPORT and `SWAY 3`.

**Why it is unknowable:** The rider's trigger and payload are absent.

**Missing information:** Print the complete rider operation, including target, magnitude, and duration.

### 18. Tu Quoque

**Rendered problem:** `Die bonus: powering die heart fires a rider`.

**Why it is unknowable:** The player cannot determine how the Heart die changes the card.

**Missing information:** Print the exact bonus and identify whether it modifies THORNS intensity, duration, GUARD, or another effect.

### 19. Undistributed Middle

**Rendered problem:** `Threshold: 3× mind die fires a rider`.

**Why it is unknowable:** The threshold reward is hidden.

**Missing information:** Print both parts of the source threshold payload: the additional STAGGER and the BACKFIRE intensity increase, with exact values.

---

## Cards missing effect parameters

### 20. Captive Audience

**Rendered problem:** `While you hold 4+ PREMISEs, the enemy stays MARKed.`

**Why it is unknowable:** MARK is parameterized, but the face gives no intensity. `Stays` also does not establish whether MARK is continuously reapplied, prevented from expiring, or refreshed to a duration.

**Missing information:** State MARK intensity, effective duration, application/refresh timing, and what happens when PREMISE falls below four.

### 21. Entropy Tax

**Rendered problem:** `Every KINDLEd or FORGEd die you spend MARKs the enemy.`

**Why it is unknowable:** The MARK intensity and duration are absent.

**Missing information:** State the MARK intensity and duration applied per spent die, whether multiple qualifying dice stack, and whether one spend can trigger more than once.

### 22. Fated Course

**Rendered problem:** `Every OMEN that hits MARKs the foe.`

**Why it is unknowable:** No MARK intensity or duration is printed.

**Missing information:** State the MARK intensity and duration per successful OMEN and whether simultaneous OMEN hits stack independently.

### 23. Hedgehog's Dilemma

**Rendered problem:** `Every THORNS reflection also marks the enemy.`

**Why it is unknowable:** MARK intensity and duration are absent.

**Missing information:** State the MARK intensity and duration per reflection and whether multi-hit or multi-intensity THORNS produces one application or several.

### 24. Slippery Slope

**Rendered problem:** `Applies Poison ×1 → enemy` has no duration.

**Why it is unknowable:** POISON requires both intensity and duration to determine its total behavior.

**Missing information:** Print the POISON duration and confirm its card-play clock remains the normal POISON clock.

### 25. Sweet Poison

**Rendered problem:** `Applies Poison ×1 → enemy` has no duration.

**Why it is unknowable:** POISON requires duration as well as intensity.

**Missing information:** Print the enemy POISON duration and confirm whether the card's self-BLEED has any interaction with it beyond satisfying FALLEN.

---

## Cards using qualitative language instead of rules

### 26. Irresistible Grace

**Rendered problem:** `Your SWAY stops decaying, and each new gesture of it lands harder.`

**Why it is unknowable:** `Lands harder` gives no numerical modifier or stacking rule.

**Missing information:** State the exact bonus applied to each new SWAY application, whether the bonus is flat or cumulative, whether it affects existing SWAY, and when the escalation resets.

### 27. The Oracle's Eye

**Rendered problem:** `The next enemy stance is always revealed (FORETELL), and your OMENs hit harder.`

**Why it is unknowable:** The reveal clause is clear; `hit harder` is not quantified.

**Missing information:** State exactly what an OMEN gains—damage, status intensity, RUPTURE fuel, or another payload—and by how much. State whether the bonus applies to every OMEN or only the next one.

---

## Cards with underspecified conversion or mirroring

### 28. Bone Orchard

**Rendered problem:** `Drain 1 VITAE from the enemy for every SOUL you gain.`

**Why it is unknowable:** `Drain` is not a registered keyword and does not establish whether the player heals, whether this is damage, or whether it bypasses mitigation.

**Missing information:** Define Drain on the face: enemy VITAE loss, player VITAE restoration if any, damage type, mitigation behavior, and whether gaining multiple Souls in one event triggers once per Soul.

### 29. Mirror of Guilt

**Rendered problem:** `Every self-debuff you take toward FALLEN also lands one stack on the enemy.`

**Why it is unknowable:** `One stack` does not identify which debuff is copied, what duration it receives, or what happens when the self-debuff is not valid on an enemy.

**Missing information:** State whether the same debuff type is mirrored, its enemy-side intensity and duration, supported/unsupported effect behavior, and whether multiple stacks from one application mirror independently.

### 30. Mirror of Longing

**Rendered problem:** `Damage your defenses prevent is converted into SWAY.`

**Why it is unknowable:** The conversion ratio and rounding rule are absent, and `defenses` is broader than a defined trigger.

**Missing information:** State the prevented-damage-to-SWAY ratio, rounding rule, minimum/maximum application, which prevention sources qualify, and whether one multi-hit attack converts per hit or after total prevention.

---

## Cards using incomplete, private, or retired vocabulary

### 31. Arrow Paradox

**Rendered problem:** `lock the enemy stance`.

**Why it is unknowable:** `Lock` is neither a registered keyword nor a complete instruction. The face does not state what cannot change or for how long.

**Missing information:** Define the locked object, duration, whether the current or next stance is locked, which enemy operations are prevented, and how lock interacts with reveal, reroll, replacement, or STAGGER.

### 32. Peroratio Interrupta

**Rendered problem:** Bare `RUPTURE` without `N` or `ALL`.

**Why it is unknowable:** The registered operation requires a consumption limit.

**Missing information:** Print `RUPTURE N` or `RUPTURE ALL`, including any special target restriction or payoff difference.

### 33. Prophecy Fulfilled

**Rendered problem:** `RUPTURE (+3 fuel per omen hit)`.

**Why it is unknowable:** The RUPTURE consumption limit is absent, and `omen hit` does not establish the counting window.

**Missing information:** State `RUPTURE N` or `ALL`; define which OMEN hits are counted, over what period, whether the count resets after play, and whether `+3 fuel` is added per consumed affliction, per RUPTURE payoff, or to a shared total.

### 34. Stuck in Their Head

**Rendered problem:** `Every ECHO or REPRISE drips 2 damage to the enemy.`

**Why it is unknowable:** `REPRISE` was renamed to `RECALL` and is no longer current registry vocabulary. `Drips` also leaves damage type and trigger granularity implicit.

**Missing information:** Replace REPRISE with RECALL if that is the intended trigger. State whether damage occurs per recalled card, per RECALL operation, or per replayed FREE line, and identify its damage/mitigation behavior.

### 35. The Closing Word

**Rendered problem:** `PERORATION at 6 (CONCEDE at 8)`.

**Why it is unknowable:** PERORATION was demoted from the registry and its payload is not printed. CONCEDE also depends on unprinted alternate-win behavior.

**Missing information:** Print the complete six-PREMISE payoff: what is consumed, MARK interaction, cards drawn, Conviction gained, damage if any, and whether PREMISE resets. Print the exact eight-PREMISE CONCEDE outcome and its timing. Do not require a retired keyword definition to resolve the card.

---

## Card with timing language that conflicts with keyword clocks

### 36. Suppurating Curse

**Rendered problem:** `Doubles the total POISON and BLEED damage the enemy takes each round.`

**Why it is unknowable:** POISON ticks on the card-play clock and BLEED ticks on the damage-instance clock. `Each round` could mean doubling every tick, recording damage and applying a round-end duplicate, or aggregating both clocks into a separate payout.

**Missing information:** State the exact trigger and calculation: whether each POISON/BLEED tick is doubled immediately, whether a round-end duplicate occurs, how MARK modifies the doubled amount, whether rounding happens before or after doubling, and whether the modifier stacks with another copy.

---

## Repair order

1. Replace generic rider rendering with complete source payloads for all 19 affected cards.
2. Require intensity/duration output for every parameterized status application.
3. Replace qualitative phrases with explicit values and stacking/reset rules.
4. Replace retired/private vocabulary with current registered terms or fully printed card-local glosses.
5. Define conversion ratios, target legality, clocks, and rounding.
6. Rebuild `npm run catalog` and repeat the same 70-card visual audit.

## Acceptance gate

The cleanup is complete only when:

- Every card can be resolved from its rendered face plus the registered keyword atlas.
- No rendered rule line contains an unexplained standalone `rider` or `fires a rider`.
- Every parameterized status has its required values.
- No rule depends on retired vocabulary such as REPRISE or unglossed PERORATION.
- Qualitative modifiers have exact numerical semantics.
- `npm run catalog` succeeds.
- A fresh visual inspection of all 70 cards produces zero “I cannot know exactly what this does” findings.
