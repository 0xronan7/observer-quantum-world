import { defineConfig } from 'vite';

export default defineConfig({
  root: 'demo',
  base: '/observer-quantum-world/',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: 'index.html',
        networked: 'networked-index.html',
      },
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
