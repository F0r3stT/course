package flights

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Handler struct {
	DB *pgxpool.Pool
}

func NewHandler(db *pgxpool.Pool) *Handler {
	return &Handler{DB: db}
}

type Airline struct {
	Code      string `json:"code"`
	Name      string `json:"name"`
	Country   string `json:"country"`
	FleetSize int    `json:"fleet_size"`
}

func (h *Handler) GetAirlines(c *gin.Context) {
	ctx := c.Request.Context()

	rows, err := h.DB.Query(ctx, `
		SELECT DISTINCT airline_code, airline_name 
		FROM flights 
		WHERE airline_code IS NOT NULL 
		ORDER BY airline_code
	`)
	if err != nil {
		log.Printf("query airlines error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}
	defer rows.Close()

	var airlines []Airline
	for rows.Next() {
		var code, name string
		if err := rows.Scan(&code, &name); err != nil {
			log.Printf("scan airline error: %v", err)
			continue
		}
		airlines = append(airlines, Airline{
			Code: code,
			Name: name,
		})
	}

	c.JSON(http.StatusOK, airlines)
}

func (h *Handler) GetAirlineFlights(c *gin.Context) {
	airlineCode := c.Param("code")
	ctx := c.Request.Context()

	rows, err := h.DB.Query(ctx, `
		SELECT id, flight_number, departure_airport, arrival_airport,
			   departure_time, arrival_time, status, airline_code
		FROM flights 
		WHERE airline_code = $1
		ORDER BY departure_time
	`, airlineCode)

	if err != nil {
		log.Printf("query airline flights error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}
	defer rows.Close()

	flights, err := scanFlights(rows)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"airline": airlineCode,
		"flights": flights,
		"count":   len(flights),
	})
}

func scanFlights(rows pgx.Rows) ([]Flight, error) {
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
			&f.AirlineCode,
		); err != nil {
			return nil, err
		}
		f.FlightDurationMinutes = int(f.ArrivalTime.Sub(f.DepartureTime).Minutes())
		flights = append(flights, f)
	}
	return flights, nil
}

// GET /api/airlines/stats - статистика по авиакомпаниям
func (h *Handler) GetAirlinesStats(c *gin.Context) {
	ctx := c.Request.Context()

	rows, err := h.DB.Query(ctx, `
		SELECT 
			airline_code,
			COUNT(*) as total_flights,
			COUNT(CASE WHEN status = 'in_air' THEN 1 END) as in_air,
			COUNT(CASE WHEN status = 'delayed' THEN 1 END) as delayed,
			COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled
		FROM flights 
		WHERE airline_code IS NOT NULL
		GROUP BY airline_code
		ORDER BY total_flights DESC
	`)

	if err != nil {
		log.Printf("query airlines stats error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}
	defer rows.Close()

	var stats []gin.H
	for rows.Next() {
		var code string
		var total, inAir, delayed, cancelled int
		if err := rows.Scan(&code, &total, &inAir, &delayed, &cancelled); err != nil {
			log.Printf("scan stats error: %v", err)
			continue
		}
		stats = append(stats, gin.H{
			"airline_code":  code,
			"total_flights": total,
			"in_air":        inAir,
			"delayed":       delayed,
			"cancelled":     cancelled,
		})
	}

	c.JSON(http.StatusOK, stats)
}
