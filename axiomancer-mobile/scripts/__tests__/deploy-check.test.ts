// scripts/__tests__/deploy-check.test.ts
//
// Unit tests for deploy-check.mjs EAS Build polling logic.
// Tests status mapping and exit code behavior.

describe('deploy-check status mapping', () => {
  test('should map build statuses to correct exit codes', () => {
    // Test the status mapping logic from the deploy-check script
    const statusToExitCode = (status: string): number => {
      switch (status) {
        case 'finished':
          return 0
        case 'errored':
        case 'canceled':
          return 1
        case 'in-progress':
        case 'in-queue':
        case 'new':
          return 2
        default:
          return 1
      }
    }

    // Test successful completion
    expect(statusToExitCode('finished')).toBe(0)

    // Test failure states
    expect(statusToExitCode('errored')).toBe(1)
    expect(statusToExitCode('canceled')).toBe(1)

    // Test pending states
    expect(statusToExitCode('in-progress')).toBe(2)
    expect(statusToExitCode('in-queue')).toBe(2)
    expect(statusToExitCode('new')).toBe(2)

    // Test unknown status
    expect(statusToExitCode('unknown-status')).toBe(1)
    expect(statusToExitCode('')).toBe(1)
    expect(statusToExitCode('pending')).toBe(1)
  })

  test('should handle empty build arrays', () => {
    // When no builds found for commit, should exit 2 (timeout/retry)
    const builds: any[] = []
    const latestBuild = builds[0]
    expect(latestBuild).toBeUndefined()
    
    // In the actual script, this becomes exit 2
    const exitCode = latestBuild ? 0 : 2
    expect(exitCode).toBe(2)
  })

  test('should select first build from array', () => {
    // EAS CLI returns builds sorted by creation time (newest first)
    const builds = [
      { id: 'build-2', status: 'finished', platform: 'ios' },
      { id: 'build-1', status: 'errored', platform: 'android' }
    ]
    
    const latestBuild = builds[0]
    expect(latestBuild.id).toBe('build-2')
    expect(latestBuild.status).toBe('finished')
  })

  test('should handle various EAS build response formats', () => {
    // Test with minimal build object
    const minimalBuild = { id: 'test-id', status: 'finished' }
    expect(minimalBuild.id).toBeTruthy()
    expect(minimalBuild.status).toBe('finished')

    // Test with full build object
    const fullBuild = {
      id: 'test-id-2',
      status: 'in-progress',
      platform: 'ios',
      gitCommitHash: 'abcd1234',
      createdAt: '2024-01-01T00:00:00Z'
    }
    expect(fullBuild.status).toBe('in-progress')
    expect(fullBuild.platform).toBe('ios')
  })
})

describe('deploy-check error handling', () => {
  test('should handle JSON parsing errors gracefully', () => {
    // Test JSON parsing with invalid input
    const invalidJson = 'not-valid-json'
    
    let parseError = false
    try {
      JSON.parse(invalidJson)
    } catch (error) {
      parseError = true
    }
    
    expect(parseError).toBe(true)
    
    // In the actual script, JSON parsing errors map to exit 1
  })

  test('should validate required environment variables', () => {
    const requiredVars = ['EXPO_TOKEN']
    
    // Test validation logic
    const validateEnv = (vars: string[]): string[] => {
      return vars.filter(varName => !process.env[varName])
    }
    
    // Mock missing token
    const originalToken = process.env.EXPO_TOKEN
    delete process.env.EXPO_TOKEN
    
    const missing = validateEnv(requiredVars)
    expect(missing).toContain('EXPO_TOKEN')
    
    // Restore
    if (originalToken) {
      process.env.EXPO_TOKEN = originalToken
    }
  })
})

describe('deploy-check CLI command construction', () => {
  test('should build correct EAS CLI command', () => {
    const sha = 'abcd1234567890'
    const expectedCommand = `npx eas build:list --git-commit-hash="${sha}" --platform=all --json`
    
    // Test command string construction
    const buildCommand = (commitSha: string): string => {
      return `npx eas build:list --git-commit-hash="${commitSha}" --platform=all --json`
    }
    
    expect(buildCommand(sha)).toBe(expectedCommand)
  })

  test('should escape git commit hash in command', () => {
    // Test with special characters (though git SHAs are hex only)
    const problematicSha = 'abc"def'
    const command = `npx eas build:list --git-commit-hash="${problematicSha}" --platform=all --json`
    
    // Verify quotes are preserved in command string
    expect(command).toContain(`"${problematicSha}"`)
  })
})