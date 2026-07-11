package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

type clientInfo struct {
	Count     int
	ResetTime time.Time
}

type LoginRateLimiter struct {
	mu         sync.Mutex
	Limit      int
	TimeWindow time.Duration
	clients    map[string]*clientInfo
}

func NewLoginRateLimiter(limit int, window time.Duration) *LoginRateLimiter {
	return &LoginRateLimiter{
		Limit:      limit,
		TimeWindow: window,
		clients:    make(map[string]*clientInfo),
	}
}

func RateLimitLogin(rps float64, burst int) gin.HandlerFunc {
	// rate.NewLimiter принимает "запросов в секунду" и burst.
	limiter := rate.NewLimiter(rate.Limit(rps), burst)

	return func(c *gin.Context) {
		// Применяем лимит только к POST /api/auth/login
		if c.Request.Method == http.MethodPost && c.FullPath() == "/api/auth/login" {
			if !limiter.Allow() {
				c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
					"error": "too many login attempts",
				})
				return
			}
		}

		c.Next()
	}
}

func (l *LoginRateLimiter) allow(ip string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()

	now := time.Now()
	info, ok := l.clients[ip]
	if !ok || now.After(info.ResetTime) {
		// новое окно
		l.clients[ip] = &clientInfo{
			Count:     1,
			ResetTime: now.Add(l.TimeWindow),
		}
		return true
	}

	if info.Count >= l.Limit {
		return false
	}

	info.Count++
	return true
}

// Глобальный лимитер для логина: например, 5 попыток за 1 минуту
var loginLimiter = NewLoginRateLimiter(5, time.Minute)

// LoginRateLimit — middleware для /api/auth/login
func LoginRateLimit() gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP()
		if !loginLimiter.allow(ip) {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error": "слишком много попыток входа, попробуйте позже",
			})
			return
		}
		c.Next()
	}
}
