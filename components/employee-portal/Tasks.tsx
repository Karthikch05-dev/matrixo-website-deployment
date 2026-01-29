'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FaTasks, 
  FaPlus, 
  FaEdit,
  FaTrash,
  FaComment,
  FaFilter,
  FaFlag,
  FaUser,
  FaUsers,
  FaClock,
  FaCheckCircle,
  FaSpinner as FaSpinnerIcon,
  FaEye,
  FaPaperPlane,
  FaExclamationCircle,
  FaArrowUp,
  FaArrowDown,
  FaSearch,
  FaSmile
} from 'react-icons/fa'
import { useEmployeeAuth, Task, TaskComment, EmployeeProfile } from '@/lib/employeePortalContext'
import { Card, Button, Input, Textarea, Select, Modal, Badge, Avatar, EmptyState, Spinner, ProfileInfo, employeeToProfileData } from './ui'
import { RichTextRenderer } from './RichTextEditor'
import { toast } from 'sonner'
import { Timestamp } from 'firebase/firestore'

// Dynamic import of RichTextEditor to prevent SSR issues with TipTap
const RichTextEditor = dynamic(() => import('./RichTextEditor'), {
  ssr: false,
  loading: () => (
    <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-4 animate-pulse" style={{ minHeight: '150px' }}>
      <div className="h-4 bg-neutral-700 rounded w-3/4 mb-2" />
      <div className="h-4 bg-neutral-700 rounded w-1/2" />
    </div>
  )
})

// ============================================
// MENTION INPUT COMPONENT (FOR TASK COMMENTS)
// ============================================

function MentionInput({
  value,
  onChange,
  onSubmit,
  placeholder,
  employees,
  departments,
  loading,
  buttonText = 'Send'
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
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const suggestions = useMemo(() => {
    const query = searchQuery.toLowerCase()
    if (dropdownType === 'user') {
      return employees.filter(e => 
        e.name.toLowerCase().includes(query) ||
        e.employeeId.toLowerCase().includes(query)
      ).slice(0, 5)
    } else {
      return departments.filter(d => 
        d.toLowerCase().includes(query)
      ).slice(0, 5)
    }
  }, [searchQuery, dropdownType, employees, departments])

  const updateDropdownPosition = () => {
    if (!textareaRef.current) return
    const rect = textareaRef.current.getBoundingClientRect()
    setDropdownPos({
      top: rect.bottom + 4,
      left: rect.left
    })
  }

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
      return
    }
    
    setShowDropdown(false)
    setTriggerIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      setShowDropdown(false)
    } else if (e.key === 'Enter' && !e.shiftKey && !showDropdown) {
      e.preventDefault()
      handleSubmit()
    }
  }

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

  const dropdownContent = showDropdown && suggestions.length > 0 && mounted ? (
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top: `${dropdownPos.top}px`,
        left: `${dropdownPos.left}px`,
        zIndex: 9999,
        maxHeight: '200px',
        overflowY: 'auto'
      }}
      className="bg-neutral-800 border border-neutral-700 rounded-lg shadow-2xl w-72"
    >
      {dropdownType === 'user' ? (
        (suggestions as EmployeeProfile[]).map((emp) => (
          <button
            key={emp.employeeId}
            onClick={() => selectMention(emp.name)}
            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-neutral-700 transition-colors text-left"
          >
            <Avatar src={emp.profileImage} name={emp.name} size="sm" showBorder={false} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate">{emp.name}</p>
              <p className="text-xs text-neutral-500 truncate">{emp.employeeId}</p>
            </div>
          </button>
        ))
      ) : (
        (suggestions as string[]).map((dept) => (
          <button
            key={dept}
            onClick={() => selectMention(dept)}
            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-neutral-700 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-amber-400 text-sm">#</span>
            </div>
            <div>
              <p className="text-sm text-white font-medium">{dept}</p>
              <p className="text-xs text-neutral-500">Department</p>
            </div>
          </button>
        ))
      )}
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
        rows={2}
        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-y text-sm"
      />
      
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
// PRIORITY CONFIGURATION
// ============================================

