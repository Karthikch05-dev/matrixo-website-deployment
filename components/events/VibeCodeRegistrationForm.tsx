'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import Image from 'next/image'
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaGraduationCap,
  FaUniversity,
  FaTimes,
  FaSpinner,
  FaCheckCircle,
  FaIdCard,
  FaLaptop,
  FaLock,
  FaCodeBranch
} from 'react-icons/fa'
import { toast } from 'sonner'
import { useAuth } from '@/lib/AuthContext'
import { useRazorpayCheckout } from '@/hooks/useRazorpayCheckout'
import { getPaymentBreakdown } from '@/lib/payments'

interface VibeCodeRegistrationFormProps {
  event: any
  ticket: any
  onClose: () => void
}

export default function VibeCodeRegistrationForm({ event, ticket, onClose }: VibeCodeRegistrationFormProps) {
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasRegistered, setHasRegistered] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const closeTimerRef = useRef<number | null>(null)
  const isSubmittingRef = useRef(false)
  const { startCheckout, isProcessing } = useRazorpayCheckout()
  const breakdown = getPaymentBreakdown(ticket.price)

  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    rollNumber: '',
    email: user?.email || '',
    phone: '',
    year: '2nd Year',
    branch: '',
    college: '',
    hasLaptop: ''
  })

  useEffect(() => {
    isSubmittingRef.current = isSubmitting
  }, [isSubmitting])

  const requestClose = useCallback(() => {
    if (isSubmittingRef.current) return

    setIsOpen(false)

    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current)
    }

    closeTimerRef.current = window.setTimeout(() => {
      onClose()
    }, 220)
  }, [onClose])

  useEffect(() => {
    setMounted(true)
    setIsOpen(true)

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    const previousBodyStyles = {
      overflow: document.body.style.overflow,
      paddingRight: document.body.style.paddingRight,
      overscrollBehavior: document.body.style.overscrollBehavior,
    }
    const previousDocumentStyles = {
      overflow: document.documentElement.style.overflow,
      overscrollBehavior: document.documentElement.style.overscrollBehavior,
    }

    document.body.style.overflow = 'hidden'
    document.body.style.overscrollBehavior = 'none'
    document.documentElement.style.overflow = 'hidden'
    document.documentElement.style.overscrollBehavior = 'none'

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        requestClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current)
        closeTimerRef.current = null
      }
      document.body.style.overflow = previousBodyStyles.overflow
      document.body.style.paddingRight = previousBodyStyles.paddingRight
      document.body.style.overscrollBehavior = previousBodyStyles.overscrollBehavior
      document.documentElement.style.overflow = previousDocumentStyles.overflow
      document.documentElement.style.overscrollBehavior = previousDocumentStyles.overscrollBehavior
    }
  }, [requestClose])

  // Check if user has already registered (using localStorage)
  useEffect(() => {
    if (user?.email) {
      const registeredEmails = JSON.parse(localStorage.getItem('vibecode_registrations') || '[]')
      if (registeredEmails.includes(user.email)) {
        setHasRegistered(true)
      }
    }
  }, [user?.email])

  // Auto-fill user email when logged in
  useEffect(() => {
    if (user?.email) {
      setFormData(prev => ({
        ...prev,
        email: user.email!,
        name: user.displayName || prev.name
      }))
    }
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Please enter your name')
      return false
    }
    if (!formData.rollNumber.trim()) {
      toast.error('Please enter your roll number')
      return false
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast.error('Please enter a valid email')
      return false
    }
    if (!formData.phone.trim() || formData.phone.length < 10) {
      toast.error('Please enter a valid phone number')
      return false
    }
    if (!formData.branch) {
      toast.error('Please select your branch of study')
      return false
    }
    if (!formData.college.trim()) {
      toast.error('Please enter your college name')
      return false
    }
    if (!formData.hasLaptop) {
      toast.error('Please select if you have a laptop')
      return false
    }
    return true
  }

  const sendToGoogleSheet = async (data: any) => {
    try {
      const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxmI_1t6i0eYpNPJ3T7litVtQmPeVbuEdug_E8dXbM1lR8ucO57wxmy4iilZUZ5BwLiYA/exec'

      // Send to Google Apps Script
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      await new Promise(resolve => setTimeout(resolve, 2000))
      
      return true
    } catch (error: any) {
      // Log error but don't block registration
      console.error('Failed to save to Google Sheet:', error)
      return true
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast.error('Please login to register')
      return
    }

    if (!validateForm()) {
      return
    }

    // Check if already registered
    if (hasRegistered) {
      toast.error('You have already registered for this event!')
      return
    }

    // Double-check localStorage
    const registeredEmails = JSON.parse(localStorage.getItem('vibecode_registrations') || '[]')
    if (registeredEmails.includes(formData.email)) {
      setHasRegistered(true)
      toast.error('You have already registered for this event!')
      return
    }

    await startCheckout({
      eventId: event.id,
      ticketId: ticket.id,
      description: `${event.title} — ${ticket.name}`,
      prefill: {
        name: formData.name,
        email: formData.email,
        contact: formData.phone,
      },
      onSuccess: async (result) => {
        toast.success('Payment successful! Saving your registration…')
        await submitRegistration(result)
      },
      onFailure: (message) => toast.error(message),
      onDismiss: () => toast.info('Payment cancelled — you have not been charged.'),
    })
  }

  const submitRegistration = async (payment: {
    paymentId: string
    orderId: string
    total: number
    platformFee: number
  }) => {
    setIsSubmitting(true)

    try {
      const registrationData = {
        timestamp: new Date().toISOString(),
        eventId: event.id,
        eventTitle: event.title,
        ticketType: ticket.name,
        price: ticket.price,
        platformFee: payment.platformFee,
        amountPaid: payment.total,
        transactionCode: payment.orderId,
        razorpayPaymentId: payment.paymentId,
        razorpayOrderId: payment.orderId,

        // Participant Info
        name: formData.name,
        rollNumber: formData.rollNumber,
        email: formData.email,
        phone: formData.phone,
        college: formData.college,
        branch: formData.branch,
        year: formData.year,
        github: '', // Not collected but expected by script
        hasLaptop: formData.hasLaptop,
        // Existing sheet column for payment proof now carries the Razorpay
        // payment ID, which is the verifiable reference for the transaction.
        paymentScreenshot: payment.paymentId,

        status: 'Paid'
      }

      toast.info('Submitting registration...')

      // Send to Google Sheet (which triggers email)
      await sendToGoogleSheet(registrationData)

      // Save to localStorage to prevent duplicate registration
      const registeredEmails = JSON.parse(localStorage.getItem('vibecode_registrations') || '[]')
      if (!registeredEmails.includes(formData.email)) {
        registeredEmails.push(formData.email)
        localStorage.setItem('vibecode_registrations', JSON.stringify(registeredEmails))
      }
      setHasRegistered(true)

      toast.success('🎉 Registration Complete! Check your email at ' + formData.email + ' for confirmation.')
      
      // Close modal after delay to let user see the success message
      setTimeout(() => {
        requestClose()
      }, 3000)

    } catch (error: any) {
      console.error('Registration error:', error)
      toast.error(error.message || 'Submission failed. Please try again.')
      setIsSubmitting(false)
    }
  }

  if (!mounted) {
    return null
  }

  return (
    createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isOpen ? 1 : 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      onClick={requestClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: isOpen ? 1 : 0.95, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[700px] max-h-[90vh] overflow-y-auto bg-gradient-to-b from-[#0a1525] to-[#0d1830]
                   border border-cyan-500/30 rounded-3xl shadow-2xl shadow-cyan-500/20"
      >
        {/* Close Button */}
        <button
          onClick={requestClose}
          className="absolute top-6 right-6 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all z-10"
        >
          <FaTimes size={20} />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-b border-cyan-500/30 p-8">
          <h2 className="text-3xl font-bold text-white mb-2">Register for {event.title}</h2>
          <p className="text-gray-300">Fill in your details to secure your spot • ₹{breakdown.total}</p>
        </div>

        {/* Check if user is logged in */}
        {!user ? (
          <div className="p-8 text-center">
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8">
              <FaTimes className="mx-auto text-red-400 text-5xl mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Login Required</h3>
              <p className="text-gray-300 mb-6">
                You must be logged in to register for this event.
              </p>
              <button
                onClick={() => {
                  const currentUrl = window.location.pathname
                  window.location.href = `/auth?returnUrl=${encodeURIComponent(currentUrl)}`
                }}
                className="px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl transition-all"
              >
                Go to Login
              </button>
            </div>
          </div>
        ) : hasRegistered ? (
          <div className="p-8 text-center">
            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-8">
              <FaCheckCircle className="mx-auto text-green-400 text-5xl mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Already Registered!</h3>
              <p className="text-gray-300 mb-4">
                You have already registered for {event.title}.
              </p>
              <p className="text-cyan-300 text-sm mb-6">
                Check your email for confirmation details. If you haven't received the email, please check your spam folder or contact us.
              </p>
              <button
                onClick={requestClose}
                className="px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl transition-all"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8">
          <div className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="flex items-center gap-2 text-white font-medium mb-2">
                <FaUser className="text-cyan-400" />
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 bg-white/5 border border-cyan-500/30 rounded-xl text-white 
                         placeholder:text-gray-500 focus:outline-none focus:border-cyan-400 transition-all"
                disabled={isSubmitting}
              />
            </div>

            {/* Roll Number */}
            <div>
              <label className="flex items-center gap-2 text-white font-medium mb-2">
                <FaIdCard className="text-cyan-400" />
                Roll Number (Full Series) <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="rollNumber"
                value={formData.rollNumber}
                onChange={handleChange}
                placeholder="e.g., 22BD1A0501"
                className="w-full px-4 py-3 bg-white/5 border border-cyan-500/30 rounded-xl text-white 
                         placeholder:text-gray-500 focus:outline-none focus:border-cyan-400 transition-all"
                disabled={isSubmitting}
              />
            </div>

            {/* Email */}
            <div>
              <label className="flex items-center gap-2 text-white font-medium mb-2">
                <FaEnvelope className="text-cyan-400" />
                Email Address <span className="text-red-400">*</span>
                <span className="text-xs text-gray-400">(from your account)</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                placeholder="your.email@example.com"
                className="w-full px-4 py-3 bg-white/5 border border-cyan-500/30 rounded-xl text-white 
                         placeholder:text-gray-500 opacity-70 cursor-not-allowed"
                disabled={true}
                readOnly
              />
              <p className="text-xs text-gray-400 mt-1">Using email from your logged-in account</p>
            </div>

            {/* Phone */}
            <div>
              <label className="flex items-center gap-2 text-white font-medium mb-2">
                <FaPhone className="text-cyan-400" />
                Phone Number (Preferably WhatsApp) <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="10-digit mobile number"
                className="w-full px-4 py-3 bg-white/5 border border-cyan-500/30 rounded-xl text-white 
                         placeholder:text-gray-500 focus:outline-none focus:border-cyan-400 transition-all"
                disabled={isSubmitting}
              />
            </div>

            {/* Year of Study - Fixed to 2nd Year */}
            <div>
              <label className="flex items-center gap-2 text-white font-medium mb-2">
                <FaGraduationCap className="text-cyan-400" />
                Year of Study
              </label>
              <div className="w-full px-4 py-3 bg-cyan-500/20 border border-cyan-500/50 rounded-xl text-cyan-400 font-medium">
                2nd Year Only
              </div>
              <p className="text-xs text-gray-400 mt-1">This workshop is exclusively for 2nd year students</p>
            </div>

            {/* Branch of Study */}
            <div>
              <label className="flex items-center gap-2 text-white font-medium mb-3">
                <FaCodeBranch className="text-cyan-400" />
                Branch of Study <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {['CSE', 'CSE - AIML', 'CSE - DS', 'ECE', 'EEE', 'MECH', 'CIVIL', 'Other'].map((branch) => (
                  <button
                    key={branch}
                    type="button"
                    onClick={() => setFormData({ ...formData, branch })}
                    disabled={isSubmitting}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      formData.branch === branch
                        ? 'bg-cyan-500 text-white border-2 border-cyan-400 shadow-lg shadow-cyan-500/30'
                        : 'bg-white/5 text-gray-300 border border-cyan-500/30 hover:bg-white/10'
                    }`}
                  >
                    {branch}
                  </button>
                ))}
              </div>
            </div>

            {/* College */}
            <div>
              <label className="flex items-center gap-2 text-white font-medium mb-2">
                <FaUniversity className="text-cyan-400" />
                Name of College <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="college"
                value={formData.college}
                onChange={handleChange}
                placeholder="Your college name"
                className="w-full px-4 py-3 bg-white/5 border border-cyan-500/30 rounded-xl text-white 
                         placeholder:text-gray-500 focus:outline-none focus:border-cyan-400 transition-all"
                disabled={isSubmitting}
              />
            </div>

            {/* Do you have a laptop? */}
            <div>
              <label className="flex items-center gap-2 text-white font-medium mb-3">
                <FaLaptop className="text-cyan-400" />
                Do You Have Laptop? <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, hasLaptop: 'Yes' })}
                  disabled={isSubmitting}
                  className={`px-6 py-4 rounded-xl font-semibold transition-all ${
                    formData.hasLaptop === 'Yes'
                      ? 'bg-cyan-500 text-white border-2 border-cyan-400 shadow-lg shadow-cyan-500/30'
                      : 'bg-white/5 text-gray-300 border border-cyan-500/30 hover:bg-white/10'
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, hasLaptop: 'No' })}
                  disabled={isSubmitting}
                  className={`px-6 py-4 rounded-xl font-semibold transition-all ${
                    formData.hasLaptop === 'No'
                      ? 'bg-cyan-500 text-white border-2 border-cyan-400 shadow-lg shadow-cyan-500/30'
                      : 'bg-white/5 text-gray-300 border border-cyan-500/30 hover:bg-white/10'
                  }`}
                >
                  No
                </button>
              </div>
              {formData.hasLaptop === 'No' && (
                <p className="text-yellow-400 text-sm mt-2 flex items-start gap-2">
                  <span>⚠️</span>
                  <span>Please note: This is a hands-on coding workshop. A laptop is required to participate effectively.</span>
                </p>
              )}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="mt-8 p-5 bg-white/5 border border-cyan-500/30 rounded-2xl space-y-2">
            <div className="flex justify-between text-sm text-gray-300">
              <span>{ticket.name}</span>
              <span>₹{breakdown.basePrice}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-300">
              <span>Platform fee</span>
              <span>₹{breakdown.platformFee}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-cyan-500/20 text-lg font-bold text-white">
              <span>Total payable</span>
              <span>₹{breakdown.total}</span>
            </div>
            <p className="flex items-center justify-center gap-2 pt-1 text-xs text-gray-400">
              <FaLock className="text-green-400" />
              Secure payment via Razorpay — UPI, cards, net banking &amp; wallets
            </p>
          </div>

          {/* Submit Button */}
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={requestClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-4 bg-white/5 border border-cyan-500/30 rounded-xl text-white
                       font-semibold hover:bg-white/10 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isProcessing}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl text-white
                       font-bold shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all
                       disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting || isProcessing ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <FaCheckCircle />
                  Register &amp; Pay ₹{breakdown.total}
                </>
              )}
            </button>
          </div>

          {/* Privacy Note */}
          <p className="text-xs text-gray-500 text-center mt-6">
            By registering, you agree to our terms and conditions. Your data is secure with us.
          </p>
        </form>
        )}
      </motion.div>
    </motion.div>
    , document.body)
  )
}
