import { motion } from 'framer-motion'

const VARIANTS = {
  gold:   { bg: 'linear-gradient(135deg,#f5c518,#e6a800)', color: '#1a1a00', shadow: 'rgba(245,197,24,.4)' },
  green:  { bg: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#fff',    shadow: 'rgba(34,197,94,.4)' },
  red:    { bg: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff',    shadow: 'rgba(239,68,68,.4)' },
  blue:   { bg: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: '#fff',    shadow: 'rgba(59,130,246,.4)' },
  orange: { bg: 'linear-gradient(135deg,#f97316,#ea580c)', color: '#fff',    shadow: 'rgba(249,115,22,.4)' },
  purple: { bg: 'linear-gradient(135deg,#a855f7,#7c3aed)', color: '#fff',    shadow: 'rgba(168,85,247,.4)' },
  ghost:  { bg: 'transparent',                             color: 'rgba(255,255,255,.65)', shadow: 'none', border: '2px solid rgba(255,255,255,.2)' },
}

export function Button({ variant = 'blue', children, onClick, disabled, full, sm, style = {} }) {
  const v = VARIANTS[variant] || VARIANTS.blue
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { y: -1, boxShadow: `0 6px 20px ${v.shadow}` } : {}}
      whileTap={!disabled ? { scale: 0.96 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 24 }}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
        padding: sm ? '7px 13px' : '12px 20px',
        fontSize: sm ? 13 : 15,
        fontFamily: "'Nunito', sans-serif", fontWeight: 800,
        borderRadius: 10, border: v.border || 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        background: v.bg, color: v.color,
        boxShadow: `0 4px 14px ${v.shadow}`,
        width: full ? '100%' : undefined,
        letterSpacing: '.3px',
        ...style,
      }}
    >
      {children}
    </motion.button>
  )
}
