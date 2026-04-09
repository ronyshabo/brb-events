import { useState } from 'react'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

const fmt12 = (time24) => {
  if (!time24) return ''
  const [hours, minutes] = time24.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

function EventCalendar({ events = [] }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date().toISOString().split('T')[0]

  // Build event map: 'YYYY-MM-DD' -> [events]
  const eventMap = {}
  events.forEach((e) => {
    if (e.date) {
      if (!eventMap[e.date]) eventMap[e.date] = []
      eventMap[e.date].push(e)
    }
  })

  // Build grid cells
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ day: d, dateStr })
  }
  while (cells.length % 7 !== 0) cells.push(null)

  const selectedEvents = selectedDay ? (eventMap[selectedDay] || []) : []
  const selectedLabel = selectedDay
    ? new Date(selectedDay + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
      })
    : ''

  return (
    <div className="calendar-wrapper">
      {/* Month navigation */}
      <div className="cal-nav-bar">
        <button
          className="cal-nav-btn"
          onClick={() => { setCurrentDate(new Date(year, month - 1, 1)); setSelectedDay(null) }}
        >
          ‹
        </button>
        <h3 className="cal-month-title">{MONTHS[month]} {year}</h3>
        <button
          className="cal-nav-btn"
          onClick={() => { setCurrentDate(new Date(year, month + 1, 1)); setSelectedDay(null) }}
        >
          ›
        </button>
      </div>

      {/* Info note for users */}
      <div className="cal-info-note" style={{ margin: '0.5rem 0 1rem', fontSize: '0.97rem', color: '#555', background: '#f8f8f8', borderRadius: 6, padding: '0.7rem 1rem' }}>
        <strong>Note:</strong> All <span style={{ color: '#1e8449' }}>approved</span> and <span style={{ color: '#d68910' }}>pending</span> events are shown. Pending events are awaiting admin approval and may be rescheduled.
      </div>

      {/* Legend */}
      <div className="cal-legend">
        <span className="legend-item"><span className="cal-dot" /> event booked</span>
        <span className="legend-item"><span className="legend-open" /> available</span>
        <span className="legend-item"><span className="legend-today" /> today</span>
      </div>

      {/* Grid */}
      <div className="cal-grid">
        {DAYS.map((d) => (
          <div key={d} className="cal-day-label">{d}</div>
        ))}
        {cells.map((cell, i) => {
          if (!cell) return <div key={`e-${i}`} className="cal-cell empty" />
          const { day, dateStr } = cell
          const dayEvents = eventMap[dateStr] || []
          const isToday = dateStr === today
          const isPast = dateStr < today
          const isSelected = dateStr === selectedDay
          const hasEvents = dayEvents.length > 0

          return (
            <div
              key={dateStr}
              className={[
                'cal-cell',
                isToday ? 'today' : '',
                isPast ? 'past' : '',
                isSelected ? 'selected' : '',
                hasEvents ? 'has-events' : 'is-open',
              ].filter(Boolean).join(' ')}
              onClick={() => setSelectedDay(isSelected ? null : dateStr)}
              title={hasEvents ? `${dayEvents.length} event(s)` : 'Available'}
            >
              <span className="cal-num">{day}</span>
              {hasEvents && (
                <div className="cal-dots">
                  {dayEvents.slice(0, 3).map((_, idx) => (
                    <span key={idx} className="cal-dot" />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Day detail panel */}
      {selectedDay && (
        <div className="cal-panel">
          <div className="cal-panel-head">
            <span className="cal-panel-date">{selectedLabel}</span>
            <button className="cal-panel-close" onClick={() => setSelectedDay(null)}>×</button>
          </div>
          {selectedEvents.length === 0 ? (
            <div className="cal-open-slot">
              <div>
                <strong>This date is available</strong>
                <p>No events are booked — feel free to request this slot.</p>
              </div>
            </div>
          ) : (
            <div className="cal-panel-events">
              {selectedEvents.map((e) => (
                <div key={e.id} className="cal-panel-event">
                  <div className="cal-event-title">{e.title}</div>
                  <div className="cal-event-meta">
                    {fmt12(e.startTime)} – {fmt12(e.endTime)}
                  </div>
                  {e.venue && <div className="cal-event-meta">{e.venue}</div>}
                  {e.bandName && (
                    <div className="cal-event-meta"><strong>Band:</strong> {e.bandName}</div>
                  )}
                  <div className="cal-event-meta">
                    <strong>Status:</strong> <span style={{ color: e.status === 'approved' ? '#1e8449' : e.status === 'pending' ? '#d68910' : '#c0392b' }}>
                      {e.status === 'approved' ? 'Approved' : e.status === 'pending' ? 'Pending' : e.status}
                    </span>
                  </div>
                </div>
              ))}
              {selectedEvents.length > 0 && (
                <p className="cal-conflict-note">
                  There {selectedEvents.length === 1 ? 'is' : 'are'} already {selectedEvents.length} event{selectedEvents.length > 1 ? 's' : ''} on this date. Consider a different day or check for a time gap.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default EventCalendar
