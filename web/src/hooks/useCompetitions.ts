import { useCallback, useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Competition, Group, PointOfInterest } from '../types'
import { loadCompetitions, saveCompetitions, shuffleIds } from '../utils/storage'

export function useCompetitions() {
  const [competitions, setCompetitions] = useState<Competition[]>(() => loadCompetitions())

  useEffect(() => {
    saveCompetitions(competitions)
  }, [competitions])

  const createCompetition = useCallback((name: string) => {
    const competition: Competition = {
      id: uuidv4(),
      name: name.trim(),
      points: [],
      groups: [],
      createdAt: Date.now(),
    }
    setCompetitions((current) => [competition, ...current])
    return competition.id
  }, [])

  const deleteCompetition = useCallback((competitionId: string) => {
    setCompetitions((current) => current.filter((item) => item.id !== competitionId))
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

      updateCompetition(competitionId, (competition) => ({
        ...competition,
        points: [...competition.points, newPoint],
        groups: competition.groups.map((group) => ({
          ...group,
          routeOrder: [...group.routeOrder, newPoint.id],
        })),
      }))
    },
    [updateCompetition],
  )

  const removePoint = useCallback(
    (competitionId: string, pointId: string) => {
      updateCompetition(competitionId, (competition) => ({
        ...competition,
        points: competition.points.filter((point) => point.id !== pointId),
        groups: competition.groups.map((group) => ({
          ...group,
          routeOrder: group.routeOrder.filter((id) => id !== pointId),
        })),
      }))
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
      updateCompetition(competitionId, (competition) => ({
        ...competition,
        groups: competition.groups.filter((group) => group.id !== groupId),
      }))
    },
    [updateCompetition],
  )

  const renameGroup = useCallback(
    (competitionId: string, groupId: string, name: string) => {
      updateCompetition(competitionId, (competition) => ({
        ...competition,
        groups: competition.groups.map((group) =>
          group.id === groupId ? { ...group, name: name.trim() } : group,
        ),
      }))
    },
    [updateCompetition],
  )

  const setGroupRouteOrder = useCallback(
    (competitionId: string, groupId: string, routeOrder: string[]) => {
      updateCompetition(competitionId, (competition) => ({
        ...competition,
        groups: competition.groups.map((group) =>
          group.id === groupId ? { ...group, routeOrder } : group,
        ),
      }))
    },
    [updateCompetition],
  )

  const shuffleGroupRoute = useCallback(
    (competitionId: string, groupId: string) => {
      updateCompetition(competitionId, (competition) => ({
        ...competition,
        groups: competition.groups.map((group) =>
          group.id === groupId
            ? { ...group, routeOrder: shuffleIds(group.routeOrder) }
            : group,
        ),
      }))
    },
    [updateCompetition],
  )

  const getCompetition = useCallback(
    (competitionId: string) => competitions.find((item) => item.id === competitionId),
    [competitions],
  )

  return {
    competitions,
    createCompetition,
    deleteCompetition,
    addPoint,
    removePoint,
    addGroup,
    deleteGroup,
    renameGroup,
    setGroupRouteOrder,
    shuffleGroupRoute,
    getCompetition,
  }
}
