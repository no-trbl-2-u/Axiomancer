# Revamp — engine purge

> Part plan of [THE REVAMP](README.md). Phase **R7** (loop). Decisions D50,
> D51. Status: PROPOSED. Paths are under `axiomancer-mechanics/src/`.

## Ruling

T, 2026-09-28: delete the card mechanic kinds with no carrier — "git history
is the archive." This **supersedes** the P1 brief's rule ("engine mechanics
stay", `plan/2026-09-26-card-purge.prompt.md` §2) and the same clause in D45.
T also purged the card types: from now on **Attack** (the DEAL card, A Plain
Blow), **Skill** (the GUARD card, A Plain Ward) and **Spell** (the VULNERABLE
card, A Plain Word) are the only three, with more planned in card sessions.

Before any card work starts, the card-rules inventory (B4, [cards.md](cards.md))
must exist. R7 deletes; B4 records what is left.

## R7 — Engine purge (loop)

Keep: `deal`, `guard`, `debuff_vulnerable`, and whatever the befriend path
needs after R4 (The Open Hand → mercy choice). Delete the rest.

| Block | Where | Notes |
|---|---|---|
| 47 carrier-less mechanic kinds | `Cards/types.ts:112-343` (union + `CARD_SPECIAL_MECHANIC_KINDS`); handlers in `Combat/combat.engine.ts:2004-2700`, `Combat/combat.cards.ts:329-440`, `Combat/combat.card-text.ts:149-156`, `Combat/stat-scaling.ts`, `Combat/combat.sim-policies.ts` scoring | ~2–2.5k LOC |
| Dead card fields | `threshold`, `dieBonus`, `fate`, `fallen`, `synergy`, `persistentEffect`, `upgrade`, `incrementsFriendship`, `intentionallyAsymmetric`; most of `CardRider`'s 29 fields | keep what the 3 grey cards + befriend use |
| Encounter-state fields | `Combat/combat.encounter.types.ts:818-935`: premises, peroration, pendingOmens, souls, sway, echo, flay, twin, akrasiaDebt … | `wrath`/`chain` go too once R4 removes their signature feeders |
| Synergy | `Cards/synergy-predicates.ts`, the call at `combat.engine.ts:1825` | |
| Pricing | `Cards/cards.pricing.ts` (658 LOC, 0 non-test importers) | |
| Empty registries | `Cards/cards.haunts.ts`, `Cards/cards.allies.ts` (`isAllyCard` 0 consumers), `Cards/cards.sandbox-sets.ts` + the CLI `--sandbox`/swap-pool modes (`CLI/combat-playtest.cli.ts:22-35`) | |
| Oath/hex zones | `combat.engine.ts:393-401, 1474-1505, 1699-1730, 4157-4173`; `enemyEnchantments` | |
| Card types | `CardType = 'spell' \| 'oath' \| 'hex'` (`Cards/types.ts:65`) → `'attack' \| 'skill' \| 'spell'`; the three grey cards re-typed; save migration if card type is persisted | D51 |
| Themes | `Cards/card-themes.ts` (six dead archetypes + `curse` in `THEME_KEYWORDS`); `Cards/card-keywords.ts` (maps neither `deal` nor `debuff_vulnerable`, so 2 of 3 grey cards report no keywords — fix) | |
| Deck draft / presets | `Combat/combat.deck-draft.ts` (303 LOC); the one-entry `Combat/combat.starter-deck-presets.ts` → a plain grey-deck constant | |
| Reward steering | `Combat/combat.rewards.ts:105-285` (`REWARD_THEMES`, `REWARD_OFF_THEME_RATE`, dominant-theme slot, keyword pull, rarity); `Combat/combat.reward-draft.sim.ts`; `keywordsOf` | keep the reward itself (D44, D50); fix the "grey starters are never a reward" comment |
| Learn Card | `Cards/card.engine.ts:34` `getAvailableCards` (always empty) | deleted (D63) |
| Alt-win systems | sway/PLEA, premises/CHARGE, capitulation (`concedeFloorFor`, `capitulateThreshold`, `selectCapitulationChoice`), peroration; friendship *increments* from cards; `regionConsequences.sparedRegions`/`exploitedRegions` (never written, `Game/game.reducer.ts:201, 290`); `buff_absolved` | keep only befriend → mercy (D47) |
| Dead `executeCard` branches | haunt / curse / enemy-caster (`Cards/card.engine.ts:140-163`); the Phase-66 synergy branch | |
| Effects with no live carrier | the 22 `EffectPayload` keys with no carrier (`Effects/types.ts`); `getStudyMarkIntensity`, `extendRandomBuffDuration`, `applyDrain`, `applyDispel`, `consumeDotEffects`, `projectReapAll`; player roll-modifier plumbing | coordinate with R2/R5 |
| Other test-only modules | `World/quest-reward.ts` (140), `initializeCombat` | |
| Test utilities | `test-utils/retired-verb-cards.ts` (537), `test-utils/fixture-effects.ts` (103) and the 31 test files that load them | rewrite to grey cards or delete with subject |
| Dead-subject tests | pricing, befriend.card, friendship-increment, reward-draft.sim, quest-reward, reward-keyword-pull, turnabout-ledger, themed-decks, bridge-rewards, roles-themes (~2.8k LOC) | befriend.card is rewritten for The Open Hand, not deleted |
| Stale comments | `starters.cards.ts:36, 55`, `card.removal.ts:133`, `card-themes.ts:1-13`, `card.engine.ts:114` (nonexistent `phases/scenario.ts`), `Cards/index.ts:4-9`, `Enemy/enemy.library.ts:3629` `void consumableLibrary;` | |

**Not touched (owner rulings):** `Cards/card-upgrades.ts` (D8), die growth
and `bankedSouls` (D20), the rank ladder / tiers / `color` field (B4 records
them; card sessions decide).

**Cross-package:** mobile's KW-2 lint reads `CARD_SPECIAL_MECHANIC_KINDS`;
mobile presenters use `concedeFloorFor`, `capitulateThreshold`,
`selectCapitulationChoice`; the card editor is deleted in R1 so it no longer
constrains this phase. Ship mobile follow-through in R8 or in the same PR if
type-check requires it.

**Split:** likely three PRs — (a) kinds, handlers, state, fixtures;
(b) pricing, synergy, themes, draft, rewards, card types; (c) alt-wins and
effects. Keep main green between them.

**Carrier sweep (D45)** closes the phase: after R2/R4/R5/R6/R7 the atlas
should hold DEAL, GUARD, VULNERABLE, the befriend word, and dice/blacksmith
words with a live source (PIP, BOON, HONE, TEMPER — re-verify each).
