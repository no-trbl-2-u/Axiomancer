# UI FRESH-EYES SWARM — 2026-09-12

> Ran against [`plan/archive/2026-09-25-trim-t4/plan/2026-09-12-ui-fresh-eyes-swarm.prompt.md`](../../../plan/archive/2026-09-25-trim-t4/plan/2026-09-12-ui-fresh-eyes-swarm.prompt.md).
> Input: the 309 unverified candidate rows sweep #301 left behind. Output: a
> disposition for every one of them, in
> [`UI_FRESH_EYES_SWARM_2026-09-12.ledger.md`](../../../plan/archive/2026-09-25-trim-t5/axiomancer-mobile/docs/reports/UI_FRESH_EYES_SWARM_2026-09-12.ledger.md) (archived).

## 1. Header

| | |
|---|---|
| Branch point | `6701c20` (main merged into the sweep branch) |
| Commits | 22 fix and repair commits, plus this report |
| Findings shipped | 30, numbered `FE-029`…`FE-058`, continuing #301's series |
| Box | 4 CPUs, so the workflow concurrency cap was 2 — the same 2-slot box that stopped #301 |
| Agents | 96 across five workflows, 0 errors, 0 empty results |
| Agent tokens | ~9.8M across ~2,780 tool calls |
| Transport | static preview export (`BUILD_PROFILE=preview npx expo export --platform web`) served on a local static server; Docker was absent, so the dev server was unavailable |
| Browser | `/opt/pw-browsers/chromium-1194` via `FRESH_EYES_CHROME`; the repo's playwright pins revision 1228, which is not installed here |
| Captures | 54 cells before (27 screens x 2 viewports) and 54 after, both sets with **0 page errors and 0 console errors** |

## 2. What happened to the 309 rows

| disposition | rows |
|---|---|
| `refuted` | 177 |
| `fixed` | 60 |
| `duplicate-of` | 56 |
| `closed-by-decision` | 10 |
| `driver-artifact` | 5 |
| `out-of-scope` | 1 |
| **total** | **309** |

The 309 rows collapsed to **187 semantic clusters** — independent observation
agents had worded the same defect many different ways, which is why #301's
string-keyed dedup collapsed almost none of them. 148 clusters reached the
adversarial panel; the rest were already answered by #301's fixes, by one of
the six owner decisions, or were artifacts of the capture harness rather than
the app.

## 3. Shipped

