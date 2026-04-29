import type { PlayerState } from '../../types'

interface Props {
  player: PlayerState
  isMe: boolean
  life: number
  onLifeChange: (delta: number) => void
}

export default function ZonePanel({ player, isMe, life, onLifeChange }: Props) {
  return (
    <div className="w-32 flex-shrink-0 bg-gray-900 border-l border-gray-700 flex flex-col">

      {/* Жизни */}
      <div className={`flex flex-col items-center py-3 border-b border-gray-700 ${isMe ? 'bg-blue-950/40' : 'bg-red-950/40'}`}>
        <span className="text-[10px] text-gray-500 mb-1">{isMe ? 'Вы' : 'Соперник'}</span>
        <span className="text-3xl font-bold">{life}</span>
        {isMe && (
          <div className="flex gap-1 mt-1">
            <button onClick={() => onLifeChange(-1)}
              className="w-6 h-6 bg-gray-700 hover:bg-gray-600 rounded text-sm leading-none">−</button>
            <button onClick={() => onLifeChange(1)}
              className="w-6 h-6 bg-gray-700 hover:bg-gray-600 rounded text-sm leading-none">+</button>
          </div>
        )}
      </div>

      {/* Библиотека */}
      <div className="flex flex-col items-center py-2 border-b border-gray-700 gap-1">
        <div className="w-12 h-16 bg-blue-900 border border-blue-700 rounded flex items-center justify-center">
          <span className="text-xs font-bold">{player.library_size}</span>
        </div>
        <span className="text-[10px] text-gray-500">Библиотека</span>
      </div>

      {/* Кладбище */}
      <div className="flex flex-col items-center py-2 gap-1">
        <div className="w-12 h-16 bg-gray-800 border border-gray-600 rounded flex items-center justify-center">
          <span className="text-xs font-bold">{player.graveyard.length}</span>
        </div>
        <span className="text-[10px] text-gray-500">Кладбище</span>
      </div>
    </div>
  )
}
