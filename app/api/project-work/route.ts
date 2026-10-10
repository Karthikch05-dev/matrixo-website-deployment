import { NextRequest, NextResponse } from 'next/server'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { getAdminAuth, getAdminFirestore } from '@/lib/firebaseAdmin'
import {
  resolveEmployee,
  isManagerRole,
  syncRoleClaim,
  type ResolvedEmployee,
} from '@/lib/employeeIdentity'

export const dynamic = 'force-dynamic'

/**
 * PROJECT WORK — server-side mutations.
 * ============================================================================
 * Every write goes through here rather than straight from the browser, for one
 * reason: the `Employees` collection has mixed document IDs (some keyed by Auth
 * UID, some by employee name). Firestore rules cannot query, so they cannot
 * resolve a name-keyed employee — but this route can, with the Admin SDK.
 *
 * Firestore rules make these collections read-only to clients, so this route is
 * the only write path and authorization cannot be bypassed by calling Firestore
 * directly.
 */

const TASKS = 'projectTasks'
const PROJECTS = 'projects'
const EVENTS = 'projectTaskEvents'

const MANAGER_ACTIONS = new Set([
  'createProject', 'updateProject', 'archiveProject',
  'createTask', 'assignTask',
  'confirmTask', 'requestChanges', 'reopenTask', 'cancelTask',
  'deleteTask', 'deleteProject',
])

type Ctx = { db: FirebaseFirestore.Firestore; me: ResolvedEmployee }

function bad(status: number, error: string, code?: string) {
  return NextResponse.json({ error, code }, { status })
}

/** Append to the immutable audit trail. Never throws into the caller's path. */
async function logEvent(
  db: FirebaseFirestore.Firestore,
  taskId: string,
  projectId: string,
  action: string,
  me: ResolvedEmployee,
  extra: { fromStatus?: string | null; toStatus?: string | null; note?: string | null } = {}
) {
  try {
    await db.collection(EVENTS).add({
      taskId,
      projectId,
      action,
      actorUid: me.uid,
      actorId: me.employeeId,
      actorName: me.name,
      at: FieldValue.serverTimestamp(),
      fromStatus: extra.fromStatus ?? null,
      toStatus: extra.toStatus ?? null,
      note: extra.note ?? null,
    })
  } catch (err) {
    console.error('[project-work] audit write failed:', action, err)
  }
}

/** Employees may only drive their OWN task, and only between working states. */
const EMPLOYEE_FROM = ['ASSIGNED', 'IN_PROGRESS', 'CHANGES_REQUESTED', 'BLOCKED']
const EMPLOYEE_TO = ['IN_PROGRESS', 'COMPLETED_AWAITING_CONFIRMATION', 'BLOCKED']

async function loadTask(db: FirebaseFirestore.Firestore, taskId: string) {
  const ref = db.collection(TASKS).doc(taskId)
  const snap = await ref.get()
  if (!snap.exists) return null
  return { ref, task: snap.data() as Record<string, any> }
}

function ownsTask(task: Record<string, any>, me: ResolvedEmployee) {
  // UID is the primary identity. employeeId is accepted as a legacy fallback so
  // tasks created before this change keep working.
  if (task.assignedToUid) return task.assignedToUid === me.uid
  return !!me.employeeId && task.assignedTo === me.employeeId
}

/**
 * Resolve an assignee to a stable Auth UID.
 *
 * The client cannot supply this: `EmployeeProfile` has no uid field, and for a
 * name-keyed Employees document the document ID is not the uid either. The one
 * reliable link is the employee's email, which Firebase Auth can map to a uid.
 * Returns null (leaving the task unassigned) rather than guessing.
 */
async function resolveAssignee(
  assignee: { employeeId?: string | null; name?: string; email?: string | null } | null
): Promise<{ uid: string | null; employeeId: string | null; name: string } | null> {
  if (!assignee) return null

  let uid: string | null = null
  if (assignee.email) {
    try {
      uid = (await getAdminAuth().getUserByEmail(assignee.email)).uid
    } catch {
      // No Auth user for that address yet (invited but never signed in).
      // The task still assigns by employeeId; it gains a uid once they log in.
      uid = null
    }
  }

  return {
    uid,
    employeeId: assignee.employeeId ?? null,
    name: assignee.name ?? 'Unknown',
  }
}

