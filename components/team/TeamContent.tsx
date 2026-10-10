'use client'

import { useState, useEffect } from 'react'
import { collection, getDocs, query } from 'firebase/firestore'
import { Linkedin, Mail } from 'lucide-react'
import { db } from '@/lib/firebaseConfig'
import { ButtonLink } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Feedback'

interface TeamMember {
  employeeId: string
  name: string
  email: string
  department: string
  designation: string
  joiningDate: string
  profileImage: string
  role: string
  linkedin?: string
}

// Define role priority for sorting (Founders & Co-Founders first, then HR & MD, then employees)
const rolePriority: Record<string, number> = {
  'Founder': 0,
  'Co-Founder': 1,
  'MD': 2,
  'Managing Director': 2,
  'HR': 3,
  'HR Executive': 3,
  'admin': 4,
  'employee': 5,
  'Intern': 6,
}

function getRolePriority(role: string): number {
  return rolePriority[role] ?? 5
}

// Display-friendly role label
function getDisplayRole(member: TeamMember): string {
  if (member.designation) return member.designation
  if (member.role === 'admin') return 'Admin'
  if (member.role === 'Intern') return 'Intern'
  if (member.role === 'employee') return 'Team Member'
  return member.role
}

// LinkedIn mapping by name keywords (fallback if not stored in Firestore)
const linkedinMap: Record<string, string> = {
  'lahari': 'https://www.linkedin.com/in/lahari-rami-reddy-950352262',
  'yasasvi': 'https://www.linkedin.com/in/yasasvi-mandapati',
  'shiva': 'https://www.linkedin.com/in/shivaganesht',
  'kishan': 'https://www.linkedin.com/in/kishan-sai-vutukuri',
  'vinod': 'https://www.linkedin.com/in/vinod-kethavath-2733a5317',
  'karthik': 'https://www.linkedin.com/in/karthik-chinthakindi-aa93a7287',
  'jahnavi': 'https://www.linkedin.com/in/jahnavi-mulukutla',
  'shravya': 'https://www.linkedin.com/in/shravya-datla-388447287',
}

function getLinkedin(name: string, firestoreLinkedin?: string): string {
  if (firestoreLinkedin) return firestoreLinkedin
  const nameLower = name.toLowerCase()
  for (const [key, url] of Object.entries(linkedinMap)) {
    if (nameLower.includes(key)) return url
  }
  return ''
}

// Public-page visibility controls, keyed by normalized name (lowercase letters only).
// These only change what the public /team page shows; Firestore records and the
// employee portal are untouched. Remove an entry to restore the default display.
const hiddenFromPublicTeam: string[] = ['shivaganesh']

const publicDesignationOverrides: Record<string, string> = {
  'kishan': 'Co-Founder',
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z]/g, '')
}

function isHiddenFromPublicTeam(name: string): boolean {
  const key = normalizeName(name)
  return hiddenFromPublicTeam.some((hidden) => key.includes(hidden))
}

function getPublicDesignation(name: string, designation: string): string {
  const key = normalizeName(name)
  for (const [match, override] of Object.entries(publicDesignationOverrides)) {
    if (key.includes(match)) return override
  }
  return designation
}

// Local profile image mapping (fallback when Firestore profileImage is empty)
const localProfileImages: Record<string, string> = {
  'M-A001': '/intern-images/M-A001.webp',
  'M-A005': '/intern-images/M-A005.webp',
  'M-A006': '/intern-images/M-A006.webp',
  'M-A008': '/intern-images/M-A008.webp',
  'M-A009': '/intern-images/M-A009.webp',
  'M-A010': '/intern-images/M-A010.webp',
  'M-A011': '/intern-images/M-A011.webp',
  'M-A012': '/intern-images/M-A012.webp',
  'M-A013': '/intern-images/M-A013.webp',
}

function getProfileImage(employeeId: string, firestoreImage: string): string {
  if (firestoreImage) return firestoreImage
  return localProfileImages[employeeId] || ''
}

