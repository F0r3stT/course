package weather

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r *gin.Engine) {
	r.GET("/api/weather", getAllWeather)
}

// GET /api/weather?refresh=1
func getAllWeather(c *gin.Context) {
	refresh := c.Query("refresh") == "1" || strings.EqualFold(c.Query("refresh"), "true")

	data, cached, stale, warnings, err := GetWeatherAll(c.Request.Context(), refresh)

	// Даже если upstream упал — стараемся отдать cache/fallback, чтобы UI не уходил в offline.
	status := http.StatusOK
	if len(data) == 0 && err != nil {
		status = http.StatusBadGateway
	}

	c.Header("Cache-Control", "public, max-age=60") // минутный браузерный кеш
	c.JSON(status, WeatherResponse{
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Source:    "OpenWeatherMap",
		Cached:    cached,
		Stale:     stale,
		Warnings:  warnings,
		Airports:  data,
		Count:     len(data),
	})
}
