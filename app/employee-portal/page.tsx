'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FaUser, 
  FaLock, 
  FaSignOutAlt, 
  FaCalendarCheck, 
  FaChartLine, 
  FaHistory,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaPlane,
  FaBriefcase,
  FaUmbrellaBeach,
  FaSpinner,
  FaIdCard,
  FaCalendarAlt,
  FaBars,
  FaTimes,
  FaExclamationTriangle,
  FaUserShield,
  FaTasks,
  FaComments,
  FaChevronDown,
  FaPlus,
  FaTrash,
  FaListAlt
} from 'react-icons/fa'
import { EmployeeAuthProvider, useEmployeeAuth } from '@/lib/employeePortalContext'
import { toast, Toaster } from 'sonner'
import Link from 'next/link'

// Import modular components
import Calendar from '@/components/employee-portal/Calendar'
import Attendance from '@/components/employee-portal/Attendance'
import Tasks from '@/components/employee-portal/Tasks'
import Discussions from '@/components/employee-portal/Discussions'
import AdminPanel from '@/components/employee-portal/AdminPanel'
import NotificationBell from '@/components/employee-portal/NotificationBell'
import { ProfileInfo, employeeToProfileData } from '@/components/employee-portal/ui'

// Default avatar placeholder
const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?name=User&background=7c3aed&color=fff&size=200'

