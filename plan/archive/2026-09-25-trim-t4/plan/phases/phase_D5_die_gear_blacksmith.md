# Phase D5 — Die gear + the blacksmith encounter

> Agent-facing brief. Make D2's hardcoded die-gear interface REAL: four
> dedicated color-coded equipment slots, gear items that define each die's
> special payload and face upgrades, and the blacksmith encounter that
> upgrades them. Engine + content; UI is D6.

## Inputs

1. Spec 33 §6 — the die-gear model (owner-locked at D1): dice immutable;
   ALL progression on gear; slots separate from the 5-piece wear model.
2. D2's die-gear interface (payload provider + face table per die).
3. `specs/05-equipment-engine.md` + the phase 18/19 slot model — gear
   pieces are equipment-engine ITEMS, but live in their own 4-slot rail,
   NOT in `EquipmentLoadout` (signet relics and die gear never compete).
4. `src/Game/game.migrate.ts` — `GAME_STATE_VERSION` migration home.

## Scope

- **The rail**: `dieGear: { body, mind, heart, wild }` (stance-named, like
  everything else) — a dedicated 4-slot structure on the character;
  always-full (default gear is the floor, no empty slot state).
- **Gear items**: id, die color, special payload (default "+2◆"), upgrade
  state (HONE count = added mana faces; TEMPER count = mana→special).
  Face caps enforced AT THE ITEM: ≤2 special / ≥1 miss per colored die,
  Gold ≤1 special. Later-game payload-variant gear = new items (swapping
  gear IS the payload change — no service verb).
- **Blacksmith encounter** (new content surface): a map encounter (world
  MapEvent kind or village service — follow the existing encounter-engine
  conventions, e.g. the rest/loot-cache pure-engine pattern) offering:
  HONE, TEMPER (◆/souls pricing from D3's economy — placeholder constants
  clearly marked if D3's table isn't ratified yet), and gear swap when
  variant gear exists. Illegal upgrades (cap-violating) refused loudly at
  the engine level.
- **Reward hooks**: variant/upgraded gear grantable via existing reward
  surfaces (loot-cache / quest board / village) — wire the grant action,
  content authoring stays minimal (1-2 variant payloads as witnesses).
- **Persistence**: gear + upgrade state in the save; `GAME_STATE_VERSION`
  bump + migration (older saves get default gear).

## Decisions made upfront — DO NOT ASK

- Dice never mutate; gear carries everything (owner, D1).
- Dedicated rail, NOT accessories (owner, D1).
- PROVISIONAL special-on-use stays a D2 engine rule — gear only supplies
  the payload, never the trigger timing.

## Surface as `[needs-user-call]`

- Blacksmith placement/cadence if the map has no natural slot (new
  MapEvent kind vs village tab) — propose one, ask before inventing map
  content.
- Any variant payload beyond "+2◆" you author as a witness — payloads are
  design surface; propose, don't unilaterally ship exotic ones.

## Prove (DoD)

- Hermetic tests: cap enforcement, upgrade application → face table
  actually changes D2's rolls, payload firing (incl. Reserve-spend
  timing), migration from a pre-D5 save, refusal paths.
- `npm run verify -w axiomancer-mechanics`; barrel changes ⇒ mobile
  re-verify rule.
- Flip D5 `[x]` + Phase log + hash.

## Follow-ups

- D6 renders the rail, gear inspection, and blacksmith UI; D7 tunes
  upgrade pricing into the ratified economy.
