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
  FaHistory
} from 'react-icons/fa'
import { useEmployeeAuth, AttendanceRecord } from '@/lib/employeePortalContext'
import { Card, Button, Textarea, Input, Badge, Alert, Spinner } from './ui'
import { toast } from 'sonner'

// ============================================
// STATUS CONFIGURATION
// ============================================

const statusConfig = {
  P: { label: 'Present', color: 'bg-emerald-500', icon: FaCheckCircle, textColor: 'text-emerald-400', bgLight: 'bg-emerald-500/20' },
  A: { label: 'Absent', color: 'bg-red-500', icon: FaTimesCircle, textColor: 'text-red-400', bgLight: 'bg-red-500/20' },
  L: { label: 'Leave', color: 'bg-amber-500', icon: FaUmbrellaBeach, textColor: 'text-amber-400', bgLight: 'bg-amber-500/20' },
  O: { label: 'On Duty', color: 'bg-blue-500', icon: FaBriefcase, textColor: 'text-blue-400', bgLight: 'bg-blue-500/20' },
  H: { label: 'Holiday', color: 'bg-purple-500', icon: FaPlane, textColor: 'text-purple-400', bgLight: 'bg-purple-500/20' }
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
      <FaMapMarkerAlt />
      <span>
        {locationVerified ? 'Verified (at office)' : 'Unverified (outside office)'}
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
    holidays
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

  // Check location permission on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.permissions?.query({ name: 'geolocation' }).then((result) => {
        setLocationStatus(result.state === 'granted' ? 'granted' : result.state === 'denied' ? 'denied' : 'pending')
        result.onchange = () => {
          setLocationStatus(result.state === 'granted' ? 'granted' : result.state === 'denied' ? 'denied' : 'pending')
        }
      }).catch(() => {
        setLocationStatus('pending')
      })
    } else {
      setLocationStatus('unavailable')
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

  const handleMarkAttendance = async () => {
    if (!selectedStatus) {
      toast.error('Please select your attendance status')
      return
    }

    // Check if location is enabled - MANDATORY for Present and On Duty
    if ((selectedStatus === 'P' || selectedStatus === 'O') && locationStatus !== 'granted') {
      toast.error('Location services are mandatory for attendance marking. Please enable location access.')
      // Try to request permission
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          () => {
            setLocationStatus('granted')
            toast.success('Location enabled! Please try marking attendance again.')
          },
          () => {
            setLocationStatus('denied')
            toast.error('Location permission denied. Please enable it in your browser settings.')
          }
        )
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
          if (result.locationVerified) {
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

  const handleUpdateNotes = async () => {
    setSavingNotes(true)
    try {
      await updateAttendanceNotes(updatedNotes)
      await fetchTodayAttendance()
      setEditingNotes(false)
      toast.success('Notes updated successfully!')
    } catch (error) {
      console.error('Error updating notes:', error)
      toast.error('Failed to update notes')
    } finally {
      setSavingNotes(false)
    }
  }

  // Available status options (no Absent - it's auto-marked)
  const availableStatuses = [
    { status: 'P' as const, ...statusConfig.P },
    { status: 'L' as const, ...statusConfig.L },
    { status: 'O' as const, ...statusConfig.O }
  ]

  // Request location permission
  const requestLocationPermission = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setLocationStatus('granted')
          toast.success('Location enabled successfully!')
        },
        (error) => {
          setLocationStatus('denied')
          if (error.code === error.PERMISSION_DENIED) {
            toast.error('Location permission denied. Please enable it in browser settings.')
          }
        },
        { enableHighAccuracy: true }
      )
    }
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

          {/* Notes Section - Editable */}
          <div className="bg-neutral-800/50 rounded-xl p-4 border border-neutral-700">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                <FaHistory className="text-primary-400" />
                Today's Work Notes
              </label>
              {!editingNotes && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingNotes(true)}
                >
                  {todayAttendance.notes ? 'Edit Notes' : '+ Add Notes'}
                </Button>
              )}
            </div>
            
            {editingNotes ? (
              <div className="space-y-3">
                <Textarea
                  value={updatedNotes}
                  onChange={(e) => setUpdatedNotes(e.target.value)}
                  placeholder="Describe what you worked on today, tasks completed, meetings attended, etc."
                  rows={4}
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
                    Save Notes
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-neutral-400 text-sm">
                {todayAttendance.notes || 'No notes added yet. Click "Add Notes" to describe your work today.'}
              </p>
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
                  onClick={() => setSelectedStatus(status)}
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

          {/* Leave Date Range */}
          <AnimatePresence>
            {selectedStatus === 'L' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Card className="border-l-4 border-l-amber-500">
                  <p className="text-sm text-amber-400 font-medium flex items-center gap-2 mb-4">
                    <FaUmbrellaBeach />
                    Leave Period
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="From Date"
                      type="date"
                      value={leaveStartDate}
                      onChange={(e) => setLeaveStartDate(e.target.value)}
                      min={todayString}
                    />
                    <Input
                      label="To Date"
                      type="date"
                      value={leaveEndDate}
                      onChange={(e) => setLeaveEndDate(e.target.value)}
                      min={leaveStartDate || todayString}
                    />
                  </div>
                  <p className="text-xs text-neutral-500 mt-2">Leave will be marked for all days in this range.</p>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

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

          {/* Notes */}
          <Textarea
            label="Notes (Optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes for today's attendance..."
            rows={2}
          />

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
                ? `Mark ${selectedStatus === 'L' ? 'Leave' : 'Attendance'} for Today`
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
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
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
                          record.status === 'O' ? 'info' : 'primary'
                        }
                      >
                        <config.icon className="mr-1 text-xs" />
                        {config.label}
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
