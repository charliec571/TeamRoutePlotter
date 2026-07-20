import { useEffect, useId, useRef, useState } from 'react'
import { searchPlaces, type PlaceResult } from '../utils/geocode'

interface PlaceSearchProps {
  onSelect: (place: PlaceResult) => void
}

export function PlaceSearch({ onSelect }: PlaceSearchProps) {
  const listId = useId()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PlaceResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setResults([])
      setLoading(false)
      setError(null)
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const places = await searchPlaces(trimmed, controller.signal)
        setResults(places)
        setOpen(true)
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setResults([])
        setError('Could not search places')
      } finally {
        setLoading(false)
      }
    }, 280)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [query])

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  const handleSelect = (place: PlaceResult) => {
    setQuery(place.label)
    setResults([])
    setOpen(false)
    onSelect(place)
  }

  return (
    <div className="place-search" ref={rootRef}>
      <label className="visually-hidden" htmlFor={`${listId}-input`}>
        Search towns, cities, or places
      </label>
      <input
        id={`${listId}-input`}
        className="field field--map"
        type="search"
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        placeholder="Search towns, cities, places…"
        value={query}
        autoComplete="off"
        enterKeyHint="search"
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
        }}
        onFocus={() => {
          if (results.length > 0) setOpen(true)
        }}
      />
      {loading && <p className="place-search__status">Searching…</p>}
      {error && <p className="place-search__status place-search__status--error">{error}</p>}
      {open && results.length > 0 && (
        <ul id={listId} className="place-search__results" role="listbox">
          {results.map((place) => (
            <li key={place.id} role="option">
              <button type="button" onClick={() => handleSelect(place)}>
                {place.label}
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && !loading && query.trim().length >= 2 && results.length === 0 && !error && (
        <p className="place-search__status">No places found</p>
      )}
    </div>
  )
}
