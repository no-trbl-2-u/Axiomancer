# Skill: adjust-equipment

> **The equipment/item steward.** Audits the signet-relic equipment
> set, consumables, and their shop/reward pools for structural
> health, then creates, updates, or retires items. Net-new to the
> loop — `/forge` never had an equipment surface.

## 1. Purpose

Equipment in the current shape (Phase 18-23) is lean by design: 8
fixed signet relics, each a static `statModifiers` bundle plus one
`grantsSignature`, no procedural rarity/affix system. Lean means it's
easy for the set to go stale unnoticed — a relic strictly worse than
another in its slot, a consumable nobody's reward pool ever grants, a
`grantsSignature` value that stopped mattering after a signature
skill changed. `/adjust-equipment` is the standing pass that keeps
the item set earning its slot.

## 2. Invocation

```
/adjust-equipment
/adjust-equipment create | update | remove   # optional bias
/loop /march                                 # routed via content-lifecycle gate
```

## 3. Procedure

### Step 0 — Sync + doctrine

```bash
git pull --ff-only
```

Read `axiomancer-mechanics/CLAUDE.md` (THE BIG NUMBERS REWRITE — no
win-rate/CQI grading), `docs/equipment.md` (the retired procedural
system's history — don't resurrect rarity/affixes without a deliberate
design call), `axiomancer-mechanics/src/Items/types.ts` (the lean
signet-relic shape + `SLOT_CAPACITY`).

### Step 1 — Audit (structural signals)

| Signal | Action |
|---|---|
| A slot (`weapon`/`armor`/`accessory`) with fewer viable picks than `SLOT_CAPACITY` demands meaningful choice for | CREATE |
| Relic A's `statModifiers` are dominated by relic B's in the same slot (worse on every modifier, no offsetting `grantsSignature` difference) | REMOVE candidate, or UPDATE A to differentiate |
| A relic/consumable absent from every shop pool or reward table (`shop.reducer.ts`, `cache-reward.ts`) | REMOVE candidate |
| A `grantsSignature` value pointing at a signature skill that no longer exists or changed meaning | UPDATE |
| A consumable's `effectId` references a retired effect (caught by `/adjust-keywords`'s ban list) | UPDATE |
| An `AccessoryKind` (head/hands/feet/amulet/ring/charm) with zero live accessories | CREATE |

Read `relic.library.ts`, `consumable.library.ts`, `equipment.engine.ts`,
`shop.reducer.ts` directly, or query `axio-query` when available.
Consult `kb-query` board-game reception corpus for equipment/loot
design prior art (dominated-item complaints, reward-pool staleness)
when scoring a REMOVE/UPDATE candidate.

### Step 1b — Widened audit scope (via `/oversight` 2026-09-15)

