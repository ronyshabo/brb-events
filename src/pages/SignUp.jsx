import { useState, useEffect } from 'react'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { collection, query, where, getDocs, updateDoc, doc, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/config'
import '../styles/Auth.css'

function SignUp({ setUser, setShowSignUp }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [inviteToken, setInviteToken] = useState('')
  const [bandName, setBandName] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const getAuthErrorMessage = (code, fallbackMessage) => {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'That email is already in use. Please log in or use another email.'
      case 'auth/invalid-email':
        return 'Please enter a valid email address.'
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.'
      default:
        return fallbackMessage || 'Unable to create account. Please try again.'
    }
  }

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
      const trimmedEmail = email.trim()
      const trimmedBandName = bandName.trim()
      const trimmedInviteToken = inviteToken.trim()

      if (!trimmedBandName) {
        throw new Error('Please enter your band or planner name.')
      }

      let invDoc = null

      if (trimmedInviteToken) {
        const invQuery = query(
          collection(db, 'invitations'),
          where('token', '==', trimmedInviteToken)
        )
        const invSnapshot = await getDocs(invQuery)

        if (invSnapshot.empty) {
          throw new Error('Invitation token is invalid.')
        }

        invDoc = invSnapshot.docs[0]
        const invData = invDoc.data()

        if (new Date() > invData.expiresAt.toDate()) {
          throw new Error('Invitation token has expired.')
        }

        if (invData.claimed) {
          throw new Error('Invitation token has already been used.')
        }
      }

      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password)
      const user = userCredential.user

      // Create band/planner profile keyed by user ID
      const bandData = {
        email: trimmedEmail,
        bandName: trimmedBandName,
        userId: user.uid,
        status: 'active',
        inviteTokenUsed: Boolean(trimmedInviteToken),
        createdAt: new Date(),
      }

      await setDoc(doc(db, 'bands', user.uid), bandData)

      if (invDoc) {
        await updateDoc(invDoc.ref, {
          claimed: true,
          claimedAt: new Date(),
          bandId: user.uid,
        })
      }

      setUser(user)
    } catch (err) {
      setError(getAuthErrorMessage(err.code, err.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>BRB Coffee - Sign Up</h1>
        <form onSubmit={handleSignUp}>
          <div className="form-group">
            <label>Invitation Token (Optional)</label>
            <input
              type="text"
              value={inviteToken}
              onChange={(e) => setInviteToken(e.target.value)}
              placeholder="Paste token if you have one"
            />
          </div>
          <div className="form-group">
            <label>Band / Planner Name</label>
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
          Already have an account? <button type="button" onClick={() => setShowSignUp(false)}>Login</button>
        </p>
      </div>
    </div>
  )
}

export default SignUp
