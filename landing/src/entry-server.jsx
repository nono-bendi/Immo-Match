import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router'
import AppRoutes from './AppRoutes'

// Réexport pour prerender.mjs : source unique des Q/R (JSON-LD FAQPage)
export { default as faqs } from './faqData'

export function render(url) {
  return renderToString(
    <StaticRouter location={url}>
      <AppRoutes />
    </StaticRouter>
  )
}
