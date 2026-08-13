# Naming session — the product name, post-pivot

> Opened via `/oversight` 2026-08-12, per T's 2026-08-10 ruling on
> `plan/AUDIT.md`'s `[needs-user-call]` product-name row: "reconsider,
> not keep-as-is... open a naming session (candidate names + rationale)
> as its own session rather than deciding it inline." This is that
> session. It does not decide anything — it lays out the constraint set
> and a first candidate pass for T to react to, add to, or reject
> outright. Until T rules here, "Axiomancer" remains the working name
> and nothing in Phases 44a-44i, 52-53, or the queue depends on the
> outcome either way.

## 1. Why this is even open

`axiomancer-mechanics/specs/34-dark-fantasy-campaign.md` §10 (the
Profane Canon retheme, which converted the whole game's vocabulary from
philosophy-native to dark-fantasy/gothic) explicitly **exempts**
"Axiomancer" under its own NL-9 proper-noun carve-out and rules
**KEEP** — the spec's own text is honest that this is a technicality,
not an endorsement: *"a whole-product pivot is exactly when a title
gets reconsidered, and that is a T-level decision, not a loop one."*
NL-9 exists to grandfather old words attached to *things the dead
built* (the Aporia, the Sophist) — a live product's own marquee title
is a different kind of case, and the spec flags that tension rather
than resolving it.

The word itself: **axiom** (a philosophy/logic term — foundational,
self-evident premise) + **-mancer** (a wielder of magic). It's a clean,
legible compound, but it's built from exactly the register the retheme
spent Phases 44a-44i removing everywhere else in the game (see spec 34
§2.2's V-1 "philosophy-native vocabulary" ban list). The title screen
is the one surface every player sees before any of that retheme work.

## 2. Constraints any replacement has to clear

Pulled from spec 34, so a candidate can be checked against them
directly rather than re-litigated:

- **NL-7** — the same V-1..V-6 bans that apply to prose apply to names:
  no modern-register words, no philosophy-native vocabulary freshly
  minted (only grandfathered survivors under NL-9), no anachronistic
  compounds.
- **NL-8** — the collision law: may not be, or begin with, a registry
  keyword, a locked-system word (Conviction / Surge / a dice-face
  word), a card-type word, a rank word, or a stance word.
- **Register** — archaic, gothic-cathedral, liturgical-adjacent. The
  game's own established vocabulary leans hard on this: the fishing
  village is **the Drowned Parish**, the morality system is **GRACE /
  THE OATHS**, in-fiction words already in play include *Miserere*,
  *Requiem*, *Unction*, *Vitae*, *Aporia*, *the Sophist*. A new title
  should sound like it belongs next to those, not next to "Axiomancer."
- **Legible at a glance** — this is still a marquee product name, not
  a card name; it needs to read cleanly on a title screen and in a
  store listing, not just survive a lint.

## 3. Candidate pass (first draft — not a ranked recommendation)

| Candidate | Rationale | Risk / trade-off |
|---|---|---|
| **The Oathbound** | Ties directly to the shipped GRACE / THE OATHS morality system — the one mechanic most players will actually *live inside*. Archaic, no collision risk. | Reads more like a subtitle than a standalone title; may need a shorter secondary mark for icon/logo use. |
| **Oathmancer** | Keeps the familiar "-mancer" shape (brand continuity, still legible as "a fantasy game about magic") but swaps the philosophy-native root for the game's own live morality vocabulary. | "-mancer" is itself a slightly video-gamey/modern coinage pattern (Necromancer aside) — worth an NL-7 gut-check even though it's not on the literal ban list. |
| **The Drowned Parish** | Reuses the already-authored, already-loved location name for the whole product — precedent: plenty of dark-fantasy titles ARE their opening region (Bloodborne's Yharnam-adjacent branding, Sekiro's setting-as-title feel). | Ties the whole product identity to what's currently just the *first* map; could read wrong once later regions/acts ship and the Parish is left behind. |
| **Vespers** | Short, liturgical, ownable as a standalone mark; evokes evening/dusk/last-rites without naming any single mechanic or region, so it ages well as content grows. | Fully invented rather than reusing established in-fiction vocabulary — no built-in tie to anything a returning player already recognizes. |
| **The Unction** | Reuses an existing V-1-survivor word already live in the game's own vocabulary (per spec 34's own list) — liturgical, ominous, on-register by construction. | "Unction" is an unusual/obscure word for players unfamiliar with its liturgical meaning (anointing rite) — legibility risk at a glance versus e.g. "Vespers."|
| **Keep: Axiomancer** | Zero migration cost (store listings, existing external references, muscle memory); NL-9 already rules it a legal KEEP. | The exact tension this session exists to weigh — "philosophy-native" is doing the opposite work of every other retheme phase shipped since 44a. |

## 4. What happens next

This is a first pass, not a shortlist — T may want more candidates, a
completely different direction, or to just close this with "keep
Axiomancer" now that the trade-off is laid out concretely. Whatever T
rules:

1. Update `plan/AUDIT.md`'s product-name row with the final decision
   (mark `[x]` resolved either way).
2. If a name change is ruled, spec 34 §10 item 2 needs its own
   follow-up phase (title screen, store metadata, any hardcoded
   "Axiomancer" strings across `axiomancer-mobile`/`axiomancer-mechanics`
   — a real migration, not a copy tweak) — scope that as its own
   build-plan phase once the name is chosen, don't fold it into an
   unrelated phase brief.
3. If T keeps "Axiomancer," no further action — the row closes on the
   strength of NL-9's existing KEEP ruling, now with an actual
   considered "why" behind it instead of a technicality.
