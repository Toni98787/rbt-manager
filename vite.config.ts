import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Required for GitHub Pages project site: https://toni98787.github.io/rbt-manager/
  base: '/rbt-manager/',
})
