import { useState } from 'react'

const NAV_LINKS = [
  { id: 'home',        label: 'Home',       icon: '⬡' },
  { id: 'play',        label: 'Play',       icon: '▶' },
  { id: 'daily',       label: 'Daily',      icon: '📅' },
  { id: 'leaderboard', label: 'Rankings',   icon: '🏆' },
  { id: 'stats',       label: 'Stats',      icon: '📊' },
]

export default function Nav({ page, setPage, theme, setTheme, T }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const navLinkStyle = (id) => ({
    display:        'flex',
    alignItems:     'center',
    gap:            6,
    padding:        '7px 14px',
    borderRadius:   10,
    fontSize:       14,
    fontWeight:     500,
    fontFamily:     'Outfit, sans-serif',
    background:     page === id ? T.accentDim : 'transparent',
    color:          page === id ? T.accentLight : T.textMuted,
    border:         `1px solid ${page === id ? T.accent + '44' : 'transparent'}`,
    cursor:         'pointer',
    transition:     'all 0.18s ease',
    whiteSpace:     'nowrap',
  })

  return (
    <>
      <nav style={{
        position:       'fixed',
        top:            0, left: 0, right: 0,
        height:         64,
        zIndex:         100,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        '0 24px',
        background:     `${T.surface}ee`,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom:   `1px solid ${T.border}`,
      }}>
        {/* Logo */}
        <button
          onClick={() => setPage('home')}
          style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: `linear-gradient(135deg, ${T.accent}, ${T.accentLight})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 900, color: '#fff',
            boxShadow: `0 4px 12px ${T.accent}55`,
          }}>N</div>
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', color: T.text, fontFamily: 'Outfit, sans-serif' }}>
            Neuroku
          </span>
        </button>

        {/* Desktop links */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 4 }} className="nav-desktop">
            {NAV_LINKS.map(n => (
              <button key={n.id} onClick={() => setPage(n.id)} style={navLinkStyle(n.id)}>
                {n.label}
              </button>
            ))}
          </div>

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            title="Toggle theme"
            style={{
              marginLeft: 8,
              width: 36, height: 36, borderRadius: 10,
              background: T.card, border: `1px solid ${T.border}`,
              cursor: 'pointer', fontSize: 17,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(o => !o)}
            className="nav-mobile-toggle"
            style={{
              marginLeft: 8, width: 36, height: 36, borderRadius: 10,
              background: T.card, border: `1px solid ${T.border}`,
              cursor: 'pointer', fontSize: 18, display: 'none',
              alignItems: 'center', justifyContent: 'center',
            }}
          >☰</button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div style={{
          position:   'fixed',
          top:        64, left: 0, right: 0,
          zIndex:     99,
          background: T.surface,
          borderBottom: `1px solid ${T.border}`,
          padding:    '12px 16px',
          display:    'flex',
          flexDirection: 'column',
          gap:        6,
        }}>
          {NAV_LINKS.map(n => (
            <button
              key={n.id}
              onClick={() => { setPage(n.id); setMobileOpen(false) }}
              style={{ ...navLinkStyle(n.id), justifyContent: 'flex-start', fontSize: 16, padding: '10px 16px' }}
            >
              <span style={{ fontSize: 18 }}>{n.icon}</span>
              {n.label}
            </button>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 600px) {
          .nav-desktop    { display: none !important; }
          .nav-mobile-toggle { display: flex !important; }
        }
      `}</style>
    </>
  )
}