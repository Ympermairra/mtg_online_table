import type { WsMessage, GameAction } from '../types'

type MessageHandler = (msg: WsMessage) => void

class WsClient {
  private socket: WebSocket | null = null
  private handlers: MessageHandler[] = []

  connect() {
    const url = `ws://${window.location.host}/game-ws/`
    this.socket = new WebSocket(url)

    this.socket.onmessage = (e) => {
      try {
        const msg: WsMessage = JSON.parse(e.data)
        this.handlers.forEach((h) => h(msg))
      } catch {
        console.error('WS parse error', e.data)
      }
    }

    this.socket.onclose = () => console.log('WS disconnected')
    this.socket.onerror = (e) => console.error('WS error', e)
  }

  disconnect() {
    this.socket?.close()
    this.socket = null
  }

  onMessage(handler: MessageHandler) {
    this.handlers.push(handler)
    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler)
    }
  }

  private send(msg: WsMessage) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(msg))
    }
  }

  listRooms() {
    this.send({ type: 'list_rooms', payload: {} })
  }

  createRoom(format: string, deckId: number) {
    this.send({ type: 'create_room', payload: { format, deck_id: deckId } })
  }

  joinRoom(roomId: string, deckId: number) {
    this.send({ type: 'join_room', payload: { room_id: roomId, deck_id: deckId } })
  }

  leaveRoom() {
    this.send({ type: 'leave_room', payload: {} })
  }

  gameAction(action: GameAction) {
    this.send({ type: 'game_action', payload: action })
  }
}

export const ws = new WsClient()
