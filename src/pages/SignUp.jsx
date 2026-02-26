import { useState, useEffect } from 'react'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { collection, addDoc, query, where, getDocs, updateDoc, doc, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/config'
import '../styles/Auth.css'

function SignUp({ setUser, setShowSignUp }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [inviteToken, setInviteToken] = useState('')
  const [bandName, setBandName] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  // Extract token from URL query params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (token) {
      setInviteToken(token)
    }
  }, [])

  const handleSignUp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Validate invitation token
      const invQuery = query(
        collection(db, 'invitations'),
        where('token', '==', inviteToken)
      )
      const invSnapshot = await getDocs(invQuery)

      if (invSnapshot.empty) {
        throw new Error('Invalid invitation token')
      }

      const invDoc = invSnapshot.docs[0]
      const invData = invDoc.data()

      // Check if token expired
      if (new Date() > invData.expiresAt.toDate()) {
        throw new Error('Invitation token expired')
      }

      // Check if token already claimed
      if (invData.claimed) {
        throw new Error('Invitation token already used')
      }

      // Create band profile with custom document ID (sanitized band name)
      const sanitizedBandName = bandName.toLowerCase().replace(/[^a-z0-9]/g, '_')
      const bandData = {
        email,
        bandName,
        userId: user.uid,
        status: 'active',
        createdAt: new Date(),
      }
      
      await setDoc(doc(db, 'bands', sanitizedBandName), bandData)
      const bandId = sanitizedBandName

      // Mark invitation as claimed
      await updateDoc(invDoc.ref, {
        claimed: true,
        claimedAt: new Date(),
        bandId: bandId,
      })

      setUser(user)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>BRB Coffee - Sign Up</h1>
        <form onSubmit={handleSignUp}>
          {!new URLSearchParams(window.location.search).get('token') && (
            <div className="form-group">
              <label>Invitation Token</label>
              <input
                type="text"
                value={inviteToken}
                onChange={(e) => setInviteToken(e.target.value)}
                placeholder="Paste your invitation token"
                required
              />
            </div>
          )}
          <div className="form-group">
            <label>Band Name</label>
            <input
              type="text"
              value={bandName}
              onChange={(e) => setBandName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>
        <p className="signup-link">
          Already have an account? <button onClick={() => setShowSignUp(false)}>Login</button>
        </p>
      </div>
    </div>
  )
}

export default SignUp