If Step 1's structural-signal table returns nothing actionable (a
zero-diff pass), don't stop there — passes 9-10 across all five content
stewards logged consecutive zero-diff results, a plateau worth checking
before trusting it as steady-state health. Run one additional deeper
check before concluding zero-diff: a KB cross-reference pass comparing
the current relic/consumable/shop pools against corpus prior-art gaps
(`kb_search`/`kb_cards` for equipment mechanics well-represented in
comparable games but absent or thin here — not just Step 1's structural
completeness signals). File anything this turns up as a normal finding
(Step 1's table categories still apply) and act on it in the same tick.
If the deeper check also turns up nothing, the zero-diff result stands
and gets logged as usual — this is a floor-raise on the audit, not a
mandate to invent findings.

### Step 2 — KB research, then design

**A KB research run is a GATE for every CREATE and UPDATE — nothing
gets written before it.** Query the `kb-query` MCP server first:
`kb_search` / `kb_find_games` against the board-game reception
corpus for equipment/loot prior art (dominated-item complaints,
reward-pool staleness, "every run takes the same relic" findings),
`kb_cards` for how the Dawncaster corpus handles item-granted
abilities. Carry the receipts (`kb:<game-slug>/<doc> (src-NNN)`)
into the design. The MCP tools are the only route to the corpus —
there is no local snapshot to fall back to — so if they are absent or
failing, the tick may proceed with `(memory)`-labeled design only by
saying plainly in the commit body that the corpus was unreachable and
the grounding is UNGROUNDED. REMOVE needs no KB run — a dominated
or unacquirable item is retirable on Step 1's structural evidence
alone.

Then design directly — no dedicated equipment sub-agent exists.
Price and differentiate relics by `statModifiers` magnitude against
the current CLAUDE.md §5 damage/GUARD/BARRIER bands (a relic should
move a number the player can feel, per the bigger-numbers pillar),
and by `grantsSignature` choice against the live signature-skill
roster in `combat.encounter.types.ts`.

### Step 3 — Ship

**Ship small, file large (THE GROWTH FLOOR ¶2, `plan/bearings.md`,
2026-09-17).** Before filing any CREATE-shaped finding as a candidate,
size it. **Small** — at most **3** new items on this steward's own
surface, reusing existing keywords, effects, engine hooks and art, and
touching only that surface and its registries — is BUILT IN THIS TICK
through the CREATE path below, with no candidate row. **Large** — new
engine wiring, a new keyword, new art, a cross-surface change, or more
than 3 items — is filed as a candidate in `plan/PHASE_CANDIDATES.md`.
When the call is genuinely ambiguous, **ship the small reading**: the
failure this rule corrects is over-filing, so the tie goes to shipping
and the residue records the call. Re-confirming a finding this steward
already filed is not an output — ship it under this rule, or say in the
commit body why it is still large.

**CREATE** — new `Equipment`/`Consumable` entry in
`relic.library.ts`/`consumable.library.ts` + wired into at least one
shop pool or reward table (an item nobody can acquire isn't shipped
content) + `addedIn` stamp. Count pins were repealed 2026-09-02 —
no pin bump.

**UPDATE** — edit the item in place: `statModifiers`, `grantsSignature`,
`effectId`/`healAmount`, description. Same `id`; no re-creation.

**REMOVE (retire, never delete silently)** — no ban-list convention
exists for items; follow the same archive discipline as enemies
(`/iterate`'s standing rule):
1. Remove the item from every shop pool / reward table it's in.
2. Move its library entry to a clearly marked retired section rather
   than deleting the record outright.
3. Log the retirement with reasoning (§4 ledger). (Count pins were
   repealed 2026-09-02; there is no pin to decrement.)

### Step 4 — Gates, ledger, commit

```bash
npm run verify --workspace axiomancer-mechanics
npm run verify --workspace axiomancer-mobile   # shop/inventory screens consume Items/**
```

`src/Items/**` isn't in `AGENTS.md`'s formal cross-package impact
checklist table, but shop/inventory UI is mobile-consumed the same
way everything else under `@mechanics` is — run the mobile verify
anyway as a precaution; flag the checklist gap in the commit body if
it turns out to matter, rather than silently assuming it doesn't.

Update `plan/CONTENT_LEDGER.md`: bump the `equipment` row, append a
log entry.

```bash
git add <explicit files> plan/CONTENT_LEDGER.md
git commit -m "$(cat <<'EOF'
content: adjust-equipment pass <N> — <one-line: created X, updated Y, retired Z>

- <finding> -> <action>, per <signal from §1>.
- Verify: green (mechanics + mobile).
EOF
)"
git push origin main
npm run deploy:check
```

### Step 5 — File the residue

A finding that implies resurrecting the procedural rarity/affix
system → `plan/AUDIT.md` as `[loop-call]`, don't decide it solo (it's
a repealed system, not a routine content edit). Other follow-ons →
`plan/PHASE_CANDIDATES.md`.

## 4. Hard rules

1. Nexus standing rules 1–7 apply in full.
2. **Ship content, not stubs.** An item in no shop/reward pool
   doesn't count as shipped.
3. **The lean signet-relic shape stands** — don't reintroduce
   rarity/affixes/procedural generation without an explicit design
   decision filed first (see Step 5).
4. **Never delete shipped content silently** — archive + update
   routing.
5. **Count pins are repealed (2026-09-02)** — don't reintroduce pin
   bookkeeping from stale checklists.
6. **No CREATE or UPDATE without the KB research run** (§3 Step 2)
   — receipts cited, or the fallback miss documented in the commit
   body. REMOVE is exempt.

## 5. Failure modes

1. **Verify/deploy gate fails ≥3 times on one root cause** — stop,
   file to `plan/AUDIT.md`.
2. **A finding implies resurrecting the retired procedural system**
   — stop, file as `[loop-call]`, don't decide it solo.
3. **Audit finds nothing actionable** — commit only the ledger bump.

## 6. Quick reference

```bash
# Reads
axiomancer-mechanics/docs/equipment.md
axiomancer-mechanics/src/Items/types.ts
axiomancer-mechanics/src/Items/relic.library.ts
axiomancer-mechanics/src/Items/consumable.library.ts
axiomancer-mechanics/src/Items/shop.reducer.ts
plan/CONTENT_LEDGER.md

# Gates
npm run verify --workspace axiomancer-mechanics
npm run verify --workspace axiomancer-mobile
npm run deploy:check
```
