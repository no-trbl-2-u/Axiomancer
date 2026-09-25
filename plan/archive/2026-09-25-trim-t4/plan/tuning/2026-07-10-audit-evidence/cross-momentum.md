# CROSS-AUDIT: Should "MOMENTUM" be scoped to a deck theme? (2026-07-10)

Auditor: mechanics-expert (SNOB lens). Sources: live code cited by file:line,
`tuning-audit/dossier.md`, `tuning-audit/baseline.md`, KB prior art
(Dawncaster keyword corpus, BoardGames). Zero sim invocations — this is a
vocabulary-scoping question and the baseline already contains the one
empirical fact that matters (see §2.3).

---

## Verdict up front

**No. Momentum should not be scoped to a deck theme, and it should not enter
card combat at all.** The word already has a coherent, taught, player-facing
meaning in the Hazard minigame (carry surplus across rounds), and card combat
already ships THREE unnamed carry-over mechanics that would fight a fourth
for the same psychological beat. The charm buff that squats on the name
(`buff_grace_momentum`) rides a card that has never once been played in
1,290 simulated fights — rename it for the cost of a JSON string and the
collision evaporates. Details and the committed recommendation in §6.

---

## 1. The two momentums, as actually implemented

### 1.1 Hazard v2: momentum = banked carry-over (the physics-intuitive sense)

- Surplus progress on a cleared round carries **half, capped at
  `HAZARD_MOMENTUM_CAP = 3`** into the next round (REC#1) —
  `src/World/Hazard/hazard.engine.ts:15-16`, carry math at
  `hazard.engine.ts:773` (`momentumCarry`), cap constant
  `hazard.tuning.ts:33` / exported at `hazard.tuning.ts:234`.
- A whole card ecology is built ON it: **ANCHOR** sets a momentum FLOOR
  ("you carry at least this much into the next round, even off a failed
  round" — `hazard.content.ts:59`, four ANCHOR cards at
  `hazard.content.ts:332`, floor plumbing `hazard.types.ts:605-606`);
  **SAINT'S PATIENCE** raises the per-session momentum cap by 2
  (`hazard.content.ts:189`, `hazard.tuning.ts:130`); **CHAIN CURRENT**'s
  flavor is literally "Momentum compounds without asking permission"
  (`hazard.content.ts:370`).
- It is **taught vocabulary**: a codex/quest entry `id: 'momentum'`, name
  `MOMENTUM`, "Carry surplus momentum into a later round," with a shilling
  reward (`hazard.content.ts:501`), tracked as `momentumCarries` in quest
  metrics (`hazard.types.ts:406-407`), test-pinned in
  `e2e/hazard.engine.test.ts:552` and `e2e/hazard.codex.engine.test.ts:262-270`.

This is a complete, load-bearing subsystem with a cap, a floor, cap-raisers,
a codex lesson, and a quest metric. Hazard owns this word the way Dominion
owns "Village."

### 1.2 Charm: "Grace Momentum" = compounding multiplier (the snowball sense)

- `buff_grace_momentum` (`src/Effects/buffs.library.json:943-960`): intensity
  stacking, `outgoingSwayGainMulPct: 12`, duration 99. Player-visible name:
  **"Grace Momentum."**
- Stacks +1 at each turn boundary the player holds SWAY under
  `irresistible-grace`'s decay immunity, capped at
  `GRACE_MOMENTUM_MAX_STACKS = 9` (`combat.engine.ts:2721-2742`).
- Read by `gainSway`: every SWAY gain × (1 + 0.12 × stacks)
  (`combat.engine.ts:772-783`); also applies to `mirror-of-longing`'s
  prevented-damage-to-SWAY conversion (`combat.engine.ts:2421`).

These are **different rules wearing the same name**. Hazard momentum is
*conservation* (surplus is not wasted); Grace Momentum is *escalation* (a
streak compounds). A player who earned the hazard codex reward for
"momentum" has learned a definition that the combat buff actively
contradicts.

### 1.3 The third, silent momentum: the design guardrail

`src/Game/game-mechanics.constants.ts:100` explicitly designs AGAINST
"cross-combat momentum" for stance tokens — the codebase itself uses the
word as a hazard-sense concept even in comments. Meanwhile combat's one
sanctioned cross-combat carry is FORGE floating dice (dossier §4). The word
is doing three jobs in one repo.

---

## 2. Is this a vocabulary collision? Yes — but an asymmetric, cheap one

1. **Same word, two rule meanings, one player.** Hazard rounds and card
   combats interleave on the same map session. MTG's keyword discipline
   exists precisely because keywords are contracts: when Wizards reuses a
   word ("Landfall") it means the same thing on every card. Dawncaster —
   the closest genre neighbor in the KB — prints exactly ONE game-wide
   Momentum: "Whenever you have 5 or more Momentum, remove all stacks and
   draw a card" (`kb/KnowledgeBase/DigitalCardGames/dawncaster/keywords/momentum.okf.md`,
   ordinal 88, Blessing). One word, one rule. Axiomancer currently fails
   that bar.
