package main

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"flight_backend/config"
	"flight_backend/internal/auth"
	"flight_backend/internal/db"
	"flight_backend/internal/flights"
	"flight_backend/internal/logger"
	"flight_backend/internal/middleware"
	"flight_backend/internal/users"
)

func main() {
	_ = godotenv.Load() // загружаем .env, если есть
	cfg := config.Load()
	logger.Init(cfg.Env)

	logger.Log.Info("starting server", "env", cfg.Env)

	// 2. Подключение к БД
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	pool, err := db.Connect(ctx, cfg.DBURL)
	if err != nil {
		logger.Log.Error("failed to connect to db", "error", err)
		log.Fatal(err)
	}
	defer pool.Close()

	// 3. Users: репозиторий + сервис
	userRepo := users.NewPostgresRepository(pool) // добавим ниже
	userService := users.NewService(userRepo)     // добавим ниже

	// 4. Auth handler
	// auth.NewHandler уже ожидает users.Repository, поэтому передаём только сервис.
	authHandler := auth.NewHandler(userService)

	// 5. Flights handler
	// Предполагаем, что у тебя уже есть конструктор, который принимает *pgxpool.Pool.
	// Если он другой — просто скорректируй эту строку.
	flightsHandler := flights.NewHandler(pool)

	// 6. Настройка Gin
	r := gin.New()
	r.Use(
		gin.Logger(),
		gin.Recovery(), // базовый panic-recovery
		middleware.RequestID(),
	)

	// 7. CORS
	corsConfig := cors.Config{
		AllowOrigins:     []string{cfg.AllowedOrigin},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"X-Request-ID"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}
	r.Use(cors.New(corsConfig))

	// 8. Публичные маршруты
	api := r.Group("/api")
	{
		api.GET("/ping", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "pong"})
		})

		// Публичный логин
		api.POST("/auth/login",
			middleware.RateLimitLogin(cfg.LoginRateRPS, cfg.LoginBurst),
			authHandler.Login,
		)

		// ПУБЛИЧНОЕ чтение списка рейсов (табло для посетителей)
		api.GET("/flights", flightsHandler.GetFlights)
	}

	// Защищённые маршруты (только с JWT)
	protected := api.Group("/")
	protected.Use(middleware.AuthRequired())
	{
		flightsGroup := protected.Group("/flights")
		{
			// Создание/обновление/удаление — только для staff/admin
			flightsGroup.POST("", middleware.RequireRole("admin", "staff"), flightsHandler.CreateFlight)
			flightsGroup.PUT("/:id", middleware.RequireRole("admin", "staff"), flightsHandler.UpdateFlight)
			flightsGroup.PATCH("/:id/status", middleware.RequireRole("admin", "staff"), flightsHandler.UpdateFlightStatus)
			flightsGroup.DELETE("/:id", middleware.RequireRole("admin"), flightsHandler.DeleteFlight)
		}
	}

	// 9. Защищённые маршруты

	addr := ":8080"
	logger.Log.Info("server listening", "addr", addr)

	if err := r.Run(addr); err != nil {
		logger.Log.Error("server stopped with error", "error", err)
	}
}
