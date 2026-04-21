import nextTs from 'eslint-config-next/typescript';
import nextVitals from 'eslint-config-next/core-web-vitals';
import { defineConfig, globalIgnores } from 'eslint/config';

const ROOT_HELPER_SCRIPTS = [
  'add-methods.js',
  'fix-store.js',
  'fix-store2.js',
  'fix-store4.js',
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // Build artifacts:
    'server.js',
    'dist/**',
    'coverage/**',
    // Script files (CommonJS):
    'scripts/**/*.js',
    // Temporary root helper scripts used during local refactors.
    ...ROOT_HELPER_SCRIPTS,
  ]),
]);

export default eslintConfig;
