package hub

import (
	"encoding/json"
	"fmt"
	"sync"

	"github.com/Ympermairra/mtg_online_table/go-service/internal/game"
)

const maxPlayersPerRoom = 2
const startingLife = 20

// Player — игрок внутри комнаты
type Player struct {
	Client *Client
	DeckID int
}

// joinRequest — запрос на вход в комнату
type joinRequest struct {
	client *Client
	deckID int
	result chan error
}

// incomingAction — игровое действие от клиента
type incomingAction struct {
	client  *Client
	payload json.RawMessage
}

type Room struct {
	ID      string
	Format  string
	Players map[string]*Player // key: client.ID
	State   *game.GameState

	actions   chan incomingAction
	broadcast chan []byte
	join      chan *joinRequest
	leave     chan *Client

	mu sync.RWMutex
}

func NewRoom(id, format string) *Room {
	return &Room{
		ID:        id,
		Format:    format,
		Players:   make(map[string]*Player),
		actions:   make(chan incomingAction, 64),
		broadcast: make(chan []byte, 64),
		join:      make(chan *joinRequest),
		leave:     make(chan *Client),
	}
}

// Run — главный цикл комнаты, запускается в горутине
func (r *Room) Run() {
	for {
		select {

		case req := <-r.join:
			r.mu.Lock()
			if len(r.Players) >= maxPlayersPerRoom {
				req.result <- fmt.Errorf("room is full")
				r.mu.Unlock()
				continue
			}
			r.Players[req.client.ID] = &Player{
				Client: req.client,
				DeckID: req.deckID,
			}
			playerCount := len(r.Players)
			req.result <- nil
			r.mu.Unlock()

			r.notifyRoomJoined()

			// Оба игрока зашли — запускаем игру
			if playerCount == maxPlayersPerRoom {
				r.initGame()
				r.broadcastState()
			}

		case client := <-r.leave:
			r.mu.Lock()
			delete(r.Players, client.ID)
			r.mu.Unlock()
			r.notifyPlayerLeft(client.ID)

		// Sandbox: применяем действие к стейту и рассылаем всем
		case action := <-r.actions:
			r.applyAction(action)
			r.broadcastState()

		case msg := <-r.broadcast:
			r.mu.RLock()
			for _, p := range r.Players {
				select {
				case p.Client.Send <- msg:
				default:
				}
			}
			r.mu.RUnlock()
		}
	}
}

// initGame — инициализирует начальное состояние игры
func (r *Room) initGame() {
	r.mu.Lock()
	defer r.mu.Unlock()

	players := make(map[string]*game.PlayerState)
	for id := range r.Players {
		players[id] = &game.PlayerState{
			Life:        startingLife,
			Hand:        []game.CardInstance{},
			Battlefield: []game.CardInstance{},
			Graveyard:   []game.CardInstance{},
			LibrarySize: 60,
			ManaPool:    game.ManaPool{},
		}
	}

	ids := make([]string, 0, len(r.Players))
	for id := range r.Players {
		ids = append(ids, id)
	}

	r.State = &game.GameState{
		Turn:         1,
		ActivePlayer: ids[0],
		Phase:        "untap",
		Players:      players,
	}
}

// applyAction — sandbox: применяем действие без валидации
func (r *Room) applyAction(a incomingAction) {
	r.mu.Lock()
	defer r.mu.Unlock()

	if r.State == nil {
		return
	}

	var payload map[string]any
	if err := json.Unmarshal(a.payload, &payload); err != nil {
		return
	}

	action, _ := payload["action"].(string)

	switch action {
	case "tap_card":
		instanceID, _ := payload["instance_id"].(string)
		r.toggleTap(instanceID)

	case "set_life":
		playerID, _ := payload["player_id"].(string)
		value, _ := payload["value"].(float64)
		if p, ok := r.State.Players[playerID]; ok {
			p.Life = int(value)
		}

	case "move_card":
		// TODO: реализовать перемещение между зонами
		// from, to, instance_id

	case "add_counter":
		instanceID, _ := payload["instance_id"].(string)
		counterType, _ := payload["counter_type"].(string)
		r.addCounter(instanceID, counterType, 1)

	case "remove_counter":
		instanceID, _ := payload["instance_id"].(string)
		counterType, _ := payload["counter_type"].(string)
		r.addCounter(instanceID, counterType, -1)

	case "next_phase":
		r.nextPhase()
	}
}

func (r *Room) toggleTap(instanceID string) {
	for _, p := range r.State.Players {
		for i, c := range p.Battlefield {
			if c.InstanceID == instanceID {
				p.Battlefield[i].Tapped = !p.Battlefield[i].Tapped
				return
			}
		}
	}
}

func (r *Room) addCounter(instanceID, counterType string, delta int) {
	for _, p := range r.State.Players {
		for i, c := range p.Battlefield {
			if c.InstanceID == instanceID {
				if p.Battlefield[i].Counters == nil {
					p.Battlefield[i].Counters = make(map[string]int)
				}
				p.Battlefield[i].Counters[counterType] += delta
				return
			}
		}
	}
}

func (r *Room) nextPhase() {
	phases := []string{
		"untap", "upkeep", "draw",
		"main1",
		"begin_combat", "declare_attackers", "declare_blockers", "damage", "end_of_combat",
		"main2",
		"end_step",
	}
	for i, ph := range phases {
		if ph == r.State.Phase {
			if i+1 < len(phases) {
				r.State.Phase = phases[i+1]
			} else {
				// Новый ход
				r.State.Phase = "untap"
				r.State.Turn++
				r.nextActivePlayer()
				r.untapAll()
			}
			return
		}
	}
}

func (r *Room) nextActivePlayer() {
	ids := make([]string, 0, len(r.State.Players))
	for id := range r.State.Players {
		ids = append(ids, id)
	}
	for i, id := range ids {
		if id == r.State.ActivePlayer {
			r.State.ActivePlayer = ids[(i+1)%len(ids)]
			return
		}
	}
}

func (r *Room) untapAll() {
	active := r.State.Players[r.State.ActivePlayer]
	if active == nil {
		return
	}
	for i := range active.Battlefield {
		active.Battlefield[i].Tapped = false
	}
}

func (r *Room) broadcastState() {
	r.mu.RLock()
	state := r.State
	r.mu.RUnlock()

	if state == nil {
		return
	}

	msg, _ := encodeMessage(MsgStateUpdate, state)
	r.broadcast <- msg
}

func (r *Room) notifyRoomJoined() {
	r.mu.RLock()
	players := r.playerIDs()
	r.mu.RUnlock()

	msg, _ := encodeMessage(MsgRoomJoined, RoomJoinedPayload{
		RoomID:  r.ID,
		Format:  r.Format,
		Players: players,
	})
	r.broadcast <- msg
}

func (r *Room) notifyPlayerLeft(clientID string) {
	msg, _ := encodeMessage(MsgPlayerLeft, PlayerLeftPayload{ClientID: clientID})
	r.broadcast <- msg
}

func (r *Room) playerIDs() []string {
	ids := make([]string, 0, len(r.Players))
	for id := range r.Players {
		ids = append(ids, id)
	}
	return ids
}

func (r *Room) Info() RoomInfo {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return RoomInfo{
		ID:         r.ID,
		Format:     r.Format,
		Players:    r.playerIDs(),
		MaxPlayers: maxPlayersPerRoom,
	}
}
