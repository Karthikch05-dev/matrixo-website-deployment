import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ApplicationForm from '@/components/careers/ApplicationForm'
import PositionClosed from '@/components/careers/PositionClosed'
import { validateRole } from '@/lib/careers/jobValidation'


export async function generateMetadata({ params }: { params: { roleId: string } }): Promise<Metadata> {
  try {
    const result = await validateRole(params.roleId, true) // preview=true → just for meta
    if (result.ok || result.role) {
      const role = result.ok ? result.role : result.role!
      return {
        title: `${role.title} - Apply | matriXO`,
        description: role.description?.slice(0, 160) || `Apply for ${role.title} at matriXO. ${role.team} team, ${role.location}, ${role.type}.`,
        openGraph: {
          title: `${role.title} - Careers at matriXO`,
          description: role.description?.slice(0, 160) || `Join our ${role.team} team.`,
          url: `https://matrixo.in/careers/apply/${params.roleId}`,
          siteName: 'matriXO',
          images: [{ url: 'https://matrixo.in/logos/matrixo logo wide.png', width: 1200, height: 630, alt: `${role.title} - matriXO` }],
          type: 'website',
        },
        twitter: {
          card: 'summary_large_image',
          title: `${role.title} - Apply at matriXO`,
          description: role.description?.slice(0, 160) || `Join our ${role.team} team.`,
          images: ['https://matrixo.in/logos/matrixo logo wide.png'],
        },
      }
    }
  } catch (e) {
    console.error('Error generating metadata:', e)
  }
  return {
    title: 'Apply - Careers | matriXO',
    description: 'Submit your application to join the matriXO team.',
  }
}

export default async function ApplyPage({
  params,
  searchParams,
}: {
  params: { roleId: string }
  searchParams: { preview?: string }
}) {
  // Admin preview: ?preview=matrixo-admin-preview
  const isAdminPreview = searchParams.preview === 'matrixo-admin-preview'
  const result = await validateRole(params.roleId, isAdminPreview)

  // Role does not exist at all → Next.js 404 page
  if (!result.ok && result.reason === 'not-found') {
    notFound()
  }

  // Role exists but is not open → show PositionClosed page
  if (!result.ok) {
    return <PositionClosed reason={result.reason} roleTitle={result.role?.title} />
  }

  // Role is open → render the application form
  return <ApplicationForm roleId={params.roleId} />
}
