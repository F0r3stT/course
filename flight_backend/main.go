package main

import (
	"context"
	"log"
	"net/http"
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

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
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
	userRepo := users.NewPGRepository(pool) // <-- ВАЖНО: создаём репозиторий

	// === AUTH ===
	authHandler := auth.NewHandler(userRepo) // <-- сюда передаём не pool, а userRepo
	r.POST("/api/auth/login", authHandler.Login)

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
