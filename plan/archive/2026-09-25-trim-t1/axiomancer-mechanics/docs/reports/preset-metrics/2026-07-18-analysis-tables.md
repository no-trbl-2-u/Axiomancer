> **Status:** HISTORICAL — archived 2026-09-25 by TRIM THE FAT T1 (`plan/2026-09-25-trim-the-fat.spec.md` Tier 1 docs). Original path: `axiomancer-mechanics/docs/reports/preset-metrics/2026-07-18-analysis-tables.md`. Describes removed or never-built code; not a source of rules.



# flagoff-s1

## Stage summaries

| stage | cells | win | statusEng | dotFrac | rounds±σ | util | H | deadCardRate |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| early | 480 | 78% | 23% | 38% | 3.6±0.8 | 100% | 0.91 | — |
| mid | 400 | 19% | 23% | 34% | 4.8±0.9 | 100% | 0.91 | — |
| late | 480 | 3% | 23% | 30% | 4.1±0.6 | 100% | 0.91 | — |
| impossible | 80 | 3% | 24% | 32% | 7.8±2.0 | 100% | 0.90 | — |

Card coverage: 60 exercised, 10 never played (deadCardRate 14.3%)

Never played: achilles-and-the-tortoise, ad-nauseam, captive-audience, entropy-tax, fated-course, heart-of-the-matter, memento-mori, practiced-cadence, straw-mans-jab, the-tithe

## Doctrine fit (win bands: early 75-85 / mid 45-55 / late 25-35 / imp ~0)

| preset | curve-dev | skill-gap (best>worst) | cx (kw/orph) | early | mid | late | imp |
| --- | --- | --- | --- | --- | --- | --- | --- |
| erosion | 7.4% | 9% (mercy-seeker>turtle) | 21.9 (10/8) | 89% (+4%) | 40% (-5%) | 4% (-21%) | 1% (in) |
| oratory | 13.7% | 6% (control-lock>mercy-seeker) | 16.0 (8/4) | 91% (+6%) | 66% (+11%) | 17% (-8%) | 32% (+30%) |
| foundry | 20.8% | 5% (mercy-seeker>chaos) | 21.6 (10/7) | 62% (-13%) | 0% (-45%) | 0% (-25%) | 0% (in) |
| penitent | 13.8% | 9% (mercy-seeker>turtle) | 30.9 (14/12) | 76% (in) | 15% (-30%) | 0% (-25%) | 0% (in) |
| standstill | 18.1% | 3% (greedy>chaos) | 26.0 (13/9) | 73% (-2%) | 0% (-45%) | 0% (-25%) | 0% (in) |
| augury | 20.1% | 11% (mercy-seeker>turtle) | 20.1 (10/6) | 62% (-13%) | 3% (-42%) | 0% (-25%) | 0% (in) |
| tithe | 14.1% | 6% (control-lock>chaos) | 26.9 (13/10) | 84% (in) | 13% (-32%) | 0% (-25%) | 0% (in) |
| grace | 18.7% | 3% (mercy-seeker>dot-weaver) | 17.6 (9/5) | 70% (-5%) | 0% (-45%) | 0% (-25%) | 0% (in) |
| bastion | 16.6% | 7% (mercy-seeker>aggro-brute) | 18.0 (9/5) | 80% (in) | 4% (-41%) | 0% (-25%) | 0% (in) |
| refrain | 5.5% | 8% (chaos>blind) | 19.4 (10/5) | 90% (+5%) | 51% (in) | 8% (-17%) | 1% (in) |

## Preset × stage detail

| preset | stage | win | statusEng | rounds±σ | util | H | victory/mercy/capit/concede/defeat/retreat |
| --- | --- | --- | --- | --- | --- | --- | --- |
| erosion | early | 89% | 28% | 3.0±0.6 | 100% | 0.91 | 2550/0/0/0/330/0 |
| erosion | mid | 40% | 30% | 4.4±0.5 | 100% | 0.91 | 966/0/0/0/1434/0 |
| erosion | late | 4% | 29% | 4.1±0.4 | 100% | 0.91 | 109/0/0/0/2771/0 |
| erosion | impossible | 1% | 31% | 5.6±0.8 | 100% | 0.91 | 7/0/0/0/473/0 |
| oratory | early | 91% | 20% | 3.8±1.0 | 100% | 0.91 | 2429/0/0/199/252/0 |
| oratory | mid | 66% | 20% | 5.4±1.2 | 100% | 0.91 | 1108/0/0/468/824/0 |
| oratory | late | 17% | 19% | 4.8±0.7 | 100% | 0.91 | 180/0/0/311/2389/0 |
| oratory | impossible | 32% | 20% | 6.6±1.1 | 100% | 0.91 | 2/0/0/151/327/0 |
| foundry | early | 62% | 0% | 3.6±0.8 | 100% | 0.91 | 1/0/1783/0/1096/0 |
| foundry | mid | 0% | 0% | 3.9±0.2 | 100% | 0.91 | 0/0/0/0/2400/0 |
| foundry | late | 0% | 0% | 3.2±0.2 | 100% | 0.91 | 0/0/0/0/2880/0 |
| foundry | impossible | 0% | 0% | 5.1±0.2 | 100% | 0.91 | 0/0/0/0/480/0 |
| penitent | early | 76% | 31% | 3.2±0.8 | 100% | 0.91 | 2184/0/0/0/696/0 |
| penitent | mid | 15% | 32% | 3.9±0.7 | 100% | 0.91 | 355/0/0/0/2045/0 |
| penitent | late | 0% | 31% | 3.6±0.5 | 100% | 0.91 | 2/0/0/0/2878/0 |
| penitent | impossible | 0% | 34% | 5.1±0.7 | 100% | 0.91 | 0/0/0/0/480/0 |
| standstill | early | 73% | 29% | 3.7±0.8 | 100% | 0.91 | 2033/0/56/0/791/0 |
| standstill | mid | 0% | 28% | 4.3±0.6 | 100% | 0.91 | 2/0/0/0/2398/0 |
| standstill | late | 0% | 27% | 3.8±0.5 | 100% | 0.91 | 0/0/0/0/2880/0 |
| standstill | impossible | 0% | 29% | 5.1±0.3 | 100% | 0.91 | 0/0/0/0/480/0 |
| augury | early | 62% | 24% | 3.7±0.7 | 100% | 0.91 | 1781/0/0/0/1099/0 |
| augury | mid | 3% | 22% | 4.0±0.3 | 100% | 0.91 | 63/0/0/0/2337/0 |
| augury | late | 0% | 23% | 3.5±0.4 | 100% | 0.91 | 0/0/0/0/2880/0 |
| augury | impossible | 0% | 23% | 5.0±0.1 | 100% | 0.91 | 0/0/0/0/480/0 |
| tithe | early | 84% | 29% | 3.9±0.9 | 100% | 0.92 | 2128/0/285/0/467/0 |
| tithe | mid | 13% | 29% | 6.8±2.3 | 100% | 0.90 | 277/0/46/0/2077/0 |
| tithe | late | 0% | 28% | 5.2±1.5 | 100% | 0.91 | 0/0/0/0/2880/0 |
| tithe | impossible | 0% | 29% | 15.6±6.6 | 100% | 0.87 | 0/0/0/0/480/0 |
| grace | early | 70% | 0% | 4.8±1.2 | 100% | 0.93 | 16/0/2002/0/862/0 |
| grace | mid | 0% | 0% | 6.0±1.8 | 100% | 0.93 | 0/0/0/0/2400/0 |
| grace | late | 0% | 0% | 4.7±1.1 | 100% | 0.93 | 0/0/0/0/2880/0 |
| grace | impossible | 0% | 0% | 14.1±6.0 | 100% | 0.90 | 0/0/0/0/480/0 |
| bastion | early | 80% | 37% | 3.5±0.7 | 100% | 0.91 | 623/0/1673/0/584/0 |
| bastion | mid | 4% | 40% | 5.2±1.1 | 100% | 0.90 | 0/0/86/0/2314/0 |
| bastion | late | 0% | 40% | 4.4±0.7 | 100% | 0.90 | 0/0/0/0/2880/0 |
| bastion | impossible | 0% | 43% | 10.4±4.2 | 100% | 0.87 | 0/0/0/0/480/0 |
| refrain | early | 90% | 33% | 2.7±0.6 | 100% | 0.90 | 2589/0/0/0/291/0 |
| refrain | mid | 51% | 34% | 4.0±0.7 | 100% | 0.91 | 1217/0/0/0/1183/0 |
| refrain | late | 8% | 33% | 3.8±0.5 | 100% | 0.91 | 229/0/0/0/2651/0 |
| refrain | impossible | 1% | 35% | 5.1±0.2 | 100% | 0.91 | 3/0/0/0/477/0 |

