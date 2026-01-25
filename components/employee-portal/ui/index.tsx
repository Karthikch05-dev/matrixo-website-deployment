'use client'

import { ReactNode, forwardRef, useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaSpinner, FaChevronDown, FaTimes, FaCheck, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa'

// ============================================
// DESIGN TOKENS - Professional Color Palette
// ============================================
export const colors = {
  // Primary brand colors
  primary: {
    50: '#f0f4ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1', // Main primary
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
  },
  // Neutral grays
  neutral: {
    50: '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
    900: '#18181b',
    950: '#0f0f11',
  },
  // Semantic colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
}

// ============================================
// BUTTON COMPONENT (Glassmorphism)
// ============================================
interface ButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  className?: string
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  onClick,
  type = 'button',
  className = '',
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900 backdrop-blur-sm'
  
  const variants = {
    primary: 'bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white focus:ring-primary-500 shadow-lg shadow-primary-500/25 border border-primary-400/20',
    secondary: 'bg-white/5 hover:bg-white/10 text-white focus:ring-neutral-500 border border-white/10 backdrop-blur-xl',
    ghost: 'bg-transparent hover:bg-white/5 text-neutral-300 hover:text-white focus:ring-neutral-500',
    danger: 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white focus:ring-red-500 shadow-lg shadow-red-500/25 border border-red-400/20',
    success: 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white focus:ring-emerald-500 shadow-lg shadow-emerald-500/25 border border-emerald-400/20',
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
  }
  
  return (
    <motion.button
      ref={ref}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {loading && <FaSpinner className="animate-spin" />}
      {!loading && icon && iconPosition === 'left' && icon}
      {children}
      {!loading && icon && iconPosition === 'right' && icon}
    </motion.button>
  )
})
Button.displayName = 'Button'

// ============================================
// INPUT COMPONENT
// ============================================
interface InputProps {
  label?: string
  placeholder?: string
  type?: 'text' | 'password' | 'email' | 'number' | 'date' | 'datetime-local' | 'time' | 'month'
  value?: string | number
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  error?: string
  icon?: ReactNode
  disabled?: boolean
  required?: boolean
  className?: string
  min?: string
  max?: string
  name?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  placeholder,
  type = 'text',
  value,
  onChange,
  error,
  icon,
  disabled = false,
  required = false,
  className = '',
  min,
  max,
  name,
}, ref) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-neutral-300">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          min={min}
          max={max}
          name={name}
          className={`
            w-full px-4 py-3 bg-white/5 backdrop-blur-xl border rounded-xl text-white placeholder-neutral-500
            focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 focus:bg-white/10
            transition-all duration-300
            ${icon ? 'pl-10' : ''}
            ${error ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 hover:border-white/20'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        />
      </div>
      {error && (
        <p className="text-sm text-red-400 flex items-center gap-1">
          <FaExclamationTriangle className="text-xs" />
          {error}
        </p>
      )}
    </div>
  )
})
Input.displayName = 'Input'

// ============================================
// TEXTAREA COMPONENT
// ============================================
interface TextareaProps {
  label?: string
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  error?: string
  disabled?: boolean
  required?: boolean
  rows?: number
  className?: string
  name?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  placeholder,
  value,
  onChange,
  onKeyDown,
  error,
  disabled = false,
  required = false,
  rows = 4,
  className = '',
  name,
}, ref) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-neutral-300">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        rows={rows}
        name={name}
        className={`
          w-full px-4 py-3 bg-white/5 backdrop-blur-xl border rounded-xl text-white placeholder-neutral-500
          focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 focus:bg-white/10
          transition-all duration-300 resize-none
          ${error ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 hover:border-white/20'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      />
      {error && (
        <p className="text-sm text-red-400 flex items-center gap-1">
          <FaExclamationTriangle className="text-xs" />
          {error}
        </p>
      )}
    </div>
  )
})
Textarea.displayName = 'Textarea'

