'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
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
  FaTimes
} from 'react-icons/fa'
import { useEmployeeAuth, Discussion, DiscussionReply, EmployeeProfile } from '@/lib/employeePortalContext'
import { Card, Button, Textarea, Badge, Avatar, EmptyState, Spinner, Modal } from './ui'
import { toast } from 'sonner'
import { Timestamp } from 'firebase/firestore'

// ============================================
// MENTION INPUT COMPONENT
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
  const [showMentions, setShowMentions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionType, setMentionType] = useState<'user' | 'department'>('user')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const filteredMentions = useMemo(() => {
    const query = mentionQuery.toLowerCase()
    if (mentionType === 'user') {
      return employees.filter(e => 
        e.name.toLowerCase().includes(query) ||
        e.employeeId.toLowerCase().includes(query)
      ).slice(0, 5)
    } else {
      return departments.filter(d => 
        d.toLowerCase().includes(query)
      ).slice(0, 5)
    }
  }, [mentionQuery, mentionType, employees, departments])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === '@') {
      setShowMentions(true)
      setMentionQuery('')
      setMentionType('user')
    } else if (e.key === '#') {
      setShowMentions(true)
      setMentionQuery('')
      setMentionType('department')
    } else if (e.key === 'Escape') {
      setShowMentions(false)
    } else if (e.key === 'Enter' && !e.shiftKey && !showMentions) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    
    // Check for @mention pattern
    const lastAtIndex = newValue.lastIndexOf('@')
    const lastHashIndex = newValue.lastIndexOf('#')
    
    if (lastAtIndex > lastHashIndex && lastAtIndex >= 0) {
      const afterAt = newValue.slice(lastAtIndex + 1)
      if (!afterAt.includes(' ')) {
        setMentionQuery(afterAt)
        setMentionType('user')
        setShowMentions(true)
      } else {
        setShowMentions(false)
      }
    } else if (lastHashIndex >= 0) {
      const afterHash = newValue.slice(lastHashIndex + 1)
      if (!afterHash.includes(' ')) {
        setMentionQuery(afterHash)
        setMentionType('department')
        setShowMentions(true)
      } else {
        setShowMentions(false)
      }
    }
  }

  const insertMention = (mention: string) => {
    const symbol = mentionType === 'user' ? '@' : '#'
    const lastIndex = value.lastIndexOf(symbol)
    const newValue = value.slice(0, lastIndex) + symbol + mention + ' '
    onChange(newValue)
    setShowMentions(false)
    textareaRef.current?.focus()
  }

  const handleSubmit = () => {
    if (!value.trim()) return
    
    // Extract mentions
    const userMentions = value.match(/@(\w+)/g)?.map(m => m.slice(1)) || []
    const deptMentions = value.match(/#(\w+)/g)?.map(m => m.slice(1)) || []
    
    // Map mention names to employee IDs
    const mentionIds = userMentions.map(name => {
      const emp = employees.find(e => 
        e.name.toLowerCase().replace(/\s/g, '').includes(name.toLowerCase()) ||
        e.employeeId.toLowerCase() === name.toLowerCase()
      )
      return emp?.employeeId
    }).filter(Boolean) as string[]
    
    onSubmit(mentionIds, deptMentions)
  }

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={3}
      />
      
      {/* Mentions Dropdown */}
      <AnimatePresence>
        {showMentions && filteredMentions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute bottom-full left-0 right-0 mb-2 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl overflow-hidden z-10"
          >
            <div className="p-2 border-b border-neutral-700">
              <p className="text-xs text-neutral-400">
                {mentionType === 'user' ? 'Mention a person' : 'Mention a department'}
              </p>
            </div>
            {mentionType === 'user' ? (
              filteredMentions.map((emp) => (
                <button
                  key={(emp as EmployeeProfile).employeeId}
                  onClick={() => insertMention((emp as EmployeeProfile).name.replace(/\s/g, ''))}
                  className="w-full flex items-center gap-3 p-2 hover:bg-neutral-700 transition-colors"
                >
                  <Avatar src={(emp as EmployeeProfile).profileImage} name={(emp as EmployeeProfile).name} size="sm" showBorder={false} />
                  <div className="text-left">
                    <p className="text-sm text-white">{(emp as EmployeeProfile).name}</p>
                    <p className="text-xs text-neutral-500">{(emp as EmployeeProfile).department}</p>
                  </div>
                </button>
              ))
            ) : (
              (filteredMentions as string[]).map((dept) => (
                <button
                  key={dept}
                  onClick={() => insertMention(dept.replace(/\s/g, ''))}
                  className="w-full flex items-center gap-3 p-2 hover:bg-neutral-700 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center">
                    <FaAt className="text-primary-400" />
                  </div>
                  <p className="text-sm text-white">{dept}</p>
                </button>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

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
  const { employee, deleteDiscussion, deleteDiscussionReply, togglePinDiscussion, addDiscussionReply } = useEmployeeAuth()
  const [showReplies, setShowReplies] = useState(false)
  const [showReplyInput, setShowReplyInput] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const isAdmin = employee?.role === 'admin'
  const isAuthor = discussion.authorId === employee?.employeeId
  const canDelete = isAdmin || isAuthor
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
    try {
      await deleteDiscussion(discussion.id!)
      toast.success('Post deleted')
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

  // Highlight mentions in content
  const renderContent = (content: string) => {
    const parts = content.split(/(@\w+|#\w+)/g)
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return <span key={i} className="text-primary-400 font-medium">{part}</span>
      }
      if (part.startsWith('#')) {
        return <span key={i} className="text-amber-400 font-medium">{part}</span>
      }
      return part
    })
  }

  const departments = Array.from(new Set(employees.map(e => e.department).filter(Boolean)))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        rounded-xl border overflow-hidden
        ${discussion.isPinned 
          ? 'bg-amber-500/5 border-amber-500/30' 
          : isMentioned 
            ? 'bg-primary-500/5 border-primary-500/30'
            : 'bg-neutral-800/50 border-neutral-700'
        }
      `}
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Avatar 
            src={discussion.authorImage} 
            name={discussion.authorName} 
            size="md" 
            showBorder={false} 
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-white">{discussion.authorName}</span>
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
        <div className="mt-3 text-neutral-300 whitespace-pre-wrap">
          {renderContent(discussion.content)}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-neutral-700/50">
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
        {showReplies && discussion.replies?.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-neutral-700/50 bg-neutral-900/30"
          >
            {discussion.replies.map((reply) => (
              <div key={reply.id} className="p-4 border-b border-neutral-700/30 last:border-b-0">
                <div className="flex items-start gap-3">
                  <Avatar src={reply.authorImage} name={reply.authorName} size="sm" showBorder={false} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white text-sm">{reply.authorName}</span>
                      <span className="text-xs text-neutral-500">{formatTimestamp(reply.createdAt)}</span>
                    </div>
                    <p className="text-neutral-300 text-sm mt-1">{renderContent(reply.content)}</p>
                  </div>
                  {(reply.authorId === employee?.employeeId || isAdmin) && (
                    <button
                      onClick={() => handleDeleteReply(reply.id)}
                      className="p-1 text-neutral-500 hover:text-red-400 transition-colors"
                    >
                      <FaTrash className="text-xs" />
                    </button>
                  )}
                </div>
              </div>
            ))}
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
  const { employee, discussions, addDiscussion, getAllEmployees } = useEmployeeAuth()
  const [employees, setEmployees] = useState<EmployeeProfile[]>([])
  const [newPostContent, setNewPostContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterMentioned, setFilterMentioned] = useState(false)

  // Fetch employees on mount
  useEffect(() => {
    getAllEmployees().then(setEmployees)
  }, [getAllEmployees])

  const departments = Array.from(new Set(employees.map(e => e.department).filter(Boolean)))

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
    let result = [...discussions]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(d => 
        d.content.toLowerCase().includes(query) ||
        d.authorName.toLowerCase().includes(query)
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FaComments className="text-primary-500" />
            Discussions
          </h2>
          <p className="text-neutral-400 mt-1">
            Share updates, ask questions, and collaborate with your team
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
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search discussions..."
              className="w-full pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        
        <Button
          variant={filterMentioned ? 'primary' : 'secondary'}
          size="sm"
          icon={<FaAt />}
          onClick={() => setFilterMentioned(!filterMentioned)}
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
