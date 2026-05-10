import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

export default function AuthModal({ open, onClose, T }) {
  const { login, register } = useAuth()

  const [tab, setTab] = useState('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [username, setUsername] = useState('')
  const [rEmail, setREmail] = useState('')
  const [rPassword, setRPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  if (!open) return null

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
  
    try {
      await login(email, password)
      onClose() // только если success
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (rPassword !== confirm) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await register(username, rEmail, rPassword)
      onClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position:'fixed', inset:0 }}>
      <div>
        <button onClick={onClose}>X</button>

        <button onClick={() => setTab('login')}>Login</button>
        <button onClick={() => setTab('register')}>Register</button>

        {error && <div>{error}</div>}

        {tab === 'login' ? (
          <form onSubmit={handleLogin}>
            <input value={email} onChange={e=>setEmail(e.target.value)} />
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} />
            <button disabled={loading}>Login</button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <input value={username} onChange={e=>setUsername(e.target.value)} />
            <input value={rEmail} onChange={e=>setREmail(e.target.value)} />
            <input type="password" value={rPassword} onChange={e=>setRPassword(e.target.value)} />
            <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} />
            <button disabled={loading}>Register</button>
          </form>
        )}
      </div>
    </div>
  )
}