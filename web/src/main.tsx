import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import App from './App'
import { SpectatorHome } from './components/SpectatorHome'
import { SpectatorView } from './components/SpectatorView'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        {/* Public spectator home — default landing for everyone */}
        <Route path="/" element={<SpectatorHome />} />

        {/* Public spectator competition view — school + team dropdown, read-only */}
        <Route path="/view/:competitionId" element={<SpectatorView />} />

        {/* Admin console — only accessible by tapping the logo and entering the PIN */}
        <Route path="/admin/*" element={<App />} />

        {/* Catch-all → home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  </StrictMode>,
)
