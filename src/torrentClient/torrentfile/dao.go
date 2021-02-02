package torrentfile

import "io"

type TorrentFilesManager interface {
	ReadTorrentFileFromFS(path string) (TorrentFile, error)
	ReadTorrentFileFromHttpBody(body io.Reader) (TorrentFile, error)
}
