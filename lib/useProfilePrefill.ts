'use client'

import { useCallback, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/lib/AuthContext'
import { useProfile, type UserProfile } from '@/lib/ProfileContext'

/** Profile fields a form can read from and offer to save back. */
export type PrefillField = 'fullName' | 'phone' | 'rollNumber' | 'college' | 'branch' | 'year' | 'graduationYear'

export interface PrefillValues {
  fullName: string
  email: string
  phone: string
  rollNumber: string
  college: string
  branch: string
  year: string
  graduationYear: string
}

/**
 * "Fill once, reuse everywhere": gives forms the signed-in user's saved
 * details, and after a successful submit asks once whether to save anything
 * new back to their profile. Nothing is saved without a click.
 */
export function useProfilePrefill(onReady?: (values: PrefillValues) => void) {
  const { user } = useAuth()
  const { profile, profileExists, loading, updateProfile } = useProfile()
  const applied = useRef(false)
  const onReadyRef = useRef(onReady)
  onReadyRef.current = onReady

  const values: PrefillValues = {
    fullName: profile?.fullName || user?.displayName || '',
    email: user?.email || profile?.email || '',
    phone: profile?.phone || '',
    rollNumber: profile?.rollNumber || '',
    college: profile?.college || '',
    branch: profile?.branch || '',
    year: profile?.year || '',
    graduationYear: profile?.graduationYear ? String(profile.graduationYear) : '',
  }

  // Hand the values to the form once, when the profile has loaded.
  useEffect(() => {
    if (applied.current || !user || loading) return
    applied.current = true
    onReadyRef.current?.(values)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading])

  const offerSave = useCallback(
    (entered: Partial<Record<PrefillField, string>>) => {
      if (!user || !profileExists || !profile) return
      const updates = Object.fromEntries(
        Object.entries(entered).filter(([key, value]) => {
          const v = typeof value === 'string' ? value.trim() : ''
          return v && !String(profile[key as keyof UserProfile] ?? '').trim()
        })
      ) as Partial<Record<PrefillField, string>>
      if (Object.keys(updates).length === 0) return
      toast('Save these details to your profile?', {
        description: 'We’ll fill them in for you next time.',
        duration: 15000,
        action: {
          label: 'Save',
          onClick: () => {
            updateProfile(updates)
              .then(() => toast.success('Saved to your profile.'))
              .catch(() => toast.error('Couldn’t save to your profile.'))
          },
        },
      })
    },
    [user, profileExists, profile, updateProfile]
  )

  return { values, signedIn: Boolean(user), offerSave }
}
