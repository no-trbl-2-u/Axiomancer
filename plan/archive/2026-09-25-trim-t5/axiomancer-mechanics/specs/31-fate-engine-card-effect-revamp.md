# Spec 31 — The Fate Engine: card library + effect library revamp

> **Status:** HISTORICAL — archived 2026-09-25 (trim T5, `plan/2026-09-25-trim-the-fat.spec.md` Tier 2 docs); superseded, kept for provenance. Original path: `axiomancer-mechanics/specs/31-fate-engine-card-effect-revamp.md`. Not a source of rules.

> **Status:** P0 ("TRUTH") shipped 2026-07-05 (see §6 and the PR that added this
> spec). P1–P3 are queued as phase candidates in `plan/PHASE_CANDIDATES.md`.
>
> **Provenance:** synthesized from a 36-agent audit + design workflow run
> against the owner's three complaints (2026-07-05): (1) cards have no
> interaction with the dice, (2) effects are "barely debuffs", (3) the number
> on the card is not the number the enemy receives. Five parallel auditors
> (dice interaction, effect depth, number-mismatch, knowledge-base prior art,
> doctrine alignment) produced 67 findings; 27 mechanical claims were
> adversarially verified (0 refuted) — the full audit is at
> `docs/combat-audit-2026-07-05.md`. Three independent revamp proposals
> (dice-first / status-engine-first / prior-art-first) were judged and
> synthesized into this design. Prior-art citations reference the owner's OKF
> knowledge base (github.com/no-trbl-2-u/game-knowledge-base): Spirit Island,
> Mage Knight, Dune Imperium, Ark Nova, Slay the Spire (board game) — rules
> AND player-reception docs.


**Spine:** proposal *prior-art*. **Grafts:** dice-first's single-resolver preview architecture (engine applies the projection struct — preview==applied by construction), its die-manipulation verb set (refresh/convert/temporary/bank) and best card identities; status-engine's consuming REACT detonations, struck-through telegraph rendering, and exact-number-at-draft discipline.

**Conflicts resolved explicitly:**
1. **Random pip values on dice (dice-first) — REJECTED.** Rationale: adds a second RNG surface and forces an L rewrite + global basePower rebase; the KB's sharpest reception law is that deterministic, previewable payoffs are what players love (mage-knight/reception/reviews.okf.md "Deterministic combat that rewards planning"; ark-nova/reception/better-if.okf.md "randomness … resented when it nullifies declared intent"). Pips exist in the final design, but only **deterministically, via Reserve ripening** — the player manufactures the number by waiting (Ark Nova slot-strength).
2. **Three-line status model (status-engine) — REJECTED as a wholesale replacement.** It homogenizes 88 cards into "+N pips" and requires re-pointing ~50 cards + retuning fight length. Its **thresholded telegraph ladder, REACT mechanic, and exact-preview discipline are kept**.
3. **Read rule:** dice-first's ±2 pip shift needs die values; status-engine's ±1 pip needs lines. Adopted: **advantage = +1 intensity on this play's status (strike ×1.5); disadvantage = −1 duration, floor 1 (strike ×0.5); neutral = printed exactly** — deterministic, real units, resolved and displayed at draft time. The post-hoc `READ_STATUS_MULT` intensity rewrite (`combat.engine.ts:159-161, 658-670`) is deleted.
4. **Color match:** dice-first's per-card SURGE vs prior-art's engine rule. Adopted: engine default = **+1 duration on status cards, +3 flat on strike/defend** (replaces the status-side flat +3 at `combat.engine.ts:627/648`); cards may override with a bespoke `dieBonus: { onColor:'match', … }` rider — that IS the surge line, per card, where it earns its text.
5. **DIRECT_DAMAGE_WEIGHT:** dice-first deletes it (rebase everything); prior-art keeps 0.25 for basePower strikes and **exempts synergy/mechanic damage**. Adopted prior-art's (S/M, no rebase; fixes the confirmed quartered-combo finding at `combat.engine.ts:646-650`).
6. **Preview architecture:** all three delete `bottomDamagePreview`. Adopted dice-first's stronger guarantee: the projection function is not a parallel calculation — **`playBottomAction` applies the struct the projection returns.**

---

## 1. Dice-Interaction Rules (final)

Die shape: `CombatManaDie` gains `pips: 0|1|2` (deterministic) — no numeric face, no new RNG. Roll/draft cycle (2 dice, draft 1, `combat.dice.ts:25, 85-92`) unchanged. Single-die law unchanged.

> **AMENDED — dice-law rework (owner directive 2026-07-09).** The roll/draft
> cycle is now **3 dice, draft 1, no stance-die guarantee** (an honest roll —
> a colorless turn is a pure token turn). **THE COLOR LAW:** a die can only
> power a card of ITS color; WILD (gold) is the sole exception; off-color plays
> hard-fizzle (this supersedes the "any die works" half of R7 — the +1-duration
> match bonus survives but is now near-unconditional). Every unpicked die banks
> Conviction tokens per die: colored +1, wild +2, dead X +0; the flat
> once-per-draft `CONVICTION_PER_UNPICKED_DIE` accrual is per-die now. A card
> effect (`float_x_die`, TRANSMUTE — carried by `bootstrap-loop`) converts a
> tray X into a wild FLOATING die (spec 32 v3 §5 rules apply). Floating dice
> bypass the single-die law entirely: any number may power plays in one turn,
> each is consumed forever, none bank tokens.

**R1 — RESONANCE (Spirit Island element thresholds).** Every die you spend — powering a card, burning for Conviction, banking, or the universal discard — adds 1 Resonance of its color to an encounter tally (`resonance: {heart,body,mind}` on `CombatEncounterState`; Wild: choose the color as you spend; X feeds nothing). Cards with `threshold: {color, count, rider}` check the tally when played and fire the rider automatically, free. One spend, two payoffs.

**R2 — RESERVE & RIPENING (Ark Nova).** At end of turn, instead of burning the undrafted die for +1 Conviction you may **BANK** it (Reserve max 2 dice). A Reserve die gains **+1 pip per threat phase survived, max 2**. A bottom action may be powered by the drafted die **or** a Reserve die (still exactly 1 die). A spent die's pips add **+1 intensity per pip** to the status it lands, or **+2 Guard per pip** on defend cards. Replaces the invisible `carriedDie` (`combat.engine.ts:419-425, 350-355`) with a visible, player-owned version. Holding a die through a telegraph is a gamble against the telegraph.

