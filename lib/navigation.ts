import { BETA_PRODUCTS_ENABLED, SITE } from '@/lib/site'

export type NavLink = {
  label: string
  href: string
  description?: string
  /** Extra paths that should light this link up. */
  match?: string[]
}

export type NavGroup = { label: string; items: NavLink[] }

export const PRIMARY_NAV: NavLink[] = [
  { label: 'Events', href: '/events', match: ['/'] },
  { label: 'StudentVault', href: '/studentvault' },
  { label: 'Services', href: '/services' },
]

export const COMPANY_NAV: NavGroup = {
  label: 'Company',
  items: [
    { label: 'Why matriXO', href: '/home', description: 'What we do and who it’s for' },
    { label: 'About', href: '/about', description: 'Our story and mission' },
    { label: 'Team', href: '/team', description: 'The people behind matriXO' },
    { label: 'Careers', href: '/careers', description: 'Open roles and internships' },
    { label: 'Brand', href: '/brand', description: 'Logos, colours and guidelines' },
  ],
}

/** Beta products. Shown only where BETA_PRODUCTS_ENABLED (beta.matrixo.in). */
export const LABS_NAV: NavGroup | null = BETA_PRODUCTS_ENABLED
  ? {
      label: 'Labs',
      items: [
        { label: 'SkillDNA', href: '/skilldna', description: 'Map your skills with AI' },
        { label: 'GrowGrid', href: '/growgrid', description: 'Guided learning paths' },
        { label: 'PlayCred', href: '/playcred', description: 'Verifiable credentials' },
        { label: 'MentorMatrix', href: '/mentormatrix', description: 'Book time with mentors' },
        { label: 'ImpactVault', href: '/impactvault', description: 'Outcomes for institutions' },
      ],
    }
  : null

export const FOOTER_NAV: NavGroup[] = [
  {
    label: 'Programs',
    items: [
      { label: 'Events', href: '/events' },
      { label: 'StudentVault', href: '/studentvault' },
      { label: 'Workshops', href: '/services#workshops' },
      { label: 'Hackathons', href: '/services#hackathons' },
      { label: 'Bootcamps', href: '/services#bootcamps' },
    ],
  },
  {
    label: 'Company',
    items: [
      { label: 'Why matriXO', href: '/home' },
      { label: 'About', href: '/about' },
      { label: 'Team', href: '/team' },
      { label: 'Careers', href: '/careers' },
      { label: 'Blog', href: '/blog' },
      { label: 'Brand kit', href: '/brand' },
    ],
  },
  {
    label: 'Support',
    items: [
      { label: 'Contact us', href: '/contact' },
      { label: 'Notifications', href: '/notifications' },
      { label: 'Email', href: `mailto:${SITE.email}` },
      { label: 'Instagram', href: SITE.social.instagram },
      { label: 'LinkedIn', href: SITE.social.linkedin },
    ],
  },
]

export const LEGAL_NAV: NavLink[] = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Refunds', href: '/refund' },
  { label: 'Data protection', href: '/data-protection' },
]

export function isActive(link: NavLink, pathname: string): boolean {
  const paths = [link.href, ...(link.match ?? [])]
  return paths.some((p) => (p === '/' ? pathname === '/' : pathname === p || pathname.startsWith(p + '/')))
}
