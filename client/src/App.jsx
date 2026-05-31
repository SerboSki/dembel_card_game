import { useState, useCallback, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useSocket } from './hooks/useSocket'
import { Card, DrawPile } from './components/Card'
import { OpponentSeat } from './components/OpponentSeat'
import { Notification } from './components/Notification'
import { Button } from './components/Button'
import { Panel, PanelTitle, PanelSubtitle, InputLabel, Divider } from './components/Panel'

const MIN_PLAYERS = 2
const MAX_PLAYERS = 5
const MIN_AI = 1
const MAX_AI = 4

// As=1, 2-9=valeur, 10=10, Valet=11, Dame=12, Roi=13
const POINTS_VALEUR = {}
const VALEURS = ["As","2","3","4","5","6","7","8","9","10","Valet","Dame","Roi"]
VALEURS.forEach((v, i) => { POINTS_VALEUR[v] = i + 1 })

function calculPoints(main) {
  return (main || []).reduce((s, c) => s + (POINTS_VALEUR[c.valeur] || 0), 0)
}

let notifTimer = null

export default function App() {
  // ── State ──────────────────────────────────────────────
  const [currentUser, setCurrentUser]   = useState(() => sessionStorage.getItem('dembel_username'))
  const [currentRoom, setCurrentRoom]   = useState(() => sessionStorage.getItem('dembel_roomId'))
  const [game, setGame]                 = useState(null)
  const [roomPlayers, setRoomPlayers]   = useState([])
  const [isHost, setIsHost]             = useState(false)
  const [soloMode, setSoloMode]         = useState(false)
  const [scores, setScores]             = useState(null)

  const [selectedCards, setSelectedCards]         = useState([])
  const [selectedPublicCard, setSelectedPublicCard] = useState(null)
  const [selectedFromPile, setSelectedFromPile]   = useState(false)
  const [isProcessing, setIsProcessing]           = useState(false)

  const [notif, setNotif]               = useState(null)
  const notifIdRef                      = useRef(0)

  const usernameRef = useRef('')
  const roomIdRef   = useRef('')

  // ── Notification helper ────────────────────────────────
  const showNotif = useCallback((msg, type = 'info') => {
    if (notifTimer) clearTimeout(notifTimer)
    const id = ++notifIdRef.current
    setNotif({ id, msg, type })
    notifTimer = setTimeout(() => setNotif(null), type === 'error' ? 4000 : 3000)
  }, [])

  // ── Reset selection ────────────────────────────────────
  const resetSelection = useCallback(() => {
    setSelectedCards([])
    setSelectedPublicCard(null)
    setSelectedFromPile(false)
    setIsProcessing(false)
  }, [])

  // ── Socket events ──────────────────────────────────────
  const prevTurnRef = useRef(-1)

  const { emit } = useSocket({
    reconnect_failed: () => {
      sessionStorage.removeItem('dembel_username')
      sessionStorage.removeItem('dembel_roomId')
      setCurrentUser(null); setCurrentRoom(null); setGame(null)
    },
    registration_success: (data) => {
      setCurrentUser(data.username)
      sessionStorage.setItem('dembel_username', data.username)
    },
    error_notification: (m) => showNotif(m, 'error'),
    room_created: (data) => {
      setCurrentRoom(data.roomId)
      sessionStorage.setItem('dembel_roomId', data.roomId)
      setRoomPlayers([{ username: currentUser, isHost: true }])
      setIsHost(true); setSoloMode(false)
    },
    solo_room_created: (data) => {
      setCurrentRoom(data.roomId)
      sessionStorage.setItem('dembel_roomId', data.roomId)
      setIsHost(true)
    },
    player_joined: (data) => {
      if (data.players) {
        setRoomPlayers(data.players)
        const me = data.players.find(p => p.username === currentUser)
        setIsHost(me ? me.isHost : false)
      }
    },
    game_started: (data) => {
      setGame(data.gameState)
      prevTurnRef.current = data.gameState.tour_actuel
      setScores(null)
      resetSelection()
    },
    game_update: (data) => {
      const gs = data.gameState
      setGame(gs)
      const newTurn = gs.tour_actuel
      if (prevTurnRef.current !== newTurn) {
        prevTurnRef.current = newTurn
        const name = gs.joueurs[newTurn]?.nom
        const me = sessionStorage.getItem('dembel_username')
        if (name === me) showNotif('🎮 À vous de jouer !', 'success')
        else showNotif('⏳ Tour de ' + name, 'info')
      }
      resetSelection()
    },
    game_ended: (data) => {
      setScores(data.scores)
      setGame(null)
    },
    room_closed: () => {
      sessionStorage.removeItem('dembel_roomId')
      setCurrentRoom(null); setGame(null); setSoloMode(false)
    },
  })

  // ── Actions ────────────────────────────────────────────
  const registerUser = () => {
    const v = usernameRef.current.value?.trim()
    if (!v) { showNotif('⚠️ Entrez un pseudo', 'error'); return }
    if (v.length < 3) { showNotif('⚠️ Pseudo trop court (min 3)', 'error'); return }
    emit('register_user', v)
  }

  const createRoom    = () => emit('create_room')
  const joinRoom      = () => {
    const v = roomIdRef.current.value?.trim()?.toUpperCase()
    if (!v) { showNotif('⚠️ Entrez un code', 'error'); return }
    sessionStorage.setItem('dembel_roomId', v)
    setCurrentRoom(v)
    emit('join_room', v)
  }
  const startSoloGame = (n) => emit('create_solo_room', { nbAI: n })
  const startGame     = () => {
    if (roomPlayers.length < MIN_PLAYERS) { showNotif('❌ Min ' + MIN_PLAYERS + ' joueurs', 'error'); return }
    emit('start_game', {})
  }
  const leaveRoom = () => {
    emit('leave_room')
    sessionStorage.removeItem('dembel_roomId')
    setCurrentRoom(null); setGame(null); setSoloMode(false); setScores(null)
    resetSelection()
  }
  const copyRoomCode = () => {
    navigator.clipboard.writeText(currentRoom)
      .then(() => showNotif('✅ Code copié : ' + currentRoom, 'success'))
      .catch(() => showNotif('❌ Erreur copie', 'error'))
  }
  const newGame = () => {
    sessionStorage.removeItem('dembel_username')
    sessionStorage.removeItem('dembel_roomId')
    window.location.reload()
  }

  const toggleCard = (idx) => {
    if (!game || isProcessing) return
    setSelectedCards(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    )
  }

  const selectPublicCard = (card) => {
    if (!game || isProcessing) return
    setSelectedPublicCard(prev => prev === card ? null : card)
    setSelectedFromPile(false)
  }

  const selectPile = () => {
    if (!game || isProcessing) return
    setSelectedFromPile(prev => !prev)
    setSelectedPublicCard(null)
  }

  const endTurn = () => {
    if (!game || isProcessing) return
    if (!selectedCards || selectedCards.length === 0) { showNotif('⚠️ Sélectionnez une carte', 'error'); return }
    if (!selectedFromPile && !selectedPublicCard) { showNotif('⚠️ Piochez une carte', 'error'); return }
    setIsProcessing(true)
    emit('game_action', {
      type: 'turn',
      data: { defausse: selectedCards.slice(), pioche: selectedFromPile ? 'pioche' : selectedPublicCard }
    })
    setTimeout(() => setIsProcessing(false), 2000)
  }

  const callDembel = () => {
    if (!game || isProcessing) return
    const me = game.joueurs.find(j => j.nom === currentUser)
    if (!me) return
    const pts = calculPoints(me.main)
    if (pts > 10) { showNotif('❌ Points > 10, impossible', 'error'); return }
    emit('game_action', { type: 'dembel', data: {} })
    showNotif('🎯 DEMBEL annoncé avec ' + pts + ' pts !', 'success')
  }

  // ── Rendu conditionnel ─────────────────────────────────
  let screen
  if (scores)             screen = <ScreenClassement scores={scores} onNewGame={newGame} />
  else if (!currentUser)  screen = <ScreenLogin usernameRef={usernameRef} onRegister={registerUser} />
  else if (!currentRoom && soloMode) screen = <ScreenSolo onStart={startSoloGame} onBack={() => setSoloMode(false)} />
  else if (!currentRoom)  screen = <ScreenLobby currentUser={currentUser} roomIdRef={roomIdRef} onCreate={createRoom} onJoin={joinRoom} onSolo={() => setSoloMode(true)} />
  else if (!game)         screen = <ScreenWaiting currentUser={currentUser} currentRoom={currentRoom} roomPlayers={roomPlayers} isHost={isHost} onStart={startGame} onLeave={leaveRoom} onCopy={copyRoomCode} />
  else                    screen = (
    <ScreenGame
      game={game}
      currentUser={currentUser}
      selectedCards={selectedCards}
      selectedPublicCard={selectedPublicCard}
      selectedFromPile={selectedFromPile}
      isProcessing={isProcessing}
      onToggleCard={toggleCard}
      onSelectPublicCard={selectPublicCard}
      onSelectPile={selectPile}
      onEndTurn={endTurn}
      onCallDembel={callDembel}
      onLeave={leaveRoom}
    />
  )

  return (
    <>
      <Notification notif={notif} />
      <AnimatePresence mode="wait">
        {screen}
      </AnimatePresence>
    </>
  )
}

