# Spec 34 — The Dark Fantasy Campaign Bible

> **Status:** RATIFIED — DESIGN, 2026-08-08. This is the design charter for
> Phases 44a-44i. It decides; it does not implement. Every ruling below is
> numbered so downstream work can cite `spec 34 §N` in a commit message, a
> code comment, or a lint rule.
>
> **Provenance:** T direct, `/oversight` 2026-08-08 ("THE UNSHACKLING,"
> commit `ad934542`) — *"no more philosophy based theme … I want to give you
> full freedom to take this deckbuilder in any direction"* — and the same-day
> ratification of the replacement: **"a Dark Fantasy deckbuilding RPG
> campaign", WHOLE PRODUCT**, framed as *"It's looser, not that different
> from what we already have, and should be an easy pivot while opening up
> A LOT of doors."* Authored as Phase 42 of `plan/steps/01_build_plan.md`.
>
> **"Looser" is the governing constraint.** This spec is a **re-skin plus
> permission**, not a ground-up redesign. Where a shipped artifact already
> reads dark fantasy, this spec ratifies it and forbids churn. The burden of
> proof is on renaming, never on keeping.
>
> **The most important input is not this spec.** Commit `84ef85b` ("THE
> PROFANE CANON") landed on `main` after the Phase 42 row was written and
> already rethemed the player card library (57 cards, 6 archetypes), the
> campaign presets, and shipped a brand-new enemy card library. Its design
> record is `plan/archive/2026-09-25-trim-t5/axiomancer-mechanics/docs/profane-canon.md`. **This spec
> codifies and generalises the Profane Canon; it does not compete with it.**
> Where the canon already answered a question, §-by-§ below says so, cites
> the shipped artifact, and ratifies it.
>
> **Supersedes:** `plan/bearings.md` § "Decisions standing for the autonomous
> loop" → the **Voice** entry (re-derived and *ratified with amendments* in
> §2) and the **Copy canon** entry (VITAE / STANCE / MORALE — ruled in §5.6).
> Answers the open question parked in bearings § "What we're building"
> ("*'your worldview is a mechanical input' is what makes this an RPG rather
> than a deckbuilder' — settled in Phase 42*") at **§6.4**.
>
> **Doctrine check (laws this spec must serve, unchanged by it):** the LOCKED
> MECHANICS carve-out — Conviction, the Surge meter, the Dice system stay
> permanently, and the fiction is authored to **house** them (§4); dice
> honesty (2026-07-09) — no rigged rolls, ever; hermeticity and determinism;
> the verify and deploy gates; `GAME_STATE_VERSION` migration discipline; the
> Profane Canon's LINEAGE LAW (`PRESET_LINEAGE`); The Incompleteness's L110
> calibration to the digit.

---

## Contents

| § | Subject | Primary downstream consumer |
|---|---|---|
| §0 | How to use this document | all of 44a-44i |
| §1 | The setting — The Parish | 44f, 44g, 44i |
| §2 | Tone and voice register | 44c, 44e, 44g, 44i |
| §2.5 | The Mörk Borg delivery register (MB-1 … MB-8) + pipeline (R-D) | all narrative/content authoring, `story-spec`/`world-spec`/`character-spec` |
| §3 | The Naming Law (NL-1 … NL-19) | 44a (lint), all authors |
| §4 | Housing the LOCKED MECHANICS | 44b, 44g, 44i |
| §5 | The concept-level rename map | 44a, 44b, 44c, 44d, 44e, 44f |
| §6 | The morality system | 44h, 44i |
| §7 | What "campaign" means | 44i, the build plan |
| §8 | What does NOT change | all |
| §9 | Downstream obligations, phase by phase | the orchestrator |
| §10 | Residue | `plan/AUDIT.md` / `plan/PHASE_CANDIDATES.md` |
| §11 | Acceptance | this spec |
| §12 | Index of rulings | anyone citing `spec 34 §N` |

---

## §0 — How to use this document

**§0.1 Authority.** This spec outranks every prose surface written before
2026-08-08 on questions of *fiction, name and register*. It has **no
authority over mechanics**: it may not change a payload, a constant, a
probability, a resolver, or a doctrine. If a ruling here appears to require a
mechanical change, the ruling is wrong — file it to `plan/AUDIT.md` and ship
the rest.

**§0.2 The two audiences.** Every ruling is written to be executable by
either of two readers, and both must be able to follow it:

- **the codemod author** (Phase 44a) — needs enumerable old→new pairs and
  mechanically checkable predicates;
- **the prose author** (Phases 44c, 44e, 44f, 44g) — needs a register, a
  grammar, and a ban list.

Where a ruling is only checkable by a human, it is marked **[judgement]**.
Everything unmarked is lintable.

**§0.3 The default is KEEP.** Renaming what already works is churn
(bearings, THE UNSHACKLING item 3). A term is renamed only when it is
(a) philosophy-native jargon, (b) out of register per §2.2, or (c) actively
misleading about its own mechanic. Nothing else moves. §5.1 is deliberately
much longer than §5.2.

**§0.4 Ids versus names.** Two different risks:

- A **display name** is free to change; it is presentation.
- An **id** may be in persisted `GameState`. Any id rename that touches
  persisted state requires a `GAME_STATE_VERSION` bump and a migrator. When
  in doubt, **rename the display name and leave the id alone** — see §5.9.

---

## §1 — The setting: The Parish

> This section exists because the Profane Canon shipped a *vocabulary*
> without shipping a *world*. Six player archetypes, seven enemy factions,
> three presets and 160-odd card names all imply a place. §1 names it, so
> that 44f/44g author inside a frame instead of inventing seven of them.

**§1.1 [RULING] The setting is THE PARISH.** One country, administered as a
single parish, by a church whose saints are dead and whose tithe is still
collected. Nobody has cancelled the debt because nobody living has the
authority to. The machinery of collection — bells, ledgers, assizes,
almoners, sextons, gravediggers, confessors — outlived the faith that
justified it and now runs on its own momentum. That is the whole premise, and
it is deliberately small: it explains rot, debt, graves, winter vigils,
witch-trials and choirs (the six player archetypes) without requiring a
cosmology, a pantheon, a prophecy or a chosen one.

**§1.2 [RULING] The seven estates.** The shipped enemy archetypes
(`combat.enemy-cards.ts`) are RATIFIED unchanged as the Parish's estates.
Their throughlines are canon:

| Estate (shipped id) | What it is in the Parish |
|---|---|
| `drowned-parish` | The coastal parishes the sea took. Still ringing, still collecting. |
| `bone-clergy` | The clergy that survived its own flesh. Decrees, scholarship, plague. |
| `debt-office` | The civil arm. Contracts, tolls, borrowed gods, punctual endings. |
| `omen-choir` | The prophets on retainer. Tallies, knocks, the already-written. |
| `gnawing-court` | The old aristocracy. Courtesy that ends where the reach begins. |
| `old-fires` | What was here before the Parish, and is not sorry. |
| `the-aporia` | The building the Parish raised over its founding error. Its bosses invert one player habit each. |

**§1.3 [RULING] The player is the Almoner.** The lowest office the Parish
grants: the one sent out to settle accounts with the dead and the dying. An
almoner may *give* alms or *collect* them — which is exactly the mercy/exploit
fork the morality system already measures (§6). The player is not chosen, not
special, and not owed anything.

**§1.4 [RULING] The arc is the shipped preset lineage.** The Profane Canon's
`threadbare → pilgrim → apostate` lineage is RATIFIED as the campaign arc and
as its narrative meaning:

- **The Threadbare Office** — you are handed a bad job and worse tools.
- **The Pilgrim's Burden** — you walk the country to settle it, and the tools
  that were handed to you are cut away at the confessor's shears.
- **The Apostate's Canon** — you stop trying to settle the debt and start
  refusing it.

Phase 44g authors *within* this arc. It may not add a redemption ending, a
prophecy, or a rightful heir.

**§1.5 [RULING] What the fiction must never claim. [judgement]**
1. No pantheon with living, active gods. Saints are dead; that is the point.
2. No prophecy that names the player.
3. No "the world was once beautiful" flashback register. It was always cold.
4. No cosmic scale. The stakes are a parish, a debt, and a body.
5. Nothing is explained by magic; things are explained by obligation.

---

## §2 — Tone and voice register

**§2.1 [RULING — supersedes and re-ratifies the bearings "Voice" entry by
name].** `plan/bearings.md` § "Decisions standing for the autonomous loop" →
**Voice** currently reads: *"terse, archaic-flavored, 'cold and old' — but no
thee/thou/thy/thine/ye. Mercy/exploit language reads as morally charged, never
neutral."* That entry is **RATIFIED, not replaced** — dark fantasy keeps it
verbatim — and **amended** by adding the Profane Canon's tonal brief and the
bans in §2.2. The parenthetical "(Theme-bearing — a Phase 42 proposal may
argue for a different register…)" is now discharged: this is that
re-derivation, and the answer is *keep it*. The "morally charged" clause
stands because the morality system survives (§6).

