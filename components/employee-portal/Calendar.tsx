'use client'

import { useState, useMemo } from 'react'
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
  FaTrash
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
    title: editingEvent?.title || '',
    description: editingEvent?.description || '',
    date: editingEvent?.date || selectedDate || '',
    endDate: editingEvent?.endDate || '',
    type: editingEvent?.type || 'event',
    color: editingEvent?.color || '#6366f1'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.date || !form.title) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      if (editingEvent?.id) {
        await updateCalendarEvent(editingEvent.id, {
          title: form.title,
          description: form.description,
          date: form.date,
          endDate: form.endDate || undefined,
          type: form.type as CalendarEvent['type'],
          color: form.color
        })
        toast.success('Event updated successfully')
      } else {
        await addCalendarEvent({
          title: form.title,
          description: form.description,
          date: form.date,
          endDate: form.endDate || undefined,
          type: form.type as CalendarEvent['type'],
          color: form.color
        })
        toast.success('Event added successfully')
      }
      onClose()
    } catch (error) {
      toast.error('Failed to save event')
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
            min={form.date}
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
// DAY DETAIL MODAL
// ============================================

function DayDetailModal({
  isOpen,
  onClose,
  day
}: {
  isOpen: boolean
  onClose: () => void
  day: CalendarDay | null
}) {
  const { employee, deleteHoliday, deleteCalendarEvent } = useEmployeeAuth()
  const isAdmin = employee?.role === 'admin'

  if (!day) return null

  const handleDeleteHoliday = async () => {
    if (!day.holiday?.id) return
    if (!confirm('Are you sure you want to delete this holiday?')) return
    
    try {
      await deleteHoliday(day.holiday.id)
      toast.success('Holiday deleted')
      onClose()
    } catch (error) {
      toast.error('Failed to delete holiday')
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return
    
    try {
      await deleteCalendarEvent(eventId)
      toast.success('Event deleted')
    } catch (error) {
      toast.error('Failed to delete event')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={day.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}>
      <div className="space-y-4">
        {day.isToday && (
          <Badge variant="primary" className="mb-2">Today</Badge>
        )}
        
        {day.holiday && (
          <Card className="border-l-4 border-l-amber-500">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <FaUmbrellaBeach className="text-amber-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">{day.holiday.name}</h4>
                  <Badge variant="warning" size="sm" className="mt-1">
                    {day.holiday.type === 'public' ? 'Public Holiday' : 
                     day.holiday.type === 'company' ? 'Company Holiday' : 'Optional'}
                  </Badge>
                  {day.holiday.description && (
                    <p className="text-neutral-400 text-sm mt-2">{day.holiday.description}</p>
                  )}
                </div>
              </div>
              {isAdmin && day.holiday.id && (
                <button
                  onClick={handleDeleteHoliday}
                  className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                  title="Delete holiday"
                >
                  <FaTrash />
                </button>
              )}
              {isAdmin && !day.holiday.id && day.holiday.isAutoHoliday && (
                <div className="text-xs text-neutral-500 italic">
                  Auto-generated
                </div>
              )}
            </div>
          </Card>
        )}

        {day.events.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-neutral-400">Events</h4>
            {day.events.map(event => (
              <Card key={event.id} className="border-l-4">
                <div style={{ borderLeftColor: event.color || '#6366f1' }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="font-medium text-white">{event.title}</h5>
                      <Badge size="sm" variant="info" className="mt-1">{event.type}</Badge>
                      {event.description && (
                        <p className="text-neutral-400 text-sm mt-2">{event.description}</p>
                      )}
                      <p className="text-neutral-500 text-xs mt-2">
                        By {event.createdByName}
                      </p>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteEvent(event.id!)}
                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                      >
                      <FaTrash />
                    </button>
                  )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {!day.holiday && day.events.length === 0 && (
          <div className="text-center py-8 text-neutral-400">
            <FaCalendarAlt className="text-3xl mx-auto mb-2 opacity-50" />
            <p>No events on this day</p>
          </div>
        )}

        {day.holiday && (
          <Alert variant="warning">
            <strong>Holiday:</strong> Attendance marking is disabled for this day.
          </Alert>
        )}
      </div>
    </Modal>
  )
}

// ============================================
// MAIN CALENDAR COMPONENT
// ============================================

export function Calendar() {
  const { employee, holidays, calendarEvents, isHoliday } = useEmployeeAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showAddHoliday, setShowAddHoliday] = useState(false)
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [viewMode, setViewMode] = useState<'month' | 'list'>('month')

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
      
      // Auto-generate weekend holidays if not already marked
      let holidayForDay = holidays.find(h => h.date === dateString)
      if (isWeekend && !holidayForDay) {
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
        isWeekend,
        holiday: holidayForDay,
        events: calendarEvents.filter(e => e.date === dateString || (e.endDate && e.date <= dateString && e.endDate >= dateString))
      })
    }
    
    // Add days from next month
    const remainingDays = 42 - days.length // 6 rows of 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i)
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
    
    return days
  }, [currentDate, holidays, calendarEvents])

  // Upcoming events for list view
  const upcomingEvents = useMemo(() => {
    const today = getLocalDateString(new Date())
    const allItems: Array<{ type: 'holiday' | 'event'; date: string; item: Holiday | CalendarEvent }> = []
    
    holidays.filter(h => h.date >= today).forEach(h => {
      allItems.push({ type: 'holiday', date: h.date, item: h })
    })
    
    calendarEvents.filter(e => e.date >= today).forEach(e => {
      allItems.push({ type: 'event', date: e.date, item: e })
    })
    
    return allItems.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 20)
  }, [holidays, calendarEvents])

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const handleDayClick = (day: CalendarDay) => {
    setSelectedDay(day)
  }

  const handleAddEventForDate = (dateString: string) => {
    setSelectedDate(dateString)
    setShowAddEvent(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FaCalendarAlt className="text-primary-500" />
            Calendar
          </h2>
          <p className="text-neutral-400 mt-1">View holidays, events, and deadlines</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
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
              <Button variant="secondary" icon={<FaUmbrellaBeach />} onClick={() => setShowAddHoliday(true)}>
                Add Holiday
              </Button>
              <Button icon={<FaPlus />} onClick={() => setShowAddEvent(true)}>
                Add Event
              </Button>
            </>
          )}
        </div>
      </div>

      {viewMode === 'month' ? (
        <Card padding="lg">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={goToPreviousMonth}>
                <FaChevronLeft />
              </Button>
              <Button variant="secondary" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Button variant="ghost" size="sm" onClick={goToNextMonth}>
                <FaChevronRight />
              </Button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-px bg-neutral-800 rounded-lg overflow-hidden">
            {/* Weekday Headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="bg-neutral-900 py-3 text-center text-sm font-medium text-neutral-400">
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
                  min-h-[100px] p-2 text-left transition-colors relative
                  ${day.isCurrentMonth ? 'bg-neutral-900' : 'bg-neutral-900/50'}
                  ${day.isToday ? 'ring-2 ring-primary-500 ring-inset' : ''}
                  ${day.holiday ? 'bg-amber-500/10' : ''}
                  hover:bg-neutral-800
                `}
              >
                <span className={`
                  inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium
                  ${day.isToday ? 'bg-primary-600 text-white' : ''}
                  ${day.isWeekend && !day.isToday ? 'text-neutral-500' : ''}
                  ${!day.isCurrentMonth ? 'text-neutral-600' : 'text-neutral-300'}
                `}>
                  {day.date.getDate()}
                </span>
                
                {/* Holiday indicator */}
                {day.holiday && (
                  <div className="mt-1">
                    <div className="flex items-center gap-1 text-xs text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded truncate">
                      <FaUmbrellaBeach className="flex-shrink-0" />
                      <span className="truncate">{day.holiday.name}</span>
                    </div>
                  </div>
                )}
                
                {/* Event indicators */}
                {day.events.slice(0, 2).map(event => (
                  <div
                    key={event.id}
                    className="mt-1 text-xs px-1.5 py-0.5 rounded truncate text-white"
                    style={{ backgroundColor: event.color || '#6366f1' }}
                  >
                    {event.title}
                  </div>
                ))}
                
                {day.events.length > 2 && (
                  <div className="mt-1 text-xs text-neutral-400">
                    +{day.events.length - 2} more
                  </div>
                )}
              </motion.button>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-neutral-800 text-sm text-neutral-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-500/50 rounded" />
              <span>Holiday</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary-600 rounded" />
              <span>Event</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 ring-2 ring-primary-500 rounded" />
              <span>Today</span>
            </div>
          </div>
        </Card>
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
                      <Badge 
                        variant={item.type === 'holiday' ? 'warning' : 'info'}
                        size="sm"
                      >
                        {item.type === 'holiday' 
                          ? (item.item as Holiday).type 
                          : (item.item as CalendarEvent).type
                        }
                      </Badge>
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
      
      <DayDetailModal
        isOpen={!!selectedDay}
        onClose={() => setSelectedDay(null)}
        day={selectedDay}
      />
    </div>
  )
}

export default Calendar
