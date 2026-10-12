import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
  { ignores: ["build", "node_modules"] },
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { "react-hooks": reactHooks, "react-refresh": reactRefresh },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      // ESLint 10 JSX kullanımını (<Icon />) kendisi tanır; yalnızca yeni JSX dönüşümünde gerekmeyen
      // "import React" satırları serbest (kullanılmayan bileşen içe aktarmaları yakalanır)
      "no-unused-vars": ["error", { varsIgnorePattern: "^(React$|_)", argsIgnorePattern: "^_" }],
      // Hızlı yenileme (Fast Refresh) için dosyalar yalnızca bileşen dışa aktarmalı
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    },
  },
  {
    // Testler ve yapılandırma dosyaları Node ortamında da çalışır
    files: ["**/*.test.{js,jsx}", "src/test/**", "*.config.js"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: { "react-refresh/only-export-components": "off" },
  },
];
