import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { TeamMessage } from '../types'

function getSessionUserId(): string {
  try {
    const existing = sessionStorage.getItem('raider_presence_uid')
    if (existing) return existing
    const created = 'u_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36)
    sessionStorage.setItem('raider_presence_uid', created)
    return created
  } catch {
    return 'u_' + Math.random().toString(36).substring(2, 9)
  }
}

export function useTeamMessages(competitionId: string, teamId: string | null) {
  const [messages, setMessages] = useState<TeamMessage[]>([])
  const [sending, setSending] = useState(false)
  const channelRef = useRef<ReturnType<NonNullable<typeof supabase>['channel']> | null>(null)
  const storageKey = competitionId && teamId ? `raider_team_msgs_${competitionId}_${teamId}` : ''

  // Load cached messages and fetch from Supabase if table exists
  useEffect(() => {
    if (!competitionId || !teamId) {
      setMessages([])
      return
    }

    // 1. Initial load from local cache
    let initialMsgs: TeamMessage[] = []
    if (storageKey) {
      try {
        const cached = localStorage.getItem(storageKey)
        if (cached) {
          initialMsgs = JSON.parse(cached)
          setMessages(initialMsgs)
        }
      } catch {
        // Ignore private browsing errors
      }
    }

    // 2. Fetch from Supabase team_messages table if it exists
    if (supabase) {
      const fetchDbMessages = async () => {
        try {
          const { data, error } = await supabase!
            .from('team_messages')
            .select('*')
            .eq('competition_id', competitionId)
            .eq('team_id', teamId)
            .order('created_at', { ascending: true })
            .limit(200)

          if (!error && Array.isArray(data)) {
            const dbMsgs: TeamMessage[] = data.map((d) => ({
              id: d.id,
              text: d.text,
              createdAt: new Date(d.created_at).getTime(),
            }))

            setMessages((prev) => {
              const map = new Map<string, TeamMessage>()
              for (const m of prev) map.set(m.id, m)
              for (const m of dbMsgs) map.set(m.id, m)
              const combined = Array.from(map.values()).sort((a, b) => a.createdAt - b.createdAt)
              try {
                if (storageKey) localStorage.setItem(storageKey, JSON.stringify(combined.slice(-200)))
              } catch {
                // Ignore
              }
              return combined.slice(-200)
            })
          }
        } catch {
          // Table doesn't exist yet; fall back silently to Realtime Broadcast + Presence
        }
      }

      fetchDbMessages()
    }

    // 3. Connect to Supabase Realtime channel for live team chat
    if (!supabase) return

    const userId = getSessionUserId()
    const channelName = `team-chat:${competitionId}:${teamId}`
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false },
        presence: { key: userId },
      },
    })

    channelRef.current = channel

    // Listen for live broadcast messages from team members
    channel.on('broadcast', { event: 'new_message' }, ({ payload }) => {
      if (payload && payload.id && payload.text) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === payload.id)) return prev
          const next = [...prev, payload as TeamMessage].slice(-200)
          try {
            if (storageKey) localStorage.setItem(storageKey, JSON.stringify(next))
          } catch {
            // Ignore
          }
          return next
        })
      }
    })

    // Sync recent messages from online peers when joining
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<{ latestMessage?: TeamMessage }>()
      const peerMessages: TeamMessage[] = []
      for (const key of Object.keys(state)) {
        const list = state[key]
        if (Array.isArray(list)) {
          for (const item of list) {
            if (item?.latestMessage && item.latestMessage.id) {
              peerMessages.push(item.latestMessage)
            }
          }
        }
      }

      if (peerMessages.length > 0) {
        setMessages((prev) => {
          let updated = false
          const map = new Map<string, TeamMessage>()
          for (const m of prev) map.set(m.id, m)
          for (const m of peerMessages) {
            if (!map.has(m.id)) {
              map.set(m.id, m)
              updated = true
            }
          }
          if (!updated) return prev
          const next = Array.from(map.values()).sort((a, b) => a.createdAt - b.createdAt).slice(-200)
          try {
            if (storageKey) localStorage.setItem(storageKey, JSON.stringify(next))
          } catch {
            // Ignore
          }
          return next
        })
      }
    })

    channel.subscribe()

    return () => {
      channel.unsubscribe()
      channelRef.current = null
    }
  }, [competitionId, teamId, storageKey])

  // Send an 80-character maximum message
  const sendMessage = useCallback(
    async (rawText: string): Promise<boolean> => {
      const text = rawText.trim().slice(0, 80)
      if (!text || !competitionId || !teamId) return false

      setSending(true)
      const userId = getSessionUserId()
      const newMsg: TeamMessage = {
        id: 'm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        text,
        createdAt: Date.now(),
        senderId: userId,
      }

      // Optimistically append locally
      setMessages((prev) => {
        const next = [...prev, newMsg].slice(-200)
        try {
          if (storageKey) localStorage.setItem(storageKey, JSON.stringify(next))
        } catch {
          // Ignore
        }
        return next
      })

      // 1. Broadcast to everyone currently on the team channel
      if (channelRef.current) {
        try {
          await channelRef.current.send({
            type: 'broadcast',
            event: 'new_message',
            payload: newMsg,
          })
          // Also track in presence so incoming users catch this message
          await channelRef.current.track({
            userId,
            latestMessage: newMsg,
          })
        } catch {
          // Ignore network glitch
        }
      }

      // 2. Persist to Supabase table if available
      if (supabase) {
        try {
          await supabase.from('team_messages').insert({
            id: newMsg.id,
            competition_id: competitionId,
            team_id: teamId,
            text: newMsg.text,
            created_at: new Date(newMsg.createdAt).toISOString(),
          })
        } catch {
          // Ignore if table doesn't exist
        }
      }

      setSending(false)
      return true
    },
    [competitionId, teamId, storageKey],
  )

  return {
    messages,
    sendMessage,
    sending,
  }
}
