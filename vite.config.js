import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function normalizeBasePath(path) {
  if (!path || path.trim() === '') return '/'

  const trimmed = path.trim()
  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`

  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`
}

export default defineConfig(() => ({
  plugins: [react()],
  base: normalizeBasePath(process.env.VITE_BASE_PATH),
}))
