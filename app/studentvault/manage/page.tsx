import { Metadata } from 'next'
import Link from 'next/link'
import ManageClient from '@/components/studentvault/ManageClient'

export const metadata: Metadata = {
  title: 'Manage StudentVault catalog',
  description: 'Employee-only StudentVault catalog management.',
  robots: { index: false, follow: false },
}

export default function ManageStudentVaultPage() {
  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container-custom px-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-4 text-sm">
          <Link
            href="/studentvault"
            className="text-gray-500 dark:text-gray-400 hover:underline"
          >
            ← StudentVault
          </Link>
        </nav>

        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-display font-bold gradient-text mb-2">
            Manage the StudentVault catalog
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl">
            Add, edit and verify student offers. Nothing appears publicly until you
            verify it against the provider&apos;s official source and publish it. If you
            cannot confirm a detail, leave the offer as a draft rather than guessing.
          </p>
        </header>

        <ManageClient />
      </div>
    </div>
  )
}
