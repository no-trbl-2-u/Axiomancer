# CLAUDE.md

Canonical guidance: this package's `AGENTS.md`. The one thing to hold
in mind at all times: this tool edits the REAL mechanics card library
(`../axiomancer-mechanics/src/Cards/library/*.cards.ts` — one module
per theme; `cards.library.ts` is only the aggregator) in place — all
mechanics knowledge flows through the single adapter
`src/data/mechanics.ts`, and writes to the library are the product
(verify mechanics after card-changing sessions).
