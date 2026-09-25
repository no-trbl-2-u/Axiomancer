# KEYWORD-LANGUAGE AUDIT — the 30-keyword registry as a thing a player must read

Auditor: mechanics-expert (SNOB lens), 2026-07-10. Companion to
`tuning-audit/dossier.md` and `tuning-audit/baseline.md` (numbers cited from there;
no new sims were needed — this is a language audit, and the corpse was already on the table).

Sources examined: `axiomancer-mechanics/src/Cards/card-themes.ts`,
`src/Cards/cards.library.ts` (all 70 cards, keyword-projected by script),
`src/Combat/combat.cards.ts` (face text projection), `src/Effects/debuffs.library.json`,
`specs/32-no-strike-card-library.md` §3, `docs/keyword-atlas.md`,
`axiomancer-mobile/state/combat/keywords.ts` (KEYWORD_GLOSS rewrite),
`plan/HANDOFF-2026-07-09-dice-law-rework.md`, and the Dawncaster corpus
(`kb/KnowledgeBase/DigitalCardGames/dawncaster/cards.json` — 1,692 cards,
`keywords.json` — 141 curated keywords).

---

## Verdict up front

The registry is not "30 keywords." It is **32 registered keywords (the mobile gloss
quietly grew past the spec), plus 2 card-type labels, plus at least 7 unregistered
system nouns (Conviction, Resonance, Reserve, floating, pips, rungs, WILD/X), plus
6 smuggled DoT species with no keyword at all, plus 20 cards (29% of the library)
whose faces speak free prose instead of the registry.** The player-facing language is
roughly **45 terms wide over 70 cards** — about **2.5 cards of support per keyword at
the median**, where Dawncaster runs **12** and Slay the Spire teaches ~16 terms across
350+ cards. The vocabulary is bigger than the library earns, and — worse for an
"intuitive puzzle" — it is *dishonest*: the words the player learns are not the words
the engine speaks. Half of the registry (15 of 32) lives on ≤2 cards; one keyword
(CONJURE) lives on zero. Meanwhile the single highest-damage entity in the entire game
(`sig-conviction-strike`, 90–95% of all damage in baseline transcripts) speaks POISON —
a hallmark that appears on exactly **two** library cards.

The fix is not "delete keywords until the number is pretty." Per-deck reading load is
actually acceptable (~10–12 terms per self-contained preset — the theme structure is
doing its job). The fix is a **merge/fold/rename pass that makes every printed word
true, every engine mechanic printable, and every near-synonym pair distinct** — landing
at ~27 honest keywords with minimum real support.

---

## 1. Density: what the library actually earns

### Measured support per keyword (script projection over all 70 cards)

Spell-face support (effect ids via `EFFECT_KEYWORD`, mechanic kinds via
`MECHANIC_KEYWORD`, FREE-line fields; enchant/curse prose excluded — see §4):

| tier | keyword → # cards |
|---|---|
| Load-bearing (≥4) | DRAW 12 · GUARD 12 · TICK 10 · MARK 6 · BLEED 5 · RUPTURE 5 · SOUL 5 · SWAY 5 · HEAL 5 · PREMISE 4 · STAGGER 4 · FORETELL 4 · ECHO 4 |
| Thin (3) | REPRISE 3 · FORGE 3 · BACKFIRE 3 · FALLEN 3 (only 1 on a spell face) |
| Fragile (2) | **POISON 2** · PIP 2 · RECOIL 2 · OMEN 2 · REAP 2 · RAPPORT 2 · THORNS 2 · RIPOSTE 2 |
| Orphans (1) | FESTER 1 · TRANSMUTE 1 · PERORATION 1 · KINDLE 1 · CLEANSE 1 · BARRIER 1 |
| Ghost (0) | **CONJURE 0** |

15 of 32 keywords have ≤2 supporting cards. Median support ≈ 2.5.

### Prior-art calibration (KB, receipts inline)

