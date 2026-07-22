import { useEffect, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'

interface QRModalProps {
  competitionId: string
  competitionName: string
  onClose: () => void
}

export function QRModal({ competitionId, competitionName, onClose }: QRModalProps) {
  const url = `${window.location.origin}/view/${competitionId}`
  const backdropRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // ignore
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
      aria-label={`QR code for ${competitionName}`}
    >
      <div className="dialog qr-dialog">
        <div className="qr-dialog__header">
          <p className="eyebrow" style={{ color: 'var(--accent-strong)', margin: 0 }}>
            Share with Parents
          </p>
          <button
            type="button"
            className="btn btn--ghost btn--icon"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <h2 className="qr-dialog__title">{competitionName}</h2>

        <div className="qr-dialog__code">
          <QRCodeSVG
            value={url}
            size={220}
            bgColor="transparent"
            fgColor="#12201b"
            level="M"
          />
        </div>

        <p className="qr-dialog__instructions">
          Parents scan this code to pick their team and see their event order.
        </p>

        <div className="qr-dialog__url">
          <span className="qr-dialog__url-text">{url}</span>
          <button
            type="button"
            className="btn btn--secondary qr-copy-btn"
            onClick={handleCopy}
            aria-label="Copy link"
          >
            Copy link
          </button>
        </div>

        <button
          type="button"
          className="btn btn--primary btn--block"
          onClick={() => window.print()}
        >
          Print QR Code
        </button>
      </div>
    </div>
  )
}
