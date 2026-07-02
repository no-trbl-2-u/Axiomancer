# EAS Build Deploy Gate Setup

This guide covers configuring the EAS Build deploy gate for `scripts/deploy-check.mjs`. After setup, the shipping loop can verify EAS builds automatically by polling build status for the current git commit.

## Prerequisites

- Expo account with access to this project
- EAS CLI installed (`npm install -g @expo/eas-cli`)
- Project configured for EAS Build (`eas.json` exists)

## Step 1: Generate EXPO_TOKEN

1. Go to https://expo.dev/settings/access-tokens
2. Click "Create token"
3. Set a descriptive name: "Axiomancer Mobile Deploy Gate"
4. Select required scopes:
   - `builds:read` — list and view build status
   - `projects:read` — access project information
5. Copy the generated token (starts with `expo_...`)

## Step 2: Configure Environment

1. Copy `.env.example` to `.env` if it doesn't exist:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and set:
   ```bash
   DEPLOY_PROVIDER=eas
   EXPO_TOKEN=expo_your_actual_token_here
   ```

3. **Optional:** Set `EAS_PROJECT_ID` if auto-detection fails:
   ```bash
   # Get project ID
   npx eas project:info
   # Add to .env
   EAS_PROJECT_ID=your-project-uuid-here
   ```

## Step 3: Verify Setup

Test authentication and CLI access:

```bash
# Verify token works
npx eas whoami

# Test build listing (should show recent builds)
npx eas build:list --limit=5

# Test the deploy gate script
node scripts/deploy-check.mjs
```

Expected outputs:
- `eas whoami` → your Expo username
- `eas build:list` → JSON array of recent builds
- `deploy-check.mjs` → either "no builds found" (exit 2) or build status

## Step 4: Test with Real Build

Trigger a test build and verify polling:

```bash
# Start a preview build
npm run deploy:preview

# Monitor with deploy gate (run multiple times)
node scripts/deploy-check.mjs
```

Expected progression:
1. Initially: "no builds found" (exit 2)
2. While building: "build in-progress" (exit 2) 
3. After completion: "build finished" (exit 0) or "build errored" (exit 1)

## Exit Code Reference

The deploy gate script follows this contract:

- **Exit 0**: Build finished successfully
- **Exit 1**: Build errored, canceled, or unknown status
- **Exit 2**: No builds found or build still in progress (retry)
- **Exit 3**: Authentication failure or missing token

## Troubleshooting

### Authentication Errors

**Problem:** `EAS authentication failed`
**Solution:** 
1. Check `EXPO_TOKEN` is set correctly in `.env`
2. Verify token hasn't expired at https://expo.dev/settings/access-tokens
3. Ensure token has `builds:read` and `projects:read` scopes

### No Builds Found

**Problem:** `no builds found for commit <sha>`
**Solution:**
1. Verify builds are being triggered for your commits
2. Check `eas.json` configuration includes current branch
3. Ensure builds target the expected platforms (iOS/Android)

### CLI Errors

**Problem:** `EAS CLI error: ...`
**Solution:**
1. Update EAS CLI: `npm install -g @expo/eas-cli@latest`
2. Check network connectivity
3. Verify project configuration with `eas project:info`

### Rate Limiting

EAS CLI handles rate limiting internally. If you see rate limit errors:
1. Wait 1-2 minutes before retrying
2. Consider reducing polling frequency in automation
3. For high-frequency use, evaluate webhook alternatives

## Integration with Shipping Loop

Once configured, the shipping skills (`/ship-a-phase`, `/iterate`) automatically call `deploy:check` as Step 12. No manual intervention needed.

The loop will:
1. Push commit to `main`
2. Run `npm run deploy:check` 
3. Wait for builds to complete or timeout
4. Continue with next phase if builds pass

For manual builds that don't auto-trigger on push, the gate will show "no builds found" (exit 2) and the loop continues.

## Alternative: Webhook-Based Notifications

For higher frequency automation, consider EAS webhooks:
1. Configure webhook endpoint in Expo project settings
2. Receive real-time build status updates
3. Store results for deploy gate polling

See Expo documentation on build webhooks for implementation details.

## Security Notes

- `.env` is gitignored — never commit `EXPO_TOKEN`
- Token scopes are read-only (`builds:read`, `projects:read`)
- Rotate tokens periodically at https://expo.dev/settings/access-tokens
- Use separate tokens for different environments (dev/staging/prod)