'use client'

import { useEffect, useState, useCallback } from 'react'

export const EVENT_VISIBILITY_API = '/api/event-visibility'

export interface EventVisibilityRecord {
  id?: string
  eventSlug: string
  eventId?: string | null
  eventTitle?: string | null
  hidden: boolean
  updatedAt?: string | null
  updatedBy?: string | null
  updatedByName?: string | null
}

async function fetchVisibilityMap(): Promise<Record<string, EventVisibilityRecord>> {
  const response = await fetch(EVENT_VISIBILITY_API, {
    method: 'GET',
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error('Failed to load event visibility')
  }

  const data = await response.json()
  return data.visibilityMap || {}
}

export function useEventVisibility() {
  const [visibilityMap, setVisibilityMap] = useState<Record<string, EventVisibilityRecord>>({})
  const [loading, setLoading] = useState(true)

  const refreshVisibility = useCallback(async () => {
    try {
      const nextMap = await fetchVisibilityMap()
      setVisibilityMap(nextMap)
    } catch (error) {
      console.error('Error fetching event visibility:', error)
      setVisibilityMap({})
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshVisibility()
  }, [refreshVisibility])

  return { visibilityMap, loading, refreshVisibility }
}

export async function updateEventVisibility(
  eventSlug: string,
  updates: Omit<EventVisibilityRecord, 'id' | 'eventSlug' | 'hidden'> & {
    hidden: boolean
    accessToken?: string
  }
) {
  const response = await fetch(EVENT_VISIBILITY_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(updates.accessToken ? { Authorization: `Bearer ${updates.accessToken}` } : {}),
    },
    body: JSON.stringify({
      eventSlug,
      hidden: updates.hidden,
      eventId: updates.eventId || null,
      eventTitle: updates.eventTitle || null,
    }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data?.error || 'Failed to update event visibility')
  }

  return data as { success: true; visibility: EventVisibilityRecord }
}
