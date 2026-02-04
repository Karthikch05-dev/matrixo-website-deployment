'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaGraduationCap, 
  FaUniversity,
  FaTimes,
  FaSpinner,
  FaCheckCircle,
  FaGithub,
  FaLaptop,
  FaCopy,
  FaMobileAlt
} from 'react-icons/fa'
import { toast } from 'sonner'

interface VibeCodeRegistrationFormProps {
  event: any
  ticket: any
  onClose: () => void
}

export default function VibeCodeRegistrationForm({ event, ticket, onClose }: VibeCodeRegistrationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showPaymentInfo, setShowPaymentInfo] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    college: '',
    year: '',
    github: '',
    hasLaptop: ''
  })

  // UPI Payment details
  const UPI_ID = 'bhuvaneshwaripothuraju2005@oksbi'
  const UPI_PAYMENT_LINK = `upi://pay?pa=${UPI_ID}&pn=MatriXO&am=${ticket.price}&cu=INR&tn=VibeCode%20IRL%20Registration`

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase())
      setIsMobile(isMobileDevice || window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Copy UPI ID to clipboard
  const copyUpiId = () => {
    navigator.clipboard.writeText(UPI_ID)
    toast.success('UPI ID copied to clipboard!')
  }

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
    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast.error('Please enter a valid email')
      return false
    }
    if (!formData.phone.trim() || formData.phone.length < 10) {
      toast.error('Please enter a valid phone number')
      return false
    }
    if (!formData.college.trim()) {
      toast.error('Please enter your college name')
      return false
    }
    if (!formData.year) {
      toast.error('Please select your year of study')
      return false
    }
    // GitHub is optional - no validation needed
    if (!formData.hasLaptop) {
      toast.error('Please select if you have a laptop')
      return false
    }
    return true
  }

  const sendToGoogleSheet = async (data: any) => {
    try {
      const GOOGLE_SCRIPT_URL = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL

      if (!GOOGLE_SCRIPT_URL) {
        // Google Script URL not configured - skip this step and continue with payment
        console.log('Google Script URL not configured - skipping sheet registration')
        return true
      }

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

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Prepare data for Google Sheet
      const registrationData = {
        timestamp: new Date().toISOString(),
        eventId: event.id,
        eventTitle: event.title,
        ticketType: ticket.name,
        ticketPrice: ticket.price,
        
        // Participant Info
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        college: formData.college,
        year: formData.year,
        github: formData.github,
        hasLaptop: formData.hasLaptop,
        
        status: 'Pending Payment'
      }

      toast.info('Submitting registration...')
      await sendToGoogleSheet(registrationData)

      toast.success('Registration submitted!')
      
      // Handle payment based on device
      if (isMobile) {
        // On mobile, try to open UPI app
        toast.info('Opening UPI app for payment...')
        setTimeout(() => {
          window.location.href = UPI_PAYMENT_LINK
        }, 1000)
      } else {
        // On desktop, show payment info modal
        setShowPaymentInfo(true)
        setIsSubmitting(false)
      }

    } catch (error: any) {
      console.error('Registration error:', error)
      toast.error(error.message || 'Registration failed. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-b from-[#0a1525] to-[#0d1830] 
                   border border-cyan-500/30 rounded-3xl shadow-2xl shadow-cyan-500/20"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all z-10"
        >
          <FaTimes size={20} />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-b border-cyan-500/30 p-8">
          <h2 className="text-3xl font-bold text-white mb-2">Register for {event.title}</h2>
          <p className="text-gray-300">Fill in your details to secure your spot • ₹{ticket.price}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8">
          <div className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="flex items-center gap-2 text-white font-medium mb-2">
                <FaUser className="text-cyan-400" />
                Full Name
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

            {/* Email */}
            <div>
              <label className="flex items-center gap-2 text-white font-medium mb-2">
                <FaEnvelope className="text-cyan-400" />
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your.email@example.com"
                className="w-full px-4 py-3 bg-white/5 border border-cyan-500/30 rounded-xl text-white 
                         placeholder:text-gray-500 focus:outline-none focus:border-cyan-400 transition-all"
                disabled={isSubmitting}
              />
            </div>

            {/* Phone */}
            <div>
              <label className="flex items-center gap-2 text-white font-medium mb-2">
                <FaPhone className="text-cyan-400" />
                Phone Number
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

            {/* College */}
            <div>
              <label className="flex items-center gap-2 text-white font-medium mb-2">
                <FaUniversity className="text-cyan-400" />
                College/University
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

            {/* Year of  Study */}
            <div>
              <label className="flex items-center gap-2 text-white font-medium mb-2">
                <FaGraduationCap className="text-cyan-400" />
                Year of Study
              </label>
              <select
                name="year"
                value={formData.year}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/5 border border-cyan-500/30 rounded-xl text-white 
                         focus:outline-none focus:border-cyan-400 transition-all"
                disabled={isSubmitting}
              >
                <option value="" className="bg-[#0d1830]">Select Year</option>
                <option value="1st Year" className="bg-[#0d1830]">1st Year</option>
                <option value="2nd Year" className="bg-[#0d1830]">2nd Year</option>
                <option value="3rd Year" className="bg-[#0d1830]">3rd Year</option>
                <option value="4th Year" className="bg-[#0d1830]">4th Year</option>
                <option value="Graduate" className="bg-[#0d1830]">Graduate</option>
                <option value="Post Graduate" className="bg-[#0d1830]">Post Graduate</option>
              </select>
            </div>

            {/* GitHub Username */}
            <div>
              <label className="flex items-center gap-2 text-white font-medium mb-2">
                <FaGithub className="text-cyan-400" />
                GitHub Username <span className="text-gray-400 text-sm font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                name="github"
                value={formData.github}
                onChange={handleChange}
                placeholder="Your GitHub username"
                className="w-full px-4 py-3 bg-white/5 border border-cyan-500/30 rounded-xl text-white 
                         placeholder:text-gray-500 focus:outline-none focus:border-cyan-400 transition-all"
                disabled={isSubmitting}
              />
            </div>

            {/* Do you have a laptop? */}
            <div>
              <label className="flex items-center gap-2 text-white font-medium mb-3">
                <FaLaptop className="text-cyan-400" />
                Do you have a laptop?
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, hasLaptop: 'YES' })}
                  disabled={isSubmitting}
                  className={`px-6 py-4 rounded-xl font-semibold transition-all ${
                    formData.hasLaptop === 'YES'
                      ? 'bg-cyan-500 text-white border-2 border-cyan-400 shadow-lg shadow-cyan-500/30'
                      : 'bg-white/5 text-gray-300 border border-cyan-500/30 hover:bg-white/10'
                  }`}
                >
                  YES
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, hasLaptop: 'NO' })}
                  disabled={isSubmitting}
                  className={`px-6 py-4 rounded-xl font-semibold transition-all ${
                    formData.hasLaptop === 'NO'
                      ? 'bg-cyan-500 text-white border-2 border-cyan-400 shadow-lg shadow-cyan-500/30'
                      : 'bg-white/5 text-gray-300 border border-cyan-500/30 hover:bg-white/10'
                  }`}
                >
                  NO
                </button>
              </div>
              {formData.hasLaptop === 'NO' && (
                <p className="text-yellow-400 text-sm mt-2 flex items-start gap-2">
                  <span>⚠️</span>
                  <span>Please note: This is a hands-on coding workshop. A laptop is required to participate effectively.</span>
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-4 bg-white/5 border border-cyan-500/30 rounded-xl text-white 
                       font-semibold hover:bg-white/10 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl text-white 
                       font-bold shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all 
                       disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <FaCheckCircle />
                  Register & Pay ₹{ticket.price}
                </>
              )}
            </button>
          </div>

          {/* Privacy Note */}
          <p className="text-xs text-gray-500 text-center mt-6">
            By registering, you agree to our terms and conditions. Your data is secure with us.
          </p>
        </form>
      </motion.div>

      {/* Payment Info Modal for Desktop */}
      {showPaymentInfo && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm rounded-3xl"
        >
          <div className="p-8 text-center max-w-md">
            <div className="w-20 h-20 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaMobileAlt className="text-white text-3xl" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Complete Payment via UPI</h3>
            <p className="text-gray-300 mb-6">
              Open any UPI app on your phone (GPay, PhonePe, Paytm) and pay to:
            </p>
            
            {/* UPI ID Box */}
            <div className="bg-white/10 border border-cyan-500/30 rounded-xl p-4 mb-4">
              <p className="text-gray-400 text-sm mb-2">UPI ID</p>
              <div className="flex items-center justify-center gap-3">
                <code className="text-cyan-400 text-lg font-mono">{UPI_ID}</code>
                <button
                  onClick={copyUpiId}
                  className="p-2 bg-cyan-500/20 hover:bg-cyan-500/30 rounded-lg transition-all"
                >
                  <FaCopy className="text-cyan-400" />
                </button>
              </div>
            </div>

            {/* Amount */}
            <div className="bg-white/10 border border-cyan-500/30 rounded-xl p-4 mb-6">
              <p className="text-gray-400 text-sm mb-1">Amount to Pay</p>
              <p className="text-3xl font-bold text-white">₹{ticket.price}</p>
            </div>

            <p className="text-sm text-gray-400 mb-6">
              After payment, you'll receive confirmation via email within 24 hours.
            </p>

            <button
              onClick={onClose}
              className="w-full px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl text-white 
                       font-bold shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all"
            >
              Done
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
