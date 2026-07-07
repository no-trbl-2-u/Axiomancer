# Character Spec C-01 — The Sophist (Protas, the First Asker)

## Goal

The Aporia's unreliable narrator, hint merchant, and finale — the
Minotaur of our MAZE. He is the labyrinth continent's entire speaking
cast: every room description, every POI remark, every mockery and
every true clue arrives through a character with a declared motive
to deceive, so trust calibration is itself a mechanic. Without him
the Aporia is geometry; with him it is an argument.

## Dependencies

- **Unblocks:** the Aporia finale; the last continent's framing
  (his "last true sentence about the far country").
- **Depends on:** W-01 (the Aporia), ADR-0007 (Befriend mercy
  fork), the hint/debt economy (W-01 core rules).

## Voice

Terse, archaic-flavored, cold and old — aristocratic wound, needling
wit, insinuating ellipses used sparingly. No thee/thou/ye. He mocks
inattention, drops real clues inside idle chatter, and never lies
outright when a misdirection will do. He is honest about being
dishonest — that is his one fixed point.

| sample line | when it might fire |
|---|---|
| "Anything here may be a clue. Not every clue is honest. Neither am I." | entrance terms, Act I |
| "Guess freely. I keep the guesses. They keep, better than you would think." | first refused gate submission |
| "Lamps are lit where someone will walk. The house does not waste oil." | POI remark carrying a true clue |
| "The chair fit. Remember that it fit." | ejection from the Oubliette |
| "Mind the first step. There is no first step." | final line, either fork |

## History

The first challenger of the Aporia. He came down with a mind like a
locked archive, reached the Foundation, and could not lay a single
word — he had carried his premises too far to admit they were
furniture. The house digested him into its narrator: warden,
cautionary footnote, its oldest pupil and only failure. He signs
the three act ledgers in thirds: "P.", "Pro-", "-tas."

## Motivation

He wants company in the failure less than he wants a witness to the
proof — someone who finishes what he could not, so the house's
question stops being addressed to him. He is afraid of his own
name: it belongs to the asker he was, and taking it back means
admitting the centuries between. He sells certainty because
watching people buy it flatters the way he lost.

## Secret

He is not guarding the center; he is hiding from it. The revelation
at the Foundation (the maze admits only minds that can revise)
indicts him personally, and he knows the player will read it. His
name PROTAS is recoverable from his ledger signatures; spoken at
the finale through the mercy choice, it forces him to be the asker
again instead of the lesson.

## Posture

| circumstance | response |
|---|---|
| Greeted warmly | Deflects with etiquette-as-blade: "How courteous. The house eats the courteous last." |
| Insulted | Delighted; quotes the insult back improved. |
| Asked about the labyrinth | Answers truly but at the wrong altitude — accurate about stones, silent about doors. |
| Asked for help | Sells it (Nudge / Reading / Conclusion); never volunteers past the entrance terms. |
| Witnessing player buy a Conclusion | Contempt wrapped in professionalism: "A pleasure doing your thinking." |
| Witnessing player refuse hints repeatedly | The needling softens by degrees; he starts calling them "the walker." |
| Player ejected by the Oubliette | Neither gloats nor comforts: states the lesson once. |
| Named PROTAS at the finale (fork open) | Stands aside; gives his last true sentence about the far country. |
| Named by a player who exploited both act bosses | Refuses: "I do not take my name from that mouth." |

## Cross-references

| world spec | role in that location |
|---|---|
| `specs/world/W-01-aporia-labyrinth-continent.md` | narrator of every room; hint merchant; Ledger of Assertions keeper; finale at the Threshold of the Unfounded |

Room-level copy (all of his lines in situ):
`plan/labyrinth/acts/act1.md` / `act2.md` / `act3.md`.

## Open questions

1. **Fight kit.** Status-forward finale design; Borrowed Premise
   stacks (cap 3) as authored status effects.
   > At implementation (W-01 step 10), combat doctrine applies.
2. **Heart-token pricing.** Befriend gate specifics for a finale
   boss vs standard enemies.
   > At implementation against ADR-0007 numbers.
3. **The far-country sentence.** His spare-fork line about the last
   continent — author when that continent is specced.
   > Deferred to the last-continent spec.

## Proposed approach

1. Character content per this spec; all room copy already authored
   in the act files (the voice lock is those files).
2. Enemy entry (finale tier) + Borrowed Premise effects in the
   enemy/effects libraries.
3. Hint-merchant and Ledger of Assertions state per W-01 region
   state keys.
4. Dialogue surfaces: accordion narration + hint menu (mobile,
   via claude-design handoff); CLI text mirror.

## Acceptance checklist

- [ ] All open questions answered.
- [ ] Voice samples consistent with the voice lock (and the act
      files' narration — same speaker, one register).
- [ ] Cross-reference to W-01 is mutual.
- [ ] Finale enemy + effects wired in `src/Enemy/` /
      `src/Effects/`; naming fork through the standard Befriend
      mercy-choice state.
- [ ] `npm test` and `npm run type-check` are clean.

## Out of scope

- Visual design (he appears only as a shadow at the finale; never
  in any scene illustration — book-faithful).
- The far country itself.
