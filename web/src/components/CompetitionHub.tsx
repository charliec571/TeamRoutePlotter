import { useState, type FormEvent } from 'react'
import type { Competition, PointOfInterest, PointType } from '../types'
import { QRModal } from './QRModal'
import { EditPointDialog } from './EditPointDialog'

interface CompetitionHubProps {
  competition: Competition
  tab: 'points' | 'groups' | 'schools'
  onTabChange: (tab: 'points' | 'groups' | 'schools') => void
  onBack: () => void
  onOpenMap: () => void
  onOpenGroup: (groupId: string) => void
  onAddGroup: (name: string) => void
  onDeleteGroup: (groupId: string) => void
  onAddPoint: (point: { name: string; latitude: number; longitude: number; type?: PointType }) => void
  onUpdatePoint: (pointId: string, updates: { name: string; latitude: number; longitude: number; type?: PointType }) => void
  onRemovePoint: (pointId: string) => void
  onAddSchool: (name: string) => void
  onDeleteSchool: (schoolId: string) => void
  onAddTeam: (schoolId: string, name: string) => void
  onDeleteTeam: (schoolId: string, teamId: string) => void
  onSetTeamGroup: (schoolId: string, teamId: string, groupId: string | null) => void
}

export function CompetitionHub({
  competition,
  tab,
  onTabChange,
  onBack,
  onOpenMap,
  onOpenGroup,
  onAddGroup,
  onDeleteGroup,
  onAddPoint,
  onUpdatePoint,
  onRemovePoint,
  onAddSchool,
  onDeleteSchool,
  onAddTeam,
  onDeleteTeam,
  onSetTeamGroup,
}: CompetitionHubProps) {
  const [addingGroup, setAddingGroup] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [addingSchool, setAddingSchool] = useState(false)
  const [schoolName, setSchoolName] = useState('')
  const [addingTeamToSchool, setAddingTeamToSchool] = useState<string | null>(null)
  const [teamName, setTeamName] = useState('')
  const [showQR, setShowQR] = useState(false)
  const [editingPoint, setEditingPoint] = useState<PointOfInterest | null>(null)
  const [addingPoint, setAddingPoint] = useState(false)
  const [newPointType, setNewPointType] = useState<'event' | 'poi'>('event')
  const [newPointName, setNewPointName] = useState('')
  const [newPointLat, setNewPointLat] = useState('')
  const [newPointLng, setNewPointLng] = useState('')

  const handleAddGroup = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = groupName.trim()
    if (!trimmed) return
    onAddGroup(trimmed)
    setGroupName('')
    setAddingGroup(false)
  }

  const handleAddPointSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = newPointName.trim()
    if (!trimmed) return

    const lat = parseFloat(newPointLat) || (competition.points[0]?.latitude ?? 37.7749)
    const lng = parseFloat(newPointLng) || (competition.points[0]?.longitude ?? -122.4194)

    onAddPoint({
      name: trimmed,
      latitude: lat,
      longitude: lng,
      type: newPointType,
    })
    setNewPointName('')
    setNewPointLat('')
    setNewPointLng('')
    setNewPointType('event')
    setAddingPoint(false)
  }

  return (
    <section className="panel-screen">
      {showQR && (
        <QRModal
          competitionId={competition.id}
          competitionName={competition.name}
          onClose={() => setShowQR(false)}
        />
      )}

      <EditPointDialog
        point={editingPoint}
        open={editingPoint !== null}
        onSave={(pointId, updates) => {
          onUpdatePoint(pointId, updates)
          setEditingPoint(null)
        }}
        onDelete={(pointId) => {
          onRemovePoint(pointId)
          setEditingPoint(null)
        }}
        onCancel={() => setEditingPoint(null)}
      />

      <header className="route-screen__header">
        <button type="button" className="btn btn--ghost btn--icon" onClick={onBack} aria-label="Back">
          ←
        </button>
        <div style={{ flex: 1 }}>
          <p className="eyebrow">Competition</p>
          <h1>{competition.name}</h1>
        </div>
        <button
          type="button"
          className="btn btn--secondary qr-header-btn"
          onClick={() => setShowQR(true)}
          aria-label="Share QR code"
          title="Share with parents"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1"/>
            <rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/>
            <rect x="14" y="14" width="3" height="3" rx="0.5"/>
            <rect x="19" y="14" width="2" height="2" rx="0.5"/>
            <rect x="14" y="19" width="2" height="2" rx="0.5"/>
            <rect x="19" y="19" width="2" height="2" rx="0.5"/>
          </svg>
          Share
        </button>
      </header>

      <div className="segmented" role="tablist" aria-label="Competition sections">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'points'}
          className={`segmented__btn${tab === 'points' ? ' is-active' : ''}`}
          onClick={() => onTabChange('points')}
        >
          Points ({competition.points.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'groups'}
          className={`segmented__btn${tab === 'groups' ? ' is-active' : ''}`}
          onClick={() => onTabChange('groups')}
        >
          Groups ({competition.groups.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'schools'}
          className={`segmented__btn${tab === 'schools' ? ' is-active' : ''}`}
          onClick={() => onTabChange('schools')}
        >
          Schools ({competition.schools.length})
        </button>
      </div>

      {tab === 'points' && (
        <div className="panel-body">
          <p className="hint">
            Shared areas of interest for every group. Map them once, then reorder per group.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <button type="button" className="btn btn--primary" onClick={onOpenMap}>
              {competition.points.length === 0 ? 'Map points' : 'Edit on map'}
            </button>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => setAddingPoint(true)}
            >
              + Add point
            </button>
          </div>

          {addingPoint && (
            <form className="create-form" onSubmit={handleAddPointSubmit} style={{ marginBottom: '1rem' }}>
              <label className="field-label" style={{ display: 'block', marginBottom: '0.35rem' }}>
                Location Type
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setNewPointType('event')}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    borderRadius: '8px',
                    border: newPointType === 'event' ? '2px solid var(--accent)' : '1px solid rgba(255,255,255,0.12)',
                    background: newPointType === 'event' ? 'rgba(232, 137, 58, 0.15)' : 'rgba(255,255,255,0.04)',
                    color: newPointType === 'event' ? 'var(--accent)' : 'inherit',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  🏁 Event
                </button>
                <button
                  type="button"
                  onClick={() => setNewPointType('poi')}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    borderRadius: '8px',
                    border: newPointType === 'poi' ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.12)',
                    background: newPointType === 'poi' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.04)',
                    color: newPointType === 'poi' ? '#60a5fa' : 'inherit',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  📍 Point of Interest (POI)
                </button>
              </div>

              <label className="field-label" htmlFor="new-point-name">
                {newPointType === 'event' ? 'Event name' : 'POI name (e.g. Restrooms, Parking)'}
              </label>
              <input
                id="new-point-name"
                className="field"
                type="text"
                placeholder={newPointType === 'event' ? 'e.g. Pull-up Bars' : 'e.g. Restrooms, Concessions'}
                value={newPointName}
                onChange={(e) => setNewPointName(e.target.value)}
                autoFocus
                required
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
                <div>
                  <label className="field-label" htmlFor="new-point-lat">
                    Latitude (optional)
                  </label>
                  <input
                    id="new-point-lat"
                    type="number"
                    step="any"
                    className="field"
                    placeholder={competition.points[0]?.latitude.toFixed(4) ?? '37.7749'}
                    value={newPointLat}
                    onChange={(e) => setNewPointLat(e.target.value)}
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="new-point-lng">
                    Longitude (optional)
                  </label>
                  <input
                    id="new-point-lng"
                    type="number"
                    step="any"
                    className="field"
                    placeholder={competition.points[0]?.longitude.toFixed(4) ?? '-122.4194'}
                    value={newPointLng}
                    onChange={(e) => setNewPointLng(e.target.value)}
                  />
                </div>
              </div>
              <div className="dialog__actions">
                <button type="button" className="btn btn--ghost" onClick={() => setAddingPoint(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary" disabled={!newPointName.trim()}>
                  Add {newPointType === 'event' ? 'event' : 'POI'}
                </button>
              </div>
            </form>
          )}

          {competition.points.length === 0 ? (
            <div className="empty-state">
              <p>No points yet. Open the map and long-press or tap "+ Add point" to add stops.</p>
            </div>
          ) : (
            <ul className="point-list point-list--static">
              {competition.points.map((point, index) => {
                const isPOI = point.type === 'poi'
                return (
                  <li key={point.id} className="point-item point-item--static">
                    <span
                      className="point-item__index"
                      style={isPOI ? { background: '#3b82f6', color: '#ffffff' } : undefined}
                    >
                      {index + 1}
                    </span>
                    <div
                      className="point-item__body"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setEditingPoint(point)}
                      title="Click to edit"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <strong>{point.name}</strong>
                        <span
                          style={{
                            fontSize: '0.65rem',
                            padding: '0.1rem 0.35rem',
                            borderRadius: '4px',
                            fontWeight: 700,
                            background: isPOI ? 'rgba(59, 130, 246, 0.15)' : 'rgba(232, 137, 58, 0.15)',
                            color: isPOI ? '#60a5fa' : 'var(--accent)',
                          }}
                        >
                          {isPOI ? 'POI' : 'EVENT'}
                        </span>
                      </div>
                      <span>
                        {point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}
                      </span>
                    </div>
                  <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <button
                      type="button"
                      className="btn btn--ghost btn--icon"
                      aria-label={`Edit ${point.name}`}
                      title={`Edit ${point.name}`}
                      style={{ fontSize: '0.85rem' }}
                      onClick={() => setEditingPoint(point)}
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      className="btn btn--ghost btn--icon"
                      aria-label={`Remove ${point.name}`}
                      title={`Remove ${point.name}`}
                      onClick={() => {
                        if (window.confirm(`Delete point "${point.name}"?`)) {
                          onRemovePoint(point.id)
                        }
                      }}
                    >
                      ×
                    </button>
                  </div>
                </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
      
      {tab === 'groups' && (
        <div className="panel-body">
          <p className="hint">
            Each group uses the same points in a different order. New groups get a shuffled route.
          </p>

          {addingGroup ? (
            <form className="create-form" onSubmit={handleAddGroup}>
              <label className="field-label" htmlFor="group-name">
                Group name
              </label>
              <input
                id="group-name"
                className="field"
                type="text"
                placeholder="e.g. Team Alpha"
                value={groupName}
                onChange={(event) => setGroupName(event.target.value)}
                autoFocus
                autoComplete="off"
              />
              <div className="dialog__actions">
                <button type="button" className="btn btn--ghost" onClick={() => setAddingGroup(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary" disabled={!groupName.trim()}>
                  Add group
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              className="btn btn--primary btn--block"
              onClick={() => setAddingGroup(true)}
              disabled={competition.points.length === 0}
            >
              Add group
            </button>
          )}

          {competition.points.length === 0 && (
            <div className="empty-state">
              <p>Add points first, then create groups to assign route orders.</p>
            </div>
          )}

          {competition.groups.length > 0 && (
            <ul className="card-list">
              {competition.groups.map((group) => (
                <li key={group.id} className="card-row">
                  <button
                    type="button"
                    className="card-row__main"
                    onClick={() => onOpenGroup(group.id)}
                  >
                    <strong>{group.name}</strong>
                    <span>{group.routeOrder.length} stops in route</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost btn--icon card-row__delete"
                    aria-label={`Delete ${group.name}`}
                    onClick={() => {
                      if (window.confirm(`Delete group “${group.name}”?`)) {
                        onDeleteGroup(group.id)
                      }
                    }}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === 'schools' && (
        <div className="panel-body">
          <p className="hint">
            Add schools, then add teams to each school and assign them a route group.
          </p>

          {addingSchool ? (
            <form className="create-form" onSubmit={(e) => {
              e.preventDefault()
              if (!schoolName.trim()) return
              onAddSchool(schoolName.trim())
              setSchoolName('')
              setAddingSchool(false)
            }}>
              <label className="field-label" htmlFor="school-name">School name</label>
              <input id="school-name" className="field" type="text" placeholder="e.g. Concordia" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} autoFocus autoComplete="off" />
              <div className="dialog__actions">
                <button type="button" className="btn btn--ghost" onClick={() => setAddingSchool(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary" disabled={!schoolName.trim()}>Add school</button>
              </div>
            </form>
          ) : (
            <button type="button" className="btn btn--primary btn--block" onClick={() => setAddingSchool(true)}>Add school</button>
          )}

          {competition.schools.length > 0 && (
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {competition.schools.map((school) => (
                <div key={school.id} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{school.name}</h3>
                    <button type="button" className="btn btn--ghost btn--icon" onClick={() => {
                      if (window.confirm(`Delete school "${school.name}"?`)) onDeleteSchool(school.id)
                    }}>×</button>
                  </div>

                  {school.teams.map((team) => (
                    <div key={team.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '8px' }}>
                      <strong style={{ flex: 1, paddingLeft: '0.5rem' }}>{team.name}</strong>
                      <select 
                        value={team.groupId || ''}
                        onChange={(e) => onSetTeamGroup(school.id, team.id, e.target.value || null)}
                        style={{ padding: '0.25rem 0.5rem', borderRadius: '6px', background: 'var(--color-bg)', color: 'var(--color-text)', border: '1px solid rgba(255,255,255,0.2)' }}
                      >
                        <option value="">-- No Group --</option>
                        {competition.groups.map(g => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                      <button type="button" className="btn btn--ghost btn--icon" onClick={() => onDeleteTeam(school.id, team.id)}>×</button>
                    </div>
                  ))}

                  {addingTeamToSchool === school.id ? (
                    <form style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }} onSubmit={(e) => {
                      e.preventDefault()
                      if (!teamName.trim()) return
                      onAddTeam(school.id, teamName.trim())
                      setTeamName('')
                      setAddingTeamToSchool(null)
                    }}>
                      <input type="text" className="field" placeholder="Team name (e.g. A)" value={teamName} onChange={(e) => setTeamName(e.target.value)} autoFocus style={{ margin: 0 }} />
                      <button type="submit" className="btn btn--primary" style={{ padding: '0 1rem' }}>Add</button>
                      <button type="button" className="btn btn--ghost" onClick={() => setAddingTeamToSchool(null)}>Cancel</button>
                    </form>
                  ) : (
                    <button type="button" className="btn btn--ghost" style={{ marginTop: '0.5rem', width: '100%', border: '1px dashed rgba(255,255,255,0.2)' }} onClick={() => setAddingTeamToSchool(school.id)}>
                      + Add Team
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
