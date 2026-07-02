import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { Config, defineConfig } from "eslint/config";

const config: Config[] = defineConfig([
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "editor-web/**",
      ".claude/**",
      "docs/**",
      "src/CLI/**",
      "automation/**",
      "scripts/**",
      "*.reference.ts",
      "**/*.reference.ts",
    ]
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    }
  },
  {
    files: ["**/*.ts", "**/*.mts", "**/*.cts"],
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    languageOptions: {
      parser: tseslint.parser,
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      "no-unused-vars": "off",
      "no-redeclare": "off",
      "@typescript-eslint/no-redeclare": "error",
      "@typescript-eslint/no-unused-vars": ["error", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "off",
    }
  },
]);

export default config;
