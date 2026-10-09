'use client'

/**
 * PROJECT WORK — data layer
 * ============================================================================
 * A project/task execution system for internal teams, living inside the
 * employee portal's To-Do List.
 *
 * WHY SEPARATE COLLECTIONS (and not the existing `tasks` collection):
 * `tasks` is subscribed with an unfiltered `onSnapshot(collection(db,'tasks'))`
 * in employeePortalContext, so every task in the company reaches every client.
 * Adding project tasks there would make them appear inside the existing Tasks
 * page — a regression. These live in their own collections instead, and the
 * existing Tasks module is left completely untouched.
 *
 * AUTHORIZATION: every mutation here re-checks the caller's role. That is a
 * convenience/UX layer only — the real enforcement is in firestore.rules,
 * because a client can always call Firestore directly.
 */

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from './firebaseConfig'
import { isAdminOrSubAdmin } from './employeePortalContext'

// ============================================================================
// COLLECTIONS
// ============================================================================

export const PROJECTS_COLLECTION = 'projects'
export const PROJECT_TASKS_COLLECTION = 'projectTasks'
export const PROJECT_TASK_EVENTS_COLLECTION = 'projectTaskEvents'

// ============================================================================
// STATUS MODEL
// ============================================================================

export const PROJECT_TASK_STATUSES = [
  'NOT_STARTED',
  'AVAILABLE',
  'ASSIGNED',
  'IN_PROGRESS',
  'COMPLETED_AWAITING_CONFIRMATION',
  'CHANGES_REQUESTED',
  'CONFIRMED',
  'BLOCKED',
  'CANCELLED',
] as const

export type ProjectTaskStatus = (typeof PROJECT_TASK_STATUSES)[number]

/** Human labels + the portal's existing colour vocabulary. */
export const STATUS_META: Record<
  ProjectTaskStatus,
  { label: string; short: string; tone: 'neutral' | 'info' | 'warning' | 'success' | 'danger' }
> = {
  NOT_STARTED: { label: 'Not Started', short: 'Not Started', tone: 'neutral' },
  AVAILABLE: { label: 'Available to Claim', short: 'Available', tone: 'info' },
  ASSIGNED: { label: 'Assigned', short: 'Assigned', tone: 'info' },
  IN_PROGRESS: { label: 'In Progress', short: 'In Progress', tone: 'info' },
  COMPLETED_AWAITING_CONFIRMATION: {
    label: 'Completed — Awaiting Confirmation',
    short: 'Awaiting Confirmation',
    tone: 'warning',
  },
  CHANGES_REQUESTED: { label: 'Changes Requested', short: 'Changes Requested', tone: 'danger' },
  CONFIRMED: { label: 'Confirmed', short: 'Confirmed', tone: 'success' },
  BLOCKED: { label: 'Blocked', short: 'Blocked', tone: 'danger' },
  CANCELLED: { label: 'Cancelled', short: 'Cancelled', tone: 'neutral' },
}

/**
 * Allowed transitions, split by who may perform them.
 *
 * The single most important rule in this system: an employee can never reach
 * CONFIRMED. Submitting only ever gets them to
 * COMPLETED_AWAITING_CONFIRMATION — management moves it the last step.
 */
export const EMPLOYEE_TRANSITIONS: Partial<Record<ProjectTaskStatus, ProjectTaskStatus[]>> = {
  AVAILABLE: ['ASSIGNED'], // via claim
  ASSIGNED: ['IN_PROGRESS', 'BLOCKED'],
  IN_PROGRESS: ['COMPLETED_AWAITING_CONFIRMATION', 'BLOCKED'],
  CHANGES_REQUESTED: ['IN_PROGRESS'],
  BLOCKED: ['IN_PROGRESS'],
}

