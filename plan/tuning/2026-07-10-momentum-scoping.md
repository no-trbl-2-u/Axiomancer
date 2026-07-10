# Momentum — scoping decision (2026-07-10)

> Owner question: "should we scope momentum to a specific deck theme?"
> Evidence: `2026-07-10-audit-evidence/cross-momentum.md` — **plus a
> correction**: the audit lens missed the most important referent (the
> mobile momentum WHEEL), so its headline recommendation ("keep momentum
> out of card combat") was made blind and is revised here. The wheel
> facts below were verified in-session.

## The four things currently named "momentum"

1. **The combat momentum WHEEL** (owner-directed 2026-07-02;
   `axiomancer-mobile/state/combat/momentum.ts` +
   CombatEncounterPanel.tsx:296-410). LIVE in card combat today,
   mobile-only, host-side: playing cards whose stances step heart → body
   → mind lights wheel nodes; a wrong stance resets it; completing the
   cycle forges a **temporary wild momentum die**; while that die is
   live, plays don't advance the wheel. Carries its own in-combat info
   modal. The engine knows nothing about it — the grant is a host-side
   state write with a standing `TODO(engine): fold momentum into
   axiomancer-mechanics as a first-class rule`.
2. **Hazard v2 minigame momentum** (NOT card combat): round-carry
   surplus, cap 3, ANCHOR floors, SAINT'S PATIENCE cap-raiser
   (src/World/Hazard/). Codex-taught, quest-rewarded, mechanically
   complete.
3. **`buff_grace_momentum`** (charm): +12%/stack outgoing-SWAY
   multiplier, cap 9, sourced only by irresistible-grace — which was
   never played in ~1,290 simulated fights.
4. The **die-refresh chain** (new-status-refreshes-the-applied-die,
   owner-kept in the dice-law rework) — unnamed, but it IS the
   within-turn momentum feeling, and the audit flagged it as invisible.

Three unrelated rule-sets (plus one unnamed feeling) sharing one
player-facing word is a genuine vocabulary collision.

## The recommendation — RATIFIED BY OWNER 2026-07-10

**Momentum stays GLOBAL in card combat, as the wheel — and the wheel goes
engine-native. Do not scope it to one theme. The other claimants get
renamed.** Owner confirmed the strong naming form: combat keeps the word
MOMENTUM; the hazard minigame's carry system renames (CARRY/SURGE/TIDE —
pick at spec time); `buff_grace_momentum` renames regardless. Work item 2
below is no longer an owner-call — only the hazard replacement word
remains to be picked.

Reasoning:

- The wheel is the combat mechanic the word intuitively means, it is
  owner-directed, and it is ALREADY the universal "combo meter" every
  deck can chase. Scoping it to one theme would strand a shipped UI
  surface for 9 of 10 decks and delete the one cross-stance incentive
  the color law currently has (the wheel is the only system that rewards
  playing OFF your drafted color via FREE lines — a genuine puzzle
  input).
- A theme-scoped momentum keyword would be redundant: carry-over is
  already triple-served (Reserve, Conviction, floating dice), and the
  themes needing a unique axis get better ones in Gate 2 (souls that
  persist, denial that banks, debt ledgers).
- BUT themes should BEND the wheel rather than own it — that's where
  scoping actually adds texture (see work item 3).

### Work items

1. **Port the wheel into the engine** [M · engine — the standing TODO]:
   wheel state on `CombatEncounterState`, advance on card play, grant an
   engine-native temporary wild die on completion; presenters project it;
   the host-side write in CombatEncounterPanel dies. Sim policies learn
   the wheel exists (today the sims literally cannot see the mechanic —
   another reason the baseline understates real-game texture). CLI
   renders wheel state so auditors can see it.
   - Rules to ratify while porting (currently implicit in host code):
     does a FREE play advance the wheel (today: yes)? Does a fizzled
     play? Does the wheel persist across fights (today: no)?
2. **Resolve the naming collision** [S · direction ratified 2026-07-10]:
   - `buff_grace_momentum` → rename (e.g. "Unshaken Grace")
     [CONFIRMED, zero-risk: its source card has never been played].
   - Hazard minigame's carry system: the audit recommended hazard keep
     the word (it's codex-taught there) — with the wheel in the picture
     the recommendation flips: **combat keeps MOMENTUM** (players see
     the wheel every fight; it's the bigger surface), hazard's carry
     renames to something carry-flavored (CARRY, SURGE, TIDE — owner
     picks). Cheap either way; decide once, lint the vocabulary
     (MOM-2's name-guard, pointed at whichever word wins where).
   - Name the die-refresh chain [PLAUSIBLE · M]: give the
     new-status-refreshes-your-die rule a face (the audit's FERVOR
     suggestion; per-link events already exist engine-side). This is
     "momentum" the FEELING, and naming it is cheaper than any new
     mechanic.
3. **Theme × wheel interactions** [S-M each · content, AFTER 1]: the
   right way to "scope momentum to a theme" — cards that bend the global
   wheel: echo re-lights the last node (repetition), charm treats HEART
   as wild on the wheel, forge's manufactured dice count as wheel steps,
   akrasia can pay blood to skip a node. 2-3 cards total as a pilot, not
   a per-theme mandate.

### What NOT to do

- No new MOMENTUM keyword in the registry (Gate 3 is shrinking ghost
  vocabulary, not growing it).
- No cross-combat wheel persistence for now — P-NEXT is served by
  floats/Souls/talismans (Gate 4); a wheel that never resets would
  invert its risk-reward (the reset threat is the texture).
- Don't resurrect the REFUTED idea that the wheel needs to live inside
  one theme's hallmark pair to "count" as identity — identity comes from
  Gate 2's axes.