**R3 — BANK-OR-BURN VISIBLE (Dune Imperium).** Every die in the tray displays both lives: "POWER a card" / "BANK ◆ (ripens) or BURN +1 Conviction". Conviction economy (cap 12) unchanged. This unsolves the greedy draft (`combat.engine.ts:1152-1169`).

**R4 — FATE / X DICE (Mage Knight no-dead-faces).** An X die is never dead. Universal, once per turn: tap an X die → **+1 tick on one enemy DoT** ("even dead fate erodes") **or +1 Conviction**. Cards carrying `fate` may be **powered by an X die** with a printed risk/reward twist. Gate change at `combat.engine.ts:613-615`: accept `color==='x'` only when the card has `fate`. Implements the spec-promised x-die-interaction class (spec 25 §6).

**R5 — THE OMEN (StS-BG round die).** The die you do NOT draft is the Omen: if its color stance-beats the enemy's hidden phase stance (Heart>Body>Mind>Heart via `resolveRead`, `combat.engine.ts:209-215`), the enemy's stance is **revealed for this phase, before you play**. Wild/X Omens reveal nothing. The draft now trades offense (draft the winning color) against information (leave it as the Omen). Note: the Omen die is still available to BANK/BURN at end of turn — R5 is a read, not a spend.

**R6 — READ RULE (replaces READ_STATUS_MULT).** Resolved at draft, displayed before any play: advantage = +1 intensity on this play's applied status delta (strike ×1.5); disadvantage = −1 duration, floor 1 (strike ×0.5); neutral = printed exactly. Applies to the first status play of the turn; chained plays land printed values. The armed card face shows the exact triplet.

**R7 — COLOR MATCH.** Status cards: match or Wild = +1 duration. Strike/defend/riposte: +3 flat (unchanged). Printed cost text becomes the truth: *"Costs 1 die · ⬡ {color} match: +1 turn"* — the "Costs 1 {color} die" lie (`combat.cards.ts:264`) and the never-charged `resolveCardDieCost`/`cardDieCostPreview` (engine.ts:195-201, 1415-1417; CLI :352) are deleted.

**R8 — dieId HONORED.** `playBottomAction`'s dead `_dieId` (`combat.engine.ts:601`) becomes load-bearing: it selects drafted vs Reserve vs X(fate) die; invalid id = explicit fizzle event. The drag target matters.

**R9 — VARIETY CHAIN kept** (engine.ts:823-832), unchanged trigger; a fired REACT or RUPTURE always refreshes the drafted die (the crescendo keeps the turn alive).

---

## 2. Preview-Fix Spec (complaint #3 — the bug dies structurally)

**One law: real-units-or-no-number (plan/bearings.md:205-209). One function. Engine applies what it returns.**

```ts
// new module src/Combat/combat.projection.ts
export function projectCardPlay(state, cardId, dieId?): PlayOutcome
interface PlayOutcome {
  strikeHp: number;                       // exact HP, target threaded: resistance + vulnMult included
  guard: number; barrier: number; healHp: number;
  statuses: { effectId; intensity; duration; perTurnCurve: number[]; lifetimeHp }[];
  riders: { label; fires: boolean; delta: CardRider }[];   // threshold/dieBonus/fate, pre-evaluated
  mechanic: { kind; amount } | null;      // rupture/amplify/compound/execute/react projection
  perRead: { advantage; neutral; disadvantage };           // full triplet for the armed pill
}
```
1. **By construction:** `playBottomAction` computes `projectCardPlay(state, cardId, dieId)` for the actual read and **applies exactly that struct** (graft from dice-first). Card faces, armed pills, reward offers, and the CLI all render the same struct. No second code path exists to disagree.
2. **Deletions:** `bottomDamagePreview` + `effectImpact` pressure units + `CONTROL_HARD_MULT/CONTROL_SOFT_MULT/IMPACT_INTENSITY_CAP` (`combat.cards.ts:107-144, 193-213`) and their three render sites (`combat.cards.ts:257,264`; `CombatRewardsOverlay.tsx:43` via presenter :805,864); `READ_STATUS_MULT` block (engine.ts:159-161, 658-670); `resolveCardDieCost`/`cardDieCostPreview` + CLI cost line; `projectCardImpact`/`projectSiphonHeal` (superseded — fixes the missing-resistance/vulnMult divergence at engine.ts:1469-1471).
3. **Read honesty:** R6 replaces the ×1.34/×0.75 intensity rewrite whose advertised effect is a provable no-op below intensity 3 and whose mobile rounding (`combat-encounter.engine.ts:781-789`) differs from the engine's. The face shows "ADV +1⚡ / — / DIS −1⏳" plus exact numbers per read.
4. **CI invariant:** new `src/Combat/e2e/preview-truth.engine.test.ts` — all library cards × {advantage, neutral, disadvantage} × {drafted, reserve+1pip, reserve+2pip, fate-X where legal} on a seeded enemy: assert `projectCardPlay` == observed engine deltas (HP, intensity, duration, guard, conviction). Suites pinning buggy numbers (`hazard-pattern-combat.engine.test.ts:164-175` `bottomDamagePreview>0`; `combat-sim-policies.engine.test.ts:119-120`) are deliberately rewritten in the same PR (bearings tests-alongside-code rule).
5. Enemy status chips keep showing intensity/duration — now consistent because the face previewed those exact numbers per read. The honest `cardCalc/faceStats` pipeline remains the single mobile number source, fed by `projectCardPlay`.

---

## 3. Final Effect Library (combat-canonical set)

Ground rules: engine honors 5 channels today; the rework is 80% wiring. `applyEffect`/`tickAllEffects` public semantics unchanged (world-tick/equipment share the library). **Effect ids never renamed** (keyword registry); merged ids stay in JSON tagged `deprecated`, banned from `cards.library.ts` by a lint test. Purge `resistedBy/resistDR` from both libraries (dead since Phase 80, resist.ts:91-111). Delete the proc-table module (`combat-effects.ts` + `combat-effects.library.json` — confirmed dead code) and `ExtendedSynergyPredicate`.

