package server

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"rotation_v4/parser/env"
	"rotation_v4/server/handlers"

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

	router.HandleFunc("/",)


	logrus.Info("Listening localhost:2222")
	if err := http.ListenAndServe(":2222", middlewareCookie(router)); err != nil {
		logrus.Fatal("Server err: ", err)
	}
}

func middlewareCookie(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if devMode || !strings.HasPrefix(r.URL.Path, "/internal/") {
			next.ServeHTTP(w, r)
			return
		}

		auth, err := r.Cookie("auth")
		if err != nil {
			log.Println("Failed getting cookie", err)
			w.Write([]byte("Some error" + err.Error() + "\n\n"))
			return
		}
		if VerifyCookerToken(TokenRequest{Token: auth.Value}) {
			next.ServeHTTP(w, r)
		} else {
			handlers.SendFailResponseWithCode(w, "Go Mobile auth cookie is invalid or not set", http.StatusUnauthorized)
		}
	})
}

func VerifyCookerToken(token TokenRequest) bool {
	jsonData, err := json.Marshal(token)
	if err != nil {
		logrus.Fatal("Error marshalling cookie: ", err)
	}
	body := bytes.NewReader(jsonData)
	resp, err := http.Post("https://cooker.gomobile.ru/verify", "application/json", body)
	if err != nil {
		logrus.Fatal("Error requesting cooker: ", err)
	}
	defer resp.Body.Close()

	resultReader := make([]byte, 2)
	numOfBytes, err := resp.Body.Read(resultReader)
	if err != nil && numOfBytes <= 0 {
		logrus.Fatal("Error reading response: ", err)
	}
	result := string(resultReader)
	return result == "OK"
}
