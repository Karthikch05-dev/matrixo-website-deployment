'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Bell, Camera, Check, Copy, ExternalLink, Loader2, LogOut, Pencil, Trash2 } from 'lucide-react'
import { Container } from '@/components/ui/Section'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { Avatar, SegmentedControl } from '@/components/ui/Controls'
import { Notice, Skeleton } from '@/components/ui/Feedback'
import ThemeToggle from '@/components/site/ThemeToggle'
import { useAuth } from '@/lib/AuthContext'
import { useProfile } from '@/lib/ProfileContext'
import { compressImage, getValidImageUrl } from '@/lib/imageUtils'
import { EditableSection, PassCard, Panel, PrivacyPanel, PurchaseList, SECTIONS, completeness } from '@/components/profile/ProfileSections'

type Tab = 'profile' | 'purchases' | 'settings'

function ProfileSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading your profile">
      <div className="flex items-center gap-5">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="flex-1 space-y-2.5">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <Skeleton className="mt-8 h-10 w-72 rounded-full" />
      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <Skeleton className="h-44 rounded-card" />
          <Skeleton className="h-56 rounded-card" />
        </div>
        <Skeleton className="h-52 rounded-card" />
      </div>
    </div>
  )
}

function UsernameEditor({ current, onDone }: { current: string; onDone: () => void }) {
  const { setUsername, checkUsernameAvailable } = useProfile()
  const [value, setValue] = useState(current)
  const [state, setState] = useState<'idle' | 'checking' | 'ok' | 'taken' | 'invalid'>('idle')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (value === current) return setState('idle')
    if (!/^[a-z0-9_]{3,20}$/.test(value)) return setState('invalid')
    setState('checking')
    const t = window.setTimeout(async () => setState((await checkUsernameAvailable(value).catch(() => false)) ? 'ok' : 'taken'), 400)
    return () => window.clearTimeout(t)
  }, [value, current, checkUsernameAvailable])

  return (
    <form
      className="mt-2 flex items-start gap-2"
      onSubmit={async (e) => {
        e.preventDefault()
        if (state !== 'ok') return onDone()
        setSaving(true)
        try {
          await setUsername(value)
          toast.success('Username updated')
          onDone()
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Couldn’t change your username.')
        } finally {
          setSaving(false)
        }
      }}
    >
      <Input
        aria-label="Username"
        value={value}
        autoFocus
        onChange={(e) => setValue(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
        maxLength={20}
        leadingIcon={<span className="text-[15px]">@</span>}
        error={state === 'taken' ? 'Taken' : state === 'invalid' ? '3–20 letters, numbers or _' : undefined}
        trailing={state === 'checking' ? <Loader2 className="mr-2 h-4 w-4 animate-spin text-subtle" /> : state === 'ok' ? <Check className="mr-2 h-4 w-4 text-success" /> : undefined}
        containerClassName="w-56"
      />
      <Button type="submit" size="sm" className="mt-1" loading={saving} disabled={state !== 'ok' && state !== 'idle'}>
        {state === 'idle' ? 'Done' : 'Save'}
      </Button>
    </form>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading: authLoading, logout } = useAuth()
  const { profile, loading, fetchProfile, updateProfile } = useProfile()
  const [tab, setTab] = useState<Tab>('profile')
  const [editingUsername, setEditingUsername] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth?returnUrl=/profile')
  }, [authLoading, user, router])

  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get('tab')
    if (wanted === 'purchases' || wanted === 'settings') setTab(wanted)
  }, [])

  const changeTab = (next: Tab) => {
    setTab(next)
    const url = new URL(window.location.href)
    if (next === 'profile') url.searchParams.delete('tab')
    else url.searchParams.set('tab', next)
    window.history.replaceState(window.history.state, '', url.toString())
  }

  const uploadPhoto = async (file: File | undefined) => {
    if (!file || !user) return
    if (!file.type.startsWith('image/')) return toast.error('Choose an image file.')
    setUploading(true)
    try {
      const [{ storage }, { ref, uploadBytes, getDownloadURL }] = await Promise.all([
        import('@/lib/firebase/storage'),
        import('firebase/storage'),
      ])
      const blob = await compressImage(file, { maxWidth: 800, maxHeight: 800, quality: 0.85 })
      const photoRef = ref(storage, `profile-photos/${user.uid}`)
      await uploadBytes(photoRef, blob, { contentType: 'image/jpeg' })
      await updateProfile({ profilePhoto: await getDownloadURL(photoRef) })
      toast.success('Photo updated')
    } catch {
      toast.error('Couldn’t upload that photo. Try a smaller image.')
    } finally {
      setUploading(false)
    }
  }

  if (authLoading || !user || loading) {
    return (
      <Container className="pb-24 pt-10 sm:pt-14">
        <ProfileSkeleton />
      </Container>
    )
  }

  if (!profile) {
    return (
      <Container size="narrow" className="pb-24 pt-14">
        <Notice tone="danger" title="We couldn’t load your profile">
          <button type="button" className="font-medium text-accent hover:underline" onClick={fetchProfile}>
            Try again
          </button>
        </Notice>
      </Container>
    )
  }

  const { percent, next } = completeness(profile)
  const publicUrl = `https://matrixo.in/u/${profile.username}`
  const photo = profile.profilePhoto ? getValidImageUrl(profile.profilePhoto) : user.photoURL
  const deleteMail = `mailto:hello@matrixo.in?subject=${encodeURIComponent('Delete my matriXO account')}&body=${encodeURIComponent(
    `Please delete my matriXO account and personal data.\n\nAccount email: ${user.email ?? ''}\nUsername: @${profile.username}\n\n(Payment records we must keep for tax law are retained as required.)`
  )}`

  return (
    <Container className="pb-24 pt-10 sm:pt-14">
      {/* Identity */}
      <header className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="relative w-fit">
          <Avatar name={profile.fullName} src={photo} size={96} className="ring-4 ring-surface" />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            aria-label="Change photo"
            className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-ink shadow-card transition-colors hover:bg-canvas-subtle"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={(e) => uploadPhoto(e.target.files?.[0])} />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[30px] font-semibold leading-tight tracking-[-0.03em] text-ink sm:text-[36px]">{profile.fullName}</h1>
          {editingUsername ? (
            <UsernameEditor current={profile.username} onDone={() => setEditingUsername(false)} />
          ) : (
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[15px] text-muted">
              <span>@{profile.username}</span>
              <button type="button" onClick={() => setEditingUsername(true)} className="inline-flex items-center gap-1 text-[13px] text-accent hover:underline">
                <Pencil className="h-3 w-3" /> Change
              </button>
              {user.email && <span className="text-subtle">{user.email}</span>}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            leadingIcon={<Copy className="h-4 w-4" />}
            onClick={() => {
              navigator.clipboard?.writeText(publicUrl)
              toast.success('Profile link copied')
            }}
          >
            Copy link
          </Button>
          <ButtonLink href={`/u/${profile.username}`} variant="ghost" size="sm" leadingIcon={<ExternalLink className="h-4 w-4" />}>
            View
          </ButtonLink>
        </div>
      </header>

      {/* Completeness nudge */}
      {percent < 100 && (
        <div className="mt-7 flex flex-col gap-3 rounded-card border border-line bg-surface p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
          <div className="flex-1">
            <div className="flex items-baseline justify-between text-[14px]">
              <span className="font-medium text-ink">Profile {percent}% complete</span>
              {next && <span className="text-muted">Next: {next.toLowerCase()}</span>}
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-canvas-subtle" aria-hidden="true">
              <div className="h-full rounded-full bg-accent-solid transition-[width] duration-500" style={{ width: `${percent}%` }} />
            </div>
          </div>
          <p className="text-[13px] text-subtle sm:max-w-[220px]">A complete profile fills event forms and StudentVault for you.</p>
        </div>
      )}

      <div className="mt-8">
        <SegmentedControl<Tab>
          label="Profile sections"
          value={tab}
          onChange={changeTab}
          segments={[
            { value: 'profile', label: 'Profile' },
            { value: 'purchases', label: 'Purchases' },
            { value: 'settings', label: 'Settings' },
          ]}
        />
      </div>

      <div className="mt-6">
        {tab === 'profile' && (
          <div className="grid items-start gap-4 lg:grid-cols-[1fr_340px]">
            <div className="space-y-4">
              {SECTIONS.map((s) => (
                <EditableSection key={s.id} section={s} />
              ))}
            </div>
            <div className="space-y-4 lg:sticky lg:top-[calc(var(--nav-height)+16px)]">
              <PassCard />
              <Panel title="Your links">
                <ul className="space-y-2 text-[15px]">
                  <li>
                    <Link href="/events" className="text-accent hover:underline">
                      Events and your tickets
                    </Link>
                  </li>
                  <li>
                    <Link href="/notifications" className="text-accent hover:underline">
                      Notifications
                    </Link>
                  </li>
                  <li>
                    <Link href="/skilldna" className="text-accent hover:underline">
                      SkillDNA
                    </Link>
                  </li>
                </ul>
              </Panel>
            </div>
          </div>
        )}

        {tab === 'purchases' && (
          <div className="max-w-3xl">
            <PurchaseList />
          </div>
        )}

        {tab === 'settings' && (
          <div className="grid max-w-3xl gap-4">
            <PrivacyPanel />
            <Panel title="Preferences">
              <ul className="divide-y divide-line">
                <li className="flex items-center justify-between py-2.5 first:pt-0">
                  <span className="text-[15px] text-ink">Appearance</span>
                  <ThemeToggle withLabel />
                </li>
                <li className="flex items-center justify-between py-2.5 last:pb-0">
                  <span className="text-[15px] text-ink">Notifications</span>
                  <ButtonLink href="/notifications" variant="ghost" size="sm" leadingIcon={<Bell className="h-4 w-4" />}>
                    Open
                  </ButtonLink>
                </li>
              </ul>
            </Panel>
            <Panel title="Account">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  leadingIcon={<LogOut className="h-4 w-4" />}
                  onClick={async () => {
                    await logout()
                    router.push('/')
                  }}
                >
                  Sign out
                </Button>
                <ButtonLink href={deleteMail} variant="ghost" size="sm" leadingIcon={<Trash2 className="h-4 w-4" />} className="text-danger hover:bg-danger/10">
                  Request account deletion
                </ButtonLink>
              </div>
              <p className="mt-3 text-[13px] text-subtle">
                Deletion requests are handled by our team within 30 days. Payment records required by law are kept.
              </p>
            </Panel>
          </div>
        )}
      </div>
    </Container>
  )
}
