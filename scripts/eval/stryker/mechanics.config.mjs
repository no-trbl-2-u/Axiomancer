// scripts/eval/stryker/mechanics.config.mjs
//
// Stryker on the combat resolution modules (phase EV1c, brief A5). Run by
// `scripts/eval/mutation.mjs` with `axiomancer-mechanics/` as the working
// directory; never part of `verify`. The JSON report path comes from the
// environment so the runner script owns where it lands.

export default {
  testRunner: 'vitest',
  plugins: ['@stryker-mutator/vitest-runner'],
  vitest: { configFile: 'vitest.config.ts', related: true },
  mutate: [
    'src/Combat/effects.ts',
    'src/Combat/effect-modifiers.ts',
    'src/Combat/health.ts',
    'src/Combat/resist.ts',
    'src/Combat/stat-scaling.ts',
    'src/Combat/combat.dice.ts',
  ],
  coverageAnalysis: 'perTest',
  ignoreStatic: true,
  reporters: ['json', 'progress'],
  jsonReporter: { fileName: process.env.EVAL_STRYKER_JSON ?? 'reports/mutation/mutation.json' },
  concurrency: Number(process.env.EVAL_STRYKER_CONCURRENCY ?? 2),
  timeoutMS: 10000,
  tempDirName: '.stryker-tmp',
  cleanTempDir: 'always',
}
