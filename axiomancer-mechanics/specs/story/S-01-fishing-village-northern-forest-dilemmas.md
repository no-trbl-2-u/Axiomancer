# Story Spec S-01 — Fishing Village / Northern Forest Ethical Dilemmas

> **Status: NOT implemented tonight — specs only, for a future content
> pass.** Only "What Do I Tell Father?" (fv-14, `fvFatherWorryDialogue` in
> `src/World/MapEvents/content.ts`) is live. The four dilemmas below are
> designed to the same standard (age-appropriate, no engine-signposted
> "correct" choice, flag-only consequence) but are not wired into any map
> node yet. Node ids below are the *intended* future host, not a
> reservation — several are currently occupied by other content (see each
> entry's Cross-references) and will need either re-slotting to an unused
> node or a deliberate content swap when this spec is picked up.
>
> **Update 2026-08-09.** Picked up: queued as build-plan **Phase 53d**, and
> both open questions are now answered below (displace encounter nodes, grid
> stays at 25; flags only, no `moralDelta`). The intended hosts named in each
> entry are **superseded** — see the table under Open Question 1. Read
> `S-02-fishing-village-voices.md` first: it defines the later-column NPCs
> who will read these dilemmas' flags, which is what Phase 53e adds and what
> makes the flags worth setting.

## Goal

Extend the "small but real moral weight" dilemma pattern proven by fv-14
across both first-arc maps, so the coming-of-age tone (honesty vs.
loyalty, duty vs. desire, generosity vs. self-preservation) recurs more
than once before the tone darkens in later arcs. Each dilemma is a
`narration`-kind `MapEventPoolEntry` carrying a real `DialogueTree`
(per `src/NPCs/types.ts`), following the exact pattern fv-14 established:
three choices at a root node, each a leaf outcome, each setting a
distinct flag, no `moralDelta`/`alignmentDelta` steering except where
noted.

## Dependencies

- **Depends on:** fv-14 "What Do I Tell Father?" (implemented) as the
  proof-of-concept pattern; the `narration` `MapEventKind` and
  `resolveNarration` handler (both already live, no engine work needed).
- **Unblocks:** a later content pass that also wants these dilemmas'
  flags read by downstream nodes (each entry below notes a suggested
  future reactive hook, mirroring fv-14's own "flags read later" note).

## Dilemmas

### 1. "The Borrowed Hook" — intended host: fv-8 (Fishing Village)

**Currently occupied by:** gathering (driftwood), via `FV_GATHER_NODES`.
Needs re-slotting or a swap when implemented.

**Scene setup:** While gathering driftwood along the tideline, the boy
finds a fine brass fishing hook half-buried in the sand — clearly
dropped, clearly not his, and clearly worth more than anything his
family owns. No one is in sight.

**Choices:**
1. *"Pocket it — no one will ever know."* → keeps the hook. Leaf:
   quiet satisfaction curdles fast; every time he uses it he half-expects
   to be caught. Flag: `boy-kept-the-hook`.
2. *"Leave it exactly where it lies."* → leaves it, unclaimed. Leaf: a
   small, private pride at walking away from something he wanted. Flag:
   `boy-left-the-hook`.
3. *"Bring it to Old Marrow — he'll know whose it is."* → surrenders it
   to the village quest-giver NPC. Leaf: Old Marrow turns it over in his
   hands, impressed, and says he'll ask around; the boy leaves
   empty-handed but seen doing right by someone who matters to the
   village. Flag: `boy-reported-the-hook`.

**Moral integration:** None mechanical (no moralDelta) — this is a
values-only dilemma; the three flags exist purely for a future NPC
(e.g. Old Marrow) to react differently in a later conversation
depending on which was set.

**Cross-references:** fv-8's existing gathering payload
(`FV_GATHER_MATERIALS[1]`, driftwood); Old Marrow's dialogue tree at
fv-2.

### 2. "The Frightened Friend" — intended host: nf-6 or nearest unused Northern Forest node

**Currently occupied by:** `nf-6` hosts `nfSprite` (encounter). Needs
re-slotting to an unused Northern Forest node (e.g. a node not yet
claimed by `NORTHERN_FOREST_POOLS`) when implemented.

**Scene setup:** Deeper into the Northern Forest, the boy hears a
whimper from behind a deadfall — a boy his own age, a stranger, wedged
and scared, having chased a runaway goat too far off the path and lost
his nerve to climb back down alone. He's not hurt, just stuck and
proud enough to not want to admit it.

**Choices:**
1. *"Climb up and help him down, no questions asked."* → the direct,
   generous route. Leaf: the stranger boy is red-faced but grateful,
   mutters a name — Pell — before scrambling off toward his own village.
   Flag: `boy-helped-pell`.
2. *"Call out directions from the ground — let him find his own way
   down."* → helps, but keeps distance and doesn't spend the effort to
   climb. Leaf: it takes longer, and colder, but Pell manages it alone
   in the end, more relieved than resentful. Flag: `boy-coached-pell`.
3. *"He's not your problem — keep walking."* → self-preservation; the
   forest is no place to linger for someone else's mistake. Leaf: the
   whimpering fades behind him; he tells himself the goat will find its
   own way home, and mostly believes it. Flag: `boy-left-pell`.

**Moral integration:** None mechanical. Establishes the NPC "Pell" as a
potential recurring acquaintance — a future Northern City node could
have Pell recognize the boy and react per whichever flag is set
(gratitude, quiet respect, or a flicker of hurt).

**Cross-references:** Northern Forest's `nfSprite` encounter content
(needs a genuinely free node id, not nf-6, when this is picked up);
the eventual Northern City map (not built yet, per grounding notes).

### 3. "The Stranger's Net" — intended host: fv-19 (Fishing Village)

**Currently occupied by:** `fvShoreInteraction` (Weathered Fisher,
`interaction` kind). Needs re-slotting or folding into that NPC's
dialogue tree when implemented.

**Scene setup:** A net has drifted loose and snagged on the rocks near
the quay, clearly someone else's — a stranger, not the Weathered
Fisher the boy already knows — with a modest catch still tangled in
it, silvery and real. Taking the fish costs the stranger a meal; the
boy's own family could use it too.

**Choices:**
1. *"Free the net and carry it to whoever's missing it."* → an
   effortful honesty; he asks around the quay until he finds the owner.
   Leaf: the stranger — a hollow-cheeked woman from upriver — thanks him
   with visible relief and presses one fish back into his hands anyway.
   Flag: `boy-returned-the-net`.
2. *"Take a few fish, leave the rest, say nothing."* → a compromise
   that still feels like theft. Leaf: dinner is a little better that
   night; he doesn't mention where it came from, and no one asks.
   Flag: `boy-skimmed-the-net`.
3. *"Take the whole catch — finders keepers."* → full self-interest.
   Leaf: a good meal, no immediate consequence, but a nagging thought
   of the stranger returning to nothing. Flag: `boy-took-the-net`.

**Moral integration:** Suggested `moralDelta` for a future pass:
option 1 mildly positive, option 3 mildly negative, option 2 neutral —
left unspecified here since the dilemma is designed flag-first per the
established pattern; a future implementer should decide whether to add
`moralDelta` at all (fv-14 sets none).

**Cross-references:** `fvShoreInteraction`'s Weathered Fisher NPC
(a good candidate to *narrate* this scene as an observer, or to be the
net's true owner in a rewritten version).

### 4. "The Crowning Witnessed" — intended host: nf-11 (Northern Forest)

**Currently occupied by:** `nfMossyClearing` (`rest` kind). Needs
re-slotting when implemented; alternatively this could be folded in as
a pre-rest narration beat at the same node (rest first, dilemma after),
since the two kinds aren't mutually exclusive in principle even though
today's registration is one-pool-per-node.

**Scene setup:** Resting at the mossy clearing, the boy glimpses through
the trees a strange, hushed ceremony deeper in — robed figures and a
boy his own age kneeling to receive something that catches the light
like a crown. He's not meant to see this. Grounding note: this is the
"crowning ceremony" beat referenced in the story bible as connective
tissue toward the Caves-in-Northern-Forest content (not built yet); this
dilemma is about the *choice to look or not*, not about explaining the
ceremony itself.

**Choices:**
1. *"Creep closer for a better look."* → curiosity wins. Leaf: he sees
   just enough to know it was real and important, and just little enough
   to raise more questions than it answers; a twig snaps and he bolts
   before anyone turns. Flag: `boy-witnessed-the-crowning`.
2. *"Look away and keep resting — it's none of his business."* →
   restraint. Leaf: he hears the murmur of it fade behind him and feels,
   oddly, like the correct kind of coward. Flag: `boy-ignored-the-crowning`.
3. *"Note the spot but leave immediately, meaning to tell someone in the
   city."* → a middle path, curiosity paired with responsibility. Leaf:
   he marks the bend in the path in his memory, already rehearsing how
   he'll describe it later. Flag: `boy-marked-the-crowning`.

**Moral integration:** None mechanical. This is the connective-tissue
flag for the "hears rumor the King's advisor died" beat in Northern
City (not built yet per grounding notes) — a future implementer could
have an NPC there react specially if `boy-witnessed-the-crowning` or
`boy-marked-the-crowning` is set, tying the boy's curiosity to the
kingdom-level plot thread early.

**Cross-references:** `nfMossyClearing` rest payload; the story bible's
Caves-in-Northern-Forest / Northern-City beats (out of scope to build,
per grounding notes — this dilemma only plants the flag).

## Open questions

Both were answered on 2026-08-09 during the phase-53 planning pass, not by
T. They are reversible content calls — overruling either costs one node
reassignment or one effect field, and invalidates no phase. See
`S-02-fishing-village-voices.md` and `plan/phases/phase_53d_*.md`.

1. **Node re-slotting.** All four intended hosts above are currently
   occupied by other content. Should the future implementer add new
   nodes to the 25-node grid, or displace/merge with the existing
   payload at that node?
   > **Answered (phase-53 planning, 2026-08-09): displace; the grid stays
   > at 25 on both maps, and none of the four original hosts is used.**
   >
   > Growing the grid is refused outright. The 2026-08-08 first-map audit
   > re-layered both maps into column-layered forward gauntlets precisely
   > so the soft-lock class became structurally impossible; adding nodes
   > re-opens it and invalidates the route-length and coverage numbers that
   > audit tuned. Merging two kinds onto one node is also refused —
   > registration is one-pool-per-node, and the "rest first, dilemma after"
   > idea floated for dilemma 4 would need an engine change to sequence two
   > payloads. That is a real feature, but it is not this content pass.
   >
   > So each dilemma displaces one **encounter** node, which is the only
   > kind the maps carry a surplus of, and the intended hosts in this
   > document are superseded:
   >
   > | dilemma | intended host | actual host | why the change |
   > |---|---|---|---|
   > | 1. The Borrowed Hook | `fv-8` (gathering) | an encounter node in column 2 | must precede the post-boss NPCs who read its flag |
   > | 2. The Frightened Friend | `nf-6` (encounter) | an encounter node, northern-forest | unchanged in spirit; nf-6 itself stays a fight |
   > | 3. The Stranger's Net | `fv-19` (interaction) | an encounter node in column 3 | `fv-19` is being reclaimed for a real, rostered NPC — see S-02 |
   > | 4. The Crowning Witnessed | `nf-11` (rest) | an encounter node, northern-forest | rest is being rebuilt by phases 52c/52d; do not build on it |
   >
   > Exact node ids are Phase 53d's call, under two binding constraints:
   > **(a)** a dilemma whose flag is read later must sit in a strictly
   > earlier column than every reader (the gauntlet has no back-travel —
   > see S-02 § "the law a gauntlet imposes"); **(b)** the strand invariant
   > and the coverage walk are re-run afterward.

2. **moralDelta / alignmentDelta.** fv-14 sets none except a small
   `alignmentDelta` on the joke-deflection branch. Should these four
   dilemmas stay similarly unsteered, or is it time to start
   accumulating a legible morality signal across dilemmas?
   > **Answered (phase-53 planning, 2026-08-09): stay unsteered. Flags
   > only. No `moralDelta` on any of the four, and `alignmentDelta` only
   > where a branch genuinely names a worldview rather than a virtue.**
   >
   > The reason is not caution, it is that the alternative is already
   > covered. The village has two NPCs whose entire job is to score the
   > player — Old Marrow (−4 to +5) and the Coastal Beggar (−5 to +5), and
   > spec 10 names the Beggar as the meter's demonstration NPC. A morality
   > signal is not missing from the first arc; it is concentrated in the
   > people who deliver it, which is where a legible signal belongs. The
   > dilemmas are the opposite register on purpose: nobody is watching, and
   > the game does not tell the boy what he just was.
   >
   > This is the distinction *Tyranny* draws with loyalty/fear — both
   > states valid, the game declining to moralize — and it collapses the
   > moment an unwitnessed choice moves a visible meter, because the meter
   > is the verdict. It would also make dilemma 3 incoherent: "take a few
   > fish and say nothing" only lands if nothing announces it as theft.
   >
   > What the flags get instead is a **reader**, which is what was actually
   > missing. Phase 53e gates a branch on each dilemma's flag in a
   > later-column NPC, so the consequence arrives as somebody noticing
   > rather than as a number moving. `alignmentDelta` stays permitted on a
   > branch that states a worldview — dilemma 4's "note the spot, mean to
   > tell someone in the city" is a `scope` move, not a virtue — following
   > `fv-14`'s own precedent, where only the joke-deflection branch carries
   > one.

## Proposed approach

1. Pick real, currently-unclaimed node ids (or explicitly decide to
   displace existing content) for each of the four dilemmas.
2. Author each as a `MapEventPool` in `content.ts` following
   `fvFatherWorryDialogue`'s exact shape: one `narration` entry, weight
   1, a `DialogueTree` with a root node offering three unflagged
   choices, each choice a leaf outcome setting one distinct flag.
3. Wire each pool into its host map's node-pool array
   (`FISHING_VILLAGE_NEW_PLAYER_POOLS` or `NORTHERN_FOREST_POOLS`).
4. Add hermetic engine tests mirroring
   `src/World/MapEvents/e2e/fv-14-father-worry.engine.test.ts` — pool
   wiring, all three flags settable, at least one gating example.
5. No mobile changes required — `/dialogue` already renders any
   `narration`-kind event generically (see fv-14's rollout).

## Acceptance checklist

- [x] Open questions answered (2026-08-09, phase-53 planning — reversible).
- [ ] Node hosts finalized (re-slotted or explicitly swapped).
- [ ] All four `DialogueTree`s authored and registered.
- [ ] Flags documented here match the flags actually set in code.
- [ ] Hermetic engine tests added per dilemma.
- [ ] `npm test` and `npm run type-check` clean in
      `axiomancer-mechanics`.

## Out of scope

- Any Caves-in-Northern-Forest or Northern-City content (those
  continents/maps don't exist yet).
- Mobile-side changes (the existing `/dialogue` route already handles
  this shape).
- Combat, Cards, Effects, Skills, LootCache — untouched by this spec.
