# axiomancer-card-editor — agent guide

Local-only Vite/React dev tool. Edits the REAL mechanics card library —
`../axiomancer-mechanics/src/Cards/cards.library.ts` — in place via the
`@mechanics` alias. Not published, not deployed; its user is the game's
designer, on localhost.

## The coupling (the one thing to respect)

Everything the editor knows about cards, effects, and combat enums flows
through **`src/data/mechanics.ts`** — the single data adapter over
`@mechanics/*`. Never import mechanics source anywhere else, and never
import the big `@mechanics/index` barrel (it can pull node-only code via
the `./node` export; the adapter deliberately imports browser-safe
submodules).

**`src/data/mechanics.contract.ts`** is the compile-time drift contract:
type-level assertions that the editor's hand-maintained
`SPECIAL_MECHANIC_KINDS` list exactly matches mechanics'
`CardSpecialMechanic['kind']` union. When mechanics adds or removes a
kind, type-check goes red *here*, naming the drift — update
`SPECIAL_MECHANIC_KINDS` (and any UI the new kind needs), don't loosen
the contract. Witness for why this exists: edba726 / the root
`AGENTS.md` cross-package impact checklist.

## Verify

```
npm run verify -w axiomancer-card-editor   # type-check + lint + test + build
```

CI (`verify-card-editor.yml`) runs the same gate on changes to this
package OR mechanics; the `cross-package` job in `verify-mechanics.yml`
type-checks this package on mechanics impact-path pushes.

## Conventions

- Rules/state/RNG live in mechanics, never here — this tool renders and
  writes library entries; it owns no game logic.
- The dev-server write path is `src/server/cardEditorPlugin.ts` (a Vite
  plugin); treat writes to `cards.library.ts` as the product, so verify
  mechanics (`npm run verify -w axiomancer-mechanics`) after sessions
  that changed cards.
- Root `CLAUDE.md` / `AGENTS.md` and the nexus standing rules apply
  (no `Co-Authored-By`, no emojis, foreground verify).
