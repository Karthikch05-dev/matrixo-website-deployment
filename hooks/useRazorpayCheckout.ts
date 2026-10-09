'use client'

import { useCallback, useState } from 'react'

const CHECKOUT_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js'

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void
      on: (event: string, handler: (response: unknown) => void) => void
    }
  }
}

let scriptPromise: Promise<void> | null = null

function loadCheckoutScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'))
  if (typeof window.Razorpay !== 'undefined') return Promise.resolve()

  if (!scriptPromise) {
    scriptPromise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(
        `script[src="${CHECKOUT_SCRIPT_URL}"]`
      )
      const script = existing || document.createElement('script')

      script.addEventListener('load', () => resolve())
      script.addEventListener('error', () => {
        scriptPromise = null
        reject(new Error('Could not load the payment gateway. Check your connection.'))
      })

      if (!existing) {
        script.src = CHECKOUT_SCRIPT_URL
        script.async = true
        document.body.appendChild(script)
      }
    })
  }

  return scriptPromise
}

export interface RazorpaySuccess {
  paymentId: string
  orderId: string
  signature: string
  basePrice: number
  platformFee: number
  total: number
}

export interface StartCheckoutOptions {
  /** Event checkout. Provide either eventId or productId. */
  eventId?: string
  ticketId?: string
  /** Product checkout (e.g. 'studentvault'). */
  productId?: string
  description?: string
  prefill?: {
    name?: string
    email?: string
    contact?: string
  }
  notes?: Record<string, string>
  /** Defaults to the shared signature-verification endpoint. */
  verifyPath?: string
  /** Firebase ID token, when the verify endpoint needs to identify the buyer. */
  authToken?: string
  onSuccess: (result: RazorpaySuccess) => void | Promise<void>
  onFailure?: (message: string) => void
  onDismiss?: () => void
}

export function useRazorpayCheckout() {
  const [isProcessing, setIsProcessing] = useState(false)

  const startCheckout = useCallback(async (options: StartCheckoutOptions) => {
    const {
      eventId,
      ticketId,
      productId,
      description,
      prefill,
      notes,
      verifyPath = '/api/razorpay/verify-payment',
      authToken,
      onSuccess,
      onFailure,
      onDismiss,
    } = options

    setIsProcessing(true)

    try {
      await loadCheckoutScript()

      const orderResponse = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, ticketId, productId, notes }),
      })

      const orderData = await orderResponse.json()

      if (!orderResponse.ok) {
        throw new Error(orderData.error || 'Could not start the payment.')
      }

      const razorpay = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'matriXO',
        description: description || 'Event registration',
        order_id: orderData.order_id,
        prefill,
        notes,
        handler: async (response: unknown) => {
          const payment = response as {
            razorpay_order_id: string
            razorpay_payment_id: string
            razorpay_signature: string
          }

          try {
            const verifyResponse = await fetch(verifyPath, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
              },
              body: JSON.stringify(payment),
            })

            const verifyData = await verifyResponse.json()

            if (!verifyResponse.ok || !verifyData.success) {
              throw new Error(verifyData.error || 'Payment could not be verified.')
            }

            await onSuccess({
              paymentId: payment.razorpay_payment_id,
              orderId: payment.razorpay_order_id,
              signature: payment.razorpay_signature,
              basePrice: orderData.basePrice,
              platformFee: orderData.platformFee,
              total: orderData.total,
            })
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Payment verification failed.'
            onFailure?.(message)
          } finally {
            setIsProcessing(false)
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false)
            onDismiss?.()
          },
        },
        theme: { color: '#6366f1' },
      })

      razorpay.on('payment.failed', (response: unknown) => {
        const failure = response as { error?: { description?: string } }
        setIsProcessing(false)
        onFailure?.(
          failure?.error?.description || 'Payment failed. Please try again.'
        )
      })

      razorpay.open()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong.'
      setIsProcessing(false)
      onFailure?.(message)
    }
  }, [])

  return { startCheckout, isProcessing }
}
