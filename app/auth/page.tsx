import { Suspense } from 'react'
import AuthScreen from '@/components/auth/AuthScreen'
import XOLoader from '@/components/XOLoader'

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center">
          <XOLoader size={20} />
        </div>
      }
    >
      <AuthScreen />
    </Suspense>
  )
}
