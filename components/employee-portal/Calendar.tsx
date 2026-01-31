'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FaCalendarAlt, 
  FaPlus, 
  FaChevronLeft, 
  FaChevronRight,
  FaTimes,
  FaUmbrellaBeach,
  FaBuilding,
  FaStar,
  FaBullhorn,
  FaClock,
  FaFlag,
  FaUsers,
  FaEdit,
  FaTrash,
  FaBriefcase
} from 'react-icons/fa'
import { useEmployeeAuth, Holiday, CalendarEvent } from '@/lib/employeePortalContext'
import { Card, Button, Input, Textarea, Select, Modal, Badge, Alert } from './ui'
import { toast } from 'sonner'

// ============================================
// CALENDAR TYPES
// ============================================

interface CalendarDay {
  date: Date
  dateString: string
  isCurrentMonth: boolean
  isToday: boolean
  isWeekend: boolean
  holiday?: Holiday
  events: CalendarEvent[]
}

const departmentVisibilityLabels: Record<string, string> = {
  all: 'All Departments',
  interns: 'Interns',
  management: 'Management'
}

// ============================================
// ADD HOLIDAY MODAL
// ============================================

function AddHolidayModal({ 
  isOpen, 
  onClose, 
  editingHoliday 
}: { 
  isOpen: boolean
  onClose: () => void
  editingHoliday?: Holiday | null
}) {
  const { addHoliday, updateHoliday } = useEmployeeAuth()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    date: editingHoliday?.date || '',
    name: editingHoliday?.name || '',
    description: editingHoliday?.description || '',
    type: editingHoliday?.type || 'company'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.date || !form.name) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      if (editingHoliday?.id) {
        await updateHoliday(editingHoliday.id, {
          date: form.date,
          name: form.name,
          description: form.description,
          type: form.type as Holiday['type']
        })
        toast.success('Holiday updated successfully')
      } else {
        await addHoliday({
          date: form.date,
          name: form.name,
          description: form.description,
          type: form.type as Holiday['type']
        })
        toast.success('Holiday added successfully')
      }
      onClose()
    } catch (error) {
      toast.error('Failed to save holiday')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingHoliday ? 'Edit Holiday' : 'Add Holiday'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Date"
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          required
        />
        <Input
          label="Holiday Name"
          placeholder="e.g., Diwali, Christmas"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <Textarea
          label="Description (Optional)"
          placeholder="Additional details about the holiday..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={2}
        />
        <Select
          label="Holiday Type"
          options={[
            { value: 'public', label: 'Public Holiday' },
            { value: 'company', label: 'Company Holiday' },
            { value: 'optional', label: 'Optional Holiday' }
          ]}
          value={form.type}
          onChange={(value) => setForm({ ...form, type: value as 'public' | 'company' | 'optional' })}
        />
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>
            {editingHoliday ? 'Update Holiday' : 'Add Holiday'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ============================================
// ADD EVENT MODAL
// ============================================

function AddEventModal({ 
  isOpen, 
  onClose,
  selectedDate,
  editingEvent
}: { 
  isOpen: boolean
  onClose: () => void
  selectedDate?: string
  editingEvent?: CalendarEvent | null
}) {
  const { addCalendarEvent, updateCalendarEvent } = useEmployeeAuth()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    endDate: '',
    type: 'event',
    color: '#6366f1',
    departmentVisibility: 'all'
  })

  // Reset form when modal opens or editing event changes
  useEffect(() => {
    if (isOpen) {
      setForm({
        title: editingEvent?.title || '',
        description: editingEvent?.description || '',
        date: editingEvent?.date || selectedDate || '',
        endDate: editingEvent?.endDate || '',
        type: editingEvent?.type || 'event',
        color: editingEvent?.color || '#6366f1',
        departmentVisibility: editingEvent?.departmentVisibility || 'all'
      })
    }
  }, [isOpen, editingEvent, selectedDate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.date || !form.title.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const eventData = {
        title: form.title.trim(),
        date: form.date,
        type: form.type as CalendarEvent['type'],
        departmentVisibility: form.departmentVisibility as CalendarEvent['departmentVisibility'],
        ...(form.description.trim() && { description: form.description.trim() }),
        ...(form.endDate && { endDate: form.endDate }),
        ...(form.color && { color: form.color })
      }

      if (editingEvent?.id) {
        await updateCalendarEvent(editingEvent.id, eventData)
        toast.success('Event updated successfully')
      } else {
        await addCalendarEvent(eventData)
        toast.success('Event added successfully')
      }
      onClose()
    } catch (error: any) {
      console.error('Calendar event error:', error)
      toast.error(error?.message || 'Failed to save event')
    } finally {
      setLoading(false)
    }
  }

  const eventTypeIcons = {
    event: <FaStar />,
    deadline: <FaFlag />,
    meeting: <FaUsers />,
    announcement: <FaBullhorn />
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingEvent ? 'Edit Event' : 'Add Event'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Event Title"
          placeholder="e.g., Team Meeting, Project Deadline"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <Textarea
          label="Description (Optional)"
          placeholder="Event details..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={2}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Start Date"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
          />
          <Input
            label="End Date (Optional)"
            type="date"
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
          />
        </div>
        <Select
          label="Event Type"
          options={[
            { value: 'event', label: '⭐ Event' },
            { value: 'deadline', label: '🚩 Deadline' },
            { value: 'meeting', label: '👥 Meeting' },
            { value: 'announcement', label: '📢 Announcement' }
          ]}
          value={form.type}
          onChange={(value) => setForm({ ...form, type: value as 'event' | 'deadline' | 'meeting' | 'announcement' })}
        />
        <Select
          label="Department Visibility"
          options={[
            { value: 'all', label: 'All Departments' },
            { value: 'interns', label: 'Interns' },
            { value: 'management', label: 'Management' }
          ]}
          value={form.departmentVisibility}
          onChange={(value) => setForm({ ...form, departmentVisibility: value as 'all' | 'interns' | 'management' })}
        />
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>
            {editingEvent ? 'Update Event' : 'Add Event'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ============================================
// MAIN CALENDAR COMPONENT
// ============================================

export function Calendar() {
  const { employee, holidays, calendarEvents, isHoliday, deleteCalendarEvent } = useEmployeeAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showAddHoliday, setShowAddHoliday] = useState(false)
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [viewMode, setViewMode] = useState<'month' | 'list'>('month')
  // State for the day details panel (right side)
  const [panelSelectedDay, setPanelSelectedDay] = useState<CalendarDay | null>(null)

  const isAdmin = employee?.role === 'admin'

  // Helper to get local date string without UTC conversion
  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    
    const days: CalendarDay[] = []
    const today = new Date()
    const todayString = getLocalDateString(today)
    
    // Add days from previous month
    const startPadding = firstDay.getDay()
    for (let i = startPadding - 1; i >= 0; i--) {
      const date = new Date(year, month, -i)
      const dateString = getLocalDateString(date)
      days.push({
        date,
        dateString,
        isCurrentMonth: false,
        isToday: dateString === todayString,
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        holiday: holidays.find(h => h.date === dateString),
        events: calendarEvents.filter(e => e.date === dateString || (e.endDate && e.date <= dateString && e.endDate >= dateString))
      })
    }
    
    // Add days of current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day)
      const dateString = getLocalDateString(date)
      const dayOfWeek = date.getDay()
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
      
      // Check if there's a working day override for this weekend
      const workingDayOverride = holidays.find(h => h.date === dateString && h.name === '__WORKING_DAY__')
      
      // Auto-generate weekend holidays if not already marked and no working day override
      let holidayForDay = holidays.find(h => h.date === dateString && h.name !== '__WORKING_DAY__')
      if (isWeekend && !holidayForDay && !workingDayOverride) {
        holidayForDay = {
          date: dateString,
          name: dayOfWeek === 0 ? 'Sunday' : 'Saturday',
          type: 'company',
          description: 'Weekend',
          createdBy: 'system',
          createdByName: 'System',
          createdAt: { toDate: () => date } as any,
          isAutoHoliday: true // Mark as auto-generated
        }
      }
      
      days.push({
        date,
        dateString,
        isCurrentMonth: true,
        isToday: dateString === todayString,
        isWeekend: isWeekend && !workingDayOverride, // Not a weekend if override exists
        holiday: holidayForDay,
        events: calendarEvents.filter(e => e.date === dateString || (e.endDate && e.date <= dateString && e.endDate >= dateString))
      })
    }
    
    // Add days from next month
    const remainingDays = 42 - days.length // 6 rows of 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i)
      const dateString = getLocalDateString(date)
      const workingDayOverride = holidays.find(h => h.date === dateString && h.name === '__WORKING_DAY__')
      days.push({
        date,
        dateString,
        isCurrentMonth: false,
        isToday: dateString === todayString,
        isWeekend: (date.getDay() === 0 || date.getDay() === 6) && !workingDayOverride,
        holiday: holidays.find(h => h.date === dateString && h.name !== '__WORKING_DAY__'),
        events: calendarEvents.filter(e => e.date === dateString || (e.endDate && e.date <= dateString && e.endDate >= dateString))
      })
    }
    
    return days
  }, [currentDate, holidays, calendarEvents])

  // Get today's CalendarDay from the calendar grid (for default panel display)
  const todayCalendarDay = useMemo(() => {
    return calendarDays.find(day => day.isToday && day.isCurrentMonth) || calendarDays.find(day => day.isToday) || null
  }, [calendarDays])

  // The day to display in the panel - selected day or today
  const panelDisplayDay = panelSelectedDay || todayCalendarDay

  // Upcoming events for list view
  const upcomingEvents = useMemo(() => {
    const today = getLocalDateString(new Date())
    const allItems: Array<{ type: 'holiday' | 'event'; date: string; item: Holiday | CalendarEvent }> = []
    
    // Filter out working day overrides from upcoming holidays
    holidays.filter(h => h.date >= today && h.name !== '__WORKING_DAY__').forEach(h => {
      allItems.push({ type: 'holiday', date: h.date, item: h })
    })
    
    calendarEvents.filter(e => e.date >= today).forEach(e => {
      allItems.push({ type: 'event', date: e.date, item: e })
    })
    
    return allItems.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 20)
  }, [holidays, calendarEvents])

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    setPanelSelectedDay(null) // Reset selection to show today (if visible) or empty state
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    setPanelSelectedDay(null) // Reset selection to show today (if visible) or empty state
  }

  const goToToday = () => {
    setCurrentDate(new Date())
    setPanelSelectedDay(null) // Reset to show today by default
  }

  const handleDayClick = (day: CalendarDay) => {
    // Update the panel to show clicked day's details
    setPanelSelectedDay(day)
  }

  const handleAddEventForDate = (dateString: string) => {
    setSelectedDate(dateString)
    setShowAddEvent(true)
  }

  const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
    if (!confirm(`Are you sure you want to delete the event "${eventTitle}"?`)) return
    
    try {
      await deleteCalendarEvent(eventId)
      toast.success('Event deleted successfully')
    } catch (error) {
      toast.error('Failed to delete event')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <FaCalendarAlt className="text-primary-500" />
            Calendar
          </h2>
          <p className="text-neutral-400 text-sm sm:text-base mt-1">View holidays, events, and deadlines</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-neutral-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                viewMode === 'month' ? 'bg-primary-600 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                viewMode === 'list' ? 'bg-primary-600 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Upcoming
            </button>
          </div>
          
          {isAdmin && (
            <>
              <Button variant="secondary" size="sm" icon={<FaUmbrellaBeach />} onClick={() => setShowAddHoliday(true)} className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Add </span>Holiday
              </Button>
              <Button size="sm" icon={<FaPlus />} onClick={() => setShowAddEvent(true)} className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Add </span>Event
              </Button>
            </>
          )}
        </div>
      </div>

      {viewMode === 'month' ? (
        <div className="flex flex-col xl:flex-row gap-4 xl:gap-6">
          {/* Left Side - Calendar */}
          <Card padding="md" className="xl:w-[40%] flex-shrink-0">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-white">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex items-center gap-0.5 sm:gap-1">
                <Button variant="ghost" size="sm" onClick={goToPreviousMonth} className="p-1.5 sm:p-2">
                  <FaChevronLeft className="text-xs sm:text-sm" />
                </Button>
                <Button variant="secondary" size="sm" onClick={goToToday} className="px-2 py-1 text-xs sm:text-sm">
                  Today
                </Button>
                <Button variant="ghost" size="sm" onClick={goToNextMonth} className="p-1.5 sm:p-2">
                  <FaChevronRight className="text-xs sm:text-sm" />
                </Button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-px bg-neutral-800 rounded-lg overflow-hidden">
              {/* Weekday Headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="bg-neutral-900 py-2 text-center text-xs font-medium text-neutral-400">
                  {day}
                </div>
              ))}
              
              {/* Calendar Days */}
              {calendarDays.map((day, index) => (
                <motion.button
                  key={index}
                  onClick={() => handleDayClick(day)}
                  whileHover={{ scale: 1.02 }}
                  className={`
                    min-h-[50px] sm:min-h-[70px] p-1 sm:p-1.5 text-left transition-colors relative
                    ${day.isCurrentMonth ? 'bg-neutral-900' : 'bg-neutral-900/50'}
                    ${day.isToday ? 'ring-2 ring-primary-500 ring-inset' : ''}
                    ${day.holiday ? 'bg-amber-500/10' : ''}
                    ${panelSelectedDay?.dateString === day.dateString ? 'bg-primary-500/20' : ''}
                    hover:bg-neutral-800
                  `}
                >
                  <span className={`
                    inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full text-[10px] sm:text-xs font-medium
                    ${day.isToday ? 'bg-primary-600 text-white' : ''}
                    ${day.isWeekend && !day.isToday ? 'text-neutral-500' : ''}
                    ${!day.isCurrentMonth ? 'text-neutral-600' : 'text-neutral-300'}
                  `}>
                    {day.date.getDate()}
                  </span>
                  
                  {/* Holiday indicator - hidden on very small screens, show just icon */}
                  {day.holiday && (
                    <div className="mt-0.5">
                      <div className="flex items-center gap-0.5 text-[8px] sm:text-[10px] text-amber-400 bg-amber-500/20 px-0.5 sm:px-1 py-0.5 rounded truncate">
                        <FaUmbrellaBeach className="flex-shrink-0 text-[7px] sm:text-[8px]" />
                        <span className="truncate hidden sm:inline">{day.holiday.name}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Event indicators - show simplified on mobile */}
                  {day.events.slice(0, 1).map(event => (
                    <div
                      key={event.id}
                      className="mt-0.5 text-[8px] sm:text-[10px] px-0.5 sm:px-1 py-0.5 rounded truncate text-white"
                      style={{ backgroundColor: event.color || '#6366f1' }}
                    >
                      <span className="hidden sm:inline">{event.title}</span>
                      <span className="sm:hidden">•</span>
                    </div>
                  ))}
                  
                  {day.events.length > 1 && (
                    <div className="mt-0.5 text-[8px] sm:text-[10px] text-neutral-400">
                      +{day.events.length - 1}
                    </div>
                  )}
                </motion.button>
              ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-neutral-800 text-xs text-neutral-400">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-amber-500/50 rounded" />
                <span>Holiday</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-primary-600 rounded" />
                <span>Event</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 ring-2 ring-primary-500 rounded" />
                <span>Today</span>
              </div>
            </div>
          </Card>

          {/* Right Side - Day Details Panel */}
          <Card padding="md" className="xl:flex-1 min-h-[300px] xl:min-h-0">
            {panelDisplayDay ? (
              <div className="h-full flex flex-col">
                {/* Panel Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 pb-3 border-b border-neutral-800 gap-2">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-white">
                      <span className="hidden sm:inline">{panelDisplayDay.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
                      <span className="sm:hidden">{panelDisplayDay.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    </h3>
                    {panelDisplayDay.isToday && (
                      <Badge variant="primary" size="sm" className="mt-1">Today</Badge>
                    )}
                  </div>
                  {isAdmin && (
                    <Button size="sm" variant="secondary" icon={<FaPlus />} onClick={() => handleAddEventForDate(panelDisplayDay.dateString)} className="text-xs sm:text-sm">
                      <span className="hidden sm:inline">Add Event</span>
                      <span className="sm:hidden">Add</span>
                    </Button>
                  )}
                </div>

                {/* Day Content */}
                <div className="flex-1 overflow-y-auto">
                  {/* Holiday Section */}
                  {panelDisplayDay.holiday && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-neutral-400 mb-2">Holiday</h4>
                      <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                        <div className="p-2 bg-amber-500/20 rounded-lg">
                          <FaUmbrellaBeach className="text-amber-400" />
                        </div>
                        <div className="flex-1">
                          <h5 className="font-semibold text-white">{panelDisplayDay.holiday.name}</h5>
                          <Badge variant="warning" size="sm" className="mt-1">
                            {panelDisplayDay.holiday.type === 'public' ? 'Public Holiday' : 
                             panelDisplayDay.holiday.type === 'company' ? 'Company Holiday' : 'Optional'}
                          </Badge>
                          {panelDisplayDay.holiday.description && (
                            <p className="text-neutral-400 text-sm mt-2">{panelDisplayDay.holiday.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Events Section */}
                  {panelDisplayDay.events.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-neutral-400 mb-2">Events & Tasks</h4>
                      <div className="space-y-2">
                        {panelDisplayDay.events.map(event => (
                          <div
                            key={event.id}
                            className="p-3 bg-neutral-800/50 border border-neutral-700 rounded-lg"
                            style={{ borderLeftWidth: '4px', borderLeftColor: event.color || '#6366f1' }}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h5 className="font-medium text-white">{event.title}</h5>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  <Badge size="sm" variant="info">{event.type}</Badge>
                                  <Badge size="sm" variant="default">
                                    {departmentVisibilityLabels[event.departmentVisibility || 'all']}
                                  </Badge>
                                </div>
                                {event.description && (
                                  <p className="text-neutral-400 text-sm mt-2">{event.description}</p>
                                )}
                                {event.endDate && event.endDate !== event.date && (
                                  <p className="text-neutral-500 text-xs mt-2 flex items-center gap-1">
                                    <FaClock className="text-neutral-600" />
                                    Until {new Date(event.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </p>
                                )}
                                <p className="text-neutral-500 text-xs mt-1">
                                  By {event.createdByName}
                                </p>
                              </div>
                              {isAdmin && (
                                <button
                                  onClick={() => handleDeleteEvent(event.id!, event.title)}
                                  className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors ml-2 flex-shrink-0"
                                  title="Delete event"
                                >
                                  <FaTrash />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {!panelDisplayDay.holiday && panelDisplayDay.events.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <FaCalendarAlt className="text-4xl text-neutral-600 mb-4" />
                      <p className="text-neutral-300 font-medium">
                        No extra tasks for today, all the best for your work.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center h-full">
                <FaCalendarAlt className="text-4xl text-neutral-600 mb-4" />
                <p className="text-neutral-300 font-medium">
                  No extra tasks for today, all the best for your work.
                </p>
              </div>
            )}
          </Card>
        </div>
      ) : (
        /* List View */
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Upcoming Events & Holidays</h3>
          
          {upcomingEvents.length === 0 ? (
            <div className="text-center py-8 text-neutral-400">
              <FaCalendarAlt className="text-3xl mx-auto mb-2 opacity-50" />
              <p>No upcoming events or holidays</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((item, index) => (
                <motion.div
                  key={`${item.type}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`
                    flex items-start gap-4 p-4 rounded-lg border
                    ${item.type === 'holiday' 
                      ? 'bg-amber-500/10 border-amber-500/30' 
                      : 'bg-neutral-800/50 border-neutral-700'
                    }
                  `}
                >
                  <div className={`
                    p-2 rounded-lg flex-shrink-0
                    ${item.type === 'holiday' ? 'bg-amber-500/20' : 'bg-primary-500/20'}
                  `}>
                    {item.type === 'holiday' ? (
                      <FaUmbrellaBeach className="text-amber-400" />
                    ) : (
                      <FaStar className="text-primary-400" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-medium text-white">
                          {item.type === 'holiday' 
                            ? (item.item as Holiday).name 
                            : (item.item as CalendarEvent).title
                          }
                        </h4>
                        <p className="text-sm text-neutral-400 mt-0.5">
                          {new Date(item.date).toLocaleDateString('en-US', { 
                            weekday: 'long',
                            month: 'long', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge 
                          variant={item.type === 'holiday' ? 'warning' : 'info'}
                          size="sm"
                        >
                          {item.type === 'holiday' 
                            ? (item.item as Holiday).type 
                            : (item.item as CalendarEvent).type
                          }
                        </Badge>
                        {item.type === 'event' && (
                          <Badge variant="default" size="sm">
                            {departmentVisibilityLabels[(item.item as CalendarEvent).departmentVisibility || 'all']}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {item.type === 'event' && (item.item as CalendarEvent).description && (
                      <p className="text-sm text-neutral-500 mt-2">
                        {(item.item as CalendarEvent).description}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Modals */}
      <AddHolidayModal 
        isOpen={showAddHoliday} 
        onClose={() => {
          setShowAddHoliday(false)
          setEditingHoliday(null)
        }}
        editingHoliday={editingHoliday}
      />
      
      <AddEventModal
        isOpen={showAddEvent}
        onClose={() => {
          setShowAddEvent(false)
          setSelectedDate('')
          setEditingEvent(null)
        }}
        selectedDate={selectedDate}
        editingEvent={editingEvent}
      />
    </div>
  )
}

export default Calendar
