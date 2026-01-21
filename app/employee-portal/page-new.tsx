'use client'

import { useState, useEffect, useCallback } from 'react'
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
  FaBuilding,
  FaPhone,
  FaEnvelope,
  FaCalendarAlt,
  FaBars,
  FaTimes,
  FaChevronDown,
  FaExclamationTriangle,
  FaUsers,
  FaUserShield,
  FaTasks,
  FaComments,
  FaHome
} from 'react-icons/fa'
import { EmployeeAuthProvider, useEmployeeAuth } from '@/lib/employeePortalContext'
import { toast, Toaster } from 'sonner'
import Link from 'next/link'

// Import modular components
import { Calendar } from '@/components/employee-portal/Calendar'
import { Attendance } from '@/components/employee-portal/Attendance'
import { Tasks } from '@/components/employee-portal/Tasks'
import { Discussions } from '@/components/employee-portal/Discussions'
import { AdminPanel } from '@/components/employee-portal/AdminPanel'

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
      {/* Subtle Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-black" />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
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

        {/* Login Card */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Employee ID Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                <FaIdCard className="text-primary-400" />
                Employee ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="e.g., M-01 or M-A001"
                  className="w-full py-3 px-4 bg-neutral-800 border border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-white placeholder-neutral-500"
                />
              </div>
            </div>

            {/* Password Field */}
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

            {/* Login Button */}
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

          {/* Footer */}
          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-neutral-400 hover:text-primary-400 transition-colors">
              ← Back to matriXO Website
            </Link>
          </div>
        </div>

        {/* Security Badge */}
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
  { id: 'dashboard', label: 'Dashboard', icon: FaHome },
  { id: 'attendance', label: 'Attendance', icon: FaCalendarCheck },
  { id: 'calendar', label: 'Calendar', icon: FaCalendarAlt },
  { id: 'tasks', label: 'Tasks', icon: FaTasks },
  { id: 'discussions', label: 'Discussions', icon: FaComments },
]

const adminNavItems = [
  { id: 'admin', label: 'Admin Panel', icon: FaUserShield },
]

// ============================================
// SIDEBAR COMPONENT
// ============================================

function Sidebar({ 
  activeTab, 
  setActiveTab, 
  isOpen,
  onClose 
}: { 
  activeTab: string
  setActiveTab: (tab: string) => void
  isOpen: boolean
  onClose: () => void 
}) {
  const { employee, logout } = useEmployeeAuth()
  const isAdmin = employee?.role === 'admin'

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Logged out successfully')
    } catch (error) {
      toast.error('Failed to logout')
    }
  }

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : -280 }}
        className={`
          fixed top-0 left-0 bottom-0 w-[280px] bg-neutral-900 border-r border-neutral-800 z-50
          lg:relative lg:translate-x-0 lg:z-auto
          flex flex-col
        `}
      >
        {/* Logo */}
        <div className="p-6 border-b border-neutral-800">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logos/logo-dark.png" alt="matriXO" className="h-8" />
            <span className="text-white font-bold text-lg">Portal</span>
          </Link>
          <button
            onClick={onClose}
            className="absolute top-6 right-4 p-2 text-neutral-400 hover:text-white lg:hidden"
          >
            <FaTimes />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); onClose() }}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors
                ${activeTab === item.id 
                  ? 'bg-primary-500/20 text-primary-400' 
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                }
              `}
            >
              <item.icon />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}

          {isAdmin && (
            <>
              <div className="pt-4 pb-2">
                <p className="px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Admin</p>
              </div>
              {adminNavItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); onClose() }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors
                    ${activeTab === item.id 
                      ? 'bg-amber-500/20 text-amber-400' 
                      : 'text-amber-400/70 hover:text-amber-400 hover:bg-neutral-800'
                    }
                  `}
                >
                  <item.icon />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </>
          )}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-neutral-800">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-800/50">
            <img
              src={getProfileImageUrl(employee?.profileImage, employee?.name)}
              alt={employee?.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-primary-500"
              onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">{employee?.name}</p>
              <p className="text-xs text-neutral-500">{employee?.department}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 px-4 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
          >
            <FaSignOutAlt />
            Sign Out
          </button>
        </div>
      </motion.aside>
    </>
  )
}

// ============================================
// TOP HEADER COMPONENT
// ============================================

