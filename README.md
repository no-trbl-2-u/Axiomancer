# Axiomancer

Monorepo for **Axiomancer** — a dark fantasy deckbuilding RPG campaign.

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

## Architecture boundaries

See [`docs/external-architecture.md`](./docs/external-architecture.md) for the authoritative map of systems outside this monorepo: the game knowledge-base repository, KB and Axiomancer MCP servers, SomberSoft doctrine and decisions, GitHub/Claude automation, Expo EAS, and the private Cloudflare R2 artifact vault. External services may support research, automation, previews, or evidence storage; none owns game-rules truth.

## History

Assembled from two previously-separate repos via `git subtree`, preserving each package's mainline commit history:

- `axiomancer-mechanics` ← github.com/no-trbl-2-u/axiomancer-mechanics
- `axiomancer-mobile` ← github.com/no-trbl-2-u/axiomancer-mobile