2. **The severity is asymmetric.** Hazard's momentum is codex-taught,
   quest-rewarded, and structurally load-bearing. Grace Momentum is one
   buff name on one tier-2 enchantment.
3. **The empirical kicker (baseline §"One card carries every stage"):**
   `irresistible-grace` is on the dead-card list — **never played by any of
   the eight sampled policies across ~1,290 fights.** The colliding combat
   usage of "momentum" is, as measured, content zero players have
   encountered. There will never be a cheaper moment to rename it.

---

## 3. What would a player-facing "momentum" mean in card combat?

Three candidate senses, each of which turns out to be pre-empted:

### 3.1 Carry-over across rounds (the hazard sense)

Combat already has **three** unnamed carry-over ladders (dossier §4):

| existing mechanic | what carries | escalates? |
|---|---|---|
| Reserve dice | unspent drafted die → next turns | ripens +1 pip/threat phase (cap 2) |
| Conviction ◆ | unpicked dice → signature economy | cap 12; income doubled under 3-die law |
| Floating dice (FORGE) | persist across turns AND combats | no; consumed forever |

A fourth carry-over currency **named** momentum would be redundant
vocabulary on a resource stack already five deep (add Resonance and pips).
The baseline's diagnosis is that combat has too little *decision*, not too
little *currency*. Naming a fourth bank does not make the other three
matter.

### 3.2 Chain bonuses within a turn (the combo sense)

This one is genuinely live: the self-reinforcing chain (a new status
refreshes the applied die; RUPTURE/REACT also refresh — dossier §4,
owner-kept per HANDOFF-2026-07-09 line 40) IS a within-turn momentum
mechanic. It is also **invisible and unnamed**, which is a legibility
crime the UI audit should prosecute. But naming it "Momentum" would put a
loud, core-loop usage of the word directly against hazard's round-carry
sense — a *worse* collision than today's obscure buff. MTG named its
plays-this-turn counter **Storm**, not Momentum; the precedent is to name
the chain something evocative and unique. (In this game's rhetorical voice:
FERVOR, or CADENCE — noting `practiced-cadence` already exists as an
oratory card, so FERVOR is cleaner.)

### 3.3 Escalating dice (the stored-energy sense)

Already shipped as Forge's **PIP** hallmark plus Reserve ripening. Forge's
fantasy ("manufacture dice, ripen the pips, one overwhelming turn" —
dossier §3) is momentum-as-stored-kinetic-energy in all but name. Renaming
PIP to MOMENTUM would trade a precise word for a vaguer one.

---

## 4. Theme-fit analysis (if it HAD to live somewhere)

- **Echo (`refrain`)** — best fit. "Nothing is said once: echo, reprise,
  replay — small effects, multiplied relentlessly" is compounding
  repetition; Dawncaster's Momentum (threshold-reset draw engine) is
  closest in spirit to ECHO/REPRISE loops. If a spec-33 expansion ever
  wants a combat momentum keyword, Echo is the address.
- **Forge (`foundry`)** — thematic fit (stored energy) but mechanically
  saturated: PIP + ripening already occupy the slot.
- **Akrasia (`penitent`)** — poor fit. Akrasia's fantasy is the FAILURE of
  will (RECOIL, FALLEN, debt); "momentum" flatters exactly the
  self-mastery akrasia lacks. A "downhill slide" reading exists but is a
  stretch the theme doesn't need.