// ══════════════════════════════════════════
//  ÉCRANS
// ══════════════════════════════════════════

function ScreenLogin({ usernameRef, onRegister }) {
  return (
    <Panel key="login">
      <PanelTitle>🃏 Dembel</PanelTitle>
      <PanelSubtitle>Le jeu de cartes ultime</PanelSubtitle>
      <div style={{ marginBottom: 16 }}>
        <InputLabel>Votre pseudo</InputLabel>
        <input ref={usernameRef} type="text" placeholder="Au moins 3 caractères" maxLength={20}
          style={{ marginBottom: 10 }}
          onKeyDown={e => e.key === 'Enter' && onRegister()} />
      </div>
      <Button variant="gold" full onClick={onRegister}>Jouer →</Button>
      <div style={{ marginTop: 18, background: 'rgba(0,0,0,.22)', border: '1px solid rgba(245,197,24,.18)', borderRadius: 11, padding: 14 }}>
        <p style={{ fontFamily: "'Baloo 2', cursive", color: '#f5c518', fontSize: '.95rem', marginBottom: 8 }}>📜 Règles</p>
        <pre style={{ fontSize: 11.5, lineHeight: 1.7, color: 'rgba(255,255,255,.58)', whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{`🎯 OBJECTIF : avoir le moins de points possible

🃏 TOUR :
  • Défausser 1+ cartes (même valeur ou suite couleur)
  • Piocher 1 carte (pioche ou défausse visible)

💯 POINTS : As=1, 2-9=valeur, 10/V/D/R=10

🎯 DEMBEL (si ≤ 10 pts) :
  ✅ Score minimum → 0 pts
  ⚠️ Pas score min → Score normal
  ❌ Annonce perdante → Score × 2

👥 2-5 joueurs  🏆 Classement croissant`}</pre>
      </div>
    </Panel>
  )
}

function ScreenLobby({ currentUser, roomIdRef, onCreate, onJoin, onSolo }) {
  return (
    <Panel key="lobby">
      <PanelTitle>🃏 Dembel</PanelTitle>
      <PanelSubtitle>Bienvenue, {currentUser} !</PanelSubtitle>
      <div style={{ marginBottom: 16 }}>
        <InputLabel>Multijoueur — Créer</InputLabel>
        <Button variant="blue" full onClick={onCreate}>➕ Créer une salle</Button>
      </div>
      <div style={{ marginBottom: 16 }}>
        <InputLabel>Rejoindre avec un code</InputLabel>
        <input ref={roomIdRef} type="text" placeholder="Code de salle" maxLength={6}
          style={{ textTransform: 'uppercase', marginBottom: 8 }}
          onKeyDown={e => e.key === 'Enter' && onJoin()} />
        <Button variant="orange" full onClick={onJoin}>🔗 Rejoindre</Button>
      </div>
      <Divider>ou</Divider>
      <div>
        <InputLabel>Mode Solo — Bots</InputLabel>
        <Button variant="purple" full onClick={onSolo}>🤖 Jouer seul</Button>
      </div>
    </Panel>
  )
}

function ScreenSolo({ onStart, onBack }) {
  const levels = ['Facile', 'Normal', 'Difficile', 'Extrême']
  return (
    <Panel key="solo">
      <PanelTitle>🤖 Solo</PanelTitle>
      <PanelSubtitle>Combien de bots ?</PanelSubtitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, margin: '18px 0' }}>
        {Array.from({ length: MAX_AI - MIN_AI + 1 }, (_, k) => k + MIN_AI).map(n => (
          <motion.div key={n} whileHover={{ y: -3, boxShadow: '0 8px 20px rgba(168,85,247,.3)' }}
            onClick={() => onStart(n)}
            style={{
              background: 'rgba(168,85,247,.1)', border: '2px solid rgba(168,85,247,.3)',
              borderRadius: 13, padding: 18, textAlign: 'center', cursor: 'pointer',
            }}>
            <div style={{ fontSize: '2rem', marginBottom: 5 }}>{Array(n).fill('🤖').join(' ')}</div>
            <div style={{ fontFamily: "'Baloo 2', cursive", fontSize: '1.2rem', fontWeight: 800, color: '#d8b4fe' }}>{n} bot{n > 1 ? 's' : ''}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.45)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 3 }}>{levels[n - 1]}</div>
          </motion.div>
        ))}
      </div>
      <Button variant="ghost" full onClick={onBack}>← Retour</Button>
    </Panel>
  )
}

