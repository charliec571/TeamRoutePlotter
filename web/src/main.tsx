import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import { SpectatorView } from './components/SpectatorView'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        {/* Public spectator view — no login required */}
        <Route path="/view/:competitionId" element={<SpectatorView />} />
        {/* Admin app — all other routes */}
        <Route path="/*" element={<App />} />
      </Routes>
    </HashRouter>
  </StrictMode>,
)
