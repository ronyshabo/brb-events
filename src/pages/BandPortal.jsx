import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import EventCalendar from './EventCalendar'
import '../styles/Portal.css'

const formatTime12Hour = (time24) => {
  if (!time24) return ''
  const [hours, minutes] = time24.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-')
  const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

const STATUS_CONFIG = {
  pending:  { label: 'Pending Review', color: '#d68910', bg: '#fef9ec', border: '#f0c040' },
  approved: { label: 'Approved',       color: '#1e8449', bg: '#eafaf1', border: '#58d68d' },
  rejected: { label: 'Rejected',       color: '#c0392b', bg: '#fdedec', border: '#f1948a' },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: '#7f8c8d', bg: '#f2f3f4', border: '#bdc3c7' }
  return (
    <span style={{
      background: cfg.bg,
      color: cfg.color,
      border: `1px solid ${cfg.border}`,
      padding: '3px 12px',
      borderRadius: '20px',
      fontSize: '0.75rem',
      fontWeight: '700',
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
    }}>
      {cfg.label}
    </span>
  )
}

function BandPortal({ user }) {
  const [approvedEvents, setApprovedEvents] = useState([])
  const [myEvents, setMyEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [bandId, setBandId] = useState(null)
  const [bandData, setBandData] = useState(null)
  const [activeTab, setActiveTab] = useState('calendar')
  const [showCreateEvent, setShowCreateEvent] = useState(false)
  const [createEventError, setCreateEventError] = useState('')
  const [createEventLoading, setCreateEventLoading] = useState(false)
  const [newEventData, setNewEventData] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    venue: '',
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      let currentBandId = null
      let profile = null

      const byUid = query(collection(db, 'bands'), where('userId', '==', user.uid))
      const uidSnap = await getDocs(byUid)
      if (!uidSnap.empty) {
        currentBandId = uidSnap.docs[0].id
        profile = uidSnap.docs[0].data()
      } else if (user?.email) {
        const byEmail = query(collection(db, 'bands'), where('email', '==', user.email))
        const emailSnap = await getDocs(byEmail)
        if (!emailSnap.empty) {
          currentBandId = emailSnap.docs[0].id
          profile = emailSnap.docs[0].data()
        }
      }

      if (!currentBandId || !profile) {
        setLoading(false)
        return
      }

      setBandId(currentBandId)
      setBandData(profile)

      // All approved events — full public schedule so bands can pick open slots
      const approvedSnap = await getDocs(
        query(collection(db, 'events'), where('status', '==', 'approved'))
      )
      const approved = approvedSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.date > b.date ? 1 : -1))
      setApprovedEvents(approved)

      // This band's own events (all statuses)
      const mySnap = await getDocs(
        query(collection(db, 'events'), where('bandEmail', '==', profile.email))
      )
      const mine = mySnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.date > b.date ? 1 : -1))
      setMyEvents(mine)
    } catch (err) {
      console.error('Error fetching band data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [user])

  const handleCreateEvent = async (e) => {
    e.preventDefault()
    setCreateEventError('')
    setCreateEventLoading(true)

    if (!bandId || !bandData) {
      setCreateEventError('We could not find your band profile. Please refresh and try again.')
      setCreateEventLoading(false)
      return
    }

    if (newEventData.startTime && newEventData.endTime && newEventData.endTime <= newEventData.startTime) {
      setCreateEventError('End time must be after the start time.')
      setCreateEventLoading(false)
      return
    }

    try {
      await addDoc(collection(db, 'events'), {
        ...newEventData,
        bandId,
        bandName: bandData.bandName,
        bandEmail: bandData.email,
        status: 'pending',
        createdAt: new Date(),
      })

      setNewEventData({ title: '', description: '', date: '', startTime: '', endTime: '', venue: '' })
      setShowCreateEvent(false)
      fetchData()
    } catch (err) {
      console.error('Error creating event:', err)
      setCreateEventError(err.message || 'Unable to create event. Please try again.')
    } finally {
      setCreateEventLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="portal-loading">
        <div className="loading-spinner" />
        <p>Loading your portal…</p>
      </div>
    )
  }

  const today = new Date().toISOString().split('T')[0]
  const upcomingApproved = approvedEvents.filter((e) => e.date >= today)
  const pastApproved = approvedEvents.filter((e) => e.date < today)

  return (
    <div className="portal">

      {/* Welcome banner */}
      <div className="welcome-banner">
        <div className="welcome-text">
          <h2>Welcome back{bandData?.bandName ? `, ${bandData.bandName}` : ''}! </h2>
          <p>Check the schedule below to find a great slot, then submit your event request.</p>
        </div>
        <div className="welcome-stats">
          <div className="stat-chip">
            <span className="stat-number">{upcomingApproved.length}</span>
            <span className="stat-label">events scheduled</span>
          </div>
          <div className="stat-chip">
            <span className="stat-number">{myEvents.filter((e) => e.status === 'pending').length}</span>
            <span className="stat-label">pending review</span>
          </div>
          <div className="stat-chip approved">
            <span className="stat-number">{myEvents.filter((e) => e.status === 'approved').length}</span>
            <span className="stat-label">your approved</span>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="tab-bar">
        <button
          className={`tab-btn${activeTab === 'calendar' ? ' active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          Calendar
        </button>
        <button
          className={`tab-btn${activeTab === 'schedule' ? ' active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          List View
          <span className="tab-count">{upcomingApproved.length}</span>
        </button>
        <button
          className={`tab-btn${activeTab === 'mine' ? ' active' : ''}`}
          onClick={() => setActiveTab('mine')}
        >
          My Events
          <span className="tab-count">{myEvents.length}</span>
        </button>
        <button className="tab-btn create-tab" onClick={() => setShowCreateEvent(true)}>
          ➕ Request Event
        </button>
      </div>

      {/* Calendar tab */}
      {activeTab === 'calendar' && (
        <div className="portal-section">
          <p className="section-hint">
            Click any day to see what's booked. <strong>Green = open slot</strong>, dots = events already scheduled.
          </p>
          <EventCalendar events={approvedEvents} />
        </div>
      )}

      {/* Full Schedule tab */}
      {activeTab === 'schedule' && (
        <div className="portal-section">
          <p className="section-hint">
            These are all <strong>approved</strong> events. Use this to find a date &amp; time that works without clashing.
          </p>

          {upcomingApproved.length === 0 && pastApproved.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🗓️</span>
              <p>No approved events yet — the schedule is wide open!</p>
            </div>
          ) : (
            <>
              {upcomingApproved.length > 0 && (
                <>
                  <h4 className="group-label">Upcoming</h4>
                  <div className="schedule-list">
                    {upcomingApproved.map((event) => (
                      <div key={event.id} className="schedule-row">
                        <div className="schedule-date-block">
                          <span className="sched-month">
                            {event.date
                              ? new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })
                              : '—'}
                          </span>
                          <span className="sched-day">
                            {event.date ? new Date(event.date + 'T00:00:00').getDate() : ''}
                          </span>
                        </div>
                        <div className="schedule-info">
                          <strong>{event.title}</strong>
                          <span className="schedule-meta">
                            {formatTime12Hour(event.startTime)} – {formatTime12Hour(event.endTime)}
                            {event.venue ? ` · ${event.venue}` : ''}
                          </span>
                          {event.bandName && (
                            <span className="schedule-band">🎶 {event.bandName}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {pastApproved.length > 0 && (
                <>
                  <h4 className="group-label past">Past Events</h4>
                  <div className="schedule-list past">
                    {[...pastApproved].reverse().map((event) => (
                      <div key={event.id} className="schedule-row past">
                        <div className="schedule-date-block">
                          <span className="sched-month">
                            {event.date
                              ? new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })
                              : '—'}
                          </span>
                          <span className="sched-day">
                            {event.date ? new Date(event.date + 'T00:00:00').getDate() : ''}
                          </span>
                        </div>
                        <div className="schedule-info">
                          <strong>{event.title}</strong>
                          <span className="schedule-meta">
                            {formatTime12Hour(event.startTime)} – {formatTime12Hour(event.endTime)}
                            {event.venue ? ` · ${event.venue}` : ''}
                          </span>
                          {event.bandName && (
                            <span className="schedule-band">🎶 {event.bandName}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* My Events tab */}
      {activeTab === 'mine' && (
        <div className="portal-section">
          {myEvents.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🎵</span>
              <p>You haven't submitted any events yet.</p>
              <button className="create-event-btn" onClick={() => setShowCreateEvent(true)}>
                ➕ Request Your First Event
              </button>
            </div>
          ) : (
            <div className="my-events-list">
              {myEvents.map((event) => {
                const cfg = STATUS_CONFIG[event.status] || {}
                return (
                  <div
                    key={event.id}
                    className="my-event-card"
                    style={{ borderLeft: `4px solid ${cfg.border || '#bdc3c7'}` }}
                  >
                    <div className="my-event-top">
                      <div>
                        <h3 className="my-event-title">{event.title}</h3>
                        <p className="my-event-date">{formatDate(event.date)}</p>
                      </div>
                      <StatusBadge status={event.status} />
                    </div>
                    {event.description && (
                      <p className="my-event-desc">{event.description}</p>
                    )}
                    <div className="my-event-meta">
                      {event.startTime && (
                        <span>🕐 {formatTime12Hour(event.startTime)} – {formatTime12Hour(event.endTime)}</span>
                      )}
                      {event.venue && <span>📍 {event.venue}</span>}
                    </div>
                    {event.status === 'pending' && (
                      <p className="status-note">⏳ An admin will review your request shortly.</p>
                    )}
                    {event.status === 'rejected' && (
                      <p className="status-note rejected">This event was not approved. Feel free to submit a new request.</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateEvent && (
        <div className="modal" onClick={(e) => e.target === e.currentTarget && setShowCreateEvent(false)}>
          <div className="modal-content">
            <div className="modal-header">
              <h3>Request a New Event</h3>
              <button className="modal-close" onClick={() => setShowCreateEvent(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateEvent}>
              <div className="form-group">
                <label>Event Title *</label>
                <input
                  type="text"
                  value={newEventData.title}
                  onChange={(e) => setNewEventData({ ...newEventData, title: e.target.value })}
                  placeholder="e.g., Live at BRB Coffee"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={newEventData.description}
                  onChange={(e) => setNewEventData({ ...newEventData, description: e.target.value })}
                  placeholder="Describe your event…"
                  rows="3"
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    value={newEventData.date}
                    onChange={(e) => setNewEventData({ ...newEventData, date: e.target.value })}
                    min={today}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Venue</label>
                  <input
                    type="text"
                    value={newEventData.venue}
                    onChange={(e) => setNewEventData({ ...newEventData, venue: e.target.value })}
                    placeholder="e.g., BRB Coffee Main Stage"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Start Time *</label>
                  <input
                    type="time"
                    value={newEventData.startTime}
                    onChange={(e) => setNewEventData({ ...newEventData, startTime: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Time *</label>
                  <input
                    type="time"
                    value={newEventData.endTime}
                    onChange={(e) => setNewEventData({ ...newEventData, endTime: e.target.value })}
                    required
                  />
                </div>
              </div>
              {createEventError && <p className="error">{createEventError}</p>}
              <p className="form-hint">
                📋 Your request will be reviewed by an admin before it appears on the schedule.
              </p>
              <div className="modal-actions">
                <button type="submit" className="btn-primary" disabled={createEventLoading}>
                  {createEventLoading ? 'Submitting…' : 'Submit Request'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setShowCreateEvent(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default BandPortal
