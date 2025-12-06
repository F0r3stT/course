package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"flight_backend/internal/auth"
	"flight_backend/internal/db"
	"flight_backend/internal/flights"
	"flight_backend/internal/middleware"
	"flight_backend/internal/users" // <-- добавь импорт

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	ctx := context.Background()

	connString := "postgres://flights_user:strong_password@localhost:5432/flights_db?sslmode=disable"

	pool, err := db.Connect(ctx, connString)
	if err != nil {
		log.Fatalf("failed to connect to db: %v", err)
	}
	defer pool.Close()

	r := gin.Default()
	// Не доверяем случайным прокси
	if err := r.SetTrustedProxies(nil); err != nil {
		log.Fatalf("failed to set trusted proxies: %v", err)
	}

	frontendOrigin := os.Getenv("FRONTEND_ORIGIN")
	if frontendOrigin == "" {
		frontendOrigin = "http://localhost:5173"
	}

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{frontendOrigin},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// healthcheck
	r.GET("/api/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "pong"})
	})

	// === USERS REPO для авторизации ===
	usersRepo := users.NewPGRepository(pool) // <-- ВАЖНО: создаём репозиторий

	// === AUTH ===
	authHandler := auth.NewHandler(usersRepo)
	authGroup := r.Group("/api/auth")
	authGroup.POST("/login", middleware.LoginRateLimit(), authHandler.Login)

	// === FLIGHTS ===
	flightsHandler := flights.NewHandler(pool)

	// публичное табло
	r.GET("/api/flights", flightsHandler.GetFlights)

	// защищённые маршруты
	api := r.Group("/api")
	api.Use(middleware.AuthRequired())

	flightsGroup := api.Group("/flights")
	flightsGroup.POST("", middleware.RequireRole("admin", "staff"), flightsHandler.CreateFlight)
	flightsGroup.PUT("/:id", middleware.RequireRole("admin", "staff"), flightsHandler.UpdateFlight)
	flightsGroup.PATCH("/:id/status", middleware.RequireRole("admin", "staff"), flightsHandler.UpdateFlightStatus)
	flightsGroup.DELETE("/:id", middleware.RequireRole("admin", "staff"), flightsHandler.DeleteFlight)

	if err := r.Run(":8080"); err != nil {
		log.Fatalf("failed to run server: %v", err)
	}
}
