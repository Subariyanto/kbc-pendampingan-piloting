import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Set base path lewat env: VITE_BASE=/kbc-pendampingan-piloting/ saat build untuk GitHub Pages
const base = process.env.VITE_BASE || './'

export default defineConfig({
  plugins: [react()],
  base,
  server: { port: 5173, open: true }
})
