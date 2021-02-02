package torrent

import (
	"net"
	"time"

	"hypertube_storage/model"
)

type torrentManager struct {
}

func GetManager() torrentManager {
	return torrentManager{}
}

func (m *torrentManager) DownloadFileFromTorrent(config model.BencodeTorrent)  {
	conn, err := net.DialTimeout("tcp", peer.String(), 3*time.Second)
	if err != nil {
		return nil, err
	}
}
