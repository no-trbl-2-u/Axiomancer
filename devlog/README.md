# DevLog

An accumulating, private development log — one **visual** entry per day: a
headline, categorized work-item cards (each with *what* changed and *why*),
rendered code diffs for engine/mechanics work, and before/after screenshots for
UI work. The nightly `/digest` skill authors a structured markdown entry;
`scripts/build-devlog.mjs` renders it into a self-contained styled HTML page.
Both the markdown source and the built HTML are committed — no build runs on the
host.

## Entry format

`entries/DIGEST_<date>.md` is Markdown with a light structure the build parses
(see `skills/digest.md` §3.4 for the authoring contract):

```markdown
# 2026-07-04
> one-line headline

## [mechanics] What was renamed and why
**What:** one line
**Why:** one line
**Commits:** 16e1386
​```diff
@@ src/World/LootCache/policy.ts @@
-export type CachePolicy = 'prober' | 'blind' | 'coward'
+export type CachePolicy = 'informed' | 'blind' | 'coward'
​```

## [ui] Combat board polish
**What:** one line
**Why:** one line
**Shot:** combat-encounter — caption

## While you were out
| Tick | Verb | Outcome |
| ...  | ...  | ...     |
```

- `## [<category>] <title>` → a **card** (`mechanics | ui | content | infra |
  balance`, each color-coded).
- `## <title>` (no bracket) → a **panel**, rendered as-is (tables/lists/prose).

## UI before/after screenshots

`scripts/devlog-shots.mjs` (`npm run devlog:shots -- <since-ref> <date>`) diffs
the committed baselines (`axiomancer-mobile/screenshots/baseline/*.png`) across
the day's git range and writes
`assets/<date>/<screen>.{before,after,diff}.png` (the `diff` is a pixelmatch
highlight). A `**Shot:** <screen> — <caption>` line in a `[ui]` card embeds the
trio. No browser runs — the baselines are the source of truth, captured when the
UI change landed.

## Reading it on your phone

1. **Zero setup — GitHub mobile.** Open `entries/DIGEST_{date}.md` in the GitHub
   app on a private repo. Renders in GitHub's markdown style (not the custom
   theme, and no rendered diffs/shots), but needs nothing extra.
2. **Full experience — Cloudflare Pages + Access (free).** Serves the built HTML
   (cards, diffs, screenshots) as a real webpage, gated to just your email:
   - Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** →
     **Connect to Git** → pick this repo.
   - Build settings: **Framework preset = None**, **Build command = (empty)**,
     **Build output directory = `devlog`**. (This is the setting that scopes what
     gets served — *not* the Advanced "Root directory / Path" field. Leave that
     default. Files are pre-built and committed, so Cloudflare just serves them.)
   - After the first deploy: **Settings → Access policy** (Cloudflare Zero Trust)
     → allow only your email (one-time PIN login). This makes the site private.
   - Every time the cron pushes a digest commit, Cloudflare auto-deploys.

The site sends `noindex` and, behind Access, is not publicly reachable.

## Regenerating locally

```bash
npm run devlog:build                       # re-render all entries + index
npm run devlog:shots -- <since-ref> <date> # collect UI before/after/diff
```
