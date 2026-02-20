'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import {
  FaBriefcase, FaPlus, FaEdit, FaTrash, FaLock, FaUnlock,
  FaMapMarkerAlt, FaClock, FaUsers, FaEye, FaSpinner, FaClipboardList,
  FaFileAlt, FaGripVertical, FaCopy, FaChevronDown, FaChevronUp,
  FaStar, FaArrowDown, FaArrowUp, FaCheck, FaTimes, FaExternalLinkAlt,
  FaFilePdf, FaEnvelope, FaPhone, FaUniversity, FaCalendarAlt,
  FaFilter, FaSearch, FaDownload
} from 'react-icons/fa'
import {
  MdShortText, MdSubject, MdRadioButtonChecked, MdCheckBox,
  MdArrowDropDownCircle, MdCloudUpload, MdLinearScale, MdStar,
  MdDateRange, MdAccessTime
} from 'react-icons/md'
import { collection, addDoc, updateDoc, doc, deleteDoc, Timestamp, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebaseConfig'
import { useEmployeeAuth } from '@/lib/employeePortalContext'
import { Card, Button, Input, Textarea, Select, Modal, Badge, Alert } from './ui'
import { toast } from 'sonner'
import type { FormQuestion } from '@/components/careers/ApplicationForm'
import { normalizeQuestions } from '@/components/careers/ApplicationForm'

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
  customQuestions: FormQuestion[] | string[]
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
  resumeFileName?: string
  customAnswers: Record<string, any>
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected'
  submittedAt: any
}

// ============================================
// QUESTION TYPE CONFIG
// ============================================

const QUESTION_TYPES: { value: FormQuestion['type']; label: string; icon: any; description: string }[] = [
  { value: 'short-answer', label: 'Short answer', icon: MdShortText, description: 'Single line text' },
  { value: 'paragraph', label: 'Paragraph', icon: MdSubject, description: 'Multi-line text' },
  { value: 'multiple-choice', label: 'Multiple choice', icon: MdRadioButtonChecked, description: 'Select one option' },
  { value: 'checkboxes', label: 'Checkboxes', icon: MdCheckBox, description: 'Select multiple options' },
  { value: 'dropdown', label: 'Dropdown', icon: MdArrowDropDownCircle, description: 'Select from list' },
  { value: 'file-upload', label: 'File upload', icon: MdCloudUpload, description: 'Upload a file' },
  { value: 'linear-scale', label: 'Linear scale', icon: MdLinearScale, description: 'Numeric scale' },
  { value: 'rating', label: 'Rating', icon: MdStar, description: 'Star rating' },
  { value: 'date', label: 'Date', icon: MdDateRange, description: 'Date picker' },
  { value: 'time', label: 'Time', icon: MdAccessTime, description: 'Time picker' },
]

function getTypeConfig(type: string) {
  return QUESTION_TYPES.find(t => t.value === type) || QUESTION_TYPES[0]
}

