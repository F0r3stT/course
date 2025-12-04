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

// Flight — модель рейса для ответов.
type Flight struct {
	ID               int       `json:"id"`
	FlightNumber     string    `json:"flight_number"`
	DepartureAirport string    `json:"departure_airport"`
	ArrivalAirport   string    `json:"arrival_airport"`
	DepartureTime    time.Time `json:"departure_time"`
	ArrivalTime      time.Time `json:"arrival_time"`
	Status           string    `json:"status"`
}

// UpdateStatusRequest — входные данные для частичного обновления статуса рейса.
type UpdateStatusRequest struct {
	Status string `json:"status"`
}

// CreateFlightRequest — входные данные для создания рейса.
type CreateFlightRequest struct {
	FlightNumber     string `json:"flight_number"`
	DepartureAirport string `json:"departure_airport"`
	ArrivalAirport   string `json:"arrival_airport"`
	DepartureTime    string `json:"departure_time"` // ISO строка, например "2025-12-04T10:00:00Z"
	ArrivalTime      string `json:"arrival_time"`
	Status           string `json:"status"`
}

// UpdateFlightRequest — входные данные для обновления рейса (пока полное обновление).
type UpdateFlightRequest struct {
	FlightNumber     string `json:"flight_number"`
	DepartureAirport string `json:"departure_airport"`
	ArrivalAirport   string `json:"arrival_airport"`
	DepartureTime    string `json:"departure_time"`
	ArrivalTime      string `json:"arrival_time"`
	Status           string `json:"status"`
}

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

	if !validateFlightInput(req.FlightNumber, req.DepartureAirport, req.ArrivalAirport, req.Status, req.DepartureTime, req.ArrivalTime) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input data"})
		return
	}

	depTime, arrTime, err := parseTimes(req.DepartureTime, req.ArrivalTime)
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
	if err != nil {
		log.Printf("insert flight error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusCreated, newFlight)
}

// PUT/PATCH /api/flights/:id — обновление рейса (полное).
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

	if !validateFlightInput(req.FlightNumber, req.DepartureAirport, req.ArrivalAirport, req.Status, req.DepartureTime, req.ArrivalTime) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input data"})
		return
	}

	depTime, arrTime, err := parseTimes(req.DepartureTime, req.ArrivalTime)
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
	if err != nil {
		if err == pgx.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "flight not found"})
			return
		}
		log.Printf("update flight error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

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

	if req.Status == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "status is required"})
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

	// Успешное удаление, без тела
	c.Status(http.StatusNoContent) // 204
}

// validateFlightInput — простая валидация входных данных.
func validateFlightInput(flightNumber, depAirport, arrAirport, status, depTime, arrTime string) bool {
	if flightNumber == "" || status == "" || depTime == "" || arrTime == "" {
		return false
	}
	if len(depAirport) != 3 || len(arrAirport) != 3 {
		return false
	}
	return true
}

// parseTimes — парсинг времени вылета/прилёта из строк в RFC3339.
func parseTimes(depStr, arrStr string) (time.Time, time.Time, error) {
	depTime, err := time.Parse(time.RFC3339, depStr)
	if err != nil {
		return time.Time{}, time.Time{}, err
	}
	arrTime, err := time.Parse(time.RFC3339, arrStr)
	if err != nil {
		return time.Time{}, time.Time{}, err
	}
	return depTime, arrTime, nil
}
