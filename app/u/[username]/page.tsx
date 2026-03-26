'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FaUniversity, FaGraduationCap, FaCodeBranch, FaEnvelope,
  FaPhone, FaIdCard, FaLinkedin, FaGithub, FaGlobe, FaLock, FaArrowLeft,
  FaDna, FaBrain, FaRocket, FaBullseye, FaFire, FaTrophy,
  FaStar, FaArrowUp, FaBriefcase, FaLightbulb, FaChartLine,
  FaCheckCircle, FaClock, FaSignal, FaBook, FaCode,
  FaHistory, FaMapSigns, FaUserGraduate, FaAward, FaLanguage,
  FaEyeSlash, FaShieldAlt, FaCamera, FaEdit, FaSave, FaTimes, FaSpinner
} from 'react-icons/fa'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db, storage } from '@/lib/firebaseConfig'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { useAuth } from '@/lib/AuthContext'
import { UserProfile, PrivacySettings, DEFAULT_PRIVACY } from '@/lib/ProfileContext'
import { SkillDNAProfile, SkillDNAUserDocument, OnboardingData, CareerGoal } from '@/lib/skilldna/types'
import { getScoreGrade, getScoreColor, getScoreGradient } from '@/lib/skilldna/scoring'
import ProfileDownload from '@/components/skilldna/ProfileDownload'
import Link from 'next/link'
import Image from 'next/image'

// ============================================================
// Full LinkedIn-Style Public Profile Page — Liquid Glass UI
// Owner sees everything, public view respects privacy
// ============================================================

interface FullProfileData {
  userProfile: UserProfile
  skillDNAProfile: SkillDNAProfile | null
  onboardingData: OnboardingData | null
  careerGoals: CareerGoal | null
  ownerUid: string
}

// Liquid glass card style — adaptive light/dark
const glassCard = (isDark: boolean): React.CSSProperties => ({
  background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.55)',
  backdropFilter: 'blur(40px) saturate(180%)',
  WebkitBackdropFilter: 'blur(40px) saturate(180%)',
  border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
  boxShadow: isDark
    ? '0 16px 48px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)'
    : '0 16px 48px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
})

const glassCardSubtle = (isDark: boolean): React.CSSProperties => ({
  background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.45)',
  backdropFilter: 'blur(24px) saturate(160%)',
  WebkitBackdropFilter: 'blur(24px) saturate(160%)',
  border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
  boxShadow: isDark
    ? '0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)'
    : '0 8px 32px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)',
})

// Animation presets
const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
}

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.08 } }
}

