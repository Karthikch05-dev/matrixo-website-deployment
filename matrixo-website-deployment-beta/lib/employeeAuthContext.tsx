'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth'
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
  updateDoc
} from 'firebase/firestore'
import { auth } from './firebaseConfig'
import { getFirestore } from 'firebase/firestore'

// Initialize Firestore
const db = getFirestore()

export interface EmployeeProfile {
  employeeId: string
  name: string
  email: string
  department: string
  designation: string
  joiningDate: string
  profileImage: string
  phone?: string
  role: 'employee' | 'admin' | 'Intern' | string
}

export interface AttendanceRecord {
  id?: string
  employeeId: string
  date: string
  timestamp: Timestamp
  status: 'P' | 'A' | 'L' | 'O' | 'H' // Present, Absent, Leave, On Duty, Holiday
  checkInTime?: string
  checkOutTime?: string
  notes?: string
  leaveStartDate?: string
  leaveEndDate?: string
  onDutyLocation?: string
  deviceInfo?: string
  ipAddress?: string
}

interface EmployeeAuthContextType {
  user: User | null
  employee: EmployeeProfile | null
  loading: boolean
  db: ReturnType<typeof getFirestore>
  signIn: (employeeId: string, password: string) => Promise<void>
  logout: () => Promise<void>
  markAttendance: (status: AttendanceRecord['status'], notes?: string, extraData?: Partial<AttendanceRecord>) => Promise<void>
  updateAttendanceNotes: (notes: string) => Promise<void>
  markLeaveRange: (startDate: string, endDate: string, notes?: string) => Promise<void>
  getAttendanceRecords: (startDate?: Date, endDate?: Date) => Promise<AttendanceRecord[]>
  getTodayAttendance: () => Promise<AttendanceRecord | null>
  calculateAttendancePercentage: (records: AttendanceRecord[]) => number
}

const EmployeeAuthContext = createContext<EmployeeAuthContextType | undefined>(undefined)

