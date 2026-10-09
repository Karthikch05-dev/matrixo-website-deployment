'use client'

import EventQRScanner from '@/components/employee-portal/EventQRScanner'
import { EmployeeAuthProvider } from '@/lib/employeePortalContext'

export default function EventCheckInPage() {
  // The scanner reads the signed-in employee, so it needs the portal's auth
  // provider just like the main portal page.
  return (
    <EmployeeAuthProvider>
      <EventQRScanner />
    </EmployeeAuthProvider>
  )
}
