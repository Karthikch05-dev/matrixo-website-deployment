import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In | matriXO',
  description: 'Sign in or create your matriXO account to register for events, workshops, and bootcamps. Access your profile and event history.',
  openGraph: {
    title: 'Sign In to matriXO',
    description: 'Access your matriXO account for events and workshops.',
    url: 'https://matrixo.in/auth',
    siteName: 'matriXO',
    images: [{ url: 'https://matrixo.in/logos/matrixo logo wide.png', width: 1200, height: 630 }],
  },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
