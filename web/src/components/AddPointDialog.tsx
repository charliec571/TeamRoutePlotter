import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { PointType } from '../types'

interface AddPointDialogProps {
  open: boolean
  latitude: number
  longitude: number
  onAdd: (name: string, type: PointType) => void
  onCancel: () => void
}

export function AddPointDialog({
  open,
  latitude,
  longitude,
  onAdd,
  onCancel,
}: AddPointDialogProps) {
  const [name, setName] = useState('')
  const [pointType, setPointType] = useState<PointType>('event')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setName('')
      setPointType('event')
      const frame = window.requestAnimationFrame(() => inputRef.current?.focus())
      return () => window.cancelAnimationFrame(frame)
    }
  }, [open])

  if (!open) return null

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onAdd(trimmed, pointType)
  }

  return (
    <div className="dialog-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-point-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="add-point-title">Add Location</h2>
        <p className="dialog__coords">
          {latitude.toFixed(5)}, {longitude.toFixed(5)}
        </p>
        <form onSubmit={handleSubmit}>
          <label className="field-label" style={{ display: 'block', marginBottom: '0.35rem' }}>
            Location Type
          </label>
          <div className="point-type-selector" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <button
              type="button"
              className={`point-type-btn ${pointType === 'event' ? 'is-active' : ''}`}
              onClick={() => setPointType('event')}
              style={{
                flex: 1,
                padding: '0.6rem 0.5rem',
                borderRadius: '10px',
                border: pointType === 'event' ? '2px solid var(--accent)' : '1px solid rgba(255,255,255,0.12)',
                background: pointType === 'event' ? 'rgba(232, 137, 58, 0.15)' : 'rgba(255,255,255,0.04)',
                color: pointType === 'event' ? 'var(--accent)' : 'inherit',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              🏁 Event
            </button>
            <button
              type="button"
              className={`point-type-btn ${pointType === 'poi' ? 'is-active' : ''}`}
              onClick={() => setPointType('poi')}
              style={{
                flex: 1,
                padding: '0.6rem 0.5rem',
                borderRadius: '10px',
                border: pointType === 'poi' ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.12)',
                background: pointType === 'poi' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.04)',
                color: pointType === 'poi' ? '#60a5fa' : 'inherit',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              📍 Point of Interest (POI)
            </button>
          </div>

          <label className="field-label" htmlFor="new-loc-name" style={{ display: 'block', marginBottom: '0.25rem' }}>
            {pointType === 'event' ? 'Event Name' : 'POI Name (e.g. Restrooms, Parking)'}
          </label>
          <input
            id="new-loc-name"
            ref={inputRef}
            type="text"
            className="field"
            placeholder={pointType === 'event' ? 'e.g. Rope Bridge, 5K Run' : 'e.g. Restrooms, Concessions, Camp'}
            value={name}
            onChange={(event) => setName(event.target.value)}
            enterKeyHint="done"
            autoComplete="off"
            required
          />
          <div className="dialog__actions" style={{ marginTop: '1rem' }}>
            <button type="button" className="btn btn--ghost" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={!name.trim()}>
              Add Location
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
