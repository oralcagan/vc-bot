package main

import (
	"os"
	"strings"
)

type APIResponse struct {
	Text     string              `json:"text"`
	Intents  []Intent            `json:"intents"`
	Entities map[string][]Entity `json:"entities"`
}

type Intent struct {
	Name       string  `json:"name"`
	Confidence float64 `json:"confidence"`
}

type Entity struct {
	Entity string `json:"name"`
	Value  string `json:"value"`
}

type ModifiedAPIResponse struct {
	ID            string   `json:"id"`
	HasCatchWord  bool     `json:"catchword"`
	Intent        string   `json:"intent"`
	Entities      []Entity `json:"entities"`
	LowConfidence bool     `json:"confident"`
}

//catchPhrase
var catchPhrase = strings.ToLower(os.Getenv("CATCHPHRASE"))

//editAPIResponse Changes the structure of the API response to make it ready to be sent to a client.
func modifyAPIResponse(reqType RequestType, prefs UserPreferences, apiRes APIResponse) (ModifiedAPIResponse, error) {
	if reqType == ReqTypes.Intent {
		modifiedAPIRes, err := modifyForIntent(prefs, apiRes)
		if err != nil {
			return ModifiedAPIResponse{}, err
		}
		return modifiedAPIRes, nil
	} else if reqType == ReqTypes.CatchPhrase {
		return modifyForCatchword(apiRes), nil
	}
	return ModifiedAPIResponse{}, &unknownReqType{reqType: reqType}
}

func modifyForIntent(prefs UserPreferences, apiRes APIResponse) (ModifiedAPIResponse, error) {
	if len(apiRes.Intents) == 0 {
		return ModifiedAPIResponse{LowConfidence: true}, nil
	}

	if apiRes.Intents[0].Confidence <= MinConfidence {
		return ModifiedAPIResponse{LowConfidence: true}, nil
	}
	
	entities := entityMapToEntityArray(apiRes.Entities)
	for i := 0; i < len(entities); i++ {
		entity := entities[i]
		val, ok := (prefs.Entities[entity.Entity])[entity.Value]
		if ok {
			entity.Value = val
		}
		entities[i] = entity
	}
	return ModifiedAPIResponse{Intent: apiRes.Intents[0].Name, Entities: entities, LowConfidence: false}, nil
}

func modifyForCatchword(apiRes APIResponse) ModifiedAPIResponse {
		if strings.Contains(strings.ToLower(apiRes.Text), catchPhrase) {
			return ModifiedAPIResponse{HasCatchWord: true}
		}
	return ModifiedAPIResponse{HasCatchWord: false}
}

func entityMapToEntityArray(m map[string][]Entity) []Entity {
	maplen := len(m)
	entlist := make([]Entity, maplen, maplen)
	i := 0
	for _, x := range m {
		entlist[i] = x[0]
		i++
	}
	return entlist
}
