import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { PointOfInterest, PointType } from '../types'

interface EditPointDialogProps {
  point: PointOfInterest | null
  open: boolean
  onSave: (pointId: string, updates: { name: string; latitude: number; longitude: number; type: PointType }) => void
  onDelete: (pointId: string) => void
  onCancel: () => void
}

export function EditPointDialog({
  point,
  open,
  onSave,
  onDelete,
  onCancel,
}: EditPointDialogProps) {
  const [name, setName] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [pointType, setPointType] = useState<PointType>('event')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && point) {
      setName(point.name)
      setLatitude(point.latitude.toString())
      setLongitude(point.longitude.toString())
      setPointType(point.type || 'event')
      setError(null)
      const frame = window.requestAnimationFrame(() => inputRef.current?.focus())
      return () => window.cancelAnimationFrame(frame)
    }
  }, [open, point])

  if (!open || !point) return null

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Please enter a name for the point.')
      return
    }

    const latNum = parseFloat(latitude)
    const lngNum = parseFloat(longitude)

    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      setError('Latitude must be a valid number between -90 and 90.')
      return
    }

    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      setError('Longitude must be a valid number between -180 and 180.')
      return
    }

    onSave(point.id, {
      name: trimmed,
      latitude: latNum,
      longitude: lngNum,
      type: pointType,
    })
  }

  const handleDelete = () => {
    if (window.confirm(`Delete point "${point.name}"? This will remove it from all group routes.`)) {
      onDelete(point.id)
    }
  }

  return (
    <div className="dialog-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-point-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h2 id="edit-point-title" style={{ margin: 0 }}>Edit Point</h2>
          <button
            type="button"
            className="btn btn--danger btn--icon"
            style={{ fontSize: '0.85rem', padding: '0.4rem 0.65rem' }}
            onClick={handleDelete}
            title="Delete this point"
            aria-label="Delete this point"
          >
            🗑 Delete
          </button>
        </div>

        {error && (
          <p style={{ color: '#dc2626', fontSize: '0.85rem', margin: '0 0 0.75rem 0' }}>
            {error}
          </p>
        )}

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

          <label className="field-label" htmlFor="edit-point-name" style={{ display: 'block', marginBottom: '0.25rem' }}>
            {pointType === 'event' ? 'Event Name' : 'POI Name'}
          </label>
          <input
            id="edit-point-name"
            ref={inputRef}
            type="text"
            className="field"
            placeholder="e.g. Obstacle Course"
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              setError(null)
            }}
            autoComplete="off"
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.75rem' }}>
            <div>
              <label className="field-label" htmlFor="edit-point-lat" style={{ display: 'block', marginBottom: '0.25rem' }}>
                Latitude
              </label>
              <input
                id="edit-point-lat"
                type="number"
                step="any"
                className="field"
                placeholder="37.7749"
                value={latitude}
                onChange={(event) => {
                  setLatitude(event.target.value)
                  setError(null)
                }}
                required
              />
            </div>
            <div>
              <label className="field-label" htmlFor="edit-point-lng" style={{ display: 'block', marginBottom: '0.25rem' }}>
                Longitude
              </label>
              <input
                id="edit-point-lng"
                type="number"
                step="any"
                className="field"
                placeholder="-122.4194"
                value={longitude}
                onChange={(event) => {
                  setLongitude(event.target.value)
                  setError(null)
                }}
                required
              />
            </div>
          </div>

          <div className="dialog__actions" style={{ marginTop: '1.25rem' }}>
            <button type="button" className="btn btn--ghost" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={!name.trim() || !latitude || !longitude}>
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
