import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const pkg = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf8')
)

const BUILD_INFO = {
  version: pkg.version || '0.0.0',
  buildTime: new Date().toISOString(),
  env: process.env.NODE_ENV || 'production',
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(BUILD_INFO.version),
    __BUILD_TIME__: JSON.stringify(BUILD_INFO.buildTime),
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
