# Phase 44c — Card library retheme

> Agent-facing brief. **Much smaller than its build-plan row believes**
> (spec 34 §5.9.1): the five marquee cards the row names
> (`achilles-and-the-tortoise`, `circular-reasoning`, `straw-mans-jab`,
> `memento-mori`, `the-closing-word`) were already deleted by the Profane
> Canon (`84ef85b`) — the 57 shipped player cards already satisfy §3. What's
> actually left: the rank ladder (R-14), the card types (R-9/R-10), the HAUNT
> class (R-13), the signature-skill names (§5.5), the two thoughtform
> fixture cards, and dead old-vocabulary strings in comments/test fixtures.

## Inputs (read in this order)

1. `docs/retheme-map.json` — filter to `"applies": "44c"` (11 `displayNames`
   entries covering R-9/R-10/R-13/R-14 + 8 signature-skill pairs, plus 2
   `ids` entries for the `tf-`→`ht-` prefix). This is the literal spec; the
   `note` field on the R-14 Aporia row and the `tf-minor-premise` id row
   both matter — read them.
2. `axiomancer-mechanics/specs/34-dark-fantasy-campaign.md` §5.2 (R-9,
   R-10, R-13, R-14), §5.5, §3.2 (NL-10/11/12/13 naming grammar — a lint
   posture for new names, not a rename target), §5.9 / §5.9.1 (this
   phase's real scope, spelled out).
3. `plan/phases/phase_44b_keyword_registry_retheme.md` — sibling phase,
   same shape, same tooling. Its "Decisions made upfront" section sets the
   precedent this brief follows (persisted-state carve-outs, codemod
   caveats, lexicon-row policy).
4. `scripts/apply-retheme-map.mjs` — the 44a codemod; `--list` to see every
   pair, `--applies=44c` to filter to this phase's 13 pairs.

## Scope — the 13 mapped pairs

Card type (`CardType` literal + every site that switches on it):

- `enchantment` → `oath` (R-9)
- `disenchant` → `hex` (R-10)

Card class (`HAUNT`, id prefix):

- `THOUGHTFORM` (class/tag) → `HAUNT` (R-13)
- id prefix `tf-` → `ht-` (both existing thoughtform cards)

Rank ladder (`CARD_RANK_NAMES` display map only — `CardRank` stays numeric
1-6, no migration):

- Doxa → Ash (1) · Lemma → Tooth (2) · Thesis → Splinter (3) · Theorem →
  Rib (4) · Axiom → Skull (5) · Aporia → Saint (6, rank-word only — "the
  Aporia" place/labyrinth name is untouched, NL-9)

Signature-skill display names (`SignatureSkillId` values unchanged):

- `sig-read-opponent`: Read the Opponent → **Read the Entrails**
- `sig-overwhelming-argument`: Overwhelming Argument → **The Stilling**
- `sig-conviction-strike`: Conviction Strike → **The Oath Kept**
- `sig-disarming-plea`: Disarming Plea → **The Open Hand**
- `sig-rallying-blow`: Conclusion → **The Butcher's Bill**
- `sig-clever-gambit`: Clever Gambit → **Cold Counsel**
- `sig-press-the-point` / `sig-second-wind`: unchanged (already on-canon)

## Decisions made upfront — DO NOT ASK

- **`cardType` is static content, never persisted.** `Character.knownCards`
  / `combatRewardCards` store card IDs; `cardType` lives on the library
  record looked up at runtime. Renaming the literal `'enchantment'` /
  `'disenchant'` → `'oath'` / `'hex'` needs **no `GAME_STATE_VERSION`
  bump**, same reasoning as 44b's persisted-state carve-out, provided every
  read site moves in the same commit (`combat.encounter.types.ts`'s
  `CardType` union + the `attachments` field type, `combat.engine.ts`,
  `combat.cards.ts`, `cards.library.ts`'s ~10 card records + their `tags`
  arrays, `scripts/export-catalog.ts`).
- **`classifyVerbClass`'s `CombatVerbClass` values `'enchant'` /
  `'disenchant'` (`combat.cards.ts`) move too**, to `'oath'` / `'hex'`. They
  exist only as a 1:1 shadow of `cardType` in that function's first two
  branches — not an independent taxonomy that happens to share a word — so
  leaving them stale would show `ENCHANT`/`DISENCHANT` in the card-editor
  for a card now typed `oath`/`hex`. Every file importing `CombatVerbClass`
  (`combat.autoplay.ts`, `combat.deck-draft.ts`, `combat.encounter.sim.ts`,
  `combat.encounter.types.ts`, `combat.reward-draft.sim.ts`,
  `combat.sim-policies.ts`) needs its literal-union references checked, not
  just grepped-and-replaced blind.
- **`axiomancer-card-editor/src/theme/wx.ts`'s `enchant` / `disenchant`
  keys** in the card-type-meta map move to `oath` / `hex`, labels `'OATH'`
  / `'HEX'`. `CardForm.tsx`'s two hint strings (`"Doxa 1 … Aporia 6"` and
  `"spell · persistent enchantment · enemy curse"`) get hand-fixed to the
  new rank/type words — the codemod's word-boundary regex will not catch
  these because they're prose, not the bare token.
- **`scripts/build-catalog.mjs`'s display strings** (`"ENCHANT"`,
  `"DISENCHANT"`... via the `kindLabel = kind === "disenchant" ? "CURSE" :
  ...` branch, and the `SHAPE_DIAMONDS` key table) move to `OATH` / `HEX`.
  `axiomancer-mechanics/scripts/export-catalog.ts`'s `freeKw` literals
  (`'CURSE'` / `'ENCHANT'`) move to `'HEX'` / `'OATH'`. Regenerate via
  `npm run catalog` after — never hand-edit `devlog/data/*.json` /
  `devlog/catalog.html`.
