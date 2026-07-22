# Table Edition — simulator results archive
Generated 2026-07-22 · table-edition-sim.mjs · seed 20260722 · VOID (never filed to plan/)

## Rules assumptions (rulebook gaps)
```
RULES CALLS THE SIM HAD TO MAKE (each one is a rulebook gap):

 1. Chain: GREY/GOLD Paid plays are chain-neutral (neither advance nor break). Doc only names the three colors.
 2. Chain: a chain-breaking Paid play resets to EMPTY (does not re-enter as link 1). Per owner memory "breaks to null".
 3. Stagger: reduces the telegraph's printed number (per-hit for multi-hits); fizzle when it reaches 0 at resolve time.
 4. Stagger on non-attacks: Vanish/Hunker guard N-stagger; Bristle fizzles at 1 Stagger; Molt heal reduced, blight-removal fixed at 2; Catch Breath counts as power 0 (already fizzled) — Dead Air ECHO applies.
 5. Thorns: trigger once per HIT instance (Flurry = 3 triggers), even if Guard fully absorbs the hit.
 6. Enemy thorns (Bristle): retaliate once per player DIRECT-damage event. Blight ticks are not "hits" — no thorns either way.
 7. Guard absorbs ALL damage including Blight ticks (both sides).
 8. ATTUNE stacks additively until the next sig fires; sig cost floors at 0.
 9. ECHO on Half-Step push: the pushed die's Paid play fires its paid line twice.
10. Whispered Doubt: the next REAL card revealed after it fires is discarded (enemy loses that action), then reveal continues.
11. Sealed Fate: the enemy's next full turn (resolve + reveal) is skipped, and it takes 3.
12. Rites: sacrificed automatically the moment they reach threshold.
13. Enchant copies stack (two Standing Waves = 6 burst damage). Max 3 enchants; playing a 4th is illegal.
14. Sig pairs are fixed per preset (see SIG_PICKS) — a real player chooses at setup.
15. Player deck reshuffles discard when empty; enemy Last Stand flips discard unshuffled (chronological order).
16. Hand refills to 5 at turn start only; no mid-turn hand cap.
17. Press Fate: 1◆, rerolls ALL misses at once, once per round (spec 33).
18. Turn order: player acts first; the pre-revealed telegraph resolves at end of player turn 1.
19. Stall guard: 40 rounds without a kill = recorded as a stall (reported separately, counts as non-win).
```

