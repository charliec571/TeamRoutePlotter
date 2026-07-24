import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { AdminLoginModal } from './AdminLoginModal'
import { supabase } from '../lib/supabase'
import { loadCompetitions } from '../utils/storage'
import type { Competition } from '../types'

/**
 * Public landing page — lists all active competitions.
 * No auth required. The emblem in the top-right is the only gateway
 * to the Admin console (tapping it prompts for the PIN).
 */
export function SpectatorHome() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        if (supabase) {
          const { data } = await supabase
            .from('competitions')
            .select('id, name, location, date, created_at')
            .order('created_at', { ascending: false })

          setCompetitions(
            (data ?? []).map((c) => ({
              id: c.id,
              name: c.name,
              location: c.location ?? '',
              date: c.date ?? '',
              createdAt: new Date(c.created_at.replace(' ', 'T')).getTime(),
              points: [],
              groups: [],
              schools: [],
            })),
          )
        } else {
          setCompetitions(loadCompetitions())
        }
      } catch {
        // Gracefully fall back to empty list
        setCompetitions([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Dismiss splash screen once loaded
  useEffect(() => {
    if (!loading) {
      setTimeout(() => {
        const splash = document.getElementById('initial-splash')
        if (splash) {
          splash.style.opacity = '0'
          splash.style.visibility = 'hidden'
          setTimeout(() => splash.remove(), 500)
        }
      }, 2000)
    }
  }, [loading])

  if (loading) {
    return null
  }

  return (
    <div className="spectator-screen">
      {showAdminLogin && (
        <AdminLoginModal
          onLogin={(pin) => {
            const success = login(pin)
            if (success) navigate('/admin')
            return success
          }}
          onClose={() => setShowAdminLogin(false)}
        />
      )}

      <header className="spectator-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="spectator-header__eyebrow">
              <span className="spectator-badge">JROTC Raiders</span>
            </div>
            <h1 className="spectator-header__title">Active Meets</h1>
          </div>
          <button
            type="button"
            className="btn btn--ghost"
            style={{ padding: 0, margin: 0, background: 'transparent' }}
            onClick={() => setShowAdminLogin(true)}
            aria-label="Admin Login"
            id="admin-login-btn"
          >
            <img
              src={`${import.meta.env.BASE_URL}emblem.png`}
              alt="Admin"
              style={{ width: '64px', height: '64px', objectFit: 'contain' }}
            />
          </button>
        </div>
      </header>

      <div style={{ padding: '0 1rem', marginTop: '1rem' }}>
        {competitions.length === 0 ? (
          <div className="spectator-empty">
            <div className="spectator-prompt__icon">🏁</div>
            <p>No active meets right now. Check back soon!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {competitions.map((comp) => (
              <Link
                key={comp.id}
                to={`/view/${comp.id}`}
                style={{
                  display: 'block',
                  padding: '1.25rem',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  borderRadius: '16px',
                  textDecoration: 'none',
                  color: 'inherit',
                  border: '1px solid rgba(255,255,255,0.08)',
                  transition: 'background 0.15s ease, border-color 0.15s ease',
                }}
              >
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>{comp.name}</h3>
                <div
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    color: 'rgba(244,247,245,0.6)',
                    fontSize: '0.85rem',
                  }}
                >
                  {comp.location && <span>📍 {comp.location}</span>}
                  {comp.date && <span>📅 {comp.date}</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