## Per-policy win rates

| preset | stage | greedy | blind | dot-weaver | control-lock | aggro-brute | turtle | chaos | mercy-seeker |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| erosion | early | 89% | 89% | 89% | 90% | 90% | 84% | 88% | 90% |
| erosion | mid | 38% | 37% | 36% | 46% | 46% | 29% | 41% | 49% |
| erosion | late | 3% | 3% | 1% | 6% | 5% | 2% | 4% | 7% |
| erosion | impossible | 0% | 0% | 0% | 2% | 3% | 2% | 0% | 5% |
| oratory | early | 92% | 92% | 93% | 93% | 92% | 88% | 90% | 90% |
| oratory | mid | 64% | 64% | 65% | 69% | 69% | 65% | 66% | 63% |
| oratory | late | 12% | 12% | 11% | 23% | 22% | 21% | 22% | 15% |
| oratory | impossible | 25% | 27% | 30% | 37% | 38% | 43% | 35% | 20% |
| foundry | early | 60% | 60% | 56% | 66% | 59% | 68% | 56% | 70% |
| foundry | mid | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% |
| foundry | late | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% |
| foundry | impossible | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% |
| penitent | early | 81% | 81% | 78% | 78% | 77% | 63% | 70% | 79% |
| penitent | mid | 17% | 18% | 10% | 20% | 11% | 7% | 13% | 22% |
| penitent | late | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% |
| penitent | impossible | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% |
| standstill | early | 77% | 76% | 76% | 67% | 73% | 76% | 67% | 69% |
| standstill | mid | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% |
| standstill | late | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% |
| standstill | impossible | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% |
| augury | early | 68% | 68% | 65% | 68% | 68% | 38% | 53% | 68% |
| augury | mid | 1% | 1% | 1% | 6% | 3% | 2% | 1% | 6% |
| augury | late | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% |
| augury | impossible | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% |
| tithe | early | 85% | 86% | 84% | 87% | 81% | 81% | 81% | 86% |
| tithe | mid | 16% | 16% | 14% | 19% | 9% | 14% | 5% | 14% |
| tithe | late | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% |
| tithe | impossible | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% |
| grace | early | 72% | 69% | 67% | 68% | 68% | 72% | 70% | 75% |
| grace | mid | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% |
| grace | late | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% |
| grace | impossible | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% |
| bastion | early | 83% | 83% | 74% | 80% | 73% | 79% | 80% | 85% |
| bastion | mid | 9% | 7% | 0% | 1% | 0% | 0% | 2% | 10% |
| bastion | late | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% |
| bastion | impossible | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% |
| refrain | early | 89% | 89% | 89% | 89% | 89% | 91% | 92% | 90% |
| refrain | mid | 44% | 42% | 52% | 51% | 51% | 53% | 61% | 51% |
| refrain | late | 6% | 6% | 9% | 8% | 8% | 7% | 11% | 9% |
| refrain | impossible | 0% | 0% | 2% | 0% | 0% | 0% | 3% | 0% |

## Per-preset card telemetry


### erosion

Static cx=21.9, keywords=10, orphans=[DRAW, MARK, PREMISE, PROLONG, REARGUE, RECALL, RUPTURE, SIPHON], heaviest=opening-statement (6)

| card | plays | statusLands | free% | fizz% | unpl% | draws | opp% | dWR | hpF | hpP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| opening-statement | 50850 | 22687 | 55% | 0% | 0% | 52666 | 97% | — | 0 | 2218925 |
| slippery-slope | 46211 | 27261 | 41% | 0% | 0% | 48756 | 95% | — | 0 | 1648722 |
| festering-argument | 25322 | 0 | 71% | 0% | 0% | 26266 | 96% | -58% | 0 | 70842 |
| currys-conversion | 25128 | 0 | 79% | 8% | 0% | 25347 | 99% | -58% | 0 | 14532 |
| resonance-detonation | 12484 | 3509 | 63% | 5% | 0% | 13423 | 93% | -59% | 0 | 1020372 |
| venom-and-vein | 11465 | 0 | 72% | 0% | 0% | 11505 | 100% | -59% | 0 | 0 |
| suppurating-curse | 10754 | 0 | 67% | 0% | 0% | 10785 | 100% | -59% | 0 | 0 |

### oratory

Static cx=16.0, keywords=8, orphans=[BLEED, GUARD, RUPTURE, STAGGER], heaviest=mounting-case (8)

| card | plays | statusLands | free% | fizz% | unpl% | draws | opp% | dWR | hpF | hpP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| brace-for-impact | 61627 | 0 | 67% | 0% | 0% | 66845 | 92% | — | 0 | 141396 |
| exordium | 56626 | 27119 | 52% | 0% | 0% | 60552 | 94% | — | 1521 | 2476850 |
| mounting-case | 32506 | 17144 | 47% | 0% | 0% | 33935 | 96% | — | 153 | 1606460 |
| peroratio-interrupta | 30919 | 0 | 61% | 0% | 0% | 33393 | 93% | -44% | 921 | 1858859 |
| the-closing-word | 15420 | 0 | 77% | 0% | 0% | 16603 | 93% | -44% | 333 | 25814 |
| venom-and-vein | 13177 | 0 | 82% | 0% | 0% | 14385 | 92% | -44% | 0 | 0 |
| quagmire-of-doubt | 12641 | 0 | 71% | 0% | 0% | 13647 | 93% | -44% | 0 | 0 |

### foundry

Static cx=21.6, keywords=10, orphans=[DRAW, FORETELL, KINDLE, OMEN, RIPOSTE, RUPTURE, SWAY], heaviest=the-overtake (6)

| card | plays | statusLands | free% | fizz% | unpl% | draws | opp% | dWR | hpF | hpP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| half-step | 45428 | 0 | 53% | 2% | 0% | 45429 | 100% | — | 0 | 204 |
| signs-and-portents | 43827 | 0 | 65% | 2% | 0% | 43830 | 100% | — | 0 | 248 |
| ex-nihilo | 22478 | 0 | 72% | 3% | 0% | 22479 | 100% | -80% | 0 | 110 |
| bootstrap-loop | 22430 | 0 | 65% | 5% | 0% | 22430 | 100% | -80% | 0 | 70 |
| the-overtake | 11024 | 0 | 97% | 20% | 0% | 11025 | 100% | -81% | 0 | 9616 |
| anvil-of-form | 10352 | 0 | 67% | 6% | 0% | 10353 | 100% | -81% | 0 | 0 |
| mirror-of-longing | 9911 | 0 | 54% | 1% | 0% | 9912 | 100% | — | 0 | 0 |

### penitent

Static cx=30.9, keywords=14, orphans=[BACKFIRE, DRAW, FALLEN, FORETELL, FORGE, GUARD, HEAL, MARK, POISON, RUPTURE, SOUL, STAGGER], heaviest=pact-of-akrasia (11)