## SOLO — 7 presets × 3 enemies × 3 recipes × 3 brains (300 games/cell)
```

AXIOMANCER TABLE EDITION — batch sim · 300 games/cell · seed 20260722 · 4.4s
presets: STANDSTILL, CONTAGION, BASTION, FOUNDRY, TORRENT, INVOCATION, MALISON · enemies: SKULK, SHELLBACK, BRUTE · brains: random, greedy, smart

==================== BRAIN: RANDOM ====================
PRESET      SKULK·E SKULK·S SKULK·H SHELL·E SHELL·S SHELL·H BRUTE·E BRUTE·S BRUTE·H
STANDSTILL       6%      5%      4%      0%      1%      2%      1%      1%      1%
CONTAGION       99%     99%     98%     84%     77%     71%     89%     79%     59%
BASTION        100%    100%    100%     87%     72%     52%     96%     82%     80%
FOUNDRY          1%      1%      0%      0%      0%      0%      0%      0%      0%
TORRENT         32%     22%     14%      1%      2%      2%      5%      2%      1%
INVOCATION      31%     26%     29%      1%      1%      1%      8%      5%      1%
MALISON         88%     85%     78%     36%     33%     27%     47%     29%     15%

==================== BRAIN: GREEDY ====================
PRESET      SKULK·E SKULK·S SKULK·H SHELL·E SHELL·S SHELL·H BRUTE·E BRUTE·S BRUTE·H
STANDSTILL      99%    100%    100%     89%     88%     88%     97%     94%     95%
CONTAGION      100%    100%    100%    100%    100%    100%    100%    100%    100%
BASTION        100%    100%    100%    100%    100%    100%    100%    100%    100%
FOUNDRY         15%      4%     14%      0%      0%      0%      0%      0%      0%
TORRENT        100%    100%    100%    100%    100%    100%    100%    100%    100%
INVOCATION      33%     33%     38%      9%      8%      9%     16%     18%     16%
MALISON        100%    100%    100%    100%    100%    100%    100%    100%    100%

==================== BRAIN: SMART ====================
PRESET      SKULK·E SKULK·S SKULK·H SHELL·E SHELL·S SHELL·H BRUTE·E BRUTE·S BRUTE·H
STANDSTILL     100%    100%    100%    100%     99%     98%    100%     99%     97%
CONTAGION      100%    100%    100%    100%    100%    100%    100%    100%    100%
BASTION        100%    100%    100%    100%    100%    100%    100%    100%    100%
FOUNDRY        100%    100%    100%     98%     98%     90%    100%     99%     96%
TORRENT        100%    100%    100%    100%    100%    100%    100%    100%    100%
INVOCATION     100%    100%    100%    100%    100%    100%    100%    100%    100%
MALISON        100%    100%    100%    100%    100%    100%    100%    100%    100%

==================== STANDARD-RECIPE DETAIL (smartest brain available) ====================
brain: smart
PRESET      ENEMY        WIN  STALL  ROUNDS  VITAE  BURSTS  SIGS  ◆EARN  PRESS  HEX  FREE  PAID
STANDSTILL  SKULK       100%     0%    13.7   29.6     7.7   3.5   29.0    9.9  0.0  52.0  35.8
STANDSTILL  SHELLBACK    99%     1%    19.4   27.3    11.9   5.2   42.9   14.9  0.0  67.1  52.9
STANDSTILL  BRUTE        99%     0%    19.6   23.6    11.5   5.0   42.0   14.1  0.0  75.2  51.6
CONTAGION   SKULK       100%     0%     4.2   27.3     1.2   0.5    6.1    1.9  0.0  12.6   8.1
CONTAGION   SHELLBACK   100%     0%     5.3   24.6     1.7   0.7    8.3    2.8  0.0  16.1  10.7
CONTAGION   BRUTE       100%     0%     5.2   22.0     1.7   0.7    8.1    2.7  0.0  15.8  10.6
BASTION     SKULK       100%     0%     6.1   29.9     2.2   0.6    8.6    3.3  0.0  23.9  11.4
BASTION     SHELLBACK   100%     0%     9.4   29.8     4.2   1.3   15.1    6.1  0.0  36.5  19.3
BASTION     BRUTE       100%     0%     6.7   29.6     2.5   0.7    9.8    3.8  0.0  26.8  13.0
FOUNDRY     SKULK       100%     0%     6.5   25.9     4.2   3.8   22.6    1.3  0.0   9.0  21.0
FOUNDRY     SHELLBACK    98%     0%     8.5   12.2     6.0   5.8   32.5    1.4  0.0  11.9  28.0
FOUNDRY     BRUTE        99%     0%     7.6   18.0     5.2   5.0   28.2    1.4  0.0  10.6  25.0
TORRENT     SKULK       100%     0%     3.5   29.7     5.5   0.6    7.5    2.4  0.0  11.9   9.3
TORRENT     SHELLBACK   100%     0%     3.9   26.5     6.3   0.6    8.8    2.7  0.0  13.3  10.5
TORRENT     BRUTE       100%     0%     4.0   28.6     6.5   0.7    9.1    2.9  0.0  13.6  11.0
INVOCATION  SKULK       100%     0%     3.1   28.5     0.9   4.4   10.7    2.2  0.0   7.4   6.3
INVOCATION  SHELLBACK   100%     0%     3.7   24.1     1.2   6.1   13.5    2.8  0.0   9.4   8.0
INVOCATION  BRUTE       100%     0%     3.7   25.4     1.2   6.0   13.3    2.8  0.0   9.4   7.9
MALISON     SKULK       100%     0%     3.6   27.9     5.7   0.3    6.3    1.9 10.2  18.5   7.8
MALISON     SHELLBACK   100%     0%     4.0   24.1     6.7   0.4    7.6    2.2 11.4  22.2   9.0
MALISON     BRUTE       100%     0%     4.0   24.9     6.8   0.5    7.8    2.3 11.5  22.4   9.2

==================== SKILL GRADIENT (win% std recipe: random → smart) ====================
How much the pilot matters = how intense the rulebook/teach needs to be.

STANDSTILL  SKULK:   5%→100%   SHELL:   1%→ 99%   BRUTE:   1%→ 99%
CONTAGION   SKULK:  99%→100%   SHELL:  77%→100%   BRUTE:  79%→100%
BASTION     SKULK: 100%→100%   SHELL:  72%→100%   BRUTE:  82%→100%
FOUNDRY     SKULK:   1%→100%   SHELL:   0%→ 98%   BRUTE:   0%→ 99%
TORRENT     SKULK:  22%→100%   SHELL:   2%→100%   BRUTE:   2%→100%
INVOCATION  SKULK:  26%→100%   SHELL:   1%→100%   BRUTE:   5%→100%
MALISON     SKULK:  85%→100%   SHELL:  33%→100%   BRUTE:  29%→100%

==================== RECIPE SPREAD (best brain, win% easy/std/hard) — §6's primary hypothesis ====================
STANDSTILL  SKULK: 100%/100%/100%   SHELL: 100%/ 99%/ 98%   BRUTE: 100%/ 99%/ 97%
CONTAGION   SKULK: 100%/100%/100%   SHELL: 100%/100%/100%   BRUTE: 100%/100%/100%
BASTION     SKULK: 100%/100%/100%   SHELL: 100%/100%/100%   BRUTE: 100%/100%/100%
FOUNDRY     SKULK: 100%/100%/100%   SHELL:  98%/ 98%/ 90%   BRUTE: 100%/ 99%/ 96%
TORRENT     SKULK: 100%/100%/100%   SHELL: 100%/100%/100%   BRUTE: 100%/100%/100%
INVOCATION  SKULK: 100%/100%/100%   SHELL: 100%/100%/100%   BRUTE: 100%/100%/100%
MALISON     SKULK: 100%/100%/100%   SHELL: 100%/100%/100%   BRUTE: 100%/100%/100%

Run with --assumptions to see the rules calls the sim had to make (rulebook gaps).
Numbers are lower bounds on deck strength: the "smart" brain is a heuristic, not an oracle.
```

