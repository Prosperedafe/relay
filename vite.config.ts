import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  // @ts-expect-error - Type mismatch between vite and vitest versions, but works at runtime
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    outDir: 'dist',
  },
  base: process.env.NODE_ENV === 'production' ? './' : '/',
  test: {
    globals: true,
    environment: 'jsdom',
  },
});