### 3.1 Field-wiring table (all S unless noted)
| Field | Reader |
|---|---|
| `damageTakenMult < 1` | remove `Math.max(1,mult)` clamp (`effects.ts:98`) → clamp [0.5, VULNERABLE_MAX]; **call `getDamageTakenMultiplier(state.player)` in `resolveThreatPhase`** (engine.ts:956). Makes `buff_resolute` (8 cards) and self-`debuff_vulnerable` downsides real |
| `dotModifiers.escalatesPerTurn/rampFactor` | tick: `dpr_eff = dpr + floor(rampFactor × turnsActive)` |
| `dotModifiers.decayOnHeal` | `enemyHeal` path removes 1 intensity of decay-tagged DoTs |
| `healingReceivedMulPct` | multiplies `enemyHeal` / player heals |
| `outgoingDamageMulPct` / `powerMulPct` | folded into threat damage (:956) and scaledStrike (:648) |
| `blocksAdvantage` (sensory_null) | on player: reads clamp to neutral + Omen fogged; on enemy: escalation (engine.ts:131-149) frozen |
| `forceWildOnNextDie` (clarity) | `rollTurnDice`: one die guaranteed wild next turn |
| `restrictsSurgeAccess` (doubt) | re-spec: bearer's next threat-phase **rider (effectId/enemyHeal) is cancelled** — struck-through on the telegraph (**M**) |
| `forcesWeakTierNextPlay` (overextended) | bearer's next threat phase downgraded 1 ladder rung; on player-self: next powered play −1 intensity |
| `consumedOnUse` | effect removed after its trigger fires once |
| `nextDotTierUpgrade` | next DoT applied to the bearer lands +1 intensity |
| `deniesAllyBuffTargeting` (isolated) | re-spec: bearer cannot heal |
| `defenseModifier` (player buffs) | grants that much **Guard** (routes into `state.guard`; cap 15/grant) |
| NEW `grantsAdvantageNextRead` (+consumedOnUse) | next read = advantage (deterministic, previewable) |
| NEW `deniesNextIncomingDebuff` (+consumedOnUse) | negation: next enemy debuff on bearer cancelled |
| Charm fix | `resolveThreatPhase` uses `canAct().resolvedStance` instead of discarding it (`effect-modifiers.ts:343-346`, engine.ts:936) |

### 3.2 Canonical enemy-borne effects
**DoTs (7 — behaviorally distinct; absorbs the 16 clones):**
| id | payload | identity |
|---|---|---|
| `debuff_bleed` | dpr 4, dur 2, intensity-stacking | fast, front-loaded burst window |
| `debuff_poison` | dpr 2, dur 4, ramp 0.5 | patient ramp — charge by waiting |
| `debuff_burn` | dpr 3, dur 3, tag `fuel` | RUPTURE/AMPLIFY consume it ×1.5 |
| `debuff_despair` | dpr 3, dur 4, healingReceivedMulPct −50 | anti-heal vs `enemyHeal` foes |
| `debuff_hemorrhage` | dpr 5, dur 3, decayOnHeal | big but fragile |
| `debuff_unraveling` | dpr 2, dur 5, ramp 0.25 | the long-game DoT |
| `debuff_septic` | dpr 3, dur 3, outgoingDamageMulPct −10/stack | dampens its hits |

Merges (tag `deprecated`, cards re-pointed): strong_poison→poison; frostbite/shock→bleed; disease→septic; hp_decay/hex/tartarus_rot/basilisk_venom→poison/unraveling; acid→burn.

**Control (the Spirit-Island layer — statuses change what the enemy DOES):**
| id | payload | in-play meaning |
|---|---|---|
| `debuff_stagger` | skipTurn, dur 1 | merges stun/sleep/petrify/gorgon (ids deprecated). On PLAYER: roll 1 fewer die next turn |
| `debuff_fear` | rollModifier −4, dur 2 | moves the ladder; printed on the telegraph number |
| `debuff_confusion` | rollModifier −5, dur 2 | ladder mover |
| `debuff_slow` | rollModifier −2, dur 2 | texture |
| `debuff_false_dilemma` NEW | blockedStances:[color of the powering die], dur 2 | enemy phases of that stance downgrade — the die names the door you close |
| `debuff_doubt` | rider-cancel, consumedOnUse | its next telegraph loses its rider, struck through |
| `debuff_mark` | revealsStance, dur 2 | bearer's stance public (Dune public-risk indicator) |
| `debuff_sensory_null` | blocksAdvantage/freeze wiring | enemy escalation frozen |
| `debuff_overextended` | forcesWeakTierNextPlay | next phase downgraded 1 rung |
| `debuff_vulnerable` | damageTakenMult 1.5, dur 2 | the generic |
| `debuff_vulnerability_body/mind/heart` | damageTakenMultForStance 1.5 | +50% only from plays powered by that color die — a debuff that tells you what to DRAFT (reader keyed on `drafted.color`) |
| `debuff_isolated` | cannot heal, dur 3 | shuts enemyHeal |

**Threat-Downgrade Ladder (M):** every phase sits on `combo → damage+rider → damage → pass`. Cumulative roll-penalty ≥4 downgrades the NEXT phase one rung; ≥8 or 3 distinct controls (existing DISRUPT) denies outright. The −6%/pt weaken + 0.4 floor stays as sub-threshold texture. **UI must render the original telegraph struck through with the downgraded replacement** (hooks: `enemyActionFired=''`, `combat.encounter.types.ts:239-244`) — prevention made vivid.

**Player-borne curses (enemy debuffs stop being bluffs):** stagger/petrify/sleep@player = roll 1 fewer die next turn (never zero plays — top actions always legal); fear@player = blocksAdvantage + Omen fogged; root@player = body cards can't be POWERED next turn; silence@player = mind ditto; charm@player = body+mind, dur 1; DoTs already live.

**Player buffs:** 7 regen/thorns kept untouched (`buff_regeneration`, `buff_life_steal`, `buff_brazen_thorns`, `buff_promethean_ember`, `buff_phoenix_vigor`, `tier1_body_defend`, `tier1_heart_defend`); `buff_resolute` 0.85 real; `buff_clarity` real; `advantage_*` → grantsAdvantageNextRead; `buff_cleanse` wired (`applyCleanse` gets its caller); barrier/damage_reduction twins → Guard grants; NEW `buff_negation`. Deprecate forever: haste, all_stats_up, critical_rate_up, accuracy_up, stealth, resistance_*, invincibility.

