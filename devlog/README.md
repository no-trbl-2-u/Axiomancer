# DevLog

An accumulating, private development log. The nightly `/digest` skill writes one
markdown entry per day to `entries/DIGEST_{date}.md`; `scripts/build-devlog.mjs`
(run as `npm run devlog:build`) converts every entry into a self-contained styled
HTML page here plus `index.html`. Both the markdown source and the built HTML are
committed — no build step runs on the host.

## Reading it on your phone

Two paths, both private, pick either or both:

1. **Zero setup — GitHub mobile.** Open `entries/DIGEST_{date}.md` in the GitHub
   app on a private repo. Renders in GitHub's markdown style (not the custom
   theme), but needs nothing extra.
2. **Styled — Cloudflare Pages + Access (free).** Serves the built HTML as a real
   webpage, gated to just your email. One-time setup:
   - Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** →
     **Connect to Git** → pick this repo.
   - Build settings: **Framework preset = None**, **Build command = (empty)**,
     **Build output directory = `devlog`**. (Files are pre-built and committed, so
     Cloudflare just serves them.)
   - After the first deploy: **Settings → Access policy** (Cloudflare Zero Trust)
     → add a policy allowing only your email (one-time PIN login). This makes the
     site private.
   - Every time the cron pushes a digest commit, Cloudflare auto-deploys.

The site sends `noindex` and, behind Access, is not publicly reachable.

## Regenerating locally

```bash
npm run devlog:build
```