The ratified register, in full:

> **Terse, archaic-flavored, cold and old. Grim, bodily, superstitious.**
> Concrete nouns with weight. Card and telegraph text reads like a fragment
> of scripture, contract, or confession. Mercy and exploitation are always
> morally charged, never neutral. **No thee / thou / thy / thine / ye.**

**§2.2 [RULING] Forbidden registers.** These are hard bans. 44a lints what it
can; the rest is review.

| # | Banned | Why | Example of the violation |
|---|---|---|---|
| V-1 | Philosophy-native jargon | The retired theme | premise, thesis, axiom, aporia*, doxa, lemma, theorem, fallacy, syllogism, dialectic, epistemology, sophist*, peroration, rebuttal, concede |
| V-2 | Modern / clinical / corporate register | Breaks "old" | protocol, system, optimize, energy, matrix, resource, buff, synergy, module |
| V-3 | High-fantasy Tolkien-ism | Wrong genre | arcane, mystic, elven, rune of, "of Doom", "+2 Sword of" |
| V-4 | Invented apostrophe-fantasy names | Wrong genre | Kal'Zareth, Xyl'thoor |
| V-5 | Archaic pronouns | Bearings, unchanged | thee, thou, thy, thine, ye |
| V-6 | Exclamation marks, ALL-CAPS words inside prose, emoji | Not cold | "The bell tolls!" |
| V-7 | Second-person heroic address | Not this world | "You are the last hope of…" |
| V-8 | Explanatory parentheticals in flavour text | Terseness | "The Vig (interest owed weekly)" |

\* `aporia` and `sophist` survive **only** as proper nouns under NL-9 — see
§3 and §5.8.

**§2.3 [RULING] Sentence form.** Card text, telegraph text and NPC lines are
**one clause per line, present tense, no subordination beyond one comma**.
A line that needs a semicolon is two lines. Flavour text is at most two
sentences and never explains a rule.

**§2.4 [RULING] The six lexicons.** Every authored name and every line of
flavour draws its nouns from one of six pools, inducted from the shipped
Profane Canon library. Mixing two pools in one name is allowed and often
good (*Gangrene Gospel*, *Choirbone Reliquary*); using a seventh pool is a
defect.

| Pool | Shipped exemplars |
|---|---|
| **Liturgy** | psalter, hymn, unction, communion, gospel, requiem, miserere, amen, cope, offertory, versicle, rubric |
| **Law & debt** | indictment, indenture, distraint, attainder, assize, writ, lien, arrears, vig, pledge, ledger, contempt |
| **Rot & medicine** | poultice, boils, gangrene, chilblain, worm, wound, brine, sepsis |
| **Earth & grave** | spadeful, spadework, grave, pyre, ossuary, sexton, dirge, disinterred |
| **Cold & siege** | palisade, hoarfrost, caltrops, snow, ice, winter, watch, besieger |
| **Folk & household** | knucklebone, thumbprick, grandmother, teeth, bell, needle, bridle, gnaw-marks |

---

## §2.5 — The Mörk Borg delivery register (RATIFIED 2026-08-22)

