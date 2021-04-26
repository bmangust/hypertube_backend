package handlers

import (
	"bytes"
	"fmt"
	"net/http"

	"torrentClient/db"
	"torrentClient/magnetToTorrent"
	"torrentClient/torrentfile"

	"github.com/sirupsen/logrus"
)

func DownloadRequestsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		fileId := r.URL.Query().Get("file_id")

		response := struct {
			IsLoaded	bool	`json:"isLoaded"`
			Key			string	`json:"key"`
			LoadedPiecesTable string	`json:"loadedPiecesTable"`
			FileName	string		`json:"fileName"`
		}{}

		response.IsLoaded = false
		response.Key = fileId
		response.LoadedPiecesTable = db.GetFilesManagerDb().PartsTableNameForFile(fileId)

		torrentBytes, magnetLink, ok := db.GetFilesManagerDb().GetTorrentOrMagnetForByFileId(fileId)
		if !ok {
			SendFailResponseWithCode(w, "File not found or not downloadable", http.StatusNotFound)
			return
		}

		doChangeAnnounce := false

		if (torrentBytes == nil || len(torrentBytes) == 0) && len(magnetLink) > 0 {
			torrentBytes = magnetToTorrent.ConvertMagnetToTorrent(magnetLink)
			logrus.Info("Converted! ", len(torrentBytes))
			doChangeAnnounce = true
		}

		torrent, err := torrentfile.GetManager().ReadTorrentFileFromBytes(bytes.NewBuffer(torrentBytes))
		if err != nil {
			logrus.Errorf("Error reading torrent file: %v", err)
			SendFailResponseWithCode(w, fmt.Sprintf("Error reading body: %s; body: %s", err.Error(), string(torrentBytes)), http.StatusInternalServerError)
			return
		}
		torrent.SysInfo.FileId = fileId

		if doChangeAnnounce {
			trackerUrl := GetTrackersFromMagnet(magnetLink)
			logrus.Infof("Tracker url: %v", trackerUrl)
			torrent.Announce = trackerUrl
		}

		if torrent.Announce == "" || len(torrent.AnnounceList) == 0 {
			SendFailResponseWithCode(w, "Announce is empty", http.StatusBadRequest)
			return
		}

		//logrus.Infof("Ready torrent info: %v %v", torrent.Announce, torrent.AnnounceList)
		var fLen int64

		response.FileName, fLen = torrent.PrepareFile()
		db.GetFilesManagerDb().SetFileLengthForRecord(torrent.SysInfo.FileId, fLen)
		go torrent.SaveLoadedPiecesToFS()

		go func() {
			db.GetFilesManagerDb().SetInProgressStatusForRecord(torrent.SysInfo.FileId, true)
			defer db.GetFilesManagerDb().SetInProgressStatusForRecord(torrent.SysInfo.FileId, false)

			err = torrent.DownloadToFile()
			if err != nil {
				logrus.Errorf("Error downloading to file: %v", err)
			} else {
				db.GetFilesManagerDb().SetLoadedStatusForRecord(torrent.SysInfo.FileId, true)
			}
		}()
		SendDataResponse(w, response)
	}
}

func WriteLoadedPartsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		fileId := r.URL.Query().Get("file_id")

		torrentBytes, magnetLink, ok := db.GetFilesManagerDb().GetTorrentOrMagnetForByFileId(fileId)
		if !ok {
			SendFailResponseWithCode(w, "File not found or not downloadable", http.StatusNotFound)
			return
		}

		if (torrentBytes == nil || len(torrentBytes) == 0) && len(magnetLink) > 0 {
			torrentBytes = magnetToTorrent.ConvertMagnetToTorrent(magnetLink)
			logrus.Info("Converted! ", len(torrentBytes))
		}

		torrent, err := torrentfile.GetManager().ReadTorrentFileFromBytes(bytes.NewBuffer(torrentBytes))
		if err != nil {
			logrus.Errorf("Error reading torrent file: %v", err)
			SendFailResponseWithCode(w, fmt.Sprintf("Error reading body: %s; body: %s", err.Error(), string(torrentBytes)), http.StatusInternalServerError)
			return
		}
		torrent.SysInfo.FileId = fileId

		logs := torrent.SaveLoadedPiecesToFS()
		SendDataResponse(w, logs)
	}
}