function ScreenWaiting({ currentUser, currentRoom, roomPlayers, isHost, onStart, onLeave, onCopy }) {
  const ok = roomPlayers.length >= MIN_PLAYERS
  return (
    <Panel key="waiting">
      <PanelTitle>🎲 Salle</PanelTitle>
      <div style={{ background: 'rgba(245,197,24,.08)', border: '2px solid rgba(245,197,24,.35)', borderRadius: 12, padding: '14px 18px', textAlign: 'center', marginBottom: 18 }}>
        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, color: 'rgba(255,255,255,.45)', fontWeight: 700 }}>Code de la salle</div>
        <div style={{ fontFamily: "'Baloo 2', cursive", fontSize: '2.2rem', fontWeight: 800, color: '#f5c518', letterSpacing: 8 }}>{currentRoom}</div>
        <Button variant="blue" sm onClick={onCopy} style={{ marginTop: 9 }}>📋 Copier</Button>
      </div>
      <div style={{
        textAlign: 'center', padding: 9, borderRadius: 9, fontWeight: 800, fontSize: 13, marginBottom: 14,
        background: ok ? 'rgba(34,197,94,.12)' : 'rgba(239,68,68,.12)',
        border: ok ? '1px solid rgba(34,197,94,.3)' : '1px solid rgba(239,68,68,.3)',
        color: ok ? '#4ade80' : '#f87171',
      }}>
        {roomPlayers.length}/{MAX_PLAYERS} joueurs — {ok ? 'Prêt à démarrer !' : 'Min ' + MIN_PLAYERS + ' joueurs requis'}
      </div>
      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7, margin: '14px 0' }}>
        {roomPlayers.map(p => (
          <motion.li key={p.username} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 9,
              background: p.username === currentUser ? 'rgba(245,197,24,.07)' : 'rgba(255,255,255,.05)',
              border: p.username === currentUser ? '1px solid rgba(245,197,24,.4)' : '1px solid rgba(255,255,255,.09)',
              borderRadius: 9, padding: '9px 13px', fontWeight: 700, fontSize: 14,
            }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
              {p.username[0].toUpperCase()}
            </div>
            <span>{p.username}</span>
            {(p.isHost || p.username === currentUser) && (
              <span style={{ marginLeft: 'auto', fontSize: 11, background: 'rgba(245,197,24,.18)', border: '1px solid rgba(245,197,24,.35)', borderRadius: 6, padding: '2px 7px', color: '#f5c518', fontWeight: 700 }}>
                {[p.isHost && '👑 Hôte', p.username === currentUser && 'Vous'].filter(Boolean).join(' · ')}
              </span>
            )}
          </motion.li>
        ))}
      </ul>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {isHost
          ? <Button variant="green" full onClick={onStart} disabled={!ok}>▶️ Démarrer</Button>
          : <div style={{ textAlign: 'center', color: 'rgba(255,255,255,.45)', padding: 12, fontSize: 14 }}>⏳ En attente du lancement...</div>
        }
        <Button variant="ghost" full onClick={onLeave}>🚪 Quitter</Button>
      </div>
    </Panel>
  )
}

