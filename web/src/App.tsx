import { useCallback, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AddPointDialog } from './components/AddPointDialog'
import { CompetitionHub } from './components/CompetitionHub'
import { GroupRoute } from './components/GroupRoute'
import { HomeScreen } from './components/HomeScreen'
import { MapView, type MapBasemap, type MapFlyTarget } from './components/MapView'
import { PlaceSearch } from './components/PlaceSearch'
import { useCompetitions } from './hooks/useCompetitions'
import { useAuth } from './hooks/useAuth'
import type { Screen } from './types'
import { resolveRoute } from './utils/storage'
import './App.css'

interface PendingPoint {
  latitude: number
  longitude: number
}

export default function App() {
  const {
    competitions,
    createCompetition,
    deleteCompetition,
    addPoint,
    removePoint,
    addGroup,
    deleteGroup,
    addSchool,
    deleteSchool,
    addTeam,
    deleteTeam,
    setTeamGroup,
    setGroupRouteOrder,
    shuffleGroupRoute,
    getCompetition,
    loading,
  } = useCompetitions()

  const { isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  const [screen, setScreen] = useState<Screen>({ name: 'home' })
  const [pending, setPending] = useState<PendingPoint | null>(null)
  const [flyTo, setFlyTo] = useState<MapFlyTarget | null>(null)
  const [basemap, setBasemap] = useState<MapBasemap>('satellite')

  const handleLongPress = useCallback((latitude: number, longitude: number) => {
    setPending({ latitude, longitude })
  }, [])

  // If somehow a non-admin ends up at /admin, bounce them back to the public home
  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/', { replace: true })
    }
  }, [loading, isAdmin, navigate])

  if (loading || !isAdmin) {
    return null
  }

  if (screen.name === 'home') {
    return (
      <div className="app">
        <HomeScreen
          competitions={competitions}
          onCreate={(name, location, date) => {
            const id = createCompetition(name, location, date)
            setScreen({ name: 'competition', competitionId: id, tab: 'points' })
          }}
          onOpen={(competitionId) =>
            setScreen({ name: 'competition', competitionId, tab: 'points' })
          }
          onDelete={deleteCompetition}
        />
        <div style={{ padding: '1rem', textAlign: 'center' }}>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => { logout(); navigate('/') }}
            style={{ fontSize: '0.75rem', color: 'rgba(244,247,245,0.4)' }}
          >
            Exit Admin Mode
          </button>
        </div>
      </div>
    )
  }

  const competition = getCompetition(screen.competitionId)
  if (!competition) {
    return (
      <div className="app">
        <HomeScreen
          competitions={competitions}
          onCreate={(name, location, date) => {
            const id = createCompetition(name, location, date)
            setScreen({ name: 'competition', competitionId: id, tab: 'points' })
          }}
          onOpen={(competitionId) =>
            setScreen({ name: 'competition', competitionId, tab: 'points' })
          }
          onDelete={deleteCompetition}
        />
      </div>
    )
  }

  if (screen.name === 'competition') {
    return (
      <div className="app">
        <CompetitionHub
          competition={competition}
          tab={screen.tab}
          onTabChange={(tab) =>
            setScreen({ name: 'competition', competitionId: competition.id, tab })
          }
          onBack={() => setScreen({ name: 'home' })}
          onOpenMap={() => setScreen({ name: 'map', competitionId: competition.id })}
          onOpenGroup={(groupId) =>
            setScreen({ name: 'group-route', competitionId: competition.id, groupId })
          }
          onAddGroup={(name) => addGroup(competition.id, name, true)}
          onDeleteGroup={(groupId) => deleteGroup(competition.id, groupId)}
          onRemovePoint={(pointId) => removePoint(competition.id, pointId)}
          onAddSchool={(name) => addSchool(competition.id, name)}
          onDeleteSchool={(schoolId) => deleteSchool(competition.id, schoolId)}
          onAddTeam={(schoolId, name) => addTeam(competition.id, schoolId, name)}
          onDeleteTeam={(schoolId, teamId) => deleteTeam(competition.id, schoolId, teamId)}
          onSetTeamGroup={(schoolId, teamId, groupId) => setTeamGroup(competition.id, schoolId, teamId, groupId)}
        />
      </div>
    )
  }

  if (screen.name === 'group-route') {
    const group = competition.groups.find((item) => item.id === screen.groupId)
    if (!group) {
      return (
        <div className="app">
          <CompetitionHub
            competition={competition}
            tab="groups"
            onTabChange={(tab) =>
              setScreen({ name: 'competition', competitionId: competition.id, tab })
            }
            onBack={() => setScreen({ name: 'home' })}
            onOpenMap={() => setScreen({ name: 'map', competitionId: competition.id })}
            onOpenGroup={(groupId) =>
              setScreen({ name: 'group-route', competitionId: competition.id, groupId })
            }
            onAddGroup={(name) => addGroup(competition.id, name, true)}
            onDeleteGroup={(groupId) => deleteGroup(competition.id, groupId)}
            onRemovePoint={(pointId) => removePoint(competition.id, pointId)}
            onAddSchool={(name) => addSchool(competition.id, name)}
            onDeleteSchool={(schoolId) => deleteSchool(competition.id, schoolId)}
            onAddTeam={(schoolId, name) => addTeam(competition.id, schoolId, name)}
            onDeleteTeam={(schoolId, teamId) => deleteTeam(competition.id, schoolId, teamId)}
            onSetTeamGroup={(schoolId, teamId, groupId) => setTeamGroup(competition.id, schoolId, teamId, groupId)}
          />
        </div>
      )
    }

    const orderedPoints = resolveRoute(competition.points, group.routeOrder)

    return (
      <div className="app">
        <GroupRoute
          competitionName={competition.name}
          groupName={group.name}
          points={orderedPoints}
          onReorder={(routeOrder) =>
            setGroupRouteOrder(competition.id, group.id, routeOrder)
          }
          onShuffle={() => shuffleGroupRoute(competition.id, group.id)}
          onBack={() =>
            setScreen({ name: 'competition', competitionId: competition.id, tab: 'groups' })
          }
        />
      </div>
    )
  }

  // Map screen — plot shared competition points
  return (
    <div className="app app--map">
      <header className="map-chrome">
        <div className="map-chrome__brand">
          <button
            type="button"
            className="btn btn--ghost btn--icon map-back"
            onClick={() =>
              setScreen({ name: 'competition', competitionId: competition.id, tab: 'points' })
            }
            aria-label="Back"
          >
            ←
          </button>
          <div>
            <p className="eyebrow">{competition.name}</p>
            <h1>Map areas of interest</h1>
          </div>
        </div>
        <div className="map-chrome__tools">
          <PlaceSearch
            onSelect={(place) =>
              setFlyTo({
                latitude: place.latitude,
                longitude: place.longitude,
                key: Date.now(),
              })
            }
          />
          <div className="basemap-toggle" role="group" aria-label="Map style">
            <button
              type="button"
              className={`basemap-toggle__btn${basemap === 'street' ? ' is-active' : ''}`}
              aria-pressed={basemap === 'street'}
              onClick={() => setBasemap('street')}
            >
              Map
            </button>
            <button
              type="button"
              className={`basemap-toggle__btn${basemap === 'satellite' ? ' is-active' : ''}`}
              aria-pressed={basemap === 'satellite'}
              onClick={() => setBasemap('satellite')}
            >
              Satellite
            </button>
          </div>
        </div>
        <p className="map-chrome__hint">Long-press to add a shared stop for all groups</p>
      </header>

      <div className="map-shell">
        <MapView
          points={competition.points}
          onLongPress={handleLongPress}
          flyTo={flyTo}
          basemap={basemap}
        />
      </div>

      <footer className="map-footer">
        <div className="map-footer__meta">
          <strong>{competition.points.length}</strong>
          <span>
            {competition.points.length === 1 ? 'shared point' : 'shared points'}
          </span>
        </div>
        <button
          type="button"
          className="btn btn--primary btn--block"
          onClick={() =>
            setScreen({ name: 'competition', competitionId: competition.id, tab: 'groups' })
          }
        >
          {competition.points.length === 0 ? 'Done' : 'Continue to groups'}
        </button>
      </footer>

      <AddPointDialog
        open={pending !== null}
        latitude={pending?.latitude ?? 0}
        longitude={pending?.longitude ?? 0}
        onAdd={(name) => {
          if (!pending) return
          addPoint(competition.id, {
            name,
            latitude: pending.latitude,
            longitude: pending.longitude,
          })
          setPending(null)
        }}
        onCancel={() => setPending(null)}
      />
    </div>
  )
}
