import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

/**
 * Ponto de entrada do frontend: monta o React dentro do <div id="root"> do
 * index.html. O StrictMode roda alguns efeitos duas vezes em desenvolvimento
 * pra ajudar a achar bugs (não muda nada na versão de produção).
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
