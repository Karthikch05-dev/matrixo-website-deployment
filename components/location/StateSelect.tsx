'use client'

import { useState, useEffect } from 'react'
import { FaChevronDown } from 'react-icons/fa'

interface State {
  id: string
  name: string
  code: string
}

interface StateSelectProps {
  value: string
  onChange: (value: string) => void
  country: string
  disabled?: boolean
}

export function StateSelect({ value, onChange, country, disabled }: StateSelectProps) {
  const [states, setStates] = useState<State[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!country) {
      setStates([])
      return
    }

    const fetchStates = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/locations/states?country=${country}`)
        if (!res.ok) throw new Error('Failed to fetch states')
        const data = await res.json()
        setStates(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch states')
      } finally {
        setLoading(false)
      }
    }

    fetchStates()
  }, [country])

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        State
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || !country || loading}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <option value="">Select State</option>
          {states.map(state => (
            <option key={state.id} value={state.id}>
              {state.name}
            </option>
          ))}
        </select>
        <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  )
}