| card | plays | statusLands | free% | fizz% | unpl% | draws | opp% | dWR | hpF | hpP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| sweet-poison | 49829 | 29791 | 40% | 3% | 0% | 50979 | 98% | — | 0 | 1576412 |
| against-my-judgment | 42870 | 9797 | 65% | 2% | 0% | 45655 | 94% | -71% | 0 | 103350 |
| undistributed-middle | 24004 | 12374 | 48% | 2% | 0% | 24822 | 97% | -71% | 0 | 67736 |
| delphic-ambiguity | 23740 | 0 | 65% | 9% | 0% | 24847 | 96% | -63% | 0 | 702031 |
| pact-of-akrasia | 11855 | 2636 | 66% | 0% | 0% | 12360 | 96% | -71% | 0 | 245400 |
| crown-of-thorns | 10988 | 0 | 78% | 2% | 0% | 11550 | 95% | -71% | 0 | 0 |
| mirror-of-guilt | 9982 | 0 | 58% | 2% | 0% | 10337 | 97% | -72% | 0 | 0 |

### standstill

Static cx=26.0, keywords=13, orphans=[BLEED, FORETELL, HEAL, OMEN, POISON, RIPOSTE, STAGGER, SWAY, THORNS], heaviest=cassandras-burden (9)

| card | plays | statusLands | free% | fizz% | unpl% | draws | opp% | dWR | hpF | hpP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| red-herring | 52832 | 23705 | 55% | 0% | 0% | 54237 | 97% | — | 0 | 89413 |
| zenos-half-step | 48413 | 0 | 65% | 0% | 0% | 50309 | 96% | — | 0 | 62151 |
| fallen-grace | 25844 | 14965 | 42% | 0% | 0% | 26353 | 98% | -76% | 0 | 970177 |
| cassandras-burden | 25643 | 13774 | 46% | 0% | 0% | 26150 | 98% | — | 0 | 282277 |
| turnabout | 13372 | 0 | 74% | 0% | 0% | 13749 | 97% | -77% | 0 | 26258 |
| hedgehogs-dilemma | 12069 | 0 | 87% | 0% | 0% | 12543 | 96% | -77% | 0 | 0 |
| mirror-of-longing | 10942 | 0 | 61% | 0% | 0% | 11298 | 97% | -77% | 0 | 0 |

### augury

Static cx=20.1, keywords=10, orphans=[BACKFIRE, DRAW, GUARD, MARK, POISON, RECOIL], heaviest=glimpse (6)

| card | plays | statusLands | free% | fizz% | unpl% | draws | opp% | dWR | hpF | hpP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| glimpse | 45153 | 26724 | 41% | 0% | 0% | 46402 | 97% | — | 0 | 599002 |
| signs-and-portents | 45151 | 0 | 72% | 0% | 0% | 47168 | 96% | — | 0 | 43980 |
| self-flagellant | 22767 | 0 | 63% | 0% | 0% | 23742 | 96% | -79% | 0 | 282918 |
| arrow-paradox | 22251 | 11468 | 48% | 0% | 0% | 22983 | 97% | — | 0 | 35757 |
| prophecy-fulfilled | 11077 | 0 | 63% | 0% | 0% | 11532 | 96% | -79% | 0 | 165568 |
| the-oracles-eye | 10746 | 0 | 80% | 0% | 0% | 11176 | 96% | -79% | 0 | 0 |
| crumbling-resolve | 10009 | 0 | 64% | 0% | 0% | 10342 | 97% | -80% | 0 | 0 |

### tithe

Static cx=26.9, keywords=13, orphans=[BLEED, DRAW, ECHO, HEAL, KINDLE, MARK, MILL, RAPPORT, SIPHON, SWAY], heaviest=disarming-smile (5)

| card | plays | statusLands | free% | fizz% | unpl% | draws | opp% | dWR | hpF | hpP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| disarming-smile | 86206 | 39011 | 55% | 0% | 0% | 86773 | 99% | — | 0 | 4955 |
| brief-candle | 79528 | 44179 | 44% | 0% | 0% | 79514 | 100% | — | 228756 | 4068927 |
| circular-reasoning | 43695 | 4790 | 66% | 7% | 0% | 43705 | 100% | — | 0 | 593681 |
| the-gleaners-due | 42062 | 0 | 80% | 11% | 0% | 40040 | 100% | -68% | 314150 | 117871 |
| the-reaping | 25709 | 0 | 62% | 0% | 0% | 21558 | 100% | -7% | 1055793 | 247143 |
| bone-orchard | 15024 | 0 | 64% | 0% | 0% | 14353 | 100% | -26% | 0 | 0 |
| stuck-in-their-head | 14320 | 0 | 64% | 0% | 0% | 13495 | 100% | -27% | 0 | 0 |

### grace

Static cx=17.6, keywords=9, orphans=[CLEANSE, HEAL, RECALL, RIPOSTE, STAGGER], heaviest=second-thoughts (5)

| card | plays | statusLands | free% | fizz% | unpl% | draws | opp% | dWR | hpF | hpP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| second-thoughts | 67122 | 0 | 73% | 13% | 0% | 68815 | 98% | — | 0 | 3851 |
| soft-word | 64309 | 0 | 54% | 0% | 0% | 63478 | 100% | — | 0 | 2780 |
| measured-answer | 35796 | 0 | 67% | 0% | 0% | 33656 | 100% | — | 0 | 3198 |
| the-olive-branch | 35576 | 0 | 58% | 0% | 0% | 33347 | 100% | -10% | 0 | 1077 |
| ouroboros | 21194 | 0 | 100% | 24% | 0% | 18048 | 100% | -15% | 0 | 0 |
| irresistible-grace | 16961 | 0 | 85% | 0% | 0% | 14938 | 100% | -1% | 0 | 0 |
| crumbling-resolve | 14580 | 0 | 74% | 0% | 0% | 11872 | 100% | -9% | 0 | 0 |

### bastion

Static cx=18.0, keywords=9, orphans=[DRAW, ECHO, KINDLE, PIP, RAPPORT], heaviest=common-ground (7)

| card | plays | statusLands | free% | fizz% | unpl% | draws | opp% | dWR | hpF | hpP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| sketch-of-a-thought | 59566 | 39065 | 34% | 0% | 0% | 60751 | 98% | — | 0 | 2452440 |
| nettle-cloak | 57150 | 33038 | 42% | 0% | 0% | 58377 | 98% | — | 0 | 3827813 |
| common-ground | 29324 | 13396 | 54% | 0% | 0% | 29904 | 98% | -73% | 0 | 684 |
| tu-quoque | 29304 | 0 | 66% | 0% | 0% | 29938 | 98% | -73% | 0 | 1275 |
| the-adamant-wall | 14778 | 0 | 58% | 0% | 0% | 15100 | 98% | -73% | 0 | 1035 |
| mirror-of-longing | 11818 | 0 | 65% | 0% | 0% | 12060 | 98% | -73% | 0 | 0 |
| resonant-chamber | 10478 | 0 | 37% | 0% | 0% | 10623 | 99% | -73% | 0 | 0 |

### refrain

Static cx=19.4, keywords=10, orphans=[BLEED, PREMISE, RECALL, RECOIL, SOUL], heaviest=refrain (7)

| card | plays | statusLands | free% | fizz% | unpl% | draws | opp% | dWR | hpF | hpP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| opening-statement | 40890 | 26050 | 36% | 0% | 0% | 43225 | 95% | — | 0 | 2008018 |
| refrain | 36998 | 19039 | 49% | 0% | 0% | 40509 | 91% | -53% | 0 | 4490786 |
| self-flagellant | 19038 | 0 | 60% | 0% | 0% | 20798 | 92% | -15% | 0 | 1468062 |
| winnowing | 18351 | 0 | 79% | 8% | 0% | 20199 | 91% | -8% | 55530 | 981377 |
| ouroboros | 9690 | 2513 | 74% | 7% | 0% | 10573 | 92% | -18% | 0 | 665135 |
| venom-and-vein | 9214 | 0 | 78% | 0% | 0% | 10053 | 92% | -17% | 0 | 0 |
| stuck-in-their-head | 8296 | 0 | 65% | 0% | 0% | 9327 | 89% | -27% | 0 | 0 |

## Global per-card rollup (all cells)

