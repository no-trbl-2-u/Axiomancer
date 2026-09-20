# Shipped narrative content — a catalogue, NOT canon

> **The story lives in `content/story/story-overview.md`** — the road,
> event by event, built from nothing with T present (2026-09-18). That
> file supersedes `content/story/README.md`'s "THERE IS NO STORY" ruling,
> which is now the historical record of the clearing. The player is **X**:
> no name, no figure, no identifiers.
>
> **What this file is:** a catalogue of narrative content that currently
> ships, so an engineer can find it. Every entry below documents text
> that is *in the build*. None of it documents what the story *is*.
>
> **Do not read an arc out of this file.** The overview is the only
> place an arc is authored; this catalogue is downstream of it and may
> describe beats the road has already discarded. The premise this document
> used to open with — a king, a dead advisor, a succession, a labyrinth
> at the heart of a city — was cleared with the rest of the story law.
> Shipped lines are evidence of what an old draft assumed, nothing more.
> A future overview may keep, move, rewrite or discard any of them.
>
> Narrative *craft* rules still govern how copy is written:
> `docs/narrative/` (style constitution, voice registers, lexicon).
> Those are style law, not story law, and they are untouched.

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
