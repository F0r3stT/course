package weather

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"sort"
	"strings"
	"sync"
	"time"
)

const (
	baseURL        = "https://api.openweathermap.org/data/2.5/weather"
	cacheTTL       = 5 * time.Minute
	requestTimeout = 6 * time.Second
	maxConcurrency = 3
)

var ErrNoAPIKey = errors.New("OPENWEATHER_API_KEY is not set")

var Airports = map[string]Airport{
	"SVO": {Code: "SVO", Name: "Москва (Шереметьево)", City: "Moscow", Country: "RU", Lat: 55.9726, Lon: 37.4146},
	"OVB": {Code: "OVB", Name: "Новосибирск (Толмачёво)", City: "Novosibirsk", Country: "RU", Lat: 55.0126, Lon: 82.6507},
	"ANK": {Code: "ANK", Name: "Анкара (Эсенбога)", City: "Ankara", Country: "TR", Lat: 40.1281, Lon: 32.9951},
	"JFK": {Code: "JFK", Name: "Нью-Йорк (Кеннеди)", City: "New York", Country: "US", Lat: 40.6413, Lon: -73.7781},
	"LHR": {Code: "LHR", Name: "Лондон (Хитроу)", City: "London", Country: "GB", Lat: 51.4700, Lon: -0.4543},
}

var httpClient = &http.Client{Timeout: requestTimeout}

var (
	mu         sync.Mutex
	cond       = sync.NewCond(&mu)
	inFlight   bool
	cache      []WeatherData
	lastUpdate time.Time
)

type owmResponse struct {
	Timezone int `json:"timezone"`

	Main struct {
		Temp      float64 `json:"temp"`
		FeelsLike float64 `json:"feels_like"`
		Humidity  int     `json:"humidity"`
		Pressure  int     `json:"pressure"`
	} `json:"main"`

	Weather []struct {
		Description string `json:"description"`
		Icon        string `json:"icon"`
	} `json:"weather"`

	Wind struct {
		Speed float64  `json:"speed"`
		Deg   *float64 `json:"deg,omitempty"`
	} `json:"wind"`

	Clouds struct {
		All int `json:"all"`
	} `json:"clouds"`

	Visibility *int `json:"visibility,omitempty"`
}

type owmError struct {
	Message string `json:"message"`
}

func getAPIKey() string {
	key := strings.TrimSpace(os.Getenv("OPENWEATHER_API_KEY"))
	if key == "" || key == "YOUR_API_KEY_HERE" {
		return ""
	}
	return key
}

func getWindDirection(deg float64) string {
	directions := []string{"С", "СВ", "В", "ЮВ", "Ю", "ЮЗ", "З", "СЗ"}
	i := int((deg + 22.5) / 45.0)
	return directions[i%8]
}

func getIcon(code string) string {
	if len(code) < 2 {
		return "🌤️"
	}
	m := map[string]string{
		"01": "☀️", "02": "⛅", "03": "☁️", "04": "☁️",
		"09": "🌧️", "10": "🌦️", "11": "⛈️", "13": "❄️", "50": "🌫️",
	}
	if v, ok := m[code[:2]]; ok {
		return v
	}
	return "🌤️"
}

func buildURL(a Airport, apiKey string) (string, error) {
	u, err := url.Parse(baseURL)
	if err != nil {
		return "", err
	}
	q := u.Query()
	q.Set("lat", fmt.Sprintf("%f", a.Lat))
	q.Set("lon", fmt.Sprintf("%f", a.Lon))
	q.Set("appid", apiKey)
	q.Set("lang", "ru")
	q.Set("units", "metric")
	u.RawQuery = q.Encode()
	return u.String(), nil
}

func fetchWeather(ctx context.Context, a Airport) (*WeatherData, error) {
	apiKey := getAPIKey()
	if apiKey == "" {
		return nil, ErrNoAPIKey
	}

	fullURL, err := buildURL(a, apiKey)
	if err != nil {
		return nil, err
	}

	reqCtx, cancel := context.WithTimeout(ctx, requestTimeout)
	defer cancel()

	req, err := http.NewRequestWithContext(reqCtx, http.MethodGet, fullURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/json")

	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var oe owmError
		_ = json.NewDecoder(resp.Body).Decode(&oe)
		if oe.Message != "" {
			return nil, fmt.Errorf("openweather: %d (%s)", resp.StatusCode, oe.Message)
		}
		return nil, fmt.Errorf("openweather: %d", resp.StatusCode)
	}

	var raw owmResponse
	if err := json.NewDecoder(resp.Body).Decode(&raw); err != nil {
		return nil, err
	}
	if len(raw.Weather) == 0 {
		return nil, fmt.Errorf("openweather: empty weather array")
	}

	visKm := 0.0
	if raw.Visibility != nil {
		visKm = float64(*raw.Visibility) / 1000.0
	}

	windDir := ""
	if raw.Wind.Deg != nil {
		windDir = getWindDirection(*raw.Wind.Deg)
	}

	local := time.Now().UTC().Add(time.Duration(raw.Timezone) * time.Second)

	data := &WeatherData{
		AirportCode:   a.Code,
		AirportName:   a.Name,
		City:          a.City,
		Country:       a.Country,
		Temperature:   raw.Main.Temp,
		FeelsLike:     raw.Main.FeelsLike,
		Humidity:      raw.Main.Humidity,
		Pressure:      raw.Main.Pressure,
		WindSpeed:     raw.Wind.Speed,
		WindDirection: windDir,
		Weather:       raw.Weather[0].Description,
		WeatherIcon:   getIcon(raw.Weather[0].Icon),
		Clouds:        raw.Clouds.All,
		VisibilityKm:  visKm,
		TimestampUTC:  time.Now().UTC().Format(time.RFC3339),
		LocalTime:     local.Format("15:04"),
	}

	return data, nil
}

