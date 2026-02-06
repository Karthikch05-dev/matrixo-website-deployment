import { Metadata } from 'next'
import ApplicationForm from '@/components/careers/ApplicationForm'

export const metadata: Metadata = {
  title: 'Apply - Career@matriXO',
  description: 'Submit your application to join the matriXO team.',
}

export default function ApplyPage({ params }: { params: { roleId: string } }) {
  return <ApplicationForm roleId={params.roleId} />
}
