import { useState, useEffect } from 'react'
import { auth } from './firebase/config'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import BandPortal from './pages/BandPortal'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showSignUp, setShowSignUp] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
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
        <h1>BRB Coffee - events Portal</h1>
        <button onClick={handleLogout}>Logout</button>
      </nav>
      <BandPortal user={user} />
    </div>
  )
}

export default App
