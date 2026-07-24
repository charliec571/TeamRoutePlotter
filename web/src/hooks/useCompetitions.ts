import { useCallback, useEffect, useRef, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Competition, Group, PointOfInterest } from '../types'
import { loadCompetitions, saveCompetitions, shuffleIds } from '../utils/storage'
import { supabase } from '../lib/supabase'

// ─── Supabase sync helpers ────────────────────────────────────────────────────

async function dbLoadCompetitions(): Promise<Competition[]> {
  if (!supabase) return loadCompetitions()

  const { data: comps, error: ce } = await supabase
    .from('competitions')
    .select('*')
    .order('created_at', { ascending: false })

  if (ce || !comps) return loadCompetitions()


  const { data: allPoints } = await supabase.from('points').select('*').order('display_order')
  const { data: allGroups } = await supabase.from('groups').select('*')
  const { data: allSchools } = await supabase.from('schools').select('*')
  const { data: allTeams } = await supabase.from('teams').select('*')


  return comps.map((comp) => ({
    id: comp.id,
    name: comp.name,
    location: comp.location ?? '',
    date: comp.date ?? '',
    createdAt: new Date(comp.created_at.replace(' ', 'T')).getTime(),
    points: (allPoints ?? [])
      .filter((p) => p.competition_id === comp.id)
      .map((p) => ({
        id: p.id,
        name: p.name,
        latitude: p.latitude,
        longitude: p.longitude,
      })),

    groups: (allGroups ?? [])
      .filter((g) => g.competition_id === comp.id)
      .map((g) => ({
        id: g.id,
        name: g.name,
        routeOrder: g.route_order ?? [],
      })),
    schools: (allSchools ?? [])
      .filter((s) => s.competition_id === comp.id)
      .map((s) => ({
        id: s.id,
        name: s.name,
        teams: (allTeams ?? [])
          .filter((t) => t.school_id === s.id)
          .map((t) => ({
            id: t.id,
            name: t.name,
            groupId: t.group_id,
          })),
      })),

  }))
}

async function dbCreateCompetition(comp: Competition): Promise<void> {
  if (!supabase) return
  await supabase.from('competitions').insert({
    id: comp.id,
    name: comp.name,
    location: comp.location ?? null,
    date: comp.date ?? null,
    created_at: new Date(comp.createdAt).toISOString(),
  })
}

async function dbDeleteCompetition(id: string): Promise<void> {
  if (!supabase) return
  await supabase.from('competitions').delete().eq('id', id)
}

async function dbUpsertPoint(
  competitionId: string,
  point: PointOfInterest,
  order: number,
): Promise<void> {
  if (!supabase) return
  await supabase.from('points').upsert({
    id: point.id,
    competition_id: competitionId,
    name: point.name,
    latitude: point.latitude,
    longitude: point.longitude,
    display_order: order,
  })
}

async function dbDeletePoint(pointId: string): Promise<void> {
  if (!supabase) return
  await supabase.from('points').delete().eq('id', pointId)
}

async function dbUpsertGroup(competitionId: string, group: Group): Promise<void> {
  if (!supabase) return
  await supabase.from('groups').upsert({
    id: group.id,
    competition_id: competitionId,
    name: group.name,
    route_order: group.routeOrder,
  })
}

async function dbDeleteGroup(groupId: string): Promise<void> {
  if (!supabase) return
  await supabase.from('groups').delete().eq('id', groupId)
}


async function dbUpsertSchool(competitionId: string, schoolId: string, name: string): Promise<void> {
  if (!supabase) return
  await supabase.from('schools').upsert({
    id: schoolId,
    competition_id: competitionId,
    name,
  })
}

async function dbDeleteSchool(schoolId: string): Promise<void> {
  if (!supabase) return
  await supabase.from('schools').delete().eq('id', schoolId)
}

async function dbUpsertTeam(schoolId: string, teamId: string, name: string, groupId: string | null): Promise<void> {
  if (!supabase) return
  await supabase.from('teams').upsert({
    id: teamId,
    school_id: schoolId,
    name,
    group_id: groupId,
  })
}

async function dbDeleteTeam(teamId: string): Promise<void> {
  if (!supabase) return
  await supabase.from('teams').delete().eq('id', teamId)
}

// ─── Hook ─────────────────────────────────────────────────────────────────────


