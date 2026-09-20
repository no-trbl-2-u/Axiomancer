# Phase 102 — SUMMON: the add-spawning enemy archetype

> **STATUS: SHIPPED, 2026-09-19.** Design brief below, unedited; the shipping
> record is the "## SHIPPED" section appended at the end of this file. Where the
> two disagree, the SHIPPED section is what is in the tree and says why.
>
> This brief was the durable output of the 2026-09-19 burn-day design pass,
> written before any code.
>
> It exists because a three-lens adversarial panel (doctrine/legibility, KB
> prior-art/reception, engineering risk) reviewed one concrete proposal against
> the live tree, all three returned SOUND_WITH_CHANGES, and the changes were
> load-bearing enough that shipping the original proposal would have put a
> silent defect into the combat screen. The expensive part — finding that out —
> is done. The build is a clean 2-phase job starting from here.
>
> The matching `plan/PHASE_CANDIDATES.md` row (re-scored 3.5 -> 5.5, marked
> DESIGNED) is the queue entry; this is its specification.
>
> **Line numbers were verified against the tree at `a3b91f3` on 2026-09-19.**
> Re-check them before writing code — `combat.engine.ts` is 5809 lines and
> moves.

---

Every panel finding marked `mustChange` is folded in below. Where two lenses disagreed, the disagreement is resolved explicitly and the losing option is named. Line numbers are the current tree (verified 2026-09-19); every one cited below was read, not inferred.

Three claims in the incoming proposal are **false** and the plan does not rely on them:
- `crackGlyph` has **no** Conviction cost (`combat.engine.ts:5412-5456` contains zero `conviction` reads; its own doc comment at `:5406` says "Dieless (the die was paid at inscription)"). The cost template is `playSignatureSkill` (`combat.engine.ts:5359-5370`, `:5390`).
- The sim is **not** blind to `crackGlyph`. `policy.crackAt` exists (`combat.sim-policies.ts:110`, set at `:264/:279/:306/:329/:366`) and is driven at `combat.encounter.sim.ts:442-451`. The house convention is to teach the sim in the same increment.
- Adding to `CombatEvent` breaks **nothing** at typecheck (both mobile switches carry `default:` — `combat-encounter.engine.ts:1153`, `:1286`). The real typecheck gate is the `EnemyKeyword` union's four exhaustive sites.

---

## 1. FINAL DESIGN

### 1.1 The shape

`state.enemy` is untouched and remains the sole win condition. `checkImmediateOutcome` (`combat.engine.ts:3860-3866`) and `pendingOutcome` (`:4584-4588`) read `state.enemy` alone; nothing in this phase edits either function. An add's death can never end a fight — enforced in code, not copy.

```ts
/** Phase 102 — one member of a SUMMON foe's brood. NOT an Enemy: no threat
 *  sequence, no stages, no keywords, no loot, no art, no prose. `bite` is the
 *  FLAT damage it deals each threat phase — the number printed on its chip is
 *  the number the engine applies, with no multiplier stack behind it. */
export interface CombatAdd {
    id: string;
    name: string;
    vitae: number;
    maxVitae: number;
    bite: number;
}
```

`state.adds?: CombatAdd[]` and `state.addWavesSpawned?: number`, both optional, "absent = none", exactly the `tempZone` / `glyphs` convention (`combat.encounter.types.ts:840`, `:846`).

### 1.2 The numbers

| knob | value | justification |
|---|---|---|
| `SUMMON N` → adds per wave | **N = 2** on every shipped carrier | Prior-art lens: "N = 2 with small bite is the only starting point I'd defend; N = 3+ or bite ≥ the foe's own term makes clearing mandatory, which is the tax." |
| `ADD_WAVE_CAP` | **2 waves per combat** | Prior-art blocker #2. Aeon's End minions come from a finite nemesis deck (`kb:aeons-end/rules/scoring-endgame:40-42`); STS:BG summons come from a finite per-Act Summon deck (`kb:slay-the-spire-the-board-game/rules/setup:44,49`, src-002) and were deliberately made persistent-but-never-respawning (`.../edge-cases-faq:62-63`). "Spawn when none are alive" is rejected: it makes clearing cause the respawn, which is a tax, not a decision. |
| spawn trigger | wave 1 at the **first phase boundary**; wave 2 only at a boundary where a **STAGE fires**; never on emptiness | One-shot events, not an emptiness check. Placed after the STAGE block (`combat.engine.ts:4850`) so a stage-granted SUMMON fires on the boundary it is entered — doctrine #9. |
| add vitae | **1 / 1** | The record carries `vitae`/`maxVitae` so the chip can show pips and a future multi-hit add is representable, but every shipped add is a 1-pip add: one `strikeAdd` kills it. Two taps at 2◆ each to remove one body is the drip-drain the prior-art lens flagged as the resented shape. |
| add `bite` | `Math.max(2, Math.round(enemy.level * 0.2))` snapshotted at spawn. **L22 → 4 per add, 8 for a full wave.** | The foe's own phase-0 telegraph at L22 elite is `Math.max(4, round((6 + 0.8*22) * dMult))` ≈ 31 (`combat.threat.ts:293-301`). 8 / 31 = 26% — "strictly below the foe's own printed threat term" (prior-art #7). Escalation caps at `THREAT_ESCALATION_MAX = 2.0` (`combat.engine.ts:202`), but the add term is **outside** that stack, so a long fight does not double it. |
| `STRIKE_ADD_COST` | **2 ◆** | `CONVICTION_CAP = 12` (`combat.engine.ts:166`); signatures cost 1-9 with The Stilling at 8 and Press Fate / Second Wind at 4 (`combat.signature.ts:41-105`). Clearing a full wave costs 4◆ — one Press Fate, a third of the cap. Real opportunity cost, never a lockout. |
| `ADD_BITE_PER_LEVEL` | `0.2`, floor 2 | as above |

### 1.3 How the bite resolves — **not** as a synthetic `threatEffects` entry

The proposal's item 5 is rejected. Three panels independently found the same four defects: it corrupts `attacksLanded` (`combat.engine.ts:4176`) → `lastThreatFullyBlocked` (`:4520`) → the authored `'prior-threat-fully-blocked'` branch condition (`combat.encounter.types.ts:307`, read at `combat.engine.ts:4873`), THE COVETED DIE's `'block'` payout (`:4549`) and RIPOSTE's counter gate (`:4422`); it attributes the brood's bite to the foe's authored telegraph on the `threat-fired` event (`:4443`) and in `penaltiesApplied` (`:4411`); it runs the flat bite through the seven-term multiplier stack at `:4178-4193` plus `playerArmor` at `:4196`; and it sits inside `if (!hindered && !isDefeated(enemy))` (`:4171`), so staggering the boss silences the whole brood for free.

**Instead:** the add bite resolves in its own block, **after** the `if (!hindered && ...)` block closes (`combat.engine.ts:4452`), through a shared soak helper.

```
add block (per threat phase, once):
  raw       = sum(a.bite) over living adds        ← the printed number, no scaling
  gate      = adds.length > 0 && !isDefeated(enemy)   ← NOT gated on `hindered`
  soak      = playerArmor → GUARD → BARRIER, with the SWIFT half-divisor
  no RIPOSTE, no BRUTAL, no RAVENOUS, no VENOM, no WOUNDING, no DoT trigger
  counters  = does NOT touch attacksLanded / attacksFullyBlocked / blockedBlowTotal
  ledger    = DOES add to enemyDamageDealt (so enemyDamageThisTurn stays honest)
  event     = { kind: 'add-bit', addIds, raw, dealt }   ← its own event, not threat-fired
```