| id | sha | sev | the finding | what changed |
|---|---|---|---|---|
| FE-029 | `5282cc0a` | major | The threat preview tells me a foe 'steadies 3 resolve' but the meter it is talking about is labelled PLEA on the… | the threat preview's PLEA rider now reads "shakes off N PLEA" instead of "steadies N resolve", so the telegraph and the board meter share one name |
| FE-030 | `254d9f00` | major | My portrait medallion and the END disc are parked physically on top of the outermost cards of my hand, so those two… | Added the pure `handFanLayout(screenW, n)` and re-inset `styles.fan` so the hand lays out in the chrome-free band between the player medallion (new exported `PLAYER_DOCK_FOOTPRINT_W` = 102) and the… |
| FE-031 | `254d9f00` | major | The combat board is the only screen in the game that scrolls sideways, and dragging it right reveals a blank white… | Re-anchored `endConsequenceWrap` from left:-30 (its 140pt box ended 20pt past the right screen edge) to right:0 so it runs inward, gave `styles.root` `overflow: 'hidden'` so the END disc's 112pt… |
| FE-032 | `254d9f00` | major | The chip reading NO STANCE looks exactly like the momentum chip above it, but one is tappable and the other does… | Marked the tappable half of the pair — `MomentumChainChip` now draws a visible ⓘ tap mark in every chain state — and named the inert half: `StanceChip` prints a quiet STANCE caption beside its value… |
| FE-033 | `254d9f00` | major | A card in my hand prints '×4 ' — a chopped three-character piece of a longer sentence, not a value. | Rewrote `compactFree` (now exported): added a ×N intensity branch so the presenter's '×4 · 3t' applyEffect rail compacts to '×4', and replaced the `v.slice(0, 3)` fallthrough — the source of the… |
| FE-034 | `6791a2b1` | major | The worn-gear dock gives half the screen to one small portrait and squeezes the gear names until they break mid-word. | Portrait column drops flex:1 for a fixed 96pt gutter (and a 260pt bust) so the five worn-slot rows take the remaining ~250pt and the name / grants sub-labels stop truncating mid-word. |
| FE-035 | `6791a2b1` | minor | There is a red tick sitting inside the GRACE bar and nothing says what it marks. | New pure presenter fn graceBreakLegend(breakAt) words the mark ('arrears at 2 or below'); both grace tracks (SELF POOLS panel and the exploration HUD StatusCard) now render it in blood under the… |
| FE-036 | `6791a2b1` | minor | My alignment is cut off as 'Agnostic-Neutral-…' and there is nowhere else to read the rest of it. | Dropped numberOfLines={1} from the identity alignment line so the full cell name (up to 'Agnostic-Pessimistic-Transcendent') wraps on its own hyphens in the ~106pt column; the sheet scrolls, so the… |
| FE-037 | `6791a2b1` | minor | The WORN tab says 8 but I am only wearing five things. | Equipment tab label WORN -> GEAR. Every tab's badge counts the rows that tab lists and this tab lists all equipment carried, so the 8 was honest and the word was not; the per-row WORN badge stays… |
| FE-038 | `0907182a` | minor | The named merchant looks like a locked option I have not unlocked yet, and nothing happens when I press it. | merchantCard drops the ash border + panel fill (the app's disabled grammar) for a sulfur left rule, the screen's flavour treatment, so a named merchant no longer reads as a locked button |
| FE-039 | `0907182a` | minor | At desktop width the prose runs the whole 1280px, ~165 characters to a line, and I lose my place every row. | both scene scroll columns gain width 100% + maxWidth 560 + alignSelf centre (SCENE_MAX_WIDTH), capping narrative prose at ~68 characters on desktop while leaving phone layout untouched |
| FE-040 | `0907182a` | minor | The shop's option descriptions are printed too small to read next to the inn's, which are fine. | wareDesc 8px -> DESC_FONT_SIZE 12 (the size /rest's offerDesc already prints the identical uppercase mono at) and the dialogue consequenceChip 8px -> 12 |
| FE-041 | `b3ebe96d` | major | The only button on the title screen tells me to tap a glowing node on the map, but there is no map here and pressing… | EMBARK's sub-line now reads 'begin the pilgrimage' instead of instructing the player to tap a map node on a screen with no map. |
| FE-042 | `b3ebe96d` | major | Opening the game (or any fixture deep link) fires the paced-event route twice, so the intro mounts twice and the… | EventGate latches the route it has already pushed for the pending event and releases the latch when the event resolves, so a paced event opens its screen exactly once. |
| FE-043 | `b3ebe96d` | major | The brightest, glowing mark on the map is the square I am already standing on, and tapping it does nothing at all. | The sulfur beacon moved from 'current' to 'available' (current is now a muted bone pin), the current node answers a tap with 'you stand here', and the node control is no longer announced as… |
| FE-044 | `b3ebe96d` | major | The map says 25 nodes but draws about eight, cut off on every side, and never hints that I can drag or pinch the chart. | The first-visit hint now names the gesture ('drag or pinch the chart') and the always-on compass line reads 'N ↑ · leagues · drag · pinch', so the affordance outlives the 5s hint chip. |
| FE-045 | `b3ebe96d` | major | Every NPC's nameplate says A FIGURE even while the prose right below it calls them by name. | New pure helper dialogueSpeakerTitle() reads npcName off the interaction event that opened the tree; 'A FIGURE' survives only for a speakerless narration or an empty name. |
| FE-046 | `b3ebe96d` | minor | The cutscene's SKIP reads as a caption, not a button, and its tap target is barely finger-sized. | SKIP is now a bordered, filled plate with a 44pt minimum box and a 12px sans label instead of a 10px bone mono caption with padding 8. |
| FE-047 | `745b56ff` | polish | The engraving behind the cutscene carries its own printed caption, half-cut at the bottom edge. | owner decision, shipped by the repair wave after a verify lens wrongly closed it |
| FE-048 | `b3ebe96d` | polish | The title art stops in a razor-straight line across the figures, leaving a wide black gap above the copy. | The square plate now sits in its own wrapper with a seven-band ground ramp anchored to the art's own foot, so the image dissolves into the field instead of ending in a ruled line across the figures. |
| FE-049 | `3a1369be` | major | After I rest, the outcome brags '+43 VITAE' while the meter right above it still shows the same wounded number it did… | purse VITAE now projects the settled outcome ledger's own healed value onto the frozen session snapshot (clamped at max) instead of rendering the pre-choice number |
| FE-050 | `b668b6d5` | minor | The MEASURE chip says UNTESTED and the line under it says "untested." — the explanation just repeats the label, so I… | Added a `hint` line to the philosophical alignment VM ('heart, body and mind stand level. the greatest of the three names your bent.') and rendered it under the UNTESTED chip instead of the echoing… |
| FE-051 | `78017cb2` | minor | The labyrinth's acts and its LEAVE read to my screen reader as plain text, not as things I can press. | gave the act cards, all three LEAVE pressables and the MAP toggle accessibilityRole="button" plus presenter-owned accessibilityLabels (new LABYRINTH_COPY.a11y block, map label follows the toggle) |
| FE-052 | `15fb5095` | polish | The dark band behind the top HUD stops at a hard horizontal seam partway down the enemy art on my phone. | The top-HUD scrim faded to nothing at 85% of the scene band and then rose back to 0.4 ink, which the band's hard bottom edge sliced off — a horizontal seam ruled across the arena; the new pure… |
| FE-053 | `15fb5095` | minor | The chip says NO STANCE but never tells me how to get one. | `playerStanceVM` now hands its empty state a `hint` ('PLAY A PAID CARD') and `StanceChip` prints it beside the value, so NO STANCE names the action that fills it instead of naming a hole on a chip… |
| FE-054 | `15fb5095` | minor | The primer teaches me a 'Surge meter' and then the fight never shows one. | Primer panel 1 taught 'the Surge meter', a readout the board never draws; the line now names MOMENTUM, the chip that actually occupies that slot in both flag states, and a sweep test holds every… |
| FE-055 | `34cfa8dd` | major | The stalls price things I have no way to evaluate — nothing tells me what a ware actually does. | New pure `wareEffectLine` reads each ware's payload off the engine libraries (heal in VITAE, timed effects with their rounds, cleanse, relic stat + granted signature) into a new… |
| FE-056 | `34cfa8dd` | minor | The smith sells me "work on my dice" in words the game has never taught me. | Text-only: the smith's opening speech (now presenter-owned `introBody`) names MISS/MANA/BOON and what each pays, a `faceKey` line decodes the per-die `1 BOON · 2 MANA · 3 MISS` read, each offer… |
| FE-057 | `0cbfed15` | major | Every hazard card carries two little glyph-and-number pairs that are never keyed, so I cannot tell what the card… | New HazardStatKey legend (presenter-owned copy) keys the fist as FORCE and the runner as ESCAPE above the deck grid and under the card in the tap-to-read overlay, and every StatPair now announces… |
| FE-058 | `1d58f1a2` | minor | LEAGUES is capitalised like a place name in the title copy, then turns out to be a distance unit on the map. | owner decision, shipped by the repair wave after a verify lens wrongly closed it |

Rows covered by each id are in the ledger. Every fix carries a hermetic test;
the repair wave's tests were additionally proven to fail against the damaged
version before being accepted.
## 4. How a finding had to survive to be fixed

The parent prompt asks for three refute lenses with a majority verdict. The
2-slot box could not afford three agents per cluster, so the first panel ran
**two** agents per batch — one arguing from the captured evidence and the
player persona, one from the source and the scope walls — and a cluster
survived only if **neither** refuted it. That is strictly harsher than the
rule it was standing in for, and it showed: of the 126 clusters the panel
killed, **87 were split decisions** where one lens had voted to keep the finding.

Rather than ship that, a third adjudicating lens was run over all 87 ties,
restoring the intended majority-of-three. It was given both prior arguments
and told to go to the artifact itself rather than side with the more
confident reviewer. It upheld **6** and struck down 81.

So the two-lens shortcut was 93% aligned with an independent third judge, but
the 6 it cost were real: they became 6 of the shipped findings, including the
forge printing trade names the game never teaches and the hazard cards' two
unkeyed glyph-and-number pairs.

The panel's refutations were not rubber stamps. A sample of what they killed,
and on what evidence:

- A claim that a rune drew as a missing-glyph box died on a 30x brightness-boosted crop showing the glyph rendering correctly.
- A claim that the encounter screen offered no exit died on measurement: the fold shears a body line mid-word, and the button is ~280px below, not a full screen.
- A claim that hazard CTAs lacked a chevron died on the DOM text, which carries the chevron on every one.
- A claim that the dice colours are never keyed died on the discovery that the capture driver dismisses the tutorial coach, so the screenshot is not what a first-time player sees. That is a harness limitation, and it is now on the record.

## 5. What the sweep broke, and what fixed it

After the first 29 fixes were committed, two regression readers — one per
viewport — diffed all 54 before and after cells, pixel and DOM. They found
**10 regressions the sweep had caused itself**, three of them major:

| screen | sev | what broke |
|---|---|---|
| 09-memoir-fresh (/memoir, MEASURE row) | major | The new UNTESTED chip caption does not wrap. The chip grows to max-content, blows past the 375pt viewport (its right border is off-screen), and the sentence is cut mid-clause — 'names your bent.' is… |
| 12-combat-board (/combat-encounter, hand fan) | major | The hand fan collapsed. Each non-last card now shows a 28pt sliver instead of ~58pt: four of the five cards are cut to two letters of their name ('TH', 'CH', 'TH', 'SP') with all art and cost chips… |
| 05-character-fresh / 06-character-midgame (/character, GRACE footer) | minor | The footer caption 'the pool above is this balance, read in tenths.' is now sliced horizontally by the bottom tab bar — the lower half of every glyph is cut off. Before it sat fully clear above the… |
| 04-exploration-midgame (/exploration, map hint) | minor | The widened map hint pill now sits on top of the compass rose. The compass is reduced to a needle tip above the pill and a sliver of ring below it — it is no longer readable as a compass. |
| 12-combat-board (/combat-encounter, last hand card) | minor | The rightmost card's keyword chip now pokes out from under the END disc and reads as broken text: 'GUAR' cut mid-word with '12' wrapped onto a second line, half-covered by the disc. Before, that… |
| 14-village (/village, TAKE THE ROAD) | minor | The screen's exit button is now cut in half by the bottom of the viewport. Before, the whole page — button plus the illustration below it — fit on screen. |
| 07-inventory-fresh / 08-inventory-midgame (/inventory, equipment dock) | polish | The pilgrim bust shrank from ~112pt wide to ~72pt and now floats in a 96pt x ~345pt column that is ~70% empty black. The dock's left half reads as dead space instead of art. |
| 07-inventory-fresh / 08-inventory-midgame (/inventory, GEAR tab) | polish | The filter tab was renamed WORN -> GEAR but its sibling label was not: tapping GEAR opens a section still headed '✠ WORN & WIELDED' that lists unworn equipment. The rename was meant to stop a filter… |
| 07-inventory-fresh / 08-inventory-midgame | major | The equipment dock's character portrait collapsed from a large bust to a ~70px thumbnail floating in a mostly-empty vertical gutter. EquipmentDock.tsx now gives dockPortrait a hard `width: 96,… |
| 12-combat-board | minor | The new ⓘ momentum tap-mark renders OUTSIDE the chip's dark backing plate, directly on the bright arena floor, at roughly 1.5:1 contrast — effectively invisible. The plate belongs to the… |

The worst was self-inflicted by the fix that was meant to stop board chrome
covering the hand: it clamped the fan into a 183pt band that cannot seat five
cards at 375pt, so the hand collapsed to 28pt slivers and still overflowed.
A repair fleet of nine file-disjoint agents put all 10 right, each with a test
proven to fail against the damaged version.

## 6. What the completeness critic caught

A critic read the ledger against the prompt and found 11 gaps. Coverage was
clean — 309 of 309, no duplicates, no strays — but the bookkeeping was not,
and two owner decisions had not shipped:

| kind | what it found | done |
|---|---|---|
| `other` | CHECK 1 PASSES, CHECKS 4+5 ARE UNPROVABLE because the acceptance report was never written. /home/user/Axiomancer/axiomancer-mobile/docs/reports/UI_FRESH_EYES_SWARM_2026-09-12.md does not exist, although the ledger's own header links to it… | see below |
| `other` | The acceptance artifact itself is untracked. `git status --porcelain` returns `?? axiomancer-mobile/docs/reports/UI_FRESH_EYES_SWARM_2026-09-12.ledger.md` — the 309-row disposition ledger is not committed on branch… | see below |
| `fix-without-diff` | Cluster S1-board-C11 is recorded as `fixed ff6b130e` on all four of its rows, but commit ff6b130 changes exactly one file — axiomancer-mobile/components/combat/encounter/__tests__/CombatBoard.S1-board.test.tsx (+219, test-only) — and… | see below |
| `mistagged-decision` | Three rows closed under decision 2 are not naming rows. Decision 2 covers NAMES on the signet rail and explicitly says 'Rows about the rail's affordance contradicting the counter's are still live', yet cluster S1-board-C07's stated reason… | see below |
| `confirmed-unfixed` | Decision 5 was a decided FIX and was refuted away instead. Prompt §2 row 5 reads 'LEAGUES is a unit: lowercase it in the title copy. -> Fix' — §2's preamble says 'Do not re-litigate'. The cluster carrying it, S4-world-C02 (rows C-103,… | see below |
| `confirmed-unfixed` | Decision 6 shipped for one plate out of the Doré set. Prompt §2 row 6: 'Crop the Doré plates above their baked-in captions -> Fix. Asset edit under axiomancer-mobile/assets/** plus npm run assets:check' — plural. Only charon-crossing.webp… | see below |
| `other` | 8 of the 11 `out-of-scope` rows are refutations mis-filed into the scope bucket, which is the exact bucket §8 uses to prove nothing CONFIRMED was silently dropped. Prompt §5/§8 mean `out-of-scope <wall>` for a finding that is TRUE but… | see below |
| `shard-shortfall` | CHECK 5: no shortfall is detectable in what is checkable, and the accounting is exact. The 58 rows the ledger marks `fixed` are the identical set to the 58 C- ids enumerated in the eleven fix commits' bodies (comm on both sorted lists… | see below |
| `other` | The §6.4 Thread stage produced nothing and its required follow-ups are unmade. §6.4 calls for one agent per theme (currency, journal-name, SEALED, SURGE, ◆), run serially after every shard commits, with 'one commit per theme'. There is no… | see below |
| `other` | No new FE- ids were minted, so the 29 fixed clusters have no stable identity. §5 requires 'New FE- ids continue from FE-029' and commit subjects of the form `ui-fresh-eyes: FE-0nn <route> — <one line>`; report §7.3 is keyed 'per new FE-… | see below |
| `other` | No after/ captures exist, so §8's 'after/ captured for every touched route at both viewports' is unmet and report §3's required 'before+after capture paths' cannot be filled. §5 says the main agent re-captures after/ for every route a fix… | see below |

Every one was acted on:

- **Decision 5 had been refuted away.** The owner decided to lowercase LEAGUES in the title copy; a verify lens closed it as taste. Worse, the sweep had lowercased the other half of the pair on the map, so it shipped the exact clash the decision was meant to remove. Now fixed as `FE-057`.
- **Decision 6 shipped one plate of four.** Only one engraving had been cropped. The other three were inspected edge by edge: two carried blank page margins and were cropped, one is already full-bleed and was deliberately left alone, with the reason written into its provenance record. Shipped as `FE-058`.
- **Three rows were closed under decision 2 that the decision expressly leaves live** — they are affordance claims, not naming claims. They are re-filed in the ledger against their affordance twin's verified verdict.
- **Eight rows sat in the `out-of-scope` bucket that were really refutations.** That bucket is what proves nothing confirmed was silently dropped, so it is now exactly one row: the rest-screen exit, which needs a state transition and is genuinely walled.
- **A finding cited a test-only commit.** The ledger now cites the commit that changed production code.
- **No stable ids had been minted.** `FE-029`…`FE-058` now exist, one per finding, so the next sweep can dedup against this one.
## 7. Still open

One row survived verification and was not fixed, because the only real fix is
walled off from a presentation-layer sweep:

| row | the finding | the wall |
|---|---|---|
| C-206 | There is no back button, no dismiss, nothing — once I stepped onto the fire I am trapped in this screen until I pick. | state transition |

The rest and cache screens have no way back out, and neither says so. Adding
an exit means un-consuming a resolved map-event node, which is a state
transition and belongs in the engine, not in a presenter. Proposed patch: give
the node a `visited-but-unresolved` state in the world reducer, then let the
screen offer a withdrawal that returns to exploration without granting the
node's payload. That is engine work and wants its own brief.

## 8. Provenance, and what was capped

Five workflows, in sequence, each read before the next was launched.

| workflow | agents | errors | what it did |
|---|---|---|---|
| cluster | 9 | 0 | one per shard; 309 rows to 187 semantic clusters |
| verify + fix | 54 | 0 | 46 refute agents over 23 batches, then 8 fix agents |
| tie-break | 21 | 0 | 18 adjudicators over the 87 split verdicts, then 3 fix agents |
| critique | 3 | 0 | completeness critic plus one regression reader per viewport |
| repair | 9 | 0 | one per file-disjoint damage group |
| **total** | **96** | **0** | |

Named caps and deviations, per the prompt's no-silent-caps rule:

- **Two refute lenses, not three.** Forced by the 2-slot box; corrected afterwards by the tie-break workflow rather than left standing. Described in section 4.
- **The cross-screen thread pass shipped nothing.** All six cross-screen clusters — the currency naming, the journal's name, SEALED, SURGE, the diamond glyph — were refuted, four of them by the three-lens majority. The adjudicator's reason in each case was that the competing senses never co-occur on one screen, and appear in different grammar when they do. The phase therefore had no input and was not run. The standing phase candidate for a naming pass is annotated accordingly rather than closed.
- **The capture driver dismisses the combat tutorial coach**, so no screenshot in either set shows what a first-time player actually sees on their first fight. At least one candidate row was refuted on evidence that this hides. Worth fixing in the driver before the next sweep.
- **The repo's pinned playwright browser revision is not installed** in this container; captures ran against the revision that is present, via an explicit executable path.
- **No fix agent could re-render the live app.** They shared one static export, and rebuilding it mid-run would have pulled in siblings' in-flight edits, so geometry fixes were verified by hermetic test and headless layout probes instead. The orchestrator re-exported and re-captured once, after all edits had landed.
- **A guard hook fired once**, refusing to let the verify gate run in the background. The gate was re-run in the foreground, leg by leg, as the hook instructs.

## 9. Gate

Run in the foreground at the final commit:

| check | result |
|---|---|
| `npm run verify` — mobile | green, 297 suites / 2,844 tests |
| `npm run verify` — mechanics | green, 212 files / 3,422 tests |
| `npm run verify` — card-editor | green, build clean |
| `npm run lint:content` | green, 14 surfaces / 206 shipped ids |
| `npm run assets:check` | green |
| after-capture manifest | 54 cells, 0 page errors, 0 console errors |

The cross-package checklist applies: one mechanics text string changed
(`combat.threat.ts`, the meter name in the threat preview) and both dependent
packages were verified against it.

## 10. Before and after

Both sets live under `axiomancer-mobile/.critique-artifacts-fresh-eyes/`
(gitignored), one `NN-<screen>.png` and `.txt` per screen per viewport:

```
before/mobile/   before/desktop/    # 27 screens each, at the branch point
after/mobile/    after/desktop/     # the same 27, at the final commit
```

The `after` set was captured twice: once after the first 29 fixes, which is
what the regression readers diffed, and again after the repair wave, which is
the set on disk now.