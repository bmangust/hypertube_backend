package main

import (
	"hypertube_storage/server"
)

func main() {
	InitLog()

	defer func() {
	}()

	server.Start()
}
