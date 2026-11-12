import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Raw console output is reserved for the logger and build scripts.
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
    },
  },
  {
    // React Three Fiber maps three.js constructor arguments and properties to
    // JSX props that the DOM-oriented rule does not know about.
    files: ["components/canvas/**/*.tsx", "components/lab/**/*.tsx"],
    rules: { "react/no-unknown-property": "off" },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".tooling/**",
    "studio/**",
    "public/**",
    "test-results/**",
    "playwright-report/**",
  ]),
]);

export default eslintConfig;
