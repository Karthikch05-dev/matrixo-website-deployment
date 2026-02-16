'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FaCalendarCheck, 
  FaClock, 
  FaCheckCircle, 
  FaTimesCircle,
  FaUmbrellaBeach,
  FaBriefcase,
  FaPlane,
  FaSpinner,
  FaMapMarkerAlt,
  FaExclamationTriangle,
  FaLocationArrow,
  FaShieldAlt,
  FaHistory,
  FaApple,
  FaCog,
  FaBan,
  FaEnvelope,
  FaHome
} from 'react-icons/fa'

// ============================================
// iOS PWA DETECTION HELPERS
// ============================================

const isIOSDevice = () => {
  if (typeof window === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream
}

const isInStandaloneMode = () => {
  if (typeof window === 'undefined') return false
  return (
    ('standalone' in window.navigator && (window.navigator as unknown as { standalone?: boolean }).standalone === true) ||
    window.matchMedia('(display-mode: standalone)').matches
  )
}

const isIOSPWA = () => isIOSDevice() && isInStandaloneMode()
import { useEmployeeAuth, AttendanceRecord } from '@/lib/employeePortalContext'
import { Card, Button, Textarea, Input, Badge, Alert, Spinner, Modal } from './ui'
import { toast } from 'sonner'

// ============================================
// STATUS CONFIGURATION
// ============================================

const statusConfig = {
  P: { label: 'Present', color: 'bg-emerald-500', icon: FaCheckCircle, textColor: 'text-emerald-400', bgLight: 'bg-emerald-500/20' },
  A: { label: 'Absent', color: 'bg-red-500', icon: FaTimesCircle, textColor: 'text-red-400', bgLight: 'bg-red-500/20' },
  L: { label: 'Leave', color: 'bg-amber-500', icon: FaUmbrellaBeach, textColor: 'text-amber-400', bgLight: 'bg-amber-500/20' },
  O: { label: 'On Duty', color: 'bg-blue-500', icon: FaBriefcase, textColor: 'text-blue-400', bgLight: 'bg-blue-500/20' },
  H: { label: 'Holiday', color: 'bg-purple-500', icon: FaPlane, textColor: 'text-purple-400', bgLight: 'bg-purple-500/20' },
  U: { label: 'Unauthorised Leave', color: 'bg-rose-600', icon: FaBan, textColor: 'text-rose-400', bgLight: 'bg-rose-600/20' },
  W: { label: 'Work From Home', color: 'bg-cyan-500', icon: FaHome, textColor: 'text-cyan-400', bgLight: 'bg-cyan-500/20' }
}

// ============================================
// LINKIFY TEXT HELPER - Makes URLs clickable
// ============================================

function LinkifiedText({ text }: { text: string }) {
  // URL regex pattern that matches http, https, and www URLs
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi
  
  const parts = text.split(urlRegex)
  const matches: string[] = text.match(urlRegex) || []
  
  const result: React.ReactNode[] = []
  
  parts.forEach((part, index) => {
    if (part && matches.includes(part)) {
      // This is a URL - make it clickable
      const href = part.startsWith('www.') ? `https://${part}` : part
      result.push(
        <a
          key={`link-${index}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-400 hover:text-primary-300 underline break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      )
    } else if (part) {
      result.push(<span key={`text-${index}`}>{part}</span>)
    }
  })
  
  return <>{result}</>
}

// ============================================
// LOCATION STATUS COMPONENT
// ============================================

function LocationStatus({ 
  locationVerified, 
  latitude, 
  longitude,
  accuracy
}: { 
  locationVerified?: boolean
  latitude?: number
  longitude?: number
  accuracy?: number
}) {
  if (latitude === undefined || longitude === undefined) {
    return (
      <div className="flex items-center gap-2 text-sm text-neutral-500">
        <FaMapMarkerAlt />
        <span>Location not captured</span>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 text-sm ${locationVerified ? 'text-emerald-400' : 'text-amber-400'}`}>
      {locationVerified ? <FaMapMarkerAlt /> : <FaMapMarkerAlt />}
      <span>
        {locationVerified ? 'Verified (at office)' : 'Not in office range'}
      </span>
      {accuracy && (
        <span className="text-neutral-500 text-xs">
          (±{Math.round(accuracy)}m)
        </span>
      )}
    </div>
  )
}

// ============================================
// ATTENDANCE MARKER COMPONENT
// ============================================

export function AttendanceMarker({ onAttendanceMarked }: { onAttendanceMarked?: () => void }) {
  const { 
    employee,
    markAttendanceWithLocation, 
    getTodayAttendance, 
    updateAttendanceNotes,
    markLeaveRange,
    isHoliday,
    holidays,
    submitLeaveRequest
  } = useEmployeeAuth()
  
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<'P' | 'L' | 'O' | null>(null)
  const [notes, setNotes] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())
  
  // Leave date range
  const [leaveStartDate, setLeaveStartDate] = useState('')
  const [leaveEndDate, setLeaveEndDate] = useState('')
  
  // On Duty location
  const [onDutyLocation, setOnDutyLocation] = useState('')

  // Edit notes mode
  const [editingNotes, setEditingNotes] = useState(false)
  const [updatedNotes, setUpdatedNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

  // Location state
  const [locationStatus, setLocationStatus] = useState<'pending' | 'granted' | 'denied' | 'unavailable'>('pending')
  const [fetchingLocation, setFetchingLocation] = useState(false)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)
  const [isIOSPWAMode, setIsIOSPWAMode] = useState(false)

  // Leave request modal state
  const [showLeaveRequestModal, setShowLeaveRequestModal] = useState(false)
  const [leaveRequestForm, setLeaveRequestForm] = useState({
    date: new Date().toISOString().split('T')[0],
    subject: '',
    letter: '',
    reason: ''
  })
  const [submittingLeaveRequest, setSubmittingLeaveRequest] = useState(false)

  const todayString = new Date().toISOString().split('T')[0]
  const isTodayHoliday = isHoliday(todayString)
  const todayHoliday = holidays.find(h => h.date === todayString)

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formattedDate = currentTime.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
  
  const formattedTime = currentTime.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit',
    hour12: true 
  })

  // Track how many times we've tried and failed on iOS so we know when to show instructions
  const [iosLocationAttempts, setIosLocationAttempts] = useState(0)

  // Check location permission on mount
  useEffect(() => {
    // Detect iOS PWA mode
    const isPWA = isIOSPWA()
    setIsIOSPWAMode(isPWA)
    
    if (!navigator.geolocation) {
      setLocationStatus('unavailable')
      return
    }

    // On iOS (both Safari and PWA), navigator.permissions API is unreliable.
    // We silently try getCurrentPosition — if it succeeds, great.
    // If it fails, we keep status as 'pending' (NOT 'denied') so the
    // Enable Location button always calls getCurrentPosition again,
    // which is the ONLY way to trigger the native iOS permission prompt.
    if (isPWA || isIOSDevice() || !navigator.permissions?.query) {
      navigator.geolocation.getCurrentPosition(
        () => setLocationStatus('granted'),
        () => {
          // On iOS: keep as 'pending' so the button remains active
          // and will call getCurrentPosition again (which triggers the prompt)
          setLocationStatus('pending')
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
      )
    } else {
      // Standard browsers (Chrome, Firefox, etc.) with permissions API
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setLocationStatus(result.state === 'granted' ? 'granted' : result.state === 'denied' ? 'denied' : 'pending')
        result.onchange = () => {
          setLocationStatus(result.state === 'granted' ? 'granted' : result.state === 'denied' ? 'denied' : 'pending')
        }
      }).catch(() => {
        setLocationStatus('pending')
      })
    }
  }, [])

  const fetchTodayAttendance = useCallback(async () => {
    try {
      const attendance = await getTodayAttendance()
      setTodayAttendance(attendance)
      if (attendance?.notes) {
        setUpdatedNotes(attendance.notes)
      }
    } catch (error) {
      console.error('Error fetching today attendance:', error)
    } finally {
      setLoading(false)
    }
  }, [getTodayAttendance])

  useEffect(() => {
    fetchTodayAttendance()
  }, [fetchTodayAttendance])

  // Check if it's past the 6PM attendance cutoff
  const isPastCutoff = () => {
    const now = new Date()
    return now.getHours() >= 18 // 6:00 PM or later
  }

  const handleMarkAttendance = async () => {
    if (!selectedStatus) {
      toast.error('Please select your attendance status')
      return
    }

    // 6PM cutoff check - only Leave requests can be submitted after 6PM
    if (isPastCutoff() && selectedStatus !== 'L') {
      toast.error('Attendance marking is closed for today. The cutoff time is 6:00 PM. Please contact your admin if needed.')
      return
    }

    // Daily report is required
    if (!notes.trim()) {
      toast.error('Daily report is required. Please describe your tasks for today.')
      return
    }

    // Check if location is enabled - MANDATORY for Present and On Duty
    if ((selectedStatus === 'P' || selectedStatus === 'O') && locationStatus !== 'granted') {
      // Always try to get location — this triggers the native iOS prompt
      if (navigator.geolocation) {
        toast.loading('Requesting location...', { id: 'mark-location' })
        navigator.geolocation.getCurrentPosition(
          () => {
            setLocationStatus('granted')
            toast.success('Location enabled! Please tap the button again to mark attendance.', { id: 'mark-location' })
          },
          (error) => {
            if (error.code === error.PERMISSION_DENIED) {
              if (isIOSPWAMode || isIOSDevice()) {
                setIosLocationAttempts(prev => prev + 1)
                setShowIOSInstructions(true)
                toast.error('Location access needed. See instructions below.', { id: 'mark-location' })
              } else {
                setLocationStatus('denied')
                toast.error('Location permission denied. Please enable it in browser settings.', { id: 'mark-location' })
              }
            } else {
              toast.error('Could not get location. Please try again.', { id: 'mark-location' })
            }
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        )
      } else {
        toast.error('Geolocation is not supported on this device.')
      }
      return
    }
    
    // Validate leave dates
    if (selectedStatus === 'L') {
      if (!leaveStartDate || !leaveEndDate) {
        toast.error('Please select leave start and end dates')
        return
      }
      if (leaveStartDate > leaveEndDate) {
        toast.error('End date must be after start date')
        return
      }
    }
    
    // Validate On Duty location
    if (selectedStatus === 'O' && !onDutyLocation.trim()) {
      toast.error('Please enter your work location/client site')
      return
    }
    
    setMarking(true)
    setFetchingLocation(true)
    
    try {
      if (selectedStatus === 'L') {
        await markLeaveRange(leaveStartDate, leaveEndDate, notes)
        toast.success(`Leave marked from ${leaveStartDate} to ${leaveEndDate}`)
      } else {
        const extraData: Partial<AttendanceRecord> = {}
        if (selectedStatus === 'O') {
          extraData.onDutyLocation = onDutyLocation
        }
        
        // Mark attendance with location verification
        const result = await markAttendanceWithLocation(selectedStatus, notes, extraData)
        
        if (result.success) {
          if (result.workFromHome) {
            toast.success('Attendance marked as Work From Home! 🏠 Location verified')
          } else if (result.locationVerified) {
            toast.success(`Attendance marked as ${statusConfig[selectedStatus].label}! ✅ Location verified`)
          } else if (result.error === 'Location permission denied') {
            toast.warning(`Attendance marked but location not verified. Please enable location for better tracking.`)
          } else {
            toast.success(`Attendance marked as ${statusConfig[selectedStatus].label}`)
          }
        } else {
          throw new Error(result.error || 'Failed to mark attendance')
        }
      }
      
      await fetchTodayAttendance()
      onAttendanceMarked?.()
      setNotes('')
      setOnDutyLocation('')
      setLeaveStartDate('')
      setLeaveEndDate('')
      setSelectedStatus(null)
    } catch (error) {
      console.error('Error marking attendance:', error)
      toast.error('Failed to mark attendance. Please try again.')
    } finally {
      setMarking(false)
      setFetchingLocation(false)
    }
  }

  // Check if editing daily report is allowed (before 6:00 PM / 18:00)
  const isEditingAllowed = () => {
    const now = new Date()
    const hours = now.getHours()
    return hours < 18 // Before 6:00 PM
  }

  const handleUpdateNotes = async () => {
    if (!isEditingAllowed()) {
      toast.error('Daily report can only be updated before 6:00 PM')
      return
    }
    
    if (!updatedNotes.trim()) {
      toast.error('Daily report cannot be empty')
      return
    }
    
    setSavingNotes(true)
    try {
      await updateAttendanceNotes(updatedNotes)
      await fetchTodayAttendance()
      setEditingNotes(false)
      toast.success('Daily report updated successfully!')
    } catch (error) {
      console.error('Error updating notes:', error)
      toast.error('Failed to update daily report')
    } finally {
      setSavingNotes(false)
    }
  }

  // Available status options (no Absent - it's auto-marked)
  const availableStatuses = [
    { status: 'P' as const, ...statusConfig.P },
    { status: 'L' as const, label: 'Request Leave', color: statusConfig.L.color, icon: statusConfig.L.icon, textColor: statusConfig.L.textColor, bgLight: statusConfig.L.bgLight },
    { status: 'O' as const, ...statusConfig.O }
  ]

  // Request location permission — always tries getCurrentPosition to trigger native prompt
  const requestLocationPermission = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this device.')
      return
    }
    
    toast.loading('Requesting location access...', { id: 'location-request' })
    
    // ALWAYS call getCurrentPosition — this is the ONLY way to trigger
    // the native iOS "Allow Location" popup in a standalone/PWA web app.
    // Never skip this with an early bail-out.
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Success! Permission was granted and we got a position
        setLocationStatus('granted')
        setShowIOSInstructions(false)
        setIosLocationAttempts(0)
        toast.success('Location enabled successfully! ✅', { id: 'location-request' })
      },
      (error) => {
        console.log('[Location] Error:', error.code, error.message)
        
        if (error.code === error.PERMISSION_DENIED) {
          // On iOS, after the user denies the prompt OR if the prompt
          // didn't appear (stuck permission), show fix instructions
          if (isIOSPWAMode || isIOSDevice()) {
            const attempts = iosLocationAttempts + 1
            setIosLocationAttempts(attempts)
            
            // First attempt: maybe iOS just needs a retry
            if (attempts <= 1) {
              toast.error('Location was not enabled. Tap "Enable Location" to try again.', { id: 'location-request' })
            } else {
              // After 2+ failed attempts, show the fix instructions
              setShowIOSInstructions(true)
              toast.error('Location seems blocked. See how to fix it below.', { id: 'location-request' })
            }
            // Keep status as 'pending' on iOS so the button stays active
            setLocationStatus('pending')
          } else {
            setLocationStatus('denied')
            toast.error('Location permission denied. Please enable it in browser settings.', { id: 'location-request' })
          }
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          toast.error('Location unavailable. Please make sure Location Services is ON in Settings → Privacy & Security → Location Services.', { id: 'location-request' })
        } else if (error.code === error.TIMEOUT) {
          toast.error('Location request timed out. Please try again.', { id: 'location-request' })
        }
      },
      // Use high accuracy on first try; iOS needs this to trigger GPS
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  if (loading) {
    return (
      <Card padding="lg" glow>
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      </Card>
    )
  }

  // If today is a holiday, show holiday notice
  if (isTodayHoliday) {
    return (
      <Card padding="lg" glow>
        <div className="text-center py-8">
          <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
            <FaPlane className="text-4xl text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">It's a Holiday! 🎉</h2>
          <p className="text-neutral-400 mb-4">
            {todayHoliday?.name || 'Holiday'}
          </p>
          {todayHoliday?.description && (
            <p className="text-neutral-500 text-sm">{todayHoliday.description}</p>
          )}
          <Badge variant="warning" className="mt-4">
            Attendance marking is disabled for holidays
          </Badge>
        </div>
      </Card>
    )
  }

  return (
    <Card padding="lg" glow>
      {/* iOS PWA Location Instructions Modal */}
      <AnimatePresence>
        {showIOSInstructions && (isIOSPWAMode || isIOSDevice()) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowIOSInstructions(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gray-500/20 flex items-center justify-center">
                  <FaApple className="text-2xl text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Fix Location Access</h3>
                  <p className="text-sm text-neutral-400">For iOS Home Screen App</p>
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                  <p className="text-xs text-red-400">
                    <strong>Known iOS Issue:</strong> Home Screen apps sometimes don't show location prompts. Follow these steps to fix:
                  </p>
                </div>

                {/* Method 1: Reset via Safari */}
                <div>
                  <p className="text-sm font-semibold text-emerald-400 mb-2">✅ Method 1: Reset Permission (Recommended)</p>
                  <div className="bg-neutral-800/50 rounded-xl p-4 space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold flex-shrink-0">1</div>
                      <p className="text-sm text-neutral-300">Open <strong className="text-white">Safari</strong> browser</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold flex-shrink-0">2</div>
                      <p className="text-sm text-neutral-300">Go to <strong className="text-white">team-auth.matrixo.in</strong></p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold flex-shrink-0">3</div>
                      <p className="text-sm text-neutral-300">Tap <strong className="text-white">Enable Location</strong> and <strong className="text-white">Allow</strong> the popup</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold flex-shrink-0">4</div>
                      <p className="text-sm text-neutral-300">Now open the <strong className="text-white">Home Screen app</strong> - it should work!</p>
                    </div>
                  </div>
                </div>

                {/* Method 2: Reinstall app */}
                <div>
                  <p className="text-sm font-semibold text-blue-400 mb-2">🔄 Method 2: Reinstall Home Screen App</p>
                  <div className="bg-neutral-800/50 rounded-xl p-4 space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold flex-shrink-0">1</div>
                      <p className="text-sm text-neutral-300"><strong className="text-white">Delete</strong> the matriXO app from Home Screen</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold flex-shrink-0">2</div>
                      <p className="text-sm text-neutral-300">Go to <strong className="text-white">Settings → Safari → Clear History and Website Data</strong></p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold flex-shrink-0">3</div>
                      <p className="text-sm text-neutral-300">Open Safari, visit <strong className="text-white">team-auth.matrixo.in</strong></p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold flex-shrink-0">4</div>
                      <p className="text-sm text-neutral-300">Allow location when prompted</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold flex-shrink-0">5</div>
                      <p className="text-sm text-neutral-300">Add to Home Screen again (Share → Add to Home Screen)</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
                  <p className="text-xs text-amber-400">
                    <strong>Quick Alternative:</strong> You can always use Safari directly to mark attendance if the Home Screen app has issues.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowIOSInstructions(false)}
                  className="flex-1 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-xl transition-all"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowIOSInstructions(false)
                    // Always try getCurrentPosition — this triggers the native prompt
                    setTimeout(() => {
                      if (navigator.geolocation) {
                        toast.loading('Requesting location...', { id: 'location-retry' })
                        navigator.geolocation.getCurrentPosition(
                          () => {
                            setLocationStatus('granted')
                            setIosLocationAttempts(0)
                            toast.success('Location enabled! ✅', { id: 'location-retry' })
                          },
                          (err) => {
                            if (err.code === err.PERMISSION_DENIED) {
                              toast.error('Still blocked. Try the steps above, then come back.', { id: 'location-retry' })
                            } else {
                              toast.error('Could not get location. Check Location Services is ON.', { id: 'location-retry' })
                            }
                          },
                          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
                        )
                      }
                    }, 300)
                  }}
                  className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-400 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <FaLocationArrow />
                  Try Again
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6PM Cutoff Banner */}
      {isPastCutoff() && !todayAttendance && (
        <div className="mb-6 p-4 bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <FaExclamationTriangle className="text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-400">Attendance Cutoff Passed</h3>
              <p className="text-sm text-neutral-400 mt-1">
                The attendance marking window has closed for today. The daily cutoff is 6:00 PM. 
                Your attendance for today will be marked as Absent. Contact your admin if you need corrections.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Location Required Banner */}
      {locationStatus !== 'granted' && !todayAttendance && (
        <div className="mb-6 p-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <FaLocationArrow className="text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-400">Location Required</h3>
              <p className="text-sm text-neutral-400 mt-1">
                Location services are mandatory for marking attendance. Please enable location access to continue.
              </p>
              {isIOSPWAMode && iosLocationAttempts > 0 && (
                <p className="text-xs text-red-400 mt-2">
                  ⚠️ If the location popup didn't appear, tap below — each tap tries to trigger it.
                </p>
              )}
              <button
                onClick={requestLocationPermission}
                className="mt-3 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-medium rounded-lg transition-all flex items-center gap-2"
              >
                <FaLocationArrow />
                Enable Location
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <FaCalendarCheck className="text-primary-500" />
            Mark Attendance
          </h2>
          <p className="text-neutral-400 text-sm sm:text-base mt-1">{formattedDate}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Location Status Indicator */}
          <button
            onClick={locationStatus !== 'granted' ? requestLocationPermission : undefined}
            className={`
              flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap
              ${locationStatus === 'granted' 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : locationStatus === 'denied' 
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 cursor-pointer' 
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 cursor-pointer'
              }
            `}
          >
            <FaLocationArrow />
            <span>
              {locationStatus === 'granted' ? '✓ Location On' : 
               locationStatus === 'denied' ? 'Enable Location' : 
               'Enable Location'}
            </span>
          </button>
          
          <div className="flex items-center gap-1.5 sm:gap-2 text-white bg-white/5 backdrop-blur-xl border border-white/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl whitespace-nowrap">
            <FaClock className="text-primary-400 text-sm sm:text-base" />
            <span className="text-base sm:text-lg font-mono tabular-nums">{formattedTime}</span>
          </div>
        </div>
      </div>

      {todayAttendance ? (
        <div className="space-y-3 sm:space-y-4">
          {/* Attendance Status Card */}
          <div className="bg-neutral-800/50 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-neutral-700">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl ${statusConfig[todayAttendance.status].color} flex items-center justify-center flex-shrink-0`}>
                {(() => {
                  const Icon = statusConfig[todayAttendance.status].icon
                  return <Icon className="text-xl sm:text-3xl text-white" />
                })()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-neutral-400 text-xs sm:text-sm">Today's Status</p>
                <p className="text-xl sm:text-2xl font-bold text-white">
                  {statusConfig[todayAttendance.status].label}
                </p>
                {todayAttendance.checkInTime && (
                  <p className="text-neutral-400 text-xs sm:text-sm mt-1">
                    Checked in at {todayAttendance.checkInTime}
                  </p>
                )}
                {todayAttendance.onDutyLocation && (
                  <p className="text-blue-400 text-xs sm:text-sm mt-1 truncate">
                    📍 {todayAttendance.onDutyLocation}
                  </p>
                )}
                
                {/* Location verification status */}
                <div className="mt-2">
                  <LocationStatus 
                    locationVerified={todayAttendance.locationVerified}
                    latitude={todayAttendance.latitude}
                    longitude={todayAttendance.longitude}
                    accuracy={todayAttendance.locationAccuracy}
                  />
                </div>
              </div>
              <div className="text-left sm:text-right flex sm:flex-col items-center sm:items-end gap-2 sm:gap-0 w-full sm:w-auto mt-2 sm:mt-0">
                <div className="flex items-center gap-1 text-emerald-400 text-xs sm:text-sm">
                  <FaShieldAlt />
                  <span>Verified</span>
                </div>
                <p className="text-neutral-500 text-xs mt-0 sm:mt-1">Cannot re-mark</p>
              </div>
            </div>
          </div>

          {/* Daily Report Section - Editable until 6:00 PM */}
          <div className="bg-neutral-800/50 rounded-xl p-4 border border-neutral-700">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                <FaHistory className="text-primary-400" />
                Daily Report
              </label>
              {isEditingAllowed() ? (
                !editingNotes && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingNotes(true)}
                  >
                    {todayAttendance.notes ? 'Edit Report' : '+ Add Report'}
                  </Button>
                )
              ) : (
                <Badge variant="primary" className="text-xs">
                  Locked (after 6 PM)
                </Badge>
              )}
            </div>
            
            {editingNotes && isEditingAllowed() ? (
              <div className="space-y-3">
                {/* Rich Text Toolbar for Edit Mode */}
                <div className="flex items-center gap-1 p-2 bg-neutral-900 rounded-t-lg border border-neutral-700 border-b-0">
                  <button
                    type="button"
                    onClick={() => {
                      const textarea = document.getElementById('edit-report-textarea') as HTMLTextAreaElement
                      if (textarea) {
                        const start = textarea.selectionStart
                        const end = textarea.selectionEnd
                        const selectedText = updatedNotes.substring(start, end)
                        const newText = updatedNotes.substring(0, start) + `**${selectedText}**` + updatedNotes.substring(end)
                        setUpdatedNotes(newText)
                        setTimeout(() => {
                          textarea.focus()
                          textarea.setSelectionRange(start + 2, end + 2)
                        }, 0)
                      }
                    }}
                    className="p-2 hover:bg-neutral-700 rounded text-neutral-300 hover:text-white transition-colors font-bold"
                    title="Bold"
                  >
                    B
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const textarea = document.getElementById('edit-report-textarea') as HTMLTextAreaElement
                      if (textarea) {
                        const start = textarea.selectionStart
                        const end = textarea.selectionEnd
                        const selectedText = updatedNotes.substring(start, end)
                        const newText = updatedNotes.substring(0, start) + `_${selectedText}_` + updatedNotes.substring(end)
                        setUpdatedNotes(newText)
                        setTimeout(() => {
                          textarea.focus()
                          textarea.setSelectionRange(start + 1, end + 1)
                        }, 0)
                      }
                    }}
                    className="p-2 hover:bg-neutral-700 rounded text-neutral-300 hover:text-white transition-colors italic"
                    title="Italic"
                  >
                    I
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const textarea = document.getElementById('edit-report-textarea') as HTMLTextAreaElement
                      if (textarea) {
                        const start = textarea.selectionStart
                        const end = textarea.selectionEnd
                        const selectedText = updatedNotes.substring(start, end)
                        const newText = updatedNotes.substring(0, start) + `__${selectedText}__` + updatedNotes.substring(end)
                        setUpdatedNotes(newText)
                        setTimeout(() => {
                          textarea.focus()
                          textarea.setSelectionRange(start + 2, end + 2)
                        }, 0)
                      }
                    }}
                    className="p-2 hover:bg-neutral-700 rounded text-neutral-300 hover:text-white transition-colors underline"
                    title="Underline"
                  >
                    U
                  </button>
                  <div className="w-px h-6 bg-neutral-600 mx-1" />
                  <button
                    type="button"
                    onClick={() => {
                      const textarea = document.getElementById('edit-report-textarea') as HTMLTextAreaElement
                      if (textarea) {
                        const start = textarea.selectionStart
                        const newText = updatedNotes.substring(0, start) + '\n• ' + updatedNotes.substring(start)
                        setUpdatedNotes(newText)
                        setTimeout(() => {
                          textarea.focus()
                          textarea.setSelectionRange(start + 3, start + 3)
                        }, 0)
                      }
                    }}
                    className="p-2 hover:bg-neutral-700 rounded text-neutral-300 hover:text-white transition-colors flex items-center gap-1"
                    title="Bullet Point"
                  >
                    <span className="text-lg leading-none">•</span>
                    <span className="text-xs">List</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const textarea = document.getElementById('edit-report-textarea') as HTMLTextAreaElement
                      if (textarea) {
                        const start = textarea.selectionStart
                        const beforeText = updatedNotes.substring(0, start)
                        const lines = beforeText.split('\n')
                        let lastNumber = 0
                        for (const line of lines) {
                          const match = line.match(/^(\d+)\.\s/)
                          if (match) {
                            lastNumber = parseInt(match[1])
                          }
                        }
                        const nextNumber = lastNumber + 1
                        const newText = updatedNotes.substring(0, start) + `\n${nextNumber}. ` + updatedNotes.substring(start)
                        setUpdatedNotes(newText)
                        setTimeout(() => {
                          textarea.focus()
                          const cursorPos = start + 3 + nextNumber.toString().length
                          textarea.setSelectionRange(cursorPos, cursorPos)
                        }, 0)
                      }
                    }}
                    className="p-2 hover:bg-neutral-700 rounded text-neutral-300 hover:text-white transition-colors flex items-center gap-1"
                    title="Numbered List"
                  >
                    <span className="text-sm leading-none">1.</span>
                    <span className="text-xs">List</span>
                  </button>
                </div>
                <textarea
                  id="edit-report-textarea"
                  value={updatedNotes}
                  onChange={(e) => setUpdatedNotes(e.target.value)}
                  placeholder="Describe what you worked on today, tasks completed, meetings attended, etc."
                  rows={4}
                  className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 border-t-0 rounded-b-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none font-mono text-sm"
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingNotes(false)
                      setUpdatedNotes(todayAttendance.notes || '')
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    loading={savingNotes}
                    onClick={handleUpdateNotes}
                    icon={<FaCheckCircle />}
                  >
                    Save Report
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-neutral-300 text-sm whitespace-pre-wrap">
                  {todayAttendance.notes ? (
                    <LinkifiedText text={todayAttendance.notes} />
                  ) : (
                    <span className="text-neutral-500 italic">No daily report submitted.</span>
                  )}
                </div>
                {isEditingAllowed() && (
                  <p className="text-xs text-amber-400 mt-2">
                    You can update your daily report until 6:00 PM
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Anti-fraud Notice */}
          <Alert variant="warning">
            Attendance can only be marked once per day. If you need to make corrections, please contact the administrator.
          </Alert>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Info Banner */}
          <Alert variant="info">
            Please mark your attendance for today. If not marked by end of day, it will be automatically recorded as <span className="font-bold text-red-400">Absent</span>.
          </Alert>

          {/* Location Permission Notice */}
          {locationStatus !== 'granted' && (
            <Alert variant="warning" icon={<FaMapMarkerAlt />}>
              <strong>Location Required:</strong> Please enable location access for accurate attendance verification. 
              Your location will be captured when you mark attendance to verify you're at the office.
            </Alert>
          )}

          {/* Status Options */}
          <div>
            <label className="text-sm font-medium text-neutral-300 mb-3 block">Select Status</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {availableStatuses.map(({ status, label, icon: Icon, color, textColor, bgLight }) => (
                <motion.button
                  key={status}
                  onClick={() => {
                    if (status === 'L') {
                      // Open leave request modal instead of selecting directly
                      setLeaveRequestForm(prev => ({ ...prev, date: todayString }))
                      setShowLeaveRequestModal(true)
                    } else {
                      setSelectedStatus(status)
                    }
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    p-4 rounded-xl border-2 transition-all flex items-center gap-3
                    ${selectedStatus === status
                      ? `${color} border-white/50 shadow-lg`
                      : 'bg-neutral-800/50 border-neutral-700 hover:border-neutral-600'
                    }
                  `}
                >
                  <div className={`w-10 h-10 rounded-lg ${selectedStatus === status ? 'bg-white/20' : bgLight} flex items-center justify-center`}>
                    <Icon className={`text-xl ${selectedStatus === status ? 'text-white' : textColor}`} />
                  </div>
                  <span className={`font-medium ${selectedStatus === status ? 'text-white' : 'text-neutral-300'}`}>
                    {label}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Leave Request Modal */}
          <Modal
            isOpen={showLeaveRequestModal}
            onClose={() => setShowLeaveRequestModal(false)}
            title="Request Leave"
            size="md"
          >
            <div className="space-y-4">
              <Input
                label="Leave Date"
                type="date"
                value={leaveRequestForm.date}
                onChange={(e) => setLeaveRequestForm(prev => ({ ...prev, date: e.target.value }))}
                min={todayString}
              />
              
              <Input
                label="Subject"
                placeholder="e.g., Personal Leave, Medical Leave..."
                value={leaveRequestForm.subject}
                onChange={(e) => setLeaveRequestForm(prev => ({ ...prev, subject: e.target.value }))}
                required
              />
              
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Formal Leave Letter
                </label>
                <textarea
                  value={leaveRequestForm.letter}
                  onChange={(e) => setLeaveRequestForm(prev => ({ ...prev, letter: e.target.value }))}
                  placeholder="Write your formal leave letter here..."
                  rows={5}
                  className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-sm"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Reason
                </label>
                <textarea
                  value={leaveRequestForm.reason}
                  onChange={(e) => setLeaveRequestForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Brief reason for leave..."
                  rows={3}
                  className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-sm"
                  required
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
                <Button variant="ghost" onClick={() => setShowLeaveRequestModal(false)}>
                  Cancel
                </Button>
                <Button
                  loading={submittingLeaveRequest}
                  disabled={!leaveRequestForm.subject.trim() || !leaveRequestForm.letter.trim() || !leaveRequestForm.reason.trim()}
                  icon={<FaEnvelope />}
                  onClick={async () => {
                    setSubmittingLeaveRequest(true)
                    try {
                      await submitLeaveRequest(leaveRequestForm)
                      toast.success('Leave request submitted successfully! Admins have been notified.')
                      setShowLeaveRequestModal(false)
                      setLeaveRequestForm({ date: todayString, subject: '', letter: '', reason: '' })
                    } catch (error) {
                      console.error('Error submitting leave request:', error)
                      toast.error('Failed to submit leave request')
                    } finally {
                      setSubmittingLeaveRequest(false)
                    }
                  }}
                >
                  Submit Request
                </Button>
              </div>
            </div>
          </Modal>

          {/* On Duty Location */}
          <AnimatePresence>
            {selectedStatus === 'O' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Card className="border-l-4 border-l-blue-500">
                  <p className="text-sm text-blue-400 font-medium flex items-center gap-2 mb-4">
                    <FaBriefcase />
                    On Duty Details
                  </p>
                  <Input
                    placeholder="Enter location/client site (e.g., Client Office - TechCorp, Work from Home)"
                    value={onDutyLocation}
                    onChange={(e) => setOnDutyLocation(e.target.value)}
                  />
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Daily Report - Required */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300 block">
              Daily Report <span className="text-red-400">*</span>
            </label>
            <p className="text-xs text-neutral-500">
              Describe your tasks, meetings, and accomplishments for today.
            </p>
            
            {/* Rich Text Toolbar */}
            <div className="flex items-center gap-1 p-2 bg-neutral-800/50 rounded-t-lg border border-neutral-700 border-b-0">
              <button
                type="button"
                onClick={() => {
                  const textarea = document.getElementById('daily-report-textarea') as HTMLTextAreaElement
                  if (textarea) {
                    const start = textarea.selectionStart
                    const end = textarea.selectionEnd
                    const selectedText = notes.substring(start, end)
                    const newText = notes.substring(0, start) + `**${selectedText}**` + notes.substring(end)
                    setNotes(newText)
                    setTimeout(() => {
                      textarea.focus()
                      textarea.setSelectionRange(start + 2, end + 2)
                    }, 0)
                  }
                }}
                className="p-2 hover:bg-neutral-700 rounded text-neutral-300 hover:text-white transition-colors font-bold"
                title="Bold"
              >
                B
              </button>
              <button
                type="button"
                onClick={() => {
                  const textarea = document.getElementById('daily-report-textarea') as HTMLTextAreaElement
                  if (textarea) {
                    const start = textarea.selectionStart
                    const end = textarea.selectionEnd
                    const selectedText = notes.substring(start, end)
                    const newText = notes.substring(0, start) + `_${selectedText}_` + notes.substring(end)
                    setNotes(newText)
                    setTimeout(() => {
                      textarea.focus()
                      textarea.setSelectionRange(start + 1, end + 1)
                    }, 0)
                  }
                }}
                className="p-2 hover:bg-neutral-700 rounded text-neutral-300 hover:text-white transition-colors italic"
                title="Italic"
              >
                I
              </button>
              <button
                type="button"
                onClick={() => {
                  const textarea = document.getElementById('daily-report-textarea') as HTMLTextAreaElement
                  if (textarea) {
                    const start = textarea.selectionStart
                    const end = textarea.selectionEnd
                    const selectedText = notes.substring(start, end)
                    const newText = notes.substring(0, start) + `__${selectedText}__` + notes.substring(end)
                    setNotes(newText)
                    setTimeout(() => {
                      textarea.focus()
                      textarea.setSelectionRange(start + 2, end + 2)
                    }, 0)
                  }
                }}
                className="p-2 hover:bg-neutral-700 rounded text-neutral-300 hover:text-white transition-colors underline"
                title="Underline"
              >
                U
              </button>
              <div className="w-px h-6 bg-neutral-600 mx-1" />
              <button
                type="button"
                onClick={() => {
                  const textarea = document.getElementById('daily-report-textarea') as HTMLTextAreaElement
                  if (textarea) {
                    const start = textarea.selectionStart
                    const newText = notes.substring(0, start) + '\n• ' + notes.substring(start)
                    setNotes(newText)
                    setTimeout(() => {
                      textarea.focus()
                      textarea.setSelectionRange(start + 3, start + 3)
                    }, 0)
                  }
                }}
                className="p-2 hover:bg-neutral-700 rounded text-neutral-300 hover:text-white transition-colors flex items-center gap-1"
                title="Bullet Point"
              >
                <span className="text-lg leading-none">•</span>
                <span className="text-xs">List</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const textarea = document.getElementById('daily-report-textarea') as HTMLTextAreaElement
                  if (textarea) {
                    const start = textarea.selectionStart
                    const beforeText = notes.substring(0, start)
                    // Count existing numbered items to suggest next number
                    const lines = beforeText.split('\n')
                    let lastNumber = 0
                    for (const line of lines) {
                      const match = line.match(/^(\d+)\.\s/)
                      if (match) {
                        lastNumber = parseInt(match[1])
                      }
                    }
                    const nextNumber = lastNumber + 1
                    const newText = notes.substring(0, start) + `\n${nextNumber}. ` + notes.substring(start)
                    setNotes(newText)
                    setTimeout(() => {
                      textarea.focus()
                      const cursorPos = start + 3 + nextNumber.toString().length
                      textarea.setSelectionRange(cursorPos, cursorPos)
                    }, 0)
                  }
                }}
                className="p-2 hover:bg-neutral-700 rounded text-neutral-300 hover:text-white transition-colors flex items-center gap-1"
                title="Numbered List"
              >
                <span className="text-sm leading-none">1.</span>
                <span className="text-xs">List</span>
              </button>
            </div>
            
            <textarea
              id="daily-report-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe your tasks, meetings attended, accomplishments, etc.&#10;&#10;Example:&#10;• Completed UI design for dashboard&#10;• Attended sprint planning meeting&#10;• Fixed bug in user authentication"
              rows={5}
              className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 border-t-0 rounded-b-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none font-mono text-sm"
              required
            />
            {!notes.trim() && selectedStatus && (
              <p className="text-xs text-red-400 mt-1">Daily report is required</p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleMarkAttendance}
            disabled={marking || !selectedStatus}
            loading={marking}
            fullWidth
            size="lg"
            icon={fetchingLocation ? <FaLocationArrow /> : <FaCheckCircle />}
          >
            {marking 
              ? (fetchingLocation ? 'Getting Location...' : 'Marking Attendance...') 
              : selectedStatus 
                ? `Mark Attendance for Today`
                : 'Select a status above to mark attendance'
            }
          </Button>
        </div>
      )}
    </Card>
  )
}

