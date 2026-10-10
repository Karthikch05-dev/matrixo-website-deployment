import { NextRequest, NextResponse } from 'next/server'
import { getRazorpayInstance } from '@/lib/razorpay'
import { getPaymentBreakdown } from '@/lib/payments'
import { getProduct } from '@/lib/products'
import { getAuthedUser } from '@/lib/studentvault/auth'
import { getLivePrice } from '@/lib/studentvault/pricing'
import { STUDENTVAULT_PRODUCT_ID } from '@/lib/studentvault/grant'
import eventsData from '@/data/events.json'

export const dynamic = 'force-dynamic'

const MIN_AMOUNT_PAISE = 100

// Prices always come from the server-side catalog so a tampered client
// cannot pick its own ticket price.
function resolveCatalogPrice(eventId?: string, ticketId?: string): number | null {
  if (!eventId) return null

  const event = (eventsData as any[]).find((e) => e.id === eventId)
  if (!event) return null

  const tickets = event.tickets || []
  const ticket = ticketId
    ? tickets.find((t: any) => t.id === ticketId)
    : tickets[0]

  if (!ticket || typeof ticket.price !== 'number') return null

  return ticket.price
}

/**
 * StudentVault orders: the buyer must be signed in, the price comes from the
 * live founding/regular tier, there is no platform fee, and the order carries
 * the buyer's uid so the webhook can grant access even if the tab is closed.
 */
async function createStudentVaultOrder(request: NextRequest) {
  const user = await getAuthedUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Sign in to buy the StudentVault pass.' }, { status: 401 })
  }

  const price = await getLivePrice()
  const order = await getRazorpayInstance().orders.create({
    amount: price.amount * 100,
    currency: 'INR',
    receipt: `sv_${user.uid.slice(0, 12)}_${Date.now()}`.slice(0, 40),
    notes: {
      productId: STUDENTVAULT_PRODUCT_ID,
      priceTier: price.tier,
      uid: user.uid,
      email: user.email ?? '',
    },
  })

  return NextResponse.json({
    order_id: order.id,
    amount: order.amount,
    currency: order.currency,
    basePrice: price.amount,
    platformFee: 0,
    total: price.amount,
    priceTier: price.tier,
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { eventId, ticketId, productId, currency, receipt, notes } = body

    if (productId === STUDENTVAULT_PRODUCT_ID) {
      try {
        return await createStudentVaultOrder(request)
      } catch (error) {
        console.error('Razorpay create-order (StudentVault) error:', error)
        return NextResponse.json({ error: 'Payment gateway is unavailable. Please try again.' }, { status: 503 })
      }
    }

    // Two catalogs, both server-side: events (data/events.json) and products
    // (lib/products.ts). The client never supplies a price.
    const product = productId ? getProduct(productId) : null

    if (productId && !product) {
      return NextResponse.json({ error: 'Unknown product.' }, { status: 400 })
    }

    const catalogPrice = product ? product.price : resolveCatalogPrice(eventId, ticketId)

    if (catalogPrice === null) {
      return NextResponse.json(
        { error: 'Unknown event or ticket. Cannot determine price.' },
        { status: 400 }
      )
    }

    const breakdown = getPaymentBreakdown(catalogPrice)

    if (breakdown.isFree) {
      return NextResponse.json(
        { error: 'This ticket is free and does not require payment.' },
        { status: 400 }
      )
    }

    const amountInPaise = breakdown.total * 100

    if (amountInPaise < MIN_AMOUNT_PAISE) {
      return NextResponse.json(
        { error: `Amount must be at least ${MIN_AMOUNT_PAISE} paise.` },
        { status: 400 }
      )
    }

    let razorpay
    try {
      razorpay = getRazorpayInstance()
    } catch (error) {
      console.error('Razorpay configuration error:', error)
      return NextResponse.json(
        { error: 'Payment gateway is not configured.' },
        { status: 401 }
      )
    }

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: currency || 'INR',
      receipt: (receipt || `rcpt_${Date.now()}`).toString().slice(0, 40),
      notes: {
        ...(notes || {}),
        eventId: eventId || '',
        ticketId: ticketId || '',
        // Read back during entitlement grant to confirm what was actually paid for.
        productId: product?.id || '',
        basePrice: String(breakdown.basePrice),
        platformFee: String(breakdown.platformFee),
      },
    })

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      basePrice: breakdown.basePrice,
      platformFee: breakdown.platformFee,
      total: breakdown.total,
    })
  } catch (error) {
    const err = error as { statusCode?: number; error?: { description?: string } }
    console.error('Razorpay create-order error:', error)

    if (err?.statusCode === 401) {
      return NextResponse.json(
        { error: 'Razorpay authentication failed.' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: err?.error?.description || 'Failed to create order.' },
      { status: 500 }
    )
  }
}
