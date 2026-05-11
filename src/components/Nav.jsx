import { useState, useMemo, useCallback, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

const NAV_LINKS = [
  { id: 'home',        label: 'Home',       icon: '⬡' },
  { id: 'play',        label: 'Play',       icon: '▶' },
  { id: 'daily',       label: 'Daily',      icon: '📅' },
  { id: 'leaderboard', label: 'Rankings',   icon: '🏆' },
]

export default function Nav({
  page,
  setPage,
  theme,
  setTheme,
  T,
  openAuth,
}) {
  const { user, logout } = useAuth()

  const [mobileOpen, setMobileOpen] = useState(false)

  // close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [page])

  // ──────────────────────────────
  // STYLE HELPERS
  // ──────────────────────────────
  const navLinkStyle = useCallback(
    (id) => ({
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '8px 14px',
      borderRadius: 10,
      fontSize: 14,
      fontWeight: 600,
      fontFamily: 'Outfit, sans-serif',
      background: page === id ? T.accentDim : 'transparent',
      color: page === id ? T.accentLight : T.textMuted,
      border: `1px solid ${page === id ? T.accent + '44' : 'transparent'}`,
      cursor: 'pointer',
      transition: 'all 0.18s ease',
      whiteSpace: 'nowrap',
      userSelect: 'none',
    }),
    [page, T]
  )

  const containerStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: 64,
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    background: `${T.surface}ee`,
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderBottom: `1px solid ${T.border}`,
  }

  const logoStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
  }

  const logoBox = {
    width: 34,
    height: 34,
    borderRadius: 10,
    background: `linear-gradient(135deg, ${T.accent}, ${T.accentLight})`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    fontWeight: 900,
    color: '#fff',
    boxShadow: `0 4px 12px ${T.accent}55`,
  }

  const rightSide = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  }

  // ──────────────────────────────
  // NAV ITEMS
  // ──────────────────────────────
  const links = useMemo(() => {
    const base = [...NAV_LINKS]
    return base
  }, [user])

  // ──────────────────────────────
  // HANDLERS
  // ──────────────────────────────
  const handleNavigate = (id) => {
    setPage(id)
  }

  const handleAuthClick = () => {
    if (openAuth) openAuth()
  }

  const toggleTheme = () => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }

  // ──────────────────────────────
  // RENDER
  // ──────────────────────────────
  return (
    <>
      <nav style={containerStyle}>
        {/* LOGO */}
        <button
          onClick={() => setPage('home')}
          style={logoStyle}
        >
          <div style={logoBox}>N</div>
          <span
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: T.text,
              fontFamily: 'Outfit, sans-serif',
            }}
          >
            Neuroku
          </span>
        </button>

        {/* RIGHT SIDE */}
        <div style={rightSide}>
          {/* DESKTOP LINKS */}
          <div className="nav-desktop" style={{ display: 'flex', gap: 6 }}>
            {links.map((n) => (
              <button
                key={n.id}
                onClick={() => handleNavigate(n.id)}
                style={navLinkStyle(n.id)}
              >
                {n.label}
              </button>
            ))}
          </div>

          {/* AUTH BLOCK */}
          {user ? (
            <div
              className="nav-desktop"
              style={{ display: 'flex', gap: 8, marginLeft: 8 }}
            >
              <button
                onClick={() => setPage('profile')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 14px',
                  borderRadius: 12,
                  border: `1px solid ${T.border}`,
                  background: T.card,
                  color: T.text,
                  fontWeight: 600,
                  fontFamily: 'Outfit',
                  cursor: 'pointer',
                }}
              >
                👤 {user.user_metadata?.username || 'Profile'}
              </button>

              <button
                onClick={logout}
                style={{
                  padding: '8px 12px',
                  borderRadius: 10,
                  border: `1px solid ${T.border}`,
                  background: 'transparent',
                  color: T.textMuted,
                  cursor: 'pointer',
                  fontFamily: 'Outfit',
                }}
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={handleAuthClick}
              className="nav-desktop"
              style={{
                marginLeft: 8,
                padding: '9px 16px',
                borderRadius: 12,
                border: 'none',
                background: `linear-gradient(135deg, ${T.accent}, ${T.accentLight})`,
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 700,
                fontFamily: 'Outfit',
                boxShadow: `0 4px 16px ${T.accent}44`,
              }}
            >
              Login
            </button>
          )}

          {/* THEME */}
          <button
            onClick={toggleTheme}
            title="Toggle theme"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: T.card,
              border: `1px solid ${T.border}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {/* MOBILE MENU BUTTON */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="nav-mobile-toggle"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: T.card,
              border: `1px solid ${T.border}`,
              cursor: 'pointer',
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ☰
          </button>
        </div>
      </nav>

      {/* MOBILE MENU */}
      {mobileOpen && (
        <div
          style={{
            position: 'fixed',
            top: 64,
            left: 0,
            right: 0,
            zIndex: 99,
            background: T.surface,
            borderBottom: `1px solid ${T.border}`,
            padding: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          {links.map((n) => (
            <button
              key={n.id}
              onClick={() => handleNavigate(n.id)}
              style={{
                ...navLinkStyle(n.id),
                justifyContent: 'flex-start',
                fontSize: 16,
              }}
            >
              <span style={{ fontSize: 18 }}>{n.icon}</span>
              {n.label}
            </button>
          ))}

          <div style={{ marginTop: 10, borderTop: `1px solid ${T.border}`, paddingTop: 10 }}>
            {user ? (
              <>
                <button
                  onClick={() => setPage('profile')}
                  style={navLinkStyle('profile')}
                >
                  👤 {user.user_metadata?.username || 'Profile'}
                </button>

                <button
                  onClick={logout}
                  style={{
                    ...navLinkStyle('logout'),
                    color: '#ff7777',
                  }}
                >
                  🚪 Logout
                </button>
              </>
            ) : (
              <button
                onClick={handleAuthClick}
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 12,
                  border: 'none',
                  background: `linear-gradient(135deg, ${T.accent}, ${T.accentLight})`,
                  color: '#fff',
                  fontWeight: 700,
                }}
              >
                Login / Register
              </button>
            )}
          </div>
        </div>
      )}

      {/* RESPONSIVE */}
      <style>{`
        @media (max-width: 760px) {
          .nav-desktop {
            display: none !important;
          }
          .nav-mobile-toggle {
            display: flex !important;
          }
        }
      `}</style>
    </>
  )
}