'use client'

import { usePathname } from 'next/navigation'
import Footer from '@/components/Footer'

export default function FooterVisibility() {
  const pathname = usePathname()
  const isContactPage = pathname === '/contact' || pathname.startsWith('/contact/')

  if (isContactPage) {
    return null
  }

  return <Footer />
}
