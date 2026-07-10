# Agent conventions

## Pull requests

- **Auto-merge:** Whenever you (Claude) open a PR, enable auto-merge on it
  (repository default merge method) so it merges automatically once CI passes.
  In CI (`claude-code-action` runs) use `mcp__github__enable_pr_auto_merge`;
  in a local session that tool is not wired up (`.mcp.json` configures only
  playwright) — use the CLI instead: `gh pr merge <number> --auto`. This
  requires the repository setting **Settings → General → Pull Requests →
  Allow auto-merge** to be turned on; if the call reports auto-merge is
  disabled for the repo, surface that to the user rather than silently
  skipping.
- Open PRs as ready for review (not drafts).
