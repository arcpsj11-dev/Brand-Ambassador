import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Styling handled via index.html link to bypass Vite build crash
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
