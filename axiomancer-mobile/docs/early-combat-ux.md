# Early combat UX doctrine

> Mobile-facing guidance from Tobin's early-combat review. The mechanics repo
> owns combat truth; this client owns whether the player can read that truth
> before it hurts them.

## Verdict

**Do not ask for stronger player numbers until the screen proves the rules are
legible.**

The engine's early combat loop depends on player understanding:

- Heart beats Body.
- Body beats Mind.
- Mind beats Heart.
- Correct stance choice greatly shifts the attack contest.
- Defend is not passivity; it mitigates damage, generates resources, and can
  advance friendship.

If the phone cannot show those facts, a fair system will still feel unfair.

## UI obligations

### Stance picker

The stance picker should make the choice readable before commitment:

- show advantage / neutral / disadvantage for each stance when enemy stance or
  intent is known
- avoid defaulting to a selected stance before the player chooses
- pair badges with short language, not only symbols
- preserve the enemy's last or favored stance if that is the only available
  clue

Recommended labels:

- `ADV — answers Body`
- `EVEN — mirrors Body`
- `RISK — Body answers this`

### Resolve panel

The resolve panel should explain consequence, not just outcome:

- matchup: `Heart overcame Body`
- rolls: player total vs enemy total
- damage: HP before / after, or compact damage number
- defend value: damage prevented or defense multiplier when available
- resource gain: e.g. `+3 Heart` or `+5 Mind for defending`
- friendship: counter change and proximity to pact

### Battle log

The battle log should be the audit trail for the round. Prioritize:

1. stance matchup
2. roll contest
3. damage / prevention
4. resource gain
5. friendship progress
6. effect/proc noise

Early encounters should not bury the stance lesson under fallacy effects,
procs, or flavor text.

### Enemy panel

When possible, surface one readable enemy signal:

- favored stance
- last stance
- temperament such as aggressive / defensive / balanced
- pact clue for befriendable enemies

Do not overstate hidden AI. If only last stance is known, say last stance.
If favored stance is authored or inferred, make that source clear.

## First-fight UX priorities

For the first region, optimize for these moments:

1. The player sees a Body-forward enemy.
2. The player sees Heart marked as the answer.
3. The player chooses Heart.
4. The resolve panel says Heart beat Body.
5. The player sees resources gained and damage dealt/prevented.
6. If the player defends, the UI proves it was productive.
7. If the player loses, the failure names the misunderstood matchup.

## Do not solve opacity with generosity

Avoid these fixes unless evidence proves they are needed after readability work:

- broad starter stat buffs
- global damage reduction
- weaker enemy stats across the whole first region
- flattening enemies so stance matters less
- hiding enemy behavior because it feels too complex

These make the game easier but less doctrinal. First teach the player to read.
Then tune.

## Recommended mobile-facing work

1. Add or preserve presenter fields for:
   - stance advantage label
   - matchup explanation
   - resource delta
   - friendship delta
   - defend mitigation / multiplier if available from event summaries

2. Keep combat presenter tests focused on comprehension:
   - stance options show `adv`, `neutral`, `dis` correctly
   - no combat entry has a fake default stance
   - resolve summaries mention matchup and resource/friendship changes
   - effect-granted advantage modifiers override raw matchup when the engine
     event surface says so

3. If adding a tutorial or first-combat overlay, make it dismissible and
   evidence-based:
   - explain only the current enemy's relevant counter
   - avoid encyclopedic Heart / Body / Mind text before play

## Cross-repo contract

- Mechanics owns formulas, enemy stats, resolver events, and balance evidence.
- Mobile owns preview, explanation, logs, and player comprehension.
- If a required teaching signal is missing from the engine event stream, file
  an engine handoff instead of guessing in the client.

The rule: **a player may die early, but they should know what judgment killed
them.**