function generateId() {
  return `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function createEmptyQuestion(order: number): FormQuestion {
  return {
    id: generateId(),
    type: 'short-answer',
    title: '',
    description: '',
    required: false,
    options: [],
    validation: null,
    scaleConfig: { min: 1, max: 5, minLabel: '', maxLabel: '' },
    ratingMax: 5,
    order,
  }
}

// ============================================
// QUESTION EDITOR CARD (Google Forms Style)
// ============================================

function QuestionEditorCard({
  question,
  onUpdate,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  question: FormQuestion
  onUpdate: (q: FormQuestion) => void
  onDelete: () => void
  onDuplicate: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  isFirst: boolean
  isLast: boolean
}) {
  const [showTypeMenu, setShowTypeMenu] = useState(false)
  const [showValidation, setShowValidation] = useState(!!question.validation && question.validation.type !== 'none')
  const typeConfig = getTypeConfig(question.type)
  const TypeIcon = typeConfig.icon

  const needsOptions = ['multiple-choice', 'checkboxes', 'dropdown'].includes(question.type)

  const handleAddOption = () => {
    onUpdate({ ...question, options: [...question.options, `Option ${question.options.length + 1}`] })
  }

  const handleRemoveOption = (index: number) => {
    onUpdate({ ...question, options: question.options.filter((_, i) => i !== index) })
  }

  const handleOptionChange = (index: number, value: string) => {
    const updated = [...question.options]
    updated[index] = value
    onUpdate({ ...question, options: updated })
  }

  return (
    <div className="bg-neutral-800/60 border border-neutral-700 rounded-2xl overflow-hidden group hover:border-neutral-600 transition-all">
      {/* Drag Handle */}
      <div className="flex justify-center py-1.5 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity">
        <FaGripVertical className="text-neutral-600 text-xs" />
      </div>

      <div className="px-4 pb-4 space-y-3">
        {/* Title & Type Row */}
        <div className="flex gap-3 items-start">
          <div className="flex-1">
            <input
              value={question.title}
              onChange={(e) => onUpdate({ ...question, title: e.target.value })}
              placeholder="Question title"
              className="w-full bg-transparent border-0 border-b-2 border-neutral-700 focus:border-primary-500 text-white text-sm font-medium py-2 px-0 focus:outline-none focus:ring-0 transition-colors placeholder:text-neutral-500"
            />
          </div>

          {/* Type Selector */}
          <div className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowTypeMenu(!showTypeMenu)}
              className="flex items-center gap-2 px-3 py-2 bg-neutral-700/50 hover:bg-neutral-700 rounded-lg text-xs text-neutral-300 transition-all border border-neutral-600"
            >
              <TypeIcon className="text-base" />
              <span className="hidden sm:inline">{typeConfig.label}</span>
              <FaChevronDown className="text-[8px] text-neutral-500" />
            </button>

            <AnimatePresence>
              {showTypeMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowTypeMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -5, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -5, scale: 0.95 }}
                    className="absolute right-0 top-full mt-1 z-50 bg-neutral-800 border border-neutral-700 rounded-xl shadow-2xl min-w-[220px] py-1 overflow-hidden"
                  >
                    {QUESTION_TYPES.map(({ value, label, icon: Icon, description }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          const updates: Partial<FormQuestion> = { type: value as FormQuestion['type'] }
                          if (['multiple-choice', 'checkboxes', 'dropdown'].includes(value) && question.options.length === 0) {
                            updates.options = ['Option 1']
                          }
                          onUpdate({ ...question, ...updates })
                          setShowTypeMenu(false)
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-neutral-700/50 transition-all ${
                          question.type === value ? 'bg-primary-500/10 text-primary-400' : 'text-neutral-300'
                        }`}
                      >
                        <Icon className="text-lg flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium">{label}</p>
                          <p className="text-[10px] text-neutral-500">{description}</p>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Description */}
        <input
          value={question.description}
          onChange={(e) => onUpdate({ ...question, description: e.target.value })}
          placeholder="Description (optional)"
          className="w-full bg-transparent text-xs text-neutral-400 py-1 border-0 border-b border-transparent hover:border-neutral-700 focus:border-neutral-600 focus:outline-none focus:ring-0 transition-colors placeholder:text-neutral-600"
        />

        {/* Options Editor (for MC, Checkboxes, Dropdown) */}
        {needsOptions && (
          <div className="space-y-2 pt-1">
            {question.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-neutral-500 text-xs w-4 text-center">
                  {question.type === 'multiple-choice' ? '○' : question.type === 'checkboxes' ? '☐' : `${i + 1}.`}
                </span>
                <input
                  value={opt}
                  onChange={(e) => handleOptionChange(i, e.target.value)}
                  className="flex-1 bg-transparent text-sm text-neutral-300 py-1.5 border-0 border-b border-neutral-700 focus:border-neutral-500 focus:outline-none focus:ring-0 transition-colors"
                />
                {question.options.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(i)}
                    className="p-1 text-neutral-600 hover:text-red-400 transition-colors"
                  >
                    <FaTimes className="text-[10px]" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddOption}
              className="flex items-center gap-2 text-xs text-neutral-500 hover:text-primary-400 transition-colors py-1"
            >
              <FaPlus className="text-[8px]" />
              Add option
            </button>
          </div>
        )}

        {/* Scale Config */}
        {question.type === 'linear-scale' && (
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-neutral-500 mb-1 block">Min</label>
                <input
                  type="number"
                  value={question.scaleConfig?.min || 1}
                  onChange={(e) => onUpdate({ ...question, scaleConfig: { ...(question.scaleConfig || { min: 1, max: 5, minLabel: '', maxLabel: '' }), min: parseInt(e.target.value) || 0 } })}
                  className="w-full bg-neutral-700/50 text-sm text-neutral-300 rounded-lg px-3 py-1.5 border border-neutral-600 focus:border-primary-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-neutral-500 mb-1 block">Max</label>
                <input
                  type="number"
                  value={question.scaleConfig?.max || 5}
                  onChange={(e) => onUpdate({ ...question, scaleConfig: { ...(question.scaleConfig || { min: 1, max: 5, minLabel: '', maxLabel: '' }), max: parseInt(e.target.value) || 10 } })}
                  className="w-full bg-neutral-700/50 text-sm text-neutral-300 rounded-lg px-3 py-1.5 border border-neutral-600 focus:border-primary-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                value={question.scaleConfig?.minLabel || ''}
                onChange={(e) => onUpdate({ ...question, scaleConfig: { ...(question.scaleConfig || { min: 1, max: 5, minLabel: '', maxLabel: '' }), minLabel: e.target.value } })}
                placeholder="Min label (optional)"
                className="bg-neutral-700/50 text-xs text-neutral-300 rounded-lg px-3 py-1.5 border border-neutral-600 focus:border-primary-500 focus:outline-none placeholder:text-neutral-600"
              />
              <input
                value={question.scaleConfig?.maxLabel || ''}
                onChange={(e) => onUpdate({ ...question, scaleConfig: { ...(question.scaleConfig || { min: 1, max: 5, minLabel: '', maxLabel: '' }), maxLabel: e.target.value } })}
                placeholder="Max label (optional)"
                className="bg-neutral-700/50 text-xs text-neutral-300 rounded-lg px-3 py-1.5 border border-neutral-600 focus:border-primary-500 focus:outline-none placeholder:text-neutral-600"
              />
            </div>
          </div>
        )}

        {/* Rating Config */}
        {question.type === 'rating' && (
          <div className="flex items-center gap-3 pt-1">
            <label className="text-xs text-neutral-400">Max stars:</label>
            <select
              value={question.ratingMax || 5}
              onChange={(e) => onUpdate({ ...question, ratingMax: parseInt(e.target.value) })}
              className="bg-neutral-700/50 text-xs text-neutral-300 rounded-lg px-3 py-1.5 border border-neutral-600 focus:border-primary-500 focus:outline-none"
            >
              {[3, 4, 5, 6, 7, 8, 9, 10].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <div className="flex gap-0.5 ml-2">
              {Array.from({ length: question.ratingMax || 5 }, (_, i) => (
                <FaStar key={i} className="text-amber-400 text-xs" />
              ))}
            </div>
          </div>
        )}

        {/* Validation Toggle */}
        {['short-answer', 'paragraph'].includes(question.type) && (
          <div>
            <button
              type="button"
              onClick={() => {
                setShowValidation(!showValidation)
                if (!showValidation && !question.validation) {
                  onUpdate({ ...question, validation: { type: 'none' } })
                }
              }}
              className="text-[10px] text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              {showValidation ? '▾ Hide validation' : '▸ Response validation'}
            </button>

            {showValidation && (
              <div className="mt-2 space-y-2 pl-2 border-l-2 border-neutral-700">
                <select
                  value={question.validation?.type || 'none'}
                  onChange={(e) => onUpdate({ ...question, validation: { ...(question.validation || { type: 'none' }), type: e.target.value as any } })}
                  className="bg-neutral-700/50 text-xs text-neutral-300 rounded-lg px-3 py-1.5 border border-neutral-600 focus:border-primary-500 focus:outline-none"
                >
                  <option value="none">No validation</option>
                  <option value="number">Number</option>
                  <option value="length">Length</option>
                  <option value="regex">Regular expression</option>
                </select>

                {question.validation && question.validation.type !== 'none' && (
                  <div className="grid grid-cols-2 gap-2">
                    {question.validation.type === 'regex' ? (
                      <input
                        value={question.validation.pattern || ''}
                        onChange={(e) => onUpdate({ ...question, validation: { ...question.validation!, pattern: e.target.value } })}
                        placeholder="Regex pattern"
                        className="col-span-2 bg-neutral-700/50 text-xs text-neutral-300 rounded-lg px-3 py-1.5 border border-neutral-600 focus:border-primary-500 focus:outline-none placeholder:text-neutral-600"
                      />
                    ) : (
                      <>
                        <input
                          type="number"
                          value={question.validation.min ?? ''}
                          onChange={(e) => onUpdate({ ...question, validation: { ...question.validation!, min: e.target.value ? Number(e.target.value) : undefined } })}
                          placeholder={question.validation.type === 'length' ? 'Min length' : 'Min value'}
                          className="bg-neutral-700/50 text-xs text-neutral-300 rounded-lg px-3 py-1.5 border border-neutral-600 focus:border-primary-500 focus:outline-none placeholder:text-neutral-600"
                        />
                        <input
                          type="number"
                          value={question.validation.max ?? ''}
                          onChange={(e) => onUpdate({ ...question, validation: { ...question.validation!, max: e.target.value ? Number(e.target.value) : undefined } })}
                          placeholder={question.validation.type === 'length' ? 'Max length' : 'Max value'}
                          className="bg-neutral-700/50 text-xs text-neutral-300 rounded-lg px-3 py-1.5 border border-neutral-600 focus:border-primary-500 focus:outline-none placeholder:text-neutral-600"
                        />
                      </>
                    )}
                    <input
                      value={question.validation?.errorMessage || ''}
                      onChange={(e) => onUpdate({ ...question, validation: { ...question.validation!, errorMessage: e.target.value } })}
                      placeholder="Custom error message"
                      className="col-span-2 bg-neutral-700/50 text-xs text-neutral-300 rounded-lg px-3 py-1.5 border border-neutral-600 focus:border-primary-500 focus:outline-none placeholder:text-neutral-600"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer: Required toggle + Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-neutral-700/50">
          <div className="flex items-center gap-1">
            <button type="button" onClick={onDuplicate} className="p-2 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-700/50 rounded-lg transition-all" title="Duplicate">
              <FaCopy className="text-xs" />
            </button>
            <button type="button" onClick={onDelete} className="p-2 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all" title="Delete">
              <FaTrash className="text-xs" />
            </button>
            {!isFirst && (
              <button type="button" onClick={onMoveUp} className="p-2 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-700/50 rounded-lg transition-all" title="Move up">
                <FaArrowUp className="text-xs" />
              </button>
            )}
            {!isLast && (
              <button type="button" onClick={onMoveDown} className="p-2 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-700/50 rounded-lg transition-all" title="Move down">
                <FaArrowDown className="text-xs" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-neutral-500">Required</span>
            <button
              type="button"
              onClick={() => onUpdate({ ...question, required: !question.required })}
              className={`relative w-9 h-5 rounded-full transition-all ${question.required ? 'bg-primary-500' : 'bg-neutral-600'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${question.required ? 'left-[18px]' : 'left-0.5'}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// JOB FORM MODAL (with Question Builder)
// ============================================

function JobFormModal({
  isOpen,
  onClose,
  editingRole,
}: {
  isOpen: boolean
  onClose: () => void
  editingRole?: JobRole | null
}) {
  const { employee } = useEmployeeAuth()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'questions'>('details')

  const [form, setForm] = useState({
    title: '',
    description: '',
    team: '',
    location: 'Remote',
    type: 'Internship',
    responsibilities: '',
    eligibility: '',
    requireResume: true,
  })

  const [questions, setQuestions] = useState<FormQuestion[]>([])

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
        requireResume: editingRole.requireResume ?? true,
      })
      setQuestions(normalizeQuestions(editingRole.customQuestions))
      setActiveTab('details')
    } else if (isOpen) {
      setForm({
        title: '',
        description: '',
        team: '',
        location: 'Remote',
        type: 'Internship',
        responsibilities: '',
        eligibility: '',
        requireResume: true,
      })
      setQuestions([])
      setActiveTab('details')
    }
  }, [isOpen, editingRole])

  const handleAddQuestion = () => {
    setQuestions(prev => [...prev, createEmptyQuestion(prev.length)])
  }

  const handleUpdateQuestion = (id: string, updated: FormQuestion) => {
    setQuestions(prev => prev.map(q => q.id === id ? updated : q))
  }

  const handleDeleteQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id).map((q, i) => ({ ...q, order: i })))
  }

  const handleDuplicateQuestion = (q: FormQuestion) => {
    const newQ = { ...q, id: generateId(), order: q.order + 0.5 }
    setQuestions(prev => [...prev, newQ].sort((a, b) => a.order - b.order).map((q, i) => ({ ...q, order: i })))
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    setQuestions(prev => {
      const arr = [...prev]
      ;[arr[index], arr[index - 1]] = [arr[index - 1], arr[index]]
      return arr.map((q, i) => ({ ...q, order: i }))
    })
  }

  const handleMoveDown = (index: number) => {
    setQuestions(prev => {
      if (index >= prev.length - 1) return prev
      const arr = [...prev]
      ;[arr[index], arr[index + 1]] = [arr[index + 1], arr[index]]
      return arr.map((q, i) => ({ ...q, order: i }))
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.description.trim() || !form.team.trim()) {
      toast.error('Please fill in all required fields (title, description, team)')
      return
    }

    // Validate questions have titles
    const invalidQ = questions.find(q => !q.title.trim())
    if (invalidQ) {
      toast.error('All questions must have a title')
      setActiveTab('questions')
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
        customQuestions: questions,
        requireResume: form.requireResume,
        status: editingRole?.status || ('open' as const),
        createdBy: employee?.employeeId || '',
        createdByName: employee?.name || '',
        createdAt: editingRole?.createdAt || Timestamp.now(),
        updatedAt: Timestamp.now(),
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
      <form onSubmit={handleSubmit}>
        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-neutral-800/50 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'details' ? 'bg-primary-500/20 text-primary-400' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Job Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('questions')}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'questions' ? 'bg-primary-500/20 text-primary-400' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Questions
            {questions.length > 0 && (
              <span className="bg-primary-500/30 text-primary-300 text-[9px] px-1.5 py-0.5 rounded-full">{questions.length}</span>
            )}
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto -mx-6 px-6">
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Job Title *" placeholder="e.g., Full Stack Developer Intern" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                <Input label="Team / Department *" placeholder="e.g., Engineering" value={form.team} onChange={(e) => setForm({ ...form, team: e.target.value })} required />
              </div>
              <Textarea label="Description *" placeholder="Describe the role, expectations, and what the candidate will be working on..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} required />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select label="Location" options={[{ value: 'Remote', label: 'Remote' }, { value: 'On-site', label: 'On-site' }, { value: 'Hybrid', label: 'Hybrid' }]} value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
                <Select label="Type" options={[{ value: 'Internship', label: 'Internship' }, { value: 'Full-time', label: 'Full-time' }, { value: 'Part-time', label: 'Part-time' }, { value: 'Contract', label: 'Contract' }]} value={form.type} onChange={(v) => setForm({ ...form, type: v })} />
              </div>
              <Textarea label="Responsibilities (one per line)" placeholder={"Design and develop web features\nWrite clean, maintainable code"} value={form.responsibilities} onChange={(e) => setForm({ ...form, responsibilities: e.target.value })} rows={3} />
              <Textarea label="Eligibility / Requirements (one per line)" placeholder={"Knowledge of React/Next.js\nFamiliarity with Git"} value={form.eligibility} onChange={(e) => setForm({ ...form, eligibility: e.target.value })} rows={3} />

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="requireResumeCheckbox"
                  checked={form.requireResume}
                  onChange={(e) => setForm({ ...form, requireResume: e.target.checked })}
                  className="w-4 h-4 rounded border-neutral-700 bg-neutral-800 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="requireResumeCheckbox" className="text-sm text-neutral-300">Require resume upload from applicants</label>
              </div>
            </div>
          )}

          {/* Questions Tab (Google Forms Builder) */}
          {activeTab === 'questions' && (
            <div className="space-y-3">
              {questions.length === 0 ? (
                <div className="text-center py-12">
                  <FaClipboardList className="text-3xl text-neutral-600 mx-auto mb-3" />
                  <p className="text-neutral-400 text-sm mb-1">No custom questions yet</p>
                  <p className="text-neutral-500 text-xs mb-4">Add questions for applicants to answer alongside their basic details</p>
                  <Button size="sm" icon={<FaPlus />} onClick={handleAddQuestion}>Add Question</Button>
                </div>
              ) : (
                <>
                  {questions.sort((a, b) => a.order - b.order).map((q, index) => (
                    <QuestionEditorCard
                      key={q.id}
                      question={q}
                      onUpdate={(updated) => handleUpdateQuestion(q.id, updated)}
                      onDelete={() => handleDeleteQuestion(q.id)}
                      onDuplicate={() => handleDuplicateQuestion(q)}
                      onMoveUp={() => handleMoveUp(index)}
                      onMoveDown={() => handleMoveDown(index)}
                      isFirst={index === 0}
                      isLast={index === questions.length - 1}
                    />
                  ))}

                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-neutral-700 hover:border-primary-500 rounded-xl text-neutral-400 hover:text-primary-400 transition-all text-sm"
                  >
                    <FaPlus className="text-xs" /> Add Question
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center gap-3 pt-4 border-t border-neutral-800 mt-4">
          <p className="text-[10px] text-neutral-600">
            {questions.length} question{questions.length !== 1 ? 's' : ''} • {form.requireResume ? 'Resume required' : 'No resume'}
          </p>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>{editingRole ? 'Update Posting' : 'Create Posting'}</Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}

// ============================================
// ENHANCED APPLICATION VIEWER MODAL
// ============================================

function ApplicationsModal({
  isOpen,
  onClose,
  role,
  applications,
}: {
  isOpen: boolean
  onClose: () => void
  role: JobRole
  applications: JobApplication[]
}) {
  const roleApps = applications.filter(a => a.roleId === role.id)
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Debug: Log when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log(`🔍 Opening applications modal for role: ${role.title}`)
      console.log(`   Total applications passed to modal: ${applications.length}`)
      console.log(`   Applications for this role (${role.id}): ${roleApps.length}`)
      if (roleApps.length > 0) {
        console.log(`   Application details:`, roleApps.map(a => ({ name: a.fullName, status: a.status, roleId: a.roleId })))
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, role.title, role.id, applications.length, roleApps.length])

  const filtered = roleApps
    .filter(a => filterStatus === 'all' || a.status === filterStatus)
    .filter(a =>
      !searchQuery ||
      a.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.college?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0))

  const handleUpdateStatus = async (appId: string, newStatus: JobApplication['status']) => {
    try {
      await updateDoc(doc(db, 'applications', appId), { status: newStatus })
      toast.success(`Application marked as ${newStatus}`)
    } catch (err) {
      toast.error('Failed to update status')
    }
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    reviewed: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    shortlisted: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    rejected: 'bg-red-500/15 text-red-400 border-red-500/20',
  }

  const statusCount = (s: string) => roleApps.filter(a => a.status === s).length

  // Detailed app view
  if (selectedApp) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Application Details" size="lg">
        <div className="max-h-[75vh] overflow-y-auto -mx-6 px-6">
          <button
            type="button"
            onClick={() => setSelectedApp(null)}
            className="flex items-center gap-2 text-xs text-neutral-400 hover:text-neutral-200 mb-4 transition-colors"
          >
            ← Back to all applications
          </button>

          {/* Applicant Header */}
          <div className="bg-neutral-800/50 border border-neutral-700 rounded-2xl p-5 mb-4">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedApp.fullName}</h3>
                <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium mt-1 border ${statusColors[selectedApp.status] || statusColors.pending}`}>
                  {selectedApp.status.charAt(0).toUpperCase() + selectedApp.status.slice(1)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-neutral-300">
                <FaEnvelope className="text-xs text-neutral-500" />
                <a href={`mailto:${selectedApp.email}`} className="hover:text-primary-400 transition-colors">{selectedApp.email}</a>
              </div>
              <div className="flex items-center gap-2 text-neutral-300">
                <FaPhone className="text-xs text-neutral-500" />
                <a href={`tel:${selectedApp.phone}`} className="hover:text-primary-400 transition-colors">{selectedApp.phone}</a>
              </div>
              <div className="flex items-center gap-2 text-neutral-300">
                <FaUniversity className="text-xs text-neutral-500" />
                {selectedApp.college}
              </div>
              <div className="flex items-center gap-2 text-neutral-300">
                <FaBriefcase className="text-xs text-neutral-500" />
                {selectedApp.yearOrExperience}
              </div>
              <div className="flex items-center gap-2 text-neutral-400 text-xs sm:col-span-2">
                <FaCalendarAlt className="text-[10px]" />
                Applied {selectedApp.submittedAt?.toDate ? selectedApp.submittedAt.toDate().toLocaleString() : new Date(selectedApp.submittedAt).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Resume */}
          {selectedApp.resumeURL && (
            <div className="bg-neutral-800/50 border border-neutral-700 rounded-2xl p-4 mb-4">
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <FaFilePdf className="text-red-400" /> Resume
              </h4>
              <div className="flex items-center gap-3">
                <a
                  href={selectedApp.resumeURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-xl text-sm transition-all"
                >
                  <FaExternalLinkAlt className="text-xs" /> View Resume
                </a>
                <a
                  href={selectedApp.resumeURL}
                  download
                  className="flex items-center gap-2 px-4 py-2 bg-neutral-700/50 text-neutral-300 hover:bg-neutral-700 rounded-xl text-sm transition-all"
                >
                  <FaDownload className="text-xs" /> Download
                </a>
                {(selectedApp as any).resumeFileName && (
                  <span className="text-xs text-neutral-500">{(selectedApp as any).resumeFileName}</span>
                )}
              </div>
            </div>
          )}

          {/* Custom Answers */}
          {selectedApp.customAnswers && Object.keys(selectedApp.customAnswers).length > 0 && (
            <div className="bg-neutral-800/50 border border-neutral-700 rounded-2xl p-4 mb-4">
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <FaClipboardList className="text-primary-400" /> Responses
              </h4>
              <div className="space-y-4">
                {Object.entries(selectedApp.customAnswers).map(([question, answer]) => (
                  <div key={question} className="border-b border-neutral-700/50 pb-3 last:border-0 last:pb-0">
                    <p className="text-xs text-neutral-400 font-medium mb-1">{question}</p>
                    <p className="text-sm text-neutral-200 whitespace-pre-wrap">
                      {Array.isArray(answer) ? answer.join(', ') : String(answer)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status Actions */}
          <div className="bg-neutral-800/50 border border-neutral-700 rounded-2xl p-4">
            <h4 className="text-sm font-semibold text-white mb-3">Update Status</h4>
            <div className="flex flex-wrap gap-2">
              {(['pending', 'reviewed', 'shortlisted', 'rejected'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => handleUpdateStatus(selectedApp.id, s)}
                  disabled={selectedApp.status === s}
                  className={`px-4 py-2 rounded-xl text-xs font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed border ${
                    selectedApp.status === s
                      ? statusColors[s]
                      : 'bg-neutral-700/30 text-neutral-400 border-neutral-600 hover:bg-neutral-700 hover:text-neutral-200'
                  }`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Applications for ${role.title}`} size="lg">
      <div className="max-h-[75vh] overflow-y-auto -mx-6 px-6">
        {/* Stats Bar */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { key: 'all', label: `All (${roleApps.length})`, color: 'bg-neutral-700/50 text-neutral-300' },
            { key: 'pending', label: `Pending (${statusCount('pending')})`, color: 'bg-amber-500/10 text-amber-400' },
            { key: 'reviewed', label: `Reviewed (${statusCount('reviewed')})`, color: 'bg-blue-500/10 text-blue-400' },
            { key: 'shortlisted', label: `Shortlisted (${statusCount('shortlisted')})`, color: 'bg-emerald-500/10 text-emerald-400' },
            { key: 'rejected', label: `Rejected (${statusCount('rejected')})`, color: 'bg-red-500/10 text-red-400' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilterStatus(f.key)}
              className={`text-[10px] px-2.5 py-1 rounded-lg font-medium transition-all border ${
                filterStatus === f.key ? `${f.color} border-current` : 'bg-neutral-800/50 text-neutral-500 border-transparent hover:text-neutral-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search */}
        {roleApps.length > 3 && (
          <div className="relative mb-3">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-xs" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search applicants..."
              className="w-full pl-8 pr-4 py-2 bg-neutral-800/50 border border-neutral-700 rounded-xl text-xs text-neutral-300 focus:border-primary-500 focus:outline-none"
            />
          </div>
        )}

        {/* Applications List */}
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <FaClipboardList className="text-3xl text-neutral-600 mx-auto mb-3" />
            <p className="text-neutral-400 text-sm">{searchQuery || filterStatus !== 'all' ? 'No matching applications' : 'No applications yet'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((app) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-neutral-800/50 border border-neutral-700 rounded-xl hover:border-neutral-600 transition-all cursor-pointer group"
                onClick={() => setSelectedApp(app)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-white font-semibold text-sm group-hover:text-primary-400 transition-colors">{app.fullName}</h4>
                      {app.resumeURL && <FaFilePdf className="text-[10px] text-red-400" title="Has resume" />}
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5">{app.email} • {app.phone}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{app.college} • {app.yearOrExperience}</p>
                    {app.submittedAt && (
                      <p className="text-[10px] text-neutral-600 mt-1">
                        Applied {app.submittedAt?.toDate ? app.submittedAt.toDate().toLocaleDateString() : new Date(app.submittedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded-full font-medium border ${statusColors[app.status] || statusColors.pending}`}>
                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                  </span>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 mt-3 pt-2 border-t border-neutral-800">
                  {(['reviewed', 'shortlisted', 'rejected'] as const).map(s => (
                    <button
                      key={s}
                      onClick={(e) => { e.stopPropagation(); handleUpdateStatus(app.id, s) }}
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
                  <span className="flex-1" />
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedApp(app) }}
                    className="text-[10px] px-2 py-1 rounded-lg font-medium text-primary-400 bg-primary-500/10 hover:bg-primary-500/20 transition-all"
                  >
                    View Details →
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
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

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'roles'), (snap) => {
      const fetched: JobRole[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as JobRole))
      fetched.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      setRoles(fetched)
      setLoading(false)
    }, () => setLoading(false))
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!isAdmin) {
      console.log('⚠️ User is not admin, skipping application fetch')
      return
    }
    
    console.log('📊 Setting up applications listener for admin:', employee?.name)
    const applicationsRef = collection(db, 'applications')
    
    const unsub = onSnapshot(
      applicationsRef,
      (snap) => {
        const fetchedApps = snap.docs.map(d => ({ id: d.id, ...d.data() } as JobApplication))
        console.log(`✅ Fetched ${fetchedApps.length} total applications (all roles, all users)`)
        setApplications(fetchedApps)
      },
      (error) => {
        console.error('❌ Error fetching applications:', error)
        toast.error('Failed to load applications. Check console for details.')
        setApplications([])
      }
    )
    return () => unsub()
  }, [isAdmin, employee?.name])

  const handleToggleStatus = async (role: JobRole) => {
    try {
      const newStatus = role.status === 'open' ? 'closed' : 'open'
      await updateDoc(doc(db, 'roles', role.id), { status: newStatus })
      toast.success(`Posting ${newStatus === 'open' ? 'opened' : 'closed'}`)
    } catch (error) {
      console.error('Error toggling status:', error)
      toast.error('Failed to update status')
    }
  }

  const handleDelete = async (roleId: string) => {
    if (!confirm('Delete this job posting? This cannot be undone.')) return
    try {
      await deleteDoc(doc(db, 'roles', roleId))
      toast.success('Job posting deleted')
    } catch { toast.error('Failed to delete posting') }
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
        <Button size="sm" icon={<FaPlus />} onClick={() => { setEditingRole(null); setShowForm(true) }}>New Posting</Button>
      </div>

      {loading ? (
        <Card padding="lg"><div className="flex items-center justify-center py-12"><FaSpinner className="animate-spin text-2xl text-primary-500" /></div></Card>
      ) : roles.length === 0 ? (
        <Card padding="lg">
          <div className="text-center py-12">
            <FaBriefcase className="text-3xl text-neutral-600 mx-auto mb-3" />
            <p className="text-neutral-400 text-sm">No job postings yet</p>
            <p className="text-neutral-500 text-xs mt-1">Click &quot;New Posting&quot; to create one. It will appear on the careers page.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {roles.map((role) => {
              const appCount = applications.filter(a => a.roleId === role.id).length
              const pendingCount = applications.filter(a => a.roleId === role.id && a.status === 'pending').length
              const questions = normalizeQuestions(role.customQuestions)
              
              // Debug logging for application counts
              if (appCount > 0) {
                console.log(`📊 Role "${role.title}" (ID: ${role.id}): ${appCount} applications, ${pendingCount} pending`)
              }

              return (
                <motion.div key={role.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} layout>
                  <Card className="hover:border-neutral-600 transition-all">
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold text-white">{role.title}</h3>
                            <Badge variant={role.status === 'open' ? 'success' : 'default'} size="sm">{role.status === 'open' ? 'Open' : 'Closed'}</Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-neutral-400">
                            <span className="flex items-center gap-1"><FaUsers className="text-[10px]" />{role.team}</span>
                            <span className="flex items-center gap-1"><FaMapMarkerAlt className="text-[10px]" />{role.location}</span>
                            <span className="flex items-center gap-1"><FaClock className="text-[10px]" />{role.type}</span>
                          </div>
                          <p className="text-xs text-neutral-500 mt-2 line-clamp-2">{role.description}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => setViewingApps(role)} className="relative p-2 text-neutral-400 hover:bg-blue-500/10 hover:text-blue-400 rounded-lg transition-all" title={`View ${appCount} applications`}>
                            <FaEye className="text-xs" />
                            {pendingCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{pendingCount}</span>}
                          </button>
                          <button onClick={() => { setEditingRole(role); setShowForm(true) }} className="p-2 text-neutral-400 hover:bg-blue-500/10 hover:text-blue-400 rounded-lg transition-all" title="Edit"><FaEdit className="text-xs" /></button>
                          <button onClick={() => handleToggleStatus(role)} className={`p-2 rounded-lg transition-all ${role.status === 'open' ? 'text-neutral-400 hover:bg-amber-500/10 hover:text-amber-400' : 'text-emerald-400 hover:bg-emerald-500/10'}`} title={role.status === 'open' ? 'Close posting' : 'Reopen posting'}>
                            {role.status === 'open' ? <FaLock className="text-xs" /> : <FaUnlock className="text-xs" />}
                          </button>
                          <button onClick={() => handleDelete(role.id)} className="p-2 text-neutral-400 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-all" title="Delete"><FaTrash className="text-xs" /></button>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-neutral-800 text-[11px] text-neutral-500">
                        <span>{appCount} application{appCount !== 1 ? 's' : ''}</span>
                        {pendingCount > 0 && <span className="text-amber-400">{pendingCount} pending review</span>}
                        {questions.length > 0 && <span>{questions.length} custom question{questions.length !== 1 ? 's' : ''}</span>}
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

      <JobFormModal isOpen={showForm} onClose={() => { setShowForm(false); setEditingRole(null) }} editingRole={editingRole} />
      {viewingApps && <ApplicationsModal isOpen={!!viewingApps} onClose={() => setViewingApps(null)} role={viewingApps} applications={applications} />}
    </div>
  )
}
