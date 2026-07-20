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

/** A competition owns a shared pool of points; each group orders them differently. */
export interface Competition {
  id: string
  name: string
  points: PointOfInterest[]
  groups: Group[]
  createdAt: number
}

export type Screen =
  | { name: 'home' }
  | { name: 'competition'; competitionId: string; tab: 'points' | 'groups' }
  | { name: 'map'; competitionId: string }
  | { name: 'group-route'; competitionId: string; groupId: string }
