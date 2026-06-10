import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    proxy: {
      '/auth': {
        target: 'http://localhost:8001',
        rewrite: (path) => path.replace(/^\/auth/, ''),
      },
      '/ws': {
        target: 'http://localhost:8002',
        rewrite: (path) => path.replace(/^\/ws/, ''),
        ws: true,
      },
    },
  },
})
