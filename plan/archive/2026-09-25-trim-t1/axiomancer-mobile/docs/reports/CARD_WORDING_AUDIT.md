> **Status:** HISTORICAL — archived 2026-09-25 by TRIM THE FAT T1 (`plan/2026-09-25-trim-the-fat.spec.md` Tier 1 docs). Original path: `axiomancer-mobile/docs/reports/CARD_WORDING_AUDIT.md`. Describes removed or never-built code; not a source of rules.

# Card Wording & Card-Detail-Overlay Clarity Audit

> Date: 2026-07-12
> Commit: cf6c37c
> Build: expo-web export (`.smoke-dist`), driven headless
> Scope: all 10 starter preset decks · 70 card-overlay captures (60 unique cards)
> Status: **IMPLEMENTED 2026-07-12** — fix groups A–E shipped (with three
> grounding corrections: the OMEN gloss stays as-is because the engine fires
> the omen mechanic's own rider, not the paid line; the read legend names the
> die's STANCE, not its roll; curses live in `enemyAttachments`, not
> `enemyEnchantments`). Deferred ledger extras: the Soul board counter, the
> ◆→⊕ +DIE marker swap, the Bleed face re-format, the VITAE help note, and
> the engine-owned 'RUPTURE 0 now' rider text.

This audit answers five owner questions about the combat **card detail overlay**
(the `combat-card-detail` inspect modal):

1. Is the keyword **definition** too wordy?
2. Between the keyword definition and the card's own wording, is there **enough
   to know what a card does**?
3. Is the card detail overlay **too busy**?
4. Does **every effect / enchantment / curse have a glyph** that lets the player
   determine the effect?
5. Log **every case where a player couldn't tell what a card does or what an
   effect did.**

## How this was produced (methodology)

The playtest was run against the **rendered game surface only** — no tester saw
engine source until the final grounding pass.

1. **Automated playthrough + capture.** A headless Chromium harness loaded the
   dev `/combat-encounter` route once per preset deck (each deck injected via a
   `?deck=<id>` static-server shim that sets `__AXM_COMBAT_DECK__` before boot),
   entered combat, and tapped every card to open its detail overlay — the same
   tap a player makes. It recorded the **exact rendered overlay text plus a
   screenshot** for every card. Coverage: **7/7 unique cards on all 10 decks,
   70 captures, zero page errors.**
2. **Ten fresh-eyes judges.** One first-time-player agent per preset deck read
   *only* its deck's captured overlays (text + screenshots) and was **forbidden
   from opening any source file** — if a card wasn't legible from the overlay
   alone, that was the finding. Each judged per-card understandability, undefined
   printed terms/glyphs, keyword-definition wordiness, and overlay busyness.
3. **Glyph-coverage data sweep.** A separate pass audited every live engine
   effect id in `effects.library.ts` against the curated glyph map in
   `statusGlyphs.ts`, plus the enchantment/curse passive path in `combat.engine.ts`.
4. **Grounded synthesis.** A final pass **verified each recurring confusion
   against the real mechanic** (reading the presenter, keyword registry, and
   card library) before turning it into a fix proposal — so shorter never means
   wrong, and a "spurious panel" complaint that was actually correct behaviour
   got corrected rather than actioned.

A key result of the grounding pass: the judges' most common structural
complaint — "the overlay stacks keyword panels for effects the card never
prints" — is **inverted**. Those panels are *truthful*; the effects genuinely
fire. The defect is that the **`+DIE` pill and card face collapse a multi-effect
paid line to one headline keyword**, so the real extra effects (SIPHON, RECALL,
POISON…) only surface in the panels and look orphaned. The fix is to surface the
whole paid line, **not** to delete the panels.

> KB note: the external Dawncaster reception corpus was unreachable this session
> (`kb-sync` proxy-auth failure). The few prior-art reception claims below are
> remembered, labelled as such, and are not load-bearing for any fix.

---

## Executive summary

