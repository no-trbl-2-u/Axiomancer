# Memoir Tab Sync

_Started 2026-05-16 20:32 UTC_

---

## User

We've attached a 4th tab at the bottom called "memoir". Sync the prototype with the current implementation.

## Assistant

_[tool: list_files]_

_[tool: local_ls]_

_[tool: read_file]_

_[tool: local_ls]_

_[tool: local_ls]_

_[tool: local_ls]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: local_ls]_

_[tool: read_file]_

_[tool: local_read]_

_[tool: local_read]_

_[tool: local_grep]_

_[tool: read_file]_

Let me look at the memoir presenter to understand the view model and example data.

_[tool: local_read]_

_[tool: read_file]_

_[tool: grep]_

_[tool: grep]_

Now I have enough context. The implementation has 4 tabs (combat replaces exploration mutex-style, then character → **memoir** → inventory). I need to:

1. Update `shared.jsx`: add scroll glyph + make `TabBar` 4-slot with memoir
2. Add `ScreenMemoir` to `screens-canonical.jsx` mirroring the journal surface (header, chronicle, errands, measure)
3. Update `prototype.jsx`: route='memoir' + 4-slot tab hits

Let me check one more thing — what does the prototype canvas (app.jsx) reference, so I don't break it:

_[tool: str_replace_edit]_

Now I'll make the changes. The tab bar now has 4 slots: [WILDS|STRIFE] · SELF · MEMOIR · SATCHEL.Now add the `ScreenMemoir` component to screens-canonical.jsx:

_[tool: str_replace_edit]_

Now update prototype.jsx to wire the memoir route + 4-slot tab bar:

_[tool: str_replace_edit]_

_[tool: done]_

_[tool: fork_verifier_agent]_

Prototype is now synced with the MEMOIR tab. Summary:

- **TabBar** is now 4 slots: `[WILDS|STRIFE] · SELF · MEMOIR · SATCHEL`, with a scroll glyph for memoir (matching the implementation's `scroll` icon kind).
- **`ScreenMemoir`** added to `screens-canonical.jsx`, mirroring the journal surface in `app/(tabs)/memoir/index.tsx`:
  - Header `✠ THE BOOK OF DEEDS` + `Cas of Ash, pilgrim.` subline
  - **Chronicle** — typed-event rows (`FELLED`, `CROSSED INTO …`, `ROSE TO vii`, `SPOKE WITH …`) with label + body, falling back to `the page is bare.`
  - **Errands** — `AT HAND` / `COMPLETED` quest cards with `✓ / ○` objective bullets, completed cards dimmed
  - **Measure** — moral chip (e.g. `STERN`) + provisional philosophical chip (`of the Body` + rationale)
- **`prototype.jsx`** routes `memoir` → `<ScreenMemoir/>`, and `PtTabHits` is 4-slot.Prototype synced — memoir tab is live as the 4th slot.

