import { useState, useEffect, useRef } from 'react'
import { searchPositions } from '../api/core'

export default function PositionTypeahead({ value, onChange, label = 'Position' }) {
  const [query, setQuery] = useState(value || '')
  const [suggestions, setSuggestions] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const debounceRef = useRef(null)
  const wrapperRef = useRef(null)

  useEffect(() => {
    setQuery(value || '')
  }, [value])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleChange = (e) => {
    const text = e.target.value
    setQuery(text)
    onChange(text)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (text.trim().length < 2) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await searchPositions(text.trim())
        setSuggestions(res.data?.results || [])
        setShowDropdown(true)
      } catch {
        setSuggestions([])
      }
    }, 300)
  }

  const selectSuggestion = (name) => {
    setQuery(name)
    onChange(name)
    setShowDropdown(false)
    setSuggestions([])
  }

  return (
    <div className="flex flex-col gap-1.5 relative" ref={wrapperRef}>
      <label className="text-xs font-semibold text-gray-500">{label}</label>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
        placeholder="e.g. Class Teacher, Bursar, Librarian..."
        className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold"
        autoComplete="off"
      />
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
          {suggestions.map((pos) => (
            <button
              key={pos.id}
              type="button"
              onClick={() => selectSuggestion(pos.name)}
              className="w-full text-left px-3 py-2 text-sm text-navy hover:bg-gray-50 transition"
            >
              {pos.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}