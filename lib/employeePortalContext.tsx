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
  writeBatch
} from 'firebase/firestore'
import { auth } from './firebaseConfig'
import { getFirestore } from 'firebase/firestore'

// Initialize Firestore
const db = getFirestore()

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
  status: 'P' | 'A' | 'L' | 'O' | 'H' // Present, Absent, Leave, On Duty, Holiday
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
}

export interface CalendarEvent {
  id?: string
  title: string
  description?: string
  date: string
  endDate?: string
  type: 'event' | 'deadline' | 'meeting' | 'announcement'
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
  dueDate?: string
  tags?: string[]
  department?: string
  comments: TaskComment[]
}

export interface TaskComment {
  id: string
  text: string
  authorId: string
  authorName: string
  authorImage?: string
  createdAt: Timestamp
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
}

export interface DiscussionReply {
  id: string
  content: string
  authorId: string
  authorName: string
  authorImage?: string
  createdAt: Timestamp
  mentions: string[]
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
},

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

// Format date to YYYY-MM-DD
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
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
  db: ReturnType<typeof getFirestore>
  signIn: (employeeId: string, password: string) => Promise<void>
  logout: () => Promise<void>
  
  // Attendance
  markAttendance: (status: AttendanceRecord['status'], notes?: string, extraData?: Partial<AttendanceRecord>) => Promise<void>
  updateAttendanceNotes: (notes: string) => Promise<void>
  markLeaveRange: (startDate: string, endDate: string, notes?: string) => Promise<void>
  getAttendanceRecords: (startDate?: Date, endDate?: Date) => Promise<AttendanceRecord[]>
  getTodayAttendance: () => Promise<AttendanceRecord | null>
  calculateAttendancePercentage: (records: AttendanceRecord[]) => number
  markAttendanceWithLocation: (status: AttendanceRecord['status'], notes?: string, extraData?: Partial<AttendanceRecord>) => Promise<{ success: boolean; locationVerified: boolean; error?: string }>
  
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
  addTaskComment: (taskId: string, text: string) => Promise<void>
  deleteTaskComment: (taskId: string, commentId: string) => Promise<void>
  
  // Discussions
  discussions: Discussion[]
  addDiscussion: (content: string, mentions?: string[], mentionedDepartments?: string[]) => Promise<void>
  updateDiscussion: (id: string, content: string) => Promise<void>
  deleteDiscussion: (id: string) => Promise<void>
  addDiscussionReply: (discussionId: string, content: string, mentions?: string[]) => Promise<void>
  deleteDiscussionReply: (discussionId: string, replyId: string) => Promise<void>
  togglePinDiscussion: (id: string) => Promise<void>
  
  // Activity Logs
  logActivity: (log: Omit<ActivityLog, 'id' | 'timestamp' | 'performedBy' | 'performedByName'>) => Promise<void>
  getActivityLogs: (employeeId?: string, limit?: number) => Promise<ActivityLog[]>
  
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
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [discussions, setDiscussions] = useState<Discussion[]>([])

  // ============================================
  // AUTH EFFECTS
  // ============================================
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      if (user) {
        try {
          const employeeDoc = await getDoc(doc(db, 'Employees', user.uid))
          if (employeeDoc.exists()) {
            const data = employeeDoc.data() as EmployeeProfile
            setEmployee(data)
          } else {
            const employeesRef = collection(db, 'Employees')
            const q = query(employeesRef, where('email', '==', user.email))
            const querySnapshot = await getDocs(q)
            if (!querySnapshot.empty) {
              const data = querySnapshot.docs[0].data() as EmployeeProfile
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

  // ============================================
  // REALTIME SUBSCRIPTIONS
  // ============================================
  
  // Subscribe to holidays
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'holidays'),
      (snapshot) => {
        const holidaysData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Holiday[]
        setHolidays(holidaysData.sort((a, b) => a.date.localeCompare(b.date)))
      },
      (error) => console.error('Error fetching holidays:', error)
    )
    return () => unsubscribe()
  }, [])

  // Subscribe to calendar events
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'calendarEvents'),
      (snapshot) => {
        const eventsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as CalendarEvent[]
        setCalendarEvents(eventsData.sort((a, b) => a.date.localeCompare(b.date)))
      },
      (error) => console.error('Error fetching calendar events:', error)
    )
    return () => unsubscribe()
  }, [])

  // Subscribe to tasks
  useEffect(() => {
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
  }, [])

  // Subscribe to discussions
  useEffect(() => {
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
  }, [])

  // ============================================
  // AUTH FUNCTIONS
  // ============================================

  const signIn = async (employeeId: string, password: string) => {
    const employeesRef = collection(db, 'Employees')
    const q = query(employeesRef, where('employeeId', '==', employeeId.trim()))
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      throw new Error('Employee ID not found')
    }

    const employeeData = querySnapshot.docs[0].data() as EmployeeProfile
    await signInWithEmailAndPassword(auth, employeeData.email, password)
  }

  const logout = async () => {
    await signOut(auth)
    setEmployee(null)
  }

  // ============================================
  // ATTENDANCE FUNCTIONS
  // ============================================

  const markAttendance = async (status: AttendanceRecord['status'], notes?: string, extraData?: Partial<AttendanceRecord>) => {
    if (!user || !employee) throw new Error('Not authenticated')

    const today = new Date()
    const dateString = today.toISOString().split('T')[0]
    const now = new Date()
    
    const attendanceId = `${employee.employeeId}_${dateString}`
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
  ): Promise<{ success: boolean; locationVerified: boolean; error?: string }> => {
    if (!user || !employee) {
      return { success: false, locationVerified: false, error: 'Not authenticated' }
    }

    try {
      // Get current location
      const position = await getCurrentLocation()
      const { latitude, longitude, accuracy } = position.coords
      
      // Check if within office radius
      const locationVerified = isLocationVerified(latitude, longitude)
      
      // Mark attendance with location data
      await markAttendance(status, notes, {
        ...extraData,
        latitude,
        longitude,
        locationAccuracy: accuracy,
        locationVerified
      })

      return { success: true, locationVerified }
    } catch (error: unknown) {
      // If location permission denied, still allow marking but flag as unverified
      if (error instanceof GeolocationPositionError && error.code === error.PERMISSION_DENIED) {
        await markAttendance(status, notes, {
          ...extraData,
          locationVerified: false
        })
        return { success: true, locationVerified: false, error: 'Location permission denied' }
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, locationVerified: false, error: errorMessage }
    }
  }

  const updateAttendanceNotes = async (notes: string) => {
    if (!user || !employee) throw new Error('Not authenticated')
    
    const today = new Date().toISOString().split('T')[0]
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
      const dateString = d.toISOString().split('T')[0]
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

    const today = new Date().toISOString().split('T')[0]
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

    records.sort((a, b) => b.date.localeCompare(a.date))

    if (startDate && endDate) {
      const start = startDate.toISOString().split('T')[0]
      const end = endDate.toISOString().split('T')[0]
      records = records.filter(r => r.date >= start && r.date <= end)
    }

    return records
  }, [employee])

  const calculateAttendancePercentage = (records: AttendanceRecord[]): number => {
    if (records.length === 0) return 0
    const presentDays = records.filter(r => r.status === 'P' || r.status === 'O').length
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
    
    const records = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as AttendanceRecord[]
    
    return records
      .filter(r => r.date >= startDate && r.date <= endDate)
      .sort((a, b) => b.date.localeCompare(a.date))
  }

  const getEmployeeAttendanceHistory = async (employeeId: string, limit = 100): Promise<AttendanceRecord[]> => {
    const attendanceRef = collection(db, 'attendance')
    const q = query(attendanceRef, where('employeeId', '==', employeeId))
    const querySnapshot = await getDocs(q)
    
    const records = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as AttendanceRecord[]
    
    return records.sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit)
  }

  // ============================================
  // EMPLOYEE FUNCTIONS
  // ============================================

  const getAllEmployees = async (): Promise<EmployeeProfile[]> => {
    const employeesRef = collection(db, 'Employees')
    const querySnapshot = await getDocs(employeesRef)
    return querySnapshot.docs.map(doc => doc.data() as EmployeeProfile)
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
    return holidays.some(h => h.date === date)
  }

  const addHoliday = async (holiday: Omit<Holiday, 'id' | 'createdAt' | 'createdBy' | 'createdByName'>) => {
    if (!employee || employee.role !== 'admin') throw new Error('Unauthorized')
    
    await addDoc(collection(db, 'holidays'), {
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
  }

  const updateHoliday = async (id: string, updates: Partial<Holiday>) => {
    if (!employee || employee.role !== 'admin') throw new Error('Unauthorized')
    await updateDoc(doc(db, 'holidays', id), updates)
  }

  const deleteHoliday = async (id: string) => {
    if (!employee || employee.role !== 'admin') throw new Error('Unauthorized')
    await deleteDoc(doc(db, 'holidays', id))
  }

  // ============================================
  // CALENDAR EVENT FUNCTIONS
  // ============================================

  const addCalendarEvent = async (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'createdBy' | 'createdByName'>) => {
    if (!employee || employee.role !== 'admin') throw new Error('Unauthorized')
    
    await addDoc(collection(db, 'calendarEvents'), {
      ...event,
      createdBy: employee.employeeId,
      createdByName: employee.name,
      createdAt: Timestamp.now()
    })
  }

  const updateCalendarEvent = async (id: string, updates: Partial<CalendarEvent>) => {
    if (!employee || employee.role !== 'admin') throw new Error('Unauthorized')
    await updateDoc(doc(db, 'calendarEvents', id), updates)
  }

  const deleteCalendarEvent = async (id: string) => {
    if (!employee || employee.role !== 'admin') throw new Error('Unauthorized')
    await deleteDoc(doc(db, 'calendarEvents', id))
  }

  // ============================================
  // TASK FUNCTIONS
  // ============================================

  const addTask = async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'createdByName' | 'comments'>) => {
    if (!employee) throw new Error('Not authenticated')
    
    await addDoc(collection(db, 'tasks'), {
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
  }

  const updateTask = async (id: string, updates: Partial<Task>) => {
    if (!employee) throw new Error('Not authenticated')
    
    await updateDoc(doc(db, 'tasks', id), {
      ...updates,
      updatedAt: Timestamp.now()
    })
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
    
    await deleteDoc(doc(db, 'tasks', id))
  }

  const addTaskComment = async (taskId: string, text: string) => {
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
      createdAt: Timestamp.now()
    }
    
    await updateDoc(taskRef, {
      comments: [...(task.comments || []), newComment],
      updatedAt: Timestamp.now()
    })
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

  // ============================================
  // DISCUSSION FUNCTIONS
  // ============================================

  const addDiscussion = async (content: string, mentions: string[] = [], mentionedDepartments: string[] = []) => {
    if (!employee) throw new Error('Not authenticated')
    
    await addDoc(collection(db, 'discussions'), {
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
    
    await deleteDoc(doc(db, 'discussions', id))
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

  const togglePinDiscussion = async (id: string) => {
    if (!employee || employee.role !== 'admin') throw new Error('Unauthorized')
    
    const discussionDoc = await getDoc(doc(db, 'discussions', id))
    if (!discussionDoc.exists()) throw new Error('Discussion not found')
    
    const discussion = discussionDoc.data() as Discussion
    await updateDoc(doc(db, 'discussions', id), {
      isPinned: !discussion.isPinned
    })
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
  // AUTO-ABSENT JOB
  // ============================================

  const runAutoAbsentJob = async () => {
    if (!employee || employee.role !== 'admin') throw new Error('Unauthorized')
    
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const dateString = yesterday.toISOString().split('T')[0]
    
    // Skip if yesterday was a holiday
    if (isHoliday(dateString)) return
    
    // Skip weekends
    const dayOfWeek = yesterday.getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) return
    
    const allEmployees = await getAllEmployees()
    const batch = writeBatch(db)
    let markedCount = 0
    
    for (const emp of allEmployees) {
      const attendanceId = `${emp.employeeId}_${dateString}`
      const existingDoc = await getDoc(doc(db, 'attendance', attendanceId))
      
      if (!existingDoc.exists()) {
        const attendanceData: AttendanceRecord = {
          employeeId: emp.employeeId,
          date: dateString,
          timestamp: Timestamp.now(),
          status: 'A',
          notes: 'Auto-marked as absent (no attendance recorded)',
          deviceInfo: 'System - Auto Absent Job'
        }
        
        batch.set(doc(db, 'attendance', attendanceId), attendanceData)
        markedCount++
      }
    }
    
    if (markedCount > 0) {
      await batch.commit()
      
      await logActivity({
        type: 'system',
        action: 'auto-absent',
        description: `Auto-marked ${markedCount} employees as absent for ${dateString}`,
        metadata: { date: dateString, count: markedCount }
      })
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
      addTaskComment,
      deleteTaskComment,
      discussions,
      addDiscussion,
      updateDiscussion,
      deleteDiscussion,
      addDiscussionReply,
      deleteDiscussionReply,
      togglePinDiscussion,
      logActivity,
      getActivityLogs,
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
