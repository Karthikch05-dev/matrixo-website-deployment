'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  FaUniversity, FaGraduationCap, FaCodeBranch, FaEnvelope,
  FaPhone, FaIdCard, FaLinkedin, FaGithub, FaGlobe, FaLock, FaArrowLeft
} from 'react-icons/fa'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebaseConfig'
import { UserProfile, PrivacySettings, DEFAULT_PRIVACY } from '@/lib/ProfileContext'
import Link from 'next/link'
import Image from 'next/image'

export default function PublicProfilePage() {
  const params = useParams()
  const username = params.username as string

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const usernameRef = doc(db, 'Usernames', username.toLowerCase())
        const usernameSnap = await getDoc(usernameRef)

        if (!usernameSnap.exists()) {
          setNotFound(true)
          setLoading(false)
          return
        }

        const uid = usernameSnap.data().uid
        const profileRef = doc(db, 'UserProfiles', uid)
        const profileSnap = await getDoc(profileRef)

        if (!profileSnap.exists()) {
          setNotFound(true)
          setLoading(false)
          return
        }

        const data = profileSnap.data() as UserProfile

        if (data.privacy?.profileVisibility === 'private') {
          setNotFound(true)
          setLoading(false)
          return
        }

        setProfile(data)
      } catch (error) {
        console.error('Error fetching profile:', error)
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    if (username) fetchProfile()
  }, [username])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-gray-700 border-t-blue-400 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <FaLock className="text-gray-400 text-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Profile Not Found</h1>
          <p className="text-gray-500 mb-6">This profile doesn&apos;t exist or is set to private.</p>
          <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold hover:from-blue-500 hover:to-blue-400 transition-all shadow-lg shadow-blue-500/20">
            <FaArrowLeft className="text-sm" /> Go Home
          </Link>
        </motion.div>
      </div>
    )
  }

  const privacy: PrivacySettings = profile?.privacy || DEFAULT_PRIVACY

  const InfoChip = ({ icon: Icon, value }: { icon: any; value: string }) => (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-300" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <Icon className="text-blue-400 text-xs" />
      {value}
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black px-4 py-24">
      {/* BG decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 -left-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>
      <div className="relative z-10 max-w-lg mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-6">
          <FaArrowLeft className="text-sm" />
          <span>Home</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-3xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(40px) saturate(180%)', WebkitBackdropFilter: 'blur(40px) saturate(180%)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 16px 48px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)' }}
        >
          <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500" />
          {/* Profile Header */}
          <div className="p-6 sm:p-8 text-center">
            <div className="w-24 h-24 mx-auto rounded-2xl overflow-hidden border border-white/[0.08] mb-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20">
              {profile?.profilePhoto ? (
                <Image src={profile.profilePhoto} alt={profile.fullName} width={96} height={96} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-400">
                  {profile?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
            </div>

            <h1 className="text-2xl font-bold text-white">{profile?.fullName}</h1>
            <p className="text-gray-500 text-sm mt-1">@{profile?.username}</p>

            {profile?.bio && (
              <p className="text-gray-400 text-sm mt-3 max-w-sm mx-auto">{profile.bio}</p>
            )}

            {(profile?.linkedin || profile?.github || profile?.portfolio) && (
              <div className="flex items-center justify-center gap-3 mt-4">
                {profile?.linkedin && (
                  <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-white/[0.06] rounded-xl hover:bg-white/[0.1] transition-colors">
                    <FaLinkedin className="text-blue-400" />
                  </a>
                )}
                {profile?.github && (
                  <a href={profile.github} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-white/[0.06] rounded-xl hover:bg-white/[0.1] transition-colors">
                    <FaGithub className="text-gray-400" />
                  </a>
                )}
                {profile?.portfolio && (
                  <a href={profile.portfolio} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-white/[0.06] rounded-xl hover:bg-white/[0.1] transition-colors">
                    <FaGlobe className="text-green-400" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Profile Details */}
          <div className="px-6 sm:px-8 pb-6 sm:pb-8">
            <div className="flex flex-wrap gap-2 justify-center">
              {privacy.showCollege && profile?.college && <InfoChip icon={FaUniversity} value={profile.college} />}
              {privacy.showBranch && profile?.branch && <InfoChip icon={FaCodeBranch} value={profile.branch} />}
              {privacy.showYear && profile?.year && <InfoChip icon={FaGraduationCap} value={profile.year} />}
              {privacy.showRollNumber && profile?.rollNumber && <InfoChip icon={FaIdCard} value={profile.rollNumber} />}
              {privacy.showEmail && profile?.email && <InfoChip icon={FaEnvelope} value={profile.email} />}
              {privacy.showPhone && profile?.phone && <InfoChip icon={FaPhone} value={`+91 ${profile.phone}`} />}
            </div>
          </div>

          {/* matriXO branding */}
          <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-2 border-t border-white/[0.06] text-center">
            <p className="text-xs text-gray-500">
              Profile on <span className="font-semibold text-gray-300">matriXO</span>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
