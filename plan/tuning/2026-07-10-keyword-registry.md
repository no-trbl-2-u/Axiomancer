# Gate 3 — the keyword language (2026-07-10)

> Evidence: `2026-07-10-audit-evidence/cross-keywords.md` (all facts below
> survived the skeptic pass; its ~7 fact errors are corrected here).
> Doctrine anchor: spec 32 §3 says "exactly 30 keywords" — this doc's
> position is **chase honesty and support, not the number 30**.

## The finding

The "30-keyword" registry is really a **~45-term player-facing language**:

- 32 registered keywords (the mobile KEYWORD_GLOSS silently outgrew spec
  32 §3);
- 2 type labels + ~7 unregistered system nouns (Conviction, Resonance,
  Reserve, floats, stances, rungs, Thoughtform);
- 6 keyword-less DoT species smuggled in as raw effect ids
  (debuff_argument_wound, debuff_kindling_ember, debuff_foretold_wound,
  debuff_nettle_sting, debuff_echo_sting, debuff_backfire_acute) — these
  render as blank "◆ DIE" faces with no definition panel;
- 20 enchant/curse cards (29% of the library) whose persistentEffect is
  free prose that speaks no keyword at all.

Support is inverted: median ~2.5 cards per keyword (Dawncaster's curated
registry runs ~12); 15 of 32 keywords live on ≤2 cards; CONJURE has ZERO
library cards; POISON — the flagship hallmark and the payload of the
signature that dealt 90-95% of measured damage — lives on exactly two.
Per-preset reading load (~12 terms) is fine; the LIBRARY-level vocabulary
is bigger than the library earns.

## Work items (KW-numbers from the evidence file)

1. **KW-1 — fold the six unmapped debuff ids into registry keywords**
   [PLAUSIBLE · M]: five are near-clones of POISON/BLEED/BACKFIRE and
   fold cleanly; caveat from the skeptic: `debuff_backfire_acute` is NOT
   a redundant BACKFIRE clone (different hook) and
   `debuff_foretold_wound` is a DoT+Mark hybrid that fits no keyword —
   those two need either a small semantics extension or a redesign, not
   a relabel. Kills the blank "◆ DIE" faces. Do first with KW-3.
2. **KW-3 — rename pass** [PLAUSIBLE · S]: PROLONG (the FESTER gloss
   collides), REARGUE/RECALL disambiguation, promote SIPHON (recurring
   bespoke verb, also the handoff's candidate list: consume_affliction /
   siphon / replay_last), make replay_last's face honest.
3. **KW-2 + KW-6 — the registry re-baseline** [PLAUSIBLE+CONFIRMED · M]:
   merge/retire the ghosts (BARRIER↔GUARD merge candidate, CONJURE has
   zero cards — retire or author its cards, PERORATION/RUPTURE-N
   cleanups) landing at ~27 EARNED keywords; then **single-source the
   registry** — spec 32 §3, card-themes.ts, KEYWORD_GLOSS, and the
   keyword atlas all drift today (spec still prints the stale
   SWAY-vs-current-HP rule) — one module of record + parity lints, like
   the no-strike lint.
4. **KW-4 — kill TICK entirely** [OWNER-RATIFIED 2026-07-10 · L, rides
   Gate 1]: the owner chose the strong form — TICK leaves the registry
   outright, not just the FREE lines. The 10 `free: tickOne` lines die
   with the FREE-currency rework; any PAID tick effects re-author as
   theme verbs (a "cash the DoT now" timing tool, if a theme wants one,
   gets a theme-scoped name and pricing). No new TICK lines anywhere;
   the two theme proposals that minted them are amended accordingly.
   Registry count drops below 30 — sanctioned, per this doc's "honesty
   over the number" position (spec 32 §3 amendment block records it).
5. **KW-5 — keyword-reach lint for the 20 persistent cards** [CONFIRMED
   · M]: every enchant/curse persistentEffect must project at least one
   registry keyword on its face (the pricing-lint precedent shows how).
   Fixes the handoff's "8 persistentEffect strings under-state the
   engine hook" item structurally instead of one string at a time.
6. **KW-7 — systems glossary in the detail overlay** [CONFIRMED · S]:
   the ~7 system nouns get definitions where the keyword definitions
   already live. (The tutorial defines ◆ tokens; the overlay is where
   mid-fight questions get answered.)
7. **KW-8 — fill or delete the atlas prior-art column** [CONFIRMED · S]:
   1 of 30 rows has its receipt; cross-prior-art.md §receipts backfills
   most of the rest (PA-7).

## Order

KW-1 + KW-3 first (small, purely corrective). KW-2 + KW-6 together as
the re-baseline. KW-4 is ratified and rides the EA-5 FREE rework. KW-5 and KW-7
close the two places the language doesn't reach. The win condition:
**every printed word true, every effect nameable, no ghost vocabulary.**
