'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FaComments, 
  FaPaperPlane, 
  FaThumbtack,
  FaTrash,
  FaReply,
  FaAt,
  FaEdit,
  FaEllipsisV,
  FaSearch,
  FaTimes,
  FaSmile
} from 'react-icons/fa'
import { useEmployeeAuth, Discussion, DiscussionReply, EmployeeProfile } from '@/lib/employeePortalContext'
import { Card, Button, Badge, Avatar, EmptyState, Spinner, Modal, ProfileInfo } from './ui'
import { toast } from 'sonner'
import { Timestamp } from 'firebase/firestore'

// ============================================
// MENTION INPUT COMPONENT (PORTAL-BASED)
// ============================================

function MentionInput({
  value,
  onChange,
  onSubmit,
  placeholder,
  employees,
  departments,
  loading,
  buttonText = 'Post'
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: (mentions: string[], mentionedDepartments: string[]) => void
  placeholder: string
  employees: EmployeeProfile[]
  departments: string[]
  loading?: boolean
  buttonText?: string
}) {
  const [mounted, setMounted] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [dropdownType, setDropdownType] = useState<'user' | 'department'>('user')
  const [searchQuery, setSearchQuery] = useState('')
  const [triggerIndex, setTriggerIndex] = useState(-1)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 })
  const [selectedIndex, setSelectedIndex] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // SSR safety
  useEffect(() => {
    setMounted(true)
  }, [])

  // Filter suggestions (show ALL employees, only exclude username "Admin")
  const suggestions = useMemo(() => {
    const query = searchQuery.toLowerCase()
    
    if (dropdownType === 'user') {
      // Show ALL employees - only exclude username "Admin"
      const filtered = employees.filter(e => {
        const name = (e.name || '').toLowerCase().trim()
        // Only exclude if name is exactly "admin"
        if (name === 'admin') {
          return false
        }
        // Include everyone else
        if (!query) return true
        // Apply search filter
        const matchesName = e.name.toLowerCase().includes(query)
        const matchesId = e.employeeId.toLowerCase().includes(query)
        const matchesDept = (e.department || '').toLowerCase().includes(query)
        return matchesName || matchesId || matchesDept
      })
      
      return filtered
    } else {
      // Show ALL departments
      const filtered = departments.filter(d => {
        if (!query) return true // Show all if no search query
        return d.toLowerCase().includes(query)
      })
      return filtered
    }
  }, [searchQuery, dropdownType, employees, departments])

  // Reset selected index when suggestions change
  useEffect(() => {
    setSelectedIndex(0)
  }, [suggestions])

  // Calculate dropdown position based on textarea
  const updateDropdownPosition = () => {
    if (!textareaRef.current) return
    const rect = textareaRef.current.getBoundingClientRect()
    setDropdownPos({
      top: rect.bottom + 4,
      left: rect.left
    })
  }

  // Handle text input change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const cursorPos = e.target.selectionStart || 0
    onChange(newValue)
    
    let foundTrigger = -1
    let triggerChar = ''
    
    for (let i = cursorPos - 1; i >= 0; i--) {
      const char = newValue[i]
      if (char === ' ' || char === '\n') break
      if (char === '@' || char === '#') {
        foundTrigger = i
        triggerChar = char
        break
      }
    }
    
    if (foundTrigger >= 0) {
      const query = newValue.slice(foundTrigger + 1, cursorPos)
      setSearchQuery(query)
      setDropdownType(triggerChar === '@' ? 'user' : 'department')
      setTriggerIndex(foundTrigger)
      updateDropdownPosition()
      setShowDropdown(true)
      setSelectedIndex(0)
      return
    }
    
    setShowDropdown(false)
    setTriggerIndex(-1)
  }

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      setShowDropdown(false)
    } else if (showDropdown && suggestions.length > 0) {
      // Arrow key navigation in dropdown
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % suggestions.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length)
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        // Select the highlighted item
        if (dropdownType === 'user') {
          const emp = suggestions[selectedIndex] as EmployeeProfile
          if (emp) selectMention(emp.name)
        } else {
          const dept = suggestions[selectedIndex] as string
          if (dept) selectMention(dept)
        }
      }
    } else if (e.key === 'Enter' && !e.shiftKey && !showDropdown) {
      e.preventDefault()
      handleSubmit()
    }
  }

  // Insert selected mention
  const selectMention = (mention: string) => {
    if (triggerIndex < 0) return
    
    const symbol = dropdownType === 'user' ? '@' : '#'
    const beforeTrigger = value.slice(0, triggerIndex)
    const cursorPos = textareaRef.current?.selectionStart || value.length
    const afterCursor = value.slice(cursorPos)
    
    const mentionNoSpaces = mention.replace(/\s+/g, '')
    const newValue = beforeTrigger + symbol + mentionNoSpaces + ' ' + afterCursor
    onChange(newValue)
    
    const newCursorPos = beforeTrigger.length + symbol.length + mentionNoSpaces.length + 1
    setTimeout(() => {
      textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos)
      textareaRef.current?.focus()
    }, 0)
    
    setShowDropdown(false)
    setTriggerIndex(-1)
  }

  // Submit the message
  const handleSubmit = () => {
    if (!value.trim()) return
    
    const userMentionPattern = /@(\w+)/g
    const deptMentionPattern = /#(\w+)/g
    
    const userMentions: string[] = []
    const deptMentions: string[] = []
    
    let match
    while ((match = userMentionPattern.exec(value)) !== null) {
      userMentions.push(match[1].trim())
    }
    while ((match = deptMentionPattern.exec(value)) !== null) {
      deptMentions.push(match[1].trim())
    }
    
    const mentionIds = userMentions.map(name => {
      const emp = employees.find(e => 
        e.name.toLowerCase() === name.toLowerCase() ||
        e.name.toLowerCase().replace(/\s/g, '').includes(name.toLowerCase().replace(/\s/g, '')) ||
        e.employeeId.toLowerCase() === name.toLowerCase()
      )
      return emp?.employeeId
    }).filter(Boolean) as string[]
    
    onSubmit(mentionIds, deptMentions)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      const isTextarea = textareaRef.current?.contains(target)
      const isDropdown = dropdownRef.current?.contains(target)
      if (!isTextarea && !isDropdown) {
        setShowDropdown(false)
      }
    }
    
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  // Dropdown portal content
  const dropdownContent = showDropdown && suggestions.length > 0 && mounted ? (
    <div
      ref={dropdownRef}
      className="fixed bg-neutral-800 border border-neutral-700 rounded-lg shadow-2xl overflow-hidden"
      style={{
        top: dropdownPos.top,
        left: dropdownPos.left,
        width: 280,
        zIndex: 999999
      }}
    >
      <div className="px-2 py-1.5 bg-neutral-900 border-b border-neutral-700">
        <p className="text-xs text-neutral-400 font-medium">
          {dropdownType === 'user' ? '👤 Select a person' : '🏢 Select a department'}
        </p>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {dropdownType === 'user' ? (
          (suggestions as EmployeeProfile[]).map((emp, index) => (
            <button
              key={emp.employeeId}
              type="button"
              onClick={() => selectMention(emp.name)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 transition-colors text-left ${
                index === selectedIndex ? 'bg-primary-500/30 border-l-2 border-primary-500' : 'hover:bg-neutral-700'
              }`}
            >
              <Avatar src={emp.profileImage} name={emp.name} size="sm" showBorder={false} />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white font-medium truncate">{emp.name}</p>
                <p className="text-xs text-neutral-500 truncate">{emp.department}</p>
              </div>
            </button>
          ))
        ) : (
          (suggestions as string[]).map((dept, index) => (
            <button
              key={dept}
              type="button"
              onClick={() => selectMention(dept)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 transition-colors text-left ${
                index === selectedIndex ? 'bg-primary-500/30 border-l-2 border-primary-500' : 'hover:bg-neutral-700'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center">
                <FaAt className="text-primary-400 text-xs" />
              </div>
              <p className="text-sm text-white truncate">{dept}</p>
            </button>
          ))
        )}
      </div>
    </div>
  ) : null

  return (
    <div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={3}
        className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-y"
      />
      
      {/* Portal dropdown to document.body */}
      {mounted && dropdownContent && createPortal(dropdownContent, document.body)}

      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-neutral-500">
          Use @name to mention people, #department to mention teams
        </p>
        <Button
          onClick={handleSubmit}
          loading={loading}
          disabled={!value.trim()}
          icon={<FaPaperPlane />}
          size="sm"
        >
          {buttonText}
        </Button>
      </div>
    </div>
  )
}

// ============================================
// REPLY ITEM COMPONENT (with edit support)
// ============================================

function ReplyItem({
  reply,
  discussionId,
  isAdmin,
  currentEmployeeId,
  onDelete,
  formatTimestamp,
  renderContent
}: {
  reply: DiscussionReply
  discussionId: string
  isAdmin: boolean
  currentEmployeeId?: string
  onDelete: (replyId: string) => void
  formatTimestamp: (timestamp: Timestamp) => string
  renderContent: (content: string) => React.ReactNode
}) {
  const { updateDiscussionReply } = useEmployeeAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(reply.content || '')
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const canEdit = reply.authorId === currentEmployeeId
  const canDelete = reply.authorId === currentEmployeeId || isAdmin

  const handleEdit = async () => {
    if (!editContent.trim()) {
      toast.error('Reply cannot be empty')
      return
    }
    setEditSubmitting(true)
    try {
      await updateDiscussionReply(discussionId, reply.id, editContent)
      setIsEditing(false)
      toast.success('Reply updated')
    } catch (error) {
      toast.error('Failed to update reply')
    } finally {
      setEditSubmitting(false)
    }
  }

  const handleCancelEdit = () => {
    setEditContent(reply.content || '')
    setIsEditing(false)
  }

  return (
    <div className="p-4 border-b border-neutral-700/30 last:border-b-0">
      <div className="flex items-start gap-3">
        <ProfileInfo
          data={{
            employeeId: reply.authorId,
            name: reply.authorName || 'Anonymous',
            profileImage: reply.authorImage,
            role: 'employee',
            status: 'Active'
          }}
          isAdmin={false}
        >
          <Avatar src={reply.authorImage} name={reply.authorName || 'Anonymous'} size="sm" showBorder={false} />
        </ProfileInfo>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <ProfileInfo
              data={{
                employeeId: reply.authorId,
                name: reply.authorName || 'Anonymous',
                profileImage: reply.authorImage,
                role: 'employee',
                status: 'Active'
              }}
              isAdmin={false}
            >
              <span className="font-medium text-white text-sm hover:text-primary-400 cursor-pointer">{reply.authorName || 'Anonymous'}</span>
            </ProfileInfo>
            <span className="text-xs text-neutral-500">
              {formatTimestamp(reply.createdAt)}
              {reply.updatedAt && ' (edited)'}
            </span>
          </div>
          
          {isEditing ? (
            <div className="mt-2 space-y-2">
              <textarea
                value={editContent}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditContent(e.target.value)}
                placeholder="Edit your reply..."
                rows={2}
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-y"
              />
              <div className="flex items-center gap-2 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={editSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleEdit}
                  loading={editSubmitting}
                  disabled={!editContent.trim()}
                >
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-neutral-300 text-sm mt-1">{renderContent(reply.content)}</p>
          )}
        </div>
        
        {/* Reply Actions Menu */}
        {(canEdit || canDelete) && !isEditing && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-neutral-500 hover:text-white transition-colors"
            >
              <FaEllipsisV className="text-xs" />
            </button>
            
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 mt-1 w-32 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl z-10 overflow-hidden"
                >
                  {canEdit && (
                    <button
                      onClick={() => { setIsEditing(true); setShowMenu(false) }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-neutral-300 hover:bg-neutral-700 transition-colors"
                    >
                      <FaEdit />
                      Edit
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => { onDelete(reply.id); setShowMenu(false) }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-neutral-700 transition-colors"
                    >
                      <FaTrash />
                      Delete
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// DISCUSSION POST COMPONENT
// ============================================

function DiscussionPost({
  discussion,
  onReply,
  employees
}: {
  discussion: Discussion
  onReply: (discussionId: string) => void
  employees: EmployeeProfile[]
}) {
  const { employee, deleteDiscussion, restoreDiscussion, deleteDiscussionReply, togglePinDiscussion, addDiscussionReply, updateDiscussion, toggleDiscussionReaction } = useEmployeeAuth()
  const [showReplies, setShowReplies] = useState(false)
  const [showReplyInput, setShowReplyInput] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showReactionPicker, setShowReactionPicker] = useState(false)
  const [hoveredReaction, setHoveredReaction] = useState<string | null>(null)
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(discussion.content || '')
  const [editSubmitting, setEditSubmitting] = useState(false)

  const isAdmin = employee?.role === 'admin'
  const isAuthor = discussion.authorId === employee?.employeeId
  const canDelete = isAdmin || isAuthor
  const canEdit = isAuthor // Only author can edit their own message
  const isMentioned = discussion.mentions?.includes(employee?.employeeId || '') ||
    discussion.mentionedDepartments?.includes(employee?.department || '')

  const formatTimestamp = (timestamp: Timestamp) => {
    if (!timestamp?.toDate) return ''
    const date = timestamp.toDate()
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return
    
    // Store the discussion data for potential undo - create a proper copy of all fields
    const deletedDiscussion: Discussion = {
      id: discussion.id,
      content: discussion.content,
      authorId: discussion.authorId,
      authorName: discussion.authorName,
      authorImage: discussion.authorImage,
      authorDepartment: discussion.authorDepartment,
      createdAt: discussion.createdAt,
      updatedAt: discussion.updatedAt,
      mentions: [...(discussion.mentions || [])],
      mentionedDepartments: [...(discussion.mentionedDepartments || [])],
      replies: discussion.replies ? discussion.replies.map(reply => ({ ...reply })) : [],
      isPinned: discussion.isPinned,
      reactions: discussion.reactions ? { ...discussion.reactions } : {}
    }
    
    try {
      await deleteDiscussion(discussion.id!)
      toast.success('Post deleted', {
        duration: 5000,
        action: {
          label: 'Undo',
          onClick: async () => {
            try {
              await restoreDiscussion(deletedDiscussion)
              toast.success('Post restored')
            } catch (error) {
              console.error('Restore error:', error)
              toast.error('Failed to restore post')
            }
          }
        }
      })
    } catch (error) {
      toast.error('Failed to delete post')
    }
  }

  const handleTogglePin = async () => {
    try {
      await togglePinDiscussion(discussion.id!)
      toast.success(discussion.isPinned ? 'Post unpinned' : 'Post pinned')
    } catch (error) {
      toast.error('Failed to update post')
    }
  }

  const handleEdit = async () => {
    if (!editContent.trim()) {
      toast.error('Message cannot be empty')
      return
    }
    setEditSubmitting(true)
    try {
      await updateDiscussion(discussion.id!, editContent)
      setIsEditing(false)
      toast.success('Message updated')
    } catch (error) {
      toast.error('Failed to update message')
    } finally {
      setEditSubmitting(false)
    }
  }

  const handleCancelEdit = () => {
    setEditContent(discussion.content || '')
    setIsEditing(false)
  }

  const handleReply = async (mentions: string[]) => {
    if (!replyContent.trim()) return
    setSubmitting(true)
    try {
      await addDiscussionReply(discussion.id!, replyContent, mentions)
      setReplyContent('')
      setShowReplyInput(false)
      setShowReplies(true)
      toast.success('Reply added')
    } catch (error) {
      toast.error('Failed to add reply')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteReply = async (replyId: string) => {
    if (!confirm('Delete this reply?')) return
    try {
      await deleteDiscussionReply(discussion.id!, replyId)
      toast.success('Reply deleted')
    } catch (error) {
      toast.error('Failed to delete reply')
    }
  }

  // Highlight mentions in content with hover support for @mentions
  const renderContent = (content: string) => {
    if (!content || typeof content !== 'string') return content || ''
    
    const parts = content.split(/(@\w+|#\w+)/g)
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        const mentionName = part.slice(1).toLowerCase()
        // Find employee matching the mention
        const mentionedEmployee = employees.find(e => 
          e.name.toLowerCase().replace(/\s/g, '').includes(mentionName) ||
          e.employeeId.toLowerCase() === mentionName ||
          e.name.split(' ')[0].toLowerCase() === mentionName
        )
        
        if (mentionedEmployee) {
          // Display name WITHOUT @ symbol, but keep hover functionality
          const displayName = mentionedEmployee.name.split(' ')[0] // Show first name
          return (
            <ProfileInfo
              key={i}
              inline={true}
              data={{
                employeeId: mentionedEmployee.employeeId,
                name: mentionedEmployee.name,
                profileImage: mentionedEmployee.profileImage,
                department: mentionedEmployee.department,
                designation: mentionedEmployee.designation,
                role: mentionedEmployee.role || 'employee',
                status: 'Active'
              }}
              isAdmin={false}
            >
              <span className="text-primary-400 font-medium cursor-pointer hover:underline">{displayName}</span>
            </ProfileInfo>
          )
        }
        // If employee not found, show without @ symbol
        return <span key={i} className="text-primary-400 font-medium">{part.slice(1)}</span>
      }
      if (part.startsWith('#')) {
        return <span key={i} className="text-amber-400 font-medium">{part}</span>
      }
      return part
    })
  }

  // Include core departments
  const deptSet = new Set(employees.map(e => e.department).filter(Boolean))
  const coreDepartments = ['Engineering', 'Design', 'Operations', 'HR', 'Marketing']
  coreDepartments.forEach(dept => deptSet.add(dept))
  const departments = Array.from(deptSet).filter(d => d !== 'Admin').sort()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        rounded-lg sm:rounded-xl border overflow-hidden
        ${discussion.isPinned 
          ? 'bg-amber-500/5 border-amber-500/30' 
          : isMentioned 
            ? 'bg-primary-500/5 border-primary-500/30'
            : 'bg-neutral-800/50 border-neutral-700'
        }
      `}
    >
      {/* Header */}
      <div className="p-3 sm:p-4">
        <div className="flex items-start gap-2 sm:gap-3">
          <ProfileInfo
            data={{
              employeeId: discussion.authorId,
              name: discussion.authorName || 'Anonymous',
              profileImage: discussion.authorImage,
              department: discussion.authorDepartment,
              role: 'employee',
              status: 'Active'
            }}
            isAdmin={false}
          >
            <Avatar 
              src={discussion.authorImage} 
              name={discussion.authorName || 'Anonymous'} 
              size="md" 
              showBorder={false} 
            />
          </ProfileInfo>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <ProfileInfo
                data={{
                  employeeId: discussion.authorId,
                  name: discussion.authorName || 'Anonymous',
                  profileImage: discussion.authorImage,
                  department: discussion.authorDepartment,
                  role: 'employee',
                  status: 'Active'
                }}
                isAdmin={false}
              >
                <span className="font-medium text-white hover:text-primary-400 cursor-pointer">{discussion.authorName || 'Anonymous'}</span>
              </ProfileInfo>
              {discussion.authorDepartment && (
                <Badge size="sm">{discussion.authorDepartment}</Badge>
              )}
              {discussion.isPinned && (
                <Badge variant="warning" size="sm">
                  <FaThumbtack className="mr-1" /> Pinned
                </Badge>
              )}
              {isMentioned && (
                <Badge variant="primary" size="sm">Mentioned</Badge>
              )}
            </div>
            <span className="text-xs text-neutral-500">
              {formatTimestamp(discussion.createdAt)}
              {discussion.updatedAt && ' (edited)'}
            </span>
          </div>

          {/* Actions Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded-lg transition-colors"
            >
              <FaEllipsisV />
            </button>
            
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 mt-1 w-40 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl z-10 overflow-hidden"
                >
                  {isAdmin && (
                    <button
                      onClick={() => { handleTogglePin(); setShowMenu(false) }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-700 transition-colors"
                    >
                      <FaThumbtack />
                      {discussion.isPinned ? 'Unpin' : 'Pin Post'}
                    </button>
                  )}
                  {canEdit && (
                    <button
                      onClick={() => { setIsEditing(true); setShowMenu(false) }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-700 transition-colors"
                    >
                      <FaEdit />
                      Edit
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => { handleDelete(); setShowMenu(false) }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-neutral-700 transition-colors"
                    >
                      <FaTrash />
                      Delete
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Content */}
        {isEditing ? (
          <div className="mt-3 space-y-3">
            <textarea
              value={editContent}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditContent(e.target.value)}
              placeholder="Edit your message..."
              rows={4}
              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-y"
            />
            <div className="flex items-center gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelEdit}
                disabled={editSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleEdit}
                loading={editSubmitting}
                disabled={!editContent.trim()}
              >
                Save Changes
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-3 text-neutral-300 whitespace-pre-wrap">
            {renderContent(discussion.content)}
          </div>
        )}

        {/* Reactions Display */}
        {discussion.reactions && Object.keys(discussion.reactions).length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {Object.entries(discussion.reactions).map(([emoji, userIds]) => {
              const hasReacted = userIds.includes(employee?.employeeId || '')
              const reactedUsers = userIds.map(id => employees.find(e => e.employeeId === id)).filter(Boolean)
              
              return (
                <div 
                  key={emoji} 
                  className="relative"
                  onMouseEnter={() => setHoveredReaction(emoji)}
                  onMouseLeave={() => setHoveredReaction(null)}
                >
                  <button
                    onClick={() => discussion.id && toggleDiscussionReaction(discussion.id, emoji)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm transition-all ${
                      hasReacted 
                        ? 'bg-primary-500/20 border border-primary-500/50 text-primary-300' 
                        : 'bg-neutral-800 border border-neutral-700 text-neutral-300 hover:bg-neutral-700'
                    }`}
                  >
                    <span className="text-base">{emoji}</span>
                    <span className="text-xs font-medium">{userIds.length}</span>
                  </button>
                  
                  {/* Hover Popup - Users who reacted */}
                  <AnimatePresence>
                    {hoveredReaction === emoji && reactedUsers.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-full left-0 mb-2 bg-neutral-800 border border-neutral-700 rounded-xl p-2 shadow-xl z-[100] min-w-[180px] max-w-[250px]"
                      >
                        <div className="text-xs text-neutral-400 mb-2 px-1 flex items-center gap-1.5">
                          <span className="text-base">{emoji}</span>
                          <span>Reacted by</span>
                        </div>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                          {reactedUsers.map((user) => (
                            <div key={user!.employeeId} className="flex items-center gap-2 px-1 py-1 rounded hover:bg-neutral-700/50">
                              <img
                                src={user!.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user!.name)}&background=7c3aed&color=fff&size=32`}
                                alt={user!.name}
                                className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs text-white font-medium truncate">{user!.name}</p>
                                <p className="text-[10px] text-neutral-500 truncate capitalize">{user!.role || user!.department || 'Employee'}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        {/* Arrow pointer */}
                        <div className="absolute -bottom-1 left-4 w-2 h-2 bg-neutral-800 border-r border-b border-neutral-700 transform rotate-45"></div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-neutral-700/50">
          {/* Reaction Button with Picker */}
          <div className="relative">
            <button
              onClick={() => setShowReactionPicker(!showReactionPicker)}
              className="flex items-center gap-2 text-sm text-neutral-400 hover:text-amber-400 transition-colors"
            >
              <FaSmile />
              React
            </button>
            
            {/* Emoji Picker */}
            <AnimatePresence>
              {showReactionPicker && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 5 }}
                  className="absolute bottom-full left-0 mb-2 bg-neutral-800 border border-neutral-700 rounded-xl p-2 shadow-xl z-50"
                >
                  <div className="flex gap-1">
                    {['👍', '❤️', '😂', '😮', '😢', '🔥', '👏', '🎉'].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => {
                          if (discussion.id) {
                            toggleDiscussionReaction(discussion.id, emoji)
                          }
                          setShowReactionPicker(false)
                        }}
                        className="text-xl p-1.5 hover:bg-neutral-700 rounded-lg transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => setShowReplyInput(!showReplyInput)}
            className="flex items-center gap-2 text-sm text-neutral-400 hover:text-primary-400 transition-colors"
          >
            <FaReply />
            Reply
          </button>
          
          {discussion.replies?.length > 0 && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
            >
              <FaComments />
              {discussion.replies.length} {discussion.replies.length === 1 ? 'reply' : 'replies'}
            </button>
          )}
        </div>
      </div>

      {/* Reply Input */}
      <AnimatePresence>
        {showReplyInput && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pb-4 border-t border-neutral-700/50"
          >
            <div className="pt-4">
              <MentionInput
                value={replyContent}
                onChange={setReplyContent}
                onSubmit={handleReply}
                placeholder="Write a reply..."
                employees={employees}
                departments={departments}
                loading={submitting}
                buttonText="Reply"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Replies */}
      <AnimatePresence>
        {showReplies && discussion.replies && Array.isArray(discussion.replies) && discussion.replies.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-neutral-700/50 bg-neutral-900/30"
          >
            {discussion.replies.map((reply) => {
              if (!reply) return null
              return (
                <ReplyItem
                  key={reply.id}
                  reply={reply}
                  discussionId={discussion.id!}
                  isAdmin={isAdmin}
                  currentEmployeeId={employee?.employeeId}
                  onDelete={handleDeleteReply}
                  formatTimestamp={formatTimestamp}
                  renderContent={renderContent}
                />
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ============================================
// MAIN DISCUSSIONS COMPONENT
// ============================================

export function Discussions() {
  const { employee, discussions = [], addDiscussion, getAllEmployees } = useEmployeeAuth()
  const [employees, setEmployees] = useState<EmployeeProfile[]>([])
  const [newPostContent, setNewPostContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterMentioned, setFilterMentioned] = useState(false)

  // Fetch employees on mount
  useEffect(() => {
    getAllEmployees()
      .then(data => {
        console.log('🔍 Fetched employees for mentions:', data?.length || 0)
        console.log('🔍 All employees data:', data?.map(e => ({ name: e.name, role: e.role, department: e.department })))
        setEmployees(data || [])
      })
      .catch(err => {
        console.error('Failed to fetch employees:', err)
        setEmployees([])
      })
  }, []) // Remove getAllEmployees from deps to avoid infinite loop

  // Include core departments
  const deptSet = new Set(employees.map(e => e.department).filter(Boolean))
  const coreDepartments = ['Engineering', 'Design', 'Operations', 'HR', 'Marketing']
  coreDepartments.forEach(dept => deptSet.add(dept))
  const departments = Array.from(deptSet).filter(d => d !== 'Admin').sort()

  const handleCreatePost = async (mentions: string[], mentionedDepartments: string[]) => {
    if (!newPostContent.trim()) return
    
    setSubmitting(true)
    try {
      await addDiscussion(newPostContent, mentions, mentionedDepartments)
      setNewPostContent('')
      toast.success('Post created')
    } catch (error) {
      toast.error('Failed to create post')
    } finally {
      setSubmitting(false)
    }
  }

  // Filter discussions
  const filteredDiscussions = useMemo(() => {
    if (!discussions || !Array.isArray(discussions)) return []
    
    let result = [...discussions]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(d => 
        (d.content || '').toLowerCase().includes(query) ||
        (d.authorName || '').toLowerCase().includes(query)
      )
    }

    if (filterMentioned && employee) {
      result = result.filter(d => 
        d.mentions?.includes(employee.employeeId) ||
        d.mentionedDepartments?.includes(employee.department)
      )
    }

    return result
  }, [discussions, searchQuery, filterMentioned, employee])

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <FaComments className="text-primary-500" />
            Discussions
          </h2>
          <p className="text-neutral-400 text-sm sm:text-base mt-1">
            Share updates, ask questions, and collaborate
          </p>
        </div>
      </div>

      {/* Create New Post */}
      <Card padding="md">
        <div className="flex items-start gap-3">
          <Avatar src={employee?.profileImage} name={employee?.name} size="md" showBorder={false} />
          <div className="flex-1">
            <MentionInput
              value={newPostContent}
              onChange={setNewPostContent}
              onSubmit={handleCreatePost}
              placeholder="What's on your mind? Share an update with your team..."
              employees={employees}
              departments={departments}
              loading={submitting}
              buttonText="Post"
            />
          </div>
        </div>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 sm:gap-3">
        <div className="flex-1 min-w-0 sm:min-w-[200px]">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search discussions..."
              className="w-full pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={filterMentioned ? 'primary' : 'secondary'}
            size="sm"
            icon={<FaAt />}
            onClick={() => setFilterMentioned(!filterMentioned)}
            className="flex-1 sm:flex-none"
          >
            Mentioned
          </Button>

          {(searchQuery || filterMentioned) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSearchQuery(''); setFilterMentioned(false) }}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Discussions List */}
      {filteredDiscussions.length === 0 ? (
        <EmptyState
          icon={<FaComments className="text-2xl" />}
          title={searchQuery || filterMentioned ? 'No discussions found' : 'No discussions yet'}
          description={searchQuery || filterMentioned 
            ? 'Try adjusting your search or filters' 
            : 'Be the first to start a discussion!'
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredDiscussions.map((discussion) => (
            <DiscussionPost
              key={discussion.id}
              discussion={discussion}
              onReply={() => {}}
              employees={employees}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default Discussions
