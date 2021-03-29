package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"strconv"
	"sync"
)

func analyzeSpeech(reqType RequestType, reader *WebSocketReader, socket *SafeSocket, reqID uint64, uID string) {
	defer socket.DeleteReader(reqID)

	prefs := UserPreferences{}
	apiRes := APIResponse{}
	var err error = nil

	if reqType == ReqTypes.CatchPhrase {
		apiRes, err = analyzeForCatchphrase(reader)
		if err != nil {
			return
		}
	} else if reqType == ReqTypes.Intent {
		prefs, apiRes, err = analyzeForIntent(reader, uID)
		if err != nil {
			return
		}
	}

	modifiedRes, err := modifyAPIResponse(reqType, prefs, apiRes)
	if err != nil {
		return
	}

	modifiedRes.ID = strconv.FormatUint(reqID, 10)

	encodedRes, err := json.Marshal(modifiedRes)
	if err != nil {
		return
	}

	if err := socket.Write(encodedRes); err != nil {
		fmt.Println(err)
	}

}

func analyzeForIntent(reader *WebSocketReader, uID string) (UserPreferences, APIResponse, error) {
	wg := &sync.WaitGroup{}
	wg.Add(1)
	prefs := UserPreferences{Success: false}
	go fetchUserPreferences(uID, &prefs, wg)

	body, err := makeRequestToAPI(reader)
	if err != nil {
		return UserPreferences{}, APIResponse{}, err
	}

	wg.Wait()
	if !prefs.Success {
		return UserPreferences{}, APIResponse{}, &fetchPrefsError{}
	}

	apiRes := APIResponse{}
	err = json.Unmarshal(body, &apiRes)
	if err != nil {
		return UserPreferences{}, APIResponse{}, err
	}

	return prefs, apiRes, nil
}

func analyzeForCatchphrase(reader *WebSocketReader) (APIResponse, error) {
	body, err := makeRequestToAPI(reader)
	if err != nil {
		return APIResponse{}, err
	}

	apiRes := APIResponse{}
	err = json.Unmarshal(body, &apiRes)
	if err != nil {
		fmt.Println(err)
		return APIResponse{}, err
	}

	return apiRes, nil
}

func makeRequestToAPI(reader *WebSocketReader) ([]byte, error) {
	req, err := http.NewRequest("POST", API, reader)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", ContentType)
	req.Header.Set("Transfer-Encoding", "chunked")
	req.Header.Set("Authorization", "Bearer "+WitAPIToken)

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	if res.StatusCode != 200 {
		return nil, err
	}

	body, err := ioutil.ReadAll(res.Body)

	if err != nil {
		return nil, err
	}
	return body, nil
}
