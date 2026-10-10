import { redirect } from 'next/navigation'

// The tracker now lives inside the vault (claim status on every perk).
export default function TrackerPage() {
  redirect('/studentvault/vault')
}
