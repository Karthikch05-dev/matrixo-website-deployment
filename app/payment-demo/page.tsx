import { Metadata } from 'next'
import RazorpayCheckoutButton from '@/components/RazorpayCheckoutButton'
import { PLATFORM_FEE } from '@/lib/payments'

export const metadata: Metadata = {
  title: 'Payment Demo - matriXO',
  description: 'Test the Razorpay Standard Checkout integration.',
}

export default function PaymentDemoPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6 py-24">
        <h1 className="text-2xl font-bold">Razorpay Checkout Demo</h1>
        <p className="text-sm opacity-70">
          Runs the real DevAgentic 1.0 pass through checkout in test mode: ₹199 ticket
          + ₹{PLATFORM_FEE} platform fee.
        </p>
        <RazorpayCheckoutButton
          eventId="devagents-1-0"
          ticketId="devagents-pass"
          description="matriXO test payment"
        >
          Pay ₹{199 + PLATFORM_FEE}
        </RazorpayCheckoutButton>
      </div>
    </div>
  )
}
