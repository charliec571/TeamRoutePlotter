import { useState, type FormEvent } from 'react'
import type { Competition } from '../types'

interface HomeScreenProps {
  competitions: Competition[]
  onCreate: (name: string) => void
  onOpen: (competitionId: string) => void
  onDelete: (competitionId: string) => void
}

export function HomeScreen({ competitions, onCreate, onOpen, onDelete }: HomeScreenProps) {
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onCreate(trimmed)
    setName('')
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
                  {competition.points.length}{' '}
                  {competition.points.length === 1 ? 'point' : 'points'} ·{' '}
                  {competition.groups.length}{' '}
                  {competition.groups.length === 1 ? 'group' : 'groups'}
                </span>
              </button>
              <button
                type="button"
                className="btn btn--ghost btn--icon card-row__delete"
                aria-label={`Delete ${competition.name}`}
                onClick={() => {
                  if (window.confirm(`Delete “${competition.name}”?`)) {
                    onDelete(competition.id)
                  }
                }}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
