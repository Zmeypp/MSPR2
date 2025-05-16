import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    proxy: {
      '/function': {
        target: 'http://localhost:31112',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
