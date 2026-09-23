# Spec — axiomancer-mechanics

<!-- lexicon-ok: strike-ban-doctrine — this file is a superseded record; it names the 2026-07-08 revamp to date itself, not to assert the ban. -->

> **Superseded by the repo-root [`spec.md`](../spec.md).** This file
> predates the npm-workspaces monorepo merge and described the engine as it
> existed before Hazard-Pattern Combat shipped (Spec 25, 2026-06-21) and
> before the Spec 32 v3 "THE STRIKE IS DEAD" card-schema revamp
> (2026-07-08) — its former product narrative (Product / Audience / V1
> scope / 6-month horizon) and public-API export table both described
> engine surface that no longer exists (e.g. `resolveCombatRound` and
> friends, removed with the legacy driver). Nothing in the repo links to
> this file (verified via `grep -rn "mechanics/spec.md"`), so it was
> silently diverging rather than being read. Root `spec.md` is the
> canonical "what and why" per `plan/bearings.md`; the live, maintained
> public-API index is [`docs/api.md`](./docs/api.md) (Combat section:
> [`docs/combat.md`](./docs/combat.md)).

## Stack

TypeScript strict, Vitest, tsc + tsc-alias, ESLint, npm.
No database, no server, no web UI.

## Non-goals (explicit)

- Web or React Native UI components — not in this repo.
- Database or server — none.
- Network play or cloud sync.
- Multiple save slots (deferred).
- **v1.0.0 stable-API stamp before the spec contracts settle.** Pre-1.0
  minor bumps may carry breaking public-API changes (deprecation
  lifecycle per `RELEASING.md`, since removed); `1.0.0` graduates the contract surface
  to semver-strict only once the spec coverage matches the shipped
  engine. Until then, downstream consumers (e.g. `axiomancer-mobile`)
  pin exact versions and bump deliberately per release.