| card | plays | statusLands | fizz% | unpl% | draws | opp% | dWR | exposedRuns |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| opening-statement | 91740 | 48737 | 0% | 0% | 95891 | 96% | — | 17280 |
| signs-and-portents | 88978 | 0 | 1% | 0% | 90998 | 98% | — | 17280 |
| disarming-smile | 86206 | 39011 | 0% | 0% | 86773 | 99% | — | 8640 |
| brief-candle | 79528 | 44179 | 0% | 0% | 79514 | 100% | — | 8640 |
| second-thoughts | 67122 | 0 | 13% | 0% | 68815 | 98% | — | 8640 |
| soft-word | 64309 | 0 | 0% | 0% | 63478 | 100% | — | 8640 |
| brace-for-impact | 61627 | 0 | 0% | 0% | 66845 | 92% | — | 8640 |
| sketch-of-a-thought | 59566 | 39065 | 0% | 0% | 60751 | 98% | — | 8640 |
| nettle-cloak | 57150 | 33038 | 0% | 0% | 58377 | 98% | — | 8640 |
| exordium | 56626 | 27119 | 0% | 0% | 60552 | 94% | — | 8640 |
| red-herring | 52832 | 23705 | 0% | 0% | 54237 | 97% | — | 8640 |
| sweet-poison | 49829 | 29791 | 3% | 0% | 50979 | 98% | — | 8640 |
| zenos-half-step | 48413 | 0 | 0% | 0% | 50309 | 96% | — | 8640 |
| slippery-slope | 46211 | 27261 | 0% | 0% | 48756 | 95% | — | 8640 |
| half-step | 45428 | 0 | 2% | 0% | 45429 | 100% | — | 8640 |
| glimpse | 45153 | 26724 | 0% | 0% | 46402 | 97% | — | 8640 |
| circular-reasoning | 43695 | 4790 | 7% | 0% | 43705 | 100% | — | 8640 |
| against-my-judgment | 42870 | 9797 | 2% | 0% | 45655 | 94% | -71% | 8640 |
| the-gleaners-due | 42062 | 0 | 11% | 0% | 40040 | 100% | -68% | 8640 |
| self-flagellant | 41805 | 0 | 0% | 0% | 44540 | 94% | -28% | 17280 |
| refrain | 36998 | 19039 | 0% | 0% | 40509 | 91% | -53% | 8640 |
| measured-answer | 35796 | 0 | 0% | 0% | 33656 | 100% | — | 8640 |
| the-olive-branch | 35576 | 0 | 0% | 0% | 33347 | 100% | -10% | 8640 |
| venom-and-vein | 33856 | 0 | 0% | 0% | 35943 | 94% | -20% | 25920 |
| mirror-of-longing | 32671 | 0 | 0% | 0% | 33270 | 98% | -76% | 25920 |
| mounting-case | 32506 | 17144 | 0% | 0% | 33935 | 96% | — | 8640 |
| peroratio-interrupta | 30919 | 0 | 0% | 0% | 33393 | 93% | -44% | 8640 |
| ouroboros | 30884 | 2513 | 20% | 0% | 28621 | 100% | -26% | 17280 |
| common-ground | 29324 | 13396 | 0% | 0% | 29904 | 98% | -73% | 8640 |
| tu-quoque | 29304 | 0 | 0% | 0% | 29938 | 98% | -73% | 8640 |
| fallen-grace | 25844 | 14965 | 0% | 0% | 26353 | 98% | -76% | 8640 |
| the-reaping | 25709 | 0 | 0% | 0% | 21558 | 100% | -7% | 8640 |
| cassandras-burden | 25643 | 13774 | 0% | 0% | 26150 | 98% | — | 8640 |
| festering-argument | 25322 | 0 | 0% | 0% | 26266 | 96% | -58% | 8640 |
| currys-conversion | 25128 | 0 | 8% | 0% | 25347 | 99% | -58% | 8640 |
| crumbling-resolve | 24589 | 0 | 0% | 0% | 22214 | 100% | -18% | 17280 |
| undistributed-middle | 24004 | 12374 | 2% | 0% | 24822 | 97% | -71% | 8640 |
| delphic-ambiguity | 23740 | 0 | 9% | 0% | 24847 | 96% | -63% | 8640 |
| stuck-in-their-head | 22616 | 0 | 0% | 0% | 22822 | 99% | -32% | 17280 |
| ex-nihilo | 22478 | 0 | 3% | 0% | 22479 | 100% | -80% | 8640 |
| bootstrap-loop | 22430 | 0 | 5% | 0% | 22430 | 100% | -80% | 8640 |
| arrow-paradox | 22251 | 11468 | 0% | 0% | 22983 | 97% | — | 8640 |
| winnowing | 18351 | 0 | 8% | 0% | 20199 | 91% | -8% | 8640 |
| irresistible-grace | 16961 | 0 | 0% | 0% | 14938 | 100% | -1% | 8640 |
| the-closing-word | 15420 | 0 | 0% | 0% | 16603 | 93% | -44% | 8640 |
| bone-orchard | 15024 | 0 | 0% | 0% | 14353 | 100% | -26% | 8640 |
| the-adamant-wall | 14778 | 0 | 0% | 0% | 15100 | 98% | -73% | 8640 |
| turnabout | 13372 | 0 | 0% | 0% | 13749 | 97% | -77% | 8640 |
| quagmire-of-doubt | 12641 | 0 | 0% | 0% | 13647 | 93% | -44% | 8640 |
| resonance-detonation | 12484 | 3509 | 5% | 0% | 13423 | 93% | -59% | 8640 |
| hedgehogs-dilemma | 12069 | 0 | 0% | 0% | 12543 | 96% | -77% | 8640 |
| pact-of-akrasia | 11855 | 2636 | 0% | 0% | 12360 | 96% | -71% | 8640 |
| prophecy-fulfilled | 11077 | 0 | 0% | 0% | 11532 | 96% | -79% | 8640 |
| the-overtake | 11024 | 0 | 20% | 0% | 11025 | 100% | -81% | 8640 |
| crown-of-thorns | 10988 | 0 | 2% | 0% | 11550 | 95% | -71% | 8640 |
| suppurating-curse | 10754 | 0 | 0% | 0% | 10785 | 100% | -59% | 8640 |
| the-oracles-eye | 10746 | 0 | 0% | 0% | 11176 | 96% | -79% | 8640 |
| resonant-chamber | 10478 | 0 | 0% | 0% | 10623 | 99% | -73% | 8640 |
| anvil-of-form | 10352 | 0 | 6% | 0% | 10353 | 100% | -81% | 8640 |
| mirror-of-guilt | 9982 | 0 | 2% | 0% | 10337 | 97% | -72% | 8640 |


# flagon-s1

## Stage summaries

| stage | cells | win | statusEng | dotFrac | rounds±σ | util | H | deadCardRate |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| early | 480 | 67% | 18% | 32% | 4.0±1.0 | 100% | 0.92 | — |
| mid | 400 | 13% | 18% | 30% | 4.9±1.3 | 100% | 0.91 | — |
| late | 480 | 2% | 18% | 27% | 4.2±0.9 | 100% | 0.91 | — |
| impossible | 80 | 2% | 18% | 29% | 7.6±2.7 | 100% | 0.90 | — |

Card coverage: 60 exercised, 10 never played (deadCardRate 14.3%)

Never played: achilles-and-the-tortoise, ad-nauseam, captive-audience, entropy-tax, fated-course, heart-of-the-matter, memento-mori, practiced-cadence, straw-mans-jab, the-tithe

## Doctrine fit (win bands: early 75-85 / mid 45-55 / late 25-35 / imp ~0)

