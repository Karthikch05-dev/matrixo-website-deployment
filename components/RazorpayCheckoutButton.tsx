'use client'

import { toast } from 'sonner'
import { useRazorpayCheckout, RazorpaySuccess } from '@/hooks/useRazorpayCheckout'

interface RazorpayCheckoutButtonProps {
  eventId: string
  ticketId?: string
  description?: string
  prefill?: {
    name?: string
    email?: string
    contact?: string
  }
  onSuccess?: (result: RazorpaySuccess) => void
  className?: string
  children?: React.ReactNode
}

export default function RazorpayCheckoutButton({
  eventId,
  ticketId,
  description,
  prefill,
  onSuccess,
  className,
  children,
}: RazorpayCheckoutButtonProps) {
  const { startCheckout, isProcessing } = useRazorpayCheckout()

  const handleClick = () =>
    startCheckout({
      eventId,
      ticketId,
      description,
      prefill,
      onSuccess: (result) => {
        toast.success('Payment successful!')
        onSuccess?.(result)
      },
      onFailure: (message) => toast.error(message),
      onDismiss: () => toast.info('Payment cancelled.'),
    })

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isProcessing}
      className={
        className ||
        'px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
      }
    >
      {isProcessing ? 'Processing…' : children || 'Pay now'}
    </button>
  )
}
