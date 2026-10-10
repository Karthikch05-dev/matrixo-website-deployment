import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminFirestore } from '@/lib/firebaseAdmin'
import { requireEmployee } from '@/lib/studentvault/auth'
import { GUIDES_COLLECTION, LINKS_COLLECTION, OFFERS_COLLECTION } from '@/lib/studentvault/data'
import { CATALOG_RESEARCHED_AT, CATALOG_VERSION, STARTER_CATALOG } from '@/lib/studentvault/catalog'
import { createPublicNotification } from '@/lib/publicNotifications'

export const dynamic = 'force-dynamic'

const FILLABLE = [
  'name',
  'category',
  'summary',
  'whatYouGet',
  'valueInr',
  'eligibility',
  'indiaNote',
  'status',
  'statusNote',
  'expiresOn',
  'requiresCard',
  'autoChargeNote',
  'dependsOn',
] as const

function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return true
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'number') return value === 0
  return false
}

/**
 * POST /api/studentvault/offers/import   body: { dryRun?: boolean }
 *
 * Imports the researched starter catalog. Idempotent:
 *  - new slugs are created and published straight away, marked "researched"
 *    (not verified) until staff check them;
 *  - existing offers only get empty fields filled — staff edits always win;
 *  - claim links move off the public offer docs into the private links
 *    collection (also migrating any link stored the old way).
 */
export async function POST(request: NextRequest) {
  const auth = await requireEmployee(request)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await request.json().catch(() => ({}))
  const dryRun = body?.dryRun === true

  try {
    const firestore = getAdminFirestore()
    const [offerSnap, linkSnap, guideSnap] = await Promise.all([
      firestore.collection(OFFERS_COLLECTION).get(),
      firestore.collection(LINKS_COLLECTION).get(),
      firestore.collection(GUIDES_COLLECTION).get(),
    ])

    const bySlug = new Map(offerSnap.docs.map((d) => [String(d.data().slug ?? d.id), d]))
    const linked = new Set(linkSnap.docs.filter((d) => d.data()?.officialUrl).map((d) => d.id))
    const guided = new Set(guideSnap.docs.map((d) => d.id))

    const now = new Date()
    const researchedAt = new Date(CATALOG_RESEARCHED_AT)
    const actor = auth.employee.employeeId || auth.employee.uid
    const batch = firestore.batch()
    const result = { created: [] as string[], filled: [] as string[], unchanged: [] as string[], linksMigrated: 0 }

    for (const item of STARTER_CATALOG) {
      const existing = bySlug.get(item.slug)
      const ref = existing ? existing.ref : firestore.collection(OFFERS_COLLECTION).doc()

      if (!existing) {
        batch.set(ref, {
          slug: item.slug,
          name: item.name,
          category: item.category,
          summary: item.summary,
          whatYouGet: item.whatYouGet,
          valueInr: item.valueInr,
          eligibility: item.eligibility,
          indiaNote: item.indiaNote,
          status: item.status,
          statusNote: item.statusNote,
          expiresOn: item.expiresOn ? new Date(item.expiresOn) : null,
          requiresCard: item.requiresCard,
          autoChargeNote: item.autoChargeNote,
          dependsOn: item.dependsOn,
          logoUrl: '',
          publishState: 'published',
          lastVerifiedAt: null,
          verifiedBy: '',
          researchedAt,
          catalogVersion: CATALOG_VERSION,
          createdAt: now,
          updatedAt: now,
          createdBy: actor,
        })
        result.created.push(item.slug)
      } else {
        const raw = existing.data()
        const patch: Record<string, unknown> = {}
        for (const key of FILLABLE) {
          const incoming = item[key]
          if (isEmpty(raw[key]) && !isEmpty(incoming)) {
            patch[key] = key === 'expiresOn' && typeof incoming === 'string' ? new Date(incoming) : incoming
          }
        }
        if (!raw.researchedAt) patch.researchedAt = researchedAt
        if (Object.keys(patch).length > 0) {
          batch.update(ref, { ...patch, catalogVersion: CATALOG_VERSION, updatedAt: now })
          result.filled.push(item.slug)
        } else {
          result.unchanged.push(item.slug)
        }
      }

      if (!linked.has(ref.id)) {
        const legacy = existing?.data()?.officialUrl
        batch.set(
          firestore.collection(LINKS_COLLECTION).doc(ref.id),
          { officialUrl: typeof legacy === 'string' && legacy ? legacy : item.officialUrl, updatedAt: now },
          { merge: true }
        )
        linked.add(ref.id)
      }

      if (item.guide && !guided.has(ref.id)) {
        batch.set(firestore.collection(GUIDES_COLLECTION).doc(ref.id), { ...item.guide, updatedAt: now })
        guided.add(ref.id)
      }
    }

    // Any offer (catalog or not) still carrying its link on the public doc.
    for (const doc of offerSnap.docs) {
      const legacy = doc.data().officialUrl
      if (typeof legacy !== 'string' || !legacy) continue
      if (!linked.has(doc.id)) {
        batch.set(firestore.collection(LINKS_COLLECTION).doc(doc.id), { officialUrl: legacy, updatedAt: now }, { merge: true })
        linked.add(doc.id)
      }
      batch.update(doc.ref, { officialUrl: FieldValue.delete() })
      result.linksMigrated += 1
    }

    if (dryRun) {
      return NextResponse.json({ dryRun: true, ...result })
    }

    await batch.commit()

    if (result.created.length > 0) {
      await createPublicNotification({
        type: 'STUDENTVAULT_OFFER',
        category: 'STUDENTVAULT',
        title: `${result.created.length} new student perks on StudentVault`,
        message: 'Free licences, cloud credits, internships and more — all in one place.',
        targetUrl: '/studentvault',
        source: 'STUDENTVAULT',
        sourceId: `catalog-${CATALOG_VERSION}`,
        version: '1',
      })
    }

    revalidateTag('studentvault-sales')
    revalidatePath('/studentvault', 'layout')

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('[StudentVault] catalog import failed:', error)
    return NextResponse.json({ error: 'Could not import the catalog.' }, { status: 500 })
  }
}
