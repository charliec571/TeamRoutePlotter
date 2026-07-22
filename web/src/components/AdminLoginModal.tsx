import { useState, useEffect, useRef } from 'react'

interface AdminLoginModalProps {
  onLogin: (pin: string) => boolean
  onClose: () => void
}

export function AdminLoginModal({ onLogin, onClose }: AdminLoginModalProps) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const backdropRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (onLogin(pin)) {
      onClose()
    } else {
      setError(true)
      setPin('')
    }
  }

  return (
    <div
      className="dialog-backdrop"
      ref={backdropRef}
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Admin Login"
    >
      <div className="dialog qr-dialog" style={{ padding: '2rem' }}>
        <div className="qr-dialog__header" style={{ justifyContent: 'center', marginBottom: '1rem' }}>
          <img
            src="/splash.jpg"
            alt="Logo"
            style={{ width: '80px', height: '80px', objectFit: 'contain', borderRadius: '12px' }}
          />
        </div>

        <h2 className="qr-dialog__title">Admin Access</h2>
        <p className="qr-dialog__instructions" style={{ marginBottom: '1rem' }}>
          Enter the admin PIN to manage routes and meets.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            className="field"
            placeholder="Enter PIN"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value)
              setError(false)
            }}
            autoFocus
            style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.2em', padding: '0.75rem' }}
          />
          
          {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', margin: 0 }}>Incorrect PIN</p>}

          <div className="dialog__actions" style={{ marginTop: '0.5rem' }}>
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={!pin}>
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
