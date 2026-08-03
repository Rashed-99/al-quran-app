import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
 
// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error', // Suppress warnings, only show errors
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      // Matches the "@/*" -> "./src/*" mapping in jsconfig.json (which only
      // affects the editor/typechecker, not the actual build - this is what
      // makes `@/...` imports resolve for Vite itself). Previously provided
      // by @base44/vite-plugin, lost when that was removed - restored here.
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
 