export const MANAGER_TRANSITIONS: Partial<Record<ProjectTaskStatus, ProjectTaskStatus[]>> = {
  NOT_STARTED: ['AVAILABLE', 'ASSIGNED', 'CANCELLED', 'BLOCKED'],
  AVAILABLE: ['ASSIGNED', 'NOT_STARTED', 'CANCELLED', 'BLOCKED'],
  ASSIGNED: ['IN_PROGRESS', 'AVAILABLE', 'NOT_STARTED', 'CANCELLED', 'BLOCKED'],
  IN_PROGRESS: ['COMPLETED_AWAITING_CONFIRMATION', 'ASSIGNED', 'CANCELLED', 'BLOCKED'],
  COMPLETED_AWAITING_CONFIRMATION: ['CONFIRMED', 'CHANGES_REQUESTED', 'CANCELLED'],
  CHANGES_REQUESTED: ['IN_PROGRESS', 'CANCELLED'],
  CONFIRMED: ['IN_PROGRESS'], // reopen
  BLOCKED: ['IN_PROGRESS', 'ASSIGNED', 'AVAILABLE', 'CANCELLED'],
  CANCELLED: ['NOT_STARTED'],
}

export function canTransition(
  from: ProjectTaskStatus,
  to: ProjectTaskStatus,
  isManager: boolean
): boolean {
  const map = isManager ? MANAGER_TRANSITIONS : EMPLOYEE_TRANSITIONS
  return (map[from] ?? []).includes(to)
}

/** Statuses that count as "done" for progress maths. Only CONFIRMED counts. */
export const PROGRESS_DONE_STATUSES: ProjectTaskStatus[] = ['CONFIRMED']
/** Statuses excluded from the denominator (cancelled work isn't outstanding). */
export const PROGRESS_EXCLUDED_STATUSES: ProjectTaskStatus[] = ['CANCELLED']

// ============================================================================
// PRIORITY — reuses the existing portal vocabulary rather than inventing P0..P3
// ============================================================================

export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const
export type TaskPriority = (typeof TASK_PRIORITIES)[number]

export const PRIORITY_META: Record<TaskPriority, { label: string; rank: number }> = {
  urgent: { label: 'Urgent', rank: 0 },
  high: { label: 'High', rank: 1 },
  medium: { label: 'Medium', rank: 2 },
  low: { label: 'Low', rank: 3 },
}

// ============================================================================
// TYPES
// ============================================================================

export interface Project {
  id?: string
  name: string
  description: string
  status: 'active' | 'archived'
  createdBy: string
  createdByName: string
  createdAt: Timestamp
  updatedAt: Timestamp
  archivedAt?: Timestamp | null
}

export interface ChecklistItem {
  id: string
  text: string
  done: boolean
}

export interface ProjectTask {
  id?: string
  projectId: string
  projectName: string // denormalised so lists render without an extra read

  title: string
  description: string
  priority: TaskPriority
  status: ProjectTaskStatus

  /**
   * Firebase Auth UID of the assignee — the PRIMARY identity. Reliable across
   * both uid-keyed and name-keyed Employees documents.
   */
  assignedToUid?: string | null
  /** Legacy `employeeId` field. Kept for display and pre-UID tasks. */
  assignedTo?: string | null
  assignedToName?: string | null
  /** Department/team the task belongs to, e.g. "Web Development". */
  assignedRole?: string | null
  /** When true and status is AVAILABLE, matching employees may claim it. */
  allowClaiming: boolean

  /** Optional user-facing progress state within the task (e.g. Not Started, In Progress, Fixing Issues, Completed - PR Sent) */
  progressStatus?: string | null

  dueDate?: string | null
  checklist?: ChecklistItem[]
  referenceUrl?: string | null
  blockedReason?: string | null

  createdBy: string
  createdByName: string
  createdAt: Timestamp
  updatedAt: Timestamp

  selectedByUid?: string | null
  selectedBy?: string | null
  selectedByName?: string | null
  selectedAt?: Timestamp | null

  completedByUid?: string | null
  completedBy?: string | null
  completedByName?: string | null
  completedAt?: Timestamp | null
  submissionNote?: string | null

  confirmedByUid?: string | null
  confirmedBy?: string | null
  confirmedByName?: string | null
  confirmedAt?: Timestamp | null

  /** Feedback from a manager when sending work back. */
  reviewComment?: string | null
  /** Increments each time the employee resubmits after changes. */
  submissionCount?: number
}