// Simple helper to get profile image
const getProfileImageUrl = (url: string | undefined, name?: string): string => {
  if (url) return url
  if (name) {
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2)
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=7c3aed&color=fff&size=200`
  }
  return DEFAULT_AVATAR
}

// ============================================
// LOGIN COMPONENT
// ============================================

function LoginForm() {
  const [employeeId, setEmployeeId] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { signIn } = useEmployeeAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!employeeId || !password) {
      toast.error('Please enter both Employee ID and Password')
      return
    }
    
    setLoading(true)
    try {
      await signIn(employeeId, password)
      toast.success('Welcome back!')
    } catch (error: any) {
      console.error('Login error:', error)
      if (error.message === 'Employee ID not found') {
        toast.error('Employee ID not found. Please contact administrator.')
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        toast.error('Invalid password. Please try again.')
      } else {
        toast.error('Login failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-black" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <motion.img 
              src="/logos/logo-dark.png" 
              alt="matriXO" 
              className="h-12 mx-auto mb-4"
              whileHover={{ scale: 1.05 }}
            />
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Employee Portal</h1>
          <p className="text-neutral-400">Access your attendance dashboard</p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                <FaIdCard className="text-primary-400" />
                Employee ID
              </label>
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="e.g., M-01 or M-A001"
                className="w-full py-3 px-4 bg-neutral-800 border border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-white placeholder-neutral-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                <FaLock className="text-primary-400" />
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full py-3 px-4 bg-neutral-800 border border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-white placeholder-neutral-500 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              <p className="text-xs text-neutral-500 mt-2 flex items-start gap-1">
                <FaExclamationTriangle className="text-amber-500 mt-0.5 flex-shrink-0" />
                If you forget your password, please contact the system administrator.
              </p>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  <FaUser />
                  Sign In
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-neutral-400 hover:text-primary-400 transition-colors">
              ← Back to matriXO Website
            </Link>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-neutral-500">
          <span className="flex items-center gap-1">
            <FaLock className="text-green-500" /> Secure Login
          </span>
          <span>•</span>
          <span>256-bit Encryption</span>
        </div>
      </motion.div>
    </div>
  )
}

// ============================================
// NAVIGATION ITEMS
// ============================================

const navigationItems = [
  { id: 'attendance', label: 'Attendance', icon: FaCalendarCheck },
  { id: 'dashboard', label: 'Dashboard', icon: FaChartLine },
  { id: 'history', label: 'History', icon: FaHistory },
  { id: 'calendar', label: 'Calendar', icon: FaCalendarAlt },
  { id: 'tasks', label: 'Tasks', icon: FaTasks },
  { id: 'discussions', label: 'Discussions', icon: FaComments },
]

// ============================================
// TOP NAVIGATION BAR
// ============================================

function TopNavbar({ 
  activeTab, 
  setActiveTab 
}: { 
  activeTab: string
  setActiveTab: (tab: string) => void
}) {
  const { employee, logout } = useEmployeeAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [userMenuPosition, setUserMenuPosition] = useState({ top: 0, right: 0, isMobile: false })
  const [currentTime, setCurrentTime] = useState(new Date())
  const [mounted, setMounted] = useState(false)
  const userMenuButtonRef = useRef<HTMLButtonElement>(null)
  const userMenuDropdownRef = useRef<HTMLDivElement>(null)
  const isAdmin = employee?.role === 'admin'

  // Ensure mounted for portal
  useEffect(() => {
    setMounted(true)
  }, [])

  // Close user menu on ESC and outside click
  useEffect(() => {
    if (!userMenuOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setUserMenuOpen(false)
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        userMenuButtonRef.current && !userMenuButtonRef.current.contains(target) &&
        userMenuDropdownRef.current && !userMenuDropdownRef.current.contains(target)
      ) {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    // Delay adding click listener to avoid closing on same click
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 0)

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('mousedown', handleClickOutside)
      clearTimeout(timer)
    }
  }, [userMenuOpen])

  // Handle user menu click
  const handleUserMenuClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!userMenuOpen && userMenuButtonRef.current) {
      const rect = userMenuButtonRef.current.getBoundingClientRect()
      const isMobile = window.innerWidth < 640
      setUserMenuPosition({
        top: rect.bottom + 8,
        right: isMobile ? 8 : window.innerWidth - rect.right,
        isMobile
      })
    }
    setUserMenuOpen(prev => !prev)
  }

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Logged out successfully')
    } catch (error) {
      toast.error('Failed to logout')
    }
  }

  return (
    <nav className="bg-neutral-950/90 backdrop-blur-2xl border-b border-white/5 fixed top-0 left-0 right-0 overflow-x-hidden" style={{ zIndex: 9000 }}>
      {/* Gradient accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-600 via-primary-400 to-primary-600" />
      
      <div className="max-w-[100vw] px-4 md:px-6 mx-auto">
        <div className="flex items-center justify-between h-16 gap-2 md:gap-4 overflow-hidden">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 md:gap-3 group shrink-0">
            <img src="/logos/logo-dark.png" alt="matriXO" className="h-8 md:h-9 group-hover:scale-105 transition-transform" />
            <div className="hidden sm:flex flex-col">
              <span className="text-white font-bold text-sm leading-tight">Employee</span>
              <span className="text-primary-400 text-xs font-medium leading-tight">Portal</span>
            </div>
          </Link>

          {/* Desktop Navigation - Centered */}
          <div className="hidden xl:flex items-center justify-center flex-1 min-w-0 overflow-hidden">
            <div className="flex items-center gap-1">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 font-medium text-sm whitespace-nowrap
                    ${activeTab === item.id 
                      ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-500/30' 
                      : 'text-neutral-400 hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  <item.icon className="text-sm shrink-0" />
                  <span>{item.label}</span>
                </button>
              ))}
              
              {isAdmin && (
                <>
                  <div className="w-px h-6 bg-white/10 mx-1" />
                  <button
                    onClick={() => setActiveTab('admin')}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 font-medium text-sm whitespace-nowrap
                      ${activeTab === 'admin' 
                        ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-lg shadow-amber-500/30' 
                        : 'text-amber-400/80 hover:text-amber-400 hover:bg-amber-500/10'
                      }
                    `}
                  >
                    <FaUserShield className="text-sm shrink-0" />
                    <span>Admin</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Notification Bell */}
            <NotificationBell onNavigate={setActiveTab} />
            
            {/* Time Display - Only visible on Attendance tab */}
            {activeTab === 'attendance' && (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/5">
                <FaClock className="text-primary-400 text-sm" />
                <span className="font-mono tabular-nums text-white text-sm">
                  {currentTime.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </span>
              </div>
            )}

            {/* User Menu */}
            <div className="relative">
              <button
                ref={userMenuButtonRef}
                onClick={handleUserMenuClick}
                type="button"
                className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all duration-200 cursor-pointer"
              >
                <img
                  src={getProfileImageUrl(employee?.profileImage, employee?.name)}
                  alt={employee?.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-primary-500/50"
                  onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR }}
                />
                <span className="text-white font-medium hidden md:block text-sm">{employee?.name?.split(' ')[0]}</span>
                <FaChevronDown className={`text-neutral-400 text-xs hidden md:block transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* User Dropdown - Rendered via Portal */}
              {mounted && userMenuOpen && createPortal(
                <div
                  ref={userMenuDropdownRef}
                  style={{ 
                    position: 'fixed',
                    top: userMenuPosition.top,
                    right: userMenuPosition.isMobile ? 8 : userMenuPosition.right,
                    left: userMenuPosition.isMobile ? 8 : 'auto',
                    zIndex: 999999
                  }}
                >
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.15 }}
                    className={`bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl ${userMenuPosition.isMobile ? 'w-auto' : 'w-64'}`}
                  >
                    <div className="p-4 border-b border-white/5 bg-gradient-to-br from-primary-600/10 to-transparent rounded-t-2xl">
                      <div className="flex items-center gap-3">
                        <img
                          src={getProfileImageUrl(employee?.profileImage, employee?.name)}
                          alt={employee?.name}
                          className="w-12 h-12 rounded-xl object-cover ring-2 ring-primary-500/50"
                        />
                        <div className="min-w-0">
                          <p className="text-white font-semibold truncate">{employee?.name}</p>
                          <p className="text-xs text-primary-400">{employee?.department}</p>
                          <p className="text-xs text-neutral-500 font-mono">{employee?.employeeId}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                      >
                        <FaSignOutAlt />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </motion.div>
                </div>,
                document.body
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2.5 text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all"
            >
              {mobileMenuOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="xl:hidden border-t border-white/5 py-4"
            >
              <div className="grid grid-cols-2 gap-2">
                {navigationItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false) }}
                    className={`
                      flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all font-medium text-sm
                      ${activeTab === item.id 
                        ? 'bg-primary-500/20 text-primary-400 border border-primary-500/20' 
                        : 'text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent'
                      }
                    `}
                  >
                    <item.icon />
                    {item.label}
                  </button>
                ))}
                
                {isAdmin && (
                  <button
                    onClick={() => { setActiveTab('admin'); setMobileMenuOpen(false) }}
                    className={`
                      flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all font-medium text-sm col-span-2
                      ${activeTab === 'admin' 
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20' 
                        : 'text-amber-400/70 hover:text-amber-400 hover:bg-amber-500/10 border border-transparent'
                      }
                    `}
                  >
                    <FaUserShield />
                    Admin Panel
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  )
}

// ============================================
// DASHBOARD OVERVIEW (for Dashboard tab)
// ============================================

function DashboardOverview({ onTaskClick, onShowMyTasks }: { onTaskClick?: (taskId: string) => void; onShowMyTasks?: () => void }) {
  const { employee, getAttendanceRecords, tasks = [], personalTodos = [], addPersonalTodo, updatePersonalTodo, deletePersonalTodo } = useEmployeeAuth()
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newTodoTitle, setNewTodoTitle] = useState('')
  const [addingTodo, setAddingTodo] = useState(false)

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true)
      try {
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - 30)
        const records = await getAttendanceRecords(startDate, new Date())
        setAttendanceRecords(records || [])
      } catch (error) {
        console.error('Error fetching attendance:', error)
        setAttendanceRecords([])
      } finally {
        setLoading(false)
      }
    }
    fetchAttendance()
  }, [getAttendanceRecords])
  
  const presentDays = attendanceRecords.filter(r => r.status === 'P').length
  const absentDays = attendanceRecords.filter(r => r.status === 'A').length
  const onDutyDays = attendanceRecords.filter(r => r.status === 'O').length
  const totalDays = attendanceRecords.length
  // FIXED: Match Admin formula - (present + onDuty) / total
  const attendancePercentage = totalDays > 0 
    ? Math.round(((presentDays + onDutyDays) / totalDays) * 100) 
    : 0

  // Safely filter tasks - handle both array and string for assignedTo
  const myTasks = (tasks || []).filter(t => {
    if (!t || !employee?.employeeId) return false
    const assignedTo = t.assignedTo
    if (Array.isArray(assignedTo)) {
      return assignedTo.includes(employee.employeeId) && t.status !== 'completed'
    }
    if (typeof assignedTo === 'string') {
      return assignedTo === employee.employeeId && t.status !== 'completed'
    }
    return false
  })

  // Helpers for todo list
  const handleAddTodo = async () => {
    if (!newTodoTitle.trim()) return
    setAddingTodo(true)
    try {
      await addPersonalTodo(newTodoTitle.trim())
      setNewTodoTitle('')
      toast.success('Todo added')
    } catch (error: any) {
      console.error('Todo add error:', error)
      toast.error(error?.message || 'Failed to add todo')
    } finally {
      setAddingTodo(false)
    }
  }

  const handleToggleTodo = async (id: string, currentStatus: 'pending' | 'completed') => {
    try {
      await updatePersonalTodo(id, { status: currentStatus === 'pending' ? 'completed' : 'pending' })
    } catch (error) {
      toast.error('Failed to update todo')
    }
  }

  const handleDeleteTodo = async (id: string) => {
    try {
      await deletePersonalTodo(id)
      toast.success('Todo deleted')
    } catch (error) {
      toast.error('Failed to delete todo')
    }
  }

  // Filter: pending first, then completed
  const sortedTodos = [...personalTodos].sort((a, b) => {
    if (a.status === 'pending' && b.status === 'completed') return -1
    if (a.status === 'completed' && b.status === 'pending') return 1
    return 0
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <FaSpinner className="animate-spin text-4xl text-primary-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-neutral-800/50 border border-neutral-700 rounded-2xl p-4 sm:p-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <img
            src={getProfileImageUrl(employee?.profileImage, employee?.name)}
            alt={employee?.name}
            className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl object-cover border-2 border-primary-500"
            onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR }}
          />
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-2xl font-bold text-white truncate">
              Welcome back, {employee?.name?.split(' ')[0]}!
            </h2>
            <p className="text-neutral-400 text-sm sm:text-base truncate">
              {employee?.department} • {employee?.designation}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Attendance Rate"
          value={`${attendancePercentage}%`}
          icon={FaChartLine}
          color={attendancePercentage >= 80 ? 'bg-green-500' : attendancePercentage >= 60 ? 'bg-amber-500' : 'bg-red-500'}
        />
        <StatCard
          title="Present Days"
          value={presentDays}
          icon={FaCheckCircle}
          color="bg-green-500"
        />
        <StatCard
          title="Absent Days"
          value={absentDays}
          icon={FaTimesCircle}
          color="bg-red-500"
        />
        <StatCard
          title="Pending Tasks"
          value={myTasks.length}
          icon={FaTasks}
          color="bg-primary-500"
          onClick={onShowMyTasks}
        />
      </div>

      {/* My Tasks & Holidays */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl sm:rounded-2xl p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
            <FaTasks className="text-primary-400" />
            My Pending Tasks
          </h3>
          {myTasks.length === 0 ? (
            <p className="text-neutral-500 text-center py-4 text-sm sm:text-base">No pending tasks</p>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {myTasks.slice(0, 4).map((task) => (
                <div 
                  key={task.id} 
                  className="flex items-center justify-between p-2.5 sm:p-3 bg-neutral-900/50 rounded-lg sm:rounded-xl cursor-pointer hover:bg-neutral-800/50 transition-colors gap-2"
                  onClick={() => onTaskClick?.(task.id!)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-medium text-sm sm:text-base truncate">{task.title}</p>
                    <p className="text-xs text-neutral-500">
                      Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                    </p>
                  </div>
                  <span className={`
                    px-2 py-1 text-xs rounded-full font-medium flex-shrink-0
                    ${task.priority === 'urgent' ? 'bg-red-500/20 text-red-400' :
                      task.priority === 'high' ? 'bg-amber-500/20 text-amber-400' :
                      task.priority === 'medium' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-neutral-500/20 text-neutral-400'}
                  `}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl sm:rounded-2xl p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
            <FaListAlt className="text-primary-400" />
            My Todo List
          </h3>
          
          {/* Add Todo Input */}
          <div className="flex gap-2 mb-3 sm:mb-4">
            <input
              type="text"
              value={newTodoTitle}
              onChange={(e) => setNewTodoTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
              placeholder="Add a new todo..."
              className="flex-1 px-3 py-2 bg-neutral-900/50 border border-neutral-700 rounded-lg sm:rounded-xl text-white placeholder-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 min-w-0"
            />
            <button
              onClick={handleAddTodo}
              disabled={addingTodo || !newTodoTitle.trim()}
              className="px-3 py-2 bg-primary-500 hover:bg-primary-400 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white rounded-lg sm:rounded-xl transition-colors flex-shrink-0"
            >
              {addingTodo ? <FaSpinner className="animate-spin" /> : <FaPlus />}
            </button>
          </div>

          {sortedTodos.length === 0 ? (
            <p className="text-neutral-500 text-center py-4">No todos yet. Add one above!</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {sortedTodos.slice(0, 6).map((todo) => (
                <div 
                  key={todo.id} 
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    todo.status === 'completed' 
                      ? 'bg-neutral-900/30 border-neutral-800' 
                      : 'bg-neutral-900/50 border-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => todo.id && handleToggleTodo(todo.id, todo.status)}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        todo.status === 'completed' 
                          ? 'bg-green-500 border-green-500 text-white' 
                          : 'border-neutral-500 hover:border-primary-500'
                      }`}
                    >
                      {todo.status === 'completed' && <FaCheckCircle className="text-xs" />}
                    </button>
                    <span className={`text-sm truncate ${
                      todo.status === 'completed' ? 'text-neutral-500 line-through' : 'text-white'
                    }`}>
                      {todo.title}
                    </span>
                  </div>
                  <button
                    onClick={() => todo.id && handleDeleteTodo(todo.id)}
                    className="text-neutral-500 hover:text-red-400 transition-colors ml-2"
                  >
                    <FaTrash className="text-xs" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Attendance Warning */}
      {attendancePercentage < 80 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
          <FaExclamationTriangle className="text-red-400 mt-1 flex-shrink-0" />
          <div>
            <p className="text-red-400 font-medium">Low Attendance Warning</p>
            <p className="text-neutral-400 text-sm mt-1">
              Your attendance is below the minimum required 80%. Please improve your attendance to avoid any issues.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// HISTORY TAB
// ============================================

function HistoryTab() {
  const { getAttendanceRecords } = useEmployeeAuth()
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date())

  useEffect(() => {
    const fetchRecords = async () => {
      setLoading(true)
      try {
        const startDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1)
        const endDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0)
        const data = await getAttendanceRecords(startDate, endDate)
        setRecords(data.sort((a, b) => {
          const aTime = b.timestamp?.toDate?.() || new Date(b.timestamp as any)
          const bTime = a.timestamp?.toDate?.() || new Date(a.timestamp as any)
          return aTime.getTime() - bTime.getTime()
        }))
      } catch (error) {
        console.error('Error fetching records:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchRecords()
  }, [selectedMonth, getAttendanceRecords])

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    P: { label: 'Present', color: 'bg-green-500', icon: FaCheckCircle },
    A: { label: 'Absent', color: 'bg-red-500', icon: FaTimesCircle },
    L: { label: 'Leave', color: 'bg-yellow-500', icon: FaUmbrellaBeach },
    O: { label: 'On Duty', color: 'bg-blue-500', icon: FaBriefcase },
    H: { label: 'Holiday', color: 'bg-purple-500', icon: FaPlane }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl sm:rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <FaHistory className="text-primary-400" />
            Attendance History
          </h2>
          <input
            type="month"
            value={`${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}`}
            onChange={(e) => setSelectedMonth(new Date(e.target.value))}
            className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <FaSpinner className="animate-spin text-3xl text-primary-500" />
          </div>
        ) : records.length === 0 ? (
          <p className="text-neutral-500 text-center py-8">No attendance records for this month</p>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {records.map((record) => {
              const config = statusConfig[record.status] || statusConfig.P
              const StatusIcon = config.icon
              return (
                <div key={record.id} className="flex items-center justify-between p-3 sm:p-4 bg-neutral-900/50 rounded-lg sm:rounded-xl gap-3">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${config.color} flex items-center justify-center flex-shrink-0`}>
                      <StatusIcon className="text-white text-sm sm:text-base" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-medium text-sm sm:text-base truncate">
                        {(() => {
                          const timestamp = record.timestamp?.toDate ? record.timestamp.toDate() : new Date(record.timestamp)
                          return timestamp.toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })
                        })()}
                      </p>
                      <p className="text-xs text-neutral-500 truncate">
                        {(() => {
                          const timestamp = record.timestamp?.toDate ? record.timestamp.toDate() : new Date(record.timestamp)
                          return timestamp.toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        })()}
                        {record.notes && <span className="hidden sm:inline"> • {record.notes}</span>}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${config.color}/20 text-white flex-shrink-0 flex items-center gap-1`}>
                    {config.label}
                    {record.status === 'P' && record.locationVerified && (
                      <FaCheckCircle className="text-xs" />
                    )}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// STAT CARD COMPONENT
// ============================================

function StatCard({ title, value, icon: Icon, color, onClick }: { 
  title: string
  value: string | number
  icon: any
  color: string
  onClick?: () => void
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={`bg-neutral-800/50 border border-neutral-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 ${onClick ? 'cursor-pointer hover:border-primary-500/50 transition-colors' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-neutral-400 text-xs sm:text-sm truncate">{title}</p>
          <p className="text-xl sm:text-3xl font-bold text-white mt-1 sm:mt-2">{value}</p>
        </div>
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
          <Icon className="text-lg sm:text-xl text-white" />
        </div>
      </div>
    </motion.div>
  )
}

// ============================================
// MAIN DASHBOARD COMPONENT
// ============================================

function Dashboard() {
  const { employee } = useEmployeeAuth()
  const [activeTab, setActiveTab] = useState('attendance')
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [showOnlyMyTasks, setShowOnlyMyTasks] = useState(false)
  const isAdmin = employee?.role === 'admin'

  // Handler for pending task click from Dashboard
  const handlePendingTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId)
    setActiveTab('tasks')
  }

  // Handler for clicking on Pending Tasks stat card
  const handleShowMyTasks = () => {
    setShowOnlyMyTasks(true)
    setActiveTab('tasks')
  }

  // Clear selected task when leaving tasks tab
  useEffect(() => {
    if (activeTab !== 'tasks') {
      setSelectedTaskId(null)
      setShowOnlyMyTasks(false)
    }
  }, [activeTab])

  // 🔔 AUTO-REQUEST NOTIFICATION PERMISSION ON FIRST LOAD
  useEffect(() => {
    const requestPermissionOnLoad = async () => {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'default') {
          try {
            await Notification.requestPermission()
          } catch (error) {
            console.error('Failed to request notification permission:', error)
          }
        }
      }
    }
    requestPermissionOnLoad()
  }, [])

  return (
    <div className="min-h-screen bg-neutral-950 overflow-x-hidden max-w-[100vw]">
      {/* Top Navigation */}
      <TopNavbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Main Content - pt-20 compensates for fixed navbar height */}
      <main className="max-w-7xl mx-auto px-4 py-6 pt-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            {activeTab === 'attendance' && <Attendance />}
            {activeTab === 'dashboard' && <DashboardOverview onTaskClick={handlePendingTaskClick} onShowMyTasks={handleShowMyTasks} />}
            {activeTab === 'history' && <HistoryTab />}
            {activeTab === 'calendar' && <Calendar />}
            {activeTab === 'tasks' && <Tasks selectedTaskId={selectedTaskId} onTaskOpened={() => setSelectedTaskId(null)} showOnlyMyTasks={showOnlyMyTasks} />}
            {activeTab === 'discussions' && <Discussions />}
            {activeTab === 'admin' && isAdmin && <AdminPanel />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800 py-6 mt-auto">
        <p className="text-center text-neutral-500 text-sm">
          © {new Date().getFullYear()} matriXO Employee Portal. All rights reserved.
        </p>
      </footer>
    </div>
  )
}

// ============================================
// MAIN PAGE COMPONENT WITH AUTH CHECK
// ============================================

function EmployeePortalContent() {
  const { user, loading } = useEmployeeAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-5xl text-primary-500 mx-auto mb-4" />
          <p className="text-neutral-400">Loading...</p>
        </div>
      </div>
    )
  }

  return user ? <Dashboard /> : <LoginForm />
}

// ============================================
// EXPORT PAGE WITH PROVIDER
// ============================================

export default function EmployeePortalPage() {
  return (
    <EmployeeAuthProvider>
      <EmployeePortalContent />
      <Toaster position="top-right" richColors />
    </EmployeeAuthProvider>
  )
}
