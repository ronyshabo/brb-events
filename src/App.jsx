import { useState, useEffect } from 'react'
import { auth, db } from './firebase/config'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import BandPortal from './pages/BandPortal'
import AdminPortal from './pages/AdminPortal'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showSignUp, setShowSignUp] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        const adminDoc = await getDoc(doc(db, 'admins', currentUser.uid))
        setIsAdmin(adminDoc.exists())
      } else {
        setIsAdmin(false)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const handleLogout = async () => {
    await signOut(auth)
    setUser(null)
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return showSignUp ? (
      <SignUp setUser={setUser} setShowSignUp={setShowSignUp} />
    ) : (
      <Login setShowSignUp={setShowSignUp} setUser={setUser} />
    )
  }

  return (
    <div className="app">
      <nav className="navbar">
        <h1>BRB Coffee - {isAdmin ? 'Admin' : 'Band'} Portal</h1>
        <button onClick={handleLogout}>Logout</button>
      </nav>
      {isAdmin ? <AdminPortal user={user} /> : <BandPortal user={user} />}
    </div>
  )
}

export default App
