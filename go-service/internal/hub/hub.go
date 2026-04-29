package hub

import (
	"sync"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type Hub struct {
	rooms   map[string]*Room
	clients map[string]*Client

	register   chan *Client
	unregister chan *Client

	mu sync.RWMutex
}

func NewHub() *Hub {
	return &Hub{
		rooms:      make(map[string]*Room),
		clients:    make(map[string]*Client),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

// Run — главный цикл хаба, запускается в горутине
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client.ID] = client
			h.mu.Unlock()

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client.ID]; ok {
				delete(h.clients, client.ID)
				close(client.Send)
			}
			h.mu.Unlock()
			if client.Room != nil {
				client.Room.leave <- client
				client.Room = nil
			}
		}
	}
}

// RegisterClient — вызывается из main при новом WebSocket соединении
func (h *Hub) RegisterClient(c *Client, conn *websocket.Conn) {
	c.Hub = h
	c.Conn = conn
	h.register <- c
}

// --- Обработчики событий от клиентов ---

func (h *Hub) handleCreateRoom(c *Client, p CreateRoomPayload) {
	if c.Room != nil {
		c.Send <- errorMessage("already in a room")
		return
	}

	id := uuid.New().String()[:8]
	room := NewRoom(id, p.Format)

	h.mu.Lock()
	h.rooms[id] = room
	h.mu.Unlock()

	go room.Run()

	req := &joinRequest{client: c, deckID: p.DeckID, result: make(chan error, 1)}
	room.join <- req
	if err := <-req.result; err != nil {
		c.Send <- errorMessage(err.Error())
		return
	}
	c.Room = room
}

func (h *Hub) handleJoinRoom(c *Client, p JoinRoomPayload) {
	if c.Room != nil {
		c.Send <- errorMessage("already in a room")
		return
	}

	h.mu.RLock()
	room, ok := h.rooms[p.RoomID]
	h.mu.RUnlock()

	if !ok {
		c.Send <- errorMessage("room not found")
		return
	}

	req := &joinRequest{client: c, deckID: p.DeckID, result: make(chan error, 1)}
	room.join <- req
	if err := <-req.result; err != nil {
		c.Send <- errorMessage(err.Error())
		return
	}
	c.Room = room
}

func (h *Hub) handleLeaveRoom(c *Client) {
	if c.Room == nil {
		c.Send <- errorMessage("not in a room")
		return
	}
	c.Room.leave <- c
	c.Room = nil
}

func (h *Hub) handleListRooms(c *Client) {
	h.mu.RLock()
	infos := make([]RoomInfo, 0, len(h.rooms))
	for _, r := range h.rooms {
		infos = append(infos, r.Info())
	}
	h.mu.RUnlock()

	msg, _ := encodeMessage(MsgRoomList, RoomListPayload{Rooms: infos})
	c.Send <- msg
}
