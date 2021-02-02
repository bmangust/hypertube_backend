package env

import (
	"sync"

)

var syncOnce sync.Once
var parser Parser

type Parser interface {
	GetOffersDbAddr() string
	GetOffersDbPasswd() string
	IsDevMode() bool
	GetTrackerApiHost() string
	GetTrackerApiEmail() string
	GetTrackerApiPassword() string
	GetPostgresDbDsn() string
	GetRotationInternalKey() string
	GetRotationURL() string
}

func GetParser() Parser {
	syncOnce.Do(func() {
		parser = &impl.Parser{}
	})
	return parser
}
