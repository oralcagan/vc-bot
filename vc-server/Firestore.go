package main

import (
	"context"
	"log"
	"os"

	"cloud.google.com/go/firestore"
	firebase "firebase.google.com/go"
	"google.golang.org/api/option"
)

func getFirestoreClient() (*firestore.Client, *context.Context) {
	ctx := context.Background()
	var app *firebase.App = nil
	if _, err := os.Stat(os.Getenv("CREDS_PATH")); err == nil {
		sa := option.WithCredentialsFile(os.Getenv("CREDS_PATH"))
		app, err = firebase.NewApp(ctx, nil, sa)
		if err != nil {
			log.Fatalln(err)
		}
	} else {
		//For connecting to the firestore emulator.
		conf := &firebase.Config{ProjectID: os.Getenv("GCLOUD_PROJECT")}
		app, err = firebase.NewApp(ctx, conf)
		if err != nil {
			log.Fatalln(err)
		}
	}

	client, err := app.Firestore(ctx)
	if err != nil {
		log.Fatalln(err)
	}

	return client, &ctx
}
