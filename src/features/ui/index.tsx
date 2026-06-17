import React from 'react'
import { COLORS, MONO } from '@/lib/constants'

// ─── Style objects ────────────────────────────────────────────────────────────
export const styles = {
  pill: (variant: string = 'muted'): React.CSSProperties => {
    const m: Record<string, { c: string; b: string; bg: string }> = {
      green:   { c: COLORS.green, b: '#3DD68C30', bg: COLORS.greenDim },
      cyan:    { c: COLORS.cyan,  b: '#38BDF830', bg: COLORS.cyanDim },
      amber:   { c: COLORS.amber, b: '#F5A62330', bg: COLORS.amberDim },
      red:     { c: COLORS.red,   b: '#F8717130', bg: '#F8717112' },
      purple:  { c: COLORS.purple,b: '#A78BFA30', bg: COLORS.purpleDim },
      muted:   { c: COLORS.muted, b: COLORS.border2, bg: COLORS.surface2 },
    }
    const s = m[variant] || m.muted
    return {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '2px 8px',
      borderRadius: 3,
      fontFamily: MONO,
      fontSize: 10,
      border: `1px solid ${s.b}`,
      color: s.c,
      background: s.bg,
      whiteSpace: 'nowrap',
    }
  },

  btn: (variant: string = 'sec', extra: React.CSSProperties = {}): React.CSSProperties => {
    const base: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      padding: '9px 16px',
      borderRadius: 4,
      fontFamily: MONO,
      fontWeight: 500,
      fontSize: 12,
      cursor: 'pointer',
      border: 'none',
      transition: 'all .12s',
      flexShrink: 0,
      letterSpacing: '0.02em',
    }
    const vs: Record<string, React.CSSProperties> = {
      pri:    { background: COLORS.amber, color: '#0E0E0F' },
      sec:    { background: COLORS.surface2, color: COLORS.text, border: `1px solid ${COLORS.border2}` },
      danger: { background: '#F8717112', color: COLORS.red, border: '1px solid #F8717130' },
      ghost:  { background: 'transparent', color: COLORS.muted, border: 'none', padding: '6px 10px' },
      cyan:   { background: COLORS.cyanDim, color: COLORS.cyan, border: '1px solid #38BDF830' },
    }
    return { ...base, ...(vs[variant] || vs.sec), ...extra }
  },

  input: {
    width: '100%',
    background: COLORS.bg,
    border: `1px solid ${COLORS.border2}`,
    borderRadius: 4,
    padding: '9px 12px',
    color: COLORS.text,
    fontFamily: MONO,
    fontSize: 12,
    outline: 'none',
    boxSizing: 'border-box' as const,
    letterSpacing: '0.01em',
  } as React.CSSProperties,

  label: {
    fontFamily: MONO,
    fontSize: 10,
    color: COLORS.muted,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    marginBottom: 5,
    display: 'block' as const,
  } as React.CSSProperties,
}

// ─── Reusable components ──────────────────────────────────────────────────────
export const Dot: React.FC<{ color?: string; sz?: number }> = ({ color, sz = 6 }) => (
  <span
    style={{
      width: sz,
      height: sz,
      borderRadius: '50%',
      background: color || 'currentColor',
      display: 'inline-block',
      flexShrink: 0,
    }}
  />
)

export const HR: React.FC<{ m?: string }> = ({ m = '0 16px' }) => (
  <div style={{ height: 1, background: COLORS.border, margin: m }} />
)

interface SelectInputProps {
  label?: string
  value: string
  onChange: (v: string) => void
  options: Array<{ value: string; label: string } | string>
}

export const SelectInput: React.FC<SelectInputProps> = ({ label: lbl, value, onChange, options }) => (
  <div>
    {lbl && <label style={styles.label}>{lbl}</label>}
    <div style={{ position: 'relative' }}>
      <select
        style={{ ...styles.input, appearance: 'none' } as React.CSSProperties}
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        {options.map(o => {
          const v = typeof o === 'string' ? o : o.value
          const l = typeof o === 'string' ? o : o.label
          return (
            <option key={v} value={v}>
              {l}
            </option>
          )
        })}
      </select>
      <span
        style={{
          position: 'absolute',
          right: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          color: COLORS.muted,
          pointerEvents: 'none',
          fontSize: 10,
        }}
      >
        ▾
      </span>
    </div>
  </div>
)

interface SlidePanelProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export const SlidePanel: React.FC<SlidePanelProps> = ({ open, onClose, title, children }) => (
  <>
    {open && (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: '#00000060',
          zIndex: 90,
          backdropFilter: 'blur(2px)',
        }}
        onClick={onClose}
      />
    )}
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: COLORS.surface,
        borderTop: `2px solid ${COLORS.amber}`,
        borderRadius: '16px 16px 0 0',
        zIndex: 100,
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        transform: open ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform .25s cubic-bezier(.32,.72,0,1)',
      }}
    >
      <div
        style={{
          padding: '12px 20px 10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${COLORS.border}`,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: MONO,
            fontSize: 12,
            fontWeight: 600,
            color: COLORS.amber,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {title}
        </span>
        <button onClick={onClose} style={{ ...styles.btn('ghost', { fontSize: 18, padding: '4px 8px', color: COLORS.muted }) }}>
          ✕
        </button>
      </div>
      <div style={{ overflowY: 'auto', flex: 1 }}>{children}</div>
    </div>
  </>
)

interface ModalProps {
  onClose: () => void
  title: string
  children: React.ReactNode
  width?: number
}

export const Modal: React.FC<ModalProps> = ({ onClose, title, children, width = 400 }) => (
  <div
    style={{
      position: 'fixed',
      inset: 0,
      background: '#0E0E0FCC',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      zIndex: 200,
      padding: 0,
    }}
    onClick={e => {
      if (e.target === e.currentTarget) onClose()
    }}
  >
    <div
      style={{
        background: COLORS.surface,
        borderTop: `2px solid ${COLORS.amber}`,
        borderRadius: '16px 16px 0 0',
        padding: 24,
        width: '100%',
        maxWidth: width,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        maxHeight: '92vh',
        overflowY: 'auto',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontFamily: MONO,
            fontSize: 13,
            fontWeight: 600,
            color: COLORS.amber,
            letterSpacing: '0.04em',
          }}
        >
          {title}
        </span>
        <button onClick={onClose} style={{ ...styles.btn('ghost', { fontSize: 18, color: COLORS.muted }) }}>
          ✕
        </button>
      </div>
      {children}
    </div>
  </div>
)
