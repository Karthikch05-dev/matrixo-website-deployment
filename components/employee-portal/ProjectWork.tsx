'use client'

/**
 * PROJECT WORK — lives inside To-Do List.
 *
 * Three panels behind one sub-tab bar:
 *   My Project Work  — every employee (their tasks + claimable pool)
 *   Projects         — Admin / Co-Admin only (project CRUD)
 *   Project Workboard— Admin / Co-Admin only (all tasks, filters, progress)
 *
 * The existing Tasks module is untouched; this reads and writes its own
 * collections via lib/projectWork.ts.
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  FaPlus, FaFilter, FaSearch, FaCheck, FaTimes, FaClock, FaLock,
  FaUserPlus, FaHistory, FaExclamationTriangle, FaFolderOpen, FaArchive,
  FaPlay, FaPaperPlane, FaUndo, FaBan, FaTrash,
} from 'react-icons/fa'
import { toast } from 'sonner'
import { useEmployeeAuth, type EmployeeProfile } from '@/lib/employeePortalContext'
import {
  subscribeProjects, subscribeProjectTasks, subscribeTaskEvents,
  createProject, setProjectArchived, deleteProject, deleteProjectTask,
  createProjectTask, assignProjectTask, claimProjectTask,
  startProjectTask, submitProjectTask, confirmProjectTask,
  requestChangesOnTask, reopenProjectTask, setTaskBlocked, setTaskCancelled,
  toggleChecklistItem,
  computeProgress, sortTasks,
  STATUS_META, PROJECT_TASK_STATUSES, TASK_PRIORITIES, PRIORITY_META,
  canManageProjects, canClaimTask, isTaskOwner, setProjectWorkTokenGetter,
  type Project, type ProjectTask, type ProjectTaskStatus, type ProjectTaskEvent,
  type TaskPriority, type Actor,
  updateProjectTask,
} from '@/lib/projectWork'
import { Button, Input, Textarea, Select, Badge, Card, Modal, Alert, EmptyState, Spinner } from './ui'

// ============================================================================
// SHARED BITS
// ============================================================================

const toneToVariant = {
  neutral: 'default', info: 'info', warning: 'warning', success: 'success', danger: 'error',
} as const

function StatusBadge({ status, size = 'sm' }: { status: ProjectTaskStatus; size?: 'sm' | 'md' }) {
  const meta = STATUS_META[status]
  if (!meta) return null
  return <Badge variant={toneToVariant[meta.tone]} size={size}>{meta.short}</Badge>
}

function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const variant = priority === 'urgent' ? 'error' : priority === 'high' ? 'warning' : 'default'
  return <Badge variant={variant} size="sm">{PRIORITY_META[priority]?.label ?? priority}</Badge>
}

function fmtDate(d?: string | null) {
  if (!d) return null
  try { return new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return d }
}

function isOverdue(t: ProjectTask) {
  if (!t.dueDate) return false
  if (t.status === 'CONFIRMED' || t.status === 'CANCELLED') return false
  return new Date(t.dueDate) < new Date(new Date().toDateString())
}

/**
 * Every department present in the employee list, tidied for display.
 *
 * `department` is inconsistent in this database -- casing varies ("Intern" vs
 * "intern") and for some employees it repeats their role. All real values are
 * kept so nothing is hidden from the person assigning work; only exact
 * case-duplicates are merged, preferring the properly-capitalised spelling.
 */
function teamsFrom(employees: EmployeeProfile[]): string[] {
  const byKey = new Map<string, string>()

  for (const e of employees) {
    const dept = (e.department || '').trim()
    if (!dept) continue
    const key = dept.toLowerCase()
    const existing = byKey.get(key)
    // Prefer "Web Development" over "web development".
    if (!existing || (existing === existing.toLowerCase() && dept !== dept.toLowerCase())) {
      byKey.set(key, dept)
    }
  }

  return Array.from(byKey.values()).sort((a, b) => a.localeCompare(b))
}

// ============================================================================
// TASK CARD
// ============================================================================

