# Phase D4 — Pricing re-derivation + card re-authoring for the four-die model

> Agent-facing brief. Make `cards.pricing.ts` honest about the new dice
> cadence, then re-author the cards whose text speaks the old dice
> language. Card/pricing work in the `/deck-tuning` spirit — sandbox-first
> where a card's power changes, mechanical re-wording where it doesn't.

## Inputs

1. Spec 33 §4 (one dice-interaction card per theme), §5 (economy), §6
   (FORGE = special-amplifier enchants; Forge's 7 die-cards re-authored),
   §7 D4 note (DoT clock constants).
2. `src/Cards/cards.pricing.ts` — die-verb `VERB_POINTS`, `dieBonus` 0.6,
   threshold discounts, `dotLifetimeHp`/tempo constants (WS3.3 assumes ~2
   plays/round).
3. D3's report — measured plays/round, income, surge rate (deps: D3).

## Scope

- **Pricing model re-fit**:
  - Re-derive the card-played-clock DoT constants for the measured
    cadence (~1.83 paid + FREE plays/round — D3's actual number, not the
    estimate).
  - Re-fit die-verb `VERB_POINTS` for the new verb set: reroll/convert
    verbs against a 4-die miss-heavy pool; delete points for retired
    verbs (draft/read/STAKE riders); price momentum/surge riders and
    stance-check synergy (`threshold`-style) honestly.
  - Keep every `// pts:` card comment true — stale comments are lint
    failures waiting to happen.
- **Card re-authoring**:
  - Forge's 7 die-manipulation cards: keep identities, re-word onto the
    new model (floating→temp gold, face-swap→gear framing per spec §6).
  - Author the FORGE **special-amplifier enchantments** (e.g. +1◆ per
    fired special) — priced via the enchant conventions.
  - Author exactly **ONE dice-interaction card per non-Forge theme**
    (reroll / convert / tap — §4 valve 3), in each theme's voice.
  - `sig-read-opponent` re-text (reveals next phase's check + branch).
- **Keywords**: register SPECIAL / HONE / TEMPER rows (atlas + mobile
  `state/combat/keywords.ts` + guard test) so card text can cite them —
  glosses Dawncaster-terse.

## Decisions made upfront — DO NOT ASK

- Caps and payloads are spec-locked; amplifier enchants amplify PAYLOADS,
  they do not change what a special does (owner call, D1).
- The 5/5/5 preset recipe and preset color law stand — new cards slot into
  the existing 70-card/10-theme structure, growing it minimally.

## Surface as `[needs-user-call]`

- Any card whose identity cannot survive re-wording (would need a
  redesign, not a re-text) — list, don't invent replacements.

## Prove (DoD)

- Effectiveness lint + curated-library tests green; pricing bands hold
  (common 1.5-7.5 / uncommon 4.5-13 / rare 7-19) or re-banded with
  arithmetic shown.
- New cards through the sandbox-first flow with playtest-matrix evidence.
- Flip D4 `[x]` + Phase log + hash.

## Follow-ups

- `/deck-tuning` owns post-D7 balance passes; D6 renders the new keyword
  glosses; 33d (GLYPHS pilot) unblocks after this phase.
