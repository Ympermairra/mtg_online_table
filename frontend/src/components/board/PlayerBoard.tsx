import type { PlayerState } from '../../types'
import CardView from '../cards/CardView'
import { ws } from '../../api/ws'
import { useGameStore } from '../../store/gameStore'

interface Props {
  playerId: string
  player: PlayerState
  isMe: boolean
}

export default function PlayerBoard({ playerId, player, isMe }: Props) {
  const tapCard = useGameStore((s) => s.tapCard)

  const handleTap = (instanceId: string) => {
    tapCard(instanceId)
    ws.gameAction({ action: 'tap_card', instance_id: instanceId })
  }

  const handleSetLife = (delta: number) => {
    const newLife = player.life + delta
    ws.gameAction({ action: 'set_life', player_id: playerId, value: newLife })
  }

  return (
    <div className={`flex flex-col gap-2 p-3 rounded-lg ${isMe ? 'bg-blue-900/20' : 'bg-red-900/20'}`}>

      {/* Очки жизни */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-400">{isMe ? 'Вы' : 'Соперник'}</span>
        <div className="flex items-center gap-2">
          <button onClick={() => handleSetLife(-1)} className="w-6 h-6 bg-gray-700 hover:bg-gray-600 rounded text-sm">−</button>
          <span className="text-2xl font-bold w-10 text-center">{player.life}</span>
          <button onClick={() => handleSetLife(1)} className="w-6 h-6 bg-gray-700 hover:bg-gray-600 rounded text-sm">+</button>
        </div>
        <span className="text-sm text-gray-500 ml-auto">
          Библ: {player.library_size} | Кл: {player.graveyard.length}
        </span>
      </div>

      {/* Поле боя */}
      <div className="min-h-32 bg-black/20 rounded p-2">
        <p className="text-xs text-gray-500 mb-2">Поле боя</p>
        <div className="flex flex-wrap gap-2">
          {player.battlefield.map((card) => (
            <CardView
              key={card.instance_id}
              card={card}
              onClick={() => isMe && handleTap(card.instance_id)}
            />
          ))}
        </div>
      </div>

      {/* Рука (только своя) */}
      {isMe && (
        <div className="bg-black/20 rounded p-2">
          <p className="text-xs text-gray-500 mb-2">Рука ({player.hand.length})</p>
          <div className="flex flex-wrap gap-2">
            {player.hand.map((card) => (
              <CardView key={card.instance_id} card={card} size="sm" />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
