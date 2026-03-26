import { useState, useEffect } from 'react'
import { collection, getDocs, updateDoc, doc, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase/config'
import '../styles/Portal.css'

function AdminPortal({ user }) {
  const [pendingEvents, setPendingEvents] = useState([])
  const [allEvents, setAllEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pending')
  const [actionLoading, setActionLoading] = useState(null)

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const eventsSnapshot = await getDocs(
        query(collection(db, 'events'), orderBy('createdAt', 'desc'))
      )
      const events = eventsSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      setPendingEvents(events.filter((e) => e.status === 'pending'))
      setAllEvents(events)
    } catch (err) {
      console.error('Error fetching events:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const handleApprove = async (eventId) => {
    setActionLoading(eventId + '-approve')
    try {
      await updateDoc(doc(db, 'events', eventId), { status: 'approved' })
      await fetchEvents()
    } catch (err) {
      console.error('Error approving event:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (eventId) => {
    setActionLoading(eventId + '-reject')
    try {
      await updateDoc(doc(db, 'events', eventId), { status: 'rejected' })
      await fetchEvents()
    } catch (err) {
      console.error('Error rejecting event:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const statusBadge = (status) => {
    const colors = {
      pending: '#f39c12',
      approved: '#27ae60',
      rejected: '#e74c3c',
    }
    return (
      <span
        style={{
          background: colors[status] || '#95a5a6',
          color: '#fff',
          padding: '2px 10px',
          borderRadius: '12px',
          fontSize: '0.8rem',
          fontWeight: 'bold',
          textTransform: 'uppercase',
        }}
      >
        {status}
      </span>
    )
  }

  const displayEvents = activeTab === 'pending' ? pendingEvents : allEvents

  return (
    <div className="portal">
      <div className="portal-header">
        <h2>Admin Portal</h2>
        <button onClick={fetchEvents} className="refresh-btn" title="Refresh">
          🔄 Refresh
        </button>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('pending')}
          style={{
            padding: '0.5rem 1.2rem',
            background: activeTab === 'pending' ? '#3498db' : '#ecf0f1',
            color: activeTab === 'pending' ? '#fff' : '#333',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Pending ({pendingEvents.length})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          style={{
            padding: '0.5rem 1.2rem',
            background: activeTab === 'all' ? '#3498db' : '#ecf0f1',
            color: activeTab === 'all' ? '#fff' : '#333',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          All Events ({allEvents.length})
        </button>
      </div>

      {loading ? (
        <p>Loading events...</p>
      ) : displayEvents.length === 0 ? (
        <p>{activeTab === 'pending' ? 'No pending events.' : 'No events found.'}</p>
      ) : (
        <div className="events-list">
          {displayEvents.map((event) => (
            <div key={event.id} className="event-card" style={{ borderLeft: '4px solid #3498db', padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.3rem' }}>{event.title}</h3>
                  {statusBadge(event.status)}
                </div>
                {event.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleApprove(event.id)}
                      disabled={actionLoading === event.id + '-approve'}
                      style={{
                        background: '#27ae60',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.4rem 1rem',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                      }}
                    >
                      {actionLoading === event.id + '-approve' ? '...' : '✔ Approve'}
                    </button>
                    <button
                      onClick={() => handleReject(event.id)}
                      disabled={actionLoading === event.id + '-reject'}
                      style={{
                        background: '#e74c3c',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.4rem 1rem',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                      }}
                    >
                      {actionLoading === event.id + '-reject' ? '...' : '✖ Reject'}
                    </button>
                  </div>
                )}
              </div>
              <p style={{ margin: '0.5rem 0 0.2rem' }}>{event.description}</p>
              <p style={{ margin: '0.2rem 0', color: '#555', fontSize: '0.9rem' }}>
                <strong>Band:</strong> {event.bandName} ({event.bandEmail})
              </p>
              <p style={{ margin: '0.2rem 0', color: '#555', fontSize: '0.9rem' }}>
                <strong>Date:</strong> {event.date} &nbsp;|&nbsp;
                <strong>Time:</strong> {event.startTime} – {event.endTime}
              </p>
              {event.venue && (
                <p style={{ margin: '0.2rem 0', color: '#555', fontSize: '0.9rem' }}>
                  <strong>Venue:</strong> {event.venue}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminPortal
