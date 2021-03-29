package main

import (
	"crypto/sha256"
	"encoding/base64"
	"sync"
)

type UserPreferences struct {
	UID      string                              `firestore:"uid"`
	Entities map[string](map[string]string) `firestore:"entities"`
	Success  bool
}

func fetchUserPreferences(uID string, prefs *UserPreferences, wg *sync.WaitGroup) {
	defer wg.Done()

	uIDstr := makeHash(uID)

	snapshot, err := FirestoreClient.Collection(CollectionName).Where(UIDField, "==", uIDstr).Documents(*FirestoreCtx).GetAll()
	if err != nil {
		return
	}

	if len(snapshot) == 0 {
		prefs.Success = false
		return
	}

	err = snapshot[0].DataTo(prefs)
	if err == nil {
		prefs.Success = true
	}
}

func makeHash(s string) string {
	hashWriter := sha256.New()
	hashWriter.Write([]byte(s))
	return (base64.URLEncoding.EncodeToString(hashWriter.Sum(nil)))
}