export type ProjectTaskAction =
  | 'created'
  | 'updated'
  | 'assigned'
  | 'reassigned'
  | 'claimed'
  | 'started'
  | 'submitted'
  | 'confirmed'
  | 'changes_requested'
  | 'reopened'
  | 'blocked'
  | 'unblocked'
  | 'cancelled'
  | 'restored'

export interface ProjectTaskEvent {
  id?: string
  taskId: string
  projectId: string
  action: ProjectTaskAction
  actorId: string
  actorName: string
  at: Timestamp
  fromStatus?: ProjectTaskStatus | null
  toStatus?: ProjectTaskStatus | null
  note?: string | null
}

/**
 * Minimal actor shape.
 *
 * `uid` is the PRIMARY identity: the `Employees` collection has mixed document
 * IDs (some keyed by Auth UID, some by employee name), so the employeeId field
 * is not a reliable join key and the document ID is not either. The Auth UID is
 * always present and always correct.
 */
export interface Actor {
  /** Firebase Auth UID — primary identity. */
  uid: string
  /** The `employeeId` field, kept for display and legacy task matching. */
  employeeId: string
  name: string
  email?: string | null
  role?: string
  department?: string
}

// ============================================================================
// PERMISSIONS (UX layer — firestore.rules is the real gate)
// ============================================================================

export const canManageProjects = (actor?: Actor | null): boolean =>
  !!actor && isAdminOrSubAdmin(actor.role)

export const canConfirmTask = (actor?: Actor | null): boolean =>
  !!actor && isAdminOrSubAdmin(actor.role)

/**
 * Is this actor the person the task is assigned to?
 *
 * Matches on UID first. `assignedTo` (employeeId) is only consulted for tasks
 * created before UID became the primary identity.
 */
export const isTaskOwner = (task: ProjectTask, actor?: Actor | null): boolean => {
  if (!actor) return false
  if (task.assignedToUid) return task.assignedToUid === actor.uid
  return !!task.assignedTo && task.assignedTo === actor.employeeId
}

/** May this actor claim this task right now? */
export function canClaimTask(task: ProjectTask, actor?: Actor | null): boolean {
  if (!actor) return false
  if (task.status !== 'AVAILABLE' || !task.allowClaiming) return false
  if (task.assignedToUid || task.assignedTo) return false
  // `assignedRole` is a label, not a lock. It used to restrict claiming to
  // people whose role or department matched it, which hid the whole pool from
  // anyone outside that team — an Admin could not take a task tagged "Intern".
  // Any signed-in employee may now take any unclaimed task; the tag still shows
  // on the card so people know which team it was meant for.
  return true
}

/**
 * Can the actor see this task at all?
 *
 * Every signed-in employee can see every task and its status — the board is
 * shared visibility by design, so people can see what the team is working on.
 * Seeing a task confers nothing: `isTaskOwner` still gates status changes and
 * `canConfirmTask` still gates confirmation, both re-checked server-side.
 */
export function canViewTask(_task: ProjectTask, actor?: Actor | null): boolean {
  return !!actor
}

// ============================================================================
// LIVE READS — stay on Firestore so the board updates in real time
// ============================================================================
//
// Reads (not writes) remain direct Firestore listeners. Rules authorise them
// using values that exist in the auth token itself — `request.auth.uid` for
// ownership and a server-set role claim for managers — so they work regardless
// of whether the caller's Employees document is keyed by uid or by name.

export function subscribeProjects(
  cb: (projects: Project[]) => void,
  opts: { includeArchived?: boolean; onError?: (message: string) => void } = {}
): Unsubscribe {
  // Deliberately NO orderBy here. Filtering on `status` while sorting on
  // `createdAt` would need a composite index, and a project list is small
  // enough to sort on the client. One less index to deploy is one less way for
  // this screen to silently come up empty.
  return onSnapshot(
    query(collection(db, PROJECTS_COLLECTION)),
    (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Project[]
      const visible = opts.includeArchived ? all : all.filter((p) => p.status !== 'archived')
      visible.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
      cb(visible)
    },
    (err) => {
      // Surfacing this matters: an empty list and a permission/index failure
      // look identical on screen otherwise.
      console.error('[projectWork] projects listener error:', err)
      opts.onError?.(describeFirestoreError(err, 'projects'))
      cb([])
    }
  )
}

