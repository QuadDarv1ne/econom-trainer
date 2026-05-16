import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      // TypeScript rules
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/prefer-as-const": "error",

      // React rules
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/purity": "error",
      "react-hooks/preserve-manual-memoization": "off",
      "react/no-unescaped-entities": "off",
      "react/display-name": "warn",
      "react/prop-types": "off",
      "react-compiler/react-compiler": "off",

      // Next.js rules
      "@next/next/no-img-element": "off",
      "@next/next/no-html-link-for-pages": "off",

      // General JavaScript rules
      "prefer-const": "error",
      "no-unused-vars": "off",
      "no-console": "off",
      "no-debugger": "error",
      "no-empty": "error",
      "no-irregular-whitespace": "error",
      "no-case-declarations": "error",
      "no-fallthrough": "error",
      "no-mixed-spaces-and-tabs": "error",
      "no-redeclare": "error",
      "no-undef": "error",
      "no-unreachable": "error",
      "no-useless-escape": "error",
    },
  },
  {
    ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts", "examples/**", "skills", "public/**", "check-keys.js"],
  },
];

export default eslintConfig;