| preset | curve-dev | skill-gap (best>worst) | cx (kw/orph) | early | mid | late | imp |
| --- | --- | --- | --- | --- | --- | --- | --- |
| erosion | 12.9% | 5% (greedy>aggro-brute) | 21.9 (10/8) | 78% (in) | 18% (-27%) | 0% (-25%) | 0% (in) |
| oratory | 9.9% | 8% (turtle>aggro-brute) | 16.0 (8/4) | 89% (+4%) | 64% (+9%) | 14% (-11%) | 18% (+16%) |
| foundry | 21.0% | 3% (mercy-seeker>aggro-brute) | 21.6 (10/7) | 61% (-14%) | 0% (-45%) | 0% (-25%) | 0% (in) |
| penitent | 21.2% | 4% (mercy-seeker>aggro-brute) | 30.9 (14/12) | 55% (-20%) | 5% (-40%) | 0% (-25%) | 0% (in) |
| standstill | 24.0% | 2% (greedy>aggro-brute) | 26.0 (13/9) | 49% (-26%) | 0% (-45%) | 0% (-25%) | 0% (in) |
| augury | 26.0% | 7% (mercy-seeker>turtle) | 20.1 (10/6) | 41% (-34%) | 0% (-45%) | 0% (-25%) | 0% (in) |
| tithe | 17.8% | 3% (greedy>turtle) | 26.9 (13/10) | 72% (-3%) | 2% (-43%) | 0% (-25%) | 0% (in) |
| grace | 18.6% | 1% (greedy>dot-weaver) | 17.6 (9/5) | 70% (-5%) | 0% (-45%) | 0% (-25%) | 0% (in) |
| bastion | 17.1% | 6% (mercy-seeker>aggro-brute) | 18.0 (9/5) | 75% (-0%) | 2% (-43%) | 0% (-25%) | 0% (in) |
| refrain | 7.6% | 5% (mercy-seeker>dot-weaver) | 19.4 (10/5) | 85% (+0%) | 36% (-9%) | 4% (-21%) | 1% (in) |

## Preset × stage detail

| preset | stage | win | statusEng | rounds±σ | util | H | victory/mercy/capit/concede/defeat/retreat |
| --- | --- | --- | --- | --- | --- | --- | --- |
| erosion | early | 78% | 22% | 3.7±0.8 | 100% | 0.92 | 2233/0/0/0/647/0 |
| erosion | mid | 18% | 22% | 4.7±0.8 | 100% | 0.91 | 435/0/0/0/1965/0 |
| erosion | late | 0% | 22% | 4.1±0.7 | 100% | 0.92 | 12/0/0/0/2868/0 |
| erosion | impossible | 0% | 22% | 6.2±1.6 | 100% | 0.91 | 0/0/0/0/480/0 |
| oratory | early | 89% | 18% | 4.4±1.2 | 100% | 0.91 | 2282/0/0/269/329/0 |
| oratory | mid | 64% | 17% | 6.9±2.0 | 100% | 0.91 | 1091/0/0/435/874/0 |
| oratory | late | 14% | 17% | 5.2±1.0 | 100% | 0.91 | 158/0/0/237/2485/0 |
| oratory | impossible | 18% | 17% | 7.1±1.8 | 100% | 0.90 | 1/0/0/87/392/0 |
| foundry | early | 61% | 0% | 3.7±1.0 | 100% | 0.91 | 14/0/1745/0/1121/0 |
| foundry | mid | 0% | 0% | 4.0±0.7 | 100% | 0.91 | 0/0/0/0/2400/0 |
| foundry | late | 0% | 0% | 3.6±0.5 | 100% | 0.91 | 0/0/0/0/2880/0 |
| foundry | impossible | 0% | 0% | 5.1±0.9 | 100% | 0.90 | 0/0/0/0/480/0 |
| penitent | early | 55% | 24% | 3.5±0.8 | 100% | 0.92 | 1583/0/0/0/1297/0 |
| penitent | mid | 5% | 25% | 4.0±0.8 | 100% | 0.91 | 119/0/0/0/2281/0 |
| penitent | late | 0% | 24% | 3.7±0.6 | 100% | 0.91 | 3/0/0/0/2877/0 |
| penitent | impossible | 0% | 25% | 5.2±0.9 | 100% | 0.91 | 0/0/0/0/480/0 |
| standstill | early | 49% | 21% | 4.4±1.0 | 100% | 0.91 | 1304/0/106/0/1470/0 |
| standstill | mid | 0% | 21% | 4.3±0.8 | 100% | 0.91 | 0/0/0/0/2400/0 |
| standstill | late | 0% | 20% | 3.9±0.6 | 100% | 0.92 | 0/0/0/0/2880/0 |
| standstill | impossible | 0% | 21% | 5.5±1.2 | 100% | 0.91 | 0/0/0/0/480/0 |
| augury | early | 41% | 18% | 4.4±0.8 | 100% | 0.91 | 1176/0/0/0/1704/0 |
| augury | mid | 0% | 17% | 4.0±0.6 | 100% | 0.91 | 0/0/0/0/2400/0 |
| augury | late | 0% | 17% | 3.6±0.5 | 100% | 0.91 | 0/0/0/0/2880/0 |
| augury | impossible | 0% | 17% | 4.9±0.8 | 100% | 0.91 | 0/0/0/0/480/0 |
| tithe | early | 72% | 21% | 4.1±1.0 | 100% | 0.92 | 1661/0/415/0/804/0 |
| tithe | mid | 2% | 21% | 5.5±1.9 | 100% | 0.91 | 21/0/18/0/2361/0 |
| tithe | late | 0% | 21% | 4.7±1.4 | 100% | 0.92 | 0/0/0/0/2880/0 |
| tithe | impossible | 0% | 22% | 11.5±6.3 | 100% | 0.88 | 0/0/0/0/480/0 |
| grace | early | 70% | 0% | 5.0±1.6 | 100% | 0.93 | 14/0/2003/0/863/0 |
| grace | mid | 0% | 0% | 6.6±2.9 | 100% | 0.92 | 0/0/9/0/2391/0 |
| grace | late | 0% | 0% | 5.1±1.7 | 100% | 0.93 | 0/0/0/0/2880/0 |
| grace | impossible | 0% | 0% | 16.2±8.3 | 100% | 0.89 | 0/0/0/0/480/0 |
| bastion | early | 75% | 31% | 3.9±0.8 | 100% | 0.91 | 371/0/1787/0/722/0 |
| bastion | mid | 2% | 32% | 5.2±1.5 | 100% | 0.91 | 0/0/44/0/2356/0 |
| bastion | late | 0% | 32% | 4.4±1.1 | 100% | 0.91 | 0/0/0/0/2880/0 |
| bastion | impossible | 0% | 34% | 8.9±4.1 | 100% | 0.89 | 0/0/0/0/480/0 |
| refrain | early | 85% | 25% | 3.3±0.9 | 100% | 0.92 | 2451/0/0/0/429/0 |
| refrain | mid | 36% | 25% | 4.1±0.8 | 100% | 0.91 | 854/0/0/0/1546/0 |
| refrain | late | 4% | 25% | 3.8±0.6 | 100% | 0.92 | 123/0/0/0/2757/0 |
| refrain | impossible | 1% | 25% | 5.4±1.0 | 100% | 0.91 | 4/0/0/0/476/0 |

## Per-policy win rates

