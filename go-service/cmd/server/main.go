package main

import (
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"

	"github.com/Ympermairra/mtg_online_table/go-service/internal/hub"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	// В проде заменить на проверку Origin
	CheckOrigin: func(r *http.Request) bool { return true },
}

func main() {
	h := hub.NewHub()
	go h.Run()

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// GET /ws — WebSocket подключение
	r.Get("/game-ws/", func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Printf("upgrade error: %v", err)
			return
		}

		client := &hub.Client{
			ID:   uuid.New().String()[:8],
			Send: make(chan []byte, 256),
		}
		// Передаём hub клиенту (через экспортированный метод)
		h.RegisterClient(client, conn)

		go client.WritePump()
		go client.ReadPump()
	})

	// GET /health — для Docker healthcheck
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	log.Println("go-service listening on :8080")
	if err := http.ListenAndServe(":8080", r); err != nil {
		log.Fatal(err)
	}
}