// ══════════════════════════════════════════
//  GAME BOARD
// ══════════════════════════════════════════
function ScreenGame({ game, currentUser, selectedCards, selectedPublicCard, selectedFromPile, isProcessing, onToggleCard, onSelectPublicCard, onSelectPile, onEndTurn, onCallDembel, onLeave }) {
  const me = game.joueurs.find(j => j.nom === currentUser)
  if (!me) return null

  const myTurn     = game.joueurs[game.tour_actuel]?.nom === currentUser
  const curName    = game.joueurs[game.tour_actuel]?.nom || ''
  const opponents  = game.joueurs.filter(j => j.nom !== currentUser)
  const pts        = calculPoints(me.main)
  const ptsColor   = pts <= 10 ? '#4ade80' : pts <= 20 ? '#f5c518' : '#f87171'
  const canEnd     = myTurn && selectedCards.length > 0 && (selectedFromPile || selectedPublicCard)
  const canDembel  = pts <= 10 && myTurn

  return (
    <motion.div
      key="game"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        gap: 0, padding: '10px 8px 8px',
        maxWidth: 640, margin: '0 auto',
      }}
    >
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px' }}>
        <div style={{ fontFamily: "'Baloo 2', cursive", fontSize: '.95rem', fontWeight: 800, background: 'rgba(245,197,24,.12)', border: '1px solid rgba(245,197,24,.3)', borderRadius: 8, padding: '5px 12px', color: '#f5c518' }}>
          🎲 Manche {game.manche_actuelle}
        </div>
        <motion.div
          animate={{
            background: myTurn ? 'rgba(34,197,94,.2)' : 'rgba(0,0,0,.25)',
            borderColor: myTurn ? 'rgba(34,197,94,.55)' : 'rgba(255,255,255,.1)',
            color: myTurn ? '#4ade80' : 'rgba(255,255,255,.55)',
          }}
          style={{
            flex: 1, textAlign: 'center', border: '2px solid', borderRadius: 10,
            padding: '8px 14px', fontFamily: "'Baloo 2', cursive", fontSize: '1.1rem', fontWeight: 800,
          }}
        >
          {myTurn ? '🎮 VOTRE TOUR !' : '⏳ ' + curName}
        </motion.div>
      </div>

      {/* ── Adversaires ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, padding: '6px 0' }}>
        {opponents.map(j => (
          <OpponentSeat key={j.nom} joueur={j} isActive={game.joueurs[game.tour_actuel]?.nom === j.nom} />
        ))}
      </div>

      {/* ── Messages ── */}
      {game.messages?.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ background: 'rgba(33,150,243,.12)', borderLeft: '4px solid #3b82f6', borderRadius: 8, padding: '9px 13px', fontSize: 13, fontWeight: 600, color: '#93c5fd', display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 8 }}>
          {game.messages.map((m, i) => <div key={i}>📢 {m}</div>)}
        </motion.div>
      )}

      {/* ── Table centrale ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 0' }}>
        <div style={{
          background: 'radial-gradient(ellipse at center, rgba(14,80,38,.7) 0%, rgba(8,48,22,.8) 100%)',
          border: '3px solid rgba(255,255,255,.08)',
          borderRadius: 50, padding: '18px 30px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
          boxShadow: 'inset 0 4px 20px rgba(0,0,0,.3), 0 8px 32px rgba(0,0,0,.4)',
          width: '100%',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
            {/* Pioche */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'rgba(255,255,255,.35)', fontWeight: 800 }}>Pioche</span>
              <DrawPile
                count={game.pioche.length}
                selected={selectedFromPile}
                disabled={!!selectedPublicCard || !myTurn}
                onClick={onSelectPile}
              />
            </div>

            {/* Défausse */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'rgba(255,255,255,.35)', fontWeight: 800 }}>Défausse</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', minWidth: 64 }}>
                {game.last_defausse?.length > 0
                  ? game.last_defausse.map((c, i) => (
                      <Card key={c.id || i} carte={c}
                        selected={selectedPublicCard === c}
                        pileSel={false}
                        disabled={selectedFromPile || !myTurn}
                        onClick={() => onSelectPublicCard(c)}
                      />
                    ))
                  : <div style={{ color: 'rgba(255,255,255,.3)', fontSize: 12, paddingTop: 30 }}>Vide</div>
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Ma main ── */}
      <motion.div
        animate={{ borderColor: myTurn ? 'rgba(34,197,94,.45)' : 'rgba(255,255,255,.1)' }}
        style={{
          flexShrink: 0, background: 'rgba(0,0,0,.28)',
          border: '2px solid', borderRadius: 16, padding: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'rgba(255,255,255,.38)', fontWeight: 800 }}>🖐️ Votre main</span>
          <span style={{ fontFamily: "'Baloo 2', cursive", fontSize: '1.1rem', fontWeight: 800, color: ptsColor }}>{pts} pts</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8 }}>
          {me.main.map((c, i) => (
            <Card key={c.id || i} carte={c}
              selected={selectedCards.includes(i)}
              disabled={!myTurn}
              onClick={() => onToggleCard(i)}
            />
          ))}
        </div>
      </motion.div>

      {/* ── Actions ── */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', padding: '8px 0 4px' }}>
        {canDembel && (
          <motion.button
            onClick={onCallDembel}
            animate={{ background: ['linear-gradient(135deg,#ff4500,#ff8c00)', 'linear-gradient(135deg,#ff8c00,#ffcc00)', 'linear-gradient(135deg,#ff4500,#ff8c00)'] }}
            transition={{ duration: 1.4, repeat: Infinity }}
            whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.96 }}
            style={{
              padding: '14px 26px', fontSize: 16, fontFamily: "'Nunito', sans-serif", fontWeight: 800,
              borderRadius: 10, border: 'none', cursor: 'pointer', color: '#fff',
              boxShadow: '0 4px 22px rgba(255,69,0,.65)',
            }}
          >
            🎯 DEMBEL !
          </motion.button>
        )}
        <Button variant="green" onClick={onEndTurn} disabled={!canEnd}>✅ Fin du tour</Button>
        <Button variant="red" sm onClick={onLeave}>🚪</Button>
      </div>
    </motion.div>
  )
}

