package flights

import (
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Handler инкапсулирует доступ к БД для рейсов.
type Handler struct {
	DB *pgxpool.Pool
}

// NewHandler создаёт новый обработчик рейсов.
func NewHandler(db *pgxpool.Pool) *Handler {
	return &Handler{DB: db}
}

// RegisterRoutes регистрирует маршруты /api/flights.
func (h *Handler) RegisterRoutes(r *gin.Engine) {
	r.GET("/api/flights", h.GetFlights)
	r.POST("/api/flights", h.CreateFlight)

	// Полное обновление рейса
	r.PUT("/api/flights/:id", h.UpdateFlight)

	// Частичное обновление только статуса
	r.PATCH("/api/flights/:id/status", h.UpdateFlightStatus)

	// Удаление рейса
	r.DELETE("/api/flights/:id", h.DeleteFlight)
}

// GET /api/flights — список рейсов.
func (h *Handler) GetFlights(c *gin.Context) {
	ctx := c.Request.Context()

	rows, err := h.DB.Query(ctx, `
        SELECT id, flight_number, departure_airport, arrival_airport,
               departure_time, arrival_time, status
        FROM flights
        ORDER BY id;
    `)
	if err != nil {
		log.Printf("query flights error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}
	defer rows.Close()

	var flights []Flight

	for rows.Next() {
		var f Flight
		if err := rows.Scan(
			&f.ID,
			&f.FlightNumber,
			&f.DepartureAirport,
			&f.ArrivalAirport,
			&f.DepartureTime,
			&f.ArrivalTime,
			&f.Status,
		); err != nil {
			log.Printf("scan flight error: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}

		// 1) длительность полёта
		f.FlightDurationMinutes = int(f.ArrivalTime.Sub(f.DepartureTime).Minutes())

		// 2) «живой» статус по времени
		now := time.Now()
		switch {
		case now.Before(f.DepartureTime):
			if f.Status != "cancelled" && f.Status != "delayed" {
				f.Status = "scheduled"
			}
		case now.After(f.DepartureTime) && now.Before(f.ArrivalTime):
			if f.Status != "cancelled" && f.Status != "delayed" {
				f.Status = "in_air"
			}
		case now.After(f.ArrivalTime):
			if f.Status != "cancelled" && f.Status != "delayed" {
				f.Status = "landed"
			}
		}

		flights = append(flights, f)
	}

	if rows.Err() != nil {
		log.Printf("rows error: %v", rows.Err())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, flights)
}

// POST /api/flights — создание нового рейса.
func (h *Handler) CreateFlight(c *gin.Context) {
	var req CreateFlightRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid json"})
		return
	}

	depTime, arrTime, err := validateFlightRequest(
		req.FlightNumber,
		req.AirlineCode,
		req.DepartureAirport,
		req.ArrivalAirport,
		req.Status,
		req.DepartureTime,
		req.ArrivalTime,
	)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := c.Request.Context()

	var newFlight Flight
	query := `
        INSERT INTO flights (
            flight_number, departure_airport, arrival_airport,
            departure_time, arrival_time, status
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, flight_number, departure_airport, arrival_airport,
                  departure_time, arrival_time, status;
    `

	err = h.DB.QueryRow(ctx, query,
		req.FlightNumber,
		req.DepartureAirport,
		req.ArrivalAirport,
		depTime,
		arrTime,
		req.Status,
	).Scan(
		&newFlight.ID,
		&newFlight.FlightNumber,
		&newFlight.DepartureAirport,
		&newFlight.ArrivalAirport,
		&newFlight.DepartureTime,
		&newFlight.ArrivalTime,
		&newFlight.Status,
	)
	newFlight.FlightDurationMinutes =
		int(newFlight.ArrivalTime.Sub(newFlight.DepartureTime).Minutes())

	if err != nil {
		log.Printf("insert flight error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}
	userID, _ := c.Get("userID")
	userRole, _ := c.Get("userRole")

	log.Printf("audit: flight_created id=%d flight_number=%s by_user=%v role=%v",
		newFlight.ID, newFlight.FlightNumber, userID, userRole)

	c.JSON(http.StatusCreated, newFlight)
}

// PUT /api/flights/:id — полное обновление рейса.
func (h *Handler) UpdateFlight(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var req UpdateFlightRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid json"})
		return
	}

	depTime, arrTime, err := validateFlightRequest(
		req.FlightNumber,
		req.AirlineCode,
		req.DepartureAirport,
		req.ArrivalAirport,
		req.Status,
		req.DepartureTime,
		req.ArrivalTime,
	)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := c.Request.Context()

	var updated Flight
	query := `
        UPDATE flights
        SET flight_number = $1,
            departure_airport = $2,
            arrival_airport = $3,
            departure_time = $4,
            arrival_time = $5,
            status = $6
        WHERE id = $7
        RETURNING id, flight_number, departure_airport, arrival_airport,
                  departure_time, arrival_time, status;
    `

	err = h.DB.QueryRow(ctx, query,
		req.FlightNumber,
		req.DepartureAirport,
		req.ArrivalAirport,
		depTime,
		arrTime,
		req.Status,
		id,
	).Scan(
		&updated.ID,
		&updated.FlightNumber,
		&updated.DepartureAirport,
		&updated.ArrivalAirport,
		&updated.DepartureTime,
		&updated.ArrivalTime,
		&updated.Status,
	)
	updated.FlightDurationMinutes =
		int(updated.ArrivalTime.Sub(updated.DepartureTime).Minutes())
	if err != nil {
		if err == pgx.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "flight not found"})
			return
		}
		log.Printf("update flight error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}
	userID, _ := c.Get("userID")
	userRole, _ := c.Get("userRole")
	log.Printf("audit: flight_updated id=%d flight_number=%s by_user=%v role=%v",
		updated.ID, updated.FlightNumber, userID, userRole)

	c.JSON(http.StatusOK, updated)
}

// PATCH /api/flights/:id/status — обновление только статуса рейса.
func (h *Handler) UpdateFlightStatus(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var req UpdateStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid json"})
		return
	}

	if err := validateStatusOnly(req.Status); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := c.Request.Context()

	var updated Flight
	query := `
        UPDATE flights
        SET status = $1
        WHERE id = $2
        RETURNING id, flight_number, departure_airport, arrival_airport,
                  departure_time, arrival_time, status;
    `

	err = h.DB.QueryRow(ctx, query, req.Status, id).Scan(
		&updated.ID,
		&updated.FlightNumber,
		&updated.DepartureAirport,
		&updated.ArrivalAirport,
		&updated.DepartureTime,
		&updated.ArrivalTime,
		&updated.Status,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "flight not found"})
			return
		}
		log.Printf("update status error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}
	userID, _ := c.Get("userID")
	userRole, _ := c.Get("userRole")
	log.Printf("audit: flight_status_changed id=%d new_status=%s by_user=%v role=%v",
		updated.ID, updated.Status, userID, userRole)
	c.JSON(http.StatusOK, updated)
}

// DELETE /api/flights/:id — удаление рейса.
func (h *Handler) DeleteFlight(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	ctx := c.Request.Context()

	cmdTag, err := h.DB.Exec(ctx, `DELETE FROM flights WHERE id = $1`, id)
	if err != nil {
		log.Printf("delete flight error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	if cmdTag.RowsAffected() == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "flight not found"})
		return
	}
	userID, _ := c.Get("userID")
	userRole, _ := c.Get("userRole")
	log.Printf("audit: flight_deleted id=%d by_user=%v role=%v", id, userID, userRole)

	c.Status(http.StatusNoContent) // 204
}
