import XOLoader from '@/components/XOLoader'

/** Shown while a server-rendered route streams in. */
export default function Loading() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <XOLoader size={22} />
    </div>
  )
}
