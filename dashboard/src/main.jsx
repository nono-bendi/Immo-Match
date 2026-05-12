import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './contexts/ThemeContext'

posthog.init('phc_yFKU2CNX4miygcMq3CXi3ebCdALEZX8qxZ6DPnbkCqgC', {
  api_host: 'https://us.i.posthog.com',
  person_profiles: 'identified_only',
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PostHogProvider client={posthog}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </PostHogProvider>
  </StrictMode>,
)