// ============================================
// ATTENDANCE STATS COMPONENT
// ============================================

interface StatsCardProps {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  color: string
  subtext?: string
}

function StatsCard({ title, value, icon: Icon, color, subtext }: StatsCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-4"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-neutral-400 text-sm">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {subtext && <p className="text-neutral-500 text-xs mt-0.5">{subtext}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="text-lg text-white" />
        </div>
      </div>
    </motion.div>
  )
}

// ============================================
// ATTENDANCE DASHBOARD COMPONENT
// ============================================

export function AttendanceDashboard({ refreshKey }: { refreshKey?: number }) {
  const { getAttendanceRecords, calculateAttendancePercentage } = useEmployeeAuth()
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month')

  useEffect(() => {
    const fetchRecords = async () => {
      setLoading(true)
      try {
        let startDate: Date | undefined
        const endDate = new Date()

        if (timeRange === 'week') {
          startDate = new Date()
          startDate.setDate(startDate.getDate() - 7)
        } else if (timeRange === 'month') {
          startDate = new Date()
          startDate.setDate(1)
        }

        const data = await getAttendanceRecords(startDate, endDate)
        setRecords(data)
      } catch (error) {
        console.error('Error fetching records:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchRecords()
  }, [timeRange, getAttendanceRecords, refreshKey])

  const presentDays = records.filter(r => r.status === 'P').length
  const absentDays = records.filter(r => r.status === 'A').length
  const leaveDays = records.filter(r => r.status === 'L').length
  const onDutyDays = records.filter(r => r.status === 'O').length
  const unauthorisedLeaveDays = records.filter(r => r.status === 'U').length
  const wfhDays = records.filter(r => r.status === 'W').length
  const percentage = calculateAttendancePercentage(records)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-white">Attendance Overview</h2>
        <div className="flex items-center bg-neutral-800 rounded-lg p-1">
          {(['week', 'month', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-primary-600 text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {range === 'week' ? 'Week' : range === 'month' ? 'This Month' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-7 gap-4">
            <StatsCard 
              title="Attendance Rate" 
              value={`${percentage}%`} 
              icon={FaCalendarCheck} 
              color="bg-gradient-to-br from-primary-500 to-purple-600"
              subtext={`${records.length} total days`}
            />
            <StatsCard title="Present" value={presentDays} icon={FaCheckCircle} color="bg-emerald-500" />
            <StatsCard title="Absent" value={absentDays} icon={FaTimesCircle} color="bg-red-500" />
            <StatsCard title="Leave" value={leaveDays} icon={FaUmbrellaBeach} color="bg-amber-500" />
            <StatsCard title="On Duty" value={onDutyDays} icon={FaBriefcase} color="bg-blue-500" />
            <StatsCard title="Unauth. Leave" value={unauthorisedLeaveDays} icon={FaBan} color="bg-rose-600" />
            <StatsCard title="WFH" value={wfhDays} icon={FaHome} color="bg-cyan-500" />
          </div>

          {/* Progress Bar */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <span className="text-neutral-300">Overall Attendance</span>
              <span className={`text-2xl font-bold ${
                percentage >= 80 ? 'text-emerald-400' : 
                percentage >= 60 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {percentage}%
              </span>
            </div>
            <div className="h-3 bg-neutral-800 rounded-full overflow-hidden relative">
              <div className="absolute left-[80%] top-0 bottom-0 w-0.5 bg-white/30 z-10" />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={`h-full rounded-full ${
                  percentage >= 80 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 
                  percentage >= 60 ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 
                  'bg-gradient-to-r from-red-500 to-red-400'
                }`}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-neutral-500">
              <span>0%</span>
              <span className="text-amber-400 font-medium">Target: 80%</span>
              <span>100%</span>
            </div>
            {percentage < 80 && (
              <Alert variant="error" className="mt-4">
                <FaExclamationTriangle className="mr-2" />
                Your attendance is below the minimum required 80%. Please improve.
              </Alert>
            )}
          </Card>
        </>
      )}
    </div>
  )
}

// ============================================
// ATTENDANCE HISTORY COMPONENT
// ============================================

export function AttendanceHistory({ refreshKey }: { refreshKey?: number }) {
  const { getAttendanceRecords } = useEmployeeAuth()
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecords = async () => {
      setLoading(true)
      try {
        const data = await getAttendanceRecords()
        setRecords(data.slice(0, 30))
      } catch (error) {
        console.error('Error fetching records:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchRecords()
  }, [getAttendanceRecords, refreshKey])

  if (loading) {
    return (
      <Card padding="lg">
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      </Card>
    )
  }

  return (
    <Card padding="lg">
      <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
        <FaHistory className="text-primary-500" />
        Attendance History
      </h2>

      {records.length === 0 ? (
        <div className="text-center py-12 text-neutral-400">
          <FaCalendarCheck className="text-5xl mx-auto mb-4 opacity-50" />
          <p>No attendance records found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-neutral-400 text-sm border-b border-neutral-800">
                <th className="pb-3 pr-4 font-medium">Date</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 pr-4 font-medium">Check In</th>
                <th className="pb-3 pr-4 font-medium">Location</th>
                <th className="pb-3 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record, index) => {
                const config = statusConfig[record.status]
                const date = new Date(record.date)
                return (
                  <motion.tr 
                    key={record.id} 
                    initial={{ opacity: 0, x: -20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-neutral-800/50 hover:bg-neutral-800/30 transition-colors"
                  >
                    <td className="py-3 pr-4">
                      <div>
                        <p className="text-white font-medium">
                          {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </p>
                        <p className="text-neutral-500 text-xs">{date.getFullYear()}</p>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge 
                        variant={
                          record.status === 'P' ? 'success' :
                          record.status === 'A' ? 'error' :
                          record.status === 'L' ? 'warning' :
                          record.status === 'U' ? 'error' :
                          record.status === 'W' ? 'info' :
                          record.status === 'O' ? 'info' : 'primary'
                        }
                      >
                        <config.icon className="mr-1 text-xs" />
                        {config.label}
                        {record.status === 'P' && record.locationVerified && (
                          <FaCheckCircle className="ml-1 text-xs" />
                        )}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-neutral-300 text-sm">
                      {record.checkInTime || '-'}
                    </td>
                    <td className="py-3 pr-4">
                      <LocationStatus 
                        locationVerified={record.locationVerified}
                        latitude={record.latitude}
                        longitude={record.longitude}
                      />
                    </td>
                    <td className="py-3 text-neutral-400 text-sm max-w-xs truncate">
                      {record.notes || '-'}
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

export default AttendanceMarker
