'use client'

import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { FaChevronDown, FaSearch } from 'react-icons/fa'

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
  state?: string
}

export function CollegeSelect({
  value,
  onChange,
  district,
  disabled,
  onNotFound,
  showNotFoundOption = true,
  state,
}: CollegeSelectProps) {
  const [colleges, setColleges] = useState<College[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [optionsMaxHeight, setOptionsMaxHeight] = useState(260)

  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isDropdownOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isDropdownOpen])

  // Close dropdown on Escape key
  useEffect(() => {
    if (!isDropdownOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsDropdownOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isDropdownOpen])

  // Dynamically calculate max height to keep dropdown strictly inside the profile card
  useLayoutEffect(() => {
    if (isDropdownOpen && buttonRef.current) {
      // Find the outer profile card container. Fallback to document body if not found.
      const card = buttonRef.current.closest('.rounded-3xl') || document.body
      const buttonRect = buttonRef.current.getBoundingClientRect()
      const cardRect = card.getBoundingClientRect()
      
      // Calculate available space from the bottom of the button to the bottom of the card
      // We subtract an additional 60px to account for the search box height and some padding
      let availableSpace = (cardRect.bottom - buttonRect.bottom) - 60
      
      // Ensure a reasonable minimum height so it's not unusable
      if (availableSpace < 100) availableSpace = 100
      
      // Don't exceed the default max height of 260px if there is plenty of space
      setOptionsMaxHeight(Math.min(availableSpace, 260))
    }
  }, [isDropdownOpen])

  useEffect(() => {
    if (!district) {
      setColleges([])
      setError(null)
      setIsDropdownOpen(false)
      return
    }

    let isMounted = true
    const controller = new AbortController()

    const fetchColleges = async () => {
      setLoading(true)
      setError(null)
      setColleges([]) // Clear stale colleges immediately

      try {
        const url = new URL('/api/locations/colleges', window.location.origin)
        if (district) url.searchParams.append('district', district)
        if (state) url.searchParams.append('state', state)
        
        const res = await fetch(url.toString(), {
          signal: controller.signal,
        })
        if (!res.ok) throw new Error('Failed to fetch colleges')
        const data = await res.json()
        if (isMounted) {
          setColleges(Array.isArray(data) ? data : [])
        }
      } catch (err: any) {
        if (err.name !== 'AbortError' && isMounted) {
          setError('Unable to load colleges. Please try again.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchColleges()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [district, state])

  const filteredColleges = colleges.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.city && c.city.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const selectedCollege = colleges.find(c => c.id === value)

  const buttonText = loading
    ? 'Loading colleges...'
    : selectedCollege
    ? selectedCollege.name
    : district && colleges.length === 0 && !loading && !error
    ? 'No colleges available'
    : 'Select College'

  const isDisabled = disabled || !district || loading || (colleges.length === 0 && !loading && !error)

  const toggleDropdown = () => {
    if (isDisabled) return
    if (!isDropdownOpen) {
      setSearchTerm('')
    }
    setIsDropdownOpen(!isDropdownOpen)
  }

  return (
    <div className="relative min-w-0" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        College
      </label>

      <div className="relative min-w-0">
        <button
          ref={buttonRef}
          type="button"
          onClick={toggleDropdown}
          disabled={isDisabled}
          className="w-full min-w-0 max-w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-left appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center justify-between"
        >
          <span className={`truncate ${selectedCollege ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
            {buttonText}
          </span>
          <FaChevronDown
            className={`text-gray-400 text-xs flex-shrink-0 ml-2 transition-transform ${
              isDropdownOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isDropdownOpen && (
          <div 
            className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl z-50 overflow-hidden flex flex-col box-border"
          >
            {/* Search Box - Sticky at top of dropdown */}
            <div className="p-2 border-b border-gray-200 dark:border-gray-700 shrink-0">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search colleges..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 box-border"
                  autoFocus
                />
              </div>
            </div>

            {/* Scrollable list */}
            <div 
              className="overflow-y-auto p-1 flex flex-col gap-1 box-border"
              style={{ maxHeight: `${optionsMaxHeight}px` }}
            >
              {!searchTerm && (
                <button
                  type="button"
                  onClick={() => { onChange('', ''); setIsDropdownOpen(false) }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${!value ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  Select College
                </button>
              )}
              
              {filteredColleges.length === 0 ? (
                <div className="p-3 text-center text-sm text-gray-500 dark:text-gray-400">
                  No colleges found
                </div>
              ) : (
                filteredColleges.map(college => (
                  <button
                    key={college.id}
                    type="button"
                    onClick={() => {
                      onChange(college.id, college.name)
                      setIsDropdownOpen(false)
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${value === college.id ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  >
                    <div className="truncate">{college.name}</div>
                    <div className={`text-xs truncate ${value === college.id ? 'text-blue-500/80 dark:text-blue-400/80' : 'text-gray-500 dark:text-gray-400'}`}>
                      {college.city}
                    </div>
                  </button>
                ))
              )}

              {showNotFoundOption && (
                <>
                  <div className="h-px bg-gray-200 dark:bg-gray-700 my-1 mx-2 shrink-0" />
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false)
                      onNotFound?.()
                    }}
                    className="w-full shrink-0 text-left px-3 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md font-medium text-sm transition-colors"
                  >
                    + College Not Found? Request Addition
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  )
}
