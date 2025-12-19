package config

import (
	"log"
	"os"
	"strconv"
	"time"
)

// Config хранит все важные настройки сервера
type Config struct {
	Env           string
	DBURL         string
	JWTSecret     []byte
	JWTTTL        time.Duration
	LoginRateRPS  float64
	LoginBurst    int
	AllowedOrigin string
}

func Load() *Config {
	cfg := &Config{
		Env:           getEnv("APP_ENV", "dev"),
		DBURL:         mustEnv("DATABASE_URL"),
		JWTSecret:     []byte(mustEnv("JWT_SECRET")),
		JWTTTL:        getDuration("JWT_TTL", time.Hour),
		LoginRateRPS:  getFloat("LOGIN_RATE_RPS", 3.0),
		LoginBurst:    getInt("LOGIN_BURST", 10),
		AllowedOrigin: getEnv("CORS_ORIGIN", "http://localhost:5173"),
	}
	return cfg
}

func mustEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		log.Fatalf("missing required env var %s", key)
	}
	return v
}

func getEnv(key, def string) string {
	v := os.Getenv(key)
	if v == "" {
		return def
	}
	return v
}

func getDuration(key string, def time.Duration) time.Duration {
	v := os.Getenv(key)
	if v == "" {
		return def
	}
	d, err := time.ParseDuration(v)
	if err != nil {
		log.Printf("invalid duration for %s=%q: %v, using default %s", key, v, err, def)
		return def
	}
	return d
}

func getInt(key string, def int) int {
	v := os.Getenv(key)
	if v == "" {
		return def
	}
	i, err := strconv.Atoi(v)
	if err != nil {
		log.Printf("invalid int for %s=%q: %v, using default %d", key, v, err, def)
		return def
	}
	return i
}

func getFloat(key string, def float64) float64 {
	v := os.Getenv(key)
	if v == "" {
		return def
	}
	f, err := strconv.ParseFloat(v, 64)
	if err != nil {
		log.Printf("invalid float for %s=%q: %v, using default %f", key, v, err, def)
		return def
	}
	return f
}
