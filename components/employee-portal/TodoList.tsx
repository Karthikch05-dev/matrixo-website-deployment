'use client'

/**
 * TO-DO LIST — the portal's personal + project work surface.
 *
 *   My To-Dos    — the personal checklist that used to live as a widget inside
 *                  DashboardOverview. Same `personalTodos` collection and the
 *                  same context functions, so nothing was migrated; it is only
 *                  rendered here now (with the full list rather than a
 *                  six-item preview).
 *   Project Work — team project execution. See ProjectWork.tsx.
 *
 * The separate Tasks module is deliberately untouched.
 */

import { useState, useMemo } from 'react'
import { FaListAlt, FaPlus, FaTrash, FaCheckCircle, FaSpinner, FaProjectDiagram } from 'react-icons/fa'
import { toast } from 'sonner'
import { useEmployeeAuth } from '@/lib/employeePortalContext'
import ProjectWork from './ProjectWork'

type Tab = 'todos' | 'project-work'

// ============================================================================
// MY TO-DOS
// ============================================================================

function MyTodos() {
  const { personalTodos = [], addPersonalTodo, updatePersonalTodo, deletePersonalTodo } = useEmployeeAuth()
  const [newTitle, setNewTitle] = useState('')
  const [adding, setAdding] = useState(false)

  // Open items first, then newest. Mirrors the old dashboard ordering.
  const sorted = useMemo(() => {
    return [...personalTodos].sort((a, b) => {
      if (a.status !== b.status) return a.status === 'completed' ? 1 : -1
      const ta = a.createdAt?.toMillis?.() ?? 0
      const tb = b.createdAt?.toMillis?.() ?? 0
      return tb - ta
    })
  }, [personalTodos])

  const openCount = sorted.filter((t) => t.status !== 'completed').length

  const add = async () => {
    const title = newTitle.trim()
    if (!title) return
    setAdding(true)
    try {
      await addPersonalTodo(title)
      setNewTitle('')
    } catch {
      toast.error('Could not add that to-do')
    } finally {
      setAdding(false)
    }
  }

  const toggle = async (id: string, status: string) => {
    try {
      await updatePersonalTodo(id, { status: status === 'completed' ? 'pending' : 'completed' })
    } catch {
      toast.error('Could not update that to-do')
    }
  }

  const remove = async (id: string) => {
    try {
      await deletePersonalTodo(id)
    } catch {
      toast.error('Could not delete that to-do')
    }
  }

  return (
    <div className="rounded-[20px] p-4 sm:p-6 bg-[#FFFFFF] dark:bg-[#101C30] border border-[rgba(15,23,42,0.06)] dark:border-[rgba(255,255,255,0.06)] shadow-[0_4px_20px_rgba(15,23,42,0.02)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
      <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center gap-2 text-[#0F172A] dark:text-[#F8FAFC]">
        <FaListAlt className="text-[#2563EB]" />
        My To-Dos
        {openCount > 0 && (
          <span className="text-sm font-normal text-[#64748B] dark:text-[#94A3B8]">
            ({openCount} open)
          </span>
        )}
      </h3>

      <div className="flex gap-2 mb-3 sm:mb-4">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="Add a new todo..."
          className="flex-1 px-3 py-2 rounded-lg sm:rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/50 min-w-0 transition-all text-[#0F172A] dark:text-[#F8FAFC] placeholder-[#64748B] dark:placeholder-[#94A3B8] bg-[#F5F7FB] dark:bg-[#152542] border border-[rgba(15,23,42,0.08)] dark:border-[rgba(255,255,255,0.08)]"
        />
        <button
          onClick={add}
          disabled={adding || !newTitle.trim()}
          aria-label="Add to-do"
          className="px-3 py-2 hover:bg-[#1D4ED8] disabled:bg-[#94A3B8] disabled:dark:bg-neutral-700 disabled:cursor-not-allowed rounded-lg sm:rounded-xl flex-shrink-0 cta-glass"
        >
          {adding ? <FaSpinner className="animate-spin" /> : <FaPlus />}
        </button>
      </div>

      {sorted.length === 0 ? (
        <p className="text-center py-6 text-[#64748B] dark:text-[#94A3B8]">
          No todos yet. Add one above!
        </p>
      ) : (
        /* The dashboard widget capped this at six; the dedicated page shows
           everything, which is the point of promoting it out of the widget. */
        <div className="space-y-2">
          {sorted.map((todo) => (
            <div
              key={todo.id}
              className={`flex items-center justify-between p-3 rounded-xl transition-all border border-[rgba(15,23,42,0.04)] dark:border-[rgba(255,255,255,0.04)] ${
                todo.status === 'completed'
                  ? 'bg-[#EEF3F8] dark:bg-[rgba(255,255,255,0.02)]'
                  : 'bg-[#F8FAFC] dark:bg-[rgba(255,255,255,0.05)] hover:bg-[#EEF3F8] dark:hover:bg-[rgba(255,255,255,0.08)]'
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <button
                  onClick={() => todo.id && toggle(todo.id, todo.status)}
                  aria-label={todo.status === 'completed' ? 'Mark as not done' : 'Mark as done'}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                    todo.status === 'completed'
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'border-[rgba(15,23,42,0.3)] dark:border-neutral-500 hover:border-[#2563EB]'
                  }`}
                >
                  {todo.status === 'completed' && <FaCheckCircle className="text-xs" />}
                </button>
                <span
                  className={`text-sm truncate ${
                    todo.status === 'completed'
                      ? 'text-[#94A3B8] dark:text-neutral-500 line-through'
                      : 'text-[#0F172A] dark:text-white'
                  }`}
                >
                  {todo.title}
                </span>
              </div>
              <button
                onClick={() => todo.id && remove(todo.id)}
                aria-label="Delete to-do"
                className="text-neutral-500 hover:text-red-400 transition-colors ml-2 p-1"
              >
                <FaTrash className="text-xs" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// PAGE
// ============================================================================

export function TodoList() {
  const [tab, setTab] = useState<Tab>('todos')

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'todos', label: 'My To-Dos', icon: <FaListAlt className="text-xs" /> },
    { id: 'project-work', label: 'Project Work', icon: <FaProjectDiagram className="text-xs" /> },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
          <FaListAlt className="text-[#2563EB]" />
          To-Do List
        </h2>
        <p className="text-sm text-[#64748B] dark:text-neutral-400 mt-1">
          Your personal checklist and the project work assigned to your team.
        </p>
      </div>

      <div className="flex items-center gap-1 p-1 bg-[#F1F5F9] dark:bg-neutral-900 rounded-lg border border-[rgba(15,23,42,0.06)] dark:border-transparent w-full sm:w-fit overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all flex-1 sm:flex-none justify-center ${
              tab === t.id
                ? 'bg-white text-[#0F172A] shadow-sm border border-[rgba(15,23,42,0.06)] dark:bg-primary-600 dark:text-white dark:border-transparent'
                : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[rgba(15,23,42,0.04)] dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'todos' ? <MyTodos /> : <ProjectWork />}
    </div>
  )
}

export default TodoList