1. **Wordiness — a few offenders, not systemic.** `Poison`, `Premise`,
   `Rupture`, `Stagger`, `Forge`, `Sway`, and `Riposte` glosses over-pack an
   edge case or a target-type table that buries the core rule. `Stagger` is
   worse than wordy — its "2 rungs / 3 on a boss" clause **contradicts** cards
   that print `STAGGER 1` (Zeno). `Bleed`, `Mark`, `Draw`, `Recall`, `Rapport`,
   `Backfire`, `Kindle`, `Pip` are already terse and correct — keep them.
2. **Enough to know what a card does? — collectively yes, but mis-allocated.**
   The keyword panels are accurate; the gap is the `+DIE` pill hiding the rest of
   the paid line, so the player can't attach a number to SIPHON/RECALL and the
   panels read as noise.
3. **Too busy? — yes, and the biggest cause is duplication.** The large card
   face already renders a `◇ FREE keyword·value | ◆ PAID keyword·value` rail,
   then the overlay restates the identical split in a `NO-DIE / +DIE` pill table
   right beneath it. Cut the NO-DIE pill (pure duplicate) and reduce the +DIE
   pill to its one unique contribution (the read-scaling triplet).
4. **Glyph coverage? — no.** Three *core, live* keyword afflictions —
   `debuff_mark`, `debuff_backfire`, `debuff_rapport` — have no curated glyph and
   render generic `◎ / ⛓ / ▼`, while `EFFECT_GLYPHS` spends ~40 curated rows on
   dead ids. Two DoTs collide on `🔥`. And **no enchantment or curse standing
   passive puts any glyph on the board**, so a player cannot see one is attached.
   All fixable in presentation only (ADR-0001/0003) — no engine change.
5. **"Didn't know what it does" clusters** (ranked by decks hit): the `▲ / — / ▼`
   read triplet (8), `intensity` (8), `i1 / d1` shorthand (8), `FREE` (7),
   enchant/curse free-vs-paid duration (6), `MARK` printed but no panel (5),
   `rung / stance / telegraph` (5), OMEN's "printed payoff" (3), `MILL` (3 — and
   not a registered keyword at all). Full ledger below.

## Ground-truth corrections to the raw judge reports

- **Panels are not spurious.** `Resonance Detonation` PAID = `RUPTURE ALL +
  SIPHON 35% + RECALL 2`; `Opening Statement` PAID = `mark i1 d2 + poison i1 d2
  + +2 Premises`; `Pact of Akrasia` PAID = `bleed i1 d2 (self) + FORGE +
  RECOIL 6`. SIPHON, RECALL, POISON, BLEED all genuinely fire. The bug is the
  **pill hides them** (`combat-encounter.engine.ts:1443`, `diePill` = one
  keyword + one value), not that the panel invented them.
- **`MARK` missing from panels is a real selection bug.** `buildDetailKeywords`
  sweeps `keywordsInPersistentText(printed)`, whose regex is `/[A-Z]{2,}/g`
  (`keywords.ts:260`), and `printed` is only `topActionText + bottomActionText +
  dieLines` (`combat-encounter.engine.ts:1278`). A free-line `mark i1 d1` is
  lowercase and applied by a FREE **rider**, not a `combatEffect`, so neither
  path matches it → no MARK panel even though the face prints MARK.
- **`Stagger` gloss is internally contradictory.** Zeno's PAID is `STAGGER 1`;
  the gloss asserts "2 rungs on a normal action, 3 on a boss." The 2/3 figure is
  how many rungs an action *has* (the `RUNGS` system term), not how many Stagger
  *removes* — the conflation makes the card's own `−1 / STAGGER 1` look wrong.
- **`Venom and Vein` free/paid are identical except duration** (`FREE (3 rounds)`
  vs `PAID (rest of combat)`, same amplifier text). The "+DIE POISON rest of
  combat" reading is the pill mis-picking `Poison` as the headline.
- **`MILL` is genuinely undefined** — printed on Circular Reasoning / Second
  Thoughts / Ouroboros as lowercase `mill 1 to discard`, absent from
  `keywords.ts` entirely (no gloss, no glyph, no mechanic mapping).

---

## Fix proposals

### A. Keyword-gloss trims — `axiomancer-mobile/state/combat/keywords.ts` (`KEYWORD_GLOSS`)

