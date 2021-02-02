package handlers

import (
	"encoding/json"

	"hypertube_storage/model"

	"github.com/sirupsen/logrus"
	"io/ioutil"
	"net/http"
	"time"
)


func SendFailResponseWithCode(w http.ResponseWriter, text string, code int) {
	var packet []byte
	var err error

	response := &model.DataResponse{Status: false, Data: text}
	w.Header().Set("content-type", "application/json")
	w.WriteHeader(code)

	if packet, err = json.Marshal(response); err != nil {
		logrus.Error("Error marshalling response: ", err)
	}
	if _, err = w.Write(packet); err != nil {
		logrus.Error("Error sending response: ", err)
	}
}

func SendSuccessResponse(w http.ResponseWriter) {
	var packet []byte
	var err error

	response := &model.DataResponse{Status: true, Data: nil}
	w.Header().Set("content-type", "application/json")

	if packet, err = json.Marshal(response); err != nil {
		logrus.Error("Error marshalling response: ", err)
	}
	if _, err = w.Write(packet); err != nil {
		logrus.Error("Error sending response: ", err)
	}
}

func SendDataResponse(w http.ResponseWriter, data interface{}) {
	var packet []byte
	var err error

	response := &model.DataResponse{Status: true, Data: data}
	w.Header().Set("content-type", "application/json")

	if packet, err = json.Marshal(response); err != nil {
		logrus.Error("Error marshalling response: ", err)
	}
	if _, err = w.Write(packet); err != nil {
		logrus.Error("Error sending response: ", err)
	}
}

func UnmarshalHttpBodyToBencodeTorrent(w http.ResponseWriter, r *http.Request) (*model.BencodeTorrent, bool) {
	container := model.BencodeTorrent{}
	requestData, err := ioutil.ReadAll(r.Body)
	if err != nil {
		logrus.Error("Can't read request body: ", err)
		SendFailResponseWithCode(w, "error reading body", http.StatusInternalServerError)
		return nil, false
	}
	err = json.Unmarshal(requestData, &container)
	if err != nil {
		logrus.Error("Can't read request body: ", err)
		SendFailResponseWithCode(w, "error reading body", http.StatusInternalServerError)
		return nil, false
	}
	return &container, true
}

func SetCookieForHour(w http.ResponseWriter, cookieName, value string) {
	c := http.Cookie{
		Name:     cookieName,
		Domain: ".gomobile.ru",
		Value:    value,
		Path:     "/",
		SameSite: http.SameSiteStrictMode,
		MaxAge:   int(time.Hour.Seconds())}
	http.SetCookie(w, &c)
}

