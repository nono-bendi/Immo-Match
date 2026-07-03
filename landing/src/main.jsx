import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { maybeStartAnalytics } from './analytics'

// N'active le traçage qu'en cas de consentement préalable (CNIL). Le bandeau
// cookies déclenche startAnalytics() au clic sur "Accepter".
maybeStartAnalytics()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
