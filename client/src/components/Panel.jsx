import { motion } from 'framer-motion'

export function Panel({ children, maxWidth = 460 }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{
          background: 'rgba(8,40,18,0.88)',
          border: '2px solid rgba(245,197,24,0.3)',
          borderRadius: 18,
          backdropFilter: 'blur(14px)',
          boxShadow: '0 12px 48px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.05)',
          padding: 32,
          width: '100%',
          maxWidth,
        }}
      >
        {children}
      </motion.div>
    </div>
  )
}

export function PanelTitle({ children }) {
  return (
    <h1 style={{
      fontFamily: "'Baloo 2', cursive", fontSize: '2.6rem', fontWeight: 800,
      textAlign: 'center', color: '#f5c518',
      textShadow: '0 2px 10px rgba(0,0,0,.5), 0 0 24px rgba(245,197,24,.4)',
      letterSpacing: 2, marginBottom: 4,
    }}>{children}</h1>
  )
}

export function PanelSubtitle({ children }) {
  return (
    <p style={{
      textAlign: 'center', color: 'rgba(255,255,255,.5)',
      fontSize: '.85rem', fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: '1.5px', marginBottom: 28,
    }}>{children}</p>
  )
}

export function InputLabel({ children }) {
  return (
    <label style={{
      display: 'block', fontSize: '.75rem', fontWeight: 800,
      textTransform: 'uppercase', letterSpacing: '1px',
      color: 'rgba(255,255,255,.5)', marginBottom: 6,
    }}>{children}</label>
  )
}

export function Divider({ children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      margin: '18px 0', color: 'rgba(255,255,255,.28)',
      fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1,
    }}>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.1)' }} />
      {children}
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.1)' }} />
    </div>
  )
}
