# Phase D6d — Flag-on combat e2e

> Agent-facing brief. Final sub-phase of the D6 mobile split. Build the seeded
> flag-ON browser e2e that exercises the whole D6a-c stack end-to-end, and
> capture the flag-on screenshots that D6a/D6b/D6c deferred (the pre-boot flag
> harness only becomes possible here). Deps: D6a, D6b, D6c (shipped).

## The template — mirror it exactly
`axiomancer-mobile/scripts/combat-encounter-e2e.mjs` (run via `npm run
e2e:combat`). Read it. It: `expo export --platform web` into a dist dir (honoring
`COMBAT_E2E_REUSE_EXPORT=1` to reuse a prior export), serves it, launches
Puppeteer/Chrome, sets `globalThis.__AXM_COMBAT_SEED__` / `__AXM_COMBAT_DECK__`
**before the bundle runs** (evaluateOnNewDocument-style), navigates the
`/combat-encounter` dev sandbox (dev routes need the preview build profile),
drives real taps, and asserts board state. Build `scripts/upgradeable-dice-e2e.mjs`
the same way + an `e2e:upgradeable-dice` npm script (and fold it into the
`e2e:minigames` chain with its own `*_REUSE_EXPORT` env like the siblings).

## The pre-boot flag hook (D6a shipped this)
`applyCombatFlagsFromEnv` (`state/combat/flags.ts`) honors
`globalThis.__AXM_UPGRADEABLE_DICE__` and runs once at `_layout` boot. So set it
alongside the seed/deck in the SAME evaluateOnNewDocument, before the bundle —
that is the only way to boot the combat surface flag-on (the whole reason this is
its own phase). Pick a `__AXM_COMBAT_SEED__` that yields the faces the flow needs
(a special, a mana, a miss across the four dice, and a whiff round for Press
Fate); the roll is deterministic from the seed.

## The flow to drive + assert (each step is an assertion)
1. **Roll** — the four fixed dice render with faces (special / mana / miss / and,
   where reached, cracked). Assert the tray shows faces (not the old 2-die model).
2. **Power a card** — drag a usable die onto a color-matching card; assert it
   plays. Then attempt an **off-color drop** and assert it is **refused loudly**
   (the ineligible-drop feedback).
3. **Momentum advances** — a paid play advances the chain chip; assert length/color.
4. **Break resets to null LOUDLY** — a chain-breaking play shows "✕ MOMENTUM
   BROKEN"; assert the loud break state.
5. **Press Fate** — on a whiff round with ◆, the Press Fate control is enabled;
   pressing rerolls the miss faces; assert the tray updates. (And assert the
   disabled+reason state when unaffordable/used.)
6. **Stance check resolves with feedback** — end a phase in the yields stance;
   assert the telegraph shows the resolution (×0.5 +1◆ / etc.).
7. **Blacksmith HONE applied** — via the Dev-menu shortcut (D6c) launch the
   blacksmith, HONE a die, claim; then assert the combat tray reflects the new
   face table (more mana faces). (Use the dev shortcut — this proves D6c's engine
   round-trips into the rail the tray reads.)
8. **Screenshots** — capture the flag-on tray (with faces), the momentum
   break/surge chip, the gear rail, and the blacksmith forge, at the mobile
   viewport (375×812) — write them to the e2e artifact dir. These are the
   deferred visual proof + the small-screen-CROWDING evidence.

Keep the assertions robust (testIDs from D6a-c: `combat-dice-tray`, the
Press-Fate control, `blacksmith-offer-*`, etc.); prefer text/testID probes over
pixel matching. If a step is genuinely unreachable in one seeded run, split into
two seeded runs rather than force it.

## Scope boundary
Test-infra + screenshots ONLY. Do NOT change D6a-c product code to make the e2e
pass (if the e2e reveals a real product bug, STOP and report it as a finding —
don't paper over it). No new visual system.

## Decisions made upfront — DO NOT ASK
- Mirror the existing `*-e2e.mjs` harness conventions (export/serve/drive) — no
  new framework (there is no Playwright here by design).

## Surface as `[needs-user-call]`
- The captured flag-on crowding screenshot IS the artifact the D6 visual-direction
  owner thread was waiting for — reference it, note the crowding verdict, don't
  restyle unilaterally.

## Prove (DoD)
- `node scripts/upgradeable-dice-e2e.mjs` (and the npm script) runs GREEN — every
  flow step asserted; screenshots written.
- `npm run verify -w axiomancer-mobile` still GREEN (the script + any testID/prop
  additions don't regress unit tests).
- Flip D6d `[x]` + Phase log + hash. Reference the screenshots.

## Follow-ups
- D6f (roll ritual) + D7 (tuning/ratification). D6d's harness is also what D7's
  qualitative flag-on pass can reuse.
