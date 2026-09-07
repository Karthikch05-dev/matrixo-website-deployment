'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { FaSpinner } from 'react-icons/fa'
import { useAuth } from '@/lib/AuthContext'
import { useRazorpayCheckout } from '@/hooks/useRazorpayCheckout'

export default function UnlockPanel({ total }: { total: number }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { startCheckout, isProcessing } = useRazorpayCheckout()
  const [alreadyActive, setAlreadyActive] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function checkAccess() {
      if (!user) {
        setChecking(false)
        return
      }
      try {
        const token = await user.getIdToken()
        const res = await fetch('/api/studentvault/purchase', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (!cancelled) setAlreadyActive(data.active === true)
      } catch {
        // Non-fatal: fall through to showing the purchase button.
      } finally {
        if (!cancelled) setChecking(false)
      }
    }

    if (!loading) checkAccess()
    return () => {
      cancelled = true
    }
  }, [user, loading])

  const handleUnlock = async () => {
    if (!user) {
      router.push('/auth?returnUrl=/studentvault/unlock')
      return
    }

    const token = await user.getIdToken()

    await startCheckout({
      productId: 'studentvault',
      description: 'StudentVault — Lifetime Access',
      verifyPath: '/api/studentvault/purchase',
      authToken: token,
      prefill: {
        name: user.displayName || '',
        email: user.email || '',
      },
      onSuccess: () => {
        toast.success('StudentVault unlocked. Welcome in.')
        router.push('/studentvault/vault')
        router.refresh()
      },
      onFailure: (message) => toast.error(message),
      onDismiss: () => toast.info('Payment cancelled — you have not been charged.'),
    })
  }

  if (loading || checking) {
    return (
      <div className="flex items-center justify-center py-3" aria-live="polite">
        <FaSpinner className="animate-spin text-blue-600 dark:text-blue-400" />
        <span className="sr-only">Checking your access…</span>
      </div>
    )
  }

  if (alreadyActive) {
    return (
      <Link href="/studentvault/vault" className="btn-primary w-full inline-flex justify-center">
        Open your Vault
      </Link>
    )
  }

  return (
    <button
      type="button"
      onClick={handleUnlock}
      disabled={isProcessing}
      className="btn-primary w-full inline-flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isProcessing ? (
        <>
          <FaSpinner className="animate-spin" aria-hidden="true" />
          Processing…
        </>
      ) : user ? (
        `Pay ₹${total} and unlock`
      ) : (
        'Sign in to unlock'
      )}
    </button>
  )
}
