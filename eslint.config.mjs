import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const eslintConfig = [...nextCoreWebVitals, ...nextTypescript, {
  rules: {
    // ---------------------------------------------------------------
    // TypeScript — warn on bad patterns, don't silence them
    // ---------------------------------------------------------------
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": ["warn", {
      argsIgnorePattern: "^_",
      varsIgnorePattern: "^_",
    }],
    "@typescript-eslint/no-non-null-assertion": "warn",
    "@typescript-eslint/ban-ts-comment": "warn",
    "@typescript-eslint/prefer-as-const": "warn",

    // ---------------------------------------------------------------
    // React — keep safety checks, disable only cosmetic rules
    // ---------------------------------------------------------------
    "react-hooks/exhaustive-deps": "warn",
    "react/no-unescaped-entities": "off",
    "react/display-name": "off",
    "react/prop-types": "off",

    // ---------------------------------------------------------------
    // Next.js — keep image optimization enforcement
    // ---------------------------------------------------------------
    "@next/next/no-img-element": "warn",
    "@next/next/no-html-link-for-pages": "off",

    // ---------------------------------------------------------------
    // General JS — catch real bugs, allow stylistic preferences
    // ---------------------------------------------------------------
    "prefer-const": "warn",
    "no-console": "warn",
    "no-debugger": "error",
    "no-unreachable": "error",
    "no-fallthrough": "error",
    "no-case-declarations": "warn",
    "no-redeclare": "error",
    "no-undef": "off", // TypeScript handles this
  },
}, {
  ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts", "examples/**", "skills/**"]
}];

export default eslintConfig;
