import { defineConfig } from 'vite';

export default defineConfig({
  root: 'demo',
  base: '/observer-quantum-world/',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    open: true,
  },
});
