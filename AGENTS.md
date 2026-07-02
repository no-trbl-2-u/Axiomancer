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
- `/carryforward` is **staging**, not live: domain tuning/playtest/design skills
  awaiting trim + fold-in during the nexus re-onboard. Don't treat it as an active
  `.claude/`. See [`carryforward/README.md`](./carryforward/README.md).
- Mobile and card-editor consume mechanics via `@mechanics` — a mechanics
  rename/removal can break them. When changing mechanics' public surface, verify
  the dependent package.
- Rules/state/RNG belong in `axiomancer-mechanics`, never duplicated in mobile
  presenters.

## Per-package guides

Each package keeps its own `AGENTS.md` / `CLAUDE.md` with domain specifics
(engine doctrine, mobile presenter boundaries). Read the relevant one before
working in a package.

## Verify

- `npm run verify --workspace axiomancer-mechanics` — type-check + tests + build
- `npm run verify --workspace axiomancer-mobile` — lint + typecheck + jest
- `npm run type-check --workspace axiomancer-card-editor`

## Nexus

The unified autonomous-build-loop harness has **not been re-onboarded yet** — that
is a deliberate, user-run step done against this assembled structure. Until then
there is no live `march`/`iterate` loop at the root.
