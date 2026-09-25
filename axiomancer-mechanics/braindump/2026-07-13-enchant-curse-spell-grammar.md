# Enchant/Curse Spell Grammar — 2026-07-13

## Surface question

Should more spells behave like enchantments/curses — unpaid: 3-round
duration, 1–3 intensity; paid: rest-of-combat, 1–3 intensity — with the
remaining spells following free=seed / paid=mechanic-payoff? (Owner: "I'm
just not currently seeing the big picture right now. Either cards are not
functioning the way they're supposed to, I'm not getting it, or it's just
boring. Or some mix of them.")

## Better question surfaced

**The proposed model is already the ratified design.** Spec 32 v4 §2:
enchant/disenchant FREE = timed 3-round instance, PAID = same passive
permanent. The FREE-line law (2026-07-10 amendment) already mandates
free=seed; PAID is already "the real payload." So the real question is:

> **Why doesn't the shipped library FEEL like the design that's on paper?**

Three grounded findings (verified against the live library + engine tests,
2026-07-13):

1. **It's not engine malfunction.** The enchant/disenchant machinery has
   green hermetic coverage for every clause of the v4 model: FREE timed
   instance in `tempZone` (3 rounds), temp instance fires the identical
   hook as the permanent, tick-out with `enchant-expired`, PAID promotion
   of a live FREE instance, unique-in-play
   (`themed-decks.engine.test.ts` §ENCHANT/DISENCHANT).

2. **Seed monotony.** The FREE-currency pass (EA-5) was executed as ONE
   identical seed verb stamped across a theme's spells. Census:
   affliction — 4 spells all `FREE: mark i1 d1`; control — 4 spells all
   `FREE: reveal the next stance`; echo — 4 spells all `FREE: mill 1`;
   oracle — 5 spells all `FREE: FORETELL 1`; forge — 4 spells all
   `FREE: +1 pip to every Reserve die`; charm — `rapport i1 d2` ×3 +
   `SWAY 1` ×2. Within a theme the free line is a single repeated button:
   the Gate-1 target P-TURN (≥2 live options per turn) is not served on
   the free axis, and the FREE half of every card face reads as the same
   card. The law fixed *filler* variety by installing *meaningful*
   monotony.

3. **The fresh-hand redraw was quietly fighting the seed→payoff arc.**
   Until 2026-07-13, the round boundary discarded the whole hand and drew
   6 fresh. A 1-round seed (`mark i1 d1`) whose payoff wasn't already in
   hand could never be *planned* — you seeded, the redraw ate your hand,
   and cashing the arc was draw luck. That is exactly the "cards are not
   functioning the way they're supposed to" feeling: the design promises
   an arc; the draw rule made arcs unplannable. The keep-hand rule
   (hand 5, refill instead of redraw — shipped this session) makes
   holding a payoff for next turn's seeds a real line for the first time.
   **Re-evaluate the "boring" verdict after playing with keep-hand.**

4. **Density.** In a 15-card preset, the enchantment and disenchant are
   1 copy each — ~2/15 cards are rules-of-the-board cards; everything
   else is transactional. The timed-vs-permanent fork the owner likes is
   nearly invisible at current density (you may see it once per combat).

## Prior art consulted

- **Slay the Spire — Powers:** the closest genre analogue to
  spell-vs-enchantment ratio. Decks run a minority of powers (~2–5 of
  ~25+); powers are prized precisely because each one *changes what your
  next turns mean* (Noxious Fumes makes skipping attacks right;
  Catalyst-style payoffs re-price every poison card). Reception folklore
  is consistent that power-heavy decks are fun when the powers create new
  decisions and degenerate/boring when they reduce to "play everything,
  then autopilot." I don't have a confident KB read on exact reception
  numbers here.
- **MTG — Curses (enchant player):** the direct "disenchant" analogue —
  persistent, attached to the opponent, no decision after landing.
  Widely-known reception: curses read great but table experience is
  set-and-forget; the fun is in the *reveal*, not the operation. Flag:
  this is memory, not a KB citation.
- **Dawncaster (kb:dawncaster) — persistence via frame keywords, not a
  power-card class:** (receipted 2026-07-10 cache,
  `plan/archive/2026-09-25-trim-t4/plan/tuning/2026-07-10-audit-evidence/cross-prior-art.md`; live KB
  unreachable this session). Persistence lives in *frame keywords* —
  Persistent, Charges, and especially **Lasting** ("extended by 1 turn
  whenever the card is played again", kb:dawncaster/keywords/lasting) —
  while most texture comes from condition-amplified one-line spells
  (Crossbow, kb:dawncaster/cards/0444; Flourishing Bow, cards/0676). The
  corpus buys rules-of-the-board feel *without* a large power-card
  class. Spec 32's Option B (condition-amplified grammar) was parked for
  the GLYPHS pilot on exactly this model.
- **Dawncaster — sentence diversity over vocabulary diversity:** the
  cache names the anti-pattern directly: repetition of *vocabulary* is
  healthy (median 12 cards/keyword), repetition of *sentences* is the
  disease — its seven DoTs each fire on a different clock
  (kb:dawncaster/keywords/bleeding (src-001), burning, poison, doom,
  brittle, infected). Our own telemetry is the reception evidence: top-2
  commons take >50% of all plays across four presets (cross-prior-art
  §1). Four identical `mark i1 d1` FREE lines are the same disease at
  the free tier.
- **Spirit Island — element-threshold auras:** persistent effects that
  scale with matched investment
  (kb:BoardGames/games/spirit-island/rules/actions) — evidence for
  intensity-by-investment over flat permanents.
- **No receipted ratio exists** for persistent-vs-transactional card
  density in comparable deckbuilders — the StS/MTG reads above stay
  memory-tier. KB wish to re-file once the corpus is reachable.

## Design directions on the table

### Option A — Density shift (the owner's proposal)
*(inspired by StS power-archetype decks)*

Promote 1–2 uncommons per theme from spell to enchant-type: FREE = timed
3-round instance, PAID = rest-of-combat, and add an **intensity axis
(1–3)** — replaying the timed line stacks intensity; PAID promotion locks
the current stack for the combat. Spells that remain spells keep the
strict seed/payoff split. Deck texture becomes ~5–6/15 rules cards.

**Trade-off:** more of the board plays itself; per-turn decision count
drops late-combat once passives are down. Directly tensions the
load-bearing doctrine "status effects are the MAIN fun" if the passives
*replace* active status play instead of amplifying it. Pricing law
(FREE ≈ 25–35% of points) needs an intensity-scaling clause.
**Telltale failure mode:** playtest transcripts where rounds 3+ are
"drop last enchant, end turn" — the wheel/dice tray idle while auras
drain the enemy. Watch statusPlays/round flattening in the sim matrix.

### Option B — Texture the seeds (keep the grammar, kill the monotony)
*(inspired by Dawncaster conditional grammar; the cheapest fix)*

Keep 5-spells+2-passives per theme, keep the FREE-currency law, but
mandate **seed diversity within a theme**: the same currency, deposited
differently — different magnitudes, placements, or conditions (e.g.
affliction: `mark i1 d1` / `mark i1 d2 if the foe is already poisoned` /
`mark ALL your DoTs' targets i1` / `mark i2 d1, RECOIL 1`). The free
choice becomes *which* seed, not *whether* to press the one button.

**Trade-off:** ~40 card edits + pricing re-arithmetic, no schema change;
doesn't address the owner's attraction to duration/intensity forks at
all — it doubles down on the transactional grammar.
**Telltale failure mode:** if free lines still feel samey after
differentiation, the boredom was never in the seeds — it's in the
payoff cadence, and Option A/C is the real answer.

### Option C — Rent-vs-buy curse grammar on status spells
*(inspired by MTG curses + the existing v4 promotion rule)*

Apply the owner's fork to the *status* spells themselves: the PAID line
of a DoT/control spell can **pin** its status — unpaid play applies the
normal timed status (d2–d4, i1–3); paid play applies it
combat-length (no calendar expiry, intensity still 1–3, DoT clocks per
EA-7 unchanged). Mechanically this unifies "spell that applies a curse"
and "disenchant" into one grammar; the existing tempZone/permanent-zone
promotion machinery already models it.

**Trade-off:** combat-length DoTs are a permanent drain — collides with
the expiry-Souls economy (no expiry = no Souls) and with PROLONG's whole
identity; needs a new pricing clause for "never expires."
**Telltale failure mode:** turn-2 pin becomes the only correct play and
fights become deterministic drains (the win-rate-curve suite catching
presets going flat is the alarm).

### Option D — LASTING: replay extends, nothing becomes permanent
*(inspired by Dawncaster's Lasting keyword — the receipted middle path)*

Keep the timed 3-round FREE instance as the ONLY way an enchant-class
effect exists; kill (or price way up) the permanent PAID line. Instead,
**replaying the card extends the live instance** (+duration) and the
PAID line **stacks its intensity** (1→3, the owner's axis). The board
state persists exactly as long as the player keeps feeding it — cards
stay transactional (they recycle, you keep drawing and playing them),
but the aura is continuous for a player who commits. Cross-prior-art
§4.2 already recommends Lasting as "what would finally make the timed
FREE-line enchant instances (spec 32 v4) matter."

**Trade-off:** removes the clean "buy it once" fantasy of the permanent
PAID line; upkeep-feel can read as a chore if extension windows are too
tight. Amends v4's "same magnitude, only duration differs" clause.
**Telltale failure mode:** players ignore the enchant entirely because
maintaining it costs more tempo than it returns — watch enchant uptime
% and replay rate in the playtest matrix.

## Decision / leaning

Still open — conversation deliverable. Sequencing note offered to the
owner: keep-hand (shipped today) changes the feel of the existing
grammar enough that the "boring" datum is stale; a playtest on keep-hand
before committing to A or C would separate "the arc was unplannable"
(fixed) from "the arc is dull" (needs A/B/C).

## Open questions

- Should timed enchant instances *stack intensity* on replay (the owner's
  1–3 idea) or stay flat as spec'd ("same effect and magnitude, only
  duration differs")?
- If Option A ships, what guards the "status is the main fun" doctrine —
  e.g. a lint that enchant-type cards must *amplify or trigger on* status
  play rather than deal/prevent damage independently?
- Does the expiry-Souls economy survive any grammar where effects stop
  expiring (Option C)?
- Density target: what fraction of a 15-card preset should be
  rules-of-the-board cards? (StS folklore says powers stay a minority.)

## Raw notes

- Owner verbatim: "free=seed, paid=mechanic/payoff" — this is word-for-word
  the FREE-line law + VISION.md's "the FREE line builds the engine" test.
  The design intent and the owner's instinct agree; the shipped execution
  (monotone seeds, redraw-wiped arcs, 2/15 density) is what diverged.
- The keep-hand rule shipped in this same session (COMBAT_HAND_SIZE 6→5,
  boundary refills kept hand) — cards you don't play or scrap now take up
  space, which also gives the scrap-for-Conviction outlet a real job.
- mechanics-expert verdict (this session): "the owner's proposal is ~80%
  the already-ratified spec 32 v4 grammar; the boredom evidence points at
  seed monotony and (now-fixed) redraw-wiped arcs, not at insufficient
  enchant density. Texture the seeds first; pilot a small density bump
  second." Confidence medium — Axiomancer-side findings live/high, genre
  ratios rest on the 2026-07-10 receipted cache + labeled memory.
- Spec-alignment flags from the expert: extending timed/permanent to more
  spells is an *amendment* to v4 §2, not a contradiction;
  intensity-stacking timed instances contradicts v4's "same magnitude,
  only duration differs" [needs-user-call]; Option C's never-expiring
  DoTs collide with the expiry-Souls economy [needs-user-call].
- Live KB was unreachable this session (kb-query MCP not mounted;
  kb-sync rejected at the git proxy — same gap as
  `plan/archive/2026-09-25-trim-t4/plan/tuning/2026-07-11-dawncaster-comparison.md` §Evidence status).
  Re-file the wish for persistent-card density reception once auth works.
