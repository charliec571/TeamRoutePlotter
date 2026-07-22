import { useState, type FormEvent } from 'react'
import type { Competition } from '../types'
import { QRModal } from './QRModal'

interface HomeScreenProps {
  competitions: Competition[]
  onCreate: (name: string, location: string, date: string) => void
  onOpen: (competitionId: string) => void
  onDelete: (competitionId: string) => void
}

export function HomeScreen({ competitions, onCreate, onOpen, onDelete }: HomeScreenProps) {
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [date, setDate] = useState('')
  const [creating, setCreating] = useState(false)
  const [activeQR, setActiveQR] = useState<Competition | null>(null)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onCreate(trimmed, location.trim(), date.trim())
    setName('')
    setLocation('')
    setDate('')
    setCreating(false)
  }

  return (
    <section className="panel-screen">
      <header className="panel-screen__header">
        <div className="map-chrome__brand panel-brand">
          <span className="brand-mark" aria-hidden="true" />
          <div>
            <p className="eyebrow">Team Route Plotter</p>
            <h1>Competitions</h1>
          </div>
        </div>
        <p className="panel-lead">
          Map shared stops once, then give each group its own order.
        </p>
      </header>

      {activeQR && (
        <QRModal
          competitionId={activeQR.id}
          competitionName={activeQR.name}
          onClose={() => setActiveQR(null)}
        />
      )}

      {creating ? (
        <form className="create-form" onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="competition-name">
            Competition name
          </label>
          <input
            id="competition-name"
            className="field"
            type="text"
            placeholder="e.g. Downtown Orienteering"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoFocus
            autoComplete="off"
            required
          />
          <label className="field-label" htmlFor="competition-location" style={{ marginTop: '0.5rem' }}>
            Location (optional)
          </label>
          <input
            id="competition-location"
            className="field"
            type="text"
            placeholder="e.g. Concordia High School"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            autoComplete="off"
          />
          <label className="field-label" htmlFor="competition-date" style={{ marginTop: '0.5rem' }}>
            Date (optional)
          </label>
          <input
            id="competition-date"
            className="field"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
          <div className="dialog__actions">
            <button type="button" className="btn btn--ghost" onClick={() => setCreating(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={!name.trim()}>
              Create
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="btn btn--primary btn--block" onClick={() => setCreating(true)}>
          New competition
        </button>
      )}

      {competitions.length === 0 ? (
        <div className="empty-state">
          <p>Create a competition, plot areas of interest, then assign different routes to each group.</p>
        </div>
      ) : (
        <ul className="card-list">
          {competitions.map((competition) => (
            <li key={competition.id} className="card-row">
              <button
                type="button"
                className="card-row__main"
                onClick={() => onOpen(competition.id)}
              >
                <strong>{competition.name}</strong>
                <span>
                  {competition.date ? `${competition.date} · ` : ''}
                  {competition.points.length}{' '}
                  {competition.points.length === 1 ? 'point' : 'points'} ·{' '}
                  {competition.groups.length}{' '}
                  {competition.groups.length === 1 ? 'group' : 'groups'}
                </span>
              </button>
              <div style={{ display: 'flex', gap: '0.25rem', paddingRight: '0.35rem' }}>
                <button
                  type="button"
                  className="btn btn--ghost btn--icon card-row__qr"
                  aria-label={`Share ${competition.name}`}
                  title="Share with parents"
                  onClick={(e) => {
                    e.stopPropagation()
                    setActiveQR(competition)
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" rx="1"/>
                    <rect x="14" y="3" width="7" height="7" rx="1"/>
                    <rect x="3" y="14" width="7" height="7" rx="1"/>
                    <rect x="14" y="14" width="3" height="3" rx="0.5"/>
                    <rect x="19" y="14" width="2" height="2" rx="0.5"/>
                    <rect x="14" y="19" width="2" height="2" rx="0.5"/>
                    <rect x="19" y="19" width="2" height="2" rx="0.5"/>
                  </svg>
                </button>
                <button
                  type="button"
                  className="btn btn--ghost btn--icon card-row__delete"
                  aria-label={`Delete ${competition.name}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (window.confirm(`Delete “${competition.name}”?`)) {
                      onDelete(competition.id)
                    }
                  }}
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