## PVP (exploratory) — shared pool, 1 shared die each, HP sweep + calibrated matrix (300 games/pair)
```

HP SWEEP — mean rounds across all 49 pairings (60 games/pair), draw% at the 60-round cap:
  HP  30: mean 10.0 rounds · draws 4%
  HP  45: mean 12.0 rounds · draws 4%
  HP  60: mean 13.8 rounds · draws 4%
  HP  80: mean 16.0 rounds · draws 5%
  HP 100: mean 18.1 rounds · draws 5%
  HP 120: mean 20.1 rounds · draws 7%
  HP 150: mean 22.4 rounds · draws 11%
  → calibrated: HP 100 (mean 18.1 rounds). Full matrix below runs at this HP.


PVP EXPERIMENT — shared 4-die pool, 1 shared die each, HP 100, PvP sig loadouts · brain: smart · 300 games/pair · 6.1s
Cell = row preset (P1, acts first) win% vs column preset. Diagonal >50% = first-mover advantage.

P1 \ P2     STANDS CONTAG BASTIO FOUNDR TORREN INVOCA MALISO
STANDSTILL       0      0      0      0      0      0      0
CONTAGION      100     77     10    100      0     10      5
BASTION        100    100     54    100      0     87      1
FOUNDRY          0      0      0      0      0      0      0
TORRENT        100    100    100    100     73     97     16
INVOCATION     100     99     54    100     21     76      7
MALISON        100    100    100    100     96    100     75

Draw% (30-round cap) and avg rounds:
P1 \ P2       STANDS   CONTAG   BASTIO   FOUNDR   TORREN   INVOCA   MALISO
STANDSTILL    100·60     0·26     2·45   100·60     0·13     0·15     0· 9
CONTAGION       0·24     0·14     0·27     0·14     0·11     0·12     0· 9
BASTION         0·38     0·24    40·54     0·25     0·15     0·18     0·10
FOUNDRY         1·52     0·11     0·18     0·47     0· 9     0· 9     0· 7
TORRENT         0·12     0·10     0·14     0·10     0·11     0·10     0· 8
INVOCATION      0·13     0·11     0·18     0·11     0·11     0·10     0· 8
MALISON         0· 8     0· 7     0· 8     0· 7     0· 8     0· 8     0· 8

Overall strength (avg win% across all opponents, as P1 / as P2 / first-mover edge in the mirror):
STANDSTILL  P1    0%   P2   14%   mirror P1-edge    0% vs    0%
CONTAGION   P1   43%   P2   32%   mirror P1-edge   77% vs   23%
BASTION     P1   63%   P2   49%   mirror P1-edge   54% vs    6%
FOUNDRY     P1    0%   P2   14%   mirror P1-edge    0% vs  100%
TORRENT     P1   84%   P2   73%   mirror P1-edge   73% vs   27%
INVOCATION  P1   65%   P2   47%   mirror P1-edge   76% vs   24%
MALISON     P1   96%   P2   85%   mirror P1-edge   75% vs   25%

PVP NOTES (what this mode does to the mechanics):
1. DEAD in PvP as written: STAGGER, Turnabout, Dead Air, Motion to Suppress riders, The Final Word (no telegraph to sit on). Standstill fights with half a deck.
2. NEARLY DEAD: White Heat (needs a 2nd die; only a personal burst/kindle die qualifies under the 1-shared-die law). The Forge Eternal (shared dice reroll every round) = no-op.
3. SHARED-POOL spillover: TEMPER, Annealing, Kindled Fury and Press Fate improve/reroll the SHARED pool — the opponent can inherit your upgraded dice. Genuine semi-co-op texture, genuine feel-bad risk.
4. Personal dice exist: Surge-Burst gold dice and KINDLE dice belong to their owner and are spendable beyond the 1-shared-die law (kindled dice still expire at end of turn).
5. HEX works beautifully symmetric: curses slide into the OPPONENT's draw deck and fire when drawn. Whispered Doubt eats the drawer's next card; Sealed Fate skips the turn it is drawn into.
6. Blight ticks at the end of the afflicted player's turn; Guard persists through the opponent's turn and fades at your next turn start; thorns retaliate on direct hits.
7. Both players use the same brain tier and the same fixed SIG_PICKS. P1 = row preset, acts first every round: the diagonal measures pure first-mover advantage.
```

