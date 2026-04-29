import { create } from 'zustand'
import type { GameState, CardInstance } from '../types'

interface GameStore {
  myId: string | null
  state: GameState | null
  setMyId: (id: string) => void
  setState: (state: GameState) => void

  // Локальные действия — сразу меняют стейт и отправляют в WS
  tapCard: (instanceId: string) => void
  moveCard: (instanceId: string, from: keyof Pick<GameState, never>, to: string) => void
  setLife: (playerId: string, value: number) => void
}

export const useGameStore = create<GameStore>((set, get) => ({
  myId: null,
  state: null,

  setMyId: (id) => set({ myId: id }),
  setState: (state) => set({ state }),

  tapCard: (instanceId) => {
    const { state, myId } = get()
    if (!state || !myId) return
    const player = state.players[myId]
    if (!player) return

    const updateCards = (cards: CardInstance[]) =>
      cards.map((c) =>
        c.instance_id === instanceId ? { ...c, tapped: !c.tapped } : c
      )

    set({
      state: {
        ...state,
        players: {
          ...state.players,
          [myId]: {
            ...player,
            battlefield: updateCards(player.battlefield),
          },
        },
      },
    })
  },

  moveCard: (instanceId, _from, _to) => {
    // TODO: реализовать перемещение между зонами
    console.log('moveCard', instanceId)
  },

  setLife: (playerId, value) => {
    const { state } = get()
    if (!state) return
    set({
      state: {
        ...state,
        players: {
          ...state.players,
          [playerId]: { ...state.players[playerId], life: value },
        },
      },
    })
  },
}))
