import { ws } from '../../api/ws'
import type { GameState } from '../../types'

interface Props {
  state: GameState
  myId: string
  onLeave: () => void
}

const PHASES = [
  { key: 'untap',              label: 'Untap' },
  { key: 'upkeep',             label: 'Upkeep' },
  { key: 'draw',               label: 'Draw' },
  { key: 'main1',              label: 'Main 1' },
  { key: 'begin_combat',       label: 'Begin Combat' },
  { key: 'declare_attackers',  label: 'Attackers' },
  { key: 'declare_blockers',   label: 'Blockers' },
  { key: 'damage',             label: 'Damage' },
  { key: 'end_of_combat',      label: 'End Combat' },
  { key: 'main2',              label: 'Main 2' },
  { key: 'end_step',           label: 'End Step' },
]

// Группы для визуального разделения
const GROUPS = [
  ['untap', 'upkeep', 'draw'],
  ['main1'],
  ['begin_combat', 'declare_attackers', 'declare_blockers', 'damage', 'end_of_combat'],
  ['main2'],
  ['end_step'],
]

export default function TopBar({ state, myId, onLeave }: Props) {
  const isMyTurn = state.active_player === myId

  return (
    <div className="flex items-center px-3 gap-2 bg-gray-900 border-b border-gray-700 flex-shrink-0 h-11">

      <span className="text-xs text-gray-400 flex-shrink-0 w-14">Ход {state.turn}</span>

      {/* Фазы по группам */}
      <div className="flex items-center gap-1 flex-1 overflow-x-auto">
        {GROUPS.map((group, gi) => (
          <div key={gi} className="flex items-center gap-0.5 flex-shrink-0">
            {group.map(key => {
              const phase = PHASES.find(p => p.key === key)!
              const isActive = state.phase === key
              return (
                <span
                  key={key}
                  className={`px-2 py-1 rounded text-[11px] font-medium whitespace-nowrap
                    ${isActive
                      ? 'bg-yellow-500 text-black'
                      : 'bg-gray-800 text-gray-500'
                    }`}
                >
                  {phase.label}
                </span>
              )
            })}
            {/* Разделитель между группами */}
            {gi < GROUPS.length - 1 && (
              <span className="text-gray-700 mx-0.5">│</span>
            )}
          </div>
        ))}
      </div>

      {/* Кнопки */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {isMyTurn ? (
          <button
            onClick={() => ws.gameAction({ action: 'next_phase' })}
            className="bg-yellow-600 hover:bg-yellow-500 px-3 py-1 rounded text-xs font-semibold"
          >
            Далее →
          </button>
        ) : (
          <span className="text-xs text-gray-600 italic">Ход соперника</span>
        )}
        <button onClick={onLeave} className="text-xs text-red-500 hover:text-red-400">
          Выйти
        </button>
      </div>
    </div>
  )
}