- **Dawncaster** (`kb/.../dawncaster/keywords.json` + `cards.json`): 141 curated
  keywords over 1,692 cards. Measured against `observed_terms`: the median curated
  keyword appears on **12 cards** (mean 19.4); only **8 of 141 (6%)** live on exactly
  one card. Dawncaster tolerates a big vocabulary because each word is *drilled* —
  Conjure alone appears on 101 cards. Axiomancer registers a Dawncaster-sized
  *rate* of vocabulary (1 keyword per 2.2 cards vs their 1 per 12) with none of the
  drilling.
- **Slay the Spire**: ~16 player-facing keywords/terms (Exhaust, Ethereal, Innate,
  Retain, Unplayable, Block, Weak, Vulnerable, Frail, Poison, Strength, Dexterity,
  Artifact, Intangible, X-cost, Scry) across 350+ cards — every one supported by
  dozens of cards and drilled from Act 1.
- **Dominion** ships whole expansions on 1–3 new keywords. **Wildfrost** icons its
  ~2-dozen terms and still gets accused of opacity in reviews.

The defensible reading: Axiomancer's *per-preset* vocabulary (10 utility + 2 hallmarks
+ system nouns ≈ 12–14 terms) is genre-normal for a starter deck. What is NOT normal is
paying registry cost for words with 0–2 supports, running synonym pairs in the shared
utility tier that every player must read, and speaking a second, unregistered language
underneath (§3–4).

---

## 2. Near-synonym pairs a player will conflate

Ranked by expected confusion damage:

1. **TICK vs POISON/BLEED — critical, and doctrinally doomed anyway.** TICK is an
   *operator* on DoTs ("your strongest DoT deals its per-round damage now"), but the
   word "tick" is also the unit verb inside the POISON, BLEED, and MARK glosses
   (`keywords.ts:174-179`). A face reading "◇ TICK · 1" reads as *a small DoT*, not
   *an accelerator*. Ten of the fifty spells carry `free: { tickOne: true }` — this is
   **exactly the "weak chip FREE line" the owner ordered killed** (design signal,
   HANDOFF-2026-07-09 §DESIGN SIGNAL; trigger card slippery-slope,
   `cards.library.ts:46-47`). When the FREE-fork rework lands, TICK's entire surface
   (10 of its 10 appearances are FREE lines) evaporates. Retire the keyword with the
   fork rather than renaming it.
