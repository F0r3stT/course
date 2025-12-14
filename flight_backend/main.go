package main

import (
	"context"
	"flight_backend/internal/middleware"
	"flight_backend/internal/weather"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

func main() {
	// Простая конфигурация
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://flights_user:password@localhost:5432/flights"
	}
	_ = godotenv.Load()

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Fatalf("❌ Failed to connect to database: %v", err)
	}
	defer pool.Close()

	// Проверка соединения
	if err := pool.Ping(ctx); err != nil {
		log.Fatalf("❌ Database ping failed: %v", err)
	}
	log.Println("✅ Database connected successfully")

	// Создаем таблицы если их нет
	createTables(ctx, pool)

	// Настройка Gin
	r := gin.Default()

	// Добавляем middleware безопасности
	r.Use(middleware.SecurityHeaders())
	r.Use(middleware.RequestThrottle(100, time.Minute)) // 100 запросов в минуту

	// Настройка CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{"http://localhost:5173", "http://localhost:3000", "https://flightsboard.ru",
			"https://www.flightsboard.ru"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "Accept", "Cache-Control"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))
	weather.RegisterRoutes(r)
	// ===== ПУБЛИЧНЫЕ МАРШРУТЫ =====

	// Health-check
	r.GET("/api/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "pong",
			"status":  "running",
			"time":    time.Now().UTC(),
		})
	})

	// Все рейсы
	r.GET("/api/flights", func(c *gin.Context) {
		ctxReq := c.Request.Context()

		rows, err := pool.Query(ctxReq, `
        SELECT
            id,
            flight_number,
            COALESCE(airline_code, ''),
            COALESCE(airline_name, ''),
            COALESCE(aircraft_type, ''),
            departure_airport,
            arrival_airport,
            departure_time,
            arrival_time,
            status
        FROM flights
        ORDER BY departure_time
    `)
		if err != nil {
			log.Printf("❌ Flights query error: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
			return
		}
		defer rows.Close()

		type Flight struct {
			ID                    int       `json:"id"`
			FlightNumber          string    `json:"flight_number"`
			AirlineCode           string    `json:"airline_code"`
			AirlineName           string    `json:"airline_name"`
			AircraftType          string    `json:"aircraft_type"`
			DepartureAirport      string    `json:"departure_airport"`
			ArrivalAirport        string    `json:"arrival_airport"`
			DepartureTime         time.Time `json:"departure_time"`
			ArrivalTime           time.Time `json:"arrival_time"`
			Status                string    `json:"status"`
			FlightDurationMinutes int       `json:"flight_duration_minutes"`
		}
		now := time.Now().UTC()
		var flights []Flight
		for rows.Next() {
			var f Flight
			if err := rows.Scan(
				&f.ID,
				&f.FlightNumber,
				&f.AirlineCode,
				&f.AirlineName,
				&f.AircraftType,
				&f.DepartureAirport,
				&f.ArrivalAirport,
				&f.DepartureTime,
				&f.ArrivalTime,
				&f.Status,
			); err != nil {
				log.Printf("❌ scan flight error: %v", err)
				continue
			}
			if f.Status == "scheduled" || f.Status == "in_air" || f.Status == "landed" || f.Status == "delayed" {
				if now.After(f.ArrivalTime) {
					f.Status = "landed"
				} else if now.After(f.DepartureTime) {
					f.Status = "in_air"
				} else if f.Status != "delayed" {
					f.Status = "scheduled"
				}
			}
			// длительность в минутах
			duration := int(f.ArrivalTime.Sub(f.DepartureTime).Minutes())
			if duration < 0 {
				duration = 0
			}
			f.FlightDurationMinutes = duration
			flights = append(flights, f)
		}

		c.JSON(http.StatusOK, flights)
	})

	// Список авиакомпаний
	r.GET("/api/airlines", func(c *gin.Context) {
		ctxReq := c.Request.Context()

		rows, err := pool.Query(ctxReq, `
			SELECT DISTINCT airline_code, airline_name 
			FROM flights 
			WHERE airline_code IS NOT NULL 
			ORDER BY airline_code
		`)
		if err != nil {
			log.Printf("❌ Airlines query error: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
			return
		}
		defer rows.Close()

		var airlines []map[string]string
		for rows.Next() {
			var code, name string
			if err := rows.Scan(&code, &name); err != nil {
				continue
			}
			airlines = append(airlines, map[string]string{
				"code": code,
				"name": name,
			})
		}

		// Если нет данных, возвращаем тестовые
		if len(airlines) == 0 {
			airlines = []map[string]string{
				{"code": "SU", "name": "Аэрофлот"},
				{"code": "S7", "name": "S7 Airlines"},
				{"code": "U6", "name": "Уральские авиалинии"},
				{"code": "TK", "name": "Turkish Airlines"},
				{"code": "LH", "name": "Lufthansa"},
			}
		}

		c.JSON(http.StatusOK, airlines)
	})

	// Рейсы конкретной авиакомпании
	r.GET("/api/airlines/:code/flights", func(c *gin.Context) {
		code := c.Param("code")
		ctxReq := c.Request.Context()

		rows, err := pool.Query(ctxReq, `
			SELECT 
				id,
				flight_number,
				COALESCE(airline_code, ''),
				COALESCE(airline_name, ''),
				departure_airport,
				arrival_airport,
				departure_time,
				arrival_time,
				status
			FROM flights
			WHERE airline_code = $1
			ORDER BY departure_time
		`, code)
		if err != nil {
			log.Printf("❌ Airline flights query error: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
			return
		}
		defer rows.Close()

		var flights []map[string]interface{}
		var count int
		for rows.Next() {
			var (
				id               int64
				flightNumber     string
				airlineCode      string
				airlineName      string
				departureAirport string
				arrivalAirport   string
				departureTime    time.Time
				arrivalTime      time.Time
				status           string
			)

			if err := rows.Scan(
				&id, &flightNumber, &airlineCode, &airlineName,
				&departureAirport, &arrivalAirport,
				&departureTime, &arrivalTime, &status,
			); err != nil {
				continue
			}

			flight := map[string]interface{}{
				"id":                      id,
				"flight_number":           flightNumber,
				"airline_code":            airlineCode,
				"airline_name":            airlineName,
				"departure_airport":       departureAirport,
				"arrival_airport":         arrivalAirport,
				"departure_time":          departureTime.Format(time.RFC3339),
				"arrival_time":            arrivalTime.Format(time.RFC3339),
				"status":                  status,
				"flight_duration_minutes": int(arrivalTime.Sub(departureTime).Minutes()),
			}
			flights = append(flights, flight)
			count++
		}

		c.JSON(http.StatusOK, gin.H{
			"airline": code,
			"flights": flights,
			"count":   count,
		})
	})

	// Статистика
	r.GET("/api/stats", func(c *gin.Context) {
		ctxReq := c.Request.Context()

		var totalFlights int
		err := pool.QueryRow(ctxReq, "SELECT COUNT(*) FROM flights").Scan(&totalFlights)
		if err != nil {
			totalFlights = 1256
		}

		var totalAirlines int
		err = pool.QueryRow(ctxReq, "SELECT COUNT(DISTINCT airline_code) FROM flights").Scan(&totalAirlines)
		if err != nil {
			totalAirlines = 8
		}

		c.JSON(http.StatusOK, gin.H{
			"total_flights":  totalFlights,
			"active_flights": 89,
			"total_airlines": totalAirlines,
			"system_status":  "operational",
			"last_updated":   time.Now().UTC(),
		})
	})

	// Обновление статуса рейса (ВАЖНО: ДО r.Run)
	r.PATCH("/api/flights/:id/status", func(c *gin.Context) {
		idStr := c.Param("id")
		id, err := strconv.Atoi(idStr)
		if err != nil || id <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid flight id"})
			return
		}

		var req struct {
			Status       string `json:"status"`
			DelayMinutes int    `json:"delay_minutes"`
		}

		if err := c.ShouldBindJSON(&req); err != nil || req.Status == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid json or empty status"})
			return
		}

		switch req.Status {
		case "scheduled", "boarding", "in_air", "landed", "delayed", "cancelled":
			// допустимый статус
		default:
			c.JSON(http.StatusBadRequest, gin.H{"error": "unsupported status"})
			return
		}

		ctxReq := c.Request.Context()

		if req.Status == "delayed" && req.DelayMinutes > 0 {
			// Сдвигаем время вылета и прилёта на указанное количество минут
			cmdTag, err := pool.Exec(ctxReq, `
            UPDATE flights
        SET 
            status = $1,
            original_departure_time = COALESCE(original_departure_time, departure_time),
            original_arrival_time   = COALESCE(original_arrival_time, arrival_time),
            departure_time = departure_time + make_interval(mins => $2),
            arrival_time   = arrival_time   + make_interval(mins => $2)
        WHERE id = $3
        `, req.Status, req.DelayMinutes, id)
			if err != nil {
				log.Printf("❌ update flight status (delay) error: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
				return
			}
			if cmdTag.RowsAffected() == 0 {
				c.JSON(http.StatusNotFound, gin.H{"error": "flight not found"})
				return
			}
		} else {
			// Обычное обновление статуса без сдвига времени
			cmdTag, err := pool.Exec(ctxReq, `
        UPDATE flights
        SET 
            status = $1,
            departure_time = COALESCE(original_departure_time, departure_time),
            arrival_time   = COALESCE(original_arrival_time, arrival_time),
            original_departure_time = NULL,
            original_arrival_time   = NULL
        WHERE id = $2
    `,
				req.Status, id,
			)
			if err != nil {
				log.Printf("❌ update flight status error: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
				return
			}
			if cmdTag.RowsAffected() == 0 {
				c.JSON(http.StatusNotFound, gin.H{"error": "flight not found"})
				return
			}
		}

		c.JSON(http.StatusOK, gin.H{
			"id":            id,
			"status":        req.Status,
			"delay_minutes": req.DelayMinutes,
		})
	})
	// Создание рейса
	r.POST("/api/flights", func(c *gin.Context) {
		var req struct {
			FlightNumber     string `json:"flight_number"`
			AirlineCode      string `json:"airline_code"`
			AirlineName      string `json:"airline_name"`
			AircraftType     string `json:"aircraft_type"`
			DepartureAirport string `json:"departure_airport"`
			ArrivalAirport   string `json:"arrival_airport"`
			DepartureTime    string `json:"departure_time"`
			ArrivalTime      string `json:"arrival_time"`
			Status           string `json:"status"`
		}

		// 1) Читаем JSON из запроса
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid json"})
			return
		}

		// 2) Простая валидация
		if req.FlightNumber == "" || req.DepartureAirport == "" || req.ArrivalAirport == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "missing required fields"})
			return
		}
		if req.Status == "" {
			req.Status = "scheduled"
		}

		// 3) Парсим время в time.Time
		depTime, err1 := time.Parse(time.RFC3339, req.DepartureTime)
		arrTime, err2 := time.Parse(time.RFC3339, req.ArrivalTime)
		if err1 != nil || err2 != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid datetime format (must be RFC3339)"})
			return
		}

		// 4) Пишем в базу. ВАЖНО: NULLIF($2, '') чтобы "" -> NULL и не ломал внешний ключ
		ctxReq := c.Request.Context()
		var newID int64

		err := pool.QueryRow(ctxReq, `
				INSERT INTO flights (
					flight_number, airline_code, airline_name, aircraft_type,
					departure_airport, arrival_airport,
					departure_time, arrival_time, status
				)
				VALUES (
					$1,
					NULLIF($2, ''),  -- "" -> NULL, не конфликтует с FK
					$3,
					$4,
					$5,
					$6,
					$7,
					$8,
					$9
				)
				RETURNING id
			`,
			req.FlightNumber,
			req.AirlineCode,
			req.AirlineName,
			req.AircraftType,
			req.DepartureAirport,
			req.ArrivalAirport,
			depTime,
			arrTime,
			req.Status,
		).Scan(&newID)

		if err != nil {
			log.Printf("❌ Insert flight error: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
			return
		}

		// 5) Возвращаем ответ
		c.JSON(http.StatusCreated, gin.H{
			"id":     newID,
			"status": "created",
		})
	})

	// Простой login (mock)
	r.POST("/api/auth/login", func(c *gin.Context) {
		var req struct {
			Username string `json:"username"`
			Password string `json:"password"`
		}

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid json"})
			return
		}

		if req.Username == "admin" && req.Password == "admin123" {
			c.JSON(http.StatusOK, gin.H{
				"token": "mock-jwt-token-for-admin",
				"user": gin.H{
					"id":       1,
					"username": "admin",
					"role":     "admin",
				},
			})
		} else if req.Username == "staff" && req.Password == "staff123" {
			c.JSON(http.StatusOK, gin.H{
				"token": "mock-jwt-token-for-staff",
				"user": gin.H{
					"id":       2,
					"username": "staff",
					"role":     "staff",
				},
			})
		} else {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		}
	})

	// ===== ЗАПУСК СЕРВЕРА =====
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 Server starting on :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("❌ Failed to start server: %v", err)
	}

	// Добавить в main.go или создать отдельный handler
	r.GET("/api/airlines/detailed", func(c *gin.Context) {
		ctxReq := c.Request.Context()

		rows, err := pool.Query(ctxReq, `
		SELECT 
			airline_code,
			airline_name,
			COUNT(*) as flight_count,
			COUNT(CASE WHEN status = 'in_air' THEN 1 END) as in_air_count,
			COUNT(CASE WHEN status = 'delayed' THEN 1 END) as delayed_count,
			MIN(departure_time) as earliest_flight,
			MAX(arrival_time) as latest_flight
		FROM flights
		WHERE airline_code IS NOT NULL
		GROUP BY airline_code, airline_name
		ORDER BY flight_count DESC
	`)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
			return
		}
		defer rows.Close()

		var airlines []map[string]interface{}
		for rows.Next() {
			var (
				code           string
				name           string
				flightCount    int
				inAirCount     int
				delayedCount   int
				earliestFlight *time.Time
				latestFlight   *time.Time
			)

			if err := rows.Scan(&code, &name, &flightCount, &inAirCount,
				&delayedCount, &earliestFlight, &latestFlight); err != nil {
				continue
			}

			airline := map[string]interface{}{
				"code":            code,
				"name":            name,
				"flight_count":    flightCount,
				"in_air_count":    inAirCount,
				"delayed_count":   delayedCount,
				"success_rate":    float64(flightCount-delayedCount) / float64(flightCount) * 100,
				"earliest_flight": earliestFlight,
				"latest_flight":   latestFlight,
			}

			airlines = append(airlines, airline)
		}

		c.JSON(http.StatusOK, airlines)
	})

}
func createTables(ctx context.Context, pool *pgxpool.Pool) {
	// 1. Создаём таблицу flights при необходимости
	_, err := pool.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS flights (
			id BIGSERIAL PRIMARY KEY,
			flight_number      VARCHAR(10) NOT NULL,
			airline_code       VARCHAR(2),
			airline_name       TEXT,
			aircraft_type      TEXT,
			departure_airport  CHAR(3) NOT NULL,
			arrival_airport    CHAR(3) NOT NULL,
			departure_time     TIMESTAMPTZ NOT NULL,
			arrival_time       TIMESTAMPTZ NOT NULL,
			status             TEXT NOT NULL CHECK (
				status IN ('scheduled','boarding','in_air','landed','delayed','cancelled')
			)
		)
	`)
	if err != nil {
		log.Printf("❌ createFlightsTable error: %v", err)
		return
	}
	log.Printf("✅ Table 'flights' is ready")

	// 2. Если в таблице нет данных — добавляем тестовые рейсы
	var count int
	if err := pool.QueryRow(ctx, `SELECT COUNT(*) FROM flights`).Scan(&count); err != nil {
		log.Printf("❌ count flights error: %v", err)
		return
	}

	if count > 0 {
		log.Printf("ℹ flights table already has %d rows, skip seed", count)
		return
	}

	now := time.Now().UTC()

	// Примеры рейсов (как на фронте)
	type seed struct {
		flightNumber   string
		airlineCode    string
		airlineName    string
		aircraftType   string
		depAirport     string
		arrAirport     string
		depOffsetHours int
		arrOffsetHours int
		status         string
	}

	seeds := []seed{
		{
			flightNumber:   "56823",
			airlineCode:    "SU",
			airlineName:    "Аэрофлот",
			aircraftType:   "A320",
			depAirport:     "DME",
			arrAirport:     "VKO",
			depOffsetHours: -1,
			arrOffsetHours: 0,
			status:         "scheduled",
		},
		{
			flightNumber:   "5324",
			airlineCode:    "S7",
			airlineName:    "S7 Airlines",
			aircraftType:   "B737",
			depAirport:     "SVO",
			arrAirport:     "TOM",
			depOffsetHours: -2,
			arrOffsetHours: 3,
			status:         "scheduled",
		},
		{
			flightNumber:   "4342",
			airlineCode:    "U6",
			airlineName:    "Уральские авиалинии",
			aircraftType:   "A321",
			depAirport:     "SVO",
			arrAirport:     "TOM",
			depOffsetHours: -3,
			arrOffsetHours: 2,
			status:         "delayed",
		},
	}

	for _, s := range seeds {
		depTime := now.Add(time.Duration(s.depOffsetHours) * time.Hour)
		arrTime := now.Add(time.Duration(s.arrOffsetHours) * time.Hour)

		_, err := pool.Exec(ctx, `
			INSERT INTO flights (
				flight_number, airline_code, airline_name, aircraft_type,
				departure_airport, arrival_airport,
				departure_time, arrival_time, status
			)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
		`,
			s.flightNumber,
			s.airlineCode,
			s.airlineName,
			s.aircraftType,
			s.depAirport,
			s.arrAirport,
			depTime,
			arrTime,
			s.status,
		)
		if err != nil {
			log.Printf("❌ insert seed flight %s error: %v", s.flightNumber, err)
		}
	}

	log.Printf("✅ Seeded %d flights", len(seeds))

}
