package hub

import (
	"encoding/json"
	"log"
	"time"

	"github.com/gorilla/websocket"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 4096
)

type Client struct {
	ID   string
	Room *Room
	Send chan []byte
	Conn *websocket.Conn
	Hub  *Hub
}

// ReadPump — читает сообщения от браузера, парсит и обрабатывает
func (c *Client) ReadPump() {
	defer func() {
		c.Hub.unregister <- c
		c.Conn.Close()
	}()

	c.Conn.SetReadLimit(maxMessageSize)
	c.Conn.SetReadDeadline(time.Now().Add(pongWait))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, raw, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway) {
				log.Printf("client %s disconnected: %v", c.ID, err)
			}
			break
		}
		c.handleMessage(raw)
	}
}

// WritePump — отправляет сообщения клиенту из канала Send
func (c *Client) WritePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case msg, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.Conn.WriteMessage(websocket.TextMessage, msg); err != nil {
				return
			}

		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// handleMessage — роутинг входящих сообщений
func (c *Client) handleMessage(raw []byte) {
	var msg Message
	if err := json.Unmarshal(raw, &msg); err != nil {
		c.Send <- errorMessage("invalid message format")
		return
	}

	switch msg.Type {

	case MsgCreateRoom:
		var p CreateRoomPayload
		if err := json.Unmarshal(msg.Payload, &p); err != nil {
			c.Send <- errorMessage("invalid create_room payload")
			return
		}
		c.Hub.handleCreateRoom(c, p)

	case MsgJoinRoom:
		var p JoinRoomPayload
		if err := json.Unmarshal(msg.Payload, &p); err != nil {
			c.Send <- errorMessage("invalid join_room payload")
			return
		}
		c.Hub.handleJoinRoom(c, p)

	case MsgLeaveRoom:
		c.Hub.handleLeaveRoom(c)

	case MsgListRooms:
		c.Hub.handleListRooms(c)

	case MsgGameAction:
		if c.Room == nil {
			c.Send <- errorMessage("not in a room")
			return
		}
		c.Room.actions <- incomingAction{client: c, payload: msg.Payload}

	default:
		c.Send <- errorMessage("unknown message type")
	}
}