export function EmployeeAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [employee, setEmployee] = useState<EmployeeProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      if (user) {
        try {
          // Fetch employee profile from Firestore
          const employeeDoc = await getDoc(doc(db, 'Employees', user.uid))
          if (employeeDoc.exists()) {
            const data = employeeDoc.data() as EmployeeProfile
            console.log('Employee data loaded:', data)
            setEmployee(data)
          } else {
            console.log('No employee document found for user:', user.uid)
            // Try to find by email as fallback
            const employeesRef = collection(db, 'Employees')
            const q = query(employeesRef, where('email', '==', user.email))
            const querySnapshot = await getDocs(q)
            if (!querySnapshot.empty) {
              const data = querySnapshot.docs[0].data() as EmployeeProfile
              console.log('Employee found by email:', data)
              setEmployee(data)
            }
          }
        } catch (error) {
          console.error('Error fetching employee data:', error)
        }
      } else {
        setEmployee(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signIn = async (employeeId: string, password: string) => {
    // First, find the employee by employeeId to get their email
    const employeesRef = collection(db, 'Employees')
    const q = query(employeesRef, where('employeeId', '==', employeeId.trim()))
    
    console.log('Looking for employee with ID:', employeeId.trim())
    
    const querySnapshot = await getDocs(q)
    
    console.log('Query results:', querySnapshot.size, 'documents found')
    
    if (querySnapshot.empty) {
      console.error('No employee found with ID:', employeeId)
      throw new Error('Employee ID not found')
    }

    const employeeData = querySnapshot.docs[0].data() as EmployeeProfile
    console.log('Found employee:', employeeData.name, 'with email:', employeeData.email)
    
    // Sign in with email and password
    await signInWithEmailAndPassword(auth, employeeData.email, password)
  }

  const logout = async () => {
    await signOut(auth)
    setEmployee(null)
  }

  // Helper to get local date string without UTC conversion
  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const markAttendance = async (status: AttendanceRecord['status'], notes?: string, extraData?: Partial<AttendanceRecord>) => {
    if (!user || !employee) throw new Error('Not authenticated')

    const today = new Date()
    const dateString = getLocalDateString(today)
    const now = new Date()
    
    const attendanceId = `${employee.employeeId}_${dateString}`
    
    // Get device info for anti-fraud
    const deviceInfo = `${navigator.userAgent.substring(0, 100)}`
    
    const attendanceData: AttendanceRecord = {
      employeeId: employee.employeeId,
      date: dateString,
      timestamp: Timestamp.now(),
      status,
      checkInTime: now.toLocaleTimeString('en-US', { hour12: true }),
      notes: notes || '',
      deviceInfo,
      ...extraData
    }

    await setDoc(doc(db, 'attendance', attendanceId), attendanceData)
  }

  const updateAttendanceNotes = async (notes: string) => {
    if (!user || !employee) throw new Error('Not authenticated')
    
    const today = getLocalDateString(new Date())
    const attendanceId = `${employee.employeeId}_${today}`
    
    await updateDoc(doc(db, 'attendance', attendanceId), {
      notes,
      lastUpdated: Timestamp.now()
    })
  }

  const markLeaveRange = async (startDate: string, endDate: string, notes?: string) => {
    if (!user || !employee) throw new Error('Not authenticated')
    
    const start = new Date(startDate)
    const end = new Date(endDate)
    const deviceInfo = `${navigator.userAgent.substring(0, 100)}`
    
    // Mark leave for each day in the range
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateString = getLocalDateString(d)
      const attendanceId = `${employee.employeeId}_${dateString}`
      
      const attendanceData: AttendanceRecord = {
        employeeId: employee.employeeId,
        date: dateString,
        timestamp: Timestamp.now(),
        status: 'L',
        notes: notes || '',
        leaveStartDate: startDate,
        leaveEndDate: endDate,
        deviceInfo
      }
      
      await setDoc(doc(db, 'attendance', attendanceId), attendanceData)
    }
  }

  const getTodayAttendance = async (): Promise<AttendanceRecord | null> => {
    if (!employee) return null

    const today = getLocalDateString(new Date())
    const attendanceId = `${employee.employeeId}_${today}`
    
    const attendanceDoc = await getDoc(doc(db, 'attendance', attendanceId))
    
    if (attendanceDoc.exists()) {
      return { id: attendanceDoc.id, ...attendanceDoc.data() } as AttendanceRecord
    }
    return null
  }

  const getAttendanceRecords = async (startDate?: Date, endDate?: Date): Promise<AttendanceRecord[]> => {
    if (!employee) return []

    const attendanceRef = collection(db, 'attendance')
    // Query only by employeeId to avoid needing composite index
    const q = query(
      attendanceRef, 
      where('employeeId', '==', employee.employeeId)
    )

    const querySnapshot = await getDocs(q)
    let records = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as AttendanceRecord[]

    // Sort by date descending (client-side)
    records.sort((a, b) => b.date.localeCompare(a.date))

    // Filter by date range if provided
    if (startDate && endDate) {
      const start = getLocalDateString(startDate)
      const end = getLocalDateString(endDate)
      records = records.filter(r => r.date >= start && r.date <= end)
    }

    return records
  }

  const calculateAttendancePercentage = (records: AttendanceRecord[]): number => {
    if (records.length === 0) return 0
    const presentDays = records.filter(r => r.status === 'P' || r.status === 'O').length
    return Math.round((presentDays / records.length) * 100)
  }

  return (
    <EmployeeAuthContext.Provider value={{
      user,
      employee,
      loading,
      db,
      signIn,
      logout,
      markAttendance,
      updateAttendanceNotes,
      markLeaveRange,
      getAttendanceRecords,
      getTodayAttendance,
      calculateAttendancePercentage
    }}>
      {children}
    </EmployeeAuthContext.Provider>
  )
}

export function useEmployeeAuth() {
  const context = useContext(EmployeeAuthContext)
  if (context === undefined) {
    throw new Error('useEmployeeAuth must be used within an EmployeeAuthProvider')
  }
  return context
}

export { db }
