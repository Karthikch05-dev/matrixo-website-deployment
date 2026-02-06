'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  FaUser, FaIdCard, FaPhone, FaEnvelope, FaUniversity,
  FaGraduationCap, FaCodeBranch, FaEdit, FaSave, FaTimes, FaSpinner, FaArrowLeft
} from 'react-icons/fa'
import { useAuth } from '@/lib/AuthContext'
import { useProfile } from '@/lib/ProfileContext'
import { toast } from 'sonner'
import Link from 'next/link'

const YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year']
const BRANCH_OPTIONS = [
  'CSE', 'CSE (AIML)', 'CSE (DS)', 'CSE (CS)', 'CSE (IoT)',
  'AIML', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'Other'
]

export default function ProfilePage() {
  const { user } = useAuth()
  const { profile, loading: profileLoading, profileExists, updateProfile } = useProfile()
  const router = useRouter()

  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editData, setEditData] = useState({
    fullName: '',
    phone: '',
    college: '',
    year: '',
    branch: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (profile) {
      setEditData({
        fullName: profile.fullName,
        phone: profile.phone,
        college: profile.college,
        year: profile.year,
        branch: profile.branch,
      })
    }
  }, [profile])

  if (!user) {
    router.replace('/auth')
    return null
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-950 dark:via-gray-900 dark:to-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <FaSpinner className="animate-spin text-4xl text-purple-500" />
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
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
      })
      toast.success('Profile updated successfully!')
      setIsEditing(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile')
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
      })
    }
    setErrors({})
    setIsEditing(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setEditData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
    <div className="flex items-start gap-4 py-4 border-b border-gray-200 dark:border-gray-800 last:border-0">
      <div className="p-2.5 bg-purple-500/10 rounded-xl">
        <Icon className="text-purple-500 text-sm" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">{label}</p>
        <p className="text-gray-900 dark:text-white font-medium mt-0.5 truncate">{value}</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-950 dark:via-gray-900 dark:to-black px-4 py-24">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse" />
        <div className="absolute top-0 -right-4 w-96 h-96 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 max-w-lg mx-auto">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-500 dark:hover:text-purple-400 transition-colors mb-6"
        >
          <FaArrowLeft className="text-sm" />
          <span>Back to Home</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-300 dark:border-gray-800 rounded-3xl overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-2xl font-bold">
                  {profile?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <h1 className="text-xl font-bold">{profile?.fullName}</h1>
                  <p className="text-white/80 text-sm">{profile?.email}</p>
                </div>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl transition-colors"
                  title="Edit Profile"
                >
                  <FaEdit />
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {isEditing ? (
              /* Edit Mode */
              <div className="space-y-4">
                {/* Full Name (editable) */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    <FaUser className="text-purple-500 text-xs" /> Full Name
                  </label>
                  <input
                    type="text" name="fullName" value={editData.fullName} onChange={handleChange}
                    className={`w-full py-3 px-4 bg-gray-100 dark:bg-gray-800/50 border ${errors.fullName ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-gray-900 dark:text-white`}
                  />
                  {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                </div>

                {/* Roll Number (read-only) */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    <FaIdCard className="text-purple-500 text-xs" /> Roll Number
                  </label>
                  <input
                    type="text" value={profile?.rollNumber || ''} readOnly
                    className="w-full py-3 px-4 bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-400 mt-1">Roll number cannot be changed</p>
                </div>

                {/* Phone */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    <FaPhone className="text-purple-500 text-xs" /> Phone Number
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 bg-gray-200 dark:bg-gray-700 border border-r-0 border-gray-300 dark:border-gray-600 rounded-l-xl text-gray-600 dark:text-gray-300 text-sm">+91</span>
                    <input
                      type="tel" name="phone" value={editData.phone} onChange={handleChange} maxLength={10}
                      className={`w-full py-3 px-4 bg-gray-100 dark:bg-gray-800/50 border ${errors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} rounded-r-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-gray-900 dark:text-white`}
                    />
                  </div>
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>

                {/* Email (read-only) */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    <FaEnvelope className="text-purple-500 text-xs" /> Email
                  </label>
                  <input
                    type="email" value={profile?.email || ''} readOnly
                    className="w-full py-3 px-4 bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                </div>

                {/* College */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    <FaUniversity className="text-purple-500 text-xs" /> College
                  </label>
                  <input
                    type="text" name="college" value={editData.college} onChange={handleChange}
                    className={`w-full py-3 px-4 bg-gray-100 dark:bg-gray-800/50 border ${errors.college ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-gray-900 dark:text-white`}
                  />
                  {errors.college && <p className="text-red-500 text-xs mt-1">{errors.college}</p>}
                </div>

                {/* Year & Branch */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      <FaGraduationCap className="text-purple-500 text-xs" /> Year
                    </label>
                    <select
                      name="year" value={editData.year} onChange={handleChange}
                      className={`w-full py-3 px-4 bg-gray-100 dark:bg-gray-800/50 border ${errors.year ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-gray-900 dark:text-white appearance-none`}
                    >
                      <option value="">Select</option>
                      {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    {errors.year && <p className="text-red-500 text-xs mt-1">{errors.year}</p>}
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      <FaCodeBranch className="text-purple-500 text-xs" /> Branch
                    </label>
                    <select
                      name="branch" value={editData.branch} onChange={handleChange}
                      className={`w-full py-3 px-4 bg-gray-100 dark:bg-gray-800/50 border ${errors.branch ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-gray-900 dark:text-white appearance-none`}
                    >
                      <option value="">Select</option>
                      {BRANCH_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                    {errors.branch && <p className="text-red-500 text-xs mt-1">{errors.branch}</p>}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleCancel}
                    className="flex-1 py-3 px-4 border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                  >
                    <FaTimes /> Cancel
                  </button>
                  <button
                    onClick={handleSave} disabled={saving}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            ) : (
              /* View Mode */
              <div>
                <InfoRow icon={FaUser} label="Full Name" value={profile?.fullName || ''} />
                <InfoRow icon={FaIdCard} label="Roll Number" value={profile?.rollNumber || ''} />
                <InfoRow icon={FaPhone} label="Phone" value={`+91 ${profile?.phone || ''}`} />
                <InfoRow icon={FaEnvelope} label="Email" value={profile?.email || ''} />
                <InfoRow icon={FaUniversity} label="College" value={profile?.college || ''} />
                <InfoRow icon={FaGraduationCap} label="Year" value={profile?.year || ''} />
                <InfoRow icon={FaCodeBranch} label="Branch" value={profile?.branch || ''} />

                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full mt-6 py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <FaEdit /> Edit Profile
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
