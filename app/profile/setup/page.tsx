'use client'

import { useRouter } from 'next/navigation'
import { Container } from '@/components/ui/Section'
import { Skeleton } from '@/components/ui/Feedback'
import { ButtonLink } from '@/components/ui/Button'
import { useAuth } from '@/lib/AuthContext'
import { useProfile } from '@/lib/ProfileContext'
import OnboardingFlow from '@/components/profile/OnboardingFlow'

/** Full-page version of the first-run onboarding (also reachable from the profile nudge). */
export default function ProfileSetupPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { profile, loading } = useProfile()

  return (
    <Container size="narrow" className="pb-24 pt-10 sm:pt-16">
      <div className="mx-auto max-w-lg rounded-[28px] border border-line bg-surface p-6 shadow-raised sm:p-9">
        {authLoading || (user && loading) ? (
          <div className="space-y-4" aria-busy="true">
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        ) : !user ? (
          <div className="text-center">
            <h1 className="text-[24px] font-semibold text-ink">Sign in to set up your profile</h1>
            <ButtonLink href="/auth?returnUrl=/profile/setup" className="mt-6">
              Sign in
            </ButtonLink>
          </div>
        ) : profile ? (
          <OnboardingFlow onFinish={() => router.push('/profile')} />
        ) : (
          <p className="text-center text-[15px] text-muted">We couldn’t load your profile. Refresh the page to try again.</p>
        )}
      </div>
    </Container>
  )
}
