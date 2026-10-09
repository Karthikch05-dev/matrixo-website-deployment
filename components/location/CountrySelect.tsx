'use client'

import { useState, useEffect, useRef } from 'react'
import { FaChevronDown } from 'react-icons/fa'

interface Country {
  id: string
  name: string
  code: string
}

interface CountrySelectProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function CountrySelect({ value, onChange, disabled }: CountrySelectProps) {
  const [countries, setCountries] = useState<Country[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()

    const fetchCountries = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/locations/countries', {
          signal: controller.signal,
        })
        if (!res.ok) throw new Error('Failed to fetch countries')
        const data = await res.json()
        if (isMounted) {
          setCountries(Array.isArray(data) ? data : [])
        }
      } catch (err: any) {
        if (err.name !== 'AbortError' && isMounted) {
          setError('Unable to load countries. Please try again.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchCountries()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Close dropdown on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const placeholderText = loading
    ? 'Loading countries...'
    : countries.length === 0 && !error
    ? 'No countries available'
    : 'Select Country'

  const isDisabled = disabled || loading || (countries.length === 0 && !loading && !error)
  const selectedCountry = countries.find(c => c.id === value)

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Country
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => { if (!isDisabled) setIsOpen(!isOpen) }}
          disabled={isDisabled}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-left appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center justify-between"
        >
          <span className={`truncate ${selectedCountry ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
            {selectedCountry ? selectedCountry.name : placeholderText}
          </span>
          <FaChevronDown className={`text-gray-400 text-xs flex-shrink-0 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl z-50 overflow-hidden">
            <div className="max-h-[260px] overflow-y-auto p-1">
              <button
                type="button"
                onClick={() => { onChange(''); setIsOpen(false) }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${!value ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                Select Country
              </button>
              {countries.map(country => (
                <button
                  key={country.id}
                  type="button"
                  onClick={() => { onChange(country.id); setIsOpen(false) }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${value === country.id ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  {country.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  )
}
