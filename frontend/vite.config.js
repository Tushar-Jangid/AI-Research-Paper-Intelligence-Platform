import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/papers': 'http://localhost:8000',
      '/search': 'http://localhost:8000',
      '/comparison': 'http://localhost:8000',
      '/literature-review': 'http://localhost:8000',
    }
  }
})