/** Turns a raw Firestore listener error into something actionable. */
export function describeFirestoreError(err: any, what: string): string {
  const code = err?.code || ''
  if (code === 'failed-precondition' || /requires an index/i.test(err?.message || '')) {
    return `The ${what} list needs a Firestore index that has not been created yet. ` +
      `Deploy indexes with: firebase deploy --only firestore:indexes`
  }
  if (code === 'permission-denied') {
    return `You do not have permission to read ${what}. If you were just given a role, ` +
      `sign out and back in to refresh your access.`
  }
  return `Could not load ${what}: ${err?.message || 'unknown error'}`
}

/**
 * Every signed-in employee gets the whole task list, so the board shows the
 * same picture to everyone.
 *
 * This used to fork: managers read the collection, everyone else got two narrow
 * queries (own tasks + claimable pool) unioned client-side. That is gone —
 * shared visibility is the point of the board, and the two-query union could
 * never show a colleague's task at all.
 *
 * Deliberately no `where`/`orderBy`: a filter combined with a sort needs a
 * composite index, and an undeployed index is a silent empty list. Sorting is
 * `sortTasks` at the call site; `projectId` narrowing happens in memory.
 */
export function subscribeProjectTasks(
  actor: Actor,
  cb: (tasks: ProjectTask[]) => void,
  opts: { projectId?: string; onError?: (message: string) => void } = {}
): Unsubscribe {
  const col = collection(db, PROJECT_TASKS_COLLECTION)
  let active: Unsubscribe | null = null
  let cancelled = false

  const deliver = (tasks: ProjectTask[]) => {
    if (cancelled) return
    cb(opts.projectId ? tasks.filter((t) => t.projectId === opts.projectId) : tasks)
  }

  const fail = (err: any) => {
    if (cancelled) return
    console.error('[projectWork] tasks listener error:', err)
    opts.onError?.(describeFirestoreError(err, 'project tasks'))
    cb([])
  }

  active = onSnapshot(
    query(col),
    (snap) => deliver(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as ProjectTask[]),
    (err: any) => {
      if (cancelled) return
      if (err?.code !== 'permission-denied') return fail(err)

      // Rules that predate shared visibility reject a whole-collection read,
      // and a rejected query returns nothing at all — the board would just be
      // empty with no way to tell why. Fall back to the two queries those older
      // rules do allow, so people can still see and take their work before
      // `firebase deploy --only firestore:rules` has run. Colleagues' tasks
      // stay hidden until it has.
      console.warn(
        '[projectWork] whole-collection read denied — falling back to per-user ' +
        'queries. Run: firebase deploy --only firestore:rules'
      )
      active?.()
      active = subscribeOwnAndClaimable(actor, deliver, fail)
    }
  )

  return () => {
    cancelled = true
    active?.()
  }
}

/**
 * The narrower pair the pre-shared-visibility rules permit: tasks assigned to
 * this UID, plus the open claimable pool. Both match on values carried in the
 * auth token, so neither needs an Employees lookup.
 */
function subscribeOwnAndClaimable(
  actor: Actor,
  deliver: (tasks: ProjectTask[]) => void,
  fail: (err: any) => void
): Unsubscribe {
  const col = collection(db, PROJECT_TASKS_COLLECTION)
  let mine: ProjectTask[] = []
  let pool: ProjectTask[] = []

  const emit = () => {
    const byId = new Map<string, ProjectTask>()
    for (const t of [...mine, ...pool]) if (t.id) byId.set(t.id, t)
    deliver(Array.from(byId.values()))
  }

  const unsubMine = onSnapshot(
    query(col, where('assignedToUid', '==', actor.uid)),
    (snap) => {
      mine = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as ProjectTask[]
      emit()
    },
    fail
  )

  const unsubPool = onSnapshot(
    query(col, where('status', '==', 'AVAILABLE'), where('allowClaiming', '==', true)),
    (snap) => {
      pool = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as ProjectTask[]
      emit()
    },
    fail
  )

  return () => {
    unsubMine()
    unsubPool()
  }
}

