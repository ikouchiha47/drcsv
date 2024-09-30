import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      danfojs: path.resolve(__dirname, 'node_modules/danfojs/dist/danfojs-browser/src'),
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        faq: 'faq.html',
      },
    },
  },
})
