'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification,
  getRedirectResult,
  browserPopupRedirectResolver
} from 'firebase/auth'
import { auth, firebaseReady } from '@/lib/firebase/client'

// Set just before a Google redirect sign-in so the return trip knows to finish
// it. Without the flag we'd load the redirect resolver (and Google's auth
// iframe) on every page view.
const REDIRECT_FLAG = 'mx-auth-redirect'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName?: string) => Promise<User>
  logout: () => Promise<void>
  signInWithGoogle: () => Promise<'popup' | 'redirect'>
  resetPassword: (email: string) => Promise<void>
  resendVerificationEmail: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!firebaseReady) {
      setUser(null)
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })

    try {
      if (sessionStorage.getItem(REDIRECT_FLAG)) {
        sessionStorage.removeItem(REDIRECT_FLAG)
        getRedirectResult(auth, browserPopupRedirectResolver).catch((error) => {
          console.error('Google redirect sign-in failed:', error)
        })
      }
    } catch {
      // sessionStorage can be unavailable (private mode); nothing to resume.
    }

    return unsubscribe
  }, [])

  const signIn = async (email: string, password: string) => {
    if (!firebaseReady) throw new Error('Firebase is not configured.')
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    // Check if email is verified for email/password sign-ins
    if (!userCredential.user.emailVerified) {
      await sendEmailVerification(userCredential.user)
      await signOut(auth)
      throw { code: 'auth/email-not-verified', message: 'Please verify your email. A new verification link has been sent.' }
    }
  }

  const signUp = async (email: string, password: string, displayName?: string): Promise<User> => {
    if (!firebaseReady) throw new Error('Firebase is not configured.')
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    
    if (displayName && userCredential.user) {
      await updateProfile(userCredential.user, { displayName })
    }

    // Send email verification
    if (userCredential.user) {
      await sendEmailVerification(userCredential.user)
    }

    // Sign out until verified
    await signOut(auth)

    return userCredential.user
  }

  const logout = async () => {
    if (!firebaseReady) return
    await signOut(auth)
  }

  const signInWithGoogle = async () => {
    if (!firebaseReady) throw new Error('Firebase is not configured.')
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    const isBetaHost = typeof window !== 'undefined' && window.location.hostname === 'beta.matrixo.in'

    const redirect = async () => {
      try {
        sessionStorage.setItem(REDIRECT_FLAG, '1')
      } catch {
        // Without the flag the redirect still signs in; the result is just
        // picked up by onAuthStateChanged instead.
      }
      await signInWithRedirect(auth, provider, browserPopupRedirectResolver)
      return 'redirect' as const
    }

    if (isBetaHost) return redirect()

    try {
      await signInWithPopup(auth, provider, browserPopupRedirectResolver)
      return 'popup' as const
    } catch (error: any) {
      if (
        error?.code === 'auth/popup-blocked' ||
        error?.code === 'auth/web-storage-unsupported' ||
        error?.code === 'auth/operation-not-supported-in-this-environment'
      ) {
        return redirect()
      }
      throw error
    }
  }

  const resetPassword = async (email: string) => {
    if (!firebaseReady) throw new Error('Firebase is not configured.')
    await sendPasswordResetEmail(auth, email)
  }

  const resendVerificationEmail = async () => {
    if (!firebaseReady) throw new Error('Firebase is not configured.')
    // Temporarily sign in to resend - the user object needs to exist
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser)
    }
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    logout,
    signInWithGoogle,
    resetPassword,
    resendVerificationEmail
  }

  return (
    <AuthContext.Provider value={value}>
      {/* Always render children. Withholding them until `loading` flips meant the
          server produced an empty <body> (the effect below only runs on the
          client), so nothing painted until Firebase Auth had fully initialised.
          Consumers that care about the pre-resolution state read `loading` from
          this context instead. */}
      {children}
    </AuthContext.Provider>
  )
}
