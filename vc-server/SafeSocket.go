package main

import (
	"github.com/gorilla/websocket"
	"sync"
)

//SafeSocket A struct made for multiple goroutines to access a websocket connection
type SafeSocket struct {
	Mu          sync.Mutex
	Conn        *websocket.Conn
	APIRequests *map[uint64]*WebSocketReader
}

func (socket *SafeSocket) DeleteReader(reqID uint64) {
	socket.Mu.Lock()
	delete(*socket.APIRequests, reqID)
	socket.Mu.Unlock()
}

func (socket *SafeSocket) Write(data []byte) error {
	socket.Mu.Lock()
	defer socket.Mu.Unlock()
	return socket.Conn.WriteMessage(2, data)
}
