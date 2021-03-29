package slash

import (
	"context"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"io/ioutil"
	"net/http"
	"os"
	"cloud.google.com/go/firestore"
	"cloud.google.com/go/storage"
	firebase "firebase.google.com/go"
	"golang.org/x/crypto/ed25519"
)

var resType = InteractionResponseType{Pong: 1, ChannelMessageWithSource: 4, DeferredChannelMessageWithSource: 5}
var PUBLIC_KEY,_ = hex.DecodeString((os.Getenv("PUBLIC_KEY")))
const defUserFile = "defaultuser.json"
const prefpathFile = "prefpath.json"
const collectionName = "userprefs"
const uidColumn = "uid"

func HandleInteraction(w http.ResponseWriter, r *http.Request) {
	data, err := ioutil.ReadAll(r.Body)
	if err != nil {
		w.WriteHeader(400)
		return
	}

	signature,_ := hex.DecodeString((r.Header.Get("X-Signature-Ed25519")))
	timestamp := []byte(r.Header.Get("X-Signature-Timestamp"))
	
	body := append(timestamp,data...)

	if !verifySignature(body,signature) {
		w.WriteHeader(401)
		return
	}

	interaction := Interaction{}
	err = json.Unmarshal(data, &interaction)
	if err != nil {
		w.WriteHeader(400)
		return
	}
	
	switch interaction.Type {
	case 1:
		buf := makePong()
		w.Write(buf)
	case 2:
		buf, err := handleCommand(interaction)
		if err != nil {
			buf = makePong()
			w.Write(buf)
			return
		}
		w.Write(buf)
	}
}

func handleCommand(interaction Interaction) ([]byte, error) {
	app,ctx,err := initializeApp()
	if err != nil {
		return nil,err
	}

	bucket,err := getBucket(app,ctx)
	if err != nil {
		return nil,err
	}

	prefPath, err := loadPrefPath(bucket,ctx)
	if err != nil {
		return nil, err
	}

	client,err := getFirestore(app,ctx)
	if err != nil {
		return nil, err
	}
	defer client.Close()

	var uid string
	if interaction.User.ID != "" {
		uid = interaction.User.ID
	} else if interaction.Member.User.ID != "" {
		uid = interaction.Member.User.ID
	} else {
		return nil, &NoUIDError{}
	}

	docRef, err := getUserDocRef(uid, client, ctx, bucket)
	if err != nil {
		return nil, err
	}

	_,err = docRef.Update(*ctx,makeUpdateList(interaction.Data,prefPath))
	if err != nil {
		res := makeMessageResponse( "<@" + uid + ">" + " Couldn't update your preferences.")
		return json.Marshal(res)
	}
	res := makeMessageResponse("<@" + uid + ">" + " Updated your preferences")
	return json.Marshal(res)
}

func makeMessageResponse(msg string) InteractionResponse {
	return InteractionResponse{Type: resType.ChannelMessageWithSource,Data: InteractionCommandCallbackData{Content: msg}}
}

func makeUpdateList(cmd InteractionData, prefPath map[string]map[string][]string) []firestore.Update {
	list := make([]firestore.Update,0)
	cmdPath := prefPath[cmd.Name]
	for i := 0; i < len(cmd.Options); i++ {
		optName := cmd.Options[i].Name
		if path,ok := cmdPath[optName]; ok {
			list = append(list, makeUpdate(path,cmd.Options[i].Value))
		}
	}
	return list
}

func makeUpdate(path []string, value string) firestore.Update {
	flatPath := path[0]
	for i := 1; i < len(path); i++ {
		flatPath += "." + path[i]
	}
	return firestore.Update{Path: flatPath,Value: value}
}

func getUserDocRef(uid string, client *firestore.Client, ctx *context.Context, bucket *storage.BucketHandle) (*firestore.DocumentRef, error) {
	doc, err := queryDoc(uid, client, ctx)
	if err != nil {
		errVal, ok := err.(*QueryDocError)
		if ok {
			if errVal.docslen == 0 {
				doc, err = makeUserDoc(uid, client, ctx, bucket)
				if err != nil {
					return nil, err
				}
			} else {
				return nil, err
			}
		} else {
			return nil, err
		}
	}

	return doc, nil
}

func queryDoc(uid string, client *firestore.Client, ctx *context.Context) (*firestore.DocumentRef, error) {
	iter := client.Collection(collectionName).Where(uidColumn, "==", makeHash(uid)).Documents(*ctx)
	docs, err := iter.GetAll()
	if err != nil {
		return &firestore.DocumentRef{}, err
	} else if len(docs) == 0 {
		return &firestore.DocumentRef{}, &QueryDocError{docslen: len(docs)}
	} else if len(docs) > 1 {
		return &firestore.DocumentRef{}, &QueryDocError{docslen: len(docs)}
	}

	return docs[0].Ref, nil
}

func makeUserDoc(uid string, client *firestore.Client, ctx *context.Context, bucket *storage.BucketHandle) (*firestore.DocumentRef, error) {
	defUser := make(map[string]interface{})
	data, err := readFileFromBucket(defUserFile,bucket,ctx)
	if err != nil {
		return &firestore.DocumentRef{}, err
	}

	err = json.Unmarshal(data, &defUser)
	if err != nil {
		return &firestore.DocumentRef{}, err
	}
	defUser[uidColumn] = makeHash(uid)

	ref, _, err := client.Collection(collectionName).Add(*ctx, defUser)
	if err != nil {
		return &firestore.DocumentRef{}, err
	}

	return ref, nil
}

func makePong() []byte {
	res := InteractionResponse{Type: resType.Pong}
	data, _ := json.Marshal(res)
	return data
}

func loadPrefPath(bucket *storage.BucketHandle, ctx *context.Context) (map[string]map[string][]string, error) {
	data,err := readFileFromBucket(prefpathFile,bucket,ctx)
	if err != nil {
		return nil, err
	}
	m := make(map[string]map[string][]string)
	json.Unmarshal(data, &m)
	return m, nil
}

func initializeApp() (*firebase.App, *context.Context,error){
	ctx := context.Background()
	conf := &firebase.Config{ProjectID: os.Getenv("GCLOUD_PROJECT")}
	app, err := firebase.NewApp(ctx, conf)
	if err != nil {
		return nil,nil,err
	}

	return app,&ctx,nil
}

func readFileFromBucket(filename string,bucket *storage.BucketHandle,ctx *context.Context) ([]byte,error){
	reader,err := bucket.Object(filename).NewReader(*ctx)
	if err != nil {
		return nil,err
	}
	return ioutil.ReadAll(reader)
}

func getFirestore(app *firebase.App, ctx *context.Context) (*firestore.Client, error) {
	return app.Firestore(*ctx)
}

func getBucket(app *firebase.App, ctx *context.Context) (*storage.BucketHandle, error)  {
	client,err := app.Storage(*ctx)
	if err != nil {
		return nil,err
	}

	return client.Bucket(os.Getenv("BUCKET_NAME"))
}


func makeHash(s string) string {
	hashWriter := sha256.New()
	hashWriter.Write([]byte(s))
	return (base64.URLEncoding.EncodeToString(hashWriter.Sum(nil)))
}

func verifySignature(body []byte,signature []byte) bool {
	return ed25519.Verify(PUBLIC_KEY,body,signature)
}