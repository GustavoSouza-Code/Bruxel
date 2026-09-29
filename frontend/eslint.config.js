import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // não analisa a pasta de build
  globalIgnores(['dist']),
  {
    // as regras abaixo valem só para arquivos TypeScript/React
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      // regras dos hooks (ex.: dependências do useEffect, hooks só no topo da função)
      reactHooks.configs.flat.recommended,
      // mantém o Fast Refresh funcionando (arquivo de componente deve exportar só componentes)
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      // libera as variáveis do navegador (window, document...) sem acusar "não definido"
      globals: globals.browser,
    },
  },
])
