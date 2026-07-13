# Gate 2 — ten themes that earn their names (2026-07-10)

> Target properties: P-IDENT (name the theme from three turns of play) and
> P-ARC (a felt setup→spike ≥2 turns). Evidence: ten theme reports in
> `2026-07-10-audit-evidence/theme-*.md` (each with transcripts + per-card
> usage) and `.../cross-prior-art.md` (differentiation matrix, KB
> receipts). Win-rate numbers below are farm-inflated (Gate 0) — the
> texture findings are what this doc acts on. Verdicts in [brackets] are
> the adversarial skeptic's; REFUTED proposals are omitted (see evidence
> files for the kill list).

## 0. The verdict table

Scores calibrated "5 = competent but forgettable." Identity = what the
auditor saw in play, not the flavor text.

| theme (preset) | dist | eng | as played | nearest neighbor |
|---|---|---|---|---|
| affliction (erosion) | 4 | 3 | plant 2 DoTs, detonate at cap by t2, spectate | harvest |
| peroration (oratory) | 6 | 4 | erosion-lite while an invisible counter wins by paperwork | affliction |
| forge (foundry) | 4 | 3 | Conviction battery; signatures do 85-95% of damage | harvest |
| akrasia (penitent) | 3 | 4 | affliction with a cosmetic 5-6 HP surcharge | affliction |
| control (standstill) | 4 | 3 | affliction with an unusual tick condition (auto-deny) | affliction |
| oracle (augury) | 3 | 4 | affliction-lite + a prophecy minigame on rails | affliction |
| harvest (tithe) | 3 | 3 | affliction with a coin jar that never pays out | affliction |
| charm (grace) | 4 | 3 | hold a SWAY number while ambient poison lowers the bar to it | affliction |
| bulwark (bastion) | 3 | 2 | a poison deck in a shield costume | affliction (degraded) |
| echo (refrain) | 4 | 3 | pre-doubled affliction loop, not a repetition fantasy | affliction |

**Eight of ten name affliction as their played neighbor.** Only charm has
a functioning unique axis (SWAY→CAPITULATE — and its threshold math breaks
at late). The KB differentiation matrix scores themes on five axes (unique
resource rules / trigger grammar / win vector / deck physics / payoff
cadence); most Axiomancer themes hold at most one, weakly.

**The pattern behind every fix below:** give each theme (a) one axis no
other theme touches, (b) an arc with a visible gauge, (c) a reason the
spike is worth WAITING for. FREE-line verbs per theme land with Gate 1's
rework; UX gauges land with Gate 1 §4.

## 1. Cross-theme structural items

- **Differentiate the DoT clocks** [OWNER-RATIFIED 2026-07-10 · M]
  (prior-art PA-4 + affliction P1): POISON, BLEED, and MARK currently tick
  at the same phase boundary — decay-vs-ramp is bookkeeping no card
  exploits. Owner chose **distinct TRIGGER conditions**, not just slopes
  (Dawncaster: Bleeding fires per damage instance, Poison per card
  played; MARK amplifies on payoff). One clock per family; every DoT
  theme inherits texture. Spec the exact triggers inside EA-7's first
  wave; prices re-derive after.
- **Enemy counterplay class** [CONFIRMED · M · content]: nothing in the
  bestiary answers a status engine, so every engine is a bond coupon.
  Teach 2-3 mid/late enemies per class: CAUTERIZE (purge/stanch DoTs,
  affliction P4), Premise-shed / OBJECTION [PLAUSIBLE · L] (peroration
  P2, couples with Gate 1 §3 reactive verbs), SWAY-cleanse, rung-regrowth
  (already specced in 2026-07-08 win-path doc §1b). Counterplay is what
  turns "plant and wait" into "protect the engine."
- **Theme-flavored signatures** [Gate 0 §4 lever]: the generic
  sig-conviction-strike out-damaging every theme's own finisher is an
  identity failure as much as a balance one. Each preset's Conviction
  outlet should speak its theme (a REAP, a Premise surge, a wheel-spin —
  not a generic poison bolt).

## 2. Per-theme work items

### Affliction / erosion — "inevitable" must mean something
The best doctrine citizen (dotFrac 64-74%) with an amputated arc: the
RUPTURE cap is reached with ~2 turns of fuel, so detonate-ASAP dominates
and the poison ramp is decoration.
- Two clocks for bleed vs poison [CONFIRMED · M] — see §1.
- Rupture-cap redesign so patience pays [needs re-spec · M]: the audited
  mechanism (P2) was REFUTED on a code misread, but the gap is real —
  either a fuel-scaling cap or an overcap dividend. `/deck-tuning` owns
  the correct mechanism.
- CAUTERIZE enemies [CONFIRMED · M] — see §1.
- Visible engine [CONFIRMED · S]: rupture fuel/cap preview (already
  computed engine-side), Suppuration doubling surfaced, honest ledger.
