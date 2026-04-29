package game

type GameState struct {
	Turn         int                     `json:"turn"`
	ActivePlayer string                  `json:"active_player"`
	Phase        string                  `json:"phase"`
	Players      map[string]*PlayerState `json:"players"`
}

type PlayerState struct {
	Life        int            `json:"life"`
	Hand        []CardInstance `json:"hand"`
	Battlefield []CardInstance `json:"battlefield"`
	Graveyard   []CardInstance `json:"graveyard"`
	LibrarySize int            `json:"library_size"`
	ManaPool    ManaPool       `json:"mana_pool"`
}

type CardInstance struct {
	InstanceID  string         `json:"instance_id"`
	CardID      string         `json:"card_id"`
	Tapped      bool           `json:"tapped"`
	Counters    map[string]int `json:"counters"`
	Annotations []string       `json:"annotations"`
}

type ManaPool struct {
	White     int `json:"white"`
	Blue      int `json:"blue"`
	Black     int `json:"black"`
	Red       int `json:"red"`
	Green     int `json:"green"`
	Colorless int `json:"colorless"`
}
