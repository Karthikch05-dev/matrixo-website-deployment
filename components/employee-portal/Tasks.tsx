'use client'

import { useState, useMemo, useEffect } from 'react'
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
  FaSearch
} from 'react-icons/fa'
import { useEmployeeAuth, Task, TaskComment, EmployeeProfile } from '@/lib/employeePortalContext'
import { Card, Button, Input, Textarea, Select, Modal, Badge, Avatar, EmptyState, Spinner } from './ui'
import { toast } from 'sonner'
import { Timestamp } from 'firebase/firestore'

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
  'completed': { label: 'Completed', color: 'bg-emerald-500' }
}

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
    department: editingTask?.department || employee?.department || ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      toast.error('Please enter a task title')
      return
    }

    setLoading(true)
    try {
      const assignedToNames = form.assignedTo.map(id => 
        employees.find(e => e.employeeId === id)?.name || id
      )

      if (editingTask?.id) {
        await updateTask(editingTask.id, {
          title: form.title,
          description: form.description,
          priority: form.priority as Task['priority'],
          status: form.status as Task['status'],
          assignedTo: form.assignedTo,
          assignedToNames,
          dueDate: form.dueDate || undefined,
          department: form.department
        })
        toast.success('Task updated successfully')
      } else {
        await addTask({
          title: form.title,
          description: form.description,
          priority: form.priority as Task['priority'],
          status: form.status as Task['status'],
          assignedTo: form.assignedTo,
          assignedToNames,
          dueDate: form.dueDate || undefined,
          department: form.department
        })
        toast.success('Task created successfully')
      }
      onClose()
    } catch (error) {
      toast.error('Failed to save task')
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

  // Get unique departments
  const departments = Array.from(new Set(employees.map(e => e.department).filter(Boolean)))

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

        <Textarea
          label="Description"
          placeholder="Describe the task in detail..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
        />

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
            onChange={(value) => setForm({ ...form, department: value })}
          />
        </div>

        {/* Assignees */}
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            Assign To
          </label>
          <div className="max-h-40 overflow-y-auto bg-neutral-800 rounded-lg p-2 space-y-1">
            {employees.map(emp => (
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
            ))}
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
  task
}: {
  isOpen: boolean
  onClose: () => void
  task: Task | null
}) {
  const { employee, updateTask, deleteTask, addTaskComment, deleteTaskComment } = useEmployeeAuth()
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  if (!task) return null

  const isAdmin = employee?.role === 'admin'
  const isOwner = task.createdBy === employee?.employeeId
  const isAssignee = task.assignedTo?.includes(employee?.employeeId || '')
  const canEdit = isAdmin || isOwner
  const canDelete = isAdmin || isOwner

  const handleStatusChange = async (newStatus: Task['status']) => {
    try {
      await updateTask(task.id!, { status: newStatus })
      toast.success('Status updated')
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return
    
    setSubmitting(true)
    try {
      await addTaskComment(task.id!, newComment)
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
                  {priorityConfig[task.priority].label}
                </Badge>
                <Badge>
                  {statusConfig[task.status].label}
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
          </div>
          
          {task.description && (
            <p className="text-neutral-400 mt-3">{task.description}</p>
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
          
          <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
            {task.comments?.length === 0 && (
              <p className="text-neutral-500 text-sm text-center py-4">No comments yet</p>
            )}
            {task.comments?.map((comment) => (
              <div key={comment.id} className="flex gap-3 p-3 bg-neutral-800/50 rounded-lg">
                <Avatar src={comment.authorImage} name={comment.authorName} size="sm" showBorder={false} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-white">{comment.authorName}</p>
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
                  <p className="text-neutral-300 text-sm mt-1">{comment.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Add Comment */}
          <div className="flex gap-2">
            <Input
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleAddComment}
              loading={submitting}
              disabled={!newComment.trim()}
              icon={<FaPaperPlane />}
            >
              Send
            </Button>
          </div>
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
  const config = priorityConfig[task.priority]
  const PriorityIcon = config.icon

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
        <h3 className="font-medium text-white line-clamp-2">{task.title}</h3>
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
        <p className="text-neutral-400 text-sm line-clamp-2 mb-3">{task.description}</p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge size="sm" className={statusConfig[task.status].color}>
            {statusConfig[task.status].label}
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

export function Tasks() {
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
  const [showMyTasks, setShowMyTasks] = useState(false)

  // Fetch employees on mount
  useEffect(() => {
    getAllEmployees().then(setEmployees).catch(console.error)
  }, [getAllEmployees])

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

    return result
  }, [tasks, searchQuery, filterPriority, filterStatus, filterAssignee, showMyTasks, employee])

  const clearFilters = () => {
    setSearchQuery('')
    setFilterPriority('')
    setFilterStatus('')
    setFilterAssignee('')
    setShowMyTasks(false)
  }

  const hasActiveFilters = searchQuery || filterPriority || filterStatus || filterAssignee || showMyTasks

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
      />
    </div>
  )
}

export default Tasks
