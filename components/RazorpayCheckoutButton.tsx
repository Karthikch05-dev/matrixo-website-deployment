'use client'

import { useState } from 'react'
import Script from 'next/script'
import { toast } from 'sonner'

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void
      on: (event: string, handler: (response: unknown) => void) => void
    }
  }
}

interface RazorpayCheckoutButtonProps {
  amount: number // in rupees
  currency?: string
  name?: string
  description?: string
  prefill?: {
    name?: string
    email?: string
    contact?: string
  }
  onSuccess?: (paymentId: string, orderId: string) => void
  onFailure?: (error: string) => void
  className?: string
  children?: React.ReactNode
}

export default function RazorpayCheckoutButton({
  amount,
  currency = 'INR',
  name = 'matriXO',
  description = 'Payment',
  prefill,
  onSuccess,
  onFailure,
  className,
  children,
}: RazorpayCheckoutButtonProps) {
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const handlePayment = async () => {
    if (!scriptLoaded || typeof window.Razorpay === 'undefined') {
      toast.error('Payment gateway is still loading. Please try again.')
      return
    }

    setIsProcessing(true)

    try {
      const orderResponse = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // convert to paise
          currency,
          receipt: `receipt_${Date.now()}`,
        }),
      })

      const orderData = await orderResponse.json()

      if (!orderResponse.ok) {
        throw new Error(orderData.error || 'Failed to create order.')
      }

      const razorpay = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name,
        description,
        order_id: orderData.order_id,
        prefill,
        handler: async (response: unknown) => {
          const paymentResponse = response as {
            razorpay_order_id: string
            razorpay_payment_id: string
            razorpay_signature: string
          }

          try {
            const verifyResponse = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(paymentResponse),
            })

            const verifyData = await verifyResponse.json()

            if (!verifyResponse.ok || !verifyData.success) {
              throw new Error(verifyData.error || 'Payment verification failed.')
            }

            toast.success('Payment successful!')
            onSuccess?.(paymentResponse.razorpay_payment_id, paymentResponse.razorpay_order_id)
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Payment verification failed.'
            toast.error(message)
            onFailure?.(message)
          } finally {
            setIsProcessing(false)
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false)
            toast.info('Payment cancelled.')
          },
        },
        theme: { color: '#6366f1' },
      })

      razorpay.on('payment.failed', (response: unknown) => {
        const failure = response as { error?: { description?: string } }
        const message = failure?.error?.description || 'Payment failed. Please try again.'
        setIsProcessing(false)
        toast.error(message)
        onFailure?.(message)
      })

      razorpay.open()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong.'
      toast.error(message)
      onFailure?.(message)
      setIsProcessing(false)
    }
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setScriptLoaded(true)}
      />
      <button
        type="button"
        onClick={handlePayment}
        disabled={isProcessing || !scriptLoaded}
        className={
          className ||
          'px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
        }
      >
        {isProcessing ? 'Processing…' : children || `Pay ₹${amount}`}
      </button>
    </>
  )
}
