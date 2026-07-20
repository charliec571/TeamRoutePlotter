import { useEffect, useRef, useState, type FormEvent } from 'react'

interface AddPointDialogProps {
  open: boolean
  latitude: number
  longitude: number
  onAdd: (name: string) => void
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
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setName('')
      const frame = window.requestAnimationFrame(() => inputRef.current?.focus())
      return () => window.cancelAnimationFrame(frame)
    }
  }, [open])

  if (!open) return null

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onAdd(trimmed)
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
        <h2 id="add-point-title">Name this location</h2>
        <p className="dialog__coords">
          {latitude.toFixed(5)}, {longitude.toFixed(5)}
        </p>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            className="field"
            placeholder="e.g. Meet at fountain"
            value={name}
            onChange={(event) => setName(event.target.value)}
            enterKeyHint="done"
            autoComplete="off"
          />
          <div className="dialog__actions">
            <button type="button" className="btn btn--ghost" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={!name.trim()}>
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
