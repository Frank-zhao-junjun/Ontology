import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react() as unknown as { name: string },
  ],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      'tests/**/*.{test,spec}.{ts,tsx}',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/lib/**', 'src/store/**', 'src/components/**', 'src/hooks/**', 'src/app/api/**'],
      exclude: ['src/test/**', 'src/types/**', 'tests/**'],
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    // Windows: forks pool 易触发 spawn EBUSY；统一用 threads（US-P01-U02）
    pool: 'threads',
    fileParallelism: process.platform === 'win32' ? false : true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
