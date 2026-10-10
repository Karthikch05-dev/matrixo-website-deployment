/**
 * Site-wide constants shared by metadata, structured data and the shell.
 *
 * `BETA_PRODUCTS_ENABLED` is the one switch that differs between the two
 * deployments: matrixo.in (main) keeps GrowGrid, PlayCred and MentorMatrix out
 * of navigation and out of search, beta.matrixo.in shows them. It can be forced
 * either way with NEXT_PUBLIC_BETA_PRODUCTS=true|false; otherwise it follows the
 * branch default below.
 */

const BRANCH_DEFAULT_BETA_PRODUCTS = false

const envFlag = process.env.NEXT_PUBLIC_BETA_PRODUCTS?.trim().toLowerCase()

export const BETA_PRODUCTS_ENABLED =
  envFlag === 'true' ? true : envFlag === 'false' ? false : BRANCH_DEFAULT_BETA_PRODUCTS

export const SITE = {
  name: 'matriXO',
  url: 'https://matrixo.in',
  tagline: 'Workshops, hackathons and career programs for students.',
  description:
    'matriXO runs hands-on technical workshops, hackathons, bootcamps and career programs for students across India, and builds tools that help them prove their skills.',
  email: 'hello@matrixo.in',
  locale: 'en_IN',
  ogImage: '/brand/og-default.png',
  social: {
    instagram: 'https://www.instagram.com/matrixo_in',
    linkedin: 'https://www.linkedin.com/company/matrixo',
  },
} as const

/** Paths that exist on every deployment but are only promoted on beta. */
export const BETA_ONLY_PATHS = ['/growgrid', '/playcred', '/mentormatrix'] as const
