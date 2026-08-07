import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["main.js", ".dev/", "node_modules/", "test-vault/"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.mjs"],
    languageOptions: { globals: globals.node }
  },
  {
    files: ["**/*.ts"],
    languageOptions: { globals: globals.browser },
    rules: { "@typescript-eslint/no-non-null-assertion": "off" }
  }
);