2. **GUARD vs BARRIER — one concept, two words, one card.** BARRIER ("as Guard, but
   persists") exists on exactly one card, `the-adamant-wall`. Twelve cards say GUARD.
   No genre peer spends a top-tier keyword on the persistence variant: StS has Block
   (Barricade is a *card*), Monster Train's Armor just persists. A player meeting
   BARRIER once, in one preset, will read it as a GUARD typo. Merge: print
   "GUARD 6 — persists" on the one card, retire BARRIER from the registry.
3. **ECHO vs REPRISE (vs replay_last) — same semantic field, three behaviors.** ECHO
   = this line fires twice; REPRISE = fetch cards from discard; `replay_last`
   (ouroboros) = replay a *different* card — and the presentation layer maps
   replay_last to **Echo** anyway (`keywords.ts:144-147`), a documented white lie.
   "Reprise" literally means *repeat* — the discard-fetch meaning is the one thing the
   word doesn't say. Rename REPRISE → **RECALL** (memory metaphor, distinct field);
   keep ECHO; let ouroboros speak one honest rules line (it is a 1-of rare — Dawncaster
   leaves 406 of 874 observed terms as card-local text; one-card mechanics do not need
   registry entries).
4. **FESTER — a name that lies about its category.** FESTER means "+N turns duration
   to all your DoTs" (`keywords.ts:190-192`) but the word denotes an infected wound —
   every player will read it as *another DoT*, the exact confusion the six smuggled
   DoTs (§3) already create. Rename → **PROLONG** (or LINGER).
5. **TRANSMUTE — one word, two owners.** The mobile registry gave TRANSMUTE to
   `convert_dots` (bleed↔poison flip, `keywords.ts:152,193-195`); the handoff and spec
   language call the `float_x_die` X→WILD conversion "TRANSMUTE" (HANDOFF §2), while
   the mechanics face text prints that as FORGE (`combat.cards.ts:207`). Two mechanics
   are currently competing for the same word across layers. Pick one owner: keep the
   die-conversion inside FORGE (the mechanics layer already does), and rename the DoT
   flip — the card's own flavor line gifts the name: **REARGUE** ("the same wound,
   re-argued").
6. **FORETELL vs OMEN — related but defensible.** Scry+reveal vs declared wager;
   distinct decisions, both worth a word — this is StS Scry beside a bet mechanic. The
   hazard is OMEN's gloss, currently the most complicated sentence in the registry
   (`keywords.ts:230-232`: die-color cast against hidden next stance, fires at phase
   boundary). Keep both keywords; simplify OMEN's gloss to "predict the enemy's next
   stance with the die you spend; right = the payoff fires free" and let the UI carry
   the resolution details.
7. **THORNS vs RIPOSTE vs BACKFIRE — three punish verbs, three triggers.** Defensible
   because they live in different presets (bulwark ×2, control), but the glosses must
   lead with the *trigger*, not the damage, or they blur into one "they hurt themselves"
   soup. Current glosses mostly do this. No merge; wording discipline only.
8. **KINDLE vs FORGE — same verb, different zone and lifetime.** Forged = permanent
   floating; Kindled = combat-only Reserve. The flavor opposition (forged endures,
   kindled burns out) is genuinely good — but KINDLE has ONE card
   (`sketch-of-a-thought`) plus a rider on a reap card, which is not enough repetition
   to teach a zone distinction. Keep both words only if the forge theme gets ≥3 KINDLE
   carriers (card-audit lane); otherwise fold KINDLE into FORGE with a "(this combat)"
   tag.

---

## 3. The smuggled second language: six DoT species with no keyword

Spec 32 §3 closes with a purge: *"Retired… burn, hemorrhage, septic… **and all DoT
clones**."* The library then immediately smuggled six DoT clones back in under new
names — the exact ids the handoff flags as unmapped (HANDOFF §OPEN item 5). Pulled
from `src/Effects/debuffs.library.json`:

| effect id | payload (verified) | what it actually is | cards carrying it |
|---|---|---|---|
| `debuff_argument_wound` | DoT 2/round, `escalatesPerTurn` ramp 0.5, end-tick | **POISON** with a different tick phase | exordium, opening-statement, mounting-case (×3) |
| `debuff_echo_sting` | DoT 1/round, escalating ramp 0.5, end-tick | **POISON**, smaller | refrain |
| `debuff_kindling_ember` | DoT 1/round, flat, no modifiers | a flat DoT — **a profile with no keyword at all** | sketch-of-a-thought |
| `debuff_nettle_sting` | DoT 2/round, flat (`decaysPerTick: false`), end-tick | flat DoT again | nettle-cloak |
| `debuff_foretold_wound` | DoT 1/round **+ `tickAmplifyFlat: 1`** | a **POISON+MARK hybrid** in one id | glimpse, cassandras-burden (×2) |
| `debuff_backfire_acute` | `backfirePerRung: 3` | literally **BACKFIRE at intensity 3** | paralysis-of-analysis |

Nine card-instances across seven cards apply afflictions the player has no word for —
they render as the ambiguous "◆ DIE" face the handoff complains about, and in the
combat log they surface as lore names (Argument Wound, Nettle Sting…) that the
glossary cannot define. **The player-facing claim "exactly 2 DoT species, POISON and
BLEED" is false; the engine runs at least 6.** And the flagship irony: POISON — the
hallmark of the flagship theme, the payload of the signature that deals 90–95% of all
measured damage (baseline §1d) — appears on exactly TWO library cards, while its
unregistered clones appear on six.

Fold, don't promote:

- `argument_wound`, `echo_sting` → reprint as **POISON** (keep the lore *name* as
  flavor if desired; keyword and math unify). POISON support rises 2 → 6.
- `backfire_acute` → delete; author `debuff_backfire` at intensity 3.
- `foretold_wound` → split the payload into POISON 1 + MARK 1 (two words the player
  already knows beats one word they don't).
- `kindling_ember`, `nettle_sting` → retune to the POISON or BLEED profile per card
  (owner picks direction per card; no new flat-DoT keyword for 2 cards).

---

## 4. The prose annex: 20 of 70 cards don't speak the language at all

Every enchantment and disenchant (10 + 10 = 29% of the library) carries zero registry
keywords on its face — `persistentEffect` is free prose ("Every bleed or poison you
apply lands at +1 intensity", `cards.library.ts:153`). Eight of those twenty strings
additionally *under-state* their engine hook (HANDOFF §OPEN item 4: crown-of-thorns
scales +1..+4, crumbling-resolve's drip formula, irresistible-grace's compounding
multiplier, fated-course FORCING the telegraph…).

This is the homogenization engine nobody notices: the 30-keyword registry only
actually governs the 50 spells. A quarter of the deck a player drafts is written in a
second, unregulated dialect — and per baseline, the enchant/curse layer is precisely
where the dead cards live (bootstrap-loop, crown-of-thorns, irresistible-grace,
mirror-of-longing, the-oracles-eye never touched by any sampled policy).

Rule to adopt: **a persistentEffect string must name the registry keyword(s) it
modifies, in caps** — "your POISON and BLEED land at +1 intensity", "every ECHO or
REPRISE drips 2" (resonant-chamber and stuck-in-their-head already comply,
`cards.library.ts:1457,1474`; make it a lint, not a habit).

---

## 5. Hallmarks vs homogenization: do the themes read?

Hallmark presence on each preset's 5 spell faces (script-verified):

| theme | hallmark coverage | reading |
|---|---|---|
| control | 5/5 (STAGGER 4, BACKFIRE 3) | identity delivered |
| charm | 5/5 (SWAY 5, RAPPORT 2) | identity delivered |
| oracle | 5/5 (FORETELL 4, OMEN 2) | identity delivered |
| harvest | 5/5 (SOUL 5, REAP 2) | identity delivered |
| echo | 5/5 (ECHO 3, REPRISE 2) | identity delivered |
| bulwark | 4/5 (THORNS 2, RIPOSTE 2) | fine; brace-for-impact is pure GUARD |
| peroration | 4/5 (PREMISE 4, PERORATION 1) | PREMISE carries it; PERORATION is one card |
| akrasia | 3/5 (RECOIL 2, FALLEN 1 spell) | soft; FALLEN mostly lives in enchant prose |
| forge | 3/5 (KINDLE 1, PIP 2) | weak — the "dice engine" theme barely prints its own verbs |
| **affliction** | **2/5 (POISON 1 in-theme, BLEED 1)** | **the flagship theme's faces are mostly TICK/FESTER/TRANSMUTE/DRAW/RUPTURE glue** |

So the hallmark *plan* mostly works — seven of ten themes print their identity. The
homogenizers are real but specific: **DRAW (12), GUARD (12) and TICK (10) are the
three most-printed words in the game**, and TICK is a FREE-line chip on four different
themes' cards (affliction, peroration, akrasia, oracle, harvest). Combined with the
baseline finding that one Conviction signature out-damages the whole library, the felt
experience is: *every deck draws, guards, and ticks; the theme words are seasoning.*
The FREE-fork rework (owner signal) is therefore also a **language** rework: the FREE
line is where the vocabulary is most generic, and it is the line every player reads
most often.

Special dishonor: the family table itself lies. `card-themes.ts:43-53` claims
CLEANSE for affliction and akrasia (zero cards in either theme cleanse — the only
CLEANSE in the game is a rider on charm's the-olive-branch, `cards.library.ts:1131`)
and RUPTURE for harvest (no harvest card ruptures). The catalog search feature built
on this table will return empty sets for advertised family members.

---

## 6. Registry drift: three sources of truth, all different

- **Spec 32 §3** says exactly 30 keywords and still defines SWAY's capitulation as
  "SWAY ≥ enemy's current HP" — stale since the 2026-07-08 resolve-threshold rework
  (dossier §4). The atlas SWAY row repeats the stale rule (`keyword-atlas.md:56`).
- **`keywords.ts`** (mobile) ships **32** — FESTER and TRANSMUTE added 2026-07-10 with
  an explicit doctrine amendment in a code comment (`keywords.ts:4-13`: "every mechanic
  is a terse, learnable KEYWORD" now outranks "the count is exactly 30"). The spec was
  never amended.
- **`docs/keyword-atlas.md`** still lists 30 rows, has its proving-gate scoreboard at
  `????` for all ten utility keywords, and its entire reason to exist — the Dawncaster
  prior-art cache — is filled in for exactly **1 of 30 rows** (BLEED). The cache
  column is a promise nobody kept; with a 1,692-card corpus sitting in `kb/`, that is
  not a data problem, it is a discipline problem.

Meanwhile the *actual* registry — the thing that decides what a face prints — is
scattered across four maps in two repos (`EFFECT_KEYWORD` + `MECHANIC_KEYWORD` +
`VERB_KEYWORD` in mobile, `mechanicText` in mechanics), with no lint asserting parity.
That is how six effect ids went unmapped and how TRANSMUTE got double-booked.

And beneath all of it, the **unregistered system vocabulary** the player must still
read: Conviction (three cards *grant* it via FREE lines with no keyword —
bootstrap-loop, ex-nihilo, against-my-judgment), Resonance thresholds (SIX cards print
a bare "⬡ MIND ×3 spent: …" glyph line, `combat.cards.ts:294-295` — more supports than
80% of the registry, zero glossary presence), rungs, pips, Reserve, floating, WILD/X.
Spec 32 §3 declares these "systems, not card keywords" — fine, but the overlay
glossary must still define them somewhere the player can find.

---

## 7. Handoff open items, adjudicated

| item | ruling |
|---|---|
| 6 unmapped effect ids | Fold into POISON / BLEED / MARK / BACKFIRE per §3 above. No new keywords. |
| `consume_affliction` (winnowing, delphic-ambiguity) | Currently masquerades as SOUL (`keywords.ts:137`), hiding the consume. Do NOT mint CONSUME — **extend RUPTURE to `RUPTURE N`** ("consume up to N afflictions; finishers consume ALL"). Reuses the game's best-known payoff verb, unifies the eat-afflictions space (RUPTURE/REAP/SOUL already border it), and the Soul gain stays a printed rider. |
| `siphon` (resonance-detonation, the-reaping) | **Promote to SIPHON N%** ("heal for N% of the damage this play deals"). Lifesteal is genre-bedrock, two supports exist plus bone-orchard's drain hook is adjacent, and it gives akrasia/harvest a sustain word. Currently prints lowercase `siphon 40%` with no gloss (`combat.cards.ts:205`). |
| `replay_last` (ouroboros) | Do NOT promote; do NOT map to Echo. One-card rare = card-local rules text ("Replay the last spell you cast"). Remove the Echo mapping at `keywords.ts:147` so the word ECHO never claims a behavior it doesn't have. |
| `tu-quoque` dead dieBonus | Out of scope here (card audit), but note: the fix should also drop its THORNS support to 1 if the card is redesigned — watch the fragile tier. |

---

## 8. THE TARGET REGISTRY (proposed, ~27 + system glossary)

Utility (8): DRAW · FORGE · GUARD *(absorbs BARRIER as a "persists" tag)* ·
MARK · CLEANSE · HEAL · **RUPTURE N** *(absorbs consume_affliction; ALL on finishers)* ·
**SIPHON N%** *(promoted)*.
Retired from utility: **TICK** (dies with the FREE-fork rework — its 10 supports are
all the weak-chip FREE lines the owner condemned), **BARRIER** (merged), **CONJURE**
(zero cards; re-admit if Thoughtform cards ever ship — the echo family table promises
it and the library never delivers).

Hallmarks (19): POISON *(support 2→6 via the §3 fold)* · BLEED · PREMISE ·
KINDLE *(conditional: forge theme must reach ≥3 carriers or fold into FORGE)* · PIP ·
RECOIL · FALLEN · STAGGER · BACKFIRE · FORETELL · OMEN *(gloss simplified)* · SOUL ·
REAP · SWAY · RAPPORT · THORNS · RIPOSTE · ECHO · **RECALL** *(née REPRISE)*.
Demoted: **PERORATION** → rules text on the-closing-word (one card; the PREMISE gloss
already explains the payoff trigger). Peroration-the-theme keeps its name; the
*keyword* was redundant with its only card.

Renames: FESTER → **PROLONG**; TRANSMUTE → **REARGUE** (frees TRANSMUTE, which the
handoff/spec vocabulary can keep for the X→WILD die conversion inside FORGE's gloss,
or drop entirely).

System glossary (NOT keywords, but must be player-visible in the overlay legend):
CONVICTION ◆ · RESONANCE ⬡ (threshold lines) · RESERVE & PIPS · FLOATING ✦ ·
RUNGS · WILD/X. Six threshold cards and three Conviction-granting FREE lines currently
print symbols with no definition anywhere.

Net: 32 → 27 registered keywords, minimum support 2, no zero-support entries, no
same-field synonym pairs in the shared tier, every engine-applied affliction printable.
The count lands near the original 30 — the point was never the number; it was that
every word be earned and true.

---

## 9. Work items (concrete, ordered)

1. **Fold the six unmapped debuffs into registry keywords** — retune/replace
   `debuff_argument_wound`, `debuff_echo_sting` (→ POISON), `debuff_backfire_acute`
   (→ BACKFIRE i3), `debuff_foretold_wound` (→ POISON+MARK split),
   `debuff_kindling_ember` / `debuff_nettle_sting` (→ POISON or BLEED profile, owner
   picks per card); regenerate the deprecated-ids ban list. Files:
   `src/Effects/debuffs.library.json`, `cards.library.ts` (7 cards), pricing comments.
2. **Merge/retire pass**: BARRIER→GUARD("persists") on the-adamant-wall; retire
   CONJURE; demote PERORATION to card text; extend RUPTURE→RUPTURE N and re-express
   `consume_affliction` through it. Files: spec 32 §3, `keywords.ts`,
   `combat.cards.ts`, `card-themes.ts`, keyword-atlas.
3. **Rename pass**: FESTER→PROLONG, TRANSMUTE→REARGUE, REPRISE→RECALL; delete the
   `replay_last`→Echo mapping (ouroboros gets card-local text); promote SIPHON N% with
   a gloss. One session, all four maps + gloss + atlas in the same PR.
4. **Retire TICK inside the FREE-fork rework** (owner-signal session): replace the ten
   `free: { tickOne }` lines with theme-foundation FREE verbs (MARK 1 / +1 Premise /
   SOUL 1 / PROLONG 1 …) so the FREE line teaches the theme instead of chipping.
   This is the language half of the owner's "bogging the game down" directive.
5. **Keyword-reach lint for persistent cards**: every `persistentEffect` string must
   name ≥1 registry keyword in caps; fix the 8 under-stating strings from the handoff
   audit in the same pass. Files: `cards.library.ts` (20 cards), new lint beside the
   pricing lint.
6. **Single-source the registry**: move the canonical keyword table into
   axiomancer-mechanics (one module), generate/parity-lint the mobile
   `EFFECT_KEYWORD`/`MECHANIC_KEYWORD` maps and the atlas row set against it; amend
   spec 32 §3 (count + stale SWAY rule) and fix the atlas SWAY row; fix the
   THEME_KEYWORDS family lies (`card-themes.ts:43-53` — CLEANSE×2, RUPTURE/harvest).
7. **Systems-glossary panel**: add CONVICTION / RESONANCE / RESERVE+PIPS / FLOATING /
   RUNGS / WILD-X entries to the detail-overlay legend (the color-law legend already
   exists as the anchor point). Zero engine work.
8. **Do or delete the atlas prior-art column**: one Dawncaster pass filling the
   29 empty analogue cells from `kb/` (receipts required), or remove the column.
   A cache with one entry is worse than no cache — it teaches agents the discipline
   is optional.

---

## 10. Cross-reference (added 2026-07-11) — control-surface audit map

The WS8.1 control-surface audit table — all 13 Roll-penalty carriers
mapped to ONE primary threat surface each (telegraph damage / rider /
stance certainty / rung strength / escalation / roll), with the KW-2
fold-in duplicates `debuff_fatigue` → `debuff_exhaustion` and
`debuff_daze` → `debuff_confusion` marked — lives in
`plan/tuning/2026-07-11-card-library-improvement-plan-detailed.md`,
WS8.1. Those two fold-in pairs join §2's near-synonym list and §9
item 2's merge/retire pass for execution under Phase 29 KW-2.
