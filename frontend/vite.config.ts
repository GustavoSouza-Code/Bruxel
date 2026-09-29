import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // habilita o suporte a JSX e o Fast Refresh (a página atualiza na hora ao salvar)
  plugins: [react()],
})
