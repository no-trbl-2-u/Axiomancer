import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      Character: path.resolve(__dirname, 'src/Character'),
      Combat: path.resolve(__dirname, 'src/Combat'),
      Effects: path.resolve(__dirname, 'src/Effects'),
      Enemy: path.resolve(__dirname, 'src/Enemy'),
      Game: path.resolve(__dirname, 'src/Game'),
      Items: path.resolve(__dirname, 'src/Items'),
      NPCs: path.resolve(__dirname, 'src/NPCs'),
      Skills: path.resolve(__dirname, 'src/Skills'),
      Utils: path.resolve(__dirname, 'src/Utils'),
      World: path.resolve(__dirname, 'src/World'),
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules/**'],
    // Populate `Task.location` on each test so the agent reporter
    // (automation/agent-vitest-reporter.mjs) can surface `file:line`
    // per test entry via `experimental_getRunnerTask(testCase).location`.
    // Negligible cost: vitest computes by `new Error()` + stack-parse
    // at collection time.
    includeTaskLocation: true,
    // Use forked processes for test isolation to prevent shared state pollution
    // between test files (fixes intermittent tier3-synergy-skills.engine.test.ts failure)
    pool: 'forks',
  },
});
