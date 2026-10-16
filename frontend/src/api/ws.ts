import type { WsMessage, GameAction } from '../types'

type MessageHandler = (msg: WsMessage) => void

class WsClient {
  private socket: WebSocket | null = null
  private handlers: MessageHandler[] = []
  private queue: WsMessage[] = []

  connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const url = `${protocol}://${window.location.host}/game-ws/`
    this.socket = new WebSocket(url)

    // Отправляем то, что успели поставить в очередь до открытия соединения
    this.socket.onopen = () => {
      this.queue.forEach((msg) => this.socket?.send(JSON.stringify(msg)))
      this.queue = []
    }

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
    this.queue = []
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
    } else if (this.socket?.readyState === WebSocket.CONNECTING) {
      this.queue.push(msg)
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
