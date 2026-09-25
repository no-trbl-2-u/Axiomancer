# CROSS-PRIOR-ART — what makes themes feel distinct, and why 7 of Axiomancer's 10 don't

Auditor: mechanics-expert (SNOB lens), 2026-07-10. Topic: theme differentiation vs the
knowledge base. Inputs: `tuning-audit/dossier.md`, `tuning-audit/baseline.md`, the full
`kb/KnowledgeBase` corpus (1,692 Dawncaster cards + 141 keyword records + 10 board-game
scout dossiers), `axiomancer-mechanics/src/Cards/card-themes.ts`,
`docs/keyword-atlas.md`, and 4 fresh sim invocations (seed 1, blind, mid, 30 runs/cell,
`--cards`) on maximally-contrasting presets: `erosion`, `tithe`, `augury`, `grace`.

A housekeeping note before the verdicts: the KB's own patterns automation has produced
**zero pattern documents** (`BoardGames/patterns/` contains only `RUNLOG.md`, whose one
retroactive entry admits the first pass committed nothing). Everything below is
brute-forced from the raw corpus. The `docs/keyword-atlas.md` "Dawncaster analogues"
column is likewise empty except one BLEED receipt — this report is the harvest that
column has been waiting for.

---

## 1. The evidence: two of the "different" decks are statistical clones

Before theory, the sim witnesses. Four presets, identical harness
(`--stage=mid --policy=blind --runs=30 --seed=1 --cards`):

| preset (theme) | win | rounds | statusEng | dotFrac | dom card (HP share) | top-2 cards' share of ALL plays | win path |
|---|---|---|---|---|---|---|---|
| erosion (affliction) | 77% | 3.3 | 50% | 74% | straw-mans-jab **71%** | 1,611/3,040 = 53% | 115 vic / 35 def |
| tithe (harvest) | 51% | 3.5 | 51% | 60% | brief-candle **64%** | 2,031/3,540 = 57% | 77 vic / 73 def |
| augury (oracle) | 58% | 3.5 | 43% | 38% | glimpse 50% | 2,241/4,049 = 55% | 87 vic / 63 def |
| grace (charm) | **97%** | **6.1** | 34% | 100% | sig-conviction-strike **100%** | — | **146 CAPITULATE** / 4 def |

Reading:

- **Harvest is Affliction in a robe.** Every doctrine witness within noise of erosion
  (statusEng 51 vs 50, rounds 3.5 vs 3.3), the same behavioral shape (spam the C1
  status common: memento-mori 1,034 plays + brief-candle 997 vs straw-mans-jab 866 +
  slippery-slope 745), and the theme's hallmark payoff barely registers — `the-reaping`
  got 228 plays, a fifth of the common it's supposed to be harvesting for. The SOUL
  counter is an odometer on the same car.
- **Oracle at least has texture** — dotFrac 38% with a ~34% direct-damage share means
  OMEN payoffs actually route damage through a different pipe. It plays like a
  different deck even under a blind bot.
- **Charm is the one theme the differentiation thesis already proves**: double the
  fight length (6.1 rounds vs 3.3–3.5), a different win event in 146/150 wins, zero
  card-based HP damage (its 100% "dom" is the Conviction signature, because grace
  cards touch no HP at all). Charm is what a unique mechanical axis looks like in
  telemetry. The lesson is not "charm is done" (its late win is 0% per keyword-atlas);
  the lesson is *this* is the fingerprint every theme should leave.
- All four decks share one damning constant: **the top-2 commons are >50% of every
  play log**. Whatever the theme, the bot's experienced loop is "play your cheapest
  status common again." That is the samey-ness the owner smells.

---

## 2. What the KB says actually differentiates archetypes

Brute-forcing 1,692 Dawncaster cards, its 141-keyword glossary
(`kb:DigitalCardGames/dawncaster/keywords.csv`, wiki-sourced, confidence medium), and
the 10 board-game dossiers yields **five distinct axes** on which strong games separate
their archetypes. Axiomancer currently uses about one and a half of them.

