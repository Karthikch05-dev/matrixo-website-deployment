'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FaBriefcase,
  FaPlus,
  FaEdit,
  FaTrash,
  FaLock,
  FaUnlock,
  FaMapMarkerAlt,
  FaClock,
  FaUsers,
  FaEye,
  FaChevronDown,
  FaChevronRight,
  FaSpinner,
  FaClipboardList,
  FaFileAlt
} from 'react-icons/fa'
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, Timestamp, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebaseConfig'
import { useEmployeeAuth } from '@/lib/employeePortalContext'
import { Card, Button, Input, Textarea, Select, Modal, Badge, Alert } from './ui'
import { toast } from 'sonner'

// ============================================
// TYPES
// ============================================

interface JobRole {
  id: string
  title: string
  description: string
  team: string
  location: string
  type: string
  status: 'open' | 'closed'
  responsibilities: string[]
  eligibility: string[]
  customQuestions: string[]
  requireResume: boolean
  createdAt: any
  createdBy: string
  createdByName: string
}

interface JobApplication {
  id: string
  roleId: string
  roleTitle: string
  fullName: string
  email: string
  phone: string
  college: string
  yearOrExperience: string
  resumeURL: string
  customAnswers: Record<string, string>
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected'
  submittedAt: any
}

// ============================================
// JOB FORM MODAL
// ============================================