function TopHeader({ 
  onMenuClick,
  activeTab
}: { 
  onMenuClick: () => void
  activeTab: string
}) {
  const { employee } = useEmployeeAuth()
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const getCurrentPageTitle = () => {
    const item = [...navigationItems, ...adminNavItems].find(i => i.id === activeTab)
    return item?.label || 'Dashboard'
  }

  return (
    <header className="bg-neutral-900 border-b border-neutral-800 px-4 lg:px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="p-2 text-neutral-400 hover:text-white lg:hidden"
          >
            <FaBars />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">{getCurrentPageTitle()}</h1>
            <p className="text-sm text-neutral-500">
              {currentTime.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'short', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-neutral-400">
            <FaClock />
            <span className="font-mono tabular-nums">
              {currentTime.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <img
              src={getProfileImageUrl(employee?.profileImage, employee?.name)}
              alt={employee?.name}
              className="w-8 h-8 rounded-full object-cover border-2 border-primary-500 lg:hidden"
            />
          </div>
        </div>
      </div>
    </header>
  )
}

// ============================================
// DASHBOARD OVERVIEW COMPONENT
// ============================================

function DashboardOverview() {
  const { employee, attendanceRecords, holidays, tasks } = useEmployeeAuth()
  
  const presentDays = attendanceRecords.filter(r => r.status === 'present').length
  const absentDays = attendanceRecords.filter(r => r.status === 'absent').length
  const totalDays = attendanceRecords.length
  const attendancePercentage = totalDays > 0 
    ? Math.round(((presentDays + attendanceRecords.filter(r => r.status === 'late').length) / totalDays) * 100) 
    : 0

  const myTasks = tasks.filter(t => t.assignedTo === employee?.employeeId && t.status !== 'completed')
  const upcomingHolidays = holidays
    .filter(h => new Date(h.date) >= new Date())
    .slice(0, 3)

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-neutral-800/50 border border-neutral-700 rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <img
            src={getProfileImageUrl(employee?.profileImage, employee?.name)}
            alt={employee?.name}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-primary-500"
            onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR }}
          />
          <div>
            <h2 className="text-2xl font-bold text-white">
              Welcome back, {employee?.name?.split(' ')[0]}!
            </h2>
            <p className="text-neutral-400">
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
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Tasks */}
        <div className="bg-neutral-800/50 border border-neutral-700 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <FaTasks className="text-primary-400" />
            My Pending Tasks
          </h3>
          {myTasks.length === 0 ? (
            <p className="text-neutral-500 text-center py-4">No pending tasks</p>
          ) : (
            <div className="space-y-3">
              {myTasks.slice(0, 4).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-neutral-900/50 rounded-xl">
                  <div>
                    <p className="text-white font-medium">{task.title}</p>
                    <p className="text-xs text-neutral-500">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                  </div>
                  <span className={`
                    px-2 py-1 text-xs rounded-full font-medium
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

        {/* Upcoming Holidays */}
        <div className="bg-neutral-800/50 border border-neutral-700 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <FaCalendarAlt className="text-amber-400" />
            Upcoming Holidays
          </h3>
          {upcomingHolidays.length === 0 ? (
            <p className="text-neutral-500 text-center py-4">No upcoming holidays</p>
          ) : (
            <div className="space-y-3">
              {upcomingHolidays.map((holiday) => (
                <div key={holiday.id} className="flex items-center justify-between p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <div>
                    <p className="text-white font-medium">{holiday.name}</p>
                    <p className="text-xs text-neutral-500">
                      {new Date(holiday.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <span className="px-2 py-1 text-xs rounded-full bg-amber-500/20 text-amber-400 font-medium">
                    {holiday.type}
                  </span>
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
// STAT CARD COMPONENT
// ============================================

function StatCard({ title, value, icon: Icon, color }: { 
  title: string
  value: string | number
  icon: any
  color: string
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-neutral-800/50 border border-neutral-700 rounded-2xl p-6"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-neutral-400 text-sm">{title}</p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
          <Icon className="text-xl text-white" />
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
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isAdmin = employee?.role === 'admin'

  return (
    <div className="min-h-screen bg-neutral-950 flex">
      {/* Sidebar */}
      <Sidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-0">
        <TopHeader 
          onMenuClick={() => setSidebarOpen(true)}
          activeTab={activeTab}
        />
        
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && <DashboardOverview />}
              {activeTab === 'attendance' && <Attendance />}
              {activeTab === 'calendar' && <Calendar />}
              {activeTab === 'tasks' && <Tasks />}
              {activeTab === 'discussions' && <Discussions />}
              {activeTab === 'admin' && isAdmin && <AdminPanel />}
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className="border-t border-neutral-800 py-4 px-6">
          <p className="text-center text-neutral-500 text-sm">
            © {new Date().getFullYear()} matriXO Employee Portal. All rights reserved.
          </p>
        </footer>
      </div>
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
