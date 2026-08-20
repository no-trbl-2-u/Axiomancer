# North Star — Mörk Borg as the delivery register

> **Status:** RULED — the five forks below were put to T directly in the
> session `new-north-star.prompt.md` triggered (2026-08-20) and T picked an
> option for each. The doctrine text derived from those rulings (§2–§5) is
> DRAFT-FOR-RATIFICATION: it becomes a spec 34 amendment only after T reads
> this file and says so, the normal way every `plan/` decision becomes a
> phase. Nothing in the tree was edited by this session except this file.
>
> **Provenance:** T via `/oversight` 2026-08-20 ruled the North Star
> (Mörk Borg) and the product name (Miserere Mei, Deus — closed, Phase 67);
> everything else was deferred to this session and is settled below.
>
> **Doctrine check:** deck/dice mechanics untouched (the trigger prompt's
> own boundary); the LOCKED MECHANICS carve-out, spec 34 §8, the verify and
> deploy gates, and the Phase V Woodcut Codex masterplan (per ruling R-C)
> all survive this file unchanged.

---

## §1 — The five rulings (T, this session)

| # | Question | T's ruling |
|---|---|---|
| **R-A** | Hard pivot or evolution? | **Evolution.** The Parish, the Profane Canon names, and spec 34's setting stay. Mörk Borg's brutality, minimalism and irreverence become the *delivery register* — how the game speaks, not what it is. No doom clock, no reopened setting, no renamed cards. |
| **R-B** | How much irreverence, where? | **Dial 1, everywhere.** One global setting: dry, flat, darkly funny by indifference only. The prose never notices its own absurdity, never winks, never signals a joke. |
| **R-C** | Does it touch the visual layer? | **Prose only.** The Phase V Woodcut Codex masterplan (FromSoft × Inscryption × illuminated manuscript, T-ruled 2026-08-08) stands untouched. This doctrine governs narration, encounter content, and content pipelines — zero art-direction work. The trigger prompt's deliverable #2 (art brief) is discharged as out-of-scope by this ruling. |
| **R-D** | How much of the per-item approval gate survives? | **Full authority.** The loop and its skills may author and ship NPCs, regions, story beats, encounter copy and narration directly — bounded by spec 34 + this doctrine, guarded by lints and spot-checks (§4). T audits after the fact via `/digest` and `/oversight`, same as code. |
| **R-E** | Shipped prose: re-voice or grandfather? | **One re-voice pass.** A dedicated phase sweeps all shipped player-facing prose into the new register. Names stay (R-A); sentences shorten and harden. The game speaks with one voice. |

Structural note recorded during the session: the Parish premise (a debt
machine that grinds on forever) is *anti*-apocalyptic, and Mörk Borg's
doom-clock (a scheduled, certain ending) is its opposite. R-A deliberately
does **not** import the doom clock. If T ever wants "the debt comes due" as
a campaign structure, that is a new brainstorm, not an implication of this
file.

---

## §2 — The delivery register (proposed spec 34 §2 amendment, MB-1 … MB-8)

Spec 34 §2's register ("terse, archaic-flavored, cold and old"), its V-1…V-8
bans, the six lexicons (§2.4), and the entire Naming Law (§3) are
**unchanged**. This register governs *sentences*, never *names*. The rules
below extend §2.3 from card/telegraph text to all player-facing prose —
event copy, world-map descriptions, enemy descriptions, dialogue, screen
copy.

Rules marked lintable are mechanically checkable; the rest are
**[judgement]**, reviewed per §4.

- **MB-1 — the knife law** *(lintable: length)*. Narration sentences run
  short — target under twelve words, hard ceiling twenty. One subordinate
  clause per *paragraph*, not per sentence. A semicolon in player-facing
  prose is a defect (extends spec 34 §2.3 beyond card text). Full stops are
  the register.

- **MB-2 — indifference** *[judgement]*. The narrator states consequences
  as facts and never sympathizes, never warns twice, never editorializes.
  "The water climbs," never "beware the water." Danger is described the way
  a ledger describes arrears.

- **MB-3 — the Dial-1 humor law** *[judgement]*. Humor arrives only by
  deadpan juxtaposition of the mundane and the terrible, and every funny
  line must also be literally true in-world. No irony markers, no
  self-reference, no fourth wall, no jokes *about* the grimness. If a
  reader can't tell whether the line meant to be funny, it is compliant.

- **MB-4 — second person and the imperative are permitted**
  *[judgement]*. "Pick a door." "Wade or don't." The V-7 ban stands
  untouched: second person may instruct and price; it may never flatter
  ("you are the last hope of…" stays dead).