const priorityConfig = {
  low: { label: 'Low', color: 'bg-neutral-500', textColor: 'text-neutral-400', icon: FaArrowDown },
  medium: { label: 'Medium', color: 'bg-blue-500', textColor: 'text-blue-400', icon: FaFlag },
  high: { label: 'High', color: 'bg-amber-500', textColor: 'text-amber-400', icon: FaArrowUp },
  urgent: { label: 'Urgent', color: 'bg-red-500', textColor: 'text-red-400', icon: FaExclamationCircle }
}

const statusConfig = {
  'todo': { label: 'To Do', color: 'bg-neutral-600' },
  'in-progress': { label: 'In Progress', color: 'bg-blue-500' },
  'review': { label: 'In Review', color: 'bg-amber-500' },
  'completed': { label: 'Completed', color: 'bg-emerald-600 text-white' }
}

// ============================================
// INTERN SPECIALIZATIONS
// ============================================

const INTERN_SPECIALIZATIONS = [
  'Web Development',
  'Content and Curriculum Development',
  'Product Research & Innovation',
  'Operations & Project Management',
  'Marketing & Brand Strategy'
]

// ============================================
// CREATE/EDIT TASK MODAL
// ============================================

function TaskModal({
  isOpen,
  onClose,
  editingTask,
  employees
}: {
  isOpen: boolean
  onClose: () => void
  editingTask?: Task | null
  employees: EmployeeProfile[]
}) {
  const { employee, addTask, updateTask } = useEmployeeAuth()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: editingTask?.title || '',
    description: editingTask?.description || '',
    priority: editingTask?.priority || 'medium',
    status: editingTask?.status || 'todo',
    assignedTo: editingTask?.assignedTo || [],
    dueDate: editingTask?.dueDate || '',
    department: editingTask?.department || employee?.department || '',
    specialization: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      toast.error('Please enter a task title')
      return
    }

    // Validate assignees belong to selected department (if department is selected)
    if (form.department && form.assignedTo.length > 0) {
      const validAssignees = form.assignedTo.filter(id => {
        const emp = employees.find(e => e.employeeId === id)
        return emp && emp.department === form.department
      })
      if (validAssignees.length !== form.assignedTo.length) {
        toast.error('Some assignees do not belong to the selected department')
        return
      }
    }

    setLoading(true)
    try {
      const assignedToNames = form.assignedTo.map(id => 
        employees.find(e => e.employeeId === id)?.name || id
      )

      // Build base task payload - NEVER include undefined values for Firestore
      // Note: description is stored as HTML to preserve rich text formatting
      const basePayload = {
        title: form.title.trim(),
        description: form.description, // Stored as HTML - DO NOT TRIM
        priority: form.priority as Task['priority'],
        status: form.status as Task['status'],
        assignedTo: form.assignedTo,
        assignedToNames,
        department: form.department || ''
      }

      // Conditionally add optional fields ONLY if they have valid values
      const taskPayload: any = { ...basePayload }
      
      // Only include dueDate if it has a value
      if (form.dueDate) {
        taskPayload.dueDate = form.dueDate
      }
      
      // Only include specialization for Intern department AND if it has a value
      if (form.department === 'Intern' && form.specialization) {
        taskPayload.specialization = form.specialization
      }

      if (editingTask?.id) {
        await updateTask(editingTask.id, taskPayload)
        toast.success('Task updated successfully')
      } else {
        await addTask(taskPayload)
        toast.success('Task created successfully')
      }
      onClose()
    } catch (error: any) {
      console.error('Task save error:', error)
      toast.error(error?.message || 'Failed to save task')
    } finally {
      setLoading(false)
    }
  }

  const toggleAssignee = (employeeId: string) => {
    setForm(prev => ({
      ...prev,
      assignedTo: prev.assignedTo.includes(employeeId)
        ? prev.assignedTo.filter(id => id !== employeeId)
        : [...prev.assignedTo, employeeId]
    }))
  }

  // Handle department change - clear assignees when department changes
  const handleDepartmentChange = (value: string) => {
    setForm(prev => ({
      ...prev,
      department: value,
      specialization: value === 'Intern' ? prev.specialization : '',
      // Clear assignees when department changes (unless "All Departments" selected)
      assignedTo: value ? [] : prev.assignedTo
    }))
  }

  // Get unique departments (excluding Admin)
  // Also add 'Intern' if there are any employees with role 'Intern'
  const departments = useMemo(() => {
    const deptSet = new Set(employees.map(e => e.department).filter(Boolean))
    // Check if there are any interns by role
    const hasInterns = employees.some(e => e.role === 'Intern')
    if (hasInterns) {
      deptSet.add('Intern')
    }
    return Array.from(deptSet).filter(d => d !== 'Admin').sort()
  }, [employees])
  
  // Filter employees by selected department and specialization (for Interns)
  const filteredEmployees = useMemo(() => {
    let result = employees
    
    // Filter by department if selected
    if (form.department) {
      if (form.department === 'Intern') {
        // For Intern department, filter by role = 'Intern'
        result = result.filter(emp => emp.role === 'Intern')
        
        // If specialization is selected, further filter by designation (contains match)
        if (form.specialization) {
          result = result.filter(emp => 
            emp.designation?.toLowerCase().includes(form.specialization.toLowerCase()) ||
            emp.designation?.toLowerCase() === form.specialization.toLowerCase()
          )
        }
      } else {
        // For other departments, filter by department
        result = result.filter(emp => emp.department === form.department)
      }
    }
    
    return result
  }, [employees, form.department, form.specialization])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingTask ? 'Edit Task' : 'Create New Task'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Task Title"
          placeholder="Enter task title..."
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />

        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            Description
          </label>
          <RichTextEditor
            content={form.description}
            onChange={(html) => setForm({ ...form, description: html })}
            placeholder="Describe the task in detail... Use the toolbar for formatting."
            editable={true}
            minHeight="120px"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Priority"
            options={[
              { value: 'low', label: '🔵 Low' },
              { value: 'medium', label: '🟡 Medium' },
              { value: 'high', label: '🟠 High' },
              { value: 'urgent', label: '🔴 Urgent' }
            ]}
            value={form.priority}
            onChange={(value) => setForm({ ...form, priority: value as 'low' | 'medium' | 'high' | 'urgent' })}
          />

          <Select
            label="Status"
            options={[
              { value: 'todo', label: 'To Do' },
              { value: 'in-progress', label: 'In Progress' },
              { value: 'review', label: 'In Review' },
              { value: 'completed', label: 'Completed' }
            ]}
            value={form.status}
            onChange={(value) => setForm({ ...form, status: value as 'todo' | 'in-progress' | 'review' | 'completed' })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Due Date"
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          />

          <Select
            label="Department"
            options={[
              { value: '', label: 'All Departments' },
              ...departments.map(d => ({ value: d, label: d }))
            ]}
            value={form.department}
            onChange={handleDepartmentChange}
          />
        </div>

        {/* Conditional Intern Specialization Dropdown */}
        <AnimatePresence>
          {form.department === 'Intern' && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 0 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{ overflow: 'visible' }}
            >
              <Select
                label="Intern Specialization"
                options={[
                  { value: '', label: 'Select Specialization' },
                  ...INTERN_SPECIALIZATIONS.map(spec => ({ value: spec, label: spec }))
                ]}
                value={form.specialization}
                onChange={(value) => setForm({ ...form, specialization: value, assignedTo: [] })}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Assignees */}
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            Assign To {form.department && <span className="text-neutral-500">({form.department})</span>}
          </label>
          <div className="max-h-40 overflow-y-auto bg-neutral-800 rounded-lg p-2 space-y-1">
            {filteredEmployees.length === 0 ? (
              <p className="text-sm text-neutral-500 p-2 text-center">
                {form.department ? `No employees in ${form.department}` : 'No employees found'}
              </p>
            ) : (
              filteredEmployees.map(emp => (
                <button
                  key={emp.employeeId}
                  type="button"
                  onClick={() => toggleAssignee(emp.employeeId)}
                  className={`
                    w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left
                    ${form.assignedTo.includes(emp.employeeId) 
                      ? 'bg-primary-500/20 border border-primary-500/50' 
                      : 'hover:bg-neutral-700'
                    }
                  `}
                >
                  <Avatar src={emp.profileImage} name={emp.name} size="sm" showBorder={false} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{emp.name}</p>
                    <p className="text-xs text-neutral-500">{emp.department}</p>
                  </div>
                  {form.assignedTo.includes(emp.employeeId) && (
                    <FaCheckCircle className="text-primary-500" />
                  )}
                </button>
              ))
            )}
          </div>
          {form.assignedTo.length > 0 && (
            <p className="text-xs text-neutral-500 mt-2">
              {form.assignedTo.length} member(s) selected
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>
            {editingTask ? 'Update Task' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ============================================
// TASK DETAIL MODAL
// ============================================

function TaskDetailModal({
  isOpen,
  onClose,
  task,
  onEditClick,
  employees
}: {
  isOpen: boolean
  onClose: () => void
  task: Task | null
  onEditClick?: () => void
  employees: EmployeeProfile[]
}) {
  const { employee, updateTask, deleteTask, addTaskComment, deleteTaskComment, toggleTaskCommentReaction } = useEmployeeAuth()
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null)
  const [hoveredReaction, setHoveredReaction] = useState<string | null>(null)

  if (!task) return null

  const isAdmin = employee?.role === 'admin'
  const isOwner = task.createdBy === employee?.employeeId
  const isAssignee = task.assignedTo?.includes(employee?.employeeId || '')
  const canEdit = isAdmin
  const canDelete = isAdmin || isOwner
  const departments = Array.from(new Set(employees.map(e => e.department).filter(Boolean)))

  const handleStatusChange = async (newStatus: Task['status']) => {
    try {
      await updateTask(task.id!, { status: newStatus })
      toast.success('Status updated')
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const handleAddComment = async (mentions: string[], mentionedDepartments: string[]) => {
    if (!newComment.trim()) return
    
    setSubmitting(true)
    try {
      await addTaskComment(task.id!, newComment, mentions, mentionedDepartments)
      setNewComment('')
      toast.success('Comment added')
    } catch (error) {
      toast.error('Failed to add comment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return
    
    try {
      await deleteTaskComment(task.id!, commentId)
      toast.success('Comment deleted')
    } catch (error) {
      toast.error('Failed to delete comment')
    }
  }

  const handleDeleteTask = async () => {
    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) return
    
    setDeleting(true)
    try {
      await deleteTask(task.id!)
      toast.success('Task deleted')
      onClose()
    } catch (error) {
      toast.error('Failed to delete task')
    } finally {
      setDeleting(false)
    }
  }

  const formatTimestamp = (timestamp: Timestamp) => {
    if (!timestamp?.toDate) return ''
    return timestamp.toDate().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  // Render comment text with mentions highlighted
  const renderCommentContent = (text: string) => {
    const parts = text.split(/(@\w+|#\w+)/)
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        const mentionName = part.slice(1)
        const emp = employees.find(e => 
          e.name.toLowerCase().replace(/\s/g, '') === mentionName.toLowerCase() ||
          e.employeeId.toLowerCase() === mentionName.toLowerCase()
        )
        if (emp) {
          const displayName = emp.name
          return (
            <ProfileInfo
              key={i}
              data={employeeToProfileData(emp)}
              isAdmin={false}
            >
              <span className="text-primary-400 font-medium cursor-pointer hover:underline">{displayName}</span>
            </ProfileInfo>
          )
        }
        return <span key={i} className="text-primary-400 font-medium">{part.slice(1)}</span>
      }
      if (part.startsWith('#')) {
        return <span key={i} className="text-amber-400 font-medium">{part}</span>
      }
      return part
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="lg">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={
                  task.priority === 'urgent' ? 'error' :
                  task.priority === 'high' ? 'warning' :
                  task.priority === 'medium' ? 'info' : 'default'
                }>
                  {(priorityConfig[task.priority] || priorityConfig.medium).label}
                </Badge>
                <Badge>
                  {(statusConfig[task.status] || statusConfig.todo).label}
                </Badge>
                {task.department === 'Management' && (
                  <Badge variant="primary">Management</Badge>
                )}
              </div>
              <h2 className="text-xl font-bold text-white">{task.title}</h2>
            </div>
            
            {canDelete && (
              <Button
                variant="danger"
                size="sm"
                icon={<FaTrash />}
                loading={deleting}
                onClick={handleDeleteTask}
              >
                Delete
              </Button>
            )}
            {canEdit && onEditClick && (
              <Button
                variant="secondary"
                size="sm"
                icon={<FaEdit />}
                onClick={() => {
                  onClose()
                  onEditClick()
                }}
              >
                Edit
              </Button>
            )}
          </div>
          
          {task.description && (
            <div className="mt-3">
              <RichTextRenderer content={task.description} />
            </div>
          )}
        </div>

        {/* Meta Info */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-neutral-800/50 rounded-lg">
          <div>
            <p className="text-xs text-neutral-500 mb-1">Created by</p>
            <p className="text-sm text-white">{task.createdByName}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500 mb-1">Created</p>
            <p className="text-sm text-white">{formatTimestamp(task.createdAt)}</p>
          </div>
          {task.dueDate && (
            <div>
              <p className="text-xs text-neutral-500 mb-1">Due Date</p>
              <p className={`text-sm ${new Date(task.dueDate) < new Date() && task.status !== 'completed' ? 'text-red-400' : 'text-white'}`}>
                {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          )}
          {task.assignedToNames?.length > 0 && (
            <div>
              <p className="text-xs text-neutral-500 mb-1">Assigned to</p>
              <p className="text-sm text-white">{task.assignedToNames.join(', ')}</p>
            </div>
          )}
        </div>

        {/* Status Actions */}
        {(canEdit || isAssignee) && (
          <div>
            <p className="text-sm text-neutral-400 mb-2">Update Status</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(statusConfig).map(([status, config]) => (
                <Button
                  key={status}
                  variant={task.status === status ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => handleStatusChange(status as Task['status'])}
                >
                  {config.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Comments */}
        <div>
          <h3 className="text-sm font-medium text-neutral-300 mb-3 flex items-center gap-2">
            <FaComment />
            Comments ({task.comments?.length || 0})
          </h3>
          
          <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
            {task.comments?.length === 0 && (
              <p className="text-neutral-500 text-sm text-center py-4">No comments yet</p>
            )}
            {task.comments?.map((comment) => (
              <div key={comment.id} className="p-3 bg-neutral-800/50 rounded-lg">
                <div className="flex gap-3">
                  <ProfileInfo
                    data={{
                      employeeId: comment.authorId,
                      name: comment.authorName,
                      profileImage: comment.authorImage,
                      role: 'employee',
                      status: 'Active'
                    }}
                    isAdmin={false}
                  >
                    <Avatar src={comment.authorImage} name={comment.authorName} size="sm" showBorder={false} />
                  </ProfileInfo>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <ProfileInfo
                        data={{
                          employeeId: comment.authorId,
                          name: comment.authorName,
                          profileImage: comment.authorImage,
                          role: 'employee',
                          status: 'Active'
                        }}
                        isAdmin={false}
                      >
                        <p className="text-sm font-medium text-white hover:text-primary-400 cursor-pointer">{comment.authorName}</p>
                      </ProfileInfo>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-500">
                          {formatTimestamp(comment.createdAt)}
                        </span>
                        {(comment.authorId === employee?.employeeId || isAdmin) && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-neutral-500 hover:text-red-400 transition-colors"
                          >
                            <FaTrash className="text-xs" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="text-neutral-300 text-sm mt-1">
                      {renderCommentContent(comment.text)}
                    </div>

                    {/* Reactions Display */}
                    {comment.reactions && Object.keys(comment.reactions).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {Object.entries(comment.reactions).map(([emoji, userIds]) => {
                          const hasReacted = userIds.includes(employee?.employeeId || '')
                          const reactedUsers = userIds.map(id => employees.find(e => e.employeeId === id)).filter(Boolean)
                          
                          return (
                            <div 
                              key={emoji} 
                              className="relative"
                              onMouseEnter={() => setHoveredReaction(`${comment.id}_${emoji}`)}
                              onMouseLeave={() => setHoveredReaction(null)}
                            >
                              <button
                                onClick={() => task.id && toggleTaskCommentReaction(task.id, comment.id, emoji)}
                                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all ${
                                  hasReacted 
                                    ? 'bg-primary-500/20 border border-primary-500/50 text-primary-300' 
                                    : 'bg-neutral-800 border border-neutral-700 text-neutral-300 hover:bg-neutral-700'
                                }`}
                              >
                                <span className="text-sm">{emoji}</span>
                                <span className="text-xs font-medium">{userIds.length}</span>
                              </button>
                              
                              {/* Hover Popup */}
                              <AnimatePresence>
                                {hoveredReaction === `${comment.id}_${emoji}` && reactedUsers.length > 0 && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 5 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute bottom-full left-0 mb-2 bg-neutral-800 border border-neutral-700 rounded-xl p-2 shadow-xl z-[100] min-w-[160px] max-w-[220px]"
                                  >
                                    <div className="text-xs text-neutral-400 mb-1.5 px-1 flex items-center gap-1.5">
                                      <span className="text-sm">{emoji}</span>
                                      <span>Reacted by</span>
                                    </div>
                                    <div className="space-y-1 max-h-32 overflow-y-auto">
                                      {reactedUsers.map((user) => (
                                        <div key={user!.employeeId} className="flex items-center gap-2 px-1 py-0.5 rounded hover:bg-neutral-700/50">
                                          <img
                                            src={user!.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user!.name)}&background=7c3aed&color=fff&size=24`}
                                            alt={user!.name}
                                            className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                                          />
                                          <p className="text-xs text-white font-medium truncate">{user!.name}</p>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="absolute -bottom-1 left-3 w-2 h-2 bg-neutral-800 border-r border-b border-neutral-700 transform rotate-45"></div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Reaction Button */}
                    <div className="relative mt-2">
                      <button
                        onClick={() => setShowReactionPicker(showReactionPicker === comment.id ? null : comment.id)}
                        className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-amber-400 transition-colors"
                      >
                        <FaSmile className="text-xs" />
                        React
                      </button>
                      
                      {/* Emoji Picker */}
                      <AnimatePresence>
                        {showReactionPicker === comment.id && (
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
                                    if (task.id) {
                                      toggleTaskCommentReaction(task.id, comment.id, emoji)
                                    }
                                    setShowReactionPicker(null)
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
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Comment */}
          <MentionInput
            value={newComment}
            onChange={setNewComment}
            onSubmit={handleAddComment}
            placeholder="Add a comment... Use @ to mention people"
            employees={employees}
            departments={departments}
            loading={submitting}
            buttonText="Send"
          />
        </div>
      </div>
    </Modal>
  )
}

// ============================================
// TASK CARD COMPONENT
// ============================================

function TaskCard({ 
  task, 
  onClick,
  isHighlighted
}: { 
  task: Task
  onClick: () => void
  isHighlighted: boolean
}) {
  // Defensive checks for task data
  if (!task) return null
  
  const priority = task.priority || 'medium'
  const config = priorityConfig[priority] || priorityConfig.medium
  const PriorityIcon = config?.icon || FaFlag

  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={`
        p-4 rounded-xl border cursor-pointer transition-all
        ${isHighlighted 
          ? 'bg-primary-500/10 border-primary-500/50 ring-2 ring-primary-500/30' 
          : 'bg-neutral-800/50 border-neutral-700 hover:border-neutral-600'
        }
        ${task.department === 'Management' ? 'border-l-4 border-l-amber-500' : ''}
      `}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-medium text-white line-clamp-2">{task.title || 'Untitled Task'}</h3>
        <Badge 
          variant={
            task.priority === 'urgent' ? 'error' :
            task.priority === 'high' ? 'warning' :
            task.priority === 'medium' ? 'info' : 'default'
          }
          size="sm"
        >
          <PriorityIcon className="mr-1" />
          {config.label}
        </Badge>
      </div>

      {task.description && (
        <div className="text-neutral-400 text-sm line-clamp-2 mb-3 prose prose-invert prose-sm max-w-none prose-p:my-0 prose-ul:my-0 prose-ol:my-0 prose-li:my-0">
          <RichTextRenderer content={task.description} className="line-clamp-2" />
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge size="sm" className={(statusConfig[task.status || 'todo'] || statusConfig.todo).color}>
            {(statusConfig[task.status || 'todo'] || statusConfig.todo).label}
          </Badge>
          {task.department === 'Management' && (
            <Badge size="sm" variant="warning">Mgmt</Badge>
          )}
        </div>
        
        <div className="flex items-center gap-3 text-neutral-500 text-sm">
          {task.dueDate && (
            <span className={`flex items-center gap-1 ${
              new Date(task.dueDate) < new Date() && task.status !== 'completed' 
                ? 'text-red-400' : ''
            }`}>
              <FaClock className="text-xs" />
              {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
          {task.comments?.length > 0 && (
            <span className="flex items-center gap-1">
              <FaComment className="text-xs" />
              {task.comments.length}
            </span>
          )}
          {task.assignedTo?.length > 0 && (
            <span className="flex items-center gap-1">
              <FaUsers className="text-xs" />
              {task.assignedTo.length}
            </span>
          )}
        </div>
      </div>

      {/* Assignees */}
      {task.assignedToNames?.length > 0 && (
        <div className="mt-3 pt-3 border-t border-neutral-700/50">
          <p className="text-xs text-neutral-500 mb-1">Assigned to</p>
          <p className="text-sm text-neutral-300 truncate">
            {task.assignedToNames.slice(0, 3).join(', ')}
            {task.assignedToNames.length > 3 && ` +${task.assignedToNames.length - 3} more`}
          </p>
        </div>
      )}
    </motion.div>
  )
}

// ============================================
// MAIN TASKS COMPONENT
// ============================================

interface TasksProps {
  selectedTaskId?: string | null
  onTaskOpened?: () => void
  showOnlyMyTasks?: boolean
}

export function Tasks({ selectedTaskId, onTaskOpened, showOnlyMyTasks = false }: TasksProps = {}) {
  const { employee, tasks = [], getAllEmployees } = useEmployeeAuth()
  const [employees, setEmployees] = useState<EmployeeProfile[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Filters
  const [filterPriority, setFilterPriority] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterAssignee, setFilterAssignee] = useState<string>('')
  const [filterRole, setFilterRole] = useState<string>('')
  const [filterInternSpecialization, setFilterInternSpecialization] = useState<string>('')
  const [showMyTasks, setShowMyTasks] = useState(showOnlyMyTasks)

  // Fetch employees on mount
  useEffect(() => {
    getAllEmployees().then(setEmployees).catch(console.error)
  }, [getAllEmployees])

  // Auto-select task if selectedTaskId is provided (from Dashboard pending tasks)
  useEffect(() => {
    if (selectedTaskId && tasks.length > 0) {
      const taskToOpen = tasks.find(t => t.id === selectedTaskId)
      if (taskToOpen) {
        setSelectedTask(taskToOpen)
        onTaskOpened?.()
      }
    }
  }, [selectedTaskId, tasks, onTaskOpened])

  // Keep selectedTask in sync with tasks array (for real-time updates like comments)
  useEffect(() => {
    if (selectedTask?.id && tasks.length > 0) {
      const updatedTask = tasks.find(t => t.id === selectedTask.id)
      if (updatedTask) {
        setSelectedTask(updatedTask)
      }
    }
  }, [tasks, selectedTask?.id])

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    if (!tasks || !Array.isArray(tasks)) return []
    
    let result = [...tasks]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(task => 
        task?.title?.toLowerCase()?.includes(query) ||
        task?.description?.toLowerCase()?.includes(query) ||
        task?.assignedToNames?.some(name => name?.toLowerCase()?.includes(query))
      )
    }

    // Priority filter
    if (filterPriority) {
      result = result.filter(task => task?.priority === filterPriority)
    }

    // Status filter
    if (filterStatus) {
      result = result.filter(task => task?.status === filterStatus)
    }

    // Assignee filter
    if (filterAssignee) {
      result = result.filter(task => {
        const assignedTo = task?.assignedTo
        if (Array.isArray(assignedTo)) return assignedTo.includes(filterAssignee)
        return assignedTo === filterAssignee
      })
    }

    // Role filter
    if (filterRole) {
      result = result.filter(task => {
        const assignedTo = task?.assignedTo || []
        return assignedTo.some(empId => {
          const emp = employees.find(e => e.employeeId === empId)
          return emp?.role === filterRole
        })
      })
    }

    // Intern Specialization filter (filters by task specialization field)
    if (filterInternSpecialization) {
      result = result.filter(task => {
        // Check if task has specialization field and it matches the filter
        return task?.specialization === filterInternSpecialization
      })
    }

    // My tasks filter
    if (showMyTasks && employee) {
      result = result.filter(task => {
        const assignedTo = task?.assignedTo
        if (Array.isArray(assignedTo)) {
          return assignedTo.includes(employee.employeeId) || task.createdBy === employee.employeeId
        }
        return assignedTo === employee.employeeId || task.createdBy === employee.employeeId
      })
    }

    // Hide completed tasks by default (unless explicitly selected in status filter)
    if (filterStatus !== 'completed') {
      result = result.filter(task => task?.status !== 'completed')
    }

    return result
  }, [tasks, searchQuery, filterPriority, filterStatus, filterAssignee, filterRole, showMyTasks, employee, employees])

  const clearFilters = () => {
    setSearchQuery('')
    setFilterPriority('')
    setFilterStatus('')
    setFilterAssignee('')
    setFilterRole('')
    setFilterInternSpecialization('')
    setShowMyTasks(false)
  }

  const hasActiveFilters = searchQuery || filterPriority || filterStatus || filterAssignee || filterRole || filterInternSpecialization || showMyTasks

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FaTasks className="text-primary-500" />
            Tasks
          </h2>
          <p className="text-neutral-400 mt-1">
            {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
            {hasActiveFilters && ' (filtered)'}
          </p>
        </div>
        
        <Button icon={<FaPlus />} onClick={() => setShowCreateModal(true)}>
          Create Task
        </Button>
      </div>

      {/* Search & Filters */}
      <Card padding="md">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<FaSearch />}
            />
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <Select
              options={[
                { value: '', label: 'All Priorities' },
                { value: 'urgent', label: '🔴 Urgent' },
                { value: 'high', label: '🟠 High' },
                { value: 'medium', label: '🟡 Medium' },
                { value: 'low', label: '🔵 Low' }
              ]}
              value={filterPriority}
              onChange={setFilterPriority}
            />

            <Select
              options={[
                { value: '', label: 'All Status' },
                { value: 'todo', label: 'To Do' },
                { value: 'in-progress', label: 'In Progress' },
                { value: 'review', label: 'In Review' },
                { value: 'completed', label: 'Completed' }
              ]}
              value={filterStatus}
              onChange={setFilterStatus}
            />

            <Select
              placeholder="Filter by Role"
              options={[
                { value: '', label: 'All Roles' },
                { value: 'Intern', label: 'Intern' },
                { value: 'employee', label: 'Employee' },
                { value: 'admin', label: 'Admin' }
              ]}
              value={filterRole}
              onChange={(value) => {
                setFilterRole(value)
                if (value !== 'Intern') {
                  setFilterInternSpecialization('')
                }
              }}
            />

            <Button
              variant={showMyTasks ? 'primary' : 'secondary'}
              size="sm"
              icon={<FaUser />}
              onClick={() => setShowMyTasks(!showMyTasks)}
            >
              My Tasks
            </Button>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Conditional Intern Specialization Dropdown */}
        <AnimatePresence>
          {filterRole === 'Intern' && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{ overflow: 'visible' }}
            >
              <Select
                label="Intern Specialization"
                options={[
                  { value: '', label: 'All Specializations' },
                  ...INTERN_SPECIALIZATIONS.map(spec => ({ value: spec, label: spec }))
                ]}
                value={filterInternSpecialization}
                onChange={setFilterInternSpecialization}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Tasks Grid */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={<FaTasks className="text-2xl" />}
          title={hasActiveFilters ? 'No tasks match your filters' : 'No tasks yet'}
          description={hasActiveFilters 
            ? 'Try adjusting your filters or search query' 
            : 'Create your first task to get started'
          }
          action={
            hasActiveFilters ? (
              <Button variant="secondary" onClick={clearFilters}>Clear Filters</Button>
            ) : (
              <Button icon={<FaPlus />} onClick={() => setShowCreateModal(true)}>Create Task</Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => setSelectedTask(task)}
              isHighlighted={task.assignedTo?.includes(employee?.employeeId || '')}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <TaskModal
        isOpen={showCreateModal || !!editingTask}
        onClose={() => {
          setShowCreateModal(false)
          setEditingTask(null)
        }}
        editingTask={editingTask}
        employees={employees}
      />

      <TaskDetailModal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
        onEditClick={() => {
          if (selectedTask) {
            setEditingTask(selectedTask)
          }
        }}
        employees={employees}
      />
    </div>
  )
}

export default Tasks
