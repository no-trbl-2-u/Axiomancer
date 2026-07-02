# Agent conventions

## Pull requests

- **Auto-merge:** Whenever you (Claude) open a PR, enable auto-merge on it
  (`mcp__github__enable_pr_auto_merge`, repository default merge method) so it
  merges automatically once CI passes. This requires the repository setting
  **Settings → General → Pull Requests → Allow auto-merge** to be turned on; if
  the API call reports auto-merge is disabled for the repo, surface that to the
  user rather than silently skipping.
- Open PRs as ready for review (not drafts).