- **MB-5 — scenery is priced** *[judgement]*. A descriptive beat gets at
  most one line of pure atmosphere; the next line must carry a stake, a
  price, or an instruction. Scenery that costs the player nothing to ignore
  is cut.

- **MB-6 — no adjective without a decision** *[judgement]*. An adjective
  survives only if removing it would change what the player does or owes.
  "Old songs" earns its place if old means *claimable*; otherwise the songs
  are just songs.

- **MB-7 — brutality is stated, not performed** *[judgement]*. The
  register never escalates typographically (V-6 stands: no exclamation
  marks, no ALL-CAPS inside prose). The most terrible line in the game
  should scan as flatly as a receipt.

- **MB-8 — vocabulary discipline is unchanged** *(lintable — already
  wired)*. The six lexicons, the V-bans, and the NL naming law govern word
  choice exactly as before. This register is a sentence-shape doctrine
  layered on top of them, and collides with none of them.

---

## §3 — Voice guide: before/after against shipped copy

Real shipped lines, not invented samples. The "after" column is
illustrative of the register, not a pre-approved rewrite — the re-voice
phase (R-E) authors its own lines under §2.

| Source | Shipped | Under the register |
|---|---|---|
| `fishing-village.layout.ts:112` | "The tide turns without warning here. Linger and the water climbs past your knees." | "The tide keeps its own ledger. Linger and be collected." |
| `fishing-village.layout.ts:119` | "A cave that breathes with the tide. Old songs echo within." | "The cave breathes with the tide. The songs inside are old, and unclaimed." |
| `combat.mock.ts:12` (enemy) | "She traded her reflection to the tide for the right to keep yours." | "She pawned her reflection. The tide holds the lien on yours." |
| `rest.copy.ts:11` (placeholder voice by its own comment) | "The node is spent the moment you stopped here. Pick one — there is no walking back out." | "You stopped. That is already paid for. Pick a door." |
| `fishing-village.layout.ts:181` | "A shrine to the four winds. Prayer flags snap in the gale." | **Unchanged — already compliant.** Proof the register is a tightening, not a rewrite-everything mandate. |

What the table shows: the Parish's conceits (ledgers, liens, collection)
carry over intact — the *sentences* get shorter, the sympathy drains out,
and the humor, where it appears, is indifference (MB-2, MB-3).

**Encounter content under the register** *[judgement]*: every authored
choice states its price flatly and up front; no option is free and none
pretends to be; outcomes are delivered without consolation. This is
authored-content guidance only — spec 34 §8 still forbids this doctrine
from touching a payload, constant, or probability.

---

## §4 — The pipeline (executes R-D)

The gate that moves: **per-item human approval before authoring** becomes
**lint-and-audit after authoring**, for narrative and world content.

