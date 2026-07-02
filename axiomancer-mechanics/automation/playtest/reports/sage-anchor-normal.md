# Playtest Report — sage-anchor-normal

> Phase 121 Normal anchor: Sage vs Audit Sentinel. Target: 75-100% actual wins across all policies.

## Scenario

- Preset: sage
- Enemy: audit-sentinel
- Seed: phase-121-normal-v1
- Max rounds: 55
- Policies: aggressive, defensive, mixed, strategist
- Runs: 25

## Aggregate Metrics

- Win rate: 92.0%
- Defeat rate: 0.0%
- Friendship rate: 0.0%
- Timeout rate: 8.0%
- Average rounds: 40.28
- Median rounds: 44
- Average final player HP: 256.72
- Average final enemy HP: 11.92
- Average damage to player: 106.36
- Average damage to enemy: 366.72
- Max friendship counter: 0

## Outcome Counts

- victory: 23
- defeat: 0
- friendship: 0
- flee: 0
- timeout: 2

## Player Action Use

- attack: 605
- skill: 388
- defend: 13
- item: 1

## Stance Use

- body: 852
- mind: 124
- heart: 31

## Skill Use

- achilles-gambit: 262
- sorites-cascade: 56
- straw-giant: 50
- ship-of-theseus: 18
- undistributed-middle: 2

## Enemy Action Use

- attack: 378
- skill:false-dilemma: 342
- defend: 287

## Policy Summaries

### aggressive

- Runs: 7
- Win rate: 85.7%
- Defeat rate: 0.0%
- Friendship rate: 0.0%
- Timeout rate: 14.3%
- Average rounds: 50
- Average final player HP: 162.86
- Average final enemy HP: 10.57
- Average damage to player: 195.71
- Average damage to enemy: 422.57
- Max friendship counter: 0

### defensive

- Runs: 6
- Win rate: 83.3%
- Defeat rate: 0.0%
- Friendship rate: 0.0%
- Timeout rate: 16.7%
- Average rounds: 50.50
- Average final player HP: 234.67
- Average final enemy HP: 37.33
- Average damage to player: 136.17
- Average damage to enemy: 392
- Max friendship counter: 0

### mixed

- Runs: 6
- Win rate: 100.0%
- Defeat rate: 0.0%
- Friendship rate: 0.0%
- Timeout rate: 0.0%
- Average rounds: 32.83
- Average final player HP: 308.17
- Average final enemy HP: 0
- Average damage to player: 51.50
- Average damage to enemy: 337.33
- Max friendship counter: 0

### strategist

- Runs: 6
- Win rate: 100.0%
- Defeat rate: 0.0%
- Friendship rate: 0.0%
- Timeout rate: 0.0%
- Average rounds: 26.17
- Average final player HP: 336.83
- Average final enemy HP: 0
- Average damage to player: 27.17
- Average damage to enemy: 305.67
- Max friendship counter: 0

## Findings for Tobin

- Outcome breakdown: 92% victory, 0% friendship, 0% defeat, 8% timeout
- 8% of runs timed out before combat resolved.
- Resolution success is 92%; target band is 65–75% victory plus friendship/mercy resolution.
- Win rate is high at 92%; encounter may be undertuned for these policies.
- No friendship outcomes surfaced; Tobin should judge whether the peaceful route is too hidden or too costly.
- No Befriend attempts surfaced; mercy evidence is not yet exercising the doctrine path.
- STRATEGIST witness: 100% resolution success, average 26.17 rounds
- Dominant stance: body (85% of stances).

## Replay Seeds Worth Inspecting

- phase-121-normal-v1:17
- phase-121-normal-v1:18

## Run Summaries

