// ─── Neuroku Design System ───────────────────────────────────────────────────
// Single source of truth for all visual tokens.
// Import `useTheme` hook or `THEMES` object wherever styling is needed.

export const THEMES = {
    dark: {
      // Backgrounds
      bg:           '#0d0d12',
      surface:      '#16161f',
      card:         '#1e1e2a',
      cardHover:    '#252535',
      overlay:      '#00000099',
  
      // Borders
      border:       '#2a2a3a',
      borderStrong: '#3a3a55',
  
      // Accent (violet/purple)
      accent:       '#7c6af7',
      accentDim:    '#7c6af722',
      accentLight:  '#a89af9',
      accentDark:   '#5a4ad4',
  
      // Text
      text:         '#f0eeff',
      textMuted:    '#8b8aaa',
      textFaint:    '#55546a',
  
      // Cell states
      cellBg:       '#1e1e2a',
      cellHover:    '#252535',
      cellSelected: '#2d2b50',
      cellSameNum:  '#26243f',
      cellConflict: '#3a1f2a',
      cellHighlight:'#22213a',
  
      // Number colors
      given:        '#a89af9',
      user:         '#ffffff',
      wrong:        '#f87171',
      notes:        '#7c6af7',
  
      // Status
      success:      '#4ade80',
      successDim:   '#4ade8022',
      warning:      '#fbbf24',
      warningDim:   '#fbbf2422',
      danger:       '#f87171',
      dangerDim:    '#f8717122',
      info:         '#60a5fa',
      infoDim:      '#60a5fa22',
    },
  
    light: {
      bg:           '#f5f4ff',
      surface:      '#ffffff',
      card:         '#ffffff',
      cardHover:    '#f7f5ff',
      overlay:      '#00000066',
  
      border:       '#e4e2f5',
      borderStrong: '#c8c4f0',
  
      accent:       '#6c5ce7',
      accentDim:    '#6c5ce715',
      accentLight:  '#8b7ef8',
      accentDark:   '#4c3abd',
  
      text:         '#1a1830',
      textMuted:    '#6b6880',
      textFaint:    '#aaa8c0',
  
      cellBg:       '#ffffff',
      cellHover:    '#f0eeff',
      cellSelected: '#e8e4ff',
      cellSameNum:  '#f2f0ff',
      cellConflict: '#ffe4e4',
      cellHighlight:'#f5f3ff',
  
      given:        '#4c3abd',
      user:         '#1a1830',
      wrong:        '#dc2626',
      notes:        '#6c5ce7',
  
      success:      '#16a34a',
      successDim:   '#16a34a15',
      warning:      '#d97706',
      warningDim:   '#d9770615',
      danger:       '#dc2626',
      dangerDim:    '#dc262615',
      info:         '#2563eb',
      infoDim:      '#2563eb15',
    },
  }
  
  // Optional unlockable themes (color overrides on top of dark base)
  export const UNLOCKABLE_THEMES = {
    neon: {
      accent:      '#00ff88',
      accentLight: '#66ffb2',
      accentDim:   '#00ff8822',
      bg:          '#070a0d',
      surface:     '#0d1117',
      card:        '#111820',
      given:       '#00ff88',
      notes:       '#00cc6a',
    },
    cyberpunk: {
      accent:      '#ff2d78',
      accentLight: '#ff6ea8',
      accentDim:   '#ff2d7822',
      bg:          '#0a0510',
      surface:     '#110a1a',
      card:        '#190f26',
      given:       '#ff9f00',
      notes:       '#ff2d78',
    },
    forest: {
      accent:      '#4ade80',
      accentLight: '#86efac',
      accentDim:   '#4ade8022',
      bg:          '#060d08',
      surface:     '#0d1610',
      card:        '#121f15',
      given:       '#86efac',
      notes:       '#4ade80',
    },
  }
  
  // Difficulty metadata
  export const DIFFICULTIES = {
    easy:   { label: 'Easy',   removals: 36, color: '#4ade80', emoji: '🌱' },
    medium: { label: 'Medium', removals: 46, color: '#fbbf24', emoji: '⚡' },
    hard:   { label: 'Hard',   removals: 52, color: '#f97316', emoji: '🔥' },
    expert: { label: 'Expert', removals: 58, color: '#f87171', emoji: '💀' },
  }
  
  // Reusable style factories
  export const buttonStyle = (T, variant = 'default') => {
    const base = {
      fontFamily: 'Outfit, sans-serif',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.18s ease',
      borderRadius: 12,
      border: 'none',
      outline: 'none',
    }
    const variants = {
      default: {
        background: T.card,
        color: T.text,
        border: `1.5px solid ${T.border}`,
        padding: '11px 22px',
        fontSize: 15,
      },
      primary: {
        background: T.accent,
        color: '#fff',
        padding: '12px 24px',
        fontSize: 15,
        boxShadow: `0 4px 20px ${T.accent}44`,
      },
      ghost: {
        background: 'transparent',
        color: T.textMuted,
        border: `1px solid transparent`,
        padding: '8px 14px',
        fontSize: 14,
      },
      active: {
        background: T.accent,
        color: '#fff',
        padding: '11px 22px',
        fontSize: 15,
      },
      danger: {
        background: T.dangerDim,
        color: T.danger,
        border: `1.5px solid ${T.danger}44`,
        padding: '11px 22px',
        fontSize: 15,
      },
    }
    return { ...base, ...variants[variant] }
  }
  
  export const cardStyle = (T, options = {}) => ({
    background: T.card,
    border: `1px solid ${options.accent ? T.accent + '55' : T.border}`,
    borderRadius: options.radius ?? 16,
    padding: options.padding ?? '20px 24px',
    transition: 'border-color 0.2s',
  })
  
  export const pillStyle = (T, color = null) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 12px',
    borderRadius: 100,
    fontSize: 13,
    fontWeight: 600,
    background: color ? `${color}22` : T.accentDim,
    color: color ?? T.accentLight,
    border: `1px solid ${color ? color + '44' : T.accent + '44'}`,
  })