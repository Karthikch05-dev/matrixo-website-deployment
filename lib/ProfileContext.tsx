'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { db } from '@/lib/firebaseConfig'
import { doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore'

export interface PrivacySettings {
  showEmail: boolean
  showPhone: boolean
  showCollege: boolean
  showYear: boolean
  showBranch: boolean
  showRollNumber: boolean
  showSkillDNA: boolean
  profileVisibility: 'public' | 'private' | 'request'
}

export const DEFAULT_PRIVACY: PrivacySettings = {
  showEmail: false,
  showPhone: false,
  showCollege: true,
  showYear: true,
  showBranch: true,
  showRollNumber: false,
  showSkillDNA: true,
  profileVisibility: 'public',
}

export interface UserProfile {
  uid: string
  username: string
  fullName: string
  rollNumber: string
  phone: string
  email: string
  college: string
  collegeId?: string
  country?: string
  state?: string
  district?: string
  year: string
  branch: string
  graduationYear?: string
  profilePhoto?: string
  coverPhoto?: string
  bio?: string
  linkedin?: string
  github?: string
  portfolio?: string
  privacy: PrivacySettings
  createdAt?: any
  updatedAt?: any
}

interface ProfileContextType {
  profile: UserProfile | null
  loading: boolean
  profileExists: boolean
  fetchProfile: () => Promise<void>
  createProfile: (data: Omit<UserProfile, 'uid' | 'email' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateProfile: (data: Partial<Omit<UserProfile, 'uid' | 'email' | 'createdAt' | 'updatedAt' | 'username' | 'rollNumber'>>) => Promise<void>
  setUsername: (username: string) => Promise<void>
  checkUsernameAvailable: (username: string) => Promise<boolean>
  getProfileByUsername: (username: string) => Promise<UserProfile | null>
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

    // Verify username is still available
    const usernameAvailable = await checkUsernameAvailable(data.username)
    if (!usernameAvailable) {
      throw new Error('Username is already taken')
    }

    // Explicitly construct Firestore document payload with guaranteed required fields
    const rawProfileData: Record<string, any> = {
      uid: user.uid,
      email: user.email || '',
      username: data.username,
      fullName: data.fullName,
      rollNumber: data.rollNumber,
      phone: data.phone,
      college: data.college,
      year: data.year,
      branch: data.branch,
      privacy: data.privacy || DEFAULT_PRIVACY,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    // Required location fields when provided
    if (data.collegeId) rawProfileData.collegeId = data.collegeId
    if (data.country) rawProfileData.country = data.country
    if (data.state) rawProfileData.state = data.state
    if (data.district) rawProfileData.district = data.district

    // Optional fields: only attach when defined and non-empty
    if (data.profilePhoto) rawProfileData.profilePhoto = data.profilePhoto
    if (data.coverPhoto) rawProfileData.coverPhoto = data.coverPhoto
    if (data.bio) rawProfileData.bio = data.bio
    if (data.graduationYear) rawProfileData.graduationYear = data.graduationYear
    if (data.linkedin) rawProfileData.linkedin = data.linkedin
    if (data.github) rawProfileData.github = data.github
    if (data.portfolio) rawProfileData.portfolio = data.portfolio

    // Omit any undefined values so setDoc never encounters unsupported undefined
    const profileData = Object.fromEntries(
      Object.entries(rawProfileData).filter(([_, v]) => v !== undefined)
    ) as unknown as UserProfile

    const docRef = doc(db, 'UserProfiles', user.uid)
    
    // Check if profile already exists to prevent duplicates
    const existing = await getDoc(docRef)
    if (existing.exists()) {
      throw new Error('Profile already exists')
    }

    await setDoc(docRef, profileData)

    // Also store username mapping for quick lookups
    const usernameRef = doc(db, 'Usernames', data.username.toLowerCase())
    await setDoc(usernameRef, { uid: user.uid, username: data.username.toLowerCase() })

    setProfile({ ...profileData, createdAt: new Date(), updatedAt: new Date() })
    setProfileExists(true)
  }

  const updateProfileData = async (data: Partial<Omit<UserProfile, 'uid' | 'email' | 'createdAt' | 'updatedAt' | 'username' | 'rollNumber'>>) => {
    if (!user) throw new Error('User not authenticated')
    if (!profileExists) throw new Error('Profile does not exist')

    // Omit any undefined values so updateDoc never encounters unsupported undefined
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    )

    const docRef = doc(db, 'UserProfiles', user.uid)
    await updateDoc(docRef, {
      ...cleanData,
      updatedAt: serverTimestamp(),
    })

    setProfile(prev => prev ? { ...prev, ...cleanData, updatedAt: new Date() } : null)
  }

  const setUsername = async (username: string) => {
    if (!user) throw new Error('User not authenticated')
    if (!profileExists) throw new Error('Profile does not exist')
    if (!username || username.length < 3) throw new Error('Username must be at least 3 characters')
    if (!/^[a-z0-9_]+$/.test(username)) throw new Error('Only lowercase letters, numbers, and underscores')

    const available = await checkUsernameAvailable(username)
    if (!available) throw new Error('Username is already taken')

    // Delete old username mapping if user had one
    if (profile?.username && profile.username.toLowerCase() !== username.toLowerCase()) {
      try {
        const oldRef = doc(db, 'Usernames', profile.username.toLowerCase())
        await deleteDoc(oldRef)
      } catch (e) {
        console.warn('Failed to delete old username mapping:', e)
      }
    }

    const docRef = doc(db, 'UserProfiles', user.uid)
    await updateDoc(docRef, { username: username.toLowerCase(), updatedAt: serverTimestamp() })

    // Store new username mapping
    const usernameRef = doc(db, 'Usernames', username.toLowerCase())
    await setDoc(usernameRef, { uid: user.uid, username: username.toLowerCase() })

    setProfile(prev => prev ? { ...prev, username: username.toLowerCase(), updatedAt: new Date() } : null)
  }

  const checkUsernameAvailable = async (username: string): Promise<boolean> => {
    if (!username || username.length < 3) return false
    const usernameRef = doc(db, 'Usernames', username.toLowerCase())
    const snap = await getDoc(usernameRef)
    if (!snap.exists()) return true
    // If current user owns it, it's "available" to them
    if (user && snap.data()?.uid === user.uid) return true
    return false
  }

  const getProfileByUsername = async (username: string): Promise<UserProfile | null> => {
    try {
      const usernameRef = doc(db, 'Usernames', username.toLowerCase())
      const usernameSnap = await getDoc(usernameRef)
      if (!usernameSnap.exists()) return null
      
      const uid = usernameSnap.data().uid
      const profileRef = doc(db, 'UserProfiles', uid)
      const profileSnap = await getDoc(profileRef)
      if (!profileSnap.exists()) return null
      
      return profileSnap.data() as UserProfile
    } catch {
      return null
    }
  }

  const value: ProfileContextType = {
    profile,
    loading,
    profileExists,
    fetchProfile,
    createProfile,
    updateProfile: updateProfileData,
    setUsername,
    checkUsernameAvailable,
    getProfileByUsername,
  }

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  )
}
