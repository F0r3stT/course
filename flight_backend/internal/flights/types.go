package flights

import "time"

// допустимые статусы рейса — синхронизированы с CHECK в БД

type Flight struct {
	ID               int64     `json:"id"`
	FlightNumber     string    `json:"flight_number"`
	AirlineCode      *string   `json:"airline_code,omitempty"`
	DepartureAirport string    `json:"departure_airport"`
	ArrivalAirport   string    `json:"arrival_airport"`
	DepartureTime    time.Time `json:"departure_time"`
	ArrivalTime      time.Time `json:"arrival_time"`
	Status           string    `json:"status"`
	AircraftType     *string   `json:"aircraft_type,omitempty"`
	GateSector       *string   `json:"gate_sector,omitempty"`
}

// CreateFlightRequest — JSON, который приходит от фронта при создании.
type CreateFlightRequest struct {
	FlightNumber     string  `json:"flight_number"`
	AirlineCode      *string `json:"airline_code"`
	DepartureAirport string  `json:"departure_airport"`
	ArrivalAirport   string  `json:"arrival_airport"`
	DepartureTime    string  `json:"departure_time"` // ISO-строки, парсим в time.Time
	ArrivalTime      string  `json:"arrival_time"`
	Status           string  `json:"status"`
	AircraftType     *string `json:"aircraft_type"`
	GateSector       *string `json:"gate_sector"`
}

// UpdateFlightRequest — полное обновление рейса (PUT).
type UpdateFlightRequest struct {
	FlightNumber     string  `json:"flight_number"`
	AirlineCode      *string `json:"airline_code"`
	DepartureAirport string  `json:"departure_airport"`
	ArrivalAirport   string  `json:"arrival_airport"`
	DepartureTime    string  `json:"departure_time"`
	ArrivalTime      string  `json:"arrival_time"`
	Status           string  `json:"status"`
	AircraftType     *string `json:"aircraft_type"`
	GateSector       *string `json:"gate_sector"`
}

// UpdateStatusRequest — частичное обновление только статуса.
type UpdateStatusRequest struct {
	Status string `json:"status"`
}
