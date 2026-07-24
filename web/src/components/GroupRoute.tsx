import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { PointOfInterest } from '../types'
import { shareRoute } from '../utils/share'
import { NavigateView } from './NavigateView'

interface GroupRouteProps {
  competitionName: string
  groupName: string
  points: PointOfInterest[]
  onReorder: (orderedIds: string[]) => void
  onShuffle: () => void
  onBack: () => void
}

function SortablePoint({
  point,
  index,
  onNavigate,
}: {
  point: PointOfInterest
  index: number
  onNavigate: (point: PointOfInterest) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: point.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`point-item${isDragging ? ' point-item--dragging' : ''}`}
    >
      <span className="point-item__index">{index + 1}</span>
      <button
        type="button"
        className="point-item__nav"
        onClick={() => onNavigate(point)}
      >
        <strong>{point.name}</strong>
        <span>Tap for line-of-sight · {point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}</span>
      </button>
      <button
        type="button"
        className="point-item__handle"
        aria-label={`Reorder ${point.name}`}
        {...attributes}
        {...listeners}
      >
        ⠿
      </button>
    </li>
  )
}

export function GroupRoute({
  competitionName,
  groupName,
  points,
  onReorder,
  onShuffle,
  onBack,
}: GroupRouteProps) {
  const [status, setStatus] = useState<string | null>(null)
  const [sharing, setSharing] = useState(false)
  const [navigatePoint, setNavigatePoint] = useState<PointOfInterest | null>(null)

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = points.findIndex((point) => point.id === active.id)
    const newIndex = points.findIndex((point) => point.id === over.id)
    const next = arrayMove(points, oldIndex, newIndex)
    onReorder(next.map((point) => point.id))
  }

  const handleShare = async () => {
    if (points.length === 0) {
      setStatus('Add competition points before sharing')
      return
    }

    setSharing(true)
    setStatus(null)

    try {
      const result = await shareRoute(groupName, points, competitionName)
      setStatus(result === 'copied' ? 'Route copied to clipboard' : 'Route shared')
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setStatus(null)
      } else {
        setStatus('Could not share route')
      }
    } finally {
      setSharing(false)
    }
  }

  if (navigatePoint) {
    return (
      <NavigateView point={navigatePoint} onBack={() => setNavigatePoint(null)} />
    )
  }

  return (
    <section className="route-screen">
      <header className="route-screen__header">
        <button type="button" className="btn btn--ghost btn--icon" onClick={onBack} aria-label="Back">
          ←
        </button>
        <div>
          <p className="eyebrow">{competitionName}</p>
          <h1>{groupName}</h1>
        </div>
      </header>

      <p className="hint">
        Tap a stop for line-of-sight navigation. Drag the handle to reorder.
      </p>

      <div className="toolbar-row">
        <button
          type="button"
          className="btn btn--secondary"
          onClick={onShuffle}
          disabled={points.length < 2}
        >
          Shuffle order
        </button>
      </div>

      {points.length === 0 ? (
        <div className="empty-state">
          <p>This competition has no points yet.</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={points.map((point) => point.id)} strategy={verticalListSortingStrategy}>
            <ul className="point-list">
              {points.map((point, index) => (
                <SortablePoint
                  key={point.id}
                  point={point}
                  index={index}
                  onNavigate={setNavigatePoint}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      {status && <p className="status">{status}</p>}

      <div className="route-screen__footer">
        <button
          type="button"
          className="btn btn--primary btn--block"
          onClick={handleShare}
          disabled={sharing || points.length === 0}
        >
          {sharing ? 'Sharing…' : 'Share Route'}
        </button>
      </div>
    </section>
  )
}
