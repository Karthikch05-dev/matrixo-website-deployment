'use client'

import { useState, useEffect } from 'react'
import { FaChevronDown } from 'react-icons/fa'

interface District {
  id: string
  name: string
  code: string
}

interface DistrictSelectProps {
  value: string
  onChange: (value: string) => void
  state: string
  disabled?: boolean
}

export function DistrictSelect({ value, onChange, state, disabled }: DistrictSelectProps) {
  const [districts, setDistricts] = useState<District[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!state) {
      setDistricts([])
      setError(null)
      return
    }

    let isMounted = true
    const controller = new AbortController()

    const fetchDistricts = async () => {
      setLoading(true)
      setError(null)
      setDistricts([]) // Clear stale districts immediately

      try {
        const res = await fetch(`/api/locations/districts?state=${encodeURIComponent(state)}`, {
          signal: controller.signal,
        })
        if (!res.ok) throw new Error('Failed to fetch districts')
        const data = await res.json()
        if (isMounted) {
          setDistricts(Array.isArray(data) ? data : [])
        }
      } catch (err: any) {
        if (err.name !== 'AbortError' && isMounted) {
          setError('Unable to load districts. Please try again.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchDistricts()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [state])

  const placeholderText = loading
    ? 'Loading districts...'
    : state && districts.length === 0 && !error
    ? 'No districts available'
    : 'Select District'

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        District
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || !state || loading || (districts.length === 0 && !loading && !error)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <option value="">{placeholderText}</option>
          {districts.map(district => (
            <option key={district.id} value={district.id}>
              {district.name}
            </option>
          ))}
        </select>
        <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  )
}