- Run 1: outcome=victory, policy=aggressive, seed=phase-121-normal-v1:1, rounds=51, playerHp=166, enemyHp=0, damageToPlayer=185, damageToEnemy=427, friendshipCounter=0
- Run 2: outcome=victory, policy=defensive, seed=phase-121-normal-v1:2, rounds=50, playerHp=246, enemyHp=0, damageToPlayer=110, damageToEnemy=430, friendshipCounter=0
- Run 3: outcome=victory, policy=mixed, seed=phase-121-normal-v1:3, rounds=37, playerHp=287, enemyHp=0, damageToPlayer=70, damageToEnemy=323, friendshipCounter=0
- Run 4: outcome=victory, policy=strategist, seed=phase-121-normal-v1:4, rounds=28, playerHp=336, enemyHp=0, damageToPlayer=26, damageToEnemy=305, friendshipCounter=0
- Run 5: outcome=victory, policy=aggressive, seed=phase-121-normal-v1:5, rounds=49, playerHp=158, enemyHp=0, damageToPlayer=201, damageToEnemy=441, friendshipCounter=0
- Run 6: outcome=victory, policy=defensive, seed=phase-121-normal-v1:6, rounds=54, playerHp=213, enemyHp=0, damageToPlayer=141, damageToEnemy=442, friendshipCounter=0
- Run 7: outcome=victory, policy=mixed, seed=phase-121-normal-v1:7, rounds=30, playerHp=345, enemyHp=0, damageToPlayer=17, damageToEnemy=328, friendshipCounter=0
- Run 8: outcome=victory, policy=strategist, seed=phase-121-normal-v1:8, rounds=36, playerHp=342, enemyHp=0, damageToPlayer=16, damageToEnemy=296, friendshipCounter=0
- Run 9: outcome=victory, policy=aggressive, seed=phase-121-normal-v1:9, rounds=50, playerHp=245, enemyHp=0, damageToPlayer=116, damageToEnemy=444, friendshipCounter=0
- Run 10: outcome=victory, policy=defensive, seed=phase-121-normal-v1:10, rounds=50, playerHp=225, enemyHp=0, damageToPlayer=135, damageToEnemy=425, friendshipCounter=0
- Run 11: outcome=victory, policy=mixed, seed=phase-121-normal-v1:11, rounds=30, playerHp=354, enemyHp=0, damageToPlayer=10, damageToEnemy=359, friendshipCounter=0
- Run 12: outcome=victory, policy=strategist, seed=phase-121-normal-v1:12, rounds=38, playerHp=283, enemyHp=0, damageToPlayer=76, damageToEnemy=314, friendshipCounter=0
- Run 13: outcome=victory, policy=aggressive, seed=phase-121-normal-v1:13, rounds=49, playerHp=187, enemyHp=0, damageToPlayer=174, damageToEnemy=428, friendshipCounter=0
- Run 14: outcome=victory, policy=defensive, seed=phase-121-normal-v1:14, rounds=46, playerHp=249, enemyHp=0, damageToPlayer=114, damageToEnemy=446, friendshipCounter=0
- Run 15: outcome=victory, policy=mixed, seed=phase-121-normal-v1:15, rounds=29, playerHp=335, enemyHp=0, damageToPlayer=25, damageToEnemy=327, friendshipCounter=0
- Run 16: outcome=victory, policy=strategist, seed=phase-121-normal-v1:16, rounds=16, playerHp=356, enemyHp=0, damageToPlayer=15, damageToEnemy=338, friendshipCounter=0
- Run 17: outcome=timeout, policy=aggressive, seed=phase-121-normal-v1:17, rounds=55, playerHp=97, enemyHp=74, damageToPlayer=261, damageToEnemy=369, friendshipCounter=0
- Run 18: outcome=timeout, policy=defensive, seed=phase-121-normal-v1:18, rounds=55, playerHp=220, enemyHp=224, damageToPlayer=212, damageToEnemy=174, friendshipCounter=0
- Run 19: outcome=victory, policy=mixed, seed=phase-121-normal-v1:19, rounds=34, playerHp=316, enemyHp=0, damageToPlayer=42, damageToEnemy=364, friendshipCounter=0
- Run 20: outcome=victory, policy=strategist, seed=phase-121-normal-v1:20, rounds=21, playerHp=348, enemyHp=0, damageToPlayer=18, damageToEnemy=309, friendshipCounter=0
- Run 21: outcome=victory, policy=aggressive, seed=phase-121-normal-v1:21, rounds=44, playerHp=187, enemyHp=0, damageToPlayer=177, damageToEnemy=418, friendshipCounter=0
- Run 22: outcome=victory, policy=defensive, seed=phase-121-normal-v1:22, rounds=48, playerHp=255, enemyHp=0, damageToPlayer=105, damageToEnemy=435, friendshipCounter=0
- Run 23: outcome=victory, policy=mixed, seed=phase-121-normal-v1:23, rounds=37, playerHp=212, enemyHp=0, damageToPlayer=145, damageToEnemy=323, friendshipCounter=0
- Run 24: outcome=victory, policy=strategist, seed=phase-121-normal-v1:24, rounds=18, playerHp=356, enemyHp=0, damageToPlayer=12, damageToEnemy=272, friendshipCounter=0
- Run 25: outcome=victory, policy=aggressive, seed=phase-121-normal-v1:25, rounds=52, playerHp=100, enemyHp=0, damageToPlayer=256, damageToEnemy=431, friendshipCounter=0
