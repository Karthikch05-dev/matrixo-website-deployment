'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { useProfile } from '@/lib/ProfileContext'
import { useRazorpayCheckout } from '@/hooks/useRazorpayCheckout'
import type { StudentVaultAccess } from '@/lib/studentvault/access'
import type { StudentVaultPrice } from '@/lib/studentvault/pricingConfig'

export type { StudentVaultAccess }

/** Authenticated fetch helper for the StudentVault APIs. */
export function useAuthedFetch() {
  const { user } = useAuth()
  return useCallback(
    async (url: string, init: RequestInit = {}) => {
      const token = user ? await user.getIdToken() : undefined
      const isForm = typeof FormData !== 'undefined' && init.body instanceof FormData
      return fetch(url, {
        ...init,
        headers: {
          ...(isForm ? {} : { 'Content-Type': 'application/json' }),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(init.headers || {}),
        },
      })
    },
    [user]
  )
}

// One request per user every few seconds, however many buttons are on the page.
const accessRequests = new Map<string, { at: number; promise: Promise<{ ok: boolean; data: any }> }>()
const ACCESS_TTL_MS = 5000

interface AccessState {
  loading: boolean
  access: StudentVaultAccess | null
  price: StudentVaultPrice | null
  error: string | null
}

/** The signed-in user's pass + verification state, kept fresh. */
export function useStudentVaultAccess() {
  const { user, loading: authLoading } = useAuth()
  const authedFetch = useAuthedFetch()
  const [state, setState] = useState<AccessState>({ loading: true, access: null, price: null, error: null })

  const refresh = useCallback(async (force = false) => {
    const key = user?.uid ?? 'guest'
    try {
      let entry = accessRequests.get(key)
      if (force || !entry || Date.now() - entry.at > ACCESS_TTL_MS) {
        entry = {
          at: Date.now(),
          promise: authedFetch('/api/studentvault/access', { cache: 'no-store' }).then(async (res) => ({
            ok: res.ok,
            data: await res.json().catch(() => ({})),
          })),
        }
        accessRequests.set(key, entry)
      }
      const { ok, data } = await entry.promise
      if (!ok) throw new Error(data.error || 'Could not load your access.')
      setState({ loading: false, access: data.access ?? null, price: data.price ?? null, error: null })
    } catch (error) {
      accessRequests.delete(key)
      setState((s) => ({ ...s, loading: false, error: error instanceof Error ? error.message : 'Could not load your access.' }))
    }
  }, [authedFetch, user?.uid])

  useEffect(() => {
    if (authLoading) return
    setState((s) => ({ ...s, loading: true }))
    refresh()
  }, [authLoading, user?.uid, refresh])

  const setAccess = useCallback(
    (access: StudentVaultAccess) => {
      accessRequests.delete(user?.uid ?? 'guest')
      setState((s) => ({ ...s, access }))
    },
    [user?.uid]
  )

  return { ...state, loading: state.loading || authLoading, user, refresh: () => refresh(true), setAccess }
}

const RESUME_KEY = 'sv-resume-checkout'

export type CheckoutPhase = 'idle' | 'signing-in' | 'opening' | 'failed' | 'dismissed'

/**
 * Two-click purchase: Google sign-in (only if needed) then Razorpay, with the
 * buyer's details prefilled from their profile. If sign-in goes through a
 * redirect, checkout resumes automatically when they land back on the page.
 */
export function useStudentVaultCheckout() {
  const router = useRouter()
  const { user, signInWithGoogle } = useAuth()
  const { profile } = useProfile()
  const { startCheckout, isProcessing } = useRazorpayCheckout()
  const authedFetch = useAuthedFetch()
  const [phase, setPhase] = useState<CheckoutPhase>('idle')
  const [error, setError] = useState<string | null>(null)
  const opening = useRef(false)

  const open = useCallback(async () => {
    if (!user || opening.current) return
    opening.current = true
    setPhase('opening')
    setError(null)
    try {
      // Already bought (e.g. on another device)? Go straight to the vault.
      const res = await authedFetch('/api/studentvault/access', { cache: 'no-store' })
      const data = await res.json().catch(() => null)
      if (data?.access?.paid) {
        router.push('/studentvault/vault')
        return
      }
      await startCheckout({
        productId: 'studentvault',
        description: 'StudentVault pass',
        prefill: {
          name: profile?.fullName || user.displayName || undefined,
          email: user.email || undefined,
          contact: profile?.phone || undefined,
        },
        verifyPath: '/api/studentvault/purchase',
        onSuccess: () => {
          setPhase('idle')
          router.push('/studentvault/vault?welcome=1')
        },
        onFailure: (message) => {
          setPhase('failed')
          setError(message)
        },
        onDismiss: () => setPhase('dismissed'),
      })
    } finally {
      opening.current = false
    }
  }, [user, authedFetch, startCheckout, profile?.fullName, profile?.phone, router])

  const begin = useCallback(async () => {
    setError(null)
    if (user) return open()
    setPhase('signing-in')
    try {
      sessionStorage.setItem(RESUME_KEY, '1')
    } catch {
      // Without storage the buyer just clicks Buy again after signing in.
    }
    try {
      await signInWithGoogle()
      // Popup: onAuthStateChanged sets `user`, and the effect below resumes.
    } catch (err: any) {
      try {
        sessionStorage.removeItem(RESUME_KEY)
      } catch {}
      const closed = err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request'
      setPhase(closed ? 'idle' : 'failed')
      if (!closed) setError('Google sign-in didn’t finish. Try again.')
    }
  }, [user, open, signInWithGoogle])

  useEffect(() => {
    if (!user) return
    let resume = false
    try {
      resume = sessionStorage.getItem(RESUME_KEY) === '1'
      if (resume) sessionStorage.removeItem(RESUME_KEY)
    } catch {}
    if (resume) open()
  }, [user, open])

  return {
    begin,
    phase,
    error,
    busy: phase === 'signing-in' || phase === 'opening' || isProcessing,
    signedIn: Boolean(user),
  }
}
