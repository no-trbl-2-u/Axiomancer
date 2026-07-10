// Mirrors axiomancer-mechanics/eslint.config.mts (same hoisted eslint 9 +
// typescript-eslint toolchain — this package declares no lint deps of its
// own). Plain .js so no TS config loader is involved.
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';

export default defineConfig([
    {
        ignores: ['dist/**', 'node_modules/**'],
    },
    {
        files: ['**/*.{js,mjs,cjs,ts,mts,cts,tsx}'],
        plugins: { js },
        extends: ['js/recommended'],
        languageOptions: {
            globals: { ...globals.browser },
        },
    },
    {
        files: ['**/*.ts', '**/*.tsx'],
        plugins: {
            '@typescript-eslint': tseslint.plugin,
        },
        languageOptions: {
            parser: tseslint.parser,
            globals: { ...globals.browser },
        },
        rules: {
            // tsc owns undefined-identifier checking in TS files; no-undef
            // false-positives on DOM lib types (RequestInit) and node
            // globals in the vite server plugin.
            'no-undef': 'off',
            'no-unused-vars': 'off',
            'no-redeclare': 'off',
            '@typescript-eslint/no-redeclare': 'error',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                },
            ],
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/explicit-function-return-type': 'off',
        },
    },
]);
