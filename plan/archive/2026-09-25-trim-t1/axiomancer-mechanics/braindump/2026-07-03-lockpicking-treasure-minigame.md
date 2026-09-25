> **Status:** HISTORICAL — archived 2026-09-25 by TRIM THE FAT T1 (`plan/2026-09-25-trim-the-fat.spec.md` Tier 1 docs). Original path: `axiomancer-mechanics/braindump/2026-07-03-lockpicking-treasure-minigame.md`. Describes removed or never-built code; not a source of rules.

# Lockpicking / Treasure Minigame Redesign — 2026-07-03

## Surface question
"The Reliquary" (current treasure/loot-cache minigame) is boring — replace or
augment it with something lockpicking-flavored, informed by Skyrim's and Too
Many Bones' lockpicking, mobile-friendly.

## Better question surfaced
The current cache (`lootcache.engine.ts`) is boring not because it lacks a
lockpicking *skin* but because **all randomness resolves at session start**
and the only mid-session choice (Probe) has no cost — there's no live,
player-influenced risk. The real question isn't "what does a lockpick UI look
like" but: **where in the layered push-your-luck structure do we insert a
decision whose outcome the player's input actually changes?** Skyrim and Too
Many Bones answer that differently — one with real-time reflex/precision, one
with a pre-built dice-pool skill check — and Axiomancer needs to pick which
kind of "skill" it wants this to test: manual dexterity (bad fit for a
turn-based fallacy/paradox RPG) or system mastery (good fit, mirrors combat's
stance/skill logic).

## Prior art consulted

- **Skyrim — pin-tumbler lockpicking:** Real-time, continuous two-axis input.
  Player rotates a pick (analog stick/mouse) to probe for a hidden "sweet
  spot" angle, then applies tension (other input); wrong tension at the wrong
  angle snaps the pick. Picks are a consumable resource; lock tiers
  (novice→master) narrow the sweet spot and speed up the required response.
  Widely liked for being *skippable* (a Perk removes RNG entirely for
  master players) and satisfying as a tactile, real-time break from menus —
  but it's pure manual dexterity, no stat/build interaction beyond the escape
  hatch perk.
- **Too Many Bones — lockpicking mini-game:** Not class-locked; any character
  can attempt it during the Recovery Phase using the game's core dice-pool
  ("Fate Roller") system — an Intuition die plus several Action dice rolled
  against the lock, with partial progress banked between daily attempts.
  Reception is decidedly mixed: BGG has multiple threads literally titled
  "Lockpicking for Dummies" and "I still don't get it," and reviewer Dale Yu
  noted the mechanic isn't even explained in the printed rulebook — a cited
  case of a system-mastery mechanic that was *too* opaque, not too shallow.
  (Confidence: medium on exact resolution math — could not verify the target
  numbers from primary rules text this session.)
- **The Reliquary (current Axiomancer cache), for contrast:** All fate rolls
  happen at `createLootCacheSession` before the player acts at all
  (`lootcache.engine.ts:73-120`); the single Probe action is free, so play is
  close to solved. This is the failure mode both Skyrim and TMB avoid in
  different ways — Skyrim by making the *player's hands* the risk, TMB by
  making the *player's dice pool investment* the risk.

## Design directions on the table

### Option A — Tension Dial (Skyrim-lite, real-time)
*(inspired by Skyrim pin-tumbler lockpicking)*

Per layer, show a rotary dial with a hidden sweet-spot arc. Player drags to
rotate the pick (finding the spot narrows a "warmer/colder" haptic-style cue),
then taps-and-holds a tension button. Miss the window while holding tension →
pick snaps, consuming one of a small pool of picks; run out of picks → the
Delve auto-resolves as a bite, same as today's "trapped" outcome. Lock tiers
(Lid/False Bottom/Tithe) shrink the sweet-spot arc, mirroring today's rising
trap odds.

**Trade-off:** Real-time reflex input is a genre mismatch for a
turn-based, menu-driven fallacy/paradox game, and one-handed mobile play with
a rotate+hold combo is fiddly on small screens; needs generous
accessibility tuning (assist mode, larger targets) to not alienate players
who came for the RPG loop, not a QTE.

**Telltale failure mode:** Playtest reports of "my thumb doesn't fit the
dial" or players just brute-forcing tension spam because the penalty for
missing is mild — same rote-optimal trap the current Probe has, just with
extra motion.

### Option B — Pick Pool (Too Many Bones-lite, system mastery)
*(inspired by Too Many Bones' dice-pool lockpicking)*

Reuse Axiomancer's existing skill/dice resolution vocabulary instead of
inventing a new one. Each layer is a target number; the player spends "pick
dice" drawn from a small pool (sized by a stat, an item, or a skill drawn
from the fallacy/paradox skill list — e.g. a "False Dichotomy" pick that lets
you choose the better of two rolls) to try to clear it, banking partial
progress across attempts like TMB's between-day carryover. Failure doesn't
insta-trap; it burns dice and narrows future odds.

