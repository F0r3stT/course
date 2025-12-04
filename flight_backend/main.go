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
	"flight_backend/internal/users"

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

	// AUTH
	usersRepo := users.NewPGRepository(pool)
	authHandler := auth.NewHandler(usersRepo)
	authHandler.RegisterRoutes(r)

	// FLIGHTS
	flightsHandler := flights.NewHandler(pool)

	// Публичный просмотр
	r.GET("/api/flights", flightsHandler.GetFlights)

	// Авторизованные операции
	authRequired := r.Group("/", middleware.AuthRequired())
	{
		authRequired.POST("/api/flights", flightsHandler.CreateFlight)
		authRequired.PUT("/api/flights/:id", flightsHandler.UpdateFlight)
		authRequired.PATCH("/api/flights/:id/status", flightsHandler.UpdateFlightStatus)
	}

	// Только admin может удалять рейсы
	adminOnly := r.Group("/", middleware.AuthRequired(), middleware.AdminOnly())
	{
		adminOnly.DELETE("/api/flights/:id", flightsHandler.DeleteFlight)
	}

	if err := r.Run(":8080"); err != nil {
		log.Fatalf("failed to run server: %v", err)
	}
}
