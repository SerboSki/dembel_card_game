import { motion } from 'framer-motion'
import { CardBack } from './Card'

export function OpponentSeat({ joueur, isActive }) {
  const count = joueur.main.length
  const max = Math.min(count, 7)
  const spread = 13

  return (
    <motion.div
      animate={{
        borderColor: isActive ? 'rgba(34,197,94,.6)' : 'rgba(255,255,255,.08)',
        background: isActive ? 'rgba(34,197,94,.1)' : 'rgba(0,0,0,.22)',
        boxShadow: isActive ? '0 0 18px rgba(34,197,94,.3)' : 'none',
      }}
      transition={{ duration: 0.3 }}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
        border: '1px solid rgba(255,255,255,.08)',
        borderRadius: 14, padding: '8px 14px', minWidth: 90,
      }}
    >
      {/* Nom */}
      <span style={{
        fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
        letterSpacing: '.8px', color: isActive ? '#4ade80' : 'rgba(255,255,255,.65)',
        maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {joueur.nom}{joueur.isAI ? ' 🤖' : ''}
      </span>

      {/* Cartes en éventail */}
      <div style={{
        position: 'relative',
        height: 52,
        width: max > 0 ? 34 + (max - 1) * spread : 34,
      }}>
        {count === 0
          ? <span style={{ fontSize: 11, color: 'rgba(255,255,255,.3)' }}>aucune</span>
          : Array.from({ length: max }).map((_, i) => {
              const angle = (i - (max - 1) / 2) * 5
              const tx = i * spread
              const ty = Math.abs(i - (max - 1) / 2) * 1.5
              return (
                <div key={i} style={{
                  position: 'absolute', left: tx,
                  transform: `rotate(${angle}deg) translateY(${ty}px)`,
                  zIndex: i,
                }}>
                  <CardBack />
                </div>
              )
            })
        }
      </div>

      {/* Compteur + points */}
      <span style={{ fontFamily: "'Baloo 2', cursive", fontSize: '1rem', fontWeight: 800, color: 'rgba(255,255,255,.8)' }}>
        {count} 🃏
      </span>
    </motion.div>
  )
}
