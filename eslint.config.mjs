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
    '.pytest_cache/**',
    '.coverage/**',
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
    // AI agent directories (not project source):
    '.agents/**',
    '.augment/**',
    '.claude/**',
    '.codebuddy/**',
    '.commandcode/**',
    '.continue/**',
    '.coze/**',
    '.crush/**',
    '.cursor/**',
    '.factory/**',
    '.goose/**',
    '.iflow/**',
    '.junie/**',
    '.kilocode/**',
    '.kiro/**',
    '.kode/**',
    '.mcpjam/**',
    '.mux/**',
    '.neovate/**',
    '.openhands/**',
    '.pi/**',
    '.pochi/**',
    '.qoder/**',
    '.qwen/**',
    '.roo/**',
    '.trae/**',
    '.vibe/**',
    '.windsurf/**',
    '.zencoder/**',
    '.adal/**',
    '.cortex/**',
    'frontend-react/**',
    'skills/**',
    'Cursor/**',
  ]),
]);

export default eslintConfig;
