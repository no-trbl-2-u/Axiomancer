# Quest Board micro-games — 2026-06-13

## Surface question
The quest board game is "just roll a die and move around the board." It's
boring. Add super-quick, 1-off mini-minigames for each encounter/space type,
keeping a full play to ~5–8 minutes.

## Better question surfaced
The board isn't boring because it has "8 fictions, 1 mechanic." It's boring
because all 8 spaces share the same **decision shape**: a binary risk gate
(safe vs gamble → one d6 threshold → apply deltas). By lap 2 the player has
learned "it's the binary again." The real target is therefore a *small
vocabulary of distinct decision shapes*, one per space, sharing the bone die /
fish / vigor / wind so they stay learnable — NOT eight alien systems. And a
board where *every* space is a decision is its own failure mode (fiddly/slow);
some spaces must stay light to give the heavy ones contrast.

## Prior art consulted
- **Can't Stop (Sid Sackson) — press-or-bank:** the "one more roll" temptation
  ladder. Players love the agony; the known dislike is runaway swing when the
  bust chance is too high — keep bust on a single die face (~17%).
- **Dicey Dungeons (Warrior) — bank/allocate dice before resolution:** the
  "puzzle the dice" feel; players liked planning a sequence vs gating one roll.
- **Citizen Sleeper — spend a held resource to bias a check:** gives hoarded
  resources an outlet; well received.
- **Slay the Spire shop — escalating removal/purchase cost:** rising price per
  purchase reads as natural shop tension; accepted by players.
- **Disco Elysium / Sunless Sea storylets — dice-free authored nodes:** the
  choice IS the content; loved, but only if options *trade* (gain X lose Y)
  rather than being strictly +stat upgrades.
- **Slay the Spire campfire (Rest vs Smith):** a small but meaningful binary;
  fails as a choice when one option is always correct — tune so it only matters
  when vigor is low.
- **Mörk Borg / OSR saves:** "roll vs a number, pay the price" — beloved for
  brevity. Players tolerate flavor-only spaces only if they're short.

## Design directions on the table

The synthesis: **five reusable decision shapes**, mapped one-per-space, plus
three deliberately-light spaces. Charms each get a "home space" where they sing.

### GATHER — Press / stop (push-your-luck)  *[FULL]*
*(inspired by Can't Stop)*
Each tap rolls the bone die into a "wet haul": 2–6 adds that part, a **1 is the
rogue wave** (lose the whole unbanked haul, −1 vigor). Tap STOP to bank. Replaces
the one-shot safe-vs-deep with a tension ladder. `lucky-hook` doubles the bank;
`gull-feather` (roll twice keep higher) de-risks a press.
**Trade-off:** variance must be tuned (single bust face) or it swings.
**Telltale failure mode:** players always STOP at 1 plank → curve too punishing.

### DUEL — Allocate a budget (best-of-1 + grit)  *[FULL]*  **(decided)**
*(inspired by Dicey Dungeons)*
One round. Before rolling, spend **0–2 grit** drawn from vigor; each grit = +1
on your die that round. Foe bonus shown. `mother's-locket` = a free grit. Bribe-
with-fish stays as a one-tap SKIP for the vigor-starved. Best-of-1 (NOT 3) to
protect the time budget.
**Trade-off:** the space most likely to balloon taps/time — kept to best-of-1.
**Telltale failure mode:** avg rolls-to-finish creeps past ~16 → cut duel first.

### SNAG — Insurance binary  *[MEDIUM]*
*(inspired by Citizen Sleeper)*
Cross BARE (roll vs threshold; fail = −vigor + slip back) or **BRACE** (spend 1
fish or 1 wind to lower the threshold by 2). Keeps the hazard a lean speed bump
but gives hoarded resources an outlet. `tar-twine` = auto-cross.
**Trade-off:** must stay one extra tap, not a set piece.
**Telltale failure mode:** players never BRACE → the insurance is mispriced.

### MARKET — Escalating shop  *[MEDIUM]*
*(inspired by Slay the Spire shop)*
The second copy of a part costs more than the first (rising-price track);
optional HAGGLE spends 1 wind to knock a fish off. The only space about
fish→parts conversion math.
**Trade-off:** keep the price ramp legible on a tiny card.
**Telltale failure mode:** one buy is always optimal → no sequencing decision.

### PARLEY — Authored branch, no die  *[MEDIUM]*
*(inspired by Disco Elysium storylets)*
Stays text-forward and dice-free (its distinctiveness is being the *quiet* beat).
Add one option gated by a held resource (a charm, or ≥N fish) so inventory state
changes the menu. Options must trade, not just upgrade.
**Trade-off:** authoring cost per board.
**Telltale failure mode:** every option is net-positive → decoration.

### HEARTH — Light (1 optional tap)
*(inspired by StS campfire)* Passive heal + optional LINGER (burn tempo for extra
vigor). Usually a 0-thought PASS — intended.

### CACHE — Light (pure reveal, no decision)
*(inspired by Hades room reward)* Tap to open weighted find. The palate cleanser;
adding a decision would clone gather.

### OMEN — Light (witness + wind faucet)
*(inspired by Inscryption interstitials)* Flavor + auto wind. The pacing valve;
a decision here would bloat roll count.

## Decision / leaning
**LOCKED.** Scope = "5 verbs": GATHER + DUEL get full new decision shapes; SNAG
+ MARKET + PARLEY get medium treatments; HEARTH/CACHE/OMEN stay light. DUEL =
**best-of-1 + grit**. Rhythm: alternate tense (gather/duel/snag) with free
(cache/omen/hearth). Implement in the mechanics package, ship a minor version,
then bump + update mobile.

## Open questions
- Exact grit→die and bust-face tuning numbers (set in `quest-board.tuning.ts`,
  validate with the balance/sim loop; watch `metrics.rolls` ≤ ~16).
- Whether MARKET's rising-price track is per-part or global per visit.
- Does PARLEY's resource-gated option need new content authoring per board, or a
  generic "show a charm" template?

## Raw notes
- Five decision shapes is the ceiling; wanting a sixth (e.g. for cache/omen) is
  the signal you're over-designing — force them back to reveal/witness.
- The shared currency (bone die, fish, vigor, wind) + charm→home-space mapping
  are what keep 8 distinct spaces feeling like ONE game.
- Biggest single risk: DUEL fiddliness. Secondary: vocabulary sprawl.
- Subagent skipped the Socratic question phase (brief was fully specified);
  pivots (scope, duel shape) were instead put to the user via AskQuestion.
