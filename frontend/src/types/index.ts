// --- WebSocket сообщения ---

export type MessageType =
  | 'create_room'
  | 'join_room'
  | 'leave_room'
  | 'list_rooms'
  | 'game_action'
  | 'room_joined'
  | 'room_list'
  | 'player_joined'
  | 'player_left'
  | 'state_update'
  | 'error'

export interface WsMessage<T = unknown> {
  type: MessageType
  payload: T
}

// --- Комнаты ---

export interface RoomInfo {
  id: string
  format: string
  players: string[]
  max_players: number
}

export interface RoomJoinedPayload {
  room_id: string
  format: string
  players: string[]
}

// --- Игровое состояние ---

export interface ManaPool {
  white: number
  blue: number
  black: number
  red: number
  green: number
  colorless: number
}

export interface CardInstance {
  instance_id: string
  card_id: string
  tapped: boolean
  counters: Record<string, number>
  annotations: string[]
}

export interface PlayerState {
  life: number
  hand: CardInstance[]
  battlefield: CardInstance[]
  graveyard: CardInstance[]
  library_size: number
  mana_pool: ManaPool
}

export interface GameState {
  turn: number
  active_player: string
  phase: 'untap' | 'upkeep' | 'draw' | 'main1' | 'begin_combat' | 'declare_attackers' | 'declare_blockers' | 'damage' | 'end_of_combat' | 'main2' | 'end_step'
  players: Record<string, PlayerState>
}

// --- Игровые действия ---

export type GameActionType =
  | 'move_card'
  | 'tap_card'
  | 'untap_card'
  | 'set_life'
  | 'add_counter'
  | 'remove_counter'
  | 'next_phase'
  | 'draw_card'
  | 'shuffle_library'

export interface GameAction {
  action: GameActionType
  [key: string]: unknown
}