export function useCompetitions() {
  const [competitions, setCompetitions] = useState<Competition[]>(() => loadCompetitions())
  const [loading, setLoading] = useState(true)
  const initialized = useRef(false)

  // Load from Supabase on mount
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    dbLoadCompetitions()
      .then((data) => {
        setCompetitions(data)
        saveCompetitions(data)
      })
      .finally(() => setLoading(false))
  }, [])

  // Keep localStorage in sync as a local cache
  useEffect(() => {
    if (!loading) saveCompetitions(competitions)
  }, [competitions, loading])

  const createCompetition = useCallback((name: string, location?: string, date?: string) => {
    const competition: Competition = {
      id: uuidv4(),
      name: name.trim(),
      location: location?.trim() ?? '',
      date: date ?? '',
      points: [],
      groups: [],
      schools: [],
      createdAt: Date.now(),
    }
    setCompetitions((current) => [competition, ...current])
    dbCreateCompetition(competition)
    return competition.id
  }, [])

  const deleteCompetition = useCallback((competitionId: string) => {
    setCompetitions((current) => current.filter((item) => item.id !== competitionId))
    dbDeleteCompetition(competitionId)
  }, [])

  const updateCompetition = useCallback(
    (competitionId: string, updater: (competition: Competition) => Competition) => {
      setCompetitions((current) =>
        current.map((item) => (item.id === competitionId ? updater(item) : item)),
      )
    },
    [],
  )

  const addPoint = useCallback(
    (competitionId: string, point: Omit<PointOfInterest, 'id'> & { id?: string }) => {
      const newPoint: PointOfInterest = {
        id: point.id ?? uuidv4(),
        name: point.name,
        latitude: point.latitude,
        longitude: point.longitude,
      }

      updateCompetition(competitionId, (competition) => {
        const updated = {
          ...competition,
          points: [...competition.points, newPoint],
          groups: competition.groups.map((group) => ({
            ...group,
            routeOrder: [...group.routeOrder, newPoint.id],
          })),
        }
        // Sync new point and updated group orders to DB
        dbUpsertPoint(competitionId, newPoint, updated.points.length - 1)
        updated.groups.forEach((g) => dbUpsertGroup(competitionId, g))
        return updated
      })
    },
    [updateCompetition],
  )

  const removePoint = useCallback(
    (competitionId: string, pointId: string) => {
      dbDeletePoint(pointId)
      updateCompetition(competitionId, (competition) => {
        const updated = {
          ...competition,
          points: competition.points.filter((point) => point.id !== pointId),
          groups: competition.groups.map((group) => ({
            ...group,
            routeOrder: group.routeOrder.filter((id) => id !== pointId),
          })),
        }
        updated.groups.forEach((g) => dbUpsertGroup(competitionId, g))
        return updated
      })
    },
    [updateCompetition],
  )

  const addGroup = useCallback(
    (competitionId: string, name: string, shuffle = true) => {
      let createdId = ''

      updateCompetition(competitionId, (competition) => {
        const pointIds = competition.points.map((point) => point.id)
        const group: Group = {
          id: uuidv4(),
          name: name.trim(),
          routeOrder: shuffle && pointIds.length > 1 ? shuffleIds(pointIds) : [...pointIds],
        }
        createdId = group.id
        dbUpsertGroup(competitionId, group)
        return {
          ...competition,
          groups: [...competition.groups, group],
        }
      })

      return createdId
    },
    [updateCompetition],
  )

  const deleteGroup = useCallback(
    (competitionId: string, groupId: string) => {
      dbDeleteGroup(groupId)
      updateCompetition(competitionId, (competition) => ({
        ...competition,
        groups: competition.groups.filter((group) => group.id !== groupId),
      }))
    },
    [updateCompetition],
  )

  const renameGroup = useCallback(
    (competitionId: string, groupId: string, name: string) => {
      updateCompetition(competitionId, (competition) => {
        const updated = {
          ...competition,
          groups: competition.groups.map((group) =>
            group.id === groupId ? { ...group, name: name.trim() } : group,
          ),
        }
        const group = updated.groups.find((g) => g.id === groupId)
        if (group) dbUpsertGroup(competitionId, group)
        return updated
      })
    },
    [updateCompetition],
  )

  const setGroupRouteOrder = useCallback(
    (competitionId: string, groupId: string, routeOrder: string[]) => {
      updateCompetition(competitionId, (competition) => {
        const updated = {
          ...competition,
          groups: competition.groups.map((group) =>
            group.id === groupId ? { ...group, routeOrder } : group,
          ),
        }
        const group = updated.groups.find((g) => g.id === groupId)
        if (group) dbUpsertGroup(competitionId, group)
        return updated
      })
    },
    [updateCompetition],
  )

  const shuffleGroupRoute = useCallback(
    (competitionId: string, groupId: string) => {
      updateCompetition(competitionId, (competition) => {
        const updated = {
          ...competition,
          groups: competition.groups.map((group) =>
            group.id === groupId
              ? { ...group, routeOrder: shuffleIds(group.routeOrder) }
              : group,
          ),
        }
        const group = updated.groups.find((g) => g.id === groupId)
        if (group) dbUpsertGroup(competitionId, group)
        return updated
      })
    },
    [updateCompetition],
  )



  const addSchool = useCallback((competitionId: string, name: string) => {
    const schoolId = uuidv4()
    updateCompetition(competitionId, (comp) => {
      const updated = {
        ...comp,
        schools: [...comp.schools, { id: schoolId, name: name.trim(), teams: [] }],
      }
      dbUpsertSchool(competitionId, schoolId, name.trim())
      return updated
    })
    return schoolId
  }, [updateCompetition])

  const deleteSchool = useCallback((competitionId: string, schoolId: string) => {
    dbDeleteSchool(schoolId)
    updateCompetition(competitionId, (comp) => ({
      ...comp,
      schools: comp.schools.filter((s) => s.id !== schoolId),
    }))
  }, [updateCompetition])

  const renameSchool = useCallback((competitionId: string, schoolId: string, name: string) => {
    updateCompetition(competitionId, (comp) => {
      const updated = {
        ...comp,
        schools: comp.schools.map((s) => (s.id === schoolId ? { ...s, name: name.trim() } : s)),
      }
      dbUpsertSchool(competitionId, schoolId, name.trim())
      return updated
    })
  }, [updateCompetition])

  const addTeam = useCallback((competitionId: string, schoolId: string, name: string) => {
    const teamId = uuidv4()
    updateCompetition(competitionId, (comp) => {
      const updated = {
        ...comp,
        schools: comp.schools.map((s) => {
          if (s.id === schoolId) {
            return {
              ...s,
              teams: [...s.teams, { id: teamId, name: name.trim(), groupId: null }],
            }
          }
          return s
        }),
      }
      dbUpsertTeam(schoolId, teamId, name.trim(), null)
      return updated
    })
    return teamId
  }, [updateCompetition])

  const deleteTeam = useCallback((competitionId: string, schoolId: string, teamId: string) => {
    dbDeleteTeam(teamId)
    updateCompetition(competitionId, (comp) => ({
      ...comp,
      schools: comp.schools.map((s) => {
        if (s.id === schoolId) {
          return { ...s, teams: s.teams.filter((t) => t.id !== teamId) }
        }
        return s
      }),
    }))
  }, [updateCompetition])

  const renameTeam = useCallback((competitionId: string, schoolId: string, teamId: string, name: string) => {
    updateCompetition(competitionId, (comp) => {
      const school = comp.schools.find((s) => s.id === schoolId)
      const team = school?.teams.find((t) => t.id === teamId)
      const updated = {
        ...comp,
        schools: comp.schools.map((s) => {
          if (s.id === schoolId) {
            return {
              ...s,
              teams: s.teams.map((t) => (t.id === teamId ? { ...t, name: name.trim() } : t)),
            }
          }
          return s
        }),
      }
      if (team) dbUpsertTeam(schoolId, teamId, name.trim(), team.groupId)
      return updated
    })
  }, [updateCompetition])

  const setTeamGroup = useCallback((competitionId: string, schoolId: string, teamId: string, groupId: string | null) => {
    updateCompetition(competitionId, (comp) => {
      const school = comp.schools.find((s) => s.id === schoolId)
      const team = school?.teams.find((t) => t.id === teamId)
      const updated = {
        ...comp,
        schools: comp.schools.map((s) => {
          if (s.id === schoolId) {
            return {
              ...s,
              teams: s.teams.map((t) => (t.id === teamId ? { ...t, groupId } : t)),
            }
          }
          return s
        }),
      }
      if (team) dbUpsertTeam(schoolId, teamId, team.name, groupId)
      return updated
    })
  }, [updateCompetition])

  const getCompetition = useCallback(

    (competitionId: string) => competitions.find((item) => item.id === competitionId),
    [competitions],
  )

  return {
    competitions,
    loading,
    createCompetition,
    deleteCompetition,
    addPoint,
    removePoint,
    addGroup,
    deleteGroup,
    renameGroup,
    setGroupRouteOrder,
    shuffleGroupRoute,

    addSchool,
    deleteSchool,
    renameSchool,
    addTeam,
    deleteTeam,
    renameTeam,
    setTeamGroup,
    getCompetition,
  }
}

