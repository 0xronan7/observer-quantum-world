import { defineConfig } from 'vite';
import { execSync } from 'child_process';

// Get current git commit hash
let commitHash = 'dev';
try {
  commitHash = execSync('git rev-parse HEAD').toString().trim();
} catch (e) {
  console.warn('Could not get git commit hash');
}

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
        webrtc: 'webrtc-index.html',
      },
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  define: {
    __GIT_COMMIT_HASH__: JSON.stringify(commitHash),
  },
});