| preset | stage | greedy | blind | dot-weaver | control-lock | aggro-brute | turtle | chaos | mercy-seeker |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| erosion | early | 79% | 79% | 78% | 76% | 76% | 75% | 76% | 81% |
| erosion | mid | 25% | 25% | 17% | 17% | 12% | 13% | 16% | 20% |
| erosion | late | 0% | 0% | 0% | 0% | 0% | 1% | 1% | 0% |
| erosion | impossible | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% |
| oratory | early | 90% | 90% | 90% | 88% | 87% | 88% | 87% | 89% |
| oratory | mid | 64% | 64% | 63% | 62% | 61% | 65% | 64% | 64% |
| oratory | late | 14% | 14% | 10% | 12% | 8% | 22% | 18% | 12% |
| oratory | impossible | 12% | 12% | 12% | 10% | 7% | 33% | 35% | 27% |
| foundry | early | 59% | 59% | 60% | 64% | 57% | 63% | 59% | 66% |
| foundry | mid | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% |
| foundry | late | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% |
| foundry | impossible | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% |
| penitent | early | 56% | 56% | 56% | 57% | 48% | 49% | 56% | 61% |
| penitent | mid | 7% | 7% | 4% | 5% | 4% | 3% | 5% | 4% |
| penitent | late | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% |
| penitent | impossible | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% |
| standstill | early | 50% | 50% | 49% | 50% | 44% | 49% | 49% | 50% |
| standstill | mid | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% |
| standstill | late | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% |
| standstill | impossible | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% |
| augury | early | 45% | 45% | 43% | 47% | 41% | 28% | 29% | 48% |
| augury | mid | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% |
| augury | late | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% |
| augury | impossible | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% |
| tithe | early | 76% | 76% | 71% | 72% | 69% | 68% | 71% | 75% |
| tithe | mid | 2% | 2% | 3% | 3% | 0% | 1% | 0% | 2% |
| tithe | late | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% |
| tithe | impossible | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% |
| grace | early | 71% | 71% | 67% | 69% | 68% | 69% | 72% | 72% |
| grace | mid | 1% | 1% | 0% | 0% | 0% | 1% | 0% | 0% |
| grace | late | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% |
| grace | impossible | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% |
| bastion | early | 76% | 76% | 71% | 73% | 69% | 76% | 77% | 80% |
| bastion | mid | 3% | 3% | 0% | 0% | 0% | 0% | 3% | 7% |
| bastion | late | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% |
| bastion | impossible | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% |
| refrain | early | 84% | 84% | 84% | 86% | 86% | 86% | 84% | 87% |
| refrain | mid | 33% | 33% | 34% | 34% | 31% | 40% | 38% | 42% |
| refrain | late | 4% | 4% | 2% | 6% | 5% | 4% | 4% | 6% |
| refrain | impossible | 0% | 0% | 0% | 2% | 0% | 0% | 0% | 5% |

## Per-preset card telemetry


### erosion

Static cx=21.9, keywords=10, orphans=[DRAW, MARK, PREMISE, PROLONG, REARGUE, RECALL, RUPTURE, SIPHON], heaviest=opening-statement (6)

| card | plays | statusLands | free% | fizz% | unpl% | draws | opp% | dWR | hpF | hpP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| opening-statement | 55383 | 19199 | 65% | 0% | 0% | 57377 | 97% | — | 0 | 1508821 |
| slippery-slope | 50793 | 22346 | 56% | 0% | 0% | 52608 | 97% | — | 0 | 1176598 |
| currys-conversion | 28701 | 0 | 78% | 7% | 0% | 28459 | 100% | -69% | 0 | 22109 |
| festering-argument | 27844 | 0 | 66% | 0% | 0% | 28744 | 97% | — | 0 | 85331 |
| resonance-detonation | 13539 | 2464 | 80% | 4% | 0% | 14279 | 95% | -70% | 0 | 593313 |
| venom-and-vein | 13107 | 0 | 84% | 0% | 0% | 13016 | 100% | -69% | 0 | 0 |
| suppurating-curse | 11715 | 0 | 67% | 0% | 0% | 11635 | 100% | -69% | 0 | 0 |

### oratory

Static cx=16.0, keywords=8, orphans=[BLEED, GUARD, RUPTURE, STAGGER], heaviest=mounting-case (8)

| card | plays | statusLands | free% | fizz% | unpl% | draws | opp% | dWR | hpF | hpP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| brace-for-impact | 73165 | 0 | 65% | 0% | 0% | 77270 | 95% | — | 0 | 196908 |
| exordium | 66224 | 26283 | 60% | 0% | 0% | 70476 | 94% | — | 3201 | 2446934 |
| mounting-case | 37193 | 18374 | 51% | 0% | 0% | 38659 | 96% | — | 378 | 1686138 |
| peroratio-interrupta | 36865 | 0 | 72% | 0% | 0% | 39147 | 94% | — | 2566 | 1600256 |
| the-closing-word | 18170 | 0 | 79% | 0% | 0% | 19458 | 93% | — | 985 | 21927 |
| quagmire-of-doubt | 14859 | 0 | 80% | 0% | 0% | 15653 | 95% | -47% | 0 | 0 |
| venom-and-vein | 14719 | 0 | 76% | 0% | 0% | 15420 | 95% | -47% | 0 | 0 |

### foundry

Static cx=21.6, keywords=10, orphans=[DRAW, FORETELL, KINDLE, OMEN, RIPOSTE, RUPTURE, SWAY], heaviest=the-overtake (6)

| card | plays | statusLands | free% | fizz% | unpl% | draws | opp% | dWR | hpF | hpP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| half-step | 48190 | 0 | 49% | 0% | 0% | 48213 | 100% | — | 0 | 2191 |
| signs-and-portents | 46394 | 0 | 55% | 0% | 0% | 46442 | 100% | -80% | 0 | 2626 |
| ex-nihilo | 24424 | 0 | 53% | 0% | 0% | 24438 | 100% | -77% | 0 | 1057 |
| bootstrap-loop | 23909 | 0 | 44% | 0% | 0% | 23923 | 100% | -80% | 0 | 990 |
| the-overtake | 12356 | 0 | 91% | 21% | 0% | 12359 | 100% | -81% | 0 | 28076 |
| anvil-of-form | 10167 | 0 | 52% | 0% | 0% | 10170 | 100% | -75% | 0 | 0 |
| mirror-of-longing | 10155 | 0 | 49% | 0% | 0% | 10158 | 100% | +20% | 0 | 0 |

### penitent

Static cx=30.9, keywords=14, orphans=[BACKFIRE, DRAW, FALLEN, FORETELL, FORGE, GUARD, HEAL, MARK, POISON, RUPTURE, SOUL, STAGGER], heaviest=pact-of-akrasia (11)

| card | plays | statusLands | free% | fizz% | unpl% | draws | opp% | dWR | hpF | hpP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| sweet-poison | 53059 | 22473 | 58% | 0% | 0% | 54153 | 98% | — | 0 | 931854 |
| against-my-judgment | 46982 | 10691 | 63% | 0% | 0% | 48555 | 97% | -80% | 0 | 83630 |
| delphic-ambiguity | 26267 | 0 | 76% | 6% | 0% | 26943 | 97% | — | 0 | 346048 |
| undistributed-middle | 25692 | 11145 | 57% | 0% | 0% | 26250 | 98% | -80% | 0 | 48926 |
| pact-of-akrasia | 13739 | 1888 | 80% | 0% | 0% | 14090 | 98% | -78% | 0 | 147428 |
| crown-of-thorns | 11262 | 0 | 71% | 0% | 0% | 11595 | 97% | -63% | 0 | 0 |
| mirror-of-guilt | 11153 | 0 | 72% | 0% | 0% | 11385 | 98% | -80% | 0 | 0 |

### standstill

Static cx=26.0, keywords=13, orphans=[BLEED, FORETELL, HEAL, OMEN, POISON, RIPOSTE, STAGGER, SWAY, THORNS], heaviest=cassandras-burden (9)

| card | plays | statusLands | free% | fizz% | unpl% | draws | opp% | dWR | hpF | hpP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| red-herring | 60222 | 21132 | 65% | 0% | 0% | 60682 | 99% | — | 0 | 39745 |
| zenos-half-step | 55543 | 0 | 67% | 0% | 0% | 56034 | 99% | — | 0 | 35203 |
| cassandras-burden | 29749 | 9667 | 68% | 0% | 0% | 30006 | 99% | +16% | 0 | 134313 |
| fallen-grace | 28983 | 14314 | 51% | 0% | 0% | 29187 | 99% | — | 0 | 813548 |
| turnabout | 15171 | 0 | 82% | 0% | 0% | 15312 | 99% | +16% | 0 | 21081 |
| mirror-of-longing | 13566 | 0 | 83% | 0% | 0% | 13725 | 99% | -69% | 0 | 0 |
| hedgehogs-dilemma | 13553 | 0 | 83% | 0% | 0% | 13646 | 99% | -84% | 0 | 0 |

### augury

Static cx=20.1, keywords=10, orphans=[BACKFIRE, DRAW, GUARD, MARK, POISON, RECOIL], heaviest=glimpse (6)

