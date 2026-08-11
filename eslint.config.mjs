import tsparser from "@typescript-eslint/parser";
import { defineConfig } from "eslint/config";
import globals from "globals";
import obsidianmd from "eslint-plugin-obsidianmd";

export default defineConfig([
  {
    ignores: [
      "main.js",
      ".dev/",
      "node_modules/",
      "test-vault/",
      "tests/fixtures/visual-controller/",
      "tests/fixtures/visual-vault/.obsidian/plugins/"
    ]
  },
  ...obsidianmd.configs.recommended,
  {
    files: ["**/*.mjs"],
    languageOptions: { globals: globals.node },
    rules: { "obsidianmd/rule-custom-message": "off" }
  },
  {
    files: ["eslint.config.mjs"],
    rules: { "obsidianmd/hardcoded-config-path": "off" }
  },
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsparser,
      parserOptions: { project: "./tsconfig.json" },
      globals: globals.browser
    },
    rules: { "@typescript-eslint/no-non-null-assertion": "off" }
  },
  {
    files: ["tests/**/*.ts"],
    rules: { "@typescript-eslint/no-unnecessary-type-assertion": "off" }
  }
]);
