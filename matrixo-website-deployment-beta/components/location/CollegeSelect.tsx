'use client'

import { useState, useEffect } from 'react'
import { FaChevronDown, FaSearch } from 'react-icons/fa'
import { toast } from 'sonner'

interface College {
  id: string
  name: string
  city: string
}

interface CollegeSelectProps {
  value: string
  onChange: (collegeId: string, collegeName: string) => void
  district: string
  disabled?: boolean
  onNotFound?: () => void
  showNotFoundOption?: boolean
}

export function CollegeSelect({
  value,
  onChange,
  district,
  disabled,
  onNotFound,
  showNotFoundOption = true,
}: CollegeSelectProps) {
  const [colleges, setColleges] = useState<College[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.college-dropdown-container')) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  useEffect(() => {
    if (!district) {
      setColleges([])
      return
    }

    const fetchColleges = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/locations/colleges?district=${district}`)
        if (!res.ok) throw new Error('Failed to fetch colleges')
        const data = await res.json()
        setColleges(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch colleges')
      } finally {
        setLoading(false)
      }
    }

    fetchColleges()
  }, [district])

  const filteredColleges = colleges.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.city.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedCollege = colleges.find(c => c.id === value)

  return (
    <div className="relative college-dropdown-container">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        College
      </label>

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          disabled={disabled || !district || loading}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <span>{selectedCollege ? selectedCollege.name : 'Select College'}</span>
          <FaChevronDown
            className={`text-gray-400 transition-transform ${
              isDropdownOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50">
            {/* Search Box */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search colleges..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Colleges List */}
            <div className="max-h-48 overflow-y-auto">
              {loading ? (
                <div className="p-3 text-gray-500 dark:text-gray-400 text-sm">
                  Loading colleges...
                </div>
              ) : filteredColleges.length === 0 ? (
                <div className="p-3 text-gray-500 dark:text-gray-400 text-sm">
                  {searchTerm ? 'No colleges found matching your search' : 'No colleges available'}
                </div>
              ) : (
                filteredColleges.map(college => (
                  <button
                    key={college.id}
                    type="button"
                    onClick={() => {
                      onChange(college.id, college.name)
                      setIsDropdownOpen(false)
                      setSearchTerm('')
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                      value === college.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    <div className="font-medium">{college.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {college.city}
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Not Found Option */}
            {showNotFoundOption && (
              <div className="border-t border-gray-200 dark:border-gray-700 p-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false)
                    onNotFound?.()
                  }}
                  className="w-full text-left px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded font-medium text-sm"
                >
                  + College Not Found? Request Addition
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  )
}
