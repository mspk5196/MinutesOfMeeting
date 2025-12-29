import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // App is hosted under /meetings on the main domain
  base: '/meetings',
  plugins: [react()],
})
