package main

import (
	"context"
	"flight_backend/internal/auth"
	"flight_backend/internal/middleware"
	"flight_backend/internal/users"
	"flight_backend/internal/weather"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	// Простая конфигурация
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://flights_user:password@localhost:5432/flights"
	}

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
	usersRepo := users.NewPostgresRepository(pool)
	authHandler := auth.NewHandler(usersRepo)
	authHandler.RegisterRoutes(r)
	// Health-check
	r.GET("/api/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "pong",
			"status":  "running",
			"time":    time.Now().UTC(),
		})
	})
	authRequired := r.Group("/api")
	authRequired.Use(middleware.AuthRequired())

	{
		// Обновление статуса рейса - только staff и admin
		// Обновление статуса рейса - только staff и admin
		authRequired.PATCH("/flights/:id/status", middleware.RequireRole("staff", "admin"), func(c *gin.Context) {
			id := c.Param("id")

			var req struct {
				Status       string `json:"status" binding:"required"`
				DelayMinutes int    `json:"delay_minutes"` // нужно только для delayed
			}

			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "invalid JSON"})
				return
			}

			ctxReq := c.Request.Context()

			// ===== 1) СТАВИМ ЗАДЕРЖКУ =====
			if req.Status == "delayed" {
				if req.DelayMinutes <= 0 {
					c.JSON(http.StatusBadRequest, gin.H{"error": "delay_minutes must be > 0 for delayed status"})
					return
				}

				// 1.1) Сначала читаем текущий статус (до UPDATE!)
				var currentStatus string
				err := pool.QueryRow(ctxReq, `SELECT status FROM flights WHERE id = $1`, id).Scan(&currentStatus)
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot fetch flight status"})
					return
				}

				// 1.2) Запрещаем задержку, если уже в воздухе/прилетел/отменён
				// Разрешаем: scheduled, boarding, delayed (чтобы можно было "добавить" задержку до вылета)
				// Разрешаем задержку ТОЛЬКО до вылета
				if currentStatus != "scheduled" && currentStatus != "boarding" {
					c.JSON(http.StatusBadRequest, gin.H{
						"error":          "нельзя поставить задержку: рейс уже в воздухе/приземлился/отменён или имеет неподходящий статус",
						"current_status": currentStatus,
					})
					return
				}

				// 1.3) Сдвигаем времена + ставим delayed
				cmd, err := pool.Exec(ctxReq, `
            UPDATE flights
            SET
              original_departure_time = COALESCE(original_departure_time, departure_time),
              original_arrival_time   = COALESCE(original_arrival_time, arrival_time),
              departure_time          = departure_time + make_interval(mins => $1),
              arrival_time            = arrival_time   + make_interval(mins => $1),
              status                  = 'delayed'
            WHERE id = $2
        `, req.DelayMinutes, id)
				if err != nil {
					log.Printf("❌ delay flight error: %v", err)
					c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
					return
				}
				if cmd.RowsAffected() == 0 {
					c.JSON(http.StatusNotFound, gin.H{"error": "flight not found"})
					return
				}

				// 1.4) Таймер снятия "delayed": после задержки статус становится обычным,
				// а времена остаются СДВИНУТЫМИ (рейс дальше идет "в своём темпе").
				delayDuration := time.Duration(req.DelayMinutes) * time.Minute
				go func(flightID string, delay time.Duration) {
					time.Sleep(delay)
					_, err := pool.Exec(context.Background(), `
                UPDATE flights
                SET status = 'scheduled',
                    original_departure_time = NULL,
                    original_arrival_time   = NULL
                WHERE id = $1 AND status = 'delayed'
            `, flightID)
					if err != nil {
						log.Printf("❌ auto undelay flight %s error: %v", flightID, err)
					} else {
						log.Printf("✅ Flight %s resumed after delay", flightID)
					}
				}(id, delayDuration)

				c.JSON(http.StatusOK, gin.H{
					"message":       "flight delayed",
					"flight_id":     id,
					"new_status":    "delayed",
					"delay_minutes": req.DelayMinutes,
				})
				return
			}

			// ===== 2) ЕСЛИ РЕЙС БЫЛ delayed И МЫ ПЕРЕВОДИМ В ДРУГОЙ СТАТУС — ВОССТАНАВЛИВАЕМ original_* =====
			cmd, err := pool.Exec(ctxReq, `
        UPDATE flights
        SET
          status = $1,
          departure_time = COALESCE(original_departure_time, departure_time),
          arrival_time   = COALESCE(original_arrival_time, arrival_time),
          original_departure_time = NULL,
          original_arrival_time   = NULL
        WHERE id = $2 AND status = 'delayed'
    `, req.Status, id)
			if err != nil {
				log.Printf("❌ undelay flight error: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
				return
			}
			if cmd.RowsAffected() > 0 {
				c.JSON(http.StatusOK, gin.H{"message": "status updated", "flight_id": id, "new_status": req.Status})
				return
			}

			// ===== 3) Обычное обновление статуса =====
			cmd, err = pool.Exec(ctxReq, `UPDATE flights SET status=$1 WHERE id=$2`, req.Status, id)
			if err != nil {
				log.Printf("❌ update flight status error: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
				return
			}
			if cmd.RowsAffected() == 0 {
				c.JSON(http.StatusNotFound, gin.H{"error": "flight not found"})
				return
			}

			c.JSON(http.StatusOK, gin.H{"message": "status updated", "flight_id": id, "new_status": req.Status})
		})

		// Создание рейса - только admin
		authRequired.POST("/flights", middleware.RequireRole("admin"), func(c *gin.Context) {
			var req struct {
				FlightNumber     string    `json:"flight_number" binding:"required"`
				AirlineCode      string    `json:"airline_code"`
				AirlineName      string    `json:"airline_name"`
				AircraftType     string    `json:"aircraft_type"`
				DepartureAirport string    `json:"departure_airport" binding:"required"`
				ArrivalAirport   string    `json:"arrival_airport" binding:"required"`
				DepartureTime    time.Time `json:"departure_time" binding:"required"`
				ArrivalTime      time.Time `json:"arrival_time" binding:"required"`
				Status           string    `json:"status" binding:"required"`
			}

			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "invalid JSON", "details": err.Error()})
				return
			}

			ctxReq := c.Request.Context()
			_, err := pool.Exec(ctxReq, `
        INSERT INTO flights 
        (flight_number, airline_code, airline_name, aircraft_type, departure_airport, arrival_airport, departure_time, arrival_time, status)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    `,
				req.FlightNumber,
				req.AirlineCode,
				req.AirlineName,
				req.AircraftType,
				req.DepartureAirport,
				req.ArrivalAirport,
				req.DepartureTime,
				req.ArrivalTime,
				req.Status,
			)
			if err != nil {
				log.Printf("❌ insert flight error: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "database insert error"})
				return
			}

			c.JSON(http.StatusCreated, gin.H{
				"message": "Flight created successfully",
				"flight":  req,
			})
		})
		// Удаление рейса - только admin
		authRequired.DELETE("/flights/:id", middleware.RequireRole("admin"), func(c *gin.Context) {
			id := c.Param("id")
			ctxReq := c.Request.Context()

			cmd, err := pool.Exec(ctxReq, `DELETE FROM flights WHERE id = $1`, id)
			if err != nil {
				log.Printf("❌ delete flight error: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "database delete error"})
				return
			}
			if cmd.RowsAffected() == 0 {
				c.JSON(http.StatusNotFound, gin.H{"error": "flight not found"})
				return
			}

			c.JSON(http.StatusOK, gin.H{
				"message":   "flight deleted",
				"flight_id": id,
			})
		})

		// Dashboard данные - только для залогиненных (любая роль)
		authRequired.GET("/dashboard/stats", func(c *gin.Context) {
			userRole, _ := c.Get("userRole")
			userID, _ := c.Get("userID")

			// Возвращаем данные в зависимости от роли
			switch userRole {
			case "admin":
				c.JSON(http.StatusOK, gin.H{
					"role":        "admin",
					"permissions": []string{"all"},
					"userId":      userID,
				})
			case "staff":
				c.JSON(http.StatusOK, gin.H{
					"role":        "staff",
					"permissions": []string{"view_flights", "update_status"},
					"userId":      userID,
				})
			case "viewer":
				c.JSON(http.StatusOK, gin.H{
					"role":        "viewer",
					"permissions": []string{"view_flights"},
					"userId":      userID,
					"message":     "Вы можете только просматривать рейсы",
				})
			default:
				c.JSON(http.StatusForbidden, gin.H{
					"error": "Неизвестная роль",
				})
			}
		})
	}
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
			if f.Status != "delayed" && f.Status != "cancelled" {
				if now.After(f.ArrivalTime) {
					f.Status = "landed"
				} else if now.After(f.DepartureTime) {
					f.Status = "in_air"
				} else {
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
	r.GET("/api/flights/popular", func(c *gin.Context) {
		ctxReq := c.Request.Context()

		// top 4 популярных направлений по количеству рейсов
		rows, err := pool.Query(ctxReq, `
    WITH routes AS (
      SELECT
        departure_airport,
        arrival_airport,
        COUNT(*) AS flights_count,
        MAX(departure_time) AS last_departure_time
      FROM flights
      WHERE
        departure_airport IS NOT NULL AND departure_airport <> ''
        AND arrival_airport   IS NOT NULL AND arrival_airport   <> ''
        AND departure_airport <> arrival_airport
        AND departure_time IS NOT NULL AND arrival_time IS NOT NULL
      GROUP BY departure_airport, arrival_airport
    )
    SELECT
      f.id, f.flight_number,
      COALESCE(f.airline_code,''), COALESCE(f.airline_name,''),
      COALESCE(f.aircraft_type,''),
      f.departure_airport, f.arrival_airport,
      f.departure_time, f.arrival_time,
(
  CASE
    WHEN f.arrival_time >= f.departure_time
      THEN EXTRACT(EPOCH FROM (f.arrival_time - f.departure_time))
    ELSE
      EXTRACT(EPOCH FROM ((f.arrival_time + interval '1 day') - f.departure_time))
  END / 60
)::int AS flight_duration_minutes,
f.status,
r.flights_count

    FROM routes r
    JOIN flights f
      ON f.departure_airport = r.departure_airport
     AND f.arrival_airport   = r.arrival_airport
     AND f.departure_time    = r.last_departure_time
    ORDER BY r.flights_count DESC
    LIMIT 4;
  `)
		if err != nil {
			c.JSON(500, gin.H{"error": "database error"})
			return
		}
		defer rows.Close()

		type PopularFlight struct {
			ID                    int       `json:"id"`
			FlightNumber          string    `json:"flight_number"`
			AirlineCode           string    `json:"airline_code"`
			AirlineName           string    `json:"airline_name"`
			AircraftType          string    `json:"aircraft_type"`
			DepartureAirport      string    `json:"departure_airport"`
			ArrivalAirport        string    `json:"arrival_airport"`
			DepartureTime         time.Time `json:"departure_time"`
			ArrivalTime           time.Time `json:"arrival_time"`
			FlightDurationMinutes int       `json:"flight_duration_minutes"`
			Status                string    `json:"status"`
			FlightsCount          int       `json:"flights_count"`
		}

		var out []PopularFlight
		for rows.Next() {
			var f PopularFlight
			if err := rows.Scan(
				&f.ID, &f.FlightNumber,
				&f.AirlineCode, &f.AirlineName,
				&f.AircraftType,
				&f.DepartureAirport, &f.ArrivalAirport,
				&f.DepartureTime, &f.ArrivalTime,
				&f.FlightDurationMinutes,
				&f.Status,
				&f.FlightsCount,
			); err == nil {
				out = append(out, f)
			}
		}
		c.JSON(200, out)
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

	// Простой login (mock)
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

	// 1.1) На существующей flights добавим колонки для delay/undelay (если их ещё нет)
	_, err = pool.Exec(ctx, `
		ALTER TABLE flights
			ADD COLUMN IF NOT EXISTS original_departure_time TIMESTAMPTZ,
			ADD COLUMN IF NOT EXISTS original_arrival_time   TIMESTAMPTZ
	`)
	if err != nil {
		log.Printf("❌ alterFlightsTable error: %v", err)
		return
	}
	log.Printf("✅ Table 'flights' is ready")

	// 2) Таблица users
	_, err = pool.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS users (
			id BIGSERIAL PRIMARY KEY,
			username TEXT NOT NULL UNIQUE,
			password_hash TEXT NOT NULL,
			email TEXT,
			full_name TEXT,
			role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer','staff','admin')),
			is_active BOOLEAN NOT NULL DEFAULT true,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			last_login TIMESTAMPTZ
		)
	`)
	if err != nil {
		log.Printf("❌ createUsersTable error: %v", err)
		return
	}
	log.Printf("✅ Table 'users' is ready")
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