### 3.3 Combo registry (rebuilt around reachable pairs; consumed types: `amplify_damage` + new `downgrade_threat`)
- `bleed + vulnerable` → **Opened Veins**: bleed ticks ×1.5 (both on starter-adjacent cards)
- `poison + bleed` → **Hemorrhage** ×1.5 (kept; poison now on 4+ cards)
- `burn + vulnerable` → **Immolation**: RUPTURE/AMPLIFY consume burn ×1.5
- `fear + doubt` → **Panic** (`downgrade_threat`): deny threshold 8→4 while both active
- `despair + confusion` → **Spiral**: despair +1 intensity per turn both persist
Delete the 8 dead-typed combos and unreachable acid ingredients.

**REACT (graft from status-engine):** new `CardSpecialMechanic {kind:'react', a: effectId, b: effectId, minIntensity}` — if both present at min intensity, CONSUME them and fire a burst + product on the **mechanicDamage path** (rupture pattern, engine.ts:686-702 — never quartered); always refreshes the drafted die.

### 3.4 Mobile readability guards (KB anti-patterns)
Hard cap **5 distinct statuses per combatant** (6th replaces lowest-lifetime, merge toast); tap-for-tooltip glossary; per-status labeled ticks (spec 25 §7.5); **"The Inevitable" button** — when `getPendingDotTotal(enemy) ≥ enemy.health` (`effects.ts:115-132`), offer one-tap cinematic fast-forward (Spirit Island solved-state compression; this ships Spec 30 as a button); scripted first fight forcing one top play, one powered play, one bank, one Fate tap, one control-deny (Dune onboarding fix).

---

## 4. Card Schema + Final Card List

### 4.1 Schema (`Cards/types.ts`; barrel contract preserved — mobile verify + card-editor type-check mandatory)
```ts
type CardRider = { bonusIntensity?; bonusDuration?; chipHp?; guard?; conviction?;
  refreshDie?; revealStance?; tickAllDots?; cleanse?; healHp?; drawCards? };  // ALL real units
interface Card {
  threshold?: { color: CombatDieColor; count: number; rider: CardRider };
  dieBonus?:  { onColor: CombatDieColor | 'match'; rider: CardRider };
  fate?:      { rider: CardRider; recoilHp?: number };
  topAction?: TopActionSpec;   // kills the uniform 2-HP chip
}
// new CardSpecialMechanic kinds (dispatch pattern = engine.ts:684-778):
| { kind:'reroll_spent' } | { kind:'refresh_die'; color? } | { kind:'convert_die_color' }
| { kind:'create_temporary_die'; color }   // finally sets temporary:true
| { kind:'grant_pip'; count } | { kind:'bank_spent_die' }
| { kind:'react'; a; b; minIntensity; burstPerIntensity; product?: {effectId,intensity,duration} }
```
**Design law:** every Tier-2+ card carries exactly one die-interaction line (threshold / dieBonus / fate / die-manipulation / react); Tier-1 at most one. Fallacies lean thresholds/dieBonus (rhetoric by accumulation); paradoxes lean fate/die-manipulation (the impossible made load-bearing). Action text is generated from riders in real units. Top-action defaults (overridable): DoT card → 1 tick of its own DoT (i1 d1); control → −1 enemy roll-penalty... no: control → draw 1 or +1 Conviction as listed; defend → Guard 2; heal → heal 2; damage → chip 2.

### 4.2 Final card list (87 + synthetic Retreat = 88; TOP | BOTTOM; read rule R6 and match rule R7 apply globally)

**TIER 1 (28)**
| card (stance) | TOP | BOTTOM |
|---|---|---|
| ad-hominem-strike (B) | chip 2 | Strike + `vulnerability_body` i1 d2 (+50% from body-die plays); match: +1 dur. *The person becomes the weak point* |
| false-dilemma (M) | chip 2 | `false_dilemma` d2 — blocked stance = **the color of the die you spent**. *The die you burn names the door you close* |
| appeal-to-pity (H) | heal 2 | Heal heart×2 + `resolute` i1 d2 (real −15%); dieBonus heart: cleanse 1 |
| achilles-gambit (B) | chip 2 | **FATE**: colored = strike + bleed i1 d2; X die = strike ×2 + bleed i2 d2, recoil 2. *The impossible strike lands* |
| liars-echo (M) | draw 1 | `mark` i1 d2 (stance public); your mind-die plays vs marked +1 intensity |
| ship-of-theseus (H) | chip 2 | chip 2; spent die returns REFRESHED as **any color you choose** (`convert_die_color`). *Still your die?* |
| hasty-generalization (B) | chip 2 | bleed i2 d2; THRESHOLD Body 2: +1 intensity |
| red-herring (M) | draw 1, discard 1 | confusion i1 d2 (moves ladder); dieBonus mind: draw 1 |
| wishful-thinking (H) | heal 2 | heal 4; THRESHOLD Heart 3: heal 8 instead |
| arrow-paradox (B) | chip 2 | reveal + LOCK enemy's next phase stance (`revealStance`). *Motion frozen mid-flight* |
| heap-of-doubt (M) | +1 Conviction | doubt (rider-cancel, struck-through); THRESHOLD Mind 4: also stagger 1 |
| brace-for-impact (B, starter) | Guard 2 | Guard 5; **+2 Guard per pip on the spent die** (teaches Reserve, fight one) |
| suspend-judgment (M) | Guard 2 | Guard 4; then **BANK the spent die** to Reserve at 0 pips (`bank_spent_die`). *Epoché: withhold, and it ripens* |
| straw-mans-jab (B) | chip 2 | bleed i1 d2; dieBonus any NON-match color: +1 intensity. *The wrong target, hit harder* |
| slippery-slopes-grip (B) | chip 2 | bleed i1 d2 + enemy `nextDotTierUpgrade` (your next DoT lands +1 intensity). *The first step opens the slide* |
| zenos-half-step (B) | Guard 2 | slow + downgrade enemy's next telegraph 1 rung. *The arrow never arrives whole* |
| composition-fallacy (B) | chip 2 | `create_temporary_die` (wild, this turn) + bleed i1 d2. *The whole from its parts* |
| ad-hominem-murmur (M) | +1 Conviction | doubt + despair i1 d2 (both REAL now). *The whisper campaign* |
| false-dilemmas-fork (M) | chip 2 | `sensory_null` (escalation frozen) + confusion i1 d2 |
| sorites-whisper (M) | 1 tick unraveling | unraveling i1 d5 (ramp — real). *Grain by grain* |
| liars-paradox (M) | draw 1 | doubt + self `clarity` (next die counts Wild) |
| appeal-to-pitys-despair (H) | heal 2 | despair i2 d4 (anti-heal −50%, real) |
| bandwagons-pull (H) | +1 Conviction | fear i1 d2; THRESHOLD Heart 3: +1 intensity. *The crowd swells* |
| ship-of-theseus-drift (H) | Guard 2 | `resolute` i2 d2 (real −30%, floor 0.5) |
| brazen-rebuttal (B) | chip 2 | thorns i2 d2 |
| soothing-words (H) | heal 2 | heal 4 + cleanse 1; dieBonus heart: cleanse 2 |
| peaceful-gesture (B) | +1 Conviction | +2 heart tokens; dieBonus heart: +1 more (mercy economy unchanged) |
| befriend (H) | heal 1 | Befriend attempt (unchanged; ADR-0007 intact) |

