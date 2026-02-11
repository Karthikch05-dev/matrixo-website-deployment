'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FaVideo,
  FaCalendarAlt,
  FaClipboardList,
  FaTasks,
  FaChevronDown,
  FaChevronRight,
  FaExternalLinkAlt,
  FaEyeSlash,
  FaEye,
  FaSpinner,
  FaSearch,
  FaBell,
  FaUserTag,
  FaCheckCircle,
  FaCircle,
  FaClock,
  FaPlay,
  FaSyncAlt,
  FaLock,
  FaTrashAlt,
  FaCheck,
  FaEdit,
  FaPlus
} from 'react-icons/fa'
import { useEmployeeAuth } from '@/lib/employeePortalContext'
import type { EmployeeProfile } from '@/lib/employeePortalContext'
import { createGlobalNotification } from '@/lib/notificationUtils'
import { Card, Button, Badge, Spinner as SpinnerUI, EmptyState, Modal } from './ui'
import { toast } from 'sonner'
import { db } from '@/lib/firebaseConfig'
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  Timestamp
} from 'firebase/firestore'

// ============================================
// TYPES
// ============================================

interface FathomSpeaker {
  display_name: string
  matched_calendar_invitee_email?: string
}

interface FathomInvitee {
  name: string
  email: string
  email_domain: string
  is_external: boolean
  matched_speaker_display_name?: string
}

interface FathomActionItem {
  description: string
  user_generated: boolean
  completed: boolean
  recording_timestamp?: string
  recording_playback_url?: string
  assignee?: {
    name: string
    email: string
    team?: string
  }
}

interface FathomMeeting {
  title: string
  meeting_title: string
  recording_id: number
  url: string
  share_url: string
  created_at: string
  scheduled_start_time?: string
  scheduled_end_time?: string
  recording_start_time?: string
  recording_end_time?: string
  calendar_invitees?: FathomInvitee[]
  speakers?: FathomSpeaker[]
  recorded_by?: {
    name: string
    email: string
    team?: string
  }
  default_summary?: {
    template_name: string
    markdown_formatted: string
  }
  action_items?: FathomActionItem[]
}

interface FathomListResponse {
  limit: number
  next_cursor: string | null
  items: FathomMeeting[]
}

interface EmployeeInfo {
  employeeId: string
  name: string
  email: string
  profileImage?: string
  role?: string
  department?: string
  designation?: string
}

// ============================================
// HELPERS
// ============================================

function formatDuration(start?: string, end?: string): string {
  if (!start || !end) return ''
  const s = new Date(start).getTime()
  const e = new Date(end).getTime()
  const mins = Math.round((e - s) / 60000)
  if (mins < 60) return `${mins}min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function getProfileImageUrl(url?: string, name?: string): string {
  if (name && isMatriXOAccount(name)) return MATRIXO_LOGO_URL
  if (url) return url
  if (name) {
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2)
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=7c3aed&color=fff&size=200`
  }
  return 'https://ui-avatars.com/api/?name=U&background=7c3aed&color=fff&size=200'
}

