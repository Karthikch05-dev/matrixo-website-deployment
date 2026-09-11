'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaArrowRight, FaArrowLeft, FaCheckCircle, FaEnvelope } from 'react-icons/fa'
import Link from 'next/link'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth, firebaseReady } from '@/lib/firebaseConfig'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address.')
      return
    }

    setLoading(true)

    try {
      if (!firebaseReady || !auth) {
        toast.error('Authentication is not configured. Please try again later.')
        return
      }

      await sendPasswordResetEmail(auth, email)
      
      // We always show success to prevent email enumeration,
      // as long as there is no network/config error.
      setSuccess(true)
    } catch (error: any) {
      console.error('Password reset error:', error)
      
      // Preserve user privacy: If auth/user-not-found, still show success message
      // so attackers cannot enumerate registered emails.
      if (error.code === 'auth/user-not-found') {
        setSuccess(true)
      } else if (error.code === 'auth/invalid-email') {
        toast.error('Invalid email address format.')
      } else if (error.code === 'auth/too-many-requests') {
        toast.error('Too many requests. Please try again later.')
      } else {
        toast.error('Failed to send reset email. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-950 dark:via-gray-900 dark:to-black text-gray-900 dark:text-white relative overflow-hidden">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e5e5_1px,transparent_1px),linear-gradient(to_bottom,#e5e5e5_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      
      {/* Gradient Orbs */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
      <div className="absolute top-0 -right-4 w-96 h-96 bg-cyan-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />

      <div className="relative z-10 flex items-start sm:items-center justify-center min-h-[100dvh] px-3 sm:px-6 lg:px-8 py-[max(1rem,env(safe-area-inset-top))] sm:py-20">
        <div className="w-full max-w-md">
          
          {/* Logo */}
          <div className="mb-8 flex justify-center relative h-10 sm:h-12">
            <Link href="/">
              {/* Light Mode Logo */}
              <img 
                src="/logos/logo-light.png" 
                alt="matriXO Logo" 
                className="h-10 sm:h-12 w-auto object-contain dark:hidden"
              />
              {/* Dark Mode Logo */}
              <img 
                src="/logos/logo-dark.png" 
                alt="matriXO Logo" 
                className="h-10 sm:h-12 w-auto object-contain hidden dark:block"
              />
            </Link>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glass-card-elevated p-6 sm:p-8"
          >
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="text-center space-y-6"
                >
                  <div className="w-20 h-20 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
                    <FaCheckCircle className="text-4xl text-green-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Reset link sent!
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      If an account exists for <span className="font-semibold text-gray-900 dark:text-white">{email}</span>, a password reset link has been sent. Please check your inbox and spam folder.
                    </p>
                  </div>
                  
                  <div className="pt-4 space-y-3">
                    <button
                      onClick={() => setSuccess(false)}
                      className="w-full py-3 px-5 border border-gray-200/30 dark:border-white/[0.06] text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-white/40 dark:hover:bg-white/[0.06] transition-all"
                    >
                      Resend Email
                    </button>
                    <Link href="/auth?mode=login" className="block w-full py-3 px-5 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 text-white rounded-xl font-bold text-center hover:shadow-2xl hover:shadow-purple-500/50 transition-all transform hover:scale-[1.02] active:scale-[0.98]">
                      Back to Login
                    </Link>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Forgot Password?
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Enter your registered email address and we&apos;ll send you a password reset link.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1">
                      <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <FaEnvelope className="text-gray-400" />
                        </div>
                        <input
                          id="email"
                          type="email"
                          name="email"
                          placeholder="student@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          autoComplete="email"
                          className="w-full py-3 pl-11 pr-5 glass-input placeholder-gray-400 dark:placeholder-gray-500"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !email}
                      className="w-full py-3 px-5 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 text-white rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-purple-500/50 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group mt-2"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <span>Send Reset Link</span>
                          <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </form>

                  <div className="mt-8 text-center">
                    <Link href="/auth?mode=login" className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors group">
                      <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                      Back to Login
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
