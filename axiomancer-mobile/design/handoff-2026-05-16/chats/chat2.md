# Sync Icon

_Started 2026-05-16 18:47 UTC_

---

## User

sync

## Assistant

_[tool: local_ls]_

_[tool: local_read]_

_[tool: local_ls]_

_[tool: local_ls]_

_[tool: local_ls]_

Synced. Here's what I have:

**Axiomancer** — Expo / React Native client for a TTRPG. UI/presentation layer only; rules live in the `axiomancer-mechanics` npm engine.

**Architecture:** Screens → Presenters (pure `state → ViewModel`) → Zustand store → engine. Read up, mutate down. Hermetic e2e at the presenter layer is the testing contract.

**Routes (expo-router):**
- `(tabs)/exploration` — map / node graph
- `(tabs)/combat` — stance-based combat
- `(tabs)/character` — sheet
- `(tabs)/inventory`
- `event/` and `crucible` — encounters

**Theme — dark only, gothic:**
- bg `#0a0a0a`, parchment `#e8dfc8`, blood `#c0152a`, sulfur `#d4c026`, rust `#9e3a1a`, bone `#8a8273`, ash `#3a3530`
- Pirata One (display), IM Fell English (body), Bebas Neue (labels), JetBrains Mono (numerics)
- Every SVG is a coded placeholder; swap contract in `SVG_ASSET_SPEC.md`

**Components I noticed:** StanceGlyph, EffectGlyph, ActionIcon, StatBar, EffectChip, BodyDiagram, FriendshipMeter, XpChain, TornPanel, Splatter, ScreenBg, TokenCrucible…

What do you want to design? Options I'd default to without more direction:
- A specific screen (combat / exploration / character / event) at mobile fidelity
- A component variation study
- A flow prototype across multiple screens

Tell me which and I'll ask the focused questions.

## User

We're going to do a redesign using this design prompt

## Assistant

_[tool: questions_v2]_

Big brief, well-scoped. Before I plan the file structure I want to pin down a few things — the rest I'll decide as I go and call out in the doc.

## User

Questions timed out; go with defaults

## Assistant

_[tool: local_read]_

_[tool: local_read]_

_[tool: local_read]_

_[tool: local_read]_

_[tool: local_read]_

_[tool: local_read]_

Going with sensible defaults. Locking in:

- **Both deliverables** — interactive prototype + canvas with all states
- **Two directions** on combat/exploration/event, one for the rest
- **Aesthetic A: marginalia gloss** (canonical) / **Aesthetic B: cold codex** (variant on high-stakes)
- **Seam motion: diegetic stack** — map persists behind events
- **Crucible: inline strip** above the action picker
- **Phase carousel → vertical stack** with collapse
- **Tabs: keep WILDS / STRIFE / SELF, rename SACK**
- **Event shells: two** (combat-adjacent / paced)
- **Decisions doc + flow map included**
- **Strings table per screen**, distinct rows for variants

Let me sync with the existing visual vocabulary first.

_[tool: local_read]_

_[tool: local_ls]_

_[tool: local_ls]_

_[tool: local_ls]_

_[tool: local_ls]_

_[tool: local_grep]_

_[tool: local_grep]_

_[tool: local_grep]_

_[tool: local_grep]_

_[tool: local_ls]_

_[tool: local_grep]_

_[tool: local_grep]_

_[tool: update_todos]_

Voice register confirmed. Now planning the build.

_[tool: copy_starter_component]_

_[tool: copy_starter_component]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: grep]_

_[tool: grep]_

_[tool: read_file]_

_[tool: write_file]_

Time to build. Setting up the foundation now.Now shared components: phone frame, tab bar, glyphs, meters.

_[tool: write_file]_

Now the canonical screens — exploration, combat, character, inventory.

_[tool: write_file]_

Now event, crucible, and the canvas hub. Let me get those out then preview.

_[tool: write_file]_

Now the design canvas hub HTML to assemble everything. Let me build the first cut so we can preview, then add docs, states, and the prototype.

_[tool: write_file]_

_[tool: write_file]_

Now app.jsx — the canvas composition.

_[tool: write_file]_

_[tool: show_html]_

_[tool: done]_

_[tool: str_replace_edit]_

_[tool: done]_

_[tool: save_screenshot]_

_[tool: show_html]_

_[tool: save_screenshot]_

_[tool: write_file]_

Console is clean. Building the clickable prototype now in parallel; the verifier can check both at the end.

_[tool: write_file]_

_[tool: str_replace_edit]_

_[tool: done]_

Adding a cross-link banner so the user can jump between canvas + prototype.

_[tool: update_todos]_

_[tool: done]_

_[tool: fork_verifier_agent]_

Shipped. The redesign is on two pages:

- **`index.html`** — the design canvas. Decisions doc, flow map, every surface as iPhone artboards (canonical, empty, loading, error), aesthetic B (cold codex) variants on the high-stakes screens, the seam storyboard, and a strings table per route.
- **`prototype.html`** — clickable single-phone prototype. Tap a sulfur-ringed map node, watch the event rise, fight three rounds, see the aftermath flash and recede back to the map.

Key calls I made on your behalf (defaults you said to go with — all rationalized in §V–§IX of the decisions doc):

- **SATCHEL** replaces SACK. WILDS / STRIFE / SELF / SATCHEL.
- **Diegetic stack** for the seam — map persists at 35% opacity behind every modal, never unmounts.
- **Vertical phase stack** in combat — past phases collapse to one-line summaries; no hidden swipe.
- **Crucible** inline as a strip above the action picker; the modal still exists as reference only.
- **Two event shells** — combat-adjacent (encounter / hazard) vs paced (everything else).
- **Voice** stays terse. No thee/thou. Roman numerals for in-world counts.

Open caveats:
- Type rendering depends on Google Fonts loading; first paint may briefly fall back to system serif.
- The cold-codex variants only cover WILDS / STRIFE / EVENT — extending them to SELF / SATCHEL is a follow-up if you want to commit to that direction.
- Strings tables list VM keys but don't yet match `state/presenters/*.engine.ts` field names exactly — that's a mechanical pass during implementation, not a design decision.

The verifier is checking it in the background.

## User

Verifier agent check completed

## Assistant

Verifier signed off. Canvas and prototype both clean — 36 artboards rendering, the clickable seam works end-to-end.

## User

Apply comment

## Assistant

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

Good catch — the brief did say "mutually exclusive via tab swap" and I read it as 4 always-visible tabs. Fixing now.

**Change:** STRIFE replaces WILDS in the first tab slot whenever the player is in combat *or* deciding a combat-adjacent encounter (encounter / hazard). Other times — exploring, paced events, character, satchel — only WILDS shows.

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: done]_

Done — STRIFE is now a mutex slot that swaps in for WILDS only during combat or a combat-adjacent encounter. The slot tick goes blood instead of sulfur to mark the danger context. Three visible tabs total: **[WILDS·STRIFE] · SELF · SATCHEL**.

Reflected everywhere:
- Prototype: tab swaps as you tap an encounter node, persists through combat, reverts on return.
- Canvas: all encounter event artboards (`ev-encounter`, `ev-encounter-codex`, seam frame ii) now show STRIFE in slot 1.
- Decisions doc §IV updated with the mutex rule.

