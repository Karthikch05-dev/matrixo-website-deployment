'use client'

import { useMemo, useState } from 'react'
import { FaSearch } from 'react-icons/fa'
import type { Offer } from '@/lib/studentvault/types'
import OfferCard from './OfferCard'

export default function CatalogBrowser({ offers }: { offers: Offer[] }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')

  const categories = useMemo(() => {
    const set = new Set(offers.map((o) => o.category).filter(Boolean))
    return ['All', ...Array.from(set).sort()]
  }, [offers])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return offers.filter((offer) => {
      if (category !== 'All' && offer.category !== category) return false
      if (!term) return true
      return (
        offer.name.toLowerCase().includes(term) ||
        offer.summary.toLowerCase().includes(term) ||
        offer.category.toLowerCase().includes(term)
      )
    })
  }, [offers, search, category])

  return (
    <div>
      <div className="mb-6">
        <label htmlFor="sv-search" className="sr-only">
          Search student offers
        </label>
        <div className="relative">
          <FaSearch
            aria-hidden="true"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
          />
          <input
            id="sv-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tools, credits, certifications…"
            className="glass-input w-full pl-11 pr-4 py-3 rounded-xl text-sm text-gray-900 dark:text-white"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-8" role="group" aria-label="Filter by category">
        {categories.map((cat) => {
          const active = cat === category
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              aria-pressed={active}
              className={`rounded-full px-4 py-2 text-xs font-medium border transition-colors ${
                active
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white/60 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800'
              }`}
            >
              {cat}
            </button>
          )
        })}
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4" aria-live="polite">
        Showing {filtered.length} of {offers.length} offers
      </p>

      {filtered.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            No offers match your search.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </div>
      )}
    </div>
  )
}