// ══════════════════════════════════════════
//  CLASSEMENT
// ══════════════════════════════════════════
function ScreenClassement({ scores, onNewGame }) {
  const sorted = Object.entries(scores)
    .map(([nom, d]) => ({ nom, points: typeof d === 'object' ? d.points : d, dembel: typeof d === 'object' ? d.dembel : false }))
    .sort((a, b) => a.points - b.points)

  const medals  = ['🥇', '🥈', '🥉']
  const bgMap   = ['rgba(255,215,0,.12)', 'rgba(192,192,192,.08)', 'rgba(205,127,50,.1)']
  const bdMap   = ['rgba(255,215,0,.4)',  'rgba(192,192,192,.3)', 'rgba(205,127,50,.3)']

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: 'rgba(8,40,18,.92)', border: '2px solid rgba(245,197,24,.4)', borderRadius: 20, padding: 30, width: '100%', maxWidth: 460, backdropFilter: 'blur(16px)', boxShadow: '0 16px 56px rgba(0,0,0,.65)' }}>
        <motion.h1
          animate={{ y: [0, -6, 0] }} transition={{ duration: 2, repeat: Infinity }}
          style={{ fontFamily: "'Baloo 2', cursive", fontSize: '2rem', fontWeight: 800, textAlign: 'center', color: '#f5c518', textShadow: '0 0 24px rgba(245,197,24,.55)', marginBottom: 22 }}>
          🏆 Classement
        </motion.h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 22 }}>
          {sorted.map((e, i) => (
            <motion.div key={e.nom}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px',
                borderRadius: 13, border: `2px solid ${bdMap[i] || 'rgba(255,255,255,.1)'}`,
                background: bgMap[i] || 'rgba(255,255,255,.04)',
              }}>
              <span style={{ fontSize: '1.8rem', flexShrink: 0 }}>{medals[i] || `${i + 1}.`}</span>
              <span style={{ fontFamily: "'Baloo 2', cursive", fontSize: '1.15rem', fontWeight: 700, flex: 1 }}>
                {e.nom}
                {e.dembel && <span style={{ fontSize: 10, background: 'rgba(255,69,0,.18)', border: '1px solid rgba(255,69,0,.4)', color: '#ff6b35', borderRadius: 5, padding: '2px 5px', fontWeight: 800, marginLeft: 6 }}>DEMBEL</span>}
              </span>
              <span style={{ fontFamily: "'Baloo 2', cursive", fontSize: '1rem', fontWeight: 800, color: 'rgba(255,255,255,.65)' }}>{e.points} pts</span>
            </motion.div>
          ))}
        </div>
        <Button variant="gold" full onClick={onNewGame}>🔄 Nouvelle partie</Button>
      </motion.div>
    </div>
  )
}
