'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
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
  updateDoc,
  deleteDoc,
  onSnapshot,
  addDoc,
  writeBatch,
  Firestore
} from 'firebase/firestore'
import { auth, db } from './firebaseConfig'
import { createGlobalNotification } from './notificationUtils'

// ============================================
// TYPE DEFINITIONS
// ============================================

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
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface AttendanceRecord {
  id?: string
  employeeId: string
  date: string
  timestamp: Timestamp
  status: 'P' | 'A' | 'L' | 'O' | 'H' | 'U' | 'W' // Present, Absent, Leave, On Duty, Holiday, Unauthorised Leave, Work From Home
  checkInTime?: string
  checkOutTime?: string
  notes?: string
  leaveStartDate?: string
  leaveEndDate?: string
  onDutyLocation?: string
  deviceInfo?: string
  ipAddress?: string
  // Geolocation data
  latitude?: number
  longitude?: number
  locationAccuracy?: number
  locationVerified?: boolean
  locationAddress?: string
  // Audit trail
  modifiedBy?: string
  modifiedByName?: string
  modifiedAt?: Timestamp
  modificationReason?: string
  originalStatus?: string
  workMode?: 'WFO' | 'WFH' // Work mode at time of marking
}

export interface Holiday {
  id?: string
  date: string
  name: string
  description?: string
  type: 'public' | 'company' | 'optional'
  createdBy: string
  createdByName: string
  createdAt: Timestamp
  isAutoHoliday?: boolean // Flag for auto-generated weekend holidays
}

export interface CalendarEvent {
  id?: string
  title: string
  description?: string
  date: string
  endDate?: string
  startTime?: string
  endTime?: string
  type: 'event' | 'deadline' | 'meeting' | 'announcement'
  departmentVisibility?: 'all' | 'interns' | 'management'
  createdBy: string
  createdByName: string
  createdAt: Timestamp
  color?: string
}

export interface Task {
  id?: string
  title: string
  description: string
  status: 'todo' | 'in-progress' | 'review' | 'completed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignedTo: string[] // Employee IDs
  assignedToNames: string[]
  createdBy: string
  createdByName: string
  createdAt: Timestamp
  updatedAt: Timestamp
  editedBy?: string // Employee ID who last edited
  editedByName?: string // Name of employee who last edited
  approvalStatus?: 'pending' | 'approved' // Approval status when marked as completed
  approvedBy?: string // Employee ID who approved
  approvedByName?: string // Name of employee who approved
  dueDate?: string
  tags?: string[]
  department?: string
  specialization?: string // Intern specialization
  meetingId?: number | null // Link to meeting if created from meeting
  createdFrom?: 'portal' | 'meeting' // Source of task creation
  comments: TaskComment[]
}

export interface LeaveRequest {
  id?: string
  employeeId: string
  employeeName: string
  date: string
  subject: string
  letter: string
  reason: string
  status: 'Pending' | 'Approved' | 'Rejected'
  createdAt: Timestamp
  reviewedBy: string | null
  reviewedByName?: string | null
  reviewedAt?: Timestamp | null
}

export interface TaskComment {
  id: string
  text: string
  authorId: string
  authorName: string
  authorImage?: string
  createdAt: Timestamp
  mentions?: string[] // Employee IDs mentioned
  mentionedDepartments?: string[] // Departments mentioned
  reactions?: { [emoji: string]: string[] } // emoji -> array of employeeIds
}

export interface Discussion {
  id?: string
  content: string
  authorId: string
  authorName: string
  authorImage?: string
  authorDepartment?: string
  createdAt: Timestamp
  updatedAt?: Timestamp
  mentions: string[] // Employee IDs
  mentionedDepartments: string[]
  replies: DiscussionReply[]
  isPinned?: boolean
  reactions?: Record<string, string[]> // emoji -> array of employee IDs
}

export interface DiscussionReply {
  id: string
  content: string
  authorId: string
  authorName: string
  authorImage?: string
  createdAt: Timestamp
  updatedAt?: Timestamp
  mentions: string[]
}

// Personal Todo (private per user)
export interface PersonalTodo {
  id?: string
  title: string
  status: 'pending' | 'completed'
  dueDate?: string
  createdAt: Timestamp
  completedAt?: Timestamp
}

export interface ActivityLog {
  id?: string
  type: 'attendance' | 'profile' | 'task' | 'discussion' | 'holiday' | 'system'
  action: string
  description: string
  targetId?: string
  targetType?: string
  performedBy: string
  performedByName: string
  timestamp: Timestamp
  metadata?: Record<string, unknown>
}

// Office location for geolocation verification (configurable)
export const OFFICE_LOCATION = {
  latitude: 17.433209511638708, // Update with actual office coordinates
  longitude: 78.68535411995639,
  radiusMeters: 500, // 500 meters radius
}
// ============================================
// HELPER FUNCTIONS
// ============================================

// Calculate distance between two coordinates using Haversine formula
export function calculateDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lon2 - lon1) * Math.PI / 180

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

  return R * c // Distance in meters
}

// Check if location is within office radius
export function isLocationVerified(lat: number, lon: number): boolean {
  const distance = calculateDistance(
    lat, lon,
    OFFICE_LOCATION.latitude, OFFICE_LOCATION.longitude
  )
  return distance <= OFFICE_LOCATION.radiusMeters
}

// Get current geolocation
export function getCurrentLocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'))
      return
    }
    
    navigator.geolocation.getCurrentPosition(
      resolve,
      reject,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  })
}

// Format date to YYYY-MM-DD using local time
export function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Get today's date string
export function getTodayString(): string {
  return formatDate(new Date())
}

// ============================================
// CONTEXT TYPE
// ============================================

interface EmployeeAuthContextType {
  // Auth
  user: User | null
  employee: EmployeeProfile | null
  loading: boolean
  db: Firestore
  signIn: (employeeId: string, password: string) => Promise<void>
  logout: () => Promise<void>
  
  // Work Mode
  workMode: 'WFO' | 'WFH'
  setGlobalWorkMode: (mode: 'WFO' | 'WFH') => Promise<void>
  
  // Attendance
  markAttendance: (status: AttendanceRecord['status'], notes?: string, extraData?: Partial<AttendanceRecord>) => Promise<void>
  updateAttendanceNotes: (notes: string) => Promise<void>
  markLeaveRange: (startDate: string, endDate: string, notes?: string) => Promise<void>
  getAttendanceRecords: (startDate?: Date, endDate?: Date) => Promise<AttendanceRecord[]>
  getTodayAttendance: () => Promise<AttendanceRecord | null>
  calculateAttendancePercentage: (records: AttendanceRecord[]) => number
  markAttendanceWithLocation: (status: AttendanceRecord['status'], notes?: string, extraData?: Partial<AttendanceRecord>) => Promise<{ success: boolean; locationVerified: boolean; workFromHome?: boolean; error?: string }>
  
  // Admin Attendance
  updateEmployeeAttendance: (attendanceId: string, updates: Partial<AttendanceRecord>, reason: string) => Promise<void>
  getAllEmployeesAttendance: (startDate: string, endDate: string) => Promise<AttendanceRecord[]>
  getEmployeeAttendanceHistory: (employeeId: string, limit?: number) => Promise<AttendanceRecord[]>
  
  // Employees
  getAllEmployees: () => Promise<EmployeeProfile[]>
  getEmployeeById: (employeeId: string) => Promise<EmployeeProfile | null>
  updateEmployeeProfile: (employeeId: string, updates: Partial<EmployeeProfile>) => Promise<void>
  
  // Holidays
  holidays: Holiday[]
  addHoliday: (holiday: Omit<Holiday, 'id' | 'createdAt' | 'createdBy' | 'createdByName'>) => Promise<void>
  updateHoliday: (id: string, updates: Partial<Holiday>) => Promise<void>
  deleteHoliday: (id: string) => Promise<void>
  isHoliday: (date: string) => boolean
  
  // Calendar Events
  calendarEvents: CalendarEvent[]
  addCalendarEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'createdBy' | 'createdByName'>) => Promise<void>
  updateCalendarEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>
  deleteCalendarEvent: (id: string) => Promise<void>
  
  // Tasks
  tasks: Task[]
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'createdByName' | 'comments'>) => Promise<void>
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  approveTask: (id: string) => Promise<void>
  addTaskComment: (taskId: string, text: string, mentions?: string[], mentionedDepartments?: string[]) => Promise<void>
  deleteTaskComment: (taskId: string, commentId: string) => Promise<void>
  toggleTaskCommentReaction: (taskId: string, commentId: string, emoji: string) => Promise<void>
  
  // Discussions
  discussions: Discussion[]
  addDiscussion: (content: string, mentions?: string[], mentionedDepartments?: string[]) => Promise<void>
  updateDiscussion: (id: string, content: string) => Promise<void>
  deleteDiscussion: (id: string) => Promise<void>
  restoreDiscussion: (discussion: Discussion) => Promise<void>
  addDiscussionReply: (discussionId: string, content: string, mentions?: string[]) => Promise<void>
  updateDiscussionReply: (discussionId: string, replyId: string, content: string) => Promise<void>
  deleteDiscussionReply: (discussionId: string, replyId: string) => Promise<void>
  togglePinDiscussion: (id: string) => Promise<void>
  toggleDiscussionReaction: (discussionId: string, emoji: string) => Promise<void>
  
  // Activity Logs
  logActivity: (log: Omit<ActivityLog, 'id' | 'timestamp' | 'performedBy' | 'performedByName'>) => Promise<void>
  getActivityLogs: (employeeId?: string, limit?: number) => Promise<ActivityLog[]>
  
  // Personal Todos
  personalTodos: PersonalTodo[]
  addPersonalTodo: (title: string, dueDate?: string) => Promise<void>
  updatePersonalTodo: (id: string, updates: Partial<PersonalTodo>) => Promise<void>
  deletePersonalTodo: (id: string) => Promise<void>
  
  // Leave Requests
  leaveRequests: LeaveRequest[]
  submitLeaveRequest: (request: { date: string; subject: string; letter: string; reason: string }) => Promise<void>
  approveLeaveRequest: (requestId: string) => Promise<void>
  rejectLeaveRequest: (requestId: string) => Promise<void>
  getAllLeaveRequests: () => Promise<LeaveRequest[]>
  
  // Auto-absent
  runAutoAbsentJob: () => Promise<void>
}

