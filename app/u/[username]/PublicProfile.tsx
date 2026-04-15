'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  FaUser, FaUniversity, FaGraduationCap, FaCodeBranch, FaEnvelope,
  FaPhone, FaIdCard, FaLinkedin, FaGithub, FaGlobe, FaLock, FaArrowLeft
} from 'react-icons/fa'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebaseConfig'
import { UserProfile, PrivacySettings, DEFAULT_PRIVACY } from '@/lib/ProfileContext'
import Link from 'next/link'
import Image from 'next/image'

export default function PublicProfile({ username }: { username: string }) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Look up username mapping
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
        
        // Check if profile is private
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

    fetchProfile()
  }, [username])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-gray-300 dark:border-gray-700 border-t-gray-900 dark:border-t-white rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 dark:bg-white/[0.04] rounded-2xl flex items-center justify-center">
            <FaLock className="text-gray-400 text-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Profile Not Found</h1>
          <p className="text-gray-500 mb-6">
            This profile doesn&apos;t exist or is set to private.
          </p>
          <Link href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all">
            <FaArrowLeft className="text-sm" /> Go Home
          </Link>
        </motion.div>
      </div>
    )
  }

  const privacy: PrivacySettings = profile?.privacy || DEFAULT_PRIVACY

  const InfoChip = ({ icon: Icon, value }: { icon: any; value: string }) => (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.06] rounded-lg text-sm text-gray-700 dark:text-gray-300">
      <Icon className="text-gray-400 text-xs" />
      {value}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-24">
      <div className="max-w-lg mx-auto">
        <Link href="/"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors mb-6">
          <FaArrowLeft className="text-sm" />
          <span>Home</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl border border-gray-200 dark:border-white/[0.08] rounded-3xl overflow-hidden shadow-xl"
        >
          {/* Profile Header */}
          <div className="p-6 sm:p-8 text-center">
            <div className="w-24 h-24 mx-auto rounded-xl overflow-hidden bg-gray-100 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.08] mb-4">
              {profile?.profilePhoto ? (
                <Image src={profile.profilePhoto} alt={profile.fullName} width={96} height={96} className="object-cover w-full h-full" unoptimized />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-400">
                  {profile?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
            </div>

            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {profile?.fullName}
            </h1>
            <p className="text-gray-500 text-sm mt-1">@{profile?.username}</p>

            {profile?.bio && (
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-3 max-w-sm mx-auto">
                {profile.bio}
              </p>
            )}

            {/* Social links */}
            {(profile?.linkedin || profile?.github || profile?.portfolio) && (
              <div className="flex items-center justify-center gap-3 mt-4">
                {profile?.linkedin && (
                  <a href={profile.linkedin} target="_blank" rel="noopener noreferrer"
                    className="p-2.5 bg-gray-100 dark:bg-white/[0.06] rounded-xl hover:bg-gray-200 dark:hover:bg-white/[0.1] transition-colors">
                    <FaLinkedin className="text-gray-500" />
                  </a>
                )}
                {profile?.github && (
                  <a href={profile.github} target="_blank" rel="noopener noreferrer"
                    className="p-2.5 bg-gray-100 dark:bg-white/[0.06] rounded-xl hover:bg-gray-200 dark:hover:bg-white/[0.1] transition-colors">
                    <FaGithub className="text-gray-500" />
                  </a>
                )}
                {profile?.portfolio && (
                  <a href={profile.portfolio} target="_blank" rel="noopener noreferrer"
                    className="p-2.5 bg-gray-100 dark:bg-white/[0.06] rounded-xl hover:bg-gray-200 dark:hover:bg-white/[0.1] transition-colors">
                    <FaGlobe className="text-gray-500" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Profile Details */}
          <div className="px-6 sm:px-8 pb-6 sm:pb-8">
            <div className="flex flex-wrap gap-2 justify-center">
              {privacy.showCollege && profile?.college && (
                <InfoChip icon={FaUniversity} value={profile.college} />
              )}
              {privacy.showBranch && profile?.branch && (
                <InfoChip icon={FaCodeBranch} value={profile.branch} />
              )}
              {privacy.showYear && profile?.year && (
                <InfoChip icon={FaGraduationCap} value={profile.year} />
              )}
              {privacy.showRollNumber && profile?.rollNumber && (
                <InfoChip icon={FaIdCard} value={profile.rollNumber} />
              )}
              {privacy.showEmail && profile?.email && (
                <InfoChip icon={FaEnvelope} value={profile.email} />
              )}
              {privacy.showPhone && profile?.phone && (
                <InfoChip icon={FaPhone} value={`+91 ${profile.phone}`} />
              )}
            </div>
          </div>

          {/* matriXO branding */}
          <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-2 border-t border-gray-100 dark:border-white/[0.04]">
            <div className="text-center">
              <p className="text-xs text-gray-400">
                Profile on <span className="font-semibold text-gray-600 dark:text-gray-300">matriXO</span>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