// ============================================================================
// AUDIT (read-only from the client; entries are written server-side)
// ============================================================================

export function subscribeTaskEvents(
  taskId: string,
  cb: (events: ProjectTaskEvent[]) => void,
  max = 50
): Unsubscribe {
  const q = query(
    collection(db, PROJECT_TASK_EVENTS_COLLECTION),
    where('taskId', '==', taskId),
    orderBy('at', 'desc'),
    limit(max)
  )
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as ProjectTaskEvent[]),
    (err) => {
      console.error('[projectWork] task events listener error:', err)
      cb([])
    }
  )
}

// ============================================================================
// MUTATIONS — all routed through /api/project-work
// ============================================================================
//
// Writes do NOT go straight to Firestore. The `Employees` collection has mixed
// document IDs (some keyed by Auth UID, some by employee name) and Firestore
// rules cannot run queries, so a rule can never resolve a name-keyed employee.
// The API route resolves identity with the Admin SDK (uid first, then a
// verified-email lookup) and performs the write itself. Firestore rules make
// these collections read-only to clients, so this is the only write path.

/** Obtains the caller's Firebase ID token. Set by the provider on mount. */
type TokenGetter = () => Promise<string | null | undefined>
let getIdToken: TokenGetter = async () => null

/** Registered once by the Project Work UI so this module can authenticate. */
export function setProjectWorkTokenGetter(fn: TokenGetter) {
  getIdToken = fn
}

