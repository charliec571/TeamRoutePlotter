import type { Competition, PointOfInterest } from '../types'

const STORAGE_KEY = 'team-route-plotter:competitions'

export function loadCompetitions(): Competition[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Competition[]
    return Array.isArray(parsed)
      ? parsed.map((comp) => ({ ...comp, schools: comp.schools ?? [] }))
      : []
  } catch {
    return []
  }
}

export function saveCompetitions(competitions: Competition[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(competitions))
  } catch {
    // Ignore QuotaExceededError or private browsing restrictions
  }
}

export function resolveRoute(
  points: PointOfInterest[],
  routeOrder: string[],
): PointOfInterest[] {
  const byId = new Map(points.map((point) => [point.id, point]))
  return routeOrder
    .map((id) => byId.get(id))
    .filter((point): point is PointOfInterest => point !== undefined)
}

/** Sort competitions by lowest date at the top (ascending order). */
export function sortCompetitionsByDate(competitions: Competition[]): Competition[] {
  return [...competitions].sort((a, b) => {
    const hasDateA = Boolean(a.date && a.date.trim())
    const hasDateB = Boolean(b.date && b.date.trim())

    if (hasDateA && hasDateB) {
      const timeA = Date.parse(a.date!)
      const timeB = Date.parse(b.date!)
      if (!isNaN(timeA) && !isNaN(timeB) && timeA !== timeB) {
        return timeA - timeB
      }
      return a.date!.localeCompare(b.date!)
    }
    if (hasDateA) return -1
    if (hasDateB) return 1
    return a.createdAt - b.createdAt
  })
}

/** Fisher–Yates shuffle for generating distinct group orders. */
export function shuffleIds(ids: string[]): string[] {
  const next = [...ids]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

