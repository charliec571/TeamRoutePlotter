import { useState, type FormEvent } from 'react'
import type { Competition } from '../types'

interface CompetitionHubProps {
  competition: Competition
  tab: 'points' | 'groups'
  onTabChange: (tab: 'points' | 'groups') => void
  onBack: () => void
  onOpenMap: () => void
  onOpenGroup: (groupId: string) => void
  onAddGroup: (name: string) => void
  onDeleteGroup: (groupId: string) => void
  onRemovePoint: (pointId: string) => void
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
  onRemovePoint,
}: CompetitionHubProps) {
  const [addingGroup, setAddingGroup] = useState(false)
  const [groupName, setGroupName] = useState('')

  const handleAddGroup = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = groupName.trim()
    if (!trimmed) return
    onAddGroup(trimmed)
    setGroupName('')
    setAddingGroup(false)
  }

  return (
    <section className="panel-screen">
      <header className="route-screen__header">
        <button type="button" className="btn btn--ghost btn--icon" onClick={onBack} aria-label="Back">
          ←
        </button>
        <div>
          <p className="eyebrow">Competition</p>
          <h1>{competition.name}</h1>
        </div>
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
      </div>

      {tab === 'points' ? (
        <div className="panel-body">
          <p className="hint">
            Shared areas of interest for every group. Map them once, then reorder per group.
          </p>

          <button type="button" className="btn btn--primary btn--block" onClick={onOpenMap}>
            {competition.points.length === 0 ? 'Map points' : 'Edit points on map'}
          </button>

          {competition.points.length === 0 ? (
            <div className="empty-state">
              <p>No points yet. Open the map and long-press to add stops.</p>
            </div>
          ) : (
            <ul className="point-list point-list--static">
              {competition.points.map((point, index) => (
                <li key={point.id} className="point-item point-item--static">
                  <span className="point-item__index">{index + 1}</span>
                  <div className="point-item__body">
                    <strong>{point.name}</strong>
                    <span>
                      {point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn--ghost btn--icon"
                    aria-label={`Remove ${point.name}`}
                    onClick={() => onRemovePoint(point.id)}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
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
    </section>
  )
}
