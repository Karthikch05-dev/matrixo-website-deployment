import { NextRequest, NextResponse } from 'next/server'
import { requireEmployee } from '@/lib/studentvault/auth'

export const dynamic = 'force-dynamic'

/**
 * Tells the UI whether the signed-in user may manage the catalog, so the
 * "Manage offers" entry point can be shown or hidden.
 *
 * This is a convenience signal only — every write is independently authorized
 * on the server, so faking this response grants nothing.
 */
export async function GET(request: NextRequest) {
  const auth = await requireEmployee(request)

  if (!auth.ok) {
    return NextResponse.json({ isEmployee: false })
  }

  return NextResponse.json({
    isEmployee: true,
    name: auth.employee.name,
    employeeId: auth.employee.employeeId,
  })
}