| Surface | Gate today | Gate after R-D | Replacing guardrail |
|---|---|---|---|
| NPCs, regions, story beats, encounter copy | Attended Socratic spec session per item (`story-spec` / `world-spec` / `character-spec`), T ratifies in-session | Loop authors and ships via normal phases/ticks; the design skills gain an unattended mode (they still write spec files — the file is the record, not the permission) | Lexicon lint (CI-wired, word lists extended); new register lint (MB-1's mechanical subset: sentence length, semicolons, `!`, caps-in-prose over copy files); playtester spot-check on every shipped content phase; `/digest` tone line; `/oversight` audit |
| Narration / screen copy | Same as above + copy-location rules | Same as above | Same, plus the existing copy-canon CI rejections |
| Cards / keywords | Already full authority (THE UNSHACKLING) | Unchanged | Unchanged |
| Art | Phase V masterplan, T-ruled | **Out of scope** (R-C) | — |
| This doctrine itself, spec amendments, anything LOCKED | T | T | `[needs-user-call]` as ever |

What T still holds: `/oversight` remains the veto venue and the only place
questions are asked; irreversible or outward-facing actions still stop; and
identity *retcons* (rewriting the who-someone-is of already-shipped canon,
as opposed to adding canon or re-voicing sentences) surface at `/oversight`
by default — see open question Q-1.

**What T provides** (the trigger prompt's third deferred item), now
minimal by R-B/R-C: (1) read this file and ratify or edit it; (2) answer
the open questions in §6; (3) optionally, any Mörk-Borg-adjacent prose
references beyond the book itself T wants honored. No art references, no
budget decision, no new approval checkpoints are needed.

---

## §5 — Proposed queue work (for `/expand` or the next `/oversight` to promote — none started here)

1. **N-1 — Ratify + amend.** Fold §2 into spec 34 as its §2.5; update the
   bearings **Voice** entry to cite it; add the unattended-mode posture
   note to the three design skills. Small, docs-only.
2. **N-2 — The register lint.** MB-1's mechanical subset wired into the
   existing lexicon-lint path (`scripts/check-lexicon.mjs` or a sibling).
   Ships with or immediately after N-1 — R-D's authority is conditioned on
   this guard existing.
3. **N-3 — The re-voice pass (R-E).** One phase, all shipped player-facing
   prose, names untouched. Sequenced *after* 44f/44g so surfaces aren't
   swept twice — 44f/44g author their content under §2 natively, and N-3
   sweeps what they don't touch. Also after Phase 67 (the rename) to avoid
   churning the same copy files twice.

---

## §6 — Open questions for T

- **Q-1 — retcon boundary.** Does R-D's full authority extend to rewriting
  the *identity* of canon the loop already shipped (who an NPC is, what a
  region means), or only to adding canon and re-voicing sentences? Default
  until answered: additive + re-voice only; retcons go to `/oversight`.
- **Q-2 — sequencing.** N-3 is proposed to run after 44f/44g and Phase 67
  (§5). Object if the re-voice should jump the queue instead.
- **Q-3 — the shell.** Does the register govern store metadata, the title
  screen, and other product-shell copy (Phase 67's surfaces)? Default: yes.
- **Q-4 — references.** Any prose touchstones beyond the Mörk Borg book
  itself (e.g. Cormac McCarthy, the Bible's ledger books, Best Left
  Buried) the register should be calibrated against?

---

## §7 — Receipts (scout pass, 2026-08-20)

A `scout` pass verified Mörk Borg's actual design signature against the
book's coverage and community reception. Verdict: **§2's characterizations
hold**, with two caveats recorded below. Condensed findings, one source per
claim:

1. **Prose register — verified.** Terse, second-person, evocative rather
   than explanatory; horror stated flatly ("Your soul and your silver are
   your own and equally easy to lose"). Won the 2020 ENnie for Best
   Writing — the register is recognized craft, not accident.
   (rpgbot.net/mork-borg-a-review; freeleaguepublishing.com/games/mork-borg)
2. **Humor — verified as deadpan, with a caveat.** Jokes sit inside tables
   and ability text at the same volume as the horror; the book never breaks
   register to wink ("666" on the Heretical Priest's equipment chart).
   *Caveat:* readers do perceive the authors' hand — reception notes
   "underlying subversive humor." T's Dial-1 ruling (R-B) is therefore
   deliberately *drier than the book's own median*, and that is the ruling,
   not an error. (vocal.media "The Unrelenting Cruelty of a Dark and Dying
   World"; en.wikipedia.org/wiki/Mörk_Borg)
3. **Doom clock — verified as identity-central, and deliberately NOT
   imported.** The Calendar of Nechrubel guarantees the apocalypse ("The
   game and your lives end here. Burn the book."). R-A's refusal of it is
   a real divergence from the source, made knowingly — the Parish's endless
   debt is the opposite structure. (enworld.org review "A Doom Metal Album
   of an OSR RPG"; morkborg.exlibrisrpg.com/tags/miseries)
4. **Reception — both halves verified.** Praise: "light on rules, heavy
   everything else," four ENnies. Criticism lands hardest on exactly what
   R-C excluded: the layout is documented as migraine-inducing and
   screen-reader-hostile, enough that a free text-only "Bare Bones"
   edition shipped in response. R-C (prose only, Woodcut Codex stands)
   therefore adopts MB's most-awarded element and dodges its
   most-criticized one. The "style over substance / edgelord" critique is
   also real — MB-5 and MB-6 (brutality must carry stakes) are this
   doctrine's guard against inheriting it.
   (diceexploder.substack.com "Accessibility and Graphic Design";
   watcherdm.com/2023/09/02/mork-borg-review)
5. **Contrast case — verified.** Blasphemous-style church-gothic kneels
   (guilt, penance, a meaning-saturated punitive cosmos); Mörk Borg shrugs
   (an indifferent cosmos, already lost). The Parish sits between: the
   machinery of faith without the faith. R-A + R-B read as: keep the
   Parish's furniture, adopt the shrug's *flatness* without its nihilism
   about meaning — what you owe still matters, which is the product's
   thesis. (frieze.com "How Video Game Blasphemous Embraces Catholic
   Gothic Tradition"; therpggazette.wordpress.com Mörk Borg review)

Open item from the scout: verbatim book-intro text could not be pulled
(reviews quote it second-hand). If the register lint or the re-voice phase
wants calibration lines straight from the book, they should be transcribed
from a licensed copy — filed under Q-4's reference question.
