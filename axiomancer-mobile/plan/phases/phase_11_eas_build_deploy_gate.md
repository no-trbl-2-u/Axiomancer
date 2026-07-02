# Phase 11 — EAS Build deploy-gate wiring

## Outcome

Replace the stub `scripts/deploy-check.mjs` with real EAS Build API integration that polls build status for the current commit. Add setup documentation for EXPO_TOKEN configuration.

## Why

**Unblocks:** automated deploy verification in shipping loop, production EAS build confidence gate. **Depends on:** phase 1-10 complete, EAS Build already configured for manual use.

## EAS Build API integration (locked)

Replace stub implementation with EAS CLI-based polling using existing authentication:

### Authentication approach
Use EAS CLI with JSON output rather than direct REST API (per official recommendations):
```bash
# Verify token via CLI
npx eas whoami
# List builds with filtering
npx eas build:list --platform=all --status=finished --limit=10 --json
```

### Commit-based filtering
Filter builds by git commit hash using EAS CLI parameters:
```bash
npx eas build:list --git-commit-hash="$sha" --json
```

### Status mapping
EAS Build status values to deploy-check exit codes:
- `"finished"` → exit 0 (deploy ready)
- `"errored"`, `"canceled"` → exit 1 (deploy failed)  
- `"in-progress"`, `"in-queue"`, `"new"` → exit 2 (timeout/pending)
- Authentication failure → exit 3 (config failure)

## Implementation approach

### Script replacement
Replace `scripts/deploy-check.mjs` stub block with EAS CLI polling:

```javascript
// --- EAS BUILD (phase 11 implementation) ----------------
if (PROVIDER === 'eas') {
  const TOKEN = process.env.EXPO_TOKEN
  const PROJECT_ID = process.env.EAS_PROJECT_ID
  
  if (!TOKEN) {
    console.error('deploy-check: EXPO_TOKEN required. See setup/02_eas.md')
    process.exit(3)
  }

  // Poll for builds matching current commit
  const builds = JSON.parse(execSync(
    `npx eas build:list --git-commit-hash="${sha}" --json`, 
    { encoding: 'utf-8' }
  ))
  
  // Find most recent build for this commit
  const latestBuild = builds[0]
  if (!latestBuild) {
    console.log(`deploy-check: no builds found for commit ${sha}`)
    process.exit(2) // timeout - no build triggered yet
  }
  
  // Map status to exit codes
  switch (latestBuild.status) {
    case 'finished':
      console.log(`deploy-check: ✓ build ${latestBuild.id} finished`)
      process.exit(0)
    case 'errored':
    case 'canceled':  
      console.error(`deploy-check: ✗ build ${latestBuild.id} ${latestBuild.status}`)
      process.exit(1)
    case 'in-progress':
    case 'in-queue':
    case 'new':
      console.log(`deploy-check: ⏳ build ${latestBuild.id} ${latestBuild.status}`)  
      process.exit(2)
    default:
      console.error(`deploy-check: unknown build status: ${latestBuild.status}`)
      process.exit(1)
  }
}
```

### Environment configuration
Update `.env.example` with EAS variables:
```bash
# EAS Build deploy gate (phase 11)
DEPLOY_PROVIDER=eas
EXPO_TOKEN=your_expo_access_token_here
EAS_PROJECT_ID=your_project_id_here
```

## Files to create/modify

### Core implementation  
- `scripts/deploy-check.mjs` — replace EAS stub with real polling logic
- `.env.example` — add EXPO_TOKEN and EAS_PROJECT_ID variables

### Documentation
- `setup/02_eas.md` — new runbook covering token setup, project ID lookup, polling contract

### Dependencies
- Ensure `expo` and EAS CLI available in environment (already present for manual builds)

## Setup documentation outline

`setup/02_eas.md` covers:

1. **EXPO_TOKEN setup** — personal access token creation at expo.dev/settings/access-tokens
2. **EAS_PROJECT_ID lookup** — reading from `eas.json` or `expo init` output  
3. **Testing procedure** — verify auth, trigger test build, confirm polling
4. **Failure modes** — token expiry, rate limits, network timeouts
5. **Polling budget** — CLI overhead vs webhook alternatives for high-frequency use

## Cross-links

**In (verify):** No routes to check — deploy script only.
**Out (ship):** No new navigation added.  
**Retro-fit:** N/A — infrastructure change only.

## Tests

### Unit tests
- `scripts/__tests__/deploy-check.test.mjs` — test status mapping, env validation, CLI error handling

### Integration tests  
- Test auth failure scenarios (missing/invalid EXPO_TOKEN)
- Test with real EAS CLI commands in CI environment
- Verify timeout behavior for long-running builds

### Manual verification
- Trigger EAS build manually: `npm run deploy:preview` 
- Run `npm run deploy:check` while build is in-progress → exit 2
- Wait for build completion → exit 0 or 1 based on result
- Test with invalid token → exit 3

## Error handling

### CLI command failures
- `eas build:list` auth errors → exit 3 with helpful message
- JSON parsing failures → exit 1 with error details
- Network timeouts → exit 2 (treat as pending)

### Rate limiting
- EAS CLI has built-in rate limiting — rely on CLI implementation
- Document polling frequency limits in setup guide

## Performance considerations

### CLI overhead
- EAS CLI startup time ~2-3 seconds per invocation
- Acceptable for deploy gate (infrequent calls)
- Document webhook alternative for high-frequency automation

### JSON output size
- Limit build list queries with `--limit=10` for performance
- Filter by commit hash to reduce response size

## Decisions made upfront — DO NOT ASK

1. **CLI vs REST API:** Use EAS CLI with --json output over direct REST API calls (official recommendation, better auth handling)
2. **Polling vs webhooks:** Implement polling first (simpler setup), document webhook alternative  
3. **Platform filtering:** Poll all platforms (`--platform=all`) since mobile app targets both iOS/Android
4. **Timeout behavior:** Exit 2 for any pending/in-progress status (let loop retry)
5. **Error granularity:** Map both `errored` and `canceled` to exit 1 (failed deploy)
6. **Token scope:** Personal access token sufficient (no org-level permissions needed)

## Verify gate

```bash
npm run verify  # lint + tsc + jest must pass  
```

Unit tests must cover status mapping and error scenarios.

## Deploy gate

```bash
npm run deploy:check  # now tests the real implementation
```

## Commit body template

```
feat: EAS Build deploy gate — phase 11

- Replaced scripts/deploy-check.mjs stub with EAS CLI polling implementation  
- Added EXPO_TOKEN and EAS_PROJECT_ID environment setup
- Status mapping: finished→exit 0, errored/canceled→exit 1, pending→exit 2
- Created setup/02_eas.md runbook with token setup and testing procedures
- Unit tests for CLI error handling and status mapping

Decisions:
- EAS CLI with --json over direct REST API per official recommendations
- Polling approach over webhooks for simpler initial setup  
- All-platform polling since app targets iOS+Android
- Personal access token scope sufficient for single project

Manual verification: token auth + test build + polling confirms exit codes work correctly.
```

## DoD

After verify + commit + push:
1. Flip Phase 11 `[ ]` → `[x]` in `plan/steps/01_build_plan.md`
2. Add commit hash to phase log  
3. Test deploy:check with real EAS build to verify implementation

## Follow-ups (out of scope)

- Webhook-based deploy notifications for higher frequency automation
- Multi-project EAS monitoring dashboard
- Build artifact URL extraction for deploy confirmations  
- EAS Update integration for OTA deployments