| Keyword | Current | Proposed | Rationale |
|---|---|---|---|
| Stagger | "Removes that many rungs from the enemy's next telegraphed action — 2 rungs on a normal action, 3 on a boss. Removing every rung denies the action outright." | "Removes that many rungs (the steps of the enemy's telegraph) from its next action. Strip them all and the action is denied." | Removes the 2/3 clause that **contradicts** `STAGGER 1` cards; defines "rung" inline so the term lands even when the card never prints the word. |
| Poison | "Deals 2 VITAE per stack each time a card is played, growing by 1 every 2 rounds it holds. Applying poison again resets the growth." | "Each time a card is played, the enemy loses 2 VITAE per Poison stack — and the longer it holds, the harder it bites." | Keeps the load-bearing 2/stack/play; folds growth into a clause; drops the reset edge case. Stays correct by not asserting a false rule. |
| Rupture | "Consumes afflictions on the enemy and detonates their remaining harm as one burst. The burst is capped at 60% of the enemy's max VITAE." | "Consumes the enemy's afflictions and deals their remaining damage all at once — up to 60% of its max VITAE." | One sentence; cap folded in. |
| Premise | "A persistent tally your cards build toward the conclusion printed on its carrier. At the printed count the conclusion fires free and the tally resets." | "A running tally. When it reaches the count printed on the card that spends it, that payoff fires free and the tally resets." | Kills the "carrier" jargon a first-timer hasn't met; "the card that spends it" is concrete. |
| Sway | "Builds on the enemy and decays 1 at the end of each round. The enemy capitulates when Sway reaches its resolve — roughly 35% of its max VITAE." | "Builds on the enemy and decays 1 each round; at their resolve (~35% of max VITAE) they capitulate." | One sentence, keeps the number, drops the "reaches its resolve — roughly" doubling. |
| Riposte | "Armed for one threat phase: the first incoming attack is reduced by the printed parry amount. If your Guard fully blocks an attack, the enemy takes the printed counter damage." | "Armed for one threat phase: reduces the first incoming attack by its parry (CUT) value. If your Guard fully blocks it, the enemy takes its counter (CTR) damage." | Binds the abstract "parry/counter" to the **CUT/CTR** the card actually prints — the current gloss never connects to the face's abbreviations. |
| Forge | "Forges a FLOATING die — or turns a dead X die WILD — that plays alongside your drafted die and is gone forever when spent. At the cap of 3, it grants +1 Conviction instead." | "Forges a FLOATING die (or revives a dead X die as WILD) that plays beside your drafted die and is spent for good; at 3 dice it grants +1 Conviction instead." | Same facts, ~25% shorter, single sentence. |

Leave `Bleed`, `Mark`, `Draw`, `Recall`, `Rapport`, `Backfire`, `Kindle`, `Pip`
unchanged — already terse and correct.

### B. Overlay busyness trims — `components/combat/encounter/CombatEncounterPanel.tsx` (card-detail block ~L744–795)

| Zone | Change | Rationale |
|---|---|---|
| NO-DIE pill (L766–769) | **Delete.** | Pure duplicate of the card face's `◇ FREE keyword·value` rail (`CombatBoard.tsx:1401–1417`). Every judge independently flagged the pill table as restating the face. |
| +DIE pill (L770–774) | **Collapse to the read triplet only** when the card is read-dependent (guard/dot/vulnerable); hide otherwise. Populate it from the **full authored PAID line** (all effects), not `diePillKeyword` alone. | Removes the second face-duplication *and* fixes the orphaned-panel problem (SIPHON/RECALL/POISON now appear where the panels promise them). The triplet is the pill's only non-duplicate content. |
| Keyword panels (L727–742) | **Keep.** Once the +DIE pill enumerates the full paid line, the panels are grounded — no panel cut needed. | Panels are truthful; they were made to look like noise by the pill's omission. |
| `numberOfLines={2}` restatements | With the NO-DIE pill gone, the "MARK +1/tick 3t" (face) vs "MARK +1/tick · 3 turns" (pill) double disappears automatically. | Fixes the oratory/tithe "restated verbatim" complaint at the source. |

