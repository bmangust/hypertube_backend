package impl

import (
	"fmt"
	"os"
)

type Parser struct {
}

func (p *Parser) GetOffersDbAddr() string {
	return fmt.Sprintf(
		"%v:%v",
		os.Getenv("REDIS_HOST"),
		os.Getenv("REDIS_PORT"))
}

func (p *Parser) GetPostgresDbDsn() string {
	return fmt.Sprintf(
		"host=%v port=%v user=%v password=%v dbname=%v sslmode=disable",
		os.Getenv("POSTGRES_HOST"),
		os.Getenv("POSTGRES_PORT"),
		os.Getenv("POSTGRES_USER"),
		os.Getenv("POSTGRES_PASSWORD"),
		os.Getenv("POSTGRES_DB"))
}

func (p *Parser) GetOffersDbPasswd() string {
	return os.Getenv("REDIS_PASSWORD")
}

func (p *Parser) IsDevMode() bool {
	return os.Getenv("DEV_MODE") == "on"
}

func (p *Parser) GetTrackerApiHost() string {
	host := os.Getenv("TRACKER_HOST")
	return host
}

func (p *Parser) GetTrackerApiEmail() string {
	val := os.Getenv("TRACKER_AUTH_EMAIL")
	return val
}

func (p *Parser) GetTrackerApiPassword() string {
	val := os.Getenv("TRACKER_AUTH_PASSWORD")
	return val
}

func (p *Parser) GetRotationInternalKey() string {
	val := os.Getenv("ROTATION_INTERNAL_KEY")
	return val
}

func (p *Parser) GetRotationURL() string {
	val := os.Getenv("ROTATION_URL")
	return val
}

