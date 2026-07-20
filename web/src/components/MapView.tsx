import { useCallback, useEffect, useRef, useState } from 'react'
import { CircleMarker, MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import type { PointOfInterest } from '../types'
import { DEV_FIXED_LOCATION } from '../utils/geo'
import 'leaflet/dist/leaflet.css'

/** ~10,000 ft regional overview — city / surrounding area scale */
const OVERVIEW_ZOOM = 12
/** Closer framing after choosing a search result */
const SEARCH_ZOOM = 14

const DEFAULT_CENTER: [number, number] = DEV_FIXED_LOCATION ?? [37.7749, -122.4194]

const markerIcon = L.divIcon({
  className: 'poi-marker',
  html: `<span class="poi-marker__pin"></span>`,
  iconSize: [28, 36],
  iconAnchor: [14, 36],
})

export interface MapFlyTarget {
  latitude: number
  longitude: number
  zoom?: number
  key: number
}

interface MapClickHandlerProps {
  onLongPress: (lat: number, lng: number) => void
}

function MapClickHandler({ onLongPress }: MapClickHandlerProps) {
  const timerRef = useRef<number | null>(null)
  const startPosRef = useRef<{ x: number; y: number } | null>(null)
  const map = useMap()

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
    startPosRef.current = null
  }, [])

  useMapEvents({
    contextmenu(event) {
      event.originalEvent.preventDefault()
      onLongPress(event.latlng.lat, event.latlng.lng)
    },
  })

  useEffect(() => {
    const container = map.getContainer()

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) {
        clearTimer()
        return
      }

      const touch = event.touches[0]
      startPosRef.current = { x: touch.clientX, y: touch.clientY }

      timerRef.current = window.setTimeout(() => {
        const start = startPosRef.current
        if (!start) return

        const rect = container.getBoundingClientRect()
        const point = map.containerPointToLatLng(
          L.point(start.x - rect.left, start.y - rect.top),
        )
        onLongPress(point.lat, point.lng)
        clearTimer()
      }, 500)
    }

    const onTouchMove = (event: TouchEvent) => {
      if (!startPosRef.current || event.touches.length !== 1) {
        clearTimer()
        return
      }

      const touch = event.touches[0]
      const dx = Math.abs(touch.clientX - startPosRef.current.x)
      const dy = Math.abs(touch.clientY - startPosRef.current.y)
      if (dx > 12 || dy > 12) {
        clearTimer()
      }
    }

    container.addEventListener('touchstart', onTouchStart, { passive: true })
    container.addEventListener('touchmove', onTouchMove, { passive: true })
    container.addEventListener('touchend', clearTimer)
    container.addEventListener('touchcancel', clearTimer)

    return () => {
      clearTimer()
      container.removeEventListener('touchstart', onTouchStart)
      container.removeEventListener('touchmove', onTouchMove)
      container.removeEventListener('touchend', clearTimer)
      container.removeEventListener('touchcancel', clearTimer)
    }
  }, [map, onLongPress, clearTimer])

  return null
}

function LocateUser({
  onLocated,
}: {
  onLocated: (latitude: number, longitude: number) => void
}) {
  const map = useMap()
  const triedRef = useRef(false)

  useEffect(() => {
    if (triedRef.current) return
    triedRef.current = true

    if (DEV_FIXED_LOCATION) {
      const [latitude, longitude] = DEV_FIXED_LOCATION
      onLocated(latitude, longitude)
      map.setView([latitude, longitude], OVERVIEW_ZOOM, { animate: false })
      return
    }

    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        onLocated(latitude, longitude)
        map.setView([latitude, longitude], OVERVIEW_ZOOM, {
          animate: true,
        })
      },
      () => {
        // Keep default center if permission denied
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
    )
  }, [map, onLocated])

  return null
}

function FlyToPlace({ target }: { target: MapFlyTarget | null }) {
  const map = useMap()

  useEffect(() => {
    if (!target) return
    map.setView(
      [target.latitude, target.longitude],
      target.zoom ?? SEARCH_ZOOM,
      { animate: true },
    )
  }, [map, target])

  return null
}

export type MapBasemap = 'street' | 'satellite'

const BASEMAPS = {
  street: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution:
      'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
  },
} as const

interface MapViewProps {
  points: PointOfInterest[]
  onLongPress: (lat: number, lng: number) => void
  flyTo?: MapFlyTarget | null
  basemap?: MapBasemap
}

export function MapView({
  points,
  onLongPress,
  flyTo = null,
  basemap = 'street',
}: MapViewProps) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const tiles = BASEMAPS[basemap]

  const handleLocated = useCallback((latitude: number, longitude: number) => {
    setUserLocation([latitude, longitude])
  }, [])

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={OVERVIEW_ZOOM}
      className="map-view"
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer key={basemap} url={tiles.url} attribution={tiles.attribution} maxZoom={19} />
      <MapClickHandler onLongPress={onLongPress} />
      <LocateUser onLocated={handleLocated} />
      <FlyToPlace target={flyTo} />
      {userLocation && (
        <CircleMarker
          center={userLocation}
          radius={8}
          pathOptions={{
            color: '#ffffff',
            weight: 2,
            fillColor: '#3b82f6',
            fillOpacity: 0.95,
          }}
        />
      )}
      {points.map((point) => (
        <Marker
          key={point.id}
          position={[point.latitude, point.longitude]}
          icon={markerIcon}
          title={point.name}
        />
      ))}
    </MapContainer>
  )
}
