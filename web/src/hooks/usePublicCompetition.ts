import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Competition } from '../types'
import { loadCompetitions } from '../utils/storage'

/**
 * Loads a single competition by ID from Supabase (or localStorage fallback).
 * Used by the public spectator view — no auth required.
 */
export function usePublicCompetition(competitionId: string) {
  const [competition, setCompetition] = useState<Competition | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!competitionId) return

    async function load() {
      setLoading(true)
      setError(null)

      try {
        if (supabase) {
          const { data: comp, error: ce } = await supabase
            .from('competitions')
            .select('*')
            .eq('id', competitionId)
            .single()

          if (ce || !comp) throw new Error('Competition not found')

          const { data: points } = await supabase
            .from('points')
            .select('*')
            .eq('competition_id', competitionId)
            .order('display_order')

          const { data: groups } = await supabase
            .from('groups')
            .select('*')
            .eq('competition_id', competitionId)

          setCompetition({
            id: comp.id,
            name: comp.name,
            location: comp.location ?? '',
            date: comp.date ?? '',
            createdAt: new Date(comp.created_at).getTime(),
            points: (points ?? []).map((p) => ({
              id: p.id,
              name: p.name,
              latitude: p.latitude,
              longitude: p.longitude,
            })),
            groups: (groups ?? []).map((g) => ({
              id: g.id,
              name: g.name,
              routeOrder: g.route_order ?? [],
            })),
          })
        } else {
          // Fallback: search localStorage
          const all = loadCompetitions()
          const found = all.find((c) => c.id === competitionId)
          if (!found) throw new Error('Competition not found')
          setCompetition(found)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load meet')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [competitionId])

  return { competition, loading, error }
}
