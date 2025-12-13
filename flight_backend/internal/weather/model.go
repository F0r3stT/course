package weather

type Airport struct {
	Code    string
	Name    string
	City    string
	Country string
	Lat     float64
	Lon     float64
}

type WeatherData struct {
	AirportCode   string  `json:"airport_code"`
	AirportName   string  `json:"airport_name"`
	City          string  `json:"city"`
	Country       string  `json:"country"`
	Temperature   float64 `json:"temperature"`
	FeelsLike     float64 `json:"feels_like"`
	Humidity      int     `json:"humidity"`
	Pressure      int     `json:"pressure"`
	WindSpeed     float64 `json:"wind_speed"`
	WindDirection string  `json:"wind_direction"`
	Weather       string  `json:"weather"`
	WeatherIcon   string  `json:"weather_icon"`
	VisibilityKm  float64 `json:"visibility"`
	Clouds        int     `json:"clouds"`
	TimestampUTC  string  `json:"timestamp"`
	LocalTime     string  `json:"local_time"`
}

type WeatherResponse struct {
	Timestamp string        `json:"timestamp"`
	Source    string        `json:"source"`
	Cached    bool          `json:"cached"`
	Stale     bool          `json:"stale"`
	Warnings  []string      `json:"warnings,omitempty"`
	Airports  []WeatherData `json:"airports"`
	Count     int           `json:"count"`
}