**TIER 2 (33)**
| card (stance) | TOP | BOTTOM |
|---|---|---|
| mob-appeal (B) | chip 2 | strike 6; THRESHOLD Body 3: +4 strike + vulnerable i1 d2. *The mob is the bodies you already spent* |
| undistributed-middle (M) | confusion i1 d1 | confusion i2 d2; THRESHOLD Mind 3: also doubt |
| eternal-regress (M) | 1 tick unraveling | unraveling i2 d5; dieBonus mind: +1 intensity |
| resonance-bleed (H) | chip 2 | bleed i1 d2; synergy (kept): if already bleeding → i2, +1 dur |
| intensity-feedback (M) | chip 2 | +1 intensity to every active enemy DoT (cap 10); THRESHOLD Mind 4: +2 |
| bat-swarm-thoughtform (H) | chip 2 | `create_temporary_die` (heart); dieBonus match: it arrives with 1 pip |
| resonance-burst (M) | chip 2 | consume enemy doubt+mark: burst 4 + 4/consumed (mechanicDamage, unquartered) |
| resonance-detonation (H) | chip 2 | RUPTURE: consume all enemy DoTs, deal pending total (cap kept; mechanicDamage; burn fuel ×1.5) |
| empathetic-understanding (M) | draw 1 | reveal next 2 phase stances; dieBonus heart: reveal all |
| slippery-slope (B, starter) | 1 tick poison | poison i1 d4 ramp (face prints the honest curve "2,2,3,3 = 10 HP"). *Teaches ramp in fight one* |
| stoic-reserve (H) | Guard 2 | Guard 4; all Reserve dice +1 pip (`grant_pip`) |
| appeal-to-authority (M) | draw 1 | self `grantsAdvantageNextRead` + mark i1 d2. *The authority pre-arranges the outcome* |
| tu-quoque (H) | chip 2 | thorns i2 d2; match: +1 dur. *Whatever it does to you, it takes* |
| barbers-paradox (M) | +1 Conviction | **FATE**: colored = confusion i2 d2; X die = stagger 1. *The unresolvable question* |
| raven-paradox (B) | draw 1 | self `grantsAdvantageNextRead` ×2 charges. *Every non-raven confirms the ravens* |
| stoic-bulwark (H) | Guard 2 | Guard 5 + resolute i2 d2 |
| equivocation-cascade (M) | draw 1 | `convert_die_color` (the word slips its meaning) + confusion i2 d2; synergy kept: +1 int if enemy doubted |
| sunk-cost-momentum (B) | chip 2 | consume ALL tokens: burst 10 + 4/token (mechanicDamage, unquartered) |
| breach (M) | chip 2 | vulnerable i1 d2; THRESHOLD Mind 3: i2 |
| gabriels-bulwark (H) | Guard 2 | Barrier 6 |
| briar-riposte (B) | Guard 2 | Riposte: reduce 5, counter 6; dieBonus body: counter 9 |
| leeching-syllogism (H) | heal 2 | hemorrhage i2 d3 + SIPHON 50% of its ticks (siphon mechanic gets a card again) |
| crescendo-of-suffering (H) | chip 2 | AMPLIFY: deal 40% of pending DoT without consuming (mechanicDamage) |
| the-inevitable (M) | +1 Conviction | AMPLIFY 50%; THRESHOLD Mind 5: 75% |
| mounting-contradictions (M) | draw 1 | COMPOUND: burst 3 + 3/distinct enemy debuff (cap kept; mechanicDamage) |
| poisoned-well (B) | chip 2 | septic i2 d3 (−10% outgoing/stack, real). *Everything downstream is tainted* |
| gamblers-folly (B) | +1 Conviction | `grant_permanent_wild_die` (kept) + self vulnerable d2 — **the downside is real now** (player-side mult wired) |
| naturalistic-fallacy (B) | chip 2 | hemorrhage i2 d3 (decayOnHeal) |
| moving-the-goalposts (M) | draw 1 | doubt + `overextended` (next phase downgrades a rung — *the goal moves down the ladder*) |
| ship-in-a-bottle (M) | Guard 2 | poison i2 d4 + BANK the spent die at 0 pips. *Bottled* |
| continuum-fallacy (M) | draw 1 | `grant_permanent_wild_die` (kept) |
| sunk-costs-toll (H) | +1 Conviction | despair i2 d4; +1 intensity per 2 tokens spent this turn |
| grandfather-paradoxs-echo (H) | Guard 2 | resolute i2 + `refresh_die` (return the spent die — *rewrite the past, thinner*) |

