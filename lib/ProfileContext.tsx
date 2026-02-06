'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { db } from '@/lib/firebaseConfig'
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'

export interface UserProfile {
  uid: string
  fullName: string
  rollNumber: string
  phone: string
  email: string
  college: string
  year: string
  branch: string
  graduationYear?: string
  createdAt?: any
  updatedAt?: any
}

interface ProfileContextType {
  profile: UserProfile | null
  loading: boolean
  profileExists: boolean
  fetchProfile: () => Promise<void>
  createProfile: (data: Omit<UserProfile, 'uid' | 'email' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateProfile: (data: Partial<Pick<UserProfile, 'fullName' | 'phone' | 'college' | 'year' | 'branch' | 'graduationYear'>>) => Promise<void>
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

export function useProfile() {
  const context = useContext(ProfileContext)
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider')
  }
  return context
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileExists, setProfileExists] = useState(false)

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null)
      setProfileExists(false)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const docRef = doc(db, 'UserProfiles', user.uid)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile
        setProfile(data)
        setProfileExists(true)
      } else {
        setProfile(null)
        setProfileExists(false)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      setProfile(null)
      setProfileExists(false)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const createProfile = async (data: Omit<UserProfile, 'uid' | 'email' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated')

    const profileData: UserProfile = {
      ...data,
      uid: user.uid,
      email: user.email || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const docRef = doc(db, 'UserProfiles', user.uid)
    
    // Check if profile already exists to prevent duplicates
    const existing = await getDoc(docRef)
    if (existing.exists()) {
      throw new Error('Profile already exists')
    }

    await setDoc(docRef, profileData)
    setProfile({ ...profileData, createdAt: new Date(), updatedAt: new Date() })
    setProfileExists(true)
  }

  const updateProfileData = async (data: Partial<Pick<UserProfile, 'fullName' | 'phone' | 'college' | 'year' | 'branch' | 'graduationYear'>>) => {
    if (!user) throw new Error('User not authenticated')
    if (!profileExists) throw new Error('Profile does not exist')

    const docRef = doc(db, 'UserProfiles', user.uid)
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    })

    setProfile(prev => prev ? { ...prev, ...data, updatedAt: new Date() } : null)
  }

  const value: ProfileContextType = {
    profile,
    loading,
    profileExists,
    fetchProfile,
    createProfile,
    updateProfile: updateProfileData,
  }

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  )
}