function renderMarkdownClean(md: string): string {
  let html = md
    // Strip markdown links: [text](url) → text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Strip bare URLs in parentheses: (https://...)
    .replace(/\(https?:\/\/[^)]+\)/g, '')
    // Strip any remaining standalone URLs
    .replace(/https?:\/\/\S+/g, '')
    // Clean up double spaces
    .replace(/ {2,}/g, ' ')
    .trim()

  // Process line by line for proper structure
  const lines = html.split('\n')
  const result: string[] = []
  let inList = false

  for (const line of lines) {
    const trimmed = line.trim()

    // Heading ##
    if (/^## (.+)/.test(trimmed)) {
      if (inList) { result.push('</ul>'); inList = false }
      const match = trimmed.match(/^## (.+)/)
      result.push(`<h3 class="text-base font-bold text-white mt-5 mb-2">${match![1]}</h3>`)
    }
    // Heading ###
    else if (/^### (.+)/.test(trimmed)) {
      if (inList) { result.push('</ul>'); inList = false }
      const match = trimmed.match(/^### (.+)/)
      result.push(`<h4 class="text-sm font-semibold text-neutral-200 mt-4 mb-1.5">${match![1]}</h4>`)
    }
    // List item
    else if (/^[-*] (.+)/.test(trimmed)) {
      if (!inList) { result.push('<ul class="space-y-2 my-2">'); inList = true }
      const match = trimmed.match(/^[-*] (.+)/)
      let content = match![1]
      // Bold
      content = content.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
      result.push(`<li class="text-sm text-neutral-300 leading-relaxed pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-blue-400 before:font-bold">${content}</li>`)
    }
    // Empty line
    else if (trimmed === '') {
      if (inList) { result.push('</ul>'); inList = false }
      result.push('<div class="h-2"></div>')
    }
    // Regular paragraph
    else {
      if (inList) { result.push('</ul>'); inList = false }
      let content = trimmed
      content = content.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
      result.push(`<p class="text-sm text-neutral-300 leading-relaxed">${content}</p>`)
    }
  }
  if (inList) result.push('</ul>')

  return result.join('\n')
}

// Special display name for matriXO admin account
const MATRIXO_LOGO_URL = '/logos/logo-dark.png'
const MATRIXO_NAMES = ['matrixo official', 'matrixo', 'matrixo admin']

function isMatriXOAccount(name: string): boolean {
  return MATRIXO_NAMES.includes(name.toLowerCase().trim())
}

// Normalize a name for matching: strip company suffixes, lowercase, trim
function normalizeForMatch(name: string): string {
  return name
    .replace(/\s*(matrixo|matriXO|official|admin)\s*/gi, '')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim()
}

// Better fuzzy name matching
function fuzzyMatchEmployee(personName: string, personEmail: string | undefined, employees: EmployeeInfo[]): EmployeeInfo | undefined {
  if (!personName && !personEmail) return undefined
  
  // 1. Exact email match (highest priority)
  if (personEmail) {
    const byEmail = employees.find(emp => emp.email.toLowerCase() === personEmail.toLowerCase())
    if (byEmail) return byEmail
  }

  // 2. Exact name match
  const exactMatch = employees.find(emp => emp.name.toLowerCase() === personName.toLowerCase())
  if (exactMatch) return exactMatch

  // 3. Normalized name match (strips "Matrixo", "Official" suffixes)
  const normalized = normalizeForMatch(personName)
  if (normalized) {
    const normalizedMatch = employees.find(emp => {
      const empNorm = normalizeForMatch(emp.name)
      return empNorm === normalized ||
             empNorm.includes(normalized) ||
             normalized.includes(empNorm)
    })
    if (normalizedMatch) return normalizedMatch
  }

  // 4. First name match (for cases like "Kishan" matching "Kishan Kumar")
  const firstName = personName.split(' ')[0].toLowerCase()
  if (firstName.length >= 3) {
    const firstNameMatches = employees.filter(emp => {
      const empFirst = emp.name.split(' ')[0].toLowerCase()
      return empFirst === firstName
    })
    if (firstNameMatches.length === 1) return firstNameMatches[0]
  }

  // 5. Partial name containment
  const partialMatch = employees.find(emp =>
    emp.name.toLowerCase().includes(personName.toLowerCase()) ||
    personName.toLowerCase().includes(emp.name.toLowerCase())
  )
  if (partialMatch) return partialMatch

  return undefined
}

function getAllAttendees(meeting: FathomMeeting): { name: string; email?: string; isExternal?: boolean }[] {
  const attendees = new Map<string, { name: string; email?: string; isExternal?: boolean }>()

  const addAttendee = (name: string, email?: string, isExternal?: boolean) => {
    if (!name && !email) return
    const key = (email || name || '').toLowerCase()
    if (!key) return
    // Check if already exists by email or name
    if (attendees.has(key)) return
    const existsByName = Array.from(attendees.values()).some(a => a.name.toLowerCase() === name.toLowerCase())
    if (existsByName) return
    attendees.set(key, { name: name || email?.split('@')[0] || 'Unknown', email, isExternal })
  }

  // Add calendar invitees
  meeting.calendar_invitees?.forEach(inv => {
    addAttendee(inv.name || inv.email?.split('@')[0] || '', inv.email, inv.is_external)
  })

  // Add speakers
  meeting.speakers?.forEach(sp => {
    addAttendee(sp.display_name, sp.matched_calendar_invitee_email)
  })

  // Add recorded_by
  if (meeting.recorded_by) {
    addAttendee(meeting.recorded_by.name, meeting.recorded_by.email)
  }

  // Add action item assignees (mentioned people)
  meeting.action_items?.forEach(item => {
    if (item?.assignee?.name) {
      addAttendee(item.assignee.name, item.assignee.email)
    }
  })

  return Array.from(attendees.values())
}

// ============================================
// EMPLOYEE HOVER CARD
// ============================================

function EmployeeHoverCard({ name, employees }: { name: string; employees: EmployeeInfo[] }) {
  const [show, setShow] = useState(false)
  const [position, setPosition] = useState<'above' | 'below'>('below')
  const ref = useRef<HTMLSpanElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const matched = fuzzyMatchEmployee(name, undefined, employees)

  const handleEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      setPosition(rect.top > 200 ? 'above' : 'below')
    }
    setShow(true)
  }

  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setShow(false), 200)
  }

  return (
    <span
      ref={ref}
      className="relative inline-block"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <span className={`text-xs px-2 py-0.5 rounded-full cursor-pointer transition-all ${
        matched
          ? 'bg-blue-500/15 text-blue-400 border border-blue-500/25 hover:bg-blue-500/25'
          : 'bg-neutral-700/50 text-neutral-400 border border-neutral-600/30'
      }`}>
        @{name}
      </span>
      <AnimatePresence>
        {show && matched && (
          <motion.div
            initial={{ opacity: 0, y: position === 'above' ? 5 : -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute left-0 z-50 w-56 ${
              position === 'above' ? 'bottom-full mb-2' : 'top-full mt-2'
            }`}
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
          >
            <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-3 shadow-2xl shadow-black/50">
              <div className="flex items-center gap-3">
                <img
                  src={getProfileImageUrl(matched.profileImage, matched.name)}
                  alt={matched.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/30"
                  onError={(e) => { (e.target as HTMLImageElement).src = getProfileImageUrl(undefined, matched.name) }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white truncate">{matched.name}</p>
                  {matched.designation && (
                    <p className="text-xs text-neutral-400 truncate">{matched.designation}</p>
                  )}
                  {matched.department && (
                    <p className="text-xs text-neutral-500 truncate">{matched.department}</p>
                  )}
                </div>
              </div>
              {matched.role && (
                <div className="mt-2 flex items-center gap-1.5">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                    matched.role === 'admin'
                      ? 'bg-amber-500/15 text-amber-400'
                      : matched.role === 'Intern'
                        ? 'bg-purple-500/15 text-purple-400'
                        : 'bg-blue-500/15 text-blue-400'
                  }`}>
                    {matched.role}
                  </span>
                  {matched.email && (
                    <span className="text-[10px] text-neutral-600 truncate">{matched.email}</span>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  )
}

// ============================================
// MEETING CARD
// ============================================

function MeetingCard({
  meeting,
  isHidden,
  isAdmin,
  onToggleHide,
  onRemove,
  onViewDetails,
  employees,
  completedTaskIds
}: {
  meeting: FathomMeeting
  isHidden: boolean
  isAdmin: boolean
  onToggleHide: (recordingId: number, hide: boolean) => void
  onRemove: (recordingId: number) => void
  onViewDetails: (meeting: FathomMeeting) => void
  employees: EmployeeInfo[]
  completedTaskIds: Set<string>
}) {
  const allItems = (meeting.action_items || []).filter(a => a)
  const pendingCount = allItems.filter((a, i) => !a.completed && !completedTaskIds.has(`${meeting.recording_id}_${i}`)).length
  const completedCount = allItems.filter((a, i) => a.completed || completedTaskIds.has(`${meeting.recording_id}_${i}`)).length
  const duration = formatDuration(meeting.recording_start_time, meeting.recording_end_time)
  const allAttendees = getAllAttendees(meeting)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      layout
    >
      <div className={`bg-neutral-900/70 border rounded-xl transition-all hover:border-neutral-600 ${
        isHidden ? 'opacity-60 border-l-4 border-l-red-500/50 border-neutral-700/50' : 'border-neutral-800'
      }`}>
        <div className="p-3 sm:p-4">
          {/* Row 1: Title + actions */}
          <div className="flex items-start justify-between gap-3">
            <div
              className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer group"
              onClick={() => onViewDetails(meeting)}
            >
              <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                <FaVideo className="text-blue-400 text-sm" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white truncate group-hover:text-blue-400 transition-colors">
                  {meeting.meeting_title || meeting.title}
                </h3>
                <div className="flex items-center gap-2 text-[11px] text-neutral-500 mt-0.5">
                  <span className="flex items-center gap-1">
                    <FaCalendarAlt className="text-[9px]" />
                    {new Date(meeting.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  {duration && (
                    <span className="flex items-center gap-1">
                      <FaClock className="text-[9px]" />
                      {duration}
                    </span>
                  )}
                  {meeting.recorded_by && (
                    <span className="text-neutral-600 hidden sm:inline">by {meeting.recorded_by.name}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              {isHidden && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 font-medium">Hidden</span>
              )}
              {isAdmin && (
                <button
                  onClick={() => onToggleHide(meeting.recording_id, !isHidden)}
                  className={`p-1.5 rounded-lg transition-all text-xs ${
                    isHidden
                      ? 'text-emerald-400 hover:bg-emerald-500/15'
                      : 'text-neutral-500 hover:bg-red-500/10 hover:text-red-400'
                  }`}
                  title={isHidden ? 'Show to all' : 'Hide from interns'}
                >
                  {isHidden ? <FaEye /> : <FaEyeSlash />}
                </button>
              )}
              <button
                onClick={() => onRemove(meeting.recording_id)}
                className="p-1.5 rounded-lg text-neutral-600 hover:bg-red-500/10 hover:text-red-400 transition-all text-xs"
                title="Remove from portal"
              >
                <FaTrashAlt />
              </button>
              <a
                href={meeting.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg text-neutral-500 hover:bg-blue-500/10 hover:text-blue-400 transition-all text-xs"
                title="Open in Fathom"
              >
                <FaExternalLinkAlt />
              </a>
            </div>
          </div>

          {/* Row 2: Attendees */}
          {allAttendees.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {allAttendees.slice(0, 5).map((att, i) => (
                <EmployeeHoverCard key={i} name={att.name} employees={employees} />
              ))}
              {allAttendees.length > 5 && (
                <span className="text-[11px] text-neutral-500 self-center">+{allAttendees.length - 5} more</span>
              )}
            </div>
          )}

          {/* Row 3: Task summary + View button */}
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-3 text-[11px]">
              {pendingCount > 0 && (
                <span className="flex items-center gap-1 text-amber-400">
                  <FaCircle className="text-[6px]" />
                  {pendingCount} pending
                </span>
              )}
              {completedCount > 0 && (
                <span className="flex items-center gap-1 text-emerald-400">
                  <FaCheckCircle className="text-[9px]" />
                  {completedCount} done
                </span>
              )}
            </div>
            <button
              onClick={() => onViewDetails(meeting)}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-500/10"
            >
              View MoM
              <FaChevronRight className="text-[9px]" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ============================================
// MEETING DETAIL MODAL
// ============================================

function MeetingDetailModal({
  meeting,
  isOpen,
  onClose,
  employees,
  employeeData,
  onSendMentionNotification,
  completedTaskIds,
  onToggleTaskComplete,
  customTasks,
  onAddCustomTask,
  onEditCustomTask,
  onDeleteCustomTask
}: {
  meeting: FathomMeeting | null
  isOpen: boolean
  onClose: () => void
  employees: EmployeeInfo[]
  employeeData: { employeeId: string; name: string; role: string } | null
  onSendMentionNotification: (meeting: FathomMeeting, actionItem: FathomActionItem) => void
  completedTaskIds: Set<string>
  onToggleTaskComplete: (meetingId: number, taskIndex: number, complete: boolean) => void
  customTasks: Map<number, FathomActionItem[]>
  onAddCustomTask: (meetingId: number, task: FathomActionItem) => void
  onEditCustomTask: (meetingId: number, taskIndex: number, task: FathomActionItem) => void
  onDeleteCustomTask: (meetingId: number, taskIndex: number) => void
}) {
  const [activeSection, setActiveSection] = useState<'summary' | 'actions' | 'attendees'>('summary')
  const isAdmin = employeeData?.role === 'admin'
  
  // Admin edit state
  const [showAddTask, setShowAddTask] = useState(false)
  const [newTaskDesc, setNewTaskDesc] = useState('')
  const [newTaskAssignee, setNewTaskAssignee] = useState('')
  const [editingTaskIndex, setEditingTaskIndex] = useState<number | null>(null)
  const [editTaskDesc, setEditTaskDesc] = useState('')
  const [editTaskAssignee, setEditTaskAssignee] = useState('')

  if (!meeting) return null

  const fathomItems = (meeting.action_items || []).filter(a => a)
  const extraTasks = customTasks.get(meeting.recording_id) || []
  const allItems = [...fathomItems, ...extraTasks]
  const pendingActions = allItems.filter((a, i) => !a.completed && !completedTaskIds.has(`${meeting.recording_id}_${i}`))
  const completedActions = allItems.filter((a, i) => a.completed || completedTaskIds.has(`${meeting.recording_id}_${i}`))
  const duration = formatDuration(meeting.recording_start_time, meeting.recording_end_time)
  const allAttendees = getAllAttendees(meeting)

  const matchAssigneeToEmployee = (assignee?: { name: string; email: string } | null) => {
    if (!assignee?.name && !assignee?.email) return null
    return fuzzyMatchEmployee(assignee?.name || '', assignee?.email, employees)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="lg">
      <div className="max-h-[80vh] overflow-y-auto -m-6 p-6">
        {/* Header */}
        <div className="flex items-start gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0">
            <FaVideo className="text-lg text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white leading-tight">
              {meeting.meeting_title || meeting.title}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-neutral-400">
              <span className="flex items-center gap-1">
                <FaCalendarAlt className="text-[10px]" />
                {new Date(meeting.created_at).toLocaleDateString('en-IN', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                })}
              </span>
              {duration && (
                <span className="flex items-center gap-1">
                  <FaClock className="text-[10px]" />
                  {duration}
                </span>
              )}
            </div>
            {meeting.recorded_by && (
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Recorded by {meeting.recorded_by.name}
              </p>
            )}
          </div>
          <a
            href={meeting.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 transition-all text-xs flex items-center gap-1.5 flex-shrink-0 font-medium"
          >
            <FaPlay className="text-[10px]" />
            Watch
          </a>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-700/50 mb-4">
          {[
            { id: 'summary' as const, label: 'Summary & Next Steps', icon: FaClipboardList },
            { id: 'actions' as const, label: `Tasks (${allItems.length})`, icon: FaTasks },
            { id: 'attendees' as const, label: `Attendees (${allAttendees.length})`, icon: FaUserTag },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-all ${
                activeSection === tab.id
                  ? 'text-blue-400 border-blue-400'
                  : 'text-neutral-500 border-transparent hover:text-neutral-300'
              }`}
            >
              <tab.icon className="text-[10px]" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* SUMMARY */}
        {activeSection === 'summary' && (
          <div>
            {meeting.default_summary?.markdown_formatted ? (
              <div
                className="max-w-none"
                dangerouslySetInnerHTML={{
                  __html: renderMarkdownClean(meeting.default_summary.markdown_formatted)
                }}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-neutral-500 text-sm">Summary is being generated...</p>
                <p className="text-neutral-600 text-xs mt-1">Check back in a few minutes.</p>
              </div>
            )}
          </div>
        )}

        {/* TASKS */}
        {activeSection === 'actions' && (
          <div className="space-y-5">
            {/* Admin: Add Task Button */}
            {isAdmin && (
              <div>
                {showAddTask ? (
                  <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl space-y-2">
                    <input
                      type="text"
                      placeholder="Task description..."
                      value={newTaskDesc}
                      onChange={(e) => setNewTaskDesc(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-sm placeholder:text-neutral-500 focus:border-blue-500/40 outline-none"
                    />
                    <div className="flex gap-2">
                      <select
                        value={newTaskAssignee}
                        onChange={(e) => setNewTaskAssignee(e.target.value)}
                        className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-sm focus:border-blue-500/40 outline-none"
                      >
                        <option value="">Assign to...</option>
                        {employees.map(emp => (
                          <option key={emp.employeeId} value={emp.name}>{emp.name}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => {
                          if (!newTaskDesc.trim()) return
                          const emp = employees.find(e => e.name === newTaskAssignee)
                          onAddCustomTask(meeting.recording_id, {
                            description: newTaskDesc.trim(),
                            user_generated: true,
                            completed: false,
                            assignee: newTaskAssignee ? {
                              name: newTaskAssignee,
                              email: emp?.email || ''
                            } : undefined
                          })
                          setNewTaskDesc('')
                          setNewTaskAssignee('')
                          setShowAddTask(false)
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => { setShowAddTask(false); setNewTaskDesc(''); setNewTaskAssignee('') }}
                        className="px-3 py-2 bg-neutral-800 text-neutral-400 text-sm rounded-lg hover:bg-neutral-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddTask(true)}
                    className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 px-3 py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/20 transition-all w-full justify-center"
                  >
                    <FaPlus className="text-[9px]" />
                    Add New Task
                  </button>
                )}
              </div>
            )}

            {/* Pending */}
            {pendingActions.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                  <h4 className="text-sm font-semibold text-amber-400">
                    Pending ({pendingActions.length})
                  </h4>
                </div>
                <div className="space-y-2">
                  {pendingActions.map((item) => {
                    const originalIndex = allItems.indexOf(item)
                    const assignee = item?.assignee
                    const matchedEmployee = matchAssigneeToEmployee(assignee)
                    const isCustomTask = originalIndex >= fathomItems.length
                    const customIndex = originalIndex - fathomItems.length
                    const isEditing = editingTaskIndex === originalIndex

                    if (isEditing && isAdmin) {
                      return (
                        <div key={originalIndex} className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
                          <input
                            type="text"
                            value={editTaskDesc}
                            onChange={(e) => setEditTaskDesc(e.target.value)}
                            className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-sm focus:border-blue-500/40 outline-none"
                          />
                          <div className="flex gap-2">
                            <select
                              value={editTaskAssignee}
                              onChange={(e) => setEditTaskAssignee(e.target.value)}
                              className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-sm focus:border-blue-500/40 outline-none"
                            >
                              <option value="">Assign to...</option>
                              {employees.map(emp => (
                                <option key={emp.employeeId} value={emp.name}>{emp.name}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => {
                                if (!editTaskDesc.trim()) return
                                const emp = employees.find(e => e.name === editTaskAssignee)
                                if (isCustomTask) {
                                  onEditCustomTask(meeting.recording_id, customIndex, {
                                    ...item,
                                    description: editTaskDesc.trim(),
                                    assignee: editTaskAssignee ? { name: editTaskAssignee, email: emp?.email || '' } : undefined
                                  })
                                }
                                setEditingTaskIndex(null)
                              }}
                              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm rounded-lg transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingTaskIndex(null)}
                              className="px-3 py-2 bg-neutral-800 text-neutral-400 text-sm rounded-lg hover:bg-neutral-700 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )
                    }

                    return (
                      <div
                        key={originalIndex}
                        className="group flex items-start gap-3 p-3 bg-neutral-800/40 rounded-xl border border-neutral-700/60 hover:border-amber-500/30 transition-all"
                      >
                        {/* Complete button */}
                        <button
                          onClick={() => onToggleTaskComplete(meeting.recording_id, originalIndex, true)}
                          className="mt-0.5 w-5 h-5 rounded-full border-2 border-neutral-600 hover:border-emerald-400 hover:bg-emerald-500/15 transition-all flex-shrink-0 flex items-center justify-center group/btn"
                          title="Mark as complete"
                        >
                          <FaCheck className="text-[8px] text-transparent group-hover/btn:text-emerald-400 transition-colors" />
                        </button>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-neutral-200 leading-relaxed">{item?.description || 'No description'}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            {assignee?.name && (
                              <EmployeeHoverCard name={assignee.name} employees={employees} />
                            )}
                            {item?.recording_playback_url && (
                              <a
                                href={item.recording_playback_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-neutral-500 hover:text-blue-400 transition-colors flex items-center gap-1"
                              >
                                <FaPlay className="text-[7px]" />
                                Jump to moment
                              </a>
                            )}
                            {isCustomTask && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400">Manual</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          {/* Admin edit/delete for custom tasks */}
                          {isAdmin && isCustomTask && (
                            <>
                              <button
                                onClick={() => {
                                  setEditingTaskIndex(originalIndex)
                                  setEditTaskDesc(item?.description || '')
                                  setEditTaskAssignee(item?.assignee?.name || '')
                                }}
                                className="p-1.5 rounded-lg text-neutral-500 hover:bg-blue-500/10 hover:text-blue-400 transition-all"
                                title="Edit task"
                              >
                                <FaEdit className="text-[10px]" />
                              </button>
                              <button
                                onClick={() => onDeleteCustomTask(meeting.recording_id, customIndex)}
                                className="p-1.5 rounded-lg text-neutral-500 hover:bg-red-500/10 hover:text-red-400 transition-all"
                                title="Delete task"
                              >
                                <FaTrashAlt className="text-[10px]" />
                              </button>
                            </>
                          )}
                          {/* Notify button */}
                          {matchedEmployee && employeeData && (
                            <button
                              onClick={() => onSendMentionNotification(meeting, item)}
                              className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all flex-shrink-0"
                              title={`Notify ${assignee?.name || 'assignee'}`}
                            >
                              <FaBell className="text-[10px]" />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Completed */}
            {completedActions.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FaCheckCircle className="text-emerald-400 text-xs" />
                  <h4 className="text-sm font-semibold text-emerald-400">
                    Completed ({completedActions.length})
                  </h4>
                </div>
                <div className="space-y-1.5">
                  {completedActions.map((item) => {
                    const originalIndex = allItems.indexOf(item)
                    const isLocalComplete = completedTaskIds.has(`${meeting.recording_id}_${originalIndex}`)
                    return (
                      <div
                        key={originalIndex}
                        className="flex items-start gap-3 p-2.5 bg-neutral-800/20 rounded-lg border border-neutral-800/50"
                      >
                        <button
                          onClick={() => isLocalComplete ? onToggleTaskComplete(meeting.recording_id, originalIndex, false) : undefined}
                          className="mt-0.5 w-5 h-5 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex-shrink-0 flex items-center justify-center"
                          title={isLocalComplete ? 'Undo' : 'Completed'}
                          disabled={!isLocalComplete}
                        >
                          <FaCheck className="text-[8px] text-emerald-400" />
                        </button>
                        <div className="flex-1">
                          <p className="text-sm text-neutral-500 line-through">{item?.description || 'No description'}</p>
                          {item?.assignee?.name && (
                            <span className="text-[11px] text-neutral-600 mt-0.5 inline-block">@{item.assignee.name}</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {allItems.length === 0 && (
              <div className="text-center py-8">
                <FaTasks className="text-2xl text-neutral-600 mx-auto mb-2" />
                <p className="text-neutral-500 text-sm">No action items from this meeting</p>
              </div>
            )}
          </div>
        )}

        {/* ATTENDEES */}
        {activeSection === 'attendees' && (
          <div className="space-y-2">
            {allAttendees.length > 0 ? (
              allAttendees.map((att, i) => {
                const matched = fuzzyMatchEmployee(att.name, att.email, employees)
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 bg-neutral-800/40 rounded-xl border border-neutral-700/50 hover:border-neutral-600/50 transition-all"
                  >
                    <img
                      src={getProfileImageUrl(matched?.profileImage, att.name)}
                      alt={att.name}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-500/20"
                      onError={(e) => { (e.target as HTMLImageElement).src = getProfileImageUrl(undefined, att.name) }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-neutral-200 font-medium truncate">{att.name}</p>
                      <div className="flex items-center gap-2">
                        {att.email && <p className="text-xs text-neutral-500 truncate">{att.email}</p>}
                        {matched?.designation && (
                          <span className="text-[10px] text-neutral-600">• {matched.designation}</span>
                        )}
                      </div>
                    </div>
                    {matched?.role && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        matched.role === 'admin'
                          ? 'bg-amber-500/15 text-amber-400'
                          : matched.role === 'Intern'
                            ? 'bg-purple-500/15 text-purple-400'
                            : 'bg-blue-500/15 text-blue-400'
                      }`}>
                        {matched.role}
                      </span>
                    )}
                    {att.isExternal && (
                      <Badge variant="warning" className="text-[10px]">External</Badge>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8">
                <p className="text-neutral-500 text-sm">No attendee information available</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}

// ============================================
// MAIN MEETINGS COMPONENT
// ============================================

export function Meetings() {
  const { employee, getAllEmployees, addTask } = useEmployeeAuth()
  const isAdmin = employee?.role === 'admin'

  const [meetings, setMeetings] = useState<FathomMeeting[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)

  const [hiddenMeetingIds, setHiddenMeetingIds] = useState<Set<number>>(new Set())
  const [removedMeetingIds, setRemovedMeetingIds] = useState<Set<number>>(new Set())
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMeeting, setSelectedMeeting] = useState<FathomMeeting | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const [employees, setEmployees] = useState<EmployeeInfo[]>([])
  const [customTasks, setCustomTasks] = useState<Map<number, FathomActionItem[]>>(new Map())
  // Load employees with full profile data
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const allEmployees = await getAllEmployees()
        setEmployees(allEmployees.map((emp: EmployeeProfile) => ({
          employeeId: emp.employeeId,
          name: emp.name,
          email: emp.email,
          profileImage: emp.profileImage,
          role: emp.role,
          department: emp.department,
          designation: emp.designation
        })))
      } catch (err) {
        console.error('Error loading employees:', err)
      }
    }
    loadEmployees()
  }, [getAllEmployees])

  // Load hidden meeting IDs
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'hiddenMeetings'), (snapshot) => {
      const ids = new Set<number>()
      snapshot.docs.forEach(d => {
        const rid = d.data().recordingId
        if (rid) ids.add(Number(rid))
      })
      setHiddenMeetingIds(ids)
    }, (err) => {
      console.error('hiddenMeetings listener error:', err)
    })
    return () => unsubscribe()
  }, [])

  // Load removed meeting IDs (per-user)
  useEffect(() => {
    if (!employee?.employeeId) return
    const unsubscribe = onSnapshot(collection(db, 'removedMeetings'), (snapshot) => {
      const ids = new Set<number>()
      snapshot.docs.forEach(d => {
        const data = d.data()
        if (data.removedBy === employee.employeeId) {
          ids.add(Number(data.recordingId))
        }
      })
      setRemovedMeetingIds(ids)
    }, (err) => {
      console.error('removedMeetings listener error:', err)
    })
    return () => unsubscribe()
  }, [employee?.employeeId])

  // Load completed task IDs
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'meetingTaskStatus'), (snapshot) => {
      const ids = new Set<string>()
      snapshot.docs.forEach(d => {
        const data = d.data()
        if (data.completed) ids.add(d.id)
      })
      setCompletedTaskIds(ids)
    }, (err) => {
      console.error('meetingTaskStatus listener error:', err)
    })
    return () => unsubscribe()
  }, [])

  // Load custom tasks (admin-added tasks per meeting)
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'meetingCustomTasks'), (snapshot) => {
      const tasksMap = new Map<number, FathomActionItem[]>()
      snapshot.docs.forEach(d => {
        const data = d.data()
        const meetingId = Number(data.meetingId)
        if (!tasksMap.has(meetingId)) tasksMap.set(meetingId, [])
        tasksMap.get(meetingId)!.push({
          description: data.description || '',
          user_generated: true,
          completed: data.completed || false,
          assignee: data.assignee || undefined
        })
      })
      setCustomTasks(tasksMap)
    }, (err) => {
      console.error('meetingCustomTasks listener error:', err)
    })
    return () => unsubscribe()
  }, [])

  // Custom task CRUD
  const handleAddCustomTask = async (meetingId: number, task: FathomActionItem) => {
    try {
      const docId = `${meetingId}_${Date.now()}`
      await setDoc(doc(db, 'meetingCustomTasks', docId), {
        meetingId,
        description: task.description,
        completed: false,
        assignee: task.assignee || null,
        createdBy: employee?.employeeId || '',
        createdAt: Timestamp.now()
      })
      toast.success('Task added')
    } catch (err) {
      console.error('Error adding custom task:', err)
      toast.error('Failed to add task')
    }
  }

  const handleEditCustomTask = async (meetingId: number, taskIndex: number, task: FathomActionItem) => {
    try {
      // Find the Firestore doc for this custom task
      const snapshot = await getDocs(collection(db, 'meetingCustomTasks'))
      const meetingDocs = snapshot.docs.filter(d => Number(d.data().meetingId) === meetingId)
      if (meetingDocs[taskIndex]) {
        await setDoc(doc(db, 'meetingCustomTasks', meetingDocs[taskIndex].id), {
          ...meetingDocs[taskIndex].data(),
          description: task.description,
          assignee: task.assignee || null,
          updatedAt: Timestamp.now()
        })
        toast.success('Task updated')
      }
    } catch (err) {
      console.error('Error editing custom task:', err)
      toast.error('Failed to update task')
    }
  }

  const handleDeleteCustomTask = async (meetingId: number, taskIndex: number) => {
    try {
      const snapshot = await getDocs(collection(db, 'meetingCustomTasks'))
      const meetingDocs = snapshot.docs.filter(d => Number(d.data().meetingId) === meetingId)
      if (meetingDocs[taskIndex]) {
        await deleteDoc(doc(db, 'meetingCustomTasks', meetingDocs[taskIndex].id))
        toast.success('Task deleted')
      }
    } catch (err) {
      console.error('Error deleting custom task:', err)
      toast.error('Failed to delete task')
    }
  }

  // Fetch meetings
  const notifiedMeetingsRef = useRef<Set<number>>(new Set())
  
  const fetchMeetings = useCallback(async (cursor?: string) => {
    try {
      if (!cursor) setLoading(true)
      else setLoadingMore(true)

      const params = new URLSearchParams({ action: 'list' })
      if (cursor) params.set('cursor', cursor)

      const response = await fetch(`/api/fathom?${params.toString()}`)
      if (!response.ok) throw new Error(`Failed to fetch meetings: ${response.status}`)

      const data: FathomListResponse = await response.json()

      if (cursor) {
        setMeetings(prev => [...prev, ...data.items])
      } else {
        setMeetings(data.items)
        
        // Auto-notify for new meetings with summaries (only on first load, only admin triggers this)
        if (isAdmin && employee && data.items.length > 0) {
          autoNotifyNewMeetings(data.items)
        }
      }
      setNextCursor(data.next_cursor)
      setError(null)
    } catch (err) {
      console.error('Error fetching meetings:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch meetings')
    } finally {
      setLoading(false)
      setLoadingMore(false)
      setRefreshing(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, employee])

  // Auto-send notifications for new meeting summaries to all mentioned people
  const autoNotifyNewMeetings = useCallback(async (fetchedMeetings: FathomMeeting[]) => {
    if (!employee) return

    try {
      // Check which meetings we haven't notified about yet
      const notifiedRef = collection(db, 'meetingNotified')
      const notifiedSnapshot = await getDocs(notifiedRef)
      const alreadyNotified = new Set<number>()
      notifiedSnapshot.docs.forEach(d => {
        alreadyNotified.add(Number(d.data().recordingId))
      })

      // Only process meetings from the last 24 hours that have summaries
      const oneDayAgo = new Date()
      oneDayAgo.setHours(oneDayAgo.getHours() - 24)

      const newMeetings = fetchedMeetings.filter(m => 
        m.default_summary?.markdown_formatted &&
        !alreadyNotified.has(m.recording_id) &&
        !notifiedMeetingsRef.current.has(m.recording_id) &&
        new Date(m.created_at) > oneDayAgo
      )

      if (newMeetings.length === 0) return

      console.log(`🔔 Found ${newMeetings.length} new meetings to notify about`)

      for (const meeting of newMeetings) {
        // Mark as notified immediately to prevent duplicates
        notifiedMeetingsRef.current.add(meeting.recording_id)

        // Get all attendees + assignees
        const allPeople = getAllAttendees(meeting)
        
        // Match to employees
        const matchedEmployeeIds = allPeople
          .map(person => {
            const matched = fuzzyMatchEmployee(person.name, person.email, employees)
            return matched?.employeeId
          })
          .filter((id): id is string => !!id && id !== employee.employeeId)

        if (matchedEmployeeIds.length === 0) continue

        const meetingTitle = meeting.meeting_title || meeting.title || 'Untitled Meeting'
        const taskCount = (meeting.action_items || []).filter(a => a).length

        // Create notification for matched employees
        await createGlobalNotification({
          type: 'meeting',
          action: 'created',
          title: `📋 Meeting Summary Ready: ${meetingTitle}`,
          message: `The MoM for "${meetingTitle}" is ready with ${taskCount} action item${taskCount !== 1 ? 's' : ''}. Check your tasks!`,
          relatedEntityId: String(meeting.recording_id),
          targetUrl: '#meetings',
          createdBy: employee.employeeId,
          createdByName: employee.name,
          createdByRole: employee.role
        })

        // Store in Firestore so we don't re-notify
        await setDoc(doc(db, 'meetingNotified', String(meeting.recording_id)), {
          recordingId: meeting.recording_id,
          title: meetingTitle,
          notifiedBy: employee.employeeId,
          notifiedAt: Timestamp.now(),
          recipientCount: matchedEmployeeIds.length
        })

        console.log(`✅ Notified ${matchedEmployeeIds.length} people about: ${meetingTitle}`)
      }
    } catch (err) {
      console.error('Error auto-notifying meetings:', err)
    }
  }, [employee, employees])

  useEffect(() => { fetchMeetings() }, [fetchMeetings])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchMeetings()
  }

  // Hide/show (admin)
  const handleToggleHide = async (recordingId: number, hide: boolean) => {
    if (!isAdmin) return
    try {
      const docRef = doc(db, 'hiddenMeetings', String(recordingId))
      if (hide) {
        await setDoc(docRef, {
          recordingId: Number(recordingId),
          hiddenBy: employee?.employeeId || '',
          hiddenAt: Timestamp.now()
        })
        toast.success('Meeting hidden from interns')
      } else {
        await deleteDoc(docRef)
        toast.success('Meeting visible to everyone')
      }
    } catch (err) {
      console.error('Error toggling hide:', err)
      toast.error('Failed to update. Deploy Firestore rules first.')
    }
  }

  // Remove from portal (per-user)
  const handleRemove = async (recordingId: number) => {
    if (!employee?.employeeId) return
    try {
      const docId = `${employee.employeeId}_${recordingId}`
      await setDoc(doc(db, 'removedMeetings', docId), {
        recordingId: Number(recordingId),
        removedBy: employee.employeeId,
        removedAt: Timestamp.now()
      })
      toast.success('Meeting removed from your portal')
    } catch (err) {
      console.error('Error removing meeting:', err)
      toast.error('Failed to remove meeting')
    }
  }

  // Toggle task completion
  const handleToggleTaskComplete = async (meetingId: number, taskIndex: number, complete: boolean) => {
    if (!employee?.employeeId) return
    const taskDocId = `${meetingId}_${taskIndex}`
    try {
      if (complete) {
        await setDoc(doc(db, 'meetingTaskStatus', taskDocId), {
          meetingId,
          taskIndex,
          completed: true,
          completedBy: employee.employeeId,
          completedByName: employee.name,
          completedAt: Timestamp.now()
        })

        // Also create a task in the main tasks collection
        const meeting = meetings.find(m => m.recording_id === meetingId)
        const actionItem = meeting?.action_items?.[taskIndex]
        if (meeting && actionItem) {
          const assigneeIds: string[] = []
          const assigneeNames: string[] = []
          if (actionItem.assignee) {
            const matchedEmp = employees.find(
              emp => (actionItem.assignee!.email && emp.email.toLowerCase() === actionItem.assignee!.email.toLowerCase()) ||
                     (actionItem.assignee!.name && emp.name.toLowerCase() === actionItem.assignee!.name.toLowerCase())
            )
            if (matchedEmp) {
              assigneeIds.push(matchedEmp.employeeId)
              assigneeNames.push(matchedEmp.name)
            }
          }
          if (assigneeIds.length === 0) {
            assigneeIds.push(employee.employeeId)
            assigneeNames.push(employee.name)
          }

          try {
            await addTask({
              title: actionItem.description || `Task from: ${meeting.meeting_title || meeting.title}`,
              description: `From meeting: ${meeting.meeting_title || meeting.title}\n\n${actionItem.description || ''}`,
              status: 'completed',
              priority: 'medium',
              assignedTo: assigneeIds,
              assignedToNames: assigneeNames,
              department: employee.department || '',
              meetingId: meetingId,
              createdFrom: 'meeting'
            })
          } catch (taskErr) {
            console.error('Error creating task from meeting:', taskErr)
            // Don't block the meeting task update if task creation fails
          }
        }

        toast.success('Task marked as complete')
      } else {
        await deleteDoc(doc(db, 'meetingTaskStatus', taskDocId))
        toast.info('Task marked as pending')
      }
    } catch (err) {
      console.error('Error updating task:', err)
      toast.error('Failed to update task')
    }
  }

  // Send notification
  const handleSendMentionNotification = async (meeting: FathomMeeting, actionItem: FathomActionItem) => {
    if (!employee || !actionItem?.assignee) return

    const assigneeName = actionItem.assignee.name || ''
    const assigneeEmail = actionItem.assignee.email || ''

    const matchedEmp = fuzzyMatchEmployee(assigneeName, assigneeEmail, employees)

    if (!matchedEmp) {
      toast.error(`${assigneeName || 'This person'} is not in the employee portal`)
      return
    }

    try {
      await createGlobalNotification({
        type: 'meeting',
        action: 'mentioned',
        title: `Meeting Task: ${meeting.meeting_title || meeting.title}`,
        message: `${employee.name} assigned you a task: ${actionItem.description || 'Task assigned'}`,
        relatedEntityId: String(meeting.recording_id),
        targetUrl: '#meetings',
        createdBy: employee.employeeId,
        createdByName: employee.name,
        createdByRole: employee.role
      })
      toast.success(`Notification sent to ${assigneeName}`)
    } catch (err) {
      console.error('Error sending notification:', err)
      toast.error('Failed to send notification')
    }
  }

  const handleViewDetails = (meeting: FathomMeeting) => {
    setSelectedMeeting(meeting)
    setShowDetailModal(true)
  }

  // Filter
  const filteredMeetings = meetings.filter(m => {
    if (removedMeetingIds.has(m.recording_id)) return false
    if (hiddenMeetingIds.has(m.recording_id) && !isAdmin) return false

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const titleMatch = (m.meeting_title || m.title || '').toLowerCase().includes(q)
      const inviteeMatch = m.calendar_invitees?.some(
        inv => inv.name?.toLowerCase().includes(q) || inv.email?.toLowerCase().includes(q)
      )
      const speakerMatch = m.speakers?.some(s => s.display_name?.toLowerCase().includes(q))
      const actionMatch = m.action_items?.some(
        a => a?.description?.toLowerCase().includes(q) || a?.assignee?.name?.toLowerCase().includes(q)
      )
      return titleMatch || inviteeMatch || speakerMatch || actionMatch
    }
    return true
  })

  // RENDER
  if (loading) {
    return (
      <Card padding="lg" glow>
        <div className="flex flex-col items-center justify-center py-16">
          <SpinnerUI size="lg" />
          <p className="text-neutral-400 mt-4 text-sm">Loading meetings from Fathom...</p>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card padding="lg">
        <div className="text-center py-12">
          <FaVideo className="text-4xl text-red-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white mb-2">Failed to Load Meetings</h3>
          <p className="text-neutral-400 text-sm mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="primary" size="sm">
            <FaSyncAlt className="mr-2" /> Retry
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <FaVideo className="text-blue-400" />
            Recent Meetings
          </h2>
          <p className="text-neutral-500 text-xs mt-0.5">
            {filteredMeetings.length} meeting{filteredMeetings.length !== 1 ? 's' : ''}
            {isAdmin && hiddenMeetingIds.size > 0 && (
              <span className="text-red-400 ml-1.5">• {hiddenMeetingIds.size} hidden</span>
            )}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-all text-xs disabled:opacity-50"
        >
          <FaSyncAlt className={`text-[10px] ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500 text-xs" />
        <input
          type="text"
          placeholder="Search meetings, people, or tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-neutral-200 text-sm placeholder:text-neutral-600 focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all outline-none"
        />
      </div>

      {/* List */}
      {filteredMeetings.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            icon={<FaVideo className="text-3xl text-neutral-600" />}
            title={searchQuery ? 'No meetings match your search' : 'No meetings found'}
            description={searchQuery ? 'Try different keywords' : 'Meetings will appear here after being recorded via Fathom.'}
          />
        </Card>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {filteredMeetings.map((meeting) => (
              <MeetingCard
                key={meeting.recording_id}
                meeting={meeting}
                isHidden={hiddenMeetingIds.has(meeting.recording_id)}
                isAdmin={isAdmin}
                onToggleHide={handleToggleHide}
                onRemove={handleRemove}
                onViewDetails={handleViewDetails}
                employees={employees}
                completedTaskIds={completedTaskIds}
              />
            ))}
          </AnimatePresence>

          {nextCursor && (
            <div className="text-center pt-1">
              <button
                onClick={() => fetchMeetings(nextCursor)}
                disabled={loadingMore}
                className="px-5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-all text-xs disabled:opacity-50 flex items-center gap-2 mx-auto"
              >
                {loadingMore ? (
                  <><FaSpinner className="animate-spin" /> Loading...</>
                ) : (
                  <><FaChevronDown /> Load More</>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      <MeetingDetailModal
        meeting={selectedMeeting}
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedMeeting(null) }}
        employees={employees}
        employeeData={employee ? { employeeId: employee.employeeId, name: employee.name, role: employee.role } : null}
        onSendMentionNotification={handleSendMentionNotification}
        completedTaskIds={completedTaskIds}
        onToggleTaskComplete={handleToggleTaskComplete}
        customTasks={customTasks}
        onAddCustomTask={handleAddCustomTask}
        onEditCustomTask={handleEditCustomTask}
        onDeleteCustomTask={handleDeleteCustomTask}
      />
    </div>
  )
}

export default Meetings
