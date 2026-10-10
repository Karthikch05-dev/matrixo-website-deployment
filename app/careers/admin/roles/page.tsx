import { Metadata } from 'next'
import RoleManagement from '@/components/careers/RoleManagement'

export const metadata: Metadata = {
  title: 'Role management · Careers',
  description: 'Manage career roles and postings.',
}

export default function RoleManagementPage() {
  return <RoleManagement />
}
