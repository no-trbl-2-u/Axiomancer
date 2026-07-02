# axiomancer-mechanics: 0.20.0 → 0.21.0 upgrade guide for mobile

> Status: **published**. npm registry confirms `axiomancer-mechanics@0.21.0`.
> Phase 124 is the mobile catch-up phase for this release.

---

## TL;DR

- Bump `axiomancer-mechanics` from `^0.20.0` to `^0.21.0` or an exact `0.21.0` pin if the phase chooses tighter package discipline.
- This is an encounter-procedure release. Mechanics now owns more of Quest Board, Rest, and Loot-cache.
- Mobile must present engine-owned encounter state and choices. It must not locally simulate Quest Board verbs, rest watches, loot-cache layers, rewards, or outcome tiers.
- Verification must include typecheck, focused encounter Jest, full verify, visual smoke, and at least one dev-tools playthrough using SELF → DEV TOOLS (the `/dev` route, Phase 132) → selected encounter. (Pre-132 builds: SELF → dev menu dropdown.)

---

## Release contents mobile must account for

## 1. Quest Board encounter: "The Boy's Almanac"

**Mechanics change:** `World/QuestBoard` now ships the story-quest board encounter. The first board is `build-the-boat`: a sandboxed 16-space loop for the Fishing Village main quest. It reads no live `GameState`; only the completion record flows back.

**Mobile action:**

- Use the mechanics package as the sole source for board state, legal actions, movement, rewards, and completion tier.
- Host the launch from the mechanics `quest` MapEvent payload (`boardId`) rather than inventing mobile-side board selection.
- Present the completion record and outcome tier (`masterwork` / `seaworthy` / `driftwood` or current engine names) without recalculating them.
- Add or update focused tests for quest event launch, board presenter state, and completion handoff.

## 2. Quest Board micro-game verbs

**Mechanics change:** Quest Board spaces no longer behave like repeated binary die gates. The board now has distinct quick verbs:

- `GATHER` — press-your-luck wet haul: press, bank, or bust.
- `DUEL` — pre-roll grit allocation.
- `SNAG` — resource bracing / insurance before crossing risk.
- `MARKET` — escalating repeat-buy prices.
- `PARLEY` — carried-resource gates.
- `HEARTH` — rest / optional linger.
- `CACHE` and `OMEN` — lighter reveal / pacing spaces.

**Mobile action:**

- Surface each verb as a distinct player-facing interaction, not one generic roll button.
- Reflect engine affordability and legal actions exactly; disabled actions need clear text, not local rule checks.
- Teach the player enough to choose well: show current haul/grit/brace/price/gate state where relevant.
- Preserve engine-owned math. Mobile labels and lays out; mechanics adjudicates.

## 3. Rest encounter: "The Night Watch"

**Mechanics change:** Rest is now a full encounter procedure: three watches, posture choices, fire warmth, authored dreams, stirs, still hours, and a dawn outcome carrying `healFraction`, `cleansed`, and keepsakes for host settlement. A rest can be meagre but never lethal.

**Mobile action:**

- Replace any passive/silent rest assumption with a presentation path for the rest encounter when the engine emits it.
- Render posture, watch state, fire/wood pressure, dream choice, stirs, and dawn outcome from engine state.
- Apply/display outcome through engine-provided payload fields; do not compute healing or cleansing locally.
- Ensure literal rest fixtures include the new `healFraction` field.

## 4. Loot-cache encounter: "The Reliquary"

**Mechanics change:** Loot cache is now a layered push-your-luck procedure: lid, false bottom, keeper's tithe; trap fates are sealed at creation; one probe reads the next seam; claim maps item refs back to real items.

**Mobile action:**

- Present the layer/probe/claim loop as engine state, not inventory-local logic.
- Keep item refs as refs until the host maps them at claim time.
- Surface risk/trap information learned by probing without leaking sealed fates early.
- Add focused tests for cache presenter/actions if existing cache flow assumes passive grant behavior.

## 5. Map event contract change

**Mechanics change:** `MapEventKind` includes `'quest'`. `QuestEventPayload` carries `boardId`. `ResolvedEvent` rest payload now carries `healFraction` alongside `healed`.

**Mobile action:**

- Drain type/import drift after the package bump.
- Update event discriminated-union handling for `kind: 'quest'`.
- Update rest fixtures, mocks, and presenter expectations for `healFraction`.
- If existing exhaustive switches fail, fix them by rendering the new engine kinds, not by falling through to generic/unknown behavior.

---

## Required verification for Phase 124

```bash
npm install axiomancer-mechanics@0.21.0
npm run typecheck
npm test -- --runInBand state/e2e/quest.flow.engine.test.ts state/e2e/quest.screen.test.tsx state/e2e/rest.flow.engine.test.ts state/e2e/cache.flow.engine.test.ts state/e2e/encounter-flow.engine.test.tsx
npm run verify
npm run verify:visual
```

Also perform one real dev-tools smoke path when the app can run:

1. Open the app.
2. Go to `SELF`.
3. Tap `DEV TOOLS` to open the `/dev` route (Phase 132 extracted the old
   SELF dropdown into a dedicated dev-only route). On pre-132 builds,
   expand the SELF `DEV MENU` dropdown instead.
4. Under `ENCOUNTER TRIGGERS`, trigger Quest Board, Rest, and Loot-cache
   encounters if available.
5. Record pass/fail notes and screenshots/logs for any runtime errors.

If `verify:visual` exits on screenshot diffs with clean export and zero console errors, preserve the diff evidence for T. Do not approve new baselines merely to make the gate green.

---

## Out of scope

- Redesigning the encounter art direction beyond what the new engine states require.
- Moving rules into mobile.
- Rebalancing Quest Board, Rest, or Loot-cache from mobile.
- Broad cleanup unrelated to the 0.21.0 package contract.