| card | plays | statusLands | free% | fizz% | unpl% | draws | opp% | dWR | hpF | hpP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| signs-and-portents | 50067 | 0 | 67% | 0% | 0% | 51283 | 98% | — | 0 | 45147 |
| glimpse | 48575 | 21340 | 56% | 0% | 0% | 49590 | 98% | — | 0 | 301143 |
| arrow-paradox | 25094 | 10812 | 57% | 0% | 0% | 25446 | 99% | — | 0 | 22079 |
| self-flagellant | 24938 | 0 | 76% | 0% | 0% | 25556 | 98% | — | 0 | 115460 |
| prophecy-fulfilled | 12518 | 0 | 73% | 0% | 0% | 12799 | 98% | +14% | 0 | 54211 |
| crumbling-resolve | 10924 | 0 | 66% | 0% | 0% | 11082 | 99% | -87% | 0 | 0 |
| the-oracles-eye | 10792 | 0 | 74% | 0% | 0% | 10998 | 98% | -33% | 0 | 0 |

### tithe

Static cx=26.9, keywords=13, orphans=[BLEED, DRAW, ECHO, HEAL, KINDLE, MARK, MILL, RAPPORT, SIPHON, SWAY], heaviest=disarming-smile (5)

| card | plays | statusLands | free% | fizz% | unpl% | draws | opp% | dWR | hpF | hpP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| disarming-smile | 75156 | 25851 | 66% | 0% | 0% | 75878 | 99% | — | 0 | 4623 |
| brief-candle | 70213 | 28047 | 60% | 0% | 0% | 69604 | 100% | — | 210785 | 1589177 |
| circular-reasoning | 38753 | 3660 | 63% | 11% | 0% | 38223 | 100% | — | 0 | 295831 |
| the-gleaners-due | 38631 | 0 | 75% | 12% | 0% | 36067 | 100% | — | 177380 | 108393 |
| the-reaping | 21756 | 0 | 82% | 0% | 0% | 18694 | 100% | -12% | 781257 | 87603 |
| stuck-in-their-head | 16629 | 0 | 77% | 0% | 0% | 15020 | 100% | -27% | 0 | 0 |
| bone-orchard | 12670 | 0 | 55% | 0% | 0% | 12030 | 100% | -59% | 0 | 0 |

### grace

Static cx=17.6, keywords=9, orphans=[CLEANSE, HEAL, RECALL, RIPOSTE, STAGGER], heaviest=second-thoughts (5)

| card | plays | statusLands | free% | fizz% | unpl% | draws | opp% | dWR | hpF | hpP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| second-thoughts | 75444 | 0 | 65% | 16% | 0% | 75991 | 99% | — | 0 | 7899 |
| soft-word | 68818 | 0 | 56% | 0% | 0% | 69223 | 99% | — | 0 | 6755 |
| the-olive-branch | 41656 | 0 | 57% | 0% | 0% | 36226 | 100% | +23% | 0 | 2623 |
| measured-answer | 40720 | 0 | 66% | 0% | 0% | 36141 | 100% | -16% | 0 | 5786 |
| ouroboros | 24053 | 0 | 100% | 30% | 0% | 19571 | 100% | -7% | 0 | 0 |
| irresistible-grace | 16604 | 0 | 77% | 0% | 0% | 14222 | 100% | +2% | 0 | 0 |
| crumbling-resolve | 16211 | 0 | 73% | 0% | 0% | 12495 | 100% | -7% | 0 | 0 |

### bastion

Static cx=18.0, keywords=9, orphans=[DRAW, ECHO, KINDLE, PIP, RAPPORT], heaviest=common-ground (7)

| card | plays | statusLands | free% | fizz% | unpl% | draws | opp% | dWR | hpF | hpP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| sketch-of-a-thought | 60729 | 33262 | 45% | 0% | 0% | 61610 | 99% | — | 0 | 1714380 |
| nettle-cloak | 57514 | 24343 | 58% | 0% | 0% | 58343 | 99% | — | 0 | 2098959 |
| tu-quoque | 30160 | 0 | 68% | 0% | 0% | 30607 | 99% | -75% | 0 | 1729 |
| common-ground | 29790 | 12420 | 58% | 0% | 0% | 30116 | 99% | -75% | 0 | 886 |
| the-adamant-wall | 15399 | 0 | 75% | 0% | 0% | 15678 | 98% | -75% | 0 | 477 |
| mirror-of-longing | 12759 | 0 | 75% | 0% | 0% | 12912 | 99% | -75% | 0 | 0 |
| resonant-chamber | 11623 | 0 | 62% | 0% | 0% | 11757 | 99% | -75% | 0 | 0 |

### refrain

Static cx=19.4, keywords=10, orphans=[BLEED, PREMISE, RECALL, RECOIL, SOUL], heaviest=refrain (7)

| card | plays | statusLands | free% | fizz% | unpl% | draws | opp% | dWR | hpF | hpP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| opening-statement | 42488 | 19323 | 55% | 0% | 0% | 45126 | 94% | -60% | 0 | 1540240 |
| refrain | 40058 | 17518 | 56% | 0% | 0% | 43272 | 93% | — | 0 | 2896187 |
| winnowing | 20752 | 0 | 75% | 13% | 0% | 21922 | 95% | -37% | 59634 | 986106 |
| self-flagellant | 20609 | 0 | 56% | 0% | 0% | 21815 | 94% | -33% | 0 | 1091690 |
| ouroboros | 10603 | 1557 | 85% | 12% | 0% | 11917 | 89% | -15% | 0 | 248385 |
| stuck-in-their-head | 9931 | 0 | 82% | 0% | 0% | 10628 | 93% | -33% | 0 | 0 |
| venom-and-vein | 9773 | 0 | 58% | 0% | 0% | 10371 | 94% | -5% | 0 | 0 |

## Global per-card rollup (all cells)

