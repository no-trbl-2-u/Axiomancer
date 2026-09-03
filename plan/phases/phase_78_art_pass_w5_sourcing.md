# Phase 78 — Art-pass: open-source art sourcing research for W5 portraits

## Outcome

A `[loop-call]`-style row in `plan/AUDIT.md` presenting, for each of
the 9 W3/W5 enemies, at least 2 open-source/CC art candidates drawn
from a few different sources, each with license and provenance
recorded — ready for a pick at the next `/oversight`. **No art is
wired into the game or committed as the standing source this phase.**
The pick, once made, supersedes the ad hoc game-icons.net silhouette
sourcing and stands as the source until Phase 73's in-house generation
pipeline is ready.

## Why (context)

Filed via direct T instruction during the W3 loop-call walkthrough
(`/oversight` 2026-09-02), recorded in `plan/AUDIT.md`'s "[loop-call]
Phase W3 design decisions" row and `plan/PHASE_CANDIDATES.md` §
Promoted. T ratified the W3/W5 silhouette portraits (game-icons.net,
CC BY 3.0, Lorc/Delapouite) as filed, but wants a **standing sourcing
process** for future art passes instead of ad hoc per-enemy picks.
T's own words: *"create an 'art-pass' phase where an agent researches
online for some open source art that fits the theme. Gather two
candidates from a few sources, and then present them during the next
oversight. Once I decide, that'll be our new art source until we end
up generating our own."*

## Scope — RESEARCH-AND-PRESENT only

This phase ships **zero application code**. It is a research +
reporting phase. `npm run verify` / `deploy:check` are not applicable
in the usual sense (no app surface changes); the DoD is the AUDIT row
existing and committed.

### The 9 enemies in scope (source: `axiomancer-mechanics/src/Enemy/enemy.library.ts`, `W3_ADDED = '2026-08-28'`)

| id | name | current portrait (placeholder) | theme |
|---|---|---|---|
| `enemy-seam-tick` | Seam Tick | `seam-tick.webp` (Lorc `maggot.svg`) | fist-sized parasitic tick that drinks iron out of blood; feared by cave delvers |
| `enemy-prop-wight` | Prop-Wight | `prop-wight.webp` (Lorc `haunting.svg`) | vengeful spirit haunting rotten mine-support timbers |
| `enemy-unpaid-delver` | The Unpaid Delver | `unpaid-delver.webp` (Delapouite `miner.svg`) | undead miner still swinging his pick, died owed a season's wages |
| `enemy-sump-maren` | Sump Maren | `sump-maren.webp` (Lorc `drowning.svg`) | drowned-woman water spirit luring the grieving into the sump |
| `enemy-toll-sergeant` | Toll-Sergeant | `toll-sergeant.webp` (Delapouite `guards.svg`) | corrupt gate guard extorting arbitrary "tolls" |
| `enemy-guild-knife` | Guild Knife | `guild-knife.webp` (`cloak-dagger.svg`) | ironmongers' guild enforcer / contract killer |
| `enemy-the-factor` | The Factor | `the-factor.webp` (Delapouite `abacus.svg`) | predatory debt-broker |
| `enemy-wharf-shrike` | Wharf Shrike | `wharf-shrike.webp` (`raven.svg`) | mutated harbor bird that impales prey like a butcherbird |
| `enemy-the-harbormaster` (boss) | The Harbormaster | `the-harbormaster.webp` (Delapouite `pirate-captain.svg`) | ancient gatekeeper of the water-gate |

## Decisions made upfront — DO NOT ASK

1. **Scope = all 9 W3/W5 enemies**, not a subset. "Remaining W5
   portraits" in the build-plan row means "not yet resolved to a
   permanent, T-picked source" — every one of the 9 is currently on
   the interim silhouette placeholder, so all 9 are in scope.
2. **>= 2 candidates per enemy, from a few different sources** (not
   all 9 from the same single site) — matches T's literal instruction.
   Acceptable source pool: OpenGameArt.org, Wikimedia Commons,
   game-icons.net (a *different* icon than the current placeholder,
   if picked, still counts as a distinct candidate), itch.io
   explicitly-CC0/CC-BY asset packs, Kenney.nl. Reject anything
   without a clear, checkable license.
3. **License + provenance recorded per candidate**: source URL,
   author/attribution, license name, and a one-line fit rationale
   tying it to the enemy's theme.
4. **Delivery = single AUDIT.md row**, category `[loop-call]`, titled
   "Phase 78 — W5 art-pass candidates", body organized enemy-by-enemy.
   Not 9 separate rows (keeps `/oversight` review to one pass).
5. **No candidate gets downloaded/committed into the repo this
   phase.** Only URLs + metadata are recorded. Wiring happens after
   T's pick, as a follow-up phase or an `/oversight`-directed tick.
6. **Delegation**: research is delegated to `scout` sub-agents (per
   `skills/ship-a-phase.md` §4, "external research needed → spawn a
   sub-agent"), run in the foreground per hard rule §11 (a phase-shaped
   research dependency, not backgroundable), grouped a few enemies per
   agent to bound sub-agent count.

## Output shape (the AUDIT.md row)

```
### [loop-call] Phase 78 — W5 art-pass candidates (2026-09-03)
- category: design residue (art sourcing — awaiting /oversight pick)
- detail: per-enemy candidate table/list, >=2 candidates each,
  source + author + license + fit rationale.
- evidence: links to plan/phases/phase_78_art_pass_w5_sourcing.md,
  plan/AUDIT.md's W3 loop-call row, PHASE_CANDIDATES.md Promoted entry.
- status: awaiting /oversight pick — no art wired.
```

## Verify gate

N/A (no code). The check is: the AUDIT row exists, has >=2 sourced
candidates per enemy with license/provenance, and the build-plan row
is ticked.

## DoD

- [ ] AUDIT.md row filed with all 9 enemies covered.
- [ ] Build-plan Phase 78 row ticked `[x]` with commit hash.
- [ ] Phase mirror issue opened + closed.

## Follow-ups (out of scope)

- Wiring the picked source into `portraitAsset` / `index.ts` /
  `provenance.json` — a future phase once T picks, per the standing
  process this phase establishes.
- Resolving the 52-painting `UNRESOLVED` license — separate, unrelated
  thread (Phase 73's in-house generation pipeline is the eventual
  replacement for both).
