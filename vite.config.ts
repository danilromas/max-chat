import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base: './' — чтобы сборку можно было открыть с любого пути (GitHub Pages, Netlify и т.п.)
export default defineConfig({
  base: './',
  plugins: [react()],
})
