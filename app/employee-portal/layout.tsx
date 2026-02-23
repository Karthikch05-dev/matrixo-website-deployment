import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Employee Portal | matriXO Team',
  description: 'matriXO internal employee portal for team management, attendance tracking, meetings, and collaboration.',
  robots: { index: false, follow: false },
  // Dedicated manifest for the employee portal PWA (start_url = /employee-portal)
  manifest: '/employee-portal-manifest.json',
  // iOS PWA / Add to Home Screen support
  // These meta tags are required for iOS to treat the page as a proper
  // standalone web app and to correctly trigger geolocation permission dialogs.
  appleWebApp: {
    capable: true,
    title: 'Team Portal',
    statusBarStyle: 'black-translucent',
    startupImage: '/logos/logo-dark.png',
  },
  other: {
    // Additional Apple meta tags that appleWebApp doesn't cover
    'mobile-web-app-capable': 'yes',
    // Viewport fit is needed so content reaches behind the status bar notch
    'viewport': 'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover',
  },
}

export default function EmployeePortalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
