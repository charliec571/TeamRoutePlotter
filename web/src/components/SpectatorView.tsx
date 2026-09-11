import { useState, useMemo, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { AdminLoginModal } from './AdminLoginModal'
import { usePublicCompetition } from '../hooks/usePublicCompetition'
import { NavigateView } from './NavigateView'
import type { PointOfInterest } from '../types'

export function SpectatorView() {
  const { competitionId } = useParams<{ competitionId: string }>()
  const navigate = useNavigate()
  const { login } = useAuth()
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const { competition, loading, error } = usePublicCompetition(competitionId ?? '')
  const [navigatePoint, setNavigatePoint] = useState<PointOfInterest | null>(null)

  // Separate points into Events and Points of Interest (POI)
  const events = useMemo(
    () => competition?.points.filter((p) => p.type !== 'poi') ?? [],
    [competition],
  )
  const pois = useMemo(
    () => competition?.points.filter((p) => p.type === 'poi') ?? [],
    [competition],
  )

  const [activeTab, setActiveTab] = useState<'events' | 'poi'>('events')

  // Private local checklist stored 100% on this parent's phone (only for events)
  const storageKey = competition ? `raider_done_${competition.id}` : ''
  const [completedIds, setCompletedIds] = useState<string[]>([])

  useEffect(() => {
    if (!storageKey) return
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) setCompletedIds(JSON.parse(saved))
    } catch {
      // Ignore private browsing restrictions
    }
  }, [storageKey])

  const toggleEventCompleted = (pointId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setCompletedIds((prev) => {
      const next = prev.includes(pointId)
        ? prev.filter((id) => id !== pointId)
        : [...prev, pointId]
      try {
        if (storageKey) localStorage.setItem(storageKey, JSON.stringify(next))
      } catch {
        // Ignore
      }
      return next
    })
  }

  const resetChecklist = () => {
    if (window.confirm('Reset your completed events checklist?')) {
      setCompletedIds([])
      try {
        if (storageKey) localStorage.removeItem(storageKey)
      } catch {
        // Ignore
      }
    }
  }

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
        <Link to="/" className="btn btn--primary">Go Home</Link>
      </div>
    )
  }

  const currentList = activeTab === 'events' ? events : pois
  const validCompletedCount = completedIds.filter((id) => events.some((e) => e.id === id)).length

  return (
    <section className="spectator-screen">
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

      {/* Header */}
      <header className="spectator-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="spectator-header__eyebrow"><span className="spectator-badge">JROTC Raiders</span></div>
            <h1 className="spectator-header__title">{competition.name}</h1>
          </div>
          <button
            type="button"
            className="btn btn--ghost"
            style={{ padding: 0, margin: 0, background: 'transparent' }}
            onClick={() => setShowAdminLogin(true)}
            aria-label="Admin Login"
          >
            <img src={`${import.meta.env.BASE_URL}emblem.png`} alt="Admin" style={{ width: '64px', height: '64px', objectFit: 'contain' }} />
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

      {/* Events vs Points of Interest (POI) Toggle */}
      <div className="spectator-tab-toggle" style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <button
          type="button"
          className={`spectator-tab-btn ${activeTab === 'events' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('events')}
          style={{
            flex: 1,
            padding: '0.75rem 0.5rem',
            borderRadius: '12px',
            border: activeTab === 'events' ? '2px solid var(--accent)' : '1px solid rgba(255,255,255,0.12)',
            background: activeTab === 'events' ? 'rgba(232, 137, 58, 0.18)' : 'rgba(255,255,255,0.04)',
            color: activeTab === 'events' ? 'var(--accent)' : 'rgba(244,247,245,0.7)',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          🏁 Events ({events.length})
        </button>
        <button
          type="button"
          className={`spectator-tab-btn ${activeTab === 'poi' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('poi')}
          style={{
            flex: 1,
            padding: '0.75rem 0.5rem',
            borderRadius: '12px',
            border: activeTab === 'poi' ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.12)',
            background: activeTab === 'poi' ? 'rgba(59, 130, 246, 0.18)' : 'rgba(255,255,255,0.04)',
            color: activeTab === 'poi' ? '#60a5fa' : 'rgba(244,247,245,0.7)',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          📍 POI / Info ({pois.length})
        </button>
      </div>

      {/* Directory & Items */}
      {currentList.length > 0 ? (
        <div className="spectator-route">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <p className="spectator-route__label" style={{ margin: 0 }}>
              {activeTab === 'events'
                ? `Events (${validCompletedCount}/${events.length} Completed)`
                : `Points of Interest (${pois.length} Locations)`}
            </p>
            {activeTab === 'events' && validCompletedCount > 0 && (
              <button
                type="button"
                className="btn btn--ghost"
                onClick={resetChecklist}
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', color: 'rgba(244,247,245,0.6)' }}
              >
                Reset Checklist
              </button>
            )}
          </div>

          <ol className="spectator-point-list">
            {currentList.map((point, index) => {
              const isPOI = point.type === 'poi'
              const isCompleted = !isPOI && completedIds.includes(point.id)

              return (
                <li key={point.id} className="spectator-point-item">
                  <div
                    className={`spectator-point-btn${isCompleted ? ' is-completed' : ''}`}
                    onClick={() => setNavigatePoint(point)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Events have checkmark toggle; POIs have clean non-checkable badge */}
                    {isPOI ? (
                      <div
                        className="spectator-poi-icon"
                        style={{
                          width: '2.2rem',
                          height: '2.2rem',
                          borderRadius: '999px',
                          display: 'grid',
                          placeItems: 'center',
                          background: 'rgba(59, 130, 246, 0.15)',
                          border: '1.5px solid rgba(59, 130, 246, 0.6)',
                          color: '#60a5fa',
                          fontSize: '1rem',
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        📍
                      </div>
                    ) : (
                      <button
                        type="button"
                        className={`spectator-check-btn${isCompleted ? ' is-checked' : ''}`}
                        onClick={(e) => toggleEventCompleted(point.id, e)}
                        aria-label={isCompleted ? `Mark ${point.name} incomplete` : `Mark ${point.name} completed`}
                        title={isCompleted ? 'Completed (tap to uncheck)' : 'Mark as completed'}
                      >
                        {isCompleted ? '✓' : index + 1}
                      </button>
                    )}

                    <div className="spectator-point-body">
                      <strong style={isCompleted ? { textDecoration: 'line-through', opacity: 0.7 } : undefined}>
                        {point.name}
                      </strong>
                      <span>
                        {isPOI
                          ? 'Tap for line-of-sight navigation →'
                          : isCompleted
                          ? 'Completed · Tap for directions'
                          : 'Tap for line-of-sight navigation →'}
                      </span>
                    </div>

                    <svg className="spectator-point-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </div>
                  {index < currentList.length - 1 && <div className="spectator-connector" aria-hidden="true" />}
                </li>
              )
            })}
          </ol>
          <div className="spectator-footer-note">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {activeTab === 'events'
              ? 'Tap event for navigation · Tap number to mark completed.'
              : 'Tap any point of interest for line-of-sight navigation.'}
          </div>
        </div>
      ) : (
        <div className="spectator-empty">
          <p>
            {activeTab === 'events'
              ? 'No competition events plotted yet.'
              : 'No points of interest (restrooms, parking, concessions, etc.) added yet.'}
          </p>
        </div>
      )}
    </section>
  )
}
