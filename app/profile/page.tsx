'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FaUser, FaIdCard, FaPhone, FaEnvelope, FaUniversity,
  FaGraduationCap, FaCodeBranch, FaEdit, FaSave, FaTimes, FaSpinner,
  FaArrowLeft, FaShieldAlt, FaShareAlt, FaCamera, FaCopy, FaCheck,
  FaLinkedin, FaGithub, FaGlobe, FaLink, FaEye, FaEyeSlash
} from 'react-icons/fa'
import { useAuth } from '@/lib/AuthContext'
import { useProfile, DEFAULT_PRIVACY, PrivacySettings } from '@/lib/ProfileContext'
import { toast } from 'sonner'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '@/lib/firebaseConfig'
import Link from 'next/link'
import Image from 'next/image'

const YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate']
const BRANCH_OPTIONS = [
  'CSE', 'CSE (AIML)', 'CSE (DS)', 'CSE (CS)', 'CSE (IoT)',
  'AIML', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'Other'
]

type Tab = 'profile' | 'privacy' | 'share'

export default function ProfilePage() {
  const { user } = useAuth()
  const { profile, loading: profileLoading, profileExists, updateProfile, setUsername, checkUsernameAvailable } = useProfile()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [editData, setEditData] = useState({
    fullName: '',
    phone: '',
    college: '',
    year: '',
    branch: '',
    graduationYear: '',
    bio: '',
    linkedin: '',
    github: '',
    portfolio: '',
  })
  const [privacyData, setPrivacyData] = useState<PrivacySettings>(DEFAULT_PRIVACY)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Username setup state (for users without a username)
  const [showUsernameSetup, setShowUsernameSetup] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [savingUsername, setSavingUsername] = useState(false)

  useEffect(() => {
    if (profile) {
      setEditData({
        fullName: profile.fullName,
        phone: profile.phone,
        college: profile.college,
        year: profile.year,
        branch: profile.branch,
        graduationYear: profile.graduationYear || '',
        bio: profile.bio || '',
        linkedin: profile.linkedin || '',
        github: profile.github || '',
        portfolio: profile.portfolio || '',
      })
      setPrivacyData(profile.privacy || DEFAULT_PRIVACY)
      // Auto-show username setup if user doesn't have one
      if (!profile.username) {
        setShowUsernameSetup(true)
      }
    }
  }, [profile])

  // Username availability check with debounce
  useEffect(() => {
    const uname = newUsername.trim().toLowerCase()
    if (!uname || uname.length < 3) { setUsernameStatus('idle'); return }
    if (!/^[a-z0-9_]+$/.test(uname)) { setUsernameStatus('idle'); return }

    setUsernameStatus('checking')
    const timer = setTimeout(async () => {
      const available = await checkUsernameAvailable(uname)
      setUsernameStatus(available ? 'available' : 'taken')
    }, 500)
    return () => clearTimeout(timer)
  }, [newUsername, checkUsernameAvailable])

  const handleSaveUsername = async () => {
    const uname = newUsername.trim().toLowerCase()
    if (!uname || uname.length < 3) { toast.error('Username must be at least 3 characters'); return }
    if (!/^[a-z0-9_]+$/.test(uname)) { toast.error('Only lowercase letters, numbers, and underscores'); return }
    if (usernameStatus !== 'available') { toast.error('Please choose an available username'); return }

    setSavingUsername(true)
    try {
      await setUsername(uname)
      toast.success('Username set successfully!')
      setShowUsernameSetup(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to set username')
    } finally {
      setSavingUsername(false)
    }
  }

  if (!user) {
    router.replace('/auth')
    return null
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <FaSpinner className="animate-spin text-4xl text-gray-400" />
          <p className="text-gray-500 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profileExists) {
    router.replace('/profile/setup')
    return null
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!editData.fullName.trim()) newErrors.fullName = 'Full name is required'
    if (!editData.phone.trim()) newErrors.phone = 'Phone number is required'
    else if (!/^[6-9]\d{9}$/.test(editData.phone.trim())) newErrors.phone = 'Enter a valid 10-digit phone number'
    if (!editData.college.trim()) newErrors.college = 'College name is required'
    if (!editData.year) newErrors.year = 'Select your year'
    if (editData.year === 'Graduate' && !editData.graduationYear.trim()) {
      newErrors.graduationYear = 'Graduation year is required'
    }
    if (!editData.branch) newErrors.branch = 'Select your branch'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      await updateProfile({
        fullName: editData.fullName.trim(),
        phone: editData.phone.trim(),
        college: editData.college.trim(),
        year: editData.year,
        branch: editData.branch,
        graduationYear: editData.year === 'Graduate' ? editData.graduationYear.trim() : '',
        bio: editData.bio.trim(),
        linkedin: editData.linkedin.trim(),
        github: editData.github.trim(),
        portfolio: editData.portfolio.trim(),
      })
      toast.success('Profile updated!')
      setIsEditing(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleSavePrivacy = async () => {
    setSaving(true)
    try {
      await updateProfile({ privacy: privacyData })
      toast.success('Privacy settings updated!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update privacy')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (profile) {
      setEditData({
        fullName: profile.fullName,
        phone: profile.phone,
        college: profile.college,
        year: profile.year,
        branch: profile.branch,
        graduationYear: profile.graduationYear || '',
        bio: profile.bio || '',
        linkedin: profile.linkedin || '',
        github: profile.github || '',
        portfolio: profile.portfolio || '',
      })
    }
    setErrors({})
    setIsEditing(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setEditData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Photo must be less than 2MB')
      return
    }
    setUploadingPhoto(true)
    try {
      const photoRef = ref(storage, `profile-photos/${user.uid}`)
      await uploadBytes(photoRef, file)
      const url = await getDownloadURL(photoRef)
      await updateProfile({ profilePhoto: url })
      toast.success('Profile photo updated!')
    } catch {
      toast.error('Failed to upload photo')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleCopyLink = () => {
    if (!profile?.username) return
    const url = `${window.location.origin}/u/${profile.username}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    toast.success('Profile link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const profileUrl = profile?.username ? `${typeof window !== 'undefined' ? window.location.origin : ''}/u/${profile.username}` : ''

  const inputClass = (field: string) =>
    `w-full py-3 px-4 bg-white/50 dark:bg-white/[0.04] border ${errors[field] ? 'border-red-500' : 'border-gray-200 dark:border-white/[0.08]'} rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-white/20 focus:border-transparent transition-all text-gray-900 dark:text-white placeholder-gray-400`

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'profile', label: 'Profile', icon: FaUser },
    { id: 'privacy', label: 'Privacy', icon: FaShieldAlt },
    { id: 'share', label: 'Share', icon: FaShareAlt },
  ]

  const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
    <div className="flex items-start gap-4 py-4 border-b border-gray-100 dark:border-white/[0.04] last:border-0">
      <div className="p-2.5 bg-gray-100 dark:bg-white/[0.04] rounded-xl">
        <Icon className="text-gray-500 text-sm" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">{label}</p>
        <p className="text-gray-900 dark:text-white font-medium mt-0.5 truncate">{value || '—'}</p>
      </div>
    </div>
  )

  const PrivacyToggle = ({ label, description, checked, onChange }: {
    label: string; description: string; checked: boolean; onChange: (val: boolean) => void
  }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-white/[0.04] last:border-0">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-gray-900 dark:bg-white' : 'bg-gray-200 dark:bg-gray-700'}`}
      >
        <span className={`absolute top-0.5 ${checked ? 'left-[22px]' : 'left-0.5'} w-5 h-5 bg-white dark:bg-gray-900 rounded-full transition-all shadow-sm`} />
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-24">
      <div className="relative z-10 max-w-2xl mx-auto">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors mb-6"
        >
          <FaArrowLeft className="text-sm" />
          <span>Back</span>
        </Link>

        {/* Profile Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl border border-gray-200 dark:border-white/[0.08] rounded-3xl overflow-hidden shadow-xl mb-4"
        >
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-5">
              {/* Profile Photo */}
              <div className="relative group">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-gray-100 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.08]">
                  {profile?.profilePhoto ? (
                    <Image src={profile.profilePhoto} alt={profile.fullName} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl sm:text-3xl font-bold text-gray-400">
                      {profile?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <label htmlFor="photo-change" className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  {uploadingPhoto ? (
                    <FaSpinner className="animate-spin text-white" />
                  ) : (
                    <FaCamera className="text-white" />
                  )}
                </label>
                <input id="photo-change" type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </div>

              {/* Name & Username */}
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                  {profile?.fullName}
                </h1>
                <p className="text-gray-500 text-sm">@{profile?.username}</p>
                {profile?.bio && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 line-clamp-2">{profile.bio}</p>
                )}
              </div>
            </div>

            {/* Social Links Display */}
            {(profile?.linkedin || profile?.github || profile?.portfolio) && (
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-white/[0.04]">
                {profile?.linkedin && (
                  <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-100 dark:bg-white/[0.06] rounded-lg hover:bg-gray-200 dark:hover:bg-white/[0.1] transition-colors">
                    <FaLinkedin className="text-gray-500 text-sm" />
                  </a>
                )}
                {profile?.github && (
                  <a href={profile.github} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-100 dark:bg-white/[0.06] rounded-lg hover:bg-gray-200 dark:hover:bg-white/[0.1] transition-colors">
                    <FaGithub className="text-gray-500 text-sm" />
                  </a>
                )}
                {profile?.portfolio && (
                  <a href={profile.portfolio} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-100 dark:bg-white/[0.06] rounded-lg hover:bg-gray-200 dark:hover:bg-white/[0.1] transition-colors">
                    <FaGlobe className="text-gray-500 text-sm" />
                  </a>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl border border-gray-200 dark:border-white/[0.08] rounded-2xl mb-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setIsEditing(false) }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <tab.icon className="text-xs" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl border border-gray-200 dark:border-white/[0.08] rounded-3xl overflow-hidden shadow-xl"
          >
            {activeTab === 'profile' && (
              <div className="p-4 sm:p-6">
                {isEditing ? (
                  <div className="space-y-4">
                    {/* Full Name */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        <FaUser className="text-gray-500 text-xs" /> Full Name
                      </label>
                      <input type="text" name="fullName" value={editData.fullName} onChange={handleChange} className={inputClass('fullName')} />
                      {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Bio <span className="text-gray-400 text-xs font-normal">(optional)</span>
                      </label>
                      <textarea
                        name="bio" value={editData.bio} onChange={handleChange}
                        placeholder="A short bio..."
                        rows={2} maxLength={200}
                        className={`${inputClass('bio')} resize-none`}
                      />
                    </div>

                    {/* Roll Number (read-only) */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        <FaIdCard className="text-gray-500 text-xs" /> Roll Number
                      </label>
                      <input type="text" value={profile?.rollNumber || ''} readOnly
                        className="w-full py-3 px-4 bg-gray-100 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] rounded-xl text-gray-400 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-400 mt-1">Cannot be changed</p>
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        <FaPhone className="text-gray-500 text-xs" /> Phone Number
                      </label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 bg-gray-100 dark:bg-white/[0.04] border border-r-0 border-gray-200 dark:border-white/[0.08] rounded-l-xl text-gray-500 text-sm">+91</span>
                        <input type="tel" name="phone" value={editData.phone} onChange={handleChange} maxLength={10}
                          className={`w-full py-3 px-4 bg-white/50 dark:bg-white/[0.04] border ${errors.phone ? 'border-red-500' : 'border-gray-200 dark:border-white/[0.08]'} rounded-r-xl focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-white/20 transition-all text-gray-900 dark:text-white`}
                        />
                      </div>
                      {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                    </div>

                    {/* Email (read-only) */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        <FaEnvelope className="text-gray-500 text-xs" /> Email
                      </label>
                      <input type="email" value={profile?.email || ''} readOnly
                        className="w-full py-3 px-4 bg-gray-100 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] rounded-xl text-gray-400 cursor-not-allowed"
                      />
                    </div>

                    {/* College */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        <FaUniversity className="text-gray-500 text-xs" /> College
                      </label>
                      <input type="text" name="college" value={editData.college} onChange={handleChange} className={inputClass('college')} />
                      {errors.college && <p className="text-red-500 text-xs mt-1">{errors.college}</p>}
                    </div>

                    {/* Year & Branch */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Year</label>
                        <select name="year" value={editData.year} onChange={handleChange} className={`${inputClass('year')} appearance-none`}>
                          <option value="">Select</option>
                          {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        {errors.year && <p className="text-red-500 text-xs mt-1">{errors.year}</p>}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Branch</label>
                        <select name="branch" value={editData.branch} onChange={handleChange} className={`${inputClass('branch')} appearance-none`}>
                          <option value="">Select</option>
                          {BRANCH_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                        {errors.branch && <p className="text-red-500 text-xs mt-1">{errors.branch}</p>}
                      </div>
                    </div>

                    {editData.year === 'Graduate' && (
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Graduation Year</label>
                        <input type="text" name="graduationYear" value={editData.graduationYear} onChange={handleChange} placeholder="e.g. 2023" maxLength={4} className={inputClass('graduationYear')} />
                        {errors.graduationYear && <p className="text-red-500 text-xs mt-1">{errors.graduationYear}</p>}
                      </div>
                    )}

                    {/* Social Links */}
                    <div className="pt-2 border-t border-gray-100 dark:border-white/[0.04]">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Social Links</p>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <FaLinkedin className="text-gray-400 text-sm flex-shrink-0" />
                          <input type="url" name="linkedin" value={editData.linkedin} onChange={handleChange}
                            placeholder="https://linkedin.com/in/username" className={inputClass('linkedin')} />
                        </div>
                        <div className="flex items-center gap-2">
                          <FaGithub className="text-gray-400 text-sm flex-shrink-0" />
                          <input type="url" name="github" value={editData.github} onChange={handleChange}
                            placeholder="https://github.com/username" className={inputClass('github')} />
                        </div>
                        <div className="flex items-center gap-2">
                          <FaGlobe className="text-gray-400 text-sm flex-shrink-0" />
                          <input type="url" name="portfolio" value={editData.portfolio} onChange={handleChange}
                            placeholder="https://yourportfolio.com" className={inputClass('portfolio')} />
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                      <button onClick={handleCancel}
                        className="flex-1 py-3 px-4 border border-gray-200 dark:border-white/[0.08] text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-all flex items-center justify-center gap-2">
                        <FaTimes /> Cancel
                      </button>
                      <button onClick={handleSave} disabled={saving}
                        className="flex-1 py-3 px-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                        {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <InfoRow icon={FaUser} label="Full Name" value={profile?.fullName || ''} />
                    <InfoRow icon={FaIdCard} label="Roll Number" value={profile?.rollNumber || ''} />
                    <InfoRow icon={FaPhone} label="Phone" value={profile?.phone ? `+91 ${profile.phone}` : ''} />
                    <InfoRow icon={FaEnvelope} label="Email" value={profile?.email || ''} />
                    <InfoRow icon={FaUniversity} label="College" value={profile?.college || ''} />
                    <InfoRow icon={FaGraduationCap} label="Year" value={profile?.year || ''} />
                    <InfoRow icon={FaCodeBranch} label="Branch" value={profile?.branch || ''} />

                    <button onClick={() => setIsEditing(true)}
                      className="w-full mt-6 py-3 px-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all flex items-center justify-center gap-2">
                      <FaEdit /> Edit Profile
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="p-4 sm:p-6">
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Privacy Settings</h2>
                  <p className="text-sm text-gray-500 mt-1">Control what others can see on your public profile</p>
                </div>

                {/* Profile Visibility */}
                <div className="mb-6 p-4 bg-gray-50 dark:bg-white/[0.02] rounded-xl border border-gray-100 dark:border-white/[0.04]">
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Profile Visibility</p>
                  <div className="flex gap-2">
                    {(['public', 'private'] as const).map(opt => (
                      <button
                        key={opt}
                        onClick={() => setPrivacyData(prev => ({ ...prev, profileVisibility: opt }))}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                          privacyData.profileVisibility === opt
                            ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                            : 'bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {opt === 'public' ? <FaEye className="text-xs" /> : <FaEyeSlash className="text-xs" />}
                        {opt.charAt(0).toUpperCase() + opt.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Individual toggles */}
                <div className="space-y-1">
                  <PrivacyToggle label="Email" description="Show your email on public profile"
                    checked={privacyData.showEmail} onChange={v => setPrivacyData(p => ({ ...p, showEmail: v }))} />
                  <PrivacyToggle label="Phone Number" description="Show your phone number"
                    checked={privacyData.showPhone} onChange={v => setPrivacyData(p => ({ ...p, showPhone: v }))} />
                  <PrivacyToggle label="College" description="Show your college name"
                    checked={privacyData.showCollege} onChange={v => setPrivacyData(p => ({ ...p, showCollege: v }))} />
                  <PrivacyToggle label="Year" description="Show your academic year"
                    checked={privacyData.showYear} onChange={v => setPrivacyData(p => ({ ...p, showYear: v }))} />
                  <PrivacyToggle label="Branch" description="Show your branch/department"
                    checked={privacyData.showBranch} onChange={v => setPrivacyData(p => ({ ...p, showBranch: v }))} />
                  <PrivacyToggle label="Roll Number" description="Show your roll number"
                    checked={privacyData.showRollNumber} onChange={v => setPrivacyData(p => ({ ...p, showRollNumber: v }))} />
                  <PrivacyToggle label="SkillDNA" description="Share your SkillDNA on public profile"
                    checked={privacyData.showSkillDNA} onChange={v => setPrivacyData(p => ({ ...p, showSkillDNA: v }))} />
                </div>

                <button onClick={handleSavePrivacy} disabled={saving}
                  className="w-full mt-6 py-3 px-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
                  {saving ? 'Saving...' : 'Save Privacy Settings'}
                </button>
              </div>
            )}

            {activeTab === 'share' && (
              <div className="p-4 sm:p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Share Your Profile</h2>
                  <p className="text-sm text-gray-500 mt-1">Share your matriXO profile with anyone</p>
                </div>

                {/* Profile Link */}
                <div className="p-4 bg-gray-50 dark:bg-white/[0.02] rounded-xl border border-gray-100 dark:border-white/[0.04] mb-6">
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2">Your Profile Link</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 py-2.5 px-3 bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-lg text-sm text-gray-700 dark:text-gray-300 truncate font-mono">
                      {profileUrl || 'Loading...'}
                    </div>
                    <button onClick={handleCopyLink}
                      className="p-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-all flex-shrink-0">
                      {copied ? <FaCheck /> : <FaCopy />}
                    </button>
                  </div>
                </div>

                {/* Preview Card */}
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-3">Preview</p>
                  <div className="p-5 bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-2xl">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 dark:bg-white/[0.06] flex-shrink-0">
                        {profile?.profilePhoto ? (
                          <Image src={profile.profilePhoto} alt={profile.fullName} width={56} height={56} className="object-cover w-full h-full" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl font-bold text-gray-400">
                            {profile?.fullName?.charAt(0)?.toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">{profile?.fullName}</p>
                        <p className="text-sm text-gray-500">@{profile?.username}</p>
                        {profile?.bio && <p className="text-xs text-gray-400 mt-1 line-clamp-1">{profile.bio}</p>}
                      </div>
                    </div>
                    {(privacyData.showCollege || privacyData.showBranch) && (
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/[0.04] flex flex-wrap gap-2">
                        {privacyData.showCollege && profile?.college && (
                          <span className="text-xs bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-gray-400 px-2.5 py-1 rounded-full">{profile.college}</span>
                        )}
                        {privacyData.showBranch && profile?.branch && (
                          <span className="text-xs bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-gray-400 px-2.5 py-1 rounded-full">{profile.branch}</span>
                        )}
                        {privacyData.showYear && profile?.year && (
                          <span className="text-xs bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-gray-400 px-2.5 py-1 rounded-full">{profile.year}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Open public profile */}
                <Link href={`/u/${profile?.username}`} target="_blank"
                  className="w-full mt-4 py-3 px-4 border border-gray-200 dark:border-white/[0.08] text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-all flex items-center justify-center gap-2">
                  <FaLink className="text-sm" /> View Public Profile
                </Link>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