export default function PublicProfilePage() {
  const params = useParams()
  const username = params.username as string
  const profileRef = useRef<HTMLDivElement>(null)

  // Auth for owner detection
  let currentUser: any = null
  try {
    const authContext = useAuth()
    currentUser = authContext.user
  } catch {
    // Not inside AuthProvider — public visitor
  }

  const [data, setData] = useState<FullProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [isDark, setIsDark] = useState(true)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [editingBio, setEditingBio] = useState(false)
  const [bioText, setBioText] = useState('')
  const [savingBio, setSavingBio] = useState(false)

  // Detect light/dark mode
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'))
    check()
    const obs = new MutationObserver(check)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const usernameRef = doc(db, 'Usernames', username.toLowerCase())
        const usernameSnap = await getDoc(usernameRef)

        if (!usernameSnap.exists()) {
          setNotFound(true); setLoading(false); return
        }

        const uid = usernameSnap.data().uid
        const profileDocRef = doc(db, 'UserProfiles', uid)
        const profileSnap = await getDoc(profileDocRef)

        if (!profileSnap.exists()) {
          setNotFound(true); setLoading(false); return
        }

        const userProfile = profileSnap.data() as UserProfile

        // Only block if private AND not the owner
        const isOwner = currentUser?.uid === uid
        if (userProfile.privacy?.profileVisibility === 'private' && !isOwner) {
          setNotFound(true); setLoading(false); return
        }

        // Fetch SkillDNA data
        let skillDNAProfile: SkillDNAProfile | null = null
        let onboardingData: OnboardingData | null = null
        let careerGoals: CareerGoal | null = null
        const showSkillDNA = isOwner || userProfile.privacy?.showSkillDNA !== false

        if (showSkillDNA) {
          try {
            const skillDNARef = doc(db, 'skillDNA_users', uid)
            const skillDNASnap = await getDoc(skillDNARef)
            if (skillDNASnap.exists()) {
              const skillDNAData = skillDNASnap.data() as SkillDNAUserDocument
              skillDNAProfile = skillDNAData.skillDNA || null
              onboardingData = skillDNAData.onboardingData || null
              careerGoals = skillDNAData.profile?.goals || null
            }
          } catch { /* SkillDNA not available */ }
        }

        setData({ userProfile, skillDNAProfile, onboardingData, careerGoals, ownerUid: uid })
      } catch (error) {
        console.error('Error fetching profile:', error)
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    if (username) fetchProfile()
  }, [username, currentUser?.uid])

  // --- Cover photo upload handler ---
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !data || !currentUser) return
    if (file.size > 5 * 1024 * 1024) { alert('Cover photo must be under 5MB'); return }
    if (!file.type.startsWith('image/')) { alert('Please select an image file'); return }
    setUploadingCover(true)
    try {
      const extension = file.name.split('.').pop() || 'jpg'
      const coverRef = ref(storage, `cover-photos/${data.ownerUid}.${extension}`)
      const metadata = { contentType: file.type }
      await uploadBytes(coverRef, file, metadata)
      const url = await getDownloadURL(coverRef)
      const profileDocRef = doc(db, 'UserProfiles', data.ownerUid)
      await updateDoc(profileDocRef, { coverPhoto: url, updatedAt: new Date() })
      setData(prev => prev ? { ...prev, userProfile: { ...prev.userProfile, coverPhoto: url } } : prev)
    } catch (err: any) {
      console.error('Failed to upload cover:', err)
      alert(err?.message || 'Failed to upload cover photo. Please try again.')
    } finally {
      setUploadingCover(false)
    }
  }

  // --- Bio save handler ---
  const handleSaveBio = async () => {
    if (!data || !currentUser) return
    setSavingBio(true)
    try {
      const profileDocRef = doc(db, 'UserProfiles', data.ownerUid)
      await updateDoc(profileDocRef, { bio: bioText.trim(), updatedAt: new Date() })
      setData(prev => prev ? { ...prev, userProfile: { ...prev.userProfile, bio: bioText.trim() } } : prev)
      setEditingBio(false)
    } catch (err) {
      console.error('Failed to save bio:', err)
    } finally {
      setSavingBio(false)
    }
  }

  // --- Loading ---
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a12] flex items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={glassCard(isDark)}>
            <FaDna className="text-purple-500 text-xl animate-pulse" />
          </div>
          <p className="text-gray-500 text-sm">Loading profile...</p>
        </motion.div>
      </div>
    )
  }

  // --- Not Found ---
  if (notFound || !data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a12] flex items-center justify-center px-4">
        <motion.div {...fadeUp} className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center" style={glassCard(isDark)}>
            <FaLock className="text-gray-400 text-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Profile Not Found</h1>
          <p className="text-gray-500 mb-6">This profile doesn&apos;t exist or is set to private.</p>
          <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 btn-primary rounded-full font-semibold">
            <FaArrowLeft className="text-sm" /> Go Home
          </Link>
        </motion.div>
      </div>
    )
  }

  const { userProfile, skillDNAProfile, onboardingData, careerGoals, ownerUid } = data
  const isOwner = currentUser?.uid === ownerUid
  const privacy: PrivacySettings = userProfile.privacy || DEFAULT_PRIVACY
  const hasSkillDNA = skillDNAProfile !== null

  // Owner sees everything, public respects privacy
  const show = (field: keyof PrivacySettings) => isOwner || (privacy[field] as boolean)

  const skillCount = skillDNAProfile?.technicalSkills?.length || 0
  const clusterCount = skillDNAProfile?.skillClusters?.length || 0
  const achievements = onboardingData?.academic?.achievements || []
  const languagesKnown = skillDNAProfile?.technicalSkills
    ?.filter(s => s.category?.toLowerCase().includes('language') || s.category?.toLowerCase().includes('programming'))
    ?.map(s => s.name) || []

  // Private field indicator for owner
  const PrivateBadge = () => (
    <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20 ml-1.5">
      <FaEyeSlash className="text-[7px]" /> Private
    </span>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a12] transition-colors duration-300">
      {/* ── Background orbs ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden print:hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-500/[0.03] dark:bg-purple-500/[0.06] rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/[0.03] dark:bg-blue-500/[0.06] rounded-full blur-3xl animate-float" style={{ animationDelay: '5s' }} />
        <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-indigo-500/[0.02] dark:bg-indigo-500/[0.04] rounded-full blur-3xl animate-float" style={{ animationDelay: '10s' }} />
      </div>

      {/* ── Top nav ── */}
      <div className="relative z-20 px-4 sm:px-6 lg:px-10 pt-24 max-w-full mx-auto print:hidden">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
            <FaArrowLeft className="text-sm" /> <span className="text-sm">Home</span>
          </Link>
          <div className="flex items-center gap-3">
            {isOwner && (
              <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full text-emerald-600 dark:text-emerald-400" style={glassCardSubtle(isDark)}>
                <FaShieldAlt className="text-[10px]" /> Your Profile
              </span>
            )}
            <ProfileDownload targetRef={profileRef} userName={userProfile.username} />
          </div>
        </div>
      </div>

      {/* ═══════ MAIN CONTENT ═══════ */}
      <motion.div
        ref={profileRef}
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="relative z-10 max-w-full mx-auto px-4 sm:px-6 lg:px-10 py-6 space-y-5"
      >

        {/* ═══════════════════════════════════════════════ */}
        {/* HERO CARD                                       */}
        {/* ═══════════════════════════════════════════════ */}
        <motion.div
          variants={fadeUp}
          className="rounded-[28px] relative"
          style={glassCard(isDark)}
        >
          {/* Cover */}
          <div className="relative h-36 sm:h-44 overflow-hidden rounded-t-[28px] group/cover">
            {/* Cover photo or gradient fallback */}
            {userProfile.coverPhoto ? (
              <Image src={userProfile.coverPhoto} alt="Cover" fill className="object-cover" unoptimized />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-500 to-indigo-600" />
            )}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMS41IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDgpIi8+PC9zdmc+')] opacity-50" />
            {/* Floating shimmer */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{ duration: 4, repeat: Infinity, repeatDelay: 6, ease: 'linear' }}
            />
            {/* Owner cover photo upload button */}
            {isOwner && (
              <label htmlFor="cover-upload" className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/cover:opacity-100 transition-opacity cursor-pointer print:hidden">
                {uploadingCover ? (
                  <FaSpinner className="animate-spin text-white text-xl" />
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white text-sm font-medium">
                    <FaCamera /> {userProfile.coverPhoto ? 'Change Cover' : 'Add Cover Photo'}
                  </div>
                )}
                <input id="cover-upload" type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
              </label>
            )}
            {hasSkillDNA && (
              <div className="absolute bottom-3 right-4 flex items-center gap-1.5 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 bg-white/10">
                <FaDna className="text-white/90 text-xs animate-pulse" />
                <span className="text-white/90 text-[11px] font-medium">SkillDNA™ Verified</span>
              </div>
            )}
          </div>

          {/* Profile info — avatar uses relative positioning + negative margin */}
          <div className="relative z-10 px-6 sm:px-8 pb-6 sm:pb-8">
            {/* Avatar row */}
            <div className="-mt-14 sm:-mt-16 mb-3 flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-5">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden flex-shrink-0 ring-4 ring-gray-50 dark:ring-[#0a0a12] relative z-20"
                style={{
                  background: isDark ? 'rgba(30,30,50,0.9)' : 'rgba(255,255,255,0.9)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                }}
              >
                {userProfile.profilePhoto ? (
                  <Image src={userProfile.profilePhoto} alt={userProfile.fullName} width={112} height={112} className="object-cover w-full h-full" unoptimized />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl sm:text-4xl font-bold bg-gradient-to-br from-purple-500/20 to-blue-500/20 text-gray-400">
                    {userProfile.fullName?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
              </motion.div>

              {/* Social links — right-aligned on desktop */}
              {(userProfile.linkedin || userProfile.github || userProfile.portfolio) && (
                <div className="flex items-center gap-2 sm:ml-auto sm:pb-1">
                  {userProfile.linkedin && (
                    <a href={userProfile.linkedin} target="_blank" rel="noopener noreferrer"
                      className="p-2.5 rounded-xl transition-all hover:scale-110" style={glassCardSubtle(isDark)}>
                      <FaLinkedin className="text-blue-500" />
                    </a>
                  )}
                  {userProfile.github && (
                    <a href={userProfile.github} target="_blank" rel="noopener noreferrer"
                      className="p-2.5 rounded-xl transition-all hover:scale-110" style={glassCardSubtle(isDark)}>
                      <FaGithub className="text-gray-600 dark:text-gray-400" />
                    </a>
                  )}
                  {userProfile.portfolio && (
                    <a href={userProfile.portfolio} target="_blank" rel="noopener noreferrer"
                      className="p-2.5 rounded-xl transition-all hover:scale-110" style={glassCardSubtle(isDark)}>
                      <FaGlobe className="text-green-500" />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Name + username + bio — below avatar */}
            <div className="mb-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white break-words">{userProfile.fullName}</h1>
              <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">@{userProfile.username}</p>

              {/* Bio section — editable for owner */}
              {editingBio && isOwner ? (
                <div className="mt-3 max-w-xl print:hidden">
                  <textarea
                    value={bioText}
                    onChange={e => setBioText(e.target.value)}
                    maxLength={300}
                    rows={3}
                    placeholder="Write a short description about yourself..."
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-white/10 dark:bg-white/[0.06] border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
                    autoFocus
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <button onClick={handleSaveBio} disabled={savingBio}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50">
                      {savingBio ? <FaSpinner className="animate-spin text-xs" /> : <FaSave className="text-xs" />} Save
                    </button>
                    <button onClick={() => setEditingBio(false)}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium transition-colors">
                      <FaTimes className="text-xs" /> Cancel
                    </button>
                    <span className="text-[10px] text-gray-400 ml-auto">{bioText.length}/300</span>
                  </div>
                </div>
              ) : (
                <div className="mt-2 max-w-xl group/bio">
                  {userProfile.bio ? (
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                      {userProfile.bio}
                      {isOwner && (
                        <button onClick={() => { setBioText(userProfile.bio || ''); setEditingBio(true) }}
                          className="inline-flex items-center gap-1 ml-2 text-blue-500 hover:text-blue-400 text-xs opacity-0 group-hover/bio:opacity-100 transition-opacity print:hidden">
                          <FaEdit className="text-[10px]" /> Edit
                        </button>
                      )}
                    </p>
                  ) : isOwner ? (
                    <button onClick={() => { setBioText(''); setEditingBio(true) }}
                      className="text-gray-400 hover:text-blue-500 text-sm transition-colors flex items-center gap-1.5 print:hidden">
                      <FaEdit className="text-xs" /> Add a description
                    </button>
                  ) : null}
                </div>
              )}
            </div>

            {/* Info chips */}
            <div className="flex flex-wrap gap-2">
              {show('showCollege') && userProfile.college && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-gray-700 dark:text-gray-300 transition-all hover:scale-[1.03]" style={glassCardSubtle(isDark)}>
                  <FaUniversity className="text-blue-500 text-[10px]" /> {userProfile.college}
                  {isOwner && !privacy.showCollege && <PrivateBadge />}
                </span>
              )}
              {show('showBranch') && userProfile.branch && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-gray-700 dark:text-gray-300 transition-all hover:scale-[1.03]" style={glassCardSubtle(isDark)}>
                  <FaCodeBranch className="text-purple-500 text-[10px]" /> {userProfile.branch}
                  {isOwner && !privacy.showBranch && <PrivateBadge />}
                </span>
              )}
              {show('showYear') && userProfile.year && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-gray-700 dark:text-gray-300 transition-all hover:scale-[1.03]" style={glassCardSubtle(isDark)}>
                  <FaGraduationCap className="text-green-500 text-[10px]" /> {userProfile.year}
                  {isOwner && !privacy.showYear && <PrivateBadge />}
                </span>
              )}
              {show('showRollNumber') && userProfile.rollNumber && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-gray-700 dark:text-gray-300 transition-all hover:scale-[1.03]" style={glassCardSubtle(isDark)}>
                  <FaIdCard className="text-amber-500 text-[10px]" /> {userProfile.rollNumber}
                  {isOwner && !privacy.showRollNumber && <PrivateBadge />}
                </span>
              )}
            </div>

            {/* Contact row */}
            {(show('showEmail') || show('showPhone')) && (
              <div className="flex flex-wrap items-center gap-4 mt-4 pt-4" style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                {show('showEmail') && userProfile.email && (
                  <span className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                    <FaEnvelope className="text-gray-400 dark:text-gray-600 text-xs" /> {userProfile.email}
                    {isOwner && !privacy.showEmail && <PrivateBadge />}
                  </span>
                )}
                {show('showPhone') && userProfile.phone && (
                  <span className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                    <FaPhone className="text-gray-400 dark:text-gray-600 text-xs" /> +91 {userProfile.phone}
                    {isOwner && !privacy.showPhone && <PrivateBadge />}
                  </span>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════ */}
        {/* STAT CARDS                                      */}
        {/* ═══════════════════════════════════════════════ */}
        {hasSkillDNA && (
          <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Dynamic Score', value: skillDNAProfile!.dynamicSkillScore, suffix: '/1000', icon: FaTrophy, gradient: 'from-yellow-500 to-amber-500' },
              { label: 'Skills Tracked', value: skillCount, suffix: '', icon: FaCode, gradient: 'from-purple-500 to-fuchsia-500' },
              { label: 'Skill Clusters', value: clusterCount, suffix: '', icon: FaFire, gradient: 'from-orange-500 to-red-500' },
              { label: 'Career Alignment', value: `${skillDNAProfile!.careerAlignmentScore}%`, suffix: '', icon: FaBullseye, gradient: 'from-green-500 to-emerald-500' },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.08, duration: 0.5 }}
                className="rounded-2xl p-5 text-center hover-lift cursor-default"
                style={glassCard(isDark)}
              >
                <div className={`w-10 h-10 mx-auto rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center text-white mb-3 shadow-lg`}>
                  <s.icon className="text-sm" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {s.value}<span className="text-xs text-gray-400 font-normal">{s.suffix}</span>
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5 uppercase tracking-wider font-medium">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════ */}
        {/* TWO-COLUMN LAYOUT                               */}
        {/* ═══════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── LEFT COLUMN (2/3) ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* PAST EXPERIENCE */}
            {onboardingData?.pastExperience && (
              <motion.div variants={fadeUp} className="rounded-[24px] p-6" style={glassCard(isDark)}>
                <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <FaHistory className="text-blue-500" /> Past Experience
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed whitespace-pre-line">{onboardingData.pastExperience}</p>
              </motion.div>
            )}

            {/* CURRENTLY LEARNING */}
            {(onboardingData?.currentSituation || (skillDNAProfile?.technicalSkills?.filter(s => s.trend === 'rising').length ?? 0) > 0) && (
              <motion.div variants={fadeUp} className="rounded-[24px] p-6" style={glassCard(isDark)}>
                <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <FaRocket className="text-cyan-500" /> Currently Learning
                </h2>
                {onboardingData?.currentSituation && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">{onboardingData.currentSituation}</p>
                )}
                {skillDNAProfile?.technicalSkills?.filter(s => s.trend === 'rising').length! > 0 && (
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-2">Skills on the Rise</p>
                    <div className="flex flex-wrap gap-2">
                      {skillDNAProfile!.technicalSkills.filter(s => s.trend === 'rising').map(s => (
                        <motion.span
                          key={s.name}
                          whileHover={{ scale: 1.05 }}
                          className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-xl font-medium"
                          style={{
                            background: isDark ? 'rgba(34,197,94,0.1)' : 'rgba(34,197,94,0.08)',
                            border: `1px solid ${isDark ? 'rgba(34,197,94,0.2)' : 'rgba(34,197,94,0.15)'}`,
                            color: isDark ? '#4ade80' : '#16a34a'
                          }}
                        >
                          <FaArrowUp className="text-[9px]" /> {s.name} ({s.score}%)
                        </motion.span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* FUTURE GOALS */}
            {(careerGoals || onboardingData?.futureAspiration) && (
              <motion.div variants={fadeUp} className="rounded-[24px] p-6" style={glassCard(isDark)}>
                <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FaMapSigns className="text-indigo-500" /> Future Goals
                </h2>
                {onboardingData?.futureAspiration && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">{onboardingData.futureAspiration}</p>
                )}
                {careerGoals && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { label: 'Short-Term', value: careerGoals.shortTerm, color: 'blue' },
                      { label: 'Mid-Term', value: careerGoals.midTerm, color: 'purple' },
                      { label: 'Long-Term', value: careerGoals.longTerm, color: 'green' },
                    ].filter(g => g.value).map(g => (
                      <div key={g.label} className="p-4 rounded-2xl" style={glassCardSubtle(isDark)}>
                        <p className={`text-[10px] uppercase tracking-wider font-semibold mb-1.5 text-${g.color}-500`}>{g.label}</p>
                        <p className="text-gray-700 dark:text-gray-300 text-sm">{g.value}</p>
                      </div>
                    ))}
                  </div>
                )}
                {careerGoals?.dreamRole && (
                  <div className="mt-4 flex items-center gap-2">
                    <FaStar className="text-yellow-500 text-sm" />
                    <span className="text-sm text-gray-500 dark:text-gray-500">Dream Role:</span>
                    <span className="text-sm text-gray-900 dark:text-white font-semibold">{careerGoals.dreamRole}</span>
                  </div>
                )}
                {careerGoals?.targetIndustries && careerGoals.targetIndustries.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {careerGoals.targetIndustries.map(ind => (
                      <span key={ind} className="text-xs px-2.5 py-1 rounded-xl font-medium" style={{
                        background: isDark ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.08)',
                        border: `1px solid ${isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.12)'}`,
                        color: isDark ? '#a5b4fc' : '#4f46e5'
                      }}>
                        {ind}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* TECHNICAL SKILLS */}
            {hasSkillDNA && skillDNAProfile!.technicalSkills.length > 0 && (
              <motion.div variants={fadeUp} className="rounded-[24px] p-6" style={glassCard(isDark)}>
                <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FaCode className="text-purple-500" /> Technical Skills
                </h2>
                <div className="space-y-3">
                  {skillDNAProfile!.technicalSkills.map((skill, i) => (
                    <motion.div
                      key={skill.name}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.04 }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-800 dark:text-white">{skill.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-lg font-medium" style={glassCardSubtle(isDark)}>{skill.category}</span>
                          {skill.trend === 'rising' && <span className="text-green-500 text-xs">↑</span>}
                          {skill.trend === 'declining' && <span className="text-red-500 text-xs">↓</span>}
                        </div>
                        <span className={`text-sm font-bold ${getScoreColor(skill.score)}`}>{skill.score}%</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
                        <motion.div
                          className={`h-full bg-gradient-to-r ${getScoreGradient(skill.score)} rounded-full`}
                          initial={{ width: 0 }}
                          animate={{ width: `${skill.score}%` }}
                          transition={{ duration: 0.8, delay: 0.5 + i * 0.04, ease: [0.25, 0.46, 0.45, 0.94] }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* BEHAVIORAL TRAITS */}
            {hasSkillDNA && skillDNAProfile!.behavioralTraits.length > 0 && (
              <motion.div variants={fadeUp} className="rounded-[24px] p-6" style={glassCard(isDark)}>
                <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FaLightbulb className="text-amber-500" /> Behavioral Profile
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {skillDNAProfile!.behavioralTraits.map((trait, i) => (
                    <div key={trait.name}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{trait.name}</span>
                        <span className={`text-sm font-bold ${getScoreColor(trait.score)}`}>{trait.score}%</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
                        <motion.div
                          className={`h-full bg-gradient-to-r ${getScoreGradient(trait.score)} rounded-full`}
                          initial={{ width: 0 }}
                          animate={{ width: `${trait.score}%` }}
                          transition={{ duration: 0.8, delay: 0.5 + i * 0.05 }}
                        />
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5">{trait.description}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* AI RECOMMENDATIONS */}
            {hasSkillDNA && (skillDNAProfile!.skillGaps.length > 0 || skillDNAProfile!.learningPaths.length > 0) && (
              <motion.div
                variants={fadeUp}
                className="rounded-[24px] p-6"
                style={{
                  ...glassCard(isDark),
                  background: isDark
                    ? 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(59,130,246,0.06))'
                    : 'linear-gradient(135deg, rgba(139,92,246,0.06), rgba(59,130,246,0.04))',
                }}
              >
                <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FaBrain className="text-purple-500" /> AI Recommendations
                </h2>

                {skillDNAProfile!.skillGaps.length > 0 && (
                  <div className="mb-6">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-3">Priority Skill Gaps</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {skillDNAProfile!.skillGaps.slice(0, 4).map(gap => {
                        const pColors = gap.priority === 'high'
                          ? { bg: isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.06)', border: isDark ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.12)', text: isDark ? '#f87171' : '#dc2626' }
                          : gap.priority === 'medium'
                            ? { bg: isDark ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.06)', border: isDark ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.12)', text: isDark ? '#fbbf24' : '#d97706' }
                            : { bg: isDark ? 'rgba(59,130,246,0.08)' : 'rgba(59,130,246,0.06)', border: isDark ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.12)', text: isDark ? '#60a5fa' : '#2563eb' }
                        return (
                          <div key={gap.skill} className="p-3 rounded-2xl" style={{ background: pColors.bg, border: `1px solid ${pColors.border}` }}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-800 dark:text-white">{gap.skill}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ color: pColors.text, background: `${pColors.bg}` }}>
                                {gap.priority.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500">
                              {gap.currentLevel}% → {gap.requiredLevel}%
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {skillDNAProfile!.learningPaths.length > 0 && (
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-3">Recommended Paths</p>
                    <div className="space-y-3">
                      {skillDNAProfile!.learningPaths.slice(0, 3).map(path => (
                        <div key={path.title} className="p-4 rounded-2xl" style={glassCardSubtle(isDark)}>
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="text-sm font-bold text-gray-800 dark:text-white">{path.title}</h4>
                            <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={glassCardSubtle(isDark)}>
                                <FaClock className="inline mr-0.5 text-[8px]" /> {path.estimatedDuration}
                              </span>
                            </div>
                          </div>
                          <p className="text-[11px] text-gray-500 dark:text-gray-500 mb-2">{path.description}</p>
                          <div className="flex flex-wrap gap-1">
                            {path.relatedSkills.map(s => (
                              <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-lg font-medium" style={glassCardSubtle(isDark)}>{s}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* ── RIGHT COLUMN (1/3) ── */}
          <div className="space-y-5">

            {/* AI PERSONA */}
            {hasSkillDNA && skillDNAProfile!.persona && (
              <motion.div
                variants={fadeUp}
                className="rounded-[24px] p-6 relative overflow-hidden"
                style={{
                  ...glassCard(isDark),
                  background: isDark
                    ? 'linear-gradient(145deg, rgba(139,92,246,0.1), rgba(59,130,246,0.06), rgba(30,30,50,0.4))'
                    : 'linear-gradient(145deg, rgba(139,92,246,0.08), rgba(59,130,246,0.04), rgba(255,255,255,0.5))',
                }}
              >
                {/* Glass shimmer */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-2xl" />
                <div className="relative z-10">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <FaBrain className="text-purple-500" /> AI Persona
                  </h3>
                  <h4 className="text-lg font-bold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent mb-2">
                    {skillDNAProfile!.persona.headline}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-4">{skillDNAProfile!.persona.description}</p>

                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 font-semibold">Type</p>
                      <p className="text-sm text-gray-800 dark:text-white font-medium">{skillDNAProfile!.persona.personalityType}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 font-semibold">Strengths</p>
                      {skillDNAProfile!.persona.strengths.map(s => (
                        <p key={s} className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1.5 mb-0.5">
                          <span className="text-green-500 font-bold">+</span> {s}
                        </p>
                      ))}
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 font-semibold">Growth</p>
                      {skillDNAProfile!.persona.areasForGrowth.map(a => (
                        <p key={a} className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1.5 mb-0.5">
                          <span className="text-amber-500 font-bold">↗</span> {a}
                        </p>
                      ))}
                    </div>
                    {skillDNAProfile!.persona.careerFit.length > 0 && (
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 font-semibold">Career Fit</p>
                        <div className="flex flex-wrap gap-1">
                          {skillDNAProfile!.persona.careerFit.map(fit => (
                            <span key={fit} className="text-[10px] px-2 py-0.5 rounded-xl font-medium" style={{
                              background: isDark ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.08)',
                              border: `1px solid ${isDark ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.12)'}`,
                              color: isDark ? '#93c5fd' : '#2563eb'
                            }}>
                              {fit}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ACHIEVEMENTS */}
            {achievements.length > 0 && (
              <motion.div variants={fadeUp} className="rounded-[24px] p-6" style={glassCard(isDark)}>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <FaAward className="text-yellow-500" /> Achievements
                </h3>
                <div className="space-y-2">
                  {achievements.map((ach, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300">
                      <FaCheckCircle className="text-yellow-500 text-[10px] mt-0.5 flex-shrink-0" />
                      <span>{ach}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* EDUCATION */}
            {onboardingData?.academic && (
              <motion.div variants={fadeUp} className="rounded-[24px] p-6" style={glassCard(isDark)}>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <FaUserGraduate className="text-blue-500" /> Education
                </h3>
                <div className="space-y-1">
                  {onboardingData.academic.degree && <p className="text-sm text-gray-800 dark:text-white font-medium">{onboardingData.academic.degree}</p>}
                  {onboardingData.academic.field && <p className="text-xs text-gray-600 dark:text-gray-400">{onboardingData.academic.field}</p>}
                  {onboardingData.academic.institution && <p className="text-xs text-gray-500">{onboardingData.academic.institution}</p>}
                  {onboardingData.academic.year && <p className="text-xs text-gray-500">Class of {onboardingData.academic.year}</p>}
                  {onboardingData.academic.gpa && <p className="text-xs text-gray-500">GPA: {onboardingData.academic.gpa}</p>}
                </div>
              </motion.div>
            )}

            {/* LANGUAGES & INTERESTS */}
            {(languagesKnown.length > 0 || (onboardingData?.interests && onboardingData.interests.length > 0)) && (
              <motion.div variants={fadeUp} className="rounded-[24px] p-6" style={glassCard(isDark)}>
                {languagesKnown.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <FaLanguage className="text-cyan-500" /> Languages
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {languagesKnown.map(l => (
                        <span key={l} className="text-[10px] px-2 py-0.5 rounded-xl font-medium" style={{
                          background: isDark ? 'rgba(6,182,212,0.1)' : 'rgba(6,182,212,0.08)',
                          border: `1px solid ${isDark ? 'rgba(6,182,212,0.2)' : 'rgba(6,182,212,0.12)'}`,
                          color: isDark ? '#67e8f9' : '#0891b2'
                        }}>{l}</span>
                      ))}
                    </div>
                  </div>
                )}
                {onboardingData?.interests && onboardingData.interests.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <FaStar className="text-pink-500" /> Interests
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {onboardingData.interests.map(int => (
                        <span key={int} className="text-[10px] px-2 py-0.5 rounded-xl font-medium" style={{
                          background: isDark ? 'rgba(236,72,153,0.1)' : 'rgba(236,72,153,0.08)',
                          border: `1px solid ${isDark ? 'rgba(236,72,153,0.2)' : 'rgba(236,72,153,0.12)'}`,
                          color: isDark ? '#f9a8d4' : '#db2777'
                        }}>{int}</span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* SKILL CLUSTERS */}
            {hasSkillDNA && skillDNAProfile!.skillClusters.length > 0 && (
              <motion.div variants={fadeUp} className="rounded-[24px] p-6" style={glassCard(isDark)}>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <FaChartLine className="text-green-500" /> Skill Clusters
                </h3>
                <div className="space-y-3">
                  {skillDNAProfile!.skillClusters.map(cluster => (
                    <div key={cluster.name} className="p-3 rounded-2xl" style={glassCardSubtle(isDark)}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-gray-800 dark:text-white">{cluster.name}</span>
                        <span className={`text-xs font-bold ${getScoreColor(cluster.strength)}`}>{cluster.strength}%</span>
                      </div>
                      <p className="text-[10px] text-gray-500 mb-2">{cluster.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {cluster.skills.map(s => (
                          <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-lg font-medium" style={{
                            background: isDark ? 'rgba(139,92,246,0.1)' : 'rgba(139,92,246,0.08)',
                            color: isDark ? '#c4b5fd' : '#7c3aed'
                          }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* SCORE SUMMARY */}
            {hasSkillDNA && (
              <motion.div variants={fadeUp} className="rounded-[24px] p-6" style={glassCard(isDark)}>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <FaTrophy className="text-yellow-500" /> Scores
                </h3>
                <div className="space-y-3">
                  {[
                    { label: 'Cognitive', value: skillDNAProfile!.cognitiveScore, icon: FaBrain, gradient: 'from-purple-500 to-fuchsia-500' },
                    { label: 'Learning Speed', value: skillDNAProfile!.learningVelocity, icon: FaRocket, gradient: 'from-blue-500 to-cyan-500' },
                    { label: 'Career Match', value: skillDNAProfile!.careerAlignmentScore, icon: FaBullseye, gradient: 'from-green-500 to-emerald-500' },
                  ].map(s => (
                    <div key={s.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                          <s.icon className="text-[10px]" /> {s.label}
                        </span>
                        <span className="text-xs font-bold text-gray-800 dark:text-white">{s.value}/100</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
                        <motion.div
                          className={`h-full bg-gradient-to-r ${s.gradient} rounded-full`}
                          initial={{ width: 0 }}
                          animate={{ width: `${s.value}%` }}
                          transition={{ duration: 1, delay: 0.6 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════ */}
        {/* FOOTER                                          */}
        {/* ═══════════════════════════════════════════════ */}
        <motion.div variants={fadeUp} className="text-center py-6" style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
          <p className="text-xs text-gray-500">
            Profile on <span className="font-semibold text-gray-700 dark:text-gray-300">matriXO</span> · <span className="font-semibold text-purple-500">SkillDNA™</span>
          </p>
          {hasSkillDNA && (
            <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-1">
              v{skillDNAProfile!.version} · {getScoreGrade(skillDNAProfile!.dynamicSkillScore, 1000)} · {new Date(skillDNAProfile!.lastUpdated).toLocaleDateString()}
            </p>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}
