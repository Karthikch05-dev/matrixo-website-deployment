'use client'

import { useState, useEffect, useCallback } from 'react'
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
  FaLock
} from 'react-icons/fa'
import { useEmployeeAuth } from '@/lib/employeePortalContext'
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
  getDoc,
  query,
  where,
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

// ============================================
// HELPERS
// ============================================

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

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

function renderMarkdownSimple(md: string): string {
  // Very lightweight markdown → HTML for summaries
  return md
    .replace(/^## (.*$)/gm, '<h3 class="text-lg font-semibold text-white mt-4 mb-2">$1</h3>')
    .replace(/^### (.*$)/gm, '<h4 class="text-base font-semibold text-neutral-200 mt-3 mb-1">$1</h4>')
    .replace(/^\* (.*$)/gm, '<li class="ml-4 text-neutral-300 text-sm list-disc">$1</li>')
    .replace(/^- (.*$)/gm, '<li class="ml-4 text-neutral-300 text-sm list-disc">$1</li>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
    .replace(/\n\n/g, '<br/>')
}

// ============================================
// MEETING CARD COMPONENT
// ============================================

function MeetingCard({
  meeting,
  isHidden,
  isAdmin,
  onToggleHide,
  onViewDetails,
  onSendMentionNotification,
  employees
}: {
  meeting: FathomMeeting
  isHidden: boolean
  isAdmin: boolean
  onToggleHide: (recordingId: number, hide: boolean) => void
  onViewDetails: (meeting: FathomMeeting) => void
  onSendMentionNotification: (meeting: FathomMeeting, actionItem: FathomActionItem) => void
  employees: { employeeId: string; name: string; email: string }[]
}) {
  const pendingActions = meeting.action_items?.filter(a => !a.completed) || []
  const completedActions = meeting.action_items?.filter(a => a.completed) || []
  const duration = formatDuration(meeting.recording_start_time, meeting.recording_end_time)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <Card className={`relative ${isHidden ? 'opacity-60 border-l-4 border-l-red-500/50' : ''}`}>
        <div className="p-4 sm:p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <FaVideo className="text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h3
                  className="text-base font-semibold text-white truncate cursor-pointer hover:text-blue-400 transition-colors"
                  onClick={() => onViewDetails(meeting)}
                >
                  {meeting.meeting_title || meeting.title}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-neutral-500">
                  <span className="flex items-center gap-1">
                    <FaCalendarAlt />
                    {new Date(meeting.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </span>
                  {duration && (
                    <span className="flex items-center gap-1">
                      <FaClock />
                      {duration}
                    </span>
                  )}
                  {meeting.recorded_by && (
                    <span className="text-neutral-600">by {meeting.recorded_by.name}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {isHidden && (
                <Badge variant="error" className="text-xs">
                  <FaLock className="mr-1" /> Hidden
                </Badge>
              )}
              {isAdmin && (
                <button
                  onClick={() => onToggleHide(meeting.recording_id, !isHidden)}
                  className={`p-2 rounded-lg transition-all text-sm ${
                    isHidden
                      ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                      : 'bg-neutral-800 text-neutral-400 hover:bg-red-500/20 hover:text-red-400'
                  }`}
                  title={isHidden ? 'Show to all' : 'Hide from interns'}
                >
                  {isHidden ? <FaEye /> : <FaEyeSlash />}
                </button>
              )}
              <a
                href={meeting.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-neutral-800 text-neutral-400 hover:bg-blue-500/20 hover:text-blue-400 transition-all"
                title="Open in Fathom"
              >
                <FaExternalLinkAlt />
              </a>
            </div>
          </div>

          {/* Attendees */}
          {meeting.calendar_invitees && meeting.calendar_invitees.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {meeting.calendar_invitees.slice(0, 6).map((inv, i) => (
                <span
                  key={i}
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    inv.is_external
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}
                >
                  {inv.name || inv.email.split('@')[0]}
                </span>
              ))}
              {meeting.calendar_invitees.length > 6 && (
                <span className="text-xs text-neutral-500">+{meeting.calendar_invitees.length - 6} more</span>
              )}
            </div>
          )}

          {/* Action Items Summary */}
          {meeting.action_items && meeting.action_items.length > 0 && (
            <div className="mt-3 flex items-center gap-3 text-xs">
              {pendingActions.length > 0 && (
                <span className="flex items-center gap-1 text-amber-400">
                  <FaCircle className="text-[8px]" />
                  {pendingActions.length} pending task{pendingActions.length !== 1 ? 's' : ''}
                </span>
              )}
              {completedActions.length > 0 && (
                <span className="flex items-center gap-1 text-emerald-400">
                  <FaCheckCircle className="text-[10px]" />
                  {completedActions.length} completed
                </span>
              )}
            </div>
          )}

          {/* View Details Button */}
          <button
            onClick={() => onViewDetails(meeting)}
            className="mt-3 w-full text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center justify-center gap-1 py-2 rounded-lg hover:bg-blue-500/10"
          >
            View MoM & Details
            <FaChevronRight className="text-xs" />
          </button>
        </div>
      </Card>
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
  onSendMentionNotification
}: {
  meeting: FathomMeeting | null
  isOpen: boolean
  onClose: () => void
  employees: { employeeId: string; name: string; email: string }[]
  employeeData: { employeeId: string; name: string; role: string } | null
  onSendMentionNotification: (meeting: FathomMeeting, actionItem: FathomActionItem) => void
}) {
  const [activeSection, setActiveSection] = useState<'summary' | 'actions' | 'attendees'>('summary')

  if (!meeting) return null

  const pendingActions = meeting.action_items?.filter(a => !a.completed) || []
  const completedActions = meeting.action_items?.filter(a => a.completed) || []
  const duration = formatDuration(meeting.recording_start_time, meeting.recording_end_time)

  // Match action item assignees to employee portal users
  const matchAssigneeToEmployee = (assignee?: { name: string; email: string }) => {
    if (!assignee) return null
    return employees.find(
      emp => emp.email.toLowerCase() === assignee.email.toLowerCase() ||
             emp.name.toLowerCase() === assignee.name.toLowerCase()
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="lg">
      <div className="max-h-[80vh] overflow-y-auto -m-6 p-6">
        {/* Meeting Header */}
        <div className="flex items-start gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <FaVideo className="text-xl text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white">
              {meeting.meeting_title || meeting.title}
            </h2>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-neutral-400">
              <span className="flex items-center gap-1">
                <FaCalendarAlt className="text-xs" />
                {new Date(meeting.created_at).toLocaleDateString('en-IN', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                })}
              </span>
              {duration && (
                <span className="flex items-center gap-1">
                  <FaClock className="text-xs" />
                  {duration}
                </span>
              )}
            </div>
            {meeting.recorded_by && (
              <p className="text-xs text-neutral-500 mt-1">
                Recorded by {meeting.recorded_by.name}
                {meeting.recorded_by.team && ` • ${meeting.recorded_by.team}`}
              </p>
            )}
          </div>
          <a
            href={meeting.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all text-sm flex items-center gap-1.5 flex-shrink-0"
          >
            <FaPlay className="text-xs" />
            Watch
          </a>
        </div>

        {/* Section Tabs */}
        <div className="flex border-b border-neutral-700 mb-4">
          {[
            { id: 'summary' as const, label: 'Summary & Next Steps', icon: FaClipboardList },
            { id: 'actions' as const, label: `Tasks (${meeting.action_items?.length || 0})`, icon: FaTasks },
            { id: 'attendees' as const, label: `Attendees (${meeting.calendar_invitees?.length || 0})`, icon: FaUserTag },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
                activeSection === tab.id
                  ? 'text-blue-400 border-blue-400'
                  : 'text-neutral-500 border-transparent hover:text-neutral-300'
              }`}
            >
              <tab.icon className="text-xs" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Summary Section */}
        {activeSection === 'summary' && (
          <div className="space-y-4">
            {meeting.default_summary?.markdown_formatted ? (
              <div
                className="prose prose-invert prose-sm max-w-none"
                dangerouslySetInnerHTML={{
                  __html: renderMarkdownSimple(meeting.default_summary.markdown_formatted)
                }}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-neutral-500">Summary is being generated...</p>
                <p className="text-neutral-600 text-xs mt-1">Check back in a few minutes after the meeting ends.</p>
              </div>
            )}
          </div>
        )}

        {/* Action Items / Tasks Section */}
        {activeSection === 'actions' && (
          <div className="space-y-4">
            {/* Pending Tasks */}
            {pendingActions.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-amber-400 mb-2 flex items-center gap-2">
                  <FaCircle className="text-[8px]" />
                  Pending Tasks ({pendingActions.length})
                </h4>
                <div className="space-y-2">
                  {pendingActions.map((item, i) => {
                    const matchedEmployee = matchAssigneeToEmployee(item.assignee)
                    return (
                      <div
                        key={i}
                        className="p-3 bg-neutral-800/50 rounded-xl border border-neutral-700 hover:border-amber-500/30 transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <FaCircle className="text-amber-400 text-[8px] mt-1.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-neutral-200">{item.description}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              {item.assignee && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                  @{item.assignee.name}
                                </span>
                              )}
                              {item.recording_timestamp && (
                                <a
                                  href={item.recording_playback_url || meeting.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-neutral-500 hover:text-blue-400 transition-colors flex items-center gap-1"
                                >
                                  <FaPlay className="text-[8px]" />
                                  {item.recording_timestamp}
                                </a>
                              )}
                            </div>
                          </div>
                          {/* Send notification button for matched employees */}
                          {matchedEmployee && employeeData && (
                            <button
                              onClick={() => onSendMentionNotification(meeting, item)}
                              className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all flex-shrink-0"
                              title={`Notify ${item.assignee?.name}`}
                            >
                              <FaBell className="text-xs" />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Completed Tasks */}
            {completedActions.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-emerald-400 mb-2 flex items-center gap-2">
                  <FaCheckCircle className="text-xs" />
                  Completed ({completedActions.length})
                </h4>
                <div className="space-y-2">
                  {completedActions.map((item, i) => (
                    <div
                      key={i}
                      className="p-3 bg-neutral-800/30 rounded-xl border border-neutral-700/50"
                    >
                      <div className="flex items-start gap-3">
                        <FaCheckCircle className="text-emerald-400 text-xs mt-1 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-neutral-400 line-through">{item.description}</p>
                          {item.assignee && (
                            <span className="text-xs text-neutral-600 mt-1 inline-block">
                              @{item.assignee.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(!meeting.action_items || meeting.action_items.length === 0) && (
              <div className="text-center py-8">
                <FaTasks className="text-3xl text-neutral-600 mx-auto mb-2" />
                <p className="text-neutral-500 text-sm">No action items from this meeting</p>
              </div>
            )}
          </div>
        )}

        {/* Attendees Section */}
        {activeSection === 'attendees' && (
          <div className="space-y-2">
            {meeting.calendar_invitees && meeting.calendar_invitees.length > 0 ? (
              meeting.calendar_invitees.map((inv, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 bg-neutral-800/50 rounded-xl border border-neutral-700"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    inv.is_external ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {(inv.name || inv.email)[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-200 truncate">{inv.name || inv.email.split('@')[0]}</p>
                    <p className="text-xs text-neutral-500 truncate">{inv.email}</p>
                  </div>
                  {inv.is_external && (
                    <Badge variant="warning" className="text-xs">External</Badge>
                  )}
                </div>
              ))
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
  const { employee, getAllEmployees } = useEmployeeAuth()
  const isAdmin = employee?.role === 'admin'

  const [meetings, setMeetings] = useState<FathomMeeting[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)

  const [hiddenMeetingIds, setHiddenMeetingIds] = useState<Set<number>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMeeting, setSelectedMeeting] = useState<FathomMeeting | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  // Employee list for matching assignees to portal users
  const [employees, setEmployees] = useState<{ employeeId: string; name: string; email: string }[]>([])

  // Load employees
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const allEmployees = await getAllEmployees()
        setEmployees(allEmployees.map((emp) => ({
          employeeId: emp.employeeId,
          name: emp.name,
          email: emp.email
        })))
      } catch (err) {
        console.error('Error loading employees:', err)
      }
    }
    loadEmployees()
  }, [getAllEmployees])

  // Load hidden meeting IDs from Firestore
  useEffect(() => {
    const hiddenRef = collection(db, 'hiddenMeetings')
    const unsubscribe = onSnapshot(hiddenRef, (snapshot) => {
      const ids = new Set<number>()
      snapshot.docs.forEach(doc => {
        ids.add(doc.data().recordingId as number)
      })
      setHiddenMeetingIds(ids)
    })
    return () => unsubscribe()
  }, [])

  // Fetch meetings from Fathom API
  const fetchMeetings = useCallback(async (cursor?: string) => {
    try {
      if (!cursor) setLoading(true)
      else setLoadingMore(true)

      const params = new URLSearchParams({ action: 'list' })
      if (cursor) params.set('cursor', cursor)

      const response = await fetch(`/api/fathom?${params.toString()}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch meetings: ${response.status}`)
      }

      const data: FathomListResponse = await response.json()

      if (cursor) {
        setMeetings(prev => [...prev, ...data.items])
      } else {
        setMeetings(data.items)
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
  }, [])

  useEffect(() => {
    fetchMeetings()
  }, [fetchMeetings])

  // Refresh meetings
  const handleRefresh = () => {
    setRefreshing(true)
    fetchMeetings()
  }

  // Toggle hide/show meeting (admin only)
  const handleToggleHide = async (recordingId: number, hide: boolean) => {
    if (!isAdmin) return
    try {
      const docRef = doc(db, 'hiddenMeetings', String(recordingId))
      if (hide) {
        await setDoc(docRef, {
          recordingId,
          hiddenBy: employee?.employeeId,
          hiddenAt: Timestamp.now()
        })
        toast.success('Meeting hidden from interns')
      } else {
        await deleteDoc(docRef)
        toast.success('Meeting is now visible to everyone')
      }
    } catch (err) {
      console.error('Error toggling meeting visibility:', err)
      toast.error('Failed to update meeting visibility')
    }
  }

  // Send @mention notification to an employee for a meeting task
  const handleSendMentionNotification = async (meeting: FathomMeeting, actionItem: FathomActionItem) => {
    if (!employee || !actionItem.assignee) return

    // Find the matched employee in portal
    const matchedEmp = employees.find(
      emp => emp.email.toLowerCase() === actionItem.assignee!.email.toLowerCase() ||
             emp.name.toLowerCase() === actionItem.assignee!.name.toLowerCase()
    )

    if (!matchedEmp) {
      toast.error(`${actionItem.assignee.name} is not registered in the employee portal`)
      return
    }

    try {
      await createGlobalNotification({
        type: 'meeting',
        action: 'mentioned',
        title: `Meeting Task: ${meeting.meeting_title || meeting.title}`,
        message: `${employee.name} assigned you a task from meeting "${meeting.meeting_title || meeting.title}": ${actionItem.description}`,
        relatedEntityId: String(meeting.recording_id),
        targetUrl: '#meetings',
        createdBy: employee.employeeId,
        createdByName: employee.name,
        createdByRole: employee.role
      })
      toast.success(`Notification sent to ${actionItem.assignee.name}`)
    } catch (err) {
      console.error('Error sending notification:', err)
      toast.error('Failed to send notification')
    }
  }

  // View meeting details
  const handleViewDetails = (meeting: FathomMeeting) => {
    setSelectedMeeting(meeting)
    setShowDetailModal(true)
  }

  // Filter meetings: hide hidden ones for non-admins, apply search
  const filteredMeetings = meetings.filter(m => {
    const isHidden = hiddenMeetingIds.has(m.recording_id)
    // Non-admins can't see hidden meetings
    if (isHidden && !isAdmin) return false

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const titleMatch = (m.meeting_title || m.title || '').toLowerCase().includes(q)
      const inviteeMatch = m.calendar_invitees?.some(
        inv => inv.name?.toLowerCase().includes(q) || inv.email?.toLowerCase().includes(q)
      )
      const actionMatch = m.action_items?.some(
        a => a.description?.toLowerCase().includes(q) || a.assignee?.name?.toLowerCase().includes(q)
      )
      return titleMatch || inviteeMatch || actionMatch
    }
    return true
  })

  // ============================================
  // RENDER
  // ============================================

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
            <FaSyncAlt className="mr-2" />
            Retry
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <FaVideo className="text-blue-400" />
            Recent Meetings
          </h2>
          <p className="text-neutral-400 text-sm mt-1">
            {meetings.length} meeting{meetings.length !== 1 ? 's' : ''} from Fathom
            {isAdmin && hiddenMeetingIds.size > 0 && (
              <span className="text-red-400 ml-2">
                ({hiddenMeetingIds.size} hidden from interns)
              </span>
            )}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl transition-all text-sm disabled:opacity-50"
        >
          <FaSyncAlt className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500" />
        <input
          type="text"
          placeholder="Search meetings, attendees, or tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-neutral-800/50 border border-neutral-700 rounded-xl text-neutral-200 text-sm placeholder:text-neutral-600 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all outline-none"
        />
      </div>

      {/* Meetings List */}
      {filteredMeetings.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            icon={<FaVideo className="text-4xl text-neutral-600" />}
            title={searchQuery ? 'No meetings match your search' : 'No meetings found'}
            description={searchQuery ? 'Try a different search term' : 'Meetings will appear here after they are recorded via Fathom.'}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredMeetings.map((meeting) => (
              <MeetingCard
                key={meeting.recording_id}
                meeting={meeting}
                isHidden={hiddenMeetingIds.has(meeting.recording_id)}
                isAdmin={isAdmin}
                onToggleHide={handleToggleHide}
                onViewDetails={handleViewDetails}
                onSendMentionNotification={handleSendMentionNotification}
                employees={employees}
              />
            ))}
          </AnimatePresence>

          {/* Load More */}
          {nextCursor && (
            <div className="text-center pt-2">
              <button
                onClick={() => fetchMeetings(nextCursor)}
                disabled={loadingMore}
                className="px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl transition-all text-sm disabled:opacity-50 flex items-center gap-2 mx-auto"
              >
                {loadingMore ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <FaChevronDown />
                    Load More Meetings
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Meeting Detail Modal */}
      <MeetingDetailModal
        meeting={selectedMeeting}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false)
          setSelectedMeeting(null)
        }}
        employees={employees}
        employeeData={employee ? { employeeId: employee.employeeId, name: employee.name, role: employee.role } : null}
        onSendMentionNotification={handleSendMentionNotification}
      />
    </div>
  )
}

export default Meetings
