# Preset sweep — first per-preset doctrine measurement (2026-07-18)

**Instrument:** `npm run combat-playtest -- --stage=all --policy=blind
--deck=preset:all --runs=30 --seed=1 --cards` (metrics slate, this PR).
**Tree:** `f8de24b2` + the metrics-slate instrument itself.
**Witness:** `blind` — the policy the starter-preset doctrine curve is defined
against (early ~80% / mid ~50% / late 25–35% / impossible 0%).

This is the FIRST time the ten starter presets have been measured as presets:
the nightly baseline sweeps `policy-pick` drafts, and until this slate no
per-preset rollup surface existed.

## Headline findings

1. **The mid-game is where the library is broken.** Only oratory (63%,
   *above* band), refrain (43%) and erosion (41%) are near the 45–55% band;
   the other seven sit at 0–17%. Foundry, standstill, grace and augury are at
   or near **0% mid** — a cliff, not a slope.
2. **Late is uniformly under-band.** Doctrine wants 25–35%; the best preset
   (oratory) manages 12%, most are 0%. The early→mid→late curve is early ~80%
   → cliff, instead of a graceful decline.
3. **Early is roughly honest.** Six presets in/next to band; foundry (56%),
   augury (66%), grace (68%) under-perform even at early.
4. **Foundry and grace read 0% statusEngagement at every stage.** For grace
   this is partly the metric's known blind spot (SWAY/RAPPORT wins don't land
   enemy-side "status" the way DoT does); for foundry it is a real doctrine
   failure worth a card-level look — its engine plays pips, not statuses.
5. **Dead cards:** 10 of 70 never played across the whole sweep —
   achilles-and-the-tortoise, ad-nauseam, captive-audience, entropy-tax,
   fated-course, heart-of-the-matter, memento-mori, practiced-cadence,
   straw-mans-jab, the-tithe. These are reward-pool-only cards the presets
   never field; the trim conversation starts here.
6. **Static complexity spread is wide:** penitent cx=30.9 (14 keywords, 12 of
   them orphans!) vs oratory cx=16.0 (8 keywords, 4 orphans). Penitent asks a
   new player to learn nearly half the game's vocabulary from one 15-card
   deck. Orphan keywords (carried by a single unique card) are the cheapest
   trim/duplicate lever: either reinforce the keyword or cut its card.

Skill-gap (dynamic complexity) is n/a in this run — it needs ≥2 policies; the
`--policy=all` early-stage probe measured penitent 37%, augury 29%, foundry
27% vs refrain/erosion/grace ~6% (deep decks vs decks that play themselves).

## Preset × stage rollup (verbatim instrument output)

