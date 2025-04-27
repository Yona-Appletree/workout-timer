import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import RemixRouter from 'vite-plugin-remix-router';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss(), react(), RemixRouter()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: [],
  },
});
