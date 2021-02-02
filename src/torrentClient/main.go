package main

import (
	"torrent_client/server"
)

func main() {
	InitLog()

	defer func() {
	}()

	server.Start()
}
