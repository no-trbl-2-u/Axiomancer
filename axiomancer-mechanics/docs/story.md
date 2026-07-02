# Axiomancer Story

Axiomancer is a turn-based strategy RPG where players control a character who embarks on a journey to discover their true identity and the secrets behind the veil. After the king loses their advisor and opens the gates of the city to find their successor, the player must navigate the challenges of the labyrinth to reach the heart of the city and become the new advisor.

The full arc is sketched in [`content/story/story-overview.md`](../content/story/story-overview.md); this file collects the per-NPC and per-beat documentation as it lands. Narrative specs live under [`specs/story/`](../specs/story/), [`specs/characters/`](../specs/characters/), and [`specs/world/`](../specs/world/) — see the Phase 22 authoring skills (`/story-spec`, `/character-spec`, `/world-spec`).

## Characters

### Old Marrow (Fishing Village, `fv-2`)

A weather-worn dockmaster on the player's home dock. Old Marrow is the
**first canonical moral NPC** — his reward branch (after the starting
"Coastal Tyrant" quest) offers three responses that move the moral meter
directly via `DialogueChoice.effect.moralDelta`:

| Choice                                          | Moral shift | Currency | Side effect       |
|-------------------------------------------------|------------:|---------:|-------------------|
| "Take it — coin keeps a man fed."               | 0           | +25      | —                 |
| "Take only half — your need is greater."        | +5          | +12      | —                 |
| "This nearly killed me. Pay double or keep it." | −4          | +25      | sets `marrow_pressed` |

The offer node also exposes a polite refusal (`+2`) that doesn't start
the quest, for players who want to push the meter without committing to
the encounter. Voice is laconic and weather-worn — no exclamation
points, no speeches; choices read in the Boy's village-direct cadence.

See `src/World/Continents/Coastal-Village/maps.ts` for the dialogue
tree, `src/Game/e2e/oldmarrow.engine.test.ts` for the hermetic e2e
covering all three reward paths.

### Hollow-Eyed Beggar (Fishing Village)

The original Spec-10 demonstration NPC. Migrated in Phase 14 onto the
same direct `moralDelta` field; numeric shifts are unchanged (`+5 / +3
/ +1 / −1 / −5`). See `src/Game/e2e/moral.meter.engine.test.ts`.

## Progression