async function callApi<T = any>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const token = await getIdToken()
  if (!token) throw new Error('Your session has expired. Please sign in again.')

  const res = await fetch('/api/project-work', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action, ...payload }),
  })

  let data: any = null
  try {
    data = await res.json()
  } catch {
    /* non-JSON error body */
  }

  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`)
  }
  return data as T
}

/** Identity as the server resolved it — useful for diagnosing ID mismatches. */
export interface WhoAmI {
  uid: string
  email: string | null
  name: string
  employeeId: string | null
  employeeDocId: string
  role: string | null
  department: string | null
  isManager: boolean
  resolvedBy: 'uid' | 'email'
}

export const whoAmI = () => callApi<WhoAmI>('whoami')

// ---------- projects ----------

export const createProject = (input: { name: string; description?: string }) =>
  callApi<{ id: string }>('createProject', input).then((r) => r.id)

export const setProjectArchived = (projectId: string, archived: boolean) =>
  callApi('archiveProject', { projectId, archived }).then(() => undefined)

/**
 * Permanently delete a project, all its tasks, and their audit history.
 * Admin / Co-Admin only, and unrecoverable — archive is the reversible option.
 */
export const deleteProject = (projectId: string) =>
  callApi<{ deletedTasks: number; deletedEvents: number }>('deleteProject', { projectId })

// ---------- tasks ----------

/**
 * An assignee as the client can describe them.
 *
 * Deliberately no `uid`: the client cannot determine another employee's Auth
 * UID, because a name-keyed Employees document does not contain or encode one.
 * The server resolves `email` -> uid via the Admin SDK.
 */
export interface AssigneeInput {
  employeeId: string | null
  name: string
  email?: string | null
}

export interface CreateTaskInput {
  projectId: string
  projectName: string
  title: string
  description?: string
  priority?: TaskPriority
  assignee?: AssigneeInput | null
  assignedRole?: string | null
  allowClaiming?: boolean
  dueDate?: string | null
  checklist?: ChecklistItem[]
  referenceUrl?: string | null
}

export const createProjectTask = (input: CreateTaskInput) =>
  callApi<{ id: string }>('createTask', input as any).then((r) => r.id)

export const updateProjectTask = (
  taskId: string,
  updates: Partial<
    Pick<ProjectTask, 'title' | 'description' | 'priority' | 'dueDate' |
      'assignedRole' | 'allowClaiming' | 'checklist' | 'referenceUrl' | 'progressStatus'>
  >
) => callApi('updateTask', { taskId, updates }).then(() => undefined)

export const assignProjectTask = (taskId: string, assignee: AssigneeInput | null) =>
  callApi('assignTask', { taskId, assignee }).then(() => undefined)

/** Atomic — the server runs a transaction, so only one claimer can win. */
export const claimProjectTask = (taskId: string) =>
  callApi('claimTask', { taskId }).then(() => undefined)

export const startProjectTask = (taskId: string) =>
  callApi('setOwnStatus', { taskId, status: 'IN_PROGRESS' }).then(() => undefined)

/** Furthest an employee can move a task: never CONFIRMED. */
export const submitProjectTask = (taskId: string, note: string | null) =>
  callApi('setOwnStatus', {
    taskId, status: 'COMPLETED_AWAITING_CONFIRMATION', note,
  }).then(() => undefined)

export const setTaskBlocked = (taskId: string, blocked: boolean, reason: string | null) =>
  callApi('setOwnStatus', {
    taskId, status: blocked ? 'BLOCKED' : 'IN_PROGRESS', note: reason,
  }).then(() => undefined)

/** Manager only — the single path into CONFIRMED. */
export const confirmProjectTask = (taskId: string, note?: string | null) =>
  callApi('confirmTask', { taskId, note }).then(() => undefined)

export const requestChangesOnTask = (taskId: string, reason: string) =>
  callApi('requestChanges', { taskId, reason }).then(() => undefined)

export const reopenProjectTask = (taskId: string, note?: string) =>
  callApi('reopenTask', { taskId, note }).then(() => undefined)

export const setTaskCancelled = (taskId: string, cancelled: boolean, reason?: string) =>
  callApi('cancelTask', { taskId, cancelled, reason }).then(() => undefined)

export const toggleChecklistItem = (taskId: string, itemId: string, done: boolean) =>
  callApi('toggleChecklist', { taskId, itemId, done }).then(() => undefined)

/**
 * Permanently delete a task and its audit history. Admin / Co-Admin only.
 * `setTaskCancelled` is the soft alternative that preserves the trail.
 */
export const deleteProjectTask = (taskId: string) =>
  callApi('deleteTask', { taskId }).then(() => undefined)

// ============================================================================
// PROGRESS — always derived from task data, never user-entered
// ============================================================================

export interface ProjectProgress {
  total: number
  counted: number
  confirmed: number
  byStatus: Record<ProjectTaskStatus, number>
  percent: number
}

export function computeProgress(tasks: ProjectTask[]): ProjectProgress {
  const byStatus = PROJECT_TASK_STATUSES.reduce(
    (acc, s) => ({ ...acc, [s]: 0 }),
    {} as Record<ProjectTaskStatus, number>
  )
  for (const t of tasks) if (byStatus[t.status] !== undefined) byStatus[t.status] += 1

  const counted = tasks.filter((t) => !PROGRESS_EXCLUDED_STATUSES.includes(t.status)).length
  const confirmed = tasks.filter((t) => PROGRESS_DONE_STATUSES.includes(t.status)).length

  return {
    total: tasks.length,
    counted,
    confirmed,
    byStatus,
    percent: counted === 0 ? 0 : Math.round((confirmed / counted) * 100),
  }
}

/**
 * Numeric-aware comparison, so "Task 10" sorts after "Task 9" rather than
 * between "Task 1" and "Task 2" the way a plain string compare would.
 */
const naturalOrder = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
})

/**
 * Tasks in ascending order: Task 1, Task 2 … Task 10 … Task 14, grouped by
 * project so two projects' numbering cannot interleave.
 *
 * This used to sort by priority and then newest-first, which scrambled the
 * numbering — the step you are meant to do first could land anywhere in the
 * list. Priority is still on the card as a badge; it just no longer decides
 * position. `createdAt` breaks ties for tasks whose titles aren't numbered.
 */
export function sortTasks(tasks: ProjectTask[]): ProjectTask[] {
  return [...tasks].sort((a, b) => {
    const byProject = naturalOrder.compare(a.projectName || '', b.projectName || '')
    if (byProject !== 0) return byProject

    const byTitle = naturalOrder.compare(a.title || '', b.title || '')
    if (byTitle !== 0) return byTitle

    return (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0)
  })
}
