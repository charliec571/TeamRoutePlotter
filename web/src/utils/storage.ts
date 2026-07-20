import type { Competition, PointOfInterest } from '../types'

const STORAGE_KEY = 'team-route-plotter:competitions'

export function loadCompetitions(): Competition[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Competition[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveCompetitions(competitions: Competition[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(competitions))
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

/** Fisher–Yates shuffle for generating distinct group orders. */
export function shuffleIds(ids: string[]): string[] {
  const next = [...ids]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}
