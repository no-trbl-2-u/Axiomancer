# DevLog design — the prototypes

The system these demonstrate is `devlog/DESIGN.md`. The implementation is
`scripts/build-devlog-public.mjs` and `scripts/devlog-public-shell.mjs`.

## Opening them

```bash
npm run site:public          # catalog export + the public build
open dist/devlog-public/index.html
open devlog/design/prototype-components.html
open devlog/design/prototype-hero.html
```

The prototypes **link the built stylesheets** (`dist/devlog-public/assets/`)
rather than carrying a copy of them. That is deliberate: a prototype with its
own inlined stylesheet is a second design system, and it rots the first time
the real one changes. Run the build once and they are live against exactly what
ships. (They are also why the build must stay runnable from a clean checkout in
one command.)

## What each one is for

| file | what it shows | why it is not the build |
|---|---|---|
| `prototype-components.html` | the before/after component in all four shapes and every state: pair, tap-to-swap, wipe, loading, rules-text, no-capture | the built pages show whichever states the real entries happen to need; this shows all of them at once, side by side, which is what a design review needs |
| `prototype-hero.html` | the landing hero in three scroll treatments — parallax (shipped), bloom, lift | only one treatment ships, and the comparison is the record of why |

**Every page type's prototype is the build itself.** The design prompt asked
for working prototypes of all six page types using real content, and the build
renders exactly that from the fifty-four committed entries — landing, post
index, post, catalog, tuning lab, about. A separate hand-written copy of six
pages would be six pages of lorem with extra steps, and it would be wrong
within a week.

## The marks, for anyone editing these

No emoji, ever (AGENTS.md standing rule 2). The site's marks are typographic:
the dagger for an eyebrow, the lozenge for a free-effect pip, the arrows on the
wipe handle. No colour is written as a hex literal — every one is a
`var(--token)` named as the app names it in `theme/palette.ts`.
