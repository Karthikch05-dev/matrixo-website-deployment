'use client'

import { useState, useEffect } from 'react'
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
  FaCopy,
  FaMobileAlt,
  FaCodeBranch,
  FaUpload,
  FaImage
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
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null)
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    rollNumber: '',
    email: '',
    phone: '',
    year: '2nd Year',
    branch: '',
    college: '',
    hasLaptop: ''
  })

  // UPI Payment details
  const UPI_ID = 'karthikchinthakindi5-1@oksbi'
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

  // Handle screenshot upload
  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file')
        return
      }
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB')
        return
      }
      setPaymentScreenshot(file)
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      toast.success('Screenshot uploaded!')
    }
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
      const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzo2lczU5Jazrh74jUXcLLB-NFjYDK7rLrqJMU-uYxFP3oOL8WhhebH9pS_6ArDagz3wQ/exec'

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
      // Don't send to Google Sheet yet - wait for payment screenshot
      toast.success('Please proceed to payment')
      
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

  const handleFinalSubmit = async () => {
    if (!paymentScreenshot) {
      toast.error('Please upload payment screenshot')
      return
    }

    setIsSubmitting(true)

    try {
      // Prepare data for Google Sheet with screenshot
      const registrationData = {
        timestamp: new Date().toISOString(),
        eventId: event.id,
        eventTitle: event.title,
        ticketType: ticket.name,
        price: ticket.price,
        
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
        paymentScreenshot: screenshotPreview || '', // Base64 image
        
        status: 'Pending Verification'
      }

      toast.info('Submitting registration...')
      await sendToGoogleSheet(registrationData)

      toast.success('Registration complete! You will receive confirmation within 24 hours.')
      
      // Close modal after short delay
      setTimeout(() => {
        onClose()
      }, 2000)

    } catch (error: any) {
      console.error('Registration error:', error)
      toast.error(error.message || 'Submission failed. Please try again.')
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
          className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm rounded-3xl overflow-y-auto"
        >
          <div className="p-6 text-center max-w-md">
            <h3 className="text-2xl font-bold text-white mb-4">Complete Payment via UPI</h3>
            
            {/* QR Code */}
            <div className="bg-white rounded-2xl p-4 mb-4 inline-block">
              <Image
                src="/images/vibecode-upi-qr.png"
                alt="UPI QR Code"
                width={200}
                height={200}
                className="mx-auto"
              />
            </div>
            
            <p className="text-gray-300 mb-4 text-sm">
              Scan the QR code or pay using the UPI ID below:
            </p>
            
            {/* UPI ID Box */}
            <div className="bg-white/10 border border-cyan-500/30 rounded-xl p-4 mb-4">
              <p className="text-gray-400 text-sm mb-2">UPI ID</p>
              <div className="flex items-center justify-center gap-3">
                <code className="text-cyan-400 text-base font-mono break-all">{UPI_ID}</code>
                <button
                  onClick={copyUpiId}
                  className="p-2 bg-cyan-500/20 hover:bg-cyan-500/30 rounded-lg transition-all flex-shrink-0"
                >
                  <FaCopy className="text-cyan-400" />
                </button>
              </div>
            </div>

            {/* Amount */}
            <div className="bg-white/10 border border-cyan-500/30 rounded-xl p-4 mb-4">
              <p className="text-gray-400 text-sm mb-1">Amount to Pay</p>
              <p className="text-3xl font-bold text-white">₹{ticket.price}</p>
            </div>

            {/* Payment Screenshot Upload */}
            <div className="mb-4">
              <p className="text-gray-300 text-sm mb-3">
                After payment, upload the screenshot:
              </p>
              <label className="relative cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotChange}
                  className="hidden"
                />
                {screenshotPreview ? (
                  <div className="relative">
                    <img 
                      src={screenshotPreview} 
                      alt="Payment Screenshot" 
                      className="w-full max-h-48 object-contain rounded-xl border border-green-500/50"
                    />
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <FaCheckCircle size={10} />
                      Uploaded
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-cyan-500/50 rounded-xl p-6 hover:bg-white/5 transition-all">
                    <FaUpload className="text-cyan-400 text-2xl mx-auto mb-2" />
                    <p className="text-cyan-400 text-sm font-medium">Click to upload screenshot</p>
                    <p className="text-gray-500 text-xs mt-1">PNG, JPG up to 5MB</p>
                  </div>
                )}
              </label>
            </div>

            <button
              onClick={handleFinalSubmit}
              disabled={!paymentScreenshot || isSubmitting}
              className={`w-full px-6 py-4 rounded-xl text-white font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${
                paymentScreenshot && !isSubmitting
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 shadow-cyan-500/30 hover:shadow-cyan-500/50' 
                  : 'bg-gray-600 cursor-not-allowed opacity-50'
              }`}
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Submitting...
                </>
              ) : paymentScreenshot ? (
                <>
                  <FaCheckCircle />
                  Submit Registration
                </>
              ) : (
                'Upload Screenshot to Continue'
              )}
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
