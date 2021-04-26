module torrentClient

go 1.16

require (
	github.com/go-redis/redis v6.15.9+incompatible
	github.com/gorilla/mux v1.8.0
	github.com/jackpal/bencode-go v1.0.0
	github.com/jmoiron/sqlx v1.3.1
	github.com/lib/pq v1.10.0
	github.com/mattn/go-sqlite3 v2.0.3+incompatible // indirect
	github.com/sirupsen/logrus v1.8.1
	github.com/webtor-io/magnet2torrent v0.0.0-20200920105221-c6515ec05480
	golang.org/x/net v0.0.0-20200222125558-5a598a2470a0 // indirect
	golang.org/x/text v0.3.3 // indirect
	google.golang.org/grpc v1.36.0
)
