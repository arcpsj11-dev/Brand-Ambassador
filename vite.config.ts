import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/naver': {
        target: 'https://openapi.naver.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/naver/, ''),
        secure: false
      },
      '/api/rss': {
        target: 'https://rss.blog.naver.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/rss/, ''),
        secure: false
      }
    }
  }
})
