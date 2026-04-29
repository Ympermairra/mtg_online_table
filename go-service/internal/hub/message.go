package hub

import "encoding/json"

type MessageType string

const (
	// Клиент → Сервер
	MsgCreateRoom MessageType = "create_room"
	MsgJoinRoom   MessageType = "join_room"
	MsgLeaveRoom  MessageType = "leave_room"
	MsgListRooms  MessageType = "list_rooms"
	MsgGameAction MessageType = "game_action"

	// Сервер → Клиент
	MsgRoomJoined   MessageType = "room_joined"
	MsgRoomList     MessageType = "room_list"
	MsgPlayerJoined MessageType = "player_joined"
	MsgPlayerLeft   MessageType = "player_left"
	MsgStateUpdate  MessageType = "state_update"
	MsgError        MessageType = "error"
)

// Envelope — общая обёртка для всех сообщений
type Message struct {
	Type    MessageType     `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

// --- Входящие payload'ы (клиент → сервер) ---

type CreateRoomPayload struct {
	Format string `json:"format"` // standard, modern, commander...
	DeckID int    `json:"deck_id"`
}

type JoinRoomPayload struct {
	RoomID string `json:"room_id"`
	DeckID int    `json:"deck_id"`
}

// --- Исходящие payload'ы (сервер → клиент) ---

type RoomJoinedPayload struct {
	RoomID  string   `json:"room_id"`
	Format  string   `json:"format"`
	Players []string `json:"players"` // список client ID
}

type RoomListPayload struct {
	Rooms []RoomInfo `json:"rooms"`
}

type RoomInfo struct {
	ID         string   `json:"id"`
	Format     string   `json:"format"`
	Players    []string `json:"players"`
	MaxPlayers int      `json:"max_players"`
}

type PlayerLeftPayload struct {
	ClientID string `json:"client_id"`
}

type ErrorPayload struct {
	Message string `json:"message"`
}

// helpers

func encodeMessage(msgType MessageType, payload any) ([]byte, error) {
	raw, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}
	return json.Marshal(Message{Type: msgType, Payload: raw})
}

func errorMessage(text string) []byte {
	b, _ := encodeMessage(MsgError, ErrorPayload{Message: text})
	return b
}
