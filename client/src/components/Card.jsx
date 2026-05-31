import { motion } from 'framer-motion'

const SYM = { 'Cœur': '♥', 'Carreau': '♦', 'Trèfle': '♣', 'Pique': '♠' }
const COLOR = { 'Cœur': 'red', 'Carreau': 'red', 'Trèfle': 'black', 'Pique': 'black' }

const cardBase = {
  width: 64,
  height: 92,
  borderRadius: 10,
  background: '#fdf6e3',
  boxShadow: '2px 2px 0 rgba(0,0,0,.25), 0 6px 16px rgba(0,0,0,.35)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  alignItems: 'stretch',
  padding: 5,
  cursor: 'pointer',
  border: '2px solid rgba(0,0,0,.08)',
  userSelect: 'none',
  position: 'relative',
  flexShrink: 0,
}

export function Card({ carte, selected, disabled, onClick, pileSel }) {
  const s = SYM[carte.couleur] || '?'
  const isRed = COLOR[carte.couleur] === 'red'
  const textColor = isRed ? '#e53935' : '#1a1a2e'

  const corner = (flip = false) => (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      lineHeight: 1,
      ...(flip ? { alignSelf: 'flex-end', transform: 'rotate(180deg)' } : {}),
    }}>
      <span style={{ fontFamily: "'Baloo 2', cursive", fontSize: 13, fontWeight: 800, color: textColor, lineHeight: 1 }}>{carte.valeur}</span>
      <span style={{ fontSize: 11, color: textColor, lineHeight: 1 }}>{s}</span>
    </div>
  )

  return (
    <motion.div
      onClick={disabled ? undefined : onClick}
      initial={{ y: -40, opacity: 0, scale: 0.8, rotate: -6 }}
      animate={{
        y: selected ? -16 : pileSel ? -9 : 0,
        opacity: disabled ? 0.48 : 1,
        scale: selected ? 1.08 : pileSel ? 1.06 : 1,
        rotate: 0,
        boxShadow: selected
          ? '0 0 0 3px rgba(34,197,94,.5), 0 14px 28px rgba(0,0,0,.5)'
          : pileSel
          ? '0 0 0 3px rgba(245,197,24,.5), 0 10px 24px rgba(0,0,0,.5)'
          : '2px 2px 0 rgba(0,0,0,.25), 0 6px 16px rgba(0,0,0,.35)',
      }}
      whileHover={!disabled && !selected ? { y: -9, scale: 1.06, zIndex: 20 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      style={{
        ...cardBase,
        background: selected ? '#f0fff5' : '#fdf6e3',
        border: selected
          ? '2.5px solid #22c55e'
          : pileSel
          ? '2.5px solid #f5c518'
          : '2px solid rgba(0,0,0,.08)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        pointerEvents: disabled ? 'none' : 'auto',
      }}
    >
      {corner()}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <span style={{ fontSize: 26, color: textColor }}>{s}</span>
      </div>
      {corner(true)}
    </motion.div>
  )
}

/* Carte dos (adversaires) */
export function CardBack({ style = {} }) {
  return (
    <motion.div
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      style={{
        width: 34, height: 50,
        borderRadius: 5,
        background: 'linear-gradient(145deg,#1e3a8a,#1e40af)',
        border: '1.5px solid rgba(255,255,255,.25)',
        boxShadow: '0 3px 8px rgba(0,0,0,.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, flexShrink: 0,
        position: 'relative',
        ...style,
      }}
    >
      <div style={{
        position: 'absolute', inset: 3,
        border: '1px solid rgba(255,255,255,.12)',
        borderRadius: 3,
      }} />
    </motion.div>
  )
}

/* Pile de pioche */
export function DrawPile({ count, selected, disabled, onClick }) {
  return (
    <motion.div
      onClick={disabled ? undefined : onClick}
      whileHover={!disabled && !selected ? { y: -8, scale: 1.06 } : {}}
      animate={{
        y: selected ? -10 : 0,
        scale: selected ? 1.08 : 1,
        borderColor: selected ? '#f5c518' : 'rgba(255,255,255,.2)',
        boxShadow: selected
          ? '0 0 0 3px rgba(245,197,24,.4), 0 10px 24px rgba(0,0,0,.5)'
          : '3px 3px 0 rgba(0,0,0,.3), 6px 6px 0 rgba(0,0,0,.15)',
      }}
      transition={{ type: 'spring', stiffness: 380, damping: 26 }}
      style={{
        width: 64, height: 92,
        borderRadius: 10,
        background: 'linear-gradient(145deg,#1e3a8a,#1e40af)',
        border: '2px solid rgba(255,255,255,.2)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 2,
        color: '#fff', position: 'relative', overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', inset: 5, border: '1.5px dashed rgba(255,255,255,.2)', borderRadius: 7 }} />
      <span style={{ fontSize: 22 }}>🂠</span>
      <span style={{ fontFamily: "'Baloo 2', cursive", fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,.75)' }}>{count}</span>
      <span style={{ fontSize: 9, opacity: 0.55, marginTop: 2 }}>{selected ? '✓ Sélec.' : 'Piocher'}</span>
    </motion.div>
  )
}