### C. Missing-gloss / undefined-printed-term additions

| Term | File / surface | Proposed addition | Rationale |
|---|---|---|---|
| MILL | `keywords.ts` — add `KEYWORD_GLOSS.Mill` **and** a mechanic/text mapping so it resolves | `Mill: 'Sends that many cards from your deck to your discard pile.'` | Printed on 3 echo cards, in zero registries — the only fully unglossed mechanic word. 3 carriers qualifies it as a registry keyword under the doctrine. |
| `▲ / — / ▼` | `CombatEncounterPanel.tsx` — one global legend line beside `colorMatchHint` (L777) | "▲ strong read · — even · ▼ weak read — your die's roll picks the column." | The single most-cited undefined notation (8 decks). It's the `READ_DAMAGE_MULT` advantage/neutral/disadvantage triplet; one legend covers every card. |
| `i1 / d1` | Render the free/paid line de-abbreviated | Render `mark i1 d1` as `mark ×1 · 1 turn` (intensity→"×", duration→"turns") | 8 decks could not decode it — clearer than teaching the shorthand. |
| `intensity` | `SYSTEM_GLOSSARY` + trigger on `/intensit\|\bi\d/` | `{term:'INTENSITY', def:'The size of a stack — +1 intensity makes each stack hit one harder.'}` | Load-bearing in Pip, Reargue, "Stacks by intensity", and every i1 line; defined nowhere. |
| `FREE` | `SYSTEM_GLOSSARY` | `{term:'FREE', def:'The no-die line — it plays without spending a die.'}` | 7 decks flagged it; currently only the `◇ NO DIE` tag hints at it while cards print the bare word `FREE`. |
| Enchant/curse duration | Re-enable the `Enchantment`/`Disenchant` type-label gloss (authored at `keywords.ts:224–225`, suppressed since 2026-07-12) as a **one-line footer**, not a stacked panel | Show "3 rounds free · permanent with a die" under the pills for persistent cards | The "3 rounds vs rest of combat" confusion (6 decks) is exactly what that suppressed gloss answers. |

### D. Panel-selection bug (MARK missing) — `combat-encounter.engine.ts` `buildDetailKeywords` (~L1236–1280)

- **Current:** free-line effects are never swept — `printed` excludes the FREE
  rider text, and `keywordsInPersistentText` only matches `[A-Z]{2,}` (misses
  lowercase `mark`).
- **Proposed:** route the FREE-line rider effect ids through
  `push(keywordForEffect(r.effectId), false)` (the presenter already resolves
  free riders), and include the free-line text in the `printed` string.
- **Rationale:** MARK/POISON printed on a no-die line then always gets its panel;
  fixes the "MARK has no panel" complaint across erosion/penitent/standstill/
  augury/foundry (5 decks) without touching any engine export.

### E. Glyph additions — `components/combat/statusGlyphs.ts` (`EFFECT_GLYPHS`, pure presentation)

| Effect id | Current | Add | Rationale |
|---|---|---|---|
| `debuff_mark` | generic `◎` (also = dead `tier1_mind_mark`) | `◉` | The Mark keyword's own affliction has no curated glyph; collides with a dead id. |
| `debuff_backfire` | generic `⛓` | `⟲` | Backfire (recoil-on-telegraph) reads as its own thing, not generic control. |
| `debuff_rapport` | generic `▼` | `☙` | Rapport is a charm debuff, not a generic stat-down arrow. |
| `debuff_kindling_ember` | shares `🔥` | keep `🔥` (curate it) | Distinguish from nettle. |
| `debuff_nettle_sting` | shares `🔥` | `🌿` | Two DoTs currently indistinguishable. |
| `buff_phoenix_vigor` | shares `✚` with regeneration | `✜` (optional, low priority) | Both mean heal, so the collision is semantically tolerable. |

