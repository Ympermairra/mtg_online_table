import { useEffect, useState } from 'react'
import { ws } from '../api/ws'
import { useGameStore } from '../store/gameStore'
import type { CardInstance, GameState, WsMessage } from '../types'
import TopBar from '../components/board/TopBar'
import CardDetail from '../components/board/CardDetail'
import ZonePanel from '../components/board/ZonePanel'
import CardView from '../components/cards/CardView'

interface Props {
  onLeave: () => void
}

export default function Game({ onLeave }: Props) {
  const { state, myId, setState, setLife, tapCard } = useGameStore()
  const [selectedCard, setSelectedCard] = useState<CardInstance | null>(null)

  useEffect(() => {
    const unsub = ws.onMessage((msg: WsMessage) => {
      if (msg.type === 'state_update') setState(msg.payload as GameState)
    })
    return unsub
  }, [])

  const handleLeave = () => { ws.leaveRoom(); onLeave() }

  if (!state) {
    return (
      <div className="h-screen bg-gray-900 text-white flex items-center justify-center flex-col gap-4">
        <p className="text-gray-400">Ожидание второго игрока...</p>
        <button onClick={handleLeave} className="text-sm text-red-400 hover:text-red-300">
          Покинуть комнату
        </button>
      </div>
    )
  }

  const playerIds = Object.keys(state.players)
  const opponentId = playerIds.find(id => id !== myId) ?? playerIds[0]
  const me = state.players[myId ?? '']
  const opponent = state.players[opponentId]

  if (!me || !opponent) return null

  const handleTap = (card: CardInstance) => {
    tapCard(card.instance_id)
    ws.gameAction({ action: 'tap_card', instance_id: card.instance_id })
  }

  const handleCardClick = (card: CardInstance, isMine: boolean) => {
    setSelectedCard(card)
    if (isMine) handleTap(card)
  }

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col overflow-hidden">

      <TopBar state={state} myId={myId ?? ''} onLeave={handleLeave} />

      <div className="flex flex-1 overflow-hidden">

        {/* Левая панель — детали карты */}
        <CardDetail card={selectedCard} />

        {/* Центр — игровое поле */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Зона соперника */}
          <div className="flex-1 flex flex-col border-b border-gray-700 overflow-hidden">

            {/* Рука соперника (рубашкой) */}
            <div className="flex items-center gap-1 px-3 py-1 bg-red-950/20 border-b border-gray-800 min-h-[56px]">
              <span className="text-[10px] text-gray-600 w-12">Рука</span>
              <div className="flex gap-1 flex-wrap">
                {Array.from({ length: opponent.hand.length }).map((_, i) => (
                  <div key={i} className="w-8 h-12 bg-blue-900 border border-blue-800 rounded flex-shrink-0" />
                ))}
              </div>
            </div>

            {/* Поле соперника */}
            <div className="flex-1 p-2 overflow-y-auto">
              <p className="text-[10px] text-gray-600 mb-1">Поле соперника</p>
              <div className="flex flex-wrap gap-2 content-start">
                {opponent.battlefield.map(card => (
                  <CardView key={card.instance_id} card={card}
                    selected={selectedCard?.instance_id === card.instance_id}
                    onClick={(c) => handleCardClick(c, false)} />
                ))}
                {opponent.battlefield.length === 0 && (
                  <span className="text-gray-700 text-xs italic">Пусто</span>
                )}
              </div>
            </div>
          </div>

          {/* Зона игрока */}
          <div className="flex-1 flex flex-col overflow-hidden">

            {/* Моё поле */}
            <div className="flex-1 p-2 overflow-y-auto">
              <p className="text-[10px] text-gray-600 mb-1">Моё поле</p>
              <div className="flex flex-wrap gap-2 content-start">
                {me.battlefield.map(card => (
                  <CardView key={card.instance_id} card={card}
                    selected={selectedCard?.instance_id === card.instance_id}
                    onClick={(c) => handleCardClick(c, true)} />
                ))}
                {me.battlefield.length === 0 && (
                  <span className="text-gray-700 text-xs italic">Пусто</span>
                )}
              </div>
            </div>

            {/* Моя рука */}
            <div className="flex items-center gap-1 px-3 py-2 bg-blue-950/20 border-t border-gray-800 min-h-[80px]">
              <span className="text-[10px] text-gray-600 w-12">Рука</span>
              <div className="flex gap-1 flex-wrap">
                {me.hand.map(card => (
                  <CardView key={card.instance_id} card={card} size="sm"
                    selected={selectedCard?.instance_id === card.instance_id}
                    onClick={(c) => { setSelectedCard(c) }} />
                ))}
                {me.hand.length === 0 && (
                  <span className="text-gray-700 text-xs italic">Нет карт</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Правая панель — библиотека/кладбище/жизни */}
        <div className="flex flex-col">
          <ZonePanel
            player={opponent}
            isMe={false}
            life={opponent.life}
            onLifeChange={(d) => {
              setLife(opponentId, opponent.life + d)
              ws.gameAction({ action: 'set_life', player_id: opponentId, value: opponent.life + d })
            }}
          />
          <div className="flex-1 border-y border-gray-700" />
          <ZonePanel
            player={me}
            isMe={true}
            life={me.life}
            onLifeChange={(d) => {
              setLife(myId ?? '', me.life + d)
              ws.gameAction({ action: 'set_life', player_id: myId ?? '', value: me.life + d })
            }}
          />
        </div>
      </div>
    </div>
  )
}
