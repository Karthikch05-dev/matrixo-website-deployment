// Server-only: testimonials from verified StudentVault buyers. They publish
// automatically (no moderation queue) and staff can hide any of them.
import { unstable_cache, revalidateTag } from 'next/cache'
import { getAdminFirestore } from '@/lib/firebaseAdmin'

export const TESTIMONIALS_COLLECTION = 'studentvault_testimonials'
export const TESTIMONIALS_TAG = 'studentvault-testimonials'

export interface Testimonial {
  uid: string
  name: string
  college: string
  quote: string
  rating: number
  hidden: boolean
  createdAt: string | null
}

export const TESTIMONIAL_RULES = { minLength: 20, maxLength: 400 } as const

function toTestimonial(uid: string, raw: Record<string, any>): Testimonial {
  const created = raw.createdAt?.toDate?.() as Date | undefined
  return {
    uid,
    name: raw.name ?? '',
    college: raw.college ?? '',
    quote: raw.quote ?? '',
    rating: typeof raw.rating === 'number' ? raw.rating : 5,
    hidden: raw.hidden === true,
    createdAt: created ? created.toISOString() : null,
  }
}

/** Visible testimonials for the sales page; uid stripped. */
export const getPublicTestimonials = unstable_cache(
  async (): Promise<Omit<Testimonial, 'uid' | 'hidden'>[]> => {
    try {
      const snap = await getAdminFirestore()
        .collection(TESTIMONIALS_COLLECTION)
        .where('hidden', '==', false)
        .limit(24)
        .get()
      return snap.docs
        .map((d) => toTestimonial(d.id, d.data()))
        .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
        .map(({ uid: _uid, hidden: _hidden, ...rest }) => rest)
    } catch (error) {
      console.error('[StudentVault] could not load testimonials:', error)
      return []
    }
  },
  ['studentvault-testimonials'],
  { revalidate: 300, tags: [TESTIMONIALS_TAG] }
)

export async function getOwnTestimonial(uid: string): Promise<Testimonial | null> {
  const doc = await getAdminFirestore().collection(TESTIMONIALS_COLLECTION).doc(uid).get()
  return doc.exists ? toTestimonial(doc.id, doc.data() as Record<string, any>) : null
}

export async function saveTestimonial(
  uid: string,
  input: { name: string; college: string; quote: string; rating: number }
): Promise<void> {
  const ref = getAdminFirestore().collection(TESTIMONIALS_COLLECTION).doc(uid)
  const existing = await ref.get()
  const now = new Date()
  await ref.set(
    {
      name: input.name,
      college: input.college,
      quote: input.quote,
      rating: input.rating,
      // A student editing their own words never un-hides a hidden entry.
      hidden: existing.exists ? existing.data()?.hidden === true : false,
      updatedAt: now,
      ...(existing.exists ? {} : { createdAt: now }),
    },
    { merge: true }
  )
  revalidateTestimonials()
}

export async function listAllTestimonials(): Promise<Testimonial[]> {
  const snap = await getAdminFirestore().collection(TESTIMONIALS_COLLECTION).limit(200).get()
  return snap.docs
    .map((d) => toTestimonial(d.id, d.data()))
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
}

export async function setTestimonialHidden(uid: string, hidden: boolean, by: string): Promise<void> {
  await getAdminFirestore()
    .collection(TESTIMONIALS_COLLECTION)
    .doc(uid)
    .update({ hidden, moderatedBy: by, moderatedAt: new Date() })
  revalidateTestimonials()
}

function revalidateTestimonials() {
  try {
    revalidateTag(TESTIMONIALS_TAG)
  } catch {
    // Outside a request scope there is nothing to revalidate.
  }
}
