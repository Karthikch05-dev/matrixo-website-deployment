'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaGoogle, FaGithub, FaArrowRight, FaShieldAlt, FaBolt, FaLock, FaPhone } from 'react-icons/fa'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { toast } from 'sonner'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [formattedPhoneNumber, setFormattedPhoneNumber] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  
  const router = useRouter()
  const { signIn, signUp, signInWithGoogle, signInWithGithub, setupRecaptcha, sendPhoneOTP, verifyPhoneOTP } = useAuth()

  // Setup reCAPTCHA when phone auth is selected - only once on mount
  useEffect(() => {
    if (authMethod === 'phone' && typeof window !== 'undefined') {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        setupRecaptcha('recaptcha-container')
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [authMethod, setupRecaptcha]) // Run when authMethod or setupRecaptcha changes
  
  // Also setup when switching to phone
  useEffect(() => {
    if (authMethod === 'phone' && typeof window !== 'undefined') {
      // Check if recaptcha container exists and setup
      const container = document.getElementById('recaptcha-container')
      if (container && !window.recaptchaVerifier) {
        setTimeout(() => {
          setupRecaptcha('recaptcha-container')
        }, 100)
      }
    }
  }, [authMethod, setupRecaptcha])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isLogin) {
        await signIn(formData.email, formData.password)
        toast.success('Welcome back!')
        router.push('/')
      } else {
        if (formData.password !== formData.confirmPassword) {
          toast.error('Passwords do not match')
          setLoading(false)
          return
        }
        await signUp(formData.email, formData.password, formData.name)
        toast.success('Account created successfully!')
        router.push('/')
      }
    } catch (error: any) {
      console.error('Auth error:', error)
      if (error.code === 'auth/email-already-in-use') {
        toast.error('Email already in use')
      } else if (error.code === 'auth/weak-password') {
        toast.error('Password should be at least 6 characters')
      } else if (error.code === 'auth/invalid-email') {
        toast.error('Invalid email address')
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        toast.error('Invalid email or password')
      } else {
        toast.error(error.message || 'Authentication failed')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      await signInWithGoogle()
      toast.success('Signed in successfully!')
      router.push('/')
    } catch (error: any) {
      console.error('Google sign-in error:', error)
      setLoading(false)
      
      if (error.code === 'auth/popup-closed-by-user') {
        toast.info('Sign-in cancelled')
        return
      }
      
      if (error.code === 'auth/popup-blocked') {
        toast.error('Popup blocked! Please allow popups.')
      } else if (error.code === 'auth/unauthorized-domain') {
        toast.error('Domain not authorized in Firebase Console.')
      } else {
        toast.error('Google sign-in failed.')
      }
      return
    }
    setLoading(false)
  }

  const handleGithubSignIn = async () => {
    setLoading(true)
    try {
      await signInWithGithub()
      toast.success('Signed in successfully!')
      router.push('/')
    } catch (error: any) {
      console.error('GitHub sign-in error:', error)
      setLoading(false)
      
      if (error.code === 'auth/popup-closed-by-user') {
        toast.info('Sign-in cancelled')
        return
      }
      
      if (error.code === 'auth/popup-blocked') {
        toast.error('Popup blocked! Please allow popups.')
      } else if (error.code === 'auth/unauthorized-domain') {
        toast.error('Domain not authorized in Firebase Console.')
      } else {
        toast.error('GitHub sign-in failed.')
      }
      return
    }
    setLoading(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSendOTP = async () => {
    if (!phoneNumber) {
      toast.error('Please enter a phone number')
      return
    }

    // Format phone number to E.164 format if not already
    let formattedNumber = phoneNumber.trim()
    if (!formattedNumber.startsWith('+')) {
      // Assume Indian number if no country code
      formattedNumber = '+91' + formattedNumber.replace(/\D/g, '')
    }

    setLoading(true)
    try {
      console.log('Sending OTP to:', formattedNumber)
      await sendPhoneOTP(formattedNumber)
      setFormattedPhoneNumber(formattedNumber)
      setOtpSent(true)
      
      // Check if this is a test number
      if (formattedNumber === '+918297024365') {
        toast.success('Test number detected! Use code: 123456')
      } else {
        toast.success('OTP sent to ' + formattedNumber)
      }
    } catch (error: any) {
      console.error('Send OTP error:', error)
      if (error.code === 'auth/invalid-phone-number') {
        toast.error('Invalid phone number format')
      } else if (error.code === 'auth/too-many-requests') {
        toast.error('Too many attempts. Please try again later.')
      } else if (error.code === 'auth/quota-exceeded') {
        toast.error('SMS quota exceeded. Please try again later.')
      } else {
        toast.error(error.message || 'Failed to send OTP')
      }
      // Reset reCAPTCHA on error
      if (typeof window !== 'undefined' && window.recaptchaVerifier) {
        window.recaptchaVerifier = null
        setupRecaptcha('recaptcha-container')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 6) {
      toast.error('Please enter a valid 6-digit OTP')
      return
    }

    setLoading(true)
    try {
      await verifyPhoneOTP(otp)
      toast.success('Phone verified successfully!')
      router.push('/')
    } catch (error: any) {
      console.error('Verify OTP error:', error)
      if (error.code === 'auth/invalid-verification-code') {
        toast.error('Invalid OTP. Please try again.')
      } else if (error.code === 'auth/code-expired') {
        toast.error('OTP expired. Please request a new one.')
        setOtpSent(false)
        setOtp('')
      } else {
        toast.error(error.message || 'Failed to verify OTP')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-950 dark:via-gray-900 dark:to-black text-gray-900 dark:text-white relative overflow-hidden">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e5e5_1px,transparent_1px),linear-gradient(to_bottom,#e5e5e5_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      
      {/* Gradient Orbs */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
      <div className="absolute top-0 -right-4 w-96 h-96 bg-cyan-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />

      <div className="relative z-10 flex items-center justify-center min-h-screen px-8 py-24">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          
          {/* Left Side - Branding */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="text-left space-y-6 hidden lg:block"
          >
            <div className="space-y-4">
              <div>
                <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
                  Experience
                </h1>
                <h2 className="text-5xl font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 bg-clip-text text-transparent pb-1 leading-tight">
                  Personalized Learning
                </h2>
              </div>
              <p className="text-2xl font-light text-gray-600 dark:text-gray-300">
                Vision Platform for Next-Gen Education
              </p>
            </div>

            <div className="space-y-4 pt-8">
              <div className="flex items-start gap-4 group">
                <div className="p-3 bg-purple-500/10 rounded-xl group-hover:bg-purple-500/20 transition-colors">
                  <FaShieldAlt className="text-2xl text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Enterprise Security</h3>
                  <p className="text-gray-600 dark:text-gray-400">End-to-end encryption & data protection</p>
                </div>
              </div>

              <div className="flex items-start gap-4 group">
                <div className="p-3 bg-cyan-500/10 rounded-xl group-hover:bg-cyan-500/20 transition-colors">
                  <FaBolt className="text-2xl text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Lightning Fast</h3>
                  <p className="text-gray-600 dark:text-gray-400">Instant access to all platform features</p>
                </div>
              </div>

              <div className="flex items-start gap-4 group">
                <div className="p-3 bg-pink-500/10 rounded-xl group-hover:bg-pink-500/20 transition-colors">
                  <FaLock className="text-2xl text-pink-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Privacy First</h3>
                  <p className="text-gray-600 dark:text-gray-400">Your data, your control, always</p>
                </div>
              </div>
            </div>

            <div className="pt-8 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
              <span>Trusted by 10,000+ students</span>
              <span>•</span>
              <span>500+ institutions</span>
            </div>
          </motion.div>

          {/* Right Side - Auth Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full"
          >
            <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl border border-gray-300 dark:border-gray-800 rounded-3xl p-6 lg:p-8 shadow-2xl">
              {/* Mobile Logo */}
              <div className="lg:hidden mb-8 flex justify-center relative h-12">
                {/* Light Mode Logo (Black) */}
                <img 
                  src="/logos/logo-light.png" 
                  alt="matriXO Logo" 
                  className="h-12 w-auto object-contain dark:hidden"
                />
                {/* Dark Mode Logo (White) */}
                <img 
                  src="/logos/logo-dark.png" 
                  alt="matriXO Logo" 
                  className="h-12 w-auto object-contain hidden dark:block"
                />
              </div>

              {/* Tab Switcher */}
              <div className="flex gap-2 mb-6 p-1 bg-gray-200 dark:bg-gray-800/50 rounded-xl">
                <button
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-2.5 px-5 rounded-lg font-medium transition-all ${
                    isLogin
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-2.5 px-5 rounded-lg font-medium transition-all ${
                    !isLogin
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* OAuth Buttons */}
              <div className="space-y-2.5 mb-6">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-3 px-5 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-100 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-gray-400 border-t-gray-900 rounded-full animate-spin" />
                  ) : (
                    <>
                      <FaGoogle className="text-xl" />
                      <span>Continue with Google</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleGithubSignIn}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-3 px-5 bg-gray-800 dark:bg-gray-800 text-white rounded-xl font-semibold hover:bg-gray-700 dark:hover:bg-gray-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg border border-gray-700 dark:border-gray-700"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-gray-600 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <FaGithub className="text-xl" />
                      <span>Continue with GitHub</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-800" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white/50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-500">Or continue with</span>
                </div>
              </div>

              {/* Auth Method Toggle */}
              <div className="flex gap-2 mb-6 p-1 bg-gray-200 dark:bg-gray-800/50 rounded-xl">
                <button
                  type="button"
                  onClick={() => { setAuthMethod('email'); setOtpSent(false); setOtp(''); }}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                    authMethod === 'email'
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMethod('phone'); setOtpSent(false); setOtp(''); }}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                    authMethod === 'phone'
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <FaPhone className="text-sm" />
                  Phone
                </button>
              </div>

              {/* reCAPTCHA container (invisible) */}
              <div id="recaptcha-container"></div>

              {/* Phone Auth Form */}
              {authMethod === 'phone' ? (
                <div className="space-y-4">
                  {!otpSent ? (
                    <>
                      <div className="relative">
                        <input
                          type="tel"
                          placeholder="Phone Number (e.g., +91 9876543210)"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="w-full py-3 px-5 bg-gray-100 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSendOTP}
                        disabled={loading || !phoneNumber}
                        className="w-full py-3 px-5 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 text-white rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-purple-500/50 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                      >
                        {loading ? (
                          <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <span>Send OTP</span>
                            <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="text-center mb-4">
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          OTP sent to <span className="font-semibold text-purple-500">{formattedPhoneNumber}</span>
                        </p>
                        {formattedPhoneNumber === '+918297024365' && (
                          <p className="text-yellow-500 text-xs mt-1">
                            ⚠️ Test number - Use code: <span className="font-bold">123456</span>
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={() => { setOtpSent(false); setOtp(''); setFormattedPhoneNumber(''); }}
                          className="text-purple-500 hover:text-purple-400 text-sm mt-1"
                        >
                          Change number
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Enter 6-digit OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        maxLength={6}
                        className="w-full py-3 px-5 bg-gray-100 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 text-center text-2xl tracking-widest"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyOTP}
                        disabled={loading || otp.length < 6}
                        className="w-full py-3 px-5 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 text-white rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-purple-500/50 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                      >
                        {loading ? (
                          <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <span>Verify OTP</span>
                            <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleSendOTP}
                        disabled={loading}
                        className="w-full text-center text-purple-500 hover:text-purple-400 text-sm"
                      >
                        Resend OTP
                      </button>
                    </>
                  )}
                </div>
              ) : (
              /* Email Form */
              <form onSubmit={handleSubmit} className="space-y-4">
                <AnimatePresence mode="wait">
                  {!isLogin && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <input
                        type="text"
                        name="name"
                        placeholder="Full Name"
                        value={formData.name}
                        onChange={handleChange}
                        required={!isLogin}
                        className="w-full py-3 px-5 bg-gray-100 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full py-3 px-5 bg-gray-100 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500"
                />

                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full py-3 px-5 bg-gray-100 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500"
                />

                <AnimatePresence mode="wait">
                  {!isLogin && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <input
                        type="password"
                        name="confirmPassword"
                        placeholder="Confirm Password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required={!isLogin}
                        className="w-full py-3 px-5 bg-gray-100 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {isLogin && (
                  <div className="flex justify-end">
                    <Link href="/forgot-password" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
                      Forgot password?
                    </Link>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-5 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 text-white rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-purple-500/50 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                      <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
              )}

              <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
                By continuing, you agree to our{' '}
                <Link href="/terms" className="text-purple-500 dark:text-purple-400 hover:text-purple-600 dark:hover:text-purple-300">
                  Terms
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-purple-500 dark:text-purple-400 hover:text-purple-600 dark:hover:text-purple-300">
                  Privacy Policy
                </Link>
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}