**Trade-off:** Highest build-interaction payoff (lockpicking becomes another
place skills/stats matter) but also the highest opacity risk — TMB's own
reception shows dice-pool skill checks read as confusing without very
deliberate UI teaching (visible target number, visible pool, clear "why did
I fail" feedback).

**Telltale failure mode:** Players asking "wait, what just happened" in
playtest — same complaint pattern as the cited TMB BGG threads — if the pool
math isn't surfaced clearly on-screen before commit.

### Option C — Live Probe, Costed (minimal-diff fix)
*(inspired by neither directly — a scalpel fix to the existing engine)*

Keep the current 3-layer push-your-luck structure almost as-is, but change
two things: (1) resolve each layer's trap roll lazily, at the moment of
Delve, not upfront at session creation, so nothing is predetermined before
the player acts; (2) make Probe cost something (VITAE, a turn, or a
limited-per-run charge) and make it imperfect (a "warm/cold" hint rather
than a certain reveal). This turns the existing free, solved action into a
real bet.

**Trade-off:** Cheapest to ship, no new UI paradigm, but doesn't add a
"lockpicking feel" at all — it's a probability/economy fix, not a new
minigame. Good candidate if the real ask is "make the *decisions* interesting"
rather than "give me a lockpicking skin."

**Telltale failure mode:** If Probe's cost is too cheap relative to its
information value, it degenerates right back into today's solved play; if
too expensive, players stop using it and Delve becomes a coinflip with no
counterplay at all.

### Option D — Layered Reveal (sequence-memory, mobile-first)
*(inspired by rhythm/sequence mechanics like Fallout's hacking or "Simon"
games — no direct genre precedent named here since neither Skyrim nor TMB
uses this shape, flagging it as a third lens)*

Each layer shows a short sequence of "listen for the tumbler" taps — the game
flashes a pattern (or gives a one-shot audio/haptic cue), player replays it.
Getting it right on the first try banks the max loot bonus; retries cost
VITAE per attempt (echoing today's bite cost) but let you keep trying instead
of an instant trap. No drag/rotate precision needed — pure tap targets, so
it's thumb-friendly one-handed on a phone.

**Trade-off:** Very mobile-native and low-motor-skill-demand, but leans
toward "memory game" rather than "risk/reward gambit," so it may feel
tonally closer to a distraction than a tense heist moment; needs strong
audio/haptic/visual feedback to not feel arbitrary.

**Telltale failure mode:** If the pattern length doesn't scale meaningfully
with layer depth, players will find one difficulty trivial and treat deeper
layers as a wall rather than an escalating risk.

### Option E — Hybrid: Costed Probe + Pick Pool (compose B + C)
*(combines the minimal engine fix with system-mastery skill checks)*

Take Option C's lazy-resolution/costed-Probe fix as the economic backbone,
then replace the binary Delve outcome with Option B's small dice-pool check
(2-3 dice, no external skill investment required, though skills/items can
grant bonus dice later). This keeps the loop legible (still push-your-luck,
still layered, still VITAE-costed) while giving Delve itself a moment of
player agency instead of being a coinflip resolved by a hidden pre-roll.

**Trade-off:** More design and engine surface than C alone (needs a small
dice-pool resolver, UI to show the roll), but avoids A's reflex mismatch and
B's full opacity risk by keeping the pool tiny and the stakes contained to
one layer at a time.

**Telltale failure mode:** If the dice-pool math converges to roughly the
same odds as today's static rolls, players will correctly clock it as
theater — the check has to visibly move with player choices (which dice to
commit, whether to bank progress) or it's Option C wearing a costume.

## Decision / leaning
**RESOLVED (2026-07-04): Option B — Pick Pool — shipped.** See
`docs/encounters/loot-cache.md` for the live rules; Option E survives as the
unbuilt fallback in `docs/encounters/loot-cache-alt-hybrid-spec.md`.

Original session close: still open — user asked for 5 options to choose from,
no direction locked yet. Given the project's turn-based, system-driven combat identity (RPS
stances, fallacy/paradox skills), **B and E lean more on-theme** than A or D,
which import reflex/rhythm genres foreign to the rest of the game. C is the
cheapest experiment to validate whether "boring" is really an economy
problem before investing in new UI.

## Open questions
- Should lockpicking be a universal action (any character can attempt, per
  TMB) or gated behind a stat/skill/item (more RPG-legible, avoids the "why
  can everyone do this" question)?
- Is a consumable pick-tool resource (Skyrim-style scarcity) desired, or
  should VITAE remain the sole risk currency to avoid stacking two resource
  sinks on one encounter?
- Does the mobile UI budget support a new custom widget (dial, tap-sequence)
  or should this stay within existing button/card idioms for engineering
  cost reasons?

## Raw notes
- Too Many Bones' lockpicking reception is a useful cautionary tale
  specifically about *teaching* a system-mastery mechanic — BGG threads
  ("Lockpicking for Dummies...please...") show the mechanic itself wasn't
  necessarily bad, but under-explained. Any Option B/E direction should
  budget real UI/tutorial design, not just engine work.
- Confidence flag: exact TMB dice-pool target-number math could not be
  verified from primary rules text this session (BGG blocked automated
  fetch, rulebook PDF not machine-readable) — treat TMB citation above as
  structurally accurate but not numerically precise.