> **Provenance.** `plan/north-star-mork-borg.md` §2, ratified as-is by T in
> the 2026-08-22 content-pipelines walkthrough (Phase 74, N-1). Folded here
> so it is citable as `spec 34 §2.5.N` alongside every other ruling in this
> document, rather than living only in a `plan/` file a tick might not read.
>
> **How this sits next to §2.1-§2.4.** Nothing above changes. §2.1's ratified
> register ("terse, archaic-flavored, cold and old"), §2.2's eight forbidden
> registers, §2.3's sentence-form rule, and §2.4's six lexicons remain the
> word-choice and clause-shape law. §2.5 extends that law from card and
> telegraph text to **every** player-facing surface — event copy, world-map
> descriptions, enemy descriptions, dialogue, screen copy — and adds a
> sentence-shape doctrine (the "knife law") that collides with none of the
> above.
>
> **R-C / R-F reconciliation, recorded here.** The north-star session first
> ruled R-C ("prose only" — the visual layer, i.e. the Phase V Woodcut Codex
> masterplan, stays untouched by this register) and later, same session,
> widened the mandate with R-F ("THE LONGER LEASH" — T verbatim: *"I want
> the current Nexus loop to take bigger leaps of freedom when it comes to
> New cards, new effects, new keywords, narration, art, UI, direction, the
> map, and mechanics"*). R-F is the later ruling and self-declares
> precedence where the two conflict: **art IS in loop scope.** R-C survives
> narrowed to what it was actually protecting — this register governs
> *sentences*, and does not restyle the visual layer; the Woodcut Codex
> masterplan remains the current art bearings, and the loop executes within
> it and may evolve it through its own phases, rather than being barred from
> the visual layer outright. See `plan/bearings.md` § "Decisions standing
> for the autonomous loop" → **THE LONGER LEASH** for the full R-F ruling
> (surface list, keep-list, not-touched list).

**§2.5.1 [RULING] MB-1 — the knife law** *(lintable: length)*. Narration
sentences run short — target under twelve words, hard ceiling twenty. One
subordinate clause per *paragraph*, not per sentence. A semicolon in
player-facing prose is a defect (extends §2.3 beyond card text). Full stops
are the register.

**§2.5.2 [RULING] MB-2 — indifference** *[judgement]*. The narrator states
consequences as facts and never sympathizes, never warns twice, never
editorializes. "The water climbs," never "beware the water." Danger is
described the way a ledger describes arrears.

**§2.5.3 [RULING] MB-3 — the Dial-1 humor law** *[judgement]*. Humor arrives
only by deadpan juxtaposition of the mundane and the terrible, and every
funny line must also be literally true in-world. No irony markers, no
self-reference, no fourth wall, no jokes *about* the grimness. If a reader
can't tell whether the line meant to be funny, it is compliant.

**§2.5.4 [RULING] MB-4 — second person and the imperative are permitted**
*[judgement]*. "Pick a door." "Wade or don't." V-7 (§2.2) stands untouched:
second person may instruct and price; it may never flatter ("you are the
last hope of…" stays dead).

**§2.5.5 [RULING] MB-5 — scenery is priced** *[judgement]*. A descriptive
beat gets at most one line of pure atmosphere; the next line must carry a
stake, a price, or an instruction. Scenery that costs the player nothing to
ignore is cut.

**§2.5.6 [RULING] MB-6 — no adjective without a decision** *[judgement]*. An
adjective survives only if removing it would change what the player does or
owes. "Old songs" earns its place if old means *claimable*; otherwise the
songs are just songs.

**§2.5.7 [RULING] MB-7 — brutality is stated, not performed** *[judgement]*.
The register never escalates typographically (V-6, §2.2, stands: no
exclamation marks, no ALL-CAPS inside prose). The most terrible line in the
game should scan as flatly as a receipt.

**§2.5.8 [RULING] MB-8 — vocabulary discipline is unchanged** *(lintable —
already wired)*. The six lexicons (§2.4), the V-bans (§2.2), and the Naming
Law (§3) govern word choice exactly as before. This register is a
sentence-shape doctrine layered on top of them, and collides with none of
them.

**§2.5.9 [RULING] The pipeline this register executes under.** Per
`plan/north-star-mork-borg.md` §4 (R-D): the loop authors and ships NPCs,
regions, story beats and encounter copy through normal phases/ticks without
a per-item attended-Socratic-session gate. The guardrail is lint-and-audit
after authoring, not approval before it — the register lint (Phase 70's
`check-prose.mjs` plus its queued MB-1 mechanical-subset follow-up),
playtester spot-checks on shipped content phases, and `/oversight` audit.
The `story-spec` / `world-spec` / `character-spec` skills still write a
spec file for every NPC/region/beat when run unattended by the loop — the
file is the record, not the permission.

---

## §3 — The Naming Law — REPEALED (2026-09-02)

> **REPEALED by THE BIG NUMBERS REWRITE** (2026-09-02,
> `plan/2026-09-02-big-numbers-overhaul.prompt.md` §3, law L28). NL-1..NL-19
> are no longer binding on any card, enemy or keyword, and NL-7's import of the
> §2.2 V-1..V-6 ban list as a *naming* rule goes with them (§2.2 itself survives
> as voice guidance, which is all it ever was). Their enforcer
> (`scripts/check-naming-law.mjs`, root `npm run lint:names`) is gutted to
> "ids are kebab-case and unique". The
> §5.2 rename map is a different section and is STILL LIVE — the words PLEA,
> CHARGE, CONDEMN, RELENT, QUARTER, TOLL, OATH, HEX, Ash..Saint remain canonical
> and the lexicon lint still enforces them. What follows is retained as taste
> advice, which is what it was always best at: names like *The Black Cap* are
> the register, not a rule you can fail.

> Inducted from the 57 shipped player cards, the 100+ shipped enemy cards,
> the six archetype display names and the three preset names. Every rule
> below is *descriptive of what shipped* before it is prescriptive of what
> comes next. Phase 44a turns NL-2, NL-4, NL-5, NL-7, NL-8, NL-11, NL-14 and
> NL-15 into lint; the rest are review rules.

### §3.1 Universal rules (every name, every kind)

**NL-1 [judgement] — the weight test.** A name must name something a person
in the Parish could point at, suffer, owe, or perform. *Tithe of Teeth*, never
*Dark Blast*.

**NL-2 — concrete head noun.** The syntactic head of every name is a concrete
noun or a nominalised act. Abstract-noun heads (*Incompleteness*,
*Clarity*, *Truth*) are forbidden except under NL-9.

**NL-3 [judgement] — one image per name.** A name carries exactly one image.
*Caltrops Under the Snow* is one image; *Frost-Gospel of the Bleeding Ledger*
is three and is a defect.

**NL-4 — no numerals, ever.** Numbers are spelled: *The Ninth Bell*, never
*The 9th Bell*. Card faces still print digits for values; **names** do not.

**NL-5 — no colons, no subtitles, no parentheses.** *The Black Cap*, never
*The Black Cap: Sentencing*.

**NL-6 [judgement] — Anglo-Saxon and Norman first.** Prefer short, hard,
early-borrowed words. Latin survives only where the Church would use it
(*Miserere*, *Requiem*, *Unction*, *Vitae*).

**NL-7 — the ban list of §2.2 applies to names.** V-1 through V-6 are naming
bans as well as prose bans.

**NL-8 — the collision law.** No authored name may be, or begin with, a
registry keyword, a locked-system word (Conviction / Surge / dice-face word),
a card-type word, a rank word, or a stance word. A card may *reference* a
keyword in its rules text; it may not be named one. (This is the single most
important lint for 44a — it is what keeps card faces parseable.)

**NL-9 — the proper-noun carve-out.** A retired philosophy word MAY survive
as the **proper name of a place or an entity older than the player**, and
only there. Precedent: the Profane Canon shipped `the-aporia` as a live enemy
archetype and left The Sophist on the roster. Grounds: in the Parish, those
words are things the dead built, not vocabulary the game speaks. Nothing new
may be minted under this carve-out — it grandfathers, it does not license.

### §3.2 Card names

**NL-10 — the rank grammar.** Syntactic weight rises with rank. Observed in
the shipped library and now binding for new cards:

| Rank band | Form | Shipped exemplars |
|---|---|---|
| 1–2 (common) | Bare noun phrase, 1–3 words, no leading article | Spoiled Poultice · First Spadeful · Promissory Cut · Spadework · Frostbitten Palisade · Hoarfrost Teeth · Shallow Grave · The Vig |
| 3–4 (uncommon) | Definite article + possessive or *of*-phrase | The Sexton's Bell · The Long Lent · The Pauper's Pyre · The Pricking Needle · Contempt of Court · Dirge for the Disinterred |
| 5–6 (rare / OATH / HEX) | A full clause, an imperative, or a comma-turn | Nothing Crossed the Ice · Every Stone an Oath · Open Every Grave · Caltrops Under the Snow · Joint and Several · Last Rites, Sung Early · Writ of Attainder |

Deviations exist in the shipped library (*Grandmother's Psalter* is rank 5 in
band-1 form) and are permitted; the law is a **strong tendency, lintable as a
warning**, not an error.

**NL-11 — the article law.** A leading *The* marks a **singular, unique
thing**: rares, OATHs, HEXes, bosses, places, and the six archetype display
names. Commons do not take *The*.

**NL-12 — the possessive law.** A possessive names an **office or a role**,
never a modern given name: *the Sexton's*, *the Pauper's*, *the Besieger's*,
*Grandmother's*, *Scold's*. Never *Aldric's*.

**NL-13 — length.** Player card names: ≤ 5 words. Enemy card names: ≤ 7 words
(the telegraph reads "*<Enemy> casts <Card>*", which carries a longer clause
— see the shipped *A Hundred Years of Courtesy, Ended*).

### §3.3 Keyword names

**NL-14 — the keyword form.** A registry keyword is:
1. exactly **one word**, no hyphen, no article, no possessive;
2. a real English word with a **physical, bodily, liturgical or legal**
   sense — never a coinage;
3. readable as an **imperative or a state** on a card face
   (`RUPTURE 3`, `FALLEN`);
4. ≤ 9 letters where possible (IMMOLATE is 8; the shipped ceiling);
5. never a proper noun, and never colliding with NL-8;
6. uppercase-stable — it must still read as itself in ALL CAPS.

**NL-15 — one keyword, one mechanic, one name.** A mechanic with two printed
names is a defect (the pre-canon `REPRISE`/`RECALL` split is the worked
example). A name that means two mechanics is a worse defect — see the
CURSE/HEX distinction ruled at §5.4.

### §3.4 Themes, enemies, places and NPCs

**NL-16 — archetype names.** An archetype has (a) an **id**: one lowercase
plain-English noun, ≤ 6 letters (`rot`, `debt`, `grave`, `vigil`, `trial`,
`choir`), and (b) a **display name**: *The* + noun phrase (*the Blight*, *the
Reckoning*, *the Exhumation*, *the Cold Watch*, *the Indictment*, *the Pale
Choir*). RATIFIED as shipped.

**NL-17 [judgement] — enemy names.** One of three forms, all shipped:
*(i)* a folk-monster name (*Rawhead Rex*, *Brine Hag*, *Bull-Begger*);
*(ii)* an office with the definite article (*The Butcher*, *The Ferryman*,
*The Doorwarden*); *(iii)* a past-participle epithet (*Sugata, the
Half-Erased*; *Mabadi, Undrowned*; *Tri-Eyes, Hollowed*). Abstract-noun names
are forbidden by NL-2 — see §5.7 for the one shipped violation.

**NL-18 [judgement] — place names.** A place is named by *a feature plus a
fact that went wrong*: the Drowned Parish, the Cold Watch. Or by the office
that holds it. Never by a person, never by a compass direction alone.

**NL-19 [judgement] — NPC names.** A role-title (*the Sexton*, *the
Confessor*, *the Almoner*), a folk given-name with a trade or weather tag
(*Old Marrow*, *Tide-Shopkeeper*), or an office with the definite article. No
surnames. The definite article marks the last of their kind.

---

## §4 — Housing the LOCKED MECHANICS

> **This section is the phase's pass/fail condition.** Bearings' LOCKED
> MECHANICS carve-out (T direct, 2026-08-08) requires the fiction to be
> authored to **house** Conviction, the Surge meter and the Dice system, not
> around them. A bible that leaves any of the three thematically homeless has
> failed. All three names already read dark fantasy.

**§4.1 [RULING] All three names are KEPT.** No rename is proposed for
Conviction, the Surge meter (and its `MOMENTUM_*` / `SURGE_DIE_PREFIX`
anchors), or the Dice system. Therefore **no `GAME_STATE_VERSION` check is
required on their account**, and Phase 44b's LOCKED MECHANICS GUARD resolves
to "do not touch". Any future proposal to rename one must reopen this spec.

**§4.2 [RULING] Conviction ◆ is housed as testimony.** In the Parish,
*conviction* means both what you hold to be true and what a court hands down.
The game means both at once, and the pun is load-bearing, not decorative:

> **Conviction is the weight of your own testimony.** The bones show a sign;
> you bank what it is worth. You spend it to do the one thing only you would
> do — a signature. To convict is also to be convicted: the trial archetype
> (§5.2, CHARGE → CONDEMN) prosecutes with the same word the player banks.

Consequences that downstream phases MUST honour: signatures are always
written as **acts of will paid for out of the self** (§5.5 names them that
way); Conviction is never described as mana, energy, or a resource; overflow
grants ("the grant converts to +1◆") are described as *what fate pays you
when it cannot pay you in dice*.

**§4.3 [RULING] The Surge meter is housed as the third bell.** The wheel runs
heart → body → mind, and completes at length three
(`MOMENTUM_CHAIN_ORDER`, `MOMENTUM_SURGE_LENGTH = 3`). The Parish counts in
threes and announces everything with bells (shipped: *The First Bell*, *The
Ninth Bell*, *Passing-Bell*, *The Assize Bell*, *The Reprisal Bell*, *A Bell
Sewn Under the Hem*).

> **Walk all three stances and something rings.** The surge is *the third
> bell* — the toll that says the rite completed — and what answers hands you
> a gold die. Nothing in the Parish is free; the die is temporary because the
> bell stops.

The mechanic, its constants and its events are untouched. The *word* SURGE is
kept (a surge of blood, a surge of tide — both are canon lexicons); "the
third bell" is the **flavour name** the copy may use in the log and the
tutorial, never a second registry keyword (NL-15).

**§4.4 [RULING] The Dice are housed as the bones.** The Parish is
superstitious; the player throws bones. This is already canon: the first dice
valve card shipped as *Knucklebone Recant*, and the stage ladder runs
*Knucklebone Recant* → *The Ossuary Drawer* → *The Saint's Finger-Bone*.

> **The bones do not lie.** Four are thrown each round. Three carry a colour
> and one is gold and lawless. A blank face is a refusal, not a punishment;
> Press Fate is what it costs to make fate throw again.

Consequences: the 2026-07-09 **dice honesty** law ("no rigged rolls, ever")
is now also a *fictional* law of the world, and copy may state it in-world.
The die-gear verbs HONE and TEMPER are the smith's words and survive (§5.1);
they are re-homed to the rest node's **anvil** (§5.8). The miss face may be
called **the blank** in copy; `X` stays the engine's word.

**§4.5 [RULING] The three are the only mechanics granted in-world
metaphysics.** Nothing else in the game gets a cosmological explanation. This
is deliberate: it makes the locked systems the load-bearing furniture of the
fiction, so no future retheme can quietly orphan them.

---

## §5 — The concept-level rename map

> **Concept level only.** Phase 44a derives the byte-level artifact
> (`docs/retheme-map.json`) from this section plus §3. Where this section
> names a replacement, that replacement is **ratified** and 44a copies it.
> Where it names a *rule*, 44a applies the rule.
>
> The live registry is `axiomancer-mobile/state/combat/keywords.ts`:
> `KEYWORD_GLOSS` holds **42 rows** (not the "~29" the Phase 44b row
> estimates) — 37 keywords, 3 die-gear rows (SPECIAL / HONE / TEMPER) and 2
> card-type labels. `SYSTEM_GLOSSARY` holds 8 more system terms. All 50 are
> ruled below.

### §5.1 SURVIVE UNCHANGED

**§5.1.1 [RULING] The seven the phase row named survive, as expected:**
**POISON · BLEED · MARK · DOOM · THORNS · GUARD · RIPOSTE.** No change of any
kind. Renaming them is churn and is forbidden.

**§5.1.2 [RULING] These twenty-eight also survive, unchanged** — each already
draws from a §2.4 lexicon, or is register-neutral mechanical English:

RUPTURE · SIPHON · PROLONG · FESTER · RECOIL · FALLEN · SOUL · REAP ·
STAGGER · BACKFIRE · FORETELL · OMEN · KINDLE · PIP · FORGE · ECHO · RECALL ·
REPLAY · MILL · DRAW · HEAL · CLEANSE · TICK · IMMOLATE · REQUIEM · PURGE ·
HONE · TEMPER.

(7 named in §5.1.1 + these 28 + the 7 renamed in §5.2 = the 42
`KEYWORD_GLOSS` rows, exactly.)

Notes on the four that were argued and kept:

- **BACKFIRE** reads modern at a glance. Kept: its sense is the 19th-century
  *fire that comes back down the barrel*, which sits inside the `old-fires`
  lexicon, and it has a dozen carriers. Renaming it would be churn (§0.3).
- **MILL** is card-game jargon by origin but reads as a mill — grinding a
  deck to dust. Kept.
- **TICK** is already scheduled for retirement (spec 32 amendment 2). This
  spec does **not** rename it; it dies by its own retirement or not at all.
- **SIPHON / DRAW / HEAL / CLEANSE** are register-neutral. Kept.

**§5.1.3 [RULING] System terms that survive:** CONVICTION ◆ (§4.2), the SURGE
(§4.3), the DICE and every die word (§4.4), RESERVE, PIPS, RUNGS, WILD, X.
`RUNGS` is a happy accident — a rung is also a bell rung — and copy may lean
on it.

**§5.1.4 [RULING] The stance names BODY / MIND / HEART survive**, as do their
colour bindings (body=red, mind=blue, heart=purple, wild=gold). They thread
through `STANCE_COLORS`, the dice model, `PlayerArchetype`, tests and the sim
harness; they are plain English, not philosophy jargon; and the cost of
moving them is enormous. **Explicitly ruled: no rename.**

**§5.1.5 [RULING] The six archetypes and their display names are RATIFIED as
shipped** (`card-themes.ts`): `rot` the Blight · `debt` the Reckoning ·
`grave` the Exhumation · `vigil` the Cold Watch · `trial` the Indictment ·
`choir` the Pale Choir · plus the `curse` junk class. **The Phase 44d row's
"10 theme names" is stale** — the Profane Canon replaced ten themes with six
archetypes plus curse. 44d's real work is the keyword-family table
(`THEME_KEYWORDS`) under §5.2's renames, and nothing else.

**§5.1.6 [RULING] The three preset names are RATIFIED as shipped:**
THREADBARE (The Threadbare Office) → PILGRIM (The Pilgrim's Burden) →
APOSTATE (The Apostate's Canon). They are also the campaign arc (§1.4, §7).

**§5.1.7 [RULING] The enemy roster is ratified almost entire** — see §5.7.

### §5.2 RENAMES — the registry keywords

Fifteen concepts move. Each row gives the replacement and its one-line
justification. **These names are ratified**; 44a copies them.

| # | Old | New | Justification |
|---|---|---|---|
| R-1 | PREMISE | **CHARGE** | The trial archetype is a witch-trial; what you enter against the accused is a charge. Canon already ships *Reading of the Charges*, *Contempt of Court*, *The Black Cap*. One syllable, legal register, noun-and-verb. |
| R-2 | PERORATION | **SENTENCE** | The declared conclusion that fires when the tally lands is, in a court, the sentence. Keeps the "declared, then it falls" shape exactly. |
| R-3 | CONCEDE | **CONDEMN** | The alt-win is the *court* ending the fight, not the foe politely agreeing. *The Black Cap* — the cap a judge dons to pass sentence — is already its carrier. |
| R-4 | SWAY | **PLEA** | The Pale Choir's win path is sung mercy, and a plea is what you stack before a court until it takes. Gives choir the exact structural mirror of trial: CHARGE→CONDEMN prosecutes, PLEA→RELENT begs. |
| R-5 | CAPITULATE | **RELENT** | One word, archaic, morally charged, and — critically — free of collision: `yields:` is already a spec-33 stance-check field, so YIELD is unusable (NL-8). |
| R-6 | RAPPORT | **QUARTER** | "To give quarter" is the mercy a killer grants mid-fight; each stack is a blow pulled. Replaces a modern social-science word with a martial-archaic one, same meaning. |
| R-7 | REARGUE | **CURDLE** | The mechanic turns bleed into venom and venom into blood. Curdling is the bodily, folk-medical word for exactly that, and lands in the rot lexicon. |
| R-8 | SPECIAL (die face) | **BOON** | Settles the rename debt the D1 comment left open ("the most generic registry name — rename deferred"). A face that pays Conviction is a boon; short, archaic, uppercase-stable, no collision. |
| R-9 | ENCHANTMENT (card type) | **OATH** | Canon already ships *Thumbprick Oath* and *Every Stone an Oath*. A player-side standing passive is a promise you made and are still keeping. Retires a Tolkien-register word (V-3). |
| R-10 | DISENCHANT (card type) | **HEX** | "Disenchant" is an MTG term meaning *destroy an enchantment*; here it means *a standing curse on the enemy* — actively misleading, so it fails §0.3(c). The rework's own commit message already says "enemy-hexed". |
| R-11 | RESONANCE ⬡ | **TOLL** | A per-colour running count, spent at a threshold: bells toll and bells count. Canon-dense (*The Toll, Entire*, *The Toll Is Named*, five shipped bell cards). |
| R-12 | FLOATING ✦ | **GHOST** | A die that plays beside your rolled dice, never rerolls, and is gone forever when spent. It is a ghost die. Replaces the most abstract word in the dice vocabulary. |
| R-13 | THOUGHTFORM (card class) | **HAUNT** | A card that visits your hand from outside your deck and is gone when spent. Retires the last philosophy-native card class. Id prefix `tf-` → `ht-`. |
| R-14 | The rank ladder | **ASH · TOOTH · SPLINTER · RIB · SKULL · SAINT** | Doxa/Lemma/Thesis/Theorem/Axiom/Aporia is the most-printed philosophy vocabulary left in the game — it is on every card face. The replacement is one metaphor end to end (a reliquary, ascending), matches canon (*Canon of Teeth*, *Choirbone Reliquary*, *The Saint's Finger-Bone*), and preserves the rarity mapping: common = Ash/Tooth, uncommon = Splinter/Rib, rare = Skull/Saint. `CardRank` stays numeric 1-6 — display names only, **no migration**. |
| R-15 | MORALE (copy canon) | **GRACE** | See §5.6 and §6.1. |

**§5.2.1 [RULING] Consequential cleanups these renames force.** 44b owns
each:
- The PIP gloss currently calls a pip "a charge" — reword (collides with R-1).
- "tolls DOOM" appears in canon prose; after R-11, TOLL is a registry word, so
  DOOM's prose must stop using *toll* as a verb (NL-15).
- `SYSTEM_TERM_COVERED_BY` references a `CLARITY` keyword that does not exist
  in `KEYWORD_GLOSS` — a stale row; delete it while in the file.
- `ARCHETYPE_KEYWORDS` (the hidden reward skew) still lists `Tick`, `Sway`,
  `Rapport`, `Premise` — re-map under R-1/R-4/R-6.
- `THEME_KEYWORDS` (mechanics side) lists `PREMISE` for `trial` and
  `SWAY`/`RAPPORT` for `choir` — re-map, and keep CONDEMN/SENTENCE out of the
  families exactly as CONCEDE/PERORATION are kept out today (the mobile KW-6
  parity law).

**§5.2.2 [RULING] Effect ids move with their keywords in 44b, as that phase's
row already permits.** Worked examples: `debuff_rapport` → `debuff_quarter`;
`buff_open_minded` → `buff_absolved` (V-2: "open-minded" is modern
therapeutic register). `debuff_poison` / `debuff_bleed` / `debuff_mark` /
`debuff_creeping_doom` do **not** move (§5.1.1).

### §5.3 The systems glossary

| Term | Ruling |
|---|---|
| CONVICTION ◆ | KEEP (§4.2) |
| RESONANCE ⬡ | → **TOLL** (R-11) |
| RESERVE & PIPS | KEEP |
| FLOATING ✦ | → **GHOST** (R-12) |
| RUNGS | KEEP |
| WILD / X | KEEP |
| PERORATION | → **SENTENCE** (R-2) |
| CONCEDE | → **CONDEMN** (R-3) |

### §5.4 [RULING] CURSE and HEX are different things, and both survive

- A **CURSE** is a junk *card* an enemy shuffles into your combat deck
  (`curseCardId`, the `curse` theme, PURGE's whole reason to exist).
- A **HEX** is a standing *passive* a card attaches to the enemy (R-10).

Both words are canon-correct and neither may absorb the other. 44b must gloss
the distinction explicitly, because NL-15 is otherwise at risk.

### §5.5 [RULING] Signature skills

`SignatureSkillId` values (`sig-*`) are **unchanged** — they are persisted and
threaded through the sim harness. Display names only:

| Id | Old name | New name |
|---|---|---|
| `sig-read-opponent` | Read the Opponent | **Read the Entrails** |
| `sig-press-the-point` | Press Fate | **Press Fate** (keep) |
| `sig-second-wind` | Second Wind | **Second Wind** (keep) |
| `sig-overwhelming-argument` | Overwhelming Argument | **The Stilling** |
| `sig-conviction-strike` | Conviction Strike | **The Oath Kept** |
| `sig-disarming-plea` | Disarming Plea | **The Open Hand** |
| `sig-rallying-blow` | Conclusion | **The Butcher's Bill** |
| `sig-clever-gambit` | Clever Gambit | **Cold Counsel** |

Every one is written as an **act of will paid out of the self** (§4.2). Phase
44c MAY substitute an equal-register name without reopening this spec,
provided it satisfies §3 and NL-8; it may not keep a V-1/V-2 name.

### §5.6 [RULING] The copy canon: VITAE / STANCE / MORALE

Supersedes the bearings **Copy canon** entry.

| Term | Ruling |
|---|---|
| **VITAE** | **SURVIVES.** Latin, bodily, already correct. Never HEALTH, never HP in player-facing copy. |
| **STANCE** | **SURVIVES.** Plain, physical, threaded through the dice model and spec 33's stance checks. Never POSTURE, never GUARD. |
| **MORALE** | **RENAMED → GRACE.** MORALE is not out of register, but it is *wrong*: the meter measures compassion ↔ cruelty (spec 10), not fighting spirit, and it renders today as "MORALE · LEDGER" with the gloss "resolve to walk". GRACE names what the meter actually holds, is native to the Parish, and gives the mercy path a word. Bands: **In Arrears** (≤ −34) · **Indifferent** · **In Grace** (≥ +34). |

The engine field `moralMeter` **does not rename** — presentation only, no
migration (§0.4). The character screen's history list becomes **THE
ACCOUNT**; the `/memoir` tab becomes **THE LEDGER**; the REMAINS section keeps
its name.

### §5.7 [RULING] Enemies — 44e is a narrow pass, not a sweep

The Profane Canon already re-voiced every enemy's *cards*, and the 56-name
roster was already dark fantasy before it. Behavior is untouched; names only.
Exactly one rename is required:

| Enemy | Ruling |
|---|---|
| **The Incompleteness** | **RENAME → The Unfinished.** An abstract-noun name (NL-2) borrowed from mathematics. *The Unfinished* keeps the meaning, matches its shipped siblings (*The Unnameable*, *The Abortive*, *The Frayed One*), and is the only roster change. **Its L110 calibration weights (0.21 / 0.232 / 0.271 / 0.326) are untouched — this is a display-name change and nothing else.** |
| **The Sophist** | **KEEP** — NL-9 proper-noun carve-out; he is a named person (Protas), the Aporia's narrator, and spec C-01 is built on him. |
| **The Abortive** | **KEEP** — reads as folk horror on its face regardless of etymology. |
| **The Index / The Doorwarden / The Frayed One** | **KEEP** — all §2.4-native. |

Enemy *archetype* ids are RATIFIED unchanged (§1.2).

### §5.8 [RULING] World, places and minigames

- **Node ids do not change.** `fv-*`, `W-01`, map-event ids and route keys are
  referenced by the route-audit tooling and by tests, and are invisible to the
  player. 44f renames **display names only**. This is a deliberate
  risk-reduction ruling and it overrides 44f's "rename via the 44a map"
  instruction *for ids* — the map still carries display names.
- **The Aporia KEEPS its name** — NL-9, and the Profane Canon already ratified
  it by shipping `the-aporia` as a live enemy archetype.
- **The three minigame names are RATIFIED as shipped:** The Gleaning
  (gathering) · The Reliquary (loot-cache) · The Boy's Almanac (quest board).
  All three are already §2.4-native.
- **The rest node (Phases 52c/52d) is named here**, as 44f's row asks. The
  node is **The Confessor's House**; its three offers are **the Hearth**
  (`rest`), **the Anvil** (`anvil` — HONE/TEMPER, §4.4), and **the Shears**
  (`cut` — card removal). *The confessor's shears* is already the Profane
  Canon's own name for the removal encounter, so this is ratification, not
  invention. Working ids (`rest` / `anvil` / `cut` / `RestChoice`) are
  unchanged. **If 52e has not shipped when 44f runs, retheme nothing about
  rest and say so** — that instruction from 44f's row stands.
- **The starting region** is a coastal parish the sea is taking; 44f names the
  specific settlements under NL-18. This spec deliberately does not name them
  — that is authored content, not charter.

### §5.9 [RULING] What Phase 44a must build and lint

1. `docs/retheme-map.json` carrying **display-name** pairs for every ruling in
   §5.2, §5.5, §5.6, §5.7, §5.8, plus the id pairs explicitly permitted
   (`tf-` → `ht-`, the §5.2.2 effect ids).
2. Lexicon registrations in `docs/lexicon.json` for every retired term: the
   fifteen of §5.2, the six rank names, and the V-1 word list of §2.2. The
   lint (`scripts/check-lexicon.mjs`, already CI-wired) is the retheme's
   permanent guard.
3. **The NL-8 collision lint** — no card, enemy, place or NPC name may be or
   begin with a registry keyword, a card-type word, a rank word, a stance
   word, or a locked-system word. Run it over the *new* names before 44c-44g
   land, not after.
4. **The NL-4 / NL-5 lint** — no numerals, colons or parentheses in any name.
5. **The V-1 lint** — the philosophy word list, with an allowlist of exactly
   the NL-9 survivors (`Aporia`, `Sophist`).
6. **Zero renames applied.** 44a ships the map and the guard only, as its row
   requires.

**§5.9.1 [RULING] Phase 44c is much smaller than its row believes.** The row
cites `achilles-and-the-tortoise`, `circular-reasoning`, `straw-mans-jab`,
`memento-mori`, `the-closing-word` — **none of these cards exist**; commit
`84ef85b` deleted the entire spec-32 library. Every one of the 57 shipped
player cards already satisfies §3. What is actually left for 44c: the rank
ladder (R-14), the card types (R-9/R-10), the HAUNT class (R-13), the
signature names (§5.5), the sandbox/retired-verb fixture cards
(`src/test-utils/retired-verb-cards.ts`), and the dead id-keyed engine hooks
and test fixtures that still spell the old names in comments and strings.

---

## §6 — The morality system

**§6.1 [RULING] Spec 10 (the moral-difficulty meter) is KEPT and re-skinned.**
Dark fantasy is a stronger home for a morality meter than philosophy was —
the whole genre runs on what a desperate person is willing to do. Nothing
mechanical changes: single integer, `[-100, +100]`, `shiftMoralMeter`, the
±1/±5 bands, the friendship +1, the "evil = more XP and more items" reward
rule, visible to the player. The **display name becomes GRACE** (R-15), with
bands **In Arrears / Indifferent / In Grace**. In-world: the Parish keeps an
account of you whether you believe in it or not.

**§6.2 [RULING] Spec 14 (the alignment cube) is KEPT and re-skinned.** The
shape survives entire: three orthogonal axes, integers `[-100, +100]`,
`±34` bucket thresholds, 27 cells, enemy alignments, the outlook-driven AI
bias, and the dialogue/skill gates. Only the vocabulary moves. The cube's
display name is **THE OATHS** — three things your conduct swears whether you
mean to or not.

| Engine axis (unchanged) | New name | Poles: low ◀ mid ▶ high |
|---|---|---|
| `epistemology` | **CREED** | Faith ◀ Doubt ▶ Evidence |
| `outlook` | **AUGURY** | Dread ◀ Endurance ▶ Hope |
| `scope` | **TROTH** | Self ◀ Kin ▶ Saints |

Justifications: *Creed* is what you take on trust and is native to a parish;
its high pole is **Evidence**, not "Logic" (V-1), which also ties the axis to
the trial archetype, where MARK is entered evidence. *Augury* is disposition
read as a prophecy about yourself — the omen-choir's whole business — and
avoids collision with the OMEN keyword. *Troth* is the archaic word for whom
you are pledged to; its poles run from the self, through kin, to the dead
saints the Parish still bills you for.

**§6.2.1 [RULING] The 27 cells' content is re-skinned, not re-shaped.** Field
by field:

| Field | Was | Becomes |
|---|---|---|
| `philosopher` | A real-world philosopher | **The damned exemplar** — an in-world figure who held this position and what it cost them |
| `literaryCharacter` | A literary character + work | **The cautionary tale** — a Parish story and where it is told |
| `fallacies` (3) | Logical fallacies | **The three besetting sins** — same shape (`name` / `example` / `rationale`), same count, same wiring |

The `AlignmentFallacy` type keeps its fields; only the type name and the
authored content change (`AlignmentFallacy` → `BesettingSin`). The four
fallacy-sourced skills and three fallacy-sourced effects (Phase 44 of the old
plan: `appeal-to-consequences`, `nirvana-fallacy`, `pascals-wager`,
`appeal-to-fear`, `debuff_no_true_scotsman`, `buff_special_pleading`,
`debuff_category_error`) are re-authored as **sins** under §3 — they are the
single most V-1-violating content in the repo.

**§6.2.2 [RULING] Persisted keys do not move; the module does.** The
`GameState.philosophicalAlignment` field key, the `SHIFT_PHILOSOPHICAL_ALIGNMENT`
action, and the 27 cell ids (`logic-optimistic-individual`, …) are persisted
or migrator-visible. **They stay** — no `GAME_STATE_VERSION` bump on
morality's account. The *module* `src/Philosophy/` renames to `src/Ledger/`
(internal only, zero persisted-state risk, and it clears the last
philosophy-named directory). `docs/philosophy.md` → `docs/oaths.md`.

**§6.3 [RULING] The two systems stay orthogonal.** Spec 14's Q1 answer
("`moralMeter` and `philosophicalAlignment` are intentionally orthogonal")
survives the retheme unchanged, and reads better in the new vocabulary: a
soul in Dread can still be In Grace.

**§6.4 [RULING] The successor to "your worldview is a mechanical input."**
This is the line bearings parked for Phase 42, and it is what keeps the
product an RPG rather than a deckbuilder. The successor premise, for
`spec.md` and bearings (Phase 44i):

> **What you owe, and to whom, is a mechanical input.**

THE OATHS (CREED × AUGURY × TROTH) and GRACE both gate content, bias enemy
behaviour, and change what the world offers you — exactly as the cube and the
meter do today. The mechanic that made this an RPG is untouched; only the
question it asks has changed from *how do you know* to *what do you owe*. That
is the whole pivot in one sentence, and it is why the pivot is cheap.

---

## §7 — What "campaign" means

**§7.1 [RULING] DESCRIPTIVE. "Campaign" describes the game we already have.
It is not an ask for run-based or meta-progression structure, and no phase in
the 44 series may build one.**

Reasoning:

1. T's own framing — *"an easy pivot"*, *"not that different from what we
   already have"* — is a cost claim. A roguelike meta-layer is not an easy
   pivot; it is a new game mode, a new save shape, and a `GAME_STATE_VERSION`
   epic.
2. **The campaign already exists.** The Profane Canon's `PRESET_LINEAGE` is
   a machine-checked, three-snapshot arc of *one deck evolving* — start weak,
   earn rewards, remove starters at a removal encounter, keep earning. That
   is a deckbuilding campaign, and it is already enforced by a law with a
   test. Add the continent progression (Coastal → Northern Forest → the
   Aporia → the last continent), quests, morality, and a persistent
   `GameState`, and the word "campaign" is already true.
3. The 52c/52d rest node adds the last missing campaign beat — a priced,
   one-shot choice between healing, upgrading and trimming — without any meta
   layer at all.

**§7.2 [RULING] The door stays open, and here is where it is.** T's *"opens
up A LOT of doors"* is honoured by *not spending them here*. Run/meta
structure is filed as a **phase candidate**, not a phase: see §10. If T later
wants it, the natural shape is a run-scoped wrapper over the existing preset
lineage (each run starts Threadbare and earns toward Apostate), which the
LINEAGE LAW already describes — so the option is cheap to keep and expensive
to pre-build.

**§7.3 [RULING] Therefore "campaign" is a word in `spec.md`, not a system.**
Phase 44i writes the product shell to say *dark fantasy deckbuilding RPG
campaign* and points the word at the arc in §1.4. No engine work.

---

## §8 — What does NOT change — REPEALED (2026-09-02)

> **VOID.** THE BIG NUMBERS REWRITE (2026-09-02,
> `plan/2026-09-02-big-numbers-overhaul.prompt.md` §3, law L30) repealed this
> whole section. It was a promise that spec 34 changed only words, and that
> promise expired the moment a later pass was authorised to change the numbers:
> the VITAE formulas, the threat budget, the colour-match bonus, the pip
> bonuses, the RUPTURE cap, the concede ladder, the enemy stat law, the deck
> laws and the balance bands all moved on 2026-09-02. §8.5's engineering
> rigour (hermetic tests, the verify gate, the nexus hard rules, the lexicon
> lint) still holds — but it holds because those are engineering rules, not
> because this section says so. Read the rulings below as a record of what the
> 44-series itself declined to touch.

**§8.1 [RULING] Mechanics.** Nothing in this spec changes a payload, a
constant, a probability, a resolver, an event, or an AI rule. Specifically
untouched: Hazard-Pattern Combat and its resolver; the round structure;
stances, rungs, stance checks, the escalation clock, branches, the coveted
die; the effects engine; equipment; progression; the Fate engine.

**§8.2 [RULING] Keyword *behaviour*.** Every renamed keyword keeps its exact
mechanic, magnitude, trigger, and stacking rule. R-1 through R-15 are word
swaps. If a rename tempts a behaviour change, that is a `/deck-tuning`
question, not a 44-series one.

**§8.3 [RULING] The dice model.** Four dice, the face table, the colour law,
Press Fate, KINDLE, Reserve, pips, overflow, the 7-object ceiling, die gear,
HONE/TEMPER, `SPECIAL_FIRES_ON_USE`, `SPECIAL_CONVICTION_DEFAULT` — all
untouched. Only the *word* SPECIAL becomes BOON (R-8).

**§8.4 [RULING] The minigame doctrines.** Gathering greed < restraint <
skill; Loot-cache informed > blind > coward; Quest Board naive-finishes /
deliberate-finishes-well; Hazard → CDR-0006 targets. Unchanged. (Rest's
posture-gradient doctrine is voided by Phase 52e, not by this spec.)

**§8.5 [RULING] Engineering rigour.** Hermeticity and determinism (injected
RNG; no disk/network/TTY in engine tests), the verify gate, the deploy gate,
the nexus hard rules, `GAME_STATE_VERSION` migration discipline, and the
lexicon lint. THE UNSHACKLING was about design law, not engineering.

**§8.6 [RULING] Balance.** This spec measures nothing and tunes nothing. The
Profane Canon's suspended balance bands (issue #183) are re-armed by
`/deck-tuning` after Phase 43 lands an objective function — not here.

**§8.7 [RULING] The strike stays alive.** Cards MAY deal raw enemy-HP damage
(THE UNSHACKLING item 1, executed by Phase 41). This spec adds no damage to
any card and forbids no damage on any card. The Profane Canon's internal
"THE STRIKE stays DEAD" note is a *statement about what that rework chose*,
not a live law, and it does not survive as one.

---

## §9 — Downstream obligations, phase by phase

| Phase | Must obey | Row corrections this spec makes |
|---|---|---|
| **44a** | §5.9 (the map, the three lints, zero renames), §0.4, §3 | — |
| **44b** | §5.2 (all 15), §5.2.1 cleanups, §5.2.2 ids, §5.3, §5.4, §4.1 (LOCKED GUARD = do not touch) | Row says "~29 registry keywords"; the live count is **42** `KEYWORD_GLOSS` rows + 8 system terms (§5) |
| **44c** | §5.2 R-9/R-10/R-13/R-14, §5.5, §3.2 | Row's five named cards **no longer exist** (§5.9.1); scope shrinks to ranks, types, HAUNTs, signatures, fixtures |
| **44d** | §5.1.5, §5.1.6, §5.2.1 (`THEME_KEYWORDS`) | Row says "10 theme names"; there are **6 archetypes + curse** |
| **44e** | §5.7 (one rename: The Incompleteness → The Unfinished), §8.1 | Row implies a sweep; it is a single-name pass |
| **44f** | §5.8 (ids frozen, display names only; the rest node named), §3.4 | Row's Night-Watch caveat stands as written |
| **44g** | §1 (the whole setting), §2, §3.4 | Heaviest creative phase; §1.5 is its guardrail |
| **44h** | §6 entire | Row's "expected to be re-skin-and-keep" is **confirmed** |
| **44i** | §6.4 (the successor premise), §5.6 (copy canon), §7 (campaign is descriptive), §2 | Also updates the bearings **Voice** and **Copy canon** entries per §2.1/§5.6 |

---

## §10 — Residue (for the orchestrator to file)

Items this spec deliberately did not settle, and where they belong.

**To `plan/AUDIT.md`:**

1. **`specs/README.md` needs a row for spec 34.** This phase's file ownership
   forbade editing it.
2. **The product name.** "Axiomancer" is philosophy-native by V-1, and this
   spec exempts it under NL-9 (proper-noun carve-out) and **rules KEEP** — but
   a whole-product pivot is exactly when a title gets reconsidered, and that
   is a T-level decision, not a loop one. **`[needs-user-call]` at the next
   `/oversight`.** Everything in 44a-44i works unchanged either way.
3. **Build-plan row drift** (all three corrected in §9 and re-listed here so
   the rows themselves get fixed): 44b's "~29 keywords" (actually 42+8),
   44c's five named cards (deleted by `84ef85b`), 44d's "10 theme names"
   (actually 6 + curse).
4. **Dead id-keyed engine hooks** from the retired spec-32 library
   (`zoneHas(state, 'achilles-and-the-tortoise')`, `the-closing-word`'s
   `concedeAt` comments, `circular-reasoning` references in
   `combat.engine.ts` and `effects.ts`). The Profane Canon's own §5 already
   flags these as "dead code pending a cleanup sweep"; the retheme makes them
   *misleading* as well as dead. Not this phase's to delete.
5. **Stale registry rows** surfaced while reading: `SYSTEM_TERM_COVERED_BY`
   names a `CLARITY` keyword with no `KEYWORD_GLOSS` entry; mobile test
   fixtures still deck `slippery-slope` / `straw-mans-jab`, which no longer
   exist.

**To `plan/PHASE_CANDIDATES.md`:**

6. **Run / meta-progression structure** — the door §7.2 deliberately leaves
   open. Shape if ever wanted: a run-scoped wrapper over the existing
   `PRESET_LINEAGE` (every run starts Threadbare, earns toward Apostate).
   Blocked on a T decision; do not start it.
7. **Author the Parish's places** — §5.8 froze node ids and named the rest
   node but left the coastal settlements to 44f. If 44f finds that too thin a
   brief, a `/world-spec` session is the right instrument.
8. **The 27 damned exemplars and 81 besetting sins** (§6.2.1) are a
   substantial authoring job hiding inside 44h. If 44h runs long, splitting
   the cell content into its own content phase is the clean cut.

---

## §11 — Acceptance

- [x] Tone + voice register ruled, and the bearings entry superseded **by
      name** (§2.1).
- [x] The naming law stated as rules a codemod author and a prose author can
      both follow, with a forbidden list (§2.2, §3).
- [x] Concept-level rename map covering **all 42 registry rows and 8 system
      terms**, not only the seven named in the phase row (§5).
- [x] The morality system ruled — kept, re-skinned, replacement axis
      vocabulary named (§6).
- [x] VITAE / STANCE / MORALE each ruled individually (§5.6).
- [x] "Campaign" ruled, one recommendation, nothing built (§7).
- [x] What does not change, stated plainly (§8).
- [x] **Conviction, the Surge meter and the Dice system each have an explicit
      home in the fiction** (§4.2, §4.3, §4.4), all three names kept, no
      `GAME_STATE_VERSION` check owed (§4.1).
- [x] Every ruling numbered and greppable as `spec 34 §N` (§12).
- [x] The Mörk Borg delivery register folded in, R-C/R-F art reconciliation
      recorded, and the R-D pipeline it executes under stated (§2.5, Phase
      74 / N-1).
- ~~At least one hermetic e2e test under `src/<Module>/e2e/` covers the
  change.~~ **Struck:** this spec is a design charter and touches no runtime
  code. The tests belong to 44a-44i; 44a's lints (§5.9) are this spec's
  enforcement mechanism.

## §12 — Index of rulings

| Ruling | § |
|---|---|
| The setting is The Parish | §1.1 |
| The seven estates ratified as shipped | §1.2 |
| The player is the Almoner | §1.3 |
| The arc is threadbare → pilgrim → apostate | §1.4 |
| Five things the fiction may never claim | §1.5 |
| Voice: bearings' entry ratified + amended, by name | §2.1 |
| Eight forbidden registers (V-1 … V-8) | §2.2 |
| One clause per line, present tense | §2.3 |
| The six lexicons | §2.4 |
| The Mörk Borg delivery register, MB-1 … MB-8 (R-C/R-F reconciled) | §2.5 |
| The pipeline this register executes under (R-D) | §2.5.9 |
| The Naming Law, NL-1 … NL-19 | §3 |
| Locked names all kept; no migration owed | §4.1 |
| Conviction housed as testimony | §4.2 |
| The Surge housed as the third bell | §4.3 |
| The Dice housed as the bones | §4.4 |
| Only the locked three get metaphysics | §4.5 |
| The seven survivors, unchanged | §5.1.1 |
| Twenty-eight more survivors, unchanged | §5.1.2 |
| System-term survivors | §5.1.3 |
| BODY / MIND / HEART survive | §5.1.4 |
| Six archetypes + curse ratified | §5.1.5 |
| Three presets ratified | §5.1.6 |
| R-1 … R-15, the fifteen renames | §5.2 |
| Consequential cleanups 44b owns | §5.2.1 |
| Effect ids move with their keywords | §5.2.2 |
| Systems glossary rulings | §5.3 |
| CURSE ≠ HEX; both survive | §5.4 |
| Signature skills: ids frozen, eight new names | §5.5 |
| VITAE keep · STANCE keep · MORALE → GRACE | §5.6 |
| Enemies: exactly one rename | §5.7 |
| World: node ids frozen; the rest node named | §5.8 |
| What 44a must build and lint | §5.9 |
| 44c is much smaller than its row believes | §5.9.1 |
| Spec 10 kept and re-skinned as GRACE | §6.1 |
| Spec 14 kept; THE OATHS; CREED / AUGURY / TROTH | §6.2 |
| Cell content re-skinned, not re-shaped | §6.2.1 |
| Persisted keys frozen; module → `src/Ledger/` | §6.2.2 |
| The two morality systems stay orthogonal | §6.3 |
| "What you owe, and to whom, is a mechanical input" | §6.4 |
| Campaign is DESCRIPTIVE; build no meta layer | §7.1 |
| Where the door stays open | §7.2 |
| Mechanics unchanged | §8.1 |
| Keyword behaviour unchanged | §8.2 |
| Dice model unchanged | §8.3 |
| Minigame doctrines unchanged | §8.4 |
| Engineering rigour unchanged | §8.5 |
| Balance untouched | §8.6 |
| The strike stays alive | §8.7 |