## CO-OP (exploratory) — knob sweep: party size × enemy actions × HP mult (200 games/cell)
```

CO-OP EXPERIMENT — shared 4-die pool, 1 paid play each per round · brain: smart · 200 games/cell
Cell = party win% · avg rounds. Party & enemy randomized per game (std recipe).
Hypothesis under test: enemy actions = player count, HP = solo × player count.

---------- 2 PLAYERS ----------
HP mult \ T         T=1        T=2
×1               94%·9r     75%·8r
×1.5            94%·11r     60%·9r
×2              84%·13r    48%·10r
×3              79%·15r    33%·11r

---------- 3 PLAYERS ----------
HP mult \ T         T=1        T=2        T=3
×1              100%·6r     97%·6r     87%·6r
×2              100%·9r     87%·8r     63%·7r
×3              97%·11r    81%·10r     50%·8r
×4              96%·13r    60%·11r     38%·9r

---------- 4 PLAYERS ----------
HP mult \ T         T=1        T=2        T=3        T=4
×1              100%·4r    100%·4r    100%·4r     94%·4r
×2              100%·6r    100%·6r     98%·6r     82%·6r
×4              100%·9r     92%·9r     72%·8r     53%·7r
×6              98%·12r    74%·11r    48%·10r     22%·8r

COOP NOTES:
1. Shared pool is 4 dice regardless of party size — at 3-4 players most rounds someone's color simply isn't there. Dice starvation is the defining constraint of big parties.
2. One paid play per player per round (the round-end trigger). A player with no usable die and no wish to wait may FORFEIT their paid play so the round can end.
3. Free plays are a timing resource: the round does not end until the last paid play, so stalling your pay lets the party squeeze in extra free turns. The smart brain exploits this mildly.
4. Enemy plays T cards per turn: resolve telegraph, reveal, repeat T times. Only the first resolution of each turn was telegraphed a full round ahead — the rest resolve on reveal. T is the pressure knob.
5. Enemy attacks target on rotation, assigned at REVEAL time (the party can see who the telegraph is aimed at and guard accordingly).
6. ANY player at 0 Vitae = party loss. Enemy blight/stagger/HEX all work exactly as solo. Fired-curse pile is communal (Weight of Guilt counts all of it).
7. White Heat's second die must be a personal (burst/kindle) die — the 1-paid-die law forbids a second shared spend.
8. Sigs are the SOLO picks (telegraph sigs live again). Party members share nothing else: hands, ◆, chains, and enchants are personal.

0.9s
```