| card | plays | statusLands | fizz% | unpl% | draws | opp% | dWR | exposedRuns |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| opening-statement | 97871 | 38522 | 0% | 0% | 102503 | 95% | -65% | 17280 |
| signs-and-portents | 96461 | 0 | 0% | 0% | 97725 | 99% | -83% | 17280 |
| second-thoughts | 75444 | 0 | 16% | 0% | 75991 | 99% | — | 8640 |
| disarming-smile | 75156 | 25851 | 0% | 0% | 75878 | 99% | — | 8640 |
| brace-for-impact | 73165 | 0 | 0% | 0% | 77270 | 95% | — | 8640 |
| brief-candle | 70213 | 28047 | 0% | 0% | 69604 | 100% | — | 8640 |
| soft-word | 68818 | 0 | 0% | 0% | 69223 | 99% | — | 8640 |
| exordium | 66224 | 26283 | 0% | 0% | 70476 | 94% | — | 8640 |
| sketch-of-a-thought | 60729 | 33262 | 0% | 0% | 61610 | 99% | — | 8640 |
| red-herring | 60222 | 21132 | 0% | 0% | 60682 | 99% | — | 8640 |
| nettle-cloak | 57514 | 24343 | 0% | 0% | 58343 | 99% | — | 8640 |
| zenos-half-step | 55543 | 0 | 0% | 0% | 56034 | 99% | — | 8640 |
| sweet-poison | 53059 | 22473 | 0% | 0% | 54153 | 98% | — | 8640 |
| slippery-slope | 50793 | 22346 | 0% | 0% | 52608 | 97% | — | 8640 |
| glimpse | 48575 | 21340 | 0% | 0% | 49590 | 98% | — | 8640 |
| half-step | 48190 | 0 | 0% | 0% | 48213 | 100% | — | 8640 |
| against-my-judgment | 46982 | 10691 | 0% | 0% | 48555 | 97% | -80% | 8640 |
| self-flagellant | 45547 | 0 | 0% | 0% | 47371 | 96% | -46% | 17280 |
| the-olive-branch | 41656 | 0 | 0% | 0% | 36226 | 100% | +23% | 8640 |
| measured-answer | 40720 | 0 | 0% | 0% | 36141 | 100% | -16% | 8640 |
| refrain | 40058 | 17518 | 0% | 0% | 43272 | 93% | — | 8640 |
| circular-reasoning | 38753 | 3660 | 11% | 0% | 38223 | 100% | — | 8640 |
| the-gleaners-due | 38631 | 0 | 12% | 0% | 36067 | 100% | — | 8640 |
| venom-and-vein | 37599 | 0 | 0% | 0% | 38807 | 97% | -4% | 25920 |
| mounting-case | 37193 | 18374 | 0% | 0% | 38659 | 96% | — | 8640 |
| peroratio-interrupta | 36865 | 0 | 0% | 0% | 39147 | 94% | — | 8640 |
| mirror-of-longing | 36480 | 0 | 0% | 0% | 36795 | 99% | -63% | 25920 |
| ouroboros | 34656 | 1557 | 26% | 0% | 31488 | 100% | -18% | 17280 |
| tu-quoque | 30160 | 0 | 0% | 0% | 30607 | 99% | -75% | 8640 |
| common-ground | 29790 | 12420 | 0% | 0% | 30116 | 99% | -75% | 8640 |
| cassandras-burden | 29749 | 9667 | 0% | 0% | 30006 | 99% | +16% | 8640 |
| fallen-grace | 28983 | 14314 | 0% | 0% | 29187 | 99% | — | 8640 |
| currys-conversion | 28701 | 0 | 7% | 0% | 28459 | 100% | -69% | 8640 |
| festering-argument | 27844 | 0 | 0% | 0% | 28744 | 97% | — | 8640 |
| crumbling-resolve | 27135 | 0 | 0% | 0% | 23577 | 100% | -14% | 17280 |
| stuck-in-their-head | 26560 | 0 | 0% | 0% | 25648 | 100% | -38% | 17280 |
| delphic-ambiguity | 26267 | 0 | 6% | 0% | 26943 | 97% | — | 8640 |
| undistributed-middle | 25692 | 11145 | 0% | 0% | 26250 | 98% | -80% | 8640 |
| arrow-paradox | 25094 | 10812 | 0% | 0% | 25446 | 99% | — | 8640 |
| ex-nihilo | 24424 | 0 | 0% | 0% | 24438 | 100% | -77% | 8640 |
| bootstrap-loop | 23909 | 0 | 0% | 0% | 23923 | 100% | -80% | 8640 |
| the-reaping | 21756 | 0 | 0% | 0% | 18694 | 100% | -12% | 8640 |
| winnowing | 20752 | 0 | 13% | 0% | 21922 | 95% | -37% | 8640 |
| the-closing-word | 18170 | 0 | 0% | 0% | 19458 | 93% | — | 8640 |
| irresistible-grace | 16604 | 0 | 0% | 0% | 14222 | 100% | +2% | 8640 |
| the-adamant-wall | 15399 | 0 | 0% | 0% | 15678 | 98% | -75% | 8640 |
| turnabout | 15171 | 0 | 0% | 0% | 15312 | 99% | +16% | 8640 |
| quagmire-of-doubt | 14859 | 0 | 0% | 0% | 15653 | 95% | -47% | 8640 |
| pact-of-akrasia | 13739 | 1888 | 0% | 0% | 14090 | 98% | -78% | 8640 |
| hedgehogs-dilemma | 13553 | 0 | 0% | 0% | 13646 | 99% | -84% | 8640 |
| resonance-detonation | 13539 | 2464 | 4% | 0% | 14279 | 95% | -70% | 8640 |
| bone-orchard | 12670 | 0 | 0% | 0% | 12030 | 100% | -59% | 8640 |
| prophecy-fulfilled | 12518 | 0 | 0% | 0% | 12799 | 98% | +14% | 8640 |
| the-overtake | 12356 | 0 | 21% | 0% | 12359 | 100% | -81% | 8640 |
| suppurating-curse | 11715 | 0 | 0% | 0% | 11635 | 100% | -69% | 8640 |
| resonant-chamber | 11623 | 0 | 0% | 0% | 11757 | 99% | -75% | 8640 |
| crown-of-thorns | 11262 | 0 | 0% | 0% | 11595 | 97% | -63% | 8640 |
| mirror-of-guilt | 11153 | 0 | 0% | 0% | 11385 | 98% | -80% | 8640 |
| the-oracles-eye | 10792 | 0 | 0% | 0% | 10998 | 98% | -33% | 8640 |
| anvil-of-form | 10167 | 0 | 0% | 0% | 10170 | 100% | -75% | 8640 |


# Comparison: flagoff-s1 → flagon-s1

| preset | stage | win flagoff-s1 | win flagon-s1 | Δwin | statusEng flagoff-s1 | statusEng flagon-s1 | ΔstatusEng |
| --- | --- | --- | --- | --- | --- | --- | --- |
| erosion | early | 89% | 78% | -11% | 28% | 22% | -6% |
| erosion | mid | 40% | 18% | -22% | 30% | 22% | -8% |
| erosion | late | 4% | 0% | -3% | 29% | 22% | -8% |
| erosion | impossible | 1% | 0% | -1% | 31% | 22% | -9% |
| oratory | early | 91% | 89% | -3% | 20% | 18% | -3% |
| oratory | mid | 66% | 64% | -2% | 20% | 17% | -3% |
| oratory | late | 17% | 14% | -3% | 19% | 17% | -2% |
| oratory | impossible | 32% | 18% | -14% | 20% | 17% | -4% |
| foundry | early | 62% | 61% | -1% | 0% | 0% | 0% |
| foundry | mid | 0% | 0% | 0% | 0% | 0% | 0% |
| foundry | late | 0% | 0% | 0% | 0% | 0% | 0% |
| foundry | impossible | 0% | 0% | 0% | 0% | 0% | 0% |
| penitent | early | 76% | 55% | -21% | 31% | 24% | -7% |
| penitent | mid | 15% | 5% | -10% | 32% | 25% | -7% |
| penitent | late | 0% | 0% | +0% | 31% | 24% | -7% |
| penitent | impossible | 0% | 0% | 0% | 34% | 25% | -9% |
| standstill | early | 73% | 49% | -24% | 29% | 21% | -8% |
| standstill | mid | 0% | 0% | -0% | 28% | 21% | -7% |
| standstill | late | 0% | 0% | 0% | 27% | 20% | -7% |
| standstill | impossible | 0% | 0% | 0% | 29% | 21% | -8% |
| augury | early | 62% | 41% | -21% | 24% | 18% | -6% |
| augury | mid | 3% | 0% | -3% | 22% | 17% | -5% |
| augury | late | 0% | 0% | 0% | 23% | 17% | -5% |
| augury | impossible | 0% | 0% | 0% | 23% | 17% | -5% |
| tithe | early | 84% | 72% | -12% | 29% | 21% | -8% |
| tithe | mid | 13% | 2% | -12% | 29% | 21% | -8% |
| tithe | late | 0% | 0% | 0% | 28% | 21% | -8% |
| tithe | impossible | 0% | 0% | 0% | 29% | 22% | -7% |
| grace | early | 70% | 70% | -0% | 0% | 0% | 0% |
| grace | mid | 0% | 0% | +0% | 0% | 0% | 0% |
| grace | late | 0% | 0% | 0% | 0% | 0% | 0% |
| grace | impossible | 0% | 0% | 0% | 0% | 0% | 0% |
| bastion | early | 80% | 75% | -5% | 37% | 31% | -6% |
| bastion | mid | 4% | 2% | -2% | 40% | 32% | -8% |
| bastion | late | 0% | 0% | 0% | 40% | 32% | -8% |
| bastion | impossible | 0% | 0% | 0% | 43% | 34% | -9% |
| refrain | early | 90% | 85% | -5% | 33% | 25% | -8% |
| refrain | mid | 51% | 36% | -15% | 34% | 25% | -9% |
| refrain | late | 8% | 4% | -4% | 33% | 25% | -8% |
| refrain | impossible | 1% | 1% | +0% | 35% | 25% | -9% |

Mean |Δwin| = 4.8%; max |Δwin| = 23.6% over 40 preset×stage rows.