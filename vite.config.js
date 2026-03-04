import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function resolveBasePath() {
  if (process.env.VITE_BASE_PATH) {
    return process.env.VITE_BASE_PATH;
  }

  const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1];
  const isGithubActions = process.env.GITHUB_ACTIONS === 'true';
  const isUserSite = repoName?.toLowerCase().endsWith('.github.io');

  if (isGithubActions && repoName) {
    return isUserSite ? '/' : `/${repoName}/`;
  }

  return '/';
}

export default defineConfig({
  plugins: [react()],
  base: resolveBasePath(),
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    globals: true,
  },
});
