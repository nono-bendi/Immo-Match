import { Routes, Route } from 'react-router-dom'
import CookieBanner from './components/CookieBanner'
import FAQ from './pages/FAQ'
import GuideDemarrage from './pages/GuideDemarrage'
import Documentation from './pages/Documentation'
import Showcase from './pages/Showcase'
import Video from './pages/Video'
import Onboarding from './pages/Onboarding'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'

// "/", "/mentions-legales", "/cgu", "/confidentialite" et "/cookies" sont
// des pages statiques (export Webflow, voir landing/landing v2/) : elles ne
// passent plus par le bundle React, donc pas de Route ici pour ces chemins.
export default function AppRoutes() {
  return (
    <>
      <CookieBanner />
      <Routes>
        <Route path="/demarrer"           element={<Onboarding />} />
        <Route path="/showcase"           element={<Showcase />} />
        <Route path="/video"              element={<Video />} />
        <Route path="/faq"                element={<FAQ />} />
        <Route path="/blog"               element={<Blog />} />
        <Route path="/blog/:slug"         element={<BlogPost />} />
        <Route path="/guide-de-demarrage" element={<GuideDemarrage />} />
        <Route path="/documentation"      element={<Documentation />} />
      </Routes>
    </>
  )
}
