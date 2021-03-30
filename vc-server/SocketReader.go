package main

import "sync"
import "io"

//WebSocketReader Reads a buffer that can be modified from outside the struct
type WebSocketReader struct {
	mu     sync.Mutex
	Buf    []byte
	Closed bool
}

func (r *WebSocketReader) Read(p []byte) (n int, err error) {
	defer r.mu.Unlock()
	r.mu.Lock()
	if r.Closed && len(r.Buf) == 0 {
		return 0, io.EOF
	}

	wantedLen := len(p)
	if wantedLen > len(r.Buf) {
		wantedLen = len(r.Buf)
	}

	for i := 0; i < wantedLen; i++ {
		p[i] = r.Buf[i]
	}

	if wantedLen == len(r.Buf) {
		r.Buf = make([]byte, 0)
	} else {
		r.Buf = r.Buf[wantedLen:]
	}

	return wantedLen, nil
}

func (r *WebSocketReader) Push(data []byte) {
	defer r.mu.Unlock()
	r.mu.Lock()
	r.Buf = append(r.Buf, data...)
}

//Close Closes the reader
func (r *WebSocketReader) Close() (err error) {
	defer r.mu.Unlock()
	r.mu.Lock()
	r.Closed = true
	return nil
}
