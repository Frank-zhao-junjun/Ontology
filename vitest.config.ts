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
    // Windows: threads pool 在部分测试套件中出现无法退出的挂起；forks 更稳定（US-P01-U02）
    pool: 'forks',
    fileParallelism: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
