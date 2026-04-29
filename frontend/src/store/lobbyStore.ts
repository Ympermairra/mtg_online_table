import { create } from 'zustand'
import type { RoomInfo } from '../types'

interface LobbyStore {
  rooms: RoomInfo[]
  currentRoomId: string | null
  setRooms: (rooms: RoomInfo[]) => void
  setCurrentRoom: (id: string | null) => void
}

export const useLobbyStore = create<LobbyStore>((set) => ({
  rooms: [],
  currentRoomId: null,
  setRooms: (rooms) => set({ rooms }),
  setCurrentRoom: (id) => set({ currentRoomId: id }),
}))
