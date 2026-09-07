import { Metadata } from 'next'
import RazorpayCheckoutButton from '@/components/RazorpayCheckoutButton'

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
          Click below to test the Razorpay Standard Checkout flow (test mode).
        </p>
        <RazorpayCheckoutButton
          amount={499}
          description="matriXO test payment"
          prefill={{ name: '', email: '', contact: '' }}
        />
      </div>
    </div>
  )
}
