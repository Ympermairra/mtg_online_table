import type { CardInstance } from '../../types'

interface Props {
  card: CardInstance | null
}

export default function CardDetail({ card }: Props) {
  return (
    <div className="w-44 flex-shrink-0 bg-gray-900 border-r border-gray-700 flex flex-col p-2 gap-2">
      <p className="text-xs text-gray-500 uppercase tracking-wide">Карта</p>

      {card ? (
        <>
          {/* Заглушка изображения — потом заменить на реальное */}
          <div className="w-full aspect-[5/7] bg-gray-700 rounded border border-gray-600 flex items-center justify-center">
            <span className="text-gray-400 text-xs text-center px-2">{card.card_id}</span>
          </div>

          <div className="text-xs text-gray-300 space-y-1">
            <p><span className="text-gray-500">ID:</span> {card.instance_id.slice(0, 8)}</p>
            <p><span className="text-gray-500">Тап:</span> {card.tapped ? 'Да' : 'Нет'}</p>
            {Object.entries(card.counters ?? {}).map(([t, v]) => (
              <p key={t}><span className="text-gray-500">{t}:</span> {v}</p>
            ))}
          </div>
        </>
      ) : (
        <p className="text-gray-600 text-xs">Кликните на карту</p>
      )}
    </div>
  )
}