const EmployeeAuthContext = createContext<EmployeeAuthContextType | undefined>(undefined)

// ============================================
// PROVIDER COMPONENT
// ============================================

export function EmployeeAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [employee, setEmployee] = useState<EmployeeProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [authReady, setAuthReady] = useState(false) // 🔥 NEW: Track if auth is initialized
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [personalTodos, setPersonalTodos] = useState<PersonalTodo[]>([])
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [workMode, setWorkMode] = useState<'WFO' | 'WFH'>('WFO')

  // ============================================
  // AUTH EFFECTS - Step 1: Initialize Firebase Auth
  // ============================================
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      
      if (!firebaseUser) {
        // User logged out - clear everything
        setEmployee(null)
        setAuthReady(true)
        setLoading(false)
        return
      }

      // User is authenticated - wait for token to propagate
      try {
        // 🔥 CRITICAL: Wait for token to be ready before Firestore access
        await firebaseUser.getIdToken(true) // Force refresh to ensure token is valid
        
        // Small delay to ensure token reaches Firestore servers
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Mark auth as ready BEFORE fetching employee data
        setAuthReady(true)
        
      } catch (error) {
        console.error('Error refreshing auth token:', error)
        setAuthReady(true) // Still mark ready to allow retry
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  // ============================================
  // EMPLOYEE DATA FETCH - Step 2: Fetch employee profile AFTER auth is ready
  // ============================================
  
  useEffect(() => {
    if (!authReady || !user) {
      setEmployee(null)
      return
    }

    // Fetch employee profile from Firestore (NOW auth token is ready)
    const fetchEmployeeData = async () => {
      try {
        // Try to get by user.uid first
        const employeeDoc = await getDoc(doc(db, 'Employees', user.uid))
        if (employeeDoc.exists()) {
          const data = employeeDoc.data() as EmployeeProfile
          setEmployee(data)
          return
        }

        // Fallback: get by email
        const employeesRef = collection(db, 'Employees')
        const q = query(employeesRef, where('email', '==', user.email))
        const querySnapshot = await getDocs(q)
        
        if (!querySnapshot.empty) {
          const data = querySnapshot.docs[0].data() as EmployeeProfile
          setEmployee(data)
        } else {
          console.warn('No employee profile found for user:', user.email)
          setEmployee(null)
        }
      } catch (error) {
        console.error('Error fetching employee data:', error)
        // Don't throw - let user stay logged in even if profile fetch fails
        setEmployee(null)
      }
    }

    fetchEmployeeData()
  }, [authReady, user]) // Run when auth becomes ready or user changes

  // ============================================
  // REALTIME SUBSCRIPTIONS - Step 3: Subscribe to Firestore ONLY when auth ready + user exists
  // ============================================
  
  // Subscribe to holidays - ONLY when authReady AND user authenticated
  useEffect(() => {
    // 🔥 CRITICAL: Don't subscribe until BOTH authReady AND user exist
    if (!authReady || !user) {
      setHolidays([])
      return
    }
    
    const unsubscribe = onSnapshot(
      collection(db, 'holidays'),
      (snapshot) => {
        const holidaysData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Holiday[]
        setHolidays(holidaysData.sort((a, b) => (a.date || '').localeCompare(b.date || '')))
      },
      (error) => console.error('Error fetching holidays:', error)
    )
    return () => unsubscribe()
  }, [authReady, user]) // 🔥 Depend on BOTH authReady AND user

  // Subscribe to calendar events - ONLY when authReady AND user authenticated
  useEffect(() => {
    if (!authReady || !user) {
      setCalendarEvents([])
      return
    }
    
    const unsubscribe = onSnapshot(
      collection(db, 'calendarEvents'),
      (snapshot) => {
        const eventsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as CalendarEvent[]
        // Sort with null checks to prevent undefined.localeCompare errors
        setCalendarEvents(eventsData.sort((a, b) => {
          const dateA = a.date || ''
          const dateB = b.date || ''
          return dateA.localeCompare(dateB)
        }))
      },
      (error) => console.error('Error fetching calendar events:', error)
    )
    return () => unsubscribe()
  }, [authReady, user]) // 🔥 Depend on BOTH authReady AND user

  // Subscribe to tasks - ONLY when authReady AND user authenticated
  useEffect(() => {
    if (!authReady || !user) {
      setTasks([])
      return
    }
    
    const unsubscribe = onSnapshot(
      collection(db, 'tasks'),
      (snapshot) => {
        const tasksData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Task[]
        setTasks(tasksData.sort((a, b) => {
          // Sort by priority first, then by date
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
          const aPriority = priorityOrder[a.priority] ?? 4
          const bPriority = priorityOrder[b.priority] ?? 4
          if (aPriority !== bPriority) return aPriority - bPriority
          return b.createdAt?.toMillis() - a.createdAt?.toMillis()
        }))
      },
      (error) => console.error('Error fetching tasks:', error)
    )
    return () => unsubscribe()
  }, [authReady, user]) // 🔥 Depend on BOTH authReady AND user

  // Subscribe to discussions - ONLY when authReady AND user authenticated
  useEffect(() => {
    if (!authReady || !user) {
      setDiscussions([])
      return
    }
    
    const unsubscribe = onSnapshot(
      collection(db, 'discussions'),
      (snapshot) => {
        const discussionsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Discussion[]
        // Sort: pinned first, then by date
        setDiscussions(discussionsData.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1
          if (!a.isPinned && b.isPinned) return 1
          return b.createdAt?.toMillis() - a.createdAt?.toMillis()
        }))
      },
      (error) => console.error('Error fetching discussions:', error)
    )
    return () => unsubscribe()
  }, [authReady, user]) // 🔥 Depend on BOTH authReady AND user

  // Subscribe to personal todos - private per user
  useEffect(() => {
    if (!authReady || !user || !employee) {
      setPersonalTodos([])
      return
    }
    
    const unsubscribe = onSnapshot(
      query(
        collection(db, 'personalTodos'),
        where('employeeId', '==', employee.employeeId)
        // Note: orderBy removed to avoid requiring composite index
        // Sorting is done client-side in the component
      ),
      (snapshot) => {
        const todosData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as PersonalTodo[]
        // Sort by createdAt descending (newest first)
        todosData.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || 0
          const bTime = b.createdAt?.toMillis?.() || 0
          return bTime - aTime
        })
        setPersonalTodos(todosData)
        console.log('Personal todos loaded:', todosData.length)
      },
      (error) => {
        console.error('Error fetching personal todos:', error)
        // Error will be visible in console - user sees empty list
      }
    )
    return () => unsubscribe()
  }, [authReady, user, employee])

  // Subscribe to leave requests
  useEffect(() => {
    if (!authReady || !user || !employee) {
      setLeaveRequests([])
      return
    }
    
    const leaveRequestsRef = collection(db, 'leaveRequests')
    // Admins see all leave requests, employees see only their own
    const q = employee.role === 'admin'
      ? query(leaveRequestsRef, orderBy('createdAt', 'desc'))
      : query(leaveRequestsRef, where('employeeId', '==', employee.employeeId))
    
    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const requestsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as LeaveRequest[]
        requestsData.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || 0
          const bTime = b.createdAt?.toMillis?.() || 0
          return bTime - aTime
        })
        setLeaveRequests(requestsData)
      },
      (error) => console.error('Error fetching leave requests:', error)
    )
    return () => unsubscribe()
  }, [authReady, user, employee])

  // Subscribe to global work mode setting
  useEffect(() => {
    if (!authReady || !user) return
    
    const unsubscribe = onSnapshot(
      doc(db, 'systemConfig', 'workMode'),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data()
          setWorkMode(data.mode === 'WFH' ? 'WFH' : 'WFO')
        } else {
          setWorkMode('WFO') // Default
        }
      },
      (error) => {
        console.error('Error fetching work mode:', error)
        setWorkMode('WFO') // Default on error
      }
    )
    return () => unsubscribe()
  }, [authReady, user])

  // ============================================
  // AUTH FUNCTIONS
  // ============================================

  const signIn = async (employeeId: string, password: string) => {
    try {
      // Step 1: Query Firestore for employee (this needs special rule - see FIRESTORE RULES below)
      const employeesRef = collection(db, 'Employees')
      const q = query(employeesRef, where('employeeId', '==', employeeId.trim()))
      const querySnapshot = await getDocs(q)
      
      if (querySnapshot.empty) {
        throw new Error('EMPLOYEE_NOT_FOUND')
      }

      const employeeData = querySnapshot.docs[0].data() as EmployeeProfile
      
      // Step 2: Sign in with Firebase Auth
      await signInWithEmailAndPassword(auth, employeeData.email, password)
      
      // onAuthStateChanged will handle the rest (setting user, fetching employee profile)
      // Don't throw Firestore permission errors here
      
    } catch (error: any) {
      // Re-throw with clearer messages
      if (error.message === 'EMPLOYEE_NOT_FOUND') {
        throw new Error('Employee ID not found')
      }
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        throw new Error('Invalid password')
      }
      if (error.code === 'auth/user-not-found') {
        throw new Error('Employee account not found')
      }
      if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many login attempts. Please try again later.')
      }
      // Don't throw Firestore permission errors - auth succeeded
      if (error.code?.startsWith('permission-denied') || error.message?.includes('insufficient permissions')) {
        console.warn('Firestore permission error during login (non-critical):', error)
        return // Auth succeeded, profile will load via onAuthStateChanged
      }
      throw error
    }
  }

  const logout = async () => {
    await signOut(auth)
    setEmployee(null)
    setAuthReady(false)
  }

  // ============================================
  // DATE & WORKING DAY HELPERS
  // ============================================

  // Helper to get local date string without UTC conversion
  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Check if a date is a working day (not weekend, not holiday)
  const isWorkingDay = (dateString: string): boolean => {
    // Check for working day override (weekend marked as working day)
    const hasWorkingDayOverride = holidays.some(h => h.date === dateString && h.name === '__WORKING_DAY__')
    
    // If there's a working day override, it's a working day regardless of weekend
    if (hasWorkingDayOverride) return true
    
    // Check if it's a holiday from database (excluding working day overrides)
    const hasHoliday = holidays.some(h => h.date === dateString && h.name !== '__WORKING_DAY__')
    if (hasHoliday) return false

    // Check if it's a weekend (only Sunday is non-working; Saturday is a working day)
    const dateParts = dateString.split('-')
    const checkDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]))
    const dayOfWeek = checkDate.getDay()
    if (dayOfWeek === 0) return false // Only Sunday is off

    return true
  }

  // ============================================
  // WORK MODE FUNCTIONS
  // ============================================

  const setGlobalWorkMode = async (mode: 'WFO' | 'WFH') => {
    if (!employee || employee.role !== 'admin') throw new Error('Unauthorized')
    await setDoc(doc(db, 'systemConfig', 'workMode'), {
      mode,
      updatedBy: employee.employeeId,
      updatedByName: employee.name,
      updatedAt: Timestamp.now()
    })
  }

  // ============================================
  // ATTENDANCE FUNCTIONS
  // ============================================

  const markAttendance = async (status: AttendanceRecord['status'], notes?: string, extraData?: Partial<AttendanceRecord>) => {
    if (!user || !employee) throw new Error('Not authenticated')

    const today = new Date()
    const dateString = getLocalDateString(today)
    const now = new Date()
    
    // 6PM cutoff: Prevent marking attendance after 6 PM (except Leave and admin modifications)
    const currentHour = now.getHours()
    if (currentHour >= 18 && status !== 'L' && status !== 'A') {
      throw new Error('Attendance marking is closed for today. The cutoff time is 6:00 PM.')
    }
    
    const attendanceId = `${employee.employeeId}_${dateString}`
    const deviceInfo = `${navigator.userAgent.substring(0, 100)}`
    
    // Delete any duplicate records for this date (cleanup)
    const attendanceRef = collection(db, 'attendance')
    const q = query(
      attendanceRef, 
      where('employeeId', '==', employee.employeeId),
      where('date', '==', dateString)
    )
    const existingDocs = await getDocs(q)
    const batch = writeBatch(db)
    existingDocs.docs.forEach(doc => {
      if (doc.id !== attendanceId) {
        batch.delete(doc.ref)
      }
    })
    
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

    // Write the new/updated attendance record
    batch.set(doc(db, 'attendance', attendanceId), attendanceData)
    await batch.commit()
    
    // Log activity
    await logActivity({
      type: 'attendance',
      action: 'mark',
      description: `Marked attendance as ${status}`,
      targetId: attendanceId,
      targetType: 'attendance'
    })
  }

  const markAttendanceWithLocation = async (
    status: AttendanceRecord['status'], 
    notes?: string, 
    extraData?: Partial<AttendanceRecord>
  ): Promise<{ success: boolean; locationVerified: boolean; workFromHome?: boolean; error?: string }> => {
    if (!user || !employee) {
      return { success: false, locationVerified: false, error: 'Not authenticated' }
    }

    try {
      // Get current location
      const position = await getCurrentLocation()
      const { latitude, longitude, accuracy } = position.coords
      
      // Check if within office radius
      const isInOffice = isLocationVerified(latitude, longitude)
      
      // Apply WFO/WFH verification matrix
      let finalStatus = status
      let locationVerified = isInOffice
      let isWorkFromHome = false

      if (status === 'P') {
        if (workMode === 'WFO') {
          // WFO: In office = Verified, Outside = Unverified
          locationVerified = isInOffice
        } else if (workMode === 'WFH') {
          if (isInOffice) {
            // WFH + In office = Verified
            locationVerified = true
          } else {
            // WFH + Outside office = Work From Home (Verified)
            finalStatus = 'W'
            locationVerified = true
            isWorkFromHome = true
          }
        }
      }
      
      // Mark attendance with location data
      await markAttendance(finalStatus, notes, {
        ...extraData,
        latitude,
        longitude,
        locationAccuracy: accuracy,
        locationVerified,
        workMode // Store the work mode at time of marking
      } as Partial<AttendanceRecord>)

      return { success: true, locationVerified, workFromHome: isWorkFromHome }
    } catch (error: unknown) {
      // If location permission denied, still allow marking but flag as unverified
      if (error instanceof GeolocationPositionError && error.code === error.PERMISSION_DENIED) {
        // In WFH mode with denied location, still mark as WFH
        const finalStatus = workMode === 'WFH' && status === 'P' ? 'W' : status
        await markAttendance(finalStatus, notes, {
          ...extraData,
          locationVerified: false,
          workMode
        } as Partial<AttendanceRecord>)
        return { 
          success: true, 
          locationVerified: false, 
          workFromHome: finalStatus === 'W',
          error: 'Location permission denied' 
        }
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, locationVerified: false, error: errorMessage }
    }
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
    const batch = writeBatch(db)
    
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
      
      batch.set(doc(db, 'attendance', attendanceId), attendanceData)
    }
    
    await batch.commit()
    
    await logActivity({
      type: 'attendance',
      action: 'leave',
      description: `Marked leave from ${startDate} to ${endDate}`,
    })
  }

  const getTodayAttendance = useCallback(async (): Promise<AttendanceRecord | null> => {
    if (!employee) return null

    const today = getLocalDateString(new Date())
    const attendanceId = `${employee.employeeId}_${today}`
    
    const attendanceDoc = await getDoc(doc(db, 'attendance', attendanceId))
    
    if (attendanceDoc.exists()) {
      return { id: attendanceDoc.id, ...attendanceDoc.data() } as AttendanceRecord
    }
    return null
  }, [employee])

  const getAttendanceRecords = useCallback(async (startDate?: Date, endDate?: Date): Promise<AttendanceRecord[]> => {
    if (!employee) return []

    const attendanceRef = collection(db, 'attendance')
    const q = query(
      attendanceRef, 
      where('employeeId', '==', employee.employeeId)
    )

    const querySnapshot = await getDocs(q)
    let records = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as AttendanceRecord[]

    // Deduplicate: keep only one record per date
    // Priority: L (Leave) > P/W/O (Present/WFH/OnDuty) > H (Holiday) > U (Unauth) > A (Absent)
    const statusPriority = (s: string) => {
      if (s === 'L') return 4
      if (s === 'P' || s === 'W' || s === 'O') return 3
      if (s === 'H') return 2
      if (s === 'U') return 1
      return 0 // 'A'
    }
    
    const recordsByDate = new Map<string, AttendanceRecord>()
    records.forEach(record => {
      const existing = recordsByDate.get(record.date)
      if (!existing) {
        recordsByDate.set(record.date, record)
      } else {
        const existingPriority = statusPriority(existing.status)
        const newPriority = statusPriority(record.status)
        
        if (newPriority > existingPriority) {
          recordsByDate.set(record.date, record)
        } else if (newPriority < existingPriority) {
          // Keep existing (higher priority)
        } else {
          // Same priority, keep the one with later timestamp
          const existingTime = existing.timestamp?.toDate?.()?.getTime?.() || 0
          const recordTime = record.timestamp?.toDate?.()?.getTime?.() || 0
          if (recordTime > existingTime) {
            recordsByDate.set(record.date, record)
          }
        }
      }
    })
    
    records = Array.from(recordsByDate.values())
    records.sort((a, b) => (b.date || '').localeCompare(a.date || ''))

    if (startDate && endDate) {
      const start = getLocalDateString(startDate)
      const end = getLocalDateString(endDate)
      records = records.filter(r => r.date >= start && r.date <= end)
    }

    return records
  }, [employee])

  const calculateAttendancePercentage = (records: AttendanceRecord[]): number => {
    if (records.length === 0) return 0
    const presentDays = records.filter(r => r.status === 'P' || r.status === 'O' || r.status === 'W').length
    return Math.round((presentDays / records.length) * 100)
  }

  // ============================================
  // ADMIN ATTENDANCE FUNCTIONS
  // ============================================

  const updateEmployeeAttendance = async (attendanceId: string, updates: Partial<AttendanceRecord>, reason: string) => {
    if (!employee || employee.role !== 'admin') throw new Error('Unauthorized')
    
    const attendanceRef = doc(db, 'attendance', attendanceId)
    const existingDoc = await getDoc(attendanceRef)
    
    if (!existingDoc.exists()) throw new Error('Attendance record not found')
    
    const originalData = existingDoc.data() as AttendanceRecord
    
    await updateDoc(attendanceRef, {
      ...updates,
      modifiedBy: employee.employeeId,
      modifiedByName: employee.name,
      modifiedAt: Timestamp.now(),
      modificationReason: reason,
      originalStatus: originalData.status
    })
    
    await logActivity({
      type: 'attendance',
      action: 'modify',
      description: `Modified attendance for ${attendanceId}: ${reason}`,
      targetId: attendanceId,
      targetType: 'attendance',
      metadata: { originalStatus: originalData.status, newStatus: updates.status }
    })
  }

  const getAllEmployeesAttendance = async (startDate: string, endDate: string): Promise<AttendanceRecord[]> => {
    const attendanceRef = collection(db, 'attendance')
    const querySnapshot = await getDocs(attendanceRef)
    
    let records = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as AttendanceRecord[]
    
    // Filter by date range
    records = records
      .filter(r => r.date && r.date >= startDate && r.date <= endDate)
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    
    // Deduplicate: keep only one record per employee per date
    // Priority: L (Leave) > P/W/O (Present/WFH/OnDuty) > H (Holiday) > U (Unauth) > A (Absent)
    const statusPriority = (s: string) => {
      if (s === 'L') return 4
      if (s === 'P' || s === 'W' || s === 'O') return 3
      if (s === 'H') return 2
      if (s === 'U') return 1
      return 0 // 'A'
    }
    
    const uniqueRecords = new Map<string, AttendanceRecord>()
    records.forEach(record => {
      const key = `${record.employeeId}_${record.date}`
      const existing = uniqueRecords.get(key)
      if (!existing) {
        uniqueRecords.set(key, record)
      } else {
        const existingPriority = statusPriority(existing.status)
        const newPriority = statusPriority(record.status)
        
        if (newPriority > existingPriority) {
          uniqueRecords.set(key, record)
        } else if (newPriority < existingPriority) {
          // Keep existing (higher priority)
        } else {
          // Same priority, keep the one with later timestamp
          const existingTime = existing.timestamp?.toDate?.()?.getTime?.() || 0
          const recordTime = record.timestamp?.toDate?.()?.getTime?.() || 0
          if (recordTime > existingTime) {
            uniqueRecords.set(key, record)
          }
        }
      }
    })
    
    return Array.from(uniqueRecords.values())
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  }

  const getEmployeeAttendanceHistory = async (employeeId: string, limit = 100): Promise<AttendanceRecord[]> => {
    const attendanceRef = collection(db, 'attendance')
    const q = query(attendanceRef, where('employeeId', '==', employeeId))
    const querySnapshot = await getDocs(q)
    
    let records = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as AttendanceRecord[]
    
    // Deduplicate: keep only one record per date
    // Priority: L (Leave) > P/W/O (Present/WFH/OnDuty) > H (Holiday) > U (Unauth) > A (Absent)
    const statusPriority = (s: string) => {
      if (s === 'L') return 4
      if (s === 'P' || s === 'W' || s === 'O') return 3
      if (s === 'H') return 2
      if (s === 'U') return 1
      return 0 // 'A'
    }
    
    const recordsByDate = new Map<string, AttendanceRecord>()
    records.forEach(record => {
      const existing = recordsByDate.get(record.date)
      if (!existing) {
        recordsByDate.set(record.date, record)
      } else {
        const existingPriority = statusPriority(existing.status)
        const newPriority = statusPriority(record.status)
        
        if (newPriority > existingPriority) {
          recordsByDate.set(record.date, record)
        } else if (newPriority < existingPriority) {
          // Keep existing (higher priority)
        } else {
          // Same priority, keep the one with later timestamp
          const existingTime = existing.timestamp?.toDate?.()?.getTime?.() || 0
          const recordTime = record.timestamp?.toDate?.()?.getTime?.() || 0
          if (recordTime > existingTime) {
            recordsByDate.set(record.date, record)
          }
        }
      }
    })
    
    records = Array.from(recordsByDate.values())
    return records.sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, limit)
  }

  // ============================================
  // EMPLOYEE FUNCTIONS
  // ============================================

  const getAllEmployees = async (): Promise<EmployeeProfile[]> => {
    console.log('🔍 getAllEmployees: Fetching from Firestore...')
    const employeesRef = collection(db, 'Employees')
    const querySnapshot = await getDocs(employeesRef)
    const allEmployees = querySnapshot.docs.map(doc => doc.data() as EmployeeProfile)
    console.log('🔍 getAllEmployees: Found', allEmployees.length, 'employees')
    allEmployees.forEach(e => {
      console.log(`   📌 ${e.name} - Role: "${e.role}" - Dept: "${e.department}"`)
    })
    return allEmployees
  }

  const getEmployeeById = async (employeeId: string): Promise<EmployeeProfile | null> => {
    const employeesRef = collection(db, 'Employees')
    const q = query(employeesRef, where('employeeId', '==', employeeId))
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) return null
    return querySnapshot.docs[0].data() as EmployeeProfile
  }

  const updateEmployeeProfile = async (employeeId: string, updates: Partial<EmployeeProfile>) => {
    if (!employee || employee.role !== 'admin') throw new Error('Unauthorized')
    
    const employeesRef = collection(db, 'Employees')
    const q = query(employeesRef, where('employeeId', '==', employeeId))
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) throw new Error('Employee not found')
    
    const docRef = querySnapshot.docs[0].ref
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    })
    
    await logActivity({
      type: 'profile',
      action: 'update',
      description: `Updated profile for ${employeeId}`,
      targetId: employeeId,
      targetType: 'employee'
    })
  }

  // ============================================
  // HOLIDAY FUNCTIONS
  // ============================================

  const isHoliday = (date: string): boolean => {
    // Check if there's a working day override (weekend marked as working day)
    const hasWorkingDayOverride = holidays.some(h => h.date === date && h.name === '__WORKING_DAY__')
    if (hasWorkingDayOverride) return false
    
    // Return true only if there's an actual holiday (not a working day override)
    return holidays.some(h => h.date === date && h.name !== '__WORKING_DAY__')
  }

  const addHoliday = async (holiday: Omit<Holiday, 'id' | 'createdAt' | 'createdBy' | 'createdByName'>) => {
    if (!employee || employee.role !== 'admin') throw new Error('Unauthorized')
    
    const holidayDoc = await addDoc(collection(db, 'holidays'), {
      ...holiday,
      createdBy: employee.employeeId,
      createdByName: employee.name,
      createdAt: Timestamp.now()
    })
    
    await logActivity({
      type: 'holiday',
      action: 'create',
      description: `Added holiday: ${holiday.name} on ${holiday.date}`,
    })

    // 🔔 GLOBAL NOTIFICATION: Holiday added
    await createGlobalNotification({
      type: 'calendar',
      action: 'created',
      title: '🏖️ Holiday Added',
      message: `${holiday.name} on ${new Date(holiday.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
      relatedEntityId: holidayDoc.id,
      targetUrl: '#calendar',
      createdBy: employee.employeeId,
      createdByName: employee.name,
      createdByRole: employee.role
    })
  }

  const updateHoliday = async (id: string, updates: Partial<Holiday>) => {
    if (!employee || employee.role !== 'admin') throw new Error('Unauthorized')
    await updateDoc(doc(db, 'holidays', id), updates)
  }

  const deleteHoliday = async (id: string) => {
    if (!employee || employee.role !== 'admin') throw new Error('Unauthorized')
    
    // Delete the holiday
    await deleteDoc(doc(db, 'holidays', id))
    
    // Delete associated notifications from userNotifications collection
    const notificationsRef = collection(db, 'userNotifications')
    const q = query(notificationsRef, where('relatedEntityId', '==', id))
    const snapshot = await getDocs(q)
    
    const deletePromises = snapshot.docs.map(docSnapshot => 
      deleteDoc(doc(db, 'userNotifications', docSnapshot.id))
    )
    
    await Promise.all(deletePromises)
  }

  // ============================================
  // CALENDAR EVENT FUNCTIONS
  // ============================================

  const addCalendarEvent = async (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'createdBy' | 'createdByName'>) => {
    if (!employee || employee.role !== 'admin') throw new Error('Unauthorized')
    
    const eventDoc = await addDoc(collection(db, 'calendarEvents'), {
      ...event,
      createdBy: employee.employeeId,
      createdByName: employee.name,
      createdAt: Timestamp.now()
    })

    // 🔔 GLOBAL NOTIFICATION: Calendar event created
    await createGlobalNotification({
      type: 'calendar',
      action: 'created',
      title: 'New Calendar Event',
      message: `${event.title} on ${event.date}`,
      relatedEntityId: eventDoc.id,
      targetUrl: '#calendar',
      createdBy: employee.employeeId,
      createdByName: employee.name,
      createdByRole: employee.role
    })
  }

  const updateCalendarEvent = async (id: string, updates: Partial<CalendarEvent>) => {
    if (!employee || employee.role !== 'admin') throw new Error('Unauthorized')
    await updateDoc(doc(db, 'calendarEvents', id), updates)
  }

  const deleteCalendarEvent = async (id: string) => {
    if (!employee || employee.role !== 'admin') throw new Error('Unauthorized')
    
    // Delete the calendar event
    await deleteDoc(doc(db, 'calendarEvents', id))
    
    // Delete associated notifications from userNotifications collection
    const notificationsRef = collection(db, 'userNotifications')
    const q = query(notificationsRef, where('relatedEntityId', '==', id))
    const snapshot = await getDocs(q)
    
    const deletePromises = snapshot.docs.map(docSnapshot => 
      deleteDoc(doc(db, 'userNotifications', docSnapshot.id))
    )
    
    await Promise.all(deletePromises)
  }

  // ============================================
  // TASK FUNCTIONS
  // ============================================

  const addTask = async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'createdByName' | 'comments'>) => {
    if (!employee) throw new Error('Not authenticated')
    
    const taskDoc = await addDoc(collection(db, 'tasks'), {
      ...task,
      createdBy: employee.employeeId,
      createdByName: employee.name,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      comments: []
    })
    
    await logActivity({
      type: 'task',
      action: 'create',
      description: `Created task: ${task.title}`,
    })

    // 🔔 GLOBAL NOTIFICATION: Task created
    await createGlobalNotification({
      type: 'task',
      action: 'created',
      title: 'New Task Created',
      message: `${employee.name} created: ${task.title}`,
      relatedEntityId: taskDoc.id,
      targetUrl: '#tasks',
      createdBy: employee.employeeId,
      createdByName: employee.name,
      createdByRole: employee.role
    })
  }

  const updateTask = async (id: string, updates: Partial<Task>) => {
    if (!employee) throw new Error('Not authenticated')
    
    const taskRef = doc(db, 'tasks', id)
    const taskDoc = await getDoc(taskRef)
    
    if (!taskDoc.exists()) throw new Error('Task not found')
    const oldTask = taskDoc.data() as Task
    
    // Build update payload
    const updatePayload: any = {
      ...updates,
      updatedAt: Timestamp.now(),
      editedBy: employee.employeeId,
      editedByName: employee.name
    }
    
    // If non-admin tries to mark task as completed, move to review with pending approval
    if (updates.status === 'completed' && oldTask.status !== 'completed' && employee.role !== 'admin') {
      updatePayload.status = 'review' // Change to review instead of completed
      updatePayload.approvalStatus = 'pending'
    }
    
    // If admin marks task as completed, auto-approve
    if (updates.status === 'completed' && oldTask.status !== 'completed' && employee.role === 'admin') {
      updatePayload.approvalStatus = 'approved'
      updatePayload.approvedBy = employee.employeeId
      updatePayload.approvedByName = employee.name
    }
    
    // If status changes away from completed or review, clear approval
    if (updates.status && updates.status !== 'completed' && updates.status !== 'review') {
      if (oldTask.status === 'completed' || oldTask.status === 'review') {
        updatePayload.approvalStatus = null
        updatePayload.approvedBy = null
        updatePayload.approvedByName = null
      }
    }
    
    await updateDoc(taskRef, updatePayload)
    
    // 🔔 GLOBAL NOTIFICATION: Status change
    if (updates.status && updates.status !== oldTask.status) {
      const actualStatus = updatePayload.status || updates.status
      const notifMessage = actualStatus === 'review' && updatePayload.approvalStatus === 'pending'
        ? `${employee.name} marked "${oldTask.title}" as completed — awaiting admin approval`
        : `${employee.name} changed "${oldTask.title}" to ${actualStatus}`
      
      await createGlobalNotification({
        type: 'task',
        action: 'status_changed',
        title: actualStatus === 'review' ? 'Task Pending Approval' : 'Task Status Updated',
        message: notifMessage,
        relatedEntityId: id,
        targetUrl: '#tasks',
        createdBy: employee.employeeId,
        createdByName: employee.name,
        createdByRole: employee.role
      })
    }
    
    // 🔔 GLOBAL NOTIFICATION: Assignment change
    if (updates.assignedTo && JSON.stringify(updates.assignedTo) !== JSON.stringify(oldTask.assignedTo)) {
      await createGlobalNotification({
        type: 'task',
        action: 'assigned',
        title: 'Task Assigned',
        message: `${employee.name} updated assignment for "${oldTask.title}"`,
        relatedEntityId: id,
        targetUrl: '#tasks',
        createdBy: employee.employeeId,
        createdByName: employee.name,
        createdByRole: employee.role
      })
    }
  }

  const deleteTask = async (id: string) => {
    if (!employee) throw new Error('Not authenticated')
    
    const taskDoc = await getDoc(doc(db, 'tasks', id))
    if (!taskDoc.exists()) throw new Error('Task not found')
    
    const task = taskDoc.data() as Task
    
    // Only creator or admin can delete
    if (task.createdBy !== employee.employeeId && employee.role !== 'admin') {
      throw new Error('Unauthorized')
    }
    
    // Delete the task
    await deleteDoc(doc(db, 'tasks', id))
    
    // Delete associated notifications from userNotifications collection
    try {
      console.log('🗑️ Deleting notifications for task ID:', id)
      const notificationsRef = collection(db, 'userNotifications')
      const q = query(notificationsRef, where('relatedEntityId', '==', id))
      
      console.log('🗑️ Querying userNotifications with relatedEntityId:', id)
      const snapshot = await getDocs(q)
      
      console.log('🗑️ Found', snapshot.docs.length, 'notifications to delete')
      
      // Log all found notifications for debugging
      snapshot.docs.forEach(docSnapshot => {
        console.log('🗑️ Found notification:', docSnapshot.id, 'data:', JSON.stringify(docSnapshot.data()))
      })
      
      if (snapshot.docs.length > 0) {
        const deletePromises = snapshot.docs.map(docSnapshot => {
          console.log('🗑️ Deleting notification:', docSnapshot.id)
          return deleteDoc(doc(db, 'userNotifications', docSnapshot.id))
        })
        
        await Promise.all(deletePromises)
        console.log('🗑️ All notifications deleted successfully')
      } else {
        console.log('⚠️ No notifications found for this task ID')
      }
    } catch (notifError) {
      console.error('❌ Error deleting notifications:', notifError)
      // Don't throw - task is already deleted, just log the notification error
    }
  }

  const approveTask = async (id: string) => {
    if (!employee) throw new Error('Not authenticated')
    if (employee.role !== 'admin') throw new Error('Only admins can approve tasks')
    
    const taskRef = doc(db, 'tasks', id)
    const taskDoc = await getDoc(taskRef)
    
    if (!taskDoc.exists()) throw new Error('Task not found')
    const task = taskDoc.data() as Task
    
    if (task.status !== 'review' || task.approvalStatus !== 'pending') {
      throw new Error('Task must be in review with pending approval')
    }
    
    await updateDoc(taskRef, {
      status: 'completed', // Move from review to completed
      approvalStatus: 'approved',
      approvedBy: employee.employeeId,
      approvedByName: employee.name,
      updatedAt: Timestamp.now()
    })
    
    // 🔔 GLOBAL NOTIFICATION: Task approved
    await createGlobalNotification({
      type: 'task',
      action: 'status_changed',
      title: 'Task Approved',
      message: `${employee.name} approved task: "${task.title}"`,
      relatedEntityId: id,
      targetUrl: '#tasks',
      createdBy: employee.employeeId,
      createdByName: employee.name,
      createdByRole: employee.role
    })
  }

  const addTaskComment = async (taskId: string, text: string, mentions: string[] = [], mentionedDepartments: string[] = []) => {
    if (!employee) throw new Error('Not authenticated')
    
    const taskRef = doc(db, 'tasks', taskId)
    const taskDoc = await getDoc(taskRef)
    
    if (!taskDoc.exists()) throw new Error('Task not found')
    
    const task = taskDoc.data() as Task
    const newComment: TaskComment = {
      id: `comment_${Date.now()}`,
      text,
      authorId: employee.employeeId,
      authorName: employee.name,
      authorImage: employee.profileImage,
      createdAt: Timestamp.now(),
      mentions,
      mentionedDepartments,
      reactions: {}
    }
    
    await updateDoc(taskRef, {
      comments: [...(task.comments || []), newComment],
      updatedAt: Timestamp.now()
    })
    
    // Create notifications for mentioned users
    if (mentions.length > 0) {
      const batch = writeBatch(db)
      mentions.forEach(mentionedId => {
        if (mentionedId !== employee.employeeId) {
          const notifRef = doc(collection(db, 'notifications'))
          batch.set(notifRef, {
            recipientId: mentionedId,
            type: 'mention',
            title: 'Mentioned in Task Comment',
            message: `${employee.name} mentioned you in a comment on "${task.title}"`,
            read: false,
            createdAt: Timestamp.now(),
            targetType: 'task',
            targetId: taskId,
            targetUrl: '#tasks',
            createdBy: employee.employeeId,
            createdByName: employee.name,
            createdByRole: employee.role
          })
        }
      })
      await batch.commit()
    }
  }

  const deleteTaskComment = async (taskId: string, commentId: string) => {
    if (!employee) throw new Error('Not authenticated')
    
    const taskRef = doc(db, 'tasks', taskId)
    const taskDoc = await getDoc(taskRef)
    
    if (!taskDoc.exists()) throw new Error('Task not found')
    
    const task = taskDoc.data() as Task
    const comment = task.comments?.find(c => c.id === commentId)
    
    // Only comment author or admin can delete
    if (comment?.authorId !== employee.employeeId && employee.role !== 'admin') {
      throw new Error('Unauthorized')
    }
    
    await updateDoc(taskRef, {
      comments: task.comments?.filter(c => c.id !== commentId) || [],
      updatedAt: Timestamp.now()
    })
  }

  const toggleTaskCommentReaction = async (taskId: string, commentId: string, emoji: string) => {
    if (!employee) throw new Error('Not authenticated')
    
    const taskRef = doc(db, 'tasks', taskId)
    const taskDoc = await getDoc(taskRef)
    
    if (!taskDoc.exists()) throw new Error('Task not found')
    
    const task = taskDoc.data() as Task
    const comments = task.comments || []
    const commentIndex = comments.findIndex(c => c.id === commentId)
    
    if (commentIndex === -1) throw new Error('Comment not found')
    
    const comment = comments[commentIndex]
    const reactions = comment.reactions || {}
    const userReactions = reactions[emoji] || []
    
    // Toggle reaction
    if (userReactions.includes(employee.employeeId)) {
      // Remove reaction
      reactions[emoji] = userReactions.filter(id => id !== employee.employeeId)
      if (reactions[emoji].length === 0) {
        delete reactions[emoji]
      }
    } else {
      // Add reaction
      reactions[emoji] = [...userReactions, employee.employeeId]
    }
    
    comments[commentIndex] = { ...comment, reactions }
    
    await updateDoc(taskRef, {
      comments,
      updatedAt: Timestamp.now()
    })
  }

  // ============================================
  // DISCUSSION FUNCTIONS
  // ============================================

  const addDiscussion = async (content: string, mentions: string[] = [], mentionedDepartments: string[] = []) => {
    if (!employee) throw new Error('Not authenticated')
    
    console.log('📝 Adding discussion...')
    const discussionDoc = await addDoc(collection(db, 'discussions'), {
      content,
      authorId: employee.employeeId,
      authorName: employee.name,
      authorImage: employee.profileImage,
      authorDepartment: employee.department,
      createdAt: Timestamp.now(),
      mentions,
      mentionedDepartments,
      replies: [],
      isPinned: false
    })
    console.log('📝 Discussion created with ID:', discussionDoc.id)

    // 🔔 GLOBAL NOTIFICATION: New discussion
    console.log('🔔 Calling createGlobalNotification...')
    await createGlobalNotification({
      type: 'discussion',
      action: 'created',
      title: 'New Discussion Posted',
      message: `${employee.name}: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`,
      relatedEntityId: discussionDoc.id,
      targetUrl: '#discussions',
      createdBy: employee.employeeId,
      createdByName: employee.name,
      createdByRole: employee.role
    })
    console.log('🔔 createGlobalNotification completed')
  }

  const updateDiscussion = async (id: string, content: string) => {
    if (!employee) throw new Error('Not authenticated')
    
    const discussionDoc = await getDoc(doc(db, 'discussions', id))
    if (!discussionDoc.exists()) throw new Error('Discussion not found')
    
    const discussion = discussionDoc.data() as Discussion
    
    // Only author or admin can edit
    if (discussion.authorId !== employee.employeeId && employee.role !== 'admin') {
      throw new Error('Unauthorized')
    }
    
    await updateDoc(doc(db, 'discussions', id), {
      content,
      updatedAt: Timestamp.now()
    })
  }

  const deleteDiscussion = async (id: string) => {
    if (!employee) throw new Error('Not authenticated')
    
    const discussionDoc = await getDoc(doc(db, 'discussions', id))
    if (!discussionDoc.exists()) throw new Error('Discussion not found')
    
    const discussion = discussionDoc.data() as Discussion
    
    // Only author or admin can delete
    if (discussion.authorId !== employee.employeeId && employee.role !== 'admin') {
      throw new Error('Unauthorized')
    }
    
    // Delete the discussion
    await deleteDoc(doc(db, 'discussions', id))
    
    // Delete associated notifications from userNotifications collection
    const notificationsRef = collection(db, 'userNotifications')
    const q = query(notificationsRef, where('relatedEntityId', '==', id))
    const snapshot = await getDocs(q)
    
    const deletePromises = snapshot.docs.map(docSnapshot => 
      deleteDoc(doc(db, 'userNotifications', docSnapshot.id))
    )
    
    await Promise.all(deletePromises)
  }

  const restoreDiscussion = async (discussion: Discussion) => {
    if (!employee) throw new Error('Not authenticated')
    if (!discussion.id) throw new Error('Discussion ID is required for restore')
    
    try {
      // Prepare the data, ensuring Timestamps are handled properly
      const restoreData: Record<string, unknown> = {
        content: discussion.content || '',
        authorId: discussion.authorId,
        authorName: discussion.authorName,
        authorImage: discussion.authorImage || null,
        authorDepartment: discussion.authorDepartment || null,
        createdAt: discussion.createdAt || Timestamp.now(),
        mentions: discussion.mentions || [],
        mentionedDepartments: discussion.mentionedDepartments || [],
        replies: discussion.replies || [],
        isPinned: discussion.isPinned || false,
        reactions: discussion.reactions || {}
      }
      
      // Only include updatedAt if it exists
      if (discussion.updatedAt) {
        restoreData.updatedAt = discussion.updatedAt
      }
      
      // Restore the discussion with its original ID
      await setDoc(doc(db, 'discussions', discussion.id), restoreData)
    } catch (error) {
      console.error('Error restoring discussion:', error)
      throw error
    }
  }

  const addDiscussionReply = async (discussionId: string, content: string, mentions: string[] = []) => {
    if (!employee) throw new Error('Not authenticated')
    
    const discussionRef = doc(db, 'discussions', discussionId)
    const discussionDoc = await getDoc(discussionRef)
    
    if (!discussionDoc.exists()) throw new Error('Discussion not found')
    
    const discussion = discussionDoc.data() as Discussion
    const newReply: DiscussionReply = {
      id: `reply_${Date.now()}`,
      content,
      authorId: employee.employeeId,
      authorName: employee.name,
      authorImage: employee.profileImage,
      createdAt: Timestamp.now(),
      mentions
    }
    
    await updateDoc(discussionRef, {
      replies: [...(discussion.replies || []), newReply]
    })

    // 🔔 GLOBAL NOTIFICATION: New reply
    await createGlobalNotification({
      type: 'discussion',
      action: 'replied',
      title: 'New Reply Posted',
      message: `${employee.name} replied: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`,
      relatedEntityId: discussionId,
      targetUrl: '#discussions',
      createdBy: employee.employeeId,
      createdByName: employee.name,
      createdByRole: employee.role
    })
  }

  const deleteDiscussionReply = async (discussionId: string, replyId: string) => {
    if (!employee) throw new Error('Not authenticated')
    
    const discussionRef = doc(db, 'discussions', discussionId)
    const discussionDoc = await getDoc(discussionRef)
    
    if (!discussionDoc.exists()) throw new Error('Discussion not found')
    
    const discussion = discussionDoc.data() as Discussion
    const reply = discussion.replies?.find(r => r.id === replyId)
    
    // Only reply author or admin can delete
    if (reply?.authorId !== employee.employeeId && employee.role !== 'admin') {
      throw new Error('Unauthorized')
    }
    
    await updateDoc(discussionRef, {
      replies: discussion.replies?.filter(r => r.id !== replyId) || []
    })
  }

  const updateDiscussionReply = async (discussionId: string, replyId: string, content: string) => {
    if (!employee) throw new Error('Not authenticated')
    
    const discussionRef = doc(db, 'discussions', discussionId)
    const discussionDoc = await getDoc(discussionRef)
    
    if (!discussionDoc.exists()) throw new Error('Discussion not found')
    
    const discussion = discussionDoc.data() as Discussion
    const replyIndex = discussion.replies?.findIndex(r => r.id === replyId) ?? -1
    
    if (replyIndex === -1) throw new Error('Reply not found')
    
    const reply = discussion.replies![replyIndex]
    
    // Only reply author can edit
    if (reply.authorId !== employee.employeeId) {
      throw new Error('Unauthorized - only the author can edit this reply')
    }
    
    const updatedReplies = [...(discussion.replies || [])]
    updatedReplies[replyIndex] = {
      ...reply,
      content,
      updatedAt: Timestamp.now()
    }
    
    await updateDoc(discussionRef, {
      replies: updatedReplies
    })
  }

  const togglePinDiscussion = async (id: string) => {
    if (!employee || employee.role !== 'admin') throw new Error('Unauthorized')
    
    const discussionDoc = await getDoc(doc(db, 'discussions', id))
    if (!discussionDoc.exists()) throw new Error('Discussion not found')
    
    const discussion = discussionDoc.data() as Discussion
    await updateDoc(doc(db, 'discussions', id), {
      isPinned: !discussion.isPinned
    })
  }

  const toggleDiscussionReaction = async (discussionId: string, emoji: string) => {
    if (!employee) throw new Error('Not authenticated')
    
    const discussionDoc = await getDoc(doc(db, 'discussions', discussionId))
    if (!discussionDoc.exists()) throw new Error('Discussion not found')
    
    const discussion = discussionDoc.data() as Discussion
    const reactions = discussion.reactions || {}
    const emojiReactions = reactions[emoji] || []
    
    // Toggle: add if not present, remove if present
    const hasReacted = emojiReactions.includes(employee.employeeId)
    
    if (hasReacted) {
      // Remove reaction
      reactions[emoji] = emojiReactions.filter((id: string) => id !== employee.employeeId)
      // Clean up empty arrays
      if (reactions[emoji].length === 0) {
        delete reactions[emoji]
      }
    } else {
      // Add reaction
      reactions[emoji] = [...emojiReactions, employee.employeeId]
    }
    
    await updateDoc(doc(db, 'discussions', discussionId), { reactions })
  }

  // ============================================
  // PERSONAL TODO FUNCTIONS
  // ============================================

  const addPersonalTodo = async (title: string, dueDate?: string) => {
    if (!employee) throw new Error('Not authenticated')
    
    try {
      await addDoc(collection(db, 'personalTodos'), {
        title,
        status: 'pending',
        dueDate: dueDate || null,
        employeeId: employee.employeeId,
        createdAt: Timestamp.now()
      })
    } catch (error: any) {
      console.error('Firestore addPersonalTodo error:', error?.code, error?.message)
      if (error?.code === 'permission-denied') {
        throw new Error('Permission denied. Check Firestore rules for personalTodos collection.')
      }
      throw error
    }
  }

  const updatePersonalTodo = async (id: string, updates: Partial<PersonalTodo>) => {
    if (!employee) throw new Error('Not authenticated')
    
    const todoRef = doc(db, 'personalTodos', id)
    const todoDoc = await getDoc(todoRef)
    
    if (!todoDoc.exists()) throw new Error('Todo not found')
    
    const todo = todoDoc.data()
    
    // Only owner can update their todos
    if (todo.employeeId !== employee.employeeId) {
      throw new Error('Unauthorized')
    }
    
    const updateData: any = { ...updates }
    if (updates.status === 'completed') {
      updateData.completedAt = Timestamp.now()
    }
    
    await updateDoc(todoRef, updateData)
  }

  const deletePersonalTodo = async (id: string) => {
    if (!employee) throw new Error('Not authenticated')
    
    const todoRef = doc(db, 'personalTodos', id)
    const todoDoc = await getDoc(todoRef)
    
    if (!todoDoc.exists()) throw new Error('Todo not found')
    
    const todo = todoDoc.data()
    
    // Only owner can delete their todos
    if (todo.employeeId !== employee.employeeId) {
      throw new Error('Unauthorized')
    }
    
    await deleteDoc(todoRef)
  }

  // ============================================
  // ACTIVITY LOG FUNCTIONS
  // ============================================

  const logActivity = async (log: Omit<ActivityLog, 'id' | 'timestamp' | 'performedBy' | 'performedByName'>) => {
    if (!employee) return
    
    await addDoc(collection(db, 'activityLogs'), {
      ...log,
      performedBy: employee.employeeId,
      performedByName: employee.name,
      timestamp: Timestamp.now()
    })
  }

  const getActivityLogs = async (employeeId?: string, limit = 50): Promise<ActivityLog[]> => {
    const logsRef = collection(db, 'activityLogs')
    const querySnapshot = await getDocs(logsRef)
    
    let logs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ActivityLog[]
    
    if (employeeId) {
      logs = logs.filter(log => log.performedBy === employeeId)
    }
    
    return logs
      .sort((a, b) => b.timestamp?.toMillis() - a.timestamp?.toMillis())
      .slice(0, limit)
  }

  // ============================================
  // LEAVE REQUEST FUNCTIONS
  // ============================================

  const submitLeaveRequest = async (request: { date: string; subject: string; letter: string; reason: string }) => {
    if (!employee) throw new Error('Not authenticated')
    
    const leaveRequestData = {
      employeeId: employee.employeeId,
      employeeName: employee.name,
      date: request.date,
      subject: request.subject,
      letter: request.letter,
      reason: request.reason,
      status: 'Pending' as const,
      createdAt: Timestamp.now(),
      reviewedBy: null,
      reviewedByName: null,
      reviewedAt: null
    }
    
    const docRef = await addDoc(collection(db, 'leaveRequests'), leaveRequestData)
    
    // Auto-create discussion post tagging Lahari and Yasasvi
    const allEmps = await getAllEmployees()
    const lahari = allEmps.find(e => e.name.toLowerCase().includes('lahari'))
    const yasasvi = allEmps.find(e => e.name.toLowerCase().includes('yasasvi'))
    
    const mentions: string[] = []
    let mentionText = ''
    if (lahari) {
      mentions.push(lahari.employeeId)
      mentionText += `@${lahari.name} `
    }
    if (yasasvi) {
      mentions.push(yasasvi.employeeId)
      mentionText += `@${yasasvi.name} `
    }
    
    const discussionContent = `${mentionText}\nI have submitted a leave request for ${request.date}. Kindly review and approve.\n\nSubject: ${request.subject}\nReason: ${request.reason}`
    
    await addDiscussion(discussionContent, mentions, [])
    
    // Send notifications to management team only
    if (mentions.length > 0) {
      await createGlobalNotification({
        type: 'calendar',
        action: 'created',
        title: 'Leave Request Submitted',
        message: `${employee.name} has submitted a leave request for ${request.date}. Subject: ${request.subject}`,
        relatedEntityId: docRef.id,
        targetUrl: '#attendance',
        createdBy: employee.employeeId,
        createdByName: employee.name,
        createdByRole: employee.role,
        recipientRoles: ['admin'] // Only notify management team
      })
    }
    
    await logActivity({
      type: 'attendance',
      action: 'leave-request',
      description: `Submitted leave request for ${request.date}: ${request.subject}`,
    })
  }

  const approveLeaveRequest = async (requestId: string) => {
    if (!employee || employee.role !== 'admin') throw new Error('Unauthorized')
    
    const requestRef = doc(db, 'leaveRequests', requestId)
    const requestDoc = await getDoc(requestRef)
    
    if (!requestDoc.exists()) throw new Error('Leave request not found')
    
    const requestData = requestDoc.data() as LeaveRequest
    
    await updateDoc(requestRef, {
      status: 'Approved',
      reviewedBy: employee.employeeId,
      reviewedByName: employee.name,
      reviewedAt: Timestamp.now()
    })
    
    // Clean up any existing attendance records for this employee+date
    // (e.g., auto-absent may have already created an Absent record)
    const existingAttendanceQuery = query(
      collection(db, 'attendance'),
      where('employeeId', '==', requestData.employeeId),
      where('date', '==', requestData.date)
    )
    const existingDocs = await getDocs(existingAttendanceQuery)
    const cleanupBatch = writeBatch(db)
    existingDocs.docs.forEach(docSnapshot => {
      cleanupBatch.delete(docSnapshot.ref)
    })
    
    // Mark attendance as Leave (L) for the requested date
    const attendanceId = `${requestData.employeeId}_${requestData.date}`
    const deviceInfo = 'System - Leave Approved'
    
    cleanupBatch.set(doc(db, 'attendance', attendanceId), {
      employeeId: requestData.employeeId,
      date: requestData.date,
      timestamp: Timestamp.now(),
      status: 'L',
      notes: `Leave approved - ${requestData.subject}`,
      deviceInfo
    })
    
    await cleanupBatch.commit()
    
    // Notify the employee who requested the leave
    await createGlobalNotification({
      type: 'calendar',
      action: 'updated',
      title: 'Leave Request Approved',
      message: `Your leave request for ${requestData.date} has been approved by ${employee.name}.`,
      relatedEntityId: requestId,
      targetUrl: '#attendance',
      createdBy: employee.employeeId,
      createdByName: employee.name,
      createdByRole: employee.role,
      specificRecipients: [requestData.employeeId] // Only notify the employee who requested leave
    })
  }

  const rejectLeaveRequest = async (requestId: string) => {
    if (!employee || employee.role !== 'admin') throw new Error('Unauthorized')
    
    const requestRef = doc(db, 'leaveRequests', requestId)
    const requestDoc = await getDoc(requestRef)
    
    if (!requestDoc.exists()) throw new Error('Leave request not found')
    
    const requestData = requestDoc.data() as LeaveRequest
    
    await updateDoc(requestRef, {
      status: 'Rejected',
      reviewedBy: employee.employeeId,
      reviewedByName: employee.name,
      reviewedAt: Timestamp.now()
    })
    
    // Clean up any existing attendance records for this employee+date
    const existingAttendanceQuery = query(
      collection(db, 'attendance'),
      where('employeeId', '==', requestData.employeeId),
      where('date', '==', requestData.date)
    )
    const existingDocs = await getDocs(existingAttendanceQuery)
    const cleanupBatch = writeBatch(db)
    existingDocs.docs.forEach(docSnapshot => {
      cleanupBatch.delete(docSnapshot.ref)
    })
    
    // Mark attendance as Unauthorised Leave (U) for the requested date
    const attendanceId = `${requestData.employeeId}_${requestData.date}`
    const deviceInfo = 'System - Leave Rejected'
    
    cleanupBatch.set(doc(db, 'attendance', attendanceId), {
      employeeId: requestData.employeeId,
      date: requestData.date,
      timestamp: Timestamp.now(),
      status: 'U',
      notes: `Unauthorised Leave - Leave request rejected: ${requestData.subject}`,
      deviceInfo
    })
    
    await cleanupBatch.commit()
    
    // Notify the employee who requested the leave
    await createGlobalNotification({
      type: 'calendar',
      action: 'updated',
      title: 'Leave Request Rejected',
      message: `Your leave request for ${requestData.date} has been rejected by ${employee.name}. It has been marked as Unauthorised Leave.`,
      relatedEntityId: requestId,
      targetUrl: '#attendance',
      createdBy: employee.employeeId,
      createdByName: employee.name,
      createdByRole: employee.role,
      specificRecipients: [requestData.employeeId] // Only notify the employee who requested leave
    })
  }

  const getAllLeaveRequests = async (): Promise<LeaveRequest[]> => {
    const snapshot = await getDocs(collection(db, 'leaveRequests'))
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as LeaveRequest[]
  }

  // ============================================
  // AUTO-ABSENT JOB
  // ============================================

  const runAutoAbsentJob = async () => {
    if (!employee || employee.role !== 'admin') throw new Error('Unauthorized')
    
    const allEmployees = await getAllEmployees()
    
    // Fetch all approved leave requests to avoid marking leave days as absent
    const leaveRequestsSnapshot = await getDocs(collection(db, 'leaveRequests'))
    const approvedLeaves = leaveRequestsSnapshot.docs
      .map(d => d.data() as LeaveRequest)
      .filter(lr => lr.status === 'Approved')
    
    // Build a set of approved leave keys: "employeeId_date"
    const approvedLeaveKeys = new Set<string>()
    approvedLeaves.forEach(lr => {
      approvedLeaveKeys.add(`${lr.employeeId}_${lr.date}`)
    })
    
    let totalMarked = 0
    
    // Check last 7 days (not just yesterday) to catch any missed days
    for (let daysAgo = 1; daysAgo <= 7; daysAgo++) {
      const checkDate = new Date()
      checkDate.setDate(checkDate.getDate() - daysAgo)
      const dateString = getLocalDateString(checkDate)
      
      // Skip if not a working day (Sunday or holiday)
      if (!isWorkingDay(dateString)) {
        console.log(`Skipping auto-absent for ${dateString} - not a working day`)
        continue
      }
      
      const batch = writeBatch(db)
      let markedCount = 0
      let cleanedCount = 0
      
      // Create timestamp for 6:00 PM (18:00) of the absent day — the cutoff time
      const absentDayCutoff = new Date(checkDate)
      absentDayCutoff.setHours(18, 0, 0, 0)
      const absentTimestamp = Timestamp.fromDate(absentDayCutoff)
      
      for (const emp of allEmployees) {
        const attendanceId = `${emp.employeeId}_${dateString}`
        const leaveKey = `${emp.employeeId}_${dateString}`
        
        // Check for any existing records for this employee on this date
        const attendanceRef = collection(db, 'attendance')
        const q = query(
          attendanceRef,
          where('employeeId', '==', emp.employeeId),
          where('date', '==', dateString)
        )
        const existingDocs = await getDocs(q)
        
        // If there's an approved leave for this date, ensure only the Leave record exists
        if (approvedLeaveKeys.has(leaveKey)) {
          if (existingDocs.empty) {
            // Approved leave but no attendance record — create Leave record
            batch.set(doc(db, 'attendance', attendanceId), {
              employeeId: emp.employeeId,
              date: dateString,
              timestamp: absentTimestamp,
              status: 'L',
              notes: 'Leave (approved)',
              deviceInfo: 'System - Auto Leave from Approved Request'
            })
          } else {
            // Clean up: if there are duplicates or an Absent record alongside approved leave,
            // keep only the Leave record (or create one if only Absent exists)
            let hasLeaveRecord = false
            existingDocs.docs.forEach(docSnapshot => {
              const record = docSnapshot.data()
              if (record.status === 'L') {
                hasLeaveRecord = true
              }
            })
            
            // Delete all records for this date and set the correct one
            existingDocs.docs.forEach(docSnapshot => {
              if (docSnapshot.id !== attendanceId) {
                batch.delete(docSnapshot.ref)
                cleanedCount++
              }
            })
            
            if (!hasLeaveRecord) {
              // Override with Leave status since leave was approved
              batch.set(doc(db, 'attendance', attendanceId), {
                employeeId: emp.employeeId,
                date: dateString,
                timestamp: absentTimestamp,
                status: 'L',
                notes: 'Leave (approved - corrected from absent)',
                deviceInfo: 'System - Auto Leave Correction'
              })
              cleanedCount++
            }
          }
          continue // Skip to next employee, leave is handled
        }
        
        // If there's no attendance record at all, mark as absent
        if (existingDocs.empty) {
          const attendanceData: AttendanceRecord = {
            employeeId: emp.employeeId,
            date: dateString,
            timestamp: absentTimestamp,
            status: 'A',
            notes: 'Auto-marked as absent (no attendance recorded before 6 PM)',
            deviceInfo: 'System - Auto Absent Job'
          }
          
          batch.set(doc(db, 'attendance', attendanceId), attendanceData)
          markedCount++
        } 
        // If there are multiple records (duplicates), clean them up
        else if (existingDocs.size > 1) {
          // Keep the best record: priority is L > P/W/O > A
          let recordToKeep: any = null
          const docsToDelete: any[] = []
          
          const statusPriority = (s: string) => {
            if (s === 'L') return 4
            if (s === 'P' || s === 'W' || s === 'O') return 3
            if (s === 'H') return 2
            if (s === 'U') return 1
            return 0 // 'A'
          }
          
          existingDocs.docs.forEach(docSnapshot => {
            const record = docSnapshot.data()
            if (!recordToKeep) {
              recordToKeep = { docId: docSnapshot.id, ...record }
            } else {
              const keepPriority = statusPriority(recordToKeep.status)
              const newPriority = statusPriority(record.status)
              
              if (newPriority > keepPriority) {
                docsToDelete.push(recordToKeep.docId)
                recordToKeep = { docId: docSnapshot.id, ...record }
              } else if (newPriority < keepPriority) {
                docsToDelete.push(docSnapshot.id)
              } else {
                // Same priority, keep latest timestamp
                const existingTime = recordToKeep.timestamp?.toDate?.()?.getTime?.() || 0
                const recordTime = record.timestamp?.toDate?.()?.getTime?.() || 0
                if (recordTime > existingTime) {
                  docsToDelete.push(recordToKeep.docId)
                  recordToKeep = { docId: docSnapshot.id, ...record }
                } else {
                  docsToDelete.push(docSnapshot.id)
                }
              }
            }
          })
          
          // Delete duplicate records
          docsToDelete.forEach(docId => {
            batch.delete(doc(db, 'attendance', docId))
            cleanedCount++
          })
        }
      }
      
      if (markedCount > 0 || cleanedCount > 0) {
        await batch.commit()
        totalMarked += markedCount
        
        if (markedCount > 0) {
          await logActivity({
            type: 'system',
            action: 'auto-absent',
            description: `Auto-marked ${markedCount} employees as absent for ${dateString}${cleanedCount > 0 ? `, cleaned ${cleanedCount} duplicates` : ''}`,
            metadata: { date: dateString, count: markedCount, cleaned: cleanedCount }
          })
        }
      }
    }
    
    if (totalMarked > 0) {
      console.log(`Auto-absent job completed: marked ${totalMarked} total absent records across last 7 days`)
    }
  }

  // ============================================
  // PROVIDER VALUE
  // ============================================

  return (
    <EmployeeAuthContext.Provider value={{
      user,
      employee,
      loading,
      db,
      signIn,
      logout,
      workMode,
      setGlobalWorkMode,
      markAttendance,
      updateAttendanceNotes,
      markLeaveRange,
      getAttendanceRecords,
      getTodayAttendance,
      calculateAttendancePercentage,
      markAttendanceWithLocation,
      updateEmployeeAttendance,
      getAllEmployeesAttendance,
      getEmployeeAttendanceHistory,
      getAllEmployees,
      getEmployeeById,
      updateEmployeeProfile,
      holidays,
      addHoliday,
      updateHoliday,
      deleteHoliday,
      isHoliday,
      calendarEvents,
      addCalendarEvent,
      updateCalendarEvent,
      deleteCalendarEvent,
      tasks,
      addTask,
      updateTask,
      deleteTask,
      approveTask,
      addTaskComment,
      deleteTaskComment,
      toggleTaskCommentReaction,
      discussions,
      addDiscussion,
      updateDiscussion,
      deleteDiscussion,
      restoreDiscussion,
      addDiscussionReply,
      deleteDiscussionReply,
      updateDiscussionReply,
      togglePinDiscussion,
      toggleDiscussionReaction,
      logActivity,
      getActivityLogs,
      personalTodos,
      addPersonalTodo,
      updatePersonalTodo,
      deletePersonalTodo,
      leaveRequests,
      submitLeaveRequest,
      approveLeaveRequest,
      rejectLeaveRequest,
      getAllLeaveRequests,
      runAutoAbsentJob
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
