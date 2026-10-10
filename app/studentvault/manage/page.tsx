import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Container } from '@/components/ui/Section'
import ManageClient from '@/components/studentvault/ManageClient'

export const metadata: Metadata = {
  title: 'Manage StudentVault',
  description: 'Team-only StudentVault management.',
  robots: { index: false, follow: false },
}

export default function ManageStudentVaultPage() {
  return (
    <Container className="pb-24 pt-10 sm:pt-14">
      <Link href="/studentvault" className="inline-flex items-center gap-1 text-[14px] text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> StudentVault
      </Link>
      <h1 className="mt-3 text-[30px] font-semibold tracking-[-0.03em] text-ink sm:text-[38px]">Manage StudentVault</h1>
      <p className="mt-2 max-w-2xl text-[15px] text-muted">
        Perks go live as “Researched”. Check each one against the provider’s official page and mark it checked, edit what’s
        changed, or hide it. Review student ID uploads and testimonials here too.
      </p>
      <div className="mt-8">
        <ManageClient />
      </div>
    </Container>
  )
}
