import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function resolveBasePath() {
  const env = globalThis.process?.env ?? {};

  if (env.VITE_BASE_PATH) {
    return env.VITE_BASE_PATH;
  }

  const repoName = env.GITHUB_REPOSITORY?.split('/')[1];
  const isGithubActions = env.GITHUB_ACTIONS === 'true';
  const isUserSite = repoName?.toLowerCase().endsWith('.github.io');

  if (isGithubActions && repoName) {
    return isUserSite ? '/' : `/${repoName}/`;
  }

  return '/';
}

export default defineConfig({
  plugins: [react()],
  base: resolveBasePath(),
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_ORIGIN || 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    globals: true,
    env: {
      // Explicitly enable auth in the test environment so auth gate tests
      // always run the full flow, regardless of Supabase credentials.
      VITE_AUTH_ENABLED: 'true',
    },
  },
});

