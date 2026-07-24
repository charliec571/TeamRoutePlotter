export interface PointOfInterest {
  id: string
  name: string
  latitude: number
  longitude: number
}

/** One group's ordered path through a competition's shared points. */
export interface Group {
  id: string
  name: string
  /** Ordered list of PointOfInterest ids from the parent competition. */
  routeOrder: string[]
}

export interface Team {
  id: string
  name: string
  groupId: string | null
}

export interface School {
  id: string
  name: string
  teams: Team[]
}

/** A competition owns a shared pool of points; each group orders them differently. */
export interface Competition {
  id: string
  name: string
  location?: string
  date?: string
  points: PointOfInterest[]
  groups: Group[]
  schools: School[]
  createdAt: number
}

export type Screen =
  | { name: 'home' }
  | { name: 'competition'; competitionId: string; tab: 'points' | 'groups' | 'schools' }
  | { name: 'map'; competitionId: string }
  | { name: 'group-route'; competitionId: string; groupId: string }
