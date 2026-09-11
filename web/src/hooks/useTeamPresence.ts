import { useState, useEffect, useRef, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { distanceMeters } from '../utils/geo'
import type { PointOfInterest, TeamPresenceUser, EventPresenceStatus, PresenceHeatLevel } from '../types'

// Detection radius in meters (~105 feet) to cover outdoor event perimeter and spectator sidelines
const EVENT_RADIUS_METERS = 32

// Generate or retrieve anonymous session ID for this browser tab
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

export function useTeamPresence(
  competitionId: string,
  teamId: string | null,
  events: PointOfInterest[],
) {
  const [activeUsers, setActiveUsers] = useState<TeamPresenceUser[]>([])
  const [gpsActive, setGpsActive] = useState(false)
  const currentCoordsRef = useRef<{ latitude: number; longitude: number } | null>(null)
  const lastTrackedTimeRef = useRef<number>(0)

  // 1. Monitor user's GPS position
  useEffect(() => {
    if (!navigator.geolocation) return

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setGpsActive(true)
        currentCoordsRef.current = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }
      },
      () => {
        setGpsActive(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      },
    )

    return () => {
      navigator.geolocation.clearWatch(watchId)
    }
  }, [])

  // 2. Join Supabase Realtime Presence channel for the selected team
  useEffect(() => {
    if (!supabase || !competitionId || !teamId) {
      setActiveUsers([])
      return
    }

    const userId = getSessionUserId()
    const channelName = `team-presence:${competitionId}:${teamId}`
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: userId,
        },
      },
    })

    const sendPresencePing = async () => {
      if (!currentCoordsRef.current) return
      const now = Date.now()
      // Throttle pings to at most once every 12 seconds
      if (now - lastTrackedTimeRef.current < 12000) return
      lastTrackedTimeRef.current = now

      try {
        await channel.track({
          userId,
          latitude: currentCoordsRef.current.latitude,
          longitude: currentCoordsRef.current.longitude,
          timestamp: now,
        })
      } catch {
        // Ignore network drops
      }
    }

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<TeamPresenceUser>()
        const now = Date.now()
        const users: TeamPresenceUser[] = []

        for (const key of Object.keys(state)) {
          const list = state[key]
          if (Array.isArray(list)) {
            for (const item of list) {
              // Ignore stale pings older than 75 seconds
              if (item && item.latitude && item.longitude && now - (item.timestamp || 0) < 75000) {
                users.push(item)
              }
            }
          }
        }
        setActiveUsers(users)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Immediately send location if available
          sendPresencePing()
        }
      })

    // Periodic check-in interval (every 15s)
    const interval = setInterval(() => {
      sendPresencePing()
    }, 15000)

    return () => {
      clearInterval(interval)
      channel.unsubscribe()
    }
  }, [competitionId, teamId])

  // 3. Compute per-event crowd count and dynamic heat level
  const eventStatusMap = useMemo<Record<string, EventPresenceStatus>>(() => {
    const result: Record<string, EventPresenceStatus> = {}

    for (const ev of events) {
      let count = 0
      let heatScore = 0

      for (const u of activeUsers) {
        const dist = distanceMeters(
          { latitude: u.latitude, longitude: u.longitude },
          { latitude: ev.latitude, longitude: ev.longitude },
        )

        if (dist <= EVENT_RADIUS_METERS) {
          count++
          // Proximity weight: someone 5m away adds 0.84, someone 30m away adds 0.06
          const proximityWeight = Math.max(0.1, 1 - dist / EVENT_RADIUS_METERS)
          heatScore += proximityWeight
        }
      }

      // Determine brightness / heat level:
      // Requirement: only light up if 2 or more users are near!
      let heatLevel: PresenceHeatLevel = 'none'
      if (count >= 2) {
        if (count >= 5 || heatScore >= 3.5) {
          heatLevel = 'high' // Ultra bright spotlight
        } else if (count >= 3 || heatScore >= 1.8) {
          heatLevel = 'med'  // Vivid bright green glow
        } else {
          heatLevel = 'low'  // Soft emerald highlight
        }
      }

      result[ev.id] = {
        count,
        heatLevel,
        heatScore,
      }
    }

    return result
  }, [events, activeUsers])

  return {
    activeUsersCount: activeUsers.length,
    gpsActive,
    eventStatusMap,
  }
}