**Highest-value glyph gap (separate; presentation only, no engine change):** no
enchantment/curse **standing passive** puts any glyph on the board — a player
cannot see one is attached. Add a board indicator derived from
`state.persistentZone` / `state.enemyEnchantments` (readable presentation-side):
a standing `❖` on your side for an active enchantment, `☒` on the enemy for an
active curse, labelled from `Card.persistentEffect`. **This is the single most
consequential legibility gap in the sweep.**

Do **not** curate the 8-way `▲` statup collision first — those ids are
consumable/engine buffs mapped to Cleanse/Guard/Mark/Foretell, not card
keywords; they matter less than the three core afflictions above.

---

## Confusion ledger (owner question #5)

| Term / card | Decks affected | What's unclear | Fix |
|---|---|---|---|
| `▲ / — / ▼` read triplet | 8 | Which number you get and what chooses it | C: global read legend |
| `intensity` | ~8 | The core noun stacks are measured in | C: INTENSITY glossary entry |
| `i1 / d1 (i1 d2)` | ~8 | Undecoded intensity/duration shorthand | C: de-abbreviate at render |
| `FREE` | ~7 | Cost? label? | C: FREE glossary entry |
| Enchant/curse `3 rounds` vs `rest of combat` | 6 | Alternatives or both fire; what the die changes | C: re-enable type-label duration footer |
| Panels for effects not on face (SIPHON/RECALL/POISON/BLEED) | 6 | Panels look orphaned — pill hides the effect | B: enumerate full PAID line on +DIE pill |
| `MARK` printed, no panel | 5 | What marking does; free-line MARK unglossed | D: sweep free-rider effect ids |
| `rung / stance / telegraph` | 5 | The object Stagger/Backfire/Foretell act on | A (Stagger inline "rung"); ensure RUNGS/stance triggers |
| OMEN "printed payoff" | 3 | What fires on a match | Reword Omen gloss to "fires the card's paid line free" (confirm against engine first) |
| `MILL` | 3 | Undefined, unregistered | C: register + gloss Mill |
| `Soul` counter | 2 | A running resource never shown as a tracked value | Add a Soul tally indicator (glossed, but no board counter) |
| `◆` overloaded (CONVICTION vs +DIE) | 2 | Same glyph = resource and die-mode | Use a distinct +DIE marker (e.g. `⊕`) so `◆` stays Conviction-only |
| Number contradictions (Bleed `6/hit` vs gloss `3/stack`; Zeno `−1` vs Stagger `2/3`) | 2 | Face number disagrees with gloss | A (Stagger); Bleed: `6/hit` is 2 stacks × 3 — print `2 stacks (3 each)` not a pre-multiplied `6/hit` |
| `RUPTURE 0 now, if detonated` | 3 | Reads like it deals 0 | Reword pill to "detonates the enemy's afflictions now" |
| `VITAE` | 3 | Assumed = HP, never stated | One-time note on a help surface (low priority) |

## What works — keep, do not regress

- **Tight glosses already in register:** `Bleed`, `Mark`, `Draw`, `Recall`,
  `Rapport`, `Backfire`, `Fallen`, `Recoil`, `Soul`. One clean clause each.
- **The per-card system-glossary slice** (`systemTermsForCard`) and its dedup
  (`SYSTEM_TERM_COVERED_BY`) is the right pattern — extend it to the new
  INTENSITY/FREE entries rather than reverting to a wholesale dump.
- **The colour-law legend rendered once per modal** (not per card) is correct;
  the new `▲/—/▼` legend should follow the same "one global line" model.
- **Keyword panels are accurate to engine truth** — do not "fix" them by hiding
  real effects. Fix the pill that omits them.
- **`Enchantment`/`Disenchant` were correctly removed** from the stacked keyword
  zone (types, not payloads); just reintroduce the *duration* fact as a one-line
  footer, not a panel.

## Implementation notes

- **No files were changed by this audit.** Every item above is a proposal for
  owner approval. Because nothing shipped, no verify gate was run.
- **Surface impact when these are implemented:** items A, C, E are pure
  `axiomancer-mobile` presentation (`keywords.ts`, `statusGlyphs.ts`). Items B
  and D touch `CombatCardFaceVM` / `CombatCardDetailVM` shape in
  `combat-encounter.engine.ts` (mobile-side presenter) — run
  `npm run verify -w axiomancer-mobile` before merge; the card-editor coupling
  in `AGENTS.md` applies only to `axiomancer-mechanics/src`, which none of these
  touch.
