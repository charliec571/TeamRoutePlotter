import { useState, useRef, useEffect } from 'react'
import { useTeamMessages } from '../hooks/useTeamMessages'

interface TeamMessageBoardProps {
  competitionId: string
  teamId: string
  teamName?: string
  onClose?: () => void
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now = Date.now()
  const diffMinutes = Math.floor((now - timestamp) / 60000)

  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`

  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

export function TeamMessageBoard({ competitionId, teamId, teamName, onClose }: TeamMessageBoardProps) {
  const { messages, sendMessage, sending } = useTeamMessages(competitionId, teamId)
  const [inputText, setInputText] = useState('')
  const listContainerRef = useRef<HTMLDivElement>(null)

  const remainingChars = 80 - inputText.length

  // Only scroll the internal message box, NEVER the document window!
  useEffect(() => {
    if (listContainerRef.current) {
      listContainerRef.current.scrollTop = listContainerRef.current.scrollHeight
    }
  }, [messages.length])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || sending) return
    const text = inputText
    setInputText('')
    await sendMessage(text)
  }

  return (
    <div className="team-msg-board">
      <div className="team-msg-header">
        <span className="team-msg-title">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {teamName ? `${teamName} Chat` : 'Team Chat'}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span className="team-msg-privacy-hint">80 char limit</span>
          {onClose && (
            <button
              type="button"
              className="team-msg-close-btn"
              onClick={onClose}
              aria-label="Hide Chat"
              title="Hide Chat"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Messages list */}
      <div className="team-msg-list" ref={listContainerRef}>
        {messages.length === 0 ? (
          <div className="team-msg-empty">
            No updates yet. Post where you are or what's next!
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="team-msg-item">
              <span className="team-msg-text">{m.text}</span>
              <span className="team-msg-time">{formatTime(m.createdAt)}</span>
            </div>
          ))
        )}
      </div>

      {/* Composer */}
      <form className="team-msg-form" onSubmit={handleSubmit}>
        <div className="team-msg-input-wrap">
          <input
            type="text"
            className="team-msg-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value.slice(0, 80))}
            placeholder="Quick team update (e.g. Headed to Rope Bridge)"
            maxLength={80}
          />
          <span className={`team-msg-counter ${remainingChars <= 10 ? 'is-low' : ''}`}>
            {remainingChars}
          </span>
        </div>
        <button
          type="submit"
          className="team-msg-send-btn"
          disabled={!inputText.trim() || sending}
          aria-label="Send message"
          title="Send message"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>
    </div>
  )
}
