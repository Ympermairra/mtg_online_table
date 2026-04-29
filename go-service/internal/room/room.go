package room

import (
	"sync"

	"github.com/Ympermairra/mtg_online_table/go-service/internal/game"
)

type Room struct {
	ID        string
	Players   map[*Client]*Player
	State     *game.GameState
	Actions   chan Action // действия от игроков
	broadcast chan Message
	mu        sync.RWMutex
}
