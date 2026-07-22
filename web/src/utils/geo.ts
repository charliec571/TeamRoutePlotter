/** Set to a [lat, lng] pair to override GPS during development, or null for real GPS. */
export const DEV_FIXED_LOCATION: [number, number] | null = null

export interface GeoPosition {
  latitude: number
  longitude: number
}

export function getCurrentPosition(
  options?: PositionOptions,
): Promise<GeoPosition> {
  if (DEV_FIXED_LOCATION) {
    const [latitude, longitude] = DEV_FIXED_LOCATION
    return Promise.resolve({ latitude, longitude })
  }

  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not available'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      reject,
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 60_000,
        ...options,
      },
    )
  })
}

/** Great-circle distance in meters (haversine). */
export function distanceMeters(
  from: GeoPosition,
  to: GeoPosition,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const earthRadius = 6_371_000
  const dLat = toRad(to.latitude - from.latitude)
  const dLng = toRad(to.longitude - from.longitude)
  const lat1 = toRad(from.latitude)
  const lat2 = toRad(to.latitude)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2

  return 2 * earthRadius * Math.asin(Math.sqrt(a))
}

/** Initial bearing in degrees (0–360, clockwise from north). */
export function bearingDegrees(
  from: GeoPosition,
  to: GeoPosition,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const toDeg = (rad: number) => (rad * 180) / Math.PI
  const lat1 = toRad(from.latitude)
  const lat2 = toRad(to.latitude)
  const dLng = toRad(to.longitude - from.longitude)

  const y = Math.sin(dLng) * Math.cos(lat2)
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)

  return (toDeg(Math.atan2(y, x)) + 360) % 360
}

export function formatDistance(meters: number): string {
  const feet = meters * 3.28084
  if (feet < 1000) return `${Math.round(feet)} ft`
  const miles = feet / 5280
  if (miles < 10) return `${miles.toFixed(1)} mi`
  return `${Math.round(miles)} mi`
}

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const

export function formatBearing(degrees: number): string {
  const index = Math.round(degrees / 45) % 8
  return `${COMPASS[index]} · ${Math.round(degrees)}°`
}
