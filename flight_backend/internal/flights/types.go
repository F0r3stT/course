package flights

import "time"

// допустимые статусы рейса — синхронизированы с CHECK в БД
var allowedStatuses = map[string]struct{}{
	"scheduled": {},
	"boarding":  {},
	"delayed":   {},
	"cancelled": {},
	"in_air":    {},
	"landed":    {},
}

// Flight — модель рейса для ответов (то, что отдаём на фронт).
type Flight struct {
	ID               int       `json:"id"`
	FlightNumber     string    `json:"flight_number"`
	DepartureAirport string    `json:"departure_airport"`
	ArrivalAirport   string    `json:"arrival_airport"`
	DepartureTime    time.Time `json:"departure_time"`
	ArrivalTime      time.Time `json:"arrival_time"`
	Status           string    `json:"status"`
}

// CreateFlightRequest — входные данные для создания рейса.
// Время приходит строкой в формате RFC3339 от фронтенда.
type CreateFlightRequest struct {
	FlightNumber     string `json:"flight_number"`
	DepartureAirport string `json:"departure_airport"`
	ArrivalAirport   string `json:"arrival_airport"`
	DepartureTime    string `json:"departure_time"` // ISO строка, например "2025-12-04T10:00:00Z"
	ArrivalTime      string `json:"arrival_time"`
	Status           string `json:"status"`
}

// UpdateFlightRequest — входные данные для полного обновления рейса (PUT).
type UpdateFlightRequest struct {
	FlightNumber     string `json:"flight_number"`
	DepartureAirport string `json:"departure_airport"`
	ArrivalAirport   string `json:"arrival_airport"`
	DepartureTime    string `json:"departure_time"`
	ArrivalTime      string `json:"arrival_time"`
	Status           string `json:"status"`
}

// UpdateStatusRequest — входные данные для частичного обновления статуса рейса (PATCH).
type UpdateStatusRequest struct {
	Status string `json:"status"`
}
