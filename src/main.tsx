import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { PwaUpdatePrompt } from './components/ui/PwaUpdatePrompt.tsx'

window.addEventListener('error', (e) => {
  const root = document.getElementById('root')
  if (root) root.innerHTML = `<div style="color:red; padding:20px; background:white; z-index:9999; position:relative;"><h1>Fatal Error</h1><pre>${e.error?.stack || e.message}</pre></div>`
})
window.addEventListener('unhandledrejection', (e) => {
  const root = document.getElementById('root')
  if (root) root.innerHTML = `<div style="color:red; padding:20px; background:white; z-index:9999; position:relative;"><h1>Unhandled Promise Rejection</h1><pre>${e.reason?.stack || e.reason}</pre></div>`
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <PwaUpdatePrompt />
  </StrictMode>,
)