**TIER 3 (23; opposing-token generation unchanged, skill.engine.ts:133-138)**
| card (stance) | TOP | BOTTOM |
|---|---|---|
| sorites-cascade (M) | chip 2 | bleed i1 + poison i1 + doubt (one-card variety chain); **+3 strike and +1 tick to all enemy DoTs per Reserve pip** (the heap arrives all at once) |
| straw-giant (B) | Guard 2 | strike 4 + `create_temporary_die` (wild — always matches). *Built to be knocked down* |
| bootstrap-paradox (H) | chip 2 | `refresh_die`; your next powered play this turn +1 intensity. *The effect funds its own cause* |
| appeal-to-consequences (B) | chip 2 | fear i2 d2 + self `grantsAdvantageNextRead`. *Believe, or else* |
| nirvana-fallacy (M) | draw 1 | doubt ×2 (two rider-cancels queued). *Nothing it does is good enough* |
| pascals-wager (H) | heal 2 | **FATE**: colored = Guard 4 + regen i1; X die = Guard 8 + regen i2. *Infinite payoff, funded by nothing* |
| appeal-to-fear (H) | +1 Conviction | fear i2 d2 + despair i1 d4 |
| paradox-convergence (M) | draw 1 | if enemy has ≥3 distinct debuffs: stagger 1 + burst 10 (mechanicDamage); else confusion i2 (re-predicated off unreachable buff_haste) |
| metaphysical-drain (H) | heal 2 | strike 6, heal = damage dealt (re-predicated off unreachable buff_invincibility) |
| logical-recursion (M) | draw 1 | confusion i2; synergy kept: if already confused, `refresh_die`. *The recursion continues the chain* |
| existential-collapse (B) | chip 2 | **REACT** fear+confusion (i≥1 each): consume both → stagger 1 + burst 8 (mechanicDamage); else bleed i2 (graft: status-engine PANIC/DELIRIUM) |
| transcendent-synthesis (H) | heal 2 | consume ALL your X dice: +2 Conviction and heal 2 per die. *Synthesis of the dead faces* |
| omnipotence-paradox (B) | chip 2 | burst = enemy's own next telegraphed damage (mechanicDamage; reads threatPhases). *The stone it cannot lift* |
| gamblers-ruin (M) | +1 Conviction | spend ALL Conviction: burst 2×Conviction (mechanicDamage); THRESHOLD Mind 5: ×1.5 |
| gamblers-fallacy (M) | draw 1 | confusion i2; **if your last read was disadvantage, this play counts advantage** (it was "due" — deterministic memory flag) |
| buridans-impasse (M) | draw 1 | **if both rolled dice this turn were the same color: stagger 1; else slow** (reads the roll itself — equidistant = starved) |
| eternal-recurrence (H) | heal 2 | regen i2 d4; dieBonus heart: this card returns to hand. *It recurs* |
| grandfather-paradox (B) | Guard 2 | cleanse ALL self-debuffs; THRESHOLD Body 4: also `refresh_die`. *Undo the timeline* |
| apophatic-aegis (H) | Guard 2 | Barrier 6 + `buff_negation` (next enemy debuff on you denied). *Defined by what cannot touch it* |
| achilles-overtake (B) | chip 2 | EXECUTE (kept): enemy ≤25% HP or ≥2 DoTs → burst 25% max HP; THRESHOLD Body 5: threshold 35% |
| regress-ad-infinitum (M) | draw 1 | unraveling i2 d5 + slow |
| existential-debt (H) | +1 Conviction | despair i3 d4 + `isolated` (cannot heal); self `overextended` (next play −1 intensity — **the debt is real**) |
| buridans-wager (H) | +1 Conviction | `clarity` + `grant_permanent_wild_die` (kept) |

