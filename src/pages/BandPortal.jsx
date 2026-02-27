import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../firebase/config'
import '../styles/Portal.css'

// Helper function to convert 24-hour time to 12-hour format with AM/PM
const formatTime12Hour = (time24) => {
  if (!time24) return ''
  const [hours, minutes] = time24.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

function BandPortal({ user }) {
  const [availableEvents, setAvailableEvents] = useState([])
  const [myBookings, setMyBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [bandId, setBandId] = useState(null)
  const [bandData, setBandData] = useState(null)
  const [formData, setFormData] = useState({
    notes: '',
  })

  const fetchBandData = async () => {
    setLoading(true)
    try {
      // Find band profile
      const bandQuery = query(collection(db, 'bands'), where('userId', '==', user.uid))
      const bandSnapshot = await getDocs(bandQuery)

      if (bandSnapshot.empty) {
        setLoading(false)
        return
      }

      const currentBandId = bandSnapshot.docs[0].id
      const bandData = bandSnapshot.docs[0].data()
      const bandEmail = bandData.email
      setBandId(currentBandId)
      setBandData(bandData)

      // Fetch events associated with this band's email
      const eventsQuery = query(
        collection(db, 'events'),
        where('bandEmail', '==', bandEmail)
      )
      const eventsSnapshot = await getDocs(eventsQuery)
      const bandEvents = eventsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setAvailableEvents(bandEvents)

      // Fetch bookings for this band
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('bandId', '==', currentBandId)
      )
      const bookingsSnapshot = await getDocs(bookingsQuery)
      const bookingsList = bookingsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setMyBookings(bookingsList)
    } catch (err) {
      console.error('Error fetching band data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBandData()
  }, [user])

  const handleCreateBooking = async (e) => {
    e.preventDefault()
    if (!selectedEvent || !bandId || !bandData) return

    try {
      await addDoc(collection(db, 'bookings'), {
        eventId: selectedEvent.id,
        bandId,
        bandName: bandData.bandName,
        bandEmail: bandData.email,
        eventTitle: selectedEvent.title,
        eventDate: selectedEvent.date,
        eventStartTime: selectedEvent.startTime,
        eventEndTime: selectedEvent.endTime,
        notes: formData.notes,
        status: 'pending',
        createdAt: new Date(),
      })

      setFormData({ notes: '' })
      setSelectedEvent(null)
      // Refresh bookings
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('bandId', '==', bandId)
      )
      const bookingsSnapshot = await getDocs(bookingsQuery)
      const updatedBookings = bookingsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setMyBookings(updatedBookings)
    } catch (err) {
      console.error('Error creating booking:', err)
    }
  }

  if (loading) return <div>Loading your band portal...</div>

  return (
    <div className="portal">
      <div className="portal-header">
        <h2>Band Portal</h2>
        <button onClick={fetchBandData} className="refresh-btn" title="Refresh events">
          🔄 Refresh
        </button>
      </div>

      <div className="portal-section">
        <h3>Available Events</h3>
        {availableEvents.length === 0 ? (
          <p>No events available at the moment.</p>
        ) : (
          <div className="events-list">
            {availableEvents.map((event) => (
              <div key={event.id} className="event-card">
                <h3>{event.title || event.name}</h3>
                <p>{event.description}</p>
                {event.status === 'booked' ? (
                  <p style={{ color: '#e74c3c', fontWeight: 'bold' }}>Already Booked</p>
                ) : (
                  <button onClick={() => setSelectedEvent(event)}>Apply to Event</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="portal-section">
        <h3>My Applications</h3>
        {myBookings.length === 0 ? (
          <p>You haven't applied to any events yet.</p>
        ) : (
          <div className="bookings-list">
            {myBookings.map((booking) => (
              <div key={booking.id} className="booking-card">
                <p><strong>Event ID:</strong> {booking.eventId}</p>
                <p><strong>Status:</strong> {booking.status}</p>
                <p><strong>Selected Date:</strong> {booking.selectedDate}</p>
                <p><strong>Selected Time:</strong> {booking.selectedTime}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedEvent && (
        <div className="modal">
          <div className="modal-content">
            <h3>Apply for: {selectedEvent.title || selectedEvent.name}</h3>
            <p><strong>Date:</strong> {selectedEvent.date}</p>
            <p><strong>Time:</strong> {formatTime12Hour(selectedEvent.startTime)} - {formatTime12Hour(selectedEvent.endTime)}</p>
            <p><strong>Description:</strong> {selectedEvent.description}</p>
            <form onSubmit={handleCreateBooking}>
              <div className="form-group">
                <label>Additional Notes (optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any special requirements or comments..."
                  rows="4"
                />
              </div>
              <button type="submit">Submit Application</button>
              <button type="button" onClick={() => setSelectedEvent(null)}>Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default BandPortal