// ============================================
// SELECT COMPONENT
// ============================================
interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  label?: string
  options: SelectOption[]
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export const Select = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  className = '',
}: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find(opt => opt.value === value)

  return (
    <div className={`space-y-1.5 ${className}`} ref={ref} style={{ isolation: 'isolate' }}>
      {label && (
        <label className="block text-sm font-medium text-neutral-300">{label}</label>
      )}
      <div className="relative" style={{ zIndex: isOpen ? 9999 : 1 }}>
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            w-full px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-left
            flex items-center justify-between transition-all duration-300
            focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 focus:bg-white/10
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-white/20 hover:bg-white/10'}
          `}
        >
          <span className={selectedOption ? 'text-white' : 'text-neutral-500'}>
            {selectedOption?.label || placeholder}
          </span>
          <FaChevronDown className={`text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute w-full mt-2 bg-neutral-900/95 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden"
              style={{ zIndex: 99999 }}
            >
              <div className="max-h-60 overflow-y-auto">
                {options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange?.(option.value)
                      setIsOpen(false)
                    }}
                    className={`
                      w-full px-4 py-3 text-left transition-all duration-200
                      ${value === option.value 
                        ? 'bg-primary-500/20 text-primary-400 border-l-2 border-primary-500' 
                        : 'text-neutral-300 hover:bg-white/10 hover:text-white border-l-2 border-transparent'
                      }
                    `}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ============================================
// BADGE COMPONENT
// ============================================
interface BadgeProps {
  children: ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary'
  size?: 'sm' | 'md'
  className?: string
}

