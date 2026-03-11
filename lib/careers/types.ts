/**
 * Careers Module — Shared Types
 * Defines the canonical job/role schema used across server and client.
 */

export type JobStatus = 'open' | 'closed' | 'draft' | 'archived'

export interface JobRole {
  id: string
  title: string
  slug?: string
  description: string
  team: string
  location: string
  type: string
  status: JobStatus
  expiryDate?: string | null          // ISO-8601 date string (YYYY-MM-DD)
  createdAt: any                       // Firestore Timestamp
  createdBy?: string
  responsibilities?: string[]
  eligibility?: string[]
  customQuestions?: any[]
  requireResume?: boolean
}

/** Status values that allow public access to the apply page */
export const PUBLIC_OPEN_STATUSES: JobStatus[] = ['open']

/** Status values that are visible in admin role management */
export const ALL_STATUSES: JobStatus[] = ['open', 'closed', 'draft', 'archived']

/** Human-readable labels */
export const STATUS_LABELS: Record<JobStatus, string> = {
  open: 'Open',
  closed: 'Closed',
  draft: 'Draft',
  archived: 'Archived',
}

/** Badge colour classes per status */
export const STATUS_COLORS: Record<JobStatus, string> = {
  open: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  closed: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  draft: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  archived: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}
