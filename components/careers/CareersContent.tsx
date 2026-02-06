'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FaBriefcase, FaMapMarkerAlt, FaClock, FaArrowRight, FaUpload, FaCheckCircle } from 'react-icons/fa'
import { collection, query, where, getDocs, orderBy, addDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebaseConfig'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { getStorage } from 'firebase/storage'
import { toast } from 'sonner'
import Link from 'next/link'

interface Role {
  id: string
  title: string
  description: string
  team: string
  location: string
  type: string
  status: 'open' | 'closed'
  createdAt: any
}

export default function CareersContent() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    college: '',
    yearOrExperience: '',
    interestedRole: '',
  })
  
  const [resume, setResume] = useState<File | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchOpenRoles = async () => {
      try {
        const rolesRef = collection(db, 'roles')
        const q = query(
          rolesRef,
          where('status', '==', 'open'),
          orderBy('createdAt', 'desc')
        )
        const querySnapshot = await getDocs(q)
        
        const fetchedRoles: Role[] = []
        querySnapshot.forEach((doc) => {
          fetchedRoles.push({ id: doc.id, ...doc.data() } as Role)
        })
        
        setRoles(fetchedRoles)
      } catch (error) {
        console.error('Error fetching roles:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOpenRoles()
  }, [])

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
      if (file.size > 5 * 1024 * 1024) {
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
    if (!formData.interestedRole.trim()) newErrors.interestedRole = 'Interested role is required'
    if (!resume) newErrors.resume = 'Resume is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleGeneralSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) {
      toast.error('Please fill in all required fields')
      return
    }

    setSubmitting(true)

    try {
      const storage = getStorage()
      const resumeRef = ref(storage, `resumes/general/${Date.now()}_${resume!.name}`)
      await uploadBytes(resumeRef, resume!)
      const resumeURL = await getDownloadURL(resumeRef)

      const applicationsRef = collection(db, 'applications')
      await addDoc(applicationsRef, {
        ...formData,
        roleId: null,
        roleTitle: formData.interestedRole,
        resumeURL,
        status: 'pending',
        submittedAt: Timestamp.now(),
        isGeneralApplication: true,
      })

      setSubmitted(true)
      toast.success('Application submitted successfully!')

      setTimeout(() => {
        setSubmitted(false)
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          college: '',
          yearOrExperience: '',
          interestedRole: '',
        })
        setResume(null)
      }, 3000)

    } catch (error) {
      console.error('Error submitting application:', error)
      toast.error('Failed to submit application. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white py-20">
        <div className="container-custom px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-6xl font-display font-bold mb-6">
              Carrier<span className="text-cyan-400">@</span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">matriXO</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8">
              Join matriXO and help shape the future of technical education
            </p>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              We're building innovative solutions that empower students and educational institutions. 
              Be part of a team that's making a real difference in how people learn and grow.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Open Roles Section */}
      <section className="py-20 bg-white dark:bg-gray-950">
        <div className="container-custom px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
              Open Positions
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Discover opportunities that match your skills and passion
            </p>
          </motion.div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : roles.length === 0 ? (
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-12"
              >
                <FaBriefcase className="text-6xl text-gray-400 mx-auto mb-6" />
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  No Open Positions Right Now
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  We don't have any openings at the moment, but we're always looking for talented individuals.
                </p>
                <p className="text-cyan-600 dark:text-cyan-400 font-semibold text-lg">
                  Submit your information below and we'll contact you when a suitable position opens up!
                </p>
              </motion.div>

              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass-card p-12 text-center"
                >
                  <FaCheckCircle className="text-6xl text-green-500 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Application Submitted!
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Thank you for your interest. We'll review your information and contact you when a suitable position opens up.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="glass-card p-8"
                >
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Express Your Interest
                  </h3>

                  <form onSubmit={handleGeneralSubmit} className="space-y-6">
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

                    {/* Interested Role */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Role You're Interested In *
                      </label>
                      <input
                        type="text"
                        name="interestedRole"
                        value={formData.interestedRole}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        placeholder="e.g., Full Stack Developer, Marketing Manager, etc."
                      />
                      {errors.interestedRole && <p className="text-red-500 text-sm mt-1">{errors.interestedRole}</p>}
                    </div>

                    {/* Resume Upload */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Resume (PDF only, max 5MB) *
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
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {roles.map((role, index) => (
                <motion.div
                  key={role.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card p-6 hover-lift hover-glow group"
                >
                  <div className="mb-4">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-cyan-500 transition-colors">
                      {role.title}
                    </h3>
                    <p className="text-cyan-600 dark:text-cyan-400 font-medium mb-4">
                      {role.team}
                    </p>
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 mb-6 line-clamp-3">
                    {role.description}
                  </p>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <FaMapMarkerAlt className="mr-2 text-cyan-500" />
                      {role.location}
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <FaClock className="mr-2 text-cyan-500" />
                      {role.type}
                    </div>
                  </div>

                  <Link href={`/careers/apply/${role.id}`}>
                    <button className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 flex items-center justify-center group">
                      Apply Now
                      <FaArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Why Join Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container-custom px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
              Why Join matriXO?
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                title: 'Impact at Scale',
                description: 'Work on products that directly impact thousands of students and educational institutions.',
                icon: '🚀',
              },
              {
                title: 'Innovation First',
                description: 'Be at the forefront of EdTech innovation with AI, blockchain, and cutting-edge technologies.',
                icon: '💡',
              },
              {
                title: 'Growth & Learning',
                description: 'Continuous learning opportunities, mentorship, and career development programs.',
                icon: '📈',
              },
            ].map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-8 text-center"
              >
                <div className="text-5xl mb-4">{benefit.icon}</div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
