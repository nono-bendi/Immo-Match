import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './Home'
import FAQ from './pages/FAQ'
import MentionsLegales from './pages/MentionsLegales'
import CGU from './pages/CGU'
import Confidentialite from './pages/Confidentialite'
import Cookies from './pages/Cookies'
import GuideDemarrage from './pages/GuideDemarrage'
import Documentation from './pages/Documentation'
import Showcase from './pages/Showcase'
import Onboarding from './pages/Onboarding'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                         element={<Home />} />
        <Route path="/demarrer"                 element={<Onboarding />} />
        <Route path="/showcase"                 element={<Showcase />} />
        <Route path="/faq"                      element={<FAQ />} />
        <Route path="/mentions-legales"         element={<MentionsLegales />} />
        <Route path="/cgu"                      element={<CGU />} />
        <Route path="/confidentialite"          element={<Confidentialite />} />
        <Route path="/cookies"                  element={<Cookies />} />
        <Route path="/guide-de-demarrage"       element={<GuideDemarrage />} />
        <Route path="/documentation"            element={<Documentation />} />
      </Routes>
    </BrowserRouter>
  )
}