- Card table: straw-mans-jab carries 71-78% of ALL enemy HP loss (a
  common doing the deck's job); festering-argument needs a fizzle guard
  (paid a die to EXTEND an empty board); currys-conversion's
  bidirectional swap decides nothing — make direction a choice;
  resonance-detonation's FREE tickOne is a trap on a one-copy finisher
  (Gate 1 fixes).

### Peroration / oratory — the case must be SEEN being built
Highest distinctiveness on paper (Premises are a real unique resource);
zero visibility (Premises have no combat-UI rendering at all) and a dead
build (CONCEDE arrives unannounced).
- Milestone drip every 3rd Premise [CONFIRMED · M]: the build pays small
  dividends DURING construction — the arc gets rungs.
- Fix the-closing-word [CONFIRMED · S]: fire on declare, scale with
  overshoot, print the truth (three code-verified defects).
- Show the case [CONFIRMED · S]: Premise track + a CONCEDE beat.
- OBJECTION enemies [PLAUSIBLE · L] — see §1; the case gets attacked,
  the player defends the case: that's the fantasy.

### Forge / foundry — press-your-luck, not a token battery
Everything overflows into +1 Conviction; The Overtake fires for 18 on
turn 1 because nothing marks a CHARGED Overtake.
- FREE lines forge [CONFIRMED · M]: every FREE line makes/charges dice
  material (Gate 1).
- OVERHEAT [CONFIRMED · M]: pips past the cap allowed behind a bust
  condition — the press-your-luck knob the theme is begging for (KB
  receipt: Quacks of Quedlinburg).
- Overtake legibility [CONFIRMED · S]: 2-pip gate + live burst preview.
- Manufactured spends feed EMBER, not MARK [CONFIRMED · S]
  (entropy-tax's zone hook).
- Ex-nihilo chooses wild+0 pips or colored+1 pip [PLAUSIBLE · S].

### Akrasia / penitent — the debt must be a LEDGER, not a light switch
FALLEN (≥2 self-afflictions) flickers on trivially; blood costs read as
cosmetic surcharges.
- DEBT ledger [CONFIRMED · M]: count blood paid, tier the payoffs —
  resolve A1/A3's cash-out semantics in the spec (skeptic caught the
  internal contradiction: does absolution reset a tier?).
- Absolution fork on fallen-grace [CONFIRMED · S]: cash out the debt for
  a heal+cleanse spike vs keep riding it — a real dilemma.
- Last Word [CONFIRMED · S]: mutual-kill clemency while Fallen (dying
  with the enemy in reach = a draw becomes a win texture only akrasia
  has).
- Sin-priced FREE lines [PLAUSIBLE, amended · M]: FREE pays RECOIL as a
  COST for theme currency — compliant with the FREE-currency law (no
  TICK damage on FREE; the audited version's damage lines are amended
  out).

### Control / standstill — denial must be sized, timed, and spent
Flat 2-rung telegraphs + abundant stagger = denial is automatic; BACKFIRE
is a de facto DoT.
- Variable-rung telegraphs [CONFIRMED · L] — moved to Gate 1 §3 (it's a
  telegraph-wide item; control is its first customer).
- TURNABOUT [CONFIRMED · M]: a finisher that CONSUMES accumulated denial
  (rungsDeniedTotal) — the theme finally banks what it does.
- Red-herring FREE = expose the telegraph [PLAUSIBLE · S] (stance +
  rungs) — information as theme currency.
- Attribute the BACKFIRE drip; fix the capstone's lying copy; surface
  the deny forecast [CONFIRMED · S].

### Oracle / augury — prophecy needs stakes, range, and a face
The omen game runs on rails (always predicts HEART, cantrip-sized
rewards, self-fulfilling after fated-course).
- OMEN v2 [CONFIRMED · M]: player CHOOSES the predicted window/range;
  bigger claims pay bigger; misses cost. A bet, not a lookup.
- Recolor cassandras-burden to mind [CONFIRMED · S]: breaks the heart
  monoculture that makes the draft solved.
- Gate prophecy-fulfilled on omen hits [CONFIRMED · M]: the finisher
  requires the theme to have HAPPENED.
- PORTENT FREE line [PLAUSIBLE · M]: FREE peeks + places a marker PAID
  lines cash (Gate 1).
- Foretell picker + omen telegraph UI [CONFIRMED · S]: the engine
  literally has a comment admitting the player never sees what foretell
  saw (engine.ts:843-845).

### Harvest / tithe — the bank must RIPEN (deep rework)
A statistical clone of affliction (statusEng 51% vs 50%) whose Soul
economy pays pocket change before the fight ends.
- **PA-1 rework [CONFIRMED · L]: REAP attacks MAXIMUM HP** (a win vector
  no other theme touches — erosion of the possible, not the present) **+
  Souls persist across combats with milestone riders** (P-NEXT: the jar
  travels). This is the theme's unique axis; sized like a spec, not a
  patch.
- Burn the Soul coupons [CONFIRMED · S]: FREE lines PLANT harvestable
  short-fuse seeds; they never mint Souls directly (avoid the
  MARK-clone trap — plant theme-specific seeds, per H4's variant).
- Convex Reaping [PLAUSIBLE · M]: burst-per-Soul grows with bank size —
  the reason to wait.
- The Tithe as death-rattle [PLAUSIBLE · M]; Winnowing scales with
  sacrifice [PLAUSIBLE · M]; Bone-orchard insurance [PLAUSIBLE · S,
  optional].

### Charm / grace — capitulation must be EARNED and legible
The one unique axis in the roster. SWAY reaching the live threshold now
opens a capitulation offer; it never authors the outcome. The player must
explicitly ACCEPT the yield or CONTINUE fighting. Poison can still lower
the current-VITAE-derived offer threshold, so Grace must be tuned against
offers and accepted outcomes separately rather than treating threshold
crossing as an automatic win.
- Resolve milestones [CONFIRMED · M]: Wavering/Faltering thresholds on
  the SWAY track with small riders — the track gets rungs and a face.
  Couples with the 2026-07-08 resolve-threshold item (Charmed-style
  `SWAY ≥ resolve` opens the offer, resolve < maxHP, decays as HP falls).
- Damaging plays strip SWAY [CONFIRMED · S] (prior-art PA-6, Dawncaster
  Charmed rule): hurt them and the charm slips — pure-charm play becomes
  a real commitment. (Note: SWAY's passive 1/turn decay is
  owner-ratified — the REFUTED P2 wanted it deleted; this item adds the
  strip WITHOUT touching decay.)
- Mirror-of-longing retarget [CONFIRMED · S]: RAPPORT-prevented damage
  converts to SWAY — defense feeds the win condition in-theme.
- FREE lines build rapport foundation [PLAUSIBLE · M] (Gate 1).

### Bulwark / bastion — the wall needs a kill path that scales (deep rework)
Worst engagement score in the roster (2/10). Six of seven designs are
body-aspect (the draft is solved); the hallmarks contribute ~a dozen
damage per phase of set dressing while a non-decaying DoT does the work.
- **RIPOSTE reflects the prevented blow [CONFIRMED · M]:** reflect
  scales with what the wall actually stopped, not a flat 3 — the wall IS
  the weapon, and bigger threats become bigger paydays (doctrine-clean:
  reflect class).
- PA-3 grammar rework [PLAUSIBLE · L]: blocked/unblocked trigger
  grammar + exact-block prediction (over-block banks into the kill
  path). Treat as the follow-on spec if RIPOSTE-scaling alone doesn't
  lift engagement.
- FREE lines lay persistent BARRIER bricks [PLAUSIBLE · M — the audited
  "zero engine work" claim was wrong; riders need a barrier verb].
- Un-brick tu-quoque [CONFIRMED · S]: the dead `dieBonus onColor:'body'`
  line on a HEART card (handoff item #1) — recolor the bonus AND use the
  card to unsolve the mono-body draft.
- Wall-math on the telegraph [CONFIRMED · S] — Gate 1 §3's readout,
  bulwark is the first customer.

### Echo / refrain — repetition needs a SONG, not a multiplier
Six multiplier cards orbiting one status payload; REPRISE picks its own
target (an argmax, not a choice).
- REPRISE becomes a player choice [CONFIRMED · S]: show the songbook
  (discard picker). The single cheapest agency win in the roster.
- Ouroboros replays the last spell that LANDED A STATUS, with a face
  preview [CONFIRMED · S].
- Second-thoughts partial detonate [CONFIRMED · S]: consume ≤2 marks so
  the detonate/keep fork is real.
- FREE lines advance the loop [PLAUSIBLE, amended · M]: mill/stock
  verbs, no TICK damage (Gate 1).
- CRESCENDO overflow [PLAUSIBLE · L]: ECHO past the intensity cap
  converts — only if the cheap items above don't lift the ceiling.
  (The PA-2 song-tally rework was REFUTED on misread evidence — do not
  resurrect without fresh transcripts.)

## 3. Sequencing inside Gate 2

1. The S-tier UX/honesty items (every theme's gauge + lying copy) — they
   compound with Gate 1 §4 and cost days, not weeks.
2. FREE-line verbs per theme — lands WITH the Gate 1 owner decision.
3. The two deep reworks (harvest PA-1, bulwark RIPOSTE-scaling → PA-3)
   plus akrasia's DEBT ledger — one spec each, sandbox-first via
   `/deck-tuning` (register → A/B → promote).
4. Enemy counterplay + variable rungs — with Gate 1 §3.
5. Re-run the ten-theme matrix after each wave; the verdict table above
   is the before picture.
