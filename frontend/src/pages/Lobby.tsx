import { useEffect, useState } from 'react'
import { ws } from '../api/ws'
import { fetchFormats, type Format } from '../api/http'
import { useLobbyStore } from '../store/lobbyStore'
import type { RoomInfo, RoomJoinedPayload, WsMessage } from '../types'

interface Props {
  onJoined: (roomId: string, players: string[]) => void
}

export default function Lobby({ onJoined }: Props) {
  const { rooms, setRooms } = useLobbyStore()
  const [formats, setFormats] = useState<Format[]>([])
  const [format, setFormat] = useState('')

  useEffect(() => {
    // Загружаем форматы из Django
    fetchFormats()
      .then(data => {
        setFormats(data)
        if (data.length > 0) setFormat(data[0].name)
      })
      .catch(() => {
        // Fallback если Django недоступен
        const fallback = ['standard', 'modern', 'commander', 'pioneer', 'legacy', 'pauper']
        setFormats(fallback.map((name, id) => ({ id, name, description: '', deck_min_size: 60, deck_max_size: null, sideboard_size: 15 })))
        setFormat('standard')
      })

    ws.connect()
    ws.listRooms()

    const unsub = ws.onMessage((msg: WsMessage) => {
      if (msg.type === 'room_list') {
        const payload = msg.payload as { rooms: RoomInfo[] }
        setRooms(payload.rooms)
      }
      if (msg.type === 'room_joined') {
        const payload = msg.payload as RoomJoinedPayload
        onJoined(payload.room_id, payload.players)
      }
    })

    return unsub
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">MTG Online Table</h1>

      {/* Создать комнату */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8 max-w-md">
        <h2 className="text-xl font-semibold mb-4">Создать комнату</h2>
        <select
          className="w-full bg-gray-700 rounded px-3 py-2 mb-4"
          value={format}
          onChange={(e) => setFormat(e.target.value)}
        >
          {formats.map(f => (
            <option key={f.id} value={f.name}>
              {f.name.charAt(0).toUpperCase() + f.name.slice(1)}
            </option>
          ))}
        </select>
        <button
          className="w-full bg-blue-600 hover:bg-blue-700 rounded px-4 py-2 font-semibold disabled:opacity-50"
          disabled={!format}
          onClick={() => ws.createRoom(format, 1)}
        >
          Создать
        </button>
      </div>

      {/* Список комнат */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Открытые комнаты</h2>
          <button
            className="text-sm text-gray-400 hover:text-white"
            onClick={() => ws.listRooms()}
          >
            Обновить
          </button>
        </div>

        {rooms.length === 0 ? (
          <p className="text-gray-500">Нет открытых комнат</p>
        ) : (
          <div className="grid gap-3">
            {rooms.map((room) => (
              <RoomCard key={room.id} room={room} onJoin={() => ws.joinRoom(room.id, 1)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function RoomCard({ room, onJoin }: { room: RoomInfo; onJoin: () => void }) {
  const isFull = room.players.length >= room.max_players
  return (
    <div className="bg-gray-800 rounded-lg p-4 flex items-center justify-between">
      <div>
        <span className="font-semibold capitalize">{room.format}</span>
        <span className="text-gray-400 text-sm ml-3">#{room.id}</span>
        <p className="text-sm text-gray-400 mt-1">
          Игроков: {room.players.length}/{room.max_players}
        </p>
      </div>
      <button
        disabled={isFull}
        onClick={onJoin}
        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded px-4 py-2 text-sm font-semibold"
      >
        {isFull ? 'Заполнена' : 'Войти'}
      </button>
    </div>
  )
}
