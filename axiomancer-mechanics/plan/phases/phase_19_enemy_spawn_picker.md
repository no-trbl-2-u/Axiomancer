# Phase 19 — Enemy spawn picker (debug tab)

> Brief for `/ship-a-phase`. All decisions pre-resolved.
> DO NOT ASK the user during implementation — decide and ship.

## Outcome

`npm run game` ships a new top-level tab — `Debug` — that lists every
enemy in `ENEMY_REGISTRY` and starts combat against the selected fixture.
The tab leverages the existing `startCombat({ enemies: [enemy] })` path
so no new engine surface is needed. A hermetic test pins the registry's
shape so a renamed or removed enemy fails loudly rather than silently
breaking the picker.

## Source spec

No dedicated `specs/19-*.md` file — feature-line tracked in
`plan/steps/01_build_plan.md`:

> Phase 19 — Enemy spawn picker (debug tab to spawn arbitrary enemies into combat)

Resolved questions:

1. **Tab gating?**
   Always visible. The CLI is already a developer demo (`src/CLI` is
   excluded from the build). No env-var gate.
2. **Picker source?**
   `ENEMY_REGISTRY` from `src/Enemy/enemy.library.ts`. It's the
   canonical slug → fixture map and already includes both the legacy
   aliases (`disatree`, `sandbag`) and every Spec 07 enemy.
3. **What happens after spawn?**
   `startCombat({ enemies: [enemy] })` then drop into `combatTab(store)`
   so the player resolves the fight in place — same flow as the
   tutorial-fight pre-load in `main()`.
4. **Does combat-tab visibility change?**
   No. The existing `pickTab(canFight)` already shows the Combat tab
   when `store.getState().combat !== null`; spawning an enemy populates
   `combat` so Combat appears next tick.
5. **What about the existing tutorial-fight prompt in `main()`?**
   Remove it. The debug tab replaces the boot-time tutorial confirm —
   keeping both is redundant.
6. **Tests?**
   `src/Enemy/e2e/enemy.engine.test.ts` is the right home for a new
   case asserting that every `ENEMY_REGISTRY` entry has the fields
   `startCombat` will read (`id`, `health`, `maxHealth`, `baseStats`,
   `stanceLogic`). No CLI test (UI/TTY excluded by convention).

## Implementation units (commit per unit)

### Unit 1 — Add the Debug tab to `game.cli.ts`

File: `src/CLI/game.cli.ts`

Changes:
- Extend `type Tab` with `'debug'`.
- Add `'Debug      — spawn an enemy for the current encounter'` to
  `pickTab`'s choice list (between Inventory and Quit).
- Add `async function debugTab(store: GameStoreHandle): Promise<void>`
  that prompts the user to pick a slug from `Object.keys(ENEMY_REGISTRY)`,
  calls `store.getState().startCombat({ enemies: [enemy] })`, and
  awaits `combatTab(store)`.
- Dispatch `'debug'` to `debugTab(store)` in the main switch.
- Drop the boot-time tutorial-fight prompt and its
  `startCombat({ enemies: [Disatree_01] })` call from `main()` — the
  Debug tab replaces it. Drop the now-unused `Disatree_01` import if
  it's the only consumer.
- Import `ENEMY_REGISTRY`, `EnemySlug` from `src/Enemy/enemy.library`.

Commit: `feat(cli): add Debug tab — pick any enemy from ENEMY_REGISTRY and spawn`

### Unit 2 — Hermetic registry sanity test

File: `src/Enemy/e2e/enemy.engine.test.ts`

Add a new `describe` block:

```ts
describe('ENEMY_REGISTRY', () => {
    it('contains every published enemy with a stable shape', () => {
        for (const [slug, enemy] of Object.entries(ENEMY_REGISTRY)) {
            expect(enemy.id).toBeTruthy();
            expect(enemy.maxHealth).toBeGreaterThan(0);
            expect(enemy.health).toBe(enemy.maxHealth);
            expect(enemy.baseStats).toBeDefined();
            // Slug stability: the slug must round-trip back to the same fixture.
            // Catches accidental rename in a future refactor.
            expect(ENEMY_REGISTRY[slug as keyof typeof ENEMY_REGISTRY]).toBe(enemy);
        }
    });
});
```

Import `ENEMY_REGISTRY` from `'../enemy.library'`.

Run `npm test` — must stay green.

Commit: `test(enemy): pin ENEMY_REGISTRY shape so debug picker can rely on it`

### Unit 3 — Verify gate + DoD

```bash
npm run verify
npm run deploy:check
```

Flip Phase 19 in `plan/steps/01_build_plan.md` to `[x]` with the hash.

Commit: `plan: phase 19 shipped — Debug tab spawn picker`

## Decisions made upfront — DO NOT ASK

- **No env-var gate.** CLI is developer-only by construction.
- **Drop the boot-time tutorial-fight prompt.** Debug tab subsumes it.
- **Use `ENEMY_REGISTRY` directly**, not `EnemyLibrary`. The registry
  has stable slugs the picker can display; the library is just an
  unkeyed list.
- **No new engine surface.** `startCombat` already handles the
  `{ enemies: [...] }` shape.

## Verify gate

```bash
npm run type-check
npm test
npm run verify
npm run deploy:check
```

## Definition of Done

- [ ] `src/CLI/game.cli.ts` has a `'debug'` tab dispatching to
      `debugTab(store)`; `debugTab` spawns combat against any
      `ENEMY_REGISTRY` enemy.
- [ ] Tutorial-fight prompt removed from `main()`.
- [ ] `src/Enemy/e2e/enemy.engine.test.ts` has a `ENEMY_REGISTRY` shape
      sanity case; full suite stays green.
- [ ] `npm run verify` and `npm run deploy:check` exit 0.
- [ ] Phase 19 row in `plan/steps/01_build_plan.md` is `[x]` with hash.

## Follow-ups (out of scope)

- Encounter-builder UX (multiple enemies, custom HP, custom level scaling)
  — track if needed; today's single-enemy picker covers the debug intent.
