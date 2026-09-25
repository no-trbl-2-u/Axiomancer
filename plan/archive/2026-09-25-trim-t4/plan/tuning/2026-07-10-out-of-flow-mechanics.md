# Gate 4 — out-of-flow mechanics (2026-07-10)

> The floating die is the template: persistent, visible, player-timed,
> color-lawed, irreversible — a resource that crosses the turn/encounter
> boundary and is played OUTSIDE the roll→draft→play loop. Target
> property: P-NEXT (something persists or beckons at fight end) plus the
> P-READ repair. Evidence: `2026-07-10-audit-evidence/
> cross-new-mechanics.md` (nine candidates designed, ranked, and
> adversarially screened against doctrine, the locked dice law, and
> mobile drag grammar). The momentum WHEEL (see the momentum doc) is
> already a tenth out-of-flow mechanic in this class — count it when
> budgeting tutorial load.

## Ship as one coupled batch (shared float currency)

### 1. THE STAKE  [PLAUSIBLE · S — build first]
Before the draft, wager N Conviction on the enemy's hidden stance this
phase. Correct call → paid out in floating dice (wrong → tokens burn).
- **What it buys:** the read finally has a price and a payday (the
  measured greedy-vs-blind gap is 0pp — this is the cheapest mechanism
  that moves it); a Conviction SINK that is a decision, not upkeep
  (Gate 0 §4's missing lever); floats stop being a forge-theme monopoly.
- **Owner-law fit:** touches neither the color law nor the 1-die draft;
  floats it mints obey all locked float rules.
- **Watch:** payout tuning vs the float cap 3; UI is one pre-draft
  wager chip, drag grammar already exists.
- Arbitration note: three surviving proposals monetized the same read
  seam (STAKE, Coveted Die, the refuted acts-wild advantage). STAKE goes
  first because it's S-effort and pure-additive; Coveted Die follows;
  the acts-wild idea stays dead.

### 2. THE COVETED DIE  [CONFIRMED · M]
Boss/elite telegraphs occasionally show a staked enemy die riding the
threat phase; fully denying/blocking/read-winning that phase STEALS it
as a float.
- **What it buys:** the telegraph becomes a lootable read at every stage
  (today nothing on the enemy side is interactive); control/bulwark's
  deny/block verbs earn a payday beyond survival; enemies get identity
  (which phases they stake = personality) — a down payment on the
  enemy-side audit gap.
- **Files:** threat-sequence schema (stake field on authored phases —
  56 sequences, author selectively), resolveThreatPhase steal check,
  intent VM + board chip.

### 3. GLYPHS  [PLAUSIBLE · L — the big one]
Persistent battlefield seals the player places, that CHARGE from theme
events (ticks, premises, souls, blocks) and CRACK on the player's chosen
timing for a scaled payoff.
- **What it buys:** a visible gauge filling toward a chosen spike — the
  P-ARC machine, generalized; and the pilot for Option B of the
  FREE-line rework (charge-pump grammar: small deposits, one chosen
  cash-out) without touching the 70-card library.
- **Scope discipline:** pilot as 3-5 sandbox cards across 2-3 themes via
  `/deck-tuning` (register → A/B → promote); engine surface is a new
  zone with charge events — spec it before building.
- **Watch (mobile):** a new persistent board zone is real screen estate;
  run the touch-UX check the completeness critic flagged BEFORE the
  spec is ratified.

## Second wave (gated, not yet scheduled)

- **FATE-BRAID** [PLAUSIBLE · S]: Oracle verb — lock a chosen die face
  into next turn's roll (the forceWildOnNextDie seam generalizes,
  engine.ts:419-422). Ships with oracle's Gate 2 wave as its
  theme-scoped out-of-flow toy.
- **VIAL OF RESIDUE** [PLAUSIBLE · S]: Harvest bottles one active DoT at
  victory, uncorks it next fight. Ships with harvest's PA-1 rework
  (same persistence surface as travelling Souls).
- **THE OBJECTION** [PLAUSIBLE · L]: spend a matching float/Reserve die
  as a threat-phase INTERRUPT. Deferred until the Coveted Die proves
  threat-phase interaction is fun — an interrupt window is a big
  UI/timing bet on mobile.
- **TALISMANS OF THE SPARED** [PLAUSIBLE · M]: alt-win trophies as
  cross-fight consumables. Blocked on the alt-win paths actually firing
  (befriend fired ZERO times in ~1,290 fights — fix the paths in
  Gate 2 before rewarding them).
- **THE POCKET PREMISE** [PLAUSIBLE · M]: one side-board card slot
  outside the deck. Park with the run-layer/meta-loop audit (the
  critic's biggest uncovered gap) — it's a deck-building feature wearing
  a combat costume. (Note: "pocket of fragments" in the labyrinth is an
  unrelated name collision — pick a different word at spec time.)
- **THE RELIQUARY (run-level altar)** — REFUTED as specced (name
  collides with the shipped loot-cache minigame "The Reliquary", and
  permanent tray dice already exist via
  `permanentWildDice`/`permanentDice`). Any run-boon system starts from
  those existing seams, under a new name, inside the meta-loop audit.

## Success metrics for the batch

After Gate 0's honest baseline exists: (1) greedy-vs-blind gap > 0 at
mid/late; (2) floats appear in ≥3 themes' winning lines, not just
foundry; (3) at least one transcript per stage where a player-chosen
crack/steal/stake timing decided the fight; (4) tutorial load: at most
TWO new board surfaces reach the player before the labyrinth (the wheel
already occupies one slot — see the momentum doc).