### Axis A — a unique resource with its own bank rules

Dawncaster gives nearly every archetype a private currency with private accounting:
**Souls** (persist across combats; "when you die with over 100 souls collected, revive
and lose all Souls" — the resource carries its own resurrection clause),
**Performance** (a *song*: "Performance counts the progress of your currently active
song. While no song is active, your Performance is 0"), **Chain/Tides** ("Chain fades
if a played card did not increase Chain… only one side can enjoy the High Tide"),
**Blood/Corruption** ("Sacrifice your own blood instead of Energy"; "If your deck
contains 4 or more Corruptions, you become Corrupted, which unlocks special effects"),
**Zeal** (damage boost that damages you every turn), **Momentum** (at 5, cash for a
draw). Receipts: `keywords/souls.okf.md`, `performance.okf.md`, `chain.okf.md`,
`tides.okf.md`, `blood.okf.md`, `corruption.okf.md`, `zeal.okf.md`, `momentum.okf.md`.
The differentiating part is never the *number*; it is the **bank rules** — what feeds
it, what leaks it, what happens at the threshold, whether it survives the combat.
Axiomancer's SOUL and PREMISE are both "integer goes up, spend at N" — identical bank
rules, different fonts.

Board-game confirmation: Spirit Island's spirits differentiate through **element
affinities** — the same card pool triggers different innate thresholds per spirit
("combinations of power cards that match a spirit's elemental affinities can grant
free bonus effects", `kb:BoardGames/games/spirit-island/rules/actions.okf.md`). Aeon's
End differentiates mages through **breach geometry** — the slots you cast from are the
archetype (`kb:BoardGames/games/aeons-end/rules/actions.okf.md`).

### Axis B — a unique trigger grammar (WHEN, not how much)

The single most transferable finding. Dawncaster's DoT family is never "same tick,
different name" — **each affliction fires on a different clock**:

| affliction | trigger clock | extra clause |
|---|---|---|
| Burning | end of turn | plain rent |
| Poison | **after playing a card** | + anti-heal ("when gaining Health, prevent 1 per stack") |
| Bleeding | **when dealt damage**, then decays | punishes acting into it |
| Doom | end of turn, **grows +1 per Action played** | the victim's own tempo feeds it |
| Brittle | one-shot **on melee damage** | burst amplifier, self-removes |
| Infected | **whenever you discard** | removed entirely on any heal |
| Stagger (their DoT) | start of turn, half decays | front-loaded rent |

(receipts: `keywords/burning.okf.md`, `poison.okf.md`, `bleeding.okf.md`,
`doom.okf.md`, `brittle.okf.md`, `infected.okf.md`, `stagger.okf.md`.) A status-centric
game avoids samey-ness by making each status a different *sentence structure*, so the
counterplay differs: you sit still against Bleeding, you stop drawing against Infected,
you race Doom. Axiomancer's POISON (ramp) vs BLEED (decay) is the same clock with the
slope flipped — one axis-B distinction in the whole 30-keyword registry.

The same grammar powers Dawncaster's **condition keywords**, which are archetype
identity worn on the card frame: Ambush ("first card played of the round"), Finale
("2 or fewer cards remaining in hand"), Flow ("after playing at least X cards this
turn"), Cascade ("after a card that costs 1 more or 1 less"), Continuity ("after a
card of the same type"), Frenzy ("you've taken damage during your turn"), Unscathed
("no damage during the enemy turn"), Ancestral ("4 or more cards in your Discard
Pile"), Scholar ("deck contained 20+ cards at start of combat"), Balance/Order (deck
and HP parity!). Each archetype reads hand/deck/turn state through its own lens, so
**sequencing** — not target selection — becomes the puzzle.

### Axis C — a unique win/loss vector

Dawncaster's Charmed is Axiomancer's SWAY, verbatim prior art: "Lose the battle if
your Health is less than your Charmed stack. When dealt non-Piercing damage, remove an
equal amount of Charmed" (`keywords/charmed.okf.md`) — note the built-in tension:
*damaging the charm target erases your own progress*, which is exactly the rule that
would make Axiomancer's charm deck refuse to splash DoTs. Other win-vector keywords:
Deep Wound ("a target who has sustained 5 or more Deep Wounds is instantly slain"),
Reaping ("lowers the target's **Maximum Health** equal to the damage it deals"),
Execute/Slay/Overkill (kill-condition riders: exactly 0 HP vs negative HP matter).
Root is the board-game maximum of this axis: "each player in Root has unique
capabilities and **a different victory condition**"
(`kb:BoardGames/games/root/rules/overview.okf.md`), and its reception dossier is
equally instructive about the cost — the friction is *epistemic*, opponents' engines
are opaque (`root/reception/better-if.okf.md`). For a single-player game the cost
mostly vanishes: only the player's own engine must be learned per deck.

### Axis D — a unique card frame / deck-physics rule

Dawncaster's cost vector is 9-dimensional (`cards.csv`: dex/int/str/holy/neutral/
hybrid×3/**blood**) — an archetype can be "the deck that pays costs in HP" at the
frame level. Frame keywords: Charges ("played X times per combat before Depleted"),
Persistent (doesn't discard), Memorized ("always starts at the top of your deck"),
Imprint/Mergecraft (cards that eat other cards), Lasting ("extended by 1 turn whenever
the card is played again"), Rebound ("counts the number of times you played the card,
and triggers its special effect when played X times") — receipts under
`keywords/`. Board-game versions: Aeon's End's **no-shuffle discard order** ("it makes
the player responsible for future luck," `aeons-end/scout-report.okf.md`), Dune
Imperium's dual-use cards ("a route, a resource, and a withheld threat,"
`dune-imperium/scout-report.okf.md`), Heat's **speed-as-debt** ("players may push now,
but the deck remembers," `heat-pedal-to-the-metal/scout-report.okf.md`), Mage Knight's
cards-as-multiple-currencies. Axiomancer's frame is rigidly uniform: every card is
FREE-top/PAID-bottom, spell/enchant/disenchant, recycles forever (no fatigue, dossier
§4). Ten themes, one physics.

### Axis E — payoff cadence: turns-to-spike must differ by archetype

The bard package is the KB's cleanest cadence design: Perform builds a song, dozens of
riders read the count, and **Finale keys off hand position, not turn count** — the
spike is *where you put the card in the turn*, e.g. Crossbow "Deal 2 damage. **Ambush
OR Finale**: Add a Snare to your foe's deck" (`cards/0444-crossbow-219377.okf.md`),
Crescendo "If you are currently Performing, Perform 6 **and start a new performance**"
(`cards/0440-crescendo-966546.okf.md` — a cash-out that reboots the engine). Contrast
cadences in the same game: Doom is a *victim-paced* ramp ("Increase Doom by 1 each
time an Action is played"); Souls are a *multi-combat* accumulator with milestone
payoffs — Damnation "Repeat for every 5 Souls"; Dark End "Slay a foe with less Maximum
HEALTH than your Souls" (`cards/0467-damnation-268495.okf.md`,
`cards/0479-dark-end-382215.okf.md`); the Aries' Reflection chain is an in-run **quest
ladder** ("After you Foretell 6 or more cards in a turn…", II at 12 in a single turn,
III at 24 total — `cards/0100..0102`). Quacks contributes the round-shaped cadence:
push-your-luck where "failure is not a turn loss; it is a forced choice between
present score and future engine," and its scout report already addresses this repo:
"For Axiomancer, make risk pools legible and mutable… comeback mechanics should grant
position in the next contest, not charity points from heaven"
(`the-quacks-of-quedlinburg/scout-report.okf.md`). In Axiomancer, per baseline, fights
are 2–4 rounds and every theme's de-facto cadence is "tick until dead" — there is no
spike to pace because RUPTURE/REAP/PERORATION rarely out-value another common
(the-reaping: 228 plays vs 2,031 for the two commons).

---

## 3. Differentiation matrix — theme × mechanical axis

Grades: **UNIQUE** = an axis no other theme occupies, functioning in sims; *(paper)* =
unique in the rules text but dead or degenerate in telemetry; SHARED = occupies the
axis with others; — = flavor only.

| theme | A: resource | B: trigger grammar | C: win vector | D: frame/deck physics | E: cadence shape | verdict |
|---|---|---|---|---|---|---|
| affliction | SHARED (DoT fuel) | SHARED (ramp/decay slope only) | SHARED (HP) | — | tick-until-dead | **The baseline engine.** Fine — someone must be vanilla. |
| peroration | UNIQUE *(paper)* PREMISE tally | — | UNIQUE *(paper)* CONCEDE — **0 fires in ~1,290 baseline fights** | — | declared-threshold burst | Real identity, dead in play; a tuning corpse, not a design one. |
| forge | UNIQUE *(paper)* dice/pips | — | SHARED (HP) | UNIQUE-ish (only theme that touches dice physics) | one overwhelming turn | Axis exists; **no uncapped spender** (atlas: mid/late 0%). Fix is arithmetic, not identity. |
| akrasia | UNIQUE-ish (HP as cost — Dawncaster Blood) | FALLEN threshold state (= Corrupted, `corruption.okf.md`) | SHARED | — (blood-cost frame not surfaced) | debt-then-payoff | Second-most-distinct theme on paper; frame under-expressed. |
| control | — | UNIQUE (rung denial reads the telegraph) | SHARED | — | lock-and-drip | Distinct axis, degenerately strong (atlas: flat 100%, curve violator). |
| oracle | — | UNIQUE (OMEN = declared prediction) | SHARED | FORETELL touches deck order (weak D) | prediction→collect | Has texture (sim: dotFrac 38%, distinct damage pipe). Keep, deepen. |
| harvest | SHARED — SOUL is PREMISE with skulls | SHARED (expiry listener) | SHARED (HP) | — | tick-until-dead + odometer | **Sim-proven clone of affliction** (§1). Most in need. |
| charm | SWAY (unique bank: decays, enemy-side) | — | **UNIQUE (proven: 146/150 capitulate)** | — | threshold race | The existence proof. Late-game reach still broken (atlas). |
| bulwark | — | SHARED (reactive on-hit) | SHARED (HP via reflect only) | — | wall-and-wait | Distinct *verb*, same cadence; **cannot kill non-attackers** (dossier §4). |
| echo | — | — (ECHO is an adverb, not a trigger) | SHARED | REPRISE touches discard (weak D) | more-of-the-same | **A multiplier in search of a thing to multiply.** No noun of its own. |

Count the functioning UNIQUE cells: charm's win vector. One. Everything else is
paper-unique, degenerate, or shared. Ten themes, five axes, one occupied cell — that
is the audit in a sentence.

---

## 4. The three themes most in need of a unique axis, with KB-cited steals

Forge, peroration, and control are excluded from this list deliberately: their unique
axes already exist in the rules and fail only in tuning (no pip spender; CONCEDE
unreachable; STAGGER flat-100%). Those are work items for the balance auditors. The
themes below have **no functioning axis to tune** — they need design, not numbers.

### 4.1 HARVEST — steal the Souls economy whole (bank rules + max-HP vector + kill riders)

Today SOUL is an expiry odometer feeding REAP, a burst that loses to just playing
another common (§1). Dawncaster's Orange/ritualist package shows what the axis should
be — three steals, in priority order:

1. **REAP attacks Maximum HP, not current HP.** Dawncaster Reaping: "lowers the
   target's **Maximum Health** equal to the damage it deals"
   (`keywords/reaping.okf.md`). This makes harvest the *only* theme whose damage
   compounds with the escalation clock instead of racing it — shrinking the bar is a
   different sentence than draining it, visibly distinct on the enemy frame, and it
   finally gives a DoT-adjacent deck a late-game answer to 1,000-HP bosses (the
   atlas's "rebuild-cycle wall") without touching the RUPTURE cap.
2. **Souls persist across combats, with a milestone ladder.** Dawncaster Souls carry
   their own resurrection clause at 100 (`keywords/souls.okf.md`) and cards read the
   running total: Damnation "Repeat for every 5 Souls… Execute: Lose all your Souls
   and gain that much HEALTH" (`cards/0467`), Dark End "Slay a foe with less Maximum
   HEALTH than your Souls" (`cards/0479`), Corrosive Spirits "Ancestral: Repeat this
   for every 10 of your Souls" (`cards/0423`). A cross-combat bank makes harvest the
   *campaign-scale* theme — no other theme owns that clock (floating dice already
   prove cross-combat state is engine-legal, dossier §4).
3. **Kill-condition riders.** Execute/Slay/Overkill (`keywords/execute.okf.md`,
   `slay.okf.md`, `overkill.okf.md`) — "how the enemy dies" as a resource. Overkill
   damage converting to Souls gives the reaper a reason to time the killing tick,
   the first decision the theme would ever ask.

### 4.2 ECHO — steal the song: Perform/Finale cadence + Rebound self-counting

ECHO ("the printed line fires twice") is an adverb — it makes any deck's plays
bigger and therefore makes no deck distinct. The KB's repetition archetypes all attach
repetition to a **noun with state**:

1. **The song (Performance/Perform/Finale).** "Performance counts the progress of
   your currently active song; while no song is active, your Performance is 0"
   (`keywords/performance.okf.md`, `perform.okf.md`); Finale triggers at "2 or fewer
   cards remaining in hand" (`keywords/finale.okf.md`); Crescendo cashes out AND
   restarts (`cards/0440`). For echo ("nothing is said once" — a *refrain* is
   literally a song structure, the flavor is begging for it): a REFRAIN tally that
   grows on consecutive same-color plays, is read by riders, and **breaks to zero**
   when the chain breaks — Chain's fade rule ("fades if a played card did not increase
   Chain," `keywords/chain.okf.md`) is the tension the theme lacks. Hand-position
   triggers (Ambush/Finale) give it intra-turn sequencing no other theme has.
2. **Rebound — the card that counts itself.** "Rebound counts the number of times you
   played the card, and triggers its special effect when the card has been played X
   number of times" (`keywords/rebound.okf.md`; live on Grievous Injury,
   `cards/0764`). With REPRISE fishing cards back from discard, per-card play-counters
   make replaying *the same card* a build-around — circular-reasoning and ad-nauseam
   are sitting right there, currently dead (never played across the entire baseline
   matrix).
3. **Lasting** ("effects extended by 1 turn whenever the card is played again,"
   `keywords/lasting.okf.md`) — the glue verb: echoed/reprised enchants refresh
   instead of duplicating, which is what would finally make the timed FREE-line
   enchant instances (spec 32 v4) matter to a theme.

### 4.3 BULWARK — steal reactive trigger grammar + the bust economy, so the wall can win

Bulwark's verbs are distinct but its clock is everyone's clock, and it cannot kill
what doesn't attack (dossier §4 late-wall list). Three steals:

1. **Frenzy/Unscathed grammar** — "triggers when you've taken damage during your
   turn" / "you've taken no damage during the enemy turn"
   (`keywords/frenzy.okf.md`, `unscathed.okf.md`). Bulwark should read the damage
   ledger the way oracle reads the telegraph: riders gated on "you blocked fully" vs
   "you let it through" turn each enemy phase into a stance choice. RIPOSTE already
   half-exists here; generalize it into the theme's sentence structure.
2. **Insight's exact-block puzzle** — "whenever you are dealt an amount of non-Piercing
   damage **exactly the same as** your current Insight, prevent that damage"
   (`keywords/insight.okf.md`). Guard as a dial to match against a telegraphed number
   (which the threat system already prints!) converts turtling from an accumulation
   into a prediction minigame — and marries bulwark to the read mechanic the baseline
   proved worthless (greedy=blind).
3. **The bust economy for over-block.** Quacks: "failure is not a turn loss; it is a
   forced choice between present score and future engine"
   (`the-quacks-of-quedlinburg/scout-report.okf.md`). Overblocked damage (Guard minus
   the hit) should bank into a Bulwark resource that converts to RIPOSTE burst or
   Barrier next round — Heat's "speed-as-debt: the deck remembers"
   (`heat-pedal-to-the-metal/scout-report.okf.md`) inverted into patience-as-credit.
   That gives the wall a kill path fed by the enemy's own escalation clock: the harder
   the boss swings, the more the wall banks — the fantasy the preset table promises
   ("let their own aggression kill them") and the engine never delivers.

---

## 5. Bonus finding — the KB answer to the owner's FREE/PAID complaint

The owner wants the "weak chip FREE line OR real PAID effect" fork dead. Dawncaster's
whole conditional grammar is the replacement pattern: **one effect plus a
condition-amplified rider on the same card** — Crossbow: "Deal 2 damage. Ambush OR
Finale: Add a Snare" (`cards/0444`); Flourishing Bow: "Gain 1 Evasion. Inflict 5
Charmed. Finale: Perform 2" (`cards/0676`); Battle Axe: "Deal 5. Bloodlust
[requires enemy Bleeding]: Inflict a Critical Hit" (`keywords/bloodlust.okf.md`).
The free/weak line isn't a separate chip — it is the *setup state* the amplified line
checks. Mapped to Axiomancer: make the FREE line lay a named condition (a Premise, a
Mark, a rung, a Soul-seed) and the PAID line check it (per-theme trigger grammar from
Axis B). This kills the fork AND is the same instrument that fixes theme samey-ness —
two owner complaints, one pattern. Board-game reinforcement: Dune Imperium's dual-use
cards ("a route, a resource, and a withheld threat") prove one card can carry two
values without either being a token drip.

---

## 6. Sim receipts (this report's 4 invocations)

```
npm run combat-playtest -- --stage=mid --policy=blind --deck=preset:erosion --runs=30 --seed=1 --cards
npm run combat-playtest -- --stage=mid --policy=blind --deck=preset:tithe   --runs=30 --seed=1 --cards
npm run combat-playtest -- --stage=mid --policy=blind --deck=preset:augury  --runs=30 --seed=1 --cards
npm run combat-playtest -- --stage=mid --policy=blind --deck=preset:grace   --runs=30 --seed=1 --cards
```

Headline cells quoted in §1. Notable raw moments: tithe's hallmark finisher
`the-reaping` at 228 plays vs 2,031 for its two commons; grace's dom column reading
`100%(sig-conviction-strike)` — even the deck that never strikes kills exclusively via
the signature button while SWAY does the real work; augury's `strike` column at
33–36%, the only preset whose damage leaves the DoT pipe (OMEN payoffs land as direct
hits — worth an accounting audit, since spec 32 says the strike is dead).

## 7. SNOB verdict

The corpus is unambiguous: archetype identity is bought with **bank rules, trigger
clocks, win vectors, frame physics, and cadence shapes** — never with keyword
synonyms. Axiomancer bought ten wardrobe changes and one actual mechanic (charm), and
the telemetry shows players would experience precisely that: every non-charm deck
converges on "play the cheap status common again" with the top-2 cards absorbing more
than half of all plays. The good news is structural: the engine already supports
cross-combat state (floating dice), threshold states (FALLEN), declared predictions
(OMEN), and an enemy-side win meter (SWAY) — every steal in §4 composes from parts the
codebase has already proven, under the owner-locked dice law, without resurrecting the
strike. What is missing is not machinery; it is the conviction that each theme deserves
its own sentence structure. Dawncaster wrote 141 keywords and made each affliction tick
on a different clock. Axiomancer wrote 30 and made two of them the same clock with the
slope flipped.