**GOLD (3; Wild-on-gold auto-advantage kept)**
| card | TOP | BOTTOM |
|---|---|---|
| pyrrhic-victory (B) | chip 2 + 1 tick | EXECUTE + 10% max-HP self-recoil (kept — the library's best identity, engine.ts:730-747) |
| the-final-word (M) | draw 1 | poison i3 d5 (face prints the honest lifetime curve); **if the powering die is your LAST available die: +2 intensity**. *The final word must be final* (Dune spend-tension) |
| unmoved-mover (H) | Guard 3 | stagger 1 + Guard 6; all Reserve dice +1 pip. *All things move; it does not — and what waits, ripens* |

**Presets** (`combat.deck-presets.ts`) re-cut with an identity each and ≥1 threshold + ≥1 react/synergy card per preset (Spec 28's combo promise finally reaches real decks): *Erosion* (DoT+detonation), *Saturation* (control-ladder: false-dilemma, undistributed-middle, moving-the-goalposts — the 3 formerly-dead control-lock cards become its identity cards), *Bulwark*, *Onslaught* (thresholds), *Fate* (achilles-gambit, barbers-paradox, pascals-wager, transcendent-synthesis, wild-die trio). Starting deck stays slippery-slope + brace-for-impact + Retreat — both starters now teach a dice mechanic in fight one.

**Deck-growth valve (Andrew rule):** rest encounters offer remove/upgrade (upgrade = +1 threshold tier or +1 rider magnitude).

---

## 5. Engine-Change Ledger (S/M/L)

| # | Change | Files | Cost |
|---|---|---|---|
| 1 | `projectCardPlay` single-source module; engine applies its struct; delete preview dead code (§2.2) | new combat.projection.ts; combat.engine.ts:597-872 apply path; combat.cards.ts:107-213 | **M** |
| 2 | Deterministic read rule (delete READ_STATUS_MULT block) + mobile pill/readNote + test re-pins | engine.ts:159-161, 658-670; presenter :707,755-789 | **M** (mostly test churn) |
| 3 | Wire the 12+ payload fields (§3.1 table) | effects.ts, effect-modifiers.ts, engine tick/threat paths | **M** total (each S; doubt rider-cancel M) |
| 4 | resolute clamp fix + player-side damageTakenMult call | effects.ts:98; engine.ts:956 | **S** |
| 5 | Synergy/mechanic damage exempt from DIRECT_DAMAGE_WEIGHT (executeSkill returns attributed damage) | engine.ts:646-650; skill.engine.ts return shape | **S/M** |
| 6 | Charm forcedStance fix | effect-modifiers.ts:343-346; engine.ts:936 | **S** |
| 7 | Honor dieId; Reserve pool + pips + bank-or-burn | engine.ts:601, 376-425; encounter.types.ts; reducer | **M** |
| 8 | Resonance tally + threshold consumption | engine spend paths; types; combat.cards.ts | **M** |
| 9 | Omen reveal | engine draft phase; presenter | **M** |
| 10 | Fate/X gate + universal X tap | engine.ts:613-615; new reducer action | **S/M** |
| 11 | New specialMechanics kinds (reroll_spent, refresh_die, convert_die_color, create_temporary_die, grant_pip, bank_spent_die, react) — dispatch pattern exists at :684-778 | types.ts; engine | **S each** (react **M**) |
| 12 | Color-match → +1 duration on status cards; honest cost text; delete resolveCardDieCost | engine.ts:627-648, 195-201; combat.cards.ts:264; CLI :352 | **S** |
| 13 | Threat-Downgrade Ladder + struck-through telegraph | combat.threat.ts; engine.ts:905-937; mobile | **M** |
| 14 | Player-side control wiring (stagger=1 die, blockedStances power-gate, blocksAdvantage) | engine turn-start + play gates | **M** |
| 15 | Per-card `topAction` + per-verbClass defaults | types.ts; engine.ts:528-580 | **M** |
| 16 | Combo registry rebuild + `downgrade_threat` consumption; delete dead combos | amplification.registry.ts; effect-modifiers.ts | **S/M** |
| 17 | Stance-keyed vulnerability reader (`damageTakenMultForStance` keyed on drafted color) | effects.ts; engine strike/status path | **S** |
| 18 | Status cap 5 + Inevitable fast-forward | effects application; outcome check; mobile | **M** |
| 19 | Dead-code purge: proc table + combat-effects.library.json, resistedBy/resistDR, ExtendedSynergyPredicate, dead siphon label | multiple | **S/M** (tests only) |
| 20 | Library rewrite (§4.2) + effect JSON edits + presets + rewards pool | cards.library.ts, both JSONs, deck-presets, combat.rewards.ts | **L** (content; cards-only CI carve-out does NOT apply — full verify + Playwright + card-editor type-check) |
| 21 | Sim/policy update (chooseDraft must weigh bank/omen/threshold) + preview-truth e2e + new sim metrics | combat.sim-policies.ts; new e2e suite | **M** |
| 22 | Scripted first fight | mobile encounter scripting | **M** |
| 23 | Mobile render: resonance meters, reserve tray, omen badge, struck-through telegraphs, band-free exact previews | presenter + components | **L** (UI) |

No single mechanics change is a rewrite; the only L items are content volume (#20) and mobile UI (#23).

---

## 6. Phased Implementation Order (each phase ships green)

**P0 — TRUTH (fixes complaint #3 and half of #2, zero new mechanics):** #1, #2, #3, #4, #5, #6, #19 + preview-truth e2e. After P0: every printed number is real, resolute/doubt/ramp/despair/septic/clarity/overextended/isolated work, gamblers-folly has stakes, combos stop being quartered, the 2026-07-03 drop and the control-lock preset come alive.
**P1 — FATE ENGINE (fixes complaint #1):** #7, #8, #9, #10, #11, #12, #15, #17, #21. Dice gain four second reads (tally, ripen, omen, fate) and cards gain printed dice text (threshold/dieBonus/fate).
**P2 — BEHAVIOR (finishes complaint #2):** #13, #14, #16, #18 — statuses visibly rewrite the telegraph; enemy debuffs bite the player through their dice; reactions detonate.
**P3 — CONTENT & POLISH:** #20, #22, #23 + `/deck-tuning` and `/combat-playtest` balance passes.

**Invariants untouched:** HP sole win condition (last pressure-track units deleted, none reintroduced); single-die law (Reserve/Fate plays cost exactly 1 die; tier-3 = die + token); token banks, opposing-token rule, Befriend = 5 heart tokens + HP-gated mercy (ADR-0007); Conviction cap 12 + signature economy (Press Fate remains the signature reroll; card `reroll_spent` is its library sibling); seeded RNG singleton — **this design adds zero RNG calls**; 2-dice/6-card turn shape; deck/draft/reward flow; threat-sequence authoring format; `applyEffect`/`tickAllEffects` semantics for world-tick/equipment (new optional payload readers only); effect ids never renamed; skills-are-cards single source + `@mechanics` barrel aliases; top/bottom card anatomy; VITAE/STANCE canon; `cardCalc/faceStats` as the single mobile number source.

## 7. Verification (sim + playtest gates)

`npm run combat-sim` gains assertions: **preview==applied** for all cards × reads × die sources; avg distinct enemy statuses/phase ≥ 2.0 (baseline 1.0); fight length 3-6 rounds; statusEng ≥ 60%; every preset wins ≥1 fight using its headline mechanic (threshold fired / pip cashed / Fate played / react fired / ladder-downgrade observed); **zero no-op effect applications** (every applied effect must change ≥1 engine-read channel — the "barely debuffs" regression guard); chooseDraft policy comparison must show the greedy 15-liner is no longer within 5% of the best policy (the draft is genuinely unsolved). `/combat-playtest` qualitative targets: "the dice are a puzzle, not a wallet" and "the telegraph shows the catastrophe my status erased."
---

## 8. P0 "TRUTH" — as shipped (2026-07-05)

The P0 slice above was shipped with these concrete choices (deviations from the
letter of §2/§5 are noted; nothing deviates from the law *preview == applied*):

- **Read rule (R6)** — shipped exactly: `READ_STATUS_MULT` deleted;
  `READ_ADVANTAGE_INTENSITY_BONUS = 1` / `READ_DISADVANTAGE_DURATION_PENALTY = 1`
  applied to the played card's fresh status delta. Mobile pills/readNotes render
  the exact triplet (no more ×1.34 approximations that differed from the engine).
- **Preview truth** — `bottomDamagePreview` recomputed in REAL units (ramp-aware
  DoT lifetime HP; 0 for control/buff — real-units-or-no-number) instead of the
  full `projectCardPlay` module; `projectCardImpact`/`projectSiphonHeal` now
  thread resistance, VULNERABLE, outgoing-damage and healing multipliers so the
  state-aware previews match execution. The single-resolver `projectCardPlay`
  architecture remains the P1 target when riders/thresholds land.
- **Payload wiring (§3.1)** — shipped: `damageTakenMult < 1` (clamp
  `[RESOLUTE_MIN_MULT 0.5, VULNERABLE_MAX 2.0]`) + player-side call in
  `resolveThreatPhase`; `escalatesPerTurn/rampFactor` (round-threaded ticks +
  pending totals); `decayOnHeal`; `healingReceivedMulPct`;
  `deniesAllyBuffTargeting` (= cannot heal); `outgoingDamageMulPct` +
  `powerMulPct` (threat damage + powered strike); `consumedOnUse` (doubt,
  overextended, clarity, novikov); `nextDotTierUpgrade`; `restrictsSurgeAccess`
  (doubt = next fired threat loses its riders); `forcesWeakTierNextPlay`
  (interim: enemy's next fired phase ×0.5 until the P2 ladder);
  `blocksAdvantage` (enemy: escalation frozen; player: won reads clamp to
  neutral); `forceWildOnNextDie` (clarity); charm's `forcedStance` now REPLACES
  the enemy's hidden phase stance (the read sees it). `reducesControlAccuracy`
  remains unwired (no defined engine meaning — P2).
- **Damage honesty** — synergy payoff damage exempted from
  `DIRECT_DAMAGE_WEIGHT` (was silently quartered); mechanic damage was already
  exempt.
- **Honest text** — the "Costs 1 {color} die" lie removed (any non-X die powers
  a card); `impact ~N` pressure units removed from all card text; the CLI's
  never-charged `cardDieCostPreview` 0/2-die label replaced with the truth.
- **Ceiling retune** — the truth pass made status play strong enough that The
  Incompleteness (L55, 1375 HP) became a scripted 200/200 win for the
  omniscient greedy witness; retuned to L110 / 2750 HP → 0.095 win @ 200 seeds
  (near the original 1–5% target). L100 measured 0.615, L130 measured 0.000.
- **Regression guard** — `src/Combat/e2e/preview-truth.engine.test.ts` pins
  preview==applied for every DoT card, the exact read-rule deltas, and one
  behavioral assertion per formerly-inert payload channel.
- **Deferred dead-code purge** — the unreachable proc table
  (`combat-effects.ts` + `combat-effects.library.json`), `resistedBy/resistDR`
  fields, and `resolveCardDieCost` itself are still present (each is inert);
  deleting them is P1 housekeeping (#19) once the schema work touches those
  files anyway.

---

## 9. P1 "FATE ENGINE" + the curated trim — as shipped (2026-07-05, same day)

Owner call: *"trim it down by half and just lock in some really good ones
first — then extend from there."* Shipped as one pass with the P1 dice layer
so every keeper carries a real dice interaction from day one.

**The trim.** `cards.library.ts` went 88 → **49 locked-in keepers** (criteria:
engine-real post-P0, distinct in play, philosophy == mechanics, stance × tier ×
verb coverage). Cut cards live in git history; unknown ids drop safely from
deck projection. The effect libraries were canonicalized to **25 live debuffs +
9 live buffs** — merged clones are tagged `deprecated` + `deprecatedFor` (ids
never deleted; threat sequences/signatures re-pointed; Items/equipment still
resolve deprecated ids and get re-pointed in their own later pass). The combo
registry was rebuilt to 5 reachable `amplify_damage` pairs (the only consumed
result type). `debuff_stagger` merges the four identical skipTurns;
`debuff_mark` gains a REAL `revealsStance` payload (the marked foe's stance is
public); the `vulnerability_*` trio became **stance-keyed** vulnerabilities
(`damageTakenMultForStance` — +50% only from that color die: a debuff that
tells you what to draft). Canonical DoT identities: bleed 4/2 (burst window),
poison 2/4 ramping, burn 3/3 `fuel`, despair −50% healing, hemorrhage 5/3
decay-on-heal, unraveling 2/5 ramping, septic 3/3 −10% outgoing.

**The dice layer (spec §1), as shipped:**
- **R1 RESONANCE + thresholds** — every spent/burned/banked colored die tallies;
  `threshold: {color, count, rider}` fires free (spend counted first: one
  spend, two payoffs).
- **R2 RESERVE & RIPENING** — bank-or-burn at draft (`draftStanceDie(..., {
  bankUnpicked })`); Reserve max 2; +1 pip per threat phase survived (cap 2);
  pips cash +1 intensity/pip on status plays, +2 Guard/pip on defends; an
  unspent drafted die banks at `endTurn` (the invisible `carriedDie` is retired).
- **R4 FATE/X** — unpicked X dice stay on the table (locked, not consumed);
  `fate` cards may be POWERED by an X die (printed rider + recoil, read =
  none); the universal once-per-turn `tapFateDie` advances the strongest enemy
  DoT or banks +1 Conviction.
- **R5 OMEN (adapted)** — the reveal-current version was redundant (the draft
  already reveals the current stance), so the Omen SCOUTS FORWARD: an unpicked
  colored die that beats the current stance reveals the NEXT phase's stance.
- **R6** shipped in P0. **R7** — color match = +1 turn on the landed status
  (strike/defend keep the flat +3). **R8** — the dragged dieId is honored
  (drafted / Reserve / fate-X; bogus id = explicit fizzle). **R9** — variety
  chain unchanged; a fired REACT always refreshes the powering die.
- **New specialMechanics**: `reroll_spent`, `refresh_die`, `convert_die_color`
  (returns as WILD — deterministic, no color picker), `create_temporary_die`
  (forged into the Reserve), `grant_pip`, `bank_spent_die`, and **REACT**
  (`a`+`b` at minIntensity → consumed → burst on the mechanic path + product
  status).
- Card faces print generated **die lines** in real units (`CombatCard.dieLines`).

**Sim/policies** — the driver banks (reserve room + conviction ≥ 2), powers
from the Reserve when the drafted die is spent, and fate-taps dead X dice.

**Mobile (functional-minimal)** — Reserve dice render in the tray
(`⏳ +N✦ BANKED`, draggable onto cards any time), the spare die shows a
bank-or-burn toggle chip, dead X dice are tappable (`✕ TAP`), pips/read pips
label the dice, and the inspect face prints the die lines. The full resonance
meter/reserve-tray polish is the P3 UI pass.

**KNOWN-BROKEN, flagged loudly:** the trim + dice layer made every policy-pick
deck strong — measured blind/greedy win ≈ 1.00 on early/late/impossible and
0.96 mid, with statusEngagement 0.45–0.64 (was 0.12–0.18) and late
dotHpFraction 0.77 (was 0.00 — late was UNWINNABLE pre-trim). Doctrine metrics
are exactly on-vision; the CHALLENGE GRADIENT is gone. A coarse threat-constant
probe barely moved it, so the fix is a real `/combat-tuning` + `/deck-tuning`
loop pass (enemy budgets, mercy-gate pacing, policy-pick draft weighting) —
tracked in `plan/PHASE_CANDIDATES.md`, pinned KNOWN-BROKEN in the balance-band
suite, NOT smuggled into this content PR.
