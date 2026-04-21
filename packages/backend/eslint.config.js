import js from "@eslint/js";
import globals from "globals";
import json from "@eslint/json";
import { defineConfig } from "eslint/config";
import prettier from "eslint-config-prettier";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { js, prettier },
    extends: ["js/recommended", prettier],
    languageOptions: { globals: globals.node },
  },
  {
    files: ["**/*.json"],
    plugins: { json, prettier },
    language: "json/json",
    extends: ["json/recommended", prettier],
  },
  {
    files: ["**/*.jsonc"],
    plugins: { json, prettier },
    language: "json/jsonc",
    extends: ["json/recommended", prettier],
  },
  {
    files: ["**/*.json5"],
    plugins: { json, prettier },
    language: "json/json5",
    extends: ["json/recommended", prettier],
  },
]);