## CO-OP DIAL EXPERIMENT (run 2) — pinned T=P−1, HP×P; ally-targeting + token-cap dials (300 games/cell)
```

CO-OP DIAL EXPERIMENT — pinned at T = P−1, HP = solo × P · brain: smart · 300 games/cell
Dial 1: cards may target other players (GUARD/THORNS to whoever the telegraph aims at, HEAL to lowest).
Dial 2: token caps (BLIGHT/THORNS max).

CONFIG                              2P (T=1,×2)    3P (T=2,×3)    4P (T=3,×4)
A base (no dials, caps 6/3)             86%·13r        75%·10r         73%·8r
B ally targeting, caps 6/3              91%·13r        83%·10r         83%·8r
C ally + caps 8/4                       91%·12r         85%·9r         86%·8r
D ally + caps 10/5                      91%·12r         87%·9r         89%·7r
E ally + caps uncapped                  91%·12r         89%·8r         91%·6r
F caps 10/5 only (no ally)              87%·12r         81%·9r         83%·7r

Reading: A is the undialed baseline. B−A = ally-targeting lift. F−A = caps-only lift. C/D/E = combined.
0.8s
```

## CO-OP DIAL EXPERIMENT (run 3) — pinned T=P, HP×P; same dials (300 games/cell)
```

CO-OP DIAL EXPERIMENT — pinned at T = P, HP = solo × P · brain: smart · 300 games/cell · unique decks per party
Dial 1: cards may target other players (GUARD/THORNS to whoever the telegraph aims at, HEAL to lowest).
Dial 2: token caps (BLIGHT/THORNS max).

CONFIG                              2P (T=2,×2)    3P (T=3,×3)    4P (T=4,×4)
A base (no dials, caps 6/3)             47%·10r         51%·8r         43%·7r
B ally targeting, caps 6/3              48%·10r         49%·8r         46%·7r
C ally + caps 8/4                        52%·9r         55%·8r         52%·7r
D ally + caps 10/5                       55%·9r         60%·8r         59%·7r
E ally + caps uncapped                   58%·9r         65%·7r         73%·6r
F caps 10/5 only (no ally)               53%·9r         60%·8r         57%·7r

Reading: A is the undialed baseline. B−A = ally-targeting lift. F−A = caps-only lift. C/D/E = combined.
0.7s
```