function JobFormModal({
  isOpen,
  onClose,
  editingRole
}: {
  isOpen: boolean
  onClose: () => void
  editingRole?: JobRole | null
}) {
  const { employee } = useEmployeeAuth()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    team: '',
    location: 'Remote',
    type: 'Internship',
    responsibilities: '',
    eligibility: '',
    customQuestions: '',
    requireResume: true
  })

  useEffect(() => {
    if (isOpen && editingRole) {
      setForm({
        title: editingRole.title,
        description: editingRole.description,
        team: editingRole.team,
        location: editingRole.location,
        type: editingRole.type,
        responsibilities: editingRole.responsibilities?.join('\n') || '',
        eligibility: editingRole.eligibility?.join('\n') || '',
        customQuestions: editingRole.customQuestions?.join('\n') || '',
        requireResume: editingRole.requireResume ?? true
      })
    } else if (isOpen) {
      setForm({
        title: '',
        description: '',
        team: '',
        location: 'Remote',
        type: 'Internship',
        responsibilities: '',
        eligibility: '',
        customQuestions: '',
        requireResume: true
      })
    }
  }, [isOpen, editingRole])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.description.trim() || !form.team.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const roleData = {
        title: form.title.trim(),
        description: form.description.trim(),
        team: form.team.trim(),
        location: form.location,
        type: form.type,
        responsibilities: form.responsibilities.split('\n').filter(r => r.trim()),
        eligibility: form.eligibility.split('\n').filter(e => e.trim()),
        customQuestions: form.customQuestions.split('\n').filter(q => q.trim()),
        requireResume: form.requireResume,
        status: 'open' as const,
        createdBy: employee?.employeeId || '',
        createdByName: employee?.name || '',
        createdAt: Timestamp.now()
      }

      if (editingRole?.id) {
        await updateDoc(doc(db, 'roles', editingRole.id), roleData)
        toast.success('Job posting updated')
      } else {
        await addDoc(collection(db, 'roles'), roleData)
        toast.success('Job posting created')
      }
      onClose()
    } catch (error) {
      console.error('Error saving job posting:', error)
      toast.error('Failed to save job posting')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingRole ? 'Edit Job Posting' : 'Create Job Posting'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto -mx-6 px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Job Title *"
            placeholder="e.g., Full Stack Developer Intern"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <Input
            label="Team / Department *"
            placeholder="e.g., Engineering"
            value={form.team}
            onChange={(e) => setForm({ ...form, team: e.target.value })}
            required
          />
        </div>

        <Textarea
          label="Description *"
          placeholder="Describe the role, expectations, and what the candidate will be working on..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={4}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Location"
            options={[
              { value: 'Remote', label: 'Remote' },
              { value: 'On-site', label: 'On-site' },
              { value: 'Hybrid', label: 'Hybrid' }
            ]}
            value={form.location}
            onChange={(value) => setForm({ ...form, location: value })}
          />
          <Select
            label="Type"
            options={[
              { value: 'Internship', label: 'Internship' },
              { value: 'Full-time', label: 'Full-time' },
              { value: 'Part-time', label: 'Part-time' },
              { value: 'Contract', label: 'Contract' }
            ]}
            value={form.type}
            onChange={(value) => setForm({ ...form, type: value })}
          />
        </div>

        <Textarea
          label="Responsibilities (one per line)"
          placeholder={"Design and develop web features\nWrite clean, maintainable code\nParticipate in code reviews"}
          value={form.responsibilities}
          onChange={(e) => setForm({ ...form, responsibilities: e.target.value })}
          rows={3}
        />

        <Textarea
          label="Eligibility / Requirements (one per line)"
          placeholder={"Knowledge of React/Next.js\nFamiliarity with Git\nGood communication skills"}
          value={form.eligibility}
          onChange={(e) => setForm({ ...form, eligibility: e.target.value })}
          rows={3}
        />

        <Textarea
          label="Custom Questions for Applicants (one per line)"
          placeholder={"Why do you want to join matriXO?\nShare a link to your portfolio or GitHub\nWhat's your availability?"}
          value={form.customQuestions}
          onChange={(e) => setForm({ ...form, customQuestions: e.target.value })}
          rows={3}
        />

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="requireResume"
            checked={form.requireResume}
            onChange={(e) => setForm({ ...form, requireResume: e.target.checked })}
            className="w-4 h-4 rounded border-neutral-700 bg-neutral-800 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="requireResume" className="text-sm text-neutral-300">
            Require resume upload from applicants
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>
            {editingRole ? 'Update Posting' : 'Create Posting'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ============================================
// APPLICATION VIEWER MODAL
// ============================================

function ApplicationsModal({
  isOpen,
  onClose,
  role,
  applications
}: {
  isOpen: boolean
  onClose: () => void
  role: JobRole
  applications: JobApplication[]
}) {
  const roleApps = applications.filter(a => a.roleId === role.id)
  
  const handleUpdateStatus = async (appId: string, newStatus: JobApplication['status']) => {
    try {
      await updateDoc(doc(db, 'applications', appId), { status: newStatus })
      toast.success(`Application ${newStatus}`)
    } catch (err) {
      toast.error('Failed to update status')
    }
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-500/15 text-amber-400',
    reviewed: 'bg-blue-500/15 text-blue-400',
    shortlisted: 'bg-emerald-500/15 text-emerald-400',
    rejected: 'bg-red-500/15 text-red-400'
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Applications for ${role.title}`} size="lg">
      <div className="max-h-[70vh] overflow-y-auto -mx-6 px-6 space-y-3">
        {roleApps.length === 0 ? (
          <div className="text-center py-12">
            <FaClipboardList className="text-3xl text-neutral-600 mx-auto mb-3" />
            <p className="text-neutral-400">No applications yet</p>
          </div>
        ) : (
          roleApps.map((app) => (
            <div key={app.id} className="p-4 bg-neutral-800/50 border border-neutral-700 rounded-xl">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-semibold">{app.fullName}</h4>
                  <p className="text-xs text-neutral-400 mt-0.5">{app.email} • {app.phone}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{app.college} • {app.yearOrExperience}</p>
                  {app.submittedAt && (
                    <p className="text-[10px] text-neutral-600 mt-1">
                      Applied {app.submittedAt?.toDate ? app.submittedAt.toDate().toLocaleDateString() : new Date(app.submittedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${statusColors[app.status] || statusColors.pending}`}>
                  {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                </span>
              </div>

              {/* Custom Answers */}
              {app.customAnswers && Object.keys(app.customAnswers).length > 0 && (
                <div className="mt-3 space-y-2 border-t border-neutral-700/50 pt-3">
                  {Object.entries(app.customAnswers).map(([question, answer]) => (
                    <div key={question}>
                      <p className="text-[11px] text-neutral-500 font-medium">{question}</p>
                      <p className="text-xs text-neutral-300 mt-0.5">{answer}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Resume */}
              {app.resumeURL && (
                <a
                  href={app.resumeURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-xs text-blue-400 hover:text-blue-300"
                >
                  <FaFileAlt className="text-[10px]" />
                  View Resume
                </a>
              )}

              {/* Status Actions */}
              <div className="flex gap-2 mt-3 pt-2 border-t border-neutral-800">
                {(['reviewed', 'shortlisted', 'rejected'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => handleUpdateStatus(app.id, s)}
                    disabled={app.status === s}
                    className={`text-[10px] px-2 py-1 rounded-lg font-medium transition-all disabled:opacity-30 ${
                      s === 'shortlisted' ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' :
                      s === 'rejected' ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' :
                      'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
                    }`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </Modal>
  )
}

// ============================================
// MAIN JOB POSTINGS COMPONENT
// ============================================

export default function JobPostings() {
  const { employee } = useEmployeeAuth()
  const isAdmin = employee?.role === 'admin'

  const [roles, setRoles] = useState<JobRole[]>([])
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingRole, setEditingRole] = useState<JobRole | null>(null)
  const [viewingApps, setViewingApps] = useState<JobRole | null>(null)

  // Realtime listener for roles
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'roles'),
      (snapshot) => {
        const fetchedRoles: JobRole[] = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        } as JobRole))
        fetchedRoles.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
        setRoles(fetchedRoles)
        setLoading(false)
      },
      (err) => {
        console.error('Error fetching roles:', err)
        setLoading(false)
      }
    )
    return () => unsubscribe()
  }, [])

  // Realtime listener for applications
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'applications'),
      (snapshot) => {
        const apps: JobApplication[] = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        } as JobApplication))
        setApplications(apps)
      },
      (err) => console.error('Error fetching applications:', err)
    )
    return () => unsubscribe()
  }, [])

  const handleToggleStatus = async (role: JobRole) => {
    try {
      const newStatus = role.status === 'open' ? 'closed' : 'open'
      await updateDoc(doc(db, 'roles', role.id), { status: newStatus })
      toast.success(`Posting ${newStatus === 'open' ? 'opened' : 'closed'}`)
    } catch (err) {
      toast.error('Failed to update status')
    }
  }

  const handleDelete = async (roleId: string) => {
    if (!confirm('Delete this job posting? This cannot be undone.')) return
    try {
      await deleteDoc(doc(db, 'roles', roleId))
      toast.success('Job posting deleted')
    } catch (err) {
      toast.error('Failed to delete posting')
    }
  }

  if (!isAdmin) {
    return (
      <Card padding="lg">
        <div className="text-center py-8">
          <FaLock className="text-3xl text-neutral-600 mx-auto mb-3" />
          <p className="text-neutral-400">Admin access required</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <FaBriefcase className="text-cyan-400" />
            Job Postings
          </h2>
          <p className="text-neutral-500 text-xs mt-0.5">
            {roles.filter(r => r.status === 'open').length} active • {applications.length} total applications
          </p>
        </div>
        <Button size="sm" icon={<FaPlus />} onClick={() => { setEditingRole(null); setShowForm(true) }}>
          New Posting
        </Button>
      </div>

      {/* Roles List */}
      {loading ? (
        <Card padding="lg">
          <div className="flex items-center justify-center py-12">
            <FaSpinner className="animate-spin text-2xl text-primary-500" />
          </div>
        </Card>
      ) : roles.length === 0 ? (
        <Card padding="lg">
          <div className="text-center py-12">
            <FaBriefcase className="text-3xl text-neutral-600 mx-auto mb-3" />
            <p className="text-neutral-400 text-sm">No job postings yet</p>
            <p className="text-neutral-500 text-xs mt-1">Click "New Posting" to create one. It will appear on the careers page.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {roles.map((role) => {
              const appCount = applications.filter(a => a.roleId === role.id).length
              const pendingCount = applications.filter(a => a.roleId === role.id && a.status === 'pending').length

              return (
                <motion.div
                  key={role.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  layout
                >
                  <Card className="hover:border-neutral-600 transition-all">
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold text-white">{role.title}</h3>
                            <Badge
                              variant={role.status === 'open' ? 'success' : 'default'}
                              size="sm"
                            >
                              {role.status === 'open' ? 'Open' : 'Closed'}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-neutral-400">
                            <span className="flex items-center gap-1">
                              <FaUsers className="text-[10px]" />
                              {role.team}
                            </span>
                            <span className="flex items-center gap-1">
                              <FaMapMarkerAlt className="text-[10px]" />
                              {role.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <FaClock className="text-[10px]" />
                              {role.type}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-500 mt-2 line-clamp-2">{role.description}</p>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => setViewingApps(role)}
                            className="relative p-2 text-neutral-400 hover:bg-blue-500/10 hover:text-blue-400 rounded-lg transition-all"
                            title={`View ${appCount} applications`}
                          >
                            <FaEye className="text-xs" />
                            {pendingCount > 0 && (
                              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                                {pendingCount}
                              </span>
                            )}
                          </button>
                          <button
                            onClick={() => { setEditingRole(role); setShowForm(true) }}
                            className="p-2 text-neutral-400 hover:bg-blue-500/10 hover:text-blue-400 rounded-lg transition-all"
                            title="Edit"
                          >
                            <FaEdit className="text-xs" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(role)}
                            className={`p-2 rounded-lg transition-all ${
                              role.status === 'open'
                                ? 'text-neutral-400 hover:bg-amber-500/10 hover:text-amber-400'
                                : 'text-emerald-400 hover:bg-emerald-500/10'
                            }`}
                            title={role.status === 'open' ? 'Close posting' : 'Reopen posting'}
                          >
                            {role.status === 'open' ? <FaLock className="text-xs" /> : <FaUnlock className="text-xs" />}
                          </button>
                          <button
                            onClick={() => handleDelete(role.id)}
                            className="p-2 text-neutral-400 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-all"
                            title="Delete"
                          >
                            <FaTrash className="text-xs" />
                          </button>
                        </div>
                      </div>

                      {/* App count */}
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-neutral-800 text-[11px] text-neutral-500">
                        <span>{appCount} application{appCount !== 1 ? 's' : ''}</span>
                        {pendingCount > 0 && (
                          <span className="text-amber-400">{pendingCount} pending review</span>
                        )}
                        {role.customQuestions?.length > 0 && (
                          <span>{role.customQuestions.length} custom question{role.customQuestions.length !== 1 ? 's' : ''}</span>
                        )}
                        {role.requireResume && <span>Resume required</span>}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Modals */}
      <JobFormModal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingRole(null) }}
        editingRole={editingRole}
      />

      {viewingApps && (
        <ApplicationsModal
          isOpen={!!viewingApps}
          onClose={() => setViewingApps(null)}
          role={viewingApps}
          applications={applications}
        />
      )}
    </div>
  )
}