Consequences, each a deliberate ruling to be printed:
- **Staggering the boss does not silence the brood.** Bodies act; a stunned summoner's shoots still bite. (Engineering blocker #2.)
- **Killing the boss ends the fight and the brood with it.** A deliberate divergence from STS:BG (`kb:slay-the-spire-the-board-game/rules/edge-cases-faq:62-63`, src-002 — "Summons don't flee combat when the enemy that summoned them is killed"); stated in the atlas paragraph.
- **A live wall answers the adds.** This is the second honest line the prior-art lens demanded (`kb:arkham-horror-the-card-game/rules/actions:53`, src-005 — fight *or* evade). GUARD resets to 0 every phase (`combat.engine.ts:4508`), so eating the bite costs a defend card every round while clearing is a one-time 2◆. That is the decision, and both sides are visible in the telegraph.
- **A RAVENOUS summoner's bar never climbs off its brood.** Doctrine #6 closed.
- **`cleanse` does not clear adds.** `pending.cleanse` wipes `enemy.effects` (`:4829`); adds are not effects. Stated in the gloss and in a code comment. (Doctrine #9.)

### 1.4 The telegraph — a ship gate, not a follow-up

`projectIncomingThreat` (`combat.engine.ts:5697-5742`) gains `addDamage` (raw) and `addNetDamage` (post-soak), computed through **the same extracted helper** the engine uses, plus `totalNetDamage = netDamage + addNetDamage`.

- `netDamage` is left **unchanged** so `projectEnemyHealPerRound` (`:5778-5784`) keeps estimating RAVENOUS off the boss's telegraph alone — the projection half of doctrine #6.
- The mobile wall-math readout reads `totalNetDamage`.
- The three pre-existing omissions (`enemyThreatMult` `:4180`, `state.stageThreatBonus` `:4188`, `stanceCheck.mult` `:4192`) are **not** closed here — closing them moves the on-screen number for every existing foe and is its own tuning change. They are **documented** in the projection's doc comment (which already documents its single-hit simplification at `:5693-5696`), naming each missing term and its direction. The **add** term is exact by construction. Doctrine #5, documented option.
- `willDeny` (`:5715`) zeroes only the boss terms. `addNetDamage` is computed regardless, so a denied telegraph does not read as a safe turn while the brood bites.

### 1.5 The verb

`strikeAdd(state, addId, _rng?) → CombatTransition`, in `combat.engine.ts`, immediately after `crackGlyph`.

- Phase gate + Conviction debit + underfunded fizzle from **`playSignatureSkill`** (`:5359-5370`, `:5390`), not `crackGlyph`.
- Identity no-op tail, `withLog`, `checkImmediateOutcome` from `crackGlyph` (`:5417-5419`, `:5454-5455`).
- Three distinct outcomes: wrong phase / unknown id → `{ state, events: [] }` with the **same object reference** (asserted `toBe`, per `glyphs.engine.test.ts:259,266`); underfunded → one `effect-fizzled` event and `withLog(state, events)` so the log explains the no-op (prior-art blocker #3); success → remove the add, emit `add-struck`, `withLog`, `checkImmediateOutcome`.
- No `swayOffersCapitulation` check (the verb pushes no SWAY), matching `crackGlyph`'s tail rather than `playCombatCard`'s (`:3853-3855`).

### 1.6 The UI

The doctrine that actually governs is **FE-022**, in the repo's own words at `CombatCombatantPane.tsx:160-168`: a second full-width bar under VITAE sits where genre convention puts armour, so it must name its payoff. The HUD already stacks up to four `AltWinMeter`s (`:719-748`). Chips have no fill, no value/max fraction and no `progressbar` role; the VITAE crest (`:99-153`, `:817`) stays the only element carrying the big number. Adds-as-chips passes by construction.

- **Prerequisite, shipped first:** `enemyFigureWrap` is anchored off the static `COMBAT_HUD_HEIGHT = 148` (`CombatCombatantPane.tsx:89`, `:786`) although the HUD is already measured via `onHudLayout` (`:711`, consumed in `CombatBoard.tsx:1010-1018`). A new chip row grows the HUD and not the figure. Move the anchor onto a locally-measured height before adding any row. (Doctrine #2 — prerequisite, not follow-up.)
- **`AddChips`, a new shell — not `EffectChips`.** `hudRight` (`:762-770`) already mounts two `EffectChips` families whose taps open an info plaque; an add chip's tap **spends**. Identical shell + identical column + one tap that informs and one that costs is the real legibility wound (doctrine #1). The add row gets its own tile geometry (taller, square corners, a BITE badge top-left and a ◆cost badge bottom-right), an explicit **locked** state when `conviction < cost`, and sits above the keyword row.
- **Tap → confirm sheet**, never tap-to-spend: `onAdd → setAddConfirm → STRIKE / WAIT → strikeAdd`, the exact Seal pattern (`CombatEncounterPanel.tsx:631-636`).
- Iron-grey register (`ENEMY_KEYWORD_COLOR = GLYPH_COLORS.thorns`, `combat-encounter.engine.ts:110`) — "properties of the thing you are hitting", never the seal/alt-win gold, which would imply a win track that does not exist.
- `accessibilityLabel` states state **and** consequence, per `SealChips` (`:286`): `"Brier Shoot, bite 4. Costs 2 Conviction to strike. Tap to confirm."` / `"… You have 1 Conviction."`

### 1.7 The carrier

**The Jeweled Tree** (`enemy.library.ts:1152-1171`), an `elite` at level 22, on the `mid` matrix roster (`combat.stage-profiles.ts:136` — `'jeweled-tree'`). Fiction fits exactly: gemstone eyes that watch you want them, which detach and come for you.

It currently authors **no** `keywords`, so it inherits `defaultEnemyKeywords(22, 'elite')` = `HIDE 5` + `SWIFT` (`Enemy/index.ts:204-209`, `:307` — a **replace**, not a merge). Authoring `keywords` therefore throws those away. The shipped array is:

```ts
keywords: [{ kind: 'hide', n: 5 }, { kind: 'summon', n: 2, addName: 'Brier Shoot' }],
```

HIDE 5 is re-listed explicitly so the retrofit is not a silent nerf; SWIFT is **deliberately dropped** so the foe stays inside the elite budget of 1-2 keywords (`Enemy/types.ts:332-333`). Trading SWIFT for SUMMON 2 is the intended swap: it stops halving the wall, because the wall is now the honest second line against the brood.

### 1.8 The keyword registry amendment

`Enemy/enemy-keywords.ts:1-25` states that every keyword changes "the *arithmetic* of a fight, not its size", and maps each kind to one apply site. SUMMON adds entities, a state slot, a player verb and a UI surface. The file header is amended to declare SUMMON a **deliberate second class** with all three apply sites listed. The gloss stays **bite-only**, because `enemyKeywordGloss` does a single `{n}` substitution (`:132`) and `enemyKeywordText` only renders `LABEL n` (`:124-127`):

> `summon: 'This foe fields {n} of its own. Each bites you for its printed number every phase, even while the foe is denied.'`

The spawn rule, the clear verb and its price live on the **confirm sheet**, where the player reads them at the moment of decision — which is also the fix for the documented reception failure at `kb:cthulhu-death-may-die/reception/better-if:54,64` (a summoning rule legible to designers and opaque at the table).

### 1.9 Explicitly rejected, and why

- **Adds soak player damage / taunt ordering.** Verified: 20 `applyEnemyDamage(` + 10 `applyDamage(enemy` = 30 sites in `combat.engine.ts`. Routing damage through adds means changing `applyEnemyDamage`'s signature and touching all 30 — the XL path wearing a small hat. The cost argument stands on its own; no KB entry exists for taunt ordering, so it is **not** dressed up as a design finding.
- **The S-sized alternative: curses instead of bodies.** The engine can already say "the foe makes you new problems" via `injectedCurses` (WOUNDING `:4255-4262`, stage curses `:4844-4847`) — the way Dawncaster's "Conjure 2 Daggers" does (`kb:DigitalCardGames/dawncaster/cards/0465-daggers-781678:47,62`). Zero new state, zero new verbs, zero new UI. It is **named and rejected**: it produces no on-board object, no clear decision and no second pressure line; the M-sized version earns its cost by giving the player a priced choice the curse path cannot.
- **Adds as win-condition-bearing** (the Aeon's End model, `kb:aeons-end/rules/edge-cases-faq:66-68`). Rejected for win-condition legibility and for scope. The divergence is stated in the atlas.
- **Recon corrections for the brief:** 110 `.enemy` refs in `combat.engine.ts` (not 121); 30 damage sites (not 31); **seven** mutable `let enemy` locals — `:1002, 1541, 1716, 2363, 4069, 4639, 5422` (not three). The XL verdict for literal multi-enemy survives; the sizing numbers do not, and no "one session" confidence claim should rest on them.

---

## 2. THE SIM-POLICY CALL

**DECISION: teach the sim policy, roster the foe normally, re-stamp the baseline in the same tick.**

All three lenses reached this independently, and the proposal's stated justification for the alternative is factually wrong. `crackGlyph` was taught to the sim in Phase 51: `crackAt?: number` at `combat.sim-policies.ts:110` with the strict doc contract at `:98-108` ("Absent = never cracks — the strict default, so every policy without this field is byte-identical to its pre-Phase-51 behavior"), set on five policies (`:264, :279, :306, :329, :366`), driven at `combat.encounter.sim.ts:442-451`. The precedent is binding, worked, and roughly twelve lines.

Roster exclusion is technically available — `COMBAT_STAGE_PROFILES[].enemySlugs` is an explicit list (`combat.stage-profiles.ts:110/136/156/177`) — and is the worse answer. `CLAUDE.md` routes every balance question through `npm run baseline:check`; an archetype permanently absent from the matrix has no measured truth at all, and the design's most dangerous unknowns (N, bite, drain rate) are precisely the ones only the matrix can settle. Shipping a SUMMON foe to the roster *before* the policy can see `strikeAdd` is worse still: it puts a row that is wrong in a known direction into a source-of-truth artifact.

**Implementation:**

```ts
// combat.sim-policies.ts — new optional field, after `crackAt` (:110)
/** Phase 102 — the minimum PROJECTED post-soak add damage that justifies
 *  paying STRIKE_ADD_COST. Once `projectIncomingThreat(state).addNetDamage
 *  >= strikeAddsAt` and Conviction covers the price, the witness strikes the
 *  highest-bite add. Absent = never strikes — the strict default, so every
 *  policy without this field is byte-identical to its prior behavior.
 *  Wired ONLY into `upgradeablePlayPhase`; the flag-off legacy
 *  `policyPlayPhase` body never reads it — the same deliberate gap `crackAt`
 *  carries (see above). */
strikeAddsAt?: number;
```

Set `strikeAddsAt: 1` on the same five policies that carry `crackAt` (`:264` greedy, `:279` blind, `:306` DoT Weaver, `:329` Control Lock, `:366` Turtle/Chaos). The threshold reads "clear whenever the brood would actually get through the wall" — a turtle holding a live wall projects `addNetDamage === 0` and correctly declines to pay, which is the designed decision, taught rather than hard-coded.

Driver block goes in `upgradeablePlayPhase` immediately after the `crackAt` block (`combat.encounter.sim.ts:452`), same guard-counted `continue` shape.

**Caveat to state in the brief rather than discover later:** this mirrors `crackAt`'s limitation exactly — under the flag-off legacy `policyPlayPhase` (`combat.encounter.sim.ts:522`) the witness still never strikes adds. Mirror it deliberately; do not claim full sim parity.

**Measurement caveat required by AGENTS.md:** `npm run baseline:check` was **not** run for this plan — it is read-only and source-of-rules. No number here is measured. The first tuning claim about SUMMON must be re-derived against a baseline stamped *after* both the verb and the policy knob land.

---

## 3. IMPLEMENTATION ORDER

Ordered so the tree typechecks after every step except the unavoidable 3→4 pair (a mechanics union member has no glyph until mobile catches up). Keep those two adjacent.

---

### 1. Mobile prerequisite — anchor the enemy figure to the measured HUD

**File:** `/home/user/Axiomancer/axiomancer-mobile/components/combat/encounter/CombatCombatantPane.tsx`

**1a.** Add local state near the other component state in `CombatCombatantPane` (the component destructures props at `:459`):

```ts
    // Phase 102 — the figure was anchored off the STATIC `COMBAT_HUD_HEIGHT`
    // (:786) while the HUD itself has been measured since the dice-tray and
    // LOG-toggle findings (plan/CRITIQUE.md:2385-2389, :2398-2425). A new chip
    // row grows the HUD and not the figure, so the chips paint over the foe's
    // head on 375x812 with PLEA + DOT live. Measure locally; the constant is
    // the pre-layout fallback only.
    const [hudH, setHudH] = useState(0);
```

**1b.** Line `:711`, replace:
```ts
                onLayout={(e) => onHudLayout?.(e.nativeEvent.layout.height)}
```
with:
```ts
                onLayout={(e) => { const h = e.nativeEvent.layout.height; setHudH(h); onHudLayout?.(h); }}
```

**1c.** Line `:637`, replace `<View style={styles.enemyFigureWrap}>` with:
```tsx
                    <View style={[styles.enemyFigureWrap, hudH > 0 ? { top: hudH - 14 } : null]}>
```

Leave `styles.enemyFigureWrap` (`:786`) as the fallback. **Ships and verifies on its own** — no SUMMON code depends on it, but no chip row may land before it.

---

### 2. Mechanics types — `CombatAdd`, state fields, events

**File:** `/home/user/Axiomancer/axiomancer-mechanics/src/Combat/combat.encounter.types.ts`

**2a.** New interface. Insert after line `744` (the `}` closing `GlyphInstance`), before the `// ── Top-level encounter state` banner:

```ts
/**
 * Phase 102 (SUMMON) — one member of a foe's brood. Deliberately NOT an
 * `Enemy`: no threat sequence, no stages, no keywords, no loot, no art, no
 * prose (cf. `Enemy/types.ts:224-342`, which is exactly the weight that makes
 * literal multi-enemy combat XL). `bite` is FLAT: the number printed on the
 * chip is the number the engine applies — it is resolved outside the threat
 * loop's multiplier stack, so no escalation, stage bonus, weaken or stance
 * term ever touches it. Every shipped add is 1/1 VITAE (one `strikeAdd`
 * kills it); the fields exist so the chip can show pips and a future
 * multi-strike add is representable.
 */
export interface CombatAdd {
    id: string;
    name: string;
    vitae: number;
    maxVitae: number;
    bite: number;
}
```

**2b.** State fields. Insert after line `846` (`    glyphs?: GlyphInstance[];`), before the `enemyTempAttachments` doc block:

```ts
    /** Phase 102 (SUMMON) — the foe's living brood. Optional, "absent = none"
     *  back-compat (same as `tempZone`/`glyphs`). NEVER part of the win
     *  condition: `checkImmediateOutcome` and `pendingOutcome` read
     *  `state.enemy` alone, so clearing every add can no more end a fight
     *  than cracking every Seal can. Spawned at a phase boundary, bites once
     *  per threat phase, cleared by the dieless `strikeAdd`. A STAGE's
     *  `cleanse` does NOT clear it — cleanse wipes `enemy.effects`, and a
     *  body is not an effect. */
    adds?: CombatAdd[];
    /** Phase 102 — waves spawned this combat, capped at `ADD_WAVE_CAP`. Adds
     *  NEVER respawn on emptiness; clearing a wave is progress you keep. */
    addWavesSpawned?: number;
```

**2c.** Events. Insert between line `715` (`coveted-die-stolen`) and line `716` (`combat-ended`, which owns the terminating `;`):

```ts
    // Phase 102 (SUMMON) — the brood. Own events, never folded into
    // `threat-fired`/`penaltiesApplied`: the authored telegraph must keep
    // reporting only what the foe itself announced.
    | { kind: 'add-spawned'; enemyId: string; wave: number; addIds: string[]; bite: number }
    /** `raw` is the printed sum of bites; `dealt` is what survived armor /
     *  GUARD / BARRIER. Not counted in `attacksLanded`. */
    | { kind: 'add-bit'; addIds: string[]; raw: number; dealt: number }
    | { kind: 'add-struck'; addId: string; name: string; cost: number }
```

Typechecks alone.

---

### 3. The keyword registry (breaks mobile — pair with step 4)

**File:** `/home/user/Axiomancer/axiomancer-mechanics/src/Enemy/enemy-keywords.ts`

**3a.** Header. Insert after line `24` (`*                                hit into N damage instances)`), before the closing `*/` at `25`:

```
 *   - `summon`                → THREE sites (see below)
 *
 * SUMMON is a DELIBERATE SECOND CLASS of keyword, and the only one. Every
 * other entry here changes the arithmetic of a fight without changing its
 * size; SUMMON adds bodies, a state slot (`CombatEncounterState.adds`), a
 * player verb (`strikeAdd`) and a UI surface. Its three apply sites:
 *   - spawn → `processBetweenPhases` (the REGROW/STAGE boundary, post-stage)
 *   - bite  → `resolveThreatPhase` (its own block, outside the threat loop)
 *   - clear → `strikeAdd` (dieless, priced in Conviction)
 * The gloss below is deliberately BITE-ONLY: the one-line format cannot carry
 * spawn rule + bite rule + clear verb + price, so the clear rule and its price
 * live on the chip's confirm sheet, where the player reads them at the moment
 * of decision.
```

**3b.** Union member. Line `63` currently reads `    | { kind: 'flurry'; n: number };`. **Strip its semicolon** and append:

```ts
    | { kind: 'flurry'; n: number }
    /** SUMMON N — the foe fields N bodies of its own. They spawn once at a
     *  phase boundary (and once more on a STAGE), never on emptiness; each
     *  bites for its own printed FLAT number every threat phase, soaked by
     *  your armor/GUARD/BARRIER but by no other term; they bite even while
     *  the foe itself is denied, because bodies act. They are cleared by the
     *  dieless `strikeAdd` for Conviction, and clearing one is terminal
     *  progress. They are NOT a win condition — killing the brood can never
     *  end a fight, and killing the foe ends it regardless of the brood
     *  (a deliberate divergence from STS-BG, kb:slay-the-spire-the-board-game
     *  /rules/edge-cases-faq src-002 — "Summons don't flee combat when the
     *  enemy that summoned them is killed"). `addName` is authoring copy for
     *  the chip; `enemyKeywordText`/`enemyKeywordGloss` never read it. */
    | { kind: 'summon'; n: number; addName?: string };
```

**3c.** `ENEMY_KEYWORD_KINDS`: insert `    'summon',` after line `76` (`    'flurry',`), before `] as const;` at `77`.

**3d.** **Do not touch lines `79-89`.** The `AssertNever` pair is the gate that fails the build if 3b and 3c disagree. Both `_`-prefixed types are unused by design; a lint autofix that deletes them removes the only thing keeping the runtime array honest.

**3e.** `ENEMY_KEYWORD_LABEL`: insert `    summon: 'SUMMON',` after line `102`.

**3f.** `ENEMY_KEYWORD_GLOSS`: insert after line `120`, before `});`:

```ts
    summon: 'This foe fields {n} of its own. Each bites you for its printed number every phase, even while the foe is denied.',
```

Four-space indent, lowercase key — required by `scripts/content-drift.mjs:139` (`/^ {4}([a-z_]+):/gm`).

---

### 4. Mobile glyph (restores the cross-package typecheck)

**File:** `/home/user/Axiomancer/axiomancer-mobile/state/presenters/combat-encounter.engine.ts`

Insert after line `108` (`    flurry: '⁂',`), before `});` at `109`:

```ts
    summon: '⚭',     // it is not alone
```

`ENEMY_KEYWORD_GLYPHS` is `Record<EnemyKeyword['kind'], string>` (`:98`) in a **different package** — omitting this compiles clean in mechanics and breaks only under `npm run verify -w axiomancer-mobile`.

---

### 5. Engine constants + the shared soak helper + the spawn helper

**File:** `/home/user/Axiomancer/axiomancer-mechanics/src/Combat/combat.engine.ts`

**5a.** Constants, beside the other exported combat constants (near `STAGE_THREAT_BONUS_CAP` at `:277`):

```ts
/** Phase 102 (SUMMON) — waves a single combat may ever spawn. Adds NEVER
 *  respawn on emptiness: clearing a wave is progress the player keeps. Prior
 *  art both ways — Aeon's End minions come from a finite nemesis deck
 *  (kb:aeons-end/rules/scoring-endgame:40-42), STS-BG summons from a finite
 *  per-Act Summon deck (kb:slay-the-spire-the-board-game/rules/setup src-002).
 *  Every add fight players tolerate has FINITE adds. */
export const ADD_WAVE_CAP = 2;
/** A spawned add's FLAT per-phase bite, snapshotted from the foe's level.
 *  Sized so a full wave lands well under the foe's own printed telegraph
 *  (L22 elite: 2 adds x 4 = 8 against a ~31 phase budget, combat.threat.ts
 *  :293-301) — adds read as a modifier on the wall, not a second wall. */
export const ADD_BITE_PER_LEVEL = 0.2;
/** `strikeAdd`'s Conviction price. CONVICTION_CAP is 12 and signatures run
 *  1-9 (combat.signature.ts:41-105), so a full 2-add wave costs 4 — one
 *  Press Fate. Real opportunity cost, never a lockout. */
export const STRIKE_ADD_COST = 2;
```

**5b.** The shared soak helper and the spawn helper, inserted **after line `3965`** (the `}` of `splitFlurryDamage`) and **before line `3967`** (the `/**` opening `resolveThreatPhase`'s doc block):

```ts
/**
 * Phase 102 — the soak arithmetic for a FLAT hit that is not part of the foe's
 * telegraph: armor, then GUARD, then BARRIER, with SWIFT's half-divisor. This
 * is the SINGLE definition shared by `resolveThreatPhase`'s add block and
 * `projectIncomingThreat`'s add term, so the on-screen wall math cannot drift
 * from what the engine does. Deliberately excludes RIPOSTE (a parry on the
 * foe's own swing) and BRUTAL (a property of the foe's blow), and never
 * touches `attacksLanded`/`attacksFullyBlocked`.
 */
function soakFlatHit(
    raw: number,
    o: { armor: number; guard: number; barrier: number; swift: boolean },
): { dealt: number; guard: number; barrier: number } {
    let dmg = Math.max(0, raw - o.armor);
    const div = o.swift ? 2 : 1;
    let guard = o.guard;
    let barrier = o.barrier;
    const g = Math.min(Math.floor(guard / div), dmg);
    guard -= g * div; dmg -= g;
    const b = Math.min(Math.floor(barrier / div), dmg);
    barrier -= b * div; dmg -= b;
    return { dealt: dmg, guard, barrier };
}

/** Phase 102 — a wave of SUMMON adds. Deterministic: no `rng()` call, so
 *  inserting the spawn never shifts a seeded draw downstream. */
function spawnAddWave(enemy: Enemy, n: number, wave: number, name: string): CombatAdd[] {
    const bite = Math.max(2, Math.round(enemy.level * ADD_BITE_PER_LEVEL));
    return Array.from({ length: n }, (_, i) => ({
        id: `add-${enemy.id}-${wave}-${i}`,
        name, vitae: 1, maxVitae: 1, bite,
    }));
}
```

Import `CombatAdd` alongside the other types from `./combat.encounter.types`.

---

### 6. The spawn block

**File:** `combat.engine.ts`, inside `processBetweenPhases`. Insert at line **`4851`** (currently blank) — after the `}` at `4850` that closes `if (!isDefeated(enemy))` around the STAGE block, and before `const candidateIndex` at `4852`:

```ts
    // ── Phase 102 (SUMMON) — the brood spawns AFTER the stage block, so a
    // stage whose `gain` grants SUMMON fires its own first wave on the
    // boundary it is entered. Wave 1 at the first boundary of the combat;
    // every later wave needs a STAGE to fire. NEVER on emptiness: clearing a
    // wave must be progress the player keeps, or the verb is a tax rather
    // than a decision. A stage's `cleanse` (:4825) wipes `enemy.effects` and
    // leaves the brood standing — bodies are not afflictions.
    const summon = findEnemyKeyword(enemy.keywords, 'summon');
    let adds = state.adds ?? [];
    let addWavesSpawned = state.addWavesSpawned ?? 0;
    if (summon && summon.n > 0 && !isDefeated(enemy) && addWavesSpawned < ADD_WAVE_CAP) {
        const stageFiredNow = stagesEntered.length > (state.stagesEntered ?? []).length;
        if (addWavesSpawned === 0 || stageFiredNow) {
            const wave = spawnAddWave(enemy, summon.n, addWavesSpawned, summon.addName ?? `${enemy.name} Brood`);
            adds = [...adds, ...wave];
            addWavesSpawned += 1;
            events.push({
                kind: 'add-spawned', enemyId: enemy.id, wave: addWavesSpawned,
                addIds: wave.map(a => a.id), bite: wave[0].bite,
            });
        }
    }
```

Then carry the two fields out. Insert into the `next` literal after line `5125` (`        stageThreatBonus,`), before the conditional `drawPile` spread at `5126`:

```ts
        // Phase 102 (SUMMON) — the brood ledgers. Bare locals: `...omenState`
        // does NOT carry them, exactly as `stagesEntered` does not.
        adds,
        addWavesSpawned,
```

Both are function-level locals, so they survive the three later `next` rebuilds (`:5130`, `:5135`) by spread.

---

### 7. The bite block

**File:** `combat.engine.ts`, inside `resolveThreatPhase`. Insert at line **`4453`** (currently blank) — after the `}` at `4452` that closes `if (!hindered && !isDefeated(enemy))`, and before the `// Mark: enemy hindered …` comment at `4454`:

```ts
    // ── Phase 102 (SUMMON) — the brood bites. DELIBERATELY OUTSIDE the
    // telegraph loop above, and outside its `!hindered` gate:
    //  · bodies act, so staggering or denying the FOE does not silence them;
    //  · the printed bite is the bite — none of the loop's seven multipliers
    //    (:4178-4193) touches it, so the chip cannot lie;
    //  · `attacksLanded`/`attacksFullyBlocked`/`blockedBlowTotal` are NOT
    //    incremented, so `lastThreatFullyBlocked` (:4520), the authored
    //    'prior-threat-fully-blocked' branch (combat.encounter.types.ts:307),
    //    THE COVETED DIE's 'block' payout (:4549) and RIPOSTE's counter gate
    //    (:4422) all read exactly what they read without a brood;
    //  · `threat-fired` (:4443) and `penaltiesApplied` (:4411) keep reporting
    //    ONLY the foe's authored telegraph — the brood gets its own event;
    //  · no RAVENOUS, VENOM, WOUNDING, BRUTAL or RIPOSTE rides on it: the
    //    foe's one protected bar never climbs off a body the player did not
    //    clear.
    // The wall DOES answer it (armor -> GUARD -> BARRIER, SWIFT's divisor),
    // which is the second honest line: eat it behind a wall you re-buy every
    // phase, or pay 2 Conviction once and be done.
    const livingAdds = state.adds ?? [];
    if (livingAdds.length > 0 && !isDefeated(enemy)) {
        const rawBite = livingAdds.reduce((s, a) => s + a.bite, 0);
        if (rawBite > 0) {
            const soaked = soakFlatHit(rawBite, { armor: playerArmor, guard, barrier, swift: foeSwift });
            guard = soaked.guard;
            barrier = soaked.barrier;
            if (soaked.dealt > 0) {
                player = applyDamage(player, soaked.dealt);
                // The ledger counts it: the player really took it from the
                // foe's side, and `enemyDamageThisTurn` (:4519) must reconcile
                // against actual HP lost.
                enemyDamageDealt += soaked.dealt;
            }
            events.push({ kind: 'add-bit', addIds: livingAdds.map(a => a.id), raw: rawBite, dealt: soaked.dealt });
        }
    }
```

`playerArmor` (`:4144`), `foeSwift` (`:4153`), `guard`, `barrier`, `player`, `enemyDamageDealt` are all in scope at `4453` and all flow into the `next` literal at `4496-4533`.

---

### 8. `strikeAdd`

**File:** `combat.engine.ts`. Insert at line **`5457`** (currently blank) — after the `}` at `5456` closing `crackGlyph`, and before the `/** The baseline signature kit … */` comment at `5458`. Do **not** insert after `5459`; everything from `5461` is the summary/selectors region.

```ts
/**
 * Phase 102 (SUMMON) — strike one add off the board. Dieless and PRICED: the
 * phase gate and the Conviction debit are `playSignatureSkill`'s shape
 * (:5359, :5367-5370, :5390), NOT `crackGlyph`'s — `crackGlyph` costs nothing
 * because its die was paid at inscription, and a free mandatory repeating tap
 * is the canonical resented add shape. The no-op / `withLog` /
 * `checkImmediateOutcome` tail IS `crackGlyph`'s (:5417-5419, :5454-5455).
 *
 * Three outcomes, deliberately distinct: wrong phase or unknown id is a SILENT
 * identity no-op (same object reference — the e2e asserts `toBe`); a Conviction
 * shortfall emits `effect-fizzled` and DOES log, so the player's loss stays
 * attributable; a success removes exactly one add. It can never end a fight:
 * `checkImmediateOutcome` reads `state.enemy` alone (:3864).
 */
export function strikeAdd(
    state: CombatEncounterState,
    addId: string,
    _rng: () => number = defaultRng,
): CombatTransition {
    if (state.phase !== 'phase-play') return { state, events: [] };
    const add = (state.adds ?? []).find(a => a.id === addId);
    if (!add) return { state, events: [] };
    if (state.conviction < STRIKE_ADD_COST) {
        const events: CombatEvent[] = [{
            kind: 'effect-fizzled', cardId: add.id, effectId: '',
            message: `need ${STRIKE_ADD_COST} ◆ Conviction (have ${state.conviction})`,
        }];
        return { state: withLog(state, events), events };
    }
    const events: CombatEvent[] = [
        { kind: 'add-struck', addId: add.id, name: add.name, cost: STRIKE_ADD_COST },
    ];
    let next: CombatEncounterState = {
        ...state,
        conviction: state.conviction - STRIKE_ADD_COST,
        adds: (state.adds ?? []).filter(a => a.id !== addId),
    };
    next = withLog(next, events);
    return checkImmediateOutcome(next, events);
}
```

---

### 9. The projection

**File:** `combat.engine.ts`, `projectIncomingThreat`.

**9a.** Return type, `:5697-5703` — add to the literal:
```ts
    /** Phase 102 (SUMMON) — the brood's printed bite total, and what survives
     *  the SAME `soakFlatHit` the engine applies. `netDamage` deliberately
     *  EXCLUDES it so `projectEnemyHealPerRound`'s RAVENOUS estimate keeps
     *  reading the foe's own telegraph; the HUD reads `totalNetDamage`. */
    addDamage: number; addNetDamage: number; totalNetDamage: number;
```

**9b.** Body, insert after line `5740` (`remaining = Math.max(0, remaining - barrier);`), before the `return` at `5741`:
```ts
    // Phase 102 — the brood, through the same helper `resolveThreatPhase` uses.
    // NOT zeroed by `willDeny`: denying the FOE does not deny its brood, and a
    // telegraph that read 0 while the adds bit would be the worst class of lie.
    const addDamage = (state.adds ?? []).reduce((s, a) => s + a.bite, 0);
    const addNetDamage = addDamage > 0
        ? soakFlatHit(addDamage, {
            armor: Math.max(0, getActiveEffectModifiers(state.player.effects as ActiveEffect[]).defenseDelta),
            guard: Math.max(0, guard - (projectedDamage - remaining)),
            barrier, swift: hasEnemyKeyword(state.enemy.keywords, 'swift'),
        }).dealt
        : 0;
```
and extend the return: `…, netDamage: remaining, addDamage, addNetDamage, totalNetDamage: remaining + addNetDamage, rungsTotal, rungsLost };`

**9c.** Doc comment `:5684-5696` — append the honesty note required by doctrine #5:
```
 * KNOWN DIVERGENCES from `resolveThreatPhase`, documented rather than closed
 * (closing them moves the on-screen number for every existing foe and is its
 * own tuning change): this omits `enemyThreatMult` (:4180),
 * `state.stageThreatBonus` (:4188), `stanceCheck.mult` (:4192), `playerArmor`
 * (:4196), the SWIFT soak divisor (:4209) and BRUTAL (:4227) — so against a
 * staged, BRUTAL or SWIFT foe this UNDERSTATES. The Phase 102 add term does
 * NOT share that flaw: it runs through the same `soakFlatHit` the engine
 * applies and is exact.
```

---

### 10. Barrels (four edits, two files)

**`/home/user/Axiomancer/axiomancer-mechanics/src/Combat/index.ts`**
- functions: add `strikeAdd,` after line `180` (`    crackGlyph,`), and `ADD_WAVE_CAP, STRIKE_ADD_COST, ADD_BITE_PER_LEVEL,` alongside — inside the `export {` block that closes at `215` with `} from './combat.engine';`
- types: add `CombatAdd,` after line `169` (`    GlyphInstance, GlyphPayload,`)

**`/home/user/Axiomancer/axiomancer-mechanics/src/index.ts`**
- functions: same names after line `126` (`    crackGlyph,`)
- types: `CombatAdd,` after line `212`

Mobile imports from `@mechanics`, i.e. the `src/index.ts` barrel — a verb exported only from `Combat/index.ts` will not resolve there.

---

### 11. Sim policy

**`/home/user/Axiomancer/axiomancer-mechanics/src/Combat/combat.sim-policies.ts`** — add `strikeAddsAt?: number` with the doc block from §2 after line `110` (`crackAt?: number;`), before the interface's `}` at `111`. Then add `strikeAddsAt: 1,` beside `crackAt: 2` at `:264, :279, :306, :329, :366`.

**`/home/user/Axiomancer/axiomancer-mechanics/src/Combat/combat.encounter.sim.ts`** — insert after the `crackAt` block closes at line `452`, before the `const sources: …` declaration:

```ts
        // Phase 102 (SUMMON) — strikeAddsAt: pay only when the brood would
        // actually get through (a live wall answers it for free, which is the
        // whole second line of the design). Highest-bite add wins; ties resolve
        // to `state.adds` order — deterministic, no RNG, mirroring crackAt.
        if (policy.strikeAddsAt !== undefined && working.conviction >= STRIKE_ADD_COST) {
            const proj = projectIncomingThreat(working);
            if (proj.addNetDamage >= policy.strikeAddsAt) {
                const living = working.adds ?? [];
                if (living.length > 0) {
                    let target = living[0];
                    for (const a of living) if (a.bite > target.bite) target = a;
                    const struck = strikeAdd(working, target.id, rng);
                    if (struck.state !== working) { working = struck.state; if (working.finalOutcome) break; continue; }
                }
            }
        }
```
Import `strikeAdd`, `STRIKE_ADD_COST`, `projectIncomingThreat` from `../combat.engine` alongside the existing `crackGlyph` import.

---

### 12. The carrier

**`/home/user/Axiomancer/axiomancer-mechanics/src/Enemy/enemy.library.ts`** — insert after line `1165` (the `},` closing `procUnlocks`), before line `1166` (`loot:`), on `JeweledTree`:

```ts
    // Phase 102 — the gemstone eyes do not stay in the bark. SUMMON 2.
    // `keywords` REPLACES `defaultEnemyKeywords` wholesale (Enemy/index.ts:307),
    // so HIDE 5 is re-listed by hand to keep the retrofit from being a silent
    // nerf; the auto SWIFT is DELIBERATELY dropped — an elite carries 1-2
    // (types.ts:332-333), and the wall is now this fight's honest second line.
    keywords: [
        { kind: 'hide', n: 5 },
        { kind: 'summon', n: 2, addName: 'Brier Shoot' },
    ],
```

---

### 13. The atlas

**`/home/user/Axiomancer/axiomancer-mechanics/docs/keyword-atlas.md`**
- line `130`: `## Enemy keywords (10)` → `## Enemy keywords (11)` (hand-maintained; not generated)
- insert after line `149` (the FLURRY row), before the blank line `150`:
```
| **SUMMON N** | This foe fields N of its own. Each bites you for its printed number every phase, even while the foe is denied. | `processBetweenPhases` + `resolveThreatPhase` + `strikeAdd` | (see the roster) |
```
- insert a paragraph after line `162` (the end of the FLURRY paragraph):
```
SUMMON is the one enemy keyword that changes a fight's SIZE rather than only
its arithmetic, and it is a deliberate exception. Its brood spawns once at a
phase boundary (and once more on a STAGE), never on emptiness — clearing a wave
is progress you keep. Each add's bite is FLAT: no escalation, stage bonus,
weaken or stance term touches it, so the number on the chip is the number you
take. Your armour, GUARD and BARRIER soak it; RIPOSTE, BRUTAL, RAVENOUS, VENOM
and WOUNDING do not ride it. Denying the foe does not silence its brood, but
killing the foe ends the fight regardless of it — a deliberate divergence from
`kb:slay-the-spire-the-board-game/rules/edge-cases-faq` (src-002), where
"Summons don't 'flee' combat when the enemy that summoned them is killed."
Adds are never a win condition: clearing the brood cannot end a fight, because
`checkImmediateOutcome` reads the foe's VITAE alone. Clear them with the
dieless STRIKE action for 2 Conviction, or hold a wall and eat them.
```

The reminder-text column must match `ENEMY_KEYWORD_GLOSS` verbatim with `{n}`→`N`, or `content-drift.test.mjs` fails.

---

### 14. Mobile VM + mapper

**`/home/user/Axiomancer/axiomancer-mobile/state/presenters/combat-encounter.engine.ts`**

**14a.** New VM after line `412` (end of `CombatSealVM`), before `CombatPlayerPaneVM` at `413`:
```ts
/** Phase 102 — a renderable add. Flat and presentation-ready: the component
 *  does no arithmetic and no lookup. `affordable` mirrors the engine's own
 *  `state.conviction < STRIKE_ADD_COST` refusal so the chip can render a
 *  LOCKED state — unlike a Seal, a STRIKE can be unpayable. */
export interface CombatAddVM {
    id: string; name: string; glyph: string; color: string;
    bite: number; cost: number; affordable: boolean; previewText: string;
}
```

**14b.** Mapper after line `1407` (end of `sealsVM`):
```ts
const ADD_GLYPH = '⚭';
function addsVM(state: CombatEncounterState): CombatAddVM[] {
    return (state.adds ?? []).map(a => ({
        id: a.id, name: a.name, glyph: ADD_GLYPH, color: ENEMY_KEYWORD_COLOR,
        bite: a.bite, cost: STRIKE_ADD_COST,
        affordable: state.conviction >= STRIKE_ADD_COST,
        previewText: `Bite ${a.bite} each phase · STRIKE for ${STRIKE_ADD_COST} ◆`,
    }));
}
```

**14c.** `CombatEnemyPaneVM` (`:352-395`) — add `adds: CombatAddVM[];` after `keywords` at `:376`. `enemyPane` (`:1359-1392`) — add `adds: addsVM(state),` after line `1385` (`keywords: enemyKeywordChips(e),`).

**14d.** `selectCombatLogLines` — insert cases between line `1152` (`break;` closing `sway-decayed`) and `1153` (`default:`). `add-spawned` and `add-struck` get floats; `add-bit` gets `float: null` when `dealt === 0` (the wall held) so a fully-soaked brood does not shout.

Note the coupling at `CombatCombatantPane.tsx:563-565`: any non-null `float` automatically becomes a rising token over the **enemy** pane, and `selectCombatLogHistory`'s `default:` arm (`:1286-1293`) delegates here — one case lights both surfaces.

---

### 15. `AddChips`

**`/home/user/Axiomancer/axiomancer-mobile/components/combat/encounter/CombatCombatantPane.tsx`** — insert after line `297` (the `}` of `SealChips`), before the `// ── Player medallion` banner at `299`:

```tsx
// ── Add chips (Phase 102 — SUMMON's brood) ────────────────────────────────

/** DELIBERATELY NOT the `EffectChips` shell. `hudRight` (:762-770) already
 *  mounts two EffectChips families whose taps open an INFO plaque; an add
 *  chip's tap SPENDS Conviction. Identical shell + identical column + one tap
 *  that informs and one that costs is the real legibility failure here — not
 *  the bar. Taller square tile, a BITE badge top-left and a ◆cost badge
 *  bottom-right, a LOCKED state when the price is unpayable (a Seal has none,
 *  because `crackGlyph` is free — see :268-270). Iron grey, never the seal
 *  gold: a body the foe made is a property of the thing you are hitting, not
 *  a win track. Tap opens the confirm sheet; it never commits. */
export function AddChips({ adds, onAdd }: {
    adds: CombatAddVM[];
    onAdd?: (a: CombatAddVM) => void;
}) {
    const styles = useStyles();
    if (adds.length === 0) return null;
    return (
        <View style={styles.chipRow} pointerEvents="box-none">
            {adds.map((a) => (
                <Pressable
                    key={a.id}
                    onPress={() => onAdd?.(a)}
                    style={[styles.addChip, { borderColor: a.color }, a.affordable ? null : styles.addChipLocked]}
                    hitSlop={6}
                    testID={`combat-add-${a.id}`}
                    accessibilityRole="button"
                    accessibilityLabel={
                        `${a.name}, bites ${a.bite} each phase. Costs ${a.cost} Conviction to strike. `
                        + (a.affordable ? 'Tap to confirm.' : 'Not enough Conviction.')
                    }
                >
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: a.color, opacity: 0.16 }]} />
                    <Text style={[styles.chipGlyph, { color: a.color, textShadowColor: a.color }]}>{a.glyph}</Text>
                    <View style={styles.chipDur}><Text style={styles.chipDurText} allowFontScaling={false}>{a.bite}</Text></View>
                    <View style={styles.chipBadge}><Text style={styles.chipBadgeText} allowFontScaling={false}>◆{a.cost}</Text></View>
                </Pressable>
            ))}
        </View>
    );
}
```

Styles, after line `865` (`chipDurText`), before the `// Floats.` banner at `867`:
```ts
    addChip: {
        width: 34, height: 40, borderRadius: 3, borderWidth: 2, backgroundColor: AXM.deepBg,
        alignItems: 'center', justifyContent: 'center', overflow: 'visible',
    },
    addChipLocked: { opacity: 0.45 },
```

Mount as its **own row**, first in `hudRight`, after line `763` (`<IntentIcon intent={enemy.intent} />`), before the keyword `EffectChips` at `768`:
```tsx
                        {/* Phase 102 — the brood, its own row and its own shell
                            above the two info-plaque chip families below. */}
                        <AddChips adds={enemy.adds} onAdd={onAdd} />
```
Add `onAdd?: (a: CombatAddVM) => void;` to the pane's props and to the destructure at `:459`.

---

### 16. `CombatBoard` pass-through

**`/home/user/Axiomancer/axiomancer-mobile/components/combat/encounter/CombatBoard.tsx`**
- line `56`: add `AddChips` to the named import (not rendered here — the row lives in the pane — but the type must flow)
- `CombatBoardProps`: add `onAdd?: (a: CombatAddVM) => void;` after line `963` (`onSeal?: …`)
- **line `1001`**: add `onAdd,` to the destructure. A prop declared but missing from `1001` compiles clean and silently passes `undefined`.
- forward it to `<CombatCombatantPane … onAdd={onAdd} />`

---

### 17. Panel handler + confirm sheet

**`/home/user/Axiomancer/axiomancer-mobile/components/combat/encounter/CombatEncounterPanel.tsx`**
- line `35`: add `strikeAdd,` to the `@mechanics` import; line `57`: add `type CombatAddVM,`
- state beside line `383`: `const [addConfirm, setAddConfirm] = useState<CombatAddVM | null>(null);`
- handlers after line `636` (the `}` + deps closing `onCrackSeal`), before `onEndPhase` at `637`:
```ts
    // Phase 102 — tap an add chip -> confirm sheet; STRIKE commits `strikeAdd`
    // (dieless but PRICED); WAIT just closes. Never tap-to-spend.
    const onAdd = useCallback((a: CombatAddVM) => setAddConfirm(a), []);
    const onStrikeAdd = useCallback(() => {
        if (!addConfirm) return;
        apply((s) => strikeAdd(s, addConfirm.id).state);
        setAddConfirm(null);
    }, [apply, addConfirm]);
```
Keep the `[]` dep on the open handler and `[apply, addConfirm]` on the commit handler — `CombatBoard` is `React.memo`.
- pass `onAdd={onAdd}` beside `onSeal={onSeal}` at `:803`
- confirm sheet modelled on the seal sheet at `:983-990`, testIDs `combat-add-strike` / `combat-add-wait`. **The sheet is where the spawn rule and the price are printed** — the gloss carries bite only.

---

## 4. TESTS

### `axiomancer-mechanics/src/Combat/e2e/summon.engine.test.ts` — NEW

Vitest. Copy the header / import / fixture / helper block from `big-numbers.engine.test.ts:1-145` (fixed `const rng = (): number => 0.5;`, `makePlayer`, `makeEnemy`, `open`, `seat`) and the `findEvents<K>` helper from `glyphs.engine.test.ts:48-50`. Add a local `addState(adds, over)` helper.

**`describe('SUMMON never touches the win condition')` — THE DOCTRINE PIN**

> **`it('clearing every add never ends the combat; only the foe\'s VITAE does')`** — this is the test that mechanically pins the sole-VITAE-bar doctrine, and it is the gate on the whole phase.
>
> Open with a SUMMON 2 foe at full VITAE and a live wave. Call `strikeAdd` on both adds with enough Conviction. Assert: `state.adds` is `[]`; `state.finalOutcome` is `undefined`; `state.phase` is still `'phase-play'`; `events.filter(e => e.kind === 'combat-ended')` is empty. Then, on a state with **both** adds still alive, drop `enemy.health` to 0 via `applyEnemyDamage` and resolve — assert `finalOutcome === 'victory'` and one `combat-ended` event, i.e. a living brood cannot *prevent* a win either. Both directions in one test: an add's death is never a win, an add's life is never a stay of execution.

- `it('the brood is not a second bar: no add ever reaches state.enemy')` — after a full spawn + bite + strike cycle, `state.enemy.health`, `maxHealth` and `effects` are identical to a no-SUMMON control run on the same seed.

**`describe('spawn is a one-shot, never an emptiness check')`**
- one wave of exactly `n` adds at the first boundary; `addWavesSpawned === 1`
- clearing the wave and running three more boundaries spawns **nothing** (`addWavesSpawned` stays 1, `adds` stays `[]`) — the anti-tax pin
- a stage-firing boundary spawns wave 2; a fourth boundary does not (`ADD_WAVE_CAP`)
- a stage whose `gain` grants SUMMON spawns on the boundary it is entered (spawn runs after the stage block)
- `pending.cleanse` wipes `enemy.effects` and leaves `state.adds` intact
- spawn consumes no RNG: a seeded `processBetweenPhases` produces an identical `hand` with and without SUMMON

**`describe('the bite is flat and isolated')`**
- `add-bit.raw === sum(bite)` and is **unchanged** by `state.stageThreatBonus`, a high `state.round` (escalation), a WEAKEN stack on the foe and a stance-check multiplier — four sub-assertions against a control
- adds bite while the foe is `hindered` (stagger the telegraph to denial; `phase-resolved.mark === 'clear'` yet `add-bit.dealt > 0`)
- adds do **not** bite when `isDefeated(enemy)`
- GUARD and BARRIER soak it; SWIFT halves the wall against it; `playerArmor` subtracts once
- RIPOSTE is neither fired nor consumed by it; BRUTAL does not double it
- **RAVENOUS does not heal off it**: `enemy.health` is unchanged and no `enemy-healed` event carries the add damage
- **WOUNDING does not fire off it**: no `curse-injected` even when `dealt >= wounding.n`

**`describe('the brood does not contaminate the foe\'s ledgers')` — THE ENGINEERING GATE**
- Give a **branching, `stake: true`** foe SUMMON 1 with a living add, versus a no-adds control on the same seed. Assert, all four: (a) `next.lastThreatFullyBlocked` is identical; (b) the `threat-branch` event's `taken` fork is identical; (c) `threat-fired.effects.length` equals the authored telegraph's length (no synthetic entry); (d) a fully-blocked telegraph still yields the `coveted-die-stolen` event with `method: 'block'` **while an add is alive and biting**.
- `penaltiesApplied` length is identical to the control.

**`describe('strikeAdd')`**
- wrong phase → `expect(res.state).toBe(s)` and `events` `[]`
- unknown id → `toBe(s)`, `[]`
- underfunded → state's `adds` unchanged, `conviction` unchanged, exactly one `effect-fizzled` event, and the event **is** in `state.log` (the fizzle is visible, not silent)
- success → `conviction` drops by exactly `STRIKE_ADD_COST`, exactly one add removed, one `add-struck` event, `finalOutcome` still `undefined`

**`describe('the telegraph does not lie')`**
- `projectIncomingThreat(s).addNetDamage` **equals** the `add-bit.dealt` that `resolveThreatPhase(s)` actually applies — ~~across four states: bare, GUARD 0, GUARD > bite, and a SWIFT foe~~. This is the ship gate. **CORRECTED by burn-day audit 2026-09-19 row 3.2:** as shipped, the four states all emptied or denied the foe's telegraph, and the `SWIFT foe` state did too — which is the one configuration in which this divergence cannot appear, because the leftover wall is the whole wall on both sides. The gate was green while `addNetDamage` was wrong in 35 of 324 wall cells. It now runs a LIVE telegraph across `swift × guard{0,3,5,8,10,20,24,32,40} × barrier{0,4,6} × telegraph{0,10,30} × armor`, paired with a second case that pins the printed `totalNetDamage` to the VITAE the engine actually takes off the bar.
- `projectEnemyHealPerRound` on a RAVENOUS SUMMON foe is **unchanged** by the presence of adds (the `netDamage`/`totalNetDamage` split)
- with the boss's telegraph denied (`willDeny === true`), `netDamage === 0` but `addNetDamage > 0` — a denied turn does not read as safe

### `axiomancer-mechanics/src/Combat/e2e/big-numbers.engine.test.ts` — REGRESSION

No edit needed; the three FLURRY cases at `:408-439` must stay green unmodified. The engineering-lens gate test above is what actually protects them (`flurryFired.effects.length === 3` would have become 4 under the rejected design).

### `axiomancer-mechanics/src/Combat/e2e/combat-sim-policies.engine.test.ts` (or the nearest sim suite)

- a policy **without** `strikeAddsAt` produces zero `add-struck` events over a full SUMMON encounter — the byte-identical-default pin that `crackAt`'s doc contract demands
- a policy **with** `strikeAddsAt: 1` and a bare wall does strike; the same policy behind a wall large enough to zero `addNetDamage` does **not** — the "two lines" pin
- the flag-off `policyPlayPhase` path never strikes (the deliberately mirrored gap)

### `axiomancer-mobile/components/combat/encounter/__tests__/CombatBoard.adds.test.tsx` — NEW

Copy `CombatBoard.seal.test.tsx` verbatim in shape (jest globals imported from `@jest/globals`; two-call `withAllProviders`; real engine state via `initializeCombatEncounter` + `rollEncounterDice`, then `buildCombatViewModel({ ...s, adds })`).

- renders one chip per `state.adds` entry with the bite badge and the `◆2` cost badge (`getByTestId('combat-add-…')`)
- tapping calls `onAdd` **exactly once** with `expect.objectContaining({ id, bite, cost })`, and **not** `onChip`, **not** `onSeal`, **not** `onApply` — the tap-grammar pin
- `state.conviction < 2` renders the locked state and the a11y label ends `'Not enough Conviction.'`
- absent `state.adds` → `queryByTestId(/^combat-add-/)` is null, no crash in the HUD
- with PLEA + CHARGE + DOT meters live **and** an add row, the enemy figure's rendered `top` equals the measured HUD height − 14, not `148 − 14` — the step-1 prerequisite pin

### `axiomancer-mobile/state/presenters/__tests__/combat-log-lines.engine.test.ts`

- `add-spawned` / `add-struck` produce lines with non-null floats; `add-bit` with `dealt === 0` produces `float: null`
- `selectCombatLogHistory` renders each exactly once (no forked duplicate through the `default:` delegation)

---

## 5. THE RISK LIST

| # | What most likely breaks | Why | Gate that catches it |
|---|---|---|---|
| 1 | **Union/array drift on `EnemyKeyword`** — `ENEMY_KEYWORD_KINDS` updated but the union not, or the trailing `;` left on `flurry` | Step 3 touches five places in one file | `AssertNever<MissingFromEnemyKindList>` / `<NotAnEnemyKind>` at `enemy-keywords.ts:88-89` — fails `npm run type-check -w axiomancer-mechanics`. **Do not edit that block to "fix" it.** |
| 2 | **Mobile typecheck green in mechanics, red in mobile** — `ENEMY_KEYWORD_GLYPHS` (`combat-encounter.engine.ts:98`) missing `summon` | Cross-package exhaustive `Record` | `npm run verify -w axiomancer-mobile` — AGENTS.md's cross-package checklist matches both `src/Combat/**` and `src/Enemy/**`. Keep steps 3 and 4 adjacent. |
| 3 | **`lastThreatFullyBlocked` / coveted die / threat-branch corruption** if an implementer "simplifies" the add block back into `threatEffects` | It is the shorter-looking code, and no existing fixture fails | The four-assertion ledger-isolation test (§4) with a branching `stake: true` foe. Every existing test stays green if it regresses — this test is the only gate. |
| 4 | **Atlas / gloss drift** — count heading left at `(10)`, or a gloss key not indented exactly four spaces | `content-drift.mjs:139` matches `/^ {4}([a-z_]+):/gm`; the heading is hand-maintained | `node scripts/content-drift.test.mjs` via `.github/workflows/verify-drift.yml:17,34` — reports the atlas row as an orphan rather than pointing at the gloss, so read the gloss indentation first. |
| 5 | **Silent `undefined` prop** — `onAdd` declared in `CombatBoardProps` but absent from the `CombatBoard.tsx:1001` destructure | `React.memo` + one very long destructure line; compiles clean, chip renders, tap does nothing | The "tapping calls `onAdd` exactly once" case in `CombatBoard.adds.test.tsx`. Nothing else catches it. |
| 6 | **Seeded-RNG drift across the whole e2e + playtest matrix** if anything in the spawn block calls `rng()` | `rng` is consumed by THE CLOCK (`:4767`) and the hand refill (`:5061`); an inserted call at `4851` shifts every downstream draw | `big-numbers.engine.test.ts`, `phase-33b-enemy-archetypes.engine.test.ts`, `legibility-sweep.engine.test.ts` and the combat-playtest matrix all move at once. `spawnAddWave` is deterministic by construction — keep it that way. |
| 7 | **Projection/engine divergence** — a later change to the add soak in one place only | Two call sites for one formula | ~~The `addNetDamage === add-bit.dealt` parity test across four wall states. Both sites call `soakFlatHit`; if someone inlines one, this fails.~~ **The risk landed and the mitigation did not catch it** (burn-day audit 2026-09-19 row 3.2): a THIRD site was inlined — `projectIncomingThreat`'s own telegraph soak — and the suite stayed 32/32 green, because all four wall states emptied or denied the telegraph. The parity case now drives a live telegraph over a wall matrix and is paired with a HUD-total-vs-VITAE-lost case; the count of call sites was never the thing to watch, the coverage of the states was. |
| 8 | **The baseline moves and nobody can attribute it** | Rostering Jeweled Tree with SUMMON changes the `mid` profile's numbers, and dropping its auto SWIFT changes them again | `npm run baseline:check` must be re-stamped in the same tick, with the commit naming *both* causes. A SUMMON foe reaching the roster before `strikeAddsAt` lands produces a row that is wrong in a known direction — gate the roster entry behind the policy knob if they cannot land together. |
| 9 | **New events silently dropped** from the log, the telemetry fold and the burst roll-up | There is **no** exhaustive `CombatEvent` consumer anywhere; both mobile switches have `default:` (`:1153`, `:1286`) and `mechanicBurstDamage` (`combat.encounter.sim.ts:852-857`) is a hardcoded six-kind list | Only the log-lines presenter tests. `add-bit` is damage to the **player**, so it correctly stays out of `mechanicBurstDamage` (which credits damage to the enemy) — but confirm that deliberately rather than by omission. |
| 10 | **HUD overflow on 375×812** — a fifth row under a crest that already carries four `AltWinMeter`s | Vertical budget under the crest is spent (`CombatCombatantPane.tsx:719-751`) | Step 1 is the structural fix; the figure-anchor assertion in `CombatBoard.adds.test.tsx` is the regression gate. The add row goes in `hudRight` (`:762`), never as a fifth meter. |
| 11 | **`enemyDamageLastRound` inflation** — counting the add bite into `enemyDamageDealt` changes a ledger some cards read | Deliberate choice (HP accounting must reconcile); only affects SUMMON foes, which are new | Assert it explicitly in the bite test so it is a decision on record, not a surprise. |
| 12 | **The verb reads as dominated** — a player with a live wall never pays, so the chip is dead furniture | GUARD resets to 0 every phase (`:4508`), so the wall is a recurring card cost and the 2◆ clear is a one-time buyout — but this is a *design* bet, not a proven one | **Unmeasured.** Nothing in the KB corpus grounds a disjoint-currency add clear (prior-art lens, marked UNGROUNDED). This is the highest-risk novel element: it must be the first thing the post-ship baseline and a `/combat-playtest` run interrogate, and `strikeAddsAt`'s firing rate in the matrix is the cheapest read on it. |

---

# SHIPPED — 2026-09-19

Both sides landed: the engine per the brief, and the player-facing surface the
brief's §4 called for. The gates are green (mechanics 216 suites / 3542 tests;
mobile 308 suites / 2946 tests), and the baseline was regenerated because
mechanics source moved.

## What the player actually gets

A foe that fields bodies, and a board that says so. The Jeweled Tree now carries
`SUMMON 2` and spawns a brood of **Brier Shoots**; each one bites for a flat
number every threat phase, and each is cleared by a dieless-but-priced strike.

- **The keyword chip** prints `SUMMON 2` on the foe with its own mark (`⁙`,
  deliberately not FLURRY's asterism — FLURRY is more strikes from one body,
  SUMMON is more bodies) and a gloss that states the part the player cannot
  infer from looking: *they bite even while the foe is denied*.
- **The add chips** render one per living body on the ENEMY side of the HUD, in
  the threat register rather than the status-chip iron or the Seal gold. The
  badge is the **bite**, not the health: every shipped add is 1/1 VITAE, so a
  health badge would print the same two characters forever.
- **The strike verb** is reached by tapping a chip, which opens a STRIKE/WAIT
  confirm sheet — the same learned gesture as a Seal crack, with the one
  difference that matters: this action has a price, so the sheet quotes it, and
  the STRIKE button is *visibly refused* (never silently inert) when the player
  cannot pay.

## The defect this pass existed to prevent

`IntentIcon` printed a bare **`DENIED`** whenever `willDeny` was set, and its
a11y label said *"no damage lands"*. The engine resolves adds **outside** the
`!hindered` gate, on the deliberate principle that bodies act. So a player who
staggered a summoner read "nothing lands", ended the phase, and took the bite
anyway — a telegraph actively instructing them to make a mistake.

The readout now carries the brood's share: `DENIED →8` when the foe's own blow
is stopped but its adds are not, the combined total when both land, and the
brood's bite alone when the foe telegraphs nothing. It prints the **soaked**
number, not the printed one, through the same `soakFlatHit` the engine applies —
~~one definition, so the on-screen wall math cannot drift from the applied wall
math.~~ **CORRECTED by burn-day audit 2026-09-19 row 3.2: it drifted.** The add
term did call the shared helper, but the *leftover wall* it was handed came from
a second inline copy in the same function that dropped the SWIFT divisor and the
flat `playerArmor` soak. Measured before the fix: 35 of 324 wall cells wrong on
`addNetDamage`, 112 of 324 wrong on the printed `totalNetDamage` — a SWIFT foe
behind GUARD 40 against a 30-damage telegraph printed 3 while the engine took
18, tying the largest gap measured at 15 VITAE. Both of the projection's terms
now go through the one helper, which is what the sentence above always claimed.

`netDamage` is deliberately left meaning *"the foe's own telegraphed hit"*.
Every existing readout depends on that; the brood rides in `addNetDamage` /
`totalNetDamage` beside it rather than being folded in.

## Surface decisions — DO NOT ASK

1. **Add chips on the ENEMY pane, not the player's.** A Seal is a token of
   yours that you spend; an add is a body of theirs that you remove. Merging
   them into the status strip would file "there are two more enemies" under
   "the foe has a debuff".
2. **An unaffordable chip is dimmed, not disabled.** A chip that silently
   refuses a tap is indistinguishable from a broken one, and the confirm sheet
   is the only place the price and the shortfall can be read.
3. **The presenter forwards the bite, it never computes it.** The engine put
   the add term outside the multiplier stack precisely so the printed number is
   the applied number; a presenter that "helpfully" scaled it would reintroduce
   the drift that decision exists to make impossible. Pinned by a test that
   sets `stageThreatBonus` and `enemyThreatMult` and asserts the bite is
   unmoved.
4. **`STRIKE_ADD_COST` is imported, never restated.** A price the UI hardcodes
   is a price that drifts from the engine charging it, and the sheet quotes this
   number to the player.
5. **`AddChips` tolerates an absent array.** `state.adds` is optional on the
   engine's "absent = none" convention, and a VM cast through `unknown` (as one
   test fixture is) hands the component `undefined`. A missing brood is the
   ordinary case for every foe but one; it renders nothing rather than throwing.
   Found exactly that way — a fixture omission became a render crash.

## Engine deviations from the brief as written

One, and it is a correction rather than a shortcut. Brief §9b prescribed
`guard: Math.max(0, guard - (projectedDamage - remaining))` for the wall left
over after the boss's hit. `projectedDamage - remaining` is the total absorbed
by **riposte + guard + barrier**, so that formula charges riposte's parry and
barrier's share against GUARD — systematically understating the leftover wall
and therefore **overstating** `addNetDamage`, breaking the very parity the brief
calls its ship gate. Shipped instead as explicit `guardAbsorbed` /
`barrierAbsorbed` minimums, arithmetically identical for `netDamage` (byte
unchanged) and ~~exact for the leftover~~ — **CORRECTED by burn-day audit
2026-09-19 row 3.2: exact only for a non-SWIFT foe against an unarmored
player.** Those minimums were a third inline copy of arithmetic `soakFlatHit`
already owned, and they omitted the SWIFT divisor and the armor subtraction the
helper performs, so the leftover was overstated and the add term under-reported.
The leftover is now taken from a `soakFlatHit` call on the foe's own hit, which
also moves `netDamage` — downward for every armored player, upward for every
SWIFT foe. That movement is the correction, not a retune: it is what the engine
was applying all along.

## Pages × tests matrix

| Suite | Asserts |
|---|---|
| `Combat/e2e/summon.engine.test.ts` (27, mechanics) | the win-condition doctrine in both directions; spawn one-shot / cap / stage-grant / cleanse-survival / no-RNG; bite flatness against four multiplier terms, a hindered foe, a defeated foe, armor/GUARD/BARRIER/SWIFT, BRUTAL, RIPOSTE, RAVENOUS, WOUNDING; the four-assertion ledger-isolation gate against a control run; `strikeAdd`'s three outcomes; projection parity |
| `Combat/e2e/combat-sim-policies.engine.test.ts` (+6) | the `strikeAddsAt` roster assignment and the decision seam |
| `components/.../IntentIcon.test.tsx` (+5) | a bare DENIED survives with no brood; the bite is stated alongside DENIED and the "no damage lands" claim is gone; the TOTAL is printed when both land; the brood shows when the foe telegraphs nothing; the SOAKED number is printed, never the raw one |
| `components/.../CombatBoard.adds.test.tsx` (8, new) | one chip per body badged with its bite; NO row at all for the ordinary foe; the tap reports `onAdd` once and not `onChip`/`onApply`; an unaffordable chip still reports its tap; a11y states bite, VITAE and price; the shortfall is named when it cannot be paid; the bite is forwarded verbatim past `stageThreatBonus`/`enemyThreatMult`; the price is the engine's constant |
| `state/e2e/summon-surface.engine.test.ts` (8, new) | drives the REAL engine with a REAL summoner: the wave reaches the screen as chips; SUMMON prints as a keyword chip with its own mark and the denied-foe gloss; the wall math carries the brood separately; the brood really costs VITAE; striking removes exactly that body and charges the price; clearing the whole brood never ends the fight; short Conviction marks chips rather than hiding them; a cleared wave does not respawn |

## DoD

- [x] engine: type, keyword, spawn, bite, verb, projection, barrels, sim policy
- [x] carrier: The Jeweled Tree fields `SUMMON 2` (HIDE 5 re-listed by hand;
      auto SWIFT deliberately dropped)
- [x] surface: keyword glyph, add chips, STRIKE/WAIT confirm sheet
- [x] the DENIED lie closed, with the soaked number printed
- [x] mechanics gate green; mobile gate green; baseline regenerated
- [x] atlas updated (`Enemy keywords (10)` → `(11)`), content-drift green

## Follow-ups (out of scope)

- A **second carrier** at a different rank. One summoner is an archetype's
  proof, not its coverage.
- `projectIncomingThreat`'s six pre-existing boss-side divergences
  (`enemyThreatMult`, `stageThreatBonus`, `stanceCheck.mult`, flat armor, the
  SWIFT divisor, BRUTAL) are documented at the site, not closed. Closing them
  moves the on-screen number for every existing foe and is its own tuning
  change.
- An **add-spawn animation**. The chips appear between phases with no motion;
  the `add-spawned` event is emitted and unread by the fx layer.
