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

/** Returns true if a date string is strictly before today (yesterday or earlier). */
export function isDateInPast(dateStr?: string): boolean {
  if (!dateStr || !dateStr.trim()) return false

  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const todayStr = `${year}-${month}-${day}`

  // Standard YYYY-MM-DD comparison
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) {
    return dateStr.trim() < todayStr
  }

  const meetDate = new Date(dateStr)
  if (isNaN(meetDate.getTime())) return false
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  return meetDate < startOfToday
}

/** Filters out competitions whose meet date has already passed. */
export function filterActiveCompetitions(competitions: Competition[]): Competition[] {
  return competitions.filter((comp) => !isDateInPast(comp.date))
}

export const POI_MARKER = '\u200B[POI]'

/** Parses a point record from Supabase or localStorage, decoding POI status. */
export function parsePointRecord(p: {
  id: string
  name: string
  latitude: number
  longitude: number
  type?: string
}): PointOfInterest {
  const rawName = typeof p.name === 'string' ? p.name : ''
  const hasPoiMarker = rawName.includes(POI_MARKER) || rawName.startsWith('[POI]')
  const isPOI = p.type === 'poi' || hasPoiMarker
  const cleanName = rawName
    .replace(POI_MARKER, '')
    .replace('[POI]', '')
    .trim()

  return {
    id: p.id,
    name: cleanName,
    latitude: p.latitude,
    longitude: p.longitude,
    type: isPOI ? 'poi' : 'event',
  }
}

/** Formats a point record for database upsert with encoded fallback for type. */
export function formatPointForDatabase(point: PointOfInterest): {
  name: string
  type: 'event' | 'poi'
} {
  const cleanName = point.name
    .replace(POI_MARKER, '')
    .replace('[POI]', '')
    .trim()
  const isPOI = point.type === 'poi'

  return {
    name: isPOI ? `${POI_MARKER} ${cleanName}` : cleanName,
    type: isPOI ? 'poi' : 'event',
  }
}



