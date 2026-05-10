import MiniGridPreview from '../components/MiniGridPreview.jsx'
import { buttonStyle, pillStyle, DIFFICULTIES } from '../styles/theme.js'

const FEATURES = [
  { icon: '🧠', title: 'AI Hint System',      desc: 'Get intelligent move suggestions with step-by-step reasoning using real Sudoku techniques.' },
  { icon: '📅', title: 'Daily Challenge',      desc: 'Compete globally on the same puzzle every day. Climb the daily leaderboard.' },
  { icon: '📊', title: 'Progress Tracking',    desc: 'Detailed stats, streak tracking, win rates, and personal bests over time.' },
  { icon: '⚡', title: 'Four Difficulties',    desc: 'Easy through Expert — adaptive challenge for beginners and masters alike.' },
  { icon: '🏆', title: 'Global Leaderboards',  desc: 'Daily, weekly, and all-time rankings. See how you stack up worldwide.' },
  { icon: '✏️', title: 'Smart Notes Mode',     desc: 'Annotate cells with candidate numbers. Notes auto-clear when conflicts are resolved.' },
  { icon: '🎯', title: 'Mistake Detection',    desc: 'Instant conflict highlighting with soft, non-aggressive visual feedback.' },
  { icon: '🔥', title: 'Streak System',        desc: 'Build daily habits with streak tracking, achievement badges, and gamification.' },
]

const STATS_HERO = [
  { n: '50K+',   l: 'Active Players'    },
  { n: '2M+',    l: 'Puzzles Solved'    },
  { n: '99.9%',  l: 'Uptime'            },
  { n: '4.9 ★',  l: 'User Rating'       },
]

export default function HomePage({ T, startGame, startDaily }) {
  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '48px 24px 80px' }}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section style={{ textAlign: 'center', padding: '64px 0 72px' }}>
        <div style={{ ...pillStyle(T), marginBottom: 24, fontSize: 13 }}>
          🧠 Brain Training Platform
        </div>

        <h1 style={{
          fontSize:   'clamp(38px, 6.5vw, 72px)',
          fontWeight: 900,
          lineHeight: 1.08,
          letterSpacing: '-2px',
          marginBottom: 24,
          fontFamily: 'Outfit, sans-serif',
          background: `linear-gradient(140deg, ${T.text} 0%, ${T.accentLight} 55%, ${T.accent} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor:  'transparent',
          backgroundClip:       'text',
        }}>
          Train your brain daily<br />with AI-powered Sudoku.
        </h1>

        <p style={{
          fontSize: 19, color: T.textMuted, maxWidth: 540,
          margin: '0 auto 40px', lineHeight: 1.65, fontFamily: 'Outfit, sans-serif',
        }}>
          Neuroku transforms classic Sudoku into a modern brain-training experience
          with daily challenges, AI hints, streaks, and beautiful cross-platform gameplay.
        </p>

        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => startGame('medium')}
            style={{ ...buttonStyle(T, 'primary'), fontSize: 17, padding: '15px 36px' }}
          >
            ▶ Start Playing
          </button>
          <button
            onClick={startDaily}
            style={{ ...buttonStyle(T, 'default'), fontSize: 17, padding: '15px 36px' }}
          >
            📅 Today's Challenge
          </button>
        </div>
      </section>

      {/* ── Board preview ─────────────────────────────────────────────────── */}
      <section style={{ display: 'flex', justifyContent: 'center', marginBottom: 80 }}>
        <MiniGridPreview T={T} />
      </section>

      {/* ── Social proof ─────────────────────────────────────────────────── */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 14, marginBottom: 80,
      }}>
        {STATS_HERO.map(s => (
          <div key={s.l} style={{
            background:   T.card,
            border:       `1px solid ${T.border}`,
            borderRadius: 16,
            padding:      '22px 16px',
            textAlign:    'center',
          }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: T.accentLight, fontFamily: 'Outfit, sans-serif' }}>{s.n}</div>
            <div style={{ fontSize: 13, color: T.textMuted, marginTop: 5 }}>{s.l}</div>
          </div>
        ))}
      </section>

      {/* ── Difficulty selector ───────────────────────────────────────────── */}
      <section style={{ marginBottom: 80 }}>
        <h2 style={{ fontSize: 30, fontWeight: 800, marginBottom: 8, fontFamily: 'Outfit, sans-serif', color: T.text }}>
          Pick your challenge
        </h2>
        <p style={{ color: T.textMuted, marginBottom: 28, fontSize: 16 }}>
          From first-timer to grandmaster — there's a level for every brain.
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 14,
        }}>
          {Object.entries(DIFFICULTIES).map(([key, d]) => (
            <button
              key={key}
              onClick={() => startGame(key)}
              style={{
                background:  T.card,
                border:      `1.5px solid ${T.border}`,
                borderRadius: 16,
                padding:     '22px 20px',
                textAlign:   'left',
                cursor:      'pointer',
                fontFamily:  'Outfit, sans-serif',
                transition:  'all 0.2s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = d.color; e.currentTarget.style.background = `${d.color}11` }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.card }}
            >
              <div style={{ fontSize: 28, marginBottom: 10 }}>{d.emoji}</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: T.text, marginBottom: 4 }}>{d.label}</div>
              <div style={{ fontSize: 13, color: T.textMuted }}>
                {key === 'easy'   && 'More givens, gentle start.'}
                {key === 'medium' && 'Balanced challenge for most.'}
                {key === 'hard'   && 'Fewer hints, more deduction.'}
                {key === 'expert' && 'Maximum difficulty. Good luck.'}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section style={{ marginBottom: 80 }}>
        <h2 style={{ fontSize: 30, fontWeight: 800, marginBottom: 8, fontFamily: 'Outfit, sans-serif', color: T.text }}>
          Everything you need
        </h2>
        <p style={{ color: T.textMuted, marginBottom: 28, fontSize: 16 }}>Not just another Sudoku app.</p>

        <div style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap:                 14,
        }}>
          {FEATURES.map(f => (
            <div
              key={f.title}
              style={{
                background:   T.card,
                border:       `1px solid ${T.border}`,
                borderRadius: 16,
                padding:      '22px 20px',
                transition:   'border-color 0.2s, transform 0.2s',
                cursor:       'default',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = `${T.accent}88`
                e.currentTarget.style.transform   = 'translateY(-2px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = T.border
                e.currentTarget.style.transform   = 'translateY(0)'
              }}
            >
              <div style={{ fontSize: 30, marginBottom: 12 }}>{f.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 7, color: T.text, fontFamily: 'Outfit, sans-serif' }}>{f.title}</div>
              <div style={{ fontSize: 14, color: T.textMuted, lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section style={{
        background:    `linear-gradient(135deg, ${T.accent}1a, ${T.accentLight}0d)`,
        border:        `1px solid ${T.accent}44`,
        borderRadius:  24,
        padding:       '52px 36px',
        textAlign:     'center',
      }}>
        <h2 style={{ fontSize: 34, fontWeight: 800, marginBottom: 12, fontFamily: 'Outfit, sans-serif', color: T.text }}>
          Ready to train?
        </h2>
        <p style={{ color: T.textMuted, marginBottom: 32, fontSize: 16 }}>
          Join thousands improving their mind every single day.
        </p>
        <button
          onClick={() => startGame('easy')}
          style={{ ...buttonStyle(T, 'primary'), fontSize: 17, padding: '15px 40px' }}
        >
          Start Training Free →
        </button>
      </section>
    </div>
  )
}