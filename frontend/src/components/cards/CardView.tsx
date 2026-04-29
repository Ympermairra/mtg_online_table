import type { CardInstance } from '../../types'

interface Props {
  card: CardInstance
  faceDown?: boolean
  size?: 'sm' | 'md' | 'lg'
  onClick?: (card: CardInstance) => void
  selected?: boolean
}

const SIZES = {
  sm:  'w-14 h-20 text-[9px]',
  md:  'w-20 h-28 text-[10px]',
  lg:  'w-28 h-40 text-xs',
}

export default function CardView({ card, faceDown, size = 'md', onClick, selected }: Props) {
  const sz = SIZES[size]

  if (faceDown) {
    return (
      <div className={`${sz} rounded border border-gray-600 bg-blue-900 flex-shrink-0`} />
    )
  }

  return (
    <div
      onClick={() => onClick?.(card)}
      className={`
        ${sz} rounded border-2 flex-shrink-0 cursor-pointer select-none relative
        flex items-center justify-center text-center p-1 leading-tight
        transition-all duration-150
        ${card.tapped ? 'rotate-90 origin-center' : ''}
        ${selected ? 'border-yellow-400 ring-2 ring-yellow-400' : 'border-gray-500 hover:border-white'}
        bg-gray-700 hover:bg-gray-600
      `}
    >
      <span className="text-gray-200 break-words">{card.card_id || '?'}</span>

      {/* Счётчики */}
      {Object.entries(card.counters ?? {}).map(([type, val]) => (
        val !== 0 && (
          <span key={type}
            className="absolute top-0.5 right-0.5 bg-black/80 rounded px-0.5 text-[9px] leading-tight">
            {type}:{val}
          </span>
        )
      ))}
    </div>
  )
}
