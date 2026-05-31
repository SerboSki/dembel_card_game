import { motion, AnimatePresence } from 'framer-motion'

const COLORS = {
  error:   { bg: 'linear-gradient(135deg,#ef4444,#dc2626)', shadow: 'rgba(239,68,68,.6)' },
  success: { bg: 'linear-gradient(135deg,#22c55e,#16a34a)', shadow: 'rgba(34,197,94,.6)' },
  info:    { bg: 'linear-gradient(135deg,#667eea,#764ba2)', shadow: 'rgba(102,126,234,.6)' },
}

export function Notification({ notif }) {
  const c = COLORS[notif?.type] || COLORS.info
  return (
    <AnimatePresence>
      {notif && (
        <motion.div
          key={notif.id}
          initial={{ y: -60, opacity: 0, scale: 0.9 }}
          animate={{ y: 0,   opacity: 1, scale: 1 }}
          exit={{   y: -40, opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          style={{
            position: 'fixed', top: 18, left: '50%', transform: 'translateX(-50%)',
            padding: '13px 26px', borderRadius: 12,
            fontWeight: 800, fontFamily: "'Nunito', sans-serif", fontSize: 14,
            zIndex: 9999, whiteSpace: 'nowrap', maxWidth: '90vw', textAlign: 'center',
            background: c.bg,
            boxShadow: `0 4px 20px ${c.shadow}`,
            color: '#fff',
          }}
        >
          {notif.msg}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
