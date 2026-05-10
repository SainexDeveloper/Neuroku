import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { buttonStyle, cardStyle } from '../styles/theme.js'

export default function AuthModal({ T, onClose, defaultTab = 'login' }) {
  const { login, register } = useAuth()
  const [tab,     setTab]     = useState(defaultTab)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  // Login fields
  const [loginEmail, setLoginEmail]       = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register fields
  const [regUsername, setRegUsername] = useState('')
  const [regEmail,    setRegEmail]    = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirm,  setRegConfirm]  = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(loginEmail.trim(), loginPassword)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    if (regPassword !== regConfirm) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      await register(regEmail.trim(), regPassword, regUsername.trim())
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width:        '100%',
    padding:      '11px 14px',
    borderRadius: 10,
    fontSize:     15,
    fontFamily:   'Outfit, sans-serif',
    background:   T.surface,
    color:        T.text,
    border:       `1.5px solid ${T.border}`,
    outline:      'none',
    transition:   'border-color 0.2s',
    boxSizing:    'border-box',
  }

  return (
    <div style={{
      position:       'fixed', inset: 0, zIndex: 300,
      background:     T.overlay, backdropFilter: 'blur(8px)',
      display:        'flex', alignItems: 'center', justifyContent: 'center',
      padding:        24,
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>

      <div style={{
        ...cardStyle(T, { accent: true, radius: 22, padding: '36px 32px' }),
        maxWidth: 420, width: '100%',
        boxShadow: `0 24px 80px #00000055, 0 0 0 1px ${T.accent}33`,
        animation: 'scaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>
        <style>{`@keyframes scaleIn{from{transform:scale(0.92);opacity:0}to{transform:scale(1);opacity:1}}`}</style>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: `linear-gradient(135deg, ${T.accent}, ${T.accentLight})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, color: '#fff', fontSize: 18,
            }}>N</div>
            <span style={{ fontSize: 20, fontWeight: 800, color: T.text, fontFamily: 'Outfit, sans-serif' }}>Neuroku</span>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: T.textMuted,
            cursor: 'pointer', fontSize: 22, lineHeight: 1,
          }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 4, marginBottom: 28,
          background: T.surface, borderRadius: 12, padding: 5,
          border: `1px solid ${T.border}`,
        }}>
          {['login', 'register'].map(t => (
            <button key={t} onClick={() => { setTab(t); setError('') }} style={{
              flex: 1, padding: '9px 0', borderRadius: 9,
              fontSize: 14, fontWeight: 600, fontFamily: 'Outfit, sans-serif',
              background: tab === t ? T.accent : 'transparent',
              color:      tab === t ? '#fff'   : T.textMuted,
              border:     'none', cursor: 'pointer', transition: 'all 0.2s',
              textTransform: 'capitalize',
            }}>{t === 'login' ? 'Sign In' : 'Sign Up'}</button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: T.dangerDim, border: `1px solid ${T.danger}44`,
            borderRadius: 10, padding: '10px 14px',
            color: T.danger, fontSize: 14, marginBottom: 18,
          }}>{error}</div>
        )}

        {/* Login form */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 13, color: T.textMuted, fontWeight: 600, display: 'block', marginBottom: 6 }}>Email</label>
              <input
                type="email" required placeholder="you@example.com"
                value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = T.accent}
                onBlur={e => e.target.style.borderColor = T.border}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, color: T.textMuted, fontWeight: 600, display: 'block', marginBottom: 6 }}>Password</label>
              <input
                type="password" required placeholder="••••••••"
                value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = T.accent}
                onBlur={e => e.target.style.borderColor = T.border}
              />
            </div>
            <button type="submit" disabled={loading} style={{
              ...buttonStyle(T, 'primary'),
              width: '100%', padding: '13px', fontSize: 16, marginTop: 4,
              opacity: loading ? 0.7 : 1,
            }}>
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
            <p style={{ textAlign: 'center', fontSize: 13, color: T.textMuted }}>
              No account?{' '}
              <button type="button" onClick={() => setTab('register')} style={{
                background: 'none', border: 'none', color: T.accentLight,
                cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: 'Outfit, sans-serif',
              }}>Sign up free</button>
            </p>
          </form>
        )}

        {/* Register form */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 13, color: T.textMuted, fontWeight: 600, display: 'block', marginBottom: 6 }}>Username</label>
              <input
                type="text" required placeholder="coolplayer42" minLength={3} maxLength={32}
                value={regUsername} onChange={e => setRegUsername(e.target.value)}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = T.accent}
                onBlur={e => e.target.style.borderColor = T.border}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, color: T.textMuted, fontWeight: 600, display: 'block', marginBottom: 6 }}>Email</label>
              <input
                type="email" required placeholder="you@example.com"
                value={regEmail} onChange={e => setRegEmail(e.target.value)}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = T.accent}
                onBlur={e => e.target.style.borderColor = T.border}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, color: T.textMuted, fontWeight: 600, display: 'block', marginBottom: 6 }}>Password</label>
              <input
                type="password" required placeholder="Min. 8 characters" minLength={8}
                value={regPassword} onChange={e => setRegPassword(e.target.value)}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = T.accent}
                onBlur={e => e.target.style.borderColor = T.border}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, color: T.textMuted, fontWeight: 600, display: 'block', marginBottom: 6 }}>Confirm Password</label>
              <input
                type="password" required placeholder="••••••••"
                value={regConfirm} onChange={e => setRegConfirm(e.target.value)}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = T.accent}
                onBlur={e => e.target.style.borderColor = T.border}
              />
            </div>
            <button type="submit" disabled={loading} style={{
              ...buttonStyle(T, 'primary'),
              width: '100%', padding: '13px', fontSize: 16, marginTop: 4,
              opacity: loading ? 0.7 : 1,
            }}>
              {loading ? 'Creating account…' : 'Create Account →'}
            </button>
            <p style={{ textAlign: 'center', fontSize: 13, color: T.textMuted }}>
              Already have an account?{' '}
              <button type="button" onClick={() => setTab('login')} style={{
                background: 'none', border: 'none', color: T.accentLight,
                cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: 'Outfit, sans-serif',
              }}>Sign in</button>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}