// ============================================================================
// HANDLERS
// ============================================================================

const handlers: Record<string, (ctx: Ctx, body: any) => Promise<NextResponse>> = {
  // ---------- identity ----------
  async whoami({ me }) {
    return NextResponse.json({
      uid: me.uid,
      email: me.email,
      name: me.name,
      employeeId: me.employeeId,
      employeeDocId: me.employeeDocId,
      role: me.role,
      department: me.department,
      isManager: isManagerRole(me.role),
      resolvedBy: me.resolvedBy,
    })
  },

  // ---------- projects ----------
  async createProject({ db, me }, { name, description }) {
    if (!name?.trim()) return bad(400, 'Project name is required')
    const ref = await db.collection(PROJECTS).add({
      name: name.trim(),
      description: (description || '').trim(),
      status: 'active',
      createdByUid: me.uid,
      createdBy: me.employeeId,
      createdByName: me.name,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      archivedAt: null,
    })
    return NextResponse.json({ id: ref.id })
  },

  async archiveProject({ db }, { projectId, archived }) {
    if (!projectId) return bad(400, 'projectId is required')
    await db.collection(PROJECTS).doc(projectId).update({
      status: archived ? 'archived' : 'active',
      archivedAt: archived ? FieldValue.serverTimestamp() : null,
      updatedAt: FieldValue.serverTimestamp(),
    })
    return NextResponse.json({ ok: true })
  },

  // ---------- tasks ----------
  async createTask({ db, me }, body) {
    const { projectId, projectName, title } = body
    if (!projectId || !title?.trim()) return bad(400, 'Project and task title are required')

    const assignee = await resolveAssignee(body.assignee || null)
    const status = assignee ? 'ASSIGNED' : body.allowClaiming ? 'AVAILABLE' : 'NOT_STARTED'

    const ref = await db.collection(TASKS).add({
      projectId,
      projectName: projectName || '',
      title: title.trim(),
      description: (body.description || '').trim(),
      priority: body.priority || 'medium',
      status,

      // UID is primary; the other two are kept for display and legacy matching.
      assignedToUid: assignee?.uid ?? null,
      assignedTo: assignee?.employeeId ?? null,
      assignedToName: assignee?.name ?? null,
      assignedRole: body.assignedRole || null,
      allowClaiming: assignee ? false : !!body.allowClaiming,

      dueDate: body.dueDate || null,
      checklist: Array.isArray(body.checklist) ? body.checklist : [],
      referenceUrl: body.referenceUrl || null,
      blockedReason: null,

      createdByUid: me.uid,
      createdBy: me.employeeId,
      createdByName: me.name,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),

      selectedByUid: null, selectedBy: null, selectedByName: null, selectedAt: null,
      completedByUid: null, completedBy: null, completedByName: null, completedAt: null,
      submissionNote: null,
      confirmedByUid: null, confirmedBy: null, confirmedByName: null, confirmedAt: null,
      reviewComment: null,
      submissionCount: 0,
    })

    await logEvent(db, ref.id, projectId, 'created', me, { toStatus: status })
    return NextResponse.json({ id: ref.id })
  },

  async updateTask({ db, me }, { taskId, updates }) {
    const found = await loadTask(db, taskId)
    if (!found) return bad(404, 'Task not found')

    const isManager = isManagerRole(me.role)
    const isOwner = ownsTask(found.task, me)

    if (!isManager && !isOwner) {
      return bad(403, 'Only the task owner, Admin, or Co-Admin can update progress.')
    }

    const allowed = isManager
      ? ['title', 'description', 'priority', 'dueDate', 'assignedRole',
         'allowClaiming', 'checklist', 'referenceUrl', 'progressStatus']
      : ['progressStatus']

    const payload: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() }
    let hasAllowedUpdates = false
    for (const k of allowed) {
      if (updates?.[k] !== undefined) {
        payload[k] = updates[k]
        hasAllowedUpdates = true
      }
    }

    if (!hasAllowedUpdates && !isManager) {
      return bad(403, 'Only an Admin or Co-Admin can do that.')
    }

    await found.ref.update(payload)
    await logEvent(db, taskId, found.task.projectId, 'updated', me)
    return NextResponse.json({ ok: true })
  },

  async assignTask({ db, me }, { taskId, assignee: raw }) {
    const found = await loadTask(db, taskId)
    if (!found) return bad(404, 'Task not found')
    const assignee = await resolveAssignee(raw || null)
    const had = !!found.task.assignedToUid || !!found.task.assignedTo

    const nextStatus = assignee
      ? ['NOT_STARTED', 'AVAILABLE'].includes(found.task.status) ? 'ASSIGNED' : found.task.status
      : 'AVAILABLE'

    await found.ref.update({
      assignedToUid: assignee?.uid ?? null,
      assignedTo: assignee?.employeeId ?? null,
      assignedToName: assignee?.name ?? null,
      status: nextStatus,
      allowClaiming: !assignee,
      updatedAt: FieldValue.serverTimestamp(),
    })

    await logEvent(db, taskId, found.task.projectId, had ? 'reassigned' : 'assigned', me, {
      fromStatus: found.task.status,
      toStatus: nextStatus,
      note: assignee ? `Assigned to ${assignee.name}` : 'Returned to the available pool',
    })
    return NextResponse.json({ ok: true })
  },

  /** Atomic claim — the transaction re-reads the doc, so only one caller wins. */
  async claimTask({ db, me }, { taskId }) {
    const ref = db.collection(TASKS).doc(taskId)
    let projectId = ''

    try {
      await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref)
        if (!snap.exists) throw new Error('NOT_FOUND')
        const task = snap.data() as Record<string, any>
        projectId = task.projectId

        if (task.assignedToUid || task.assignedTo) throw new Error('TAKEN')
        if (task.status !== 'AVAILABLE' || !task.allowClaiming) throw new Error('UNAVAILABLE')

        // No role/department gate. `assignedRole` is a label showing which team
        // a task was written for, not a restriction on who may pick it up — any
        // signed-in employee can take any unclaimed task. The transaction above
        // is what keeps two people from taking the same one.

        tx.update(ref, {
          assignedToUid: me.uid,
          assignedTo: me.employeeId,
          assignedToName: me.name,
          status: 'ASSIGNED',
          allowClaiming: false,
          selectedByUid: me.uid,
          selectedBy: me.employeeId,
          selectedByName: me.name,
          selectedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        })
      })
    } catch (err: any) {
      if (err?.message === 'NOT_FOUND') return bad(404, 'Task not found')
      if (err?.message === 'TAKEN') return bad(409, 'Someone else already took this task')
      if (err?.message === 'UNAVAILABLE') return bad(409, 'This task is no longer available')
      throw err
    }

    await logEvent(db, taskId, projectId, 'claimed', me, {
      fromStatus: 'AVAILABLE', toStatus: 'ASSIGNED', note: `Claimed by ${me.name}`,
    })
    return NextResponse.json({ ok: true })
  },

  /** Employee moves their own task forward. Cannot reach CONFIRMED. */
  async setOwnStatus({ db, me }, { taskId, status, note }) {
    const found = await loadTask(db, taskId)
    if (!found) return bad(404, 'Task not found')
    const { task, ref } = found

    // Work status belongs to whoever is doing the work -- the person it was
    // assigned to, or the person who took it from the claimable pool (claiming
    // sets assignedToUid, so the claimer IS the owner from that moment).
    //
    // Managers get no bypass here, deliberately. They drive a task through the
    // other handlers -- assign, confirm, requestChanges, reopen, cancel -- and
    // nothing is lost, but an Admin can no longer mark someone else's task
    // started or submit it on their behalf. A manager assigned to a task is its
    // owner like anyone else and acts through this path normally.
    if (!ownsTask(task, me)) return bad(403, 'This task is not assigned to you')

    if (!EMPLOYEE_FROM.includes(task.status)) {
      return bad(409, `You cannot change a task that is ${task.status}`)
    }
    if (!EMPLOYEE_TO.includes(status)) {
      return bad(403, 'You are not allowed to set that status')
    }

    const payload: Record<string, unknown> = { status, updatedAt: FieldValue.serverTimestamp() }

    if (status === 'COMPLETED_AWAITING_CONFIRMATION') {
      payload.completedByUid = me.uid
      payload.completedBy = me.employeeId
      payload.completedByName = me.name
      payload.completedAt = FieldValue.serverTimestamp()
      payload.submissionNote = note?.trim() || null
      payload.reviewComment = null
      payload.submissionCount = (task.submissionCount || 0) + 1
    }
    if (status === 'BLOCKED') {
      if (!note?.trim()) return bad(400, 'Please describe what is blocking this task')
      payload.blockedReason = note.trim()
    }
    if (status === 'IN_PROGRESS') payload.blockedReason = null

    await ref.update(payload)

    const action =
      status === 'COMPLETED_AWAITING_CONFIRMATION' ? 'submitted'
      : status === 'BLOCKED' ? 'blocked'
      : 'started'
    await logEvent(db, taskId, task.projectId, action, me, {
      fromStatus: task.status, toStatus: status, note: note?.trim() || null,
    })
    return NextResponse.json({ ok: true })
  },

  /** Manager confirms. The ONLY path into CONFIRMED. */
  async confirmTask({ db, me }, { taskId, note }) {
    const found = await loadTask(db, taskId)
    if (!found) return bad(404, 'Task not found')
    const { task, ref } = found

    if (task.status !== 'COMPLETED_AWAITING_CONFIRMATION') {
      return bad(409, 'Only work awaiting confirmation can be confirmed')
    }
    // A manager may not rubber-stamp their own submission.
    if (task.completedByUid && task.completedByUid === me.uid) {
      return bad(403, 'You cannot confirm work you completed yourself')
    }

    await ref.update({
      status: 'CONFIRMED',
      confirmedByUid: me.uid,
      confirmedBy: me.employeeId,
      confirmedByName: me.name,
      confirmedAt: FieldValue.serverTimestamp(),
      reviewComment: note?.trim() || null,
      updatedAt: FieldValue.serverTimestamp(),
    })

    await logEvent(db, taskId, task.projectId, 'confirmed', me, {
      fromStatus: task.status, toStatus: 'CONFIRMED', note: note?.trim() || null,
    })
    return NextResponse.json({ ok: true })
  },

  async requestChanges({ db, me }, { taskId, reason }) {
    if (!reason?.trim()) return bad(400, 'Please say what needs changing')
    const found = await loadTask(db, taskId)
    if (!found) return bad(404, 'Task not found')

    await found.ref.update({
      status: 'CHANGES_REQUESTED',
      reviewComment: reason.trim(),
      confirmedByUid: null, confirmedBy: null, confirmedByName: null, confirmedAt: null,
      updatedAt: FieldValue.serverTimestamp(),
    })
    await logEvent(db, taskId, found.task.projectId, 'changes_requested', me, {
      fromStatus: found.task.status, toStatus: 'CHANGES_REQUESTED', note: reason.trim(),
    })
    return NextResponse.json({ ok: true })
  },

  async reopenTask({ db, me }, { taskId, note }) {
    const found = await loadTask(db, taskId)
    if (!found) return bad(404, 'Task not found')
    await found.ref.update({
      status: 'IN_PROGRESS',
      confirmedByUid: null, confirmedBy: null, confirmedByName: null, confirmedAt: null,
      reviewComment: note?.trim() || null,
      updatedAt: FieldValue.serverTimestamp(),
    })
    await logEvent(db, taskId, found.task.projectId, 'reopened', me, {
      fromStatus: found.task.status, toStatus: 'IN_PROGRESS',
    })
    return NextResponse.json({ ok: true })
  },

  async cancelTask({ db, me }, { taskId, cancelled, reason }) {
    const found = await loadTask(db, taskId)
    if (!found) return bad(404, 'Task not found')
    const to = cancelled ? 'CANCELLED' : 'NOT_STARTED'
    await found.ref.update({ status: to, updatedAt: FieldValue.serverTimestamp() })
    await logEvent(db, taskId, found.task.projectId, cancelled ? 'cancelled' : 'restored', me, {
      fromStatus: found.task.status, toStatus: to, note: reason?.trim() || null,
    })
    return NextResponse.json({ ok: true })
  },


  /**
   * Permanently delete a task and its audit entries.
   *
   * Distinct from `cancelTask`, which is the soft option and keeps the history.
   * This is unrecoverable, so the UI confirms first. Events are removed too --
   * leaving them would orphan rows pointing at a task that no longer exists.
   */
  async deleteTask({ db, me }, { taskId }) {
    const found = await loadTask(db, taskId)
    if (!found) return bad(404, 'Task not found')

    const events = await db.collection(EVENTS).where('taskId', '==', taskId).get()
    const batch = db.batch()
    events.docs.forEach((d) => batch.delete(d.ref))
    batch.delete(found.ref)
    await batch.commit()

    console.log('[project-work] task deleted', {
      taskId, title: found.task.title, by: me.uid, events: events.size,
    })
    return NextResponse.json({ ok: true, deletedEvents: events.size })
  },

  /**
   * Permanently delete a project, every task in it, and their audit entries.
   *
   * Firestore has no cascade, so this is done explicitly. Batches cap at 500
   * writes, so deletions are chunked.
   */
  async deleteProject({ db, me }, { projectId }) {
    if (!projectId) return bad(400, 'projectId is required')

    const projectRef = db.collection(PROJECTS).doc(projectId)
    const project = await projectRef.get()
    if (!project.exists) return bad(404, 'Project not found')

    const tasks = await db.collection(TASKS).where('projectId', '==', projectId).get()
    const events = await db.collection(EVENTS).where('projectId', '==', projectId).get()

    const refs = [
      ...events.docs.map((d) => d.ref),
      ...tasks.docs.map((d) => d.ref),
      projectRef,
    ]

    // Firestore allows at most 500 operations per batch.
    for (let i = 0; i < refs.length; i += 450) {
      const batch = db.batch()
      refs.slice(i, i + 450).forEach((r) => batch.delete(r))
      await batch.commit()
    }

    console.log('[project-work] project deleted', {
      projectId, name: (project.data() as any)?.name,
      by: me.uid, tasks: tasks.size, events: events.size,
    })
    return NextResponse.json({ ok: true, deletedTasks: tasks.size, deletedEvents: events.size })
  },

  async toggleChecklist({ db, me }, { taskId, itemId, done }) {
    const found = await loadTask(db, taskId)
    if (!found) return bad(404, 'Task not found')
    if (!isManagerRole(me.role) && !ownsTask(found.task, me)) {
      return bad(403, 'This task is not assigned to you')
    }
    const checklist = (found.task.checklist || []).map((it: any) =>
      it.id === itemId ? { ...it, done: !!done } : it
    )
    await found.ref.update({ checklist, updatedAt: FieldValue.serverTimestamp() })
    return NextResponse.json({ ok: true })
  },
}

// ============================================================================
// ENTRY POINT
// ============================================================================

export async function POST(request: NextRequest) {
  let body: any
  try {
    body = await request.json()
  } catch {
    return bad(400, 'Invalid request body')
  }

  const action = body?.action
  if (!action || !handlers[action]) return bad(400, `Unknown action: ${action}`)

  // Resolve identity against BOTH document shapes (uid-keyed and name-keyed).
  const identity = await resolveEmployee(request)
  if (!identity.ok) return bad(identity.status, identity.error, identity.code)
  const me = identity.employee

  // Keep the auth claim in step with the record, so Firestore rules can
  // recognise managers without reading `Employees`.
  await syncRoleClaim(me)

  if (MANAGER_ACTIONS.has(action) && !isManagerRole(me.role)) {
    return bad(403, 'Only an Admin or Co-Admin can do that.', 'NOT_MANAGER')
  }

  try {
    return await handlers[action]({ db: getAdminFirestore(), me }, body)
  } catch (err: any) {
    console.error('[project-work] action failed:', action, err)
    return bad(500, 'Something went wrong. Please try again.')
  }
}
