# ADR-0008 — Loot cache uses a public-information Pick Pool, not sealed trap fates

- Status: **HISTORICAL — the Pick Pool minigame this ADR documents was
  retired in Phase 63 (2026-08-26)**, replaced by a plain three-offer
  choice (card / item / sacrifice reward). Kept for the record of why the
  sealed-fate design was rejected in favor of a live pick-pool, which is
  itself now superseded. See `docs/encounters/loot-cache.md` for the live
  rules.
- Date: 2026-07-04
- Supersedes: the original sealed-fate + free-probe loot-cache rule (never ADR'd)
- Related: braindump `2026-07-03-lockpicking-treasure-minigame.md` (Option B chosen; archived 2026-09-25 to `plan/archive/2026-09-25-trim-t1/axiomancer-mechanics/braindump/`), `docs/encounters/loot-cache.md` (live rules)

## Context

The original Reliquary rolled each layer's `trapped` fate at session creation
(`trapChance` 0 / ⅓ / ½), gave one free probe to reveal a sealed fate, and had
a trapped delve fire unconditionally: bite vitae, spoil the layer, slam the
whole cache shut. Playtesting read as "boring coin-flip": the player's only
lever was where to point the free probe, outcomes were decided before the
first input, and one bad delve ended the whole encounter. The 2026-07-03
brainstorm produced five directions; reflex/rhythm options (A, D) were
rejected as foreign to the game's turn-based, system-mastery identity.

## Decision

Replace hidden fates with a live, public-information d6 dice pool
("Pick Pool", Option B — Too-Many-Bones-lite):

1. Layers carry a **public `difficulty`** (5/9/13). No RNG is drawn at
   session creation; every roll happens in front of the player.
2. `delve` opens a **picking** phase on the layer. **Push** rolls
   `pickPoolSize` (3) d6s: non-1s bank progress toward difficulty; 1s are
   **slips**.
3. **Jam** — ≥ `jamSlipThreshold` (2) slips in a single roll — bites
   `trapBite` vitae and spoils **that layer only**; the session continues.
   The old full-cache slam is gone.
4. A lock **holds** after `maxPushesPerLayer` (4) pushes (skip: no loot, no
   bite). **Retreat** abandons a layer voluntarily at no cost.
5. **Insight** replaces the probe: one charge per session, spendable only
   before a layer's first roll, granting `insightBonusDice` (1) bonus die
   **and raising that roll's jam threshold by the same amount**.

## The Insight jam-threshold rule (load-bearing)

A bonus die with a fixed slip trigger *raises* jam odds (4 dice at
threshold 2 jam ~13.2% vs ~7.4% for 3), making Insight a strictly bad buy.
Channeling therefore raises the channeled roll's jam threshold by the number
of bonus dice. This is what makes the doctrine gradient real; do not "simplify"
it away. Witness: `lootcache.balance.sim.test.ts` (informed beats greedy on
risk-adjusted value while staying ≥ ~95% of greedy's raw currency).

## Doctrine and evidence obligations

- Doctrine unchanged: **informed > blind > coward**. The sim's three bots are
  `greedy` (blind), `prudent` (coward), and `informed` (spends Insight on the
  deepest layer; renamed from the pre-rework `prober`).
- `stung` keys purely off `bittenVitae > 0`; the `slammed` flag no longer
  exists.
- Balance changes go through `/loot-cache-tuning` with sim evidence; the
  tuning surface is `LOOT_CACHE_TUNING` (difficulty, pickPoolSize,
  maxPushesPerLayer, jamSlipThreshold, insightBonusDice, trapBite).

## Fallback

If Pick Pool proves too heavy in real play, the pre-designed retreat position
is Option E (costed probe + pick hybrid) in
`docs/encounters/loot-cache-alt-hybrid-spec.md` — kept deliberately as a spec,
not code. Its type names describe the old model and are not current.

## Remaining open questions

- Does per-layer difficulty need per-map or depth scaling once more
  continents exist (see ADR-0005)?
- Should Insight ever recharge (rest encounter, item), or stay strictly
  one per session?
