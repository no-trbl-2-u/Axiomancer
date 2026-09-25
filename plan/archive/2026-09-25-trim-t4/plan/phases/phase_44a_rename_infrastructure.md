# Phase 44a — Rename infrastructure

> Agent-facing brief. **Tooling only — ships NO renames.** Builds the machine
> that makes Phases 44b-44i safe: the concept-level rename map, a codemod
> that can apply it, and a naming-law lint for new content. Everything it
> produces is data + dormant scripts; nothing in `src/` changes.

## Inputs (read in this order)

1. `axiomancer-mechanics/specs/34-dark-fantasy-campaign.md` — the ratified
   design charter. §5.9 is this phase's literal scope statement; §3 is the
   Naming Law the lint enforces; §5 is the concept-level rename map this
   phase turns into data.
2. `plan/steps/01_build_plan.md` Phase 44a row — the three-item scope (a/b/c).
3. `plan/bearings.md` § "THE UNSHACKLING" item 3 — why the retheme runs off a
   map and a lint, not opportunistic renaming.
4. `axiomancer-mechanics/docs/lexicon.json` + `scripts/check-lexicon.mjs` +
   `axiomancer-mechanics/docs/LEXICON.md` — the existing retirement-guard
   machinery this phase's item (c) was asked to extend.

## Scope — exactly three artifacts

### (a) `docs/retheme-map.json`

Concept-level old->new pairs, derived from spec 34 §5.2 (15 registry-keyword
renames), §5.5 (8 signature-skill display names, ids frozen), §5.6 (copy
canon: VITAE/STANCE keep, MORALE->GRACE), §5.7 (one enemy rename: The
Incompleteness -> The Unfinished), and §5.8 (the rest node's three offer
names — gated on Phase 52e having shipped first, per that section). Plus the
two id-level pairs spec 34 explicitly permits: the `tf-` -> `ht-` card-id
prefix (R-13) and the two `§5.2.2` worked-example effect ids
(`debuff_rapport` -> `debuff_quarter`, `buff_open_minded` -> `buff_absolved`).
A `keep` list documents every ratified-unchanged concept (§5.1.x, the enemy
archetypes of §1.2, the enemy roster survivors of §5.7, the minigame names
and the Aporia proper noun of §5.8) so a future reader never has to re-derive
"was this considered and kept" by re-reading the whole spec.

Every pair carries a `ruling` (spec 34 section) and `applies` (which
downstream phase executes it) field, so 44b-44i can filter the map to their
own slice instead of reading the whole thing.

### (b) `scripts/apply-retheme-map.mjs` — the codemod

Consumes the map and applies word-boundary text replacement across explicit
file globs (`--applies=<phase>` / `--kind=<kind>` filters; `--write` to
actually touch disk, otherwise a dry-run report). Deliberately mechanical,
not semantic — it does not know "the premise of this test" (English prose)
from `PREMISE` (the keyword), which is why it defaults to dry-run, refuses
to run with no explicit globs, and every downstream phase is expected to
review the resulting diff before committing. **Not invoked with `--write` by
this phase** — smoke-tested in dry-run mode only (see Prove, below).

### (c) The naming-law lint — `scripts/check-naming-law.mjs`

Three checks against **candidate names for new content**, per spec 34 §5.9
items 3-5:

- NL-8 (the collision law) — a card/enemy/place/NPC name may not be, or
  begin with, a registry keyword, a locked-system word, a card-type word, a
  rank word, or a stance word. Registry sourced live from
  `docs/retheme-map.json`'s `keep` + renamed `new` words, so it never drifts
  from (a).
- NL-4/NL-5 (the format law) — no numerals, no colons, no parentheses in any
  authored name.
- V-1 (the banned register) — the philosophy-jargon word list from spec 34
  §2.2, with the NL-9 allowlist (capitalized `Aporia`/`Sophist` survive as
  proper nouns; lowercase or mid-word uses of either do not).

Colocated tests: `scripts/check-naming-law.test.mjs`, run via
`node --test scripts/check-naming-law.test.mjs`. Every case is either a name
spec 34 itself cites as shipped-clean or a violation spec 34's own examples
construct.

