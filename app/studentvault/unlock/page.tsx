import { redirect } from 'next/navigation'

// Buying now happens in place on the StudentVault page.
export default function UnlockPage() {
  redirect('/studentvault#pass')
}
