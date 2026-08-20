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

## 5. Second candidate pass (added via `/oversight` 2026-08-15)

T was shown §3 and asked for more candidates — the first pass was not
the right set. Reading §3 back, its weakness is narrowness rather than
quality: four of its six entries are either an `Oath-` derivative or a
bare liturgical noun, so it offered one direction twice rather than
several directions once. This pass widens the *kinds* of name on the
table. It is still not a ranked recommendation.

**Every candidate below was collision-checked** against the live
30-keyword registry (`axio_keywords`), the locked-system words, and the
authored content in `axiomancer-mechanics/src` + `axiomancer-mobile/src`
on 2026-08-15. Names already spoken for in-fiction were dropped during
that check rather than listed and caveated: **Requiem**, **Miserere**,
**Ossuary** (Ossuary Sermon, Ossuary Drawer), **Anathema** (Anathema
Brand) and **Vigil** are all live authored content — and `VIGIL` appears
upper-cased in engine source, so it is an NL-8 collision outright, not
merely a reuse. The six below return zero hits in both source trees.

### Direction A — the liturgical hours, done better than *Vespers*

| Candidate | Rationale | Risk / trade-off |
|---|---|---|
| **Compline** | The last office of the day — the prayer said before sleep, against the dark. Same shape as *Vespers* but a sharper thematic fit for a game about pressing on into night, and a rarer word, so it is ownable as a search term and a store listing in a way *Vespers* (a common word, many products) is not. | Obscure to anyone outside a liturgical background; carries no hint that this is a game about cards or combat. |
| **Viaticum** | The provision given to a traveller — and, in its liturgical sense, the last rite administered to the dying. A run-based campaign where you carry what you can and may not come back is *exactly* this word; it is the rare case where the archaic term is a more literal description of the mechanic than a modern one would be. | Four syllables and Latin-looking; hardest of the six to read at a glance on a store tile. |

### Direction B — architecture, not liturgy

| Candidate | Rationale | Risk / trade-off |
|---|---|---|
| **Lychgate** | The roofed gate at a churchyard's edge where the dead were set down before burial — a *threshold* word. Reads as gothic without any religious-observance knowledge required, and threshold-crossing is the campaign's actual structure (village → labyrinth → beyond). Compact, one word, strong logo shape. | Slightly better known in Britain than elsewhere; a portion of players will read it as invented rather than real. |
| **Sepulchre** | Tomb, sung-hard and immediately legible as dark fantasy to a player who knows nothing of the game's vocabulary. The most *marketable* candidate on either pass — it does the genre signalling that neither *Vespers* nor *Compline* does. | The least distinctive: it signals the genre by being genre-generic, and dark-fantasy shelves are crowded with tomb words. Weakest trademark position of the six. |

### Direction C — the game's own shipped language

| Candidate | Rationale | Risk / trade-off |
|---|---|---|
| **Cold Iron** | Two plain, hard, Anglo-Saxon words — and already the game's own: the title screen tagline shipped on 2026-08-14 (`0f408571`) reads "Carry your ancient knowledge and **cold iron** into the LEAGUES beyond." A title that is already sitting on the title screen has a rightness no coinage can buy, and it is the one candidate on either pass that needs no glossary from anybody. | Not liturgical at all — it steps outside the cathedral register that the Parish, GRACE and THE OATHS all live in. Also the most generic *as a string*: "cold iron" is folklore-common and hard to own as a mark. |
| **Threnody** | A song of lamentation for the dead. Keeps the single-word, musical-liturgical shape of *Vespers*/*Compline* while being the only candidate that names an *act of grief* rather than a rite, an hour, or a place — closest in spirit to a game whose morality system is GRACE and whose failures are meant to land. | Same legibility problem as *Compline*, and it reads a touch more literary/soft than the game's woodcut-and-iron visual direction. |

### What this pass deliberately did not do

- **No `-mancer` coinage.** §3's *Oathmancer* was the compromise
  candidate; if T wanted the "-mancer" shape retained, keeping
  "Axiomancer" outright is strictly cheaper than minting a new one.
- **No region names.** §3's *The Drowned Parish* already tested that
  direction and its own trade-off (binding the product to map one)
  applies to every other region name equally.
- **No two-part "Name: Subtitle" constructions.** They are worth
  reaching for only once the single-word question is settled — a
  subtitle can be added to any of these later without re-opening this.

If none of these is right either, the useful next move is probably for T
to name a *direction* (or a title from another game whose naming feels
right) rather than react to a third list — two passes of cold candidates
is roughly where that stops being the efficient format.

## 6. Final ruling (via `/oversight` 2026-08-20)

T closed this the way §5 anticipated — not by picking from either pass,
but by naming a direction and a title in the same breath: **"Miserere
Mei, Deus"** (Latin, Psalm 51 — "Have mercy on me, God"), decided
alongside setting *Mörk Borg* as the game's new tonal North Star across
art, narration, and encounter design (deck/dice mechanics unchanged). See
`new-north-star.prompt.md` (repo root) for the brainstorm session that
opens to work out what that pivot actually requires — this session's
scope was the name alone, and it's closed.

**Collision note carried forward from §5's own methodology:** the bare
word "Miserere" is already live in-fiction — §5 dropped it from its own
candidate list for exactly that reason. The chosen title is the full
liturgical phrase, not the bare word, but Phase 67 (the code migration,
queued in `plan/steps/01_build_plan.md`) should confirm no UI surface
puts the existing "Miserere" content next to the new product title in a
way a player would read as a duplicate or a mistake.

Per §4's own procedure: `plan/AUDIT.md`'s product-name row is marked
`[x]` resolved, and the migration is queued as build-plan Phase 67 — this
session's job is done.