## Decisions made upfront — DO NOT ASK

- **Item (c)'s literal wording ("register every retired philosophy term in
  `docs/lexicon.json`") is DEFERRED, not shipped this phase.**
  `scripts/check-lexicon.mjs`'s own docstring and all four existing rows
  (`base-power`, `chip-hp`, `pressure-tracks`, `src-skills-path`) register a
  term at the commit that actually retires it from code — never earlier.
  Registering the fifteen §5.2 words, the six rank names, and the V-1 list
  *now*, while the code and ~40 live prose files still correctly describe
  the pre-retheme system (this phase ships ZERO renames), would either force
  premature rewrites of docs that are still accurate — scope creep into
  44b/44c/44g/44h's own content work — or require blanket
  `<!-- lexicon-ok -->`-tagging dozens of files for a guard that protects
  nothing yet, since nothing has actually been retired. Filed as residue to
  `plan/AUDIT.md` (below): each of 44b/44c/44g/44h adds its own
  `lexicon.json` rows in the same commit that performs its rename, exactly
  like every existing row already does. The naming-law lint (c, as actually
  shipped) covers the part of item (c) that IS zero-blast-radius today: a
  guard against *new* content reintroducing the banned register, which does
  not require touching any existing accurate doc.
- **NL-9 exclusions from the general word lists.** `Aporia` and `Sophist`
  are load-bearing proper nouns (the labyrinth continent/enemy archetype,
  and the C-01 NPC) referenced correctly across dozens of live docs today.
  Both are excluded from `V1_WORDS`' unconditional-ban behavior via the
  `NL9_SURVIVORS` allowlist (capitalized form only) rather than omitted
  outright, so the lint still catches an *uncapitalized* stray use of either
  word as ordinary philosophy jargon.
- **The rank ladder's `Aporia` (R-14, rank 6 -> `Saint`) is a display-name
  pair on `CardRank` 6, not a ban on the word "Aporia."** The retheme-map
  entry says so explicitly (`note` field) so 44c doesn't conflate "rename
  the rank display" with "rename the place/enemy-archetype," which spec 34
  §5.7/§5.8 explicitly rules KEEP.
- **The rest-node pairs in the map (§5.8) are unconditional data, not
  gated code.** They're recorded now so 44f doesn't have to re-derive them,
  but 44f's own row instruction stands: apply nothing about rest until
  Phase 52e has shipped. The map entries carry an explicit `note` saying so.
- **`apply-retheme-map.mjs` targets explicit files/dirs, not real glob
  syntax.** Kept dependency-free (matches every other repo-root script);
  shell globbing before invocation covers the common case, and 44b-44i's
  invocations are expected to be scoped and reviewed per-file anyway.

## Prove (DoD)

- `node scripts/apply-retheme-map.mjs --list` prints every pair with no
  errors; a dry-run smoke test against a real file
  (`axiomancer-mobile/state/combat/keywords.ts`) reports occurrences and
  leaves the file untouched (`git status --short` clean on it).
- `node --test scripts/check-naming-law.test.mjs` — all green.
- `node scripts/check-naming-law.mjs --list` prints both registries with no
  errors.
- `git diff --stat` touches only: `docs/retheme-map.json`,
  `scripts/apply-retheme-map.mjs`, `scripts/check-naming-law.mjs`,
  `scripts/check-naming-law.test.mjs`, this brief, `plan/AUDIT.md`, and the
  build-plan status line. Zero files under `axiomancer-mechanics/src/` or
  `axiomancer-mobile/` change.
- Flip Phase 44a's `[ ]` -> `[x]` in `plan/steps/01_build_plan.md`, append
  the commit hash.

## Follow-ups (out of scope this phase)

- Phase 44b — keyword registry + glossary retheme (first consumer of the
  map + codemod, and the phase that adds its own `lexicon.json` rows for the
  §5.2 terms it actually retires).
- Phase 44c/44e/44f/44g/44h/44i — the remaining retheme phases, per §9's
  downstream-obligations table.
- Registering the deferred `lexicon.json` rows — owned by whichever phase
  performs each rename (filed to `plan/AUDIT.md`).
