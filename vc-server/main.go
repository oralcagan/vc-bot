package main

import (
	"encoding/binary"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gorilla/websocket"
)

//RequestStatus Status of a request sent by a websocket client
type RequestStatus uint8

type RequestStatuses struct {
		//Start implies that this request should be treated as a new request
		Start RequestStatus //1
		//Continue implies that this request isn't new or ending.
		Continue RequestStatus //2
		//End implies that no more data will come with this specific request.
		End RequestStatus //3
		//Mask
		Mask RequestStatus
}

func (r *RequestStatuses) Make() {
	r.Start = 1
	r.Continue = 2
	r.End = 3
	r.Mask = 3
}

//RequestType Shows how the request sent with it should be handled.
type RequestType uint8

type RequestTypes struct {
		//CatchPhrase The request wants the API to detect a catchphrase in the data.
		CatchPhrase RequestType //0
		//Intent The request wants the API to detect the intent of the user creating the data.
		Intent RequestType //4
		//Mask
		Mask RequestType
}

func (r *RequestTypes) Make() {
	r.Intent = 4
	r.CatchPhrase = 0
	r.Mask = 4
}

var ReqStatuses = RequestStatuses{}
var ReqTypes = RequestTypes{}

//API Wit.ai API address
const API string = "https://api.wit.ai/speech"

//ContentType Value of the content type header to be passed with the HTTP request sent to the API.
const ContentType string = "audio/raw;encoding=signed-integer;bits=16;rate=48000;endian=little"

//WitAPIToken Wit API token
var WitAPIToken = os.Getenv("WIT_TOKEN")
var Port = os.Getenv("SPEECHREC_SERVER_PORT")

var upgrader = websocket.Upgrader{}

var FirestoreClient, FirestoreCtx = getFirestoreClient()

const CollectionName = "userprefs"
const UIDField = "uid"

const MinConfidence float64 = 0.9

func main() {
	if Port == "" {
		log.Fatal("Enter a port number")
	}

	ReqStatuses.Make()
	ReqTypes.Make()

	http.HandleFunc("/", handleNewConn)
	log.Fatal(http.ListenAndServe(fmt.Sprintf("127.0.0.1:%v", Port), nil))
}

func handleNewConn(w http.ResponseWriter, r *http.Request) {
	c, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println(err.Error())
		return
	}
	defer c.Close()

	apiRequests := make(map[uint64]*WebSocketReader)
	socket := &SafeSocket{Conn: c, APIRequests: &apiRequests}
	for {
		_,msg, err := socket.Conn.ReadMessage()
		if err != nil {
			break
		}
		//8 byte (request id) + 8 byte (snowflake) + 1 byte (flags) = 17

		reqID := binary.LittleEndian.Uint64(msg[:8])
		uID := string(msg[8:26])
		flags := msg[26]
		reqStatus := getReqStatus(flags)
		buf := msg[27:]

		switch reqStatus {
		case ReqStatuses.Start:
			if _, ok := apiRequests[reqID]; ok {
				continue
			}

			socketReader := &WebSocketReader{Buf: buf, Closed: false}
			apiRequests[reqID] = socketReader

			reqType := getReqType(flags)
			go analyzeSpeech(reqType, socketReader, socket, reqID, uID)
		case ReqStatuses.Continue:
			socketReader, ok := apiRequests[reqID]
			if ok {
				socketReader.Push(buf)
			}
		case ReqStatuses.End:
			socketReader, ok := apiRequests[reqID]
			if ok {
				socketReader.Push(buf)
				socketReader.Close()
			}
		}
	}
}

func getReqStatus(b byte) (reqStatus RequestStatus) {
	reqStatus = RequestStatus(b & byte(ReqStatuses.Mask))
	return
}

func getReqType(b byte) (reqType RequestType) {
	reqType = RequestType(b & byte(ReqTypes.Mask))
	return
}
