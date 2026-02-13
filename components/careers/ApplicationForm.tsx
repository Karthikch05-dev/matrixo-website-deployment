'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FaArrowLeft, FaCheckCircle, FaMapMarkerAlt, FaClock, FaUsers,
  FaCloudUploadAlt, FaFilePdf, FaTimes, FaStar, FaChevronDown,
  FaCheck, FaArrowRight
} from 'react-icons/fa'
import { doc, getDoc, collection, addDoc, Timestamp } from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebaseConfig'
import { useAuth } from '@/lib/AuthContext'
import { useProfile } from '@/lib/ProfileContext'
import { toast } from 'sonner'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'

// ============================================
// TYPES
// ============================================

export interface FormQuestion {
  id: string
  type: 'short-answer' | 'paragraph' | 'multiple-choice' | 'checkboxes' | 'dropdown' | 'file-upload' | 'linear-scale' | 'rating' | 'date' | 'time'
  title: string
  description: string
  required: boolean
  options: string[]
  validation: {
    type: 'none' | 'number' | 'text' | 'length' | 'regex'
    pattern?: string
    min?: number
    max?: number
    errorMessage?: string
  } | null
  scaleConfig: {
    min: number
    max: number
    minLabel: string
    maxLabel: string
  } | null
  ratingMax: number
  order: number
}

interface Role {
  id: string
  title: string
  description: string
  team: string
  location: string
  type: string
  status: string
  responsibilities?: string[]
  eligibility?: string[]
  customQuestions?: FormQuestion[] | string[]
  requireResume?: boolean
}

interface ApplicationFormProps {
  roleId: string
}

// ============================================
// NORMALIZE QUESTIONS (backward compat)
// ============================================
export function normalizeQuestions(raw: any): FormQuestion[] {
  if (!raw || !Array.isArray(raw) || raw.length === 0) return []
  if (typeof raw[0] === 'string') {
    return raw.map((q: string, i: number) => ({
      id: `legacy_${i}`,
      type: 'short-answer' as const,
      title: q,
      description: '',
      required: false,
      options: [],
      validation: null,
      scaleConfig: null,
      ratingMax: 5,
      order: i,
    }))
  }
  return raw as FormQuestion[]
}

// ============================================
// FILE UPLOAD FIELD (separate component to avoid hooks-in-switch violation)
// ============================================

