'use client'

import Link from 'next/link'
import { FaLock, FaSpinner } from 'react-icons/fa'
import { EmployeeAuthProvider, useEmployeeAuth } from '@/lib/employeePortalContext'
import EmployeeConsole from '@/components/studentvault/EmployeeConsole'

function ConsoleGate() {
  const { user, employee, loading } = useEmployeeAuth()

  if (loading) {
    return (
      <div className="flex justify-center py-20" aria-live="polite">
        <FaSpinner className="animate-spin text-3xl text-blue-500" />
        <span className="sr-only">Checking your access…</span>
      </div>
    )
  }

  // This is a convenience gate only — every write is independently authorized
  // on the server, so bypassing this in the browser grants nothing.
  if (!user || !employee) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center max-w-lg mx-auto">
        <FaLock className="mx-auto mb-3 text-2xl text-red-400" aria-hidden="true" />
        <p className="font-semibold text-red-300 mb-1">Employee sign-in required</p>
        <p className="text-sm text-red-200/80 mb-4">
          Sign in through the employee portal to manage the StudentVault catalog.
        </p>
        <Link
          href="/employee-portal"
          className="inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Go to employee portal
        </Link>
      </div>
    )
  }

  return <EmployeeConsole getIdToken={() => user.getIdToken()} />
}

export default function StudentVaultAdminPage() {
  return (
    <EmployeeAuthProvider>
      {/* The portal is always dark, so scope `dark` here to keep the shared
          console legible regardless of the visitor's site theme. */}
      <div className="dark min-h-screen bg-[#09090b] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <nav aria-label="Breadcrumb" className="mb-4 text-sm">
            <Link href="/employee-portal" className="text-gray-500 hover:text-gray-300">
              ← Employee portal
            </Link>
          </nav>

          <header className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mb-2">
              StudentVault — catalog management
            </h1>
            <p className="text-sm text-gray-400 max-w-2xl">
              Add, edit and verify student offers. Nothing appears publicly until you
              verify it against the provider&apos;s official source and publish it. If
              you cannot confirm a detail, leave the offer as a draft rather than
              guessing.
            </p>
          </header>

          <ConsoleGate />
        </div>
      </div>
    </EmployeeAuthProvider>
  )
}
