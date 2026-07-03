# Axiomancer

Monorepo for **Axiomancer** — a turn-based RPG with philosophical themes.

## Packages

| Path | Package | What it is |
|---|---|---|
| [`axiomancer-mechanics/`](./axiomancer-mechanics) | `axiomancer-mechanics` | The engine: combat, world, cards, encounters (TypeScript library). |
| [`axiomancer-mobile/`](./axiomancer-mobile) | `axiomancer-mobile` | The Expo/React Native app. Consumes mechanics locally via the `@mechanics/*` path alias. |
| [`axiomancer-card-editor/`](./axiomancer-card-editor) | `axiomancer-card-editor` | Local dev tool: web-based card (Action) editor. Reads/writes mechanics' `src/Cards/cards.library.ts` in place. |

## Layout

npm workspaces, flat top-level. Mechanics is consumed by mobile as **local source** (no npm publish loop) — mobile's Metro transpiles mechanics TS directly via the `@mechanics/*` alias.

```
Axiomancer/
  package.json            # workspaces root + verify/deploy:check
  axiomancer-mechanics/
  axiomancer-mobile/
  axiomancer-card-editor/
  .github/workflows/      # path-scoped CI per package
  skills/  plan/  scripts/ # nexus autonomous-loop harness (root)
  .claude/                # loop + domain commands, agents, design skills
```

## History

Assembled from two previously-separate repos via `git subtree`, preserving each package's mainline commit history:

- `axiomancer-mechanics` ← github.com/no-trbl-2-u/axiomancer-mechanics
- `axiomancer-mobile` ← github.com/no-trbl-2-u/axiomancer-mobile
