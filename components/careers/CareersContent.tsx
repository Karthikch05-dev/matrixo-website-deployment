'use client'

import { useState, useEffect } from 'react'
import { ArrowRight, Briefcase, CheckCircle2, Clock, MapPin } from 'lucide-react'
import { collection, query, where, getDocs, addDoc, Timestamp, updateDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebaseConfig'
import { notifyAdminsOfNewApplication } from '@/lib/notificationUtils'
import { toast } from 'sonner'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { Skeleton } from '@/components/ui/Feedback'
import { Badge } from '@/components/ui/Badge'

interface Role {
  id: string
  title: string
  description: string
  team: string
  location: string
  type: string
  status: 'open' | 'closed' | 'draft' | 'archived'
  expiryDate?: string | null
  createdAt: any
}

export default function CareersContent() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    college: '',
    yearOrExperience: '',
    interestedRole: '',
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchOpenRoles = async () => {
      try {
        const rolesRef = collection(db, 'roles')
        const q = query(
          rolesRef,
          where('status', '==', 'open')
        )
        const querySnapshot = await getDocs(q)
        
        const fetchedRoles: Role[] = []
        querySnapshot.forEach((doc) => {
          fetchedRoles.push({ id: doc.id, ...doc.data() } as Role)
        })

        // Client-side expiry filter: auto-close any expired roles
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const openRoles = fetchedRoles.filter((r) => {
          if (r.expiryDate) {
            const expiry = new Date(r.expiryDate)
            if (expiry < today) {
              // Auto-close in Firestore (best-effort)
              updateDoc(doc(db, 'roles', r.id), { status: 'closed' }).catch(() => {})
              return false
            }
          }
          return true
        })
        
        // Sort client-side (newest first)
        openRoles.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
        
        setRoles(openRoles)
      } catch (error) {
        console.error('Error fetching roles:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOpenRoles()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }


  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format'
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required'
    else if (!/^\d{10}$/.test(formData.phone.replace(/\s/g, ''))) newErrors.phone = 'Invalid phone number'
    if (!formData.college.trim()) newErrors.college = 'College/Organization is required'
    if (!formData.yearOrExperience.trim()) newErrors.yearOrExperience = 'This field is required'
    if (!formData.interestedRole.trim()) newErrors.interestedRole = 'Interested role is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleGeneralSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) {
      toast.error('Please fill in all required fields')
      return
    }

    setSubmitting(true)

    try {
      const applicationsRef = collection(db, 'applications')
      const applicationRef = await addDoc(applicationsRef, {
        ...formData,
        roleId: null,
        roleTitle: formData.interestedRole,
        resumeURL: '',
        status: 'pending',
        submittedAt: Timestamp.now(),
        isGeneralApplication: true,
      })

      setSubmitted(true)
      toast.success('Application submitted successfully!')

      // Notify all admin team members about the new general application
      notifyAdminsOfNewApplication({
        applicationId: applicationRef.id,
        applicantName: formData.fullName,
        roleTitle: formData.interestedRole,
        roleId: null,
        isGeneralApplication: true,
      }).catch(err => console.error('Failed to send admin notifications:', err))

      setTimeout(() => {
        setSubmitted(false)
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          college: '',
          yearOrExperience: '',
          interestedRole: '',
        })
      }, 3000)

    } catch (error) {
      console.error('Error submitting application:', error)
      toast.error('Failed to submit application. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const interestForm = submitted ? (
    <div className="flex flex-col items-center rounded-[28px] border border-line bg-surface px-6 py-14 text-center shadow-card">
      <CheckCircle2 aria-hidden="true" className="h-12 w-12 text-success" strokeWidth={1.6} />
      <h3 className="mt-5 text-[22px] font-semibold tracking-[-0.02em] text-ink">Thanks, we’ve got your details</h3>
      <p className="mt-2 max-w-sm text-[15px] text-muted">We’ll reach out when a role that fits opens up.</p>
    </div>
  ) : (
    <form onSubmit={handleGeneralSubmit} noValidate className="rounded-[28px] border border-line bg-surface p-6 shadow-card sm:p-9">
      <h3 className="text-[21px] font-semibold tracking-[-0.02em] text-ink">Tell us about yourself</h3>
      <p className="mt-1 text-[15px] text-muted">We’ll keep your details on file and contact you when something fits.</p>
      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <Input label="Full name" name="fullName" autoComplete="name" value={formData.fullName} onChange={handleInputChange} error={errors.fullName} required />
        <Input label="Email" type="email" name="email" autoComplete="email" value={formData.email} onChange={handleInputChange} error={errors.email} required />
        <Input label="Phone" type="tel" name="phone" autoComplete="tel" inputMode="numeric" value={formData.phone} onChange={handleInputChange} error={errors.phone} hint="10-digit mobile number" required />
        <Input label="College or organisation" name="college" value={formData.college} onChange={handleInputChange} error={errors.college} required />
        <Input label="Year of study or experience" name="yearOrExperience" value={formData.yearOrExperience} onChange={handleInputChange} error={errors.yearOrExperience} placeholder="e.g. 3rd year, or 2 years" required />
        <Input label="Role you’re interested in" name="interestedRole" value={formData.interestedRole} onChange={handleInputChange} error={errors.interestedRole} placeholder="e.g. Full-stack developer" required />
      </div>
      <Button type="submit" size="lg" className="mt-7 w-full sm:w-auto" loading={submitting}>
        Submit details
      </Button>
    </form>
  )

  return (
    <>
      <div className="mx-auto max-w-site px-4 pb-12 pt-16 sm:px-6 sm:pt-24 lg:px-8">
        <p className="eyebrow">Careers</p>
        <h1 className="mt-4 max-w-3xl text-[42px] font-semibold leading-[1.03] tracking-[-0.04em] text-ink sm:text-[64px]">
          Help students learn by building.
        </h1>
        <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-muted sm:text-[19px]">
          We’re a small team running workshops, hackathons and products for students across India. If that sounds like your
          kind of work, we’d like to hear from you.
        </p>
      </div>

      <section aria-labelledby="roles-heading" className="mx-auto max-w-site px-4 pb-20 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-t border-line pt-8">
          <h2 id="roles-heading" className="text-[28px] font-semibold tracking-[-0.03em] text-ink">
            Open roles
          </h2>
          {!loading && roles.length > 0 && (
            <span className="text-[14px] text-muted">
              {roles.length} {roles.length === 1 ? 'opening' : 'openings'}
            </span>
          )}
        </div>

        {loading ? (
          <ul className="mt-6 divide-y divide-line border-y border-line" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <li key={i} className="py-6">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="mt-3 h-4 w-2/3" />
              </li>
            ))}
          </ul>
        ) : roles.length === 0 ? (
          <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
            <div>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-canvas-subtle text-subtle">
                <Briefcase aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <h3 className="mt-5 text-[22px] font-semibold tracking-[-0.02em] text-ink">No open roles right now</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                We hire as we grow. Leave your details and we’ll contact you when a role that fits opens up.
              </p>
            </div>
            {interestForm}
          </div>
        ) : (
          <>
            <p className="mt-4 max-w-2xl text-[14px] text-subtle">
              We read every application. With the volume we receive, replies can take a little while. Thanks for your
              patience.
            </p>
            <ul className="mt-6 divide-y divide-line border-y border-line">
              {roles.map((role) => (
                <li key={role.id}>
                  <Link href={`/careers/apply/${role.id}`} className="group flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[19px] font-semibold tracking-[-0.02em] text-ink group-hover:text-accent">{role.title}</h3>
                        {role.team && <Badge>{role.team}</Badge>}
                      </div>
                      {role.description && <p className="mt-1.5 line-clamp-2 max-w-2xl text-[15px] text-muted">{role.description}</p>}
                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-subtle">
                        {role.location && (
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin aria-hidden="true" className="h-3.5 w-3.5" /> {role.location}
                          </span>
                        )}
                        {role.type && (
                          <span className="inline-flex items-center gap-1.5">
                            <Clock aria-hidden="true" className="h-3.5 w-3.5" /> {role.type}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 text-[15px] font-medium text-accent">
                      Apply <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-16 grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
              <div>
                <h3 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">Don’t see your role?</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">Send a general application and we’ll keep you in mind for what’s next.</p>
              </div>
              {interestForm}
            </div>
          </>
        )}
      </section>

      <section className="border-t border-line bg-canvas-subtle py-16 sm:py-24">
        <div className="mx-auto max-w-site px-4 sm:px-6 lg:px-8">
          <h2 className="text-[28px] font-semibold tracking-[-0.03em] text-ink sm:text-[36px]">Why people join</h2>
          <ul className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              { title: 'Real impact', body: 'What you ship reaches students and colleges quickly, and you see it used.' },
              { title: 'Room to grow', body: 'Own a problem end to end, with mentorship from people who’ve done it before.' },
              { title: 'Small team', body: 'Fast decisions, real responsibility and your name on the work.' },
            ].map((item) => (
              <li key={item.title} className="border-t border-line pt-6">
                <h3 className="text-[19px] font-semibold tracking-[-0.02em] text-ink">{item.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}
