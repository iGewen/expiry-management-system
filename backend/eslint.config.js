import js from "@eslint/js";
import security from "eslint-plugin-security";

export default [
  js.configs.recommended,
  security.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        process: "readonly", console: "readonly", __dirname: "readonly",
        __filename: "readonly", setTimeout: "readonly", setInterval: "readonly",
        clearInterval: "readonly", Buffer: "readonly", URLSearchParams: "readonly", URL: "readonly"
      }
    },
    rules: {
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
      "no-unreachable": "warn",
      "no-console": "off",
      "prefer-const": "warn",
      "no-var": "error",
      "no-useless-escape": "off",
      "security/detect-non-literal-fs-filename": "off",
      "security/detect-object-injection": "off",
      "security/detect-possible-timing-attacks": "off"
    }
  }
];