- **Engine constant identifiers that spell the old words but are pure
  internal budget/config names stay put** — `FREE_ENCHANT_ROUNDS`
  (`game-mechanics.constants.ts`) is not renamed, mirroring 44b's
  `CONCEDE_PREMISES_ELITE` precedent (internal identifier, never rendered).
  Its *usages* that produce display text (the `freeKw` literals above) are
  still in scope; the constant's own name is not.
- **THOUGHTFORM → HAUNT is a full identifier rename, not display-text
  only** — unlike 44b's excluded `specialMechanics` `kind` literals (which
  the retheme map is silent on), R-13 explicitly names "card class" as the
  renamed concept, and every carrier is session-only (a conjured Thoughtform
  is "removed after play / combat end" — never enters `Character` state),
  so there's no persistence migration to avoid. Rename:
  - `axiomancer-mechanics/src/Cards/cards.thoughtforms.ts` →
    `cards.haunts.ts`; `thoughtformLibrary` → `hauntLibrary`;
    `getThoughtformById` → `getHauntById`; the `'thoughtform'` tag string
    → `'haunt'` on both card records.
  - `axiomancer-mechanics/src/Cards/e2e/thoughtforms.engine.test.ts` →
    `haunts.engine.test.ts`; update its assertions to the renamed
    exports/tag/ids.
  - `axiomancer-mechanics/src/Cards/card.engine.ts` line ~184: rename the
    local `thoughtform` binding and update the tag check to `'haunt'`.
  - `axiomancer-mechanics/src/Cards/index.ts`, `src/index.ts`: update the
    re-exports and their comments.
  - `combat.encounter.types.ts`, `combat.engine.ts`,
    `axiomancer-mobile/state/presenters/combat-encounter.engine.ts`,
    `axiomancer-mobile/assets/images/cards/index.ts`: comment-only mentions
    of "Thoughtform" — reword to "Haunt" for consistency; no code changes
    needed there beyond the comment text.
