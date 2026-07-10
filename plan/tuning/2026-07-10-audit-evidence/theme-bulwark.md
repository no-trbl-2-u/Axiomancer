# THEME AUDIT — BULWARK (preset: `bastion`) — "the wall that never gets tested"

Auditor: mechanics-expert (SNOB lens), 2026-07-10. Part of the tuning-audit fan-out.
Read after `tuning-audit/dossier.md` and `tuning-audit/baseline.md`.

Sims used (4 of 6 budget):
1. `npm run combat -- --auto --policy status --stage early --deck preset:bastion --seed 3 --max-turns 14` (Little Belle, 40 HP)
2. `npm run combat -- --auto --policy status --stage mid --deck preset:bastion --seed 5 --enemy tri-eyes --max-turns 14` (`--enemy` passed explicitly per baseline caveat #1)
3. `npm run combat-playtest -- --stage=early --policy=blind --deck=preset:bastion --runs=30 --seed=1 --cards`
4. `npm run combat-playtest -- --stage=mid --policy=blind --deck=preset:bastion --runs=30 --seed=1 --cards`

Baseline caveat #2 stands: auto mode emits only `hazardCombat:start/end`, so "read the
transcript line by line" is physically impossible — I read the per-card attribution
blocks and the seeded matrix instead, and I flag the observability gap again because it
is worst for THIS theme: bulwark's supposed drama (the blow arrives, the wall holds,
the riposte answers) happens entirely inside the threat phase that no tool can show.

---

## 1. The kit on paper (cards.library.ts:1202-1339)

| card | rank | aspect | FREE line | PAID line |
|---|---|---|---|---|
| brace-for-impact ×4 | Doxa (starter) | body | guard 2 | GUARD 8 (`cards.library.ts:1216-1217`) |
| nettle-cloak ×4 | Lemma | body | guard 2 | THORNS i2 d2 self + Nettle Sting i1 d2 on enemy (1238-1241) |
| tu-quoque ×2 | Thesis | **heart** | guard 2 | THORNS i3 d2 + dieBonus `onColor:'body'` guard 2 (1259-1260) |
| measured-answer ×2 | Theorem | body | guard 3 | GUARD 6 + RIPOSTE 3/parry 2 (1278) |
| the-adamant-wall ×1 | Axiom | body | guard 3 | BARRIER 10 + RIPOSTE 4/parry 2 (1296), tagged `payoff` |
| hedgehogs-dilemma ×1 | Axiom (E) | body | timed 3-round instance | permanent: every THORNS trigger also MARKs the enemy (engine.ts:2391-2396) |
| crumbling-resolve ×1 | Aporia (D) | body | timed 3-round instance | permanent: full block strips a rung (engine.ts:2427) + "Wall Upkeep" drip `max(4, 0.2×(guard+barrier))`/phase (engine.ts:2436-2441) |

Supporting effects: `buff_thorns` reflects **1 per stack, once per phase** the enemy
attacked (buffs.library.json:4-19, engine.ts:2383-2389); `debuff_nettle_sting` is a
**non-decaying 2/round DoT** on the enemy (debuffs.library.json:992-1010); RIPOSTE
counters only on a FULL block, once per phase, flat 3-4 (engine.ts:2373-2381), and the
armed riposte is **cleared every phase** (engine.ts:2465) so it must be re-cast the
same turn it's meant to fire.

Read those numbers again. The theme's two HALLMARKS produce, at full deployment:
thorns 3 + riposte 4 + upkeep drip 4 ≈ **11 damage per phase**, against mid enemies
with 300-500 HP who kill this deck in 3-4 rounds. The hallmarks are rounding error.

## 2. As played — the transcripts and the matrix

### Early (seed 3, Little Belle): the tank never tanks

> Outcome: Victory · Player HP: **90/90** · Phases: 2
> Nettle Cloak: 176 DoT · Conviction Strike: **624 DoT** · Direct damage: 30

Victory at full health in two phases. THORNS and RIPOSTE — the theme's identity —
**never fired a meaningful point** (30 direct damage total, most of it Wall Upkeep).
The wall was built and nobody ever walked into it. The early matrix agrees: 100% wins
across all six enemies (doctrine target ~80%), 2.4 avg rounds, and the harness's own
spam alarm trips — **dom = 88% (nettle-cloak)**, well past the legend's ">70% = spam"
line. Early bastion is a poison deck that spends five of its seven card designs on a
wall no enemy lives long enough to touch.

### Mid (seed 5, tri-eyes, status policy): the wall fails to wall

> Outcome: Defeat · Player HP: **0/255** · Enemy HP: 143/375 · Phases: 5
> Conviction Strike: 3024 DoT of 3084 (**98%**) · Nettle Cloak: 60 · Direct damage: 32

Five phases spent stacking guard behind an escalation clock that multiplies threat
damage ×(1+0.22/round); guard 8 and barrier 10 are static numbers racing an exponential.
The deck's entire hallmark output for the fight — thorns + riposte + upkeep — was **32
damage** against a 375 HP enemy. (Attribution is ordinal per baseline caveat #3, but
the ordering is unambiguous.)

