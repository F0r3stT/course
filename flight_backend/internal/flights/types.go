package flights

import "time"

type Flight struct {
	ID                    int64     `json:"id"`
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

type CreateFlightRequest struct {
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

type UpdateFlightRequest struct {
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

type UpdateStatusRequest struct {
	Status string `json:"status"`
}