- **The two thoughtform card ids get the `tf-`→`ht-` prefix swap**
  (`tf-cinder` → `ht-cinder`, `tf-minor-premise` → `ht-minor-premise`... but
  see next bullet for the second one's further rename) across
  `cards.thoughtforms.ts`/`cards.haunts.ts` and its own e2e test — this is
  the ONLY place these ids appear (verified: no card elsewhere references
  them by id; the "conjured by Foundry Sprite / Corollary" sandbox source
  cards named in the file's comments don't exist as code — pure design
  provenance notes, leave the comment text as-is).
- **`tf-minor-premise` / "Minor Premise" also gets the further rename the
  retheme-map note flags as 44c's call**: id → `ht-minor-charge`, display
  name → **"Minor Charge"**. "Premise" is the exact word 44b retired to
  CHARGE (R-1) — a live card named "Minor Premise" is precisely the kind of
  survivor this phase exists to close out. "Minor Charge" keeps the
  courtroom-tally register R-1 established. The card's `specialMechanics:
  [{ kind: 'premise', count: 1 }]` and `free: { premises: 1 }` fields are
  NOT renamed (internal engine identifiers, 44b's own precedent for these
  exact lowercase literals).
- **No `GAME_STATE_VERSION` bump this phase.** Nothing renamed here is
  persisted: `cardType` and rank are static content fields, signature-skill
  ids are unchanged (only `name` display strings move), and thoughtform
  card ids never leave the combat session.
- **Sandbox/retired-verb fixture cards
  (`src/test-utils/retired-verb-cards.ts`)**: its comments use the old
  rank words (Lemma/Thesis/Theorem/Axiom) as design-provenance annotations
  on cards that are themselves dev-only fixtures (never in the shipped
  library, no `id` field pattern the naming lint scans). Reword the rank
  words in comments to the new names for consistency (mechanical
  find/replace of the six words is safe here — plain comments, no
  collision risk) but this is cosmetic, not gating; skip only if it turns
  out these fixtures are slated for deletion in a near-future phase (check
  first — if so, leave and note under Follow-ups instead of editing dead
  code).
- **`docs/lexicon.json` rows this phase adds:** `ENCHANTMENT`,
  `DISENCHANT`, `THOUGHTFORM`, and the six rank words (`Doxa`, `Lemma`,
  `Thesis`, `Theorem`, `Axiom` — NOT `Aporia`, which survives as the place
  name per NL-9 and is already lexicon-exempt for that reason; scope the
  `Axiom`/`Aporia` patterns narrowly, e.g. anchored to "rank" or the
  `CARD_RANK_NAMES` context, so they don't false-positive on unrelated
  prose using "axiom" generically or on "the Aporia" labyrinth references).
  Signature-skill old names are prose, not registry words — no lexicon rows
  for those (mirrors 44b not adding rows for plain-English renames like
  CONCEDE→CONDEMN's synonyms).

## Codemod invocation (starting point, not the whole job)

```bash
node scripts/apply-retheme-map.mjs --applies=44c --write \
  axiomancer-mechanics/src/Cards/types.ts \
  axiomancer-mechanics/src/Combat/combat.signature.ts
```

Rank names (`CARD_RANK_NAMES`) and the signature-skill `name:` fields are
the only pairs safe for a blind word-boundary codemod pass — everything
else in this phase (card-type literal, verbClass, HAUNT identifiers, id
prefixes) needs hand edits per the Decisions above; `--list` to confirm
which of the 13 pairs are `kind: displayNames` (codemod-safe) vs `kind: ids`
(hand-verify each site, ids can appear inside longer strings the `\b`
boundary won't isolate correctly, e.g. `tf-minor-premise` vs the further
`ht-minor-charge` rename).

## Prove (DoD)

- `git grep -n "'enchantment'\|'disenchant'"` (excluding
  `FREE_ENCHANT_ROUNDS` and any comment prose already reworded) returns
  zero hits across `axiomancer-mechanics/src`, `axiomancer-mechanics/scripts`,
  `axiomancer-card-editor/src`.
- `git grep -n "\bDoxa\b\|\bLemma\b\|\bThesis\b\|\bTheorem\b\|\bAxiom\b"`
  returns zero hits in `Cards/types.ts` and card-editor; residual hits in
  `retired-verb-cards.ts` comments only if that file was confirmed live
  (see Decisions).
- `git grep -n "\bTHOUGHTFORM\b\|thoughtformLibrary\|getThoughtformById"`
  returns zero hits repo-wide; `git grep "'thoughtform'"` likewise.
- `git grep -n "tf-cinder\|tf-minor-premise"` returns zero hits.
- `git grep -n "Read the Opponent\|Overwhelming Argument\|Conviction Strike\|Disarming Plea\|'Conclusion'\|Clever Gambit"` returns zero hits (id
  strings `sig-*` are unaffected and will still match — scope the grep to
  the `name:` field / prose, not the ids).
- `npm run catalog` regenerates cleanly after `build-catalog.mjs` /
  `export-catalog.ts` edits.
- `axiomancer-mechanics/docs/lexicon.json` has the new rows;
  `node scripts/check-lexicon.mjs` is green.
- `npm run verify` green at the root (mechanics + mobile + card-editor).
- No `GAME_STATE_VERSION` bump; no `game.migrate.ts` change.
- Flip Phase 44c's `[ ]` → `[x]` in `plan/steps/01_build_plan.md`, append
  the commit hash.

## Follow-ups (out of scope this phase)

- Phase 44d — themes + presets retheme (6 archetypes, already ratified as
  shipped per §5.1.5 — that phase's real work is `THEME_KEYWORDS` only).
- Phase 44e — enemy retheme.
- Phase 44f — world/map naming.
- Phase 44g — characters/story/quests (hand-authored prose).
- Phase 44h — MORALE → GRACE, alignment cube → THE OATHS (§6).
- Phase 44i — product shell + docs (last, documents what 44a-44h did).
