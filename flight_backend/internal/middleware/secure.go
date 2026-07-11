// internal/middleware/security.go
package middleware

import (
	"crypto/rand"
	"encoding/base64"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

func SecurityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("X-Content-Type-Options", "nosniff")
		c.Writer.Header().Set("X-Frame-Options", "DENY")
		c.Writer.Header().Set("X-XSS-Protection", "1; mode=block")
		c.Writer.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		c.Writer.Header().Set("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'")
		c.Writer.Header().Set("Permissions-Policy", "geolocation=(), microphone=(), camera=()")

		c.Next()
	}
}

var (
	requestCounters = make(map[string]int)
	requestMu       sync.Mutex
)

func GenerateNonce() (string, error) {
	nonce := make([]byte, 16)
	if _, err := rand.Read(nonce); err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString(nonce), nil
}

func RequestThrottle(maxRequests int, window time.Duration) gin.HandlerFunc {
	type requestInfo struct {
		count     int
		resetTime time.Time
	}

	//общая карта и мьютекс для всех запросов
	var (
		mu       sync.Mutex
		requests = make(map[string]*requestInfo)
	)

	return func(c *gin.Context) {
		ip := c.ClientIP()
		now := time.Now()

		mu.Lock()
		info, exists := requests[ip]
		if !exists || now.After(info.resetTime) {
			info = &requestInfo{
				count:     1,
				resetTime: now.Add(window),
			}
			requests[ip] = info
		} else {
			info.count++
		}

		currentCount := info.count
		mu.Unlock()

		if currentCount > maxRequests {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error": "Слишком много запросов",
			})
			return
		}

		c.Next()
	}
}