## CO-OP DIAL EXPERIMENT (run 4) — T=P, ALL T telegraphs face-up (300 games/cell; control = first-only re-run after Lingering Cough + Turnabout co-op fixes)
```

CO-OP DIAL EXPERIMENT — pinned at T = P, HP = solo × P · telegraphs: ALL T face-up · brain: smart · 300 games/cell · unique decks
Dial 1: cards may target other players (GUARD/THORNS to whoever the telegraph aims at, HEAL to lowest).
Dial 2: token caps (BLIGHT/THORNS max).

CONFIG                              2P (T=2,×2)    3P (T=3,×3)    4P (T=4,×4)
A base (no dials, caps 6/3)             53%·10r         53%·8r         47%·7r
B ally targeting, caps 6/3              61%·10r         65%·9r         59%·7r
C ally + caps 8/4                       64%·10r         69%·8r         67%·7r
D ally + caps 10/5                       66%·9r         71%·8r         72%·7r
E ally + caps uncapped                   68%·9r         75%·7r         81%·6r
F caps 10/5 only (no ally)               61%·9r         64%·8r         62%·7r

Reading: A is the undialed baseline. B−A = ally-targeting lift. F−A = caps-only lift. C/D/E = combined.
0.8s

control (first-only telegraph, post-fixes):

CONFIG                              2P (T=2,×2)    3P (T=3,×3)    4P (T=4,×4)
A base (no dials, caps 6/3)             50%·10r         52%·8r         45%·7r
B ally targeting, caps 6/3              52%·10r         53%·8r         49%·7r
C ally + caps 8/4                        55%·9r         58%·8r         56%·7r
D ally + caps 10/5                       60%·9r         62%·8r         63%·7r
E ally + caps uncapped                   62%·9r         68%·7r         77%·6r
F caps 10/5 only (no ally)               58%·9r         61%·8r         59%·7r
```

## CO-OP DIAL EXPERIMENT (run 5) — v2 CARD LIBRARY at T=P, HP×P (300 games/cell)
Library changes: Standstill 'The Deep File' ENCH replaces Circular Argument (turn-start SCRY 1; every SCRY bottoms a card, deal 1/copy);
Standstill 'Dead Air' paid = STAGGER 3 + deal 3 if telegraph at 0; Foundry 'White Heat' = one-die (4 dmg, 6 on SPECIAL).
Also fixed: Lingering Cough ench trigger (was dead in solo+coop). Solo Standstill: 20r stall -> ~5.5r.
```
=== first-only telegraph ===

CO-OP DIAL EXPERIMENT — pinned at T = P, HP = solo × P · telegraphs: first only · brain: smart · 300 games/cell · unique decks
Dial 1: cards may target other players (GUARD/THORNS to whoever the telegraph aims at, HEAL to lowest).
Dial 2: token caps (BLIGHT/THORNS max).

CONFIG                              2P (T=2,×2)    3P (T=3,×3)    4P (T=4,×4)
A base (no dials, caps 6/3)              55%·9r         58%·8r         50%·7r
B ally targeting, caps 6/3               59%·9r         57%·8r         54%·7r
C ally + caps 8/4                        62%·9r         62%·7r         60%·6r
D ally + caps 10/5                       65%·9r         66%·7r         64%·6r
E ally + caps uncapped                   68%·8r         71%·7r         79%·6r
F caps 10/5 only (no ally)               62%·9r         67%·7r         62%·6r

Reading: A is the undialed baseline. B−A = ally-targeting lift. F−A = caps-only lift. C/D/E = combined.
0.7s

=== full telegraphs ===

CO-OP DIAL EXPERIMENT — pinned at T = P, HP = solo × P · telegraphs: ALL T face-up · brain: smart · 300 games/cell · unique decks
Dial 1: cards may target other players (GUARD/THORNS to whoever the telegraph aims at, HEAL to lowest).
Dial 2: token caps (BLIGHT/THORNS max).

CONFIG                              2P (T=2,×2)    3P (T=3,×3)    4P (T=4,×4)
A base (no dials, caps 6/3)              58%·9r         57%·8r         53%·7r
B ally targeting, caps 6/3               64%·9r         64%·8r         60%·7r
C ally + caps 8/4                        67%·9r         69%·8r         68%·7r
D ally + caps 10/5                       68%·9r         71%·7r         71%·6r
E ally + caps uncapped                   70%·8r         75%·7r         81%·6r
F caps 10/5 only (no ally)               66%·9r         66%·7r         65%·6r

Reading: A is the undialed baseline. B−A = ally-targeting lift. F−A = caps-only lift. C/D/E = combined.
0.8s
```
