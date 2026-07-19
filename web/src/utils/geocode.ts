export interface PlaceResult {
  id: string
  label: string
  latitude: number
  longitude: number
}

interface PhotonFeature {
  geometry: {
    coordinates: [number, number]
  }
  properties: {
    osm_id?: number
    name?: string
    street?: string
    housenumber?: string
    city?: string
    town?: string
    village?: string
    municipality?: string
    county?: string
    state?: string
    country?: string
    type?: string
  }
}

interface PhotonResponse {
  features?: PhotonFeature[]
}

function buildLabel(properties: PhotonFeature['properties']): string {
  const primary =
    properties.name ||
    [properties.housenumber, properties.street].filter(Boolean).join(' ') ||
    properties.city ||
    properties.town ||
    properties.village ||
    'Unknown place'

  const locality =
    properties.city || properties.town || properties.village || properties.municipality
  const parts = [primary]

  if (locality && locality !== primary) parts.push(locality)
  if (properties.state && properties.state !== locality) parts.push(properties.state)
  if (properties.country) parts.push(properties.country)

  return parts.join(', ')
}

export async function searchPlaces(
  query: string,
  signal?: AbortSignal,
): Promise<PlaceResult[]> {
  const trimmed = query.trim()
  if (trimmed.length < 2) return []

  const url = new URL('https://photon.komoot.io/api/')
  url.searchParams.set('q', trimmed)
  url.searchParams.set('limit', '6')
  url.searchParams.set('lang', 'en')

  const response = await fetch(url, { signal })
  if (!response.ok) {
    throw new Error('Place search failed')
  }

  const data = (await response.json()) as PhotonResponse
  const features = data.features ?? []

  return features.map((feature, index) => {
    const [longitude, latitude] = feature.geometry.coordinates
    return {
      id: String(feature.properties.osm_id ?? `${latitude},${longitude},${index}`),
      label: buildLabel(feature.properties),
      latitude,
      longitude,
    }
  })
}
