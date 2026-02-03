'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  FaUsers, 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaGraduationCap, 
  FaUniversity,
  FaTimes,
  FaSpinner,
  FaCheckCircle
} from 'react-icons/fa'
import { toast } from 'sonner'

interface VibeCodeRegistrationFormProps {
  event: any
  ticket: any
  onClose: () => void
}

export default function VibeCodeRegistrationForm({ event, ticket, onClose }: VibeCodeRegistrationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [registrationType, setRegistrationType] = useState<'team' | 'solo' | null>(null)
  
  const [formData, setFormData] = useState({
    // Team Info
    teamName: '',
    
    // Team Leader (Member 1)
    leaderName: '',
    leaderEmail: '',
    leaderPhone: '',
    leaderCollege: '',
    leaderYear: '',
    
    // Member 2
    member2Name: '',
    member2Email: '',
    member2Phone: '',
    
    // Member 3
    member3Name: '',
    member3Email: '',
    member3Phone: '',
    
    // Member 4
    member4Name: '',
    member4Email: '',
    member4Phone: '',
    
    // Additional
    hearAboutEvent: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const validateStep1 = () => {
    if (!formData.teamName.trim()) {
      toast.error('Please enter your team name')
      return false
    }
    if (!formData.leaderName.trim()) {
      toast.error('Please enter team leader name')
      return false
    }
    if (!formData.leaderEmail.trim() || !formData.leaderEmail.includes('@')) {
      toast.error('Please enter a valid email for team leader')
      return false
    }
    if (!formData.leaderPhone.trim() || formData.leaderPhone.length < 10) {
      toast.error('Please enter a valid phone number for team leader')
      return false
    }
    if (!formData.leaderCollege.trim()) {
      toast.error('Please enter team leader college name')
      return false
    }
    if (!formData.leaderYear) {
      toast.error('Please select team leader year of study')
      return false
    }
    return true
  }

  const validateStep2 = () => {
    if (registrationType === 'team') {
      // Validate Member 2
      if (!formData.member2Name.trim()) {
        toast.error('Please enter Member 2 name')
        return false
      }
      if (!formData.member2Email.trim() || !formData.member2Email.includes('@')) {
        toast.error('Please enter a valid email for Member 2')
        return false
      }
      if (!formData.member2Phone.trim() || formData.member2Phone.length < 10) {
        toast.error('Please enter a valid phone number for Member 2')
        return false
      }
      
      // Validate Member 3
      if (!formData.member3Name.trim()) {
        toast.error('Please enter Member 3 name')
        return false
      }
      if (!formData.member3Email.trim() || !formData.member3Email.includes('@')) {
        toast.error('Please enter a valid email for Member 3')
        return false
      }
      if (!formData.member3Phone.trim() || formData.member3Phone.length < 10) {
        toast.error('Please enter a valid phone number for Member 3')
        return false
      }
      
      // Validate Member 4
      if (!formData.member4Name.trim()) {
        toast.error('Please enter Member 4 name')
        return false
      }
      if (!formData.member4Email.trim() || !formData.member4Email.includes('@')) {
        toast.error('Please enter a valid email for Member 4')
        return false
      }
      if (!formData.member4Phone.trim() || formData.member4Phone.length < 10) {
        toast.error('Please enter a valid phone number for Member 4')
        return false
      }
    }
    return true
  }

  const handleNextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2)
    }
  }

  const handlePrevStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1)
    }
  }

  const sendToGoogleSheet = async (data: any) => {
    try {
      const GOOGLE_SCRIPT_URL = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL

      if (!GOOGLE_SCRIPT_URL) {
        throw new Error('Google Script URL not configured.')
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
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateStep2()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Prepare data for Google Sheet
      const registrationData = {
        timestamp: new Date().toISOString(),
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.date,
        ticketType: ticket.name,
        ticketPrice: ticket.price,
        registrationType: registrationType,
        
        // Team Info
        teamName: formData.teamName,
        
        // Leader
        leaderName: formData.leaderName,
        leaderEmail: formData.leaderEmail,
        leaderPhone: formData.leaderPhone,
        leaderCollege: formData.leaderCollege,
        leaderYear: formData.leaderYear,
        
        // Members
        member2Name: registrationType === 'team' ? formData.member2Name : 'Solo - To Be Matched',
        member2Email: registrationType === 'team' ? formData.member2Email : '',
        member2Phone: registrationType === 'team' ? formData.member2Phone : '',
        member3Name: registrationType === 'team' ? formData.member3Name : 'Solo - To Be Matched',
        member3Email: registrationType === 'team' ? formData.member3Email : '',
        member3Phone: registrationType === 'team' ? formData.member3Phone : '',
        member4Name: registrationType === 'team' ? formData.member4Name : 'Solo - To Be Matched',
        member4Email: registrationType === 'team' ? formData.member4Email : '',
        member4Phone: registrationType === 'team' ? formData.member4Phone : '',
        
        hearAboutEvent: formData.hearAboutEvent,
        status: 'Pending Payment'
      }

      toast.info('Submitting registration...')
      await sendToGoogleSheet(registrationData)

      toast.success('Registration submitted! Redirecting to payment...')
      
      // Simulate payment redirect (in production, integrate with Razorpay)
      setTimeout(() => {
        toast.success('You will receive a payment link shortly via email.')
        onClose()
      }, 2000)

    } catch (error: any) {
      console.error('Registration error:', error)
      toast.error('Registration failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-[#0d1830] to-[#0a1525] 
                 border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/10"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-[#0d1830] to-[#0a1525] border-b border-cyan-500/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Register for VibeCode IRL</h2>
              <p className="text-cyan-400 text-sm mt-1">₹{ticket.price} per team (4 members)</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center gap-4 mt-4">
            <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-cyan-400' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                            ${currentStep >= 1 ? 'bg-cyan-500/20 border border-cyan-500' : 'bg-white/5 border border-gray-600'}`}>
                {currentStep > 1 ? <FaCheckCircle /> : '1'}
              </div>
              <span className="text-sm hidden sm:inline">Team Leader</span>
            </div>
            <div className={`flex-1 h-0.5 ${currentStep >= 2 ? 'bg-cyan-500' : 'bg-gray-600'}`} />
            <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-cyan-400' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                            ${currentStep >= 2 ? 'bg-cyan-500/20 border border-cyan-500' : 'bg-white/5 border border-gray-600'}`}>
                2
              </div>
              <span className="text-sm hidden sm:inline">Team Members</span>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Step 1: Team Leader Info */}
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Registration Type Selection */}
              {!registrationType && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">How are you registering?</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setRegistrationType('team')}
                      className="p-6 bg-white/5 border border-cyan-500/30 rounded-xl hover:bg-cyan-500/10 
                               hover:border-cyan-500 transition-all text-center group"
                    >
                      <FaUsers className="text-3xl text-cyan-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                      <h4 className="text-white font-semibold">With My Team</h4>
                      <p className="text-gray-400 text-sm mt-1">I have 4 members ready</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegistrationType('solo')}
                      className="p-6 bg-white/5 border border-cyan-500/30 rounded-xl hover:bg-cyan-500/10 
                               hover:border-cyan-500 transition-all text-center group"
                    >
                      <FaUser className="text-3xl text-cyan-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                      <h4 className="text-white font-semibold">Solo Registration</h4>
                      <p className="text-gray-400 text-sm mt-1">Match me with a team</p>
                    </button>
                  </div>
                </div>
              )}

              {registrationType && (
                <>
                  {/* Team Name */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">
                      Team Name *
                    </label>
                    <div className="relative">
                      <FaUsers className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400" />
                      <input
                        type="text"
                        name="teamName"
                        value={formData.teamName}
                        onChange={handleChange}
                        placeholder="Enter your team name"
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-cyan-500/30 rounded-xl 
                                 text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-1 
                                 focus:ring-cyan-500 transition-colors outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-cyan-500/20">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <FaUser className="text-cyan-400" />
                      Team Leader Details
                    </h3>
                  </div>

                  {/* Leader Name */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Full Name *</label>
                    <input
                      type="text"
                      name="leaderName"
                      value={formData.leaderName}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      className="w-full px-4 py-3 bg-white/5 border border-cyan-500/30 rounded-xl 
                               text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-1 
                               focus:ring-cyan-500 transition-colors outline-none"
                      required
                    />
                  </div>

                  {/* Leader Email & Phone */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-300">Email *</label>
                      <div className="relative">
                        <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400" />
                        <input
                          type="email"
                          name="leaderEmail"
                          value={formData.leaderEmail}
                          onChange={handleChange}
                          placeholder="your@email.com"
                          className="w-full pl-12 pr-4 py-3 bg-white/5 border border-cyan-500/30 rounded-xl 
                                   text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-1 
                                   focus:ring-cyan-500 transition-colors outline-none"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-300">Phone *</label>
                      <div className="relative">
                        <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400" />
                        <input
                          type="tel"
                          name="leaderPhone"
                          value={formData.leaderPhone}
                          onChange={handleChange}
                          placeholder="10-digit number"
                          className="w-full pl-12 pr-4 py-3 bg-white/5 border border-cyan-500/30 rounded-xl 
                                   text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-1 
                                   focus:ring-cyan-500 transition-colors outline-none"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Leader College & Year */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-300">College Name *</label>
                      <div className="relative">
                        <FaUniversity className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400" />
                        <input
                          type="text"
                          name="leaderCollege"
                          value={formData.leaderCollege}
                          onChange={handleChange}
                          placeholder="Your college name"
                          className="w-full pl-12 pr-4 py-3 bg-white/5 border border-cyan-500/30 rounded-xl 
                                   text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-1 
                                   focus:ring-cyan-500 transition-colors outline-none"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-300">Year of Study *</label>
                      <div className="relative">
                        <FaGraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400" />
                        <select
                          name="leaderYear"
                          value={formData.leaderYear}
                          onChange={handleChange}
                          className="w-full pl-12 pr-4 py-3 bg-white/5 border border-cyan-500/30 rounded-xl 
                                   text-white focus:border-cyan-500 focus:ring-1 
                                   focus:ring-cyan-500 transition-colors outline-none appearance-none"
                          required
                        >
                          <option value="" className="bg-[#0a1525]">Select year</option>
                          <option value="1st Year" className="bg-[#0a1525]">1st Year</option>
                          <option value="2nd Year" className="bg-[#0a1525]">2nd Year</option>
                          <option value="3rd Year" className="bg-[#0a1525]">3rd Year</option>
                          <option value="4th Year" className="bg-[#0a1525]">4th Year</option>
                          <option value="Graduate" className="bg-[#0a1525]">Graduate</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* Step 2: Team Members (only for team registration) */}
          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {registrationType === 'solo' ? (
                <div className="text-center py-8">
                  <FaCheckCircle className="text-6xl text-cyan-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">You're Almost Done!</h3>
                  <p className="text-gray-400 mb-4">
                    We'll match you with other solo participants to form a complete team of 4.
                    You'll receive team details via email before the event.
                  </p>
                  
                  {/* How did you hear about us */}
                  <div className="text-left mt-6 space-y-2">
                    <label className="block text-sm font-medium text-gray-300">How did you hear about VibeCode IRL?</label>
                    <select
                      name="hearAboutEvent"
                      value={formData.hearAboutEvent}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white/5 border border-cyan-500/30 rounded-xl 
                               text-white focus:border-cyan-500 focus:ring-1 
                               focus:ring-cyan-500 transition-colors outline-none"
                    >
                      <option value="" className="bg-[#0a1525]">Select an option</option>
                      <option value="Instagram" className="bg-[#0a1525]">Instagram</option>
                      <option value="LinkedIn" className="bg-[#0a1525]">LinkedIn</option>
                      <option value="Friends" className="bg-[#0a1525]">Friends</option>
                      <option value="College Notice" className="bg-[#0a1525]">College Notice</option>
                      <option value="Other" className="bg-[#0a1525]">Other</option>
                    </select>
                  </div>
                </div>
              ) : (
                <>
                  {/* Member 2 */}
                  <div className="space-y-4 p-4 bg-white/5 rounded-xl border border-cyan-500/20">
                    <h3 className="text-lg font-semibold text-cyan-400">Member 2</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <input
                        type="text"
                        name="member2Name"
                        value={formData.member2Name}
                        onChange={handleChange}
                        placeholder="Full Name *"
                        className="w-full px-4 py-3 bg-white/5 border border-cyan-500/30 rounded-xl 
                                 text-white placeholder-gray-500 focus:border-cyan-500 outline-none"
                        required
                      />
                      <input
                        type="email"
                        name="member2Email"
                        value={formData.member2Email}
                        onChange={handleChange}
                        placeholder="Email *"
                        className="w-full px-4 py-3 bg-white/5 border border-cyan-500/30 rounded-xl 
                                 text-white placeholder-gray-500 focus:border-cyan-500 outline-none"
                        required
                      />
                      <input
                        type="tel"
                        name="member2Phone"
                        value={formData.member2Phone}
                        onChange={handleChange}
                        placeholder="Phone *"
                        className="w-full px-4 py-3 bg-white/5 border border-cyan-500/30 rounded-xl 
                                 text-white placeholder-gray-500 focus:border-cyan-500 outline-none"
                        required
                      />
                    </div>
                  </div>

                  {/* Member 3 */}
                  <div className="space-y-4 p-4 bg-white/5 rounded-xl border border-cyan-500/20">
                    <h3 className="text-lg font-semibold text-cyan-400">Member 3</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <input
                        type="text"
                        name="member3Name"
                        value={formData.member3Name}
                        onChange={handleChange}
                        placeholder="Full Name *"
                        className="w-full px-4 py-3 bg-white/5 border border-cyan-500/30 rounded-xl 
                                 text-white placeholder-gray-500 focus:border-cyan-500 outline-none"
                        required
                      />
                      <input
                        type="email"
                        name="member3Email"
                        value={formData.member3Email}
                        onChange={handleChange}
                        placeholder="Email *"
                        className="w-full px-4 py-3 bg-white/5 border border-cyan-500/30 rounded-xl 
                                 text-white placeholder-gray-500 focus:border-cyan-500 outline-none"
                        required
                      />
                      <input
                        type="tel"
                        name="member3Phone"
                        value={formData.member3Phone}
                        onChange={handleChange}
                        placeholder="Phone *"
                        className="w-full px-4 py-3 bg-white/5 border border-cyan-500/30 rounded-xl 
                                 text-white placeholder-gray-500 focus:border-cyan-500 outline-none"
                        required
                      />
                    </div>
                  </div>

                  {/* Member 4 */}
                  <div className="space-y-4 p-4 bg-white/5 rounded-xl border border-cyan-500/20">
                    <h3 className="text-lg font-semibold text-cyan-400">Member 4</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <input
                        type="text"
                        name="member4Name"
                        value={formData.member4Name}
                        onChange={handleChange}
                        placeholder="Full Name *"
                        className="w-full px-4 py-3 bg-white/5 border border-cyan-500/30 rounded-xl 
                                 text-white placeholder-gray-500 focus:border-cyan-500 outline-none"
                        required
                      />
                      <input
                        type="email"
                        name="member4Email"
                        value={formData.member4Email}
                        onChange={handleChange}
                        placeholder="Email *"
                        className="w-full px-4 py-3 bg-white/5 border border-cyan-500/30 rounded-xl 
                                 text-white placeholder-gray-500 focus:border-cyan-500 outline-none"
                        required
                      />
                      <input
                        type="tel"
                        name="member4Phone"
                        value={formData.member4Phone}
                        onChange={handleChange}
                        placeholder="Phone *"
                        className="w-full px-4 py-3 bg-white/5 border border-cyan-500/30 rounded-xl 
                                 text-white placeholder-gray-500 focus:border-cyan-500 outline-none"
                        required
                      />
                    </div>
                  </div>

                  {/* How did you hear about us */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">How did you hear about VibeCode IRL?</label>
                    <select
                      name="hearAboutEvent"
                      value={formData.hearAboutEvent}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white/5 border border-cyan-500/30 rounded-xl 
                               text-white focus:border-cyan-500 focus:ring-1 
                               focus:ring-cyan-500 transition-colors outline-none"
                    >
                      <option value="" className="bg-[#0a1525]">Select an option</option>
                      <option value="Instagram" className="bg-[#0a1525]">Instagram</option>
                      <option value="LinkedIn" className="bg-[#0a1525]">LinkedIn</option>
                      <option value="Friends" className="bg-[#0a1525]">Friends</option>
                      <option value="College Notice" className="bg-[#0a1525]">College Notice</option>
                      <option value="Other" className="bg-[#0a1525]">Other</option>
                    </select>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-cyan-500/20">
            {currentStep === 2 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-6 py-3 border border-cyan-500/50 text-cyan-400 rounded-xl 
                         hover:bg-cyan-500/10 transition-colors"
              >
                Back
              </button>
            ) : (
              <div />
            )}
            
            {currentStep === 1 && registrationType ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl 
                         font-semibold text-white shadow-lg shadow-cyan-500/30 
                         hover:shadow-cyan-500/50 transition-all"
              >
                Next Step
              </button>
            ) : currentStep === 2 ? (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl 
                         font-semibold text-white shadow-lg shadow-cyan-500/30 
                         hover:shadow-cyan-500/50 transition-all disabled:opacity-50 
                         disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>Complete Registration &amp; Pay ₹{ticket.price}</>
                )}
              </button>
            ) : null}
          </div>

          {/* Payment Info */}
          {currentStep === 2 && (
            <div className="text-center pt-4">
              <p className="text-gray-500 text-sm">
                By clicking "Complete Registration", you'll be redirected to Razorpay to complete the payment.
              </p>
            </div>
          )}
        </form>
      </motion.div>
    </motion.div>
  )
}
