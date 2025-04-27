import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import RemixRouter from 'vite-plugin-remix-router';

export default defineConfig({
  plugins: [react(), RemixRouter()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: [],
  },
});
