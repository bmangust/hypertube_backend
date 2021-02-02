package server

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"torrent_client/parser/env"

	"github.com/gorilla/mux"
	"github.com/sirupsen/logrus"
)

var devMode bool

type UserData struct {
	UserEmail string `json:"Email"`
	UserToken string `json:"Token"`
}

type TokenRequest struct {
	Token string `json:"Token"`
}

func Start() {
	devMode = env.GetParser().IsDevMode()

	router := mux.NewRouter()

	router.HandleFunc("/", )

	logrus.Info("Listening localhost:2222")
	if err := http.ListenAndServe(":2222", router); err != nil {
		logrus.Fatal("Server err: ", err)
	}
}

