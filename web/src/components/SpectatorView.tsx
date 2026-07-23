import { useState, useMemo, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { AdminLoginModal } from './AdminLoginModal'
import { usePublicCompetition } from '../hooks/usePublicCompetition'
import { NavigateView } from './NavigateView'
import type { PointOfInterest } from '../types'
import { resolveRoute } from '../utils/storage'

export function SpectatorView() {
  const { competitionId } = useParams<{ competitionId: string }>()
  const navigate = useNavigate()
  const { login } = useAuth()
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const { competition, loading, error } = usePublicCompetition(competitionId ?? '')
  const [selectedGroupId, setSelectedGroupId] = useState<string>('')
  const [navigatePoint, setNavigatePoint] = useState<PointOfInterest | null>(null)

  const selectedGroup = useMemo(
    () => competition?.groups.find((g) => g.id === selectedGroupId) ?? null,
    [competition, selectedGroupId],
  )

  const orderedPoints = useMemo(() => {
    if (!competition || !selectedGroup) return []
    return resolveRoute(competition.points, selectedGroup.routeOrder)
  }, [competition, selectedGroup])

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

  if (navigatePoint) {
    return <NavigateView point={navigatePoint} onBack={() => setNavigatePoint(null)} />
  }

  if (loading) {
    return null
  }

  if (error || !competition) {
    return (
      <div className="spectator-error">
        <div className="spectator-error__icon">⚠️</div>
        <h1>Meet Not Found</h1>
        <p>{error ?? 'This link may be invalid or the meet has been deleted.'}</p>
        <Link to="/" className="btn btn--primary">
          Go Home
        </Link>
      </div>
    )
  }

  return (
    <section className="spectator-screen">
      {showAdminLogin && (
        <AdminLoginModal
          onLogin={(pin) => {
            const success = login(pin)
            if (success) navigate('/')
            return success
          }}
          onClose={() => setShowAdminLogin(false)}
        />
      )}

      {/* Header */}
      <header className="spectator-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="spectator-header__eyebrow">
              <span className="spectator-badge">JROTC Raiders</span>
            </div>
            <h1 className="spectator-header__title">{competition.name}</h1>
          </div>
          <button
            type="button"
            className="btn btn--ghost btn--icon"
            style={{ padding: 0, margin: 0, overflow: 'hidden', borderRadius: '12px' }}
            onClick={() => setShowAdminLogin(true)}
            aria-label="Admin Login"
          >
            <img src="/emblem.png" alt="Admin" style={{ width: '44px', height: '44px', objectFit: 'cover' }} />
          </button>
        </div>
        {(competition.location || competition.date) && (
          <div className="spectator-header__meta">
            {competition.location && (
              <span className="spectator-meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                {competition.location}
              </span>
            )}
            {competition.date && (
              <span className="spectator-meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                {competition.date}
              </span>
            )}
          </div>
        )}
      </header>

      {/* Team Selector */}
      <div className="spectator-selector">
        <label className="spectator-selector__label" htmlFor="team-select">
          Select Your Team
        </label>
        <div className="spectator-selector__wrap">
          <select
            id="team-select"
            className="spectator-select"
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
          >
            <option value="">— Choose a team —</option>
            {competition.groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
          <svg className="spectator-select__chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {/* Route List */}
      {selectedGroup && orderedPoints.length > 0 ? (
        <div className="spectator-route">
          <p className="spectator-route__label">
            Your event order — tap any stop for directions
          </p>
          <ol className="spectator-point-list">
            {orderedPoints.map((point, index) => (
              <li key={point.id} className="spectator-point-item">
                <button
                  type="button"
                  className="spectator-point-btn"
                  onClick={() => setNavigatePoint(point)}
                >
                  <span className="spectator-point-index">{index + 1}</span>
                  <div className="spectator-point-body">
                    <strong>{point.name}</strong>
                    <span>Tap for line-of-sight navigation →</span>
                  </div>
                  <svg className="spectator-point-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                </button>
                {index < orderedPoints.length - 1 && (
                  <div className="spectator-connector" aria-hidden="true" />
                )}
              </li>
            ))}
          </ol>

          <div className="spectator-footer-note">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Directions are straight-line (line of sight), not turn-by-turn roads.
          </div>
        </div>
      ) : selectedGroup ? (
        <div className="spectator-empty">
          <p>No events configured for this meet yet.</p>
        </div>
      ) : (
        <div className="spectator-prompt">
          <div className="spectator-prompt__icon">👆</div>
          <p>Select your team above to see<br />your event rotation.</p>
        </div>
      )}
    </section>
  )
}
