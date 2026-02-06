'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FaArrowLeft, FaUpload, FaCheckCircle } from 'react-icons/fa'
import { doc, getDoc, collection, addDoc, Timestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebaseConfig'
import { toast } from 'sonner'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Role {
  id: string
  title: string
  description: string
  team: string
  location: string
  type: string
  responsibilities?: string[]
  eligibility?: string[]
}

interface ApplicationFormProps {
  roleId: string
}

export default function ApplicationForm({ roleId }: ApplicationFormProps) {
  const router = useRouter()
  const [role, setRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    college: '',
    yearOrExperience: '',
  })
  
  const [resume, setResume] = useState<File | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const roleDoc = await getDoc(doc(db, 'roles', roleId))
        if (roleDoc.exists()) {
          setRole({ id: roleDoc.id, ...roleDoc.data() } as Role)
        } else {
          toast.error('Role not found')
          router.push('/careers')
        }
      } catch (error) {
        console.error('Error fetching role:', error)
        toast.error('Failed to load role details')
      } finally {
        setLoading(false)
      }
    }

    fetchRole()
  }, [roleId, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== 'application/pdf') {
        setErrors(prev => ({ ...prev, resume: 'Only PDF files are allowed' }))
        return
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB
        setErrors(prev => ({ ...prev, resume: 'File size must be less than 5MB' }))
        return
      }
      setResume(file)
      setErrors(prev => ({ ...prev, resume: '' }))
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format'
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required'
    else if (!/^\d{10}$/.test(formData.phone.replace(/\s/g, ''))) newErrors.phone = 'Invalid phone number'
    if (!formData.college.trim()) newErrors.college = 'College/Organization is required'
    if (!formData.yearOrExperience.trim()) newErrors.yearOrExperience = 'This field is required'
    if (!resume) newErrors.resume = 'Resume is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) {
      toast.error('Please fill in all required fields')
      return
    }

    setSubmitting(true)

    try {
      // Upload resume to Firebase Storage
      const resumeRef = ref(storage, `resumes/${Date.now()}_${resume!.name}`)
      await uploadBytes(resumeRef, resume!)
      const resumeURL = await getDownloadURL(resumeRef)

      // Save application to Firestore
      const applicationsRef = collection(db, 'applications')
      await addDoc(applicationsRef, {
        ...formData,
        roleId,
        roleTitle: role?.title,
        resumeURL,
        status: 'pending',
        submittedAt: Timestamp.now(),
      })

      setSubmitted(true)
      toast.success('Application submitted successfully!')

      // Redirect after 3 seconds
      setTimeout(() => {
        router.push('/careers')
      }, 3000)

    } catch (error) {
      console.error('Error submitting application:', error)
      toast.error('Failed to submit application. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!role) {
    return null
  }

  if (submitted) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-12 text-center max-w-md mx-auto"
        >
          <FaCheckCircle className="text-6xl text-green-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Application Submitted!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Thank you for applying to matriXO. We'll review your application and get back to you soon.
          </p>
          <Link href="/careers">
            <button className="btn-primary">
              Back to Careers
            </button>
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-20 bg-gray-50 dark:bg-gray-950">
      <div className="container-custom px-6 py-12">
        {/* Back Button */}
        <Link href="/careers">
          <motion.button
            whileHover={{ x: -5 }}
            className="flex items-center text-cyan-600 dark:text-cyan-400 hover:underline mb-8"
          >
            <FaArrowLeft className="mr-2" />
            Back to Careers
          </motion.button>
        </Link>

        <div className="max-w-4xl mx-auto">
          {/* Role Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Apply for {role.title}
            </h1>
            <p className="text-cyan-600 dark:text-cyan-400 font-semibold mb-4">
              {role.team} • {role.location} • {role.type}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              {role.description}
            </p>
          </motion.div>

          {/* Application Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Application Form
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
                {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="your.email@example.com"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="1234567890"
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>

              {/* College/Organization */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  College / Organization *
                </label>
                <input
                  type="text"
                  name="college"
                  value={formData.college}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Your institution name"
                />
                {errors.college && <p className="text-red-500 text-sm mt-1">{errors.college}</p>}
              </div>

              {/* Year/Experience */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Year / Experience *
                </label>
                <input
                  type="text"
                  name="yearOrExperience"
                  value={formData.yearOrExperience}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="e.g., 3rd Year B.Tech or 2 years experience"
                />
                {errors.yearOrExperience && <p className="text-red-500 text-sm mt-1">{errors.yearOrExperience}</p>}
              </div>

              {/* Resume Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Resume (PDF only) *
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex-1 cursor-pointer">
                    <div className="w-full px-4 py-3 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-cyan-500 transition-colors flex items-center justify-center">
                      <FaUpload className="mr-2" />
                      {resume ? resume.name : 'Choose File'}
                    </div>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
                {errors.resume && <p className="text-red-500 text-sm mt-1">{errors.resume}</p>}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-4 rounded-lg font-bold text-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