function TaskCard({
  task, actor, onOpen, onClaim,
}: {
  task: ProjectTask
  actor: Actor
  onOpen: (t: ProjectTask) => void
  onClaim: (t: ProjectTask) => void
}) {
  const claimable = canClaimTask(task, actor)
  const overdue = isOverdue(task)

  return (
    <Card padding="md" hover className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-wider text-[#64748B] dark:text-neutral-500 truncate">
            {task.projectName}
          </p>
          <h4 className="font-semibold text-[#0F172A] dark:text-white truncate mt-0.5">{task.title}</h4>
        </div>
        <StatusBadge status={task.status} />
      </div>

      {task.description && (
        <p className="text-sm text-[#475569] dark:text-neutral-400 line-clamp-2">{task.description}</p>
      )}

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <PriorityBadge priority={task.priority} />
        {task.assignedRole && <Badge variant="default" size="sm">{task.assignedRole}</Badge>}
        {task.assignedToName && (
          <span className="text-[#64748B] dark:text-neutral-400 truncate max-w-[150px]">
            {task.assignedToName}
          </span>
        )}
        {task.dueDate && (
          <span className={`flex items-center gap-1 ${overdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-[#64748B] dark:text-neutral-400'}`}>
            <FaClock className="text-[10px]" />{fmtDate(task.dueDate)}
          </span>
        )}
      </div>

      {task.status === 'CONFIRMED' && task.confirmedByName && (
        <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
          <FaCheck className="text-[10px]" />Confirmed by {task.confirmedByName}
        </p>
      )}
      {task.status === 'CHANGES_REQUESTED' && task.reviewComment && (
        <p className="text-xs text-red-600 dark:text-red-400 line-clamp-2">
          Changes requested: {task.reviewComment}
        </p>
      )}
      {task.status === 'BLOCKED' && task.blockedReason && (
        <p className="text-xs text-amber-600 dark:text-amber-400 line-clamp-2">
          Blocked: {task.blockedReason}
        </p>
      )}

      <div className="flex items-center gap-2 mt-auto pt-1">
        <Button size="sm" variant="secondary" onClick={() => onOpen(task)}>Open Task</Button>
        {claimable && (
          <Button size="sm" variant="primary" icon={<FaUserPlus />} onClick={() => onClaim(task)}>
            Take Task
          </Button>
        )}
      </div>
    </Card>
  )
}

// ============================================================================
// TASK DETAIL MODAL
// ============================================================================

function TaskDetailModal({
  task, actor, employees, onClose,
}: {
  task: ProjectTask
  actor: Actor
  employees: EmployeeProfile[]
  onClose: () => void
}) {
  const manager = canManageProjects(actor)
  const owner = isTaskOwner(task, actor)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const [reviewNote, setReviewNote] = useState('')
  const [blockReason, setBlockReason] = useState('')
  const [assignee, setAssignee] = useState(task.assignedTo || '')
  const [events, setEvents] = useState<ProjectTaskEvent[]>([])
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    if (!showHistory || !task.id) return
    return subscribeTaskEvents(task.id, setEvents)
  }, [showHistory, task.id])

  const run = async (fn: () => Promise<void>, ok: string) => {
    setBusy(true)
    try { await fn(); toast.success(ok) }
    catch (e: any) { toast.error(e?.message || 'Something went wrong') }
    finally { setBusy(false) }
  }

  const canStart = owner && ['ASSIGNED', 'CHANGES_REQUESTED', 'BLOCKED'].includes(task.status)
  const canSubmit = owner && task.status === 'IN_PROGRESS'
  const canReview = manager && task.status === 'COMPLETED_AWAITING_CONFIRMATION'

  return (
    <Modal isOpen onClose={onClose} title={task.title} size="lg">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={task.status} size="md" />
          <PriorityBadge priority={task.priority} />
          <Badge variant="default" size="sm">{task.projectName}</Badge>
          {task.assignedRole && <Badge variant="default" size="sm">{task.assignedRole}</Badge>}
        </div>

        {task.description && (
          <p className="text-sm text-[#475569] dark:text-neutral-300 whitespace-pre-wrap">{task.description}</p>
        )}

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-[#64748B] dark:text-neutral-500">Assigned to</p>
            <p className="text-[#0F172A] dark:text-white">{task.assignedToName || 'Unassigned'}</p>
          </div>
          <div>
            <p className="text-xs text-[#64748B] dark:text-neutral-500">Due</p>
            <p className={isOverdue(task) ? 'text-red-600 dark:text-red-400 font-medium' : 'text-[#0F172A] dark:text-white'}>
              {fmtDate(task.dueDate) || '—'}
            </p>
          </div>
        </div>

        {/* Status-specific context */}
        {task.status === 'CONFIRMED' && task.confirmedByName && (
          <Alert variant="success">Confirmed by {task.confirmedByName}</Alert>
        )}
        {task.status === 'COMPLETED_AWAITING_CONFIRMATION' && (
          <Alert variant="warning">
            Completed by {task.completedByName || 'the assignee'} — awaiting Admin/Co-Admin confirmation.
            {task.submissionNote && <span className="block mt-1 opacity-80">“{task.submissionNote}”</span>}
          </Alert>
        )}
        {task.status === 'CHANGES_REQUESTED' && task.reviewComment && (
          <Alert variant="error">Changes requested: {task.reviewComment}</Alert>
        )}
        {task.status === 'BLOCKED' && task.blockedReason && (
          <Alert variant="warning">Blocked: {task.blockedReason}</Alert>
        )}

        {/* Everyone can open any task, so say plainly why there are no buttons. */}
        {!owner && !manager && (
          <p className="text-xs text-[#64748B] dark:text-neutral-500">
            View only —{' '}
            {task.assignedToName
              ? `only ${task.assignedToName} can change this task's status.`
              : 'nobody has taken this task yet, so its status cannot change.'}
          </p>
        )}

        {/* TASK PROGRESS */}
        {(owner || manager) && (
          <div className="space-y-2 border-t border-[rgba(15,23,42,0.08)] dark:border-neutral-700 pt-4">
            <p className="text-xs font-medium text-[#64748B] dark:text-neutral-500 uppercase tracking-wider">Progress Status</p>
            <div className="flex flex-wrap gap-2">
              <Select
                label=""
                value={task.progressStatus || 'Not Started'}
                options={[
                  'Not Started',
                  'In Progress',
                  'Fixing Issues',
                  'Completed — PR Sent'
                ].map(p => ({ value: p, label: p }))}
                onChange={(val) => run(() => updateProjectTask(task.id!, { progressStatus: val }), 'Progress updated')}
                disabled={!owner && !manager}
              />
            </div>
          </div>
        )}

        {/* Checklist */}
        {!!task.checklist?.length && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-[#64748B] dark:text-neutral-500 uppercase tracking-wider">Checklist</p>
            {task.checklist.map((it) => (
              <label key={it.id} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={it.done}
                  disabled={busy || (!owner && !manager)}
                  onChange={(e) => run(
                    () => toggleChecklistItem(task.id!, it.id, e.target.checked),
                    'Checklist updated'
                  )}
                />
                <span className={it.done ? 'line-through text-[#94A3B8] dark:text-neutral-500' : 'text-[#0F172A] dark:text-neutral-200'}>
                  {it.text}
                </span>
              </label>
            ))}
          </div>
        )}

        {/* EMPLOYEE ACTIONS */}
        {(canStart || canSubmit) && (
          <div className="space-y-2 border-t border-[rgba(15,23,42,0.08)] dark:border-neutral-700 pt-4">
            {canSubmit && (
              <Textarea
                label="Submission note (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Anything the reviewer should know…"
                rows={2}
              />
            )}
            <div className="flex flex-wrap gap-2">
              {canStart && (
                <Button size="sm" icon={<FaPlay />} loading={busy}
                  onClick={() => run(() => startProjectTask(task.id!), 'Task started')}>
                  {task.status === 'CHANGES_REQUESTED' ? 'Resume Work' : 'Start Work'}
                </Button>
              )}
              {canSubmit && (
                <Button size="sm" variant="success" icon={<FaPaperPlane />} loading={busy}
                  onClick={() => run(() => submitProjectTask(task.id!, note), 'Submitted for confirmation')}>
                  Mark Complete &amp; Submit
                </Button>
              )}
              {owner && task.status !== 'BLOCKED' && ['ASSIGNED', 'IN_PROGRESS'].includes(task.status) && (
                <Button size="sm" variant="ghost" icon={<FaExclamationTriangle />} loading={busy}
                  onClick={() => {
                    const why = blockReason.trim() || window.prompt('What is blocking this task?') || ''
                    if (!why.trim()) return
                    run(() => setTaskBlocked(task.id!, true, why), 'Marked as blocked')
                  }}>
                  Mark Blocked
                </Button>
              )}
            </div>
          </div>
        )}

        {/* MANAGER: REVIEW */}
        {canReview && (
          <div className="space-y-2 border-t border-[rgba(15,23,42,0.08)] dark:border-neutral-700 pt-4">
            <p className="text-xs font-medium text-[#64748B] dark:text-neutral-500 uppercase tracking-wider">Review</p>
            <Textarea
              label="Feedback (required to request changes)"
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder="What needs changing?"
              rows={2}
            />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="success" icon={<FaCheck />} loading={busy}
                onClick={() => run(() => confirmProjectTask(task.id!, reviewNote || null), 'Task confirmed')}>
                Confirm
              </Button>
              <Button size="sm" variant="danger" icon={<FaTimes />} loading={busy}
                onClick={() => run(() => requestChangesOnTask(task.id!, reviewNote), 'Changes requested')}>
                Request Changes
              </Button>
            </div>
          </div>
        )}

        {/* MANAGER: ASSIGN / LIFECYCLE */}
        {manager && (
          <div className="space-y-2 border-t border-[rgba(15,23,42,0.08)] dark:border-neutral-700 pt-4">
            <p className="text-xs font-medium text-[#64748B] dark:text-neutral-500 uppercase tracking-wider">Management</p>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
              <div className="flex-1">
                <Select
                  label="Assign to"
                  value={assignee}
                  placeholder="Unassigned (available to claim)"
                  options={[
                    { value: '', label: 'Unassigned (available to claim)' },
                    ...employees.map((e) => ({ value: e.employeeId, label: `${e.name}${e.department ? ` — ${e.department}` : ''}` })),
                  ]}
                  onChange={setAssignee}
                />
              </div>
              <Button size="sm" variant="secondary" loading={busy}
                onClick={() => {
                  const emp = employees.find((e) => e.employeeId === assignee)
                  run(
                    () => assignProjectTask(
                      task.id!,
                      emp ? { employeeId: emp.employeeId, name: emp.name, email: emp.email } : null
                    ),
                    emp ? `Assigned to ${emp.name}` : 'Returned to available pool'
                  )
                }}>
                Apply
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {task.status === 'CONFIRMED' && (
                <Button size="sm" variant="ghost" icon={<FaUndo />} loading={busy}
                  onClick={() => run(() => reopenProjectTask(task.id!), 'Task reopened')}>
                  Reopen
                </Button>
              )}
              {task.status === 'BLOCKED' && (
                <Button size="sm" variant="ghost" loading={busy}
                  onClick={() => run(() => setTaskBlocked(task.id!, false, null), 'Unblocked')}>
                  Unblock
                </Button>
              )}
              {task.status !== 'CANCELLED' ? (
                <Button size="sm" variant="ghost" icon={<FaBan />} loading={busy}
                  onClick={() => run(() => setTaskCancelled(task.id!, true), 'Task cancelled')}>
                  Cancel Task
                </Button>
              ) : (
                <Button size="sm" variant="ghost" loading={busy}
                  onClick={() => run(() => setTaskCancelled(task.id!, false), 'Task restored')}>
                  Restore
                </Button>
              )}

              {/* Permanent, unlike Cancel. Confirmed because the audit history
                  goes with it and nothing can bring either back. */}
              <Button size="sm" variant="danger" icon={<FaTrash />} loading={busy}
                onClick={() => {
                  const ok = window.confirm(
                    `Delete "${task.title}" permanently?\n\n` +
                    'This also removes its history and cannot be undone. ' +
                    'Use Cancel Task instead if you only want it out of the way.'
                  )
                  if (!ok) return
                  run(async () => { await deleteProjectTask(task.id!); onClose() }, 'Task deleted')
                }}>
                Delete
              </Button>
            </div>
          </div>
        )}

        {/* AUDIT TRAIL
            Everyone can see the task, but projectTaskEvents stays readable only
            by a manager or the actor who created the entry. Offering the toggle
            to anyone else would just produce a permission error. */}
        {(manager || owner) && (
          <div className="border-t border-[rgba(15,23,42,0.08)] dark:border-neutral-700 pt-4">
            <button
              onClick={() => setShowHistory((v) => !v)}
              className="flex items-center gap-2 text-xs font-medium text-[#64748B] dark:text-neutral-400 hover:text-[#0F172A] dark:hover:text-white transition-colors"
            >
              <FaHistory className="text-[10px]" />
              {showHistory ? 'Hide' : 'Show'} history
            </button>
            {showHistory && (
              <div className="mt-3 space-y-2 max-h-56 overflow-y-auto">
                {events.length === 0 ? (
                  <p className="text-xs text-[#94A3B8] dark:text-neutral-500">No history yet.</p>
                ) : events.map((ev) => (
                  <div key={ev.id} className="text-xs flex items-start gap-2">
                    <span className="text-[#94A3B8] dark:text-neutral-500 shrink-0 w-[92px]">
                      {ev.at?.toDate?.().toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) || '—'}
                    </span>
                    <span className="text-[#475569] dark:text-neutral-300">
                      <strong className="text-[#0F172A] dark:text-white">{ev.actorName}</strong>{' '}
                      {ev.action.replace(/_/g, ' ')}
                      {ev.toStatus ? ` → ${STATUS_META[ev.toStatus]?.short ?? ev.toStatus}` : ''}
                      {ev.note ? ` — ${ev.note}` : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}

// ============================================================================
// CREATE TASK MODAL (manager only)
// ============================================================================

function CreateTaskModal({
  projects, employees, actor, onClose,
}: {
  projects: Project[]
  employees: EmployeeProfile[]
  actor: Actor
  onClose: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({
    projectId: projects[0]?.id || '',
    title: '', description: '',
    priority: 'medium' as TaskPriority,
    assignedTo: '', assignedRole: '',
    dueDate: '', referenceUrl: '',
    taskType: 'open' as 'open' | 'assigned',
  })

  const roles = useMemo(() => teamsFrom(employees), [employees])
  // Only offer people from the chosen team, so assignment lists stay relevant.
  const selectable = useMemo(
    () => form.assignedRole ? employees.filter((e) => e.department === form.assignedRole) : employees,
    [employees, form.assignedRole]
  )

  const submit = async () => {
    const project = projects.find((p) => p.id === form.projectId)
    if (!project) return toast.error('Please choose a project')
    if (!form.title.trim()) return toast.error('Task title is required')
    if (form.taskType === 'assigned' && !form.assignedTo) {
      return toast.error('Please select an employee to assign this task to')
    }

    setBusy(true)
    try {
      const emp = employees.find((e) => e.employeeId === form.assignedTo)
      await createProjectTask({
        projectId: project.id!,
        projectName: project.name,
        title: form.title,
        description: form.description,
        priority: form.priority,
        // Email is the only reliable link to an Auth UID; the server resolves it.
        assignee: emp ? { employeeId: emp.employeeId, name: emp.name, email: emp.email } : null,
        assignedRole: form.assignedRole || null,
        allowClaiming: form.taskType === 'open',
        dueDate: form.dueDate || null,
        referenceUrl: form.referenceUrl || null,
      })
      toast.success('Task created')
      onClose()
    } catch (e: any) {
      toast.error(e?.message || 'Could not create task')
    } finally { setBusy(false) }
  }

  return (
    <Modal isOpen onClose={onClose} title="Create Project Task" size="lg">
      <div className="space-y-4">
        {projects.length === 0 && (
          <Alert variant="warning">
            There are no projects yet, so there is nothing to attach a task to.
            Close this and open the <strong>Projects</strong> tab to create one.
            <span className="block mt-1 opacity-80">
              If you know projects exist, the list failed to load — check the banner
              behind this dialog.
            </span>
          </Alert>
        )}
        <Select
          label="Project"
          value={form.projectId}
          options={projects.map((p) => ({ value: p.id!, label: p.name }))}
          onChange={(v) => setForm({ ...form, projectId: v })}
          placeholder="Select a project"
        />
        <Input label="Task title" value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="e.g. Build registration UI" />
        <Textarea label="Description" value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="What needs doing?" rows={3} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select label="Priority" value={form.priority}
            options={TASK_PRIORITIES.map((p) => ({ value: p, label: PRIORITY_META[p].label }))}
            onChange={(v) => setForm({ ...form, priority: v as TaskPriority })} />
          <Input label="Due date" type="date" value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#475569] dark:text-neutral-300">Task Type</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-[#475569] dark:text-neutral-300 cursor-pointer">
              <input type="radio" name="taskType" value="open" checked={form.taskType === 'open'} onChange={() => setForm({ ...form, taskType: 'open', assignedTo: '' })} />
              Open Task
            </label>
            <label className="flex items-center gap-2 text-sm text-[#475569] dark:text-neutral-300 cursor-pointer">
              <input type="radio" name="taskType" value="assigned" checked={form.taskType === 'assigned'} onChange={() => setForm({ ...form, taskType: 'assigned' })} />
              Assign to Specific Person
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select label="Role / team" value={form.assignedRole}
            placeholder="Any team"
            options={[{ value: '', label: 'Any team' }, ...roles.map((r) => ({ value: r, label: r }))]}
            onChange={(v) => setForm({ ...form, assignedRole: v, assignedTo: '' })} />
          {form.taskType === 'assigned' && (
            <Select label="Assign to" value={form.assignedTo}
              placeholder="Select employee"
              options={[
                { value: '', label: 'Select employee' },
                ...selectable.map((e) => ({ value: e.employeeId, label: e.name })),
              ]}
              onChange={(v) => setForm({ ...form, assignedTo: v })} />
          )}
        </div>

        <Input label="Reference link (optional)" value={form.referenceUrl}
          onChange={(e) => setForm({ ...form, referenceUrl: e.target.value })}
          placeholder="https://…" />

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={busy} onClick={submit} disabled={!projects.length}>
            Create Task
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ============================================================================
// PROJECTS PANEL (manager only)
// ============================================================================

function ProjectsPanel({ projects, tasks, actor }: { projects: Project[]; tasks: ProjectTask[]; actor: Actor }) {
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })
  const [busy, setBusy] = useState(false)

  const create = async () => {
    if (!form.name.trim()) return toast.error('Project name is required')
    setBusy(true)
    try {
      await createProject(form)
      toast.success('Project created')
      setForm({ name: '', description: '' })
      setShowNew(false)
    } catch (e: any) { toast.error(e?.message || 'Could not create project') }
    finally { setBusy(false) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-[#64748B] dark:text-neutral-400">
          {projects.length} active project{projects.length === 1 ? '' : 's'}
        </p>
        <Button size="sm" icon={<FaPlus />} onClick={() => setShowNew(true)}>New Project</Button>
      </div>

      {projects.length === 0 ? (
        <EmptyState icon={<FaFolderOpen />} title="No projects yet"
          description="Create a project to start organising team work." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {projects.map((p) => {
            const mine = tasks.filter((t) => t.projectId === p.id)
            const prog = computeProgress(mine)
            return (
              <Card key={p.id} padding="md" className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-[#0F172A] dark:text-white truncate">{p.name}</h4>
                    {p.description && (
                      <p className="text-sm text-[#64748B] dark:text-neutral-400 line-clamp-2 mt-0.5">{p.description}</p>
                    )}
                  </div>
                  <Badge variant="default" size="sm">{prog.total} task{prog.total === 1 ? '' : 's'}</Badge>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[#64748B] dark:text-neutral-400">
                      {prog.confirmed} of {prog.counted} confirmed
                    </span>
                    <span className="font-medium text-[#0F172A] dark:text-white">{prog.percent}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#E2E8F0] dark:bg-neutral-700 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${prog.percent}%` }} />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" icon={<FaArchive />}
                    onClick={async () => {
                      try { await setProjectArchived(p.id!, true); toast.success('Project archived') }
                      catch (e: any) { toast.error(e?.message || 'Could not archive') }
                    }}>
                    Archive
                  </Button>

                  {/* Deleting a project takes its tasks with it, so the count is
                      spelled out before anything is destroyed. */}
                  <Button size="sm" variant="danger" icon={<FaTrash />}
                    onClick={async () => {
                      const ok = window.confirm(
                        `Delete the project "${p.name}" permanently?\n\n` +
                        `This also deletes its ${prog.total} task${prog.total === 1 ? '' : 's'} ` +
                        'and all their history. It cannot be undone.\n\n' +
                        'Archive instead if you just want it off the list.'
                      )
                      if (!ok) return
                      try {
                        const r = await deleteProject(p.id!)
                        toast.success(
                          `Project deleted${r?.deletedTasks ? ` with ${r.deletedTasks} task(s)` : ''}`
                        )
                      } catch (e: any) { toast.error(e?.message || 'Could not delete project') }
                    }}>
                    Delete
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {showNew && (
        <Modal isOpen onClose={() => setShowNew(false)} title="New Project" size="md">
          <div className="space-y-4">
            <Input label="Project name" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. DevAgentic 2.0" />
            <Textarea label="Description" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What is this project about?" rows={3} />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button loading={busy} onClick={create}>Create Project</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ============================================================================
// MAIN
// ============================================================================

type SubTab = 'mine' | 'projects' | 'workboard'

export function ProjectWork() {
  const { employee, user, getAllEmployees } = useEmployeeAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<ProjectTask[]>([])
  const [employees, setEmployees] = useState<EmployeeProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [subTab, setSubTab] = useState<SubTab>('mine')
  const [openTask, setOpenTask] = useState<ProjectTask | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  // Filters (workboard)
  const [fProject, setFProject] = useState('')
  const [fRole, setFRole] = useState('')
  const [fEmployee, setFEmployee] = useState('')
  const [fStatus, setFStatus] = useState('')
  const [fPriority, setFPriority] = useState('')
  const [search, setSearch] = useState('')

  // UID comes from Firebase Auth, not the Employees document — the document may
  // be keyed by name, so its ID is not a usable identity.
  const actor: Actor | null = useMemo(
    () => employee && user ? {
      uid: user.uid,
      employeeId: employee.employeeId,
      name: employee.name,
      email: employee.email ?? user.email,
      role: employee.role,
      department: employee.department,
    } : null,
    [employee, user]
  )
  const manager = canManageProjects(actor)

  // lib/projectWork calls the API with the caller's ID token.
  useEffect(() => {
    setProjectWorkTokenGetter(async () => (user ? await user.getIdToken() : null))
  }, [user])

  useEffect(() => {
    if (!actor) return
    setLoadError(null)
    const unsubP = subscribeProjects(setProjects, { onError: setLoadError })
    const unsubT = subscribeProjectTasks(
      actor,
      (t) => { setTasks(t); setLoading(false) },
      { onError: (m) => { setLoadError(m); setLoading(false) } }
    )
    return () => { unsubP(); unsubT() }
  }, [actor?.employeeId, actor?.role, actor?.department]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!manager) return
    getAllEmployees().then((d: EmployeeProfile[]) => setEmployees(d || [])).catch(console.error)
  }, [manager, getAllEmployees])

  const claim = useCallback(async (t: ProjectTask) => {
    if (!actor) return
    try { await claimProjectTask(t.id!); toast.success(`“${t.title}” is yours`) }
    catch (e: any) { toast.error(e?.message || 'Could not claim this task') }
  }, [actor])

  // Keep the open modal in sync with live updates.
  const liveOpenTask = useMemo(
    () => openTask ? tasks.find((t) => t.id === openTask.id) || openTask : null,
    [openTask, tasks]
  )

  // isTaskOwner matches on UID first and only falls back to employeeId. Testing
  // `assignedTo` alone missed every task assigned after UID became the primary
  // identity, and missed claimed tasks whose owner has a name-keyed record.
  const myTasks = useMemo(
    () => sortTasks(tasks.filter((t) => isTaskOwner(t, actor) && t.status !== 'CANCELLED')),
    [tasks, actor]
  )
  const availableTasks = useMemo(
    () => sortTasks(tasks.filter((t) => canClaimTask(t, actor))),
    [tasks, actor]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return sortTasks(tasks.filter((t) => {
      if (fProject && t.projectId !== fProject) return false
      if (fRole && t.assignedRole !== fRole) return false
      if (fEmployee && t.assignedTo !== fEmployee) return false
      if (fStatus && t.status !== fStatus) return false
      if (fPriority && t.priority !== fPriority) return false
      if (q && !(
        t.title.toLowerCase().includes(q) ||
        t.projectName.toLowerCase().includes(q) ||
        (t.assignedToName || '').toLowerCase().includes(q)
      )) return false
      return true
    }))
  }, [tasks, fProject, fRole, fEmployee, fStatus, fPriority, search])

  const progress = useMemo(
    () => computeProgress(fProject ? tasks.filter((t) => t.projectId === fProject) : tasks),
    [tasks, fProject]
  )
  /**
   * Board filter options are derived from the tasks, not the employee
   * directory: everyone can see the board now, but only managers load the
   * directory. Deriving from the data also keeps each list to values that
   * actually match something.
   */
  const roles = useMemo(() => {
    const seen = new Set<string>()
    for (const t of tasks) if (t.assignedRole) seen.add(t.assignedRole)
    return Array.from(seen).sort((a, b) => a.localeCompare(b))
  }, [tasks])

  const people = useMemo(() => {
    const byId = new Map<string, string>()
    for (const t of tasks) {
      if (t.assignedTo && t.assignedToName) byId.set(t.assignedTo, t.assignedToName)
    }
    return Array.from(byId, ([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [tasks])

  if (!actor) {
    return <Alert variant="warning">Sign in to the employee portal to view project work.</Alert>
  }

  // "All Tasks" is open to everyone: shared visibility of what the team is
  // working on. "Projects" stays with managers because it is CRUD, not a view.
  const subTabs = [
    { id: 'mine', label: 'My Project Work' },
    { id: 'workboard', label: 'All Tasks' },
    ...(manager ? [{ id: 'projects', label: 'Projects' }] : []),
  ]

  return (
    <div className="space-y-5">
      {/* Sub-navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-[#F1F5F9] dark:bg-neutral-900 rounded-lg border border-[rgba(15,23,42,0.06)] dark:border-transparent overflow-x-auto">
          {subTabs.map((t) => (
            <button key={t.id} onClick={() => setSubTab(t.id as SubTab)}
              className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all ${subTab === t.id
                ? 'bg-white text-[#0F172A] shadow-sm border border-[rgba(15,23,42,0.06)] dark:bg-primary-600 dark:text-white dark:border-transparent'
                : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[rgba(15,23,42,0.04)] dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800'
                }`}>
              {t.label}
            </button>
          ))}
        </div>
        {manager && (
          projects.length === 0 ? (
            <Button size="sm" icon={<FaFolderOpen />} onClick={() => setSubTab('projects')}>
              Create a Project First
            </Button>
          ) : (
            <Button size="sm" icon={<FaPlus />} onClick={() => setShowCreate(true)}>
              Create Project Task
            </Button>
          )
        )}
      </div>

      {loadError && (
        <Alert variant="error">{loadError}</Alert>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <>
          {/* ---------------- MY PROJECT WORK ---------------- */}
          {subTab === 'mine' && (
            <div className="space-y-6">
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-[#0F172A] dark:text-white">
                  My Tasks <span className="text-[#64748B] dark:text-neutral-500 font-normal">({myTasks.length})</span>
                </h3>
                {myTasks.length === 0 ? (
                  /* A full-height empty state here pushed the claimable pool
                     below the fold, so someone with nothing assigned saw only
                     "Nothing assigned to you" and no way to pick work up. One
                     line instead, with the tasks they can take right under it. */
                  <p className="text-sm text-[#64748B] dark:text-neutral-400">
                    Nothing is assigned to you yet — take one of the tasks below to get started.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {myTasks.map((t) => (
                      <TaskCard key={t.id} task={t} actor={actor} onOpen={setOpenTask} onClaim={claim} />
                    ))}
                  </div>
                )}
              </section>

              {/* Always rendered. When this was hidden at length === 0 there was
                  no way to tell "nothing to claim" from "the list failed to
                  load" — the page just ended. */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-[#0F172A] dark:text-white">
                  Available to Claim <span className="text-[#64748B] dark:text-neutral-500 font-normal">({availableTasks.length})</span>
                </h3>
                {availableTasks.length === 0 ? (
                  <EmptyState icon={<FaCheck />} title="No tasks are free right now"
                    description="Every task is either taken or already finished. New ones will show up here as soon as they are created." />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {availableTasks.map((t) => (
                      <TaskCard key={t.id} task={t} actor={actor} onOpen={setOpenTask} onClaim={claim} />
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* ---------------- PROJECTS ---------------- */}
          {subTab === 'projects' && manager && (
            <ProjectsPanel projects={projects} tasks={tasks} actor={actor} />
          )}

          {/* ---------------- ALL TASKS (everyone) ---------------- */}
          {subTab === 'workboard' && (
            <div className="space-y-4">
              {!manager && (
                <Alert variant="info">
                  Everyone can see every task and its status here. You can only change
                  the status of tasks assigned to you or that you took yourself —
                  Admins and Co-Admins confirm completed work.
                </Alert>
              )}
              {/* Progress summary — derived from task data only */}
              <Card padding="md">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                  <div>
                    <p className="text-xs text-[#64748B] dark:text-neutral-500 uppercase tracking-wider">Total Tasks</p>
                    <p className="text-2xl font-bold text-[#0F172A] dark:text-white">{progress.total}</p>
                  </div>
                  {(['NOT_STARTED', 'AVAILABLE', 'IN_PROGRESS', 'COMPLETED_AWAITING_CONFIRMATION', 'CONFIRMED', 'BLOCKED'] as ProjectTaskStatus[]).map((s) => (
                    <div key={s}>
                      <p className="text-xs text-[#64748B] dark:text-neutral-500">{STATUS_META[s].short}</p>
                      <p className="text-lg font-semibold text-[#0F172A] dark:text-white">{progress.byStatus[s] || 0}</p>
                    </div>
                  ))}
                  <div className="ml-auto min-w-[140px]">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-[#64748B] dark:text-neutral-400">Progress</span>
                      <span className="font-medium text-[#0F172A] dark:text-white">{progress.percent}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#E2E8F0] dark:bg-neutral-700 overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${progress.percent}%` }} />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Filters */}
              <Card padding="md" className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-medium text-[#64748B] dark:text-neutral-500 uppercase tracking-wider">
                  <FaFilter className="text-[10px]" /> Filters
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <Select label="Project" value={fProject} placeholder="All projects"
                    options={[{ value: '', label: 'All projects' }, ...projects.map((p) => ({ value: p.id!, label: p.name }))]}
                    onChange={setFProject} />
                  <Select label="Role / team" value={fRole} placeholder="All teams"
                    options={[{ value: '', label: 'All teams' }, ...roles.map((r) => ({ value: r, label: r }))]}
                    onChange={setFRole} />
                  <Select label="Employee" value={fEmployee} placeholder="All employees"
                    options={[{ value: '', label: 'All employees' }, ...people]}
                    onChange={setFEmployee} />
                  <Select label="Status" value={fStatus} placeholder="All statuses"
                    options={[{ value: '', label: 'All statuses' }, ...PROJECT_TASK_STATUSES.map((s) => ({ value: s, label: STATUS_META[s].label }))]}
                    onChange={setFStatus} />
                  <Select label="Priority" value={fPriority} placeholder="All priorities"
                    options={[{ value: '', label: 'All priorities' }, ...TASK_PRIORITIES.map((p) => ({ value: p, label: PRIORITY_META[p].label }))]}
                    onChange={setFPriority} />
                  <Input label="Search" value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Task, project or person…" icon={<FaSearch />} />
                </div>
              </Card>

              {filtered.length === 0 ? (
                <EmptyState icon={<FaFilter />} title="No tasks match"
                  description="Try loosening the filters." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {filtered.map((t) => (
                    <TaskCard key={t.id} task={t} actor={actor} onOpen={setOpenTask} onClaim={claim} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {liveOpenTask && (
        <TaskDetailModal task={liveOpenTask} actor={actor} employees={employees}
          onClose={() => setOpenTask(null)} />
      )}
      {showCreate && manager && (
        <CreateTaskModal projects={projects} employees={employees} actor={actor}
          onClose={() => setShowCreate(false)} />
      )}
    </div>
  )
}

export default ProjectWork
