'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { FaUser, FaIdCard, FaPhone, FaEnvelope, FaUniversity, FaGraduationCap, FaCodeBranch, FaArrowRight, FaSpinner } from 'react-icons/fa'
import { useAuth } from '@/lib/AuthContext'
import { useProfile } from '@/lib/ProfileContext'
import { toast } from 'sonner'

const YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year']
const BRANCH_OPTIONS = [
  'CSE', 'CSE (AIML)', 'CSE (DS)', 'CSE (CS)', 'CSE (IoT)',
  'AIML', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'Other'
]

export default function ProfileSetupPage() {
  const { user } = useAuth()
  const { createProfile, profileExists } = useProfile()
  const router = useRouter()

  const [formData, setFormData] = useState({
    fullName: user?.displayName || '',
    rollNumber: '',
    phone: '',
    college: '',
    year: '',
    branch: '',
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // If profile already exists, redirect
  if (profileExists) {
    router.replace('/')
    return null
  }

  if (!user) {
    router.replace('/auth')
    return null
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required'
    if (!formData.rollNumber.trim()) newErrors.rollNumber = 'Roll number is required'
    else if (formData.rollNumber.trim().length < 4) newErrors.rollNumber = 'Roll number is too short'

    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required'
    else if (!/^[6-9]\d{9}$/.test(formData.phone.trim())) newErrors.phone = 'Enter a valid 10-digit phone number'

    if (!formData.college.trim()) newErrors.college = 'College name is required'
    if (!formData.year) newErrors.year = 'Select your year'
    if (!formData.branch) newErrors.branch = 'Select your branch'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      await createProfile({
        fullName: formData.fullName.trim(),
        rollNumber: formData.rollNumber.trim().toUpperCase(),
        phone: formData.phone.trim(),
        college: formData.college.trim(),
        year: formData.year,
        branch: formData.branch,
      })
      toast.success('Profile created successfully!')
      router.push('/')
    } catch (error: any) {
      console.error('Profile creation error:', error)
      toast.error(error.message || 'Failed to create profile')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-950 dark:via-gray-900 dark:to-black flex items-center justify-center px-4 py-24">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse" />
        <div className="absolute top-0 -right-4 w-96 h-96 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-lg"
      >
        <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-300 dark:border-gray-800 rounded-3xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl mb-4">
              <FaUser className="text-white text-2xl" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Complete Your Profile
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Set up your profile to get started with matriXO
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <FaUser className="text-purple-500 text-xs" /> Full Name
              </label>
              <input
                type="text" name="fullName" value={formData.fullName} onChange={handleChange}
                placeholder="Enter your full name"
                className={`w-full py-3 px-4 bg-gray-100 dark:bg-gray-800/50 border ${errors.fullName ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900 dark:text-white placeholder-gray-400`}
              />
              {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
            </div>

            {/* Roll Number */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <FaIdCard className="text-purple-500 text-xs" /> Roll Number
              </label>
              <input
                type="text" name="rollNumber" value={formData.rollNumber} onChange={handleChange}
                placeholder="e.g. 22B81A0501"
                className={`w-full py-3 px-4 bg-gray-100 dark:bg-gray-800/50 border ${errors.rollNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900 dark:text-white placeholder-gray-400 uppercase`}
              />
              {errors.rollNumber && <p className="text-red-500 text-xs mt-1">{errors.rollNumber}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <FaPhone className="text-purple-500 text-xs" /> Phone Number
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 bg-gray-200 dark:bg-gray-700 border border-r-0 border-gray-300 dark:border-gray-600 rounded-l-xl text-gray-600 dark:text-gray-300 text-sm">+91</span>
                <input
                  type="tel" name="phone" value={formData.phone} onChange={handleChange}
                  placeholder="9876543210" maxLength={10}
                  className={`w-full py-3 px-4 bg-gray-100 dark:bg-gray-800/50 border ${errors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} rounded-r-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900 dark:text-white placeholder-gray-400`}
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
                type="email" value={user?.email || ''} readOnly
                className="w-full py-3 px-4 bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">Email is linked to your account and cannot be changed</p>
            </div>

            {/* College */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <FaUniversity className="text-purple-500 text-xs" /> College Name
              </label>
              <input
                type="text" name="college" value={formData.college} onChange={handleChange}
                placeholder="e.g. KPRIT, Hyderabad"
                className={`w-full py-3 px-4 bg-gray-100 dark:bg-gray-800/50 border ${errors.college ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900 dark:text-white placeholder-gray-400`}
              />
              {errors.college && <p className="text-red-500 text-xs mt-1">{errors.college}</p>}
            </div>

            {/* Year & Branch row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Year */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  <FaGraduationCap className="text-purple-500 text-xs" /> Year
                </label>
                <select
                  name="year" value={formData.year} onChange={handleChange}
                  className={`w-full py-3 px-4 bg-gray-100 dark:bg-gray-800/50 border ${errors.year ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900 dark:text-white appearance-none`}
                >
                  <option value="">Select</option>
                  {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                {errors.year && <p className="text-red-500 text-xs mt-1">{errors.year}</p>}
              </div>

              {/* Branch */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  <FaCodeBranch className="text-purple-500 text-xs" /> Branch
                </label>
                <select
                  name="branch" value={formData.branch} onChange={handleChange}
                  className={`w-full py-3 px-4 bg-gray-100 dark:bg-gray-800/50 border ${errors.branch ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900 dark:text-white appearance-none`}
                >
                  <option value="">Select</option>
                  {BRANCH_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                {errors.branch && <p className="text-red-500 text-xs mt-1">{errors.branch}</p>}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              className="w-full py-3 px-5 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 text-white rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-purple-500/50 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group mt-2"
            >
              {loading ? (
                <FaSpinner className="animate-spin text-xl" />
              ) : (
                <>
                  <span>Save Profile</span>
                  <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
