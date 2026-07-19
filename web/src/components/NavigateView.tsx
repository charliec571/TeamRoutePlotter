import { useEffect, useMemo, useState } from 'react'
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import type { PointOfInterest } from '../types'
import {
  bearingDegrees,
  distanceMeters,
  formatBearing,
  formatDistance,
  getCurrentPosition,
  type GeoPosition,
} from '../utils/geo'
import 'leaflet/dist/leaflet.css'

const SATELLITE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'

const destinationIcon = L.divIcon({
  className: 'poi-marker',
  html: `<span class="poi-marker__pin"></span>`,
  iconSize: [28, 36],
  iconAnchor: [14, 36],
})

function FitLineOfSight({
  from,
  to,
}: {
  from: GeoPosition
  to: GeoPosition
}) {
  const map = useMap()

  useEffect(() => {
    const bounds = L.latLngBounds(
      [from.latitude, from.longitude],
      [to.latitude, to.longitude],
    )
    map.fitBounds(bounds, { padding: [56, 56], maxZoom: 17 })
  }, [map, from, to])

  return null
}

interface NavigateViewProps {
  point: PointOfInterest
  onBack: () => void
}

export function NavigateView({ point, onBack }: NavigateViewProps) {
  const [origin, setOrigin] = useState<GeoPosition | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    getCurrentPosition()
      .then((position) => {
        if (!cancelled) setOrigin(position)
      })
      .catch(() => {
        if (!cancelled) setError('Could not get your current position')
      })

    return () => {
      cancelled = true
    }
  }, [])

  const destination: GeoPosition = useMemo(
    () => ({ latitude: point.latitude, longitude: point.longitude }),
    [point.latitude, point.longitude],
  )

  const distance = origin ? distanceMeters(origin, destination) : null
  const bearing = origin ? bearingDegrees(origin, destination) : null

  return (
    <div className="navigate-screen">
      <header className="map-chrome">
        <div className="map-chrome__brand">
          <button
            type="button"
            className="btn btn--ghost btn--icon map-back"
            onClick={onBack}
            aria-label="Back"
          >
            ←
          </button>
          <div>
            <p className="eyebrow">Line of sight</p>
            <h1>{point.name}</h1>
          </div>
        </div>
        {(distance !== null && bearing !== null) || error ? (
          <div className="navigate-meta">
            {error ? (
              <p className="navigate-meta__error">{error}</p>
            ) : (
              <>
                <p>
                  <strong>{formatDistance(distance!)}</strong>
                  <span>straight-line</span>
                </p>
                <p>
                  <strong>{formatBearing(bearing!)}</strong>
                  <span>from you</span>
                </p>
              </>
            )}
          </div>
        ) : (
          <p className="map-chrome__hint">Finding your position…</p>
        )}
      </header>

      <div className="map-shell">
        {origin ? (
          <MapContainer
            center={[origin.latitude, origin.longitude]}
            zoom={15}
            className="map-view"
            zoomControl={false}
            attributionControl={false}
          >
            <TileLayer
              url={SATELLITE_URL}
              attribution="Tiles &copy; Esri"
              maxZoom={19}
            />
            <FitLineOfSight from={origin} to={destination} />
            <Polyline
              positions={[
                [origin.latitude, origin.longitude],
                [destination.latitude, destination.longitude],
              ]}
              pathOptions={{
                color: '#f0a05a',
                weight: 4,
                opacity: 0.95,
                dashArray: '10 8',
              }}
            />
            <CircleMarker
              center={[origin.latitude, origin.longitude]}
              radius={8}
              pathOptions={{
                color: '#ffffff',
                weight: 2,
                fillColor: '#3b82f6',
                fillOpacity: 0.95,
              }}
            />
            <Marker
              position={[destination.latitude, destination.longitude]}
              icon={destinationIcon}
              title={point.name}
            />
          </MapContainer>
        ) : (
          <div className="navigate-loading">
            <p>{error ?? 'Locating you…'}</p>
          </div>
        )}
      </div>

      <footer className="map-footer">
        <p className="map-footer__note">
          Straight line from your current position — not turn-by-turn roads.
        </p>
        <button type="button" className="btn btn--primary btn--block" onClick={onBack}>
          Back to route
        </button>
      </footer>
    </div>
  )
}
