import { useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'

let socketInstance = null

export function getSocket() {
  if (!socketInstance) {
    socketInstance = io(window.location.origin, {
      transports: ['websocket', 'polling'],
    })
  }
  return socketInstance
}

export function useSocket(events) {
  const socket = getSocket()
  const eventsRef = useRef(events)
  eventsRef.current = events

  useEffect(() => {
    const handlers = {}
    Object.entries(eventsRef.current).forEach(([event, handler]) => {
      handlers[event] = (...args) => eventsRef.current[event]?.(...args)
      socket.on(event, handlers[event])
    })
    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        socket.off(event, handler)
      })
    }
  }, [socket])

  const emit = useCallback((event, data) => {
    socket.emit(event, data)
  }, [socket])

  return { socket, emit }
}