export default function TeamContent() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const employeesRef = collection(db, 'Employees')
        const q = query(employeesRef)
        const querySnapshot = await getDocs(q)
        
        const members: TeamMember[] = []
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          // Skip the Admin account from the team page
          if (data.name === 'Admin' || data.employeeId === 'Admin' || data.role === 'admin' && !data.designation) return
          // Skip generic employees/interns without a specific designation (prevents "Team Member" cards on public page)
          if ((data.role === 'employee' || data.role === 'Intern') && !data.designation) return
          const name = data.name || ''
          if (isHiddenFromPublicTeam(name)) return
          members.push({
            employeeId: data.employeeId || doc.id,
            name: name,
            email: data.email || '',
            department: data.department || '',
            designation: getPublicDesignation(name, data.designation || ''),
            joiningDate: data.joiningDate || '',
            profileImage: getProfileImage(data.employeeId || doc.id, data.profileImage || ''),
            role: data.role || 'employee',
            linkedin: getLinkedin(name, data.linkedin),
          })
        })

        // Sort: Founders first, then Co-Founders, then admins, then employees, then interns
        members.sort((a, b) => {
          const priorityA = getRolePriority(a.designation || a.role)
          const priorityB = getRolePriority(b.designation || b.role)
          if (priorityA !== priorityB) return priorityA - priorityB
          return a.name.localeCompare(b.name)
        })

        setTeamMembers(members)
      } catch (error) {
        console.error('Error fetching team members:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEmployees()
  }, [])

  return (
    <>
      <div className="mx-auto max-w-site px-4 pb-12 pt-16 sm:px-6 sm:pb-16 sm:pt-24 lg:px-8">
        <p className="eyebrow">Team</p>
        <h1 className="mt-4 max-w-3xl text-[42px] font-semibold leading-[1.03] tracking-[-0.04em] text-ink sm:text-[64px]">
          The people behind matriXO.
        </h1>
        <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-muted sm:text-[19px]">
          Students, engineers and organisers who’d rather build things than talk about them.
        </p>
      </div>

      <section aria-label="Team members" className="mx-auto max-w-site px-4 pb-20 sm:px-6 lg:px-8">
        {loading ? (
          <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-busy="true">
            {Array.from({ length: 8 }).map((_, i) => (
              <li key={i}>
                <Skeleton className="aspect-[4/5] w-full rounded-card" />
                <Skeleton className="mt-4 h-5 w-2/3" />
                <Skeleton className="mt-2 h-4 w-1/2" />
              </li>
            ))}
          </ul>
        ) : teamMembers.length === 0 ? (
          <p className="rounded-card border border-dashed border-line-strong px-6 py-16 text-center text-[15px] text-muted">
            We couldn’t load the team right now. Please refresh in a moment.
          </p>
        ) : (
          <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {teamMembers.map((member) => {
              const initials = member.name
                .split(' ')
                .map((n) => n.charAt(0))
                .join('')
                .slice(0, 2)
                .toUpperCase()
              return (
                <li key={member.employeeId} className="group">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-card bg-canvas-subtle ring-1 ring-line">
                    <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center text-[44px] font-semibold tracking-[-0.03em] text-subtle">
                      {initials}
                    </span>
                    {member.profileImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={member.profileImage}
                        alt={member.name}
                        loading="lazy"
                        decoding="async"
                        className="relative h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    )}
                  </div>
                  <div className="mt-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-[17px] font-semibold tracking-[-0.01em] text-ink">{member.name}</h2>
                      <p className="mt-0.5 text-[14px] text-muted">{getDisplayRole(member)}</p>
                      {member.department && <p className="mt-0.5 text-[13px] text-subtle">{member.department}</p>}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      {member.linkedin && (
                        <a
                          href={member.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${member.name} on LinkedIn`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-subtle transition-colors hover:bg-ink/[0.06] hover:text-ink"
                        >
                          <Linkedin aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={1.8} />
                        </a>
                      )}
                      {member.email && (
                        <a
                          href={`mailto:${member.email}`}
                          aria-label={`Email ${member.name}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-subtle transition-colors hover:bg-ink/[0.06] hover:text-ink"
                        >
                          <Mail aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={1.8} />
                        </a>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="border-t border-line bg-canvas-subtle py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-[32px] font-semibold leading-[1.06] tracking-[-0.03em] text-ink sm:text-[44px]">Want to build with us?</h2>
          <p className="mx-auto mt-4 max-w-md text-[17px] text-muted">We hire interns and full-timers who care about students and like shipping.</p>
          <ButtonLink href="/careers" size="lg" className="mt-8">
            See open roles
          </ButtonLink>
        </div>
      </section>
    </>
  )
}