export const Badge = ({ children, variant = 'default', size = 'md', className = '' }: BadgeProps) => {
  const variants = {
    default: 'bg-neutral-700 text-neutral-300',
    success: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    warning: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    error: 'bg-red-500/20 text-red-400 border border-red-500/30',
    info: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    primary: 'bg-primary-500/20 text-primary-400 border border-primary-500/30',
  }
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  }
  
  return (
    <span className={`inline-flex items-center font-medium rounded-full ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  )
}

// ============================================
// CARD COMPONENT (Glassmorphism)
// ============================================
interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
  glow?: boolean
}

export const Card = ({ children, className = '', padding = 'md', hover = false, glow = false }: CardProps) => {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }
  
  return (
    <motion.div
      whileHover={hover ? { y: -4, scale: 1.01 } : undefined}
      className={`
        bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl
        ${paddings[padding]}
        ${hover ? 'transition-all duration-300 hover:shadow-xl hover:shadow-primary-500/10 hover:border-white/20' : ''}
        ${glow ? 'shadow-lg shadow-primary-500/10' : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  )
}

// ============================================
// MODAL COMPONENT (Glassmorphism)
// ============================================
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export const Modal = ({ isOpen, onClose, title, children, size = 'md', className = '' }: ModalProps) => {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  // Handle ESC key press
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])
  
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed top-0 left-0 right-0 bottom-0 z-[9999] flex items-center justify-center p-4" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}>
          {/* Backdrop with strong blur - covers entire viewport */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed top-0 left-0 right-0 bottom-0 bg-black/90 backdrop-blur-2xl"
            style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}
          />
          
          {/* Modal content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`relative w-full ${sizes[size]} bg-neutral-900/95 backdrop-blur-3xl border border-white/20 rounded-3xl shadow-2xl shadow-black/60 ring-1 ring-white/10 ${className}`}
          >
            {/* Gradient accent */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary-500/10 via-transparent to-transparent pointer-events-none" />
            
            {/* Header */}
            {title && (
              <div className="relative flex items-center justify-between px-6 py-4 border-b border-white/10">
                <h3 className="text-xl font-bold text-white">{title}</h3>
                <button
                  onClick={onClose}
                  className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                >
                  <FaTimes />
                </button>
              </div>
            )}
            
            {/* Body */}
            <div className="relative p-6 max-h-[70vh] overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// ============================================
// ALERT COMPONENT
// ============================================
interface AlertProps {
  children: ReactNode
  variant?: 'info' | 'success' | 'warning' | 'error'
  icon?: ReactNode
  className?: string
}

export const Alert = ({ children, variant = 'info', icon, className = '' }: AlertProps) => {
  const variants = {
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    error: 'bg-red-500/10 border-red-500/30 text-red-400',
  }
  
  const defaultIcons = {
    info: <FaInfoCircle />,
    success: <FaCheck />,
    warning: <FaExclamationTriangle />,
    error: <FaExclamationTriangle />,
  }
  
  return (
    <div className={`flex items-start gap-3 p-4 border rounded-lg ${variants[variant]} ${className}`}>
      <span className="flex-shrink-0 mt-0.5">{icon || defaultIcons[variant]}</span>
      <div className="text-sm">{children}</div>
    </div>
  )
}

// ============================================
// AVATAR COMPONENT
// ============================================
interface AvatarProps {
  src?: string
  name?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showBorder?: boolean
}

export const Avatar = ({ src, name = 'User', size = 'md', className = '', showBorder = true }: AvatarProps) => {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  }
  
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  
  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=4f46e5&color=fff&size=200`
  
  return (
    <div 
      className={`
        ${sizes[size]} rounded-full overflow-hidden flex-shrink-0
        ${showBorder ? 'ring-2 ring-primary-500 ring-offset-2 ring-offset-neutral-900' : ''}
        ${className}
      `}
    >
      <img
        src={src || fallbackUrl}
        alt={name}
        className="w-full h-full object-cover"
        onError={(e) => { (e.target as HTMLImageElement).src = fallbackUrl }}
      />
    </div>
  )
}

// ============================================
// SKELETON LOADER
// ============================================
interface SkeletonProps {
  width?: string
  height?: string
  rounded?: 'sm' | 'md' | 'lg' | 'full'
  className?: string
}

export const Skeleton = ({ width = '100%', height = '1rem', rounded = 'md', className = '' }: SkeletonProps) => {
  const roundedStyles = {
    sm: 'rounded',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    full: 'rounded-full',
  }
  
  return (
    <div
      className={`animate-pulse bg-neutral-800 ${roundedStyles[rounded]} ${className}`}
      style={{ width, height }}
    />
  )
}

// ============================================
// TAB COMPONENT
// ============================================
interface Tab {
  id: string
  label: string
  icon?: ReactNode
  badge?: string | number
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (tabId: string) => void
  className?: string
}

export const Tabs = ({ tabs, activeTab, onChange, className = '' }: TabsProps) => {
  return (
    <div className={`flex items-center gap-1 p-1 bg-neutral-900 rounded-lg ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all
            ${activeTab === tab.id 
              ? 'bg-primary-600 text-white shadow-sm' 
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }
          `}
        >
          {tab.icon}
          {tab.label}
          {tab.badge !== undefined && (
            <span className={`
              px-1.5 py-0.5 rounded-full text-xs font-bold
              ${activeTab === tab.id ? 'bg-white/20' : 'bg-neutral-700'}
            `}>
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

// ============================================
// EMPTY STATE COMPONENT
// ============================================
interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export const EmptyState = ({ icon, title, description, action, className = '' }: EmptyStateProps) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 text-center ${className}`}>
      {icon && (
        <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-500 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
      {description && <p className="text-neutral-400 text-sm max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ============================================
// SPINNER COMPONENT
// ============================================
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const Spinner = ({ size = 'md', className = '' }: SpinnerProps) => {
  const sizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  }
  
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <FaSpinner className={`animate-spin text-primary-500 ${sizes[size]}`} />
    </div>
  )
}

// ============================================
// PROFILE INFO SYSTEM - REUSABLE OVERLAY COMPONENT
// ============================================

import { createPortal } from 'react-dom'
import { FaEnvelope, FaCalendarAlt as FaCalendar2, FaChartLine, FaCircle, FaIdCard, FaBriefcase, FaEye, FaEdit, FaClock } from 'react-icons/fa'

// Profile Data Contract
export interface ProfileInfoData {
  // Primary Info
  employeeId: string
  name: string
  profileImage?: string
  role: string
  department?: string
  specialization?: string // For interns
  designation?: string
  
  // Secondary Info
  email?: string
  joiningDate?: string
  attendancePercentage?: number
  status?: 'Active' | 'On Leave' | 'Inactive'
  
  // Admin-only Info
  lastAttendanceDate?: string
  presentCount?: number
  absentCount?: number
  leaveCount?: number
}

interface ProfileInfoProps {
  data: ProfileInfoData
  isAdmin?: boolean
  children: ReactNode
  onViewProfile?: () => void
  onEditProfile?: () => void
  disabled?: boolean
}

// Main ProfileInfo Component
export const ProfileInfo = ({
  data,
  isAdmin = false,
  children,
  onViewProfile,
  onEditProfile,
  disabled = false
}: ProfileInfoProps) => {
  const [showPreview, setShowPreview] = useState(false)
  const [showExpanded, setShowExpanded] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const expandedRef = useRef<HTMLDivElement>(null)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Handle hover
  const handleMouseEnter = () => {
    if (disabled || showExpanded) return
    hoverTimeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect()
        setPosition({
          x: rect.left + rect.width / 2,
          y: rect.bottom + 8
        })
        setShowPreview(true)
      }
    }, 300)
  }

  const handleMouseLeave = (e: React.MouseEvent) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    // Check if moving to preview card
    const relatedTarget = e.relatedTarget as HTMLElement
    if (previewRef.current?.contains(relatedTarget)) return
    setShowPreview(false)
  }

  const handlePreviewMouseLeave = (e: React.MouseEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement
    if (triggerRef.current?.contains(relatedTarget)) return
    setShowPreview(false)
  }

  // Handle click for expanded view
  const handleClick = () => {
    if (disabled) return
    setShowPreview(false)
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      
      // Calculate optimal position
      let x = rect.left + rect.width / 2
      let y = rect.bottom + 12
      
      // Adjust if too close to edges
      const cardWidth = 360
      const cardHeight = 400
      
      if (x - cardWidth / 2 < 20) x = cardWidth / 2 + 20
      if (x + cardWidth / 2 > viewportWidth - 20) x = viewportWidth - cardWidth / 2 - 20
      if (y + cardHeight > viewportHeight - 20) y = rect.top - cardHeight - 12
      
      setPosition({ x, y })
    }
    setShowExpanded(true)
  }

  // Close expanded on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        expandedRef.current && 
        !expandedRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setShowExpanded(false)
      }
    }
    
    if (showExpanded) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showExpanded])

  // ESC to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowExpanded(false)
        setShowPreview(false)
      }
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [])

  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name?.split(' ').map(n => n[0]).join('') || 'U')}&background=4f46e5&color=fff&size=200`
  
  const getRoleBadgeVariant = (role: string) => {
    if (role === 'admin') return 'warning'
    if (role === 'Intern') return 'info'
    return 'primary'
  }

  const getStatusColor = (status?: string) => {
    if (status === 'Active') return 'text-emerald-400'
    if (status === 'On Leave') return 'text-amber-400'
    return 'text-neutral-400'
  }

  return (
    <>
      {/* Trigger Element */}
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className={disabled ? '' : 'cursor-pointer'}
      >
        {children}
      </div>

      {/* Preview Card (Hover) - Rendered via Portal */}
      {showPreview && typeof window !== 'undefined' && createPortal(
        <motion.div
          ref={previewRef}
          initial={{ opacity: 0, y: -8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          onMouseLeave={handlePreviewMouseLeave}
          style={{
            position: 'fixed',
            left: position.x,
            top: position.y,
            transform: 'translateX(-50%)',
            zIndex: 100000,
          }}
          className="bg-neutral-900/98 backdrop-blur-2xl border border-white/15 rounded-xl shadow-2xl shadow-black/40 p-4 min-w-[240px] max-w-[280px]"
        >
          {/* Arrow */}
          <div 
            className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-neutral-900 border-l border-t border-white/15 rotate-45"
          />
          
          <div className="flex items-center gap-3 relative">
            <div className="relative">
              <img
                src={data.profileImage || fallbackUrl}
                alt={data.name}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-primary-500/50"
                onError={(e) => { (e.target as HTMLImageElement).src = fallbackUrl }}
              />
              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-neutral-900 ${data.status === 'Active' ? 'bg-emerald-500' : data.status === 'On Leave' ? 'bg-amber-500' : 'bg-neutral-500'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate">{data.name}</p>
              <p className="text-xs text-neutral-400 truncate">{data.designation || data.department}</p>
              <p className="text-xs text-primary-400 font-mono">{data.employeeId}</p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
            <Badge variant={getRoleBadgeVariant(data.role)} size="sm">
              {data.role === 'admin' ? '👑 Admin' : data.role}
            </Badge>
            {data.attendancePercentage !== undefined && (
              <span className="text-neutral-400 flex items-center gap-1">
                <FaChartLine className="text-primary-400" />
                {data.attendancePercentage.toFixed(0)}% attendance
              </span>
            )}
          </div>
          
          <p className="text-xs text-neutral-500 text-center mt-2">Click for more details</p>
        </motion.div>,
        document.body
      )}

      {/* Expanded Card (Click) - Rendered via Portal */}
      {showExpanded && typeof window !== 'undefined' && createPortal(
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            style={{ zIndex: 99999 }}
            onClick={() => setShowExpanded(false)}
          />
          
          {/* Expanded Card */}
          <motion.div
            ref={expandedRef}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'fixed',
              left: position.x,
              top: position.y,
              transform: 'translateX(-50%)',
              zIndex: 100000,
            }}
            className="bg-neutral-900/98 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl shadow-black/50 w-[360px] max-h-[80vh] overflow-auto"
          >
            {/* Close Button */}
            <button
              onClick={() => setShowExpanded(false)}
              className="absolute top-3 right-3 p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-all z-10"
            >
              <FaTimes className="text-sm" />
            </button>

            {/* Header with Gradient */}
            <div className="p-5 bg-gradient-to-br from-primary-600/20 via-primary-500/10 to-transparent border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-cyan-500 rounded-full opacity-40 blur-sm" />
                  <img
                    src={data.profileImage || fallbackUrl}
                    alt={data.name}
                    className="relative w-16 h-16 rounded-full object-cover ring-2 ring-white/20"
                    onError={(e) => { (e.target as HTMLImageElement).src = fallbackUrl }}
                  />
                  <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-neutral-900 ${data.status === 'Active' ? 'bg-emerald-500' : data.status === 'On Leave' ? 'bg-amber-500' : 'bg-neutral-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-white truncate">{data.name}</h3>
                  <p className="text-sm text-neutral-400 truncate">{data.designation || 'Employee'}</p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <Badge variant="primary" size="sm">{data.employeeId}</Badge>
                    <Badge variant={getRoleBadgeVariant(data.role)} size="sm">
                      {data.role === 'admin' ? '👑 Admin' : data.role}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Primary Info */}
            <div className="p-4 space-y-3 border-b border-white/5">
              {data.department && (
                <div className="flex items-center gap-3 text-sm">
                  <FaBriefcase className="text-primary-400 flex-shrink-0" />
                  <span className="text-neutral-400">Department:</span>
                  <span className="text-white">{data.department}</span>
                </div>
              )}
              {data.specialization && (
                <div className="flex items-center gap-3 text-sm">
                  <FaIdCard className="text-cyan-400 flex-shrink-0" />
                  <span className="text-neutral-400">Specialization:</span>
                  <span className="text-white">{data.specialization}</span>
                </div>
              )}
              {data.email && (
                <div className="flex items-center gap-3 text-sm">
                  <FaEnvelope className="text-primary-400 flex-shrink-0" />
                  <span className="text-neutral-400">Email:</span>
                  <span className="text-white truncate">{data.email}</span>
                </div>
              )}
              {data.joiningDate && (
                <div className="flex items-center gap-3 text-sm">
                  <FaCalendar2 className="text-emerald-400 flex-shrink-0" />
                  <span className="text-neutral-400">Joined:</span>
                  <span className="text-white">{data.joiningDate}</span>
                </div>
              )}
            </div>

            {/* Secondary Info */}
            <div className="p-4 space-y-3 border-b border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-sm">
                  <FaCircle className={`text-xs flex-shrink-0 ${getStatusColor(data.status)}`} />
                  <span className="text-neutral-400">Status:</span>
                  <span className={`font-medium ${getStatusColor(data.status)}`}>{data.status || 'Unknown'}</span>
                </div>
                {data.attendancePercentage !== undefined && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg">
                    <FaChartLine className="text-primary-400 text-sm" />
                    <span className="text-lg font-bold bg-gradient-to-r from-primary-400 to-cyan-400 bg-clip-text text-transparent">
                      {data.attendancePercentage.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Admin-only Info */}
            {isAdmin && (data.presentCount !== undefined || data.lastAttendanceDate) && (
              <div className="p-4 bg-amber-500/5 border-b border-amber-500/10">
                <p className="text-xs text-amber-400 font-medium mb-3 flex items-center gap-1">
                  <FaClock /> Admin View
                </p>
                {data.lastAttendanceDate && (
                  <div className="flex items-center gap-3 text-sm mb-2">
                    <span className="text-neutral-400">Last marked:</span>
                    <span className="text-white">{data.lastAttendanceDate}</span>
                  </div>
                )}
                {data.presentCount !== undefined && (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div className="text-center p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                      <div className="text-lg font-bold text-emerald-400">{data.presentCount}</div>
                      <div className="text-xs text-neutral-400">Present</div>
                    </div>
                    <div className="text-center p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                      <div className="text-lg font-bold text-red-400">{data.absentCount || 0}</div>
                      <div className="text-xs text-neutral-400">Absent</div>
                    </div>
                    <div className="text-center p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                      <div className="text-lg font-bold text-amber-400">{data.leaveCount || 0}</div>
                      <div className="text-xs text-neutral-400">Leave</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            {(onViewProfile || onEditProfile) && (
              <div className="p-4 flex gap-2">
                {onViewProfile && (
                  <button
                    onClick={() => {
                      setShowExpanded(false)
                      onViewProfile()
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl transition-colors font-medium text-sm"
                  >
                    <FaEye /> View Full Profile
                  </button>
                )}
                {isAdmin && onEditProfile && (
                  <button
                    onClick={() => {
                      setShowExpanded(false)
                      onEditProfile()
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors border border-white/10"
                  >
                    <FaEdit />
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </>,
        document.body
      )}
    </>
  )
}

// Helper function to convert EmployeeProfile to ProfileInfoData
export const employeeToProfileData = (
  employee: {
    employeeId: string
    name: string
    email?: string
    department?: string
    designation?: string
    joiningDate?: string
    profileImage?: string
    role?: string
  },
  stats?: {
    attendancePercentage?: number
    presentCount?: number
    absentCount?: number
    leaveCount?: number
    lastAttendanceDate?: string
  }
): ProfileInfoData => ({
  employeeId: employee.employeeId,
  name: employee.name,
  profileImage: employee.profileImage,
  role: employee.role || 'employee',
  department: employee.department,
  designation: employee.designation,
  email: employee.email,
  joiningDate: employee.joiningDate,
  attendancePercentage: stats?.attendancePercentage,
  status: 'Active', // Can be computed from recent attendance
  presentCount: stats?.presentCount,
  absentCount: stats?.absentCount,
  leaveCount: stats?.leaveCount,
  lastAttendanceDate: stats?.lastAttendanceDate
})