function FileUploadField({ onChange }: { onChange: (val: any) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState('')
  return (
    <div>
      <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={(e) => {
        const file = e.target.files?.[0]
        if (file) { setFileName(file.name); onChange(file) }
      }} />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-neutral-600 hover:border-cyan-500 dark:hover:border-cyan-500 transition-all w-full text-left"
      >
        <FaCloudUploadAlt className="text-gray-400 text-xl" />
        <span className="text-sm text-gray-500 dark:text-neutral-400">{fileName || 'Click to upload file'}</span>
      </button>
    </div>
  )
}

// ============================================
// QUESTION FIELD RENDERER
// ============================================

function QuestionField({
  question,
  value,
  onChange,
  error,
}: {
  question: FormQuestion
  value: any
  onChange: (val: any) => void
  error?: string
}) {
  const inputClasses = 'w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all placeholder:text-gray-400 dark:placeholder:text-neutral-500'

  const renderField = () => {
    switch (question.type) {
      case 'short-answer':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={inputClasses}
            placeholder="Your answer"
          />
        )

      case 'paragraph':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={`${inputClasses} min-h-[120px] resize-y`}
            placeholder="Your answer"
            rows={4}
          />
        )

      case 'multiple-choice':
        return (
          <div className="space-y-2">
            {question.options.map((opt, i) => (
              <label key={i} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800/50 cursor-pointer transition-all group">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  value === opt ? 'border-cyan-500 bg-cyan-500' : 'border-gray-300 dark:border-neutral-600 group-hover:border-cyan-400'
                }`}>
                  {value === opt && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <span className="text-gray-700 dark:text-neutral-300">{opt}</span>
              </label>
            ))}
          </div>
        )

      case 'checkboxes': {
        const selectedArr: string[] = Array.isArray(value) ? value : []
        return (
          <div className="space-y-2">
            {question.options.map((opt, i) => (
              <label
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800/50 cursor-pointer transition-all group"
                onClick={(e) => {
                  e.preventDefault()
                  const updated = selectedArr.includes(opt)
                    ? selectedArr.filter(v => v !== opt)
                    : [...selectedArr, opt]
                  onChange(updated)
                }}
              >
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                  selectedArr.includes(opt) ? 'border-cyan-500 bg-cyan-500' : 'border-gray-300 dark:border-neutral-600 group-hover:border-cyan-400'
                }`}>
                  {selectedArr.includes(opt) && <FaCheck className="text-[10px] text-white" />}
                </div>
                <span className="text-gray-700 dark:text-neutral-300">{opt}</span>
              </label>
            ))}
          </div>
        )
      }

      case 'dropdown':
        return <CustomDropdown value={value} options={question.options} onChange={onChange} />

      case 'linear-scale': {
        const config = question.scaleConfig || { min: 1, max: 5, minLabel: '', maxLabel: '' }
        const range = Array.from({ length: config.max - config.min + 1 }, (_, i) => config.min + i)
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              {config.minLabel && <span className="text-sm text-gray-500 dark:text-neutral-400">{config.minLabel}</span>}
              <div className="flex gap-2 flex-wrap justify-center flex-1">
                {range.map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => onChange(n)}
                    className={`w-10 h-10 rounded-xl border-2 font-medium transition-all ${
                      value === n
                        ? 'border-cyan-500 bg-cyan-500 text-white'
                        : 'border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-neutral-400 hover:border-cyan-400'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              {config.maxLabel && <span className="text-sm text-gray-500 dark:text-neutral-400">{config.maxLabel}</span>}
            </div>
          </div>
        )
      }

      case 'rating': {
        const max = question.ratingMax || 5
        return (
          <div className="flex gap-1">
            {Array.from({ length: max }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                type="button"
                onClick={() => onChange(n)}
                className="p-1 transition-transform hover:scale-110"
              >
                <FaStar className={`text-2xl ${
                  n <= (value || 0) ? 'text-amber-400' : 'text-gray-300 dark:text-neutral-600'
                }`} />
              </button>
            ))}
          </div>
        )
      }

      case 'date':
        return (
          <input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={`${inputClasses} date-input-styled`}
          />
        )

      case 'time':
        return <input type="time" value={value || ''} onChange={(e) => onChange(e.target.value)} className={inputClasses} />

      case 'file-upload':
        return <FileUploadField onChange={onChange} />

      default:
        return <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} className={inputClasses} placeholder="Your answer" />
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-1">
        <label className="block text-sm font-semibold text-gray-700 dark:text-neutral-200">{question.title}</label>
        {question.required && <span className="text-red-500 text-sm">*</span>}
      </div>
      {question.description && <p className="text-xs text-gray-500 dark:text-neutral-400 -mt-1">{question.description}</p>}
      {renderField()}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

// ============================================
// CUSTOM DROPDOWN COMPONENT
// ============================================

function CustomDropdown({ value, options, onChange }: { value: any; options: string[]; onChange: (val: string) => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all text-left flex items-center justify-between"
      >
        <span className={value ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-neutral-500'}>
          {value || 'Select an option'}
        </span>
        <FaChevronDown className={`text-gray-400 text-sm transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-2 w-full rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-xl max-h-60 overflow-y-auto"
          >
            {options.map((opt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { onChange(opt); setIsOpen(false) }}
                className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-cyan-50 dark:hover:bg-cyan-900/20 ${
                  value === opt
                    ? 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 font-medium'
                    : 'text-gray-700 dark:text-neutral-300'
                } ${i === 0 ? 'rounded-t-xl' : ''} ${i === options.length - 1 ? 'rounded-b-xl' : ''}`}
              >
                {opt}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function ApplicationForm({ roleId }: ApplicationFormProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()
  const { profile } = useProfile()
  const formRef = useRef<HTMLDivElement>(null)
  const [role, setRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [uploadedResumeURL, setUploadedResumeURL] = useState('')
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [resumeFileName, setResumeFileName] = useState('')
  const [uploadError, setUploadError] = useState('')
  const resumeInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    college: '',
    yearOrExperience: '',
  })

  // Pre-fill from profile data, then fall back to auth data
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || profile?.fullName || user.displayName || '',
        email: prev.email || user.email || '',
        phone: prev.phone || profile?.phone || '',
        college: prev.college || profile?.college || '',
        yearOrExperience: prev.yearOrExperience || profile?.year || '',
      }))
    }
  }, [user, profile])

  const [customAnswers, setCustomAnswers] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const questions = normalizeQuestions(role?.customQuestions)

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

  // Auto-open form when user returns from login
  useEffect(() => {
    if (user && role && !showForm) {
      setShowForm(true)
      setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, role])

  const handleApplyClick = () => {
    if (!user) {
      toast.info('Please sign in to apply for this role')
      router.push(`/auth?returnUrl=${encodeURIComponent(pathname)}`)
      return
    }
    setShowForm(true)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
  }

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== 'application/pdf') { toast.error('Please upload a PDF file'); return }
      if (file.size > 5 * 1024 * 1024) { toast.error('File size must be less than 5MB'); return }
      setResumeFile(file)
      setResumeFileName(file.name)
      setUploadError('')
      setUploadedResumeURL('')
      if (errors.resume) setErrors(prev => ({ ...prev, resume: '' }))
      // Start uploading immediately
      uploadResumeImmediately(file)
    }
  }

  const uploadResumeImmediately = (file: File) => {
    if (!user) {
      toast.error('You must be signed in to upload a resume')
      setUploadError('Authentication required. Please sign in.')
      return
    }

    setUploading(true)
    setUploadProgress(0)
    setUploadError('')

    const fileName = `${roleId}_${Date.now()}_${file.name}`
    const storageRef = ref(storage, `resumes/${fileName}`)
    const metadata = { contentType: 'application/pdf' }

    // Timeout: if no progress after 15s, show error
    let hasProgress = false
    const timeoutId = setTimeout(() => {
      if (!hasProgress) {
        console.error('Upload timeout - no progress after 15s. Likely a CORS or rules issue.')
        setUploading(false)
        setUploadProgress(0)
        setUploadError('Upload timed out. This may be a server configuration issue. Please try again or contact support.')
        toast.error('Upload timed out. Please try again.')
        try { uploadTask.cancel() } catch (_) {}
      }
    }, 15000)

    const uploadTask = uploadBytesResumable(storageRef, file, metadata)

    uploadTask.on('state_changed',
      (snapshot) => {
        hasProgress = true
        clearTimeout(timeoutId)
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        setUploadProgress(progress)
        console.log(`Upload progress: ${Math.round(progress)}%`)
      },
      (error: any) => {
        clearTimeout(timeoutId)
        console.error('Upload error:', error?.code, error?.message, error)
        setUploading(false)
        setUploadProgress(0)
        
        let errorMsg = 'Upload failed. Please try again.'
        if (error?.code === 'storage/unauthorized') {
          errorMsg = 'Permission denied. Please make sure you are signed in.'
        } else if (error?.code === 'storage/canceled') {
          errorMsg = 'Upload was cancelled.'
        } else if (error?.code === 'storage/retry-limit-exceeded') {
          errorMsg = 'Upload failed after multiple retries. Check your connection.'
        }
        
        setUploadError(errorMsg)
        toast.error(errorMsg)
      },
      async () => {
        clearTimeout(timeoutId)
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref)
          setUploadedResumeURL(url)
          setUploading(false)
          setUploadProgress(100)
          toast.success('Resume uploaded successfully!')
        } catch (err) {
          console.error('getDownloadURL error:', err)
          setUploading(false)
          setUploadProgress(0)
          setUploadError('Failed to process upload. Please try again.')
          toast.error('Failed to process resume. Please try again.')
        }
      }
    )
  }

  const removeResume = () => {
    setResumeFile(null)
    setResumeFileName('')
    setUploadedResumeURL('')
    setUploadProgress(0)
    setUploadError('')
    setUploading(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
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
    if (role?.requireResume && !resumeFile) newErrors.resume = 'Resume is required'
    if (role?.requireResume && resumeFile && !uploadedResumeURL) newErrors.resume = 'Please wait for resume upload to complete'

    questions.forEach((q) => {
      if (q.required) {
        const val = customAnswers[q.id]
        if (!val || (typeof val === 'string' && !val.trim()) || (Array.isArray(val) && val.length === 0)) {
          newErrors[`q_${q.id}`] = 'This field is required'
        }
      }
      if (q.validation && q.validation.type !== 'none') {
        const val = customAnswers[q.id]
        if (val) {
          if (q.validation.type === 'number') {
            const num = Number(val)
            if (isNaN(num)) newErrors[`q_${q.id}`] = q.validation.errorMessage || 'Must be a number'
            else if (q.validation.min !== undefined && num < q.validation.min) newErrors[`q_${q.id}`] = q.validation.errorMessage || `Minimum value is ${q.validation.min}`
            else if (q.validation.max !== undefined && num > q.validation.max) newErrors[`q_${q.id}`] = q.validation.errorMessage || `Maximum value is ${q.validation.max}`
          }
          if (q.validation.type === 'length') {
            if (q.validation.min !== undefined && String(val).length < q.validation.min) newErrors[`q_${q.id}`] = q.validation.errorMessage || `Minimum ${q.validation.min} characters`
            if (q.validation.max !== undefined && String(val).length > q.validation.max) newErrors[`q_${q.id}`] = q.validation.errorMessage || `Maximum ${q.validation.max} characters`
          }
          if (q.validation.type === 'regex' && q.validation.pattern) {
            if (!new RegExp(q.validation.pattern).test(String(val))) newErrors[`q_${q.id}`] = q.validation.errorMessage || 'Invalid format'
          }
        }
      }
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (uploading) { toast.error('Please wait for resume upload to finish'); return }
    if (!validate()) { toast.error('Please fill in all required fields'); return }
    setSubmitting(true)
    try {
      const formattedAnswers: Record<string, any> = {}
      questions.forEach((q) => {
        if (customAnswers[q.id] !== undefined && customAnswers[q.id] !== '') {
          formattedAnswers[q.title] = customAnswers[q.id]
        }
      })

      await addDoc(collection(db, 'applications'), {
        ...formData,
        roleId,
        roleTitle: role?.title,
        userId: user?.uid || '',
        resumeURL: uploadedResumeURL || '',
        resumeFileName: resumeFileName || '',
        customAnswers: formattedAnswers,
        status: 'pending',
        submittedAt: Timestamp.now(),
      })

      setSubmitted(true)
      toast.success('Application submitted successfully!')
      setTimeout(() => router.push('/careers'), 4000)
    } catch (error) {
      console.error('Error submitting application:', error)
      toast.error('Failed to submit application. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!role) return null

  if (submitted) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-12 text-center max-w-md mx-auto">
          <FaCheckCircle className="text-6xl text-green-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Application Submitted!</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Thank you for applying for <strong>{role.title}</strong>. We&apos;ll review your application and get back to you via email.
          </p>
          <Link href="/careers"><button className="btn-primary">Back to Careers</button></Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-20 bg-gray-50 dark:bg-gray-950">
      <div className="container-custom px-4 sm:px-6 py-8 sm:py-12">
        <Link href="/careers">
          <motion.button whileHover={{ x: -5 }} className="flex items-center text-cyan-600 dark:text-cyan-400 hover:underline mb-6 select-none">
            <FaArrowLeft className="mr-2" /> Back to Careers
          </motion.button>
        </Link>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* ========== JOB DETAILS ========== */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="glass-card overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-cyan-600 to-blue-700 p-6 sm:p-8">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3">{role.title}</h1>
                <div className="flex flex-wrap gap-3 text-cyan-100 text-sm">
                  <span className="flex items-center gap-1.5 bg-white/15 px-3 py-1 rounded-full"><FaUsers className="text-xs" /> {role.team}</span>
                  <span className="flex items-center gap-1.5 bg-white/15 px-3 py-1 rounded-full"><FaMapMarkerAlt className="text-xs" /> {role.location}</span>
                  <span className="flex items-center gap-1.5 bg-white/15 px-3 py-1 rounded-full"><FaClock className="text-xs" /> {role.type}</span>
                </div>
              </div>

              {/* Details */}
              <div className="p-6 sm:p-8 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">About This Role</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">{role.description}</p>
                </div>

                {role.responsibilities && role.responsibilities.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Responsibilities</h3>
                    <ul className="space-y-2">
                      {role.responsibilities.map((resp, i) => (
                        <li key={i} className="flex items-start gap-3 text-gray-600 dark:text-gray-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2 flex-shrink-0" />
                          {resp}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {role.eligibility && role.eligibility.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Requirements & Eligibility</h3>
                    <ul className="space-y-2">
                      {role.eligibility.map((elig, i) => (
                        <li key={i} className="flex items-start gap-3 text-gray-600 dark:text-gray-400">
                          <FaCheck className="text-emerald-500 mt-1 flex-shrink-0 text-sm" />
                          {elig}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {!showForm && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="pt-4 border-t border-gray-200 dark:border-neutral-800">
                    <button
                      onClick={handleApplyClick}
                      className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-cyan-500/30 transition-all duration-300 flex items-center justify-center gap-2 group"
                    >
                      {user ? 'Apply Now' : 'Sign in & Apply'} <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    <p className="text-xs text-gray-500 dark:text-neutral-500 mt-3">
                      {user ? 'Click to fill out the application form' : 'You need to sign in before applying'}
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>

          {/* ========== APPLICATION FORM ========== */}
          <AnimatePresence>
            {showForm && (
              <motion.div ref={formRef} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }} transition={{ duration: 0.4 }} className="glass-card p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Application Form</h2>
                <p className="text-gray-500 dark:text-neutral-400 text-sm mb-6">
                  Fill in your details below to apply for <strong className="text-gray-700 dark:text-neutral-200">{role.title}</strong>
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Section 1: Personal Details */}
                  <div className="space-y-1 mb-2">
                    <h3 className="text-base font-semibold text-gray-800 dark:text-neutral-200 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-500 flex items-center justify-center text-xs font-bold">1</span>
                      Personal Details
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-neutral-300 mb-1.5">Full Name <span className="text-red-500">*</span></label>
                      <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                        placeholder="Enter your full name" />
                      {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-neutral-300 mb-1.5">Email Address <span className="text-red-500">*</span></label>
                      <input type="email" name="email" value={formData.email} onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                        placeholder="your.email@example.com" />
                      {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-neutral-300 mb-1.5">Phone Number <span className="text-red-500">*</span></label>
                      <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                        placeholder="1234567890" />
                      {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-neutral-300 mb-1.5">College / Organization <span className="text-red-500">*</span></label>
                      <input type="text" name="college" value={formData.college} onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                        placeholder="Your institution name" />
                      {errors.college && <p className="text-red-500 text-xs mt-1">{errors.college}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-neutral-300 mb-1.5">Year / Experience <span className="text-red-500">*</span></label>
                    <input type="text" name="yearOrExperience" value={formData.yearOrExperience} onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                      placeholder="e.g., 3rd Year B.Tech or 2 years experience" />
                    {errors.yearOrExperience && <p className="text-red-500 text-xs mt-1">{errors.yearOrExperience}</p>}
                  </div>

                  {/* Section 2: Resume Upload */}
                  {role.requireResume && (
                    <>
                      <div className="space-y-1 mt-8 mb-2">
                        <h3 className="text-base font-semibold text-gray-800 dark:text-neutral-200 flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-500 flex items-center justify-center text-xs font-bold">2</span>
                          Resume Upload
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-neutral-500 ml-8">Upload your resume in PDF format (max 5MB)</p>
                      </div>
                      <div>
                        <input ref={resumeInputRef} type="file" accept=".pdf" onChange={handleResumeChange} className="hidden" />
                        {!resumeFile ? (
                          <button type="button" onClick={() => resumeInputRef.current?.click()}
                            className="w-full flex items-center justify-center gap-3 px-6 py-8 rounded-xl border-2 border-dashed border-gray-300 dark:border-neutral-600 hover:border-cyan-500 dark:hover:border-cyan-500 bg-gray-50 dark:bg-neutral-800/30 transition-all group">
                            <FaCloudUploadAlt className="text-3xl text-gray-400 group-hover:text-cyan-500 transition-colors" />
                            <div className="text-left">
                              <p className="font-semibold text-gray-700 dark:text-neutral-300 group-hover:text-cyan-500 transition-colors">Click to upload resume</p>
                              <p className="text-xs text-gray-400 dark:text-neutral-500">PDF only, max 5MB</p>
                            </div>
                          </button>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800">
                              <FaFilePdf className="text-red-500 text-xl flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{resumeFileName}</p>
                                <p className="text-xs text-gray-500 dark:text-neutral-400">{(resumeFile.size / 1024 / 1024).toFixed(2)} MB</p>
                              </div>
                              {uploadedResumeURL && (
                                <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 flex-shrink-0">
                                  <FaCheckCircle className="text-sm" /> Uploaded
                                </span>
                              )}
                              <button type="button" onClick={removeResume} disabled={uploading}
                                className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors flex-shrink-0 disabled:opacity-50">
                                <FaTimes />
                              </button>
                            </div>
                            {/* Upload Progress Bar - shown immediately on file select */}
                            {uploading && (
                              <div className="space-y-1">
                                <div className="h-2 rounded-full bg-gray-200 dark:bg-neutral-700 overflow-hidden">
                                  <motion.div
                                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${uploadProgress}%` }}
                                    transition={{ duration: 0.3 }}
                                  />
                                </div>
                                <p className="text-xs text-cyan-600 dark:text-cyan-400 font-medium">
                                  Uploading... {Math.round(uploadProgress)}%
                                </p>
                              </div>
                            )}
                            {uploadError && (
                              <div className="flex items-center justify-between">
                                <p className="text-red-500 text-xs">{uploadError}</p>
                                <button type="button" onClick={() => uploadResumeImmediately(resumeFile!)}
                                  className="text-xs text-cyan-500 hover:text-cyan-400 font-medium underline">
                                  Retry Upload
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                        {errors.resume && <p className="text-red-500 text-xs mt-1">{errors.resume}</p>}
                      </div>
                    </>
                  )}

                  {/* Section 3: Custom Questions */}
                  {questions.length > 0 && (
                    <>
                      <div className="space-y-1 mt-8 mb-2">
                        <h3 className="text-base font-semibold text-gray-800 dark:text-neutral-200 flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-500 flex items-center justify-center text-xs font-bold">{role.requireResume ? '3' : '2'}</span>
                          Additional Questions
                        </h3>
                      </div>
                      <div className="space-y-6">
                        {questions.sort((a, b) => a.order - b.order).map((q) => (
                          <QuestionField
                            key={q.id}
                            question={q}
                            value={customAnswers[q.id]}
                            onChange={(val) => {
                              setCustomAnswers(prev => ({ ...prev, [q.id]: val }))
                              if (errors[`q_${q.id}`]) setErrors(prev => ({ ...prev, [`q_${q.id}`]: '' }))
                            }}
                            error={errors[`q_${q.id}`]}
                          />
                        ))}
                      </div>
                    </>
                  )}

                  {/* Submit */}
                  <div className="pt-4 border-t border-gray-200 dark:border-neutral-800">
                    <button type="submit" disabled={submitting || uploading}
                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-cyan-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                      {submitting ? (
                        <span className="flex items-center justify-center gap-3">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Submitting...
                        </span>
                      ) : uploading ? (
                        <span className="flex items-center justify-center gap-3">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Waiting for upload...
                        </span>
                      ) : 'Submit Application'}
                    </button>
                    <p className="text-xs text-gray-500 dark:text-neutral-500 text-center mt-3">
                      By submitting, you agree to our privacy policy. We&apos;ll review your application and contact you via email.
                    </p>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