- **Charm (`grace`)** — the incumbent by accident. The buff's own
  description ("Every round your resolve holds unshaken, it argues harder
  than the last" — `buffs.library.json:945`) doesn't even say momentum; it
  says *unshaken resolve compounding*. The name is lazier than the design.

Hard constraint on ALL theme-scoping options: **spec 32's registry is
locked at 30 keywords** (10 utility + 2 hallmarks × 10 themes; dossier §2).
A player-facing MOMENTUM keyword is a 31st keyword — registry surgery, new
atlas entry, lint updates, preset re-audit — for a concept three existing
mechanics already deliver.

---

## 5. Prior art (KB-sourced)

- **Dawncaster** — one game-wide Momentum keyword, single meaning
  (threshold-reset card draw), Blessing type
  (`kb/.../dawncaster/keywords/momentum.okf.md`). Lesson: one word, one rule.
- **Heat: Pedal to the Metal** — "who crosses first and how far beyond the
  line they can carry momentum"
  (`kb/.../heat-pedal-to-the-metal/rules/scoring-endgame.okf.md:51`).
  Momentum-as-carried-surplus is the intuitive board-game meaning — i.e.
  **hazard's usage is the canonically "correct" one**; it has the stronger
  claim to the word.
- **Dominion** — "momentum" is how the community *describes* a functioning
  engine; the game never prints it. Emergent feel, not a rules term. The
  strongest engines make momentum something you *sense*, not something you
  count.
- **Monster Train / Slay the Spire** — compounding stack mechanics get
  specific names (Rage, Frostbite ramps; Demon Form, Catalyst). Neither
  game spends the generic word "momentum" on a rule; both save generic
  words for UI/flavor.
- **MTG Storm** — the within-turn chain counter, named uniquely. The
  correct template if Axiomancer ever surfaces its die-refresh chain.

---

## 6. Scoping options and the commitment

| option | shape | cost | verdict |
|---|---|---|---|
| **A. Global combat system** | Momentum meter (chain counter / carry bank) across all themes | 31st keyword; 4th carry currency on a 5-deep resource stack; dilutes theme identity; collides loudly with hazard | REJECT — treats a legibility problem with inventory |
| **B. One theme's hallmark (Echo)** | MOMENTUM as Echo family keyword ("repeat plays compound") | Registry surgery (hallmarks locked at 2/theme); Echo already FAILS the decay curve (dossier §4 — `refrain` 1.00/1.00/0.92) and needs a nerf, not a new toy; collision persists | REJECT for now; Echo is the address IF spec 33 ever expands the registry |
| **C. Shared utility keyword (echo/forge/charm)** | MOMENTUM as 11th utility | Worst of A and B: registry break AND blurred meaning across three fantasies | REJECT |
| **D. Keep it out of combat; hazard keeps exclusive title; rename the grace buff** | `buff_grace_momentum` → `buff_unshaken_grace` ("Unshaken Grace"); vocab guard so combat never prints "momentum" | One JSON entry + ~6 engine/comment refs + flavor prose untouched; zero rules churn; zero players affected (card never played) | **COMMIT** |

### Committed recommendation

**Option D.** Momentum stays a Hazard-minigame term exclusively — it is
codex-taught, quest-rewarded, mechanically complete there, and matches the
word's intuitive (Heat-style) meaning. Rename `buff_grace_momentum` to
`buff_unshaken_grace` (display: "Unshaken Grace"), which is both more
precise and better prose than the current name — the buff's own description
already says "resolve holds unshaken." Do NOT add a momentum keyword to
card combat: the carry-over sense is triple-served (Reserve/Conviction/
floats), the stored-energy sense is PIP, and the within-turn chain — the
one genuinely under-served sense — deserves its own unique, in-voice name
(FERVOR suggested) as part of the chain-legibility work, explicitly not
"momentum." Flavor prose may still say "gathering momentum"
(`cards.library.ts:1174,1194` can stand) — flavor is not a keyword, and
policing prose would be pedantry even by my standards.

### Work items

1. **Rename** `buff_grace_momentum` → `buff_unshaken_grace` in
   `src/Effects/buffs.library.json:943` (+ name "Unshaken Grace"), all refs
   in `combat.engine.ts` (772-783, 2421, 2721-2742), the comment in
   `cards.library.ts:1178`, and any save-migration shim if effect ids are
   persisted mid-combat. (S)
2. **Vocabulary guard**: note in `docs/keyword-atlas.md` that MOMENTUM is
   reserved Hazard vocabulary; extend the existing card-lint (the one that
   whitelists `tu-quoque`) to reject `momentum` in combat card
   names/keywords/effect display names. (S)
3. **Chain legibility (separate lens, flagged to the UI/engagement
   auditor)**: name and surface the die-refresh chain (per-turn chain
   counter in events + transcript, e.g. FERVOR) — the game's best
   turn-level rule is currently invisible; MTG Storm is the naming
   template. (M)
4. **Riding observation for the card auditor**: `irresistible-grace` — the
   buff's only source — is on the baseline dead-card list (never played in
   ~1,290 fights). The rename should land alongside whatever fixes make the
   card exist at all.
