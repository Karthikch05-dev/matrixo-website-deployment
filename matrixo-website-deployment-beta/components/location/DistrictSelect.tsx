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
      return
    }

    const fetchDistricts = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/locations/districts?state=${state}`)
        if (!res.ok) throw new Error('Failed to fetch districts')
        const data = await res.json()
        setDistricts(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch districts')
      } finally {
        setLoading(false)
      }
    }

    fetchDistricts()
  }, [state])

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        District
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || !state || loading}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <option value="">Select District</option>
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
