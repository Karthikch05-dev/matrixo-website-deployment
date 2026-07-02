'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaUniversity,
  FaGraduationCap,
  FaCodeBranch,
  FaMapMarkerAlt,
  FaGithub,
  FaLinkedin,
  FaUpload,
  FaCheckCircle,
  FaSpinner,
  FaTimes,
  FaImage,
  FaBrain,
  FaQuestionCircle,
} from 'react-icons/fa'
import { toast } from 'sonner'
import { useAuth } from '@/lib/AuthContext'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DevAgentsRegistrationFormProps {
  onClose: () => void
}

interface FormFields {
  fullName: string
  email: string
  phone: string
  college: string
  year: string
  branch: string
  city: string
  github: string
  linkedIn: string
  experienceLevel: string
  whyAttend: string
}

// ---------------------------------------------------------------------------
// Helper — convert File to Base64 Data URL
// ---------------------------------------------------------------------------
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DevAgentsRegistrationForm({
  onClose,
}: DevAgentsRegistrationFormProps) {
  const { user } = useAuth()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [entryNumber, setEntryNumber] = useState('')

  // Payment screenshot — stored as File for display, converted to Base64 on submit
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null)
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // -------------------------------------------------------------------------
  // Form state — field names match the Apps Script schema exactly
  // -------------------------------------------------------------------------
  const [formData, setFormData] = useState<FormFields>({
    fullName: user?.displayName || '',
    email: user?.email || '',
    phone: '',
    college: '',
    year: '',
    branch: '',
    city: '',
    github: '',
    linkedIn: '',
    experienceLevel: '',
    whyAttend: '',
  })

  // Sync Firebase user data into form when auth resolves
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: user.displayName || prev.fullName,
        email: user.email || prev.email,
      }))
    }
  }, [user])

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPG, PNG, etc.)')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5 MB')
      return
    }

    setScreenshotFile(file)

    // Generate preview immediately using FileReader — same reader will be
    // reused on submit to produce the Base64 Data URL.
    const reader = new FileReader()
    reader.onloadend = () => {
      setScreenshotPreview(reader.result as string)
      toast.success('Screenshot uploaded successfully!')
    }
    reader.readAsDataURL(file)
  }

  // -------------------------------------------------------------------------
  // Validation
  // -------------------------------------------------------------------------

  const validate = (): boolean => {
    const f = formData

    if (!f.fullName.trim()) { toast.error('Full name is required'); return false }
    if (!f.email.trim() || !f.email.includes('@')) { toast.error('Valid email is required'); return false }
    if (!/^[6-9]\d{9}$/.test(f.phone.trim())) { toast.error('Enter a valid 10-digit phone number'); return false }
    if (!f.college.trim()) { toast.error('College name is required'); return false }
    if (!f.year) { toast.error('Year of study is required'); return false }
    if (!f.branch.trim()) { toast.error('Branch is required'); return false }
    if (!f.city.trim()) { toast.error('City is required'); return false }
    if (!f.experienceLevel) { toast.error('Experience level is required'); return false }
    if (!f.whyAttend.trim()) { toast.error('"Why do you want to attend?" is required'); return false }
    if (!screenshotFile) { toast.error('Payment screenshot is required'); return false }

    return true
  }

  // -------------------------------------------------------------------------
  // Submit
  // -------------------------------------------------------------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)

    try {
      // Convert screenshot file to Base64 Data URL using FileReader
      toast.info('Processing payment screenshot...')
      const paymentScreenshot = await fileToBase64(screenshotFile!)

      if (!paymentScreenshot.startsWith('data:image')) {
        toast.error('Screenshot conversion failed. Please try again.')
        setIsSubmitting(false)
        return
      }

      // -----------------------------------------------------------------------
      // Build the EXACT payload the Apps Script expects (via /api/devagents/register).
      // Field names are 1-to-1 with the backend schema — no renames, no extras.
      // -----------------------------------------------------------------------
      const payload = {
        action: 'register',
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        college: formData.college.trim(),
        year: formData.year,
        branch: formData.branch.trim(),
        city: formData.city.trim(),
        github: formData.github.trim(),
        linkedIn: formData.linkedIn.trim(),
        experienceLevel: formData.experienceLevel,
        whyAttend: formData.whyAttend.trim(),
        paymentScreenshot, // Base64 Data URL — NOT plain text, NOT a file path
      }

      console.log('[DevAgents] Submitting registration payload:', {
        ...payload,
        paymentScreenshot: payload.paymentScreenshot.substring(0, 50) + '…', // truncate for log
      })

      const res = await fetch('/api/devagents/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Registration failed')
      }

      setEntryNumber(data.entryNumber || '')
      setSubmitted(true)
      toast.success('🎉 Registration complete! Check your email for confirmation.')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please try again.'
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  // -------------------------------------------------------------------------
  // Success screen
  // -------------------------------------------------------------------------

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl"
        >
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaCheckCircle className="text-green-500 text-3xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Registration Successful!
          </h2>
          {entryNumber && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Entry Number: <span className="font-semibold text-blue-600">{entryNumber}</span>
            </p>
          )}
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Check your email for a confirmation message. Your payment screenshot has been uploaded
            and will be verified by the team.
          </p>
          <button
            onClick={onClose}
            className="btn-primary w-full"
          >
            Close
          </button>
        </motion.div>
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // Form
  // -------------------------------------------------------------------------

  const inputCls =
    'w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all'
  const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-5 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-white">DevAgents Registration</h2>
            <p className="text-blue-100 text-sm mt-0.5">Fill in all details to secure your spot</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Personal Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* fullName */}
            <div>
              <label htmlFor="fullName" className={labelCls}>
                <FaUser className="inline mr-1.5 text-blue-500" />
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Your full name"
                className={inputCls}
                required
              />
            </div>

            {/* email */}
            <div>
              <label htmlFor="email" className={labelCls}>
                <FaEnvelope className="inline mr-1.5 text-blue-500" />
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className={inputCls}
                required
              />
            </div>

            {/* phone */}
            <div>
              <label htmlFor="phone" className={labelCls}>
                <FaPhone className="inline mr-1.5 text-blue-500" />
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="10-digit mobile number"
                maxLength={10}
                className={inputCls}
                required
              />
            </div>

            {/* city */}
            <div>
              <label htmlFor="city" className={labelCls}>
                <FaMapMarkerAlt className="inline mr-1.5 text-blue-500" />
                City <span className="text-red-500">*</span>
              </label>
              <input
                id="city"
                name="city"
                type="text"
                value={formData.city}
                onChange={handleChange}
                placeholder="Hyderabad"
                className={inputCls}
                required
              />
            </div>
          </div>

          {/* Academic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* college */}
            <div className="sm:col-span-2">
              <label htmlFor="college" className={labelCls}>
                <FaUniversity className="inline mr-1.5 text-blue-500" />
                College / University <span className="text-red-500">*</span>
              </label>
              <input
                id="college"
                name="college"
                type="text"
                value={formData.college}
                onChange={handleChange}
                placeholder="Your college name"
                className={inputCls}
                required
              />
            </div>

            {/* year */}
            <div>
              <label htmlFor="year" className={labelCls}>
                <FaGraduationCap className="inline mr-1.5 text-blue-500" />
                Year of Study <span className="text-red-500">*</span>
              </label>
              <select
                id="year"
                name="year"
                value={formData.year}
                onChange={handleChange}
                className={inputCls}
                required
              >
                <option value="">Select year</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="Graduate">Graduate</option>
              </select>
            </div>

            {/* branch */}
            <div>
              <label htmlFor="branch" className={labelCls}>
                <FaCodeBranch className="inline mr-1.5 text-blue-500" />
                Branch / Department <span className="text-red-500">*</span>
              </label>
              <input
                id="branch"
                name="branch"
                type="text"
                value={formData.branch}
                onChange={handleChange}
                placeholder="e.g. Computer Science"
                className={inputCls}
                required
              />
            </div>
          </div>

          {/* Social / Professional Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* github */}
            <div>
              <label htmlFor="github" className={labelCls}>
                <FaGithub className="inline mr-1.5 text-gray-600 dark:text-gray-300" />
                GitHub Profile
              </label>
              <input
                id="github"
                name="github"
                type="url"
                value={formData.github}
                onChange={handleChange}
                placeholder="https://github.com/username"
                className={inputCls}
              />
            </div>

            {/* linkedIn — note camelCase 'I' to match Apps Script */}
            <div>
              <label htmlFor="linkedIn" className={labelCls}>
                <FaLinkedin className="inline mr-1.5 text-blue-600" />
                LinkedIn Profile
              </label>
              <input
                id="linkedIn"
                name="linkedIn"
                type="url"
                value={formData.linkedIn}
                onChange={handleChange}
                placeholder="https://linkedin.com/in/username"
                className={inputCls}
              />
            </div>
          </div>

          {/* experienceLevel */}
          <div>
            <label htmlFor="experienceLevel" className={labelCls}>
              <FaBrain className="inline mr-1.5 text-purple-500" />
              Experience Level <span className="text-red-500">*</span>
            </label>
            <select
              id="experienceLevel"
              name="experienceLevel"
              value={formData.experienceLevel}
              onChange={handleChange}
              className={inputCls}
              required
            >
              <option value="">Select your level</option>
              <option value="Beginner">Beginner — little to no coding experience</option>
              <option value="Intermediate">Intermediate — comfortable with basics</option>
              <option value="Advanced">Advanced — worked on real projects</option>
            </select>
          </div>

          {/* whyAttend */}
          <div>
            <label htmlFor="whyAttend" className={labelCls}>
              <FaQuestionCircle className="inline mr-1.5 text-purple-500" />
              Why do you want to attend? <span className="text-red-500">*</span>
            </label>
            <textarea
              id="whyAttend"
              name="whyAttend"
              value={formData.whyAttend}
              onChange={handleChange}
              rows={3}
              placeholder="Tell us what you hope to learn or gain from DevAgents..."
              className={`${inputCls} resize-none`}
              required
            />
          </div>

          {/* paymentScreenshot */}
          <div>
            <label className={labelCls}>
              <FaImage className="inline mr-1.5 text-green-500" />
              Payment Screenshot <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Upload a screenshot of your payment confirmation. The image will be securely uploaded
              to Google Drive — Base64 is only used in transit and is never stored as text.
            </p>

            <div
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all
                ${
                  screenshotFile
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/10'
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 bg-gray-50 dark:bg-gray-800'
                }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleScreenshotChange}
                className="hidden"
              />

              {screenshotPreview ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={screenshotPreview}
                    alt="Payment screenshot preview"
                    className="max-h-40 rounded-lg object-contain"
                  />
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                    <FaCheckCircle /> {screenshotFile?.name}
                  </p>
                  <p className="text-xs text-gray-400">Click to replace</p>
                </>
              ) : (
                <>
                  <FaUpload className="text-gray-400 text-2xl" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Click to upload payment screenshot
                  </p>
                  <p className="text-xs text-gray-400">JPG, PNG or WEBP · max 5 MB</p>
                </>
              )}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting || !screenshotFile}
            className={`w-full py-4 rounded-xl text-white font-bold text-base transition-all flex items-center justify-center gap-2
              ${
                isSubmitting || !screenshotFile
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-lg shadow-blue-500/20'
              }`}
          >
            {isSubmitting ? (
              <>
                <FaSpinner className="animate-spin" />
                Submitting Registration…
              </>
            ) : (
              <>
                <FaCheckCircle />
                Complete Registration
              </>
            )}
          </button>

          {!screenshotFile && (
            <p className="text-center text-xs text-gray-400">
              ⬆️ Upload your payment screenshot above to continue
            </p>
          )}
        </form>
      </motion.div>
    </div>
  )
}