### The mid matrix is not a curve, it is a coin with no flip

| enemy | win | rounds | statusEng | dom |
|---|---|---|---|---|
| tri-eyes | **100%** | 4.9 | 27% | 89% |
| mirac | **0%** | 4.0 | 26% | 88% |
| hasshaku-sama | **0%** | 4.0 | 26% | 80% |
| jeweled-tree | **0%** | 4.0 | 26% | 83% |
| rawhead-rex | **0%** | 3.0 | 25% | 80% |

Stage win 20% against a ~50% doctrine target — and it is not a 50% made of tense
fights; it is one free matchup and four executions with **zero variance in 30 seeded
runs each**. Compare the baseline's generic blind policy-pick deck at the same stage:
mirac 97%, hasshaku 100%, jeweled-tree 100%, rawhead 73%. **The defense-specialist
preset is strictly worse at not dying than a generic pile.** A Bulwark that loses the
survival contest to erosion's leftovers has no identity at all — it is Wildfrost's
Shademancer being out-tanked by the tutorial deck.

### Doctrine witness: the least fun deck in the game, by the game's own metric

statusEngagement 29% early / 26% mid — versus the all-deck blind baseline of 66%/34%.
CLAUDE.md says "treat low status-effect engagement as a balance failure even when
win/loss rates look healthy." Bastion's plays are ~73% statusless guard-stacking. The
per-card table is brutal: across 440+ fights, **nettle-cloak is the only card that ever
lands a status** (912 statusLands mid; every other card: 0). Instrumentation caveat:
self-applied `buff_thorns` doesn't count as a statusLand, which shades the number
slightly — but guard verbs genuinely apply nothing, and they are the deck.

## 3. Verdicts

**Identity as played:** a poison deck in a shield costume. Nettle Sting's non-decaying
tick plus the Conviction Strike signature do all the killing; guard/thorns/riposte are
under 11 damage per phase of set dressing that early enemies die too fast to trigger
and mid enemies walk straight through.

**Nearest neighbor:** affliction (`erosion`) — degraded. Both win by "apply a DoT,
wait" — erosion just has more DoTs, MARK amplification it can use, and a RUPTURE
finisher. Bastion is erosion with one status card and no detonator.

**Where the player thinks:** almost nowhere, and the dice law makes it worse. Six of
seven card designs are body-aspect (`cards.library.ts`); under THE COLOR LAW the draft
— the one decision the locked dice law gives the player every round — has a solved
answer: *take body or pass*. Roll no body/wild and the entire PAID hand is bricked;
that turn was decided by the roll, not the player. The single heart card (tu-quoque) is
a draft trap: spend your one die on heart and everything else in hand goes dark.