func fallbackWeatherData() []WeatherData {
	now := time.Now().UTC().Format(time.RFC3339)
	return []WeatherData{
		{AirportCode: "SVO", AirportName: "Москва (Шереметьево)", City: "Moscow", Country: "RU", Temperature: -4, FeelsLike: -6, Humidity: 86, WindSpeed: 7, WindDirection: "С", Weather: "Облачно", WeatherIcon: "☁️", TimestampUTC: now},
		{AirportCode: "OVB", AirportName: "Новосибирск (Толмачёво)", City: "Novosibirsk", Country: "RU", Temperature: -13, FeelsLike: -16, Humidity: 66, WindSpeed: 6, WindDirection: "Ю", Weather: "Ясно", WeatherIcon: "☀️", TimestampUTC: now},
		{AirportCode: "ANK", AirportName: "Анкара (Эсенбога)", City: "Ankara", Country: "TR", Temperature: 3, FeelsLike: 2, Humidity: 87, WindSpeed: 1, WindDirection: "С", Weather: "Облачно с прояснениями", WeatherIcon: "⛅", TimestampUTC: now},
		{AirportCode: "JFK", AirportName: "Нью-Йорк (Кеннеди)", City: "New York", Country: "US", Temperature: 1, FeelsLike: -1, Humidity: 41, WindSpeed: 8, WindDirection: "СЗ", Weather: "Небольшая облачность", WeatherIcon: "⛅", TimestampUTC: now},
		{AirportCode: "LHR", AirportName: "Лондон (Хитроу)", City: "London", Country: "GB", Temperature: 7, FeelsLike: 6, Humidity: 91, WindSpeed: 3, WindDirection: "З", Weather: "Ясно", WeatherIcon: "☀️", TimestampUTC: now},
	}
}

// GetWeatherAll возвращает данные + признаки кеша/устаревания.
// refresh=true принудительно пробует обновиться (но при фейле отдаст кеш/фоллбек).
func GetWeatherAll(ctx context.Context, refresh bool) (data []WeatherData, cached bool, stale bool, warnings []string, err error) {
	// 1) Быстрый путь: свежий кеш
	mu.Lock()
	if !refresh && time.Since(lastUpdate) < cacheTTL && len(cache) > 0 {
		out := append([]WeatherData(nil), cache...)
		mu.Unlock()
		return out, true, false, nil, nil
	}

	// 2) Если уже идет обновление — подождать (для refresh не ждём)
	if inFlight && !refresh {
		for inFlight {
			cond.Wait()
		}
		if time.Since(lastUpdate) < cacheTTL && len(cache) > 0 {
			out := append([]WeatherData(nil), cache...)
			mu.Unlock()
			return out, true, false, nil, nil
		}
	}

	// 3) Стартуем обновление
	if !inFlight {
		inFlight = true
	}
	mu.Unlock()

	// 4) Делаем внешний запрос без удержания lock
	fetched, fetchWarnings, fetchErr := fetchAll(ctx)

	// 5) Обновляем кеш
	mu.Lock()
	inFlight = false
	defer func() {
		cond.Broadcast()
		mu.Unlock()
	}()

	if fetchErr == nil && len(fetched) > 0 {
		cache = fetched
		lastUpdate = time.Now()
		return append([]WeatherData(nil), cache...), false, false, fetchWarnings, nil
	}

	// 6) Деградация: кеш (даже устаревший) → fallback
	if len(cache) > 0 {
		return append([]WeatherData(nil), cache...), true, true, append(fetchWarnings, "upstream unavailable; serving cached data"), fetchErr
	}

	fb := fallbackWeatherData()
	return fb, false, true, append(fetchWarnings, "no cache available; serving fallback data"), fetchErr
}

func fetchAll(ctx context.Context) ([]WeatherData, []string, error) {
	sem := make(chan struct{}, maxConcurrency)
	var wg sync.WaitGroup

	var outMu sync.Mutex
	results := make([]WeatherData, 0, len(Airports))
	warnings := make([]string, 0)

	for _, a := range Airports {
		a := a
		wg.Add(1)
		go func() {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()

			d, err := fetchWeather(ctx, a)
			if err != nil {
				outMu.Lock()
				warnings = append(warnings, fmt.Sprintf("%s: %v", a.Code, err))
				outMu.Unlock()
				return
			}

			outMu.Lock()
			results = append(results, *d)
			outMu.Unlock()
		}()
	}

	wg.Wait()

	sort.Slice(results, func(i, j int) bool {
		return results[i].AirportCode < results[j].AirportCode
	})

	if len(results) == 0 {
		return nil, warnings, fmt.Errorf("no weather data fetched")
	}

	return results, warnings, nil
}