- **Confirm before shipping the OMEN reword:** the proposed "fires the card's
  paid line free" assumes omen re-runs the card's own paid line on a stance
  match — verify against the engine's omen resolution.

## Appendix — glyph-coverage data sweep

Audit basis: **24 live effect ids** in `effects.library.ts` (10 debuffs + 14
buffs). Only **9** resolve to a curated per-effect symbol in `EFFECT_GLYPHS`
*and* exist live: `debuff_poison ☠`, `debuff_bleed 🩸`, `debuff_curse 🧿`,
`debuff_creeping_doom 🕸`, `debuff_petrify 🗿`, `buff_thorns ✸`,
`buff_critical_rate_up ✷`, `buff_regeneration ✚`, `buff_all_stats_up ⬆`. The
other 15 fall through `classifyGlyphKind()` to a shared `KIND_GLYPHS` category
icon.

**Most severe collisions**

- The 8-strong `statup` cluster — `buff_accuracy_up`, `buff_critical_damage_up`,
  `buff_damage_reduction`, `buff_invincibility`, `buff_cleanse`,
  `buff_status_chance_up`, `buff_open_minded`, `buff_grace_momentum` — **all
  render `▲`** and are mutually indistinguishable. (Lower priority: these are
  consumable/engine buffs, not card keywords.)
- `buff_phoenix_vigor ✚` is identical to `buff_regeneration`'s "curated" `✚`
  because `KIND_GLYPHS.regen` is also `✚` — the curated entry buys no distinction.
- `debuff_kindling_ember` and `debuff_nettle_sting` both render `🔥`.

**The irony to flag:** `EFFECT_GLYPHS` is over-provisioned for a legacy effect
set — ~40 curated ids (`debuff_stun`, `debuff_sleep`, `debuff_burn`,
`debuff_frostbite`, `debuff_shock`, `debuff_vulnerability_*`, `buff_barrier`,
`buff_taunt`, `tier1_mind_mark`, …) point at effects that **don't exist** in the
current library — while three **core live** afflictions that ARE the keyword
system lack any curated glyph: `debuff_mark` (Mark) → generic `◎`,
`debuff_backfire` (Backfire) → generic `⛓`, `debuff_rapport` (Rapport) → generic
`▼`. Fixing coverage is three `EFFECT_GLYPHS` rows plus the ember/nettle split —
no engine change (ADR-0001/0003).

**Enchantment / curse path.** No board status-glyph path exists for the standing
passive of any enchantment (buff-on-you) or disenchant/curse (debuff-on-enemy).
Each persistent card's passive is implemented at its trigger site and gated only
by **card id** via `zoneHas()` / `isPersistentCardActive` (`state.persistentZone`,
`state.enemyEnchantments`, `state.enemyAttachments`, plus the FREE-line timed
zones). **No effect id is ever applied for the passive itself**, so
`statusGlyphs.ts` never sees it. `cards.library.ts` carries 20 such persistent
cards (10 enchantment + 10 disenchant, one pair per theme); none puts a standing
glyph on the board. Only a passive's downstream *actions* that apply a real
effect id surface a glyph — so a player cannot see at a glance which
enchantment/curse is attached, or that one is attached at all.

**Standing/trackable states with no board glyph** (engine counters, not effects,
so `statusGlyphs.ts` has no hook): `Sway` (meter toward CAPITULATE), `Premise`
(tally toward Peroration/CONCEDE), `Soul` (running counter), `Fallen` (the
2+-affliction state gating FALLEN lines), `Stagger` (telegraph-rung removal),
`Riposte` (armed-for-one-phase), `Recoil` (self-cost). Instantaneous actions
(`Draw`, `Forge`, `Guard`, `Tick`, `Cleanse`, `Heal`, `Recall`, `Reap`,
`Rupture`, `Siphon`, `Prolong`, `Reargue`) resolve and are gone — they
reasonably need no standing glyph.