**The latent puzzle nobody can play:** the engine already contains a genuinely good
decision — RIPOSTE's full-block gate (engine.ts:2373-2381) plus crumbling-resolve's
rung-strip (engine.ts:2427) reward *oversizing* guard against the right telegraphed
hit. That is a real StS-style block-sizing minigame (block exactly enough vs overshoot
to fish the counter). It is currently unplayable for three reasons: the payoff is a
flat 3-4 damage (invisible); the riposte disarms every phase so timing it needs
telegraph damage math the UI never shows; and the sims prove information is worthless
here anyway (baseline: greedy = blind at every stage). Spirit Island's own KB entry
warns exactly this: "new players may overvalue direct damage and undervalue
push/gather/**defend timing**" (BoardGames/games/spirit-island/rules/actions.okf.md:66)
— defend timing must be made *visibly lucrative* or nobody does it.

**Setup→payoff arc:** none. Bastion is the **only preset with no burst verb** — erosion
has RUPTURE, tithe has REAP, foundry has the-overtake, even oracle ruptures. Bulwark's
family utilities are GUARD/BARRIER/HEAL (dossier §3). the-adamant-wall is tagged
`payoff` (cards.library.ts:1298) but is just a bigger wall with a 4-damage counter.
hedgehogs-dilemma converts thorns triggers into MARK stacks — afflictions begging for a
consumer — and the deck ships **no RUPTURE and no TICK** to spend them. The theme
builds a bank and never gets to rob it. The keyword-atlas late wall ("Bulwark cannot
kill non-attackers") was patched with crumbling-resolve's 4/phase upkeep drip
(engine.ts:2428-2441) — a band-aid that reads as nothing and feels like less.

**Confirmed dead line:** `tu-quoque` (heart card) carries `dieBonus: { onColor:
'body', rider: { guard: 2 } }` (cards.library.ts:1260). Under the color law a heart
card can only be powered by heart or wild — the body rider is unfireable. Already
lint-whitelisted per dossier §4; still shipping.

**The FREE/PAID fork here:** every spell's FREE line is `guard: 2-3` — not a damage
chip, but the same disease: a token drip of the paid effect (guard 2 against mid hits
of 20+ is a wet napkin). 26% of brace-for-impact's early plays were the FREE line (106
of 407) — a quarter of the deck's most-drawn card doing approximately nothing. The
owner's signal ("FREE should lay foundation for PAID payoffs") has an unusually clean
answer in this theme, because a wall is *literally* a foundation — see P2.

**Prior art (KB):** Dawncaster's **Reflect** — "return the NEXT damage dealt to you to
the attacker... fades at start of your turn" (DigitalCardGames/dawncaster/keywords.csv,
keywords/reflect.okf.md) — is a one-shot, full-value, timed counter: reflect the big
hit, not a 1-per-stack drip. Its reflect cards package the trigger with scaling
(Dragon Scales: Armor + Persistent + tempValue, cards/0554; Retribution: Reflect +
Lifedrain, cards/1213). StS (board game KB: slay-the-spire-the-board-game/rules/
actions.okf.md — Skills block, Powers persist) solved "defense deck vs non-attackers"
a decade ago with Body Slam / Barricade / Juggernaut: **block is a resource with a
spender**. Bastion has the resource and no spender.

### Scores

- **Distinctiveness as played: 3/10.** As flavored, the only tank in the roster; as
  played, a worse erosion whose five defensive card designs contribute ~11 dmg/phase.
- **Engagement: 2/10.** Lowest statusEngagement measured (26-29% vs 66% baseline),
  zero-variance scripted mid losses, a solved draft, no spike, no arc. The one
  interesting decision in the kit is invisible and pays 3 damage.

## 4. Proposals (respect strike-is-dead, the locked dice law, and the FREE/PAID signal)

### P1 — `TOPPLE` — give the wall a spender (the missing payoff verb) — **M**
New bulwark-scoped keyword on a reworked `the-adamant-wall` PAID line (it already wears
the `payoff` tag under false pretenses): *consume ALL standing Guard + Barrier; the
enemy takes reflect-class damage equal to the amount consumed* (cap mirrors RUPTURE:
max(80, 25% maxHP)). Doctrine-clean: it is the THORNS/RIPOSTE reflect channel — the
wall's stored prevention finally answering — not a resurrected strike. Every turn
becomes grow-the-bank vs cash-and-stand-naked, the exact Body Slam/Barricade tension
(StS, KB above), and it kills non-attackers honestly, letting the Wall Upkeep band-aid
(engine.ts:2436) be retired or reduced. Also gives hedgehog's MARK stacks a friend:
TOPPLE after 4 thorns-marks is a felt spike.

### P2 — FREE lines lay bricks, not chips — **S/M**
Theme-wide, per the owner signal: replace every bulwark `free: { guard: 2 }` with
**FREE: +2 BARRIER** (persistent, the existing keyword — no new engine work). FREE
plays now compound across turns into the same bank PAID lines protect and P1 spends —
the FREE line is literally the foundation of the PAID payoff. Tune amounts down (+1/+2)
if barrier accretion tests too safe; the point is *persistence*, not size.

### P3 — RIPOSTE reflects the blow, not a constant — **M**
Rework RIPOSTE N: *when your Guard/Barrier fully blocks an attack, reflect N× the
prevented damage of that attack* (N = 0.5 / 1.0 by rank; per-phase, capped like
RUPTURE). Dawncaster's Reflect returns the actual hit and is beloved for it
(keywords/reflect.okf.md); a flat 3 is furniture. Consequences: the escalation clock
becomes bulwark's ramp (they swing harder → the counter hits harder — the late-game
wall fixes itself); the full-block gate becomes a visible wager (overshoot guard on
the RIGHT phase); and the stance read / `sig-read-opponent` / FORETELL finally have a
customer in this deck — the first mechanical reason for the greedy-vs-blind gap to be
nonzero anywhere in the game.

### P4 — Un-brick tu-quoque and un-solve the draft — **S**
Fix the dead line (cards.library.ts:1260): the `onColor:'body'` rider on a heart card
cannot fire. Make tu-quoque's heart identity real: PAID = *reflect 1 stack of the last
debuff the enemy applied to you back at them* (mirror-of-guilt-lite, on-color with "you
also"), keeping THORNS i3. Now the heart die is a live draft choice instead of a trap,
and the deck has two real colors — under the locked one-die law, a second live color is
the difference between a decision and a die roll.

### P5 — Show the wall math (UX) — **S**
The block-sizing minigame P1/P3 create requires arithmetic the player can see: on the
telegraph, render *projected incoming damage vs current guard+barrier* with a
full-block indicator (and riposte-armed badge). The engine knows all of it at
telegraph time; the interactive loop already narrates phases (combat.cli.ts). Without
this, P3's wager is bookkeeping; with it, it is the "intuitive puzzle" the owner asked
for. (And fix the auto-transcript gap — this theme's entire drama is currently
invisible to every audit tool.)

---

*Bottom line: the engine team already built the interesting deck — full-block gates,
rung erosion, thorns-to-MARK conversion — and then priced every payoff at 3-4 damage
and hid it inside a phase no one can watch. Bulwark doesn't need a redesign; it needs
its bank to open a spending account.*
