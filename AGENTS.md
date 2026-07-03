# Axiomancer monorepo — agent guide

npm-workspaces monorepo. Three packages, flat at the root:

| Package | Role |
|---|---|
| `axiomancer-mechanics` | TypeScript game engine + CLI. Owns rules, state transitions, deterministic RNG, content libraries, balance/tuning, hermetic engine tests. |
| `axiomancer-mobile` | Expo / React Native app. Consumes mechanics as **local source** via the `@mechanics` alias (`→ ../axiomancer-mechanics/src`). Owns screens, navigation, theming, presenters. |
| `axiomancer-card-editor` | Local dev tool. Reads/writes mechanics' `src/Cards/cards.library.ts` in place via the `@mechanics` alias. |

## Hard rules

- ⛔ **Never read `/archive` unless the user explicitly tells you to.** It is the
  retired per-package **nexus** harness (old loop verbs + accumulated `plan/`
  memory + nexus CI), kept only as history and as a one-time seed for the nexus
  re-onboard. Its audit findings, phase plans, and pre-monorepo assumptions are
  stale and will actively mislead. See [`archive/README.md`](./archive/README.md).
- Mobile and card-editor consume mechanics via `@mechanics` — a mechanics
  rename/removal can break them. When changing mechanics' public surface, verify
  the dependent package.
- Rules/state/RNG belong in `axiomancer-mechanics`, never duplicated in mobile
  presenters.

## Root `.claude/`

Live, at the repo root:
- `.claude/commands/` — domain **slash commands** (tuning + playtest): mechanics
  `combat-playtest`, `deck-tuning`, `gathering-tuning`, `hazard-tuning`,
  `loot-cache-tuning`, `quest-board-tuning`, `rest-tuning`; mobile `bump-engine`,
  `critic-loop`, `deep-playtest`, `combat-ux-tuning`, `hermes-playtest`. Each is
  self-contained and carries a header naming the package it runs against (paths
  are package-relative — `cd` there or use `-w`). `combat-tuning`,
  `legacy-combat-tuning`, `playtest`, and `resolve-playtest` were trimmed.
- `.claude/skills/` — design skills: `brainstorm-mechanics`, `character-spec`,
  `story-spec`, `world-spec`.
- `.claude/agents/` — `mechanics-expert`, `playtester`.

Commands write their reports to `<package>/docs/reports/` (created on demand).
All `plan/…` / `/march`-era references were scrubbed at the post-merge cleanup;
the commands are fully self-contained.

## Per-package guides

Each package keeps its own `AGENTS.md` / `CLAUDE.md` with domain specifics
(engine doctrine, mobile presenter boundaries). Read the relevant one before
working in a package.

## Verify

- `npm run verify --workspace axiomancer-mechanics` — type-check + tests + build
- `npm run verify --workspace axiomancer-mobile` — lint + typecheck + jest
- `npm run type-check --workspace axiomancer-card-editor`

## Nexus

The domain skills/commands/agents are live in root `.claude/`, but the autonomous
**loop** (`march`/`iterate`/`critique`/`oversight`/…) and its `plan/` memory are
still in `/archive` — the unified harness has **not been re-onboarded yet**. That
is a deliberate, user-run step against this assembled structure; until then there
is no live `march`/`iterate` loop at the root.
