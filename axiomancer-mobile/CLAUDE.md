# CLAUDE.md

Canonical guidance: this package's `AGENTS.md` (orientation, UI
evidence doctrine, commands) and the root `AGENTS.md` (monorepo rules,
truth sources, PR conventions — auto-merge lives there now).

Always in context here:

- **Canon combat copy is `VITAE` and `STANCE` / `CHOOSE A STANCE`** —
  copy regressions to the generic terms are rejected on sight.
- This package is a **thin presentation layer**: rules, state shape,
  and RNG live in `axiomancer-mechanics` (consumed as local source via
  `@mechanics`), never in presenters. No hardcoded player-facing copy
  in components; no hex literals (use AXM tokens).