```
Stage summaries (runs-weighted):
  early      cells=60  win= 79%  statusEng= 25%  dotFrac= 39%  rounds=3.5  util=100%  H=0.91
  mid        cells=50  win= 18%  statusEng= 25%  dotFrac= 34%  rounds=4.9  util=100%  H=0.91
  late       cells=60  win=  2%  statusEng= 25%  dotFrac= 29%  rounds=4.2  util=100%  H=0.91
  impossible cells=10  win=  3%  statusEng= 26%  dotFrac= 32%  rounds=8.3  util=100%  H=0.90

  erosion    curve-dev=  7%  cx=21.9 (kw=10, orph=8, heaviest=opening-statement 6)
    early      win= 89% (dev +4%)   mid win= 41% (dev -4%)   late win=  3% (dev -22%)  imp win= 0%
  oratory    curve-dev= 14%  cx=16.0 (kw=8, orph=4, heaviest=mounting-case 8)
    early      win= 91% (dev +6%)   mid win= 63% (dev +8%)   late win= 12% (dev -13%)  imp win=33% (dev +31%)
  foundry    curve-dev= 22%  cx=21.6 (kw=10, orph=7, heaviest=the-overtake 6)
    early      win= 56% (dev -19%)  mid win=  0% (dev -45%)  late win=  0% (dev -25%)  imp win= 0%
  penitent   curve-dev= 14%  cx=30.9 (kw=14, orph=12, heaviest=pact-of-akrasia 11)
    early      win= 81% (in band)   mid win= 14% (dev -31%)  late win=  0% (dev -25%)  imp win= 0%
  standstill curve-dev= 18%  cx=26.0 (kw=13, orph=9, heaviest=cassandras-burden 9)
    early      win= 76% (in band)   mid win=  0% (dev -45%)  late win=  0% (dev -25%)  imp win= 0%
  augury     curve-dev= 20%  cx=20.1 (kw=10, orph=6, heaviest=glimpse 6)
    early      win= 66% (dev -9%)   mid win=  1% (dev -44%)  late win=  0% (dev -25%)  imp win= 0%
  tithe      curve-dev= 14%  cx=26.9 (kw=13, orph=10, heaviest=disarming-smile 5)
    early      win= 88% (dev +3%)   mid win= 17% (dev -28%)  late win=  0% (dev -25%)  imp win= 0%
  grace      curve-dev= 19%  cx=17.6 (kw=9, orph=5, heaviest=second-thoughts 5)
    early      win= 68% (dev -7%)   mid win=  0% (dev -45%)  late win=  0% (dev -25%)  imp win= 0%
  bastion    curve-dev= 16%  cx=18.0 (kw=9, orph=5, heaviest=common-ground 7)
    early      win= 82% (in band)   mid win=  5% (dev -40%)  late win=  0% (dev -25%)  imp win= 0%
  refrain    curve-dev=  6%  cx=19.4 (kw=10, orph=5, heaviest=refrain 7)
    early      win= 89% (dev +4%)   mid win= 43% (dev -2%)   late win=  8% (dev -17%)  imp win= 0%

Card coverage: 60/70 eligible cards exercised (dead-card rate 14%)
  never played: achilles-and-the-tortoise, ad-nauseam, captive-audience,
  entropy-tax, fated-course, heart-of-the-matter, memento-mori,
  practiced-cadence, straw-mans-jab, the-tithe
```

Full per-cell tables and the per-card usage table (with the new draws / opp% /
dWR columns) reproduce deterministically from the command above.

## Caveats

- 30 runs/cell → per-stage rollups pool 150–180 runs per preset, so stage win
  rates carry roughly ±4pt sampling noise; the mid/late cliffs are far outside
  it.
- `dWR` (win-rate-when-drawn delta) is biased negative for situational cards:
  longer (losing) runs see more of the deck. Read it comparatively, not
  absolutely.
- `statusEngagement` remains enemy-side/volume/arc-blind (2026-07-12 note);
  grace's 0% is partly instrument, foundry's 0% is probably real.

## Follow-ups filed

- Preset sweep should join the nightly baseline (a second artifact next to
  `deck-matrix-baseline.json`) so preset drift is watched, not sampled.
- Mid-game collapse: the trim/duplicate tuning pass this slate was built for
  (owner decision on what to cut / what to duplicate, using opp%, dWR, orphan
  keywords, and the curve-dev table above).

## Addendum (same day, later session)

Superseded in resolution by the full-matrix accumulation: all 8 policies ×
runs=60 × both dice arms × two seeds (345,600 encounters), per-preset card
telemetry, and a de-confounded per-cell dWR estimator. Data:
`docs/reports/preset-metrics/2026-07-18-*.json` (deleted 2026-09-25, T1) + `2026-07-18-analysis-tables.md` (archived: `plan/archive/2026-09-25-trim-t1/axiomancer-mechanics/docs/reports/preset-metrics/`);
reading: `plan/archive/2026-09-25-trim-t4/plan/tuning/2026-07-18-card-library-metrics-accumulation.md`.
Headlines survive at full resolution; new on top: the flag-ON (live, post-FLIP)
arm sits 5–24 points below this sweep's flag-OFF numbers with statusEngagement
down 5–9 points everywhere.
