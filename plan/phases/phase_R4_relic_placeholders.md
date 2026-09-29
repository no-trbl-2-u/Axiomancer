# Phase R4 — Relic placeholders

## Sources

- Part plan: [`plan/revamp/relics.md`](../revamp/relics.md) § R4 (items 1–8)
  and § "Known issue — The Butcher's Bill is unbounded".
- Reset rules: [`plan/revamp/README.md`](../revamp/README.md) §5.
- Decisions: **D47** (VITAE is the one bar; befriending through The Open Hand
  opens mercy, the only non-lethal ending), **D63** (the survivors and their
  data), **D45** (carrier rule), **D50** (git history is the source archive),
  **D58** (nothing is authored), **D37** (the card hold).
- T, 2026-09-28 (quoted in the part plan): "let's set all their effects to
  GUARD 5", keep the names, flat cost; "Leave the starting ring with befriend."
- Sibling: phase R2b (`872de5a7`) for the shape of a code purge plus carrier
  sweep.

## Outcome

Ten of the eleven signet relics grant a signature that raises GUARD 5 for 4◆;
The Open Hand (the Suppliant's Ring) is a real befriend that opens the mercy
choice on a foe that can be befriended. Every other signature behaviour, its
constants and its presenter branches are gone, and the keywords that only
signatures carried leave the atlas and the mobile tables.

## Scope

### Mechanics (`axiomancer-mechanics/`)

1. **`Combat/combat.signature.ts`** is rewritten. `SIGNATURE_SKILLS` keeps all
   eleven ids and names. Ten are `kind: 'guard'`, `cost: 4`, `magnitude: 5`,
   description "Raise GUARD 5." The Open Hand is `kind: 'mercy'`, `cost: 4`,
   `magnitude: 0`. `applySignatureSkill` handles `guard` and `mercy` only.
   Deleted: the scout / reroll / sustain / conclude / control / dot / draw /
   empower / surge branches, `SECOND_WIND_HEAL_FRAC`,
   `CONCLUDE_DMG_PER_STACK`, `HARD_CONTROL_BOSS_STAGGER`,
   `scoutRevealIndices`, and the stale header ("combat reads no stat").
2. **GUARD** from a signature scales like A Plain Ward's paid GUARD: `scaleFor(5,
   stats, 'mind', 'one-shot')` (S3). No colour match: no die powers it. It adds
   to `state.guard`, which the threat phase already absorbs.
3. **The Open Hand befriends.** New helpers `isEnemyBefriendable(enemy)`
   (the foe carries a `friendshipReward`) and `befriendHpGateOpen(enemy)` (the
   `befriendabilityConfig.hpGate` check, shared with
   `Combat/index.ts`'s predicate so the two cannot drift) live in
   `Enemy/befriend.ts`. `signatureCastBlock(state, skill)` returns the refusal
   reason (Conviction short, foe cannot be befriended, foe not yet low enough)
   or null; `playSignatureSkill` and the mobile presenter both read it. A
   refused cast spends nothing. A successful cast sets `mercyChoiceActive` and
   emits `befriend-attempted` + `mercy-opened`, the same events a
   `befriend_attempt` card rider produces.
4. **Types** (`Combat/combat.encounter.types.ts`): `SignatureSkillKind` is
   `'guard' | 'mercy'`; `SignatureSkill` loses `effectKind` / `effectId`;
   the `press-fate-rerolled` and `conclude-hit` events and the
   `pressFateRound` state field go.
5. **`Combat/combat.upgradeable-dice.ts`**: `PRESS_FATE_COST` and
   `rerollMissFacesHonest` go (their only caller was Press Fate). Every
   export site (`Combat/index.ts`, `src/index.ts`) follows.
6. **Relic descriptions** (`Items/relic.library.ts`) state what the relic now
   does and stop repeating "Grants <name>." (the subtitle already prints the
   grant; closes the pass-53 CRITIQUE row). Ten read "Raise GUARD 5 for 4
   Conviction."; the Suppliant's Ring reads "Offer a foe that can be
   befriended the choice of mercy, once it is low enough." The header's
   stale "combat reads no stat" clause is fixed.
7. **Survivors' befriend data** (part plan item 3): the Brine Hag keeps hers
   (`hpGate` 30%, `friendshipReward`, pact and journal lines). Float-Eye and
   the Doorwarden have no `friendshipReward`, so they are not befriendable.
   Nothing is authored.
8. Sims, CLI and telemetry that named a deleted kind or constant follow
   (`combat.encounter.sim.ts`, `combat.upgradeable-economy.sim.ts`,
   `combat.objective.telemetry.ts`, `combat.dice.ts`).

### Mobile (`axiomancer-mobile/`)

9. The signature bar presenter (`state/presenters/combat-encounter.engine.ts`)
   loses `pressFateVM`, the `pressFate` VM field and the icon rows for
   deleted kinds; affordability and the refusal reason come from
   `signatureCastBlock`. Components that read `pressFate` follow.
10. The equip-delta sheet and relic detail read the new descriptions through
    the engine; no mobile copy repeats them.

## Consumers to update

`axiomancer-mechanics/src/index.ts`, `Combat/index.ts` (exports);
mobile combat-encounter presenter and board; the CLI (`CLI/combat.cli.ts`)
if it prints a deleted kind.

## Save / schema contracts

None. Relic ids and signature ids are unchanged; `pressFateRound` lives on
`CombatEncounterState`, which is never persisted (R2b's receipt). No
migration (part plan item 8).

## Carrier sweep (D45)

After R4 no card, enemy, signature, hazard or item carries **WRATH, CHAIN,
POISON, DOOM, QUARTER, STAGGER, PLEA** or **PETRIFY**. Their rows leave
`axiomancer-mechanics/docs/keyword-atlas.md` and the mobile
`state/combat/keywords.ts` (effect, mechanic and gloss tables, plus the
`RUNGS → STAGGER` cross-reference) and `components/combat/glyphShapes.ts`.
**Kept, each with a named carrier:** GUARD (every signature, A Plain Ward),
VULNERABLE (A Plain Word), HEAL and DRAW (consumables, R5 revisits), MARK and
CLEANSE (consumables), BLEED (a map hazard, R6 revisits), PIP and BOON (the
dice system). The engine code behind the swept words (WRATH/CHAIN state,
the effect definitions) is R7a's purge, not R4's.

## Decisions made upfront — DO NOT ASK

- **Flat cost 4◆** for all eleven, The Open Hand included (part plan: "A
  Plain Ward's PAID parity"; "cost stays at the flat rate unless the phase
  finds befriend needs its own" — it does not: the HP gate already rations it).
- **GUARD scales with mind** like every GUARD (S3); the description prints
  the base 5, as A Plain Ward's paid line does.
- **Befriendable = carries a `friendshipReward`.** That is the field the
  friendship outcome pays out; `types.ts` already says un-befriendable foes
  leave it undefined. Without it a befriend would open mercy on a foe with
  nothing to give, so The Open Hand refuses instead.
- **A refused befriend spends nothing**, like every other fizzle in
  `playSignatureSkill`; the reason is shown on the button so the player
  never pays to learn "not yet".
- **The Butcher's Bill is fixed by deletion** (T, 2026-09-28: no stopgap).
- **The `befriend_attempt` card rider stays** in the engine (no card carries
  it; R7a deletes carrier-less mechanic kinds).
- **DRAW and HEAL keep their gloss rows**: consumables still map to them.

## Tests matrix

- `Combat/combat.signature.test.ts` (new, colocated): every non-mercy
  signature raises GUARD 5 at neutral stats and scales with mind; The Open
  Hand opens mercy on the Brine Hag at or below 30% VITAE, refuses above it,
  refuses on Float-Eye and the Doorwarden, and spends nothing when refused.
- e2e (`Combat/e2e/`): a Brine Hag encounter where The Open Hand opens the
  mercy choice and sparing ends in `friendship`.
- Rewritten to the survivors: `hazard-pattern-combat.engine.test.ts` and
  `upgradeable-dice.engine.test.ts` signature cases; Press Fate cases are
  deleted with Press Fate. Relic and equip-delta suites update descriptions.
- Mobile: presenter suites for the signature bar; keyword/glyph suites lose
  the swept rows.

## Verify gate

`npm run verify` (both workspaces: mechanics' public surface changed), root
`npm test`, `npm run lint:content`, `node scripts/check-lexicon.mjs`.

## Commit body template

```
chore: relic placeholders, ten GUARD 5 signatures and a real befriend — phase R4

- <what the ten signatures do now>
- <The Open Hand>
- <what was deleted>
- <carrier sweep>
- <mobile>

Decisions:
- <from the list above>

Closes #<mirror>
```

## DoD

The R4 row is `[x]` with its hash; the gates above are green; no deleted
kind, constant or swept keyword is referenced outside git history.

## Follow-ups (out of scope)

- R7a: the engine code behind WRATH, CHAIN, POISON, DOOM, QUARTER, STAGGER,
  PLEA and PETRIFY, and the `befriend_attempt` card rider.
- B1 (owner): real signatures and relics; no per-stack reader without a cap.
- The cap bypass for player-applied statuses (part plan note) waits for B1.
